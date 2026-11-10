class_name Modal
extends ColorRect
## Ventana modal con fondo oscurecido, título, contenido desplazable y botón de cierre.

signal closed

var panel: PanelContainer
var scroll: ScrollContainer

static func open(parent: Node, title_text: String, content: Control, width := 780.0, close_text := "Cerrar") -> Modal:
	var m := Modal.new()
	m._build(title_text, content, width, close_text)
	parent.add_child(m)
	return m

func _build(title_text: String, content: Control, width: float, close_text: String) -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	color = Color(0, 0, 0, 0.62)
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	theme = UI.theme()
	z_index = 60
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)
	panel = UI.panel("panel", 20)
	center.add_child(panel)
	var v := UI.vbox(12)
	panel.add_child(v)
	var head := UI.hbox(10)
	var t := UI.title(title_text, 30)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(t)
	var x := Button.new()
	x.icon = UI.icon("cross")
	x.expand_icon = true
	x.custom_minimum_size = Vector2(56, 56)
	x.focus_mode = Control.FOCUS_NONE
	x.pressed.connect(close)
	head.add_child(x)
	v.add_child(head)
	scroll = ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(width, 0)
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(content)
	v.add_child(scroll)
	if not close_text.is_empty():
		var b := UI.button(close_text, "check", Vector2(0, 58))
		b.pressed.connect(close)
		v.add_child(b)
	UI.fade_in(self, 0.15)
	Game.sfx("open", -6)

func _ready() -> void:
	_fit()
	get_viewport().size_changed.connect(_fit)

func _fit() -> void:
	var vs := get_viewport_rect().size
	var w: float = min(scroll.custom_minimum_size.x, vs.x - 80)
	scroll.custom_minimum_size = Vector2(w, vs.y - 250 * UI.scale_f())

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.pressed and not panel.get_global_rect().has_point(ev.position):
		close()

func close() -> void:
	if is_queued_for_deletion():
		return
	Game.sfx("close", -8)
	closed.emit()
	queue_free()
