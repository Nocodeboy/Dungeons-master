extends RefCounted
## Pruebas del estado de partida: persistencia entre combates, descansos y niveles.

var runner

func _hero(cls := "wizard") -> Dictionary:
	var cc := CharacterCreator.new()
	cc.sheet = {"class": cls, "species": "human", "ability_method": "standard", "pronoun": "f", "visual": {}}
	cc._set_class(cls, true)
	cc.sheet["name"] = "Prueba"
	cc._refill()
	var h := cc.result_sheet()
	cc.free()
	return h

func test_new_game_and_state() -> void:
	var cp := Campaign.new_game(_hero(), ["brenna", "ilyra", "odvar"])
	runner.eq(cp.party.size(), 4, "héroe y tres compañeros")
	runner.check(not cp.recruit("pip"), "no caben cinco")
	var c := cp.creature_for("hero")
	runner.eq(c.hp, c.max_hp, "empieza con todos los PG")
	runner.check(c.slots_max.size() > 0 and c.slots == c.slots_max, "espacios llenos")

func test_damage_and_slots_persist() -> void:
	var cp := Campaign.new_game(_hero(), ["brenna", "ilyra", "odvar"])
	var b := BattleSetup.build("e1_prado", 5, cp.party_sheets(), cp)
	var h := b.get_creature("hero")
	h.hp -= 3
	h.slots[0] -= 1
	var brenna := b.get_creature("brenna")
	brenna.hp = 0
	cp.after_battle(b, true)
	var h2 := cp.creature_for("hero")
	runner.eq(h2.hp, h.max_hp - 3, "los PG se conservan")
	runner.eq(h2.slots[0], h.slots_max[0] - 1, "el espacio gastado sigue gastado")
	runner.eq(cp.creature_for("brenna").hp, 1, "tras ganar, los caídos se levantan a 1 PG")
	var b2 := BattleSetup.build("e2_pinar", 6, cp.party_sheets(), cp)
	runner.eq(b2.get_creature("hero").hp, h.max_hp - 3, "el siguiente combate empieza herido")

func test_rests() -> void:
	var cp := Campaign.new_game(_hero("warlock"), ["brenna", "ilyra", "odvar"])
	var st: Dictionary = cp.state["hero"]
	st.hp = 2
	st.slots = [0]
	cp.state["brenna"].resources["second_wind"] = 0
	cp.state["odvar"].slots = [0]
	var rng := RandomNumberGenerator.new()
	rng.seed = 4
	var rep := cp.short_rest({}, rng)
	runner.check(int(cp.state["hero"].hp) > 2, "el descanso corto cura con dados de golpe")
	runner.check(int(rep["hero"].dice) >= 1, "gasta dados de golpe")
	runner.eq(int(cp.state["hero"].slots[0]), 1, "el brujo recupera su espacio de pacto")
	runner.eq(int(cp.state["brenna"].resources.second_wind), 1, "recupera un uso de Nuevas energías")
	runner.eq(int(cp.state["odvar"].slots[0]), 1, "recuperación arcana del mago")
	cp.long_rest()
	var c := cp.creature_for("hero")
	runner.eq(c.hp, c.max_hp, "el descanso largo lo cura todo")
	runner.eq(int(cp.state["hero"].hit_dice), cp.party_level, "recupera los dados de golpe")

func test_level_up_and_save() -> void:
	var cp := Campaign.new_game(_hero("cleric"), ["brenna", "pip", "odvar"])
	cp.state["hero"].hp = 5
	cp.level_up_to(2)
	var c := cp.creature_for("hero")
	runner.eq(cp.party_level, 2, "nivel 2")
	runner.check(c.hp > 5 and c.hp < c.max_hp, "gana los PG del nivel sin curarse del todo")
	cp.level_up_to(3)
	var c3 := cp.creature_for("hero")
	runner.eq(c3.slots.size(), 2, "espacios de nivel 2 a nivel 3")
	runner.eq(int(c3.slots[1]), 2, "los espacios nuevos llegan llenos")
	var d: Dictionary = JSON.parse_string(JSON.stringify(cp.to_dict()))
	var cp2 := Campaign.from_dict(d)
	runner.eq(cp2.party, cp.party, "grupo guardado")
	runner.eq(cp2.creature_for("hero").hp, c3.hp, "PG guardados")
	runner.eq(cp2.party_level, 3, "nivel guardado")
