class_name ChoiceDialog
extends ColorRect
## Ventana con retrato opcional, texto y una lista de opciones (diálogos sencillos,
## cerraduras, trampas, descansos...). Cada opción: {text, icon, cb, enabled, hint, keep}.
## Si la opción no tiene keep=true, la ventana se cierra antes de llamar a cb.

signal closed

var panel: PanelContainer
var body: RichTextLabel
var options_box: VBoxContainer
var _portrait: TextureRect

static func open(parent: Node, title_text: String, subtitle: String, text: String, options: Array, portrait: Texture2D = null, width := 760.0) -> ChoiceDialog:
	var d := ChoiceDialog.new()
	d._build(title_text, subtitle, text, options, portrait, width)
	parent.add_child(d)
	return d

func _build(title_text: String, subtitle: String, text: String, options: Array, portrait: Texture2D, width: float) -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	color = Color(0, 0, 0, 0.5)
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	theme = UI.theme()
	z_index = 55
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)
	panel = UI.panel("panel", 20)
	panel.custom_minimum_size = Vector2(width, 0)
	center.add_child(panel)
	var v := UI.vbox(10)
	panel.add_child(v)
	var head := UI.hbox(14)
	if portrait != null:
		_portrait = TextureRect.new()
		_portrait.texture = portrait
		_portrait.custom_minimum_size = Vector2(108, 108)
		_portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		_portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		var frame := UI.panel("inset", 4)
		frame.add_child(_portrait)
		head.add_child(frame)
	var tv := UI.vbox(2)
	tv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var t := UI.title(title_text, 28)
	tv.add_child(t)
	if not subtitle.is_empty():
		tv.add_child(UI.label(subtitle, 18, UI.TEXT_DIM, UI.FONT_SC))
	head.add_child(tv)
	var x := Button.new()
	x.icon = UI.icon("cross")
	x.expand_icon = true
	x.custom_minimum_size = Vector2(52, 52)
	x.focus_mode = Control.FOCUS_NONE
	x.pressed.connect(close)
	head.add_child(x)
	v.add_child(head)
	if not text.is_empty():
		body = UI.rich(text, 20)
		body.custom_minimum_size = Vector2(width - 40, 0)
		body.fit_content = true
		v.add_child(body)
	v.add_child(UI.divider())
	options_box = UI.vbox(8)
	v.add_child(options_box)
	set_options(options)
	UI.fade_in(self, 0.15)
	Game.sfx("open", -8)

func set_text(text: String) -> void:
	if body != null:
		body.text = text

func set_options(options: Array) -> void:
	for ch in options_box.get_children():
		ch.queue_free()
	for o in options:
		var b := UI.button(str(o.get("text", "")), str(o.get("icon", "")), Vector2(0, 58))
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.disabled = not bool(o.get("enabled", true))
		if o.has("hint") and not str(o.hint).is_empty():
			b.tooltip_text = str(o.hint)
			b.text += "  ·  " + str(o.hint)
		var cb: Callable = o.get("cb", Callable())
		var keep: bool = o.get("keep", false)
		b.pressed.connect(func():
			Game.sfx("select", -8)
			if not keep:
				close()
			if cb.is_valid():
				cb.call())
		options_box.add_child(b)

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.pressed and not panel.get_global_rect().has_point(ev.position):
		close()

func close() -> void:
	if is_queued_for_deletion():
		return
	Game.sfx("close", -10)
	closed.emit()
	queue_free()
