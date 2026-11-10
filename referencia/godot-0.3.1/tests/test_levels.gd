extends RefCounted
## Pruebas de los niveles explorables: datos coherentes, caminos y objetos alcanzables.

var runner

func _map(lv: Dictionary) -> BattleMap:
	var m := BattleMap.new()
	m.load_rows(lv.rows)
	return m

func _cell(a) -> Vector2i:
	return Vector2i(int(a[0]), int(a[1]))

func test_find_path() -> void:
	var m := BattleMap.new()
	m.load_rows([",,,,,,,,", ",,TTTT,,", ",,,,,T,,", ",,,,,,,,"])
	var p := m.find_path(Vector2i(0, 0), Vector2i(7, 3))
	runner.check(p.size() >= 8, "hay camino")
	for c in p:
		runner.check(m.walkable(c), "solo por casillas transitables")
	for i in range(1, p.size()):
		runner.eq(BattleMap.dist(p[i - 1], p[i]), 1, "pasos contiguos")
	runner.eq(m.find_path(Vector2i(0, 0), Vector2i(3, 1)).size(), 0, "no se puede ir a un árbol")
	var blocked := {Vector2i(1, 0): true, Vector2i(0, 1): true, Vector2i(1, 1): true}
	runner.eq(m.find_path(Vector2i(0, 0), Vector2i(7, 3), blocked).size(), 0, "encerrado")

func test_levels_are_consistent() -> void:
	runner.check(RulesDB.levels.has("merrowick") and RulesDB.levels.has("elderhal") and RulesDB.levels.has("tumulo"), "niveles cargados")
	for lid in RulesDB.levels.keys():
		var lv: Dictionary = RulesDB.levels[lid]
		var m := _map(lv)
		runner.check(lv.has("music") and Game.MUSIC.has(str(lv.music)), "%s: música" % lid)
		for sp in lv.get("spawns", {}).keys():
			runner.check(m.walkable(_cell(lv.spawns[sp])), "%s: punto %s transitable" % [lid, sp])
		var start := _cell(lv.spawns.get("default", lv.spawns.values()[0]))
		for o in lv.get("objects", []):
			var c := _cell(o.cell)
			var t: String = o.get("type", "")
			for e in o.get("loot", []):
				runner.check(e[0] == "gold" or Items.exists(str(e[0])), "%s/%s: el objeto %s existe" % [lid, o.id, e[0]])
			if t == "npc" and o.has("shop"):
				runner.check(RulesDB.merchants.has(str(o.shop)), "%s: tienda %s" % [lid, o.shop])
			# Se puede llegar a todo lo interactivo (a la casilla o a una vecina)
			var reach := false
			var goals: Array = [c] if m.walkable(c) else []
			for n in BattleMap.neighbors(c):
				if m.walkable(n):
					goals.append(n)
			for g in goals:
				if not m.find_path(start, g).is_empty():
					reach = true
					break
			runner.check(reach, "%s: se puede llegar a %s" % [lid, o.id])
		for g in lv.get("groups", []):
			for e in g.enemies:
				runner.check(RulesDB.monsters.has(str(e.id)), "%s: monstruo %s" % [lid, e.id])
				runner.check(m.walkable(_cell(e.cell)), "%s/%s: enemigo en casilla transitable" % [lid, g.id])
			for e2 in g.get("loot", []):
				runner.check(e2[0] == "gold" or Items.exists(str(e2[0])), "%s/%s: botín %s" % [lid, g.id, e2[0]])
		for ex in lv.get("exits", []):
			for cc in ex.cells:
				runner.check(m.walkable(_cell(cc)), "%s: salida %s transitable" % [lid, ex.id])
				runner.check(not m.find_path(start, _cell(cc)).is_empty(), "%s: se llega a la salida %s" % [lid, ex.id])

func test_merchants_sell_real_items() -> void:
	for sid in RulesDB.merchants.keys():
		for id in RulesDB.merchants[sid].get("stock", {}).keys():
			runner.check(Items.exists(id), "%s vende %s" % [sid, id])

func test_monster_drops_exist() -> void:
	for mid in RulesDB.monsters.keys():
		for d in RulesDB.monsters[mid].get("drops", []):
			runner.check(d.id == "gold" or Items.exists(str(d.id)), "%s suelta %s" % [mid, d.id])

func test_world_map_places() -> void:
	var f := FileAccess.open("res://data/world.json", FileAccess.READ)
	var w: Dictionary = JSON.parse_string(f.get_as_text())
	for p in w.places:
		if p.has("level"):
			runner.check(RulesDB.levels.has(str(p.level)), "lugar %s con nivel" % p.id)
			runner.check(RulesDB.levels[str(p.level)].spawns.has(str(p.get("spawn", "default"))), "lugar %s con punto de llegada" % p.id)
