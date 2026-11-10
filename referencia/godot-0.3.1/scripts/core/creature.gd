class_name Creature
extends RefCounted
## Una criatura en combate: personaje jugador, compañero o monstruo.
## Solo datos y cálculos de reglas; la resolución vive en Battle.

const ABILITIES := ["str", "dex", "con", "int", "wis", "cha"]
const SIZE_ORDER := {"tiny": 0, "small": 1, "medium": 2, "large": 3, "huge": 4, "gargantuan": 5}
const SIZES := ["tiny", "small", "medium", "large", "huge", "gargantuan"]
const SKILL_ABILITY := {
	"acrobatics": "dex", "animal_handling": "wis", "arcana": "int", "athletics": "str",
	"deception": "cha", "history": "int", "insight": "wis", "intimidation": "cha",
	"investigation": "int", "medicine": "wis", "nature": "int", "perception": "wis",
	"performance": "cha", "persuasion": "cha", "religion": "int", "sleight_of_hand": "dex",
	"stealth": "dex", "survival": "wis"
}
const PROT_EVIL_TYPES := ["aberration", "celestial", "elemental", "fey", "fiend", "undead"]

# --- Identidad ---
var id: String = ""
var template_id: String = ""
var name: String = ""
var title: String = ""
var team: int = 0                ## 0 = grupo del jugador, 1 = enemigos
var is_pc: bool = false
var controlled_by_player: bool = false
var level: int = 1
var cls: String = ""
var subclass: String = ""
var species: String = ""
var lineage: String = ""
var ancestry: String = ""
var background: String = ""
var sheet: Dictionary = {}
var size: String = "medium"
var ctype: String = "humanoid"
var tags: Array = []
var pronoun: String = "m"
var ai_profile: String = "brute"
var visual: Dictionary = {}
var xp: int = 0
var cr: String = ""

# --- Estadísticas ---
var abilities: Dictionary = {"str": 10, "dex": 10, "con": 10, "int": 10, "wis": 10, "cha": 10}
var save_profs: Array = []
var save_overrides: Dictionary = {}
var skill_profs: Array = []
var expertise: Array = []
var skill_overrides: Dictionary = {}
var prof_bonus: int = 2
var init_bonus_override: int = -999
var max_hp: int = 1
var hp: int = 1
var temp_hp: int = 0
var base_speed: int = 30
var fixed_ac: int = -1
var armor_id: String = ""
var has_shield: bool = false
## Objetos mágicos equipados (Items.worn_mods y armas/armaduras/escudos +N)
var armor_bonus: int = 0
var shield_bonus: int = 0
var item_ac: int = 0
var item_ac_unarmored: int = 0
var item_saves: int = 0
var item_checks: int = 0
var item_tools: int = 0
var item_skill: Dictionary = {}
var item_adv: Array = []          ## habilidades con ventaja (Sigilo con botas élficas...)
var immune_spells: Array = []
var speed_min: int = 0
var ignore_armor_speed: bool = false
var item_charges: Dictionary = {} ## varita -> cargas
var item_cast: Dictionary = {}    ## conjuro lanzado desde un objeto: {dc, atk}
var fighting_style: String = ""
var resist: Array = []
var vulnerable: Array = []
var immune: Array = []
var condition_immune: Array = []
var traits: Array = []
var feats: Array = []
var darkvision: int = 0

# --- Ataques y magia ---
var weapons: Array = []        ## entradas de arma resueltas (PJ) o ataques (monstruos)
var multiattack: Dictionary = {}
var life_drain: Dictionary = {}
var bonus_actions: Array = []
var reactions: Array = []
var masteries: Array = []
var sneak_attack: String = ""
var casting_ability: String = ""
var caster_type: String = ""
var cantrips: Array = []
var prepared: Array = []
var always_prepared: Array = []
var at_will: Array = []          ## conjuros a voluntad sin espacio (invocaciones)
var spell_source: Dictionary = {} ## conjuro -> "class" | "species" | "feat" | "style" | "tome" | "invocation"
var spell_ability: Dictionary = {} ## conjuro -> característica (si no es la de clase)
var slots_max: Array = []      ## [nivel1, nivel2, ...]
var slots: Array = []
var free_casts: Dictionary = {} ## conjuro -> usos sin espacio
var resources: Dictionary = {}  ## second_wind, action_surge, channel_divinity, rage...
var resources_max: Dictionary = {}
var items: Dictionary = {}
var ammo: Dictionary = {}
# Clase y especie
var rage_damage: int = 2
var bardic_die: String = "1d6"
var martial_die: String = ""
var wild_shapes: Array = []
var metamagic: Array = []
var pact_weapon: String = ""
var breath_type: String = ""
# Forma salvaje: estado guardado de la forma original
var form: String = ""
var _form_backup: Dictionary = {}

# --- Estado de combate ---
var cell: Vector2i = Vector2i.ZERO
var facing: Vector2 = Vector2(0, 1)
var initiative: int = 0
var conditions: Dictionary = {}  ## nombre -> Array de fuentes
var effects: Array = []          ## Array[Effect]
var dead: bool = false
var stable: bool = false
var death_successes: int = 0
var death_failures: int = 0
var concentration: Effect = null
var concentration_spell: String = ""
var hidden_stealth: int = 0
var turn: Dictionary = {}
var stats: Dictionary = {"damage_dealt": 0, "damage_taken": 0, "kills": 0, "healed": 0, "crits": 0, "downs": 0}

# ------------------------------------------------------------------ básicos

func mod(ab: String) -> int:
	return int(floor((abilities.get(ab, 10) - 10) / 2.0))

func is_alive() -> bool:
	return not dead

func is_down() -> bool:
	return not dead and hp <= 0

func is_active() -> bool:
	## En pie y consciente (puede actuar si no está incapacitado).
	return not dead and hp > 0

func bloodied() -> bool:
	return hp <= max_hp / 2

func size_rank() -> int:
	var r: int = SIZE_ORDER.get(size, 2)
	if has_effect("enlarged"):
		r += 1
	if has_effect("reduced"):
		r -= 1
	return clamp(r, 0, 5)

func has_trait(t: String) -> bool:
	return t in traits or t in feats

func level_feature(f: String) -> bool:
	return has_trait(f)

func is_raging() -> bool:
	return has_effect("rage")

func wears_armor() -> bool:
	return not armor_id.is_empty() and form.is_empty()

func unarmored_monk() -> bool:
	return cls == "monk" and armor_id.is_empty() and not has_shield and form.is_empty()

# ------------------------------------------------------------------ condiciones

func add_condition(c: String, source: String = "base") -> bool:
	if c in condition_immune:
		return false
	if c == "frightened" and has_effect("heroism"):
		return false
	if not conditions.has(c):
		conditions[c] = []
	if not source in conditions[c]:
		conditions[c].append(source)
	return true

func remove_condition(c: String, source: String = "") -> void:
	if not conditions.has(c):
		return
	if source.is_empty():
		conditions.erase(c)
		return
	conditions[c].erase(source)
	if conditions[c].is_empty():
		conditions.erase(c)

func _raw_has(c: String) -> bool:
	if conditions.has(c):
		return true
	for e in effects:
		if c in e.grants:
			return true
	return false

func has_condition(c: String) -> bool:
	if c in condition_immune:
		return false
	if c == "frightened" and has_effect("heroism"):
		return false
	if _raw_has(c):
		return true
	match c:
		"incapacitated":
			return _raw_has("paralyzed") or _raw_has("unconscious") or _raw_has("stunned") or _raw_has("petrified")
		"prone":
			return _raw_has("unconscious")
	return false

func can_act() -> bool:
	return is_active() and not has_condition("incapacitated")

func can_react() -> bool:
	return can_act() and turn.get("reaction", 1) > 0 and not has_effect("no_reactions")

func is_hidden() -> bool:
	return has_effect("hidden")

## Invisible de verdad (conjuro o escondite), sin contar lo que lo anula.
func is_invisible() -> bool:
	if not has_condition("invisible"):
		return false
	for k in ["outlined", "outlined_wisp", "outlined_shine"]:
		if has_effect(k):
			return false
	return true

func active_condition_list() -> Array:
	var out: Array = []
	for c in ["unconscious", "paralyzed", "incapacitated", "prone", "restrained", "blinded", "frightened", "charmed", "poisoned", "grappled", "invisible"]:
		if has_condition(c) and not (c == "incapacitated" and (has_condition("unconscious") or has_condition("paralyzed"))) and not (c == "prone" and has_condition("unconscious")):
			out.append(c)
	return out

# ------------------------------------------------------------------ efectos

func has_effect(kind: String) -> bool:
	for e in effects:
		if e.kind == kind:
			return true
	return false

func get_effect(kind: String) -> Effect:
	for e in effects:
		if e.kind == kind:
			return e
	return null

func get_effects(kind: String) -> Array:
	var out: Array = []
	for e in effects:
		if e.kind == kind:
			out.append(e)
	return out

# ------------------------------------------------------------------ CA y velocidad

func armor_data() -> Dictionary:
	if armor_id.is_empty():
		return {}
	return RulesDB.armor.get(armor_id, {})

func ac() -> int:
	var total := 0
	if fixed_ac >= 0:
		total = fixed_ac
	else:
		var a := armor_data()
		var dex := mod("dex")
		if a.is_empty():
			total = 10 + dex
			if has_effect("mage_armor"):
				total = max(total, 13 + dex)
			if has_trait("unarmored_defense_barbarian"):
				total = max(total, 10 + dex + mod("con"))
			if has_trait("unarmored_defense_monk") and not has_shield:
				total = max(total, 10 + dex + mod("wis"))
			if has_trait("draconic_resilience"):
				total = max(total, 10 + dex + mod("cha"))
		else:
			# Las armaduras pesadas ignoran la Destreza (también la negativa)
			total = int(a.base) if a.get("cat", "") == "heavy" else int(a.base) + min(dex, int(a.dex_cap))
			total += armor_bonus
			if fighting_style == "defense":
				total += 1
		if has_shield:
			total += 2 + shield_bonus
		elif a.is_empty():
			total += item_ac_unarmored
		total += item_ac
	if has_effect("barkskin"):
		total = max(total, 17)
	for e in effects:
		match e.kind:
			"shield_of_faith":
				total += 2
			"shield_spell":
				total += 5
			"warding_bond":
				total += 1
	return total

func speed() -> int:
	if has_condition("grappled") or has_condition("restrained") or has_condition("paralyzed") or has_condition("unconscious"):
		return 0
	if has_effect("steady_aim") or has_effect("speed_zero"):
		return 0
	var s: int = max(base_speed, speed_min) if form.is_empty() else base_speed
	var a := armor_data()
	if form.is_empty() and not ignore_armor_speed and not a.is_empty() and int(a.get("str_req", 0)) > abilities.get("str", 10):
		s -= 10
	if unarmored_monk() and level >= 2:
		s += int(RulesDB.at_level(RulesDB.classes.get("monk", {}).get("unarmored_movement", {}), level, 10))
	var weapon_slow := false
	for e in effects:
		match e.kind:
			"slowed_weapon":
				weapon_slow = true
			"slowed_frost", "frosts_chill":
				s -= 10
			"longstrider":
				s += 10
	if weapon_slow:
		s -= 10
	return max(0, s)

# ------------------------------------------------------------------ tiradas

func save_bonus(ab: String) -> int:
	if save_overrides.has(ab):
		return int(save_overrides[ab])
	var b := mod(ab) + item_saves
	if ab in save_profs:
		b += prof_bonus
	return b

func skill_bonus(skill: String) -> int:
	if skill_overrides.has(skill):
		return int(skill_overrides[skill])
	var ab: String = SKILL_ABILITY.get(skill, "dex")
	var b := mod(ab) + item_checks + int(item_skill.get(skill, 0))
	if skill in expertise:
		b += prof_bonus * 2
	elif skill in skill_profs:
		b += prof_bonus
	elif has_trait("jack_of_all_trades"):
		b += int(prof_bonus / 2)
	return b

func passive_perception() -> int:
	return 10 + skill_bonus("perception")

func initiative_bonus() -> int:
	if init_bonus_override > -999:
		return init_bonus_override
	var b := mod("dex") + item_checks
	if has_trait("alert"):
		b += prof_bonus
	elif has_trait("jack_of_all_trades"):
		b += int(prof_bonus / 2)
	return b

## Característica con la que se lanza un conjuro concreto.
func spell_ability_for(sid: String = "") -> String:
	if not sid.is_empty() and spell_ability.has(sid):
		return spell_ability[sid]
	return casting_ability

func spell_attack_bonus(sid: String = "") -> int:
	if not item_cast.is_empty() and item_cast.get("spell", "") == sid and item_cast.has("atk"):
		return int(item_cast.atk)
	var ab := spell_ability_for(sid)
	return prof_bonus + mod(ab) if not ab.is_empty() else 0

func spell_save_dc(sid: String = "") -> int:
	if not item_cast.is_empty() and item_cast.get("spell", "") == sid and item_cast.has("dc"):
		return int(item_cast.dc)
	var ab := spell_ability_for(sid)
	if ab.is_empty():
		return 10
	var dc := 8 + prof_bonus + mod(ab)
	if has_effect("innate_sorcery") and spell_source.get(sid, "class") == "class":
		dc += 1
	return dc

## Modificador de la característica mágica para un conjuro.
func spell_mod(sid: String = "") -> int:
	var ab := spell_ability_for(sid)
	return mod(ab) if not ab.is_empty() else 0

# ------------------------------------------------------------------ armas

func is_monk_weapon(w: Dictionary) -> bool:
	if w.get("id", "") == "unarmed":
		return true
	if w.get("kind", "") != "melee":
		return false
	var cat: String = w.get("cat", "simple")
	return cat == "simple" or (cat == "martial" and "light" in w.get("props", []))

func weapon_attack_ability(w: Dictionary) -> String:
	if w.get("monster", false):
		return ""
	var props: Array = w.get("props", [])
	var wid: String = w.get("id", "")
	# Garrote mágico y arma de pacto usan la característica mágica
	if has_effect("shillelagh") and wid in ["club", "quarterstaff"]:
		var sab := spell_ability_for("shillelagh")
		if mod(sab) > mod("str"):
			return sab
	if not pact_weapon.is_empty() and wid == pact_weapon and has_trait("pact_of_the_blade"):
		if mod("cha") >= max(mod("str"), mod("dex") if "finesse" in props else -99):
			return "cha"
	if cls == "monk" and unarmored_monk() and is_monk_weapon(w):
		return "dex" if mod("dex") >= mod("str") else "str"
	if w.get("kind", "melee") == "ranged":
		return "dex"
	if "finesse" in props:
		return "dex" if mod("dex") >= mod("str") else "str"
	return "str"

func is_proficient(w: Dictionary) -> bool:
	if w.get("monster", false) or w.get("id", "") == "unarmed":
		return true
	if not is_pc:
		return true
	if not pact_weapon.is_empty() and w.get("id", "") == pact_weapon and has_trait("pact_of_the_blade"):
		return true
	var c: Dictionary = RulesDB.classes.get(cls, {})
	var profs: Array = c.get("weapons", [])
	var cat: String = w.get("cat", "simple")
	var props: Array = w.get("props", [])
	if cat in profs:
		return true
	if cat == "martial" and "martial_finesse_or_light" in profs:
		return "finesse" in props or "light" in props
	if cat == "martial" and "martial_light" in profs:
		return "light" in props
	if cat == "martial" and (has_trait("protector") or has_trait("warden")):
		return true
	return false

func has_mastery(w: Dictionary) -> bool:
	return w.get("id", "") in masteries and not str(w.get("mastery", "")).is_empty() and form.is_empty()

func two_handing(w: Dictionary) -> bool:
	## Empuña con dos manos un arma versátil si no lleva escudo ni otra arma ligera.
	if not "versatile" in w.get("props", []):
		return false
	if has_shield:
		return false
	return true

func melee_weapons() -> Array:
	var out: Array = []
	for w in weapons:
		if w.get("kind", "melee") == "melee" and not w.get("thrown_only", false):
			out.append(w)
	return out

func ranged_options() -> Array:
	## Armas a distancia y armas arrojadizas con munición disponible.
	var out: Array = []
	for w in weapons:
		var props: Array = w.get("props", [])
		if w.get("kind", "melee") == "ranged":
			if ammo_left(w) != 0:
				out.append(w)
		elif "thrown" in props and ammo_left(w) != 0:
			out.append(w)
	return out

func ammo_left(w: Dictionary) -> int:
	var key: String = w.get("ammo_key", w.get("id", ""))
	if ammo.has(key):
		return int(ammo[key])
	return -1

func reach_cells(w: Dictionary = {}) -> int:
	if w.is_empty():
		var best := 1
		for mw in melee_weapons():
			best = max(best, 2 if "reach" in mw.get("props", []) else 1)
		return best
	if "reach" in w.get("props", []):
		return 2
	return 1

# ------------------------------------------------------------------ magia

func known_spells() -> Array:
	var out: Array = []
	for s in cantrips:
		if not s in out:
			out.append(s)
	for s in always_prepared:
		if not s in out:
			out.append(s)
	for s in prepared:
		if not s in out:
			out.append(s)
	for s in free_casts.keys():
		if not s in out:
			out.append(s)
	for s in at_will:
		if not s in out:
			out.append(s)
	return out

func has_slot(level_min: int) -> bool:
	for i in range(level_min - 1, slots.size()):
		if slots[i] > 0:
			return true
	return false

func lowest_slot(level_min: int) -> int:
	for i in range(level_min - 1, slots.size()):
		if slots[i] > 0:
			return i + 1
	return 0

func total_slots() -> int:
	var n := 0
	for v in slots:
		n += int(v)
	return n

func can_cast(spell_id: String) -> bool:
	var sp: Dictionary = RulesDB.spells.get(spell_id, {})
	if sp.is_empty():
		return false
	if not form.is_empty() or is_raging():
		return false
	var lvl: int = sp.level
	if lvl == 0 or spell_id in at_will:
		return true
	if free_casts.get(spell_id, 0) > 0:
		return true
	return has_slot(lvl)

# ------------------------------------------------------------------ forma salvaje

## Adopta la forma de una bestia (datos de monsters.json). Conserva PG, mente y rasgos.
func enter_form(form_id: String) -> void:
	if not form.is_empty():
		leave_form()
	var m := RulesDB.monster_data(form_id)
	if m.is_empty():
		return
	_form_backup = {
		"abilities": abilities.duplicate(), "fixed_ac": fixed_ac, "base_speed": base_speed, "size": size,
		"weapons": weapons.duplicate(true), "traits": traits.duplicate(), "visual": visual.duplicate(true),
		"darkvision": darkvision, "skill_overrides": skill_overrides.duplicate(), "ammo": ammo.duplicate(),
	}
	form = form_id
	var ab: Dictionary = m.get("abilities", {})
	for a in ["str", "dex", "con"]:
		abilities[a] = int(ab.get(a, abilities[a]))
	fixed_ac = int(m.get("ac", 10))
	base_speed = int(m.get("speed", 30))
	size = m.get("size", "medium")
	darkvision = max(darkvision, int(m.get("darkvision", 0)))
	for t in m.get("traits", []):
		if not t in traits:
			traits.append(t)
	for sk in m.get("skills", {}).keys():
		skill_overrides[sk] = max(int(m.skills[sk]), skill_bonus(sk))
	weapons = Factory.monster_attacks(m, self)
	var vis: Dictionary = m.get("visual", {}).duplicate()
	vis["form_of"] = id
	visual = vis

func leave_form() -> void:
	if form.is_empty():
		return
	var b := _form_backup
	abilities = b.abilities
	fixed_ac = b.fixed_ac
	base_speed = b.base_speed
	size = b.size
	weapons = b.weapons
	traits = b.traits
	visual = b.visual
	darkvision = b.darkvision
	skill_overrides = b.skill_overrides
	ammo = b.ammo
	form = ""
	_form_backup = {}

# ------------------------------------------------------------------ turno

func reset_turn() -> void:
	turn = {
		"action": 1, "bonus": 1, "reaction": 1,
		"movement": speed(), "moved": false, "moved_cells": 0,
		"attack_left": 0, "attack_source": "", "light_attack_used": false,
		"offhand_ready": false, "nick_used": false,
		"sneak_used": false, "savage_used": false, "cleave_used": false,
		"disengaged": false, "slot_spell_cast": false,
		"action_surge_used": false, "acted": false, "start_cell": cell,
		"undo_cell": cell, "undo_movement": speed(), "can_undo": true,
		"attacked": false, "attack_action": false, "rage_extended": false,
		"colossus_used": false, "horde_used": false, "frenzy_used": false,
		"attacked_ids": [], "giant_used": false, "straight_cells": 0,
	}

func short_label() -> String:
	return name

func hp_ratio() -> float:
	return clamp(float(hp) / float(max(1, max_hp)), 0.0, 1.0)

func to_debug() -> String:
	return "%s [%s] HP %d/%d CA %d %s" % [name, id, hp, max_hp, ac(), str(active_condition_list())]
