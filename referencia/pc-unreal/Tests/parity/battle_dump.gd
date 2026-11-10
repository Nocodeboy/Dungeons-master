extends SceneTree
## Volcado de combates completos (IA contra IA) desde la versión de Godot, para comparar con el núcleo en C++.
## godot --headless --path <proyecto-godot> -s <ruta>/battle_dump.gd -- <salida.json> [semillas] [probe]
## Con «probe», al empezar cada turno de un PJ se vuelcan también las consultas que usa la interfaz
## (movimiento, ataques y su previsión, conjuros, rasgos, pociones) y se prueba mover y deshacer.
## El mismo recorrido lo hace `mdg_battle_dump` (Tests/tools/battle_dump_main.cpp); compara con parity/compare.py.

const ENCOUNTERS := ["e1_prado", "e2_pinar", "e3_tumulo"]
const PARTIES := [
	[],
	["barbarian", "bard", "cleric", "druid"],
	["fighter", "monk", "paladin", "ranger"],
	["rogue", "sorcerer", "warlock", "wizard"],
	["fighter:orc", "wizard:tiefling", "cleric:dwarf", "ranger:dragonborn"],
	["paladin:goliath", "rogue:halfling", "warlock:half_elf", "sorcerer:gnome"],
	["monk:elf", "druid:human", "bard:half_orc", "barbarian:dragonborn"],
]

static func party_from(toks: Array) -> Array:
	var out: Array = []
	for tok in toks:
		var parts: PackedStringArray = str(tok).split(":")
		var sheet := {"id": "pc_" + parts[0] + str(out.size()), "name": RulesDB.classes.get(parts[0], {}).get("name", parts[0]), "class": parts[0]}
		if parts.size() > 1:
			sheet["species"] = parts[1]
		out.append(sheet)
	return out

## Forma canónica: distingue enteros, reales, casillas y referencias igual que el volcado de C++.
static func canon(v):
	match typeof(v):
		TYPE_NIL:
			return null
		TYPE_BOOL, TYPE_INT, TYPE_STRING:
			return v
		TYPE_STRING_NAME:
			return str(v)
		TYPE_FLOAT:
			return "f:" + str(v)
		TYPE_VECTOR2I:
			return "V(%d,%d)" % [v.x, v.y]
		TYPE_VECTOR2:
			return "v(" + str(v.x) + "," + str(v.y) + ")"
		TYPE_ARRAY, TYPE_PACKED_STRING_ARRAY, TYPE_PACKED_INT32_ARRAY, TYPE_PACKED_VECTOR2_ARRAY:
			var out: Array = []
			for x in v:
				out.append(canon(x))
			return out
		TYPE_DICTIONARY:
			var d := {}
			for k in v.keys():
				d[str(k)] = canon(v[k])
			return d
		TYPE_OBJECT:
			if v is Creature:
				return "C:" + v.id
			if v is Effect:
				return "E:" + v.kind
			return "O:?"
	return "?:" + str(v)

static func final_state(c: Creature) -> Dictionary:
	return {
		"id": c.id, "name": c.name, "hp": c.hp, "temp_hp": c.temp_hp, "max_hp": c.max_hp, "dead": c.dead,
		"stable": c.stable, "ds": [c.death_successes, c.death_failures], "cell": canon(c.cell),
		"conditions": canon(c.conditions), "effects": c.effects.map(func(e): return e.kind), "slots": c.slots,
		"resources": c.resources, "items": c.items, "form": c.form, "conc": c.concentration_spell, "stats": c.stats,
	}

static func ids(arr: Array) -> Array:
	return arr.map(func(x): return x.id)

static func probe(b: Battle, c: Creature, try_undo: bool) -> Dictionary:
	var p := {"who": c.id, "round": b.round_num}
	var mo := b.move_options(c)
	var total := 0
	for k in mo.cost.keys():
		total += int(mo.cost[k])
	var dtotal := 0
	for k in mo.dash_cost.keys():
		dtotal += int(mo.dash_cost[k])
	p["move"] = [mo.cost.size(), total, mo.dash_cost.size(), dtotal, mo.crawl]
	p["move_cells"] = canon(mo.cost.keys())
	var profs := b.attack_profiles(c)
	p["profiles"] = canon(profs)
	var vs: Array = []
	for e in b.enemies_of(c):
		if not e.is_active():
			continue
		for pr in profs:
			vs.append({"e": e.id, "key": pr.key, "range": b.in_attack_range(c, pr, e),
				"mode": canon(b.attack_mode(c, e, pr.kind, null, pr)), "ac": b.target_ac(e, c), "cover": b.cover(c, e),
				"prev": canon(b.preview_attack(c, pr, e))})
	p["vs"] = vs
	var av := b.spells.available(c)
	p["spells"] = canon(av)
	var st := {}
	for s in av:
		if s.usable:
			st[s.id] = ids(b.spells.valid_targets(c, s.id))
	p["spell_targets"] = st
	var cl := b.cls.list(c)
	p["cls"] = canon(cl)
	var ct := {}
	for e in cl:
		ct[e.id] = ids(b.cls.valid_targets(c, e.id))
	p["cls_targets"] = ct
	p["potions"] = b.usable_potions(c)
	var riders: Array = []
	for pr in profs:
		riders.append(canon(b.spells.rider_options(c, pr)))
	p["riders"] = riders
	# Ruta a la casilla más lejana (la primera con el coste máximo)
	var far := c.cell
	var best := -1
	for k in mo.cost.keys():
		if int(mo.cost[k]) > best:
			best = int(mo.cost[k])
			far = k
	var path := BattleMap.build_path(mo.prev, c.cell, far)
	p["path"] = canon(path)
	p["threats"] = b.path_threats(c, path).map(func(x): return [x.enemy.id, canon(x.at)])
	if try_undo and far != c.cell and p["threats"].is_empty():
		b.do_move(c, path)
		p["undo"] = [b.can_undo_move(c), canon(c.cell)]
		b.undo_move(c)
		p["after"] = [canon(c.cell), b.can_undo_move(c), c.turn.moved]
	return p

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var out_path: String = args[0] if args.size() > 0 else "battle_godot.json"
	var nseeds: int = int(args[1]) if args.size() > 1 else 2
	var probing := args.size() > 2 and args[2] == "probe"
	# Encuentros sintéticos a niveles 1-3 para cubrir rasgos y subclases
	var keys: Array = []
	for eid in ENCOUNTERS:
		for lvl in [1, 2, 3]:
			var k := "x_%s_%d" % [eid, lvl]
			var e: Dictionary = RulesDB.encounters[eid].duplicate(true)
			e["level"] = lvl
			RulesDB.encounters[k] = e
			keys.append(k)
	var battles: Array = []
	for k in keys:
		for pi in PARTIES.size():
			for s in nseeds:
				var seed_value: int = 7000 + 131 * s + 17 * pi
				var b := BattleSetup.build(k, seed_value, party_from(PARTIES[pi]))
				var ai := AIBrain.new(b)
				b.start()
				var guard := 0
				var probes: Array = []
				while not b.over and guard < 600:
					guard += 1
					if probing and b.current.is_pc and b.current.can_act():
						probes.append(probe(b, b.current, probes.is_empty()))
					ai.take_turn(b.current)
					if not b.over:
						b.end_turn()
					if b.round_num > 25:
						break
				battles.append({
					"key": "%s/p%d/s%d" % [k, pi, seed_value], "winner": b.winner, "over": b.over, "round": b.round_num,
					"guard": guard, "log": b.log_lines, "events": canon(b.events),
					"final": b.creatures.map(func(c): return final_state(c)), "probes": probes,
				})
	var f := FileAccess.open(out_path, FileAccess.WRITE)
	f.store_string(JSON.stringify({"battles": battles}, " "))
	f.close()
	print("combates: %d -> %s" % [battles.size(), out_path])
	quit()
