extends SceneTree
## Equilibrado por clase: cada clase (con elecciones recomendadas) sustituye a un compañero
## y juega los tres encuentros con IA. Detecta errores y clases demasiado fuertes o débiles.
## Uso: godot --headless --path . -s tools/class_balance.gd -- [partidas=30] [clase1,clase2...]

const ENCOUNTERS := ["e1_prado", "e2_pinar", "e3_tumulo"]
## A quién sustituye cada clase según su papel.
const REPLACES := {
	"barbarian": "brenna", "fighter": "brenna", "paladin": "brenna", "monk": "pip", "rogue": "pip", "ranger": "pip",
	"cleric": "ilyra", "druid": "ilyra", "bard": "ilyra", "wizard": "odvar", "sorcerer": "odvar", "warlock": "odvar",
}

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var runs: int = int(args[0]) if args.size() > 0 and args[0].is_valid_int() else 30
	var only: Array = []
	if args.size() > 1 and args[1] != "all":
		only = Array(args[1].split(","))
	var classes: Array = only if not only.is_empty() else REPLACES.keys()
	var species_list: Array = ["human"]
	if args.size() > 2:
		species_list = Array(args[2].split(","))
	print("clase        especie     | e1 vict  e2 vict  e3 vict | daño/comb  caídas  muertes")
	for cls in classes:
		for sp in species_list:
			var line := "%-12s %-11s |" % [cls, sp]
			var dmg := 0.0
			var downs := 0.0
			var deaths := 0.0
			for enc in ENCOUNTERS:
				var wins := 0
				for i in runs:
					var party: Array = []
					for pid in BattleSetup.PARTY_ORDER:
						if pid == REPLACES[cls]:
							party.append({"id": "hero", "name": "Héroe", "class": cls, "species": sp})
						else:
							party.append(pid)
					var b := BattleSetup.build(enc, 5000 + i, party)
					var ai := AIBrain.new(b)
					b.start()
					var guard := 0
					while not b.over and guard < 600 and b.round_num <= 25:
						guard += 1
						ai.take_turn(b.current)
						if not b.over:
							b.end_turn()
					if b.winner == 0:
						wins += 1
					var h := b.get_creature("hero")
					dmg += h.stats.damage_dealt
					downs += h.stats.downs
					deaths += 1 if h.dead else 0
				line += " %5.0f %%" % (100.0 * wins / runs)
			var n := runs * ENCOUNTERS.size()
			line += " | %8.1f  %6.2f  %6.3f" % [dmg / n, downs / n, deaths / n]
			print(line)
	quit()
