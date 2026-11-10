extends SceneTree
## Volcado de referencia desde la versión de Godot para comparar con el núcleo en C++.
## godot --headless --path <proyecto-godot> -s <ruta>/parity_dump.gd -- <salida.json>

func summ(c: Creature) -> Dictionary:
	var saves := {}
	for a in Creature.ABILITIES:
		saves[a] = c.save_bonus(a)
	var skills := {}
	for s in Creature.SKILL_ABILITY.keys():
		skills[s] = c.skill_bonus(s)
	return {
		"id": c.id, "name": c.name, "level": c.level, "cls": c.cls, "subclass": c.subclass, "species": c.species,
		"lineage": c.lineage, "ancestry": c.ancestry, "background": c.background, "size": c.size, "ctype": c.ctype, "team": c.team,
		"max_hp": c.max_hp, "ac": c.ac(), "speed": c.speed(), "base_speed": c.base_speed, "abilities": c.abilities,
		"saves": saves, "skills": skills, "init": c.initiative_bonus(), "pp": c.passive_perception(), "pb": c.prof_bonus,
		"traits": c.traits, "feats": c.feats, "resist": c.resist, "vulnerable": c.vulnerable, "immune": c.immune,
		"condition_immune": c.condition_immune, "masteries": c.masteries, "expertise": c.expertise, "skill_profs": c.skill_profs,
		"save_profs": c.save_profs, "weapons": c.weapons, "cantrips": c.cantrips, "prepared": c.prepared,
		"always_prepared": c.always_prepared, "at_will": c.at_will, "known": c.known_spells(), "free_casts": c.free_casts,
		"slots": c.slots, "resources": c.resources, "spell_source": c.spell_source, "spell_ability": c.spell_ability,
		"casting_ability": c.casting_ability, "caster_type": c.caster_type, "dc": c.spell_save_dc(), "atk": c.spell_attack_bonus(),
		"sneak": c.sneak_attack, "martial_die": c.martial_die, "rage_damage": c.rage_damage, "bardic_die": c.bardic_die,
		"pact_weapon": c.pact_weapon, "breath_type": c.breath_type, "ammo": c.ammo, "items": c.items, "darkvision": c.darkvision,
		"fighting_style": c.fighting_style, "armor_id": c.armor_id, "has_shield": c.has_shield, "wild_shapes": c.wild_shapes,
		"metamagic": c.metamagic, "multiattack": c.multiattack, "life_drain": c.life_drain, "bonus_actions": c.bonus_actions,
		"reactions": c.reactions, "ai": c.ai_profile, "xp": c.xp, "tags": c.tags, "init_override": c.init_bonus_override,
		"fixed_ac": c.fixed_ac, "reach": c.reach_cells(), "sheet": c.sheet, "visual": c.visual,
		"ranged": c.ranged_options().map(func(w): return w.get("id")),
		"melee": c.melee_weapons().map(func(w): return w.get("id")),
		"prof": c.weapons.map(func(w): return c.is_proficient(w)),
		"watk": c.weapons.map(func(w): return c.weapon_attack_ability(w)),
		"mastery": c.weapons.map(func(w): return c.has_mastery(w)),
	}

func cells(arr: Array) -> Array:
	return arr.map(func(v): return [v.x, v.y])

func map_dump(rows: Array) -> Dictionary:
	var m := BattleMap.new()
	m.load_rows(rows)
	var w := m.width
	var h := m.height
	var covers: Array = []
	for i in 160:
		var a := Vector2i((i * 7 + 3) % w, (i * 13 + 1) % h)
		var b := Vector2i((i * 11 + 5) % w, (i * 5 + 2) % h)
		covers.append(m.cover_between(a, b))
	var areas: Array = []
	for i in 24:
		var c := Vector2i((i * 5 + 2) % w, (i * 3 + 1) % h)
		var t := Vector2i((i * 9 + 4) % w, (i * 7 + 3) % h)
		var p: Vector2 = BattleMap.corners(c)[i % 6] if i % 2 == 1 else BattleMap.center(c)
		areas.append({
			"sphere": cells(m.sphere_cells(p, 10 + 5 * (i % 3))),
			"cone": cells(m.cone_cells(c, BattleMap.center(t), 15)),
			"cube": cells(m.cube_from_self(c, BattleMap.center(t), 15)),
			"square": cells(m.square_cells(p, 10)),
			"line": cells(m.line_cells(c, BattleMap.center(t), 30)),
			"eman": cells(m.emanation_cells(c, 10)),
			"snap": [BattleMap.cell_at(BattleMap.snap_point(BattleMap.center(c) + Vector2(0.21, -0.17))).x, BattleMap.cell_at(BattleMap.snap_point(BattleMap.center(c) + Vector2(0.21, -0.17))).y],
			"step": [BattleMap.step_toward(c, BattleMap.center(t) - BattleMap.center(c)).x, BattleMap.step_toward(c, BattleMap.center(t) - BattleMap.center(c)).y],
		})
	var mover := Factory.make_pc("brenna", 1)
	var reach: Array = []
	var paths: Array = []
	for i in 6:
		var s := Vector2i((i * 17 + 6) % w, (i * 7 + 4) % h)
		if not m.walkable(s):
			reach.append(null)
		else:
			mover.cell = s
			var r := m.reachable(s, 30, mover, {s: mover})
			var cost_list: Array = []
			for k in r.cost.keys():
				cost_list.append([k.x, k.y, r.cost[k]])
			reach.append(cost_list)
		var g := Vector2i((i * 23 + 9) % w, (i * 11 + 7) % h)
		paths.append(cells(m.find_path(s, g)))
	return {"w": w, "h": h, "covers": covers, "areas": areas, "reach": reach, "paths": paths}

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out_path: String = args[0] if args.size() > 0 else "parity_godot.json"
	var out := {"party": {}, "monsters": {}, "synthetic": {}, "names": [], "maps": {}}
	for pid in RulesDB.party.keys():
		for lv in [1, 2, 3]:
			out.party["%s@%d" % [pid, lv]] = summ(Factory.make_pc(pid, lv))
	for mid in RulesDB.monsters.keys():
		out.monsters[mid] = summ(Factory.make_monster(mid, 1))
	for cls in RulesDB.classes.keys():
		for sp in RulesDB.species.keys():
			var variants: Array = [{}]
			var spd: Dictionary = RulesDB.species[sp]
			if spd.has("lineages"):
				variants = []
				for l in spd.lineages.keys():
					variants.append({"lineage": l})
			if spd.has("ancestries"):
				variants = []
				for a in spd.ancestries.keys():
					variants.append({"ancestry": a})
			for v in variants:
				for lv in [1, 2, 3]:
					var sheet := {"name": "Prueba", "class": cls, "species": sp}
					for k in v.keys():
						sheet[k] = v[k]
					var key := "%s|%s|%s@%d" % [cls, sp, str(v.values()), lv]
					out.synthetic[key] = summ(Factory.make_from_sheet(sheet, lv, "t"))
		for sub in RulesDB.classes[cls].get("subclasses", {}).keys():
			var sheet2 := {"name": "Sub", "class": cls, "species": "human", "subclass": sub}
			out.synthetic["%s:%s@3" % [cls, sub]] = summ(Factory.make_from_sheet(sheet2, 3, "s"))
	for sp in RulesDB.names.keys():
		for pr in ["m", "f", "n"]:
			for i in 4:
				var rng := RandomNumberGenerator.new()
				rng.seed = 1000 + i
				out.names.append(CharacterSheet.random_name(sp, pr, rng))
	for eid in RulesDB.encounters.keys():
		out.maps["enc:" + eid] = map_dump(RulesDB.encounters[eid].get("rows", []))
	for lid in RulesDB.levels.keys():
		out.maps["lvl:" + lid] = map_dump(RulesDB.levels[lid].get("rows", []))
	var f := FileAccess.open(out_path, FileAccess.WRITE)
	f.store_string(JSON.stringify(out, "", false))
	f.close()
	print("volcado: ", out_path)
	quit()
