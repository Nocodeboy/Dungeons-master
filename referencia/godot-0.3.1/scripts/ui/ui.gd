class_name UI
extends Object
## Tema visual y utilidades para construir la interfaz por código.

const BG := Color(0.075, 0.062, 0.055, 0.94)
const BG_SOFT := Color(0.12, 0.10, 0.085, 0.92)
const BG_DARK := Color(0.04, 0.035, 0.03, 0.96)
const GOLD := Color(0.86, 0.70, 0.40)
const GOLD_DIM := Color(0.55, 0.44, 0.26)
const TEXT := Color(0.95, 0.91, 0.82)
const TEXT_DIM := Color(0.70, 0.65, 0.57)
const ALLY := Color(0.38, 0.66, 0.95)
const ENEMY := Color(0.88, 0.32, 0.26)
const HEAL := Color(0.45, 0.85, 0.45)
const MAGIC := Color(0.70, 0.55, 0.98)
const WARN := Color(0.98, 0.72, 0.25)

const FONT_BODY := preload("res://assets/fonts/Alegreya-400.woff")
const FONT_BOLD := preload("res://assets/fonts/Alegreya-700.woff")
const FONT_ITALIC := preload("res://assets/fonts/Alegreya-400-italic.woff")
const FONT_BOLD_ITALIC := preload("res://assets/fonts/Alegreya-700-italic.woff")
const FONT_SC := preload("res://assets/fonts/AlegreyaSC-700.woff")
const FONT_TITLE := preload("res://assets/fonts/Cinzel-700.woff")
const FONT_DECO := preload("res://assets/fonts/CinzelDecorative-700.woff")

## Piezas de piedra y bronce (assets/ui, generadas con tools/ui_textures/gen_ui.py):
## textura, márgenes del 9-slice y relleno interior por defecto.
const STONE := {
	"panel": ["res://assets/ui/panel.png", 28, 20],
	"glass": ["res://assets/ui/glass.png", 22, 12],
	"inset": ["res://assets/ui/inset.png", 10, 10],
	"slab": ["res://assets/ui/slab.png", 11, 12],
	"slab_hover": ["res://assets/ui/slab_hover.png", 11, 12],
	"slab_pressed": ["res://assets/ui/slab_pressed.png", 11, 12],
	"slab_disabled": ["res://assets/ui/slab_disabled.png", 11, 12],
	"slab_selected": ["res://assets/ui/slab_selected.png", 11, 12],
}

static var _theme: Theme
static var _icons: Dictionary = {}
static var _stone_cache: Dictionary = {}

## Cursiva real de Alegreya.
static func italic(bold := false) -> Font:
	return FONT_BOLD_ITALIC if bold else FONT_ITALIC

## Caja de piedra y bronce. `kind`: panel, glass, inset, slab, slab_hover, slab_pressed,
## slab_disabled o slab_selected. `pad` < 0 usa el relleno por defecto de la pieza.
static func stone(kind: String, pad := -1.0) -> StyleBoxTexture:
	var key := "%s|%s|%s" % [kind, pad, scale_f()]
	if _stone_cache.has(key):
		return _stone_cache[key]
	var spec: Array = STONE.get(kind, STONE.slab)
	var sb := StyleBoxTexture.new()
	sb.texture = load(spec[0])
	var m: int = spec[1]
	sb.texture_margin_left = m
	sb.texture_margin_right = m
	sb.texture_margin_top = m
	sb.texture_margin_bottom = m
	sb.axis_stretch_horizontal = StyleBoxTexture.AXIS_STRETCH_MODE_TILE_FIT
	sb.axis_stretch_vertical = StyleBoxTexture.AXIS_STRETCH_MODE_TILE_FIT
	var p: float = float(spec[2]) if pad < 0 else pad
	p = max(p, m * 0.55)
	sb.content_margin_left = p
	sb.content_margin_right = p
	sb.content_margin_top = p * 0.75
	sb.content_margin_bottom = p * 0.75
	_stone_cache[key] = sb
	return sb

## Aplica las losas de piedra a un botón (normal, encima, pulsado, desactivado).
## `selected` lo muestra como elegido (borde de bronce brillante).
static func stone_button(b: Button, selected := false, pad := -1.0) -> void:
	b.add_theme_stylebox_override("normal", stone("slab_selected" if selected else "slab", pad))
	b.add_theme_stylebox_override("hover", stone("slab_selected" if selected else "slab_hover", pad))
	b.add_theme_stylebox_override("pressed", stone("slab_pressed", pad))
	b.add_theme_stylebox_override("hover_pressed", stone("slab_pressed", pad))
	b.add_theme_stylebox_override("disabled", stone("slab_disabled", pad))
	b.add_theme_stylebox_override("focus", StyleBoxEmpty.new())

static func ally_color() -> Color:
	return Color(0.30, 0.75, 0.95) if Game.settings.get("colorblind", false) else ALLY

static func enemy_color() -> Color:
	return Color(0.98, 0.55, 0.10) if Game.settings.get("colorblind", false) else ENEMY

static func scale_f() -> float:
	return float(Game.settings.get("text_scale", 1.0))

static func fs(base: int) -> int:
	return int(round(base * scale_f()))

static func icon(name: String) -> Texture2D:
	if _icons.has(name):
		return _icons[name]
	var path := "res://assets/icons/%s.svg" % name
	var tex: Texture2D = load(path) if ResourceLoader.exists(path) else null
	if tex == null and name != "magic":
		tex = icon("magic")
	_icons[name] = tex
	return tex

static func box(bg: Color, border: Color = GOLD_DIM, radius := 12, bw := 2, pad := 10) -> StyleBoxFlat:
	# Esquinas casi rectas (piedra tallada); los círculos (radio grande) se respetan
	if radius < 20:
		radius = min(radius, 3)
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.border_color = border
	sb.set_border_width_all(bw)
	sb.set_corner_radius_all(radius)
	sb.content_margin_left = pad
	sb.content_margin_right = pad
	sb.content_margin_top = pad * 0.7
	sb.content_margin_bottom = pad * 0.7
	sb.shadow_color = Color(0, 0, 0, 0.45)
	sb.shadow_size = 6
	sb.anti_aliasing = true
	return sb

static func theme() -> Theme:
	if _theme != null:
		return _theme
	var t := Theme.new()
	t.default_font = FONT_BODY
	t.default_font_size = fs(22)
	t.set_color("font_color", "Label", TEXT)
	t.set_color("font_color", "RichTextLabel", TEXT)
	t.set_color("default_color", "RichTextLabel", TEXT)
	t.set_font("normal_font", "RichTextLabel", FONT_BODY)
	t.set_font("bold_font", "RichTextLabel", FONT_BOLD)
	t.set_font("italics_font", "RichTextLabel", italic())
	t.set_font("bold_italics_font", "RichTextLabel", italic(true))
	t.set_font_size("normal_font_size", "RichTextLabel", fs(21))
	t.set_font_size("bold_font_size", "RichTextLabel", fs(21))
	t.set_font_size("italics_font_size", "RichTextLabel", fs(21))
	t.set_font_size("bold_italics_font_size", "RichTextLabel", fs(21))
	# Botones
	t.set_font("font", "Button", FONT_BOLD)
	t.set_font_size("font_size", "Button", fs(22))
	t.set_color("font_color", "Button", TEXT)
	t.set_color("font_hover_color", "Button", Color(1, 0.95, 0.82))
	t.set_color("font_pressed_color", "Button", GOLD)
	t.set_color("font_disabled_color", "Button", Color(0.5, 0.47, 0.42))
	t.set_color("icon_normal_color", "Button", TEXT)
	t.set_color("icon_disabled_color", "Button", Color(0.45, 0.42, 0.38))
	t.set_stylebox("normal", "Button", stone("slab"))
	t.set_stylebox("hover", "Button", stone("slab_hover"))
	t.set_stylebox("pressed", "Button", stone("slab_pressed"))
	t.set_stylebox("hover_pressed", "Button", stone("slab_pressed"))
	t.set_stylebox("disabled", "Button", stone("slab_disabled"))
	t.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	t.set_color("font_outline_color", "Button", Color(0, 0, 0, 0.75))
	t.set_constant("outline_size", "Button", 3)
	# Paneles
	t.set_stylebox("panel", "PanelContainer", stone("panel"))
	t.set_stylebox("panel", "Panel", stone("panel"))
	# Campos de texto
	t.set_stylebox("normal", "LineEdit", stone("inset", 12))
	t.set_stylebox("focus", "LineEdit", stone("inset", 12))
	t.set_font("font", "LineEdit", FONT_BODY)
	# Barras
	var bar_bg := box(Color(0.08, 0.06, 0.05, 0.9), Color(0, 0, 0, 0.6), 6, 1, 0)
	var bar_fg := box(Color(0.75, 0.18, 0.15), Color(0, 0, 0, 0), 6, 0, 0)
	t.set_stylebox("background", "ProgressBar", bar_bg)
	t.set_stylebox("fill", "ProgressBar", bar_fg)
	t.set_font_size("font_size", "ProgressBar", fs(14))
	# Desplazamiento
	t.set_stylebox("panel", "ScrollContainer", StyleBoxEmpty.new())
	var grab := box(GOLD_DIM, Color(0, 0, 0, 0), 6, 0, 0)
	t.set_stylebox("grabber", "VScrollBar", grab)
	t.set_stylebox("grabber_highlight", "VScrollBar", grab)
	t.set_stylebox("grabber_pressed", "VScrollBar", grab)
	t.set_stylebox("scroll", "VScrollBar", box(Color(0, 0, 0, 0.25), Color(0, 0, 0, 0), 6, 0, 0))
	# Deslizadores y casillas
	t.set_stylebox("slider", "HSlider", box(Color(0.2, 0.17, 0.14), Color(0, 0, 0, 0), 6, 0, 3))
	t.set_stylebox("grabber_area", "HSlider", box(GOLD_DIM, Color(0, 0, 0, 0), 6, 0, 3))
	t.set_stylebox("grabber_area_highlight", "HSlider", box(GOLD, Color(0, 0, 0, 0), 6, 0, 3))
	t.set_font_size("font_size", "CheckButton", fs(22))
	t.set_color("font_color", "CheckButton", TEXT)
	t.set_font_size("font_size", "OptionButton", fs(22))
	_theme = t
	return t

static func reset_theme() -> void:
	_theme = null
	_stone_cache.clear()

# ------------------------------------------------------------------ fábricas

static func label(text: String, size := 22, color := TEXT, font: Font = null) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", fs(size))
	l.add_theme_color_override("font_color", color)
	if font != null:
		l.add_theme_font_override("font", font)
	return l

static func title(text: String, size := 40) -> Label:
	var l := label(text, size, GOLD, FONT_TITLE)
	l.add_theme_color_override("font_shadow_color", Color(0, 0, 0, 0.7))
	l.add_theme_constant_override("shadow_offset_x", 2)
	l.add_theme_constant_override("shadow_offset_y", 3)
	return l

static func rich(bbcode: String, size := 21) -> RichTextLabel:
	var r := RichTextLabel.new()
	r.bbcode_enabled = true
	r.fit_content = true
	r.scroll_active = false
	r.text = bbcode
	r.add_theme_font_size_override("normal_font_size", fs(size))
	r.add_theme_font_size_override("bold_font_size", fs(size))
	r.add_theme_font_size_override("italics_font_size", fs(size))
	r.add_theme_font_size_override("bold_italics_font_size", fs(size))
	r.add_theme_font_override("italics_font", italic())
	r.add_theme_font_override("bold_italics_font", italic(true))
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

static func button(text: String, icon_name := "", min_size := Vector2(0, 64)) -> Button:
	var b := Button.new()
	b.text = text
	if not icon_name.is_empty():
		b.icon = icon(icon_name)
		# Con texto, el icono no se expande: así cuenta en el ancho mínimo y nunca desaparece
		b.expand_icon = text.is_empty()
		b.add_theme_constant_override("icon_max_width", int(36 * scale_f()))
	b.custom_minimum_size = min_size * Vector2(1, scale_f())
	b.focus_mode = Control.FOCUS_NONE
	b.pressed.connect(func(): Game.sfx("click", -6.0))
	return b

## Botón cuadrado con icono grande y texto pequeño debajo (barra de acciones).
static func action_button(text: String, icon_name: String, size := 92) -> Button:
	var b := Button.new()
	b.custom_minimum_size = Vector2(size, size) * scale_f()
	b.focus_mode = Control.FOCUS_NONE
	b.icon = icon(icon_name)
	b.expand_icon = true
	b.icon_alignment = HORIZONTAL_ALIGNMENT_CENTER
	b.vertical_icon_alignment = VERTICAL_ALIGNMENT_TOP
	b.text = text
	b.add_theme_font_size_override("font_size", fs(15))
	b.add_theme_constant_override("icon_max_width", int(size * 0.48 * scale_f()))
	b.clip_text = true
	b.pressed.connect(func(): Game.sfx("click", -6.0))
	return b

static func icon_rect(icon_name: String, size := 28, color := TEXT) -> TextureRect:
	var r := TextureRect.new()
	r.texture = icon(icon_name)
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.custom_minimum_size = Vector2(size, size) * scale_f()
	r.modulate = color
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

## Panel de piedra. `kind`: panel (marco de bronce), glass (marco con fondo translúcido),
## inset (piedra hundida) o una losa (slab, slab_selected...).
static func panel(kind := "panel", pad := -1.0) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", stone(kind, pad))
	return p

## Separador ornamental de bronce.
static func divider(width := 0) -> TextureRect:
	var r := TextureRect.new()
	r.texture = load("res://assets/ui/divider.png")
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_SCALE
	r.custom_minimum_size = Vector2(width, 14)
	r.size_flags_horizontal = Control.SIZE_EXPAND_FILL if width == 0 else Control.SIZE_SHRINK_CENTER
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r

static func hbox(sep := 8) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", int(sep * scale_f()))
	return h

static func vbox(sep := 8) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", int(sep * scale_f()))
	return v

static func hp_bar(width := 160, height := 16) -> ProgressBar:
	var pb := ProgressBar.new()
	pb.custom_minimum_size = Vector2(width, height) * scale_f()
	pb.show_percentage = false
	pb.min_value = 0
	pb.max_value = 100
	return pb

static func set_bar_color(pb: ProgressBar, c: Color) -> void:
	var sb := box(c, Color(0, 0, 0, 0), 6, 0, 0)
	pb.add_theme_stylebox_override("fill", sb)

static func hp_color(ratio: float) -> Color:
	if ratio > 0.6:
		return Color(0.38, 0.72, 0.30)
	if ratio > 0.3:
		return Color(0.88, 0.66, 0.20)
	return Color(0.85, 0.22, 0.16)

static func fade_in(c: CanvasItem, t := 0.25) -> void:
	c.modulate.a = 0.0
	var tw := c.create_tween()
	tw.tween_property(c, "modulate:a", 1.0, t)
