class_name PauseMenu
extends ColorRect
## Menú de pausa del combate. Detiene el árbol mientras está abierto.
## Emite closed("resume" | "restart" | "exit" | "save" | "load").
## context: "battle" (combate suelto), "world_battle" (combate en un nivel) o "explore".

signal closed(choice: String)

var _box: VBoxContainer
var _panel: PanelContainer
var _was_paused := false
var context := "battle"

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	color = Color(0, 0, 0, 0.6)
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	theme = UI.theme()
	_was_paused = get_tree().paused
	get_tree().paused = true
	z_index = 50
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)
	_panel = UI.panel("panel", 24)
	_panel.custom_minimum_size = Vector2(440, 0) * UI.scale_f()
	center.add_child(_panel)
	_box = UI.vbox(10)
	_panel.add_child(_box)
	_show_main()
	UI.fade_in(self, 0.15)
	Game.sfx("open", -6)

func _clear() -> void:
	for ch in _box.get_children():
		ch.queue_free()

func _show_main() -> void:
	_clear()
	var t := UI.title("Pausa", 34)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_box.add_child(t)
	_add_button("Continuar", "check", func(): _close("resume"))
	_add_button("Ajustes", "menu", func(): Modal.open(self, "Ajustes", SettingsPanel.new(true), 720))
	_add_button("Cómo se juega", "book", func():
		var r := UI.rich(HelpText.bbcode(), 19)
		r.mouse_filter = Control.MOUSE_FILTER_PASS
		Modal.open(self, "Cómo se juega", r, 820))
	match context:
		"explore":
			_add_button("Guardar partida", "save", func(): _close("save"))
			_add_button("Cargar partida", "book", func(): _close("load"))
			_add_button("Salir al menú", "exit", func(): _confirm("¿Salir al menú? Lo que no hayas guardado se perderá (hay un guardado automático al cambiar de zona y tras cada combate).", "exit"))
		"world_battle":
			_add_button("Cargar partida", "book", func(): _confirm("¿Abandonar el combate y cargar una partida guardada?", "load"))
			_add_button("Salir al menú", "exit", func(): _confirm("¿Salir al menú? Se perderá el progreso desde el último guardado.", "exit"))
		_:
			_add_button("Reiniciar el combate", "undo", func(): _confirm("¿Reiniciar el combate desde el principio?", "restart"))
			_add_button("Salir al menú", "exit", func(): _confirm("¿Salir al menú? Se perderá el progreso de este combate.", "exit"))

func _add_button(text: String, icon_name: String, cb: Callable) -> Button:
	var b := UI.button(text, icon_name, Vector2(0, 62))
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.pressed.connect(cb)
	_box.add_child(b)
	return b

func _confirm(question: String, choice: String) -> void:
	_clear()
	var l := UI.label(question, 22)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.custom_minimum_size = Vector2(400, 0) * UI.scale_f()
	_box.add_child(l)
	var h := UI.hbox(10)
	var no := UI.button("No", "cross", Vector2(0, 62))
	no.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	no.pressed.connect(_show_main)
	var yes := UI.button("Sí", "check", Vector2(0, 62))
	yes.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	yes.pressed.connect(func(): _close(choice))
	h.add_child(no)
	h.add_child(yes)
	_box.add_child(h)

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.pressed and not _panel.get_global_rect().has_point(ev.position):
		_close("resume")

func _close(choice: String) -> void:
	if is_queued_for_deletion():
		return
	get_tree().paused = _was_paused
	Game.sfx("close", -8)
	closed.emit(choice)
	queue_free()
