extends SceneTree
## Bot de la campaña: juega la cadena de combates de la fase 2b (Merrowick → Elderhal →
## túmulo) con el estado persistente (PG, espacios, pociones), descansos y subidas de nivel.
## Uso: godot --headless --path . -s tools/campaign_sim.gd -- [partidas] [clase|all] [semilla]

const CHAIN := [
	{"level": "merrowick", "group": "e1", "before": "", "after_level": 2},
	{"level": "elderhal", "group": "wolves", "before": "travel"},
	{"level": "elderhal", "group": "sentries", "before": ""},
	{"level": "elderhal", "group": "camp", "before": "camp_rest", "after_level": 3},
	{"level": "tumulo", "group": "guardians", "before": "inn"},
]
const TWIN := {"barbarian": "brenna", "fighter": "brenna", "paladin": "brenna", "monk": "pip", "rogue": "pip", "ranger": "pip",
	"cleric": "ilyra", "druid": "ilyra", "bard": "ilyra", "wizard": "odvar", "sorcerer": "odvar", "warlock": "odvar"}
const CLASSES := ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"]

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var runs: int = int(args[0]) if args.size() > 0 else 10
	var which: String = args[1] if args.size() > 1 else "fighter"
	var seed0: int = int(args[2]) if args.size() > 2 else 500
	var classes: Array = CLASSES if which == "all" else [which]
	for cls in classes:
		_run_class(cls, runs, seed0)
	quit()

func _hero(cls: String) -> Dictionary:
	var s := {"class": cls, "name": "Héroe", "pronoun": "f", "visual": {}}
	var full := CharacterSheet.complete(s, 1)
	full["id"] = "hero"
	full["choices_level"] = 1
	full.erase("weapons")
	full.erase("armor")
	return full

func _run_class(cls: String, runs: int, seed0: int) -> void:
	var finished := 0
	var fails := {}
	var deaths := 0
	var potions_used := 0
	var hp_end := 0.0
	for i in runs:
		var twin: String = TWIN.get(cls, "")
		var comps: Array = ["brenna", "pip", "ilyra", "odvar"].filter(func(p): return p != twin)
		var cp := Campaign.new_game(_hero(cls), comps)
		var ok := true
		for step in CHAIN:
			if step.before == "inn":
				cp.long_rest()
			elif step.before == "camp_rest":
				# Un jugador sensato duerme junto a la hoguera del claro antes de asaltar el campamento
				cp.long_rest()
			elif step.before == "travel":
				cp.pass_hours(2)
			# Descanso corto si alguien está muy tocado
			var low := false
			for id in cp.party:
				if cp.is_dead(id):
					continue
				var c := cp.creature_for(id)
				if c.hp < c.max_hp * 0.5:
					low = true
			if low and cp.short_rests_left > 0:
				cp.short_rest()
			elif low and step.level == "elderhal":
				cp.long_rest()   # hoguera del claro
			var pots_before := _count_potions(cp)
			var b := _battle(cp, step.level, step.group, seed0 + i * 31 + CHAIN.find(step))
			var ai := AIBrain.new(b)
			b.start()
			var guard := 0
			while not b.over and guard < 900:
				guard += 1
				ai.take_turn(b.current)
				if not b.over:
					b.end_turn()
				if b.round_num > 30:
					break
			var won := b.winner == 0
			cp.after_battle(b, won)
			potions_used += pots_before - _count_potions(cp)
			for c in b.creatures:
				if c.is_pc and c.dead:
					deaths += 1
			if not won:
				ok = false
				fails[step.group] = int(fails.get(step.group, 0)) + 1
				break
			if step.has("after_level"):
				cp.level_up_to(int(step.after_level))
		if ok:
			finished += 1
			var r := 0.0
			for id in cp.party:
				if not cp.is_dead(id):
					var c2 := cp.creature_for(id)
					r += float(c2.hp) / c2.max_hp
			hp_end += r / cp.party.size()
	print("%-10s campaña completa %3.0f %% · muertes %.2f/partida · pociones %.1f · PG al final %.0f %% · derrotas %s" % [
		cls, 100.0 * finished / runs, float(deaths) / runs, float(potions_used) / runs, 100.0 * hp_end / max(1, finished), str(fails)])

func _count_potions(cp: Campaign) -> int:
	var n := 0
	for id in cp.party:
		for p in ["potion_healing", "potion_greater_healing"]:
			n += int(cp.sheet(id).get("items", {}).get(p, 0))
	return n

## Combate como en la exploración: el grupo llega por el camino hasta que lo ven.
func _battle(cp: Campaign, level_id: String, gid: String, seed_value: int) -> Battle:
	var lv: Dictionary = RulesDB.levels[level_id]
	var map := BattleMap.new()
	map.load_rows(lv.rows)
	var g: Dictionary = {}
	for gg in lv.groups:
		if gg.id == gid:
			g = gg
	var b := Battle.new(map, seed_value)
	b.encounter = {"id": gid, "name": g.get("name", ""), "ambient": lv.get("ambient", "")}
	var enemies: Array = []
	var counts := {}
	for e in g.enemies:
		counts[e.id] = int(counts.get(e.id, 0)) + 1
		var m := Factory.make_monster(e.id, counts[e.id])
		m.cell = Vector2i(int(e.cell[0]), int(e.cell[1]))
		enemies.append(m)
	var sp: Array = lv.spawns.get("default", lv.spawns.values()[0])
	var start := Vector2i(int(sp[0]), int(sp[1]))
	var path := map.find_path(start, enemies[0].cell)
	if path.is_empty():
		for n in BattleMap.neighbors(enemies[0].cell):
			path = map.find_path(start, n)
			if not path.is_empty():
				break
	var sight := int(g.get("sight", 8))
	var stop_i := path.size() - 1
	for i in path.size():
		var near := false
		for m in enemies:
			if BattleMap.dist(path[i], m.cell) <= sight and map.has_los(path[i], m.cell):
				near = true
		if near:
			stop_i = i
			break
	var cells: Array = []
	for k in range(stop_i, -1, -1):
		cells.append(path[k])
		if cells.size() >= 4:
			break
	var idx := 0
	for id in cp.party:
		if cp.is_dead(id):
			continue
		var c := cp.creature_for(id)
		c.cell = cells[min(idx, cells.size() - 1)] if idx < cells.size() else cells[0] + Vector2i(idx, 0)
		idx += 1
		BattleSetup.precast(b, c, cp)
		b.add_creature(c)
	for m in enemies:
		b.add_creature(m)
	return b
