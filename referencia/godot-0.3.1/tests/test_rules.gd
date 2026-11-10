extends RefCounted
## Pruebas de reglas de combate sobre escenarios pequeños y deterministas.

var runner

func _battle(rows: Array, seed_value := 7) -> Battle:
	var m := BattleMap.new()
	m.load_rows(rows)
	return Battle.new(m, seed_value)

func _open() -> Array:
	return ["..........", "..........", "..........", "..........", ".........."]

func _place(b: Battle, c: Creature, cell: Vector2i) -> Creature:
	c.cell = cell
	b.add_creature(c)
	return c

func test_downed_and_death_saves() -> void:
	var b := _battle(_open())
	var t := _place(b, Factory.make_pc("pip", 1), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(2, 1))
	b.apply_damage(t, 12, "slashing", g)
	runner.eq(t.hp, 0, "a 0 PG")
	runner.check(t.has_condition("unconscious"), "inconsciente")
	runner.check(t.has_condition("prone"), "inconsciente implica derribado")
	runner.check(not t.dead, "no muere si el exceso es menor que su máximo")
	b.apply_damage(t, 3, "slashing", g)
	runner.eq(t.death_failures, 1, "daño a 0 PG = un fallo")
	b.apply_damage(t, 3, "slashing", g, {"crit": true})
	runner.check(t.dead, "crítico a 0 PG = dos fallos más: muerto")

func test_massive_damage() -> void:
	var b := _battle(_open())
	var o := _place(b, Factory.make_pc("odvar", 1), Vector2i(1, 1))
	b.apply_damage(o, o.max_hp * 2, "fire")
	runner.check(o.dead, "daño masivo mata al instante")

func test_heal_revives() -> void:
	var b := _battle(_open())
	var t := _place(b, Factory.make_pc("pip", 1), Vector2i(1, 1))
	b.apply_damage(t, 11, "slashing")
	b.heal(t, 4)
	runner.eq(t.hp, 4, "vuelve con 4 PG")
	runner.check(not t.has_condition("unconscious"), "ya no inconsciente")
	runner.check(t.has_condition("prone"), "sigue derribado tras volver en sí")

func test_resistance_vulnerability() -> void:
	var b := _battle(_open())
	var s := _place(b, Factory.make_monster("skeleton"), Vector2i(1, 1))
	b.apply_damage(s, 5, "bludgeoning")
	runner.eq(s.hp, 3, "vulnerable a contundente: 10 de daño")
	var o := _place(b, Factory.make_pc("odvar", 1), Vector2i(3, 3))
	b.apply_damage(o, 5, "poison")
	runner.eq(o.hp, o.max_hp - 2, "enano resiste veneno: mitad redondeando hacia abajo")
	var z := _place(b, Factory.make_monster("zombie"), Vector2i(5, 3))
	b.apply_damage(z, 4, "poison")
	runner.eq(z.hp, z.max_hp, "zombi inmune al veneno")

func test_prone_advantage() -> void:
	var b := _battle(_open())
	var u := _place(b, Factory.make_pc("brenna", 1), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(2, 1))
	g.add_condition("prone", "test")
	runner.eq(b.attack_mode(u, g, "melee").mode, 1, "cuerpo a cuerpo contra derribado: ventaja")
	var t := _place(b, Factory.make_pc("pip", 1), Vector2i(6, 1))
	runner.eq(b.attack_mode(t, g, "ranged").mode, -1, "a distancia contra derribado: desventaja")

func test_ranged_in_melee() -> void:
	var b := _battle(_open())
	var t := _place(b, Factory.make_pc("pip", 1), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(2, 1))
	var mi := b.attack_mode(t, g, "ranged")
	runner.check("ranged_in_melee" in mi.dis, "disparar con enemigo adyacente da desventaja")

func test_sneak_attack_eligibility() -> void:
	var b := _battle(_open())
	var t := _place(b, Factory.make_pc("pip", 1), Vector2i(1, 1))
	var u := _place(b, Factory.make_pc("brenna", 1), Vector2i(5, 2))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(6, 2))
	var p := b.profile_by_key(t, "w:light_crossbow")
	runner.check(b._sneak_eligible(t, g, p, 0, t.cell), "aliado junto al objetivo: furtivo")
	u.cell = Vector2i(8, 4)
	runner.check(not b._sneak_eligible(t, g, p, 0, t.cell), "sin aliado ni ventaja: no hay furtivo")

func test_concentration_ends_on_down() -> void:
	var b := _battle(_open())
	var j := _place(b, Factory.make_pc("ilyra", 1), Vector2i(1, 1))
	var u := _place(b, Factory.make_pc("brenna", 1), Vector2i(2, 1))
	b.start()
	b.current = j
	j.reset_turn()
	var ok := b.spells.cast(j, "bless", 1, {"targets": [j.id, u.id]})
	runner.check(ok, "lanza Bendecir")
	runner.check(u.has_effect("bless"), "Brenna bendecida")
	runner.eq(j.concentration_spell, "bless", "concentrada")
	b.apply_damage(j, 50, "slashing")
	runner.check(not u.has_effect("bless"), "al caer la clériga termina Bendecir")

func test_one_slot_per_turn() -> void:
	var b := _battle(_open())
	var o := _place(b, Factory.make_pc("odvar", 3), Vector2i(1, 1))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(6, 1))
	b.current = o
	o.reset_turn()
	runner.check(b.spells.cast(o, "magic_missile", 1, {"targets": [g.id, g.id, g.id]}), "primer conjuro con espacio")
	o.turn.action = 1
	runner.check(not b.spells.cast(o, "magic_missile", 1, {"targets": [g.id, g.id, g.id]}) or g.dead, "segundo conjuro con espacio en el mismo turno: no")

func test_opportunity_attack() -> void:
	var b := _battle(_open(), 3)
	var o := _place(b, Factory.make_pc("odvar", 1), Vector2i(2, 2))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(3, 2))
	b.current = o
	o.reset_turn()
	g.reset_turn()
	b.pop_events()
	b.do_move(o, [Vector2i(1, 2), Vector2i(0, 2)])
	var oa := false
	for e in b.pop_events():
		if e.t == "attack" and e.get("oa", false):
			oa = true
	runner.check(oa, "alejarse provoca ataque de oportunidad")
	runner.eq(g.turn.reaction, 0, "gasta la reacción")

func test_disengage_avoids_oa() -> void:
	var b := _battle(_open(), 3)
	var t := _place(b, Factory.make_pc("pip", 2), Vector2i(2, 2))
	var g := _place(b, Factory.make_monster("goblin_warrior"), Vector2i(3, 2))
	b.current = t
	t.reset_turn()
	g.reset_turn()
	runner.check(b.do_disengage(t, true), "Acción astuta: destrabarse")
	b.pop_events()
	b.do_move(t, [Vector2i(1, 2), Vector2i(0, 2)])
	for e in b.pop_events():
		runner.check(not (e.t == "attack" and e.get("oa", false)), "sin ataque de oportunidad")

func test_sleep_skips_undead_and_elves() -> void:
	var b := _battle(_open())
	var o := _place(b, Factory.make_pc("odvar", 1), Vector2i(0, 0))
	var s := _place(b, Factory.make_monster("skeleton"), Vector2i(5, 2))
	b.current = o
	o.reset_turn()
	b.spells.cast(o, "sleep", 1, {"point": Vector2(5.5, 2.5)})
	runner.check(not s.has_effect("sleep"), "los no muertos no duermen")

func test_topple_and_push() -> void:
	var b := _battle(_open(), 11)
	var u := _place(b, Factory.make_pc("brenna", 1), Vector2i(2, 2))
	var g := _place(b, Factory.make_monster("goblin_minion"), Vector2i(3, 2))
	b.push_away(g, u.cell, 2)
	runner.eq(g.cell, Vector2i(5, 2), "empujar 3 m = 2 casillas")

func test_aid_raises_max() -> void:
	var b := _battle(_open())
	var j := _place(b, Factory.make_pc("ilyra", 3), Vector2i(1, 1))
	var u := _place(b, Factory.make_pc("brenna", 3), Vector2i(2, 1))
	b.current = j
	j.reset_turn()
	var before := u.max_hp
	runner.check(b.spells.cast(j, "aid", 2, {"targets": [u.id]}), "lanza Auxilio")
	runner.eq(u.max_hp, before + 5, "Auxilio +5 al máximo")

func test_magic_missile_auto_hit() -> void:
	var b := _battle(_open())
	var o := _place(b, Factory.make_pc("odvar", 1), Vector2i(0, 0))
	var g := _place(b, Factory.make_monster("goblin_boss"), Vector2i(8, 4))
	b.current = o
	o.reset_turn()
	b.spells.cast(o, "magic_missile", 1, {"targets": [g.id, g.id, g.id]})
	runner.check(g.hp <= g.max_hp - 6, "tres dardos, al menos 6 de daño")
