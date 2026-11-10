class_name BattleHUD
extends Control
## Interfaz táctil del combate (horizontal). Se construye por código.

signal action_chosen(kind: String, data: Dictionary)
signal end_turn_pressed
signal undo_pressed
signal cancel_pressed
signal confirm_pressed
signal menu_pressed
signal auto_toggled(pid: String, on: bool)
signal camera_rotate(dir: int)
signal speed_toggled
signal portrait_tapped(cid: String)

var battle: Battle
var init_bar: HBoxContainer
var round_label: Label
var card: PanelContainer
var card_portrait: TextureRect
var card_name: Label
var card_sub: Label
var card_hp: ProgressBar
var card_hp_label: Label
var card_ac: Label
var card_speed: Label
var card_pips: HBoxContainer
var card_slots: HBoxContainer
var card_effects: HFlowContainer
var auto_btn: Button
var actions_box: HBoxContainer
var btn_attack: Button
var btn_spells: Button
var btn_features: Button
var btn_actions: Button
var btn_items: Button
var btn_end: Button
var btn_undo: Button
var prompt: PanelContainer
var prompt_label: Label
var prompt_confirm: Button
var prompt_cancel: Button
var preview: PanelContainer
var preview_body: RichTextLabel
var preview_btn: Button
var preview_opts: HFlowContainer
var sheet: PanelContainer
var sheet_title: Label
var sheet_list: VBoxContainer
var sheet_scroll: ScrollContainer
var log_panel: PanelContainer
var log_text: RichTextLabel
var banner: PanelContainer
var banner_label: Label
var tip_panel: PanelContainer
var tip_label: RichTextLabel
var info_modal: Control
var speed_btn: Button
var thinking: Label
var _ui_blockers: Array = []
var _active: Creature
var _sheet_callback: Callable
var _log_lines: Array = []
var _bubbles: Array = []

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	_build_top()
	_build_card()
	_build_actions()
	_build_prompt()
	_build_preview()
	_build_sheet()
	_build_log()
	_build_banner()
	_build_tip()

func setup(b: Battle) -> void:
	battle = b
	refresh()

# ================================================================== construcción

func _build_top() -> void:
	var top := HBoxContainer.new()
	top.set_anchors_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 12
	top.offset_right = -12
	top.offset_top = 10
	top.add_theme_constant_override("separation", 10)
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(top)
	var menu := UI.button("", "menu", Vector2(64, 64))
	menu.pressed.connect(func(): menu_pressed.emit())
	top.add_child(menu)
	_ui_blockers.append(menu)
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(spacer)
	var init_panel := UI.panel("glass", 8)
	var ih := UI.hbox(8)
	init_panel.add_child(ih)
	round_label = UI.label("Ronda\n1", 15, UI.TEXT_DIM, UI.FONT_SC)
	round_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	round_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	round_label.custom_minimum_size.x = 50
	ih.add_child(round_label)
	init_bar = HBoxContainer.new()
	init_bar.add_theme_constant_override("separation", 5)
	ih.add_child(init_bar)
	top.add_child(init_panel)
	_ui_blockers.append(init_panel)
	var spacer2 := Control.new()
	spacer2.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer2.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(spacer2)
	var rot_l := UI.button("", "undo", Vector2(56, 56))
	rot_l.tooltip_text = "Girar cámara"
	rot_l.pressed.connect(func(): camera_rotate.emit(-1))
	top.add_child(rot_l)
	var rot_r := UI.button("", "redo", Vector2(56, 56))
	rot_r.pressed.connect(func(): camera_rotate.emit(1))
	top.add_child(rot_r)
	speed_btn = UI.button("×1", "fast", Vector2(86, 56))
	speed_btn.pressed.connect(func(): speed_toggled.emit())
	top.add_child(speed_btn)
	var log_btn := UI.button("", "log", Vector2(56, 56))
	log_btn.pressed.connect(func(): toggle_log())
	top.add_child(log_btn)
	for b in [rot_l, rot_r, speed_btn, log_btn]:
		_ui_blockers.append(b)
	thinking = UI.label("", 20, UI.TEXT_DIM)
	thinking.set_anchors_preset(Control.PRESET_CENTER_TOP)
	thinking.offset_top = 92
	thinking.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	thinking.offset_left = -200
	thinking.offset_right = 200
	add_child(thinking)

func _build_card() -> void:
	card = UI.panel("panel", 14)
	card.set_anchors_preset(Control.PRESET_BOTTOM_LEFT)
	card.offset_left = 12
	card.offset_bottom = -12
	card.grow_vertical = Control.GROW_DIRECTION_BEGIN
	card.custom_minimum_size = Vector2(400, 0)
	add_child(card)
	_ui_blockers.append(card)
	var h := UI.hbox(12)
	card.add_child(h)
	card_portrait = TextureRect.new()
	card_portrait.custom_minimum_size = Vector2(104, 104)
	card_portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	card_portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	h.add_child(card_portrait)
	var v := UI.vbox(4)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	h.add_child(v)
	var name_row := UI.hbox(8)
	card_name = UI.label("", 24, UI.TEXT, UI.FONT_BOLD)
	card_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	name_row.add_child(card_name)
	auto_btn = UI.button("Manual", "auto", Vector2(118, 40))
	auto_btn.add_theme_font_size_override("font_size", UI.fs(16))
	auto_btn.toggle_mode = true
	auto_btn.tooltip_text = "Guion de compañero: deja que la IA juegue su turno"
	auto_btn.toggled.connect(func(on):
		auto_btn.text = "Auto" if on else "Manual"
		if _active:
			auto_toggled.emit(_active.id, on))
	name_row.add_child(auto_btn)
	v.add_child(name_row)
	card_sub = UI.label("", 16, UI.TEXT_DIM)
	v.add_child(card_sub)
	var hp_row := UI.hbox(8)
	hp_row.add_child(UI.icon_rect("hp", 20, Color(0.9, 0.35, 0.3)))
	card_hp = UI.hp_bar(150, 18)
	hp_row.add_child(card_hp)
	card_hp_label = UI.label("", 18, UI.TEXT, UI.FONT_BOLD)
	hp_row.add_child(card_hp_label)
	hp_row.add_child(UI.icon_rect("ac", 20, UI.GOLD))
	card_ac = UI.label("", 18, UI.TEXT, UI.FONT_BOLD)
	hp_row.add_child(card_ac)
	v.add_child(hp_row)
	var econ := UI.hbox(10)
	card_pips = UI.hbox(6)
	econ.add_child(card_pips)
	card_speed = UI.label("", 17, UI.TEXT_DIM)
	econ.add_child(card_speed)
	v.add_child(econ)
	card_slots = UI.hbox(6)
	v.add_child(card_slots)
	card_effects = HFlowContainer.new()
	card_effects.add_theme_constant_override("h_separation", 6)
	v.add_child(card_effects)

func _build_actions() -> void:
	var holder := VBoxContainer.new()
	holder.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	holder.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	holder.grow_vertical = Control.GROW_DIRECTION_BEGIN
	holder.offset_right = -12
	holder.offset_bottom = -12
	holder.alignment = BoxContainer.ALIGNMENT_END
	holder.add_theme_constant_override("separation", 8)
	holder.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(holder)
	btn_undo = UI.button("Deshacer movimiento", "undo", Vector2(0, 56))
	btn_undo.size_flags_horizontal = Control.SIZE_SHRINK_END
	btn_undo.pressed.connect(func(): undo_pressed.emit())
	holder.add_child(btn_undo)
	_ui_blockers.append(btn_undo)
	var panel := UI.panel("glass", 10)
	holder.add_child(panel)
	_ui_blockers.append(panel)
	actions_box = UI.hbox(8)
	panel.add_child(actions_box)
	btn_attack = UI.action_button("Atacar", "attack")
	btn_attack.pressed.connect(func(): action_chosen.emit("attack_menu", {}))
	btn_spells = UI.action_button("Conjuros", "spells")
	btn_spells.pressed.connect(func(): action_chosen.emit("spell_menu", {}))
	btn_features = UI.action_button("Habilidad", "features")
	btn_features.pressed.connect(func(): action_chosen.emit("feature_menu", {}))
	btn_actions = UI.action_button("Acciones", "actions")
	btn_actions.pressed.connect(func(): action_chosen.emit("action_menu", {}))
	btn_items = UI.action_button("Objetos", "bag")
	btn_items.pressed.connect(func(): action_chosen.emit("items_menu", {}))
	btn_end = UI.action_button("Fin turno", "end_turn")
	btn_end.pressed.connect(func(): end_turn_pressed.emit())
	UI.stone_button(btn_end, true, 10)
	for b in [btn_attack, btn_spells, btn_features, btn_actions, btn_items, btn_end]:
		actions_box.add_child(b)

func _build_prompt() -> void:
	prompt = UI.panel("panel", 12)
	prompt.set_anchors_preset(Control.PRESET_CENTER_TOP)
	prompt.offset_top = 96
	prompt.grow_horizontal = Control.GROW_DIRECTION_BOTH
	prompt.visible = false
	add_child(prompt)
	_ui_blockers.append(prompt)
	var h := UI.hbox(12)
	prompt.add_child(h)
	prompt_label = UI.label("", 21, UI.TEXT, UI.FONT_BOLD)
	prompt_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	h.add_child(prompt_label)
	prompt_confirm = UI.button("Confirmar", "check", Vector2(0, 52))
	prompt_confirm.pressed.connect(func(): confirm_pressed.emit())
	h.add_child(prompt_confirm)
	prompt_cancel = UI.button("Cancelar", "cross", Vector2(0, 52))
	prompt_cancel.pressed.connect(func(): cancel_pressed.emit())
	h.add_child(prompt_cancel)

func _build_preview() -> void:
	preview = UI.panel("panel", 14)
	preview.visible = false
	preview.custom_minimum_size = Vector2(300, 0)
	add_child(preview)
	_ui_blockers.append(preview)
	var v := UI.vbox(6)
	preview.add_child(v)
	preview_body = UI.rich("", 19)
	preview_body.custom_minimum_size = Vector2(290, 0)
	v.add_child(preview_body)
	preview_opts = HFlowContainer.new()
	preview_opts.add_theme_constant_override("h_separation", 6)
	preview_opts.add_theme_constant_override("v_separation", 6)
	preview_opts.visible = false
	v.add_child(preview_opts)
	preview_btn = UI.button("Atacar", "attack", Vector2(0, 58))
	preview_btn.pressed.connect(func(): confirm_pressed.emit())
	v.add_child(preview_btn)

func _build_sheet() -> void:
	sheet = UI.panel("panel", 16)
	sheet.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	sheet.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	sheet.grow_vertical = Control.GROW_DIRECTION_BEGIN
	sheet.offset_right = -12
	sheet.offset_bottom = -132
	sheet.custom_minimum_size = Vector2(560, 0)
	sheet.visible = false
	add_child(sheet)
	_ui_blockers.append(sheet)
	var v := UI.vbox(8)
	sheet.add_child(v)
	var head := UI.hbox(8)
	sheet_title = UI.label("", 24, UI.GOLD, UI.FONT_SC)
	sheet_title.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(sheet_title)
	var close := UI.button("", "cross", Vector2(52, 52))
	close.pressed.connect(func(): close_sheet())
	head.add_child(close)
	v.add_child(head)
	sheet_scroll = ScrollContainer.new()
	sheet_scroll.custom_minimum_size = Vector2(540, 0)
	sheet_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sheet_scroll)
	sheet_list = UI.vbox(8)
	sheet_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sheet_scroll.add_child(sheet_list)

func _build_log() -> void:
	log_panel = UI.panel("glass", 12)
	log_panel.set_anchors_preset(Control.PRESET_RIGHT_WIDE)
	log_panel.offset_left = -430
	log_panel.offset_right = -12
	log_panel.offset_top = 86
	log_panel.offset_bottom = -150
	log_panel.visible = false
	add_child(log_panel)
	_ui_blockers.append(log_panel)
	var v := UI.vbox(6)
	log_panel.add_child(v)
	v.add_child(UI.label("Crónica del combate", 20, UI.GOLD, UI.FONT_SC))
	var sc := ScrollContainer.new()
	sc.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	v.add_child(sc)
	log_text = UI.rich("", 17)
	log_text.custom_minimum_size = Vector2(390, 0)
	log_text.scroll_following = true
	sc.add_child(log_text)

func _build_banner() -> void:
	banner = UI.panel("panel", 18)
	banner.set_anchors_preset(Control.PRESET_CENTER)
	banner.grow_horizontal = Control.GROW_DIRECTION_BOTH
	banner.grow_vertical = Control.GROW_DIRECTION_BOTH
	banner.visible = false
	banner.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(banner)
	banner_label = UI.title("", 34)
	banner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	banner.add_child(banner_label)

func _build_tip() -> void:
	tip_panel = UI.panel("panel", 14)
	tip_panel.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	tip_panel.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	tip_panel.offset_right = -12
	tip_panel.offset_top = 90
	tip_panel.custom_minimum_size = Vector2(380, 0)
	tip_panel.visible = false
	add_child(tip_panel)
	_ui_blockers.append(tip_panel)
	var v := UI.vbox(8)
	tip_panel.add_child(v)
	var h := UI.hbox(8)
	h.add_child(UI.icon_rect("info", 26, UI.WARN))
	h.add_child(UI.label("Consejo", 20, UI.WARN, UI.FONT_SC))
	v.add_child(h)
	tip_label = UI.rich("", 19)
	tip_label.custom_minimum_size = Vector2(350, 0)
	v.add_child(tip_label)
	var ok := UI.button("Entendido", "check", Vector2(0, 50))
	ok.pressed.connect(func(): tip_panel.visible = false)
	v.add_child(ok)

# ================================================================== actualización

func refresh(active: Creature = null) -> void:
	if battle == null:
		return
	if active != null:
		_active = active
	elif battle.current != null and battle.current.team == 0:
		_active = battle.current
	round_label.text = "Ronda\n%d" % max(1, battle.round_num)
	_refresh_init()
	_refresh_card()
	_refresh_actions()

func _refresh_init() -> void:
	for ch in init_bar.get_children():
		ch.queue_free()
	# Orden rotado: primero quien actúa ahora, luego los siguientes
	var order: Array = battle.order.filter(func(x): return not (x.dead and x.team == 1))
	var start := order.find(battle.current)
	if start > 0:
		order = order.slice(start) + order.slice(0, start)
	var max_chips := int((get_viewport_rect().size.x - 520) / 52.0)
	if order.size() > max_chips:
		order = order.slice(0, max_chips)
	for c in order:
		var is_cur: bool = c == battle.current
		var sz := 56 if is_cur else 44
		var chip := PanelContainer.new()
		var border: Color = UI.ally_color() if c.team == 0 else UI.enemy_color()
		if is_cur:
			border = UI.GOLD
		chip.add_theme_stylebox_override("panel", UI.box(Color(0.1, 0.08, 0.07, 0.95), border, 10, 3 if is_cur else 2, 2))
		var v := VBoxContainer.new()
		v.add_theme_constant_override("separation", 1)
		chip.add_child(v)
		var tr := TextureRect.new()
		tr.texture = Portraits.get_portrait(c)
		tr.custom_minimum_size = Vector2(sz, sz) * UI.scale_f()
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		if c.dead or c.is_down():
			tr.modulate = Color(0.45, 0.4, 0.4)
		v.add_child(tr)
		var hb := UI.hp_bar(sz, 6)
		hb.value = c.hp_ratio() * 100
		UI.set_bar_color(hb, UI.hp_color(c.hp_ratio()) if c.team == 0 else Color(0.82, 0.2, 0.16))
		v.add_child(hb)
		chip.tooltip_text = c.name
		var cid = c.id
		chip.gui_input.connect(func(ev):
			if (ev is InputEventMouseButton and ev.pressed and ev.button_index == MOUSE_BUTTON_LEFT):
				portrait_tapped.emit(cid))
		init_bar.add_child(chip)

func _refresh_card() -> void:
	var c := _active
	card.visible = c != null
	if c == null:
		return
	card_portrait.texture = Portraits.get_portrait(c)
	card_name.text = c.name
	var cls_name: String = RulesDB.classes.get(c.cls, {}).get("name", "")
	card_sub.text = "%s · %s · nivel %d" % [Factory.species_name(c.species), cls_name, c.level] if c.is_pc else c.title
	card_hp.value = c.hp_ratio() * 100
	UI.set_bar_color(card_hp, UI.hp_color(c.hp_ratio()))
	card_hp_label.text = "%d/%d" % [c.hp, c.max_hp] + (" (+%d)" % c.temp_hp if c.temp_hp > 0 else "")
	card_ac.text = str(c.ac())
	auto_btn.visible = c.is_pc
	auto_btn.set_pressed_no_signal(Game.is_auto(c.id))
	auto_btn.text = "Auto" if Game.is_auto(c.id) else "Manual"
	# Economía de acciones
	for ch in card_pips.get_children():
		ch.queue_free()
	var is_turn: bool = c == battle.current
	var act_ok: bool = c.turn.get("action", 0) > 0 or c.turn.get("attack_left", 0) > 0
	card_pips.add_child(_pip("Acción", act_ok and is_turn, Color(0.35, 0.8, 0.4)))
	card_pips.add_child(_pip("Adicional", c.turn.get("bonus", 0) > 0 and is_turn, Color(0.95, 0.65, 0.2)))
	card_pips.add_child(_pip("Reacción", c.turn.get("reaction", 0) > 0, Color(0.6, 0.55, 0.95)))
	card_speed.text = "Mov. %s" % Loc.ft(int(c.turn.get("movement", c.speed()))) if is_turn else "Vel. %s" % Loc.ft(c.speed())
	# Espacios de conjuro
	for ch in card_slots.get_children():
		ch.queue_free()
	card_slots.visible = c.slots_max.size() > 0
	for i in c.slots_max.size():
		var lbl := UI.label(["I", "II", "III"][min(i, 2)], 15, UI.MAGIC, UI.FONT_BOLD)
		card_slots.add_child(lbl)
		for j in c.slots_max[i]:
			var dot := ColorRect.new()
			dot.custom_minimum_size = Vector2(12, 12) * UI.scale_f()
			dot.color = UI.MAGIC if j < c.slots[i] else Color(0.25, 0.22, 0.28)
			card_slots.add_child(dot)
	# Efectos y condiciones
	for ch in card_effects.get_children():
		ch.queue_free()
	for cond in c.active_condition_list():
		card_effects.add_child(_chip(Loc.cond(cond), Color(0.9, 0.5, 0.4)))
	for e in c.effects:
		if not e.name.is_empty():
			card_effects.add_child(_chip(e.name, Color(0.55, 0.8, 1.0) if e.positive else Color(0.95, 0.6, 0.45)))
	if c.concentration != null:
		card_effects.add_child(_chip("Concentración: " + RulesDB.spell(c.concentration_spell).get("name", ""), UI.MAGIC))
	if c.is_down():
		card_effects.add_child(_chip("Muerte: %d✔ %d✘" % [c.death_successes, c.death_failures], UI.ENEMY))

func _pip(text: String, on: bool, color: Color) -> Control:
	var h := UI.hbox(4)
	var dot := ColorRect.new()
	dot.custom_minimum_size = Vector2(14, 14) * UI.scale_f()
	dot.color = color if on else Color(0.25, 0.23, 0.2)
	h.add_child(dot)
	h.add_child(UI.label(text, 15, UI.TEXT if on else UI.TEXT_DIM))
	return h

func _chip(text: String, color: Color) -> Control:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", UI.box(Color(color.r * 0.2, color.g * 0.2, color.b * 0.2, 0.9), color, 3, 2, 4))
	p.add_child(UI.label(text, 14, color))
	return p

func _refresh_actions() -> void:
	var c := _active
	var my_turn: bool = c != null and c == battle.current and c.team == 0 and c.can_act() and not Game.is_auto(c.id)
	actions_box.get_parent().visible = my_turn
	btn_undo.visible = my_turn and battle.can_undo_move(c)
	if not my_turn:
		return
	var has_act: bool = c.turn.action > 0 or c.turn.attack_left > 0
	btn_attack.disabled = not has_act
	btn_attack.text = "Atacar" if c.turn.attack_left <= 0 else "Atacar (%d)" % c.turn.attack_left
	var spells := battle.spells.available(c)
	btn_spells.visible = not spells.is_empty()
	btn_spells.disabled = spells.filter(func(s): return s.usable).is_empty()
	var feats := feature_list(c)
	btn_features.visible = not feats.is_empty()
	btn_features.disabled = feats.filter(func(f): return f.enabled).is_empty()
	var its := item_list(c)
	btn_items.visible = not its.is_empty()
	btn_items.disabled = its.filter(func(x): return x.enabled).is_empty()
	btn_actions.disabled = not has_act and c.turn.bonus <= 0

# ================================================================== listas de opciones

## Objetos utilizables en combate: pociones (acción adicional), pergaminos y varitas.
func item_list(c: Creature) -> Array:
	var out: Array = []
	var can_cast := c.form.is_empty() and not c.is_raging()
	var has_act: bool = c.turn.action > 0
	for id in c.items.keys():
		var n := int(c.items[id])
		if n <= 0:
			continue
		var d := Items.data(id)
		match str(d.get("kind", "")):
			"potion":
				out.append({"id": id, "icon": Items.icon_of(id), "title": "%s ×%d" % [d.name, n], "cost": "Adicional",
					"desc": d.get("desc", ""), "enabled": c.turn.bonus > 0, "kind": "potion"})
			"scroll":
				var sp := RulesDB.spell(str(d.spell))
				var ok := Items.can_read_scroll(c.sheet, id)
				var cost_txt: String = {"action": "Acción", "bonus": "Adicional"}.get(str(sp.get("cast", "action")), "Acción")
				var en: bool = ok and can_cast and (has_act if sp.get("cast", "action") == "action" else c.turn.bonus > 0)
				var desc: String = sp.get("desc", "") if ok else "Solo pueden leerlo quienes tienen %s en su lista de conjuros." % sp.get("name", "")
				out.append({"id": id, "icon": "scroll", "title": "%s ×%d" % [d.name, n], "cost": cost_txt, "desc": desc,
					"enabled": en, "kind": "scroll", "spell": d.spell, "color": UI.MAGIC})
			"wand":
				var ch := int(c.item_charges.get(id, 0))
				var sp2 := RulesDB.spell(str(d.spell))
				var ok2 := Items.can_use_wand(c.sheet, id)
				out.append({"id": id, "icon": "wand", "title": "%s (%d cargas)" % [d.name, ch], "cost": "Acción",
					"desc": sp2.get("desc", "") if ok2 else "Solo la puede usar quien lanza conjuros.",
					"enabled": ok2 and can_cast and has_act and ch > 0, "kind": "wand", "spell": d.spell, "color": UI.MAGIC})
	return out

## Rasgos de clase y especie usables (para la hoja de habilidades).
func feature_list(c: Creature) -> Array:
	return battle.cls.list(c)

func action_list(c: Creature) -> Array:
	var has_act: bool = c.turn.action > 0 and c.turn.attack_left <= 0
	var out: Array = [
		{"id": "dash", "icon": "dash", "title": "Correr", "cost": "Acción", "desc": "Ganas movimiento extra igual a tu velocidad.", "enabled": has_act},
		{"id": "disengage", "icon": "disengage", "title": "Destrabarse", "cost": "Acción", "desc": "Te alejas sin provocar ataques de oportunidad.", "enabled": has_act and not c.turn.disengaged},
		{"id": "dodge", "icon": "dodge", "title": "Esquivar", "cost": "Acción", "desc": "Hasta tu siguiente turno, los ataques contra ti tienen desventaja.", "enabled": has_act},
		{"id": "hide", "icon": "hide", "title": "Esconderse", "cost": "Acción", "desc": "Sigilo CD 15 si nadie te ve con claridad.", "enabled": has_act and battle.can_hide(c)},
		{"id": "help", "icon": "help", "title": "Ayudar", "cost": "Acción", "desc": "Distraes a un enemigo adyacente: el siguiente ataque aliado tiene ventaja.", "enabled": has_act},
		{"id": "shove", "icon": "shove", "title": "Empujar / Derribar", "cost": "Ataque", "desc": "FUE o DES del objetivo contra CD %d: queda derribado." % (8 + c.mod("str") + c.prof_bonus), "enabled": c.turn.action > 0 or c.turn.attack_left > 0},
		{"id": "stabilize", "icon": "stabilize", "title": "Estabilizar", "cost": "Acción", "desc": "Medicina CD 10 sobre un aliado caído adyacente.", "enabled": has_act},
		{"id": "wake", "icon": "wake", "title": "Despertar", "cost": "Acción", "desc": "Sacudes a un aliado dormido por magia.", "enabled": has_act},
	]
	return out

# ================================================================== hoja inferior

## items: Array de {id, icon, title, cost, desc, enabled, color?}
func open_sheet(title: String, items: Array, callback: Callable) -> void:
	sheet_title.text = title
	_sheet_callback = callback
	for ch in sheet_list.get_children():
		ch.queue_free()
	for it in items:
		var b := Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(520, 76) * Vector2(1, UI.scale_f())
		b.disabled = not it.get("enabled", true)
		var h := UI.hbox(12)
		h.mouse_filter = Control.MOUSE_FILTER_IGNORE
		h.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		h.offset_left = 12
		h.offset_right = -12
		var ic := UI.icon_rect(it.get("icon", "magic"), 40, it.get("color", UI.GOLD) if not b.disabled else Color(0.4, 0.38, 0.35))
		h.add_child(ic)
		var v := UI.vbox(0)
		v.mouse_filter = Control.MOUSE_FILTER_IGNORE
		v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		v.alignment = BoxContainer.ALIGNMENT_CENTER
		var t := UI.label(it.title, 21, UI.TEXT if not b.disabled else UI.TEXT_DIM, UI.FONT_BOLD)
		v.add_child(t)
		var d := UI.label(it.get("desc", ""), 15, UI.TEXT_DIM)
		d.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		d.custom_minimum_size = Vector2(360, 0)
		v.add_child(d)
		h.add_child(v)
		var cost := UI.label(it.get("cost", ""), 15, UI.GOLD_DIM, UI.FONT_SC)
		cost.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		h.add_child(cost)
		b.add_child(h)
		var data: Dictionary = it
		b.pressed.connect(func():
			Game.sfx("select", -6)
			close_sheet()
			_sheet_callback.call(data))
		sheet_list.add_child(b)
	var n: int = min(items.size(), 5)
	sheet_scroll.custom_minimum_size.y = (n * 84) * UI.scale_f()
	sheet.visible = true
	UI.fade_in(sheet, 0.15)
	Game.sfx("open", -8)

func close_sheet() -> void:
	sheet.visible = false

# ================================================================== avisos

func show_prompt(text: String, can_confirm := false, confirm_text := "Confirmar") -> void:
	prompt_label.text = text
	prompt_confirm.visible = can_confirm
	prompt_confirm.text = confirm_text
	prompt.visible = true
	prompt.reset_size()

func hide_prompt() -> void:
	prompt.visible = false

func show_preview(screen_pos: Vector2, bbcode: String, btn_text := "Atacar", btn_icon := "attack", can := true) -> void:
	preview_body.text = bbcode
	preview_btn.text = btn_text
	preview_btn.icon = UI.icon(btn_icon)
	preview_btn.disabled = not can
	preview.visible = true
	_place_preview()

func _place_preview() -> void:
	preview.reset_size()
	# Posición fija, encima de la ficha del personaje: no tapa al objetivo y siempre está en el mismo sitio
	var vp := get_viewport_rect().size
	var sz := preview.size
	var bottom := vp.y - 12.0
	if card.visible:
		bottom = card.get_global_rect().position.y - 10.0
	var pos := Vector2(12, bottom - sz.y)
	pos.y = max(pos.y, 90.0)
	preview.position = pos

func hide_preview() -> void:
	preview.visible = false
	set_preview_options([], -1, Callable())

## Fila de opciones dentro de la previsión (castigos, técnicas...). items: [{text, color?}]
func set_preview_options(items: Array, selected: int, callback: Callable) -> void:
	for ch in preview_opts.get_children():
		ch.queue_free()
	preview_opts.visible = not items.is_empty()
	for i in items.size():
		var it: Dictionary = items[i]
		var b := Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.toggle_mode = true
		b.button_pressed = i == selected
		b.text = it.text
		b.custom_minimum_size = Vector2(0, 46) * Vector2(1, UI.scale_f())
		b.add_theme_font_size_override("font_size", int(16 * UI.scale_f()))
		var col: Color = it.get("color", UI.MAGIC)
		b.add_theme_stylebox_override("normal", UI.box(Color(0.12, 0.1, 0.09, 0.95), Color(col.r, col.g, col.b, 0.5), 10, 2, 6))
		b.add_theme_stylebox_override("pressed", UI.box(Color(col.r * 0.35, col.g * 0.35, col.b * 0.35, 0.95), col, 10, 3, 6))
		b.add_theme_stylebox_override("hover", UI.box(Color(0.16, 0.13, 0.11, 0.95), col, 10, 2, 6))
		var idx := i
		b.pressed.connect(func():
			Game.sfx("select", -8)
			callback.call(idx))
		preview_opts.add_child(b)
	if preview.visible:
		_place_preview.call_deferred()

func show_banner(text: String, color := UI.GOLD, dur := 1.1) -> void:
	banner_label.text = text
	banner_label.add_theme_color_override("font_color", color)
	banner.visible = true
	banner.reset_size()
	banner.position = (get_viewport_rect().size - banner.size) * Vector2(0.5, 0.36)
	banner.modulate.a = 0.0
	var tw := create_tween()
	tw.tween_property(banner, "modulate:a", 1.0, 0.18)
	tw.tween_interval(dur)
	tw.tween_property(banner, "modulate:a", 0.0, 0.3)
	tw.tween_callback(func(): banner.visible = false)

func show_tip(text: String) -> void:
	if not Game.settings.get("tips", true):
		return
	tip_label.text = text
	tip_panel.visible = true
	UI.fade_in(tip_panel)

func set_thinking(text: String) -> void:
	thinking.text = text

func set_speed_label(fast: bool) -> void:
	speed_btn.text = "×2" if fast else "×1"

func add_log(text: String) -> void:
	_log_lines.append(text)
	if _log_lines.size() > 160:
		_log_lines = _log_lines.slice(_log_lines.size() - 160)
	if log_panel.visible:
		_render_log()

func _render_log() -> void:
	var s := ""
	for l in _log_lines:
		if l.begins_with("—"):
			s += "\n[color=#d8b56a][b]%s[/b][/color]\n" % l
		else:
			s += l + "\n"
	log_text.text = s

func toggle_log() -> void:
	log_panel.visible = not log_panel.visible
	if log_panel.visible:
		_render_log()

## ¿Está el punto sobre algún elemento de la interfaz?
func is_point_on_ui(p: Vector2) -> bool:
	for c in _ui_blockers:
		if c is Control and c.is_visible_in_tree() and c.get_global_rect().has_point(p):
			return true
	if info_modal != null and is_instance_valid(info_modal) and info_modal.visible:
		return true
	return false

# ================================================================== bocadillos de diálogo

## Bocadillo que sigue a una criatura en pantalla. pos_fn devuelve la posición (punta del bocadillo).
func show_bubble(text: String, tex: Texture2D, pos_fn: Callable, dur := 3.0) -> void:
	var p := PanelContainer.new()
	var sb := UI.box(Color(0.97, 0.93, 0.85, 0.97), Color(0.35, 0.25, 0.15), 14, 2, 8)
	p.add_theme_stylebox_override("panel", sb)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var h := UI.hbox(8)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	p.add_child(h)
	if tex != null:
		var tr := TextureRect.new()
		tr.texture = tex
		tr.custom_minimum_size = Vector2(42, 42) * UI.scale_f()
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		tr.mouse_filter = Control.MOUSE_FILTER_IGNORE
		h.add_child(tr)
	var l := UI.label(text, 18, Color(0.16, 0.11, 0.07), UI.FONT_BOLD)
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.custom_minimum_size.x = clamp(text.length() * 9.5, 110.0, 300.0) * UI.scale_f()
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	h.add_child(l)
	p.set_meta("pos_fn", pos_fn)
	p.set_meta("until", Time.get_ticks_msec() + int(dur * 1000))
	p.modulate.a = 0.0
	add_child(p)
	_bubbles.append(p)
	var tw := p.create_tween()
	tw.tween_property(p, "modulate:a", 1.0, 0.2)

func _process(_delta: float) -> void:
	if _bubbles.is_empty():
		return
	var vs := get_viewport_rect().size
	for b in _bubbles.duplicate():
		if not is_instance_valid(b):
			_bubbles.erase(b)
			continue
		var fn: Callable = b.get_meta("pos_fn")
		if not fn.is_valid():
			b.queue_free()
			_bubbles.erase(b)
			continue
		var pos: Vector2 = fn.call()
		var target := pos - Vector2(b.size.x * 0.5, b.size.y + 8)
		target.x = clamp(target.x, 8.0, vs.x - b.size.x - 8)
		target.y = clamp(target.y, 90.0, vs.y - b.size.y - 8)
		b.position = target
		if Time.get_ticks_msec() > int(b.get_meta("until")) and not b.has_meta("fading"):
			b.set_meta("fading", true)
			var tw: Tween = b.create_tween()
			tw.tween_property(b, "modulate:a", 0.0, 0.35)
			tw.tween_callback(b.queue_free)

# ================================================================== ficha detallada

func show_info(c: Creature) -> void:
	if info_modal != null and is_instance_valid(info_modal):
		info_modal.queue_free()
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.55)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	info_modal = dim
	var p := UI.panel("panel", 20)
	p.set_anchors_preset(Control.PRESET_CENTER)
	p.grow_horizontal = Control.GROW_DIRECTION_BOTH
	p.grow_vertical = Control.GROW_DIRECTION_BOTH
	p.custom_minimum_size = Vector2(640, 0)
	dim.add_child(p)
	var v := UI.vbox(10)
	p.add_child(v)
	var h := UI.hbox(14)
	var tr := TextureRect.new()
	tr.texture = Portraits.get_portrait(c)
	tr.custom_minimum_size = Vector2(120, 120)
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	h.add_child(tr)
	var vv := UI.vbox(4)
	vv.add_child(UI.title(c.name, 28))
	var sub := c.title
	if c.is_pc:
		var cd: Dictionary = RulesDB.classes.get(c.cls, {})
		var scn: String = cd.get("subclasses", {}).get(c.subclass, {}).get("name", "")
		sub = "%s · %s %d%s" % [Factory.species_name(c.species), cd.get("name", c.cls), c.level, (" (" + scn + ")") if not scn.is_empty() else ""]
		if not c.title.is_empty():
			sub += " · " + c.title
		if not c.form.is_empty():
			sub = "En forma de %s · %s" % [RulesDB.monster_data(c.form).get("name", c.form).to_lower(), sub]
	else:
		sub = "Criatura de VD %s" % c.cr
	vv.add_child(UI.label(sub, 18, UI.TEXT_DIM))
	vv.add_child(UI.label("PG %d/%d   ·   CA %d   ·   Velocidad %s" % [c.hp, c.max_hp, c.ac(), Loc.ft(c.speed())], 20, UI.TEXT, UI.FONT_BOLD))
	h.add_child(vv)
	v.add_child(h)
	var ab := UI.hbox(10)
	for a in Creature.ABILITIES:
		var cell := UI.panel("inset", 6)
		var cv := UI.vbox(0)
		var l1 := UI.label(Loc.ability_short(a), 14, UI.GOLD, UI.FONT_SC)
		l1.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		var m := c.mod(a)
		var l2 := UI.label("%d (%s%d)" % [c.abilities[a], "+" if m >= 0 else "", m], 18)
		l2.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		cv.add_child(l1)
		cv.add_child(l2)
		cell.add_child(cv)
		ab.add_child(cell)
	v.add_child(ab)
	var lines: Array = []
	for pr in battle.attack_profiles(c):
		var dmg := ""
		for d in pr.damage:
			dmg += ("%s %s " % [d.dice, Loc.dmg_type(d.type)])
		lines.append("[b]%s[/b]: %+d al ataque, %s" % [pr.name, pr.bonus, dmg.strip_edges()])
	var res_names := {"rage": "Furia", "bardic_inspiration": "Inspiración", "channel_divinity": "Canalizar divinidad", "wild_shape": "Forma salvaje",
		"second_wind": "Tomar aliento", "action_surge": "Oleada", "focus": "Foco", "lay_on_hands": "Imposición (PG)", "innate_sorcery": "Hechicería innata",
		"sorcery_points": "Puntos de hechicería", "breath_weapon": "Aliento", "giant_ancestry": "Linaje de gigante", "adrenaline_rush": "Adrenalina",
		"heroic_inspiration": "Inspiración heroica", "relentless_endurance": "Aguante incansable"}
	var rl: Array = []
	for k in c.resources.keys():
		if res_names.has(k):
			rl.append("%s %d/%d" % [res_names[k], int(c.resources[k]), int(c.resources_max.get(k, c.resources[k]))])
	if not rl.is_empty():
		lines.append("[color=#d8b56a]" + " · ".join(rl) + "[/color]")
	if not c.resist.is_empty():
		lines.append("Resistencias: " + ", ".join(c.resist.map(func(x): return Loc.dmg_type(x))))
	if not c.vulnerable.is_empty():
		lines.append("[color=#f0a060]Vulnerable a: " + ", ".join(c.vulnerable.map(func(x): return Loc.dmg_type(x))) + "[/color]")
	if not c.immune.is_empty():
		lines.append("Inmune a: " + ", ".join(c.immune.map(func(x): return Loc.dmg_type(x))))
	var trait_names := {"pack_tactics": "Táctica de manada", "undead_fortitude": "Fortaleza de no muerto", "sunlight_sensitivity": "Sensibilidad a la luz solar",
		"luck": "Suerte (repite los 1)", "brave": "Valiente", "halfling_nimbleness": "Agilidad mediana", "fey_ancestry": "Linaje feérico", "trance": "Trance (no duerme)",
		"dwarven_resilience": "Resistencia enana", "dwarven_toughness": "Dureza enana", "savage_attacker": "Atacante salvaje", "alert": "Alerta",
		"improved_critical": "Crítico mejorado (19-20)", "sneak_attack": "Ataque furtivo " + c.sneak_attack, "cunning_action": "Acción astuta",
		"potent_cantrip": "Truco potente", "disciple_of_life": "Discípulo de la vida", "second_wind": "Tomar aliento", "action_surge": "Oleada de acción"}
	var tnames: Array = []
	for t in c.traits + c.feats:
		var tn: String = trait_names.get(t, "")
		if tn.is_empty() and RulesDB.feature_name(t) != t:
			tn = RulesDB.feature_name(t)
		if t in ["spellcasting", "weapon_mastery", "subclass", "pact_magic", "thieves_cant", "ritual_adept", "arcane_recovery", "magical_cunning", "druidic", "wild_companion", "fast_hands", "second_story_work", "stonecunning", "otherworldly_presence", "skillful", "versatile", "keen_senses", "evocation_savant", "scholar", "bonus_proficiencies", "deft_explorer", "tactical_mind", "primal_knowledge", "divine_sense", "protector", "warden"]:
			tn = ""
		if not tn.is_empty() and not tn in tnames:
			tnames.append(tn)
	if "nimble_escape" in c.bonus_actions:
		tnames.append("Huida ágil")
	if "redirect_attack" in c.reactions:
		tnames.append("Redirigir ataque")
	if not tnames.is_empty():
		lines.append("Rasgos: " + ", ".join(tnames))
	if c.is_pc and not c.masteries.is_empty():
		var ms: Array = []
		for w in c.weapons:
			if c.has_mastery(w):
				ms.append("%s (%s)" % [w.name, Loc.t("mastery." + w.mastery)])
		if not ms.is_empty():
			lines.append("Maestrías: " + ", ".join(ms))
	var r := UI.rich("\n".join(lines), 18)
	r.custom_minimum_size = Vector2(600, 0)
	v.add_child(r)
	var close := UI.button("Cerrar", "cross", Vector2(0, 56))
	close.pressed.connect(func(): dim.queue_free())
	v.add_child(close)
	dim.gui_input.connect(func(ev):
		if ev is InputEventMouseButton and ev.pressed:
			dim.queue_free())
	UI.fade_in(dim, 0.15)
