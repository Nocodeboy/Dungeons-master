class_name ClassActions
extends RefCounted
## Rasgos de clase y especie que se usan como acciones (furia, forma salvaje, ráfaga...).
## list() alimenta la hoja de «Habilidades» de la interfaz; use() los resuelve.

var b: Battle

const COST_TEXT := {"action": "Acción", "bonus": "Adicional", "free": "Gratis", "attack": "Ataque"}

func _init(battle: Battle) -> void:
	b = battle

# ================================================================== consulta

func _has_action(c: Creature) -> bool:
	return c.turn.action > 0 and c.turn.attack_left <= 0

func _has_attack(c: Creature) -> bool:
	return c.turn.action > 0 or c.turn.attack_left > 0

func _entry(c: Creature, id: String, title: String, icon: String, cost: String, desc: String, enabled: bool, target := "none", extra := {}) -> Dictionary:
	var e := {"id": id, "title": title, "icon": icon, "cost": COST_TEXT.get(cost, cost), "cost_key": cost, "desc": desc, "enabled": enabled, "target": target}
	e.merge(extra, true)
	return e

## Rasgos utilizables por la criatura en este momento.
func list(c: Creature) -> Array:
	var out: Array = []
	var bonus_ok: bool = c.turn.bonus > 0
	var res: Dictionary = c.resources
	# --- Guerrero
	if res.has("second_wind"):
		out.append(_entry(c, "second_wind", "Tomar aliento", "second_wind", "bonus",
			"Recuperas 1d10 + %d PG. Usos: %d" % [c.level, res.second_wind], res.second_wind > 0 and bonus_ok))
	if res.has("action_surge"):
		out.append(_entry(c, "action_surge", "Oleada de acción", "action_surge", "free",
			"Ganas una acción adicional este turno. Usos: %d" % res.action_surge, res.action_surge > 0 and not c.turn.get("action_surge_used", false)))
	# --- Pícaro
	if c.level_feature("cunning_action"):
		out.append(_entry(c, "cunning_dash", "Acción astuta: Correr", "dash", "bonus", "Duplicas tu movimiento este turno.", bonus_ok))
		out.append(_entry(c, "cunning_disengage", "Acción astuta: Destrabarse", "disengage", "bonus", "Tu movimiento no provoca ataques de oportunidad.", bonus_ok and not c.turn.disengaged))
		out.append(_entry(c, "cunning_hide", "Acción astuta: Esconderse", "hide", "bonus", "Sigilo CD 15 si nadie te ve con claridad. Atacarás con ventaja.", bonus_ok and b.can_hide(c)))
	if c.level_feature("steady_aim"):
		out.append(_entry(c, "steady_aim", "Puntería firme", "steady_aim", "bonus", "Ventaja en tu siguiente ataque. No puedes haberte movido.", bonus_ok and not c.turn.moved))
	# --- Canalizar divinidad
	if res.has("channel_divinity"):
		var cd_n: int = res.channel_divinity
		if c.cls == "cleric":
			out.append(_entry(c, "divine_spark", "Chispa divina", "divine_spark", "action",
				"1d8 + %d: cura a un aliado o daña a un enemigo (CON mitad). Usos: %d" % [c.mod("wis"), cd_n], cd_n > 0 and _has_action(c), "creature", {"range": 6}))
			out.append(_entry(c, "turn_undead", "Expulsar muertos vivientes", "turn_undead", "action", "Los no muertos a 9 m que fallen SAB huyen aterrados.", cd_n > 0 and _has_action(c)))
			if c.level_feature("preserve_life"):
				out.append(_entry(c, "preserve_life", "Preservar la vida", "preserve_life", "action", "Reparte %d PG entre aliados malheridos a 9 m." % (5 * c.level), cd_n > 0 and _has_action(c)))
		if c.level_feature("sacred_weapon"):
			out.append(_entry(c, "sacred_weapon", "Arma sagrada", "sacred_weapon", "free",
				"+%d al ataque con tu arma y daño radiante durante 10 minutos. Usos: %d" % [max(1, c.mod("cha")), cd_n], cd_n > 0 and _has_attack(c) and not c.has_effect("sacred_weapon")))
	if b.tokens.has("sw_" + c.id):
		out.append(_entry(c, "sw_move", "Mover arma espiritual", "spiritual_weapon", "bonus", "Mueve el arma hasta 6 m y ataca.", bonus_ok, "enemy"))
	# --- Bárbaro
	if res.has("rage"):
		if c.is_raging():
			pass
		else:
			var heavy: bool = c.armor_data().get("cat", "") == "heavy"
			out.append(_entry(c, "rage", "Furia", "rage", "bonus",
				"Resistencia física, +%d al daño de Fuerza y ventaja en Fuerza. Usos: %d" % [c.rage_damage, res.rage], res.rage > 0 and bonus_ok and not heavy))
	if c.level_feature("reckless_attack"):
		out.append(_entry(c, "reckless", "Ataque temerario", "reckless", "free",
			"Ventaja en tus ataques de Fuerza este turno, pero los ataques contra ti también la tienen.", _has_attack(c) and not c.turn.get("attacked", false) and not c.has_effect("reckless")))
	# --- Bardo
	if res.has("bardic_inspiration"):
		out.append(_entry(c, "bardic_inspiration", "Inspiración bárdica", "lyre", "bonus",
			"Un aliado a 18 m gana %s para sumar a una tirada fallida. Usos: %d" % [c.bardic_die, res.bardic_inspiration], res.bardic_inspiration > 0 and bonus_ok, "ally_other", {"range": 12}))
	# --- Druida
	if res.has("wild_shape"):
		if c.form.is_empty():
			var opts: Array = []
			for f in c.wild_shapes:
				var m := RulesDB.monster_data(f)
				var ficon: String = {"wolf": "wild_shape", "mastiff": "paw", "elk": "elk", "riding_horse": "horse"}.get(f, "paw")
				opts.append({"id": f, "title": m.get("name", f), "desc": "CA %d · %s · %s" % [int(m.get("ac", 10)), Loc.ft(int(m.get("speed", 30))), m.get("form_desc", "")], "icon": ficon})
			out.append(_entry(c, "wild_shape", "Forma salvaje", "wild_shape", "bonus",
				"Te conviertes en bestia: conservas tus PG y ganas %d temporales. No puedes lanzar conjuros. Usos: %d" % [c.level, res.wild_shape], res.wild_shape > 0 and bonus_ok and not c.is_raging(), "choice", {"options": opts}))
		else:
			out.append(_entry(c, "wild_shape_end", "Recuperar tu forma", "wild_shape", "bonus", "Vuelves a tu forma normal.", bonus_ok))
		if c.level_feature("lands_aid"):
			out.append(_entry(c, "lands_aid", "Auxilio de la tierra", "nature", "action",
				"Esfera de 3 m a 18 m: enemigos 2d6 necrótico (CON mitad) y un aliado recupera 2d6. Gasta Forma salvaje.", res.wild_shape > 0 and _has_action(c) and c.form.is_empty(), "point", {"range": 12, "radius": 10}))
	# --- Monje
	if c.cls == "monk" and c.unarmored_monk():
		out.append(_entry(c, "martial_strike", "Golpe sin armas adicional", "fist", "bonus", "Artes marciales: un golpe sin armas (%s + DES)." % c.martial_die, bonus_ok, "enemy_adjacent"))
		if res.has("focus"):
			var fp: int = res.focus
			out.append(_entry(c, "flurry", "Ráfaga de golpes", "fist", "bonus", "1 punto de foco: dos golpes sin armas. Foco: %d" % fp, bonus_ok and fp > 0, "enemy_adjacent"))
			out.append(_entry(c, "patient_defense", "Defensa paciente", "dodging", "bonus", "1 punto de foco: Destrabarse y Esquivar. Foco: %d" % fp, bonus_ok and fp > 0))
			out.append(_entry(c, "step_of_wind", "Paso del viento", "wind", "bonus", "1 punto de foco: Correr y Destrabarse. Foco: %d" % fp, bonus_ok and fp > 0))
			out.append(_entry(c, "patient_defense_free", "Destrabarse (monje)", "disengage", "bonus", "Destrabarse como acción adicional, gratis.", bonus_ok and not c.turn.disengaged))
			out.append(_entry(c, "step_of_wind_free", "Correr (monje)", "dash", "bonus", "Correr como acción adicional, gratis.", bonus_ok))
	# --- Paladín
	if res.has("lay_on_hands"):
		out.append(_entry(c, "lay_on_hands", "Imposición de manos", "lay_hands", "bonus",
			"Curas a un aliado adyacente o a ti de tu reserva. Quedan %d PG." % res.lay_on_hands, res.lay_on_hands > 0 and bonus_ok, "ally_touch", {"range": 1}))
	# --- Marcas (Marca del cazador, Maleficio)
	var mk := _mark_info(c)
	if not mk.is_empty() and mk.get("free", false):
		out.append(_entry(c, "move_mark", "Mover %s" % RulesDB.spell(mk.spell).get("name", ""), "mark", "bonus", "Tu presa ha caído: marca a otro enemigo a 27 m.", bonus_ok, "enemy", {"range": 18}))
	# --- Hechicero
	if res.has("innate_sorcery"):
		out.append(_entry(c, "innate_sorcery", "Hechicería innata", "sorcery", "bonus",
			"1 minuto: +1 a la CD y ventaja en ataques de conjuro. Usos: %d" % res.innate_sorcery, res.innate_sorcery > 0 and bonus_ok and not c.has_effect("innate_sorcery")))
	if res.has("sorcery_points"):
		var sp_n: int = res.sorcery_points
		var copts: Array = []
		if c.level >= 2:
			copts.append({"id": "1", "title": "Espacio de nivel 1", "desc": "Cuesta 2 puntos de hechicería.", "enabled": sp_n >= 2, "icon": "magic"})
		if c.level >= 3:
			copts.append({"id": "2", "title": "Espacio de nivel 2", "desc": "Cuesta 3 puntos de hechicería.", "enabled": sp_n >= 3, "icon": "magic"})
		out.append(_entry(c, "create_slot", "Crear espacio de conjuro", "slot", "bonus",
			"Fuente de magia: conviertes puntos de hechicería (%d) en un espacio." % sp_n, bonus_ok and sp_n >= 2, "choice", {"options": copts}))
		var vopts: Array = []
		for i in c.slots.size():
			if int(c.slots[i]) > 0:
				vopts.append({"id": str(i + 1), "title": "Gastar un espacio de nivel %d" % (i + 1), "desc": "Ganas %d punto(s) de hechicería." % (i + 1), "enabled": true, "icon": "magic"})
		out.append(_entry(c, "convert_slot", "Espacio a puntos de hechicería", "slot", "free",
			"Fuente de magia: gastas un espacio y ganas tantos puntos como su nivel.", not vopts.is_empty() and sp_n < c.resources_max.get("sorcery_points", 0) + 2, "choice", {"options": vopts}))
	# --- Especies
	if res.has("breath_weapon"):
		var dt := Loc.dmg_type(c.breath_type)
		var ok = _has_attack(c) and res.breath_weapon > 0 and c.form.is_empty()
		out.append(_entry(c, "breath_cone", "Arma de aliento (cono)", "breath", "attack",
			"Cono de 4,5 m: %s de %s (DES mitad, CD %d). Sustituye un ataque. Usos: %d" % [breath_dice(c), dt, breath_dc(c), res.breath_weapon], ok, "direction", {"shape": "cone"}))
		out.append(_entry(c, "breath_line", "Arma de aliento (línea)", "breath", "attack",
			"Línea de 9 m: %s de %s (DES mitad, CD %d). Sustituye un ataque." % [breath_dice(c), dt, breath_dc(c)], ok, "direction", {"shape": "line"}))
	if c.has_trait("clouds_jaunt") and res.get("giant_ancestry", 0) > 0:
		out.append(_entry(c, "clouds_jaunt", "Salto de las nubes", "teleport", "bonus", "Te teletransportas hasta 9 m. Usos: %d" % res.giant_ancestry, bonus_ok, "cell", {"range": 6}))
	if res.has("adrenaline_rush"):
		out.append(_entry(c, "adrenaline_rush", "Subidón de adrenalina", "dash", "bonus",
			"Corres y ganas %d PG temporales. Usos: %d" % [c.prof_bonus, res.adrenaline_rush], res.adrenaline_rush > 0 and bonus_ok))
	# --- Conjuros con acciones posteriores
	if c.has_effect("exp_retreat"):
		out.append(_entry(c, "exp_dash", "Correr (Retirada expeditiva)", "wind", "bonus", "Correr como acción adicional.", bonus_ok))
	for z in b.zones:
		if z.get("owner") == c and z.has("movable"):
			out.append(_entry(c, "zone_move", "Mover %s" % RulesDB.spell(z.spell).get("name", ""), "moon", "action",
				"Desplaza el área hasta %s." % Loc.ft(int(z.movable) * 5), _has_action(c), "point", {"zone": z.id, "range": int(z.movable)}))
	if b.tokens.has("fs_" + c.id):
		out.append(_entry(c, "sphere_move", "Mover esfera llameante", "fire", "bonus", "La haces rodar hasta 9 m y embiste a un enemigo.", bonus_ok, "enemy"))
	# --- Escapar de un apresamiento
	if b.escape_effect(c) != null:
		var ee := b.escape_effect(c)
		out.append(_entry(c, "escape", "Liberarse", "escape", "action", "Prueba de Atletismo o Acrobacias contra CD %d para librarte de %s." % [int(ee.data.escape.get("dc", 10)), ee.name.to_lower()], _has_action(c)))
	return out

func entry(c: Creature, id: String) -> Dictionary:
	for e in list(c):
		if e.id == id:
			return e
	return {}

func breath_dc(c: Creature) -> int:
	return 8 + c.mod("con") + c.prof_bonus

func breath_dice(c: Creature) -> String:
	if c.level >= 17:
		return "4d10"
	if c.level >= 11:
		return "3d10"
	if c.level >= 5:
		return "2d10"
	return "1d10"

## Celdas del arma de aliento.
func breath_cells(c: Creature, shape: String, dir: Vector2) -> Array:
	if shape == "line":
		return b.map.line_cells(c.cell, dir, 30)
	return b.map.cone_cells(c.cell, dir, 15)

## Información de la marca activa (Marca del cazador / Maleficio) del lanzador.
func _mark_info(c: Creature) -> Dictionary:
	if c.concentration == null or not c.concentration_spell in ["hunters_mark", "hex"]:
		return {}
	var kind := "hunters_mark" if c.concentration_spell == "hunters_mark" else "hexed"
	var holder: Creature = null
	for o in b.creatures:
		for e in o.get_effects(kind):
			if e.source == c:
				holder = o
	var free := holder == null or holder.dead or holder.hp <= 0
	return {"spell": c.concentration_spell, "kind": kind, "holder": holder, "free": free}

## Objetivos válidos de un rasgo con objetivo.
func valid_targets(c: Creature, id: String) -> Array:
	var e := entry(c, id)
	var out: Array = []
	var tt: String = e.get("target", "none")
	var rng: int = int(e.get("range", 1))
	for o in b.creatures:
		if o.dead:
			continue
		var d := BattleMap.dist(c.cell, o.cell)
		match tt:
			"enemy_adjacent":
				if o.team != c.team and o.is_active() and d <= 1 and b.may_target(c, o):
					out.append(o)
			"enemy":
				if o.team == c.team or not o.is_active():
					continue
				if id == "sw_move" or id == "sphere_move":
					var tid := ("sw_" if id == "sw_move" else "fs_") + c.id
					if not b.tokens.has(tid):
						continue
					var from: Vector2i = b.tokens[tid].cell
					var reach := 4 if id == "sw_move" else 6
					if BattleMap.dist(from, o.cell) <= reach + 1:
						out.append(o)
				elif d <= rng and b.sees(c, o) and b.map.has_los(c.cell, o.cell):
					out.append(o)
			"creature":
				if d <= rng and b.map.has_los(c.cell, o.cell) and (o.team == c.team and o.hp < o.max_hp or o.team != c.team and o.is_active() and b.sees(c, o)):
					out.append(o)
			"ally_other":
				if o.team == c.team and o != c and o.is_active() and d <= rng and not o.has_effect("bardic_inspiration"):
					out.append(o)
			"ally_touch":
				if o.team == c.team and d <= 1 and (o.hp < o.max_hp or o.has_condition("poisoned")):
					out.append(o)
	return out

# ================================================================== uso

## Usa un rasgo. data: {target: id, choice: id, point: Vector2, dir: Vector2, cell: Vector2i}
func use(c: Creature, id: String, data: Dictionary = {}) -> bool:
	if not c.can_act() and id != "wild_shape_end":
		return false
	var t: Creature = b.get_creature(str(data.get("target", ""))) if data.has("target") else null
	match id:
		"second_wind":
			if c.resources.get("second_wind", 0) <= 0 or not b._spend(c, "bonus"):
				return false
			c.resources.second_wind -= 1
			_feature_event(c, id)
			b.log_msg(Loc.t("log.second_wind", {"who": b.nm(c)}))
			b.heal(c, b.dice.roll("1d10+%d" % c.level).total, c)
			return true
		"action_surge":
			if c.resources.get("action_surge", 0) <= 0 or c.turn.get("action_surge_used", false):
				return false
			c.resources.action_surge -= 1
			c.turn.action += 1
			c.turn.action_surge_used = true
			c.turn.can_undo = false
			_feature_event(c, id)
			b.log_msg(Loc.t("log.action_surge", {"who": b.nm(c)}))
			return true
		"cunning_dash", "exp_dash", "step_of_wind_free":
			return b.do_dash(c, true)
		"cunning_disengage", "patient_defense_free":
			return b.do_disengage(c, true)
		"cunning_hide":
			return b.do_hide(c, true)
		"steady_aim":
			if not c.level_feature("steady_aim") or c.turn.moved or not b._spend(c, "bonus"):
				return false
			var e := Effect.new("steady_aim")
			e.name = "Puntería firme"
			e.source = c
			e.positive = true
			e.expires = "end_turn"
			e.expires_who = c
			b._attach_effect(c, e)
			c.turn.movement = 0
			b.log_msg(Loc.t("log.steady_aim", {"who": b.nm(c)}))
			return true
		"divine_spark":
			return _divine_spark(c, t)
		"turn_undead":
			return _turn_undead(c)
		"preserve_life":
			return _preserve_life(c)
		"sw_move":
			return _sw_move(c, t)
		"rage":
			return _rage(c)
		"reckless":
			if c.turn.get("attacked", false) or c.has_effect("reckless"):
				return false
			var r := Effect.new("reckless")
			r.name = "Temerario"
			r.source = c
			r.expires = "start_turn"
			r.expires_who = c
			b._attach_effect(c, r)
			_feature_event(c, id)
			b.log_msg(Loc.t("log.reckless", {"who": b.nm(c)}))
			return true
		"bardic_inspiration":
			if t == null or t == c or t.team != c.team or c.resources.get("bardic_inspiration", 0) <= 0:
				return false
			if BattleMap.dist(c.cell, t.cell) > 12 or t.has_effect("bardic_inspiration") or not b._spend(c, "bonus"):
				return false
			c.resources.bardic_inspiration -= 1
			var bi := Effect.new("bardic_inspiration")
			bi.name = "Inspiración (%s)" % c.bardic_die
			bi.source = c
			bi.positive = true
			bi.rounds_left = 100
			bi.data = {"die": c.bardic_die}
			b._attach_effect(t, bi)
			b.emit({"t": "cast", "who": c.id, "spell": "bardic_inspiration", "name": "Inspiración bárdica", "targets": [t.id], "slot": 0})
			b.log_msg(Loc.t("log.bardic", {"who": b.nm(c), "target": b.nm(t)}))
			return true
		"wild_shape":
			return _wild_shape(c, str(data.get("choice", "")))
		"wild_shape_end":
			var ws := c.get_effect("wild_shape")
			if ws == null or not b._spend(c, "bonus"):
				return false
			b._remove_effect(ws)
			return true
		"lands_aid":
			return _lands_aid(c, data.get("point", BattleMap.center(c.cell)), str(data.get("heal_target", "")))
		"martial_strike":
			if t == null or not b._spend(c, "bonus"):
				return false
			b.do_attack(c, "w:unarmed", t, {"free": true, "bonus_strike": true})
			return true
		"flurry":
			if t == null or c.resources.get("focus", 0) <= 0 or not b._spend(c, "bonus"):
				return false
			c.resources.focus -= 1
			_feature_event(c, id)
			b.log_msg(Loc.t("log.flurry", {"who": b.nm(c)}))
			var tech: String = data.get("technique", "auto")
			for i in 2:
				if t == null or t.dead or not t.is_active() or BattleMap.dist(c.cell, t.cell) > 1:
					t = _adjacent_enemy(c)
				if t == null or not c.can_act():
					break
				b.do_attack(c, "w:unarmed", t, {"free": true, "bonus_strike": true, "flurry": true, "technique": tech})
			return true
		"patient_defense":
			if c.resources.get("focus", 0) <= 0 or not b._spend(c, "bonus"):
				return false
			c.resources.focus -= 1
			c.turn.disengaged = true
			b.add_dodge(c)
			_feature_event(c, id)
			b.log_msg(Loc.t("log.patient_defense", {"who": b.nm(c)}))
			return true
		"step_of_wind":
			if c.resources.get("focus", 0) <= 0 or not b._spend(c, "bonus"):
				return false
			c.resources.focus -= 1
			c.turn.disengaged = true
			c.turn.movement += c.speed()
			_feature_event(c, id)
			b.emit({"t": "dash", "who": c.id})
			b.log_msg(Loc.t("log.step_of_wind", {"who": b.nm(c)}))
			return true
		"lay_on_hands":
			return _lay_on_hands(c, t, int(data.get("amount", -1)))
		"sacred_weapon":
			if c.resources.get("channel_divinity", 0) <= 0 or c.has_effect("sacred_weapon"):
				return false
			c.resources.channel_divinity -= 1
			var sw := Effect.new("sacred_weapon")
			sw.name = "Arma sagrada"
			sw.source = c
			sw.positive = true
			sw.rounds_left = 100
			b._attach_effect(c, sw)
			_feature_event(c, id)
			b.log_msg(Loc.t("log.sacred_weapon", {"who": b.nm(c)}))
			return true
		"move_mark":
			return _move_mark(c, t)
		"innate_sorcery":
			if c.resources.get("innate_sorcery", 0) <= 0 or not b._spend(c, "bonus"):
				return false
			c.resources.innate_sorcery -= 1
			var isor := Effect.new("innate_sorcery")
			isor.name = "Hechicería innata"
			isor.source = c
			isor.positive = true
			isor.rounds_left = 10
			b._attach_effect(c, isor)
			_feature_event(c, id)
			b.log_msg(Loc.t("log.innate_sorcery", {"who": b.nm(c)}))
			return true
		"create_slot":
			var lvl := int(data.get("choice", "1"))
			var cost := 2 if lvl == 1 else 3
			if c.resources.get("sorcery_points", 0) < cost or not b._spend(c, "bonus"):
				return false
			c.resources.sorcery_points -= cost
			while c.slots.size() < lvl:
				c.slots.append(0)
			c.slots[lvl - 1] += 1
			_feature_event(c, id)
			b.log_msg(Loc.t("log.create_slot", {"who": b.nm(c), "lvl": lvl}))
			return true
		"convert_slot":
			var lv := int(data.get("choice", "1"))
			if lv < 1 or lv > c.slots.size() or int(c.slots[lv - 1]) <= 0:
				return false
			c.slots[lv - 1] -= 1
			c.resources["sorcery_points"] = c.resources.get("sorcery_points", 0) + lv
			b.log_msg(Loc.t("log.convert_slot", {"who": b.nm(c), "n": lv}))
			return true
		"breath_cone", "breath_line":
			return _breath(c, "line" if id == "breath_line" else "cone", data.get("dir", BattleMap.center(c.cell) + Vector2(0, 1)))
		"clouds_jaunt":
			var cell: Vector2i = data.get("cell", Vector2i(-99, -99))
			if c.resources.get("giant_ancestry", 0) <= 0 or not b.map.walkable(cell) or b.creature_at(cell) != null or BattleMap.dist(c.cell, cell) > 6 or not b.map.has_los(c.cell, cell):
				return false
			if not b._spend(c, "bonus"):
				return false
			c.resources.giant_ancestry -= 1
			_feature_event(c, id)
			b.teleport(c, cell)
			return true
		"adrenaline_rush":
			if c.resources.get("adrenaline_rush", 0) <= 0 or not b._spend(c, "bonus"):
				return false
			c.resources.adrenaline_rush -= 1
			c.turn.movement += c.speed()
			_feature_event(c, id)
			b.emit({"t": "dash", "who": c.id})
			b.log_msg(Loc.t("log.adrenaline_rush", {"who": b.nm(c)}))
			b.gain_temp_hp(c, c.prof_bonus)
			return true
		"zone_move":
			return b.spells.move_zone_action(c, int(data.get("zone", -1)), data.get("point", Vector2.ZERO))
		"sphere_move":
			return b.spells.flaming_sphere_turn(c, t)
		"escape":
			return b.do_escape(c)
	return false

func _feature_event(c: Creature, id: String) -> void:
	b.emit({"t": "feature", "who": c.id, "feature": id})

func _adjacent_enemy(c: Creature) -> Creature:
	var best: Creature = null
	for e in b.enemies_of(c):
		if e.is_active() and BattleMap.dist(c.cell, e.cell) <= 1 and b.may_target(c, e):
			if best == null or e.hp < best.hp:
				best = e
	return best

# ================================================================== rasgos concretos

func _divine_spark(c: Creature, target: Creature) -> bool:
	if c.resources.get("channel_divinity", 0) <= 0 or target == null:
		return false
	if BattleMap.dist(c.cell, target.cell) > 6 or not b.map.has_los(c.cell, target.cell):
		return false
	if not b._spend(c, "action"):
		return false
	c.resources.channel_divinity -= 1
	var amount: int = b.dice.roll("1d8+%d" % c.mod("wis")).total
	b.emit({"t": "cast", "who": c.id, "spell": "divine_spark", "name": "Chispa divina", "targets": [target.id], "slot": 0})
	b.log_msg(Loc.t("log.divine_spark", {"who": b.nm(c)}))
	b._reveal(c)
	if target.team == c.team:
		b.heal(target, amount, c)
	else:
		var r := b.saving_throw(target, "con", c.spell_save_dc(), c)
		var dmg: int = amount if not r.success else int(amount / 2)
		var dtype := "radiant" if b.damage_multiplier(target, "radiant") >= b.damage_multiplier(target, "necrotic") else "necrotic"
		b.apply_damage(target, dmg, dtype, c)
	return true

func _turn_undead(c: Creature) -> bool:
	if c.resources.get("channel_divinity", 0) <= 0:
		return false
	if not b._spend(c, "action"):
		return false
	c.resources.channel_divinity -= 1
	var affected: Array = []
	for e in b.enemies_of(c):
		if e.ctype == "undead" and e.is_active() and BattleMap.dist(c.cell, e.cell) <= 6:
			affected.append(e.id)
	b.emit({"t": "cast", "who": c.id, "spell": "turn_undead", "name": "Expulsar muertos vivientes", "targets": affected, "slot": 0})
	b._reveal(c)
	for id in affected:
		var e: Creature = b.get_creature(id)
		var r := b.saving_throw(e, "wis", c.spell_save_dc(), c, {"vs": "frightened"})
		if not r.success:
			var ef := Effect.new("turned")
			ef.name = "Expulsado"
			ef.source = c
			ef.grants = ["frightened", "incapacitated"]
			ef.rounds_left = 10
			ef.data = {"from": c.id}
			b._attach_effect(e, ef)
			b.log_msg(Loc.t("log.turned", {"who": b.nm(e)}))
	return true

func _preserve_life(c: Creature) -> bool:
	if c.resources.get("channel_divinity", 0) <= 0 or not c.level_feature("preserve_life"):
		return false
	if not b._spend(c, "action"):
		return false
	c.resources.channel_divinity -= 1
	var pool := 5 * c.level
	var cands: Array = []
	for a in b.allies_of(c, true):
		if a.bloodied() and BattleMap.dist(c.cell, a.cell) <= 6 and a.hp < a.max_hp / 2:
			cands.append(a)
	cands.sort_custom(func(x, y): return x.hp_ratio() < y.hp_ratio())
	b.emit({"t": "cast", "who": c.id, "spell": "preserve_life", "name": "Preservar la vida", "targets": cands.map(func(x): return x.id), "slot": 0})
	b.log_msg(Loc.t("log.preserve_life", {"who": b.nm(c)}))
	b._reveal(c)
	var guard := 0
	while pool > 0 and guard < 50:
		guard += 1
		var gave := false
		for a in cands:
			var cap = int(a.max_hp / 2) - a.hp
			if cap <= 0 or pool <= 0:
				continue
			var amt: int = min(cap, max(1, int(ceil(pool / 2.0))))
			b.heal(a, amt, c)
			pool -= amt
			gave = true
		if not gave:
			break
	return true

func _sw_move(c: Creature, target: Creature) -> bool:
	var tid := "sw_" + c.id
	if not b.tokens.has(tid) or target == null:
		return false
	var from: Vector2i = b.tokens[tid].cell
	var best := target.cell
	var best_d := 99
	for n in BattleMap.neighbors8(target.cell):
		var dd := BattleMap.dist(from, n)
		if dd <= 4 and dd < best_d and b.map.in_bounds(n):
			best_d = dd
			best = n
	if best == target.cell:
		return false
	return b.spells.spiritual_weapon_turn(c, best, target)

func _rage(c: Creature) -> bool:
	if c.resources.get("rage", 0) <= 0 or c.is_raging():
		return false
	if c.armor_data().get("cat", "") == "heavy":
		return false
	if not b._spend(c, "bonus"):
		return false
	c.resources.rage -= 1
	if c.concentration != null:
		b.end_concentration(c, true)
	var e := Effect.new("rage")
	e.name = "Furia"
	e.source = c
	e.positive = true
	e.rounds_left = 100
	e.data = {"fresh": true}
	b._attach_effect(c, e)
	_feature_event(c, "rage")
	b.log_msg(Loc.t("log.rage", {"who": b.nm(c)}))
	return true

func _wild_shape(c: Creature, form_id: String) -> bool:
	if c.resources.get("wild_shape", 0) <= 0 or not form_id in c.wild_shapes or not c.form.is_empty():
		return false
	if not b._spend(c, "bonus"):
		return false
	c.resources.wild_shape -= 1
	c.enter_form(form_id)
	var e := Effect.new("wild_shape")
	e.name = "Forma: " + RulesDB.monster_data(form_id).get("name", form_id)
	e.source = c
	e.positive = true
	e.data = {"form": form_id}
	b._attach_effect(c, e)
	c.turn.movement = max(0, c.speed() - (c.turn.undo_movement - c.turn.movement))
	b.emit({"t": "shape", "who": c.id, "form": form_id})
	b.log_msg(Loc.t("log.wild_shape", {"who": b.nm(c), "form": RulesDB.monster_data(form_id).get("name", form_id).to_lower()}))
	b.gain_temp_hp(c, c.level)
	return true

func lands_aid_cells(c: Creature, point: Vector2) -> Array:
	return b.map.sphere_cells(point, 10)

func _lands_aid(c: Creature, point: Vector2, heal_id: String) -> bool:
	if c.resources.get("wild_shape", 0) <= 0:
		return false
	var center := BattleMap.cell_at(point)
	if BattleMap.dist(c.cell, center) > 12 or not b.map.has_los(c.cell, center):
		return false
	if not b._spend(c, "action"):
		return false
	c.resources.wild_shape -= 1
	var cells := lands_aid_cells(c, point)
	b.emit({"t": "cast", "who": c.id, "spell": "lands_aid", "name": "Auxilio de la tierra", "targets": [], "cells": cells, "slot": 0})
	b.log_msg(Loc.t("log.lands_aid", {"who": b.nm(c)}))
	var dmg: int = b.dice.roll("2d6").total
	var in_area := b.spells.creatures_in(cells)
	var heal_t: Creature = b.get_creature(heal_id)
	for t in in_area:
		if t.team != c.team and t.is_active():
			var r := b.saving_throw(t, "con", c.spell_save_dc(), c)
			b.apply_damage(t, dmg if not r.success else int(dmg / 2), "necrotic", c, {"magic": true})
	if heal_t == null or not heal_t in in_area or heal_t.team != c.team:
		heal_t = null
		for t2 in in_area:
			if t2.team == c.team and (heal_t == null or t2.hp_ratio() < heal_t.hp_ratio()):
				heal_t = t2
	if heal_t != null and heal_t.hp < heal_t.max_hp:
		b.heal(heal_t, b.dice.roll("2d6").total, c)
	return true

func _lay_on_hands(c: Creature, t: Creature, amount: int) -> bool:
	if t == null or BattleMap.dist(c.cell, t.cell) > 1 or t.team != c.team:
		return false
	var pool: int = c.resources.get("lay_on_hands", 0)
	if pool <= 0:
		return false
	var missing := t.max_hp - t.hp
	var cure := t.has_condition("poisoned") and pool >= 5 and (missing <= 0 or amount == -2)
	if missing <= 0 and not cure:
		return false
	if not b._spend(c, "bonus"):
		return false
	b.emit({"t": "cast", "who": c.id, "spell": "lay_on_hands", "name": "Imposición de manos", "targets": [t.id], "slot": 0})
	if cure:
		c.resources.lay_on_hands -= 5
		for e in t.effects.duplicate():
			if "poisoned" in e.grants:
				b._remove_effect(e)
		b._remove_condition(t, "poisoned")
		b.log_msg(Loc.t("log.lay_on_hands_cure", {"who": b.nm(c), "target": b.nm(t)}))
		return true
	var amt: int = min(pool, missing) if amount <= 0 else min(pool, amount)
	c.resources.lay_on_hands -= amt
	b.log_msg(Loc.t("log.lay_on_hands", {"who": b.nm(c), "target": b.nm(t)}))
	b.heal(t, amt, c)
	return true

func _move_mark(c: Creature, t: Creature) -> bool:
	var mk := _mark_info(c)
	if mk.is_empty() or not mk.free or t == null or t.team == c.team or not t.is_active():
		return false
	if BattleMap.dist(c.cell, t.cell) > 18 or not b.sees(c, t):
		return false
	if not b._spend(c, "bonus"):
		return false
	var holder: Creature = mk.get("holder")
	if holder != null:
		for e in holder.get_effects(mk.kind):
			if e.source == c:
				b._remove_effect(e)
	var sp := RulesDB.spell(mk.spell)
	var e2 := Effect.new(mk.kind)
	e2.name = sp.get("name", "")
	e2.source = c
	e2.data = {"damage": sp.get("mark_damage", {"dice": "1d6", "type": "force"})}
	b._attach_effect(t, e2)
	b.link_to_concentration(c, e2)
	b.emit({"t": "cast", "who": c.id, "spell": mk.spell, "name": sp.get("name", ""), "targets": [t.id], "slot": 0})
	b.log_msg(Loc.t("log.move_mark", {"who": b.nm(c), "target": b.nm(t)}))
	return true

func _breath(c: Creature, shape: String, dir: Vector2) -> bool:
	if c.resources.get("breath_weapon", 0) <= 0 or not _has_attack(c):
		return false
	# Sustituye un ataque de la acción de Atacar
	if c.turn.attack_left <= 0:
		c.turn.action -= 1
		c.turn.attack_left = b.attacks_per_action(c)
		c.turn.attack_action = true
	c.turn.attack_left -= 1
	c.turn.acted = true
	c.turn.can_undo = false
	c.turn.rage_extended = true
	c.resources.breath_weapon -= 1
	var cells := breath_cells(c, shape, dir)
	b.emit({"t": "cast", "who": c.id, "spell": "breath_weapon", "name": "Arma de aliento", "targets": [], "cells": cells, "slot": 0, "dtype": c.breath_type})
	b.log_msg(Loc.t("log.breath", {"who": b.nm(c)}))
	b._reveal(c)
	var dmg: int = b.dice.roll(breath_dice(c)).total
	for t in b.spells.creatures_in(cells, c):
		if t.dead:
			continue
		var r := b.saving_throw(t, "dex", breath_dc(c), c)
		b.apply_damage(t, dmg if not r.success else int(dmg / 2), c.breath_type, c)
	return true
