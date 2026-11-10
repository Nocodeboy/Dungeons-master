class_name StoryScreen
extends Control
## Pantalla de relato: título, lugar y párrafos que aparecen uno a uno.
## Toca para mostrar el siguiente párrafo; al terminar aparece el botón para seguir.

signal done

var _title := ""
var _place := ""
var _paragraphs: Array = []
var _button_text := "Continuar"
var _shown := 0
var _labels: Array = []
var _next_btn: Button
var _skip_btn: Button
var _hint: Label
var _scroll: ScrollContainer
var _finished := false

func setup(title_text: String, place: String, paragraphs: Array, button_text := "Continuar") -> void:
	_title = title_text
	_place = place
	_paragraphs = paragraphs
	_button_text = button_text

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	# Velo oscuro con viñeta
	var veil := ColorRect.new()
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	veil.color = Color(0.03, 0.025, 0.02, 0.84)
	veil.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(veil)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for side in ["left", "right"]:
		margin.add_theme_constant_override("margin_" + side, 60)
	margin.add_theme_constant_override("margin_top", 36)
	margin.add_theme_constant_override("margin_bottom", 26)
	add_child(margin)
	var col := UI.vbox(10)
	col.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.add_child(col)
	var t := UI.title(_title, 46)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	col.add_child(t)
	if not _place.is_empty():
		var p := UI.label(_place, 21, UI.TEXT_DIM, UI.FONT_SC)
		p.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		col.add_child(p)
	col.add_child(_ornament())
	_scroll = ScrollContainer.new()
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_scroll.mouse_filter = Control.MOUSE_FILTER_PASS
	col.add_child(_scroll)
	var center := CenterContainer.new()
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_scroll.add_child(center)
	var text_col := UI.vbox(18)
	text_col.custom_minimum_size = Vector2(920, 0)
	text_col.mouse_filter = Control.MOUSE_FILTER_IGNORE
	center.add_child(text_col)
	for para in _paragraphs:
		var r := UI.rich(_style(para), 25)
		r.custom_minimum_size = Vector2(920, 0)
		r.modulate.a = 0.0
		r.visible = false
		text_col.add_child(r)
		_labels.append(r)
	var bottom := UI.hbox(12)
	bottom.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_skip_btn = UI.button("Saltar", "dash", Vector2(170, 58))
	_skip_btn.pressed.connect(_finish_now)
	bottom.add_child(_skip_btn)
	_hint = UI.label("Toca para continuar", 17, UI.TEXT_DIM)
	_hint.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	bottom.add_child(_hint)
	_next_btn = UI.button(_button_text, "attack", Vector2(260, 64))
	_next_btn.modulate.a = 0.0
	_next_btn.disabled = true
	_next_btn.pressed.connect(func():
		Game.sfx("confirm", -4)
		done.emit())
	bottom.add_child(_next_btn)
	col.add_child(bottom)
	UI.fade_in(self, 0.4)
	Game.sfx("book", -6)
	_reveal_next()

## Diálogos en cursiva y color suave.
func _style(text: String) -> String:
	var out := ""
	var open := false
	for ch in text:
		if ch == "«":
			out += "[color=#e8d3a8][i]«"
			open = true
		elif ch == "»" and open:
			out += "»[/i][/color]"
			open = false
		else:
			out += ch
	if open:
		out += "[/i][/color]"
	return out

func _ornament() -> Control:
	var h := UI.hbox(10)
	h.alignment = BoxContainer.ALIGNMENT_CENTER
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	for i in 3:
		var line := ColorRect.new()
		line.color = Color(UI.GOLD_DIM, 0.7)
		line.custom_minimum_size = Vector2(120 if i != 1 else 10, 2 if i != 1 else 10)
		line.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		if i == 1:
			line.rotation = PI / 4
			line.pivot_offset = Vector2(5, 5)
			line.color = UI.GOLD
		h.add_child(line)
	return h

func _reveal_next() -> void:
	if _shown >= _labels.size():
		_finish_now()
		return
	var r: RichTextLabel = _labels[_shown]
	r.visible = true
	var tw := create_tween()
	tw.tween_property(r, "modulate:a", 1.0, 0.6)
	_shown += 1
	Game.sfx("page", -10)
	await get_tree().process_frame
	_scroll.ensure_control_visible(r)
	if _shown >= _labels.size():
		_finish_now()

func _finish_now() -> void:
	for r in _labels:
		if not r.visible:
			r.visible = true
			create_tween().tween_property(r, "modulate:a", 1.0, 0.4)
	_shown = _labels.size()
	if _finished:
		return
	_finished = true
	_skip_btn.visible = false
	_hint.text = ""
	_next_btn.disabled = false
	create_tween().tween_property(_next_btn, "modulate:a", 1.0, 0.5)

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT:
		if not _finished:
			_reveal_next()
