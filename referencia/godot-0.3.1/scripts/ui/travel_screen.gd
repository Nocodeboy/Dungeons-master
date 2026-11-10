class_name TravelScreen
extends Control
## Mapa de viaje: pergamino con los lugares descubiertos y los caminos entre ellos.

signal travel(level: String, spawn: String, hours: int)
signal cancelled

var from := ""
var data: Dictionary = {}
var _map: Control
var _info: RichTextLabel
var _go: Button
var _sel := ""
var _rng := RandomNumberGenerator.new()
var _deco: Array = []

func setup(p_from: String) -> void:
	from = p_from
	var f := FileAccess.open("res://data/world.json", FileAccess.READ)
	data = JSON.parse_string(f.get_as_text()) if f else {}

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var bg := ColorRect.new()
	bg.color = Color(0.05, 0.04, 0.03)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var tex := TextureRect.new()
	tex.texture = load("res://assets/ui/parchment.jpg")
	tex.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex.stretch_mode = TextureRect.STRETCH_SCALE
	add_child(tex)
	_map = Control.new()
	_map.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_map.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_map.draw.connect(_draw_map)
	add_child(_map)
	_rng.seed = 11
	_make_deco()
	var title := UI.label(str(data.get("title", "Mapa")), 38, Color(0.25, 0.15, 0.07), UI.FONT_DECO)
	title.set_anchors_preset(Control.PRESET_CENTER_TOP)
	title.grow_horizontal = Control.GROW_DIRECTION_BOTH
	title.offset_top = 22
	add_child(title)
	for p in data.get("places", []):
		_add_pin(p)
	var panel := UI.panel("panel", 14)
	panel.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
	panel.grow_vertical = Control.GROW_DIRECTION_BEGIN
	panel.offset_left = 40
	panel.offset_right = -40
	panel.offset_bottom = -16
	add_child(panel)
	var h := UI.hbox(12)
	panel.add_child(h)
	_info = UI.rich("[color=#bfb3a0]Toca un lugar del mapa para viajar.[/color]", 19)
	_info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_info.fit_content = true
	h.add_child(_info)
	_go = UI.button("Viajar", "map", Vector2(170, 60))
	_go.disabled = true
	_go.pressed.connect(_travel)
	h.add_child(_go)
	var back := UI.button("Quedarse", "cross", Vector2(170, 60))
	back.pressed.connect(func(): cancelled.emit())
	h.add_child(back)
	UI.fade_in(self, 0.3)
	Game.sfx("book", -4)

func _place(id: String) -> Dictionary:
	for p in data.get("places", []):
		if p.id == id:
			return p
	return {}

func _pos(p: Dictionary) -> Vector2:
	var vs := get_viewport_rect().size
	return Vector2(float(p.pos[0]) * vs.x, float(p.pos[1]) * vs.y)

func _hours(a: String, b: String) -> int:
	for r in data.get("roads", []):
		if (r[0] == a and r[1] == b) or (r[0] == b and r[1] == a):
			return int(r[2])
	return 6

func _add_pin(p: Dictionary) -> void:
	var b := Button.new()
	b.flat = true
	b.focus_mode = Control.FOCUS_NONE
	b.icon = UI.icon(str(p.get("icon", "map")))
	b.expand_icon = true
	b.custom_minimum_size = Vector2(72, 72)
	var locked: bool = p.has("locked") or not (str(p.get("requires", "")).is_empty() or Game.campaign.flags.has(str(p.get("requires", ""))))
	b.modulate = Color(0.28, 0.17, 0.08) if not locked else Color(0.45, 0.38, 0.3, 0.75)
	b.position = _pos(p) - Vector2(36, 36)
	add_child(b)
	var l := UI.label(str(p.name), 22, Color(0.22, 0.13, 0.06) if not locked else Color(0.4, 0.32, 0.24), UI.FONT_TITLE)
	l.position = _pos(p) + Vector2(-110, 36)
	l.custom_minimum_size.x = 220
	l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(l)
	if str(p.id) == from:
		var you := UI.label("Estáis aquí", 16, Color(0.55, 0.1, 0.05), UI.FONT_SC)
		you.position = _pos(p) + Vector2(-60, -64)
		you.custom_minimum_size.x = 120
		you.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		you.mouse_filter = Control.MOUSE_FILTER_IGNORE
		add_child(you)
	var pid: String = p.id
	b.pressed.connect(func(): _select(pid))

func _select(id: String) -> void:
	Game.sfx("select", -6)
	var p := _place(id)
	_sel = ""
	_go.disabled = true
	if id == from:
		_info.text = "[b]%s[/b] — %s\n[color=#bfb3a0]Ya estáis aquí.[/color]" % [p.name, p.get("desc", "")]
		return
	if p.has("locked"):
		_info.text = "[b]%s[/b] — %s" % [p.name, p.locked]
		return
	var req: String = p.get("requires", "")
	if not req.is_empty() and not Game.campaign.flags.has(req):
		_info.text = "[b]%s[/b] — Todavía no hay motivo para ir allí." % p.name
		return
	var h := _hours(from, id)
	_info.text = "[b]%s[/b] — %s\n[color=#bfb3a0]Viaje: %d %s de camino.[/color]" % [p.name, p.get("desc", ""), h, "hora" if h == 1 else "horas"]
	_sel = id
	_go.disabled = false
	_map.queue_redraw()

func _travel() -> void:
	if _sel.is_empty():
		return
	var p := _place(_sel)
	travel.emit(str(p.level), str(p.get("spawn", "default")), _hours(from, _sel))

# ================================================================== dibujo del mapa

func _make_deco() -> void:
	# Bosques, colinas y montañas a mano alzada (posiciones relativas)
	for i in 70:
		_deco.append({"k": "tree", "p": Vector2(_rng.randf_range(0.5, 0.78), _rng.randf_range(0.18, 0.45))})
	for i in 25:
		_deco.append({"k": "tree", "p": Vector2(_rng.randf_range(0.08, 0.3), _rng.randf_range(0.2, 0.4))})
	for i in 14:
		_deco.append({"k": "hill", "p": Vector2(_rng.randf_range(0.15, 0.55), _rng.randf_range(0.7, 0.85))})
	for i in 9:
		_deco.append({"k": "mount", "p": Vector2(_rng.randf_range(0.7, 0.95), _rng.randf_range(0.12, 0.28))})

func _draw_map() -> void:
	var vs := get_viewport_rect().size
	var ink := Color(0.3, 0.19, 0.09, 0.85)
	var ink_l := Color(0.3, 0.19, 0.09, 0.45)
	# Río
	var river: Array = [Vector2(0.92, 0.0), Vector2(0.86, 0.3), Vector2(0.8, 0.62), Vector2(0.62, 0.8), Vector2(0.55, 1.0)]
	var pts := PackedVector2Array()
	for i in range(river.size() - 1):
		for k in 12:
			var t := k / 12.0
			pts.append((river[i] as Vector2).lerp(river[i + 1], t) * vs + Vector2(sin((i * 12 + k) * 0.7) * 6, 0))
	_map.draw_polyline(pts, Color(0.25, 0.38, 0.5, 0.75), 6.0, true)
	for d in _deco:
		var p: Vector2 = d.p * vs
		match d.k:
			"tree":
				_map.draw_colored_polygon(PackedVector2Array([p + Vector2(0, -16), p + Vector2(-8, 4), p + Vector2(8, 4)]), Color(0.25, 0.3, 0.13, 0.7))
				_map.draw_line(p + Vector2(0, 4), p + Vector2(0, 9), ink_l, 2)
			"hill":
				_map.draw_arc(p, 22, PI, TAU, 14, ink_l, 2.5)
			"mount":
				_map.draw_polyline(PackedVector2Array([p + Vector2(-30, 14), p + Vector2(0, -30), p + Vector2(30, 14)]), ink, 3)
				_map.draw_line(p + Vector2(0, -30), p + Vector2(8, 6), ink_l, 2)
	# Caminos
	for r in data.get("roads", []):
		var a := _place(str(r[0]))
		var b := _place(str(r[1]))
		if a.is_empty() or b.is_empty():
			continue
		var pa := _pos(a)
		var pb := _pos(b)
		var hl: bool = (r[0] == from and r[1] == _sel) or (r[1] == from and r[0] == _sel)
		var n := int(pa.distance_to(pb) / 18.0)
		for i in n:
			if i % 2 == 0:
				var t0 := float(i) / n
				var t1 := float(i + 1) / n
				var off := Vector2(0, sin(t0 * PI) * -20)
				_map.draw_line(pa.lerp(pb, t0) + off, pa.lerp(pb, t1) + Vector2(0, sin(t1 * PI) * -20), Color(0.6, 0.1, 0.05) if hl else ink, 4.0 if hl else 3.0)
	# Rosa de los vientos
	var c := Vector2(vs.x * 0.9, vs.y * 0.78)
	for k in 4:
		var a2 := k * PI / 2
		_map.draw_colored_polygon(PackedVector2Array([c, c + Vector2(cos(a2 - 0.25), sin(a2 - 0.25)) * 16, c + Vector2(cos(a2), sin(a2)) * 48, c + Vector2(cos(a2 + 0.25), sin(a2 + 0.25)) * 16]), ink if k % 2 == 0 else ink_l)
	_map.draw_string(UI.FONT_TITLE, c + Vector2(-8, -54), "N", HORIZONTAL_ALIGNMENT_LEFT, -1, 24, ink)
