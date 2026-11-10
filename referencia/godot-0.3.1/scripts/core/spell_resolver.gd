class_name SpellResolver
extends RefCounted
## Lanzamiento y resolución de conjuros (SRD 5.2.1) dentro de un Battle.
## Casi todo es genérico y sale de data/spells.json: ataque/salvación, daño, efecto,
## área, zona persistente y castigos. Lo singular vive en _special().

var b: Battle

const META_COST := {"careful": 1, "distant": 1, "empowered": 1, "extended": 1, "heightened": 2, "quickened": 2, "seeking": 1, "subtle": 1, "transmuted": 1, "twinned": 1}
const TRANSMUTE_TYPES := ["acid", "cold", "fire", "lightning", "poison", "thunder"]
## Valor de control aproximado de cada efecto (para la previsión y la IA).
const CONTROL_WEIGHT := {
	"blinded_spell": 1.0, "blinded_long": 1.3, "laughing": 1.5, "entangled": 0.9, "webbed": 0.9, "ensnared": 0.9,
	"outlined": 0.5, "bane": 0.4, "mocked": 0.25, "enfeebled": 0.6, "charmed_by": 0.4, "suggested": 1.4,
	"frightened_spell": 0.6, "poisoned_spell": 0.3, "no_reactions": 0.1, "mind_spiked": 0.05, "no_heal": 0.05,
	"outlined_wisp": 0.0,
}

func _init(battle: Battle) -> void:
	b = battle

# ================================================================== consulta

func spell_cells(sp: Dictionary, c: Creature = null, meta := "") -> int:
	var r: int = int(sp.get("range", 0))
	if c != null and sp.get("special_hit", "") == "eldritch_blast" and c.has_trait("eldritch_spear"):
		r = 300
	if meta == "distant":
		r = 30 if r == 5 else r * 2
	if r <= 5:
		return 1 if r == 5 else 0
	return int(r / 5)

func cantrip_mult(c: Creature) -> int:
	if c.level >= 17: return 4
	if c.level >= 11: return 3
	if c.level >= 5: return 2
	return 1

## Conjuro padre de una acción derivada (Lanzar llama -> Crear llama).
func parent_of(sid: String) -> String:
	var sp := RulesDB.spell(sid)
	return str(sp.get("requires_effect", sid))

## Lista de conjuros utilizables ahora mismo (para la interfaz y la IA).
func available(c: Creature) -> Array:
	var out: Array = []
	var ids: Array = c.known_spells()
	# Acciones derivadas de efectos activos (Lanzar llama, Tajo de fuego, Exhalar aliento)
	for sid in RulesDB.spells.keys():
		var dsp: Dictionary = RulesDB.spells[sid]
		if dsp.get("hidden", false) and c.has_effect(str(dsp.get("requires_effect", ""))):
			ids.append(sid)
	for sid in ids:
		var sp := RulesDB.spell(sid)
		if sp.is_empty() or sp.get("utility", false) or sp.cast in ["reaction", "rider"]:
			continue
		if sid == "mage_armor" and not sid in c.at_will:
			continue
		var entry := {"id": sid, "name": sp.name, "level": int(sp.level), "cost": sp.cast, "desc": sp.get("desc", ""),
			"target": sp.target, "usable": true, "reason": "", "slots": [], "free": false, "at_will": sid in c.at_will,
			"concentration": sp.get("concentration", false), "derived": sp.get("hidden", false)}
		var lvl: int = sp.level
		if lvl > 0 and not sid in c.at_will:
			if c.free_casts.get(sid, 0) > 0:
				entry.free = true
				entry.slots.append(lvl)
			for i in range(lvl - 1, c.slots.size()):
				if c.slots[i] > 0 and not (i + 1) in entry.slots:
					entry.slots.append(i + 1)
			if entry.slots.is_empty():
				entry.usable = false
				entry.reason = "Sin espacios de conjuro"
			elif c.turn.get("slot_spell_cast", false) and not entry.free:
				entry.usable = false
				entry.reason = "Ya gastaste un espacio este turno"
		elif lvl > 0:
			entry.slots.append(lvl)
		if not sp.get("hidden", false) and (c.is_raging() or not c.form.is_empty()):
			entry.usable = false
			entry.reason = "No puedes lanzar conjuros ahora"
		elif sp.cast == "action" and (c.turn.action <= 0 and c.turn.attack_left <= 0):
			entry.usable = false
			entry.reason = "Sin acción"
		elif sp.cast == "action" and c.turn.attack_left > 0 and c.turn.action <= 0:
			entry.usable = false
			entry.reason = "Ya has usado la acción para atacar"
		elif sp.cast == "bonus" and c.turn.bonus <= 0:
			entry.usable = false
			entry.reason = "Sin acción adicional"
		if entry.usable and not _has_any_target(c, sid):
			entry.usable = false
			entry.reason = "Sin objetivos válidos"
		out.append(entry)
	out.sort_custom(func(x, y): return x.level < y.level if x.level != y.level else x.name < y.name)
	return out

func _has_any_target(c: Creature, sid: String) -> bool:
	var sp := RulesDB.spell(sid)
	match sp.target:
		"point", "direction", "cell", "self":
			return true
	return not valid_targets(c, sid).is_empty()

## Criaturas válidas como objetivo de un conjuro.
func valid_targets(c: Creature, sid: String, from_cell = null, meta := "") -> Array:
	var sp := RulesDB.spell(sid)
	var fc: Vector2i = c.cell if from_cell == null else from_cell
	var rng := spell_cells(sp, c, meta)
	var out: Array = []
	var tt: String = sp.target
	if tt == "weapon":
		for o in b.enemies_of(c):
			if o.is_active() and not _weapon_profile_for(c, o, fc).is_empty() and b.sees(c, o, fc) and b.may_target(c, o):
				out.append(o)
		return out
	for o in b.creatures:
		if o.dead:
			continue
		var d := BattleMap.dist(fc, o.cell)
		if d > max(rng, 0):
			if not (tt == "self" and o == c):
				continue
		match tt:
			"enemy", "darts", "rays", "enemies":
				if o.team == c.team or not o.is_active() or not b.sees(c, o, fc) or not b.may_target(c, o):
					continue
				if sp.get("no_beasts", false) and o.ctype == "beast":
					continue
			"enemy_humanoid":
				if o.team == c.team or not o.is_active() or o.ctype != "humanoid" or not b.sees(c, o, fc) or not b.may_target(c, o):
					continue
			"ally", "allies":
				if o.team != c.team:
					continue
			"ally_other":
				if o.team != c.team or o == c:
					continue
			"creature":
				if not o.is_active():
					continue
				if o.team != c.team and (not b.sees(c, o, fc) or not b.may_target(c, o)):
					continue
			"downed_ally":
				if o.team != c.team or not o.is_down() or o.stable:
					continue
			"ally_unarmored":
				if o.team != c.team or not o.armor_id.is_empty():
					continue
			"self":
				if o != c:
					continue
			_:
				continue
		if o != c and d > 1 and b.map.cover_between(fc, o.cell) >= 3:
			continue
		out.append(o)
	return out

func _weapon_profile_for(c: Creature, t: Creature, fc: Vector2i) -> Dictionary:
	var best := {}
	var best_v := -1.0
	for p in b.attack_profiles(c):
		if not b.in_attack_range(c, p, t, fc) or b.map.cover_between(fc, t.cell) >= 3:
			continue
		var v := Dice.average(p.die) + (2.0 if p.kind == "melee" else 0.0)
		if v > best_v:
			best_v = v
			best = p
	return best

func _area_radius(sp: Dictionary, slot: int) -> int:
	var area: Dictionary = sp.get("area", {})
	var r := int(area.get("radius", 5))
	if sp.has("upcast_radius") and slot > int(sp.level):
		r += int(sp.upcast_radius) * (slot - int(sp.level))
	return r

## Casillas afectadas por un conjuro de área.
func area_cells(c: Creature, sid: String, data: Dictionary, from_cell = null, slot := -1) -> Array:
	var sp := RulesDB.spell(sid)
	var area: Dictionary = sp.get("area", {})
	var fc: Vector2i = c.cell if from_cell == null else from_cell
	if area.is_empty():
		return []
	if slot < 0:
		slot = int(data.get("slot", sp.get("level", 0)))
	match area.shape:
		"sphere":
			var corner: Vector2 = data.get("point", BattleMap.center(fc))
			return b.map.sphere_cells(corner, _area_radius(sp, slot))
		"square":
			var corner2: Vector2 = data.get("point", BattleMap.center(fc))
			return b.map.square_cells(corner2, int(area.size))
		"cone":
			return b.map.cone_cells(fc, data.get("dir", BattleMap.center(fc) + Vector2(0, 1)), int(area.length))
		"cube":
			return b.map.cube_from_self(fc, data.get("dir", BattleMap.center(fc) + Vector2(0, 1)), int(area.size))
		"line":
			return b.map.line_cells(fc, data.get("dir", BattleMap.center(fc) + Vector2(0, 1)), int(area.length))
		"emanation":
			return b.map.emanation_cells(fc, int(area.radius))
	return []

func creatures_in(cells: Array, exclude: Creature = null) -> Array:
	var out: Array = []
	for o in b.creatures:
		if o.dead or o == exclude:
			continue
		if o.cell in cells:
			out.append(o)
	return out

func point_in_range(c: Creature, sid: String, point: Vector2, from_cell = null, meta := "") -> bool:
	var sp := RulesDB.spell(sid)
	var fc: Vector2i = c.cell if from_cell == null else from_cell
	var center := BattleMap.cell_at(point)
	var d := BattleMap.dist(fc, center)
	return d <= spell_cells(sp, c, meta) and (center == fc or b.map.has_los(fc, center))

## Criaturas afectadas por el área (respetando «solo enemigos» y el propio lanzador).
func area_targets(c: Creature, sid: String, data: Dictionary, from_cell = null, slot := -1) -> Array:
	var sp := RulesDB.spell(sid)
	var cells := area_cells(c, sid, data, from_cell, slot)
	var exclude: Creature = c
	var targets := creatures_in(cells, exclude)
	if sp.get("only_enemies", false):
		targets = targets.filter(func(o): return o.team != c.team)
	return targets

# ================================================================== previsión

func damage_type(c: Creature, sp: Dictionary, t: Creature, data: Dictionary) -> String:
	var dmg: Dictionary = sp.get("damage", {})
	var dtype: String = str(dmg.get("type", ""))
	if data.has("dtype"):
		return str(data.dtype)
	var choices: Array = sp.get("damage_choice", [])
	if data.get("meta", "") == "transmuted":
		choices = TRANSMUTE_TYPES
	if not choices.is_empty() and t != null:
		var best := dtype if dtype in choices else str(choices[0])
		for ch in choices:
			if b.damage_multiplier(t, ch) > b.damage_multiplier(t, best):
				best = ch
		return best
	return dtype

func damage_expr(c: Creature, sp: Dictionary, slot: int) -> String:
	var dmg: Dictionary = sp.get("damage", {})
	if dmg.is_empty():
		return ""
	var expr: String = dmg.dice
	# Acciones derivadas cuyo daño fijó el conjuro original
	var req: String = str(sp.get("requires_effect", ""))
	if not req.is_empty():
		var fe := c.get_effect(req)
		if fe != null and fe.data.has("dice"):
			expr = str(fe.data.dice)
	if int(sp.level) == 0 and req.is_empty():
		var mult := cantrip_mult(c)
		if mult > 1 and not sp.get("cantrip_beams", false):
			expr = Dice.add_dice(expr, Dice.parse(expr).count * (mult - 1))
	elif sp.has("upcast_dice") and slot > int(sp.level) and int(sp.level) > 0:
		var extra = Dice.parse(sp.upcast_dice).count * (slot - int(sp.level))
		expr = Dice.add_dice(expr, extra)
	if dmg.get("mod", false):
		var parent := req if not req.is_empty() else ""
		expr = Dice.with_bonus(expr, c.spell_mod(parent))
	if sp.get("special_hit", "") == "eldritch_blast" and c.has_trait("agonizing_blast"):
		expr = Dice.with_bonus(expr, max(0, c.mod("cha")))
	return expr

func heal_expr(c: Creature, sp: Dictionary, slot: int, sid := "") -> String:
	var h: Dictionary = sp.get("heal", {})
	var expr: String = h.get("dice", "0")
	if sp.has("upcast_heal") and slot > int(sp.level):
		expr = Dice.add_dice(expr, Dice.parse(sp.upcast_heal).count * (slot - int(sp.level)))
	var bonus := 0
	if h.get("mod", false):
		bonus += c.spell_mod(sid)
	if slot > 0 and c.has_trait("disciple_of_life"):
		bonus += 2 + slot
	return Dice.with_bonus(expr, bonus)

func save_dc(c: Creature, sid: String) -> int:
	var req := parent_of(sid)
	var fe := c.get_effect(req) if req != sid else null
	if fe != null and fe.data.has("dc"):
		return int(fe.data.dc)
	return c.spell_save_dc(req)

func attack_bonus(c: Creature, sid: String) -> int:
	return c.spell_attack_bonus(parent_of(sid))

func max_targets(sp: Dictionary, slot: int, meta := "") -> int:
	var max_t := int(sp.get("max_targets", 1))
	var eff := slot + (1 if meta == "twinned" else 0)
	if sp.has("upcast_targets") and eff > int(sp.level):
		max_t += int(sp.upcast_targets) * (eff - int(sp.level))
	return max_t

func n_darts(c: Creature, sp: Dictionary, slot: int) -> int:
	if sp.get("cantrip_beams", false):
		return cantrip_mult(c)
	return int(sp.get("darts", 1)) + int(sp.get("upcast_darts", 0)) * max(0, slot - int(sp.level))

## Estimación para la interfaz y la IA: daño esperado a enemigos, a aliados, curación y control.
func preview(c: Creature, sid: String, slot: int, data: Dictionary, from_cell = null) -> Dictionary:
	var sp := RulesDB.spell(sid)
	var fc: Vector2i = c.cell if from_cell == null else from_cell
	var res := {"enemy_dmg": 0.0, "ally_dmg": 0.0, "heal": 0.0, "affected": [], "control": 0.0, "kills": 0.0}
	var dexpr := damage_expr(c, sp, slot)
	var avg := Dice.average(dexpr) if not dexpr.is_empty() else 0.0
	if sid == "toll_the_dead":
		avg = 0.0
	var targets: Array = []
	if sp.has("area"):
		targets = area_targets(c, sid, data, fc, slot)
	elif sp.target == "weapon":
		for tid in data.get("targets", []):
			var tw := b.get_creature(tid)
			if tw != null:
				var p := true_strike_profile(c, tw, fc)
				if not p.is_empty():
					var pv := b.preview_attack(c, p, tw, fc)
					res.enemy_dmg += pv.expected
					if pv.avg >= tw.hp:
						res.kills += pv.p_hit
					res.affected.append({"id": tw.id, "expected": pv.expected, "p": pv.p_hit, "team": tw.team})
		return res
	else:
		for tid in data.get("targets", []):
			var t := b.get_creature(tid)
			if t != null:
				targets.append(t)
	var dc := save_dc(c, sid)
	var careful_left = max(1, c.mod("cha")) if data.get("meta", "") == "careful" else 0
	for t in targets:
		var exp := 0.0
		var p_effect := 1.0
		var t_avg := avg
		if sid == "toll_the_dead":
			t_avg = Dice.average(str(sp.wounded_dice) if t.hp < t.max_hp else str(sp.damage.dice))
		var dtype := damage_type(c, sp, t, data)
		if sp.has("attack"):
			var mi := b.attack_mode(c, t, sp.attack, fc, {"spell": sid})
			var ac = t.ac() + (BattleMap.cover_ac_bonus(b.map.cover_between(fc, t.cell, b.blockers_for(c, t))))
			p_effect = Dice.p_success(attack_bonus(c, sid), ac, mi.mode)
			if data.get("meta", "") == "seeking":
				p_effect = 1.0 - (1.0 - p_effect) * (1.0 - p_effect)
			exp = p_effect * t_avg
			if sp.get("miss_half", false):
				exp += (1.0 - p_effect) * t_avg * 0.5
			if int(sp.level) == 0 and c.has_trait("potent_cantrip"):
				exp += (1.0 - p_effect) * t_avg * 0.5
			if sid == "ice_knife":
				var burst: Dictionary = sp.burst
				var bexpr := str(burst.dice)
				if slot > 1:
					bexpr = Dice.add_dice(bexpr, Dice.parse(str(burst.upcast)).count * (slot - 1))
				var pf_b := 1.0 - Dice.p_success(t.save_bonus("dex"), dc, 0, 21, false)
				exp += pf_b * Dice.average(bexpr) * b.damage_multiplier(t, "cold")
		elif sp.has("save"):
			var sv: Dictionary = sp.save
			if sv.get("enemies_only", false) and t.team == c.team:
				p_effect = 1.0
			else:
				var mode := 0
				if sv.get("hostile_adv", false):
					mode = 1
				if sv.get("ability", "") == "dex" and t.has_trait("danger_sense"):
					mode = 1
				var p_save := Dice.p_success(t.save_bonus(sv.ability), dc, mode, 21, false)
				if sv.ability in ["str", "dex"] and (t.has_condition("paralyzed") or t.has_condition("unconscious")):
					p_save = 0.0
				if t.team == c.team and careful_left > 0:
					p_save = 1.0
					careful_left -= 1
				p_effect = 1.0 - p_save
				if sid == "sleep" and (t.ctype == "undead" or "exhaustion" in t.condition_immune or t.has_trait("trance")):
					p_effect = 0.0
				if sid == "hold_person" and t.ctype != "humanoid":
					p_effect = 0.0
				exp = p_effect * t_avg + (p_save * t_avg * 0.5 if sv.get("half", false) else 0.0)
				if int(sp.level) == 0 and c.has_trait("potent_cantrip") and not sv.get("half", false):
					exp += p_save * t_avg * 0.5
		elif sid == "magic_missile":
			exp = t_avg * data.get("targets", []).count(t.id)
		else:
			exp = t_avg
		if sp.target in ["rays", "darts"] and sid != "magic_missile":
			exp *= data.get("targets", []).count(t.id)
		exp = exp * b.damage_multiplier(t, dtype) if not dtype.is_empty() else exp
		if t.team != c.team:
			res.enemy_dmg += exp
			if exp >= t.hp:
				res.kills += p_effect
			var w := _control_weight(sp)
			if w > 0.0 or "control" in sp.get("tags", []):
				res.control += p_effect * max(w, 0.6) * (1.0 + min(t.hp, 40) / 10.0)
		else:
			res.ally_dmg += exp
			if sp.has("on_fail_effect") and not sp.get("only_enemies", false):
				res.control -= p_effect * _control_weight(sp) * 2.0
		res.affected.append({"id": t.id, "expected": exp, "p": p_effect, "team": t.team})
	if sp.has("heal"):
		var hexpr := heal_expr(c, sp, slot, sid)
		for tid in data.get("targets", []):
			var t2 := b.get_creature(tid)
			if t2:
				res.heal += min(Dice.average(hexpr), t2.max_hp - t2.hp)
	return res

func _control_weight(sp: Dictionary) -> float:
	var spec: Dictionary = sp.get("on_fail_effect", sp.get("on_hit_effect", {}))
	if not spec.is_empty():
		return float(CONTROL_WEIGHT.get(str(spec.get("kind", "")), 0.3))
	match sp.get("on_fail", ""):
		"prone":
			return 0.4
		"flee_reaction":
			return 0.3
		"push10":
			return 0.15
	return 0.0

# ================================================================== tiradas de daño

## Tira daño de conjuro (crítico, Conjuro potenciado y dados que explotan).
func roll_damage(c: Creature, sp: Dictionary, expr: String, crit := false, data := {}) -> int:
	var r := b.dice.roll(expr, crit)
	var rolls: Array = r.rolls.duplicate()
	var p := Dice.parse(expr)
	if data.get("meta", "") == "empowered" and p.sides > 0:
		var n = max(1, c.mod("cha"))
		var idx: Array = range(rolls.size())
		idx.sort_custom(func(x, y): return rolls[x] < rolls[y])
		for i in idx:
			if n <= 0:
				break
			if float(rolls[i]) < (p.sides + 1) / 2.0:
				rolls[i] = b.dice.die(p.sides)
				n -= 1
	var total: int = int(p.bonus)
	for v in rolls:
		total += int(v)
	if sp.get("exploding", false) and p.sides > 0:
		var extra_left = max(0, c.spell_mod())
		for v in rolls:
			if extra_left <= 0:
				break
			if int(v) == p.sides:
				total += b.dice.die(p.sides)
				extra_left -= 1
	return total

# ================================================================== lanzamiento

func _slot_cost_ok(c: Creature, sid: String, sp: Dictionary, slot: int) -> Dictionary:
	var lvl: int = sp.level
	if lvl == 0 or sid in c.at_will:
		return {"ok": true, "free": false, "slot": slot if lvl > 0 else 0}
	if c.free_casts.get(sid, 0) > 0 and slot <= lvl:
		return {"ok": true, "free": true, "slot": lvl}
	if slot < lvl:
		slot = lvl
	if slot - 1 >= c.slots.size() or c.slots[slot - 1] <= 0:
		return {"ok": false}
	if c.turn.get("slot_spell_cast", false):
		return {"ok": false}
	return {"ok": true, "free": false, "slot": slot}

## Lanza un conjuro. data: {targets:[ids], point:Vector2, dir:Vector2, cell:Vector2i, cmd, dtype, meta}
func cast(c: Creature, sid: String, slot: int, data: Dictionary) -> bool:
	var sp := RulesDB.spell(sid)
	if sp.is_empty() or not c.can_act():
		return false
	if sp.get("hidden", false):
		if not c.has_effect(str(sp.get("requires_effect", ""))):
			return false
	elif c.is_raging() or not c.form.is_empty():
		return false
	var lvl: int = sp.level
	var item_id: String = data.get("item", "")
	var pay := _slot_cost_ok(c, sid, sp, slot) if item_id.is_empty() else item_cost(c, item_id, sid, slot)
	if not pay.ok:
		return false
	slot = int(pay.slot)
	# Metamagia
	var meta: String = data.get("meta", "")
	if not meta.is_empty():
		if not meta in c.metamagic or c.resources.get("sorcery_points", 0) < int(META_COST.get(meta, 99)):
			meta = ""
			data.erase("meta")
	if not _validate(c, sid, slot, data):
		return false
	var cost := "bonus" if sp.cast == "bonus" else "action"
	if meta == "quickened" and cost == "action":
		cost = "bonus"
	if not b._spend(c, cost):
		return false
	if not meta.is_empty():
		c.resources.sorcery_points -= int(META_COST[meta])
		b.emit({"t": "feature", "who": c.id, "feature": "metamagic", "name": RulesDB.feature_name(meta)})
		b.log_msg(Loc.t("log.metamagic", {"who": b.nm(c), "meta": RulesDB.feature_name(meta)}))
	if pay.get("item", false):
		# Pergamino (se consume) o varita (gasta cargas)
		var idata := Items.data(item_id)
		if idata.get("kind", "") == "scroll":
			c.items[item_id] = int(c.items.get(item_id, 0)) - 1
			if int(c.items[item_id]) <= 0:
				c.items.erase(item_id)
		else:
			c.item_charges[item_id] = int(c.item_charges.get(item_id, 0)) - int(pay.charges)
		c.item_cast = {"spell": sid}
		if idata.has("dc"):
			c.item_cast["dc"] = int(idata.dc)
		if idata.has("atk"):
			c.item_cast["atk"] = int(idata.atk)
		b.emit({"t": "item", "who": c.id, "target": c.id, "item": item_id})
	elif lvl > 0 and not sid in c.at_will:
		if pay.free:
			c.free_casts[sid] -= 1
		else:
			c.slots[slot - 1] -= 1
			c.turn.slot_spell_cast = true
	# Santuario e invisibilidad terminan si el protegido lanza un conjuro
	var sanct := c.get_effect("sanctuary")
	if sanct != null:
		b._remove_effect(sanct)
	var inv := c.get_effect("invisible_spell")
	if inv != null:
		b._remove_effect(inv)
	b._reveal(c)
	c.turn.rage_extended = true
	data["slot"] = slot
	var ev := {"t": "cast", "who": c.id, "spell": sid, "name": sp.name, "slot": slot, "targets": data.get("targets", []).duplicate(),
		"point": data.get("point", null), "dir": data.get("dir", null), "cell": data.get("cell", null), "cells": [], "fx": sp.get("fx", "")}
	if sp.has("area"):
		ev.cells = area_cells(c, sid, data, null, slot)
	if not sp.get("damage_choice", []).is_empty() or meta == "transmuted":
		var t0 := b.get_creature(data.get("targets", [""])[0]) if data.get("targets", []).size() > 0 else null
		ev["dtype"] = damage_type(c, sp, t0, data)
	b.emit(ev)
	if lvl > 0 and slot > lvl:
		b.log_msg(Loc.t("log.cast_slot", {"who": b.nm(c), "spell": sp.name, "slot": slot}))
	else:
		b.log_msg(Loc.t("log.cast", {"who": b.nm(c), "spell": sp.name}))
	if sp.get("concentration", false):
		var rounds := int(sp.get("duration", 10))
		if meta == "extended":
			rounds *= 2
		b.start_concentration(c, sid, rounds)
		if meta == "extended":
			var xc := Effect.new("extended_conc")
			xc.source = c
			b._attach_effect(c, xc)
			b.link_to_concentration(c, xc)
	_resolve(c, sid, sp, slot, data)
	c.item_cast = {}
	b._check_end()
	return true

## Coste de lanzar un conjuro desde un objeto: pergamino (nivel fijo) o varita (cargas).
func item_cost(c: Creature, item_id: String, sid: String, slot: int) -> Dictionary:
	var d := Items.data(item_id)
	if str(d.get("spell", "")) != sid:
		return {"ok": false}
	var lvl := int(RulesDB.spell(sid).get("level", 1))
	match str(d.get("kind", "")):
		"scroll":
			if int(c.items.get(item_id, 0)) <= 0:
				return {"ok": false}
			return {"ok": true, "free": true, "item": true, "slot": int(d.get("level", lvl)), "charges": 0}
		"wand":
			var s: int = clamp(slot, lvl, 3) if sid == "magic_missile" else lvl
			var cost: int = s if sid == "magic_missile" else 1
			if int(c.item_charges.get(item_id, 0)) < cost:
				return {"ok": false}
			return {"ok": true, "free": true, "item": true, "slot": s, "charges": cost}
	return {"ok": false}

## Reacciones con conjuro (Reprensión infernal).
func cast_reaction(c: Creature, sid: String, target: Creature) -> bool:
	var sp := RulesDB.spell(sid)
	if not c.can_react() or target == null or target.dead:
		return false
	var lvl := int(sp.level)
	var slot := lvl
	if c.free_casts.get(sid, 0) > 0:
		c.free_casts[sid] -= 1
	else:
		slot = c.lowest_slot(lvl)
		if slot <= 0:
			return false
		c.slots[slot - 1] -= 1
	c.turn.reaction = 0
	b.emit({"t": "reaction", "who": c.id, "name": sp.name, "spell": sid, "target": target.id})
	b.emit({"t": "cast", "who": c.id, "spell": sid, "name": sp.name, "slot": slot, "targets": [target.id], "cells": [], "fx": sp.get("fx", "")})
	b.log_msg(Loc.t("log.cast", {"who": b.nm(c), "spell": sp.name}))
	_single_save(c, target, sid, sp, slot, {})
	return true

func _validate(c: Creature, sid: String, slot: int, data: Dictionary) -> bool:
	var sp := RulesDB.spell(sid)
	var tt: String = sp.target
	var meta: String = data.get("meta", "")
	match tt:
		"point":
			return data.has("point") and point_in_range(c, sid, data.point, null, meta)
		"direction":
			return data.has("dir")
		"cell":
			var cell: Vector2i = data.get("cell", Vector2i(-99, -99))
			if not b.map.in_bounds(cell) or BattleMap.dist(c.cell, cell) > spell_cells(sp, c, meta):
				return false
			if not b.map.has_los(c.cell, cell):
				return false
			if sid in ["misty_step", "flaming_sphere"]:
				return b.map.walkable(cell) and b.creature_at(cell) == null
			return true
		"self":
			return true
	var valid := valid_targets(c, sid, null, meta)
	var ids: Array = data.get("targets", [])
	if ids.is_empty():
		return false
	if tt in ["darts", "rays"]:
		if ids.size() != n_darts(c, sp, slot):
			return false
	elif ids.size() > max_targets(sp, slot, meta):
		return false
	for tid in ids:
		var t := b.get_creature(tid)
		if t == null or not t in valid:
			return false
	return true

# ================================================================== resolución

func _resolve(c: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary) -> void:
	var special: String = sp.get("special", "")
	var ids: Array = data.get("targets", [])
	if not special.is_empty() and _special(c, sid, sp, slot, data, special):
		return
	# --- Genéricos
	if sp.has("self_effect"):
		var spec: Dictionary = sp.self_effect.duplicate(true)
		if data.get("meta", "") == "extended" and spec.has("rounds"):
			spec.rounds = int(spec.rounds) * 2
		b.apply_effect_spec(c, spec, c, sid, slot)
		return
	if sp.has("target_effect"):
		for tid in ids:
			var tt := b.get_creature(tid)
			var e := b.apply_effect_spec(tt, sp.target_effect, c, sid, slot)
			if e != null and e.kind == "heroism":
				e.data["temp"] = max(1, c.spell_mod(sid))
				b.gain_temp_hp(tt, int(e.data.temp))
		return
	if sp.has("temp_hp"):
		var th: Dictionary = sp.temp_hp
		var amt = b.dice.roll(str(th.dice)).total + int(sp.get("upcast_temp", 0)) * max(0, slot - int(sp.level))
		if sid == "false_life" and sid in c.at_will and c.has_trait("fiendish_vigor"):
			amt = Dice.max_value(str(th.dice))
		b.gain_temp_hp(c, amt)
		return
	if sp.has("heal"):
		var hexpr := heal_expr(c, sp, slot, sid)
		for tid in ids:
			var th2 := b.get_creature(tid)
			b.heal(th2, b.dice.roll(hexpr).total, c)
		return
	if sp.target == "darts":
		_magic_missile(c, sp, slot, ids)
		return
	if sp.target == "rays":
		for tid in ids:
			var tr := b.get_creature(tid)
			if tr == null or tr.dead:
				continue
			_spell_attack(c, tr, sid, sp, slot, data)
		return
	if sp.has("area"):
		_area(c, sid, sp, slot, data)
		return
	var first := true
	for tid in ids:
		var t := b.get_creature(tid)
		if t == null or t.dead:
			continue
		if sp.has("attack"):
			_spell_attack(c, t, sid, sp, slot, data)
		elif sp.has("save"):
			var d2 := data.duplicate()
			d2["heighten"] = first and data.get("meta", "") == "heightened"
			_single_save(c, t, sid, sp, slot, d2)
		first = false

## Conjuros con lógica propia. Devuelve true si ya está resuelto.
func _special(c: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary, special: String) -> bool:
	var ids: Array = data.get("targets", [])
	match special:
		"stabilize":
			for tid in ids:
				b.stabilize(b.get_creature(tid))
		"sleep":
			_sleep(c, sp, data)
		"bless":
			for tid in ids:
				var t := b.get_creature(tid)
				var e := Effect.new("bless")
				e.name = sp.name
				e.source = c
				e.positive = true
				e.spell_id = sid
				b._attach_effect(t, e)
				b.link_to_concentration(c, e)
		"shield_of_faith":
			var t2 := b.get_creature(ids[0])
			var e2 := Effect.new("shield_of_faith")
			e2.name = sp.name
			e2.source = c
			e2.positive = true
			b._attach_effect(t2, e2)
			b.link_to_concentration(c, e2)
		"sanctuary":
			var t3 := b.get_creature(ids[0])
			var e3 := Effect.new("sanctuary")
			e3.name = sp.name
			e3.source = c
			e3.positive = true
			e3.rounds_left = int(sp.get("duration", 10))
			e3.data = {"dc": c.spell_save_dc(sid)}
			b._attach_effect(t3, e3)
		"command":
			for tid in ids:
				var t4 := b.get_creature(tid)
				var r := b.saving_throw(t4, "wis", c.spell_save_dc(sid), c, {"disadvantage": data.get("meta", "") == "heightened" and tid == ids[0]})
				if not r.success:
					var e4 := Effect.new("command")
					e4.name = sp.name
					e4.source = c
					e4.data = {"cmd": data.get("cmd", "grovel")}
					b._attach_effect(t4, e4)
		"hold_person":
			for tid in ids:
				var t5 := b.get_creature(tid)
				if t5.ctype != "humanoid":
					continue
				var r5 := b.saving_throw(t5, "wis", c.spell_save_dc(sid), c, {"disadvantage": data.get("meta", "") == "heightened" and tid == ids[0]})
				if not r5.success:
					var e5 := Effect.new("hold_person")
					e5.name = sp.name
					e5.source = c
					e5.grants = ["paralyzed"]
					e5.data = {"dc": c.spell_save_dc(sid)}
					b._attach_effect(t5, e5)
					b.link_to_concentration(c, e5)
			if c.concentration != null and c.concentration.data.linked.filter(func(x): return x.kind == "hold_person").is_empty() and c.concentration_spell == sid:
				b.end_concentration(c)
		"aid":
			var amount := 5 * (slot - 1)
			for tid in ids:
				var t6 := b.get_creature(tid)
				var e6 := Effect.new("aid")
				e6.name = sp.name
				e6.source = c
				e6.positive = true
				e6.data = {"amount": amount}
				b._attach_effect(t6, e6)
				t6.max_hp += amount
				b.emit({"t": "max_hp", "who": t6.id, "max": t6.max_hp, "hp": t6.hp})
				b.heal(t6, amount, c)
		"lesser_restoration":
			var t7 := b.get_creature(ids[0])
			for cond in ["paralyzed", "poisoned", "blinded", "deafened"]:
				for e7 in t7.effects.duplicate():
					if cond in e7.grants:
						b._remove_effect(e7)
				b._remove_condition(t7, cond)
		"teleport":
			b.teleport(c, data.cell)
		"spiritual_weapon":
			_spiritual_weapon(c, sp, slot, data)
		"flaming_sphere":
			_flaming_sphere(c, sid, sp, slot, data)
		"mage_armor":
			var t8 := b.get_creature(ids[0]) if ids.size() > 0 else c
			var e8 := Effect.new("mage_armor")
			e8.name = sp.name
			e8.source = c
			e8.positive = true
			b._attach_effect(t8, e8)
		"produce_flame":
			_self_marker(c, "produce_flame", "Llama en la mano", 100, {})
		"shillelagh":
			_self_marker(c, "shillelagh", "Garrote", 10, {})
		"flame_blade":
			var fdice := Dice.add_dice("3d6", max(0, slot - 2))
			var fe := _self_marker(c, "flame_blade", "Hoja de fuego", -1, {"dice": fdice})
			b.link_to_concentration(c, fe)
		"expeditious_retreat":
			var ee := _self_marker(c, "exp_retreat", "Retirada expeditiva", -1, {})
			b.link_to_concentration(c, ee)
			c.turn.movement += c.speed()
			b.emit({"t": "dash", "who": c.id})
		"dragons_breath":
			var tdb := b.get_creature(ids[0]) if ids.size() > 0 else c
			var dtype: String = data.get("dtype", "fire")
			if not dtype in sp.get("damage_choice", []):
				dtype = "fire"
			var edb := Effect.new("dragons_breath")
			edb.name = "Aliento de dragón"
			edb.source = c
			edb.positive = true
			edb.data = {"dice": Dice.add_dice("3d6", max(0, slot - 2)), "dtype": dtype, "dc": c.spell_save_dc(sid)}
			b._attach_effect(tdb, edb)
			b.link_to_concentration(c, edb)
		"armor_of_agathys":
			var amt = 5 * max(1, slot)
			b.gain_temp_hp(c, amt)
			var old := c.get_effect("agathys")
			if old != null:
				b._remove_effect(old)
			var ea := Effect.new("agathys")
			ea.name = "Armadura de Agathys"
			ea.source = c
			ea.positive = true
			ea.data = {"dmg": amt}
			b._attach_effect(c, ea)
		"mark":
			var tm := b.get_creature(ids[0])
			var em := Effect.new(str(sp.mark_kind))
			em.name = sp.name
			em.source = c
			em.data = {"damage": sp.get("mark_damage", {"dice": "1d6", "type": "force"})}
			b._attach_effect(tm, em)
			b.link_to_concentration(c, em)
		"enlarge_reduce":
			var te := b.get_creature(ids[0])
			if te.team == c.team:
				var en := Effect.new("enlarged")
				en.name = "Agrandado"
				en.source = c
				en.positive = true
				b._attach_effect(te, en)
				b.link_to_concentration(c, en)
				b.emit({"t": "resize", "who": te.id})
			else:
				var rr := b.saving_throw(te, "con", c.spell_save_dc(sid), c, {"disadvantage": data.get("meta", "") == "heightened"})
				if not rr.success:
					var rd := Effect.new("reduced")
					rd.name = "Reducido"
					rd.source = c
					b._attach_effect(te, rd)
					b.link_to_concentration(c, rd)
					b.emit({"t": "resize", "who": te.id})
				else:
					b.end_concentration(c)
		"true_strike":
			var tt := b.get_creature(ids[0])
			var p := true_strike_profile(c, tt)
			if p.is_empty():
				return true
			b._resolve_weapon_attack(c, p, tt, {"free": true, "true_strike": true})
		_:
			return false
	return true

func _self_marker(c: Creature, kind: String, name: String, rounds: int, data: Dictionary) -> Effect:
	var old := c.get_effect(kind)
	if old != null:
		b._remove_effect(old)
	var e := Effect.new(kind)
	e.name = name
	e.source = c
	e.positive = true
	e.rounds_left = rounds
	e.data = data
	b._attach_effect(c, e)
	return e

## Perfil de arma para Golpe certero: usa la característica mágica y puede ser radiante.
func true_strike_profile(c: Creature, t: Creature, from_cell = null) -> Dictionary:
	var fc: Vector2i = c.cell if from_cell == null else from_cell
	var base := _weapon_profile_for(c, t, fc)
	if base.is_empty():
		return {}
	var p: Dictionary = base.duplicate(true)
	var m := c.spell_mod("true_strike")
	var magic := 0
	var mw := c.get_effect("magic_weapon")
	if mw != null:
		magic = int(mw.data.get("bonus", 1))
	p.bonus = m + (c.prof_bonus if c.is_proficient(p.weapon) else 0) + magic
	var wtype: String = p.damage[0].type
	var dtype := "radiant" if b.damage_multiplier(t, "radiant") > b.damage_multiplier(t, wtype) else wtype
	p.damage = [{"dice": Dice.with_bonus(str(p.die), m + magic), "type": dtype}]
	p.ability_mod = m
	p.ability = c.spell_ability_for("true_strike")
	p.str_based = false
	p.name = "Golpe certero"
	p.spell_like = true
	return p

# ================================================================== ataques de conjuro

func _spell_attack(c: Creature, t: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary) -> void:
	var kind: String = sp.attack
	var mi := b.attack_mode(c, t, kind, null, {"spell": parent_of(sid)})
	b._consume_attack_effects(c, t, mi)
	var r := b.dice.d20(mi.mode, c.has_trait("luck"))
	var nat: int = r.natural
	var bless := b._roll_attack_mods(c)
	var abonus := attack_bonus(c, sid)
	var total: int = nat + abonus + bless
	var ac := b.target_ac(t, c)
	var crit := nat == 20
	var hit := crit or (nat != 1 and total >= ac)
	# Conjuro certero: repite un fallo
	if not hit and data.get("meta", "") == "seeking" and not data.get("sought", false):
		data["sought"] = true
		r = b.dice.d20(mi.mode, c.has_trait("luck"))
		nat = r.natural
		total = nat + abonus + bless
		crit = nat == 20
		hit = crit or (nat != 1 and total >= ac)
	if hit and not crit:
		var cw := b._try_cutting_words(c, t, total, ac)
		if cw > 0:
			total -= cw
			hit = total >= ac
	if hit and not crit and b._try_shield(t, total, ac, Dice.average(damage_expr(c, sp, slot)) if sp.has("damage") else -1.0):
		ac += 5
		hit = total >= ac
	if hit and (t.has_condition("paralyzed") or t.has_condition("unconscious")) and BattleMap.dist(c.cell, t.cell) <= 1:
		crit = true
	var dtype := damage_type(c, sp, t, data)
	b.emit({"t": "attack", "who": c.id, "target": t.id, "name": sp.name, "kind": kind, "natural": nat, "rolls": r.rolls,
		"bonus": abonus, "bless": bless, "total": total, "ac": ac, "hit": hit, "crit": crit, "mode": mi.mode,
		"adv": mi.adv, "dis": mi.dis, "spell": true, "sid": sid, "fx": sp.get("fx", ""), "dtype": dtype})
	var args := {"who": b.nm(c), "target": b.nm(t), "weapon": sp.name.to_lower(), "total": total, "ac": ac, "nat": nat}
	if crit:
		b.log_msg(Loc.t("log.attack_crit", args))
	elif hit:
		b.log_msg(Loc.t("log.attack_hit", args))
	else:
		b.log_msg(Loc.t("log.attack_miss", args))
	var expr := damage_expr(c, sp, slot)
	if hit:
		if b._mirror_absorbs(c, t):
			_after_spell_attack(c, t, sid, sp, slot, data, false)
			return
		var amount := roll_damage(c, sp, expr, crit, data) if not expr.is_empty() else 0
		var dealt := 0
		if amount > 0:
			dealt = b.apply_damage(t, amount, dtype, c, {"crit": crit, "magic": true})
		if sp.get("special_hit", "") == "chromatic_leap" and not data.get("leapt", false):
			_chromatic_leap(c, t, sid, sp, slot, data)
		if not t.dead:
			_on_hit(c, t, sid, sp, dealt, slot)
	else:
		if sp.get("miss_half", false) and not expr.is_empty():
			var half := int(roll_damage(c, sp, expr, false, data) / 2)
			if half > 0:
				b.apply_damage(t, half, dtype, c, {"magic": true})
		elif int(sp.level) == 0 and c.has_trait("potent_cantrip") and not expr.is_empty():
			var half2 := int(b.dice.roll(expr).total / 2)
			if half2 > 0:
				b.log_msg(Loc.t("log.potent_cantrip", {"target": b.nm(t)}))
				b.apply_damage(t, half2, dtype, c, {"magic": true})
	_after_spell_attack(c, t, sid, sp, slot, data, hit)

func _after_spell_attack(c: Creature, t: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary, hit: bool) -> void:
	if sid == "ice_knife":
		_ice_knife_burst(c, t, sp, slot)

func _on_hit(c: Creature, t: Creature, sid: String, sp: Dictionary, dealt: int, slot: int) -> void:
	match sp.get("on_hit", ""):
		"slow10_caster_turn":
			var e := Effect.new("slowed_frost")
			e.name = "Escarcha"
			e.source = c
			e.expires = "start_turn"
			e.expires_who = c
			b._attach_effect(t, e)
		"no_reactions":
			var e2 := Effect.new("no_reactions")
			e2.name = "Sin reacciones"
			e2.source = c
			e2.expires = "start_turn"
			e2.expires_who = t
			b._attach_effect(t, e2)
		"guiding_bolt":
			var e3 := Effect.new("guiding_bolt")
			e3.name = "Marcado"
			e3.source = c
			e3.expires = "end_turn_next"
			e3.expires_who = c
			e3.data = {"skip_first_end": b.current == c}
			b._attach_effect(t, e3)
		"pull10":
			if t.size_rank() <= 3:
				b.pull_toward(t, c.cell, 2)
	if sp.has("on_hit_effect"):
		b.apply_effect_spec(t, sp.on_hit_effect, c, sid, slot, c.spell_save_dc(sid))
	if sp.get("special_hit", "") == "eldritch_blast" and c.has_trait("repelling_blast") and t.size_rank() <= 3 and t.is_active():
		b.push_away(t, c.cell, 2)

func _chromatic_leap(c: Creature, t: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary) -> void:
	# Salta si salieron dados repetidos (aprox.: probabilidad de pares en 3d8)
	var n = Dice.parse(damage_expr(c, sp, slot)).count
	var seen := {}
	var pair := false
	for i in n:
		var v := b.dice.die(8)
		if seen.has(v):
			pair = true
		seen[v] = true
	if not pair:
		return
	var best: Creature = null
	for e in b.enemies_of(c):
		if e != t and e.is_active() and BattleMap.dist(e.cell, t.cell) <= 6 and b.sees(c, e):
			if best == null or e.hp < best.hp:
				best = e
	if best == null:
		return
	b.log_msg(Loc.t("log.chromatic_leap", {"target": b.nm(best)}))
	var d2 := data.duplicate()
	d2["leapt"] = true
	_spell_attack(c, best, sid, sp, slot, d2)

func _ice_knife_burst(c: Creature, t: Creature, sp: Dictionary, slot: int) -> void:
	var burst: Dictionary = sp.burst
	var expr := str(burst.dice)
	if slot > 1:
		expr = Dice.add_dice(expr, Dice.parse(str(burst.upcast)).count * (slot - 1))
	var dmg = b.dice.roll(expr).total
	var cells: Array = [t.cell]
	for n in BattleMap.neighbors8(t.cell):
		cells.append(n)
	b.emit({"t": "burst", "who": c.id, "cells": cells, "fx": "frost"})
	for o in creatures_in(cells):
		if o.dead:
			continue
		var r := b.saving_throw(o, "dex", c.spell_save_dc("ice_knife"), c)
		if not r.success:
			b.apply_damage(o, dmg, "cold", c, {"magic": true})

# ================================================================== salvaciones

func _single_save(c: Creature, t: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary) -> void:
	var sv: Dictionary = sp.save
	var dc := save_dc(c, sid)
	if sv.get("enemies_only", false) and t.team == c.team:
		return
	var opts := {"disadvantage": data.get("heighten", false)}
	if sv.get("hostile_adv", false):
		opts["advantage"] = true
	if sp.has("on_fail_effect"):
		var g: Array = sp.on_fail_effect.get("grants", [])
		if "charmed" in g:
			opts["vs"] = "charmed"
		elif "frightened" in g:
			opts["vs"] = "frightened"
	var r := b.saving_throw(t, sv.ability, dc, c, opts)
	var dmg: Dictionary = sp.get("damage", {})
	if not dmg.is_empty():
		var expr := damage_expr(c, sp, slot)
		if sid == "toll_the_dead" and t.hp < t.max_hp:
			expr = Dice.add_dice(str(sp.wounded_dice), Dice.parse(str(sp.wounded_dice)).count * (cantrip_mult(c) - 1))
		var total := roll_damage(c, sp, expr, false, data)
		var dtype := damage_type(c, sp, t, data)
		if not r.success:
			b.apply_damage(t, total, dtype, c, {"magic": true})
		elif sv.get("half", false):
			b.apply_damage(t, int(total / 2), dtype, c, {"magic": true})
		elif int(sp.level) == 0 and c.has_trait("potent_cantrip"):
			b.log_msg(Loc.t("log.potent_cantrip", {"target": b.nm(t)}))
			b.apply_damage(t, int(total / 2), dtype, c, {"magic": true})
	if t.dead:
		return
	if not r.success:
		_on_fail(c, t, sid, sp, slot, dc)
	elif sp.has("on_success_effect"):
		b.apply_effect_spec(t, sp.on_success_effect, c, sid, slot, dc, false)

func _on_fail(c: Creature, t: Creature, sid: String, sp: Dictionary, slot: int, dc: int) -> void:
	if sp.has("on_fail_effect"):
		b.apply_effect_spec(t, sp.on_fail_effect, c, sid, slot, dc)
	match sp.get("on_fail", ""):
		"push10":
			if not t.dead:
				b.push_away(t, c.cell, 2)
		"prone":
			if t.is_active() and not t.has_condition("prone"):
				b._add_condition(t, "prone", sid)
		"flee_reaction":
			if t.is_active() and t.can_react():
				t.turn.reaction = 0
				b.forced_flee(t, c)

func _area(c: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary) -> void:
	var cells := area_cells(c, sid, data, null, slot)
	var targets := area_targets(c, sid, data, null, slot)
	if sp.get("exclude_caster", false):
		targets.erase(c)
	var sv: Dictionary = sp.get("save", {})
	var dmg: Dictionary = sp.get("damage", {})
	var dc := save_dc(c, sid)
	var careful_left = max(1, c.mod("cha")) if data.get("meta", "") == "careful" else 0
	var total := roll_damage(c, sp, damage_expr(c, sp, slot), false, data) if not dmg.is_empty() else 0
	var first := true
	for t in targets:
		if t.dead:
			continue
		if sv.is_empty():
			continue
		var opts := {}
		if t.team == c.team and careful_left > 0:
			opts["auto_success"] = true
			careful_left -= 1
		elif first and data.get("meta", "") == "heightened" and t.team != c.team:
			opts["disadvantage"] = true
			first = false
		var r := b.saving_throw(t, sv.get("ability", "dex"), dc, c, opts)
		var dtype := damage_type(c, sp, t, data)
		if not r.success:
			if total > 0:
				b.apply_damage(t, total, dtype, c, {"magic": true})
			if not t.dead:
				_on_fail(c, t, sid, sp, slot, dc)
		elif sv.get("half", false) and total > 0:
			b.apply_damage(t, int(total / 2), dtype, c, {"magic": true})
	if sp.has("zone"):
		_create_zone(c, sid, sp, slot, data, cells, dc)

func _create_zone(c: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary, cells: Array, dc: int) -> void:
	var spec: Dictionary = sp.zone
	var z := spec.duplicate(true)
	z["cells"] = cells
	z["spell"] = sid
	z["owner"] = c
	z["dc"] = dc
	if sp.has("on_fail_effect"):
		z["effect"] = sp.on_fail_effect
	if sp.has("damage"):
		z["damage"] = {"dice": damage_expr(c, sp, slot), "type": sp.damage.type}
		z["save"] = sp.get("save", {}).get("ability", "con")
	if spec.has("rounds"):
		z["rounds_left"] = int(spec.rounds) * (2 if data.get("meta", "") == "extended" else 1)
	if data.has("point"):
		z["point"] = data.point
	var zid := b.add_zone(z)
	if sp.get("concentration", false) and c.concentration != null and c.concentration_spell == sid:
		var link := Effect.new("zone_link")
		link.source = c
		link.data = {"zone": zid}
		b._attach_effect(c, link)
		b.link_to_concentration(c, link)

## Mover Rayo de luna (acción mágica). Quien quede dentro salva una vez por turno.
func move_zone_action(c: Creature, zid: int, point: Vector2) -> bool:
	var z := b.get_zone(zid)
	if z.is_empty() or z.get("owner") != c or not z.has("movable"):
		return false
	var old: Vector2 = z.get("point", point)
	var center := BattleMap.cell_at(point)
	if BattleMap.dist(BattleMap.cell_at(old), center) > int(z.movable) or not b.map.in_bounds(center):
		return false
	if not b._spend(c, "action"):
		return false
	var sp := RulesDB.spell(str(z.spell))
	var cells := b.map.sphere_cells(point, _area_radius(sp, sp.get("level", 2)))
	z["point"] = point
	b.move_zone(zid, cells)
	b.log_msg(Loc.t("log.zone_move", {"who": b.nm(c), "spell": sp.get("name", "")}))
	for o in creatures_in(cells):
		if not o.dead and o.is_active() and z.get("enter_damage", false):
			b._zone_damage_save(o, z)
	return true

func _sleep(c: Creature, sp: Dictionary, data: Dictionary) -> void:
	var cells := area_cells(c, "sleep", data)
	var any := false
	for t in creatures_in(cells, c):
		if t.team == c.team or not t.is_active():
			continue
		if t.ctype == "undead" or "exhaustion" in t.condition_immune or t.has_trait("trance"):
			b.emit({"t": "immune", "who": t.id, "what": "sleep"})
			continue
		var r := b.saving_throw(t, "wis", c.spell_save_dc("sleep"), c)
		if not r.success:
			var e := Effect.new("sleep")
			e.name = "Adormecido"
			e.source = c
			e.grants = ["incapacitated"]
			e.data = {"dc": c.spell_save_dc("sleep"), "stage": 1}
			b._attach_effect(t, e)
			b.link_to_concentration(c, e)
			any = true
	if not any:
		b.end_concentration(c)

func _magic_missile(c: Creature, sp: Dictionary, slot: int, ids: Array) -> void:
	var expr := damage_expr(c, sp, slot)
	var shielded := {}
	for tid in ids:
		var t := b.get_creature(tid)
		if t == null or t.dead:
			continue
		if not shielded.has(tid):
			shielded[tid] = "magic_missile" in t.immune_spells or t.has_effect("shield_spell") or b._try_shield(t, 0, 99)
		b.emit({"t": "missile", "who": c.id, "target": t.id})
		if shielded[tid]:
			continue
		b.apply_damage(t, b.dice.roll(expr).total, "force", c, {"magic": true})

# ================================================================== invocaciones

func _spiritual_weapon(c: Creature, sp: Dictionary, slot: int, data: Dictionary) -> void:
	var tid := "sw_" + c.id
	b.tokens[tid] = {"kind": "spiritual_weapon", "owner": c, "cell": data.cell, "slot": slot}
	var ctrl := Effect.new("spiritual_weapon_ctrl")
	ctrl.name = sp.name
	ctrl.source = c
	ctrl.positive = true
	ctrl.data = {"token": tid, "slot": slot}
	b._attach_effect(c, ctrl)
	b.link_to_concentration(c, ctrl)
	b.emit({"t": "summon", "id": tid, "kind": "spiritual_weapon", "owner": c.id, "cell": data.cell})
	var target_id: String = data.get("targets", [""])[0] if data.get("targets", []).size() > 0 else ""
	var t := b.get_creature(target_id) if not target_id.is_empty() else _sw_auto_target(c, data.cell)
	if t != null and BattleMap.dist(t.cell, data.cell) <= 1:
		_sw_attack(c, t, slot)

func _sw_auto_target(c: Creature, cell: Vector2i) -> Creature:
	var best: Creature = null
	for e in b.enemies_of(c):
		if e.is_active() and BattleMap.dist(e.cell, cell) <= 1:
			if best == null or e.hp < best.hp:
				best = e
	return best

func _sw_attack(c: Creature, t: Creature, slot: int) -> void:
	var sp := RulesDB.spell("spiritual_weapon")
	var tid := "sw_" + c.id
	var cell: Vector2i = b.tokens[tid].cell
	var mi := b.attack_mode(c, t, "melee_spell", cell)
	var r := b.dice.d20(mi.mode, c.has_trait("luck"))
	var nat: int = r.natural
	var total: int = nat + c.spell_attack_bonus("spiritual_weapon") + b._roll_attack_mods(c)
	var ac := t.ac() + BattleMap.cover_ac_bonus(b.map.cover_between(cell, t.cell))
	var crit := nat == 20
	var hit := crit or (nat != 1 and total >= ac)
	b.emit({"t": "attack", "who": c.id, "target": t.id, "name": sp.name, "kind": "melee_spell", "natural": nat, "rolls": r.rolls,
		"bonus": c.spell_attack_bonus("spiritual_weapon"), "total": total, "ac": ac, "hit": hit, "crit": crit, "mode": mi.mode, "adv": mi.adv, "dis": mi.dis,
		"spell": true, "token": tid})
	b.log_msg(Loc.t("log.spiritual_weapon_attack", {"who": b.nm(c), "target": b.nm(t)}))
	if hit:
		var expr := damage_expr(c, sp, slot)
		b.apply_damage(t, b.dice.roll(expr, crit).total, "force", c, {"crit": crit, "magic": true})

## Acción adicional en turnos posteriores: mover el arma espiritual y atacar.
func spiritual_weapon_turn(c: Creature, to: Vector2i, target: Creature) -> bool:
	var tid := "sw_" + c.id
	if not b.tokens.has(tid) or c.turn.bonus <= 0 or not c.can_act():
		return false
	var from: Vector2i = b.tokens[tid].cell
	if BattleMap.dist(from, to) > 4 or not b.map.in_bounds(to):
		return false
	if not b._spend(c, "bonus"):
		return false
	b.tokens[tid].cell = to
	b.emit({"t": "summon_move", "id": tid, "from": from, "to": to})
	if target != null and BattleMap.dist(target.cell, to) <= 1 and target.is_active():
		_sw_attack(c, target, int(b.tokens[tid].slot))
	return true

func _flaming_sphere(c: Creature, sid: String, sp: Dictionary, slot: int, data: Dictionary) -> void:
	var tid := "fs_" + c.id
	b.tokens[tid] = {"kind": "flaming_sphere", "owner": c, "cell": data.cell, "slot": slot,
		"dice": damage_expr(c, sp, slot), "dc": c.spell_save_dc(sid), "hits": {}}
	var ctrl := Effect.new("flaming_sphere_ctrl")
	ctrl.name = sp.name
	ctrl.source = c
	ctrl.positive = true
	ctrl.data = {"token": tid, "slot": slot}
	b._attach_effect(c, ctrl)
	b.link_to_concentration(c, ctrl)
	b.emit({"t": "summon", "id": tid, "kind": "flaming_sphere", "owner": c.id, "cell": data.cell})

## Daño de la esfera a una criatura (al acabar su turno junto a ella o al embestirla).
func flaming_sphere_hit(tk: Dictionary, t: Creature) -> void:
	var hits: Dictionary = tk.get("hits", {})
	if int(hits.get(t.id, -1)) == b.turn_counter:
		return
	hits[t.id] = b.turn_counter
	tk["hits"] = hits
	var owner: Creature = tk.owner
	var dmg = b.dice.roll(str(tk.dice)).total
	var r := b.saving_throw(t, "dex", int(tk.dc), owner)
	b.emit({"t": "zone_hit", "id": -1, "who": t.id, "token": "fs_" + owner.id})
	b.apply_damage(t, dmg if not r.success else int(dmg / 2), "fire", owner, {"magic": true})

## Acción adicional: rueda la esfera hasta 9 m y embiste a un enemigo.
func flaming_sphere_turn(c: Creature, target: Creature) -> bool:
	var tid := "fs_" + c.id
	if not b.tokens.has(tid) or target == null or not target.is_active():
		return false
	var tk: Dictionary = b.tokens[tid]
	var from: Vector2i = tk.cell
	var best := Vector2i(-99, -99)
	var best_d := 99
	for n in BattleMap.neighbors8(target.cell):
		var dd := BattleMap.dist(from, n)
		if dd <= 6 and dd < best_d and b.map.walkable(n) and b.creature_at(n) == null:
			best_d = dd
			best = n
	if best == Vector2i(-99, -99):
		return false
	if not b._spend(c, "bonus"):
		return false
	tk.cell = best
	b.emit({"t": "summon_move", "id": tid, "from": from, "to": best})
	flaming_sphere_hit(tk, target)
	return true

# ================================================================== castigos y conjuros al impactar

## Opciones de castigo para un ataque con arma (interfaz e IA). Lista de {spell, slot, name, free}.
func rider_options(c: Creature, p: Dictionary) -> Array:
	var out: Array = []
	if c.turn.bonus <= 0 or c.is_raging() or not c.form.is_empty():
		return out
	for sid in c.known_spells():
		var sp := RulesDB.spell(sid)
		if sp.get("cast", "") != "rider":
			continue
		var need: String = sp.get("rider", "weapon")
		if need == "melee" and p.kind != "melee":
			continue
		if need == "ranged" and not p.kind in ["ranged", "thrown"]:
			continue
		var lvl := int(sp.level)
		if c.free_casts.get(sid, 0) > 0:
			out.append({"spell": sid, "slot": lvl, "name": sp.name, "free": true})
		if c.turn.get("slot_spell_cast", false):
			continue
		for i in range(lvl - 1, c.slots.size()):
			if int(c.slots[i]) > 0:
				out.append({"spell": sid, "slot": i + 1, "name": sp.name, "free": false})
	return out

## Gasta el castigo al impactar y añade su daño (que se dobla en crítico). Devuelve info para después.
func apply_rider_damage(a: Creature, t: Creature, p: Dictionary, rider: Dictionary, crit: bool, parts: Array) -> Dictionary:
	var sid: String = rider.get("spell", "")
	var sp := RulesDB.spell(sid)
	if sp.is_empty() or a.turn.bonus <= 0:
		return {}
	if rider.get("crit_only", false) and not crit:
		return {}
	var slot := int(rider.get("slot", sp.level))
	var free := false
	if c_free(a, sid) and slot <= int(sp.level):
		free = true
		slot = int(sp.level)
	elif slot - 1 >= a.slots.size() or int(a.slots[slot - 1]) <= 0 or a.turn.get("slot_spell_cast", false):
		return {}
	a.turn.bonus -= 1
	if free:
		a.free_casts[sid] -= 1
	else:
		a.slots[slot - 1] -= 1
		a.turn.slot_spell_cast = true
	b.emit({"t": "cast", "who": a.id, "spell": sid, "name": sp.name, "slot": slot, "targets": [t.id], "cells": [], "fx": sp.get("fx", ""), "rider": true})
	b.log_msg(Loc.t("log.smite", {"who": b.nm(a), "spell": sp.name}))
	if sp.get("concentration", false):
		b.start_concentration(a, sid, int(sp.get("duration", 10)))
	if sp.has("damage") and int(sp.get("rider_area", 0)) == 0:
		var expr := damage_expr(a, sp, slot)
		var amt = b.dice.roll(expr, crit).total
		if sp.has("vs_fiend_undead") and t.ctype in ["fiend", "undead"]:
			amt += b.dice.roll(str(sp.vs_fiend_undead), crit).total
		parts.append({"amount": amt, "type": str(sp.damage.type)})
	return {"spell": sid, "slot": slot}

func c_free(a: Creature, sid: String) -> bool:
	return a.free_casts.get(sid, 0) > 0

## Efectos del castigo tras el daño (salvaciones, efectos, áreas).
func apply_rider_after(a: Creature, t: Creature, p: Dictionary, info: Dictionary) -> void:
	var sid: String = info.spell
	var sp := RulesDB.spell(sid)
	var slot := int(info.slot)
	var dc := a.spell_save_dc(sid)
	if int(sp.get("rider_area", 0)) > 0:
		# Granizo de espinas: el objetivo y quien esté a 1,5 m
		var cells: Array = [t.cell]
		for n in BattleMap.neighbors8(t.cell):
			cells.append(n)
		b.emit({"t": "burst", "who": a.id, "cells": cells, "fx": sp.get("fx", "")})
		var total = b.dice.roll(damage_expr(a, sp, slot)).total
		for o in creatures_in(cells, a):
			if o.dead:
				continue
			var r := b.saving_throw(o, str(sp.save.ability), dc, a)
			b.apply_damage(o, total if not r.success else int(total / 2), str(sp.damage.type), a, {"magic": true})
		return
	if t.dead:
		if sp.get("concentration", false):
			b.end_concentration(a)
		return
	var rs: Dictionary = sp.get("rider_save", {})
	if rs.is_empty():
		if sp.has("rider_effect"):
			b.apply_effect_spec(t, sp.rider_effect, a, sid, slot, dc)
		return
	var opts := {}
	if rs.get("large_adv", false) and t.size_rank() >= 3:
		opts["advantage"] = true
	var r2 := b.saving_throw(t, str(rs.ability), dc, a, opts)
	if r2.success:
		if sp.get("concentration", false):
			b.end_concentration(a)
		return
	match rs.get("fail", ""):
		"push10_prone":
			b.push_away(t, a.cell, 2)
			if t.is_active():
				b._add_condition(t, "prone", sid)
		"effect":
			b.apply_effect_spec(t, sp.rider_effect, a, sid, slot, dc)
