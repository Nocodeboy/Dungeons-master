class_name AIBrain
extends RefCounted
## IA de utilidad para monstruos y compañeros en modo automático.
## Evalúa (casilla de destino × acción × objetivo) y ejecuta la mejor opción.
## Las acciones adicionales y los rasgos de clase se deciden con reglas tácticas claras.

var b: Battle
var debug := false

const RANGED_PROFILES := ["archer", "caster", "skirmisher_pc", "healer", "support", "archer_pc"]

func _init(battle: Battle) -> void:
	b = battle

# ================================================================== turno completo

## Juega el turno de `c` dentro del Battle (sin terminarlo; el que llama hace end_turn).
func take_turn(c: Creature) -> void:
	if not c.is_active():
		return
	# Expulsado: solo huye
	if c.has_effect("turned"):
		_flee_from(c, b.get_creature(c.get_effect("turned").data.get("from", "")))
		return
	if not c.can_act():
		return
	# Sugestionado: se aparta del combate
	var sug := c.get_effect("suggested")
	if sug != null:
		_flee_from(c, sug.source)
		if c.turn.action > 0:
			b.do_dodge(c)
		return
	if c.has_condition("prone") and c.speed() > 0 and not c.has_effect("laughing"):
		stand_up(c)
	var guard := 0
	while guard < 10 and c.can_act() and not b.over:
		guard += 1
		if not _step(c):
			break
	# Usa el movimiento sobrante para colocarse mejor
	if c.is_active() and c.turn.movement >= 5 and not b.over:
		_reposition(c)

func stand_up(c: Creature) -> void:
	if not c.has_condition("prone"):
		return
	var cost := int(c.speed() / 2)
	if c.turn.movement >= cost:
		c.turn.movement -= cost
		b._remove_condition(c, "prone")
		b.emit({"t": "stand", "who": c.id})
		b.log_msg(Loc.t("log.stand_up", {"who": b.nm(c)}))

## Un paso de decisión. Devuelve false si no hay nada más útil que hacer.
func _step(c: Creature) -> bool:
	# 1) Acciones adicionales prioritarias antes de moverse
	if _pre_bonus(c):
		return true
	# 2) Acción principal (con posible movimiento previo)
	var has_main = c.turn.action > 0 or c.turn.attack_left > 0
	if has_main:
		var plan := _best_plan(c)
		if not plan.is_empty() and plan.score > 0.05:
			_execute(c, plan)
			return true
	# 3) Acciones adicionales posteriores
	if _post_bonus(c):
		return true
	return false

# ================================================================== evaluación

func _profile(c: Creature) -> String:
	return c.ai_profile

func _ranged_minded(c: Creature) -> bool:
	return _profile(c) in RANGED_PROFILES and c.form.is_empty()

func _risk_weight(c: Creature) -> float:
	if not c.form.is_empty():
		return 0.2
	match _profile(c):
		"archer", "caster", "skirmisher_pc", "healer", "support", "archer_pc":
			return 0.9
		"skirmisher":
			return 0.45
		"skirmisher_melee":
			return 0.3
		"boss", "brute", "pack":
			return 0.15
		"frontline":
			return 0.12
	return 0.4

## Daño que podrían hacerme los enemigos en su próximo turno si estoy en `cell`.
var _enemy_summary: Dictionary = {}   ## id -> Array de {reach, rmin, rmax, avg, bonus, mult}
var _tv_cache: Dictionary = {}

func begin_plan() -> void:
	_enemy_summary.clear()
	_tv_cache.clear()
	_threat_cache.clear()

func _summary(e: Creature) -> Array:
	if _enemy_summary.has(e.id):
		return _enemy_summary[e.id]
	var out: Array = []
	for p in b.attack_profiles(e):
		var avg := 0.0
		for dd in p.damage:
			avg += Dice.average(dd.dice)
		out.append({"melee": p.kind == "melee", "reach": int(p.reach), "rmin": int(p.range[0]), "rmax": int(p.range[1]),
			"avg": avg, "bonus": int(p.bonus), "mult": float(b.attacks_per_action(e))})
	if not e.casting_ability.is_empty() and e.form.is_empty() and out.filter(func(x): return not x.melee).is_empty():
		out.append({"melee": false, "reach": 1, "rmin": 12, "rmax": 24, "avg": 6.0, "bonus": e.spell_attack_bonus(), "mult": 1.0})
	_enemy_summary[e.id] = out
	return out

var _threat_cache: Dictionary = {}

func threat_at(c: Creature, cell: Vector2i) -> float:
	var tkey := cell.x * 1000 + cell.y
	if _threat_cache.has(tkey):
		return _threat_cache[tkey]
	var total := 0.0
	var my_ac := c.ac()
	for e in b.enemies_of(c):
		if not e.is_active() or e.has_condition("incapacitated") or e.has_effect("suggested"):
			continue
		var best := 0.0
		var move_cells := int(e.speed() / 5)
		var d := BattleMap.dist(e.cell, cell)
		for s in _summary(e):
			var ok := false
			if s.melee:
				ok = d <= move_cells + int(s.reach)
			else:
				ok = d <= int(s.rmax)
			if not ok:
				continue
			best = max(best, float(s.avg) * Dice.p_success(int(s.bonus), my_ac, -1 if e.has_condition("blinded") else 0) * float(s.mult))
		total += best
	_threat_cache[tkey] = total
	return total

func attacks_per(e: Creature) -> float:
	return float(b.attacks_per_action(e))

func target_value(c: Creature, t: Creature) -> float:
	## Prioridad de un objetivo: amenaza, fragilidad y concentración.
	var key := t.id + ":" + str(t.hp)
	if _tv_cache.has(key):
		return _tv_cache[key]
	var v := 1.0
	var dmg_out := 0.0
	for s in _summary(t):
		dmg_out = max(dmg_out, float(s.avg))
	if not t.casting_ability.is_empty():
		dmg_out = max(dmg_out, 7.0)
	v += dmg_out / 6.0
	if t.concentration != null:
		v += 0.8
	if t.ai_profile == "healer":
		v += 0.5
	v += (1.0 - t.hp_ratio()) * 0.6
	if t.has_condition("prone") or t.has_condition("paralyzed") or t.has_condition("restrained"):
		v += 0.2
	if t.has_condition("incapacitated") or t.has_effect("suggested"):
		v *= 0.5
	_tv_cache[key] = v
	return v

func _kill_bonus(t: Creature) -> float:
	return 4.0 + target_value(null, t) * 2.0 if t != null else 0.0

# ------------------------------------------------------------------ candidatos de destino

var _opts_cache: Dictionary = {}
var _opts_key: String = ""

func _move_opts(c: Creature) -> Dictionary:
	var key := "%s|%d|%d,%d|%d|%d|%d" % [c.id, c.turn.movement, c.cell.x, c.cell.y, c.turn.action, c.turn.bonus, b.zones.size()]
	for o in b.creatures:
		key += "|%d,%d" % [o.cell.x, o.cell.y] if not o.dead else "|x"
	if key != _opts_key:
		_opts_key = key
		_opts_cache = b.move_options(c)
	return _opts_cache

func _destinations(c: Creature, allow_dash := false) -> Array:
	var opts := _move_opts(c)
	var out: Array = []
	for cell in opts.cost.keys():
		out.append({"cell": cell, "cost": opts.cost[cell], "dash": false})
	if allow_dash:
		for cell in opts.dash_cost.keys():
			out.append({"cell": cell, "cost": opts.dash_cost[cell], "dash": true})
	return out

func _path_for(c: Creature, cell: Vector2i, dash: bool) -> Array:
	var opts := _move_opts(c)
	var prev: Dictionary = opts.dash_prev if dash else opts.prev
	return BattleMap.build_path(prev, c.cell, cell)

func _oa_cost(c: Creature, path: Array) -> float:
	var total := 0.0
	for th in b.path_threats(c, path):
		var e: Creature = th.enemy
		var mp := b.best_melee_profile(e)
		if mp.is_empty():
			continue
		var avg := 0.0
		for dd in mp.damage:
			avg += Dice.average(dd.dice)
		total += avg * Dice.p_success(mp.bonus, c.ac(), 0)
	return total

## Coste de atravesar o acabar en zonas peligrosas (espinas, rayo de luna, grasa, telaraña).
func _zone_cost(c: Creature, path: Array, end_cell: Vector2i) -> float:
	if b.zones.is_empty():
		return 0.0
	var total := 0.0
	for cell in path:
		for z in b.zones_at(cell):
			if z.has("per_cell"):
				total += Dice.average(str(z.per_cell.dice)) * b.damage_multiplier(c, str(z.per_cell.type))
	for z2 in b.zones_at(end_cell):
		if z2.get("end_damage", false):
			total += Dice.average(str(z2.damage.dice)) * 0.75
		if z2.has("end") or z2.has("start") or z2.has("enter"):
			total += 3.5
	return total

# ------------------------------------------------------------------ mejor plan

func _best_plan(c: Creature) -> Dictionary:
	begin_plan()
	var enemies := b.enemies_of(c).filter(func(e): return e.is_active() and b.may_target(c, e))
	if enemies.is_empty():
		return {}
	var dests := _destinations(c)
	var rw := _risk_weight(c)
	var hp_factor := 1.0 + (1.0 - c.hp_ratio()) * 1.5
	var profiles := b.attack_profiles(c)
	var can_attack: bool = c.turn.action > 0 or c.turn.attack_left > 0
	var can_cast: bool = c.turn.action > 0 and c.turn.attack_left <= 0
	var spells: Array = []
	if can_cast and not c.known_spells().is_empty() or c.has_effect("produce_flame") or c.has_effect("flame_blade") or c.has_effect("dragons_breath"):
		spells = b.spells.available(c).filter(func(s): return s.usable and s.cost == "action")
	var prof := _profile(c)
	var cands: Array = []   ## {v (sin riesgo), cell, plan}
	var pos_cache := {}
	var threat_map := {}
	for d in dests:
		threat_map[d.cell] = threat_at(c, d.cell)
	if not threat_map.has(c.cell):
		threat_map[c.cell] = threat_at(c, c.cell)
	# El riesgo inevitable (el de la casilla más segura a su alcance) no debe disuadir de actuar:
	# solo cuenta el riesgo extra de cada opción.
	var min_th := INF
	for k in threat_map.keys():
		min_th = min(min_th, float(threat_map[k]))
	# --- Ataques con arma: cuerpo a cuerpo desde casillas junto al objetivo,
	#     a distancia solo desde la casilla actual y las más seguras
	var safe_cells := {c.cell: true}
	if can_attack:
		# Para disparar: las casillas más seguras desde las que se ve a algún enemigo
		var max_rng := 0
		for p in profiles:
			if p.kind != "melee":
				max_rng = max(max_rng, int(p.range[0]))
		var with_los: Array = []
		if max_rng > 0:
			for d in dests:
				for t in enemies:
					var dd := BattleMap.dist(d.cell, t.cell)
					if dd <= max_rng and b.map.has_los(d.cell, t.cell):
						with_los.append(d)
						break
		with_los.sort_custom(func(x, y): return threat_map[x.cell] < threat_map[y.cell])
		for d in with_los.slice(0, 14):
			safe_cells[d.cell] = true
		for d in dests:
			var cell: Vector2i = d.cell
			for p in profiles:
				var is_melee: bool = p.kind == "melee"
				if not is_melee and not safe_cells.has(cell):
					continue
				for t in enemies:
					if is_melee and BattleMap.dist(cell, t.cell) > int(p.reach):
						continue
					if not b.in_attack_range(c, p, t, cell):
						continue
					var pv := b.preview_attack(c, p, t, cell)
					if not pv.los:
						continue
					var exp: float = pv.expected
					# Ataques extra en la misma acción (multiataque) y monje/ráfaga
					var v := exp * target_value(c, t)
					if exp >= t.hp * 0.9:
						v += _kill_bonus(t) * pv.p_hit
					if prof in ["archer", "skirmisher_pc", "caster", "support", "archer_pc"] and p.kind == "melee" and c.form.is_empty():
						v *= 0.75
					if p.kind == "thrown" and c.ammo_left(p.weapon) <= 1:
						v *= 0.85
					cands.append({"v": v, "cell": cell, "plan": {"kind": "attack", "key": p.key, "target": t.id}})
			if not c.life_drain.is_empty() and not c.turn.get("life_drain_used", false):
				for t in enemies:
					if BattleMap.dist(cell, t.cell) <= 1:
						var ps := 1.0 - Dice.p_success(t.save_bonus("con"), int(c.life_drain.dc), 0, 21, false)
						var v2 := ps * Dice.average(c.life_drain.dice) * target_value(c, t) * 1.15
						cands.append({"v": v2, "cell": cell, "plan": {"kind": "life_drain", "target": t.id}})
		# Arma de aliento (sustituye un ataque)
		if c.resources.get("breath_weapon", 0) > 0 and c.form.is_empty():
			var bp := _breath_plan(c, enemies)
			if not bp.is_empty():
				cands.append({"v": float(bp.value), "cell": c.cell, "plan": bp})
	# --- Conjuros, rasgos de acción y rescates: desde pocos destinos (los más seguros con visión)
	if can_cast:
		var spell_dests: Array = [c.cell]
		var feature_ok = c.resources.get("channel_divinity", 0) > 0 or c.level_feature("lands_aid")
		if spells.size() > 0 or feature_ok:
			var ranked := dests.duplicate()
			ranked.sort_custom(func(x, y): return threat_map[x.cell] < threat_map[y.cell])
			for d in ranked.slice(0, 6):
				if not d.cell in spell_dests:
					spell_dests.append(d.cell)
			# y algún destino cercano a los enemigos para áreas cortas
			var near := dests.duplicate()
			near.sort_custom(func(x, y): return _min_enemy_dist(x.cell, enemies) < _min_enemy_dist(y.cell, enemies))
			for d in near.slice(0, 3):
				if not d.cell in spell_dests:
					spell_dests.append(d.cell)
		for cell in spell_dests:
			for s in spells:
				var sp_plan := _best_spell_use(c, s, cell)
				if not sp_plan.is_empty():
					var pl: Dictionary = sp_plan.duplicate()
					pl.kind = "spell"
					cands.append({"v": float(sp_plan.value), "cell": cell, "plan": pl})
			if c.resources.get("channel_divinity", 0) > 0 and c.cls == "cleric":
				var cd_plan := _channel_divinity(c, cell)
				if not cd_plan.is_empty():
					cands.append({"v": float(cd_plan.value), "cell": cell, "plan": cd_plan})
			if c.level_feature("lands_aid") and c.resources.get("wild_shape", 0) > 0 and c.form.is_empty():
				var la := _lands_aid_plan(c, cell)
				if not la.is_empty():
					cands.append({"v": float(la.value), "cell": cell, "plan": la})
		for d in dests:
			for ally in b.allies_of(c):
				if BattleMap.dist(d.cell, ally.cell) <= 1:
					if ally.is_down() and not ally.stable:
						cands.append({"v": 6.0 + ally.death_failures * 3.0, "cell": d.cell, "plan": {"kind": "stabilize", "target": ally.id}})
					if ally.has_effect("sleep"):
						cands.append({"v": 5.0 + ally.hp / 4.0, "cell": d.cell, "plan": {"kind": "wake", "target": ally.id}})
		# Mover Rayo de luna sobre los enemigos
		for z in b.zones:
			if z.get("owner") == c and z.has("movable"):
				var zp := _zone_move_plan(c, z)
				if not zp.is_empty():
					cands.append({"v": float(zp.value), "cell": c.cell, "plan": zp})
		# Liberarse de un apresamiento
		var esc := b.escape_effect(c)
		if esc != null:
			var adjacent := _adjacent_enemies(c, c.cell) > 0
			var p_ok := Dice.p_success(max(c.skill_bonus("athletics"), c.skill_bonus("acrobatics")), int(esc.data.escape.get("dc", 10)))
			var v_esc := p_ok * (6.0 if not adjacent or _ranged_minded(c) else 2.5)
			cands.append({"v": v_esc, "cell": c.cell, "plan": {"kind": "escape"}})
	# --- Ramificación y poda: el riesgo siempre resta
	for cand in cands:
		if not pos_cache.has(cand.cell):
			pos_cache[cand.cell] = _position_bonus(c, cand.cell)
		cand.ub = cand.v + pos_cache[cand.cell]
	cands.sort_custom(func(x, y): return x.ub > y.ub)
	var best := {}
	var best_score := -INF
	var risk_cache := {}
	for cand in cands:
		if cand.ub <= best_score:
			break
		var cell: Vector2i = cand.cell
		if not risk_cache.has(cell):
			var path: Array = [] if cell == c.cell else _path_for(c, cell, false)
			if cell != c.cell and path.is_empty():
				risk_cache[cell] = [INF, path]
			else:
				var th: float = threat_map[cell] if threat_map.has(cell) else threat_at(c, cell)
				risk_cache[cell] = [max(0.0, th - min_th) * rw * hp_factor + _oa_cost(c, path) * 1.3 + _zone_cost(c, path, cell), path]
		var rc: Array = risk_cache[cell]
		var sc: float = cand.ub - float(rc[0])
		if sc > best_score:
			best_score = sc
			best = cand.plan.duplicate()
			best.merge({"score": sc, "cell": cell, "path": rc[1]}, true)
	# --- Sin ataque útil: acercarse corriendo o esquivar
	if best.is_empty() or best_score < 0.5:
		var alt := _fallback(c, enemies)
		if not alt.is_empty() and (best.is_empty() or alt.score > best_score):
			best = alt
	return best

## Ataque temerario: compensa si la ventaja propia rinde más que la que se regala al enemigo.
func _reckless_worth(c: Creature, p: Dictionary, t: Creature) -> bool:
	var pv := b.preview_attack(c, p, t, c.cell)
	var ph: float = clamp(float(pv.p_hit), 0.05, 0.95)
	var per_hit: float = float(pv.expected) / ph
	var attacks := float(max(1, c.turn.attack_left)) if c.turn.attack_left > 0 else float(b.attacks_per_action(c))
	var gain := (1.0 - pow(1.0 - ph, 2) - ph) * per_hit * attacks
	begin_plan()
	var cost := threat_at(c, c.cell) * 0.4 * (0.5 if c.is_raging() else 1.0)
	var hp_factor := 1.0 + (1.0 - c.hp_ratio()) * 1.5
	return gain > cost * hp_factor

func _min_enemy_dist(cell: Vector2i, enemies: Array) -> int:
	var m := 999
	for e in enemies:
		m = min(m, BattleMap.dist(cell, e.cell))
	return m

func _position_bonus(c: Creature, cell: Vector2i) -> float:
	var bonus := 0.0
	var prof := _profile(c)
	# Táctica de manada / ataque furtivo: estar junto a aliados que flanquean
	if prof == "pack" or c.has_trait("pack_tactics"):
		for e in b.enemies_of(c):
			if BattleMap.dist(cell, e.cell) <= 1:
				for a in b.allies_of(c):
					if BattleMap.dist(a.cell, e.cell) <= 1:
						bonus += 0.6
	# Los tiradores prefieren distancia
	if _ranged_minded(c):
		var md := 999
		for e in b.enemies_of(c):
			if e.is_active():
				md = min(md, BattleMap.dist(cell, e.cell))
		if md <= 1:
			bonus -= 1.2
		elif md >= 3:
			bonus += 0.4
	# El frente protege a los débiles: estar cerca de enemigos que amenazan a lanzadores
	if prof == "frontline":
		for e in b.enemies_of(c):
			if not e.is_active():
				continue
			for a in b.allies_of(c):
				if a.ai_profile in ["caster", "healer", "support"] and BattleMap.dist(a.cell, e.cell) <= 2 and BattleMap.dist(cell, e.cell) <= 1:
					bonus += 0.8
	# El cabecilla trasgo quiere aliados al lado (redirigir ataque)
	if "redirect_attack" in c.reactions:
		for a in b.allies_of(c):
			if BattleMap.dist(a.cell, cell) <= 1:
				bonus += 0.3
				break
	return bonus

func _fallback(c: Creature, enemies: Array) -> Dictionary:
	# Correr hacia el enemigo más cercano (o alejarse si es tirador sin línea)
	if c.turn.action <= 0 or c.turn.attack_left > 0:
		return {}
	var dests := _destinations(c, true)
	var best := {}
	var best_sc := -INF
	var ranged := _ranged_minded(c)
	var rw := _risk_weight(c)
	var target: Creature = null
	var td := 999
	for e in enemies:
		var d := BattleMap.dist(c.cell, e.cell)
		if d < td:
			td = d
			target = e
	if target == null:
		return {}
	for d in dests:
		var cell: Vector2i = d.cell
		var dist_after := _min_enemy_dist(cell, enemies)
		var sc := 0.0
		if ranged:
			# buscar línea de visión a buena distancia
			var los := false
			for e in enemies:
				if b.map.has_los(cell, e.cell) and BattleMap.dist(cell, e.cell) <= 16:
					los = true
					break
			sc = (2.0 if los else 0.0) + clamp(dist_after, 2, 6) * 0.2 - threat_at(c, cell) * rw * 0.5
		else:
			sc = (td - dist_after) * 0.5 - threat_at(c, cell) * rw * 0.3
		sc -= _zone_cost(c, [], cell) * 0.5
		if sc > best_sc:
			best_sc = sc
			best = {"score": max(0.1, sc * 0.2), "cell": cell, "path": _path_for(c, cell, d.dash), "dash": d.dash, "kind": "dash" if d.dash else "move_only"}
	# Esquivar si está acorralado y malherido
	if c.hp_ratio() < 0.35 and threat_at(c, c.cell) > c.hp * 0.6:
		var dodge_sc := 0.6
		if best.is_empty() or dodge_sc > best.score:
			return {"score": dodge_sc, "cell": c.cell, "path": [], "kind": "dodge"}
	if not best.is_empty() and best.kind == "move_only" and best.cell == c.cell:
		return {}
	return best

# ------------------------------------------------------------------ conjuros

func _spell_target_ok(c: Creature, sid: String, t: Creature, from_cell: Vector2i) -> bool:
	return t in b.spells.valid_targets(c, sid, from_cell)

## Coste de oportunidad de gastar espacios y de romper la concentración actual.
func _slot_cost(c: Creature, s: Dictionary, sp: Dictionary, slot: int) -> float:
	var cost := 0.0
	if slot > 0 and not s.free and not s.get("at_will", false):
		cost = 2.5 * slot
		if c.total_slots() <= 1:
			cost += 2.0
	if sp.get("concentration", false) and c.concentration != null:
		cost += _concentration_value(c)
	return cost

func _concentration_value(c: Creature) -> float:
	if c.concentration == null:
		return 0.0
	var v := 4.0
	match c.concentration_spell:
		"hold_person", "hideous_laughter", "suggestion":
			for e in c.concentration.data.get("linked", []):
				if e.owner != null and not e.owner.dead:
					v += 8.0
		"moonbeam", "spike_growth", "entangle", "web", "spiritual_weapon", "flaming_sphere", "bless", "bane", "faerie_fire":
			v += 5.0
		"hunters_mark", "hex":
			v += 2.5
	return v

func _best_spell_use(c: Creature, s: Dictionary, cell: Vector2i) -> Dictionary:
	var sid: String = s.id
	var sp := RulesDB.spell(sid)
	var slot: int = s.slots[0] if s.slots.size() > 0 else 0
	var best := {}
	var best_v := 0.0
	var slot_cost := _slot_cost(c, s, sp, slot)
	var meta := _pick_metamagic(c, sp, slot)
	match sp.target:
		"enemy", "enemy_humanoid", "weapon":
			for t in b.spells.valid_targets(c, sid, cell):
				var data := {"targets": [t.id], "cmd": "grovel"}
				if not meta.is_empty():
					data["meta"] = meta
				var pv := b.spells.preview(c, sid, slot, data, cell)
				var v: float = pv.enemy_dmg * target_value(c, t) + pv.kills * _kill_bonus(t) + pv.control * 2.5 - slot_cost
				if sid == "command" or sid == "hold_person":
					v = pv.control * (2.0 + target_value(c, t)) - slot_cost
				elif sp.get("special", "") == "mark":
					v = 0.0
				if v > best_v:
					best_v = v
					best = {"value": v, "spell": sid, "slot": slot, "data": data}
		"enemies":
			var targets := b.spells.valid_targets(c, sid, cell)
			targets.sort_custom(func(x, y): return target_value(c, x) > target_value(c, y))
			var ids: Array = []
			for t in targets:
				if ids.size() < b.spells.max_targets(sp, slot):
					ids.append(t.id)
			if ids.size() >= 2:
				var pv5 := b.spells.preview(c, sid, slot, {"targets": ids}, cell)
				var v5: float = pv5.control * 1.6 + pv5.enemy_dmg - slot_cost
				if v5 > best_v:
					best_v = v5
					best = {"value": v5, "spell": sid, "slot": slot, "data": {"targets": ids}}
		"darts", "rays":
			var n = b.spells.n_darts(c, sp, slot)
			var targets := b.spells.valid_targets(c, sid, cell)
			if targets.is_empty():
				return {}
			var ids := _distribute(c, sid, targets, n, slot)
			var v2 := 0.0
			for t2 in targets:
				var cnt := ids.count(t2.id)
				if cnt == 0:
					continue
				var single := b.spells.preview(c, sid, slot, {"targets": [t2.id]}, cell)
				v2 += single.enemy_dmg * target_value(c, t2) * (1.2 if sid == "magic_missile" else 1.0) / max(1, single.affected.size())
			var pv2 := b.spells.preview(c, sid, slot, {"targets": ids}, cell)
			if sid == "magic_missile":
				v2 = pv2.enemy_dmg * 1.2
			v2 += pv2.kills * 4.5 - slot_cost
			if v2 > best_v:
				best_v = v2
				best = {"value": v2, "spell": sid, "slot": slot, "data": {"targets": ids}}
		"point":
			best = _best_point_use(c, sid, sp, slot, cell, slot_cost, meta)
		"direction":
			var dirs: Array = []
			for e in b.enemies_of(c):
				if e.is_active() and BattleMap.dist(cell, e.cell) <= 6:
					dirs.append(BattleMap.center(e.cell))
			for n in BattleMap.neighbors(cell):
				dirs.append(BattleMap.center(cell) + (BattleMap.center(n) - BattleMap.center(cell)) * 2.0)
			for dir in dirs:
				var data4 := {"dir": dir}
				if meta == "careful":
					data4["meta"] = meta
				var pv4 := b.spells.preview(c, sid, slot, data4, cell)
				var hits2 := 0
				for a in pv4.affected:
					if a.team != c.team:
						hits2 += 1
				var v4: float = pv4.enemy_dmg * 1.1 + pv4.kills * 4.0 + pv4.control * 2.5 - pv4.ally_dmg * 3.0 - slot_cost
				if hits2 < 2 and slot > 0:
					v4 *= 0.45
				if hits2 == 0:
					v4 = -1.0
				if v4 > best_v:
					best_v = v4
					best = {"value": v4, "spell": sid, "slot": slot, "data": data4}
		"self":
			best = _self_spell(c, sid, sp, slot, cell, slot_cost)
		"cell":
			if sid == "flaming_sphere":
				best = _flaming_sphere_plan(c, sid, sp, slot, cell, slot_cost)
		"ally", "allies", "ally_other", "creature":
			best = _support_spell(c, sid, sp, slot, cell, slot_cost)
		"downed_ally":
			for t3 in b.spells.valid_targets(c, sid, cell):
				var v5b = 3.0 + t3.death_failures * 2.5
				if v5b > best_v:
					best_v = v5b
					best = {"value": v5b, "spell": sid, "slot": 0, "data": {"targets": [t3.id]}}
	if not best.is_empty() and not meta.is_empty() and not best.data.has("meta") and meta != "careful":
		best.data["meta"] = meta
		if meta == "quickened":
			best.value += 1.5
	return best

## Mejor punto para un área centrada en un punto (esferas y cuadrados, zonas incluidas).
func _best_point_use(c: Creature, sid: String, sp: Dictionary, slot: int, cell: Vector2i, slot_cost: float, meta: String) -> Dictionary:
	var best := {}
	var best_v := 0.0
	var tried := {}
	var zone: Dictionary = sp.get("zone", {})
	if zone.get("kind", "") in ["fog", "darkness"]:
		return {}
	for e in b.enemies_of(c):
		if not e.is_active():
			continue
		for pt in BattleMap.candidate_points(e.cell):
			if tried.has(pt):
				continue
			tried[pt] = true
			if not b.spells.point_in_range(c, sid, pt, cell):
				continue
			var data := {"point": pt}
			if meta == "careful":
				data["meta"] = meta
			var pv3 := b.spells.preview(c, sid, slot, data, cell)
			var v3: float = pv3.enemy_dmg * 1.1 + pv3.kills * 4.0 + pv3.control * 3.0 - pv3.ally_dmg * 2.5 - slot_cost
			var hits := 0
			var ally_in := 0
			for a in pv3.affected:
				if a.team != c.team:
					hits += 1
				else:
					ally_in += 1
			# Zonas persistentes: valen más (siguen haciendo daño o estorbando)
			if not zone.is_empty():
				var cells := b.spells.area_cells(c, sid, data, cell, slot)
				var foes_in := 0
				var friends_in := 0
				for o in b.spells.creatures_in(cells, c):
					if o.team != c.team:
						foes_in += 1
					else:
						friends_in += 1
				if zone.has("per_cell"):
					v3 += foes_in * 3.0 - friends_in * 4.0
				if zone.get("end_damage", false):
					v3 += pv3.enemy_dmg * 0.5
				if zone.get("difficult", false):
					v3 += foes_in * 0.6
				hits = max(hits, foes_in)
				ally_in = max(ally_in, friends_in)
			if ally_in > 0 and sp.get("only_enemies", false) == false and pv3.ally_dmg <= 0.0 and sp.has("on_fail_effect"):
				v3 -= ally_in * 3.0
			# El área debe tocar a más de uno para merecer el espacio
			if hits < 2 and slot > 0 and sid != "sleep":
				v3 *= 0.5
			if hits == 0:
				continue
			if v3 > best_v:
				best_v = v3
				best = {"value": v3, "spell": sid, "slot": slot, "data": data}
	return best

func _self_spell(c: Creature, sid: String, sp: Dictionary, slot: int, cell: Vector2i, slot_cost: float) -> Dictionary:
	# Áreas desde uno mismo (Palabra radiante, Brazos de Hadar, Palmada atronadora)
	if sp.has("area"):
		var pv := b.spells.preview(c, sid, slot, {}, cell)
		var hits := 0
		for a in pv.affected:
			if a.team != c.team:
				hits += 1
		if hits == 0:
			return {}
		var v: float = pv.enemy_dmg * 1.1 + pv.kills * 4.0 + pv.control * 2.0 - pv.ally_dmg * 3.0 - slot_cost
		if hits < 2 and slot > 0:
			v *= 0.5
		return {"value": v, "spell": sid, "slot": slot, "data": {}}
	var threat := threat_at(c, cell)
	var v2 := 0.0
	match sid:
		"mirror_image":
			if c.has_effect("mirror_image"):
				return {}
			v2 = threat * 1.4 - slot_cost
		"blur":
			if c.has_effect("blur"):
				return {}
			v2 = threat * 0.9 - slot_cost
		"false_life":
			v2 = (8.0 if threat > 3.0 else 2.0) - slot_cost - c.temp_hp
		"armor_of_agathys":
			if c.has_effect("agathys"):
				return {}
			v2 = (5.0 * slot + (5.0 * slot if _adjacent_enemies(c, cell) > 0 else 0.0)) * 0.6 - slot_cost
		_:
			return {}
	if v2 <= 0.0:
		return {}
	return {"value": v2, "spell": sid, "slot": slot, "data": {}}

func _flaming_sphere_plan(c: Creature, sid: String, sp: Dictionary, slot: int, cell: Vector2i, slot_cost: float) -> Dictionary:
	if b.tokens.has("fs_" + c.id):
		return {}
	var best := {}
	var best_v := 0.0
	var rng := b.spells.spell_cells(sp, c)
	for e in b.enemies_of(c):
		if not e.is_active():
			continue
		for n in BattleMap.neighbors8(e.cell):
			if not b.map.walkable(n) or b.creature_at(n) != null or BattleMap.dist(cell, n) > rng or not b.map.has_los(cell, n):
				continue
			var foes := 0
			var friends := 0
			for o in b.creatures:
				if o.dead or BattleMap.dist(o.cell, n) > 1:
					continue
				if o.team != c.team:
					foes += 1
				elif o != c:
					friends += 1
			var v := foes * 5.5 + 4.0 - friends * 5.0 - slot_cost
			if v > best_v:
				best_v = v
				best = {"value": v, "spell": sid, "slot": slot, "data": {"cell": n}}
	return best

func _distribute(c: Creature, sid: String, targets: Array, n: int, slot: int) -> Array:
	## Reparte dardos/rayos: primero rematar, luego al objetivo más valioso.
	var sp := RulesDB.spell(sid)
	var per := Dice.average(b.spells.damage_expr(c, sp, slot))
	var remaining := {}
	for t in targets:
		remaining[t.id] = float(t.hp)
	var ids: Array = []
	var sorted := targets.duplicate()
	sorted.sort_custom(func(x, y): return target_value(c, x) > target_value(c, y))
	for i in n:
		var pick: Creature = null
		# rematar al que menos necesite
		for t in sorted:
			if remaining[t.id] > 0 and remaining[t.id] <= per * (n - i):
				if pick == null or remaining[t.id] < remaining[pick.id]:
					pick = t
		if pick == null:
			for t in sorted:
				if remaining[t.id] > 0:
					pick = t
					break
		if pick == null:
			pick = sorted[0]
		ids.append(pick.id)
		remaining[pick.id] -= per
	return ids

func _support_spell(c: Creature, sid: String, sp: Dictionary, slot: int, cell: Vector2i, slot_cost: float) -> Dictionary:
	var allies := b.spells.valid_targets(c, sid, cell)
	if allies.is_empty():
		return {}
	var best := {}
	var best_v := 0.0
	if sp.has("heal"):
		for a in allies:
			if a.team != c.team:
				continue
			var missing = a.max_hp - a.hp
			if missing <= 0:
				continue
			var amt: float = min(Dice.average(b.spells.heal_expr(c, sp, slot, sid)), missing)
			var urgency = 1.0 + (1.0 - a.hp_ratio()) * 2.5
			var v = amt * urgency * 0.35
			if a.is_down():
				v += 12.0 + a.death_failures * 3.0
			elif a.hp_ratio() > 0.6:
				v *= 0.3
			v -= slot_cost
			if v > best_v:
				best_v = v
				best = {"value": v, "spell": sid, "slot": slot, "data": {"targets": [a.id]}}
		return best
	var enemies := b.enemies_of(c).filter(func(e): return e.is_active())
	match sid:
		"bless":
			if c.concentration != null:
				return {}
			var picks: Array = []
			var cands := allies.filter(func(a): return a.is_active())
			cands.sort_custom(func(x, y): return _attack_power(x) > _attack_power(y))
			for a in cands:
				if picks.size() < b.spells.max_targets(sp, slot):
					picks.append(a.id)
			var v2 := picks.size() * 2.4 - slot_cost * 0.6
			if enemies.size() >= 3:
				v2 += 1.5
			return {"value": v2, "spell": sid, "slot": slot, "data": {"targets": picks}} if picks.size() >= 2 else {}
		"aid":
			var picks2: Array = []
			for a in allies:
				if picks2.size() < 3:
					picks2.append(a.id)
			var v3 := 0.0
			for id in picks2:
				var a2 := b.get_creature(id)
				v3 += 5.0 * (0.3 if a2.hp_ratio() > 0.6 else 0.8) + (10.0 if a2.is_down() else 0.0)
			return {"value": v3 - slot_cost, "spell": sid, "slot": slot, "data": {"targets": picks2}}
		"heroism":
			if c.concentration != null:
				return {}
			var tank := _best_frontliner(c, allies)
			if tank == null or threat_at(tank, tank.cell) < 4.0:
				return {}
			return {"value": 3.5 - slot_cost * 0.5, "spell": sid, "slot": slot, "data": {"targets": [tank.id]}}
		"protection_from_evil_and_good":
			if c.concentration != null:
				return {}
			var evil := 0
			for e in enemies:
				if e.ctype in Creature.PROT_EVIL_TYPES:
					evil += 1
			if evil == 0:
				return {}
			var tank2 := _best_frontliner(c, allies)
			if tank2 == null:
				return {}
			return {"value": 2.0 + evil * 1.2 - slot_cost, "spell": sid, "slot": slot, "data": {"targets": [tank2.id]}}
		"enlarge_reduce":
			if c.concentration != null:
				return {}
			var tgt: Creature = null
			var bv := 0.0
			for o in b.spells.valid_targets(c, sid, cell):
				var v4 := 0.0
				if o.team == c.team:
					v4 = _attack_power(o) * 0.35 if o.ai_profile in ["frontline", "skirmisher_melee"] else 0.0
				else:
					v4 = _attack_power(o) * 0.3 * (1.0 - Dice.p_success(o.save_bonus("con"), c.spell_save_dc(sid), 0, 21, false))
				if v4 > bv:
					bv = v4
					tgt = o
			if tgt == null:
				return {}
			return {"value": bv * 2.0 - slot_cost, "spell": sid, "slot": slot, "data": {"targets": [tgt.id]}}
	return {}

func _best_frontliner(c: Creature, allies: Array) -> Creature:
	var best: Creature = null
	var bv := -1.0
	for a in allies:
		if not a.is_active() or a.team != c.team:
			continue
		var v := threat_at(a, a.cell) + (3.0 if a.ai_profile == "frontline" else 0.0)
		if v > bv:
			bv = v
			best = a
	return best

func _attack_power(c: Creature) -> float:
	var best := 0.0
	for p in b.attack_profiles(c):
		var avg := 0.0
		for dd in p.damage:
			avg += Dice.average(dd.dice)
		best = max(best, avg)
	return best

func _channel_divinity(c: Creature, cell: Vector2i) -> Dictionary:
	var best := {}
	var best_v := 0.0
	# Expulsar muertos vivientes
	var undead := 0
	for e in b.enemies_of(c):
		if e.ctype == "undead" and e.is_active() and BattleMap.dist(cell, e.cell) <= 6:
			undead += 1
	if undead >= 2:
		var v := undead * 2.2
		if v > best_v:
			best_v = v
			best = {"value": v, "kind": "turn_undead"}
	# Preservar la vida
	if c.level_feature("preserve_life"):
		var need := 0.0
		for a in b.allies_of(c, true):
			if BattleMap.dist(cell, a.cell) <= 6 and a.hp < a.max_hp / 2:
				need += min(a.max_hp / 2 - a.hp, 15) + (8.0 if a.is_down() else 0.0)
		var v2 := need * 0.45
		if v2 > best_v:
			best_v = v2
			best = {"value": v2, "kind": "preserve_life"}
	# Chispa divina
	for t in b.enemies_of(c):
		if t.is_active() and BattleMap.dist(cell, t.cell) <= 6 and b.map.has_los(cell, t.cell):
			var avg := Dice.average("1d8+%d" % c.mod("wis"))
			var pf := 1.0 - Dice.p_success(t.save_bonus("con"), c.spell_save_dc(), 0, 21, false)
			var v3 := (pf * avg + (1.0 - pf) * avg * 0.5) * target_value(c, t) * 0.8 - 1.5
			if v3 > best_v:
				best_v = v3
				best = {"value": v3, "kind": "divine_spark", "target": t.id}
	for a3 in b.allies_of(c, true):
		if BattleMap.dist(cell, a3.cell) <= 6 and a3.is_down():
			var v4 := 11.0
			if v4 > best_v:
				best_v = v4
				best = {"value": v4, "kind": "divine_spark", "target": a3.id}
	return best

func _lands_aid_plan(c: Creature, cell: Vector2i) -> Dictionary:
	var best := {}
	var best_v := 0.0
	var tried := {}
	for e in b.enemies_of(c):
		if not e.is_active():
			continue
		for pt in BattleMap.candidate_points(e.cell):
			if tried.has(pt):
				continue
			tried[pt] = true
			var center := BattleMap.cell_at(pt)
			if BattleMap.dist(cell, center) > 12 or not b.map.has_los(cell, center):
				continue
			var cells := b.cls.lands_aid_cells(c, pt)
			var v := 0.0
			var foes := 0
			for o in b.spells.creatures_in(cells):
				if o.team != c.team and o.is_active():
					var pf := 1.0 - Dice.p_success(o.save_bonus("con"), c.spell_save_dc(), 0, 21, false)
					v += (pf * 7.0 + (1.0 - pf) * 3.5) * target_value(c, o)
					foes += 1
				elif o.team == c.team and o.hp < o.max_hp:
					v += min(7.0, o.max_hp - o.hp) * 0.4 + (8.0 if o.is_down() else 0.0)
			if foes < 2:
				v *= 0.6
			v -= 3.0
			if v > best_v:
				best_v = v
				best = {"value": v, "kind": "feature", "feature": "lands_aid", "data": {"point": pt}}
	return best

func _zone_move_plan(c: Creature, z: Dictionary) -> Dictionary:
	var sp := RulesDB.spell(str(z.spell))
	var old: Vector2 = z.get("point", Vector2.ZERO)
	var oc := BattleMap.cell_at(old)
	# ¿Ya hay enemigos dentro? Entonces no merece la pena moverlo
	for o in b.spells.creatures_in(z.cells):
		if o.team != c.team and o.is_active():
			return {}
	var best := {}
	var best_v := 0.0
	for e in b.enemies_of(c):
		if not e.is_active():
			continue
		var pt := BattleMap.center(e.cell)
		var center: Vector2i = e.cell
		if BattleMap.dist(oc, center) > int(z.movable):
			continue
		var cells := b.map.sphere_cells(pt, int(sp.get("area", {}).get("radius", 5)))
		var foes := 0
		var friends := 0
		for o in b.spells.creatures_in(cells):
			if o.team != c.team:
				foes += 1
			else:
				friends += 1
		var v := foes * 6.0 - friends * 7.0
		if v > best_v:
			best_v = v
			best = {"value": v, "kind": "feature", "feature": "zone_move", "data": {"zone": z.id, "point": pt}}
	return best

func _breath_plan(c: Creature, enemies: Array) -> Dictionary:
	var best := {}
	var best_v := 0.0
	var avg := Dice.average(b.cls.breath_dice(c))
	for e in enemies:
		if BattleMap.dist(c.cell, e.cell) > 6:
			continue
		var dir := BattleMap.center(e.cell)
		for shape in ["cone", "line"]:
			var cells := b.cls.breath_cells(c, shape, dir)
			var v := 0.0
			var foes := 0
			for o in b.spells.creatures_in(cells, c):
				var pf := 1.0 - Dice.p_success(o.save_bonus("dex"), b.cls.breath_dc(c), 0, 21, false)
				var exp := (pf * avg + (1.0 - pf) * avg * 0.5) * b.damage_multiplier(o, c.breath_type)
				if o.team != c.team:
					v += exp * target_value(c, o)
					foes += 1
					if exp >= o.hp:
						v += 3.0
				else:
					v -= exp * 3.0
			if foes < 2:
				v *= 0.6
			if v > best_v:
				best_v = v
				best = {"value": v, "kind": "feature", "feature": "breath_" + shape, "data": {"dir": dir}}
	return best

# ================================================================== metamagia

func _pick_metamagic(c: Creature, sp: Dictionary, slot: int) -> String:
	if c.metamagic.is_empty():
		return ""
	var spn: int = c.resources.get("sorcery_points", 0)
	if spn <= 0 or sp.get("hidden", false):
		return ""
	var lvl := int(sp.get("level", 0))
	# Acelerado: un conjuro con espacio como acción adicional si aún queda la acción para un truco
	if "quickened" in c.metamagic and spn >= 2 and lvl >= 1 and sp.cast == "action" and c.turn.bonus > 0 and slot <= 2:
		return "quickened"
	if "heightened" in c.metamagic and spn >= 2 and lvl >= 1 and sp.has("save") and ("control" in sp.get("tags", [])):
		return "heightened"
	if "careful" in c.metamagic and sp.has("area") and sp.has("save") and lvl >= 1:
		return "careful"
	if "twinned" in c.metamagic and sp.has("upcast_targets") and lvl >= 1:
		return "twinned"
	if "empowered" in c.metamagic and sp.has("damage") and lvl >= 1:
		return "empowered"
	if "seeking" in c.metamagic and sp.has("attack") and lvl >= 1:
		return "seeking"
	return ""

# ================================================================== acciones adicionales

func _pre_bonus(c: Creature) -> bool:
	if c.turn.bonus <= 0:
		return false
	var enemies := b.enemies_of(c).filter(func(e): return e.is_active())
	# Curar a un aliado caído con Palabra de curación
	if "healing_word" in c.known_spells() and c.can_cast("healing_word") and not c.turn.get("slot_spell_cast", false):
		var downed: Creature = null
		for a in b.allies_of(c, true):
			if a.is_down() and BattleMap.dist(c.cell, a.cell) <= 12 and b.map.has_los(c.cell, a.cell):
				downed = a
				break
		if downed == null:
			for a in b.allies_of(c, true):
				if a.is_active() and a.hp_ratio() < 0.25 and BattleMap.dist(c.cell, a.cell) <= 12 and b.map.has_los(c.cell, a.cell):
					downed = a
					break
		if downed != null:
			var slot := c.lowest_slot(1) if c.free_casts.get("healing_word", 0) <= 0 else 1
			if b.spells.cast(c, "healing_word", slot, {"targets": [downed.id]}):
				return true
	# Imposición de manos a un aliado caído al lado
	if c.resources.get("lay_on_hands", 0) > 0:
		for a in b.allies_of(c, true):
			if BattleMap.dist(c.cell, a.cell) <= 1 and (a.is_down() or (a == c and c.hp_ratio() < 0.3)):
				var amt: int = min(c.resources.lay_on_hands, max(5, a.max_hp / 2 - a.hp)) if not a.is_down() else min(c.resources.lay_on_hands, 8)
				if b.cls.use(c, "lay_on_hands", {"target": a.id, "amount": amt}):
					return true
	# Segundo aliento
	if c.resources.get("second_wind", 0) > 0 and c.hp_ratio() < 0.45:
		if b.cls.use(c, "second_wind"):
			return true
	# Poción a un aliado caído adyacente o a uno mismo muy malherido
	if int(c.items.get("potion_healing", 0)) + int(c.items.get("potion_greater_healing", 0)) > 0:
		for a in b.allies_of(c, true):
			if a.is_down() and BattleMap.dist(c.cell, a.cell) <= 1:
				if b.do_potion(c, a):
					return true
		if c.hp_ratio() < 0.3 and c.resources.get("second_wind", 0) <= 0 and c.form.is_empty():
			if b.do_potion(c, c):
				return true
	if enemies.is_empty():
		return false
	var nearest := _min_enemy_dist(c.cell, enemies)
	var reach_soon := int(c.speed() / 5) + 2
	# Furia: cuando el combate está a su alcance
	if c.resources.get("rage", 0) > 0 and not c.is_raging() and nearest <= reach_soon:
		if b.cls.use(c, "rage"):
			return true
	# Forma salvaje: el druida sin espacios útiles se lanza como bestia
	if c.resources.get("wild_shape", 0) > 0 and c.form.is_empty() and nearest <= reach_soon + 2:
		var usable_spells := b.spells.available(c).filter(func(s): return s.usable and s.level >= 1 and s.cost == "action")
		if usable_spells.is_empty() or c.total_slots() == 0 or (c.concentration != null and c.concentration_spell in ["moonbeam", "spike_growth", "entangle", "web"]):
			var form = "wolf" if "wolf" in c.wild_shapes else (c.wild_shapes[0] if not c.wild_shapes.is_empty() else "")
			if nearest > 7 and "elk" in c.wild_shapes:
				form = "elk"
			if not form.is_empty() and b.cls.use(c, "wild_shape", {"choice": form}):
				return true
	# Marca del cazador / Maleficio sobre la presa principal
	for msid in ["hunters_mark", "hex"]:
		if msid in c.known_spells() and c.can_cast(msid) and c.concentration == null and not c.turn.get("slot_spell_cast", false):
			var prey := _best_enemy_near(c, c.cell, 18)
			if prey != null and (c.free_casts.get(msid, 0) > 0 or c.total_slots() >= 1):
				if b.spells.cast(c, msid, c.lowest_slot(1) if c.free_casts.get(msid, 0) <= 0 else 1, {"targets": [prey.id]}):
					return true
	if not b.cls._mark_info(c).is_empty() and b.cls._mark_info(c).get("free", false):
		var prey2 := _best_enemy_near(c, c.cell, 18)
		if prey2 != null and b.cls.use(c, "move_mark", {"target": prey2.id}):
			return true
	# Arma espiritual: invocarla o moverla
	if "spiritual_weapon" in c.known_spells():
		if b.tokens.has("sw_" + c.id):
			if _move_spiritual_weapon(c):
				return true
		elif c.can_cast("spiritual_weapon") and not c.turn.get("slot_spell_cast", false) and c.concentration == null:
			var tgt := _best_enemy_near(c, c.cell, 12)
			if tgt != null:
				var place := _free_adjacent(tgt.cell)
				if place != Vector2i(-99, -99):
					if b.spells.cast(c, "spiritual_weapon", c.lowest_slot(2), {"cell": place, "targets": [tgt.id]}):
						return true
	# Escudo de fe sobre el frente si nos concentramos en nada
	if "shield_of_faith" in c.known_spells() and c.concentration == null and c.can_cast("shield_of_faith") and not c.turn.get("slot_spell_cast", false):
		var tank: Creature = null
		for a in b.allies_of(c, true):
			if a.is_active() and a.ai_profile == "frontline" and BattleMap.dist(c.cell, a.cell) <= 12:
				tank = a
		var heavy_caster := "bless" in c.known_spells() or "hunters_mark" in c.known_spells()
		if tank != null and threat_at(tank, tank.cell) > 4.0 and c.total_slots() >= 2 and not heavy_caster:
			if b.spells.cast(c, "shield_of_faith", c.lowest_slot(1), {"targets": [tank.id]}):
				return true
	# Hechicería innata antes de un conjuro importante
	if c.resources.get("innate_sorcery", 0) > 0 and not c.has_effect("innate_sorcery") and c.turn.action > 0 and (enemies.size() >= 2 or _has_boss(enemies)):
		if nearest <= 24 and b.cls.use(c, "innate_sorcery"):
			return true
	# Fuente de magia: sin espacios, crea uno
	if c.resources.get("sorcery_points", 0) >= 2 and c.total_slots() == 0 and c.turn.action > 0:
		if b.cls.use(c, "create_slot", {"choice": "2" if c.level >= 3 and c.resources.sorcery_points >= 3 else "1"}):
			return true
	# Crear llama: para lanzarla con la acción
	if "produce_flame" in c.known_spells() and not c.has_effect("produce_flame") and c.form.is_empty() and not c.is_raging() and nearest <= 14:
		var better := b.spells.available(c).filter(func(s): return s.usable and s.level >= 1 and s.cost == "action" and s.id != "produce_flame")
		if better.is_empty() or c.total_slots() <= 1:
			if b.spells.cast(c, "produce_flame", 0, {}):
				return true
	# Paso brumoso para escapar si está rodeado y es frágil
	if "misty_step" in c.known_spells() and c.can_cast("misty_step") and not c.turn.get("slot_spell_cast", false) and _ranged_minded(c):
		if _adjacent_enemies(c, c.cell) >= 1 and c.hp_ratio() < 0.6:
			var cell := _safest_cell_within(c, 6)
			if cell != c.cell and b.spells.cast(c, "misty_step", c.lowest_slot(2), {"cell": cell}):
				return true
	# Subidón de adrenalina / Paso del viento para alcanzar al enemigo
	if nearest > int(c.speed() / 5) + c.reach_cells() and nearest <= int(c.speed() * 2 / 5) + 1 and not _ranged_minded(c) and c.turn.action > 0:
		if c.resources.get("adrenaline_rush", 0) > 0 and b.cls.use(c, "adrenaline_rush"):
			return true
		if c.cls == "monk" and c.unarmored_monk() and b.cls.use(c, "step_of_wind_free"):
			return true
	# Pícaro: destrabarse para disparar a gusto
	if c.level_feature("cunning_action") and _profile(c) == "skirmisher_pc":
		if _adjacent_enemies(c, c.cell) > 0 and not c.turn.disengaged and c.turn.action > 0:
			if b.do_disengage(c, true):
				return true
	# Trasgos: escabullirse si están cuerpo a cuerpo y prefieren distancia o van mal
	if "nimble_escape" in c.bonus_actions and _adjacent_enemies(c, c.cell) > 0 and not c.turn.disengaged:
		if _profile(c) == "archer" or (c.hp_ratio() < 0.5 and c.turn.action > 0):
			if b.do_disengage(c, true):
				return true
	# Puntería firme (pícaro nv3): si no se ha movido y tiene objetivo a distancia
	if c.level_feature("steady_aim") and not c.turn.moved and c.turn.action > 0:
		var ranged := b.attack_profiles(c).filter(func(p): return p.kind == "ranged")
		if ranged.size() > 0:
			for e in enemies:
				if b.in_attack_range(c, ranged[0], e) and b.map.has_los(c.cell, e.cell) and _adjacent_enemies(c, c.cell) == 0:
					var mi := b.attack_mode(c, e, "ranged", null, ranged[0])
					if mi.mode <= 0 and not _ally_adjacent_to(c, e):
						if b.cls.use(c, "steady_aim"):
							return true
					break
	return false

func _has_boss(enemies: Array) -> bool:
	for e in enemies:
		if e.ai_profile == "boss" or e.max_hp >= 40:
			return true
	return false

func _safest_cell_within(c: Creature, rng: int) -> Vector2i:
	var best := c.cell
	var best_v := threat_at(c, c.cell) + _adjacent_enemies(c, c.cell) * 3.0
	for y in range(c.cell.y - rng, c.cell.y + rng + 1):
		for x in range(c.cell.x - rng, c.cell.x + rng + 1):
			var cell := Vector2i(x, y)
			if not b.map.walkable(cell) or b.creature_at(cell) != null or not b.map.has_los(c.cell, cell):
				continue
			var v := threat_at(c, cell) + _adjacent_enemies(c, cell) * 3.0
			if v < best_v - 1.0:
				best_v = v
				best = cell
	return best

func _post_bonus(c: Creature) -> bool:
	if c.turn.bonus <= 0 and not c.turn.get("nick_ready", false):
		return false
	# Ataque con la otra mano
	if c.turn.get("offhand_ready", false):
		var main_off := _offhand_profile(c)
		if not main_off.is_empty():
			var t := _best_enemy_adjacent(c)
			if t != null:
				b.do_attack(c, main_off.key, t, {"offhand": true})
				return true
	if c.turn.bonus <= 0:
		return false
	# Monje: ráfaga o golpe adicional
	if c.cls == "monk" and c.unarmored_monk() and c.form.is_empty():
		var t2 := _best_enemy_adjacent(c)
		if t2 != null:
			if c.resources.get("focus", 0) > 0 and (c.resources.focus >= 2 or t2.hp > 4):
				if b.cls.use(c, "flurry", {"target": t2.id}):
					return true
			if b.cls.use(c, "martial_strike", {"target": t2.id}):
				return true
		if c.hp_ratio() < 0.4 and _adjacent_enemies(c, c.cell) > 0 and c.resources.get("focus", 0) > 0:
			if b.cls.use(c, "patient_defense"):
				return true
	# Imposición de manos tras moverse
	if c.resources.get("lay_on_hands", 0) > 0:
		for a in b.allies_of(c, true):
			if BattleMap.dist(c.cell, a.cell) <= 1 and (a.is_down() or a.hp_ratio() < 0.35):
				var amt: int = min(c.resources.lay_on_hands, max(5, int(a.max_hp / 2) - a.hp))
				if b.cls.use(c, "lay_on_hands", {"target": a.id, "amount": amt}):
					return true
	# Mover arma espiritual / esfera llameante
	if b.tokens.has("sw_" + c.id) and _move_spiritual_weapon(c):
		return true
	if b.tokens.has("fs_" + c.id):
		var tfs := _best_enemy_near(c, b.tokens["fs_" + c.id].cell, 7)
		if tfs != null and b.cls.use(c, "sphere_move", {"target": tfs.id}):
			return true
	# Inspiración bárdica al aliado que más pega
	if c.resources.get("bardic_inspiration", 0) > 0:
		var best: Creature = null
		var bv := 0.0
		for a in b.allies_of(c):
			if a.is_active() and not a.has_effect("bardic_inspiration") and BattleMap.dist(c.cell, a.cell) <= 12:
				var v := _attack_power(a) + (2.0 if a.ai_profile == "frontline" else 0.0)
				if v > bv:
					bv = v
					best = a
		if best != null and (c.resources.bardic_inspiration > 1 or b.enemies_of(c).size() >= 2):
			if b.cls.use(c, "bardic_inspiration", {"target": best.id}):
				return true
	# Pícaro se esconde tras atacar
	if c.level_feature("cunning_action") and _profile(c) == "skirmisher_pc" and c.turn.action <= 0:
		if b.can_hide(c):
			if b.do_hide(c, true):
				return true
	# Trasgo que ya atacó: esconderse si puede
	if "nimble_escape" in c.bonus_actions and c.turn.action <= 0 and b.can_hide(c) and b.dice.rng.randf() < 0.5:
		if b.do_hide(c, true):
			return true
	# Curación adicional menor
	if "healing_word" in c.known_spells() and c.can_cast("healing_word") and not c.turn.get("slot_spell_cast", false):
		for a in b.allies_of(c, true):
			if a.is_active() and a.hp_ratio() < 0.35 and BattleMap.dist(c.cell, a.cell) <= 12 and b.map.has_los(c.cell, a.cell):
				var slot := c.lowest_slot(1) if c.free_casts.get("healing_word", 0) <= 0 else 1
				if b.spells.cast(c, "healing_word", slot, {"targets": [a.id]}):
					return true
	return false

func _offhand_profile(c: Creature) -> Dictionary:
	var used: String = c.turn.get("last_weapon", "")
	for p in b.attack_profiles(c):
		if p.kind == "melee" and "light" in p.props and p.weapon.get("id", "") != used:
			return p
	return {}

func _adjacent_enemies(c: Creature, cell: Vector2i) -> int:
	var n := 0
	for e in b.enemies_of(c):
		if e.is_active() and not e.has_condition("incapacitated") and BattleMap.dist(cell, e.cell) <= 1:
			n += 1
	return n

func _ally_adjacent_to(c: Creature, t: Creature) -> bool:
	for a in b.allies_of(c):
		if a.is_active() and BattleMap.dist(a.cell, t.cell) <= 1:
			return true
	return false

func _best_enemy_adjacent(c: Creature) -> Creature:
	var best: Creature = null
	for e in b.enemies_of(c):
		if e.is_active() and BattleMap.dist(c.cell, e.cell) <= 1 and b.may_target(c, e):
			if best == null or e.hp < best.hp:
				best = e
	return best

func _best_enemy_near(c: Creature, cell: Vector2i, rng: int) -> Creature:
	var best: Creature = null
	var best_v := -1.0
	for e in b.enemies_of(c):
		if e.is_active() and BattleMap.dist(cell, e.cell) <= rng and b.map.has_los(cell, e.cell) and b.sees(c, e):
			var v := target_value(c, e) - BattleMap.dist(cell, e.cell) * 0.05
			if v > best_v:
				best_v = v
				best = e
	return best

func _free_adjacent(cell: Vector2i) -> Vector2i:
	for n in BattleMap.neighbors8(cell):
		if b.map.walkable(n) and b.creature_at(n) == null:
			return n
	return Vector2i(-99, -99)

func _move_spiritual_weapon(c: Creature) -> bool:
	var tid := "sw_" + c.id
	var from: Vector2i = b.tokens[tid].cell
	var best: Creature = null
	var best_cell := from
	for e in b.enemies_of(c):
		if not e.is_active():
			continue
		for n in BattleMap.neighbors8(e.cell):
			if BattleMap.dist(from, n) <= 4 and b.map.in_bounds(n):
				if best == null or target_value(c, e) > target_value(c, best):
					best = e
					best_cell = n
				break
	if best == null:
		return false
	return b.spells.spiritual_weapon_turn(c, best_cell, best)

# ================================================================== ejecución

## Castigo que la IA arma antes de atacar (se gasta solo si impacta).
func choose_rider(c: Creature, p: Dictionary, t: Creature) -> Dictionary:
	var opts := b.spells.rider_options(c, p)
	if opts.is_empty():
		return {}
	var important := t.ctype in ["undead", "fiend"] or t.ai_profile == "boss" or t.max_hp >= 30
	var best := {}
	for o in opts:
		var sp := RulesDB.spell(str(o.spell))
		# Áreas solo si hay varios enemigos juntos
		if int(sp.get("rider_area", 0)) > 0:
			var near := 0
			for e in b.enemies_of(c):
				if e.is_active() and BattleMap.dist(e.cell, t.cell) <= 1:
					near += 1
			if near < 2:
				continue
		if sp.get("concentration", false) and c.concentration != null:
			continue
		if o.free:
			return {"spell": o.spell, "slot": o.slot, "crit_only": not important and t.hp > 10}
		if best.is_empty() or int(o.slot) < int(best.slot):
			best = o
	if best.is_empty():
		return {}
	var keep_slots := 1 if "cure_wounds" in c.known_spells() or "bless" in c.known_spells() else 0
	if c.total_slots() <= keep_slots:
		return {"spell": best.spell, "slot": best.slot, "crit_only": true}
	return {"spell": best.spell, "slot": best.slot, "crit_only": not important}

func _execute(c: Creature, plan: Dictionary) -> void:
	if debug:
		print("IA ", c.name, " -> ", plan.get("kind"), " ", plan.get("target", ""), " ", plan.get("spell", plan.get("feature", "")), " sc=", plan.get("score"))
	var path: Array = plan.get("path", [])
	if path.size() > 0 and plan.cell != c.cell:
		b.do_move(c, path, plan.get("dash", false))
		if not c.can_act() or b.over:
			return
	match plan.kind:
		"attack":
			var t := b.get_creature(plan.target)
			if t == null or t.dead:
				return
			var p := b.profile_by_key(c, plan.key)
			if p.is_empty() or not b.in_attack_range(c, p, t):
				return
			c.turn.last_weapon = p.weapon.get("id", "")
			# Rasgos gratuitos al empezar a atacar
			if not c.turn.get("attacked", false):
				if c.level_feature("reckless_attack") and p.get("str_based", false) and _reckless_worth(c, p, t):
					b.cls.use(c, "reckless")
				if c.level_feature("sacred_weapon") and c.resources.get("channel_divinity", 0) > 0 and p.kind == "melee" and not c.has_effect("sacred_weapon"):
					b.cls.use(c, "sacred_weapon")
			var opts := {}
			var rider := choose_rider(c, p, t)
			if not rider.is_empty():
				opts["rider"] = rider
			b.do_attack(c, plan.key, t, opts)
			# Oleada de acción: si queda un enemigo al alcance tras el ataque
			if c.resources.get("action_surge", 0) > 0 and c.turn.action <= 0 and c.turn.attack_left <= 0 and not c.turn.get("action_surge_used", false):
				if _should_surge(c):
					b.cls.use(c, "action_surge")
		"life_drain":
			b.do_life_drain(c, b.get_creature(plan.target))
		"spell":
			b.spells.cast(c, plan.spell, plan.slot, plan.data)
		"turn_undead":
			b.do_turn_undead(c)
		"preserve_life":
			b.do_preserve_life(c)
		"divine_spark":
			b.do_divine_spark(c, b.get_creature(plan.target))
		"feature":
			b.cls.use(c, plan.feature, plan.get("data", {}))
		"escape":
			b.do_escape(c)
		"stabilize":
			b.do_stabilize(c, b.get_creature(plan.target))
		"wake":
			b.do_wake(c, b.get_creature(plan.target))
		"dodge":
			b.do_dodge(c)
		"dash", "move_only":
			pass
	# Si se movió sin poder actuar y aún tiene acción, el siguiente paso lo reevaluará

func _should_surge(c: Creature) -> bool:
	for e in b.enemies_of(c):
		if e.is_active() and BattleMap.dist(c.cell, e.cell) <= 1:
			return true
	return false

# ================================================================== recolocación y huida

func _reposition(c: Creature) -> void:
	var prof := _profile(c)
	if (prof in ["brute", "boss", "pack", "frontline", "skirmisher_melee"] or not c.form.is_empty()) and _adjacent_enemies(c, c.cell) > 0:
		return
	var dests := _destinations(c)
	if dests.size() <= 1:
		return
	var best_cell := c.cell
	var best_sc := _reposition_score(c, c.cell)
	var scored: Array = []
	for d in dests:
		scored.append([_reposition_score(c, d.cell), d.cell])
	scored.sort_custom(func(x, y): return x[0] > y[0])
	for entry in scored:
		if entry[0] <= best_sc + 0.3:
			break
		var path := _path_for(c, entry[1], false)
		var sc: float = entry[0] - _oa_cost(c, path) * 1.5 - _zone_cost(c, path, entry[1])
		if sc > best_sc + 0.3:
			best_sc = sc
			best_cell = entry[1]
	if best_cell != c.cell:
		b.do_move(c, _path_for(c, best_cell, false))

func _reposition_score(c: Creature, cell: Vector2i) -> float:
	var sc := -threat_at(c, cell) * _risk_weight(c) - _zone_cost(c, [], cell)
	var md := 999
	for e in b.enemies_of(c):
		if e.is_active():
			md = min(md, BattleMap.dist(cell, e.cell))
	if not _ranged_minded(c):
		sc -= md * 0.4
	else:
		# tiradores: distancia media y línea de visión
		var los := 0
		for e in b.enemies_of(c):
			if e.is_active() and b.map.has_los(cell, e.cell):
				los += 1
		sc += min(los, 2) * 0.6
		if md <= 1:
			sc -= 2.0
	return sc

func _flee_from(c: Creature, from: Creature) -> void:
	if from == null:
		return
	var dests := _destinations(c)
	var best_cell := c.cell
	var best_d := BattleMap.dist(c.cell, from.cell)
	for d in dests:
		var dd := BattleMap.dist(d.cell, from.cell)
		if dd > best_d:
			best_d = dd
			best_cell = d.cell
	if best_cell != c.cell:
		b.do_move(c, _path_for(c, best_cell, false))
