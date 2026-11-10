class_name ExploreHUD
extends Control
## Interfaz de la exploración: retratos del grupo, oro, botones de acción, avisos y pistas.

signal member_tapped(id: String)
signal member_held(id: String)
signal action(kind: String)
signal menu_pressed

var screen   ## ExploreScreen
var party_box: VBoxContainer
var gold_label: Label
var place_label: Label
var btn_stealth: Button
var btn_rest: Button
var btn_search: Button
var banner: PanelContainer
var banner_label: Label
var hint_panel: PanelContainer
var hint_label: RichTextLabel
var toast_box: VBoxContainer
var status_label: Label
var _blockers: Array = []
var _cards: Dictionary = {}

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build_party()
	_build_top_right()
	_build_actions()
	_build_banner()
	_build_hint()
	_build_toasts()

func setup(s) -> void:
	screen = s
	refresh()

# ================================================================== construcción

func _build_party() -> void:
	party_box = VBoxContainer.new()
	party_box.position = Vector2(12, 12)
	party_box.add_theme_constant_override("separation", 8)
	party_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(party_box)

func _build_top_right() -> void:
	var h := UI.hbox(10)
	h.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	h.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	h.offset_right = -12
	h.offset_top = 12
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(h)
	var info := UI.panel("glass", 10)
	var iv := UI.vbox(0)
	info.add_child(iv)
	place_label = UI.label("", 17, UI.TEXT_DIM, UI.FONT_SC)
	place_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	iv.add_child(place_label)
	var gh := UI.hbox(6)
	gh.alignment = BoxContainer.ALIGNMENT_END
	gh.add_child(UI.icon_rect("coins", 24, UI.GOLD))
	gold_label = UI.label("0 po", 22, UI.GOLD, UI.FONT_BOLD)
	gh.add_child(gold_label)
	iv.add_child(gh)
	h.add_child(info)
	_blockers.append(info)
	var menu := UI.button("", "menu", Vector2(64, 64))
	menu.pressed.connect(func(): menu_pressed.emit())
	h.add_child(menu)
	_blockers.append(menu)
	status_label = UI.label("", 18, UI.MAGIC, UI.FONT_SC)
	status_label.set_anchors_preset(Control.PRESET_CENTER_TOP)
	status_label.grow_horizontal = Control.GROW_DIRECTION_BOTH
	status_label.offset_top = 16
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(status_label)

func _build_actions() -> void:
	var panel := UI.panel("glass", 8)
	panel.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	panel.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	panel.grow_vertical = Control.GROW_DIRECTION_BEGIN
	panel.offset_right = -12
	panel.offset_bottom = -12
	add_child(panel)
	_blockers.append(panel)
	var h := UI.hbox(8)
	panel.add_child(h)
	var defs := [["Equipo", "bag", "inventory"], ["Sigilo", "stealth", "stealth"], ["Buscar", "search", "search"],
		["Descanso", "rest", "rest"], ["Diario", "book", "journal"]]
	for d in defs:
		var b := UI.action_button(d[0], d[1], 86)
		var kind: String = d[2]
		b.pressed.connect(func(): action.emit(kind))
		h.add_child(b)
		match kind:
			"stealth":
				btn_stealth = b
			"rest":
				btn_rest = b
			"search":
				btn_search = b

func _build_banner() -> void:
	banner = UI.panel("slab", 14)
	banner.visible = false
	banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	banner_label = UI.label("", 30, UI.GOLD, UI.FONT_TITLE)
	banner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner.add_child(banner_label)
	add_child(banner)

func _build_hint() -> void:
	hint_panel = UI.panel("glass", 12)
	hint_panel.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	hint_panel.grow_horizontal = Control.GROW_DIRECTION_BOTH
	hint_panel.grow_vertical = Control.GROW_DIRECTION_BEGIN
	hint_panel.offset_bottom = -126
	hint_panel.custom_minimum_size = Vector2(620, 0)
	hint_panel.visible = false
	hint_label = UI.rich("", 19)
	hint_label.custom_minimum_size = Vector2(590, 0)
	hint_label.fit_content = true
	hint_panel.add_child(hint_label)
	hint_panel.gui_input.connect(func(ev):
		if ev is InputEventMouseButton and ev.pressed:
			hint_panel.visible = false)
	add_child(hint_panel)
	_blockers.append(hint_panel)

func _build_toasts() -> void:
	toast_box = VBoxContainer.new()
	toast_box.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	toast_box.grow_vertical = Control.GROW_DIRECTION_BEGIN
	toast_box.offset_left = 14
	toast_box.offset_bottom = -14
	toast_box.add_theme_constant_override("separation", 4)
	toast_box.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(toast_box)

# ================================================================== estado

func refresh() -> void:
	if screen == null:
		return
	var cp: Campaign = screen.cp
	gold_label.text = "%d po" % cp.gold
	place_label.text = "%s · día %d" % [screen.level.get("name", ""), cp.day]
	btn_stealth.text = "Sigilo" if not screen.stealth else "Sigilo ✓"
	UI.stone_button(btn_stealth, screen.stealth, 6)
	_refresh_party()

func _refresh_party() -> void:
	var ids: Array = []
	for c in screen.members:
		ids.append(c.id)
	for d in screen.dead_members:
		ids.append(d)
	# Reconstruir si cambia el grupo
	if ids != _cards.keys():
		for ch in party_box.get_children():
			ch.queue_free()
		for b in _blockers.duplicate():
			if b is Control and not is_instance_valid(b):
				_blockers.erase(b)
		_cards.clear()
		for id in ids:
			_cards[id] = _make_card(id)
	for c in screen.members:
		var card: Dictionary = _cards.get(c.id, {})
		if card.is_empty():
			continue
		var tex: Texture2D = Portraits.get_portrait(c)
		if tex != null:
			card.portrait.texture = tex
		card.bar.max_value = c.max_hp
		card.bar.value = c.hp
		UI.set_bar_color(card.bar, UI.hp_color(c.hp_ratio()))
		card.hp.text = "%d/%d" % [c.hp, c.max_hp]
		var lead: bool = c.id == screen.leader
		card.panel.add_theme_stylebox_override("panel", UI.stone("slab_selected" if lead else "inset", 4))
		card.panel.modulate = Color.WHITE
	for d in screen.dead_members:
		var card2: Dictionary = _cards.get(d, {})
		if not card2.is_empty():
			card2.panel.modulate = Color(0.5, 0.45, 0.45)
			card2.hp.text = "Muerto"

func _make_card(id: String) -> Dictionary:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", UI.stone("inset", 4))
	p.mouse_filter = Control.MOUSE_FILTER_STOP
	var h := UI.hbox(6)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(h)
	var tr := TextureRect.new()
	tr.custom_minimum_size = Vector2(64, 64)
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	tr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_child(tr)
	var v := UI.vbox(2)
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var nm := ""
	var c: Creature = screen.member(id)
	if c != null:
		nm = BattleScreen.short_name(c)
	else:
		nm = screen.cp.short_name(id)
	v.add_child(UI.label(nm, 17, UI.TEXT, UI.FONT_BOLD))
	var bar := UI.hp_bar(96, 12)
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(bar)
	var hp := UI.label("", 14, UI.TEXT_DIM)
	v.add_child(hp)
	h.add_child(v)
	var press := {"t": 0, "held": false}
	p.gui_input.connect(func(ev):
		if ev is InputEventMouseButton and ev.button_index == MOUSE_BUTTON_LEFT:
			if ev.pressed:
				press.t = Time.get_ticks_msec()
				press.held = false
				var tw := p.create_tween()
				tw.tween_interval(0.55)
				tw.tween_callback(func():
					if press.t > 0 and not press.held:
						press.held = true
						member_held.emit(id))
			else:
				if not press.held and press.t > 0:
					member_tapped.emit(id)
				press.t = 0)
	party_box.add_child(p)
	_blockers.append(p)
	return {"panel": p, "portrait": tr, "bar": bar, "hp": hp}

# ================================================================== avisos

func show_banner(text: String, color := UI.GOLD, dur := 1.4) -> void:
	banner_label.text = text
	banner_label.add_theme_color_override("font_color", color)
	banner.visible = true
	banner.reset_size()
	banner.position = (get_viewport_rect().size - banner.size) * Vector2(0.5, 0.3)
	banner.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(banner, "modulate:a", 1.0, 0.2)
	tw.tween_interval(dur)
	tw.tween_property(banner, "modulate:a", 0.0, 0.35)
	tw.tween_callback(func(): banner.visible = false)

func toast(text: String, color := UI.TEXT, dur := 4.0) -> void:
	var p := UI.panel("glass", 8)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var l := UI.label(text, 18, color)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = min(520.0, max(160.0, text.length() * 9.0))
	p.add_child(l)
	toast_box.add_child(p)
	while toast_box.get_child_count() > 5:
		toast_box.get_child(0).free()
	var tw := p.create_tween()
	tw.tween_interval(dur)
	tw.tween_property(p, "modulate:a", 0.0, 0.5)
	tw.tween_callback(p.queue_free)

func show_hint(text: String) -> void:
	if not Game.settings.get("tips", true):
		return
	hint_label.text = text + "\n[color=#a89c88][font_size=15](toca para cerrar)[/font_size][/color]"
	hint_panel.visible = true
	UI.fade_in(hint_panel)

func set_status(text: String) -> void:
	status_label.text = text

func is_point_on_ui(p: Vector2) -> bool:
	for c in _blockers:
		if c is Control and is_instance_valid(c) and c.is_visible_in_tree() and c.get_global_rect().has_point(p):
			return true
	return false
