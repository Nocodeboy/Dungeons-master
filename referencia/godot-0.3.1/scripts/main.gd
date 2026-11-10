extends Node
## Enrutador de pantallas: menú → creador → relato → exploración (con combate dentro) y
## los combates sueltos de la primera fase.

var backdrop: MenuBackdrop
var ui_layer: CanvasLayer
var current: Node
var battle_screen: BattleScreen
var explore: ExploreScreen
var _loading: Control

func _ready() -> void:
	get_tree().set_auto_accept_quit(true)
	ui_layer = CanvasLayer.new()
	ui_layer.layer = 10
	add_child(ui_layer)
	var args := OS.get_cmdline_user_args()
	# Prueba de builds exportadas: -- ... --shot ruta.png segundos
	var si := args.find("--shot")
	if si >= 0 and si + 2 < args.size():
		_auto_shot(args[si + 1], float(args[si + 2]))
	# Héroe de prueba (no se guarda): -- ... --hero clase especie
	var hi := args.find("--hero")
	if hi >= 0 and hi + 2 < args.size():
		Game.hero = _debug_hero(args[hi + 1], args[hi + 2])
		Game.party_ids = []
	# Todo el grupo en automático (pruebas visuales, no se guarda)
	if "--auto" in args:
		for pid in Game.COMPANIONS + ["hero"]:
			Game.settings.auto_companions[pid] = true
		Game.settings["tips"] = false
		Game.settings["anim_speed"] = 2.0
	# Atajos para pruebas: -- --battle e1_prado | --story e1_prado | --result e1_prado
	if args.size() >= 2 and args[0] == "--battle":
		start_battle(args[1])
	elif args.size() >= 2 and args[0] == "--story":
		show_story(args[1])
	elif args.size() >= 1 and args[0] == "--creator":
		show_creator()
		if args.size() >= 4 and current is CharacterCreator:
			(current as CharacterCreator).debug_setup(args[1], args[2], int(args[3]))
	elif args.size() >= 4 and args[0] == "--levelup":
		# -- --levelup clase especie nivel [paso]
		var hero_s := _debug_hero(args[1], args[2])
		hero_s["choices_level"] = int(args[3]) - 1
		Game.hero = hero_s
		show_level_up("e3_tumulo" if int(args[3]) >= 3 else "e2_pinar", int(args[3]))
		if args.size() >= 5 and current is CharacterCreator:
			(current as CharacterCreator).call_deferred("_show_step", int(args[4]))
	elif args.size() >= 1 and args[0] == "--party":
		Game.hero = _debug_hero("wizard", "tiefling")
		show_party()
	elif args.size() >= 1 and args[0] == "--zones":
		_debug_zones()
	elif args.size() >= 2 and args[0] == "--explore":
		# -- --explore nivel [punto] [clase especie]: partida de prueba (no se guarda en ranuras)
		var cls := args[3] if args.size() >= 5 else "fighter"
		var spc := args[4] if args.size() >= 5 else "human"
		Game.hero = _debug_hero(cls, spc)
		var lvl0 := int(OS.get_environment("MG_LEVEL")) if not OS.get_environment("MG_LEVEL").is_empty() else 1
		Game.hero["choices_level"] = lvl0
		Game.campaign = Campaign.new_game(Game.hero, Game.default_companions(cls))
		for f in OS.get_environment("MG_FLAGS").split(",", false):
			Game.campaign.flags[f] = true
		var lvl := int(OS.get_environment("MG_LEVEL")) if not OS.get_environment("MG_LEVEL").is_empty() else 1
		if lvl > 1:
			Game.campaign.level_up_to(lvl)
		start_explore(args[1], args[2] if args.size() >= 3 else "default")
	elif args.size() >= 2 and args[0] == "--load":
		load_slot(args[1])
	elif args.size() >= 2 and args[0] == "--result":
		_show_result_test(args[1], args.size() < 3 or args[2] != "lose")
	else:
		show_menu()

## Solo para pruebas: todas las zonas de conjuro sobre el prado.
func _debug_zones() -> void:
	var battle := BattleSetup.build("e1_prado", 3)
	var world := BattleWorld.new()
	add_child(world)
	world.build(battle.map, "dusk", 11)
	var kinds := [["web", Color.html("#e8e4dc")], ["moonbeam", Color.html("#dfe8ff")], ["spike", Color.html("#6b5a2e")],
		["entangle", Color.html("#5f8f3a")], ["fog", Color.html("#c8d0d8")], ["darkness", Color.html("#120d1a")],
		["grease", Color.html("#8a7a40")]]
	var i := 0
	for k in kinds:
		var base := Vector2i(1 + (i % 4) * 6, 1 + int(i / 4) * 9)
		var cells: Array = BattleMap.within(base + Vector2i(1, 1), 1)
		world.show_zone(100 + i, k[0], cells, k[1])
		var l := Label3D.new()
		l.text = k[0]
		l.font_size = 64
		l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		l.position = BattleWorld.cell_center(base + Vector2i(1, 1)) + Vector3(0, 2.2, 0)
		world.add_child(l)
		i += 1
	var cam := Camera3D.new()
	var c := world.board_center()
	cam.fov = 50
	add_child(cam)
	cam.look_at_from_position(c + Vector3(0, 15, 12), c)
	cam.current = true

func _debug_hero(cls: String, sp: String) -> Dictionary:
	var cc := CharacterCreator.new()
	cc.sheet = {"class": cls, "species": "human", "ability_method": "standard", "pronoun": "f", "visual": {}}
	cc._set_class(cls, true)
	cc._set_species(sp)
	cc.sheet["name"] = CharacterSheet.random_name(sp, "f")
	cc._refill()
	var h := cc.result_sheet()
	cc.free()
	h["choices_level"] = 3
	return h

func _notification(what: int) -> void:
	if what == NOTIFICATION_WM_GO_BACK_REQUEST:
		_on_back()
	elif what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_WM_CLOSE_REQUEST:
		Game.save_game()
		if explore != null and is_instance_valid(explore) and not explore.in_battle and Game.campaign != null:
			Game.save_campaign("auto")

## Botón «atrás» de Android.
func _on_back() -> void:
	var overlays := get_tree().root.find_children("*", "ColorRect", true, false)
	overlays.reverse()
	for n in overlays:
		if n is Modal and not n.is_queued_for_deletion():
			(n as Modal).close()
			return
	for n in overlays:
		if n is PauseMenu and not n.is_queued_for_deletion():
			(n as PauseMenu)._close("resume")
			return
	if battle_screen != null and is_instance_valid(battle_screen) and current == battle_screen:
		battle_screen.open_menu()
		return
	if explore != null and is_instance_valid(explore) and current == explore:
		for n in get_tree().root.find_children("*", "Control", true, false):
			if (n is ChoiceDialog or n is LootWindow or n is SaveScreen) and not n.is_queued_for_deletion():
				n.close()
				return
			if (n is InventoryScreen or n is ShopScreen) and not n.is_queued_for_deletion():
				n.close()
				return
		if explore.battle_screen != null and is_instance_valid(explore.battle_screen):
			explore.battle_screen.open_menu()
		else:
			explore.open_menu()
		return
	if current is MainMenu:
		get_tree().quit()
		return
	show_menu()

func _clear() -> void:
	if current != null and is_instance_valid(current):
		current.queue_free()
	current = null
	for ch in ui_layer.get_children():
		ch.queue_free()
	if battle_screen != null and is_instance_valid(battle_screen):
		battle_screen.queue_free()
	battle_screen = null
	if explore != null and is_instance_valid(explore):
		explore.queue_free()
	explore = null
	get_tree().paused = false
	Engine.time_scale = 1.0

func _ensure_backdrop(on: bool) -> void:
	if on and (backdrop == null or not is_instance_valid(backdrop)):
		backdrop = MenuBackdrop.new()
		add_child(backdrop)
		move_child(backdrop, 0)
	elif not on and backdrop != null and is_instance_valid(backdrop):
		backdrop.queue_free()
		backdrop = null

# ================================================================== pantallas

func show_menu(music := true) -> void:
	UI.reset_theme()
	_clear()
	_ensure_backdrop(true)
	if music:
		Game.play_music("menu")
	var m := MainMenu.new()
	m.play.connect(go_encounter)
	m.new_game.connect(func():
		Game.new_game()
		show_creator())
	m.continue_game.connect(_continue_latest)
	m.load_slot.connect(load_slot)
	m.rebuild_requested.connect(show_menu.bind(false))
	ui_layer.add_child(m)
	current = m

func show_story(enc_id: String) -> void:
	_clear()
	_ensure_backdrop(true)
	Game.play_music("relato")
	var enc: Dictionary = RulesDB.encounters.get(enc_id, {})
	var s := StoryScreen.new()
	var intro: Array = enc.get("intro", []).map(func(t): return Game.hero_text(t))
	s.setup(enc.get("name", ""), enc.get("place", ""), intro, "¡Al combate!")
	s.done.connect(start_battle.bind(enc_id))
	ui_layer.add_child(s)
	current = s

func show_creator() -> void:
	_clear()
	_ensure_backdrop(false)
	Game.play_music("relato")
	var cc := CharacterCreator.new()
	cc.cancelled.connect(show_menu)
	cc.finished.connect(_on_hero_created)
	ui_layer.add_child(cc)
	current = cc

func _on_hero_created(sheet: Dictionary) -> void:
	Game.set_hero(sheet)
	show_party()

func show_party() -> void:
	_clear()
	_ensure_backdrop(false)
	var ps := PartyScreen.new()
	ps.back.connect(show_creator)
	ps.done.connect(func(ids: Array):
		Game.set_party(ids)
		_begin_campaign(ids))
	ui_layer.add_child(ps)
	current = ps

## Camino hacia un combate suelto: con el último héroe (o los cuatro compañeros) y
## subiendo de nivel si toca.
func go_encounter(enc_id: String) -> void:
	if not Game.has_hero():
		show_story(enc_id)
		return
	var lvl: int = int(RulesDB.encounters.get(enc_id, {}).get("level", 1))
	if lvl > Game.hero_level():
		# De nivel en nivel, para no saltarse elecciones (p. ej. de 1 a 3)
		show_level_up(enc_id, Game.hero_level() + 1)
		return
	show_story(enc_id)

func show_level_up(enc_id: String, lvl: int) -> void:
	_clear()
	_ensure_backdrop(false)
	Game.play_music("relato")
	var cc := CharacterCreator.new()
	cc.setup_level_up(Game.hero, lvl)
	cc.cancelled.connect(show_menu)
	cc.finished.connect(func(sheet: Dictionary):
		Game.set_hero(sheet)
		go_encounter(enc_id))
	ui_layer.add_child(cc)
	current = cc

func start_battle(enc_id: String) -> void:
	_clear()
	Game.current_encounter = enc_id
	_show_loading()
	await get_tree().process_frame
	await get_tree().process_frame
	_ensure_backdrop(false)
	await get_tree().process_frame
	var b := BattleScreen.new()
	add_child(b)
	battle_screen = b
	current = b
	b.finished.connect(_on_battle_finished)
	b.start_encounter(enc_id)   # se suspende al generar los retratos
	await get_tree().process_frame
	await get_tree().process_frame
	_hide_loading()

func _show_loading() -> void:
	_loading = ColorRect.new()
	(_loading as ColorRect).color = Color(0.03, 0.025, 0.02, 1.0)
	_loading.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_loading.mouse_filter = Control.MOUSE_FILTER_STOP
	var l := UI.title("Cargando…", 30)
	l.set_anchors_preset(Control.PRESET_CENTER)
	l.grow_horizontal = Control.GROW_DIRECTION_BOTH
	l.grow_vertical = Control.GROW_DIRECTION_BOTH
	_loading.add_child(l)
	ui_layer.add_child(_loading)

func _hide_loading() -> void:
	if _loading == null or not is_instance_valid(_loading):
		return
	var tw := _loading.create_tween()
	tw.tween_property(_loading, "modulate:a", 0.0, 0.5)
	tw.tween_callback(_loading.queue_free)
	_loading = null

func _on_battle_finished(result: Dictionary) -> void:
	var enc_id: String = result.get("encounter", "")
	if result.get("restart", false):
		start_battle(enc_id)
		return
	if result.get("exit", false):
		show_menu()
		return
	if result.get("won", false):
		result["prev_best"] = int(Game.progress.best_rounds.get(enc_id, 0))
		Game.mark_completed(enc_id, int(result.get("rounds", 0)))
	_show_result(result)

# ================================================================== campaña y exploración

## Nueva campaña: héroe y compañeros elegidos, prólogo y llegada a Merrowick.
func _begin_campaign(ids: Array) -> void:
	Game.campaign = Campaign.new_game(Game.hero, ids)
	Game.hero = Game.campaign.hero()
	_clear()
	_ensure_backdrop(true)
	Game.play_music("relato")
	var s := StoryScreen.new()
	var intro: Array = [
		"Las Marcas de Vharen: colinas, pinares viejos y ríos fríos al norte del reino de Caeldor. Hace mil años los Durn tallaron aquí siete toros de piedra mirando a las colinas. Nadie recuerda por qué.",
		"Tú llevas desde que naciste una veta de granito en la piel, la Marca. Nunca te ha dolido. Hasta esta semana: desde que tomaste el camino del norte, arde como una brasa, y cuanto más te acercas a Merrowick, más.",
		"Te acompañan quienes has ido encontrando por el camino. Al caer la tarde, por fin, aparecen los tejados de la aldea."]
	s.setup("Prólogo", "Camino de Merrowick, al caer la tarde", intro.map(func(t): return Game.hero_text(t)), "Llegar a Merrowick")
	s.done.connect(func(): start_explore("merrowick", "arrival"))
	ui_layer.add_child(s)
	current = s

func _continue_latest() -> void:
	var saves := Game.list_saves()
	if saves.is_empty():
		show_creator()
		return
	load_slot(str(saves[0].slot))

func load_slot(slot: String) -> void:
	if not Game.load_campaign(slot):
		show_menu()
		return
	var loc: Dictionary = Game.campaign.location
	start_explore(str(loc.get("level", "merrowick")), "saved")

func start_explore(level_id: String, spawn: String) -> void:
	_clear()
	_show_loading()
	await get_tree().process_frame
	await get_tree().process_frame
	_ensure_backdrop(false)
	var ex := ExploreScreen.new()
	add_child(ex)
	explore = ex
	current = ex
	ex.leave.connect(_on_explore_leave)
	await ex.start(level_id, spawn)
	_hide_loading()

func _on_explore_leave(what: String, data: Dictionary) -> void:
	match what:
		"travel":
			var ts := TravelScreen.new()
			ts.setup(str(data.get("from", "")))
			ui_layer.add_child(ts)
			explore.busy = true
			ts.cancelled.connect(func():
				ts.queue_free()
				if explore:
					explore.busy = false)
			ts.travel.connect(func(lv: String, sp: String, hours: int):
				Game.campaign.pass_hours(hours)
				Game.campaign.playtime += 0.0
				start_explore(lv, sp))
		"level":
			start_explore(str(data.level), str(data.get("spawn", "default")))
		"menu":
			show_menu()
		"load":
			var ss := SaveScreen.new()
			ss.mode = "load"
			var chosen := [false]
			ss.loaded.connect(func(slot):
				chosen[0] = true
				load_slot(slot))
			ss.closed.connect(func():
				if not chosen[0] and explore != null and explore.in_battle:
					_continue_latest(), CONNECT_DEFERRED)
			ui_layer.add_child(ss)
		"game_over":
			_game_over(str(data.get("text", "")))
		"story":
			_clear()
			_ensure_backdrop(true)
			Game.play_music("relato")
			var st := StoryScreen.new()
			var lines: Array = data.get("text", [])
			st.setup(str(data.get("title", "")), "", lines.map(func(t): return Game.hero_text(str(t))), "Continuar")
			var back_level: String = data.get("level", "merrowick")
			st.done.connect(func():
				Game.save_campaign("auto")
				start_explore(back_level, "saved"))
			ui_layer.add_child(st)
			current = st

func _game_over(text := "") -> void:
	Game.play_music("derrota")
	var v := UI.vbox(12)
	var r := UI.rich(text if not text.is_empty() else "Vuestro viaje termina aquí… a menos que el destino os conceda otra oportunidad.", 21)
	v.add_child(r)
	var b1 := UI.button("Cargar la última partida", "book", Vector2(0, 60))
	v.add_child(b1)
	var b2 := UI.button("Volver al menú", "exit", Vector2(0, 60))
	v.add_child(b2)
	var m := Modal.open(ui_layer, "Habéis caído", v, 620, "")
	b1.pressed.connect(func():
		m.close()
		_continue_latest())
	b2.pressed.connect(func():
		m.close()
		show_menu())

func _show_result(result: Dictionary) -> void:
	if battle_screen != null and is_instance_valid(battle_screen):
		battle_screen.hud.visible = false
	var r := ResultScreen.new()
	r.setup(result)
	r.chosen.connect(_on_result_choice.bind(result))
	ui_layer.add_child(r)

func _on_result_choice(what: String, result: Dictionary) -> void:
	var enc_id: String = result.get("encounter", "")
	match what:
		"retry":
			start_battle(enc_id)
		"next":
			var idx: int = Game.ENCOUNTER_ORDER.find(enc_id)
			if idx >= 0 and idx + 1 < Game.ENCOUNTER_ORDER.size():
				go_encounter(Game.ENCOUNTER_ORDER[idx + 1])
			else:
				show_menu()
		"credits":
			show_menu()
			if current is MainMenu:
				(current as MainMenu).call_deferred("_open_credits")
		_:
			show_menu()

## Solo para pruebas de la pantalla de resultados.
func _show_result_test(enc_id: String, won: bool) -> void:
	_ensure_backdrop(true)
	var stats := {}
	for pid in ["brenna", "pip", "ilyra", "odvar"]:
		stats[pid] = {"name": Factory.make_pc(pid, 1).name, "damage_dealt": randi() % 40, "healed": 12 if pid == "ilyra" else 0,
			"kills": randi() % 3, "crits": randi() % 2, "downs": 1 if pid == "odvar" else 0, "dead": false}
	_show_result({"won": won, "rounds": 6, "encounter": enc_id, "stats": stats, "prev_best": 7})

func _auto_shot(path: String, secs: float) -> void:
	await get_tree().create_timer(secs, true, false, true).timeout
	get_viewport().get_texture().get_image().save_png(path)
	print("captura: ", path)
	get_tree().quit()
