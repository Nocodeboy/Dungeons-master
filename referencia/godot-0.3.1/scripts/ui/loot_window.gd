class_name LootWindow
extends ColorRect
## Contenido de un cofre, un escondite o los restos de un combate.
## entries: [{id, n, unid}] ("gold" para el oro). take: Callable(idx) -> String (quién lo coge).

signal closed

var entries: Array = []
var take: Callable
var list: VBoxContainer
var panel: PanelContainer
var msg: Label

static func open(parent: Node, title_text: String, p_entries: Array, p_take: Callable) -> LootWindow:
	var w := LootWindow.new()
	w.entries = p_entries
	w.take = p_take
	w._build(title_text)
	parent.add_child(w)
	return w

func _build(title_text: String) -> void:
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
	panel.custom_minimum_size = Vector2(680, 0)
	center.add_child(panel)
	var v := UI.vbox(10)
	panel.add_child(v)
	var head := UI.hbox(10)
	head.add_child(UI.icon_rect("chest", 40, UI.GOLD))
	var t := UI.title(title_text, 28)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(t)
	var x := Button.new()
	x.icon = UI.icon("cross")
	x.expand_icon = true
	x.custom_minimum_size = Vector2(52, 52)
	x.focus_mode = Control.FOCUS_NONE
	x.pressed.connect(close)
	head.add_child(x)
	v.add_child(head)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(640, min(420, 70 * max(1, entries.size()) + 10))
	list = UI.vbox(6)
	list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(list)
	v.add_child(scroll)
	msg = UI.label("", 18, UI.TEXT_DIM)
	v.add_child(msg)
	var all := UI.button("Cogerlo todo", "check", Vector2(0, 60))
	all.pressed.connect(_take_all)
	v.add_child(all)
	_refresh()
	UI.fade_in(self, 0.15)
	Game.sfx("open", -6)

func _refresh() -> void:
	for ch in list.get_children():
		ch.queue_free()
	if entries.is_empty():
		list.add_child(UI.label("No queda nada.", 20, UI.TEXT_DIM))
		return
	for i in entries.size():
		var e: Dictionary = entries[i]
		var row := PanelContainer.new()
		row.add_theme_stylebox_override("panel", UI.stone("inset", 8))
		var h := UI.hbox(10)
		row.add_child(h)
		var id: String = e.id
		var unid: bool = e.get("unid", false)
		if id == "gold":
			h.add_child(UI.icon_rect("coins", 34, UI.GOLD))
			var gl := UI.label("%d piezas de oro" % int(e.n), 21, UI.GOLD, UI.FONT_BOLD)
			gl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			h.add_child(gl)
		else:
			h.add_child(UI.icon_rect(Items.icon_of(id), 34, Items.color_of(id, unid)))
			var tv := UI.vbox(0)
			tv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			var nm := Items.name_of(id, unid) + (" ×%d" % int(e.n) if int(e.n) > 1 else "")
			tv.add_child(UI.label(nm, 20, Items.color_of(id, unid), UI.FONT_BOLD))
			var sub := Items.describe(id, unid).split("\n")[0]
			var sl := UI.label(sub.replace("[i]", "").replace("[/i]", "").replace("[color=#c8a8ff]", "").replace("[/color]", ""), 15, UI.TEXT_DIM)
			sl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			tv.add_child(sl)
			h.add_child(tv)
		var b := UI.button("Coger", "", Vector2(110, 52))
		var idx := i
		b.pressed.connect(func(): _take_one(idx))
		h.add_child(b)
		list.add_child(row)

func _take_one(idx: int) -> void:
	if idx < 0 or idx >= entries.size():
		return
	var e: Dictionary = entries[idx]
	var who: String = take.call(idx)
	Game.sfx("coins" if e.id == "gold" else "page", -6)
	if e.id != "gold" and not who.is_empty():
		msg.text = "%s → %s" % [Items.name_of(e.id, e.get("unid", false)), who]
	_refresh()
	if entries.is_empty():
		var tw := create_tween()
		tw.tween_interval(0.35)
		tw.tween_callback(close)

func _take_all() -> void:
	while not entries.is_empty():
		take.call(0)
	Game.sfx("coins", -4)
	close()

func _gui_input(ev: InputEvent) -> void:
	if ev is InputEventMouseButton and ev.pressed and not panel.get_global_rect().has_point(ev.position):
		close()

func close() -> void:
	if is_queued_for_deletion():
		return
	Game.sfx("close", -10)
	closed.emit()
	queue_free()
