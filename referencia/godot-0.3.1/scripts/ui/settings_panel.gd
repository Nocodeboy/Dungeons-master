class_name SettingsPanel
extends VBoxContainer
## Ajustes del juego. Se usa en el menú principal y en la pausa del combate.

signal reset_done

var in_battle := false

func _init(p_in_battle := false) -> void:
	in_battle = p_in_battle

func _ready() -> void:
	add_theme_constant_override("separation", int(10 * UI.scale_f()))
	size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_section("Ritmo")
	_segmented("Animaciones", [["Normales", 1.0], ["Rápidas", 2.0]], "anim_speed")
	_segmented("Turnos enemigos", [["Normales", 1.0], ["Rápidos", 1.5], ["Muy rápidos", 2.5]], "enemy_speed")
	_section("Combate")
	_segmented("Reacciones de tu grupo", [["Automáticas", "auto"], ["Nunca", "never"]], "reactions",
		"Ataques de oportunidad y el conjuro Escudo se usan solos cuando convienen.")
	_toggle("Mostrar las tiradas de dados", "dice_details")
	_toggle("Consejos durante el combate", "tips")
	_section("Accesibilidad")
	_segmented("Tamaño del texto", [["Normal", 1.0], ["Grande", 1.15], ["Muy grande", 1.3]], "text_scale",
		"Se aplica al cambiar de pantalla.")
	_toggle("Colores para daltonismo (aliados azules, enemigos naranjas)", "colorblind")
	_section("Gráficos")
	_segmented("Calidad", [["Baja", "low"], ["Media", "medium"], ["Alta", "high"]], "quality",
		"Baja: sin sombras, resplandor ni partículas, con la mitad de hierba y árboles sencillos, para móviles modestos o ahorrar batería. La hierba, los árboles y las partículas cambian al entrar en otra zona.")
	_section("Sonido")
	_slider("Música", "music_volume")
	_slider("Efectos", "sfx_volume")
	if not in_battle:
		_section("Partida")
		var b := UI.button("Borrar el progreso", "death", Vector2(0, 58))
		b.add_theme_color_override("font_color", Color(0.95, 0.6, 0.5))
		b.pressed.connect(_confirm_reset.bind(b))
		add_child(b)

func _section(text: String) -> void:
	var l := UI.label(text.to_upper(), 17, UI.GOLD, UI.FONT_SC)
	if get_child_count() > 0:
		var sp := Control.new()
		sp.custom_minimum_size = Vector2(0, 6)
		add_child(sp)
	add_child(l)
	var line := ColorRect.new()
	line.color = Color(UI.GOLD_DIM, 0.5)
	line.custom_minimum_size = Vector2(0, 1)
	add_child(line)

func _row(text: String, note := "") -> VBoxContainer:
	var v := UI.vbox(4)
	v.add_child(UI.label(text, 20))
	if not note.is_empty():
		var n := UI.label(note, 15, UI.TEXT_DIM)
		n.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		v.add_child(n)
	add_child(v)
	return v

func _segmented(text: String, options: Array, key: String, note := "") -> void:
	var v := _row(text, note)
	var h := UI.hbox(6)
	var group := ButtonGroup.new()
	var cur = Game.settings.get(key)
	for opt in options:
		var b := Button.new()
		b.text = opt[0]
		b.toggle_mode = true
		b.button_group = group
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(0, 54) * Vector2(1, UI.scale_f())
		b.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		b.add_theme_font_size_override("font_size", UI.fs(18))
		b.add_theme_stylebox_override("pressed", UI.stone("slab_selected", 8))
		b.add_theme_stylebox_override("normal", UI.stone("slab", 8))
		b.add_theme_stylebox_override("hover", UI.stone("slab_hover", 8))
		b.add_theme_stylebox_override("hover_pressed", UI.stone("slab_selected", 8))
		b.button_pressed = _same(cur, opt[1])
		var value = opt[1]
		b.toggled.connect(func(on: bool):
			if on:
				Game.sfx("toggle", -8)
				Game.set_setting(key, value))
		h.add_child(b)
	v.add_child(h)

func _same(a, b) -> bool:
	if typeof(a) in [TYPE_FLOAT, TYPE_INT] and typeof(b) in [TYPE_FLOAT, TYPE_INT]:
		return absf(float(a) - float(b)) < 0.01
	return a == b

func _toggle(text: String, key: String) -> void:
	var cb := CheckButton.new()
	cb.text = text
	cb.focus_mode = Control.FOCUS_NONE
	cb.button_pressed = bool(Game.settings.get(key, false))
	cb.add_theme_font_size_override("font_size", UI.fs(20))
	cb.custom_minimum_size = Vector2(0, 52) * Vector2(1, UI.scale_f())
	cb.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	cb.toggled.connect(func(on: bool):
		Game.sfx("toggle", -8)
		Game.set_setting(key, on))
	add_child(cb)

func _slider(text: String, key: String) -> void:
	var h := UI.hbox(12)
	var l := UI.label(text, 20)
	l.custom_minimum_size = Vector2(130, 0) * UI.scale_f()
	h.add_child(l)
	var s := HSlider.new()
	s.min_value = 0.0
	s.max_value = 1.0
	s.step = 0.05
	s.value = float(Game.settings.get(key, 0.8))
	s.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	s.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	s.custom_minimum_size = Vector2(0, 44)
	s.focus_mode = Control.FOCUS_NONE
	var pct := UI.label("%d%%" % int(round(s.value * 100)), 18, UI.TEXT_DIM)
	pct.custom_minimum_size = Vector2(60, 0)
	s.value_changed.connect(func(v: float):
		pct.text = "%d%%" % int(round(v * 100))
		Game.settings[key] = v
		if key == "music_volume":
			Game.set_setting(key, v))
	s.drag_ended.connect(func(_c):
		Game.set_setting(key, s.value)
		if key == "sfx_volume":
			Game.sfx("confirm"))
	h.add_child(s)
	h.add_child(pct)
	add_child(h)

func _confirm_reset(b: Button) -> void:
	if b.has_meta("armed"):
		Game.reset_progress()
		Game.sfx("back")
		b.text = "Progreso borrado"
		b.disabled = true
		reset_done.emit()
		return
	b.set_meta("armed", true)
	b.text = "Pulsa otra vez para confirmar"
	Game.sfx("error", -8)
