extends RefCounted

var runner

func _map(rows: Array) -> BattleMap:
	var m := BattleMap.new()
	m.load_rows(rows)
	return m

func test_dice_parse() -> void:
	var p := Dice.parse("2d6+3")
	runner.eq(p.count, 2, "count")
	runner.eq(p.sides, 6, "sides")
	runner.eq(p.bonus, 3, "bonus")
	runner.eq(Dice.average("1d8+2"), 6.5, "media")
	runner.eq(Dice.with_bonus("1d6", -2), "1d6-2", "with_bonus")
	runner.eq(Dice.add_dice("1d10", 1), "2d10", "add_dice")
	runner.check(abs(Dice.p_success(5, 15, 0) - 0.55) < 0.001, "p_success normal")
	runner.check(Dice.p_success(5, 15, 1) > 0.55, "ventaja sube")
	runner.check(Dice.p_success(5, 15, -1) < 0.55, "desventaja baja")

func test_party_build() -> void:
	var u := Factory.make_pc("brenna", 1)
	runner.eq(u.max_hp, 12, "PG Brenna nv1")
	runner.eq(u.ac(), 19, "CA Brenna: cota 16 + escudo 2 + defensa 1")
	var u3 := Factory.make_pc("brenna", 3)
	runner.eq(u3.max_hp, 28, "PG Brenna nv3")
	runner.check(u3.has_trait("improved_critical"), "Campeón a nivel 3")
	var t := Factory.make_pc("pip", 1)
	runner.eq(t.max_hp, 10, "PG Pip")
	runner.eq(t.ac(), 14, "CA Pip: cuero 11 + DES 3")
	runner.eq(t.sneak_attack, "1d6", "furtivo nv1")
	runner.eq(t.skill_bonus("stealth"), 7, "Sigilo con pericia")
	runner.eq(t.size, "small", "mediano pequeño")
	var j := Factory.make_pc("ilyra", 3)
	runner.eq(j.slots, [4, 2], "espacios clérigo nv3")
	runner.check("aid" in j.known_spells(), "Auxilio siempre preparado nv3")
	runner.eq(j.base_speed, 35, "elfa de los bosques")
	runner.eq(j.spell_save_dc(), 13, "CD clériga")
	var o := Factory.make_pc("odvar", 1)
	runner.eq(o.max_hp, 9, "PG Odvar nv1 (enano)")
	runner.eq(o.ac(), 11, "sin armadura de mago aún")
	runner.eq(o.spell_attack_bonus(), 5, "ataque conjuro mago")
	runner.check(o.free_casts.has("mage_armor"), "Iniciado: armadura de mago")

func test_monsters() -> void:
	var g := Factory.make_monster("goblin_warrior", 1)
	runner.eq(g.max_hp, 10, "PG trasgo")
	runner.eq(g.ac(), 15, "CA trasgo")
	runner.eq(g.size, "small", "tamaño trasgo")
	var s := Factory.make_monster("skeleton_archer", 2)
	runner.eq(s.max_hp, 13, "arquero hereda del esqueleto")
	runner.eq(s.ai_profile, "archer", "perfil arquero")
	runner.check("bludgeoning" in s.vulnerable, "vulnerable contundente")
	var w := Factory.make_monster("wight", 1)
	runner.eq(w.multiattack.count, 2, "multiataque tumulario")

func test_cover() -> void:
	var m := _map([
		"..........",
		"....#.....",
		"....#.....",
		"....#.....",
		"..........",
	])
	runner.eq(m.cover_between(Vector2i(2, 2), Vector2i(7, 2)), 3, "muro tapa por completo")
	runner.eq(m.cover_between(Vector2i(2, 0), Vector2i(7, 0)), 0, "por encima del muro ve")
	runner.eq(m.cover_between(Vector2i(2, 2), Vector2i(7, 4)), 3, "tras la esquina del muro no hay visión")
	var m3 := _map(["..........", "....#.....", "....#.....", "..........", ".........."])
	var cv := m3.cover_between(Vector2i(2, 2), Vector2i(7, 3))
	runner.check(cv >= 1 and cv <= 2, "cobertura parcial asomando por la esquina: %d" % cv)
	runner.eq(m3.cover_between(Vector2i(5, 6 - 2), Vector2i(5, 1)), 0, "pegado al muro y atacado de frente: sin cobertura")
	var m2 := _map(["......", "..r...", "......"])
	runner.eq(m2.cover_between(Vector2i(0, 1), Vector2i(4, 1)), 1, "roca da cobertura media")

func test_areas() -> void:
	var m := _map(["..........", "..........", "..........", "..........", ".........."])
	var c := Vector2i(4, 2)
	runner.eq(m.sphere_cells(BattleMap.center(c), 5).size(), 7, "esfera 1,5 m desde un centro = 7 hexágonos")
	runner.eq(m.sphere_cells(BattleMap.corners(c)[1], 5).size(), 3, "esfera 1,5 m desde un vértice = 3 hexágonos")
	runner.eq(BattleMap.within(c, 2).size(), 19, "dos anillos = 19 hexágonos")
	var cube := m.cube_from_self(Vector2i(4, 0), BattleMap.center(Vector2i(4, 3)), 15)
	runner.check(cube.size() >= 8 and cube.size() <= 12 and not Vector2i(4, 0) in cube, "cubo 4,5 m razonable: %d" % cube.size())
	var cone := m.cone_cells(Vector2i(1, 2), BattleMap.center(Vector2i(6, 2)), 15)
	runner.check(cone.size() >= 5 and cone.size() <= 9, "cono 4,5 m razonable: %d" % cone.size())
	# Geometría hexagonal básica
	runner.eq(BattleMap.neighbors(c).size(), 6, "seis vecinos")
	for n in BattleMap.neighbors(c):
		runner.eq(BattleMap.dist(c, n), 1, "vecino a 1")
		runner.check(absf(BattleMap.center(c).distance_to(BattleMap.center(n)) - 1.0) < 0.001, "centros a 1 unidad")
		runner.eq(BattleMap.cell_at(BattleMap.center(n)), n, "ida y vuelta centro-casilla")
	runner.eq(BattleMap.dist(Vector2i(0, 0), Vector2i(3, 4)), 5, "distancia hexagonal")

func test_pathing() -> void:
	var m := _map(["........", "...#....", "...#....", "........"])
	var c := Factory.make_pc("brenna", 1)
	c.cell = Vector2i(1, 1)
	var r := m.reachable(c.cell, 30, c, {c.cell: c})
	runner.check(r.cost.has(Vector2i(4, 1)), "rodea el muro")
	runner.check(not r.cost.has(Vector2i(3, 1)), "no entra en el muro")
	runner.eq(r.cost.get(Vector2i(2, 2)), 5, "diagonal cuesta 5 pies")
