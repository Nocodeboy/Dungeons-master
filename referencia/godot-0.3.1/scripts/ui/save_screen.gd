class_name SaveScreen
extends ColorRect
## Ranuras de guardado. mode = "save" (guardar en una ranura) o "load" (elegir una partida).

signal closed
signal loaded(slot: String)

var mode := "save"
var panel: PanelContainer
var list: VBoxContainer
var msg: Label

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	color = Color(0, 0, 0, 0.6)
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	theme = UI.theme()
	z_index = 60
	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	center.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(center)
	panel = UI.panel("panel", 20)
	panel.custom_minimum_size = Vector2(760, 0)
	center.add_child(panel)
	var v := UI.vbox(10)
	panel.add_child(v)
	var head := UI.hbox(10)
	head.add_child(UI.icon_rect("save" if mode == "save" else "book", 36, UI.GOLD))
	var t := UI.title("Guardar partida" if mode == "save" else "Cargar partida", 30)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(t)
	var x := UI.button("", "cross", Vector2(56, 56))
	x.pressed.connect(close)
	head.add_child(x)
	v.add_child(head)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(720, 470)
	list = UI.vbox(6)
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(list)
	v.add_child(scroll)
	msg = UI.label("", 18, UI.TEXT_DIM)
	v.add_child(msg)
	_refresh()
	UI.fade_in(self, 0.15)
	Game.sfx("open", -6)

func _refresh() -> void:
	for ch in list.get_children():
		ch.queue_free()
	var by_slot := {}
	for m in Game.list_saves():
		by_slot[str(m.slot)] = m
	for slot in Game.SLOTS:
		if mode == "save" and slot == "auto":
			continue
		var m: Dictionary = by_slot.get(slot, {})
		if mode == "load" and m.is_empty():
			continue
		list.add_child(_slot_row(slot, m))
	if list.get_child_count() == 0:
		list.add_child(UI.label("No hay partidas guardadas.", 20, UI.TEXT_DIM))

func _slot_row(slot: String, m: Dictionary) -> Control:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(0, 74)
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	var title := "Guardado automático" if slot == "auto" else "Ranura %s" % slot
	if m.is_empty():
		b.text = "%s  ·  vacía" % title
		b.add_theme_color_override("font_color", UI.TEXT_DIM)
	else:
		var cls_name: String = RulesDB.classes.get(str(m.get("class", "")), {}).get("name", "")
		var mins := int(float(m.get("playtime", 0)) / 60.0)
		b.text = "%s  ·  %s, %s de nivel %d\n%s · día %d · %s · %d min jugados" % [title, m.get("hero", "?"), cls_name.to_lower(), int(m.get("level", 1)),
			m.get("place", ""), int(m.get("day", 1)), str(m.get("time", "")).replace("T", " ").substr(0, 16), mins]
	b.icon = UI.icon("save" if mode == "save" else "book")
	b.expand_icon = false
	b.add_theme_constant_override("icon_max_width", 32)
	UI.stone_button(b, false, 10)
	b.pressed.connect(func(): _pick(slot, m))
	return b

func _pick(slot: String, m: Dictionary) -> void:
	if mode == "save":
		if Game.save_campaign(slot):
			Game.sfx("confirm", -4)
			msg.text = "Partida guardada en la ranura %s." % slot
			msg.add_theme_color_override("font_color", UI.HEAL)
		else:
			Game.sfx("error")
			msg.text = "No se ha podido guardar."
		_refresh()
	else:
		if m.is_empty():
			return
		Game.sfx("confirm", -4)
		loaded.emit(slot)
		close()

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.pressed and not panel.get_global_rect().has_point(ev.position):
		close()

func close() -> void:
	if is_queued_for_deletion():
		return
	Game.sfx("close", -8)
	closed.emit()
	queue_free()
