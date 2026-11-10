class_name Factory
extends Object
## Construye criaturas listas para combatir a partir de los datos.

## Crea un compañero escrito del grupo (data/party.json) al nivel indicado.
static func make_pc(pid: String, level: int) -> Creature:
	var d: Dictionary = RulesDB.party.get(pid, {})
	return make_from_sheet(d, level, pid)

## Crea un personaje jugador a partir de una hoja (creador, compañero o mercenario).
static func make_from_sheet(sheet: Dictionary, level: int, cid := "") -> Creature:
	var s := CharacterSheet.complete(sheet, level)
	Items.normalize(s)
	var c := Creature.new()
	c.id = cid if not cid.is_empty() else str(s.get("id", "pc"))
	c.template_id = c.id
	c.sheet = s
	c.name = s.get("name", c.id)
	c.title = s.get("title", "")
	c.pronoun = s.get("pronoun", "m")
	c.team = 0
	c.is_pc = true
	c.controlled_by_player = true
	c.level = level
	c.cls = s.get("class", "fighter")
	c.subclass = s.get("subclass", "") if level >= 3 else ""
	c.species = s.get("species", "human")
	c.lineage = s.get("lineage", "")
	c.ancestry = s.get("ancestry", "")
	c.background = s.get("background", "")
	c.ctype = "humanoid"
	c.abilities = CharacterSheet.final_abilities(s)
	c.prof_bonus = RulesDB.prof_bonus_for(level)
	c.visual = s.get("visual", {}).duplicate(true)
	if c.visual.get("hero", false):
		c.visual = CharacterSheet.visual_for(s)
	c.ai_profile = s.get("ai", "frontline")
	var cd: Dictionary = RulesDB.classes.get(c.cls, {})
	c.save_profs = cd.get("saves", []).duplicate()
	c.skill_profs = s.get("skills", []).duplicate()
	c.expertise = CharacterSheet.expertise_list(s, level).duplicate()
	c.feats = CharacterSheet.all_feats(s, level)
	c.fighting_style = s.get("fighting_style", "")
	c.masteries = s.get("masteries", []).duplicate()
	c.armor_id = Items.armor_base(str(s.get("armor", "")))
	c.armor_bonus = Items.bonus(str(s.get("armor", "")))
	c.has_shield = bool(s.get("shield", false))
	c.shield_bonus = Items.bonus(str(s.get("shield_id", "shield"))) if c.has_shield else 0
	var wm := Items.worn_mods(s)
	c.item_ac = int(wm.ac)
	c.item_ac_unarmored = int(wm.ac_unarmored)
	c.item_saves = int(wm.saves)
	c.item_checks = int(wm.checks)
	c.item_tools = int(wm.tools)
	c.item_skill = wm.skill
	c.item_adv = wm.adv
	c.immune_spells = wm.immune_spell
	c.speed_min = int(wm.speed_min)
	c.ignore_armor_speed = bool(wm.ignore_armor_speed)
	c.item_charges = _int_dict(s.get("charges", {}))
	var con_before := c.mod("con")
	for ab in wm.set.keys():
		c.abilities[ab] = max(int(c.abilities.get(ab, 10)), int(wm.set[ab]))
	c.items = _int_dict(s.get("items", {}))
	c.ammo = _int_dict(s.get("ammo", {}))
	c.size = s.get("size", "medium")
	c.resources = {}
	# ---- Especie
	_apply_species(c, s, level)
	for r in wm.resist:
		if not r in c.resist:
			c.resist.append(r)
	if wm.wound_closure:
		c.traits.append("wound_closure")
	# ---- Rasgos de clase y subclase
	for f in CharacterSheet.class_features_up_to(s, level):
		if not f in c.traits:
			c.traits.append(f)
	if s.get("divine_order", "") == "protector" or s.get("primal_order", "") == "warden":
		c.traits.append("protector")
	if s.get("primal_order", "") == "warden":
		c.traits.append("warden")
	if c.cls == "ranger" and level >= 3:
		c.traits.append(s.get("hunters_prey", "colossus_slayer"))
	# ---- Puntos de golpe
	c.max_hp = CharacterSheet.hp_at(s, level) + (c.mod("con") - con_before) * level
	c.hp = c.max_hp
	# ---- Recursos de clase
	_apply_class_resources(c, cd, s, level)
	# ---- Armas
	c.weapons = []
	for wid in s.get("weapons", []):
		var w := Items.weapon_entry(str(wid))
		if w.is_empty():
			continue
		c.weapons.append(w)
	if c.cls == "monk" or c.weapons.filter(func(x): return x.get("kind", "") == "melee").is_empty():
		var u := RulesDB.weapon("unarmed")
		u["ammo_key"] = "unarmed"
		c.weapons.append(u)
	# ---- Magia
	_apply_spells(c, cd, s, level)
	c.slots_max = c.slots.duplicate()
	c.resources_max = c.resources.duplicate()
	return c

static func _apply_species(c: Creature, s: Dictionary, level: int) -> void:
	var sp: Dictionary = RulesDB.species.get(c.species, RulesDB.species.get("human", {}))
	var lin: Dictionary = sp.get("lineages", {}).get(c.lineage, {})
	var anc: Dictionary = sp.get("ancestries", {}).get(c.ancestry, {})
	c.base_speed = int(lin.get("speed", sp.get("speed", 30)))
	c.darkvision = int(lin.get("darkvision", sp.get("darkvision", 0)))
	c.traits = sp.get("traits", []).duplicate()
	c.resist = sp.get("resist", []).duplicate()
	if lin.has("resist") and not lin.resist in c.resist:
		c.resist.append(lin.resist)
	match c.species:
		"human":
			c.resources["heroic_inspiration"] = 1
		"dwarf":
			c.resources["stonecunning"] = c.prof_bonus
		"dragonborn":
			var dtype: String = anc.get("damage", "fire")
			if not dtype in c.resist:
				c.resist.append(dtype)
			c.breath_type = dtype
			c.resources["breath_weapon"] = c.prof_bonus
		"goliath":
			var feat: String = anc.get("feature", "stones_endurance")
			c.traits.append(feat)
			c.resources["giant_ancestry"] = c.prof_bonus
		"orc":
			c.resources["adrenaline_rush"] = c.prof_bonus
			c.resources["relentless_endurance"] = 1
		"half_orc":
			c.resources["relentless_endurance"] = 1
	# Magia del linaje (élfico, gnomo, tiflin)
	var lab: String = s.get("lineage_ability", "int")
	var lin_cantrips: Array = []
	if lin.has("cantrip"):
		lin_cantrips.append(lin.cantrip)
	for x in lin.get("cantrips", []):
		lin_cantrips.append(x)
	if c.species == "tiefling":
		lin_cantrips.append("thaumaturgy")
	for x in lin_cantrips:
		_add_spell(c, x, "species", lab)
	for l in lin.get("spells", {}).keys():
		if level >= int(l):
			var sid: String = lin.spells[l]
			_add_spell(c, sid, "species", lab, true)

static func _apply_class_resources(c: Creature, cd: Dictionary, s: Dictionary, level: int) -> void:
	match c.cls:
		"barbarian":
			c.resources["rage"] = int(RulesDB.at_level(cd.get("rages", {}), level, 2))
			c.rage_damage = int(RulesDB.at_level(cd.get("rage_damage", {}), level, 2))
		"bard":
			c.resources["bardic_inspiration"] = max(1, c.mod("cha"))
			c.bardic_die = "1d6"
		"cleric":
			if level >= 2:
				c.resources["channel_divinity"] = int(RulesDB.at_level(cd.get("channel_divinity_uses", {}), level, 2))
		"druid":
			if level >= 2:
				c.resources["wild_shape"] = int(RulesDB.at_level(cd.get("wild_shape_uses", {}), level, 2))
				c.wild_shapes = s.get("wild_shapes", []).duplicate()
		"fighter":
			c.resources["second_wind"] = int(RulesDB.at_level(cd.get("second_wind_uses", {}), level, 2))
			if level >= 2:
				c.resources["action_surge"] = 1
		"monk":
			c.martial_die = str(RulesDB.at_level(cd.get("martial_arts_die", {}), level, "1d6"))
			if level >= 2:
				c.resources["focus"] = int(RulesDB.at_level(cd.get("focus_points", {}), level, 2))
				c.resources["uncanny_metabolism"] = 1
		"paladin":
			c.resources["lay_on_hands"] = int(cd.get("lay_on_hands_pool", 5)) * level
			if level >= 3:
				c.resources["channel_divinity"] = int(RulesDB.at_level(cd.get("channel_divinity_uses", {}), level, 2))
		"rogue":
			c.sneak_attack = str(RulesDB.at_level(cd.get("sneak_attack", {}), level, "1d6"))
		"sorcerer":
			c.resources["innate_sorcery"] = int(cd.get("innate_sorcery_uses", 2))
			if level >= 2:
				c.resources["sorcery_points"] = int(RulesDB.at_level(cd.get("sorcery_points", {}), level, 2))
				c.metamagic = s.get("metamagic", []).duplicate()
		"warlock":
			for inv in CharacterSheet.invocations_at(s, level):
				if not inv in c.traits:
					c.traits.append(inv)
			if "pact_of_the_blade" in c.traits:
				c.pact_weapon = s.get("pact_weapon", "")

static func _add_spell(c: Creature, sid: String, source: String, ability := "", free_daily := false) -> void:
	if RulesDB.spell(sid).is_empty():
		return
	var lvl := int(RulesDB.spell(sid).get("level", 0))
	if lvl == 0:
		if not sid in c.cantrips:
			c.cantrips.append(sid)
	elif free_daily:
		c.free_casts[sid] = int(c.free_casts.get(sid, 0)) + 1
	elif not sid in c.prepared and not sid in c.always_prepared:
		c.prepared.append(sid)
	if not c.spell_source.has(sid) or source == "class":
		c.spell_source[sid] = source
		if not ability.is_empty():
			c.spell_ability[sid] = ability

static func _apply_spells(c: Creature, cd: Dictionary, s: Dictionary, level: int) -> void:
	var cast: Dictionary = cd.get("casting", {})
	if not cast.is_empty():
		c.casting_ability = cast.get("ability", "")
		c.caster_type = cast.get("type", "")
		c.slots_max = RulesDB.slots_for(c.caster_type, level)
		c.slots = c.slots_max.duplicate()
		for x in s.get("cantrips", []):
			_add_spell(c, x, "class")
		var prep: Dictionary = s.get("prepared", {})
		for x in RulesDB.at_level(prep, level, []):
			_add_spell(c, x, "class")
		for x in CharacterSheet.always_prepared(s, level):
			if not x in c.always_prepared:
				c.always_prepared.append(x)
			c.prepared.erase(x)
			if RulesDB.spell(x).get("level", 0) == 0:
				_add_spell(c, x, "class")
			c.spell_source[x] = "class"
		# Usos gratuitos de clase
		if c.cls == "paladin" and level >= 2:
			c.free_casts["divine_smite"] = int(c.free_casts.get("divine_smite", 0)) + 1
		if c.cls == "ranger":
			c.free_casts["hunters_mark"] = int(c.free_casts.get("hunters_mark", 0)) + int(RulesDB.at_level(cd.get("favored_enemy_uses", {}), level, 2))
	# Iniciado en la magia
	var mi: Dictionary = s.get("magic_initiate", {})
	if not mi.is_empty() and "magic_initiate" in c.feats:
		var ab: String = mi.get("ability", "int")
		for x in mi.get("cantrips", []):
			_add_spell(c, x, "feat", ab)
		var sp: String = mi.get("spell", "")
		if not sp.is_empty():
			_add_spell(c, sp, "feat", ab, true)
	# Guerrero bendito / druídico: dos trucos de otra lista
	if c.fighting_style in ["blessed_warrior", "druidic_warrior"]:
		var lst := "cleric" if c.fighting_style == "blessed_warrior" else "druid"
		var ab2 := "cha" if lst == "cleric" else "wis"
		var picks: Array = s.get("style_cantrips", [])
		if picks.size() < 2:
			picks = ["sacred_flame", "guidance"] if lst == "cleric" else ["starry_wisp", "guidance"]
		for x in picks.slice(0, 2):
			_add_spell(c, x, "style", ab2)
	# Brujo: invocaciones mágicas
	if c.cls == "warlock":
		if "pact_of_the_tome" in c.traits:
			for x in s.get("tome_cantrips", []):
				_add_spell(c, x, "tome", "cha")
		if "armor_of_shadows" in c.traits:
			c.at_will.append("mage_armor")
			c.spell_source["mage_armor"] = "invocation"
			c.spell_ability["mage_armor"] = "cha"
		if "fiendish_vigor" in c.traits:
			c.at_will.append("false_life")
			c.spell_source["false_life"] = "invocation"
			c.spell_ability["false_life"] = "cha"
	# Taumaturgo / Místico: bonificador ya contado en los trucos
	if c.casting_ability.is_empty():
		for sid in c.spell_ability.keys():
			c.casting_ability = c.spell_ability[sid]
			break

## Crea un monstruo a partir de su bloque de estadísticas.
static func make_monster(mid: String, index: int = 1) -> Creature:
	var m := RulesDB.monster_data(mid)
	var c := Creature.new()
	c.id = "%s#%d" % [mid, index]
	c.template_id = mid
	c.name = m.get("name", mid)
	c.team = 1
	c.is_pc = false
	c.size = m.get("size", "medium")
	c.ctype = m.get("type", "humanoid")
	c.tags = m.get("tags", []).duplicate()
	c.abilities = _int_dict(m.get("abilities", {}))
	c.save_overrides = _int_dict(m.get("saves", {}))
	c.skill_overrides = _int_dict(m.get("skills", {}))
	c.prof_bonus = int(m.get("pb", 2))
	c.fixed_ac = int(m.get("ac", 10))
	c.max_hp = int(m.get("hp", 1))
	c.hp = c.max_hp
	c.base_speed = int(m.get("speed", 30))
	c.init_bonus_override = int(m.get("init", c.mod("dex")))
	c.resist = m.get("resist", []).duplicate()
	c.vulnerable = m.get("vulnerable", []).duplicate()
	c.immune = m.get("immune", []).duplicate()
	c.condition_immune = m.get("condition_immune", []).duplicate()
	c.traits = m.get("traits", []).duplicate()
	c.darkvision = int(m.get("darkvision", 0))
	c.multiattack = m.get("multiattack", {}).duplicate()
	c.life_drain = m.get("life_drain", {}).duplicate()
	c.bonus_actions = m.get("bonus_actions", []).duplicate()
	c.reactions = m.get("reactions", []).duplicate()
	c.visual = m.get("visual", {})
	c.ai_profile = m.get("ai", "brute")
	c.xp = int(m.get("xp", 0))
	c.cr = str(m.get("cr", ""))
	c.weapons = monster_attacks(m, c)
	return c

static func monster_attacks(m: Dictionary, c: Creature) -> Array:
	var out: Array = []
	for a in m.get("attacks", []):
		var w: Dictionary = a.duplicate(true)
		w["monster"] = true
		if w.get("kind") == "ranged" and not w.has("props"):
			w["props"] = []
		if w.has("ammo"):
			c.ammo[w.id] = int(w.ammo)
			w["ammo_key"] = w.id
		out.append(w)
	return out

static func species_name(sp: String) -> String:
	return RulesDB.species.get(sp, {}).get("name", sp)

static func background_name(bg: String) -> String:
	return RulesDB.backgrounds.get(bg, {}).get("name", bg)

static func _int_dict(d: Dictionary) -> Dictionary:
	var out := {}
	for k in d.keys():
		out[k] = int(d[k])
	return out
