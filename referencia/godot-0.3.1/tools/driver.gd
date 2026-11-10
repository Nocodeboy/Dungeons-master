extends SceneTree
## Conduce el juego para pruebas visuales: carga la escena principal y ejecuta pasos.
## STEPS="wait:2;shot:menu;tap:640,360;drag:100,100,300,100;key:escape" \
##   xvfb-run -a godot --path . --rendering-driver opengl3 -s tools/driver.gd -- [args de main]
## Salida en OUT_DIR (por defecto /tmp/shots).

var steps: Array = []
var out_dir := "/tmp/shots"
var _i := 0
var _wait_until := 0
var _started := false
var _frames := 0

func _initialize() -> void:
	var s := OS.get_environment("STEPS")
	if not s.is_empty():
		steps = s.split(";", false)
	var od := OS.get_environment("OUT_DIR")
	if not od.is_empty():
		out_dir = od
	DirAccess.make_dir_recursive_absolute(out_dir)
	change_scene_to_file("res://scenes/main.tscn")

func _process(_delta: float) -> bool:
	_frames += 1
	if _frames < 3:
		return false
	if Time.get_ticks_msec() < _wait_until:
		return false
	if _i >= steps.size():
		print("DRIVER: fin")
		quit()
		return true
	var st: String = steps[_i]
	_i += 1
	var parts := st.split(":", true, 1)
	var cmd := parts[0]
	var arg := parts[1] if parts.size() > 1 else ""
	match cmd:
		"wait":
			_wait_until = Time.get_ticks_msec() + int(float(arg) * 1000.0)
		"shot":
			var img := root.get_viewport().get_texture().get_image()
			var p := "%s/%s.png" % [out_dir, arg]
			img.save_png(p)
			print("DRIVER: captura ", p)
		"tap":
			var xy := arg.split(",")
			_tap(Vector2(float(xy[0]), float(xy[1])))
			_wait_until = Time.get_ticks_msec() + 150
		"drag":
			var v := arg.split(",")
			_drag(Vector2(float(v[0]), float(v[1])), Vector2(float(v[2]), float(v[3])))
		"key":
			var ev := InputEventKey.new()
			ev.keycode = OS.find_keycode_from_string(arg)
			ev.pressed = true
			Input.parse_input_event(ev)
			var ev2 := ev.duplicate()
			ev2.pressed = false
			Input.parse_input_event(ev2)
		"tapcell":
			var c := arg.split(",")
			var bs = _battle()
			if bs:
				var sp: Vector2 = bs.cam.screen_of(Vector3(int(c[0]) + 0.5, 0.0, int(c[1]) + 0.5))
				print("DRIVER: tapcell ", arg, " -> ", sp)
				_tap(sp)
				_wait_until = Time.get_ticks_msec() + 150
		"tapunit":
			var bs2 = _battle()
			if bs2 and bs2.units.has(arg):
				var sp2: Vector2 = bs2.cam.screen_of(bs2.units[arg].chest_position())
				print("DRIVER: tapunit ", arg, " -> ", sp2)
				_tap(sp2)
				_wait_until = Time.get_ticks_msec() + 150
		"state":
			var bs3 = _battle()
			if bs3:
				var b = bs3.battle
				var cur: String = b.current.id if b.current else "-"
				print("DRIVER: ronda ", b.round_num, " turno ", cur, " modo ", bs3.mode, " fin ", b.over)
				for cr in b.creatures:
					print("   ", cr.id, " ", cr.cell, " pg ", cr.hp, "/", cr.max_hp, " ", "MUERTO" if cr.dead else "")
		"waitturn":
			# Espera (hasta 120 s) a que le toque a un PJ controlado por el jugador
			var bs4 = _battle()
			var ready_turn: bool = bs4 != null and bs4.battle != null and bs4.mode == "idle" and bs4.battle.current != null and bs4.battle.current.team == 0
			if not ready_turn and not (bs4 != null and bs4.battle != null and bs4.battle.over):
				_i -= 1
				if not has_meta("wt"):
					set_meta("wt", Time.get_ticks_msec())
				if Time.get_ticks_msec() - int(get_meta("wt")) > 120000:
					print("DRIVER: waitturn agotado")
					_i += 1
					remove_meta("wt")
				else:
					_wait_until = Time.get_ticks_msec() + 300
			else:
				if has_meta("wt"):
					remove_meta("wt")
		"auto":
			var g := root.get_node("Game")
			for pid in ["brenna", "pip", "ilyra", "odvar"]:
				g.settings.auto_companions[pid] = true
		"setting":
			var kv := arg.split("=")
			var g2 := root.get_node("Game")
			var val = kv[1]
			if val.is_valid_float():
				val = float(val)
			elif val in ["true", "false"]:
				val = val == "true"
			g2.settings[kv[0]] = val
		"bcall":
			var bs5 = _battle()
			if bs5 and bs5.has_method(arg):
				bs5.call(arg)
		"waitend":
			# Espera (hasta 600 s) a que termine el combate
			var bs6 = _battle()
			if not (bs6 != null and bs6.battle != null and bs6.battle.over):
				_i -= 1
				if not has_meta("we"):
					set_meta("we", Time.get_ticks_msec())
				if Time.get_ticks_msec() - int(get_meta("we")) > 600000:
					print("DRIVER: waitend agotado")
					_i += 1
				else:
					_wait_until = Time.get_ticks_msec() + 1000
		"button":
			# Pulsa el primer botón visible cuyo texto empiece por arg
			var found := false
			for b in root.find_children("*", "Button", true, false):
				if b.is_visible_in_tree() and not b.disabled and b.text.begins_with(arg):
					print("DRIVER: botón ", b.text)
					_tap(b.get_global_rect().get_center())
					found = true
					break
			if not found:
				print("DRIVER: botón no encontrado: ", arg)
			_wait_until = Time.get_ticks_msec() + 200
		"buttons":
			for b in root.find_children("*", "Button", true, false):
				if b.is_visible_in_tree():
					print("   botón: '", b.text, "' ", b.get_global_rect(), " desactivado" if b.disabled else "")
		"waitfor":
			# Espera el turno de un PJ concreto; termina los turnos de los demás PJ. waitfor:odvar o waitfor:odvar,2 (ronda mínima)
			var parts2 := arg.split(",")
			var who := parts2[0]
			var min_round := int(parts2[1]) if parts2.size() > 1 else 0
			var bs7 = _battle()
			var ok7 := false
			if bs7 != null and bs7.battle != null and bs7.mode == "idle" and bs7.battle.current != null and bs7.battle.current.team == 0:
				if bs7.battle.current.id == who and bs7.battle.round_num >= min_round:
					ok7 = true
				else:
					bs7._on_end_turn()
			if bs7 != null and bs7.battle != null and bs7.battle.over:
				ok7 = true
			if not ok7:
				_i -= 1
				_wait_until = Time.get_ticks_msec() + 400
		"row":
			# Pulsa la fila (botón) que contiene una etiqueta que empieza por arg
			var hit := false
			for b in root.find_children("*", "Button", true, false):
				if not b.is_visible_in_tree():
					continue
				for l in b.find_children("*", "Label", true, false):
					if l.text.begins_with(arg):
						print("DRIVER: fila ", l.text, " desactivada" if b.disabled else "")
						_tap(b.get_global_rect().get_center())
						hit = true
						break
				if hit:
					break
			if not hit:
				print("DRIVER: fila no encontrada: ", arg)
			_wait_until = Time.get_ticks_msec() + 200
		"tapnearest":
			# Toca la casilla del enemigo vivo más cercano al personaje activo
			var bs8 = _battle()
			if bs8:
				var cur8 = bs8.battle.current
				var best8 = null
				var bd := 999
				for cr in bs8.battle.creatures:
					if cr.team != cur8.team and not cr.dead:
						var d8: int = max(abs(cr.cell.x - cur8.cell.x), abs(cr.cell.y - cur8.cell.y))
						if d8 < bd:
							bd = d8
							best8 = cr
				if best8:
					var sp8: Vector2 = bs8.cam.screen_of(Vector3(best8.cell.x + 0.5, 0.0, best8.cell.y + 0.5))
					print("DRIVER: tapnearest ", best8.id, " ", best8.cell, " -> ", sp8)
					_tap(sp8)
					_wait_until = Time.get_ticks_msec() + 150
		"back":
			root.propagate_notification(Node.NOTIFICATION_WM_GO_BACK_REQUEST)
		"eval":
			# Llama a un método del nodo principal: eval:metodo
			var main := current_scene
			if main and main.has_method(arg):
				main.call(arg)
		"print":
			_print_tree(root, 0, int(arg) if arg != "" else 4)
		"quit":
			quit()
			return true
	return false

func _battle():
	var main := current_scene
	if main == null:
		return null
	var bs = main.get("battle_screen")
	if bs == null or not is_instance_valid(bs):
		return null
	return bs

func _tap(p: Vector2) -> void:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.position = p
	ev.global_position = p
	ev.pressed = true
	ev.button_mask = MOUSE_BUTTON_MASK_LEFT
	Input.parse_input_event(ev)
	var ev2 := InputEventMouseButton.new()
	ev2.button_index = MOUSE_BUTTON_LEFT
	ev2.position = p
	ev2.global_position = p
	ev2.pressed = false
	Input.parse_input_event(ev2)

func _drag(a: Vector2, b: Vector2) -> void:
	var ev := InputEventMouseButton.new()
	ev.button_index = MOUSE_BUTTON_LEFT
	ev.position = a
	ev.pressed = true
	ev.button_mask = MOUSE_BUTTON_MASK_LEFT
	Input.parse_input_event(ev)
	for k in range(1, 11):
		var m := InputEventMouseMotion.new()
		m.position = a.lerp(b, k / 10.0)
		m.relative = (b - a) / 10.0
		m.button_mask = MOUSE_BUTTON_MASK_LEFT
		Input.parse_input_event(m)
	var ev2 := InputEventMouseButton.new()
	ev2.button_index = MOUSE_BUTTON_LEFT
	ev2.position = b
	ev2.pressed = false
	Input.parse_input_event(ev2)

func _print_tree(n: Node, depth: int, max_depth: int) -> void:
	if depth > max_depth:
		return
	var extra := ""
	if n is Control:
		extra = " rect=%s vis=%s" % [(n as Control).get_global_rect(), (n as Control).is_visible_in_tree()]
	print("  ".repeat(depth), n.name, " <", n.get_class(), ">", extra)
	for c in n.get_children():
		_print_tree(c, depth + 1, max_depth)
