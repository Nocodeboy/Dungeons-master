extends RefCounted
## Pruebas de objetos: equipo mágico, inventario, munición, pociones, pergaminos y varitas.

var runner

func _sheet(pid := "brenna") -> Dictionary:
	var s: Dictionary = RulesDB.party[pid].duplicate(true)
	s["id"] = pid
	Campaign.materialize(s)
	return s

func test_magic_weapon_and_armor() -> void:
	var s := _sheet()
	var base := Factory.make_from_sheet(s, 1, "brenna")
	var b := Battle.new(BattleMap.new(), 1)
	var p0: Dictionary = b.attack_profiles(base)[0]
	s["weapons"][0] = "longsword_p1"
	s["armor"] = "chain_mail_p1"
	var c := Factory.make_from_sheet(s, 1, "brenna")
	var p1: Dictionary = b.attack_profiles(c)[0]
	runner.eq(int(p1.bonus), int(p0.bonus) + 1, "+1 al ataque")
	runner.check(str(p1.damage[0].dice).ends_with("+%d" % (base.mod("str") + 1)), "+1 al daño: " + str(p1.damage[0].dice))
	runner.eq(c.ac(), base.ac() + 1, "armadura +1")
	runner.check("longsword" in c.masteries and c.has_mastery(c.weapons[0]), "la maestría sigue valiendo con el arma mágica")

func test_worn_items() -> void:
	var s := _sheet("odvar")
	var base := Factory.make_from_sheet(s, 1, "odvar")
	s["worn"] = {"cloak": "cloak_protection", "gloves": "gauntlets_ogre_power", "amulet": "amulet_health"}
	var c := Factory.make_from_sheet(s, 1, "odvar")
	runner.eq(c.ac(), base.ac() + 1, "capa: +1 CA")
	runner.eq(c.save_bonus("dex"), base.save_bonus("dex") + 1, "capa: +1 salvaciones")
	runner.eq(int(c.abilities.str), 19, "guanteletes: Fue 19")
	runner.check(c.max_hp > base.max_hp, "amuleto de salud: más PG")

func test_equip_rules() -> void:
	var s := _sheet("pip")
	Items.add_to(s, "cloak_protection", 1, true)
	var idx: int = Items.pack(s).size() - 1
	runner.check(not Items.equip(s, idx).is_empty(), "sin identificar no se equipa")
	Items.identify_all(s)
	runner.eq(Items.equip(s, idx), "", "identificada se equipa")
	runner.eq(s.worn.cloak, "cloak_protection", "en su hueco")
	for id in ["ring_protection", "stone_good_luck", "gauntlets_ogre_power"]:
		Items.add_to(s, id)
	runner.eq(Items.equip(s, Items.pack(s).size() - 3), "", "anillo")
	runner.eq(Items.equip(s, Items.pack(s).size() - 2), "", "piedra")
	runner.check(not Items.equip(s, Items.pack(s).size() - 1).is_empty(), "no más de tres objetos en sintonía")
	Items.unequip(s, "cloak")
	runner.check(not s.worn.has("cloak"), "quitar la capa")
	runner.check(Items.pack(s).any(func(e): return e.id == "cloak_protection"), "vuelve a la mochila")

func test_ammo_groups() -> void:
	var s := _sheet("pip")
	runner.check(s.ammo.has("bolts") and not s.ammo.has("light_crossbow"), "la munición de la ballesta se guarda como virotes")
	var before := int(s.ammo.bolts)
	Items.add_to(s, "bolts")
	runner.eq(int(s.ammo.bolts), before + 20, "comprar virotes")
	Items.add_to(s, "arrows")
	runner.eq(int(s.items.get("arrows", 0)), 1, "las flechas sin arco van a la mochila")
	var c := Factory.make_from_sheet(s, 1, "pip")
	var bow: Dictionary = {}
	for w in c.weapons:
		if w.id == "light_crossbow":
			bow = w
	runner.eq(c.ammo_left(bow), before + 20, "la ballesta usa los virotes")

func test_potions_and_scrolls() -> void:
	var b := BattleSetup.build("e1_prado", 3)
	var ilyra := b.get_creature("ilyra")
	ilyra.items["potion_greater_healing"] = 1
	ilyra.hp = 1
	b.current = ilyra
	ilyra.reset_turn()
	runner.check(b.do_item(ilyra, ilyra, "potion_greater_healing"), "beber poción mayor")
	runner.check(ilyra.hp >= 9, "cura 4d4+4")
	runner.check(not ilyra.items.has("potion_greater_healing"), "se gasta")
	# Pergamino de Saeta guía: CD/ataque del pergamino y se consume
	ilyra.reset_turn()
	ilyra.items["scroll_guiding_bolt"] = 1
	var slots_before := ilyra.slots.duplicate()
	var foe: Creature = null
	for e in b.creatures:
		if e.team == 1:
			foe = e
			break
	ilyra.cell = foe.cell + Vector2i(-3, 0)
	var ok := b.spells.cast(ilyra, "guiding_bolt", 1, {"targets": [foe.id], "item": "scroll_guiding_bolt"})
	runner.check(ok, "lanzar desde el pergamino")
	runner.check(not ilyra.items.has("scroll_guiding_bolt"), "el pergamino se consume")
	runner.eq(ilyra.slots, slots_before, "no gasta espacios")

func test_wand_charges() -> void:
	var b := BattleSetup.build("e1_prado", 4)
	var odvar := b.get_creature("odvar")
	odvar.items["wand_magic_missiles"] = 1
	odvar.item_charges["wand_magic_missiles"] = 7
	b.current = odvar
	odvar.reset_turn()
	var foe: Creature = null
	for e in b.creatures:
		if e.team == 1:
			foe = e
			break
	odvar.cell = foe.cell + Vector2i(-4, 0)
	var ok := b.spells.cast(odvar, "magic_missile", 2, {"targets": [foe.id, foe.id, foe.id, foe.id], "item": "wand_magic_missiles"})
	runner.check(ok, "varita a nivel 2")
	runner.eq(int(odvar.item_charges.wand_magic_missiles), 5, "gasta 2 cargas")

func test_campaign_inventory() -> void:
	var cp := Campaign.new_game(RulesDB.party["brenna"].duplicate(true), ["pip", "ilyra", "odvar"])
	cp.give_item("cloak_protection", 1, true)
	var rep := cp.short_rest()
	runner.check("Capa de protección" in rep._identified, "el descanso corto identifica")
	var who := cp.give_item("bolts")
	runner.eq(who, "pip", "los virotes van a quien tiene ballesta")
	cp.members["odvar"]["items"]["wand_magic_missiles"] = 1
	cp.members["odvar"]["charges"] = {"wand_magic_missiles": 0}
	cp.long_rest()
	var ch := int(cp.members["odvar"].charges.wand_magic_missiles)
	runner.check(ch >= 2 and ch <= 7, "la varita recarga al amanecer")
	var d: Dictionary = JSON.parse_string(JSON.stringify(cp.to_dict()))
	var cp2 := Campaign.from_dict(d)
	runner.eq(typeof(cp2.members["pip"].ammo.bolts), TYPE_INT, "munición entera tras cargar")
