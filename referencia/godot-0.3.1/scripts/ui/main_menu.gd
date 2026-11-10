class_name MainMenu
extends Control
## Menú principal: continuar, elegir encuentro, guía, ajustes y créditos.

signal play(enc_id: String)
signal rebuild_requested
signal new_game
signal continue_game
signal load_slot(slot: String)

var _left: PanelContainer

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	# Degradado oscuro a la izquierda para que el texto se lea sobre el diorama
	var grad := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(0.03, 0.025, 0.02, 0.92))
	g.set_color(1, Color(0.03, 0.025, 0.02, 0.0))
	g.add_point(0.45, Color(0.03, 0.025, 0.02, 0.75))
	gt.gradient = g
	gt.fill_from = Vector2(0, 0)
	gt.fill_to = Vector2(1, 0)
	gt.width = 256
	gt.height = 4
	grad.texture = gt
	grad.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	grad.stretch_mode = TextureRect.STRETCH_SCALE
	grad.anchor_bottom = 1.0
	grad.anchor_right = 0.62
	grad.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(grad)
	var margin := MarginContainer.new()
	margin.anchor_bottom = 1.0
	margin.anchor_right = 0.0
	margin.offset_right = 520 * UI.scale_f()
	margin.add_theme_constant_override("margin_left", 54)
	margin.add_theme_constant_override("margin_top", 34)
	margin.add_theme_constant_override("margin_bottom", 24)
	add_child(margin)
	var col := UI.vbox(10)
	margin.add_child(col)
	var t1 := UI.title("Marca de", 34)
	t1.add_theme_color_override("font_color", UI.TEXT_DIM)
	col.add_child(t1)
	var t2 := UI.title("Granito", 68)
	t2.add_theme_font_override("font", UI.FONT_DECO)
	t2.add_theme_constant_override("line_spacing", -10)
	col.add_child(t2)
	col.add_child(UI.divider(420))
	col.add_child(UI.label("Capítulo I · El toro que sangra", 22, UI.GOLD, UI.FONT_SC))
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(0, 4)
	col.add_child(sp)
	var saves := Game.list_saves()
	var b_play: Button
	if not saves.is_empty():
		var m: Dictionary = saves[0]
		b_play = UI.button("Continuar", "attack", Vector2(440, 62))
		b_play.pressed.connect(func(): continue_game.emit())
	else:
		b_play = UI.button("Empezar la aventura", "attack", Vector2(440, 62))
		b_play.pressed.connect(func(): new_game.emit())
	b_play.alignment = HORIZONTAL_ALIGNMENT_LEFT
	UI.stone_button(b_play, true, 14)
	b_play.add_theme_font_size_override("font_size", UI.fs(24))
	col.add_child(b_play)
	if not saves.is_empty():
		var m2: Dictionary = saves[0]
		var cls_name: String = RulesDB.classes.get(str(m2.get("class", "")), {}).get("name", "")
		var hl := UI.label("%s · %s · nivel %d · %s" % [m2.get("hero", ""), cls_name, int(m2.get("level", 1)), m2.get("place", "")], 17, UI.TEXT_DIM, UI.FONT_SC)
		col.add_child(hl)
	var items: Array = []
	if not saves.is_empty():
		items.append(["Nueva partida", "redo", _confirm_new_game])
		items.append(["Cargar partida", "book", _open_load])
	items.append(["Combates sueltos", "target", _open_encounters])
	for item in items:
		var b := UI.button(item[0], item[1], Vector2(440, 50))
		b.alignment = HORIZONTAL_ALIGNMENT_LEFT
		b.pressed.connect(item[2])
		col.add_child(b)
	var row := UI.hbox(8)
	for item in [["Guía", "book", _open_help], ["Ajustes", "menu", _open_settings], ["Créditos", "info", _open_credits]]:
		var b2 := UI.button(item[0], item[1], Vector2(141, 50))
		b2.pressed.connect(item[2])
		row.add_child(b2)
	col.add_child(row)
	var fill := Control.new()
	fill.size_flags_vertical = Control.SIZE_EXPAND_FILL
	col.add_child(fill)
	col.add_child(UI.label("Versión 0.3.1 · Compatible con la quinta edición", 15, UI.TEXT_DIM))
	UI.fade_in(self, 0.6)

# ================================================================== submenús

func _confirm_new_game() -> void:
	var v := UI.vbox(12)
	var r := UI.rich("Empezarás con un héroe nuevo. Tus partidas guardadas en ranuras se conservan; el guardado automático se sustituirá por el de la nueva partida.", 20)
	v.add_child(r)
	var b := UI.button("Crear un héroe nuevo", "redo", Vector2(0, 60))
	v.add_child(b)
	var m := Modal.open(self, "Nueva partida", v, 620, "Cancelar")
	b.pressed.connect(func():
		m.close()
		new_game.emit())

func _open_load() -> void:
	var ss := SaveScreen.new()
	ss.mode = "load"
	ss.loaded.connect(func(slot): load_slot.emit(slot))
	add_child(ss)

func _open_encounters() -> void:
	var v := UI.vbox(12)
	for enc_id in Game.ENCOUNTER_ORDER:
		var enc: Dictionary = RulesDB.encounters.get(enc_id, {})
		var unlocked := Game.is_unlocked(enc_id)
		var done: bool = enc_id in Game.progress.completed
		var b := Button.new()
		b.focus_mode = Control.FOCUS_NONE
		b.disabled = not unlocked
		b.custom_minimum_size = Vector2(0, 104) * Vector2(1, UI.scale_f())
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var h := UI.hbox(14)
		h.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		h.offset_left = 16
		h.offset_right = -16
		h.mouse_filter = Control.MOUSE_FILTER_IGNORE
		b.add_child(h)
		var num := UI.title(str(int(enc.get("order", 0))), 40)
		num.custom_minimum_size = Vector2(44, 0)
		num.mouse_filter = Control.MOUSE_FILTER_IGNORE
		if not unlocked:
			num.add_theme_color_override("font_color", UI.TEXT_DIM)
		h.add_child(num)
		var info := UI.vbox(2)
		info.alignment = BoxContainer.ALIGNMENT_CENTER
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info.mouse_filter = Control.MOUSE_FILTER_IGNORE
		var nm := UI.label(enc.get("name", enc_id), 23, UI.TEXT if unlocked else UI.TEXT_DIM, UI.FONT_BOLD)
		nm.mouse_filter = Control.MOUSE_FILTER_IGNORE
		info.add_child(nm)
		var sub := "%s · Nivel %d" % [enc.get("place", ""), int(enc.get("level", 1))]
		var sl := UI.label(sub, 16, UI.TEXT_DIM)
		sl.mouse_filter = Control.MOUSE_FILTER_IGNORE
		info.add_child(sl)
		h.add_child(info)
		var status := "Bloqueado"
		var sc := UI.TEXT_DIM
		if done:
			var br := int(Game.progress.best_rounds.get(enc_id, 0))
			status = "Superado · %d rondas" % br if br > 0 else "Superado"
			sc = UI.HEAL
		elif unlocked:
			status = "Disponible"
			sc = UI.GOLD
		var st := UI.label(status, 17, sc, UI.FONT_SC)
		st.mouse_filter = Control.MOUSE_FILTER_IGNORE
		st.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		h.add_child(st)
		var id: String = enc_id
		b.pressed.connect(func():
			Game.sfx("confirm", -6)
			play.emit(id))
		v.add_child(b)
	var note := UI.label("Los tres combates de la primera fase, sueltos y con tu último héroe. Cada uno desbloquea el siguiente.", 16, UI.TEXT_DIM)
	note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(note)
	Modal.open(self, "Combates sueltos", v, 760, "")

func _open_help() -> void:
	var r := UI.rich(HelpText.bbcode(), 19)
	r.mouse_filter = Control.MOUSE_FILTER_PASS
	Modal.open(self, "Cómo se juega", r, 840)

func _open_settings() -> void:
	var sp := SettingsPanel.new(false)
	var m := Modal.open(self, "Ajustes", sp, 720)
	# Reconstruye el menú por si cambió el tamaño del texto o el progreso
	m.closed.connect(func(): rebuild_requested.emit(), CONNECT_DEFERRED)

func _open_credits() -> void:
	var v := UI.vbox(12)
	var r := UI.rich(CreditsText.bbcode(), 18)
	r.mouse_filter = Control.MOUSE_FILTER_PASS
	v.add_child(r)
	var lic := UI.button("Ver la licencia de Godot Engine", "book", Vector2(0, 54))
	lic.pressed.connect(func():
		var t := RichTextLabel.new()
		t.bbcode_enabled = false
		t.fit_content = true
		t.scroll_active = false
		t.text = CreditsText.godot_license()
		t.add_theme_font_size_override("normal_font_size", UI.fs(14))
		t.add_theme_color_override("default_color", UI.TEXT_DIM)
		Modal.open(self, "Godot Engine", t, 820))
	v.add_child(lic)
	Modal.open(self, "Créditos", v, 840)
