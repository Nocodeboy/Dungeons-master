class_name BattleScreen
extends Node3D
## Pantalla de combate: une reglas (Battle), IA, mundo 3D, efectos e interfaz táctil.

signal finished(result: Dictionary)
signal _turn_done

const BARKS := {
	"brenna": {
		"start": ["¡En formación! Que ninguno pase.", "Os quiero detrás de mí. Todos.", "La muralla de Valdrecht aguantó cien años. Esto, también."],
		"crit": ["¡Así se hace en la muralla!", "Eso, para el sargento."],
		"kill": ["Uno menos.", "Siguiente."],
		"hurt": ["Solo es un rasguño… creo.", "Me han dado. No es la primera vez."],
		"ally_down": ["¡Aguanta! ¡Voy!", "¡Ilyra, aquí, rápido!"],
	},
	"pip": {
		"start": ["Yo me quedo atrás. Por estrategia, ¿eh?", "Ni me habéis visto."],
		"crit": ["¡Justo en la deuda!", "Ese va a la cuenta."],
		"kill": ["Uno menos al que esquivar.", "Ni se enteró."],
		"hurt": ["¡Ay! Que estas manos son de trabajo fino.", "Vale, ahora sí que corro."],
		"ally_down": ["¡No me dejéis solo con esto!", "¡Que alguien la levante!"],
	},
	"ilyra": {
		"start": ["Que Solenne nos guarde.", "Solenne, si me escuchas, ahora es buen momento."],
		"crit": ["¡Perdóname, pero te lo has ganado!", "La fe también pega."],
		"kill": ["Descansa. De verdad.", "Que encuentres paz."],
		"hurt": ["Estoy bien… más o menos.", "No es grave. Creo."],
		"ally_down": ["¡No te vayas! ¡Todavía no!", "¡Aguanta, que llego!"],
		"heal": ["Levántate. Hoy no.", "Aún no es tu hora."],
	},
	"odvar": {
		"start": ["Fascinante. Absolutamente fascinante.", "Apuntad: comportamiento hostil. Interesantísimo."],
		"crit": ["¡Ja! ¡Física aplicada!", "Mi tesis, demostrada."],
		"kill": ["Tomo nota. Y tomo distancia.", "Un dato menos que analizar."],
		"hurt": ["¡Eh! ¡Que soy un erudito!", "Esto no venía en los libros."],
		"ally_down": ["¡Esto no estaba en mis cálculos!", "¡Que alguien haga algo útil!"],
	},
}

var battle: Battle
var world: BattleWorld
var fx: FX
var cam: CameraRig
var hud: BattleHUD
var ai: AIBrain
var portraits: Portraits
var units: Dictionary = {}
var enc_id: String = ""
var mode := "busy"
var pending: Dictionary = {}
var _move_opts: Dictionary = {}
var _current_spell := ""
var _player_turns := 0
var _tip_index := 0
var _last_bark := 0
var _step_sfx := "step_grass"
var _first_hint := {}
var _paused := false
## Combate dentro de un nivel explorable: el mundo, la cámara y las figuras son del nivel.
var world_mode := false
var _own_units: Array = []
var _occ_t := 0.0

## En los combates sueltos también se aclaran los árboles que tapan a las figuras.
func _process(delta: float) -> void:
	if world_mode or world == null or cam == null or cam.camera == null or battle == null:
		return
	_occ_t += delta
	if _occ_t < 0.25:
		return
	_occ_t = 0.0
	var targets: Array = []
	for c in battle.creatures:
		var v = units.get(c.id)
		if v != null and is_instance_valid(v) and not c.dead:
			targets.append((v as Node3D).position + Vector3(0, 0.6, 0))
	world.update_occlusion(cam.camera, targets)

func start_encounter(p_enc: String) -> void:
	enc_id = p_enc
	var seed_value := int(Time.get_unix_time_from_system()) % 100000
	if not OS.get_environment("MG_SEED").is_empty():
		seed_value = int(OS.get_environment("MG_SEED"))
	battle = BattleSetup.build(enc_id, seed_value, Game.current_party())
	battle.settings.pc_reactions = Game.settings.get("reactions", "auto")
	ai = AIBrain.new(battle)
	var ambient: String = battle.encounter.get("ambient", "dusk")
	_step_sfx = "step_stone" if ambient == "crypt" else "step_grass"
	world = BattleWorld.new()
	add_child(world)
	world.build(battle.map, ambient, 11)
	ModelLibrary.set_cover_squash(0.45)
	fx = FX.new()
	add_child(fx)
	cam = CameraRig.new()
	add_child(cam)
	var bsz := world.board_size()
	cam.setup(bsz.x, bsz.y)
	cam.tapped.connect(_on_tap)
	cam.long_pressed.connect(_on_long_press)
	for c in battle.creatures:
		var uv := UnitView.new()
		world.add_child(uv)
		uv.setup(c)
		units[c.id] = uv
	Game.play_music("tumulo" if ambient == "crypt" else "combate")
	await _build_hud_and_start()

## Combate sin cortes en un nivel explorable. `p_units`: id -> UnitView ya colocadas.
func start_in_world(p_battle: Battle, p_world: BattleWorld, p_cam: CameraRig, p_units: Dictionary, music := "combate") -> void:
	world_mode = true
	battle = p_battle
	enc_id = str(battle.encounter.get("id", ""))
	battle.settings.pc_reactions = Game.settings.get("reactions", "auto")
	ai = AIBrain.new(battle)
	var ambient: String = battle.encounter.get("ambient", "dusk")
	_step_sfx = "step_stone" if ambient == "crypt" else "step_grass"
	world = p_world
	cam = p_cam
	fx = FX.new()
	add_child(fx)
	cam.tapped.connect(_on_tap)
	cam.long_pressed.connect(_on_long_press)
	for c in battle.creatures:
		var uv: UnitView = p_units.get(c.id)
		if uv == null:
			uv = UnitView.new()
			world.add_child(uv)
			uv.setup(c)
			_own_units.append(uv)
		else:
			uv.bind(c)
		units[c.id] = uv
	Game.play_music(music)
	await _build_hud_and_start()

## Deja el mundo como estaba (modo nivel): desconecta la cámara y quita lo propio del combate.
func detach() -> void:
	if cam != null and cam.tapped.is_connected(_on_tap):
		cam.tapped.disconnect(_on_tap)
		cam.long_pressed.disconnect(_on_long_press)
	if world != null:
		world.clear_highlights()
		for z in battle.zones:
			world.hide_zone(int(z.get("id", -1)), false)
	for uv in _own_units:
		if is_instance_valid(uv):
			uv.queue_free()
	_own_units.clear()
	Engine.time_scale = 1.0

func _build_hud_and_start() -> void:
	portraits = Portraits.new()
	add_child(portraits)
	var layer := CanvasLayer.new()
	add_child(layer)
	hud = BattleHUD.new()
	layer.add_child(hud)
	hud.setup(battle)
	hud.action_chosen.connect(_on_action_chosen)
	hud.end_turn_pressed.connect(_on_end_turn)
	hud.undo_pressed.connect(_on_undo)
	hud.cancel_pressed.connect(_cancel_pending)
	hud.confirm_pressed.connect(_on_confirm)
	hud.menu_pressed.connect(_on_menu)
	hud.auto_toggled.connect(_on_auto_toggled)
	hud.camera_rotate.connect(func(d): cam.rotate_step(d))
	hud.speed_toggled.connect(_on_speed_toggle)
	hud.portrait_tapped.connect(func(cid):
		var c := battle.get_creature(cid)
		if c:
			cam.focus_on(units[cid].position)
			hud.show_info(c))
	hud.set_speed_label(float(Game.settings.anim_speed) > 1.0)
	await portraits.render_all(battle.creatures)
	hud.refresh()
	_run_battle()

const SHORT_NAMES := {"brenna": "Brenna", "pip": "Pip", "ilyra": "Ilyra", "odvar": "Odvar"}

static func short_name(c: Creature) -> String:
	if SHORT_NAMES.has(c.id):
		return SHORT_NAMES[c.id]
	var parts := c.name.split(" ")
	return parts[0] if parts.size() > 0 else c.name

func _exit_tree() -> void:
	Engine.time_scale = 1.0

# ================================================================== bucle principal

func _run_battle() -> void:
	await _intro()
	battle.start()
	await _play(battle.pop_events())
	var guard := 0
	while not battle.over and guard < 5000:
		guard += 1
		var c := battle.current
		if c == null:
			break
		hud.refresh()
		if c.team == 0 and not Game.is_auto(c.id) and c.can_act():
			await _player_turn(c)
		else:
			await _ai_turn(c)
		if battle.over:
			break
		battle.end_turn()
		await _play(battle.pop_events())
	await _finish()

func _intro() -> void:
	mode = "busy"
	cam.input_enabled = false
	var enemies_center := Vector3.ZERO
	var n := 0
	for c in battle.creatures:
		if c.team == 1:
			enemies_center += BattleWorld.cell_center(c.cell)
			n += 1
	if n > 0:
		enemies_center /= n
	cam.focus_on(enemies_center, 13)
	hud.show_banner(battle.encounter.get("name", ""), UI.GOLD, 1.6)
	if battle.encounter.get("ambient", "") == "crypt":
		for c in battle.creatures:
			if c.team == 1 and c.ctype == "undead":
				units[c.id].play("awaken")
	await get_tree().create_timer(2.0).timeout
	var party_center := Vector3.ZERO
	for c in battle.creatures:
		if c.team == 0:
			party_center += BattleWorld.cell_center(c.cell) / 4.0
	cam.focus_on(party_center, 14)
	_bark_random("start", 1.0)
	await get_tree().create_timer(0.8).timeout
	cam.input_enabled = true

func _finish() -> void:
	mode = "busy"
	_clear_targeting()
	Engine.time_scale = 1.0
	var won := battle.winner == 0
	await get_tree().create_timer(0.8).timeout
	var center := Vector3.ZERO
	var n := 0
	for c in battle.creatures:
		if c.team == 0 and not c.dead:
			center += units[c.id].position
			n += 1
	if n > 0:
		cam.focus_on(center / n, 9.0)
	if won:
		for c in battle.creatures:
			if c.team == 0 and c.is_active():
				units[c.id].cheer()
		Game.sfx("victory")
		Game.play_music("victoria")
	else:
		Game.sfx("defeat")
		Game.play_music("derrota")
	await get_tree().create_timer(1.5).timeout
	var stats := {}
	var order: Array = []
	for c in battle.creatures:
		if c.team == 0 and c.is_pc:
			stats[c.id] = c.stats.duplicate()
			stats[c.id]["name"] = c.name
			stats[c.id]["dead"] = c.dead
			stats[c.id]["portrait"] = Portraits.key_for(c)
			order.append(c.id)
	finished.emit({"won": won, "rounds": battle.round_num, "encounter": enc_id, "stats": stats, "party": order})

# ================================================================== turnos

func _player_turn(c: Creature) -> void:
	_player_turns += 1
	Engine.time_scale = float(Game.settings.anim_speed)
	cam.focus_on(units[c.id].position)
	hud.refresh(c)
	hud.show_banner("Turno de %s" % short_name(c), UI.GOLD, 0.7)
	Game.sfx("turn", -10)
	_maybe_tip()
	_enter_idle(c)
	await _turn_done
	_clear_targeting()

func _ai_turn(c: Creature) -> void:
	mode = "busy"
	_clear_targeting()
	var speed := float(Game.settings.anim_speed)
	if c.team == 1:
		speed *= float(Game.settings.get("enemy_speed", 1.5))
	Engine.time_scale = speed
	if c.is_active():
		hud.set_thinking("Turno de %s…" % c.name)
		_set_active_ring(c)
		cam.focus_on(units[c.id].position)
		await get_tree().process_frame
		await get_tree().process_frame
		ai.take_turn(c)
		hud.set_thinking("")
		await _play(battle.pop_events())
		await get_tree().create_timer(0.15).timeout
	Engine.time_scale = float(Game.settings.anim_speed)

func _set_active_ring(c: Creature) -> void:
	for id in units:
		var u: UnitView = units[id]
		u.set_ring("active" if id == c.id else "idle")
		u.show_name(id == c.id)

# ================================================================== estado de reposo (moverse / elegir objetivo)

func _enter_idle(c: Creature) -> void:
	mode = "idle"
	pending = {}
	hud.hide_prompt()
	hud.hide_preview()
	hud.refresh(c)
	_set_active_ring(c)
	_show_move_range(c)
	# Fin automático si ya no queda nada útil
	if _nothing_left(c):
		await get_tree().create_timer(0.5).timeout
		if mode == "idle" and battle.current == c:
			_on_end_turn()

func _nothing_left(c: Creature) -> bool:
	if c.turn.action > 0 or c.turn.attack_left > 0:
		return false
	if c.turn.movement >= 5 and c.speed() > 0:
		return false
	if c.turn.bonus > 0:
		if not hud.feature_list(c).filter(func(f): return f.enabled and f.cost == "Adicional").is_empty():
			return false
		if not battle.usable_potions(c).is_empty():
			return false
		for s in battle.spells.available(c):
			if s.usable and s.cost == "bonus":
				return false
		if c.turn.get("offhand_ready", false):
			return false
	return true

func _show_move_range(c: Creature) -> void:
	_move_opts = battle.move_options(c)
	var cells := {}
	var blue := Color(0.35, 0.65, 1.0, 0.9)
	var yellow := Color(1.0, 0.8, 0.3, 0.42)
	for cell in _move_opts.cost.keys():
		if cell != c.cell:
			cells[cell] = blue
	world.set_highlight("move", cells)
	var dcells := {}
	if c.turn.action > 0 and c.turn.attack_left <= 0:
		for cell in _move_opts.dash_cost.keys():
			dcells[cell] = yellow
	world.set_highlight("dash", dcells)
	world.set_highlight("focus", {c.cell: Color(1.0, 0.85, 0.35, 0.9)})

func _clear_targeting() -> void:
	world.clear_highlights()
	hud.hide_prompt()
	hud.hide_preview()
	hud.close_sheet()
	for id in units:
		var u: UnitView = units[id]
		if not u.dead:
			u.set_ring("idle")

# ================================================================== entrada

func _unhandled_input(event: InputEvent) -> void:
	if _paused:
		return
	if event is InputEventScreenTouch or event is InputEventScreenDrag:
		if event is InputEventScreenTouch and event.pressed and hud.is_point_on_ui(event.position):
			return
		cam.handle_input(event)
		return
	if event is InputEventMouseButton or event is InputEventMouseMotion:
		cam.handle_input(event)

func _cell_at(screen_pos: Vector2) -> Variant:
	# Primero, criaturas cercanas al toque en pantalla (los modelos son altos)
	var best = null
	var best_d := 46.0
	for id in units:
		var u: UnitView = units[id]
		if u.dead or not u.visible:
			continue
		for p in [u.global_position + Vector3(0, 0.15, 0), u.chest_position(), u.head_position()]:
			if cam.is_behind(p):
				continue
			var d := cam.screen_of(p).distance_to(screen_pos)
			if d < best_d:
				best_d = d
				best = u.creature.cell
	if best != null:
		return best
	var gp = cam.ground_point(screen_pos)
	if gp == null:
		return null
	return BattleWorld.world_to_cell(gp)

func _on_long_press(screen_pos: Vector2) -> void:
	if hud.is_point_on_ui(screen_pos):
		return
	var cell = _cell_at(screen_pos)
	if cell == null:
		return
	var c := battle.creature_at(cell)
	if c != null:
		hud.show_info(c)

func _on_tap(screen_pos: Vector2) -> void:
	if hud.is_point_on_ui(screen_pos) or mode == "busy":
		return
	# Tocar fuera de una hoja abierta solo la cierra
	if hud.sheet.visible:
		hud.close_sheet()
		return
	var c := battle.current
	if c == null or c.team != 0:
		return
	var gp = cam.ground_point(screen_pos)
	var cell = _cell_at(screen_pos)
	if cell == null:
		return
	var tapped := battle.creature_at(cell)
	match mode:
		"idle":
			_tap_idle(c, cell, tapped)
		"target":
			_tap_target(c, cell, tapped, gp)

func _tap_idle(c: Creature, cell: Vector2i, tapped: Creature) -> void:
	if tapped != null and tapped.team != c.team and tapped.is_active():
		_propose_attack(c, tapped, "")
		return
	if tapped == c:
		hud.show_info(c)
		return
	if tapped != null:
		hud.show_info(tapped)
		return
	var dash := false
	if _move_opts.cost.has(cell):
		dash = false
	elif _move_opts.dash_cost.has(cell):
		dash = true
	else:
		Game.sfx("error", -10)
		return
	var path := BattleMap.build_path(_move_opts.dash_prev if dash else _move_opts.prev, c.cell, cell)
	var threats := battle.path_threats(c, path)
	if threats.size() > 0:
		pending = {"kind": "move", "path": path, "dash": dash, "cell": cell}
		mode = "target"
		_preview_path(c, path, true)
		var names := ", ".join(threats.map(func(t): return t.enemy.name))
		hud.show_preview(cam.screen_of(BattleWorld.cell_center(cell)), "[color=#f0a060][b]Cuidado:[/b][/color] al alejarte provocarás un ataque de oportunidad de %s.\n[color=#bfb3a0]Usa Destrabarse para evitarlo.[/color]" % names, "Moverse igualmente", "dash")
		hud.show_prompt("Movimiento arriesgado", false)
		return
	await _do_move(c, path, dash)

func _preview_path(c: Creature, path: Array, danger: bool) -> void:
	var cells := {}
	for p in path:
		cells[p] = Color(1.0, 0.45, 0.3, 1.0) if danger else Color(0.9, 0.95, 1.0, 1.0)
	world.set_highlight("path", cells)

func _do_move(c: Creature, path: Array, dash: bool) -> void:
	mode = "busy"
	world.clear_highlights()
	hud.hide_preview()
	hud.hide_prompt()
	battle.do_move(c, path, dash)
	await _play(battle.pop_events())
	if battle.over or battle.current != c:
		return
	_after_action(c)

func _after_action(c: Creature) -> void:
	if battle.over:
		return
	if not c.can_act():
		_on_end_turn()
		return
	_enter_idle(c)

# ================================================================== ataques

func _attack_profile_for(c: Creature, t: Creature, preferred_key := "") -> Dictionary:
	var profiles := battle.attack_profiles(c)
	if not preferred_key.is_empty():
		for p in profiles:
			if p.key == preferred_key:
				return p
	var adjacent := BattleMap.dist(c.cell, t.cell) <= 1
	var best := {}
	var best_v := -1.0
	for p in profiles:
		var in_rng := battle.in_attack_range(c, p, t)
		var v := 0.0
		if in_rng:
			var pv := battle.preview_attack(c, p, t)
			v = pv.expected + (2.0 if (adjacent and p.kind == "melee") else 0.0)
			if p.kind == "thrown" and adjacent:
				v -= 1.0
		elif p.kind == "melee":
			v = 0.2
		if v > best_v:
			best_v = v
			best = p
	return best

func _propose_attack(c: Creature, t: Creature, key: String) -> void:
	if c.turn.action <= 0 and c.turn.attack_left <= 0:
		hud.show_banner("Ya has usado tu acción", UI.TEXT_DIM, 0.8)
		return
	var p := _attack_profile_for(c, t, key)
	if p.is_empty():
		return
	var path: Array = []
	if not battle.in_attack_range(c, p, t) or battle.cover(c, t) >= 3:
		if p.kind != "melee":
			hud.show_banner("Fuera de alcance", UI.TEXT_DIM, 0.8)
			return
		# Moverse y atacar: la casilla adyacente alcanzable más segura
		var best_cell = null
		var best_cost := 99999
		for n in BattleMap.neighbors8(t.cell):
			if _move_opts.cost.has(n) and BattleMap.dist(n, t.cell) <= int(p.reach):
				var cost: int = _move_opts.cost[n] + battle.path_threats(c, BattleMap.build_path(_move_opts.prev, c.cell, n)).size() * 100
				if cost < best_cost:
					best_cost = cost
					best_cell = n
		if best_cell == null:
			hud.show_banner("No llegas este turno", UI.TEXT_DIM, 0.9)
			return
		path = BattleMap.build_path(_move_opts.prev, c.cell, best_cell)
	pending = {"kind": "attack", "key": p.key, "target": t.id, "path": path}
	mode = "target"
	_show_attack_preview(c, p, t, path)

## Encuadra a dos criaturas a la vez (atacante y objetivo).
func _frame_pair(a: Creature, b: Creature) -> void:
	var pa: Vector3 = units[a.id].position
	var pb: Vector3 = units[b.id].position
	var d := pa.distance_to(pb)
	cam.focus_on((pa + pb) * 0.5, max(cam._goal_dist, d * 1.1 + 7.0))

## Castigos disponibles para este ataque, reducidos a una opción por conjuro.
func _rider_choices(c: Creature, p: Dictionary) -> Array:
	var out: Array = []
	var seen := {}
	for o in battle.spells.rider_options(c, p):
		var key: String = str(o.spell)
		if seen.has(key):
			continue
		seen[key] = true
		out.append(o)
	return out

func _show_attack_preview(c: Creature, p: Dictionary, t: Creature, path: Array) -> void:
	_frame_pair(c, t)
	var from_cell: Vector2i = path[path.size() - 1] if path.size() > 0 else c.cell
	var riders := _rider_choices(c, p)
	var ridx: int = int(pending.get("rider_idx", 0))
	if ridx > riders.size():
		ridx = 0
	var rider := {}
	if ridx > 0:
		var ro: Dictionary = riders[ridx - 1]
		rider = {"spell": ro.spell, "slot": ro.slot, "crit_only": pending.get("crit_only", false)}
	pending["rider"] = rider
	var pv := battle.preview_attack(c, p, t, from_cell, {"rider": rider})
	world.clear_highlights(["move", "dash"])
	world.set_highlight("target", {t.cell: Color(1.0, 0.35, 0.25, 1.0)})
	if path.size() > 0:
		_preview_path(c, path, battle.path_threats(c, path).size() > 0)
	for id in units:
		units[id].set_ring("target" if id == t.id else ("active" if id == c.id else "idle"))
	var lines: Array = []
	lines.append("[b]%s[/b] → %s" % [p.name, t.name])
	lines.append("Probabilidad de impacto: [b]%d %%[/b]" % int(round(pv.p_hit * 100)))
	var dmg_text := ""
	for d in p.damage:
		dmg_text += "%s %s " % [d.dice, Loc.dmg_type(d.type)]
	lines.append("Daño: %s(media %.1f)" % [dmg_text, pv.avg])
	if pv.mode > 0:
		lines.append("[color=#8fe08f]Ventaja: %s[/color]" % ", ".join(pv.adv.map(func(r): return Loc.t("reason." + r))))
	elif pv.mode < 0:
		lines.append("[color=#f0a060]Desventaja: %s[/color]" % ", ".join(pv.dis.map(func(r): return Loc.t("reason." + r))))
	elif pv.adv.size() > 0 and pv.dis.size() > 0:
		lines.append("[color=#bfb3a0]Ventaja y desventaja se anulan[/color]")
	if pv.cover == 1:
		lines.append("[color=#f0c060]Cobertura media (+2 CA)[/color]")
	elif pv.cover == 2:
		lines.append("[color=#f0c060]Cobertura de tres cuartos (+5 CA)[/color]")
	if c.is_pc and c.has_mastery(p.weapon):
		var m: String = p.weapon.mastery
		lines.append("[color=#c8b0ff]Maestría: %s[/color]" % Loc.t("mastery." + m))
	for ex in pv.get("extras", []):
		lines.append("[color=#c8b0ff]%s[/color]" % ex)
	if not rider.is_empty():
		var rsp := RulesDB.spell(str(rider.spell))
		var paid := "gratis" if c.free_casts.get(str(rider.spell), 0) > 0 else "espacio de nivel %d" % int(rider.slot)
		lines.append("[color=#bfb3a0]%s solo se gasta si impactas (%s%s).[/color]" % [rsp.get("name", ""), paid, ", y solo con crítico" if rider.get("crit_only", false) else ""])
	if path.size() > 0:
		lines.append("[color=#bfb3a0]Te moverás %s antes de atacar.[/color]" % Loc.ft(int(_move_opts.cost.get(path[path.size() - 1], 0))))
		if battle.path_threats(c, path).size() > 0:
			lines.append("[color=#f07050]¡Provocarás un ataque de oportunidad![/color]")
	var other_weapons := battle.attack_profiles(c).filter(func(x): return x.key != p.key)
	hud.show_preview(cam.screen_of(units[t.id].head_position()), "\n".join(lines), "Moverse y atacar" if path.size() > 0 else "Atacar", "attack")
	if not riders.is_empty():
		var chips: Array = [{"text": "Sin conjuro", "color": UI.TEXT_DIM}]
		for ro in riders:
			chips.append({"text": RulesDB.spell(str(ro.spell)).get("name", "") + (" (gratis)" if ro.free else ""), "color": UI.MAGIC})
		chips.append({"text": "Solo con crítico" if not pending.get("crit_only", false) else "✔ Solo con crítico", "color": UI.GOLD})
		var pp := p
		var tt := t
		var path2 := path
		hud.set_preview_options(chips, ridx, func(i: int):
			if i == chips.size() - 1:
				pending["crit_only"] = not pending.get("crit_only", false)
			else:
				pending["rider_idx"] = i
			_show_attack_preview(c, pp, tt, path2))
	hud.show_prompt("Toca otra vez al objetivo o confirma", false)
	if other_weapons.size() > 0:
		hud.show_prompt("Arma: %s" % p.name, true, "Cambiar arma")
		pending["switch_weapon"] = true

func _execute_attack() -> void:
	var c := battle.current
	var t := battle.get_creature(pending.target)
	var key: String = pending.key
	var path: Array = pending.get("path", [])
	var rider_sel: Dictionary = pending.get("rider", {})
	mode = "busy"
	_clear_targeting()
	if path.size() > 0:
		battle.do_move(c, path)
		await _play(battle.pop_events())
		if battle.over or not c.can_act():
			_after_action(c)
			return
		var p := battle.profile_by_key(c, key)
		if t == null or t.dead or not battle.in_attack_range(c, p, t):
			_after_action(c)
			return
	var aopts := {}
	if not rider_sel.is_empty():
		aopts["rider"] = rider_sel
	battle.do_attack(c, key, t, aopts)
	await _play(battle.pop_events())
	# Ataque con la otra mano disponible
	if not battle.over and c.turn.get("offhand_ready", false) and c.turn.bonus > 0 and t != null and t.is_active():
		_offer_offhand(c, t)
		return
	_after_action(c)

func _offer_offhand(c: Creature, t: Creature) -> void:
	var off := {}
	var used: String = c.turn.get("last_weapon", "")
	for p in battle.attack_profiles(c):
		if p.kind == "melee" and "light" in p.props and p.weapon.get("id", "") != used:
			off = p
	if off.is_empty():
		_after_action(c)
		return
	pending = {"kind": "offhand", "key": off.key, "target": t.id}
	mode = "target"
	hud.show_preview(cam.screen_of(units[t.id].head_position()), "[b]Ataque con la otra mano[/b]\n%s contra %s (acción adicional, sin modificador al daño)." % [off.name, t.name], "Golpear", "melee")
	hud.show_prompt("¿Atacar también con la otra mano?", false)

# ================================================================== menús de acción

func _on_action_chosen(kind: String, data: Dictionary) -> void:
	var c := battle.current
	if c == null or mode == "busy":
		return
	if mode == "target":
		_cancel_pending(false)
	match kind:
		"attack_menu":
			var items: Array = []
			for p in battle.attack_profiles(c):
				var dmg := ""
				for d in p.damage:
					dmg += "%s %s " % [d.dice, Loc.dmg_type(d.type)]
				var rng_txt := "alcance %s" % Loc.ft(int(p.reach) * 5) if p.kind == "melee" else "distancia %s/%s" % [Loc.ft(int(p.range[0]) * 5), Loc.ft(int(p.range[1]) * 5)]
				var icon := "melee" if p.kind == "melee" else ("thrown" if p.kind == "thrown" else "ranged")
				var extra := ""
				if c.has_mastery(p.weapon):
					extra = " · " + Loc.t("mastery." + p.weapon.mastery)
				var ammo_txt := ""
				if p.kind != "melee" and c.ammo_left(p.weapon) >= 0:
					ammo_txt = " · quedan %d" % c.ammo_left(p.weapon)
				items.append({"id": p.key, "icon": icon, "title": p.name, "cost": "%+d" % p.bonus, "desc": "%s· %s%s%s" % [dmg, rng_txt, extra, ammo_txt], "enabled": true})
			hud.open_sheet("Atacar con…", items, func(it): _start_attack_targeting(c, it.id))
		"spell_menu":
			var items2: Array = []
			for s in battle.spells.available(c):
				var lvl_txt := "Truco" if s.level == 0 else "Nivel %d" % s.level
				var cost_txt = {"action": "Acción", "bonus": "Adicional"}.get(s.cost, "")
				var desc: String = s.desc
				if not s.usable and not s.reason.is_empty():
					desc = s.reason
				if s.free:
					desc += " (gratis 1/día)"
				items2.append({"id": s.id, "icon": _spell_icon(s.id), "title": "%s · %s" % [s.name, lvl_txt], "cost": cost_txt, "desc": desc, "enabled": s.usable, "color": UI.MAGIC, "slots": s.slots, "level": s.level})
			hud.open_sheet("Conjuros", items2, func(it): _choose_slot(c, it))
		"feature_menu":
			hud.open_sheet("Habilidades", hud.feature_list(c), func(it): _do_feature(c, it.id))
		"action_menu":
			hud.open_sheet("Acciones", hud.action_list(c), func(it): _do_basic_action(c, it.id))
		"items_menu":
			hud.open_sheet("Objetos", hud.item_list(c), func(it): _use_item(c, it))

## Elegido un objeto del menú: poción (a quién), pergamino o varita (como un conjuro).
func _use_item(c: Creature, it: Dictionary) -> void:
	var id: String = it.id
	match str(it.get("kind", "")):
		"potion":
			_start_simple_targeting(c, "potion:" + id, "%s: elige a quién (tú o un aliado adyacente)" % Items.name_of(id))
		"scroll":
			var lvl := int(Items.data(id).get("level", 1))
			_start_spell_targeting(c, str(it.spell), lvl, "", id)
		"wand":
			var sid: String = it.spell
			var ch := int(c.item_charges.get(id, 0))
			if sid == "magic_missile" and ch > 1:
				var opts: Array = []
				for l in range(1, min(3, ch) + 1):
					opts.append({"id": str(l), "icon": "missile", "title": "Nivel %d (%d dardos)" % [l, 2 + l], "cost": "%d cargas" % l,
						"desc": "Gasta %d %s de la varita." % [l, "carga" if l == 1 else "cargas"], "enabled": true, "color": UI.MAGIC})
				hud.open_sheet("¿Cuántas cargas?", opts, func(x): _start_spell_targeting(c, sid, int(x.id), "", id))
			else:
				_start_spell_targeting(c, sid, int(RulesDB.spell(sid).get("level", 1)), "", id)

func _spell_icon(sid: String) -> String:
	return RulesDB.spell_icon(sid)

func _start_attack_targeting(c: Creature, key: String) -> void:
	pending = {"kind": "attack_pick", "key": key}
	mode = "target"
	var p := battle.profile_by_key(c, key)
	var cells := {}
	for e in battle.enemies_of(c):
		if e.is_active():
			var ok := battle.in_attack_range(c, p, e) and battle.cover(c, e) < 3
			if not ok and p.kind == "melee":
				for n in BattleMap.neighbors8(e.cell):
					if _move_opts.cost.has(n):
						ok = true
						break
			if ok:
				cells[e.cell] = Color(1.0, 0.35, 0.25, 1.0)
	world.set_highlight("target", cells)
	hud.show_prompt("Elige objetivo: %s" % p.name, false)

func _choose_slot(c: Creature, it: Dictionary) -> void:
	var sid: String = it.id
	var slots: Array = it.get("slots", [])
	var sp := RulesDB.spell(sid)
	var upcastable := sp.has("upcast_dice") or sp.has("upcast_heal") or sp.has("upcast_targets") or sp.has("upcast_darts") or sp.has("upcast_temp") or sp.has("upcast_radius")
	if slots.size() > 1 and upcastable:
		var items: Array = []
		for sl in slots:
			var free_txt := " (gratis)" if (sl == int(sp.level) and c.free_casts.get(sid, 0) > 0) else ""
			items.append({"id": str(sl), "icon": "magic", "title": "Nivel %d%s" % [sl, free_txt], "cost": "%d libres" % (c.slots[sl - 1] if sl - 1 < c.slots.size() else 0), "desc": "Lanzar %s con un espacio de nivel %d." % [sp.name, sl], "enabled": true, "color": UI.MAGIC})
		hud.open_sheet("¿A qué nivel?", items, func(x): _choose_meta(c, sid, int(x.id)))
	else:
		_choose_meta(c, sid, slots[0] if slots.size() > 0 else 0)

## Metamagia del hechicero: opciones aplicables a este conjuro.
func _choose_meta(c: Creature, sid: String, slot: int) -> void:
	var sp := RulesDB.spell(sid)
	var spn: int = c.resources.get("sorcery_points", 0)
	if c.metamagic.is_empty() or spn <= 0 or sp.get("hidden", false):
		_start_spell_targeting(c, sid, slot)
		return
	var items: Array = [{"id": "", "icon": "magic", "title": "Sin metamagia", "cost": "", "desc": "Lanzar el conjuro tal cual.", "enabled": true, "color": UI.MAGIC}]
	for m in c.metamagic:
		var info: Dictionary = RulesDB.features.get("metamagic_options", {}).get(m, {})
		var cost := int(SpellResolver.META_COST.get(m, 1))
		var ok := spn >= cost and _meta_applies(c, m, sp)
		items.append({"id": m, "icon": "metamagic", "title": info.get("name", m), "cost": "%d PH" % cost, "desc": info.get("desc", ""), "enabled": ok, "color": UI.MAGIC})
	if items.filter(func(x): return x.enabled).size() <= 1:
		_start_spell_targeting(c, sid, slot)
		return
	hud.open_sheet("Metamagia (%d puntos)" % spn, items, func(x): _start_spell_targeting(c, sid, slot, str(x.id)))

func _meta_applies(c: Creature, m: String, sp: Dictionary) -> bool:
	match m:
		"careful":
			return sp.has("area") and sp.has("save")
		"distant":
			return int(sp.get("range", 0)) >= 5
		"empowered":
			return sp.has("damage")
		"extended":
			return sp.get("concentration", false) or sp.has("duration")
		"heightened":
			return sp.has("save")
		"quickened":
			return sp.cast == "action" and c.turn.bonus > 0
		"seeking":
			return sp.has("attack")
		"transmuted":
			return sp.has("damage") and str(sp.damage.get("type", "")) in SpellResolver.TRANSMUTE_TYPES
		"twinned":
			return sp.has("upcast_targets")
	return true

func _start_spell_targeting(c: Creature, sid: String, slot: int, meta := "", item := "") -> void:
	var sp := RulesDB.spell(sid)
	pending = {"kind": "spell", "spell": sid, "slot": slot, "targets": [], "meta": meta}
	c.item_cast = {}
	if not item.is_empty():
		# Las previsiones usan ya la CD y el ataque del objeto
		pending["item"] = item
		var idata := Items.data(item)
		c.item_cast = {"spell": sid}
		if idata.has("dc"):
			c.item_cast["dc"] = int(idata.dc)
		if idata.has("atk"):
			c.item_cast["atk"] = int(idata.atk)
	mode = "target"
	world.clear_highlights(["focus"])
	var tt: String = sp.target
	match tt:
		"self":
			pending.targets = [c.id]
			if sp.has("area"):
				_show_area_preview(c, sid, slot, {"meta": meta})
				pending["self_area"] = true
				hud.show_prompt("%s: confirma para lanzarlo a tu alrededor" % sp.name, true, "Lanzar")
			else:
				_confirm_spell()
		"point":
			hud.show_prompt("%s: toca dónde centrar el área" % sp.name, false)
			_highlight_range(c, sp)
		"direction":
			hud.show_prompt("%s: toca hacia dónde lanzarlo" % sp.name, false)
		"cell":
			hud.show_prompt("%s: elige una casilla" % sp.name, false)
			_highlight_range(c, sp, true)
		"darts", "rays":
			var n = battle.spells.n_darts(c, sp, slot)
			pending["n"] = n
			if n == 1:
				hud.show_prompt("%s: elige objetivo" % sp.name, false)
			else:
				hud.show_prompt("%s: reparte %d %s (toca enemigos)" % [sp.name, n, "dardos" if tt == "darts" else "rayos"], false)
			_highlight_targets(c, sid)
		_:
			var max_t := battle.spells.max_targets(sp, slot, meta)
			pending["max"] = max_t
			hud.show_prompt("%s: elige %s" % [sp.name, "objetivo" if max_t == 1 else "hasta %d objetivos" % max_t], max_t > 1, "Lanzar")
			_highlight_targets(c, sid)

func _highlight_targets(c: Creature, sid: String) -> void:
	var cells := {}
	for t in battle.spells.valid_targets(c, sid):
		cells[t.cell] = Color(0.75, 0.55, 1.0, 1.0) if t.team != c.team else Color(0.45, 0.9, 0.5, 1.0)
	world.set_highlight("target", cells)

func _highlight_range(c: Creature, sp: Dictionary, walkable_only := false) -> void:
	var r := battle.spells.spell_cells(sp)
	var cells := {}
	for y in range(c.cell.y - r, c.cell.y + r + 1):
		for x in range(c.cell.x - r, c.cell.x + r + 1):
			var cell := Vector2i(x, y)
			if not battle.map.in_bounds(cell) or BattleMap.dist(cell, c.cell) > r:
				continue
			if walkable_only and (not battle.map.walkable(cell) or battle.creature_at(cell) != null):
				continue
			if not battle.map.has_los(c.cell, cell):
				continue
			cells[cell] = Color(0.7, 0.55, 1.0, 0.35)
	world.set_highlight("move", cells)

func _tap_target(c: Creature, cell: Vector2i, tapped: Creature, gp) -> void:
	match pending.get("kind", ""):
		"move":
			if cell == pending.cell:
				var path: Array = pending.path
				var dash: bool = pending.dash
				await _do_move(c, path, dash)
			else:
				_cancel_pending()
				_tap_idle(c, cell, tapped)
		"attack":
			if tapped != null and tapped.id == pending.target:
				await _execute_attack()
			elif tapped != null and tapped.team != c.team and tapped.is_active():
				_propose_attack(c, tapped, pending.key)
			else:
				_cancel_pending()
		"attack_pick":
			if tapped != null and tapped.team != c.team and tapped.is_active():
				_propose_attack(c, tapped, pending.key)
		"offhand":
			if tapped != null and tapped.id == pending.target:
				await _execute_offhand()
			else:
				_cancel_pending()
		"spell":
			_tap_spell(c, cell, tapped, gp)
		"simple":
			_tap_simple(c, cell, tapped)
		"feature_point", "feature_dir", "feature_cell":
			_tap_feature(c, cell, gp)

func _tap_spell(c: Creature, cell: Vector2i, tapped: Creature, gp) -> void:
	var sid: String = pending.spell
	var sp := RulesDB.spell(sid)
	var slot: int = pending.slot
	match sp.target:
		"point":
			if gp == null:
				return
			var tap := Vector2(gp.x, gp.z)
			var corner := BattleMap.snap_point(tap)
			if pending.has("point") and (pending.point as Vector2).distance_to(tap) < 0.6:
				_confirm_spell()
				return
			if not battle.spells.point_in_range(c, sid, corner):
				hud.show_banner("Fuera de alcance", UI.TEXT_DIM, 0.7)
				return
			pending.point = corner
			_show_area_preview(c, sid, slot, {"point": corner})
		"direction":
			if gp == null:
				return
			var dir := Vector2(gp.x, gp.z)
			var area := battle.spells.area_cells(c, sid, {"dir": dir})
			if pending.has("area") and cell in pending.area:
				_confirm_spell()
				return
			pending.dir = dir
			pending.area = area
			_show_area_preview(c, sid, slot, {"dir": dir})
		"cell":
			var ok := battle.map.in_bounds(cell) and BattleMap.dist(c.cell, cell) <= battle.spells.spell_cells(sp) and battle.map.has_los(c.cell, cell)
			if sid == "misty_step":
				ok = ok and battle.map.walkable(cell) and battle.creature_at(cell) == null
			if not ok:
				hud.show_banner("Casilla no válida", UI.TEXT_DIM, 0.7)
				return
			if pending.has("cell") and pending.cell == cell:
				_confirm_spell()
				return
			pending.cell = cell
			world.set_highlight("target", {cell: Color(0.7, 0.55, 1.0, 1.0)})
			hud.show_prompt("%s: toca otra vez para confirmar" % sp.name, true, "Lanzar")
		"darts", "rays":
			if tapped == null or not tapped in battle.spells.valid_targets(c, sid):
				return
			pending.targets.append(tapped.id)
			var n: int = pending.n
			Game.sfx("tick", -6)
			if pending.targets.size() >= n:
				_confirm_spell()
			else:
				hud.show_prompt("%s: %d/%d · toca enemigos" % [sp.name, pending.targets.size(), n], true, "Todos al último")
				fx.float_text(units[tapped.id].head_position(), "×%d" % pending.targets.count(tapped.id), UI.MAGIC, 0.7, 0.3, 0.8)
		_:
			if tapped == null or not tapped in battle.spells.valid_targets(c, sid):
				return
			var max_t: int = pending.get("max", 1)
			if tapped.id in pending.targets:
				if max_t == 1:
					_confirm_spell()
					return
				pending.targets.erase(tapped.id)
			else:
				pending.targets.append(tapped.id)
			if max_t == 1:
				_show_spell_preview(c, sid, slot)
			else:
				var cells := {}
				for tid in pending.targets:
					cells[battle.get_creature(tid).cell] = Color(1.0, 0.85, 0.3, 1.0)
				world.set_highlight("area", cells)
				hud.show_prompt("%s: %d/%d elegidos" % [sp.name, pending.targets.size(), max_t], pending.targets.size() > 0, "Lanzar")
				if pending.targets.size() >= max_t:
					_show_spell_preview(c, sid, slot)

func _tap_feature(c: Creature, cell: Vector2i, gp) -> void:
	var id: String = pending.id
	match pending.kind:
		"feature_point":
			if gp == null:
				return
			var tap := Vector2(gp.x, gp.z)
			var corner := BattleMap.snap_point(tap)
			if id == "zone_move":
				corner = BattleMap.center(cell)
			if pending.has("point") and (pending.point as Vector2).distance_to(tap) < 0.6:
				await _confirm_feature()
				return
			var center := BattleMap.cell_at(corner)
			if BattleMap.dist(pending.from, center) > int(pending.range):
				hud.show_banner("Fuera de alcance", UI.TEXT_DIM, 0.7)
				return
			pending.point = corner
			var cells := battle.map.sphere_cells(corner, int(pending.radius))
			var hl := {}
			for cc in cells:
				hl[cc] = Color(0.55, 0.9, 0.45, 0.9)
			world.set_highlight("area", hl)
			hud.show_prompt("Toca otra vez para confirmar", true, "Confirmar")
		"feature_dir":
			if gp == null:
				return
			var dir := Vector2(gp.x, gp.z)
			var cells2 := battle.cls.breath_cells(c, pending.shape, dir)
			if pending.has("cells") and cell in pending.cells:
				await _confirm_feature()
				return
			pending.dir = dir
			pending.cells = cells2
			var hl2 := {}
			var foes := 0
			var friends := 0
			for cc in cells2:
				hl2[cc] = Color(1.0, 0.55, 0.2, 0.9)
				var o := battle.creature_at(cc)
				if o != null and o != c:
					if o.team == c.team:
						friends += 1
						hl2[cc] = Color(1.0, 0.25, 0.2, 1.0)
					else:
						foes += 1
			world.set_highlight("area", hl2)
			var txt := "[b]Arma de aliento[/b]\nEnemigos alcanzados: [b]%d[/b]" % foes
			if friends > 0:
				txt += "\n[color=#f07050][b]¡Cuidado! Alcanza a %d aliado(s).[/b][/color]" % friends
			hud.show_preview(cam.screen_of(BattleWorld.cell_center(cells2[0]) if cells2.size() > 0 else units[c.id].position), txt, "Exhalar", "breath", foes > 0 or friends > 0)
		"feature_cell":
			var ok := battle.map.walkable(cell) and battle.creature_at(cell) == null and BattleMap.dist(c.cell, cell) <= int(pending.range) and battle.map.has_los(c.cell, cell)
			if not ok:
				hud.show_banner("Casilla no válida", UI.TEXT_DIM, 0.7)
				return
			if pending.has("cell") and pending.cell == cell:
				await _confirm_feature()
				return
			pending.cell = cell
			world.set_highlight("target", {cell: Color(0.7, 0.55, 1.0, 1.0)})
			hud.show_prompt("Toca otra vez para confirmar", true, "Confirmar")

func _confirm_feature() -> void:
	var c := battle.current
	var id: String = pending.id
	var data := {}
	if pending.has("point"):
		data.point = pending.point
	if pending.has("dir"):
		data.dir = pending.dir
	if pending.has("cell"):
		data.cell = pending.cell
	if int(pending.get("zone", -1)) >= 0:
		data.zone = int(pending.zone)
	await _run_action(func(): battle.cls.use(c, id, data))

func _show_area_preview(c: Creature, sid: String, slot: int, data: Dictionary) -> void:
	var sp := RulesDB.spell(sid)
	var cells := battle.spells.area_cells(c, sid, data)
	var hl := {}
	for cell in cells:
		hl[cell] = Color(0.75, 0.5, 1.0, 0.9)
	var pv := battle.spells.preview(c, sid, slot, data)
	var allies_hit := 0
	var foes := 0
	for a in pv.affected:
		if a.team == c.team:
			allies_hit += 1
			hl[battle.get_creature(a.id).cell] = Color(1.0, 0.3, 0.2, 1.0)
		else:
			foes += 1
	world.set_highlight("area", hl)
	var lines := ["[b]%s[/b]" % sp.name, "Enemigos en el área: [b]%d[/b]" % foes]
	if pv.enemy_dmg > 0:
		lines.append("Daño esperado total: %.1f" % pv.enemy_dmg)
	if allies_hit > 0:
		lines.append("[color=#f07050][b]¡Cuidado! Alcanza a %d aliado(s).[/b][/color]" % allies_hit)
	lines.append("[color=#bfb3a0]Toca otra vez en el área para lanzar.[/color]")
	var center: Vector3 = BattleWorld.cell_center(cells[0]) if cells.size() > 0 else units[c.id].position
	hud.show_preview(cam.screen_of(center), "\n".join(lines), "Lanzar", _spell_icon(sid), foes > 0 or allies_hit > 0)

func _show_spell_preview(c: Creature, sid: String, slot: int) -> void:
	var sp := RulesDB.spell(sid)
	var pv := battle.spells.preview(c, sid, slot, {"targets": pending.targets})
	var lines := ["[b]%s[/b]" % sp.name]
	if sp.has("attack") and pending.targets.size() > 0:
		var t := battle.get_creature(pending.targets[0])
		var mi := battle.attack_mode(c, t, sp.attack)
		var ac := battle.target_ac(t, c)
		lines.append("Probabilidad de impacto: [b]%d %%[/b]" % int(round(Dice.p_success(c.spell_attack_bonus(), ac, mi.mode) * 100)))
		if mi.mode < 0:
			lines.append("[color=#f0a060]Desventaja: %s[/color]" % ", ".join(mi.dis.map(func(r): return Loc.t("reason." + r))))
		elif mi.mode > 0:
			lines.append("[color=#8fe08f]Ventaja: %s[/color]" % ", ".join(mi.adv.map(func(r): return Loc.t("reason." + r))))
	elif sp.has("save") and pending.targets.size() > 0:
		var t2 := battle.get_creature(pending.targets[0])
		var dc := battle.spells.save_dc(c, sid)
		var p_fail := 1.0 - Dice.p_success(t2.save_bonus(sp.save.ability), dc, 0, 21, false)
		lines.append("Salvación de %s CD %d: falla el %d %%" % [Loc.ability(sp.save.ability), dc, int(round(p_fail * 100))])
		if sid == "hold_person" and t2.ctype != "humanoid":
			lines.append("[color=#f07050]Solo afecta a humanoides.[/color]")
	if pv.enemy_dmg > 0:
		lines.append("Daño esperado: %.1f" % pv.enemy_dmg)
	if not sp.get("damage_choice", []).is_empty() and pending.targets.size() > 0:
		var tdt := battle.get_creature(pending.targets[0])
		lines.append("Tipo de daño: %s" % Loc.dmg_type(battle.spells.damage_type(c, sp, tdt, {"meta": pending.get("meta", "")})))
	if pv.heal > 0:
		lines.append("Curación media: %.1f" % pv.heal)
	lines.append("[color=#bfb3a0]%s[/color]" % sp.get("desc", ""))
	var t0 := battle.get_creature(pending.targets[0]) if pending.targets.size() > 0 else battle.current
	if t0 != c:
		_frame_pair(c, t0)
	hud.show_preview(cam.screen_of(units[t0.id].head_position()), "\n".join(lines), "Lanzar", _spell_icon(sid))

func _confirm_spell() -> void:
	var c := battle.current
	var sid: String = pending.spell
	var slot: int = pending.slot
	var data := {"targets": pending.get("targets", [])}
	if pending.has("point"):
		data.point = pending.point
	if pending.has("dir"):
		data.dir = pending.dir
	if pending.has("cell"):
		data.cell = pending.cell
	if sid == "command":
		data.cmd = "grovel"
	if sid == "spiritual_weapon":
		data.targets = []
	if not str(pending.get("meta", "")).is_empty():
		data.meta = pending.meta
	if pending.has("item"):
		data["item"] = pending.item
	mode = "busy"
	_clear_targeting()
	var ok := battle.spells.cast(c, sid, slot, data)
	if not ok:
		Game.sfx("error")
		hud.show_banner("No se puede lanzar así", UI.ENEMY, 0.9)
	await _play(battle.pop_events())
	_after_action(c)

# ------------------------------------------------------------------ acciones simples

func _do_basic_action(c: Creature, id: String) -> void:
	match id:
		"dash":
			await _run_action(func(): battle.do_dash(c))
		"disengage":
			await _run_action(func(): battle.do_disengage(c))
		"dodge":
			await _run_action(func(): battle.do_dodge(c))
		"hide":
			await _run_action(func(): battle.do_hide(c))
		"help":
			_start_simple_targeting(c, "help", "Elige un enemigo adyacente al que distraer")
		"shove":
			_start_simple_targeting(c, "shove", "Elige un enemigo adyacente para derribarlo")
		"stabilize":
			_start_simple_targeting(c, "stabilize", "Elige un aliado caído adyacente")
		"wake":
			_start_simple_targeting(c, "wake", "Elige un aliado dormido adyacente")

func _do_feature(c: Creature, id: String) -> void:
	var f := battle.cls.entry(c, id)
	if f.is_empty() or not f.get("enabled", true):
		return
	match str(f.get("target", "none")):
		"none":
			await _run_action(func(): battle.cls.use(c, id))
		"enemy", "enemy_adjacent", "ally_other", "ally_touch", "creature":
			var texts := {"enemy": "Elige un enemigo", "enemy_adjacent": "Elige un enemigo adyacente", "ally_other": "Elige a un aliado",
				"ally_touch": "Elige a quién tocar (tú o un aliado adyacente)", "creature": "Elige aliado (curar) o enemigo (dañar)"}
			_start_simple_targeting(c, "feat:" + id, "%s: %s" % [f.title, texts.get(f.target, "elige objetivo")])
		"choice":
			var items: Array = []
			for o in f.get("options", []):
				items.append({"id": o.id, "icon": o.get("icon", f.icon), "title": o.title, "cost": "", "desc": o.get("desc", ""), "enabled": o.get("enabled", true)})
			hud.open_sheet(f.title, items, func(it): _run_action(func(): battle.cls.use(c, id, {"choice": it.id})))
		"point":
			pending = {"kind": "feature_point", "id": id, "zone": f.get("zone", -1), "range": int(f.get("range", 12)), "radius": int(f.get("radius", 5))}
			mode = "target"
			world.clear_highlights(["focus"])
			var from_cell: Vector2i = c.cell
			if id == "zone_move":
				var z := battle.get_zone(int(f.zone))
				var zp: Vector2 = z.get("point", BattleMap.center(c.cell))
				from_cell = BattleMap.cell_at(zp)
			pending["from"] = from_cell
			_highlight_cells_within(from_cell, int(f.get("range", 12)))
			hud.show_prompt("%s: toca dónde" % f.title, false)
		"direction":
			pending = {"kind": "feature_dir", "id": id, "shape": f.get("shape", "cone")}
			mode = "target"
			world.clear_highlights(["focus", "move", "dash"])
			hud.show_prompt("%s: toca hacia dónde" % f.title, false)
		"cell":
			pending = {"kind": "feature_cell", "id": id, "range": int(f.get("range", 6))}
			mode = "target"
			world.clear_highlights(["focus", "move", "dash"])
			var cells := {}
			for y in range(c.cell.y - pending.range, c.cell.y + pending.range + 1):
				for x in range(c.cell.x - pending.range, c.cell.x + pending.range + 1):
					var cell := Vector2i(x, y)
					if battle.map.walkable(cell) and battle.creature_at(cell) == null and BattleMap.dist(cell, c.cell) <= pending.range and battle.map.has_los(c.cell, cell):
						cells[cell] = Color(0.7, 0.55, 1.0, 0.35)
			world.set_highlight("move", cells)
			hud.show_prompt("%s: elige una casilla" % f.title, false)

func _highlight_cells_within(center: Vector2i, r: int) -> void:
	var cells := {}
	for y in range(center.y - r, center.y + r + 1):
		for x in range(center.x - r, center.x + r + 1):
			var cell := Vector2i(x, y)
			if battle.map.in_bounds(cell) and BattleMap.dist(cell, center) <= r:
				cells[cell] = Color(0.6, 0.85, 0.5, 0.3)
	world.set_highlight("move", cells)

func _run_action(f: Callable) -> void:
	var c := battle.current
	mode = "busy"
	_clear_targeting()
	f.call()
	await _play(battle.pop_events())
	_after_action(c)

func _start_simple_targeting(c: Creature, what: String, text: String) -> void:
	pending = {"kind": "simple", "what": what}
	mode = "target"
	var cells := {}
	for o in battle.creatures:
		if o.dead:
			continue
		if _simple_valid(c, what, o):
			cells[o.cell] = Color(0.45, 0.9, 0.5, 1.0) if o.team == c.team else Color(1.0, 0.4, 0.3, 1.0)
	if cells.is_empty():
		hud.show_banner("No hay objetivos válidos", UI.TEXT_DIM, 0.9)
		_cancel_pending()
		return
	world.set_highlight("target", cells)
	hud.show_prompt(text, false)

func _simple_valid(c: Creature, what: String, o: Creature) -> bool:
	var d := BattleMap.dist(c.cell, o.cell)
	if what.begins_with("feat:"):
		return o in battle.cls.valid_targets(c, what.substr(5))
	if what.begins_with("potion:"):
		var heals: bool = Items.data(what.substr(7)).get("use", {}).has("heal")
		return o.team == c.team and not o.dead and d <= 1 and (o.hp < o.max_hp or not heals)
	match what:
		"potion":
			return o.team == c.team and d <= 1 and (o.hp < o.max_hp)
		"help", "shove":
			return o.team != c.team and o.is_active() and d <= 1
		"stabilize":
			return o.team == c.team and o.is_down() and not o.stable and d <= 1
		"wake":
			return o.team == c.team and o.has_effect("sleep") and d <= 1
		"divine_spark":
			return d <= 6 and battle.map.has_los(c.cell, o.cell) and (o.team != c.team and o.is_active() or o.team == c.team and o.hp < o.max_hp)
		"sw_move":
			var tid := "sw_" + c.id
			if not battle.tokens.has(tid) or o.team == c.team or not o.is_active():
				return false
			var from: Vector2i = battle.tokens[tid].cell
			for n in BattleMap.neighbors8(o.cell):
				if BattleMap.dist(from, n) <= 4:
					return true
			return false
	return false

func _tap_simple(c: Creature, cell: Vector2i, tapped: Creature) -> void:
	var what: String = pending.what
	if tapped == null or not _simple_valid(c, what, tapped):
		return
	if what.begins_with("feat:"):
		var fid := what.substr(5)
		await _run_action(func(): battle.cls.use(c, fid, {"target": tapped.id}))
		return
	if what.begins_with("potion:"):
		var iid := what.substr(7)
		await _run_action(func(): battle.do_item(c, tapped, iid))
		return
	match what:
		"potion":
			await _run_action(func(): battle.do_potion(c, tapped))
		"help":
			await _run_action(func(): battle.do_help(c, tapped))
		"shove":
			await _run_action(func(): battle.do_shove(c, tapped, true))
		"stabilize":
			await _run_action(func(): battle.do_stabilize(c, tapped))
		"wake":
			await _run_action(func(): battle.do_wake(c, tapped))
		"divine_spark":
			await _run_action(func(): battle.do_divine_spark(c, tapped))
		"sw_move":
			var from: Vector2i = battle.tokens["sw_" + c.id].cell
			var best := tapped.cell
			var best_d := 99
			for n in BattleMap.neighbors8(tapped.cell):
				var dd := BattleMap.dist(from, n)
				if dd <= 4 and dd < best_d:
					best_d = dd
					best = n
			await _run_action(func(): battle.spells.spiritual_weapon_turn(c, best, tapped))

func _execute_offhand() -> void:
	var c := battle.current
	var t := battle.get_creature(pending.target)
	var key: String = pending.key
	mode = "busy"
	_clear_targeting()
	battle.do_attack(c, key, t, {"offhand": true})
	await _play(battle.pop_events())
	_after_action(c)

# ------------------------------------------------------------------ botones

func _on_confirm() -> void:
	match pending.get("kind", ""):
		"feature_point", "feature_dir", "feature_cell":
			if pending.has("point") or pending.has("dir") or pending.has("cell"):
				await _confirm_feature()
		"move":
			var c := battle.current
			await _do_move(c, pending.path, pending.dash)
		"attack":
			if pending.get("switch_weapon", false) and hud.prompt.visible and not hud.preview.visible:
				pass
			await _execute_attack()
		"offhand":
			await _execute_offhand()
		"spell":
			var sp := RulesDB.spell(pending.spell)
			if sp.target in ["darts", "rays"] and pending.targets.size() > 0:
				while pending.targets.size() < int(pending.n):
					pending.targets.append(pending.targets[pending.targets.size() - 1])
			if sp.target == "point" and not pending.has("point"):
				return
			if sp.target == "direction" and not pending.has("dir"):
				return
			if sp.target == "cell" and not pending.has("cell"):
				return
			if not sp.target in ["point", "direction", "cell", "self"] and pending.targets.is_empty():
				return
			await _confirm_spell()

func _cancel_pending(restore := true) -> void:
	var c := battle.current
	pending = {}
	if c != null:
		c.item_cast = {}
	world.clear_highlights()
	hud.hide_prompt()
	hud.hide_preview()
	if restore and c != null and c.team == 0 and mode != "busy":
		_enter_idle(c)

func _on_undo() -> void:
	var c := battle.current
	if c == null or mode == "busy":
		return
	if battle.can_undo_move(c):
		battle.undo_move(c)
		await _play(battle.pop_events())
		_enter_idle(c)

func _on_end_turn() -> void:
	if battle.current == null or battle.current.team != 0:
		return
	mode = "busy"
	_clear_targeting()
	_turn_done.emit()

func _on_auto_toggled(pid: String, on: bool) -> void:
	Game.set_auto(pid, on)
	if on and battle.current != null and battle.current.id == pid and mode != "busy":
		_on_end_turn_to_ai()

func _on_end_turn_to_ai() -> void:
	# El compañero pasa a jugar solo este mismo turno
	mode = "busy"
	_clear_targeting()
	var c := battle.current
	await _ai_turn(c)
	_turn_done.emit()

func _on_speed_toggle() -> void:
	var fast := float(Game.settings.anim_speed) <= 1.0
	Game.set_setting("anim_speed", 2.0 if fast else 1.0)
	Engine.time_scale = float(Game.settings.anim_speed)
	hud.set_speed_label(fast)

func open_menu() -> void:
	_on_menu()

func _on_menu() -> void:
	if _paused:
		return
	_paused = true
	var prev_scale := Engine.time_scale
	Engine.time_scale = 1.0
	var menu := PauseMenu.new()
	if world_mode:
		menu.context = "world_battle"
	hud.add_child(menu)
	var choice: String = await menu.closed
	_paused = false
	Engine.time_scale = prev_scale
	match choice:
		"restart":
			finished.emit({"restart": true, "encounter": enc_id})
		"exit":
			finished.emit({"exit": true, "encounter": enc_id})
		"load":
			finished.emit({"load": true, "encounter": enc_id})
		_:
			battle.settings.pc_reactions = Game.settings.get("reactions", "auto")
			hud.refresh()

func _maybe_tip() -> void:
	if not Game.settings.get("tips", true):
		return
	var tips: Array = battle.encounter.get("tips", [])
	if _tip_index < tips.size() and _player_turns % 2 == 1:
		hud.show_tip(tips[_tip_index])
		_tip_index += 1

# ================================================================== reproducción de eventos

func _play(events: Array) -> void:
	var i := 0
	while i < events.size():
		var e: Dictionary = events[i]
		await _play_one(e)
		i += 1
	for id in units:
		units[id].refresh()
	hud.refresh()

func _u(id: String) -> UnitView:
	return units.get(id)

func _play_one(e: Dictionary) -> void:
	match e.t:
		"log":
			hud.add_log(e.text)
		"round":
			hud.refresh()
		"turn":
			var c := battle.get_creature(e.who)
			if c:
				_set_active_ring(c)
		"move":
			var u := _u(e.who)
			if u:
				cam.focus_on(BattleWorld.cell_center(e.path[e.path.size() - 1]))
				await u.move_along(e.path, 0.22, _step_sfx)
		"dash":
			var u2 := _u(e.who)
			if u2:
				fx.float_text(u2.head_position(), "¡Corre!", UI.TEXT_DIM, 0.6, 0.5, 0.9)
		"disengage":
			fx.float_text(_u(e.who).head_position(), "Se destraba", UI.TEXT_DIM, 0.6, 0.5, 0.9)
		"stand":
			_u(e.who).play("idle", true)
		"attack":
			await _play_attack(e)
		"damage":
			_play_damage(e)
		"heal":
			var u3 := _u(e.who)
			if u3 and e.amount > 0:
				fx.float_text(u3.head_position(), "+%d" % e.amount, UI.HEAL, 1.0)
				fx.sparkles(u3.chest_position(), Color(0.5, 1.0, 0.55))
				u3.refresh()
				if e.get("source", "") != "" and e.source != e.who and randf() < 0.35:
					_bark(e.source, "heal")
		"save":
			if Game.settings.get("dice_details", true):
				var u4 := _u(e.who)
				if u4:
					var txt := "%s %d/%d %s" % [Loc.ability_short(e.ability), e.total, e.dc, "✔" if e.success else "✘"]
					fx.dice_text(u4.head_position(), txt, e.success)
					await get_tree().create_timer(0.25).timeout
		"condition":
			var u5 := _u(e.who)
			if u5:
				u5.refresh()
				if e.on and e.cond in ["prone", "paralyzed", "frightened", "incapacitated", "unconscious"] and not u5.downed:
					fx.float_text(u5.head_position(), Loc.cond(e.cond), Color(1.0, 0.6, 0.45), 0.65, 0.6, 1.1)
		"effect":
			var u6 := _u(e.who)
			if u6:
				u6.refresh()
				if e.on and e.get("positive", false):
					fx.sparkles(u6.chest_position(), Color(0.7, 0.85, 1.0), 12)
		"downed":
			var u7 := _u(e.who)
			if u7:
				u7.fall_down()
				Game.sfx("thud")
				fx.float_text(u7.head_position(), "¡Cae!", UI.ENEMY, 0.9)
				await get_tree().create_timer(0.6).timeout
				_bark_ally_down(e.who)
		"death":
			var u8 := _u(e.who)
			if u8:
				var c8 := battle.get_creature(e.who)
				if c8 and c8.team == 1:
					fx.smoke(u8.chest_position(), Color(0.3, 0.3, 0.35))
				u8.die()
				Game.sfx("thud", -4)
				await get_tree().create_timer(0.5).timeout
				_bark_kill(e.who)
		"death_save":
			var u9 := _u(e.who)
			if u9 and e.roll > 0:
				Game.sfx("dice", -6)
				fx.dice_text(u9.head_position(), "Muerte: %d (%d✔ %d✘)" % [e.roll, e.successes, e.failures], e.roll >= 10)
				await get_tree().create_timer(0.7).timeout
		"stable":
			fx.float_text(_u(e.who).head_position(), "Estable", UI.HEAL, 0.7)
		"revive":
			var ur := _u(e.who)
			if ur:
				ur.get_up()
				await get_tree().create_timer(0.4).timeout
		"push":
			await _u(e.who).slide_to(e.to)
		"teleport":
			Game.sfx("teleport")
			fx.smoke(_u(e.who).chest_position(), Color(0.75, 0.8, 0.9))
			await _u(e.who).teleport_to(e.to)
		"swap":
			_u(e.a).slide_to(e.a_cell, 0.2)
			await _u(e.b).slide_to(e.b_cell, 0.2)
		"cast":
			await _play_cast(e)
		"missile":
			var src := _u(e.who)
			var dst := _u(e.target)
			if src and dst:
				Game.sfx("missile", -4)
				await fx.projectile(src.chest_position() + Vector3(0, 0.2, 0), dst.chest_position(), "missile", 16.0)
		"reaction":
			var ur2 := _u(e.who)
			if ur2:
				Game.sfx("shield" if e.get("spell", "") == "shield" else "buff", -2)
				fx.float_text(ur2.head_position(), "¡%s!" % e.name, UI.MAGIC, 0.8)
				fx.ring_wave(ur2.global_position, 0.8, Color(0.6, 0.75, 1.0), 0.4)
				if e.get("target", "") != "" and _u(e.target):
					fx.beam(ur2.chest_position(), _u(e.target).chest_position(), Color(0.85, 0.6, 1.0), 0.35)
				else:
					ur2.block()
		"summon":
			if e.get("kind", "") == "flaming_sphere":
				fx.spawn_token(e.id, e.cell, Color(1.0, 0.5, 0.15), "flaming_sphere")
				Game.sfx("fire")
			else:
				fx.spawn_token(e.id, e.cell)
				Game.sfx("buff")
		"summon_move":
			await fx.move_token(e.id, e.to)
		"unsummon":
			fx.remove_token(e.id)
		"hide":
			var uh := _u(e.who)
			fx.float_text(uh.head_position(), "Oculto" if e.success else "No logra ocultarse", UI.TEXT_DIM, 0.65)
			uh.refresh()
		"reveal":
			var ur3 := _u(e.who)
			if ur3:
				fx.float_text(ur3.head_position(), "¡Descubierto!", Color(1.0, 0.7, 0.4), 0.65)
				ur3.refresh()
		"sneak":
			fx.float_text(_u(e.target).head_position() + Vector3(0, 0.3, 0), "Ataque furtivo", UI.MAGIC, 0.6, 0.6, 1.0)
		"feature":
			var uf := _u(e.who)
			if uf == null:
				return
			var names := {"second_wind": "Tomar aliento", "action_surge": "¡Oleada de acción!", "rage": "¡FURIA!", "reckless": "¡Temerario!",
				"frenzy": "Frenesí", "flurry": "Ráfaga de golpes", "patient_defense": "Defensa paciente", "step_of_wind": "Paso del viento",
				"sacred_weapon": "Arma sagrada", "innate_sorcery": "Hechicería innata", "create_slot": "Fuente de magia",
				"uncanny_metabolism": "Metabolismo asombroso", "relentless_endurance": "¡Aguante incansable!", "fires_burn": "Ardor del fuego",
				"frosts_chill": "Gélido aliento", "hills_tumble": "Embestida", "clouds_jaunt": "Salto de las nubes", "adrenaline_rush": "¡Adrenalina!"}
			var label: String = e.get("name", names.get(e.feature, ""))
			if not label.is_empty():
				fx.float_text(uf.head_position(), label, Color(1.0, 0.45, 0.3) if e.feature in ["rage", "reckless", "frenzy"] else UI.GOLD, 0.75)
			if e.feature in ["rage", "reckless"]:
				uf.play_and_return("taunt")
				fx.ring_wave(uf.global_position, 1.2, Color(1.0, 0.35, 0.2), 0.45)
				Game.sfx("crit", -6)
			elif e.feature in ["frenzy", "fires_burn", "frosts_chill", "hills_tumble", "flurry"]:
				pass
			else:
				uf.cast(true)
				Game.sfx("buff", -4)
			await get_tree().create_timer(0.35).timeout
		"item":
			if Items.kind(str(e.item)) == "potion":
				var ui := _u(e.who)
				ui.play_and_return("use")
				Game.sfx("potion")
				await get_tree().create_timer(0.5).timeout
			else:
				Game.sfx("page", -4)
				hud.show_banner(Items.name_of(str(e.item)), UI.MAGIC, 0.8)
		"special":
			var us := _u(e.who)
			var ut := _u(e.target)
			if us and ut:
				us.attack("melee", ut.position)
				Game.sfx("necrotic")
				fx.beam(ut.chest_position(), us.chest_position(), Color(0.4, 0.95, 0.5), 0.5, 0.05)
				await get_tree().create_timer(0.5).timeout
		"shove":
			var ush := _u(e.who)
			var ut2 := _u(e.target)
			await ush.attack("melee", ut2.position)
			Game.sfx("hit_flesh")
			if e.success:
				ut2.hit()
		"blocked":
			fx.float_text(_u(e.who).head_position(), "No se atreve…", UI.TEXT_DIM, 0.6)
		"immune":
			fx.float_text(_u(e.who).head_position(), "Inmune", UI.TEXT_DIM, 0.6)
		"max_hp", "concentration":
			if _u(e.who):
				_u(e.who).refresh()
		"temp_hp":
			var ut := _u(e.who)
			if ut:
				fx.float_text(ut.head_position(), "+%d temp." % int(e.amount), Color(0.6, 0.85, 1.0), 0.75)
				ut.refresh()
		"inspiration":
			var ui2 := _u(e.who)
			if ui2:
				var itxt := "¡Inspirado! +%d" % int(e.amount) if e.kind == "bardic" else "Inspiración heroica"
				fx.float_text(ui2.head_position() + Vector3(0, 0.3, 0), itxt, UI.GOLD, 0.7)
				fx.sparkles(ui2.chest_position(), Color(1.0, 0.9, 0.5), 14)
		"mirror":
			var um := _u(e.who)
			if um:
				fx.float_text(um.head_position(), "¡Era una imagen!", Color(0.8, 0.7, 1.0), 0.7)
				fx.smoke(um.chest_position(), Color(0.75, 0.6, 1.0))
				um.refresh()
		"zone":
			if e.get("on", false):
				var col := Color.html(str(e.get("color", "#ffffff")))
				world.show_zone(int(e.id), str(e.get("kind", "")), e.cells, col)
				if not e.get("moved", false):
					await get_tree().create_timer(0.25).timeout
			else:
				world.hide_zone(int(e.id))
		"zone_hit":
			var uz := _u(e.who)
			if uz:
				fx.burst(uz.chest_position(), Color(0.95, 0.95, 1.0) if e.get("token", "") == "" else Color(1.0, 0.5, 0.15), 14, 1.8)
		"burst":
			fx.area_flash(e.cells, FX.style_color(str(e.get("fx", "arcane"))), 0.6)
			Game.sfx("frost" if e.get("fx", "") == "frost" else "thunder", -6)
		"shape":
			var us2 := _u(e.who)
			if us2:
				fx.smoke(us2.chest_position(), Color(0.55, 0.75, 0.45))
				Game.sfx("teleport", -4)
				us2.rebuild_model()
				await get_tree().create_timer(0.35).timeout
		"resize":
			var ur4 := _u(e.who)
			if ur4:
				ur4.apply_size()
				fx.sparkles(ur4.chest_position(), Color(0.8, 0.7, 1.0), 16)
		"escape":
			var ue := _u(e.who)
			if ue:
				fx.float_text(ue.head_position(), "¡Libre!" if e.success else "Sigue apresado", UI.TEXT if e.success else UI.TEXT_DIM, 0.65)
		"initiative", "turn_end", "end":
			pass

func _play_attack(e: Dictionary) -> void:
	var a := _u(e.who)
	var t := _u(e.target)
	if a == null or t == null:
		return
	var kind: String = e.kind
	var is_spell: bool = e.get("spell", false)
	var mid := (a.position + t.position) * 0.5
	cam.focus_on(mid)
	if e.get("token", "") != "":
		await fx.token_strike(e.token, t.chest_position())
	elif is_spell:
		var style := _spell_style(_current_spell if _current_spell != "" else "fire_bolt")
		if e.get("fx", "") != "":
			style = str(e.fx)
		if e.get("dtype", "") != "" and str(e.get("sid", "")) in ["chromatic_orb", "sorcerous_burst"]:
			style = _dtype_style(str(e.dtype))
		if kind == "melee_spell":
			await a.attack("melee", t.position)
			fx.burst(t.chest_position(), _style_color(style), 18, 2.5)
			Game.sfx("lightning")
		else:
			await a.cast()
			Game.sfx(_style_sfx(style), -2)
			await fx.projectile(a.chest_position() + Vector3(0, 0.15, 0), t.chest_position(), style, 13.0)
	else:
		if kind == "melee":
			Game.sfx("swing", -6)
			await a.attack("melee", t.position)
		else:
			await a.attack(kind, t.position)
			Game.sfx("arrow", -4)
			var pstyle := "arrow"
			var wid: String = e.get("weapon", "")
			if "crossbow" in wid:
				pstyle = "bolt"
			elif wid == "javelin":
				pstyle = "javelin"
			elif "dagger" in wid:
				pstyle = "dagger"
			await fx.projectile(a.chest_position() + Vector3(0, 0.1, 0), t.chest_position(), pstyle, 18.0)
	if Game.settings.get("dice_details", true):
		var dtxt := "%d%s = %d vs %d" % [e.natural, (" %+d" % (e.total - e.natural)), e.total, e.ac]
		if e.mode > 0:
			dtxt = "▲ " + dtxt
		elif e.mode < 0:
			dtxt = "▼ " + dtxt
		fx.dice_text(a.head_position(), dtxt, e.hit)
	if e.crit:
		fx.float_text(t.head_position() + Vector3(0, 0.35, 0), "¡CRÍTICO!", Color(1.0, 0.85, 0.3), 1.2, 1.0, 1.4)
		Game.sfx("crit")
		Game.vibrate(60)
		_shake(0.18)
		var cr := battle.get_creature(e.who)
		if cr and cr.is_pc:
			_bark(cr.id, "crit")
	if e.hit:
		t.hit()
	else:
		fx.float_text(t.head_position(), "Falla", UI.TEXT_DIM, 0.8, 0.7, 1.0)
		Game.sfx("miss", -8)
		t.block()
	await get_tree().create_timer(0.12).timeout

func _play_damage(e: Dictionary) -> void:
	var u := _u(e.who)
	if u == null:
		return
	var c := battle.get_creature(e.who)
	if e.get("immune", false):
		fx.float_text(u.head_position(), "Inmune", UI.TEXT_DIM, 0.7)
		return
	var col := Color(1.0, 0.35, 0.3) if c.team == 0 else Color(1.0, 0.88, 0.75)
	if e.type in ["fire", "radiant"]:
		col = Color(1.0, 0.7, 0.3)
	elif e.type in ["cold", "force"]:
		col = Color(0.7, 0.85, 1.0)
	elif e.type == "necrotic":
		col = Color(0.6, 1.0, 0.6)
	fx.float_text(u.head_position(), str(e.amount), col, 1.15 if e.get("crit", false) else 0.95)
	if c.ctype == "undead" and c.template_id.begins_with("skeleton"):
		Game.sfx("hit_bone", -4)
	elif c.armor_id in ["chain_mail", "chain_shirt"] or c.fixed_ac >= 15:
		Game.sfx("hit_metal", -6)
	else:
		Game.sfx("hit_flesh", -4)
	fx.burst(u.chest_position(), Color(0.7, 0.1, 0.08) if c.ctype != "undead" else Color(0.85, 0.82, 0.75), 8, 1.6, 0.035, 0.45, -6.0)
	u.refresh()
	if c.team == 0 and c.is_active() and c.hp_ratio() < 0.35 and randf() < 0.4:
		_bark(c.id, "hurt")

func _play_cast(e: Dictionary) -> void:
	var a := _u(e.who)
	if a == null:
		return
	var sid: String = e.spell
	_current_spell = sid
	var sp := RulesDB.spell(sid)
	var name: String = e.get("name", sp.get("name", sid))
	fx.float_text(a.head_position() + Vector3(0, 0.25, 0), name, UI.MAGIC, 0.75, 0.5, 1.3)
	var tags: Array = sp.get("tags", [])
	if e.get("rider", false):
		for tid in e.get("targets", []):
			if _u(tid):
				var col := FX.style_color(str(sp.get("fx", "radiant")))
				fx.pillar(_u(tid).global_position, col, 0.5)
				fx.burst(_u(tid).chest_position(), col, 20, 2.4)
		Game.sfx("radiant" if sp.get("fx", "") == "radiant" else _style_sfx(str(sp.get("fx", "force"))))
		return
	# Los conjuros de ataque animan al resolverse su tirada
	if sp.has("attack") and not sid in ["spiritual_weapon"]:
		return
	var buff := "buff" in tags or "heal" in tags or sid in ["turn_undead", "preserve_life", "divine_spark"]
	await a.cast(buff)
	match sid:
		"sacred_flame":
			for tid in e.targets:
				if _u(tid):
					fx.pillar(_u(tid).global_position, Color(1.0, 0.85, 0.45))
			Game.sfx("radiant")
		"burning_hands":
			fx.area_flash(e.cells, Color(1.0, 0.45, 0.1))
			Game.sfx("fire")
			fx.flash_light(a.chest_position(), Color(1.0, 0.5, 0.2), 4.0, 5.0, 0.6)
		"thunderwave":
			fx.area_flash(e.cells, Color(0.7, 0.75, 1.0))
			fx.ring_wave(a.global_position, 2.2, Color(0.75, 0.8, 1.0), 0.5)
			Game.sfx("thunder")
			_shake(0.2)
		"shatter":
			fx.area_flash(e.cells, Color(0.85, 0.75, 1.0))
			Game.sfx("thunder")
			_shake(0.25)
		"sleep":
			fx.area_flash(e.cells, Color(0.6, 0.5, 1.0), 1.0)
			Game.sfx("sleep")
		"bless", "aid", "shield_of_faith", "sanctuary", "mage_armor":
			for tid in e.targets:
				if _u(tid):
					fx.sparkles(_u(tid).chest_position(), Color(1.0, 0.9, 0.55), 20)
			Game.sfx("buff")
		"cure_wounds", "healing_word", "preserve_life":
			Game.sfx("heal")
		"command", "hold_person":
			for tid in e.targets:
				if _u(tid):
					fx.ring_wave(_u(tid).global_position, 0.7, Color(0.85, 0.7, 1.0), 0.5)
			Game.sfx("radiant", -4)
		"turn_undead":
			fx.ring_wave(a.global_position, 6.0, Color(1.0, 0.9, 0.6), 0.8)
			fx.flash_light(a.chest_position(), Color(1.0, 0.9, 0.6), 4.0, 8.0, 0.8)
			Game.sfx("radiant")
		"divine_spark":
			for tid in e.targets:
				if _u(tid):
					fx.beam(a.chest_position(), _u(tid).chest_position(), Color(1.0, 0.9, 0.55), 0.4)
			Game.sfx("radiant")
		"misty_step":
			pass
		"spiritual_weapon":
			pass
		"lesser_restoration", "spare_the_dying":
			for tid in e.targets:
				if _u(tid):
					fx.sparkles(_u(tid).chest_position(), Color(0.6, 1.0, 0.7), 16)
			Game.sfx("heal", -6)
		_:
			_generic_cast_fx(e, sp)

## Efecto visual genérico para conjuros sin animación propia (según su campo "fx").
func _generic_cast_fx(e: Dictionary, sp: Dictionary) -> void:
	var style: String = str(e.get("fx", sp.get("fx", "arcane")))
	if style.is_empty():
		style = "arcane"
	if e.get("dtype", "") != "":
		style = _dtype_style(str(e.dtype))
	var col := FX.style_color(style)
	var cells: Array = e.get("cells", [])
	if not cells.is_empty():
		fx.area_flash(cells, col, 0.8)
		if style in ["thunder", "shatter"]:
			_shake(0.2)
	for tid in e.get("targets", []):
		var u := _u(tid)
		if u == null:
			continue
		if style in ["heal", "buff", "nature", "faerie", "wind"]:
			fx.sparkles(u.chest_position(), col, 18)
		elif style in ["radiant", "moon"]:
			fx.pillar(u.global_position, col, 0.6)
		else:
			fx.ring_wave(u.global_position, 0.7, col, 0.5)
	Game.sfx(_style_sfx(style), -4)

func _dtype_style(dtype: String) -> String:
	return {"fire": "fire", "cold": "frost", "lightning": "lightning", "thunder": "thunder", "acid": "acid", "poison": "poison",
		"psychic": "psychic", "radiant": "radiant", "necrotic": "necrotic", "force": "force"}.get(dtype, "arcane")

func _spell_style(sid: String) -> String:
	match sid:
		"fire_bolt", "scorching_ray":
			return "fire"
		"ray_of_frost":
			return "frost"
		"guiding_bolt":
			return "radiant"
		"shocking_grasp":
			return "force"
	return "force"

func _style_color(style: String) -> Color:
	return FX.style_color(style)

func _style_sfx(style: String) -> String:
	return {"fire": "fire", "fire_cone": "fire", "frost": "frost", "radiant": "radiant", "moon": "radiant", "force": "lightning", "lightning": "lightning",
		"thunder": "thunder", "shatter": "thunder", "necrotic": "necrotic", "heal": "heal", "buff": "buff", "nature": "buff", "faerie": "buff",
		"sleep": "sleep", "charm": "sleep", "psychic": "sleep", "curse": "necrotic", "poison": "necrotic", "acid": "necrotic"}.get(style, "missile")

func _shake(amount: float) -> void:
	var c := cam.camera
	var tw := create_tween()
	for i in 5:
		tw.tween_property(c, "h_offset", randf_range(-amount, amount), 0.03)
		tw.tween_property(c, "v_offset", randf_range(-amount, amount), 0.03)
	tw.tween_property(c, "h_offset", 0.0, 0.05)
	tw.tween_property(c, "v_offset", 0.0, 0.05)

# ================================================================== frases de los compañeros

func _bark(pid: String, kind: String, chance := 1.0) -> void:
	if not BARKS.has(pid) or randf() > chance:
		return
	if Time.get_ticks_msec() - _last_bark < 3500:
		return
	var lines: Array = BARKS[pid].get(kind, [])
	# No nombrar a compañeros que no están en el grupo
	for other in SHORT_NAMES.keys():
		if battle.get_creature(other) == null:
			lines = lines.filter(func(l: String): return not SHORT_NAMES[other] in l)
	if lines.is_empty():
		return
	var c := battle.get_creature(pid)
	if c == null or not c.is_active():
		return
	_last_bark = Time.get_ticks_msec()
	var u: UnitView = units[pid]
	var text: String = "«%s»" % lines[randi() % lines.size()]
	hud.show_bubble(text, Portraits.get_portrait(c), func() -> Vector2:
		if not is_instance_valid(u):
			return Vector2(-1000, -1000)
		return cam.screen_of(u.head_position() + Vector3(0, 0.35, 0)), 3.0)

func _bark_random(kind: String, chance := 1.0) -> void:
	var pcs := battle.creatures.filter(func(c): return c.is_pc and c.is_active())
	if pcs.is_empty():
		return
	_bark(pcs[randi() % pcs.size()].id, kind, chance)

func _bark_kill(dead_id: String) -> void:
	# Quien mató: el último que hizo daño (aproximación por estadísticas)
	var c := battle.current
	if c != null and c.is_pc:
		_bark(c.id, "kill", 0.45)

func _bark_ally_down(down_id: String) -> void:
	var others := battle.creatures.filter(func(c): return c.is_pc and c.is_active() and c.id != down_id)
	if others.is_empty():
		return
	_bark(others[randi() % others.size()].id, "ally_down", 0.8)
