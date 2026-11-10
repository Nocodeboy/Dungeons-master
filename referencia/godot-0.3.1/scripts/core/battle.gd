class_name Battle
extends RefCounted
## Estado y resolución de un combate por turnos con reglas 5e (SRD 5.2.1).
## No sabe nada de gráficos: genera una cola de eventos que la vista reproduce.

signal changed

const PHYSICAL := ["bludgeoning", "piercing", "slashing"]

var map: BattleMap
var dice: Dice
var creatures: Array = []          ## Array[Creature]
var order: Array = []              ## orden de iniciativa
var turn_index: int = -1
var round_num: int = 0
var current: Creature = null
var events: Array = []
var log_lines: Array = []
var over: bool = false
var winner: int = -1
var settings: Dictionary = {"pc_reactions": "auto", "sunlight": false}
var tokens: Dictionary = {}        ## invocaciones: id -> {kind, owner, cell}
var zones: Array = []              ## zonas de conjuro persistentes
var spells: SpellResolver
var cls: ClassActions
var encounter: Dictionary = {}
## Sorpresa (exploración): ids con desventaja en la iniciativa y PJ que empiezan ocultos.
var surprised: Dictionary = {}
var start_hidden: Dictionary = {}
var turn_counter: int = 0
var _zone_seq: int = 0

func _init(p_map: BattleMap, p_seed: int = -1) -> void:
	map = p_map
	dice = Dice.new(p_seed)
	spells = SpellResolver.new(self)
	cls = ClassActions.new(self)

# ================================================================== utilidades

func add_creature(c: Creature) -> void:
	creatures.append(c)
	c.reset_turn()

func get_creature(cid: String) -> Creature:
	for c in creatures:
		if c.id == cid:
			return c
	return null

func occupancy() -> Dictionary:
	var occ := {}
	for c in creatures:
		if not c.dead:
			occ[c.cell] = c
	return occ

func creature_at(cell: Vector2i) -> Creature:
	for c in creatures:
		if not c.dead and c.cell == cell:
			return c
	return null

func allies_of(c: Creature, include_self := false) -> Array:
	var out: Array = []
	for o in creatures:
		if o.team == c.team and not o.dead and (include_self or o != c):
			out.append(o)
	return out

func enemies_of(c: Creature) -> Array:
	var out: Array = []
	for o in creatures:
		if o.team != c.team and not o.dead:
			out.append(o)
	return out

func living(team: int) -> Array:
	var out: Array = []
	for o in creatures:
		if o.team == team and not o.dead:
			out.append(o)
	return out

func standing(team: int) -> Array:
	var out: Array = []
	for o in creatures:
		if o.team == team and o.is_active():
			out.append(o)
	return out

func blockers_for(a: Creature, b: Creature) -> Array:
	var out: Array = []
	for o in creatures:
		if o != a and o != b and o.is_active():
			out.append(o.cell)
	return out

func cover(a: Creature, b: Creature, from_cell = null) -> int:
	var fc: Vector2i = a.cell if from_cell == null else from_cell
	return map.cover_between(fc, b.cell, blockers_for(a, b))

func can_see(a: Creature, b: Creature, from_cell = null) -> bool:
	return sees(a, b, from_cell)

func emit(e: Dictionary) -> void:
	events.append(e)

func log_msg(text: String) -> void:
	log_lines.append(text)
	emit({"t": "log", "text": text})

func pop_events() -> Array:
	var e := events
	events = []
	return e

func nm(c: Creature) -> String:
	return c.name if c != null else "?"

func pc_reacts(c: Creature) -> bool:
	## ¿Puede esta criatura usar reacciones automáticas? (ajuste «reacciones» del jugador)
	return not c.is_pc or settings.get("pc_reactions", "auto") != "never"

# ================================================================== visión y oscurecimiento

## ¿Ve `v` a `t`? Ceguera, invisibilidad, niebla y oscuridad mágica.
func sees(v: Creature, t: Creature, vcell = null, tcell = null) -> bool:
	if v == t:
		return true
	if v.has_condition("blinded"):
		return false
	if t.team != v.team and t.is_invisible() and not _tracks(v, t):
		return false
	if zones.is_empty():
		return true
	var vc: Vector2i = v.cell if vcell == null else vcell
	var tc: Vector2i = t.cell if tcell == null else tcell
	return _clear_sight(v, vc, tc)

func _tracks(v: Creature, t: Creature) -> bool:
	for e in t.get_effects("mind_spiked"):
		if e.source == v:
			return true
	return false

## Grado de oscurecimiento de una casilla: 0 nada, 1 ligero, 2 denso (niebla), 3 oscuridad mágica.
func obscure_at(cell: Vector2i) -> int:
	var o := 0
	for z in zones:
		if z.get("obscure", 0) > o and z.set.has(cell):
			o = int(z.obscure)
	return o

func _clear_sight(v: Creature, vc: Vector2i, tc: Vector2i) -> bool:
	var has_heavy := false
	for z in zones:
		if int(z.get("obscure", 0)) >= 2:
			has_heavy = true
			break
	if not has_heavy:
		return true
	for cell in BattleMap.cells_on_segment(BattleMap.center(vc), BattleMap.center(tc), 0.3):
		var o := obscure_at(cell)
		if o == 2:
			return false
		if o == 3 and not (v.has_trait("devils_sight") and BattleMap.dist(vc, tc) <= 24):
			return false
	return true

# ================================================================== flujo del combate

func start() -> void:
	round_num = 0
	order.clear()
	for c in creatures:
		c.reset_turn()
		var mode := 0
		if c.has_trait("remarkable_athlete"):
			mode = 1
		if surprised.has(c.id):
			mode = -1 if mode == 0 else 0
		var r := dice.d20(mode, c.has_trait("luck"))
		c.initiative = r.natural + c.initiative_bonus()
		order.append(c)
		emit({"t": "initiative", "who": c.id, "roll": c.initiative})
	order.sort_custom(func(a, b):
		if a.initiative != b.initiative:
			return a.initiative > b.initiative
		if a.mod("dex") != b.mod("dex"):
			return a.mod("dex") > b.mod("dex")
		return a.team < b.team)
	# Metabolismo asombroso: el monje recupera foco al tirar iniciativa
	for c in creatures:
		if c.resources.get("uncanny_metabolism", 0) > 0 and (c.resources.get("focus", 0) < c.resources_max.get("focus", 0) or c.hp < c.max_hp):
			c.resources.uncanny_metabolism -= 1
			c.resources["focus"] = c.resources_max.get("focus", 0)
			emit({"t": "feature", "who": c.id, "feature": "uncanny_metabolism"})
			log_msg(Loc.t("log.uncanny_metabolism", {"who": nm(c)}))
			heal(c, dice.roll(c.martial_die).total + c.level, c, true)
	# Los que se acercaron sin ser vistos empiezan ocultos (ventaja en su primer ataque)
	for cid in start_hidden.keys():
		var hc := get_creature(cid)
		if hc != null and not hc.dead:
			hc.hidden_stealth = int(start_hidden[cid])
			var he := Effect.new("hidden")
			he.name = Loc.cond("invisible")
			he.source = hc
			he.positive = true
			he.grants = ["invisible"]
			_attach_effect(hc, he)
	turn_index = -1
	_next_turn()

func _next_turn() -> void:
	if _check_end() or order.is_empty():
		return
	var guard := 0
	while guard < 200:
		guard += 1
		turn_index += 1
		if turn_index >= order.size():
			turn_index = 0
		if turn_index == 0:
			round_num += 1
			emit({"t": "round", "n": round_num})
			log_msg(Loc.t("log.round", {"n": round_num}))
		var c: Creature = order[turn_index]
		if c.dead:
			continue
		current = c
		_begin_turn(c)
		if over:
			return
		if c.dead:
			continue
		# Si no puede actuar en absoluto, el turno pasa solo
		if not c.is_active() or (c.has_condition("incapacitated") and not _can_still_move(c)) or c.has_effect("command_skip"):
			_finish_turn(c)
			if over:
				return
			continue
		return

func _can_still_move(c: Creature) -> bool:
	# Expulsar muertos vivientes: incapacitado pero huye (se mueve)
	return c.has_effect("turned") and c.speed() > 0

func _begin_turn(c: Creature) -> void:
	c.reset_turn()
	turn_counter += 1
	emit({"t": "turn", "who": c.id, "round": round_num})
	# Caducan efectos de inicio de turno de esta criatura
	_expire_effects("start_turn", c)
	_tick_rounds(c)
	_tick_zones(c)
	_start_turn_effects(c)
	if c.dead or over:
		return
	_zone_turn_trigger(c, "start")
	# Reconsidera velocidad tras expirar efectos
	c.turn.movement = c.speed()
	c.turn.undo_movement = c.turn.movement
	# Orden imperiosa: arrodillarse o quedarse quieto
	var cmd := c.get_effect("command")
	if cmd != null:
		var which: String = cmd.data.get("cmd", "grovel")
		_remove_effect(cmd, false)
		if which == "grovel":
			_add_condition(c, "prone", "command")
			log_msg(Loc.t("log.command_grovel", {"who": nm(c)}))
		else:
			log_msg(Loc.t("log.command_halt", {"who": nm(c)}))
		var skip := Effect.new("command_skip")
		skip.expires = "end_turn"
		skip.expires_who = c
		_attach_effect(c, skip)
	# La furia acaba si queda incapacitado
	if c.is_raging() and c.has_condition("incapacitated"):
		_end_rage(c)
	# Tiradas de muerte
	if c.is_pc and c.is_down() and not c.stable:
		_death_save(c)
	changed.emit()

## Daño continuo y efectos que se resuelven al empezar el turno de su portador.
func _start_turn_effects(c: Creature) -> void:
	for e in c.effects.duplicate():
		if not e in c.effects or c.dead:
			continue
		var dot: Dictionary = e.data.get("dot", {})
		if not dot.is_empty() and dot.get("when", "") == "start_turn":
			if e.kind == "ensnared" and not c.has_condition("restrained"):
				continue
			var amount = dice.roll(str(dot.dice)).total
			log_msg(Loc.t("log.dot", {"who": nm(c), "effect": e.name}))
			apply_damage(c, amount, str(dot.type), e.source, {"magic": true, "dot": true})
			if c.dead or not e in c.effects:
				continue
			if dot.has("then_save"):
				var r := saving_throw(c, str(dot.then_save), int(dot.get("dc", 10)), e.source)
				if r.success:
					_remove_effect(e)
		if e.kind == "heroism" and e in c.effects:
			var amt: int = max(0, int(e.data.get("temp", 0)))
			if amt > c.temp_hp:
				c.temp_hp = amt
				emit({"t": "temp_hp", "who": c.id, "amount": amt})

func end_turn() -> void:
	if over or current == null:
		return
	var c := current
	_finish_turn(c)
	if not over:
		_next_turn()
	changed.emit()

func _finish_turn(c: Creature) -> void:
	# Salvaciones de final de turno
	for e in c.effects.duplicate():
		if not e in c.effects or c.dead:
			continue
		match e.kind:
			"hold_person":
				var r := saving_throw(c, "wis", int(e.data.dc), e.source)
				if r.success:
					_remove_effect(e)
					log_msg(Loc.t("log.hold_end", {"who": nm(c)}))
				continue
			"sleep":
				if e.data.get("stage", 1) == 1:
					var r2 := saving_throw(c, "wis", int(e.data.dc), e.source)
					if r2.success:
						_remove_effect(e)
						log_msg(Loc.t("log.sleep_resist", {"who": nm(c)}))
					else:
						e.data.stage = 2
						e.grants = ["unconscious"]
						log_msg(Loc.t("log.sleep_stage2", {"who": nm(c)}))
						emit({"t": "condition", "who": c.id, "cond": "unconscious", "on": true})
				continue
		var dot: Dictionary = e.data.get("dot", {})
		if not dot.is_empty() and dot.get("when", "") == "end_turn":
			log_msg(Loc.t("log.dot", {"who": nm(c), "effect": e.name}))
			apply_damage(c, dice.roll(str(dot.dice)).total, str(dot.type), e.source, {"magic": true, "dot": true})
			if c.dead:
				break
		var se: Dictionary = e.data.get("save_end", {})
		if not se.is_empty() and se.get("when", "end_turn") == "end_turn" and e in c.effects:
			var r3 := saving_throw(c, str(se.ability), int(se.get("dc", 10)), e.source)
			if r3.success:
				_remove_effect(e)
				log_msg(Loc.t("log.effect_end", {"effect": e.name, "who": nm(c)}))
	if not c.dead:
		_zone_turn_trigger(c, "end")
		_flaming_sphere_end_turn(c)
	# Mantener la furia
	var rage := c.get_effect("rage")
	if rage != null:
		if rage.data.get("fresh", false):
			rage.data.fresh = false
		elif not c.turn.get("rage_extended", false):
			_end_rage(c)
	_expire_effects("end_turn", c)
	_expire_end_turn_next(c)
	emit({"t": "turn_end", "who": c.id})
	_check_end()

func _check_end() -> bool:
	if over:
		return true
	var pcs_up := standing(0).size()
	var foes_alive := 0
	for c in creatures:
		if c.team == 1 and not c.dead:
			foes_alive += 1
	if foes_alive == 0:
		over = true
		winner = 0
		log_msg(Loc.t("log.victory"))
		emit({"t": "end", "winner": 0})
		return true
	if pcs_up == 0:
		over = true
		winner = 1
		log_msg(Loc.t("log.defeat"))
		emit({"t": "end", "winner": 1})
		return true
	return false

# ================================================================== efectos

func _attach_effect(target: Creature, e: Effect) -> Effect:
	e.owner = target
	target.effects.append(e)
	for g in e.grants:
		emit({"t": "condition", "who": target.id, "cond": g, "on": true})
	if not e.name.is_empty():
		emit({"t": "effect", "who": target.id, "kind": e.kind, "name": e.name, "on": true, "positive": e.positive})
	return e

func _remove_effect(e: Effect, announce := true) -> void:
	var o := e.owner
	if o == null or not e in o.effects:
		return
	o.effects.erase(e)
	for g in e.grants:
		if not o.has_condition(g):
			emit({"t": "condition", "who": o.id, "cond": g, "on": false})
	if not e.name.is_empty():
		emit({"t": "effect", "who": o.id, "kind": e.kind, "name": e.name, "on": false})
	# Fin de efectos concretos
	match e.kind:
		"aid":
			var amt: int = e.data.get("amount", 5)
			o.max_hp = max(1, o.max_hp - amt)
			o.hp = min(o.hp, o.max_hp)
		"spiritual_weapon_ctrl", "flaming_sphere_ctrl":
			var tid: String = e.data.get("token", "")
			if tokens.has(tid):
				tokens.erase(tid)
				emit({"t": "unsummon", "id": tid})
		"zone_link":
			remove_zone(int(e.data.get("zone", -1)))
		"wild_shape":
			_revert_form(o)
		"enlarged", "reduced":
			emit({"t": "resize", "who": o.id})
		"agathys":
			pass
	# Si era el registro de concentración, deshace los efectos enlazados
	if e.kind == "concentration":
		for linked in e.data.get("linked", []):
			_remove_effect(linked)
		if o.concentration == e:
			o.concentration = null
			o.concentration_spell = ""

func _expire_effects(when: String, who: Creature) -> void:
	for c in creatures:
		for e in c.effects.duplicate():
			if e.expires == when and e.expires_who == who and e in c.effects:
				_remove_effect(e)

func _tick_rounds(who: Creature) -> void:
	## Las duraciones en rondas cuentan al inicio del turno de quien creó el efecto.
	for c in creatures:
		for e in c.effects.duplicate():
			if e.rounds_left > 0 and e.source == who and e in c.effects:
				e.rounds_left -= 1
				if e.rounds_left <= 0:
					if e.kind == "concentration":
						end_concentration(who)
					else:
						_remove_effect(e)

func _add_condition(c: Creature, cond: String, source: String) -> void:
	var had := c.has_condition(cond)
	if c.add_condition(cond, source) and not had:
		emit({"t": "condition", "who": c.id, "cond": cond, "on": true})
		log_msg(Loc.t("log.condition_on", {"who": nm(c), "cond": Loc.cond(cond).to_lower()}))

func _remove_condition(c: Creature, cond: String, source := "") -> void:
	var had := c.has_condition(cond)
	c.remove_condition(cond, source)
	if had and not c.has_condition(cond):
		emit({"t": "condition", "who": c.id, "cond": cond, "on": false})

func start_concentration(caster: Creature, spell_id: String, rounds: int) -> Effect:
	end_concentration(caster)
	var ce := Effect.new("concentration")
	ce.source = caster
	ce.rounds_left = rounds
	ce.data = {"linked": [], "spell": spell_id}
	ce.name = ""
	_attach_effect(caster, ce)
	caster.concentration = ce
	caster.concentration_spell = spell_id
	emit({"t": "concentration", "who": caster.id, "spell": spell_id, "on": true})
	return ce

func link_to_concentration(caster: Creature, e: Effect) -> void:
	if caster.concentration != null:
		caster.concentration.data.linked.append(e)
		e.concentration = true

func end_concentration(caster: Creature, announce := false) -> void:
	if caster.concentration == null:
		return
	var sp := caster.concentration_spell
	var ce := caster.concentration
	caster.concentration = null
	caster.concentration_spell = ""
	if announce:
		log_msg(Loc.t("log.conc_lost", {"who": nm(caster), "spell": RulesDB.spell(sp).get("name", sp)}))
	emit({"t": "concentration", "who": caster.id, "spell": sp, "on": false})
	_remove_effect(ce)

## Aplica un efecto descrito en datos (conjuros, castigos, rasgos).
## spec: {kind, name, grants, positive, expires "cuando:quién", rounds, save_end, dot, escape, data}
func apply_effect_spec(target: Creature, spec: Dictionary, caster: Creature, sid := "", slot := 0, dc := -1, link := true) -> Effect:
	if target == null or target.dead:
		return null
	var grants: Array = spec.get("grants", [])
	for g in grants:
		if g in target.condition_immune:
			emit({"t": "immune", "who": target.id, "what": g})
			return null
		if g == "frightened" and target.has_effect("heroism"):
			emit({"t": "immune", "who": target.id, "what": g})
			return null
		if g in ["charmed", "frightened"] and target.has_effect("prot_evil") and caster != null and caster.ctype in Creature.PROT_EVIL_TYPES:
			emit({"t": "immune", "who": target.id, "what": g})
			return null
	var sp := RulesDB.spell(sid)
	var e := Effect.new(str(spec.get("kind", "effect")))
	e.name = str(spec.get("name", sp.get("name", "")))
	e.source = caster
	e.positive = bool(spec.get("positive", false))
	e.grants = grants.duplicate()
	e.spell_id = sid
	e.data = spec.get("data", {}).duplicate(true)
	var base_lvl := int(sp.get("level", 1))
	if spec.has("save_end"):
		var se: Dictionary = spec.save_end.duplicate()
		se["dc"] = dc
		e.data["save_end"] = se
	if spec.has("dot"):
		var dot: Dictionary = spec.dot.duplicate()
		var expr: String = dot.dice
		if dot.has("upcast") and slot > base_lvl:
			expr = Dice.add_dice(expr, Dice.parse(str(dot.upcast)).count * (slot - base_lvl))
		dot["dice"] = expr
		dot["dc"] = dc
		e.data["dot"] = dot
	if spec.has("escape"):
		e.data["escape"] = {"skill": spec.escape, "dc": dc}
	if spec.get("ends_on_damage_from_team", false) and caster != null:
		e.data["ends_on_team"] = caster.team
	var ex: String = spec.get("expires", "")
	if not ex.is_empty():
		var parts := ex.split(":")
		var who: Creature = caster if parts.size() < 2 or parts[1] == "caster" else target
		e.expires = parts[0]
		e.expires_who = who
		if e.expires == "end_turn_next":
			e.data["skip_first_end"] = (current == who)
	if spec.has("rounds"):
		e.rounds_left = int(spec.rounds)
	_attach_effect(target, e)
	if link and caster != null and sp.get("concentration", false) and caster.concentration != null and caster.concentration_spell == sid:
		link_to_concentration(caster, e)
	return e

# ================================================================== zonas

func add_zone(z: Dictionary) -> int:
	_zone_seq += 1
	z["id"] = _zone_seq
	var st := {}
	for cell in z.cells:
		st[cell] = true
	z["set"] = st
	z["hits"] = {}
	zones.append(z)
	_refresh_zone_overlay()
	emit({"t": "zone", "id": z.id, "kind": z.get("kind", ""), "cells": z.cells.duplicate(), "color": z.get("color", "#ffffff"), "on": true})
	return z.id

func remove_zone(zid: int) -> void:
	for z in zones.duplicate():
		if int(z.id) == zid:
			zones.erase(z)
			emit({"t": "zone", "id": zid, "on": false})
	_refresh_zone_overlay()

func get_zone(zid: int) -> Dictionary:
	for z in zones:
		if int(z.id) == zid:
			return z
	return {}

func move_zone(zid: int, cells: Array) -> void:
	var z := get_zone(zid)
	if z.is_empty():
		return
	z.cells = cells
	var st := {}
	for cell in cells:
		st[cell] = true
	z.set = st
	_refresh_zone_overlay()
	emit({"t": "zone", "id": zid, "kind": z.get("kind", ""), "cells": cells.duplicate(), "color": z.get("color", "#ffffff"), "on": true, "moved": true})

func zones_at(cell: Vector2i) -> Array:
	var out: Array = []
	for z in zones:
		if z.set.has(cell):
			out.append(z)
	return out

func _refresh_zone_overlay() -> void:
	var diff: Array = []
	var hazard: Array = []
	for z in zones:
		if z.get("difficult", false):
			diff.append_array(z.cells)
		if z.has("per_cell") or z.get("enter_damage", false) or z.has("enter"):
			hazard.append_array(z.cells)
	map.set_overlay(diff, hazard)

func _tick_zones(who: Creature) -> void:
	for z in zones.duplicate():
		if z.get("owner") == who and int(z.get("rounds_left", -1)) > 0:
			z.rounds_left = int(z.rounds_left) - 1
			if int(z.rounds_left) <= 0:
				remove_zone(int(z.id))

## Disparadores de zona al empezar o acabar el turno dentro.
func _zone_turn_trigger(c: Creature, when: String) -> void:
	for z in zones_at(c.cell):
		if c.dead or not c.is_active():
			return
		if z.has(when):
			_zone_save(c, z, z[when])
		if when == "end" and z.get("end_damage", false):
			_zone_damage_save(c, z)

## Al entrar en una casilla (movimiento propio o forzado).
func _zone_enter(c: Creature, cell: Vector2i, prev: Vector2i) -> void:
	for z in zones_at(cell):
		if c.dead:
			return
		var per: Dictionary = z.get("per_cell", {})
		if not per.is_empty():
			var amt = dice.roll(str(per.dice)).total
			log_msg(Loc.t("log.zone_spikes", {"who": nm(c)}))
			apply_damage(c, amt, str(per.type), z.get("owner"), {"magic": true})
			if c.dead or not c.is_active():
				return
		if z.set.has(prev):
			continue
		if z.has("enter"):
			_zone_save(c, z, z.enter)
		if z.get("enter_damage", false):
			_zone_damage_save(c, z)

func _zone_save(c: Creature, z: Dictionary, trig: Dictionary) -> void:
	var key := "%d:%s" % [int(z.id), trig.get("fail", "")]
	if trig.get("fail", "") == "effect":
		# telaraña: una vez por turno y no si ya está atrapado
		for e in c.effects:
			if e.data.get("zone", -1) == int(z.id):
				return
		if int(z.hits.get(c.id + key, -1)) == turn_counter:
			return
	z.hits[c.id + key] = turn_counter
	if trig.get("fail", "") == "prone" and c.has_condition("prone"):
		return
	var owner: Creature = z.get("owner")
	var r := saving_throw(c, str(trig.save), int(z.get("dc", 10)), owner)
	if r.success:
		return
	match trig.get("fail", ""):
		"prone":
			_add_condition(c, "prone", "zone")
		"effect":
			var spec: Dictionary = z.get("effect", {})
			if not spec.is_empty():
				var e := apply_effect_spec(c, spec, owner, z.get("spell", ""), 0, int(z.get("dc", 10)), true)
				if e != null:
					e.data["zone"] = int(z.id)

func _zone_damage_save(c: Creature, z: Dictionary) -> void:
	if int(z.hits.get(c.id, -1)) == turn_counter:
		return
	z.hits[c.id] = turn_counter
	var owner: Creature = z.get("owner")
	var dmg: Dictionary = z.get("damage", {})
	if dmg.is_empty():
		return
	var total = dice.roll(str(dmg.dice)).total
	var r := saving_throw(c, str(z.get("save", "con")), int(z.get("dc", 10)), owner)
	var amount: int = total if not r.success else int(total / 2)
	emit({"t": "zone_hit", "id": z.id, "who": c.id})
	apply_damage(c, amount, str(dmg.type), owner, {"magic": true})
	if not r.success and z.get("kind", "") == "moonbeam" and not c.form.is_empty():
		var ws := c.get_effect("wild_shape")
		if ws != null:
			_remove_effect(ws)

# ================================================================== tiradas de salvación

func saving_throw(c: Creature, ab: String, dc: int, source: Creature = null, opts: Dictionary = {}) -> Dictionary:
	if opts.get("auto_success", false):
		emit({"t": "save", "who": c.id, "ability": ab, "dc": dc, "total": 99, "natural": 20, "success": true, "auto_fail": false, "careful": true})
		return {"who": c.id, "ability": ab, "dc": dc, "natural": 20, "rolls": [20], "bonus": 0, "bless": 0, "total": 99, "success": true, "auto_fail": false, "mode": 0}
	var auto_fail := false
	if ab in ["str", "dex"] and (c.has_condition("paralyzed") or c.has_condition("unconscious") or c.has_condition("stunned")):
		auto_fail = true
	var adv := 0
	var dis := 0
	if ab == "dex" and c.has_effect("dodge") and c.speed() > 0 and not c.has_condition("incapacitated"):
		adv += 1
	if ab == "dex" and c.has_condition("restrained"):
		dis += 1
	if ab == "dex" and c.has_trait("danger_sense") and not c.has_condition("incapacitated"):
		adv += 1
	if ab == "str" and (c.is_raging() or c.has_effect("enlarged")):
		adv += 1
	if ab == "str" and (c.has_effect("reduced") or c.has_effect("enfeebled")):
		dis += 1
	if ab in ["int", "wis", "cha"] and c.has_trait("gnomish_cunning"):
		adv += 1
	var vs: String = opts.get("vs", "")
	if vs == "poisoned" and (c.has_trait("dwarven_resilience") or c.has_effect("antitoxin")):
		adv += 1
	if vs == "frightened" and c.has_trait("brave"):
		adv += 1
	if vs == "charmed" and c.has_trait("fey_ancestry"):
		adv += 1
	if vs in ["charmed", "frightened"] and c.has_effect("prot_evil") and source != null and source.ctype in Creature.PROT_EVIL_TYPES:
		adv += 1
	if opts.get("conc", false) and (c.has_trait("eldritch_mind") or c.has_effect("extended_conc")):
		adv += 1
	if opts.get("advantage", false):
		adv += 1
	if opts.get("disadvantage", false):
		dis += 1
	var mode := 0
	if adv > 0 and dis == 0:
		mode = 1
	elif dis > 0 and adv == 0:
		mode = -1
	var r := dice.d20(mode, c.has_trait("luck"))
	var bonus := c.save_bonus(ab)
	var bless := 0
	if c.has_effect("bless"):
		bless += dice.die(4)
	if c.has_effect("bane"):
		bless -= dice.die(4)
	if c.has_effect("warding_bond"):
		bonus += 1
	var total: int = r.natural + bonus + bless + int(opts.get("bonus", 0))
	var success := total >= dc and not auto_fail
	# Inspiración bárdica y heroica para salvar una tirada fallida
	if not success and not auto_fail:
		var bi := c.get_effect("bardic_inspiration")
		if bi != null and total + Dice.max_value(str(bi.data.get("die", "1d6"))) >= dc:
			var extra = dice.roll(str(bi.data.get("die", "1d6"))).total
			_remove_effect(bi)
			total += extra
			success = total >= dc
			emit({"t": "inspiration", "who": c.id, "amount": extra, "kind": "bardic"})
			log_msg(Loc.t("log.bardic_used", {"who": nm(c), "n": extra}))
		if not success and c.resources.get("heroic_inspiration", 0) > 0 and c.is_pc and not opts.get("conc", false):
			c.resources.heroic_inspiration -= 1
			var r2 := dice.d20(mode, c.has_trait("luck"))
			var total2: int = r2.natural + bonus + bless + int(opts.get("bonus", 0))
			emit({"t": "inspiration", "who": c.id, "amount": 0, "kind": "heroic"})
			log_msg(Loc.t("log.heroic_used", {"who": nm(c)}))
			if total2 > total:
				total = total2
				r = r2
			success = total >= dc
	var res := {"who": c.id, "ability": ab, "dc": dc, "natural": r.natural, "rolls": r.rolls, "bonus": bonus,
		"bless": bless, "total": total, "success": success, "auto_fail": auto_fail, "mode": mode}
	emit({"t": "save", "who": c.id, "ability": ab, "dc": dc, "total": total, "natural": r.natural, "success": success, "auto_fail": auto_fail})
	if not opts.get("silent", false):
		log_msg(Loc.t("log.save_ok" if success else "log.save_fail", {"who": nm(c), "ability": Loc.ability(ab), "total": total, "dc": dc}))
	return res

func ability_check(c: Creature, skill: String, mode := 0) -> Dictionary:
	if c.has_condition("poisoned") or c.has_condition("frightened"):
		mode = -1 if mode == 0 else (0 if mode > 0 else -1)
	var ab: String = Creature.SKILL_ABILITY.get(skill, "dex")
	if ab == "str" and (c.is_raging() or c.has_effect("enlarged")):
		mode = 1 if mode == 0 else (0 if mode < 0 else 1)
	if ab == "str" and (c.has_effect("reduced") or c.has_effect("enfeebled")):
		mode = -1 if mode == 0 else (0 if mode > 0 else -1)
	if skill == "athletics" and c.has_trait("remarkable_athlete"):
		mode = 1 if mode == 0 else (0 if mode < 0 else 1)
	if skill in c.item_adv:
		mode = 1 if mode == 0 else (0 if mode < 0 else 1)
	if skill == "stealth" and c.armor_data().get("stealth_dis", false):
		mode = -1 if mode == 0 else (0 if mode > 0 else -1)
	var r := dice.d20(mode, c.has_trait("luck"))
	var total: int = r.natural + c.skill_bonus(skill)
	return {"natural": r.natural, "total": total}

# ================================================================== daño y curación

func damage_multiplier(target: Creature, dtype: String) -> float:
	if dtype in target.immune:
		return 0.0
	var m := 1.0
	if dtype in target.resist or target.has_effect("warding_bond") or (target.is_raging() and dtype in PHYSICAL):
		m = 0.5
	if dtype in target.vulnerable:
		m *= 2.0
	return m

## Aplica daño de un tipo. Devuelve el daño efectivo.
func apply_damage(target: Creature, amount: int, dtype: String, source: Creature = null, opts: Dictionary = {}) -> int:
	if target.dead or amount <= 0:
		return 0
	var crit: bool = opts.get("crit", false)
	var dmg := amount
	var raw: bool = opts.get("raw", false)
	if not raw and dtype in target.immune:
		log_msg(Loc.t("log.damage_immune", {"target": nm(target), "type": Loc.dmg_type(dtype)}))
		emit({"t": "damage", "who": target.id, "amount": 0, "type": dtype, "hp": target.hp, "max": target.max_hp, "immune": true, "source": source.id if source else ""})
		return 0
	var resisted := false
	if not raw:
		if dtype in target.resist or target.has_effect("warding_bond") or (target.is_raging() and dtype in PHYSICAL):
			dmg = int(dmg / 2)
			resisted = true
		if dtype in target.vulnerable:
			dmg *= 2
	# Reacción: Aguante de la piedra (goliat)
	if not raw and dmg > 0 and target.has_trait("stones_endurance") and target.resources.get("giant_ancestry", 0) > 0 and target.can_react() and pc_reacts(target):
		var lethal := dmg >= target.hp + target.temp_hp
		if lethal or dmg >= max(7, int(target.max_hp * 0.25)):
			var red = dice.roll("1d12").total + target.mod("con")
			target.resources.giant_ancestry -= 1
			target.turn.reaction = 0
			dmg = max(0, dmg - red)
			emit({"t": "reaction", "who": target.id, "name": RulesDB.feature_name("stones_endurance")})
			log_msg(Loc.t("log.stones_endurance", {"who": nm(target), "n": red}))
			if dmg <= 0:
				return 0
	# Puntos de golpe temporales
	if target.temp_hp > 0:
		var absorbed: int = min(target.temp_hp, dmg)
		target.temp_hp -= absorbed
		dmg -= absorbed
		if target.temp_hp <= 0:
			var ag := target.get_effect("agathys")
			if ag != null:
				_remove_effect(ag)
	var hp_before := target.hp
	target.stats.damage_taken += dmg
	if source:
		source.stats.damage_dealt += dmg
	# Ya estaba en el suelo
	if target.is_pc and target.hp <= 0:
		emit({"t": "damage", "who": target.id, "amount": dmg, "type": dtype, "hp": 0, "max": target.max_hp, "crit": crit, "source": source.id if source else ""})
		if dmg >= target.max_hp:
			_kill(target, source)
		else:
			target.stable = false
			_add_death_failure(target, 2 if crit else 1)
		return dmg
	target.hp -= dmg
	var text := Loc.t("log.damage", {"target": nm(target), "amount": dmg, "type": Loc.dmg_type(dtype)})
	if resisted:
		text += " " + Loc.t("log.damage_resisted", {"target": nm(target)})
	if not raw and dtype in target.vulnerable:
		text += " " + Loc.t("log.damage_vulnerable", {"target": nm(target)})
	log_msg(text)
	# Vínculo protector: el lanzador recibe el mismo daño
	var wb := target.get_effect("warding_bond")
	if wb != null and dmg > 0 and wb.source != null and wb.source != target and not wb.source.dead and not opts.get("bond", false):
		apply_damage(wb.source, dmg, dtype, null, {"raw": true, "bond": true})
	if target.hp <= 0:
		var overflow := dmg - hp_before
		if not target.is_pc:
			# Fortaleza de no muerto
			if target.has_trait("undead_fortitude") and dtype != "radiant" and not crit:
				var r := saving_throw(target, "con", 5 + dmg, source, {"silent": true})
				if r.success:
					target.hp = 1
					emit({"t": "damage", "who": target.id, "amount": dmg, "type": dtype, "hp": 1, "max": target.max_hp, "crit": crit, "source": source.id if source else ""})
					log_msg(Loc.t("log.undead_fortitude", {"who": nm(target)}))
					_after_damage(target, dmg, source, dtype)
					return dmg
			target.hp = 0
			emit({"t": "damage", "who": target.id, "amount": dmg, "type": dtype, "hp": 0, "max": target.max_hp, "crit": crit, "source": source.id if source else ""})
			_kill(target, source)
			return dmg
		# Aguante incansable (orco)
		if overflow < target.max_hp and target.resources.get("relentless_endurance", 0) > 0:
			target.resources.relentless_endurance -= 1
			target.hp = 1
			emit({"t": "damage", "who": target.id, "amount": dmg, "type": dtype, "hp": 1, "max": target.max_hp, "crit": crit, "source": source.id if source else ""})
			emit({"t": "feature", "who": target.id, "feature": "relentless_endurance"})
			log_msg(Loc.t("log.relentless", {"who": nm(target)}))
			_after_damage(target, dmg, source, dtype)
			return dmg
		target.hp = 0
		emit({"t": "damage", "who": target.id, "amount": dmg, "type": dtype, "hp": 0, "max": target.max_hp, "crit": crit, "source": source.id if source else ""})
		if overflow >= target.max_hp:
			_kill(target, source)
		else:
			_fall_unconscious(target, source)
		return dmg
	emit({"t": "damage", "who": target.id, "amount": dmg, "type": dtype, "hp": target.hp, "max": target.max_hp, "crit": crit, "source": source.id if source else ""})
	_after_damage(target, dmg, source, dtype)
	return dmg

func _after_damage(target: Creature, dmg: int, source: Creature, dtype := "") -> void:
	if dmg <= 0:
		return
	for e in target.effects.duplicate():
		if not e in target.effects:
			continue
		match e.kind:
			"sleep":
				_remove_effect(e)
				log_msg(Loc.t("log.sleep_wake", {"who": nm(target)}))
			"turned":
				_remove_effect(e)
				log_msg(Loc.t("log.turn_end", {"who": nm(target)}))
			"laughing":
				var se: Dictionary = e.data.get("save_end", {})
				var r0 := saving_throw(target, "wis", int(se.get("dc", 10)), e.source, {"advantage": true})
				if r0.success:
					_remove_effect(e)
					log_msg(Loc.t("log.effect_end", {"effect": e.name, "who": nm(target)}))
		if e in target.effects and e.data.has("ends_on_team") and source != null and source.team == int(e.data.ends_on_team):
			_remove_effect(e)
			log_msg(Loc.t("log.effect_end", {"effect": e.name, "who": nm(target)}))
	# Concentración
	if target.concentration != null and target.is_active():
		var dc: int = clamp(int(dmg / 2), 10, 30)
		var r := saving_throw(target, "con", dc, source, {"silent": true, "conc": true})
		if r.success:
			log_msg(Loc.t("log.conc_kept", {"who": nm(target)}))
		else:
			end_concentration(target, true)
	# Reacciones al recibir daño de una criatura
	if source != null and source != target and not source.dead and target.is_active() and source.team != target.team:
		_damage_reactions(target, source)

func _damage_reactions(target: Creature, source: Creature) -> void:
	if not target.can_react() or not pc_reacts(target):
		return
	var d := BattleMap.dist(target.cell, source.cell)
	if d > 12 or not sees(target, source):
		return
	# Trueno de la tormenta (goliat)
	if target.has_trait("storms_thunder") and target.resources.get("giant_ancestry", 0) > 0:
		target.resources.giant_ancestry -= 1
		target.turn.reaction = 0
		emit({"t": "reaction", "who": target.id, "name": RulesDB.feature_name("storms_thunder"), "target": source.id})
		log_msg(Loc.t("log.storms_thunder", {"who": nm(target), "target": nm(source)}))
		apply_damage(source, dice.roll("1d8").total, "thunder", target)
		return
	# Reprensión infernal
	if "hellish_rebuke" in target.known_spells() and target.can_cast("hellish_rebuke") and not target.is_raging():
		var free: bool = target.free_casts.get("hellish_rebuke", 0) > 0
		if free or target.total_slots() >= 2 or source.hp <= 14:
			spells.cast_reaction(target, "hellish_rebuke", source)

func _fall_unconscious(c: Creature, source: Creature) -> void:
	c.hp = 0
	c.death_successes = 0
	c.death_failures = 0
	c.stable = false
	c.stats.downs += 1
	c.add_condition("unconscious", "dying")
	if c.concentration != null:
		end_concentration(c, true)
	_end_rage(c)
	var ws := c.get_effect("wild_shape")
	if ws != null:
		_remove_effect(ws)
	_drop_hidden(c)
	emit({"t": "downed", "who": c.id})
	log_msg(Loc.t("log.downed", {"who": nm(c)}))
	_on_dropped(c, source)

func _kill(c: Creature, source: Creature) -> void:
	var was_up := c.hp > 0 or not c.is_pc
	c.dead = true
	c.hp = 0
	c.remove_condition("unconscious", "dying")
	if c.concentration != null:
		end_concentration(c)
	_end_rage(c)
	# quita sus invocaciones
	for tid in tokens.keys():
		if tokens[tid].owner == c:
			tokens.erase(tid)
			emit({"t": "unsummon", "id": tid})
	for z in zones.duplicate():
		if z.get("owner") == c:
			remove_zone(int(z.id))
	if source and source != c:
		source.stats.kills += 1
	emit({"t": "death", "who": c.id})
	log_msg(Loc.t("log.death_pc" if c.is_pc else "log.death", {"who": nm(c)}))
	if was_up:
		_on_dropped(c, source)
	_check_end()

## Una criatura cae a 0 PG: Bendición del Oscuro.
func _on_dropped(c: Creature, source: Creature) -> void:
	for w in creatures:
		if w.dead or not w.is_active() or w.team == c.team or not w.has_trait("dark_ones_blessing"):
			continue
		if source == w or BattleMap.dist(w.cell, c.cell) <= 2:
			var amt: int = max(1, w.mod("cha") + w.level)
			if amt > w.temp_hp:
				w.temp_hp = amt
				emit({"t": "temp_hp", "who": w.id, "amount": amt})
				log_msg(Loc.t("log.dark_blessing", {"who": nm(w), "n": amt}))

func _add_death_failure(c: Creature, n: int) -> void:
	c.death_failures += n
	emit({"t": "death_save", "who": c.id, "successes": c.death_successes, "failures": c.death_failures, "roll": 0})
	if c.death_failures >= 3:
		_kill(c, null)

func _death_save(c: Creature) -> void:
	var r := dice.d20(0, c.has_trait("luck"))
	var nat: int = r.natural
	var bless := dice.die(4) if c.has_effect("bless") else 0
	var total := nat + bless
	if total < 10 and c.resources.get("heroic_inspiration", 0) > 0:
		c.resources.heroic_inspiration -= 1
		var r2 := dice.d20(0, c.has_trait("luck"))
		log_msg(Loc.t("log.heroic_used", {"who": nm(c)}))
		if r2.natural > nat:
			nat = r2.natural
			total = nat + bless
	# Periapto de cierre de heridas: un 9 o menos cuenta como un 10
	if c.has_trait("wound_closure") and total < 10:
		nat = 10
		total = 10
	if nat == 20:
		emit({"t": "death_save", "who": c.id, "roll": nat, "successes": c.death_successes, "failures": c.death_failures, "nat20": true})
		log_msg(Loc.t("log.death_save_20", {"who": nm(c)}))
		heal(c, 1, null, true)
		return
	if nat == 1:
		c.death_failures += 2
	elif total >= 10:
		c.death_successes += 1
	else:
		c.death_failures += 1
	emit({"t": "death_save", "who": c.id, "roll": nat, "successes": c.death_successes, "failures": c.death_failures})
	if total >= 10 and nat != 1:
		log_msg(Loc.t("log.death_save_ok", {"who": nm(c), "roll": total, "s": c.death_successes}))
	else:
		log_msg(Loc.t("log.death_save_fail", {"who": nm(c), "roll": total, "f": c.death_failures}))
	if c.death_failures >= 3:
		_kill(c, null)
	elif c.death_successes >= 3:
		stabilize(c)

func stabilize(c: Creature) -> void:
	c.stable = true
	c.death_successes = 0
	c.death_failures = 0
	emit({"t": "stable", "who": c.id})
	log_msg(Loc.t("log.stable", {"who": nm(c)}))

func heal(target: Creature, amount: int, source: Creature = null, quiet := false) -> int:
	if target.dead or amount <= 0:
		return 0
	if target.has_effect("no_heal"):
		log_msg(Loc.t("log.no_heal", {"who": nm(target)}))
		emit({"t": "immune", "who": target.id, "what": "heal"})
		return 0
	var before := target.hp
	var was_down := target.hp <= 0
	target.hp = min(target.max_hp, target.hp + amount)
	var gained := target.hp - before
	if source:
		source.stats.healed += gained
	if was_down and target.hp > 0:
		target.remove_condition("unconscious", "dying")
		target.death_successes = 0
		target.death_failures = 0
		target.stable = false
		target.add_condition("prone", "fell")
		emit({"t": "revive", "who": target.id, "hp": target.hp})
		log_msg(Loc.t("log.revive", {"who": nm(target)}))
	emit({"t": "heal", "who": target.id, "amount": gained, "hp": target.hp, "max": target.max_hp, "source": source.id if source else ""})
	if not quiet:
		log_msg(Loc.t("log.heal", {"target": nm(target), "amount": gained}))
	return gained

func gain_temp_hp(target: Creature, amount: int) -> void:
	if amount > target.temp_hp:
		target.temp_hp = amount
		emit({"t": "temp_hp", "who": target.id, "amount": amount})
		log_msg(Loc.t("log.temp_hp", {"who": nm(target), "n": amount}))

# ================================================================== perfiles de ataque

## Opciones de ataque con armas para una criatura (para la interfaz y la IA).
func attack_profiles(c: Creature) -> Array:
	var out: Array = []
	for w in c.weapons:
		if w.get("monster", false):
			var p := {
				"key": "m:" + w.id, "name": w.get("name", w.id), "kind": w.kind, "weapon": w,
				"bonus": int(w.bonus), "damage": w.damage, "reach": int(w.get("reach", 5)) / 5,
				"range": [int(w.get("range", [5, 5])[0]) / 5, int(w.get("range", [5, 5])[1]) / 5],
				"ability_mod": 0, "props": w.get("props", []), "ability": "str" if w.kind == "melee" else "dex",
			}
			if w.kind == "ranged" and c.ammo.has(w.id) and int(c.ammo[w.id]) <= 0:
				continue
			if c.is_pc and c.has_effect("magic_weapon"):
				p.bonus += 1
			out.append(p)
			continue
		var props: Array = w.get("props", [])
		var ab := c.weapon_attack_ability(w)
		var m := c.mod(ab)
		var bonus := m + (c.prof_bonus if c.is_proficient(w) else 0)
		var dmg_bonus := m
		if c.fighting_style == "archery" and w.kind == "ranged":
			bonus += 2
		var mw := c.get_effect("magic_weapon")
		# Arma mágica +N (no se suma al conjuro Arma mágica: cuenta el mayor)
		var magic: int = max(int(w.get("magic", 0)), int(mw.data.get("bonus", 1)) if mw != null else 0)
		bonus += magic
		dmg_bonus += magic
		if c.has_effect("sacred_weapon") and w.kind == "melee":
			bonus += max(1, c.mod("cha"))
		var die: String = w.damage
		if c.two_handing(w) and w.has("versatile"):
			die = w.versatile
		var wid: String = w.get("id", "")
		if wid == "unarmed":
			die = "1"
		if c.has_effect("shillelagh") and wid in ["club", "quarterstaff"]:
			die = "1d8"
		if c.cls == "monk" and c.unarmored_monk() and c.is_monk_weapon(w) and not c.martial_die.is_empty():
			if Dice.average(c.martial_die) > Dice.average(die):
				die = c.martial_die
		var dtype: String = w.type
		if c.has_effect("shillelagh") and wid in ["club", "quarterstaff"]:
			dtype = "force"
		var str_based := ab == "str"
		if w.kind == "melee":
			out.append({
				"key": "w:" + wid, "name": w.name, "kind": "melee", "weapon": w, "bonus": bonus,
				"damage": [{"dice": Dice.with_bonus(die, dmg_bonus), "type": dtype}], "die": die,
				"reach": 2 if "reach" in props else 1, "range": [1, 1], "ability_mod": m, "props": props, "ability": ab, "str_based": str_based,
			})
			if "thrown" in props and c.ammo_left(w) != 0:
				var tab := ab
				if tab == "dex" and not "finesse" in props:
					tab = "str"
				var tm := c.mod(tab)
				out.append({
					"key": "t:" + wid, "name": w.name + " (arrojada)", "kind": "thrown", "weapon": w,
					"bonus": tm + (c.prof_bonus if c.is_proficient(w) else 0) + magic,
					"damage": [{"dice": Dice.with_bonus(w.damage, tm + magic), "type": w.type}], "die": w.damage,
					"reach": 1, "range": [int(w.range[0]) / 5, int(w.range[1]) / 5], "ability_mod": tm, "props": props, "ability": tab, "str_based": tab == "str",
				})
		else:
			if c.ammo_left(w) == 0:
				continue
			out.append({
				"key": "w:" + wid, "name": w.name, "kind": "ranged", "weapon": w, "bonus": bonus,
				"damage": [{"dice": Dice.with_bonus(die, dmg_bonus), "type": w.type}], "die": die,
				"reach": 1, "range": [int(w.range[0]) / 5, int(w.range[1]) / 5], "ability_mod": m, "props": props, "ability": ab, "str_based": false,
			})
	return out

func profile_by_key(c: Creature, key: String) -> Dictionary:
	for p in attack_profiles(c):
		if p.key == key:
			return p
	return {}

func in_attack_range(c: Creature, p: Dictionary, target: Creature, from_cell = null) -> bool:
	var fc: Vector2i = c.cell if from_cell == null else from_cell
	var d := BattleMap.dist(fc, target.cell)
	if p.kind == "melee":
		return d <= int(p.reach)
	return d <= int(p.range[1]) and d >= 1

func best_melee_profile(c: Creature) -> Dictionary:
	var best := {}
	var best_v := -1.0
	for p in attack_profiles(c):
		if p.kind != "melee":
			continue
		var v := 0.0
		for d in p.damage:
			v += Dice.average(d.dice)
		v += p.bonus * 0.5
		if v > best_v:
			best_v = v
			best = p
	return best

## ¿Puede atacar a este objetivo? (Hechizado: no ataca a quien le hechizó.)
func may_target(a: Creature, t: Creature) -> bool:
	for e in a.get_effects("charmed_by"):
		if e.source == t:
			return false
	if a.has_effect("suggested"):
		return false
	return true

# ================================================================== ventaja y desventaja

## Calcula el modo de una tirada de ataque y sus razones.
func attack_mode(a: Creature, t: Creature, kind: String, from_cell = null, p: Dictionary = {}) -> Dictionary:
	var fc: Vector2i = a.cell if from_cell == null else from_cell
	var adv: Array = []
	var dis: Array = []
	var d := BattleMap.dist(fc, t.cell)
	var ranged := kind in ["ranged", "thrown", "ranged_spell"]
	# Visión
	var a_sees := sees(a, t, fc)
	var t_sees := sees(t, a, null, fc) and not t.has_condition("unconscious")
	if not t_sees and not t.has_condition("unconscious"):
		adv.append("hidden" if a.is_hidden() else "unseen")
	if not a_sees:
		if a.has_condition("blinded"):
			dis.append("self_blinded")
		elif t.is_hidden():
			dis.append("target_hidden")
		else:
			dis.append("cant_see")
	# Atacante
	if a.has_condition("prone"):
		dis.append("self_prone")
	if a.has_condition("poisoned"):
		dis.append("self_poisoned")
	if a.has_condition("restrained"):
		dis.append("self_restrained")
	if a.has_effect("turned") or a.has_condition("frightened"):
		dis.append("self_frightened")
	if a.has_effect("sapped"):
		dis.append("sapped")
	if a.has_effect("mocked"):
		dis.append("mocked")
	if a.has_effect("enfeebled") and p.get("ability", "") == "str":
		dis.append("enfeebled")
	if a.has_effect("steady_aim"):
		adv.append("steady_aim")
	if a.has_effect("reckless") and p.get("str_based", false):
		adv.append("reckless")
	if a.has_effect("innate_sorcery") and kind.ends_with("_spell") and a.spell_source.get(str(p.get("spell", "")), "class") == "class":
		adv.append("innate_sorcery")
	for e in a.get_effects("vex"):
		if e.data.get("vs", "") == t.id:
			adv.append("vex")
			break
	if settings.get("sunlight", false) and a.has_trait("sunlight_sensitivity"):
		dis.append("sunlight")
	# Objetivo
	if t.has_condition("paralyzed"):
		adv.append("paralyzed")
	elif t.has_condition("unconscious"):
		adv.append("unconscious")
	elif t.has_condition("prone"):
		if d <= 1:
			adv.append("prone_close")
		else:
			dis.append("prone_far")
	if t.has_condition("restrained"):
		adv.append("restrained")
	if t.has_condition("blinded") and not "unseen" in adv and not "hidden" in adv:
		adv.append("target_blinded")
	if t.has_effect("guiding_bolt"):
		adv.append("guiding_bolt")
	if t.has_effect("outlined") or t.has_effect("outlined_shine"):
		adv.append("outlined")
	if t.has_effect("reckless"):
		adv.append("reckless_target")
	for e in t.get_effects("helped"):
		if e.source != null and e.source.team == a.team:
			adv.append("help")
			break
	if t.has_effect("dodge") and not t.has_condition("incapacitated") and t.speed() > 0:
		dis.append("dodge")
	if t.has_effect("blur"):
		dis.append("blur")
	if t.has_effect("prot_evil") and a.ctype in Creature.PROT_EVIL_TYPES:
		dis.append("prot_evil")
	if a.has_trait("pack_tactics"):
		for ally in allies_of(a):
			if ally.can_act() and BattleMap.dist(ally.cell, t.cell) <= 1:
				adv.append("pack_tactics")
				break
	# Distancia
	if ranged:
		for e in enemies_of(a):
			if e.can_act() and BattleMap.dist(fc, e.cell) <= 1 and not e.is_hidden() and sees(e, a, null, fc):
				dis.append("ranged_in_melee")
				break
		if not p.is_empty() and p.has("range") and d > int(p.range[0]):
			dis.append("long_range")
	if not p.is_empty() and a.is_pc and "heavy" in p.get("props", []) and a.form.is_empty():
		var need := "str" if kind == "melee" else "dex"
		if a.abilities.get(need, 10) < 13:
			dis.append("heavy_small")
	var mode := 0
	if adv.size() > 0 and dis.size() == 0:
		mode = 1
	elif dis.size() > 0 and adv.size() == 0:
		mode = -1
	return {"mode": mode, "adv": adv, "dis": dis}

func _consume_attack_effects(a: Creature, t: Creature, mode_info: Dictionary) -> void:
	# Efectos de un solo uso que se gastan al tirar
	var gb := t.get_effect("guiding_bolt")
	if gb != null:
		_remove_effect(gb)
	for e in a.get_effects("vex"):
		if e.data.get("vs", "") == t.id:
			_remove_effect(e)
	var sa := a.get_effect("steady_aim")
	if sa != null:
		_remove_effect(sa)
	for e in t.get_effects("helped"):
		if e.source != null and e.source.team == a.team:
			_remove_effect(e)
			break
	for k in ["sapped", "mocked"]:
		var x := a.get_effect(k)
		if x != null:
			_remove_effect(x)
	# Atacar rompe la invisibilidad del conjuro y extiende la furia
	var inv := a.get_effect("invisible_spell")
	if inv != null:
		_remove_effect(inv)
	if t.team != a.team:
		a.turn.rage_extended = true
	a.turn.attacked = true

## Modificadores aleatorios de una tirada de ataque: Bendecir y Perdición.
func _roll_attack_mods(a: Creature) -> int:
	var m := 0
	if a.has_effect("bless"):
		m += dice.die(4)
	if a.has_effect("bane"):
		m -= dice.die(4)
	return m

# ================================================================== previsión de ataque (interfaz/IA)

func target_ac(t: Creature, a: Creature, from_cell = null, ignore_cover := false) -> int:
	var ac := t.ac()
	if not ignore_cover:
		var cv := map.cover_between(a.cell if from_cell == null else from_cell, t.cell, blockers_for(a, t))
		ac += BattleMap.cover_ac_bonus(cv)
	return ac

func crit_range_for(a: Creature, kind: String) -> int:
	if a.has_trait("improved_critical") and not kind.ends_with("_spell"):
		return 19
	return 20

func preview_attack(a: Creature, p: Dictionary, t: Creature, from_cell = null, opts: Dictionary = {}) -> Dictionary:
	var fc: Vector2i = a.cell if from_cell == null else from_cell
	var mi := attack_mode(a, t, p.kind, fc, p)
	var cv := map.cover_between(fc, t.cell, blockers_for(a, t))
	var ac := t.ac() + BattleMap.cover_ac_bonus(cv)
	var crit_range := crit_range_for(a, p.kind)
	var bonus: float = p.bonus + (2.5 if a.has_effect("bless") else 0.0) - (2.5 if a.has_effect("bane") else 0.0)
	var p_hit := Dice.p_success(bonus, ac, mi.mode, crit_range)
	var avg := 0.0
	for d in p.damage:
		avg += Dice.average(d.dice) * damage_multiplier(t, d.type)
	var extra := extra_damage_preview(a, p, t, mi.mode, fc, opts)
	avg += extra.avg
	var auto_crit := (t.has_condition("paralyzed") or t.has_condition("unconscious")) and BattleMap.dist(fc, t.cell) <= 1
	var expected := p_hit * avg
	if auto_crit:
		expected = p_hit * avg * 1.6
	# Imagen múltiple: parte de los impactos acaban en un doble
	var mir := t.get_effect("mirror_image")
	if mir != null and not a.has_condition("blinded"):
		var n := int(mir.data.get("dupes", 0))
		expected *= pow(1.0 / 3.0, n)
	return {"p_hit": p_hit, "avg": avg, "expected": expected, "mode": mi.mode, "adv": mi.adv, "dis": mi.dis,
		"cover": cv, "ac": ac, "in_range": in_attack_range(a, p, t, fc), "los": cv < 3, "extras": extra.lines}

## Daño extra medio previsto (furtivo, furia, marcas, castigos...) y sus etiquetas.
func extra_damage_preview(a: Creature, p: Dictionary, t: Creature, mode: int, fc: Vector2i, opts: Dictionary = {}) -> Dictionary:
	var avg := 0.0
	var lines: Array = []
	if not a.sneak_attack.is_empty() and not a.turn.get("sneak_used", false) and _sneak_eligible(a, t, p, mode, fc):
		avg += Dice.average(a.sneak_attack)
		lines.append("+ Ataque furtivo %s" % a.sneak_attack)
	var adv_extra: Dictionary = p.get("weapon", {}).get("adv_extra", {})
	if not adv_extra.is_empty() and mode > 0:
		avg += Dice.average(adv_extra.dice)
	if a.is_raging() and p.get("str_based", false):
		avg += a.rage_damage
		lines.append("+%d furia" % a.rage_damage)
		if a.has_trait("frenzy") and a.has_effect("reckless") and not a.turn.get("frenzy_used", false):
			avg += a.rage_damage * 3.5
			lines.append("+ Frenesí %dd6" % a.rage_damage)
	for mk in ["hunters_mark", "hexed"]:
		for e in t.get_effects(mk):
			if e.source == a:
				avg += 3.5
				lines.append("+1d6 %s" % e.name.to_lower())
	if a.has_effect("divine_favor") and not p.get("spell_like", false):
		avg += 2.5
		lines.append("+1d4 favor divino")
	if a.has_trait("colossus_slayer") and t.hp < t.max_hp and not a.turn.get("colossus_used", false):
		avg += 4.5
		lines.append("+1d8 asesino de colosos")
	if a.has_effect("enlarged"):
		avg += 2.5
	if a.has_effect("reduced"):
		avg -= 2.5
	if a.has_effect("enfeebled"):
		avg -= 4.5
	var charge: Dictionary = p.get("weapon", {}).get("charge", {})
	if not charge.is_empty() and a.turn.get("moved_cells", 0) >= int(charge.get("min_cells", 4)):
		avg += Dice.average(str(charge.dice))
		lines.append("+ carga")
	var rider: Dictionary = opts.get("rider", {})
	if not rider.is_empty():
		var rsp := RulesDB.spell(str(rider.get("spell", "")))
		var rexpr := spells.damage_expr(a, rsp, int(rider.get("slot", 1)))
		if not rexpr.is_empty() and rsp.get("rider_area", 0) == 0:
			var ravg := Dice.average(rexpr)
			if rsp.has("vs_fiend_undead") and t.ctype in ["fiend", "undead"]:
				ravg += Dice.average(str(rsp.vs_fiend_undead))
			avg += ravg * damage_multiplier(t, str(rsp.get("damage", {}).get("type", "")))
			lines.append("+ %s" % rsp.get("name", ""))
	return {"avg": max(0.0, avg), "lines": lines}

func _sneak_eligible(a: Creature, t: Creature, p: Dictionary, mode: int, from_cell: Vector2i) -> bool:
	var props: Array = p.get("props", [])
	if not ("finesse" in props or p.kind in ["ranged", "thrown"]):
		return false
	if mode > 0:
		return true
	if mode < 0:
		return false
	for ally in allies_of(a):
		if ally.can_act() and BattleMap.dist(ally.cell, t.cell) <= 1:
			return true
	return false

# ================================================================== ataque con arma

func attacks_per_action(c: Creature) -> int:
	if not c.multiattack.is_empty():
		return int(c.multiattack.get("count", 1))
	return 1

## ¿Puede la criatura atacar ahora con esta opción (sin contar alcance)?
func can_start_attack(c: Creature, p: Dictionary) -> bool:
	if not c.can_act():
		return false
	if c.turn.attack_left > 0:
		return true
	return c.turn.action > 0

## Ataque con arma completo. opts: {oa, offhand, cleave, bonus_strike, flurry, rider, true_strike, extra}
func do_attack(a: Creature, key: String, t: Creature, opts: Dictionary = {}) -> Dictionary:
	var p := profile_by_key(a, key)
	if p.is_empty() or t == null or t.dead:
		return {"ok": false}
	var is_oa: bool = opts.get("oa", false)
	var offhand: bool = opts.get("offhand", false)
	var free_attack: bool = opts.get("cleave", false) or opts.get("free", false)
	if not is_oa and not offhand and not free_attack:
		if not can_start_attack(a, p):
			return {"ok": false, "reason": "no_action"}
		if not in_attack_range(a, p, t):
			return {"ok": false, "reason": "range"}
		if cover(a, t) >= 3:
			return {"ok": false, "reason": "los"}
		if not may_target(a, t):
			return {"ok": false, "reason": "charmed"}
		if a.turn.attack_left <= 0:
			a.turn.action -= 1
			a.turn.attack_left = attacks_per_action(a)
			a.turn.attack_source = "attack"
			a.turn.attack_action = true
		a.turn.attack_left -= 1
	elif offhand:
		if a.turn.bonus <= 0 and not a.turn.get("nick_ready", false):
			return {"ok": false}
		if a.turn.get("nick_ready", false):
			a.turn.nick_ready = false
			a.turn.nick_used = true
		else:
			a.turn.bonus -= 1
		a.turn.offhand_ready = false
	a.turn.acted = true
	a.turn.can_undo = false
	# Atacar rompe el santuario propio
	var own_sanct := a.get_effect("sanctuary")
	if own_sanct != null:
		_remove_effect(own_sanct)
	# Santuario del objetivo
	var sanct := t.get_effect("sanctuary")
	if sanct != null and t.team != a.team:
		var sr := saving_throw(a, "wis", int(sanct.data.dc), sanct.source, {"silent": true})
		if not sr.success:
			log_msg(Loc.t("log.sanctuary_block", {"who": nm(a), "target": nm(t)}))
			emit({"t": "blocked", "who": a.id, "target": t.id, "reason": "sanctuary"})
			_reveal(a)
			return {"ok": true, "blocked": true}
		log_msg(Loc.t("log.sanctuary_pass", {"who": nm(a), "target": nm(t)}))
	# Redirigir ataque (cabecilla trasgo)
	if "redirect_attack" in t.reactions and t.can_react():
		var swap_ally := _redirect_candidate(t, a)
		if swap_ally != null:
			t.turn.reaction = 0
			var tc := t.cell
			t.cell = swap_ally.cell
			swap_ally.cell = tc
			emit({"t": "swap", "a": t.id, "b": swap_ally.id, "a_cell": t.cell, "b_cell": swap_ally.cell})
			log_msg(Loc.t("log.redirect", {"who": nm(t), "ally": nm(swap_ally)}))
			t = swap_ally
	var res := _resolve_weapon_attack(a, p, t, opts)
	# Rompehordas: otro ataque contra una criatura junto al primer objetivo
	if a.has_trait("horde_breaker") and not a.turn.get("horde_used", false) and not is_oa and not opts.get("horde", false) and not a.dead and a.can_act():
		var other := _horde_target(a, p, t)
		if other != null:
			a.turn.horde_used = true
			log_msg(Loc.t("log.horde_breaker", {"who": nm(a), "target": nm(other)}))
			_resolve_weapon_attack(a, p, other, {"horde": true})
	return res

func _horde_target(a: Creature, p: Dictionary, first: Creature) -> Creature:
	var best: Creature = null
	for e in enemies_of(a):
		if e == first or not e.is_active() or e.id in a.turn.get("attacked_ids", []):
			continue
		if BattleMap.dist(e.cell, first.cell) <= 1 and in_attack_range(a, p, e) and cover(a, e) < 3:
			if best == null or e.hp < best.hp:
				best = e
	return best

func _redirect_candidate(t: Creature, attacker: Creature) -> Creature:
	var best: Creature = null
	for ally in allies_of(t):
		if ally.is_active() and BattleMap.dist(ally.cell, t.cell) <= 1 and ally.size_rank() <= 2:
			if best == null or ally.hp > best.hp:
				best = ally
	return best

func _resolve_weapon_attack(a: Creature, p: Dictionary, t: Creature, opts: Dictionary) -> Dictionary:
	var offhand: bool = opts.get("offhand", false)
	var cleave: bool = opts.get("cleave", false)
	var mi := attack_mode(a, t, p.kind, null, p)
	_consume_attack_effects(a, t, mi)
	var ids: Array = a.turn.get("attacked_ids", [])
	if not t.id in ids:
		ids.append(t.id)
	a.turn["attacked_ids"] = ids
	if not opts.get("oa", false):
		a.turn.last_weapon = p.weapon.get("id", "")
	var r := dice.d20(mi.mode, a.has_trait("luck"))
	var nat: int = r.natural
	var bless := _roll_attack_mods(a)
	var total: int = nat + int(p.bonus) + bless
	var ac := target_ac(t, a)
	var crit_range := crit_range_for(a, p.kind)
	var crit := nat >= crit_range
	var hit := crit or (nat != 1 and total >= ac)
	# Inspiración bárdica del atacante para convertir el fallo en acierto
	if not hit and nat != 1:
		var bi := a.get_effect("bardic_inspiration")
		if bi != null and total + Dice.max_value(str(bi.data.get("die", "1d6"))) >= ac:
			var extra = dice.roll(str(bi.data.get("die", "1d6"))).total
			_remove_effect(bi)
			total += extra
			hit = total >= ac
			emit({"t": "inspiration", "who": a.id, "amount": extra, "kind": "bardic"})
			log_msg(Loc.t("log.bardic_used", {"who": nm(a), "n": extra}))
	# Reacciones defensivas: Palabras cortantes y Escudo
	if hit and not crit:
		var cw := _try_cutting_words(a, t, total, ac)
		if cw > 0:
			total -= cw
			hit = total >= ac
	if hit and not crit:
		var avg_dmg := 0.0
		for d in p.damage:
			avg_dmg += Dice.average(d.dice)
		if _try_shield(t, total, ac, avg_dmg):
			ac += 5
			hit = total >= ac
	if hit and (t.has_condition("paralyzed") or t.has_condition("unconscious")) and BattleMap.dist(a.cell, t.cell) <= 1:
		crit = true
	_reveal(a)
	# Munición y arrojadizas
	if p.kind in ["ranged", "thrown"]:
		var wk: String = p.weapon.get("ammo_key", p.weapon.get("id", ""))
		if a.ammo.has(wk):
			a.ammo[wk] = max(0, int(a.ammo[wk]) - 1)
	var ev := {"t": "attack", "who": a.id, "target": t.id, "name": p.name, "kind": p.kind, "natural": nat, "rolls": r.rolls,
		"bonus": p.bonus, "bless": bless, "total": total, "ac": ac, "hit": hit, "crit": crit, "mode": mi.mode,
		"adv": mi.adv, "dis": mi.dis, "weapon": p.weapon.get("id", ""), "oa": opts.get("oa", false), "offhand": offhand,
		"unarmed": p.weapon.get("id", "") == "unarmed", "flurry": opts.get("flurry", false)}
	emit(ev)
	var args := {"who": nm(a), "target": nm(t), "weapon": p.name.to_lower(), "total": total, "ac": ac, "nat": nat}
	if crit:
		log_msg(Loc.t("log.attack_crit", args))
		a.stats.crits += 1
	elif hit:
		log_msg(Loc.t("log.attack_hit", args))
	elif nat == 1:
		log_msg(Loc.t("log.attack_fumble", args))
	else:
		log_msg(Loc.t("log.attack_miss", args))
	var result := {"ok": true, "hit": hit, "crit": crit, "target": t, "damage": 0}
	# Arma ligera: ataque adicional con la otra mano
	if a.is_pc and p.kind == "melee" and "light" in p.props and not offhand and not cleave and not opts.get("oa", false) and not opts.get("bonus_strike", false) and a.form.is_empty():
		if _offhand_weapon(a, p.weapon) != null:
			a.turn.offhand_ready = true
			if a.has_mastery(_offhand_weapon(a, p.weapon)) and _offhand_weapon(a, p.weapon).get("mastery", "") == "nick" and not a.turn.nick_used:
				a.turn.nick_ready = true
	if not hit:
		# Rozar
		if a.is_pc and a.has_mastery(p.weapon) and p.weapon.get("mastery", "") == "graze" and p.ability_mod > 0:
			log_msg(Loc.t("log.graze", {"who": nm(a), "target": nm(t)}))
			apply_damage(t, int(p.ability_mod), p.weapon.type, a)
		return result
	# Imagen múltiple: el golpe puede acabar en un doble
	if _mirror_absorbs(a, t):
		return result
	# Daño
	var parts := _weapon_damage_parts(a, p, t, crit, mi, opts)
	# Castigos y conjuros que se lanzan al impactar
	var rider_info := {}
	var rider: Dictionary = opts.get("rider", {})
	if not rider.is_empty():
		rider_info = spells.apply_rider_damage(a, t, p, rider, crit, parts)
	# Desviar ataques (monje)
	var deflected := _try_deflect(t, a, parts, p.kind)
	var total_dmg := 0
	for part in parts:
		if t.dead:
			break
		total_dmg += apply_damage(t, int(part.amount), part.type, a, {"crit": crit})
	result.damage = total_dmg
	if deflected:
		result["deflected"] = true
	# Armadura de Agathys: el atacante cuerpo a cuerpo sufre frío
	if p.kind == "melee" and not a.dead:
		var ag := t.get_effect("agathys")
		if ag != null and not t.dead:
			log_msg(Loc.t("log.agathys", {"who": nm(t), "target": nm(a)}))
			apply_damage(a, int(ag.data.get("dmg", 5)), "cold", t)
	# Efectos al impactar
	if not a.dead:
		_on_hit_effects(a, p, t, total_dmg, opts)
		if not rider_info.is_empty():
			spells.apply_rider_after(a, t, p, rider_info)
	return result

## Partes de daño de un impacto con arma (con dados de crítico ya aplicados).
func _weapon_damage_parts(a: Creature, p: Dictionary, t: Creature, crit: bool, mi: Dictionary, opts: Dictionary) -> Array:
	var offhand: bool = opts.get("offhand", false)
	var cleave: bool = opts.get("cleave", false)
	var parts: Array = []
	var gwf: bool = a.fighting_style == "great_weapon_fighting" and p.kind == "melee" and ("two_handed" in p.props or (a.two_handing(p.weapon) and p.weapon.has("versatile")))
	for i in p.damage.size():
		var dpart: Dictionary = p.damage[i]
		var expr: String = dpart.dice
		if offhand and int(p.ability_mod) > 0 and a.fighting_style != "two_weapon_fighting":
			expr = Dice.with_bonus(expr, -int(p.ability_mod))
		if cleave and int(p.ability_mod) > 0:
			expr = Dice.with_bonus(expr, -int(p.ability_mod))
		var roll := dice.roll(expr, crit, 3 if gwf else 0)
		# Atacante salvaje: dos tiradas de los dados del arma, se queda la mejor
		if i == 0 and a.has_trait("savage_attacker") and not a.turn.get("savage_used", false) and not p.weapon.get("monster", false):
			var roll2 := dice.roll(expr, crit, 3 if gwf else 0)
			a.turn.savage_used = true
			if roll2.total > roll.total:
				roll = roll2
		# Ataques salvajes (semiorco): un dado de arma más en los críticos cuerpo a cuerpo
		if i == 0 and crit and p.kind == "melee" and a.has_trait("savage_attacks") and not p.weapon.get("monster", false):
			var die := Dice.parse(expr)
			if int(die.get("sides", 0)) > 0:
				roll.total += dice.roll("1d%d" % int(die.sides)).total
		var dtype: String = dpart.type
		if a.has_effect("sacred_weapon") and p.kind == "melee" and damage_multiplier(t, "radiant") > damage_multiplier(t, dtype):
			dtype = "radiant"
		parts.append({"amount": max(0, roll.total), "type": dtype})
	var wtype: String = p.weapon.get("type", "bludgeoning") if not p.weapon.get("monster", false) else str(p.damage[0].type)
	# Ataque furtivo
	if not a.sneak_attack.is_empty() and not a.turn.get("sneak_used", false) and _sneak_eligible(a, t, p, mi.mode, a.cell):
		a.turn.sneak_used = true
		var sroll := dice.roll(a.sneak_attack, crit)
		parts.append({"amount": sroll.total, "type": wtype, "sneak": true})
		emit({"t": "sneak", "who": a.id, "target": t.id, "amount": sroll.total})
	# Extra con ventaja (trasgos)
	var adv_extra: Dictionary = p.weapon.get("adv_extra", {})
	if not adv_extra.is_empty() and mi.mode > 0:
		var xr := dice.roll(adv_extra.dice, crit)
		parts.append({"amount": xr.total, "type": adv_extra.type})
	# Carga del alce
	var charge: Dictionary = p.weapon.get("charge", {})
	if not charge.is_empty() and a.turn.get("moved_cells", 0) >= int(charge.get("min_cells", 4)):
		parts.append({"amount": dice.roll(str(charge.dice), crit).total, "type": str(charge.type)})
		if t.size_rank() <= 3 and not t.has_condition("prone"):
			_add_condition(t, "prone", "charge")
	# Furia y Frenesí
	if a.is_raging() and p.get("str_based", false):
		parts[0].amount += a.rage_damage
		if a.has_trait("frenzy") and a.has_effect("reckless") and not a.turn.get("frenzy_used", false):
			a.turn.frenzy_used = true
			var fr = dice.roll("%dd6" % a.rage_damage, crit).total
			parts.append({"amount": fr, "type": wtype})
			emit({"t": "feature", "who": a.id, "feature": "frenzy"})
	# Marca del cazador y maleficio
	for mk in ["hunters_mark", "hexed"]:
		for e in t.get_effects(mk):
			if e.source == a:
				var md: Dictionary = e.data.get("damage", {"dice": "1d6", "type": "force"})
				parts.append({"amount": dice.roll(str(md.dice), crit).total, "type": str(md.type)})
	# Favor divino
	if a.has_effect("divine_favor"):
		parts.append({"amount": dice.roll("1d4", crit).total, "type": "radiant"})
	# Asesino de colosos
	if a.has_trait("colossus_slayer") and t.hp < t.max_hp and not a.turn.get("colossus_used", false):
		a.turn.colossus_used = true
		parts.append({"amount": dice.roll("1d8", crit).total, "type": wtype})
	# Agrandar / reducir / debilitado
	if a.has_effect("enlarged"):
		parts.append({"amount": dice.roll("1d4", crit).total, "type": wtype})
	if a.has_effect("reduced"):
		parts[0].amount = max(1, int(parts[0].amount) - dice.die(4))
	if a.has_effect("enfeebled"):
		parts[0].amount = max(0, int(parts[0].amount) - dice.roll("1d8").total)
	# Linaje de gigante (goliat): una vez por turno
	if a.resources.get("giant_ancestry", 0) > 0 and not a.turn.get("giant_used", false) and pc_reacts(a):
		if a.has_trait("fires_burn"):
			a.resources.giant_ancestry -= 1
			a.turn.giant_used = true
			parts.append({"amount": dice.roll("1d10", crit).total, "type": "fire"})
			emit({"t": "feature", "who": a.id, "feature": "fires_burn"})
		elif a.has_trait("frosts_chill"):
			a.resources.giant_ancestry -= 1
			a.turn.giant_used = true
			parts.append({"amount": dice.roll("1d6", crit).total, "type": "cold"})
			emit({"t": "feature", "who": a.id, "feature": "frosts_chill"})
			var fe := Effect.new("frosts_chill")
			fe.name = RulesDB.feature_name("frosts_chill")
			fe.source = a
			fe.expires = "start_turn"
			fe.expires_who = a
			_attach_effect(t, fe)
	return parts

## Imagen múltiple: tira un d6 por doble; con 3+ el golpe destruye un doble.
func _mirror_absorbs(a: Creature, t: Creature) -> bool:
	var mir := t.get_effect("mirror_image")
	if mir == null or a.has_condition("blinded") or a.has_trait("blindsight"):
		return false
	var n := int(mir.data.get("dupes", 0))
	for i in n:
		if dice.die(6) >= 3:
			mir.data.dupes = n - 1
			mir.name = "Imágenes ×%d" % (n - 1)
			emit({"t": "mirror", "who": t.id, "left": n - 1})
			log_msg(Loc.t("log.mirror_hit", {"who": nm(t)}))
			if n - 1 <= 0:
				_remove_effect(mir)
			else:
				emit({"t": "effect", "who": t.id, "kind": "mirror_image", "name": mir.name, "on": true, "positive": true})
			return true
	return false

func _offhand_weapon(a: Creature, main: Dictionary) -> Variant:
	for w in a.weapons:
		if w != main and w.get("kind", "") == "melee" and "light" in w.get("props", []) and w.get("id", "") != main.get("id", ""):
			return w
	return null

func _on_hit_effects(a: Creature, p: Dictionary, t: Creature, dmg: int, opts: Dictionary) -> void:
	var w: Dictionary = p.weapon
	# Mordisco de lobo o mastín
	if w.get("on_hit", "") == "prone_if_medium" and not t.dead and t.size_rank() <= 2 and not t.has_condition("prone"):
		_add_condition(t, "prone", "bite")
		log_msg(Loc.t("log.wolf_prone", {"target": nm(t)}))
	if t.dead:
		return
	# Embestida de la colina (goliat)
	if a.has_trait("hills_tumble") and a.resources.get("giant_ancestry", 0) > 0 and not a.turn.get("giant_used", false) and t.size_rank() <= 3 and not t.has_condition("prone") and t.is_active():
		a.resources.giant_ancestry -= 1
		a.turn.giant_used = true
		emit({"t": "feature", "who": a.id, "feature": "hills_tumble"})
		_add_condition(t, "prone", "hills_tumble")
	# Técnica de la mano abierta (golpes de la Ráfaga)
	if opts.get("flurry", false) and a.has_trait("open_hand_technique") and t.is_active():
		var tech: String = opts.get("technique", "auto")
		if tech == "auto":
			tech = "topple" if not t.has_condition("prone") else "addle"
		var dc := 8 + a.mod("wis") + a.prof_bonus
		match tech:
			"topple":
				var rt := saving_throw(t, "dex", dc, a)
				if not rt.success:
					_add_condition(t, "prone", "open_hand")
			"push":
				var rp := saving_throw(t, "str", dc, a)
				if not rp.success:
					push_away(t, a.cell, 3)
			"addle":
				var ae := Effect.new("no_reactions")
				ae.name = "Desequilibrado"
				ae.source = a
				ae.expires = "start_turn"
				ae.expires_who = t
				_attach_effect(t, ae)
	if not a.is_pc or not a.has_mastery(w):
		return
	var m: String = w.get("mastery", "")
	match m:
		"sap":
			if not t.has_effect("sapped"):
				var e := Effect.new("sapped")
				e.name = Loc.t("mastery.sap")
				e.source = a
				e.expires = "start_turn"
				e.expires_who = a
				_attach_effect(t, e)
				log_msg(Loc.t("log.sap", {"target": nm(t)}))
		"vex":
			if dmg > 0:
				var e2 := Effect.new("vex")
				e2.source = a
				e2.data = {"vs": t.id}
				# dura hasta el final del siguiente turno del atacante
				e2.expires = "end_turn_next"
				e2.expires_who = a
				e2.data["skip_first_end"] = (current == a)
				_attach_effect(a, e2)
				log_msg(Loc.t("log.vex", {"who": nm(a), "target": nm(t)}))
		"slow":
			if dmg > 0 and not t.has_effect("slowed_weapon"):
				var e3 := Effect.new("slowed_weapon")
				e3.name = Loc.t("mastery.slow")
				e3.source = a
				e3.expires = "start_turn"
				e3.expires_who = a
				_attach_effect(t, e3)
				log_msg(Loc.t("log.slow", {"target": nm(t)}))
		"topple":
			if not t.has_condition("prone") and t.is_active():
				var dc2 := 8 + int(p.ability_mod) + a.prof_bonus
				var r := saving_throw(t, "con", dc2, a)
				if not r.success:
					_add_condition(t, "prone", "topple")
		"push":
			if t.size_rank() <= 3 and t.is_active():
				push_away(t, a.cell, 2)
		"cleave":
			if not a.turn.cleave_used and not opts.get("cleave", false):
				var second := _cleave_target(a, t)
				if second != null:
					a.turn.cleave_used = true
					log_msg(Loc.t("log.cleave", {"who": nm(a), "target": nm(second)}))
					_resolve_weapon_attack(a, p, second, {"cleave": true})

func _cleave_target(a: Creature, first: Creature) -> Creature:
	var best: Creature = null
	for e in enemies_of(a):
		if e == first or not e.is_active():
			continue
		if BattleMap.dist(e.cell, first.cell) <= 1 and BattleMap.dist(e.cell, a.cell) <= a.reach_cells():
			if best == null or e.hp < best.hp:
				best = e
	return best

## avg_dmg: daño medio del ataque (-1 si se desconoce). Los PJ ahorran su último espacio
## de conjuro salvo que el golpe pueda tumbarlos: así no se gastan Dormir o Proyectil mágico solos.
func _try_shield(t: Creature, attack_total: int, ac: int, avg_dmg := -1.0) -> bool:
	if not t.can_react() or not "shield" in t.known_spells() or not t.can_cast("shield"):
		return false
	if attack_total >= ac + 5:
		return false
	var free: bool = t.free_casts.get("shield", 0) > 0
	if not free and not t.has_slot(1):
		return false
	if not pc_reacts(t):
		return false
	if t.is_pc and avg_dmg >= 0.0 and not free:
		var total_slots := t.total_slots()
		var lethal := avg_dmg >= t.hp
		var dangerous := avg_dmg >= t.hp * 0.25
		if not lethal and (total_slots <= 1 or not dangerous):
			return false
	if free:
		t.free_casts["shield"] -= 1
	else:
		var lvl := t.lowest_slot(1)
		t.slots[lvl - 1] -= 1
	t.turn.reaction = 0
	var e := Effect.new("shield_spell")
	e.name = RulesDB.spell("shield").get("name", "Escudo")
	e.source = t
	e.positive = true
	e.expires = "start_turn"
	e.expires_who = t
	_attach_effect(t, e)
	emit({"t": "reaction", "who": t.id, "name": e.name, "spell": "shield"})
	log_msg(Loc.t("log.shield", {"who": nm(t)}))
	return true

## Palabras cortantes: un bardo del Saber resta su dado a un ataque que impacta.
func _try_cutting_words(a: Creature, t: Creature, total: int, ac: int) -> int:
	for bard in creatures:
		if bard.dead or bard.team == a.team or not bard.has_trait("cutting_words"):
			continue
		if bard.resources.get("bardic_inspiration", 0) <= 0 or not bard.can_react() or not pc_reacts(bard):
			continue
		if BattleMap.dist(bard.cell, a.cell) > 12 or not sees(bard, a):
			continue
		var die_max := Dice.max_value(bard.bardic_die)
		if total - ac >= die_max:
			continue
		bard.resources.bardic_inspiration -= 1
		bard.turn.reaction = 0
		var n = dice.roll(bard.bardic_die).total
		emit({"t": "reaction", "who": bard.id, "name": RulesDB.feature_name("cutting_words"), "target": a.id})
		log_msg(Loc.t("log.cutting_words", {"who": nm(bard), "target": nm(a), "n": n}))
		return n
	return 0

## Desviar ataques (monje): reduce el daño contundente, cortante o perforante.
func _try_deflect(t: Creature, a: Creature, parts: Array, kind: String) -> bool:
	if not t.has_trait("deflect_attacks") or not t.can_react() or not pc_reacts(t) or t.dead:
		return false
	var phys := 0
	for part in parts:
		if part.type in PHYSICAL:
			phys += int(part.amount)
	if phys <= 0:
		return false
	var total := 0
	for part in parts:
		total += int(part.amount)
	if total < 5 and total < t.hp:
		return false
	t.turn.reaction = 0
	var red = dice.roll("1d10").total + t.mod("dex") + t.level
	var left = red
	for part in parts:
		if left <= 0:
			break
		var cut: int = min(int(part.amount), left)
		part.amount = int(part.amount) - cut
		left -= cut
	emit({"t": "reaction", "who": t.id, "name": RulesDB.feature_name("deflect_attacks")})
	log_msg(Loc.t("log.deflect", {"who": nm(t), "n": red}))
	var rest := 0
	for part in parts:
		rest += int(part.amount)
	# Devolver el golpe con 1 punto de foco
	if rest <= 0 and t.resources.get("focus", 0) > 0 and not a.dead:
		var dist_ok := BattleMap.dist(t.cell, a.cell) <= (1 if kind == "melee" else 12)
		if dist_ok:
			t.resources.focus -= 1
			var dc := 8 + t.mod("wis") + t.prof_bonus
			var rr := saving_throw(a, "dex", dc, t)
			if not rr.success:
				var amt = dice.roll(t.martial_die).total + dice.roll(t.martial_die).total + t.mod("dex")
				log_msg(Loc.t("log.deflect_back", {"who": nm(t), "target": nm(a)}))
				apply_damage(a, amt, "bludgeoning", t)
	return true

# ================================================================== empujones y teletransporte

func push_away(t: Creature, from_cell: Vector2i, cells: int) -> void:
	var dir := BattleMap.center(t.cell) - BattleMap.center(from_cell)
	if dir.length() < 0.01:
		return
	var start := t.cell
	var cur := t.cell
	var occ := occupancy()
	for i in cells:
		var nxt := BattleMap.step_toward(cur, dir)
		if not map.walkable(nxt) or (occ.has(nxt) and occ[nxt] != t and not occ[nxt].dead):
			break
		cur = nxt
	if cur != start:
		t.cell = cur
		emit({"t": "push", "who": t.id, "from": start, "to": cur})
		log_msg(Loc.t("log.push", {"who": nm(t)}))
		_zone_enter(t, cur, start)

func pull_toward(t: Creature, to_cell: Vector2i, cells: int) -> void:
	var start := t.cell
	var cur := t.cell
	var occ := occupancy()
	for i in cells:
		if BattleMap.dist(cur, to_cell) <= 1:
			break
		var nxt := BattleMap.step_toward(cur, BattleMap.center(to_cell) - BattleMap.center(cur))
		if not map.walkable(nxt) or (occ.has(nxt) and occ[nxt] != t and not occ[nxt].dead):
			break
		cur = nxt
	if cur != start:
		t.cell = cur
		emit({"t": "push", "who": t.id, "from": start, "to": cur})
		log_msg(Loc.t("log.pull", {"who": nm(t)}))
		_zone_enter(t, cur, start)

func teleport(c: Creature, to: Vector2i) -> void:
	var from := c.cell
	c.cell = to
	emit({"t": "teleport", "who": c.id, "from": from, "to": to})
	log_msg(Loc.t("log.teleport", {"who": nm(c)}))
	_zone_enter(c, to, from)

# ================================================================== movimiento

## Casillas alcanzables este turno: {cost, prev, dash_cost, dash_prev}
func move_options(c: Creature) -> Dictionary:
	var occ := occupancy()
	var crawl := false
	var budget: int = c.turn.movement
	if c.has_condition("prone"):
		# levantarse cuesta media velocidad
		var stand := int(c.speed() / 2)
		if budget >= stand and c.speed() > 0 and not c.has_effect("laughing"):
			budget -= stand
		else:
			crawl = true
	var r := map.reachable(c.cell, budget, c, occ, crawl)
	var ends := {}
	for cell in r.cost.keys():
		if BattleMap.can_end_in(cell, c, occ):
			ends[cell] = r.cost[cell]
	# Con carrera (si queda acción o acción adicional de Acción astuta)
	var dash_ends := {}
	var dash_prev := {}
	if _can_dash(c):
		var r2 := map.reachable(c.cell, budget + c.speed(), c, occ, crawl)
		dash_prev = r2.prev
		for cell in r2.cost.keys():
			if BattleMap.can_end_in(cell, c, occ) and not ends.has(cell):
				dash_ends[cell] = r2.cost[cell]
	return {"cost": ends, "prev": r.prev, "dash_cost": dash_ends, "dash_prev": dash_prev, "crawl": crawl}

func _can_dash(c: Creature) -> bool:
	if c.speed() <= 0:
		return false
	if c.turn.action > 0 and c.turn.attack_left <= 0:
		return true
	if (c.level_feature("cunning_action") or c.has_effect("exp_retreat")) and c.turn.bonus > 0:
		return true
	return false

## Ataques de oportunidad que provocaría recorrer este camino.
func path_threats(c: Creature, path: Array) -> Array:
	var out: Array = []
	if c.turn.get("disengaged", false):
		return out
	var cur := c.cell
	var used := {}
	for nxt in path:
		for e in enemies_of(c):
			if used.has(e.id) or not e.can_react() or e.is_down() or e.has_effect("no_oa"):
				continue
			if not sees(e, c, null, cur):
				continue
			var reach = e.reach_cells()
			if e.melee_weapons().is_empty() and attack_profiles(e).filter(func(x): return x.kind == "melee").is_empty():
				continue
			if BattleMap.dist(cur, e.cell) <= reach and BattleMap.dist(nxt, e.cell) > reach:
				out.append({"enemy": e, "at": cur})
				used[e.id] = true
		cur = nxt
	return out

## Mueve a la criatura por un camino (lista de casillas). Devuelve la casilla final.
func do_move(c: Creature, path: Array, use_dash := false) -> Vector2i:
	if path.is_empty() or not c.is_active():
		return c.cell
	var opts := move_options(c)
	var goal: Vector2i = path[path.size() - 1]
	var dashing := false
	if not opts.cost.has(goal):
		if use_dash or opts.dash_cost.has(goal):
			if not opts.dash_cost.has(goal):
				return c.cell
			dashing = true
		else:
			return c.cell
	path = BattleMap.build_path(opts.dash_prev if dashing else opts.prev, c.cell, goal)
	if path.is_empty():
		return c.cell
	if dashing:
		_spend_dash(c)
	# Levantarse
	if c.has_condition("prone") and not opts.crawl:
		c.turn.movement -= int(c.speed() / 2)
		_remove_condition(c, "prone")
		emit({"t": "stand", "who": c.id})
		log_msg(Loc.t("log.stand_up", {"who": nm(c)}))
	var res := _walk(c, path, dashing, opts.crawl, true)
	if res.provoked or dashing:
		c.turn.can_undo = false
	return c.cell

## Recorre un camino casilla a casilla: ataques de oportunidad, zonas y escondite.
func _walk(c: Creature, path: Array, dashing: bool, crawl: bool, spend: bool) -> Dictionary:
	var walked: Array = []
	var cur := c.cell
	var stopped := false
	var provoked := false
	for nxt in path:
		# Ataques de oportunidad al salir del alcance
		if not c.turn.get("disengaged", false) and not c.is_hidden():
			for e in enemies_of(c):
				if not e.can_react() or e.is_down() or e.has_effect("no_oa"):
					continue
				var mp := best_melee_profile(e)
				if mp.is_empty():
					continue
				var reach := int(mp.reach)
				if BattleMap.dist(cur, e.cell) <= reach and BattleMap.dist(nxt, e.cell) > reach and sees(e, c):
					if not pc_reacts(e) or not may_target(e, c):
						continue
					if walked.size() > 0:
						emit({"t": "move", "who": c.id, "path": walked.duplicate(), "dash": dashing})
						walked.clear()
					e.turn.reaction = 0
					provoked = true
					log_msg(Loc.t("log.oa", {"who": nm(e), "target": nm(c)}))
					_resolve_weapon_attack(e, mp, c, {"oa": true})
					if not c.is_active() or c.has_condition("prone") or c.speed() <= 0 or c.has_condition("incapacitated"):
						stopped = true
						break
			if stopped:
				break
		var step := map.move_cost(nxt)
		if crawl:
			step *= 2
		if spend:
			c.turn.movement -= step
		var prev := c.cell
		c.cell = nxt
		c.turn.moved = true
		c.turn.moved_cells += 1
		walked.append(nxt)
		cur = nxt
		if c.turn.movement < 0:
			c.turn.movement = 0
		# Zonas de conjuro
		if not zones.is_empty():
			var before_hp := c.hp
			var was_restrained := c.has_condition("restrained")
			if not zones_at(nxt).is_empty():
				emit({"t": "move", "who": c.id, "path": walked.duplicate(), "dash": dashing})
				walked.clear()
				_zone_enter(c, nxt, prev)
			if not c.is_active() or c.has_condition("prone") or (c.has_condition("restrained") and not was_restrained) or c.speed() <= 0:
				stopped = true
				break
			if c.hp < before_hp and c.hp <= 0:
				stopped = true
				break
	if walked.size() > 0:
		emit({"t": "move", "who": c.id, "path": walked, "dash": dashing})
	if stopped:
		log_msg(Loc.t("log.move_stop", {"who": nm(c)}))
	# Al moverse se puede perder el escondite
	if c.is_hidden():
		_check_reveal_by_position(c)
	return {"provoked": provoked, "stopped": stopped}

## Movimiento forzado por el propio objetivo (Susurros disonantes): no gasta su movimiento.
func forced_flee(c: Creature, from: Creature) -> void:
	if not c.is_active() or c.speed() <= 0:
		return
	var occ := occupancy()
	var r := map.reachable(c.cell, c.speed(), c, occ, false)
	var best := c.cell
	var best_d := BattleMap.dist(c.cell, from.cell)
	for cell in r.cost.keys():
		if not BattleMap.can_end_in(cell, c, occ):
			continue
		var d := BattleMap.dist(cell, from.cell)
		if d > best_d:
			best_d = d
			best = cell
	if best == c.cell:
		return
	var path := BattleMap.build_path(r.prev, c.cell, best)
	log_msg(Loc.t("log.flee", {"who": nm(c)}))
	_walk(c, path, false, false, false)

func can_undo_move(c: Creature) -> bool:
	return c == current and c.turn.get("can_undo", false) and c.turn.moved and not c.turn.acted

func undo_move(c: Creature) -> void:
	if not can_undo_move(c):
		return
	var from := c.cell
	c.cell = c.turn.undo_cell
	c.turn.movement = c.turn.undo_movement
	c.turn.moved = false
	c.turn.moved_cells = 0
	emit({"t": "teleport", "who": c.id, "from": from, "to": c.cell, "undo": true})

func _spend_dash(c: Creature) -> void:
	if c.turn.action > 0 and c.turn.attack_left <= 0:
		c.turn.action -= 1
	elif (c.level_feature("cunning_action") or c.has_effect("exp_retreat")) and c.turn.bonus > 0:
		c.turn.bonus -= 1
	c.turn.movement += c.speed()
	c.turn.acted = true
	emit({"t": "dash", "who": c.id})
	log_msg(Loc.t("log.dash", {"who": nm(c)}))

# ================================================================== ocultarse

func _drop_hidden(c: Creature) -> void:
	for e in c.get_effects("hidden"):
		_remove_effect(e)

func _reveal(c: Creature) -> void:
	if c.is_hidden():
		_drop_hidden(c)
		emit({"t": "reveal", "who": c.id})
		log_msg(Loc.t("log.revealed", {"who": nm(c)}))

func _check_reveal_by_position(c: Creature) -> void:
	for e in enemies_of(c):
		if not e.is_active():
			continue
		var cv := map.cover_between(e.cell, c.cell, blockers_for(e, c))
		if cv == 0 and BattleMap.dist(e.cell, c.cell) <= 6 and e.passive_perception() >= c.hidden_stealth - 5 and _clear_sight(e, e.cell, c.cell):
			_reveal(c)
			return

func can_hide(c: Creature) -> bool:
	if c.is_hidden():
		return false
	if obscure_at(c.cell) >= 2:
		return true
	for e in enemies_of(c):
		if not e.is_active():
			continue
		if not sees(e, c):
			continue
		var cv := map.cover_between(e.cell, c.cell, blockers_for(e, c) if c.has_trait("naturally_stealthy") else [])
		var need := 1 if c.has_trait("naturally_stealthy") else 2
		if cv < need:
			return false
	return true

# ================================================================== acciones de turno

## Comprueba y gasta el coste de una acción. cost: "action" | "bonus" | "free"
func _spend(c: Creature, cost: String) -> bool:
	if cost == "action":
		if c.turn.action <= 0 or c.turn.attack_left > 0:
			if c.turn.attack_left > 0:
				# abandonar ataques restantes de la acción de Atacar
				c.turn.attack_left = 0
				if c.turn.action <= 0:
					return false
			else:
				return false
		c.turn.action -= 1
	elif cost == "bonus":
		if c.turn.bonus <= 0:
			return false
		c.turn.bonus -= 1
		c.turn.rage_extended = true
	c.turn.acted = true
	c.turn.can_undo = false
	return true

func do_dash(c: Creature, bonus := false) -> bool:
	if not _spend(c, "bonus" if bonus else "action"):
		return false
	c.turn.movement += c.speed()
	emit({"t": "dash", "who": c.id})
	log_msg(Loc.t("log.dash", {"who": nm(c)}))
	return true

func do_disengage(c: Creature, bonus := false) -> bool:
	if not _spend(c, "bonus" if bonus else "action"):
		return false
	c.turn.disengaged = true
	emit({"t": "disengage", "who": c.id})
	log_msg(Loc.t("log.nimble_escape" if not c.is_pc else "log.disengage", {"who": nm(c)}))
	return true

func add_dodge(c: Creature) -> void:
	var e := Effect.new("dodge")
	e.name = "Esquivar"
	e.source = c
	e.positive = true
	e.expires = "start_turn"
	e.expires_who = c
	_attach_effect(c, e)

func do_dodge(c: Creature) -> bool:
	if not _spend(c, "action"):
		return false
	add_dodge(c)
	log_msg(Loc.t("log.dodge", {"who": nm(c)}))
	return true

func do_hide(c: Creature, bonus := false) -> bool:
	if not can_hide(c):
		log_msg(Loc.t("log.hide_no_cover", {"who": nm(c)}))
		return false
	if not _spend(c, "bonus" if bonus else "action"):
		return false
	var r := ability_check(c, "stealth")
	if r.total >= 15:
		c.hidden_stealth = r.total
		var e := Effect.new("hidden")
		e.name = Loc.cond("invisible")
		e.source = c
		e.positive = true
		e.grants = ["invisible"]
		_attach_effect(c, e)
		emit({"t": "hide", "who": c.id, "success": true, "total": r.total})
		log_msg(Loc.t("log.hide_ok", {"who": nm(c), "total": r.total}))
	else:
		emit({"t": "hide", "who": c.id, "success": false, "total": r.total})
		log_msg(Loc.t("log.hide_fail", {"who": nm(c), "total": r.total}))
	return true

func do_search(c: Creature) -> bool:
	if not _spend(c, "action"):
		return false
	var found := false
	for e in enemies_of(c):
		if e.is_hidden() and map.has_los(c.cell, e.cell):
			var r := ability_check(c, "perception")
			if r.total >= e.hidden_stealth:
				_reveal(e)
				found = true
	if not found:
		log_msg(Loc.t("log.search_fail", {"who": nm(c)}))
	return true

func do_help(c: Creature, target: Creature) -> bool:
	if target == null or BattleMap.dist(c.cell, target.cell) > 1 or target.team == c.team:
		return false
	if not _spend(c, "action"):
		return false
	var e := Effect.new("helped")
	e.name = "Distraído"
	e.source = c
	e.expires = "start_turn"
	e.expires_who = c
	_attach_effect(target, e)
	log_msg(Loc.t("log.help", {"who": nm(c), "target": nm(target)}))
	return true

func do_stabilize(c: Creature, target: Creature) -> bool:
	if target == null or not target.is_down() or BattleMap.dist(c.cell, target.cell) > 1:
		return false
	if not _spend(c, "action"):
		return false
	var r := ability_check(c, "medicine")
	if r.total >= 10:
		log_msg(Loc.t("log.stabilize_ok", {"who": nm(c), "target": nm(target)}))
		stabilize(target)
	else:
		log_msg(Loc.t("log.stabilize_fail", {"who": nm(c), "target": nm(target)}))
	return true

func do_wake(c: Creature, target: Creature) -> bool:
	if target == null or BattleMap.dist(c.cell, target.cell) > 1:
		return false
	var sl := target.get_effect("sleep")
	if sl == null:
		return false
	if not _spend(c, "action"):
		return false
	_remove_effect(sl)
	log_msg(Loc.t("log.wake", {"who": nm(c), "target": nm(target)}))
	return true

## Efecto que apresa y del que se puede escapar con una prueba (Enmarañar, Telaraña...).
func escape_effect(c: Creature) -> Effect:
	for e in c.effects:
		if e.data.has("escape") and "restrained" in e.grants:
			return e
	return null

func do_escape(c: Creature) -> bool:
	var e := escape_effect(c)
	if e == null:
		return false
	if not _spend(c, "action"):
		return false
	var skill := "athletics" if c.skill_bonus("athletics") >= c.skill_bonus("acrobatics") else "acrobatics"
	var r := ability_check(c, skill)
	var dc := int(e.data.escape.get("dc", 10))
	emit({"t": "escape", "who": c.id, "success": r.total >= dc, "total": r.total})
	if r.total >= dc:
		_remove_effect(e)
		log_msg(Loc.t("log.escape_ok", {"who": nm(c), "total": r.total, "dc": dc}))
	else:
		log_msg(Loc.t("log.escape_fail", {"who": nm(c), "total": r.total, "dc": dc}))
	return true

## Poción de curación (la mejor que lleve). Para la IA y el botón rápido.
func do_potion(c: Creature, target: Creature) -> bool:
	for pid in ["potion_greater_healing", "potion_healing"]:
		if int(c.items.get(pid, 0)) > 0:
			return do_item(c, target, pid)
	return false

## Pociones que se pueden usar en combate ahora (ids).
func usable_potions(c: Creature) -> Array:
	var out: Array = []
	for id in c.items.keys():
		if int(c.items[id]) > 0 and Items.kind(id) == "potion":
			out.append(id)
	return out

## Beber una poción o dársela a un aliado adyacente: acción adicional.
func do_item(c: Creature, target: Creature, item_id: String) -> bool:
	var d := Items.data(item_id)
	if d.get("kind", "") != "potion" or int(c.items.get(item_id, 0)) <= 0:
		return false
	if target == null or target.dead or BattleMap.dist(c.cell, target.cell) > 1:
		return false
	if not _spend(c, "bonus"):
		return false
	c.items[item_id] = int(c.items[item_id]) - 1
	if int(c.items[item_id]) <= 0:
		c.items.erase(item_id)
	emit({"t": "item", "who": c.id, "target": target.id, "item": item_id})
	log_msg(Loc.t("log.item", {"who": nm(c), "item": d.get("name", item_id)}))
	var use: Dictionary = d.get("use", {})
	if use.has("heal"):
		heal(target, dice.roll(str(use.heal)).total, c)
	if use.has("set"):
		for ab in use.set.keys():
			target.abilities[ab] = max(int(target.abilities.get(ab, 10)), int(use.set[ab]))
		var e := Effect.new("giant_strength")
		e.name = d.get("name", item_id)
		e.positive = true
		e.owner = target
		target.effects.append(e)
		emit({"t": "buff", "who": target.id, "kind": "giant_strength"})
	if use.has("effect"):
		var e2 := Effect.new(str(use.effect))
		e2.name = d.get("name", item_id)
		e2.positive = true
		e2.owner = target
		target.effects.append(e2)
		emit({"t": "buff", "who": target.id, "kind": str(use.effect)})
	return true

func do_second_wind(c: Creature) -> bool:
	return cls.use(c, "second_wind")

func do_action_surge(c: Creature) -> bool:
	return cls.use(c, "action_surge")

func do_steady_aim(c: Creature) -> bool:
	return cls.use(c, "steady_aim")

func do_shove(c: Creature, target: Creature, prone := true) -> bool:
	if target == null or BattleMap.dist(c.cell, target.cell) > 1 or target.team == c.team:
		return false
	if target.size_rank() > c.size_rank() + 1:
		return false
	if c.turn.attack_left <= 0:
		if c.turn.action <= 0:
			return false
		c.turn.action -= 1
		c.turn.attack_left = attacks_per_action(c)
		c.turn.attack_action = true
	c.turn.attack_left -= 1
	c.turn.acted = true
	c.turn.can_undo = false
	c.turn.rage_extended = true
	var ab_mod := c.mod("str")
	if c.cls == "monk" and c.unarmored_monk():
		ab_mod = max(ab_mod, c.mod("dex"))
	var dc := 8 + ab_mod + c.prof_bonus
	var ab := "str" if target.save_bonus("str") >= target.save_bonus("dex") else "dex"
	var r := saving_throw(target, ab, dc, c)
	emit({"t": "shove", "who": c.id, "target": target.id, "success": not r.success})
	if r.success:
		log_msg(Loc.t("log.shove_fail", {"who": nm(c), "target": nm(target)}))
	elif prone:
		_add_condition(target, "prone", "shove")
		log_msg(Loc.t("log.shove_prone", {"who": nm(c), "target": nm(target)}))
	else:
		push_away(target, c.cell, 1)
		log_msg(Loc.t("log.shove_push", {"who": nm(c), "target": nm(target)}))
	_reveal(c)
	return true

# ---- Canalizar divinidad (atajos para la interfaz y la IA)

func do_divine_spark(c: Creature, target: Creature, mode := "auto") -> bool:
	return cls.use(c, "divine_spark", {"target": target.id if target else ""})

func do_turn_undead(c: Creature) -> bool:
	return cls.use(c, "turn_undead")

func do_preserve_life(c: Creature) -> bool:
	return cls.use(c, "preserve_life")

# ---- Furia y forma salvaje (fin)

func _end_rage(c: Creature) -> void:
	var rg := c.get_effect("rage")
	if rg != null:
		_remove_effect(rg)
		log_msg(Loc.t("log.rage_end", {"who": nm(c)}))

func _revert_form(c: Creature) -> void:
	if c.form.is_empty():
		return
	c.leave_form()
	emit({"t": "shape", "who": c.id, "form": ""})
	log_msg(Loc.t("log.wild_shape_end", {"who": nm(c)}))

# ---- Esfera llameante: daño al acabar el turno junto a ella

func _flaming_sphere_end_turn(c: Creature) -> void:
	for tid in tokens.keys():
		var tk: Dictionary = tokens[tid]
		if tk.get("kind", "") != "flaming_sphere" or c.dead:
			continue
		if BattleMap.dist(tk.cell, c.cell) <= 1:
			spells.flaming_sphere_hit(tk, c)

# ---- Monstruos

func do_life_drain(a: Creature, t: Creature) -> bool:
	if a.life_drain.is_empty() or t == null or BattleMap.dist(a.cell, t.cell) > 1:
		return false
	if a.turn.attack_left <= 0:
		if a.turn.action <= 0:
			return false
		a.turn.action -= 1
		a.turn.attack_left = attacks_per_action(a)
	if a.turn.get("life_drain_used", false):
		return false
	a.turn.attack_left -= 1
	a.turn.life_drain_used = true
	a.turn.acted = true
	emit({"t": "special", "who": a.id, "target": t.id, "name": "Drenar vida"})
	log_msg(Loc.t("log.life_drain_try", {"who": nm(a), "target": nm(t)}))
	var r := saving_throw(t, "con", int(a.life_drain.dc), a)
	if not r.success:
		var dmg := apply_damage(t, dice.roll(a.life_drain.dice).total, a.life_drain.type, a)
		if not t.dead and dmg > 0:
			t.max_hp = max(1, t.max_hp - dmg)
			t.hp = min(t.hp, t.max_hp)
			log_msg(Loc.t("log.life_drain", {"who": nm(a), "target": nm(t), "max": t.max_hp}))
			emit({"t": "max_hp", "who": t.id, "max": t.max_hp, "hp": t.hp})
	return true

# ---- Efectos que duran hasta el final del SIGUIENTE turno de alguien

func _expire_end_turn_next(who: Creature) -> void:
	for c in creatures:
		for e in c.effects.duplicate():
			if e.expires == "end_turn_next" and e.expires_who == who and e in c.effects:
				if e.data.get("skip_first_end", false):
					e.data.skip_first_end = false
				else:
					_remove_effect(e)
