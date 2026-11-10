extends RefCounted
## Pruebas de las 12 clases, especies y conjuros nuevos (fase 2a).

var runner

const CLASSES := ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"]
const SPECIES := ["human", "elf", "half_elf", "dwarf", "halfling", "gnome", "dragonborn", "goliath", "orc", "half_orc", "tiefling"]

func _battle(rows: Array = [], seed_value := 7) -> Battle:
	var m := BattleMap.new()
	if rows.is_empty():
		rows = ["............", "............", "............", "............", "............", "............", "............", "............"]
	m.load_rows(rows)
	return Battle.new(m, seed_value)

func _place(b: Battle, c: Creature, cell: Vector2i) -> Creature:
	c.cell = cell
	b.add_creature(c)
	return c

func _pc(cls: String, level := 3, extra := {}) -> Creature:
	var s := {"name": "Prueba", "class": cls}
	s.merge(extra, true)
	return Factory.make_from_sheet(s, level, "pc_" + cls)

func _start(b: Battle, c: Creature) -> void:
	b.current = c
	c.reset_turn()

# ------------------------------------------------------------------ construcción

func test_every_class_and_species_builds() -> void:
	for cls in CLASSES:
		for sp in SPECIES:
			for lvl in [1, 2, 3]:
				var sheet := {"name": "X", "class": cls, "species": sp}
				var full := CharacterSheet.complete(sheet, lvl)
				var errs := CharacterSheet.validate(full, lvl)
				runner.check(errs.is_empty(), "%s %s nv%d: %s" % [cls, sp, lvl, str(errs)])
				var c := Factory.make_from_sheet(sheet, lvl, "x")
				runner.check(c.max_hp > 0 and c.ac() >= 10, "%s %s nv%d PG/CA" % [cls, sp, lvl])
				runner.check(c.weapons.size() > 0, "%s %s nv%d sin armas" % [cls, sp, lvl])
				var cd: Dictionary = RulesDB.classes[cls]
				if cd.has("casting"):
					runner.check(c.known_spells().size() > 0, "%s nv%d conoce conjuros" % [cls, lvl])

func test_companions_unchanged() -> void:
	var br := Factory.make_pc("brenna", 1)
	runner.eq(br.ac(), 19, "Brenna: cota de mallas + escudo + defensa")
	runner.eq(br.max_hp, 12, "Brenna nv1: 10 + CON 2")
	var od := Factory.make_pc("odvar", 3)
	runner.eq(od.slots_max, [4, 2], "mago nv3")
	runner.check("mage_armor" in od.known_spells(), "Odvar tiene Armadura de mago")
	var il := Factory.make_pc("ilyra", 3)
	runner.check("aid" in il.always_prepared, "dominio de la Vida siempre preparado")
	runner.check(il.cantrips.size() >= 3, "clériga: al menos tres trucos")
	runner.eq(il.base_speed, 35, "elfa de los bosques")

func test_slot_tables() -> void:
	runner.eq(_pc("paladin", 1).slots_max, [2], "paladín nv1")
	runner.eq(_pc("ranger", 3).slots_max, [3], "explorador nv3")
	runner.eq(_pc("warlock", 1).slots_max, [1], "brujo nv1")
	runner.eq(_pc("warlock", 3).slots_max, [0, 2], "brujo nv3: dos espacios de nivel 2")
	runner.eq(_pc("bard", 3).slots_max, [4, 2], "bardo nv3")

# ------------------------------------------------------------------ bárbaro

func test_barbarian_rage_and_defense() -> void:
	var b := _battle()
	var c := _place(b, _pc("barbarian", 3, {"species": "goliath", "ancestry": "hill"}), Vector2i(2, 2))
	runner.eq(c.ac(), 10 + c.mod("dex") + c.mod("con"), "defensa sin armadura")
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(3, 2))
	_start(b, c)
	runner.check(b.cls.use(c, "rage"), "entra en furia")
	runner.check(c.is_raging(), "en furia")
	var hp := c.hp
	b.apply_damage(c, 10, "slashing", g)
	runner.eq(c.hp, hp - 5, "resistencia en furia")
	runner.check(not c.can_cast("bless"), "no lanza conjuros en furia")
	var p: Dictionary = b.attack_profiles(c)[0]
	var mi := b.attack_mode(c, g, p.kind, null, p)
	runner.check(not "reckless" in mi.adv, "sin temerario aún")
	runner.check(b.cls.use(c, "reckless"), "ataque temerario")
	mi = b.attack_mode(c, g, p.kind, null, p)
	runner.check("reckless" in mi.adv, "temerario da ventaja")
	var mi2 := b.attack_mode(g, c, "melee", null, b.attack_profiles(g)[0])
	runner.check("reckless_target" in mi2.adv, "y el enemigo también")
	# La furia acaba si en el turno siguiente no ataca
	b._finish_turn(c)
	runner.check(c.is_raging(), "sigue al final del primer turno")
	c.reset_turn()
	b._finish_turn(c)
	runner.check(not c.is_raging(), "se apaga si no la mantiene")

# ------------------------------------------------------------------ bardo

func test_bard_inspiration_and_cutting_words() -> void:
	var b := _battle()
	var bard := _place(b, _pc("bard", 3, {"species": "elf"}), Vector2i(1, 1))
	var ally := _place(b, Factory.make_pc("brenna", 3), Vector2i(2, 1))
	_start(b, bard)
	runner.check(b.cls.use(bard, "bardic_inspiration", {"target": ally.id}), "inspira a Brenna")
	runner.check(ally.has_effect("bardic_inspiration"), "Brenna inspirada")
	runner.check(bard.has_trait("cutting_words"), "colegio del saber nv3")
	runner.check(bard.has_trait("jack_of_all_trades"), "polivalente nv2")
	runner.eq(bard.initiative_bonus(), bard.mod("dex") + 1, "polivalente suma a la iniciativa")

# ------------------------------------------------------------------ druida

func test_druid_wild_shape() -> void:
	var b := _battle()
	var d := _place(b, _pc("druid", 3), Vector2i(2, 2))
	var hp := d.hp
	_start(b, d)
	runner.check(b.cls.use(d, "wild_shape", {"choice": "wolf"}), "se convierte en lobo")
	runner.eq(d.form, "wolf", "forma de lobo")
	runner.eq(d.ac(), 12, "CA del lobo")
	runner.eq(d.temp_hp, 3, "PG temporales = nivel")
	runner.eq(d.hp, hp, "conserva sus PG")
	runner.check(d.has_trait("pack_tactics"), "táctica de manada")
	runner.check(not d.can_cast("cure_wounds"), "sin conjuros en forma salvaje")
	runner.check(b.attack_profiles(d)[0].key == "m:bite", "ataca con el mordisco")
	b.apply_damage(d, d.hp + d.temp_hp, "slashing")
	runner.eq(d.form, "", "al caer recupera su forma")
	runner.check(d.ac() < 17, "vuelve su CA")

func test_druid_circle_spells() -> void:
	var d := _pc("druid", 3, {"land": "arid"})
	runner.check("blur" in d.always_prepared and "burning_hands" in d.always_prepared, "tierra árida")
	runner.check("fire_bolt" in d.cantrips, "truco del círculo")

# ------------------------------------------------------------------ monje

func test_monk() -> void:
	var b := _battle()
	var m := _place(b, _pc("monk", 3), Vector2i(2, 2))
	runner.eq(m.ac(), 10 + m.mod("dex") + m.mod("wis"), "defensa sin armadura del monje")
	runner.eq(m.speed(), 40, "movimiento sin armadura")
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(3, 2))
	_start(b, m)
	var unarmed := b.profile_by_key(m, "w:unarmed")
	runner.eq(str(unarmed.die), "1d6", "dado de artes marciales")
	runner.eq(unarmed.ability, "dex", "golpe con Destreza")
	var fp: int = m.resources.focus
	runner.check(b.cls.use(m, "flurry", {"target": g.id}), "ráfaga de golpes")
	runner.eq(m.resources.focus, fp - 1, "gasta foco")
	runner.eq(m.turn.bonus, 0, "gasta la acción adicional")

# ------------------------------------------------------------------ paladín

func test_paladin_smite_and_lay_on_hands() -> void:
	var b := _battle(["..........", "..........", ".........."], 3)
	var p := _place(b, _pc("paladin", 3), Vector2i(1, 1))
	var z := _place(b, Factory.make_monster("zombie"), Vector2i(2, 1))
	z.max_hp = 200
	z.hp = 200
	_start(b, p)
	runner.eq(p.free_casts.get("divine_smite", 0), 1, "castigo gratis")
	runner.check("divine_smite" in p.known_spells(), "castigo siempre preparado")
	var prof := b.best_melee_profile(p)
	var opts := b.spells.rider_options(p, prof)
	runner.check(not opts.is_empty(), "opciones de castigo")
	# Forzamos el impacto con un objetivo paralizado
	var e := Effect.new("hold")
	e.grants = ["paralyzed"]
	b._attach_effect(z, e)
	var res := b.do_attack(p, prof.key, z, {"rider": {"spell": "divine_smite", "slot": 1}})
	runner.check(res.hit, "impacta al paralizado")
	runner.eq(p.free_casts.get("divine_smite", 0), 0, "usa el castigo gratis")
	runner.check(res.damage >= 2 * 3 + 2, "crítico con castigo hace mucho daño (%d)" % res.damage)
	b._remove_effect(e)
	# Imposición de manos
	var ally := _place(b, Factory.make_pc("pip", 3), Vector2i(1, 2))
	b.apply_damage(ally, 6, "slashing")
	p.reset_turn()
	runner.check(b.cls.use(p, "lay_on_hands", {"target": ally.id}), "impone las manos")
	runner.eq(ally.hp, ally.max_hp, "cura lo que falta")
	runner.eq(p.resources.lay_on_hands, 15 - 6, "gasta la reserva")

# ------------------------------------------------------------------ explorador

func test_ranger_hunters_mark() -> void:
	var b := _battle()
	var r := _place(b, _pc("ranger", 1), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_boss"), Vector2i(5, 1))
	_start(b, r)
	runner.eq(r.free_casts.get("hunters_mark", 0), 2, "dos marcas gratis")
	runner.check(b.spells.cast(r, "hunters_mark", 1, {"targets": [g.id]}), "marca al cabecilla")
	runner.eq(r.free_casts.get("hunters_mark", 0), 1, "usa una gratis")
	runner.check(g.has_effect("hunters_mark"), "marcado")
	runner.eq(r.concentration_spell, "hunters_mark", "concentración")
	var p: Dictionary = b.attack_profiles(r).filter(func(x): return x.kind == "ranged")[0]
	var pv := b.preview_attack(r, p, g)
	runner.check(pv.extras.size() > 0, "la previsión cuenta la marca")

# ------------------------------------------------------------------ hechicero y brujo

func test_sorcerer() -> void:
	var b := _battle()
	var s := _place(b, _pc("sorcerer", 3, {"species": "dragonborn", "ancestry": "red"}), Vector2i(1, 1))
	runner.eq(s.ac(), 10 + s.mod("dex") + s.mod("cha"), "escamas dracónicas")
	var dc := s.spell_save_dc()
	_start(b, s)
	runner.check(b.cls.use(s, "innate_sorcery"), "hechicería innata")
	runner.eq(s.spell_save_dc(), dc + 1, "+1 a la CD")
	s.reset_turn()
	var slots: int = s.slots[0]
	runner.check(b.cls.use(s, "create_slot", {"choice": "1"}), "crea un espacio")
	runner.eq(s.slots[0], slots + 1, "espacio extra")
	runner.eq(s.resources.sorcery_points, 1, "gasta 2 puntos")

func test_warlock() -> void:
	var b := _battle()
	var w := _place(b, _pc("warlock", 3), Vector2i(1, 1))
	runner.check(w.has_trait("eldritch_mind"), "mente sobrenatural por defecto")
	var w2 := _pc("warlock", 2, {"invocations": {"1": ["armor_of_shadows"], "2": ["armor_of_shadows", "fiendish_vigor", "agonizing_blast"]}, "armor": "", "weapons": ["dagger"]})
	BattleSetup.precast(b, w2)
	runner.check(w2.has_effect("mage_armor"), "armadura de sombras precargada")
	runner.eq(w2.temp_hp, 12, "vigor infernal: 12 PG temporales")
	runner.check(w.has_trait("agonizing_blast"), "descarga agónica")
	var sp := RulesDB.spell("eldritch_blast")
	runner.eq(b.spells.damage_expr(w, sp, 0), "1d10+%d" % w.mod("cha"), "agónica suma Carisma")
	# Bendición del Oscuro
	var g := _place(b, Factory.make_monster("goblin_minion"), Vector2i(2, 1))
	b.apply_damage(g, 50, "force", w)
	runner.eq(w.temp_hp, w.mod("cha") + 3, "PG temporales al matar")

# ------------------------------------------------------------------ especies

func test_species_traits() -> void:
	var b := _battle()
	var db := _place(b, _pc("fighter", 1, {"species": "dragonborn", "ancestry": "blue"}), Vector2i(1, 1))
	runner.check("lightning" in db.resist, "resistencia dracónica")
	runner.eq(db.resources.breath_weapon, 2, "aliento: BC usos")
	var g1 := _place(b, Factory.make_monster("goblin_minion"), Vector2i(2, 1))
	var g2 := _place(b, Factory.make_monster("goblin_minion", 2), Vector2i(3, 1))
	_start(b, db)
	runner.check(b.cls.use(db, "breath_line", {"dir": Vector2(6.5, 1.5)}), "exhala en línea")
	runner.eq(db.turn.action, 0, "gasta la acción de atacar")
	runner.check(g1.hp < g1.max_hp or g1.dead, "alcanza al primero")
	var orc := _place(b, _pc("barbarian", 1, {"species": "orc"}), Vector2i(1, 4))
	b.apply_damage(orc, orc.hp + 2, "slashing")
	runner.eq(orc.hp, 1, "aguante incansable")
	var tf := _pc("warlock", 3, {"species": "tiefling", "lineage": "infernal"})
	runner.check("fire" in tf.resist, "tiflin infernal resiste fuego")
	runner.eq(tf.free_casts.get("hellish_rebuke", 0), 1, "reprensión infernal gratis a nivel 3")
	var dw := _pc("cleric", 3, {"species": "dwarf"})
	var hu := _pc("cleric", 3, {"species": "human"})
	runner.eq(dw.max_hp - hu.max_hp, 3 + (dw.mod("con") - hu.mod("con")) * 3, "dureza enana")
	var gn := _pc("wizard", 1, {"species": "gnome"})
	runner.check(gn.has_trait("gnomish_cunning"), "astucia gnoma")
	var el := _pc("wizard", 3, {"species": "elf", "lineage": "drow"})
	runner.eq(el.darkvision, 120, "drow ve 36 m")
	runner.check("faerie_fire" in el.known_spells(), "fuego feérico del drow")

# ------------------------------------------------------------------ conjuros

func test_zone_spells() -> void:
	var b := _battle()
	var d := _place(b, _pc("druid", 1), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(6, 3))
	_start(b, d)
	runner.check(b.spells.cast(d, "entangle", 1, {"point": Vector2(7, 4)}), "enmarañar")
	runner.eq(b.zones.size(), 1, "zona creada")
	runner.check(b.map.is_difficult(Vector2i(6, 3)), "terreno difícil")
	b.end_concentration(d)
	runner.eq(b.zones.size(), 0, "la zona cae con la concentración")
	runner.check(not g.has_condition("restrained"), "ya no apresa")

func test_fog_blocks_sight() -> void:
	var b := _battle()
	var w := _place(b, _pc("wizard", 1), Vector2i(1, 3))
	var g := _place(b, Factory.make_monster("goblin_archer"), Vector2i(9, 3))
	runner.check(b.sees(g, w), "se ven antes de la niebla")
	_start(b, w)
	runner.check(b.spells.cast(w, "fog_cloud", 1, {"point": Vector2(5, 4)}), "nube de niebla")
	runner.check(not b.sees(g, w), "la niebla corta la vista")
	var p: Dictionary = b.attack_profiles(g).filter(func(x): return x.kind == "ranged")[0]
	var mi := b.attack_mode(g, w, "ranged", null, p)
	runner.check("cant_see" in mi.dis and "unseen" in mi.adv, "ventaja y desventaja se anulan")

func test_debuff_spells() -> void:
	var b := _battle([], 11)
	var bard := _place(b, _pc("bard", 3, {"species": "elf"}), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(4, 1))
	g.save_overrides = {"wis": -20, "con": -20, "dex": -20, "cha": -20, "str": -20}
	_start(b, bard)
	runner.check(b.spells.cast(bard, "hideous_laughter", 1, {"targets": [g.id]}), "risa horrible")
	runner.check(g.has_condition("prone") and g.has_condition("incapacitated"), "derribado e incapacitado")
	b.end_concentration(bard)
	runner.check(not g.has_condition("incapacitated"), "termina con la concentración")
	bard.reset_turn()
	runner.check(b.spells.cast(bard, "blindness_deafness", 2, {"targets": [g.id]}), "ceguera")
	runner.check(g.has_condition("blinded"), "cegado")
	var mi := b.attack_mode(bard, g, "ranged_spell")
	runner.check("unseen" in mi.adv, "atacar a un cegado tiene ventaja")

func test_mirror_image_and_blur() -> void:
	var b := _battle([], 5)
	var w := _place(b, _pc("wizard", 3), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(2, 1))
	_start(b, w)
	runner.check(b.spells.cast(w, "mirror_image", 2, {}), "imagen múltiple")
	runner.eq(int(w.get_effect("mirror_image").data.dupes), 3, "tres dobles")
	var absorbed := 0
	for i in 6:
		if b._mirror_absorbs(g, w):
			absorbed += 1
	runner.check(absorbed >= 1 and absorbed <= 3, "los dobles absorben golpes")

func test_all_spells_cast_without_errors() -> void:
	## Lanza cada conjuro de combate al menos una vez desde una clase que lo tenga.
	var tried := 0
	for sid in RulesDB.spells.keys():
		var sp: Dictionary = RulesDB.spells[sid]
		if sp.get("utility", false) or sp.get("hidden", false) or sp.cast in ["reaction", "rider"]:
			continue
		var cls := ""
		for c2 in CLASSES:
			if sid in RulesDB.classes[c2].get("casting", {}).get("list", []):
				cls = c2
				break
		if cls.is_empty():
			continue
		var b := _battle(["..............", "..............", "..............", "..............", "..............", ".............."], tried + 1)
		var c := Factory.make_from_sheet({"name": "L", "class": cls}, 3, "caster")
		c.prepared.append(sid)
		if int(sp.level) > 0 and c.slots.size() < int(sp.level):
			while c.slots.size() < int(sp.level):
				c.slots.append(0)
		if int(sp.level) > 0:
			c.slots[int(sp.level) - 1] = 3
		_place(b, c, Vector2i(2, 2))
		var ally := _place(b, Factory.make_pc("brenna", 3), Vector2i(2, 3))
		var e1 := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(3, 2))
		var e2 := _place(b, Factory.make_monster("goblin_warrior", 2), Vector2i(6, 2))
		if sp.target == "enemy_humanoid":
			e1.ctype = "humanoid"
		_start(b, c)
		var data := {}
		match sp.target:
			"point":
				data = {"point": BattleMap.center(Vector2i(4, 2))}
			"direction":
				data = {"dir": BattleMap.center(Vector2i(4, 2))}
			"cell":
				data = {"cell": Vector2i(2, 4)}
			"self":
				data = {}
			"darts", "rays":
				var n := b.spells.n_darts(c, sp, max(1, int(sp.level)))
				var ids: Array = []
				for i in n:
					ids.append(e1.id)
				data = {"targets": ids}
			"ally", "allies", "ally_other", "ally_unarmored":
				data = {"targets": [ally.id if sp.target != "ally_unarmored" else c.id]}
			"downed_ally":
				b.apply_damage(ally, ally.hp, "slashing")
				data = {"targets": [ally.id]}
			"creature":
				data = {"targets": [e1.id]}
			_:
				data = {"targets": [e1.id]}
		var ok := b.spells.cast(c, sid, max(int(sp.level), 0), data)
		runner.check(ok, "se puede lanzar %s (%s)" % [sid, cls])
		tried += 1
		# Turno completo para disparar efectos de inicio/fin
		if not b.over:
			b._finish_turn(c)
			b._begin_turn(e1)
			b._finish_turn(e1)
	runner.check(tried > 60, "se probaron %d conjuros" % tried)

func test_class_features_usable() -> void:
	## Usa todos los rasgos con o sin objetivo de cada clase a nivel 3.
	for cls in CLASSES:
		for sp in ["human", "dragonborn", "goliath", "orc"]:
			var b := _battle()
			var c := _place(b, Factory.make_from_sheet({"name": "F", "class": cls, "species": sp, "ancestry": ""}, 3, "f"), Vector2i(2, 2))
			var ally := _place(b, Factory.make_pc("pip", 3), Vector2i(2, 3))
			b.apply_damage(ally, 4, "slashing")
			var e := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(3, 2))
			for f in b.cls.list(c):
				_start(b, c)
				if not f.enabled:
					continue
				var data := {}
				match f.target:
					"enemy", "enemy_adjacent":
						data = {"target": e.id}
					"ally_other", "ally_touch":
						data = {"target": ally.id}
					"creature":
						data = {"target": ally.id}
					"choice":
						if f.options.is_empty():
							continue
						data = {"choice": f.options[0].id}
					"point":
						data = {"point": Vector2(4, 3)}
					"direction":
						data = {"dir": Vector2(5.5, 2.5)}
					"cell":
						data = {"cell": Vector2i(5, 5)}
				b.cls.use(c, f.id, data)
