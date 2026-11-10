extends SceneTree
## Bot de equilibrado: juega un encuentro N veces con IA en ambos bandos.
## Uso: godot --headless --path . -s tools/simulate.gd -- e1_prado 200 [semilla] [--verbose] [--party brenna,monk:orc,ilyra,odvar]
## En --party: un id de data/party.json o una clase (opcionalmente clase:especie) con elecciones recomendadas.

static func party_from_arg(arg: String) -> Array:
	var out: Array = []
	for tok in arg.split(","):
		if RulesDB.party.has(tok):
			out.append(tok)
		else:
			var parts := tok.split(":")
			var sheet := {"id": "pc_" + parts[0] + str(out.size()), "name": RulesDB.classes.get(parts[0], {}).get("name", parts[0]), "class": parts[0]}
			if parts.size() > 1:
				sheet["species"] = parts[1]
			out.append(sheet)
	return out

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var enc_id: String = args[0] if args.size() > 0 else "e1_prado"
	var runs: int = int(args[1]) if args.size() > 1 else 100
	var seed0: int = int(args[2]) if args.size() > 2 and args[2].is_valid_int() else 1000
	var verbose := "--verbose" in args
	var party: Array = []
	for i in args.size():
		if args[i] == "--party" and i + 1 < args.size():
			party = party_from_arg(args[i + 1])
	var wins := 0
	var rounds_total := 0
	var downs_total := 0
	var deaths_total := 0
	var pc_hp_left := 0.0
	var tpk := 0
	var per_pc := {}
	var t0 := Time.get_ticks_msec()
	var max_turn_ms := 0
	for i in runs:
		var b := BattleSetup.build(enc_id, seed0 + i, party)
		var ai := AIBrain.new(b)
		b.start()
		var guard := 0
		while not b.over and guard < 600:
			guard += 1
			var c := b.current
			var ts := Time.get_ticks_msec()
			ai.take_turn(c)
			max_turn_ms = max(max_turn_ms, Time.get_ticks_msec() - ts)
			if not b.over:
				b.end_turn()
			if b.round_num > 25:
				break
		if verbose and i == 0:
			for l in b.log_lines:
				print(l)
		if b.winner == 0:
			wins += 1
		rounds_total += b.round_num
		var all_dead := true
		for c in b.creatures:
			if c.is_pc:
				downs_total += c.stats.downs
				if c.dead:
					deaths_total += 1
				else:
					all_dead = false
				pc_hp_left += c.hp_ratio()
				if not per_pc.has(c.name):
					per_pc[c.name] = {"dmg": 0, "downs": 0, "deaths": 0, "kills": 0, "healed": 0}
				per_pc[c.name].dmg += c.stats.damage_dealt
				per_pc[c.name].downs += c.stats.downs
				per_pc[c.name].kills += c.stats.kills
				per_pc[c.name].healed += c.stats.healed
				if c.dead:
					per_pc[c.name].deaths += 1
		if b.winner != 0:
			tpk += 1
	var dt := Time.get_ticks_msec() - t0
	print("=== %s · %d partidas ===" % [enc_id, runs])
	print("Victorias: %.1f %%" % (100.0 * wins / runs))
	print("Rondas medias: %.1f" % (float(rounds_total) / runs))
	print("Caídas de PJ por combate: %.2f" % (float(downs_total) / runs))
	print("Muertes de PJ por combate: %.3f" % (float(deaths_total) / runs))
	print("PG restantes del grupo: %.0f %%" % (100.0 * pc_hp_left / (runs * max(1, per_pc.size()))))
	for n in per_pc.keys():
		var s: Dictionary = per_pc[n]
		print("  %-18s daño %.1f · bajas %.2f · caídas %.2f · muertes %.3f · curado %.1f" % [n, float(s.dmg) / runs, float(s.kills) / runs, float(s.downs) / runs, float(s.deaths) / runs, float(s.healed) / runs])
	print("Tiempo: %d ms (%.1f ms/partida, turno IA más lento %d ms)" % [dt, float(dt) / runs, max_turn_ms])
	quit()
