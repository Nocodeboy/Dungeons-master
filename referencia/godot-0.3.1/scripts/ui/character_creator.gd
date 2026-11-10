class_name CharacterCreator
extends Control
## Creador de personajes: clase, especie, trasfondo, características, habilidades, rasgos,
## conjuros, equipo, aspecto y nombre. Cada paso llega con una elección recomendada ya hecha,
## así que se puede avanzar pulsando «Siguiente» o afinar todo al detalle.

signal finished(sheet: Dictionary)
signal cancelled

const STEP_TITLES := {
	"class": "Clase", "species": "Especie", "background": "Trasfondo", "abilities": "Características",
	"skills": "Habilidades", "options": "Rasgos", "spells": "Conjuros", "equipment": "Equipo",
	"look": "Aspecto", "identity": "Nombre",
}
const STEP_HINTS := {
	"class": "Tu clase decide cómo luchas y qué papel tienes en el grupo.",
	"species": "Tu especie te da rasgos innatos: visión, resistencias, magia o tamaño.",
	"background": "Lo que hacías antes de la aventura: mejora tres características y te da una dote y dos habilidades.",
	"abilities": "Reparte tus puntuaciones. ★ marca las características que más importan a tu clase.",
	"skills": "Las habilidades en las que tienes competencia suman tu bonificador (+2) a esas pruebas.",
	"options": "Elecciones propias de tu clase a nivel 1.",
	"spells": "Trucos (a voluntad) y conjuros preparados de nivel 1. Puedes cambiarlos al subir de nivel.",
	"equipment": "Elige el equipo inicial de tu clase. El oro sobrante se guarda para la aventura.",
	"look": "Elige atuendo, rostro y colores. Arrastra la figura para girarla.",
	"identity": "Ponle nombre a tu héroe y repasa la hoja antes de empezar.",
	"advance": "Lo que ganas al subir de nivel. Las elecciones nuevas vienen recomendadas; cámbialas si quieres.",
}
## Elecciones guardadas en la hoja (lo demás se deriva al completarla).
const CHOICE_KEYS := ["lineage", "ancestry", "size", "lineage_ability", "background", "base_abilities", "bg_bonus",
	"fighting_style", "divine_order", "primal_order", "kit", "masteries", "skills", "expertise", "cantrips",
	"prepared", "magic_initiate", "invocations", "tome_cantrips", "pact_weapon"]
## Al cambiar de clase se rehacen estas elecciones.
const CLASS_KEYS := ["subclass", "fighting_style", "divine_order", "primal_order", "kit", "masteries", "skills",
	"expertise", "cantrips", "prepared", "invocations", "metamagic", "wild_shapes", "land", "hunters_prey",
	"tome_cantrips", "pact_weapon", "lessons_feat", "magic_initiate", "bg_bonus"]
const CLASS_ICONS := {
	"barbarian": "rage", "bard": "lyre", "cleric": "ankh", "druid": "wild_shape", "fighter": "melee", "monk": "fist",
	"paladin": "sacred_weapon", "ranger": "ranged", "rogue": "hide", "sorcerer": "sorcery", "warlock": "eldritch", "wizard": "book",
}
const SPECIES_ICONS := {
	"human": "footsteps", "elf": "nature", "half_elf": "faerie", "half_orc": "fist", "dwarf": "melee", "halfling": "dodging", "gnome": "arcane",
	"dragonborn": "dragon_breath", "goliath": "growth", "orc": "rage", "tiefling": "fire",
}
const BODY_OPTIONS := [["knight", "Armadura"], ["barbarian", "Pieles"], ["mage", "Túnica"], ["rogue", "Explorador"], ["rogue_hooded", "Encapuchado"]]
const HEAD_OPTIONS := [["knight", "Pelo corto"], ["barbarian", "Rapado y barba"], ["mage", "Arcano"], ["rogue", "Melena"], ["rogue_hooded", "Capucha"]]
const HAT_BODIES := {"knight": "Yelmo", "barbarian": "Gorro de pieles", "mage": "Sombrero"}
const HAIR_COLORS := ["#1e1a17", "#3b2a1e", "#5a3a22", "#8a5a2b", "#b5783a", "#d8b070", "#e8e0c8", "#9a9a9a", "#a0461e", "#c86a2a", "#2e3a5a", "#4a6a3a"]
const CLOTH_COLORS := ["#3f5f9a", "#8a2a2a", "#3a6a4a", "#5a3a8a", "#c8b070", "#2a2a3a", "#7a4a2a", "#2f6c73", "#a41a5a", "#d4dbde", "#b45829", "#4a5155"]
const PRONOUNS := [["m", "Él"], ["f", "Ella"], ["n", "Elle"]]
const LIST_NAMES := {"cleric": "Clérigo", "druid": "Druida", "wizard": "Mago"}

var sheet: Dictionary = {}
var level := 1
var mode := "create"          ## "create" | "levelup"
var _old_skills: Array = []
var _old_expertise: Array = []
var steps: Array = []
var step := 0
var _full_cache: Dictionary = {}
var _bg_chosen := false
var _abilities_touched := false
var _look_touched := false
var _rng := RandomNumberGenerator.new()

var _preview: HeroPreview
var _hero_name: Label
var _hero_sub: Label
var _hero_stats: RichTextLabel
var _step_bar: HBoxContainer
var _step_title: Label
var _step_hint: Label
var _scroll: ScrollContainer
var _content: VBoxContainer
var _back_btn: Button
var _next_btn: Button

# ================================================================== montaje

func _ready() -> void:
	_rng.randomize()
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	if sheet.is_empty():
		sheet = {"class": "fighter", "species": "human", "ability_method": "standard", "pronoun": "m", "visual": {}}
		_set_class("fighter", true)
		sheet["name"] = CharacterSheet.random_name("human", "m", _rng)
	_build_layout()
	_compute_steps()
	_show_step(0)
	UI.fade_in(self, 0.35)

func _build_layout() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.045, 0.038, 0.033, 1.0)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bg.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(bg)
	var glow := TextureRect.new()
	var gt := GradientTexture2D.new()
	var g := Gradient.new()
	g.set_color(0, Color(0.32, 0.22, 0.12, 0.55))
	g.set_color(1, Color(0.045, 0.038, 0.033, 0.0))
	gt.gradient = g
	gt.fill = GradientTexture2D.FILL_RADIAL
	gt.fill_from = Vector2(0.5, 0.5)
	gt.fill_to = Vector2(1.0, 0.5)
	gt.width = 256
	gt.height = 256
	glow.texture = gt
	glow.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	glow.stretch_mode = TextureRect.STRETCH_SCALE
	glow.anchor_right = 0.42
	glow.anchor_bottom = 1.0
	glow.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(glow)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 14)
	add_child(margin)
	var col := UI.vbox(10)
	margin.add_child(col)
	# Barra superior: salir, título y pasos
	var top := UI.hbox(10)
	col.add_child(top)
	var x := UI.button("", "cross", Vector2(52, 52))
	x.tooltip_text = "Volver al menú"
	x.pressed.connect(func(): cancelled.emit())
	top.add_child(x)
	var t := UI.title("Subida de nivel" if mode == "levelup" else "Crea tu héroe", 28)
	t.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	top.add_child(t)
	var bar_scroll := ScrollContainer.new()
	bar_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	bar_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_SHOW_NEVER
	bar_scroll.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bar_scroll.custom_minimum_size = Vector2(0, 52 * UI.scale_f())
	top.add_child(bar_scroll)
	_step_bar = UI.hbox(6)
	_step_bar.alignment = BoxContainer.ALIGNMENT_END
	_step_bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bar_scroll.add_child(_step_bar)
	# Cuerpo: vista del héroe a la izquierda, paso a la derecha
	var body := UI.hbox(12)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	col.add_child(body)
	var left := UI.panel("panel", 10)
	left.custom_minimum_size = Vector2(360 * UI.scale_f(), 0)
	body.add_child(left)
	var lv := UI.vbox(4)
	left.add_child(lv)
	_preview = HeroPreview.new()
	_preview.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_preview.custom_minimum_size = Vector2(0, 220)
	lv.add_child(_preview)
	_hero_name = UI.title("", 24)
	_hero_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hero_name.clip_text = true
	lv.add_child(_hero_name)
	_hero_sub = UI.label("", 16, UI.TEXT_DIM, UI.FONT_SC)
	_hero_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hero_sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	lv.add_child(_hero_sub)
	_hero_stats = UI.rich("", 16)
	lv.add_child(_hero_stats)
	var right := UI.panel("panel", 16)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(right)
	var rv := UI.vbox(6)
	right.add_child(rv)
	_step_title = UI.title("", 30)
	rv.add_child(_step_title)
	_step_hint = UI.label("", 17, UI.TEXT_DIM)
	_step_hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	rv.add_child(_step_hint)
	_scroll = ScrollContainer.new()
	_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rv.add_child(_scroll)
	_content = UI.vbox(10)
	_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_scroll.add_child(_content)
	var nav := UI.hbox(10)
	rv.add_child(nav)
	_back_btn = UI.button("Atrás", "undo", Vector2(170, 58))
	_back_btn.pressed.connect(func(): _show_step(step - 1))
	nav.add_child(_back_btn)
	var sp := Control.new()
	sp.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	nav.add_child(sp)
	_next_btn = UI.button("Siguiente", "check", Vector2(240, 58))
	_next_btn.pressed.connect(_on_next)
	nav.add_child(_next_btn)

func _compute_steps() -> void:
	if mode == "levelup":
		steps = ["advance"]
		if _lvl_has_options():
			steps.append("options")
		if not _cd().get("casting", {}).is_empty():
			steps.append("spells")
		return
	steps = ["class", "species", "background", "abilities", "skills"]
	if _has_options():
		steps.append("options")
	if _has_spells():
		steps.append("spells")
	steps.append_array(["equipment", "look", "identity"])

func _has_options() -> bool:
	var cd := _cd()
	if CharacterSheet.fighting_style_level(sheet.class) <= level:
		return true
	if not cd.get("orders", {}).is_empty():
		return true
	if int(RulesDB.at_level(cd.get("mastery_count", {}), level, 0)) > 0:
		return true
	if int(RulesDB.at_level(cd.get("invocation_count", {}), level, 0)) > 0:
		return true
	return false

func _has_spells() -> bool:
	return not _cd().get("casting", {}).is_empty() or "magic_initiate" in sheet.get("feats", [])

## Subida de nivel: mismas piezas que el creador, solo con lo que cambia a ese nivel.
func setup_level_up(hero: Dictionary, lvl: int) -> void:
	mode = "levelup"
	level = clamp(lvl, 2, CharacterSheet.MAX_LEVEL)
	sheet = hero.duplicate(true)
	_bg_chosen = true
	_abilities_touched = true
	_look_touched = true
	_old_skills = sheet.get("skills", []).duplicate()
	_old_expertise = CharacterSheet.expertise_list(sheet, level - 1).duplicate()
	var full := CharacterSheet.complete(sheet, level)
	for k in ["subclass", "land", "hunters_prey", "metamagic", "fighting_style", "lessons_feat", "tome_cantrips", "pact_weapon", "wild_shapes", "cantrips"]:
		if full.has(k) and not sheet.has(k):
			sheet[k] = full[k]
	sheet["skills"] = full.get("skills", []).duplicate()
	sheet["expertise"] = full.get("expertise", []).duplicate()
	var prep = sheet.get("prepared", {})
	if typeof(prep) == TYPE_ARRAY:
		prep = {"1": prep}
	if full.has("prepared") and not prep.has(str(level)):
		prep[str(level)] = full.prepared.get(str(level), []).duplicate()
	sheet["prepared"] = prep
	if full.has("invocations"):
		var inv = sheet.get("invocations", {})
		if typeof(inv) == TYPE_ARRAY:
			inv = {"1": inv}
		if not inv.has(str(level)):
			inv[str(level)] = full.invocations.get(str(level), []).duplicate()
		sheet["invocations"] = inv
	_full_cache = {}

func _lvl_has_options() -> bool:
	var cd := _cd()
	var cls: String = sheet.get("class", "")
	if CharacterSheet.fighting_style_level(cls) == level:
		return true
	if cls == "sorcerer" and level == 2:
		return true
	if int(RulesDB.at_level(cd.get("invocation_count", {}), level, 0)) > int(RulesDB.at_level(cd.get("invocation_count", {}), level - 1, 0)):
		return true
	if CharacterSheet.expertise_count(sheet, level) > CharacterSheet.expertise_count(sheet, level - 1):
		return true
	return false

## Solo para pruebas: fija clase, especie y paso.
func debug_setup(cls: String, species: String, step_i: int) -> void:
	_set_class(cls)
	_set_species(species)
	sheet["name"] = CharacterSheet.random_name(species, "f", _rng)
	_compute_steps()
	_changed(false)
	_show_step(step_i)

# ================================================================== datos y cambios

func _cd() -> Dictionary:
	return RulesDB.classes.get(sheet.get("class", "fighter"), {})

func _spd() -> Dictionary:
	return RulesDB.species.get(sheet.get("species", "human"), {})

func _bgd() -> Dictionary:
	return RulesDB.backgrounds.get(sheet.get("background", ""), {})

## Hoja completa (con lo recomendado en lo que falte), en caché hasta el siguiente cambio.
func _full() -> Dictionary:
	if _full_cache.is_empty():
		_full_cache = CharacterSheet.complete(sheet, level)
	return _full_cache

## Rellena en la hoja las elecciones que falten con las recomendadas.
func _refill() -> void:
	_full_cache = {}
	_sync_feats()
	var full := _full()
	for k in CHOICE_KEYS:
		if not sheet.has(k) and full.has(k):
			sheet[k] = full[k].duplicate(true) if typeof(full[k]) in [TYPE_DICTIONARY, TYPE_ARRAY] else full[k]
	_full_cache = {}

func _changed(rebuild := true) -> void:
	_refill()
	if _preview == null:
		return   # sin interfaz (pruebas)
	_update_side()
	if rebuild:
		_rebuild_step()

func _set_class(cid: String, force := false) -> void:
	if cid == sheet.get("class", "") and not force:
		return
	sheet["class"] = cid
	for k in CLASS_KEYS:
		sheet.erase(k)
	var cd := _cd()
	if not _bg_chosen:
		sheet["background"] = CharacterSheet.DEFAULT_BACKGROUND.get(cid, "soldier")
		sheet.erase("skills")
	if not _abilities_touched or sheet.get("ability_method", "standard") == "standard":
		sheet["ability_method"] = "standard"
		sheet["base_abilities"] = cd.get("std_array", {}).duplicate()
		_abilities_touched = false
	elif sheet.get("ability_method", "") == "roll":
		_assign_rolls()
	if not _look_touched:
		var model: String = cd.get("visual", {}).get("model", "knight")
		var v: Dictionary = sheet.get("visual", {})
		v["model"] = model
		v["head"] = "rogue" if model == "rogue_hooded" else model
		v["hat"] = false
		v["cape"] = true
		if not v.has("cloth"):
			v["cloth"] = CLOTH_COLORS[0]
		sheet["visual"] = v
	_refill()

func _set_species(sid: String) -> void:
	if sid == sheet.get("species", ""):
		return
	sheet["species"] = sid
	for k in ["lineage", "ancestry", "size", "lineage_ability", "skills", "expertise", "human_feat", "magic_initiate"]:
		sheet.erase(k)
	var v: Dictionary = sheet.get("visual", {})
	var skins: Array = _spd().get("visual", {}).get("skins", [])
	if sid == "dragonborn":
		v.erase("skin")
		# Un linaje vistoso por defecto (el negro apenas se distingue en el tablero)
		var showy := ["red", "gold", "blue", "green", "silver", "bronze"]
		sheet["ancestry"] = showy[_rng.randi() % showy.size()]
	elif not skins.is_empty() and not v.get("skin", "") in skins:
		v["skin"] = skins[_rng.randi() % min(3, skins.size())]
	if not _look_touched:
		v["head"] = "barbarian" if sid == "dwarf" else ("rogue" if v.get("model", "") == "rogue_hooded" else v.get("model", "knight"))
	sheet["visual"] = v
	_refill()

func _set_background(bid: String) -> void:
	if bid == sheet.get("background", ""):
		return
	sheet["background"] = bid
	_bg_chosen = true
	for k in ["bg_bonus", "skills", "expertise", "magic_initiate"]:
		sheet.erase(k)
	_refill()

## Dotes de origen: la del trasfondo y, si es humano, la elegida por Versátil.
func _sync_feats() -> void:
	var bg_feat: String = _bgd().get("feat", "")
	var feats: Array = [bg_feat] if not bg_feat.is_empty() else []
	if _spd().get("extra_origin_feat", false):
		var hf: String = sheet.get("human_feat", "")
		if hf.is_empty() or hf == bg_feat or not hf in CharacterSheet.origin_feats():
			hf = "skilled" if bg_feat != "skilled" else "alert"
			sheet["human_feat"] = hf
		feats.append(hf)
	else:
		sheet.erase("human_feat")
	if sheet.get("feats", []) != feats:
		sheet["feats"] = feats
		_full_cache = {}

# ================================================================== pasos

func _show_step(i: int) -> void:
	_compute_steps()
	step = clamp(i, 0, steps.size() - 1)
	var sid: String = steps[step]
	_step_title.text = STEP_TITLES.get(sid, sid)
	if sid == "advance":
		_step_title.text = "Nivel %d" % level
	_step_hint.text = STEP_HINTS.get(sid, "")
	if mode == "levelup":
		match sid:
			"options":
				_step_hint.text = "Elecciones nuevas de tu clase a nivel %d." % level
			"spells":
				_step_hint.text = "Al subir de nivel preparas más conjuros y puedes cambiar los que ya tenías."
	_preview.set_close(sid == "look")
	_rebuild_step(false)
	_scroll.scroll_vertical = 0
	_update_side()

func _rebuild_step(keep_scroll := true) -> void:
	var prev := _scroll.scroll_vertical
	for ch in _content.get_children():
		ch.queue_free()
	match steps[step]:
		"class":
			_build_class()
		"species":
			_build_species()
		"background":
			_build_background()
		"abilities":
			_build_abilities()
		"skills":
			_build_skills()
		"options":
			_build_options()
		"spells":
			_build_spells()
		"equipment":
			_build_equipment()
		"look":
			_build_look()
		"identity":
			_build_identity()
		"advance":
			_build_advance()
	_update_step_bar()
	_back_btn.disabled = step == 0
	var last := step == steps.size() - 1
	_next_btn.text = ("Continuar" if mode == "levelup" else "Comenzar la aventura") if last else "Siguiente"
	_next_btn.icon = UI.icon("attack" if last else "check")
	if last:
		_next_btn.disabled = not _issues().is_empty()
	else:
		_next_btn.disabled = false
	if keep_scroll:
		await get_tree().process_frame
		_scroll.scroll_vertical = prev

func _update_step_bar() -> void:
	for ch in _step_bar.get_children():
		ch.queue_free()
	var issues := _issues_by_step()
	for i in steps.size():
		var sid: String = steps[i]
		var b := Button.new()
		b.text = "%d · %s" % [i + 1, ("Nivel %d" % level) if sid == "advance" else STEP_TITLES.get(sid, sid)]
		b.focus_mode = Control.FOCUS_NONE
		b.custom_minimum_size = Vector2(0, 46 * UI.scale_f())
		b.add_theme_font_size_override("font_size", UI.fs(16))
		var cur := i == step
		var warn: bool = issues.has(sid)
		UI.stone_button(b, cur, 8)
		if warn and not cur:
			b.add_theme_color_override("font_color", UI.WARN)
		var idx := i
		b.pressed.connect(func():
			Game.sfx("click", -8)
			_show_step(idx))
		_step_bar.add_child(b)

func _on_next() -> void:
	if step < steps.size() - 1:
		Game.sfx("confirm", -8)
		_show_step(step + 1)
		return
	if not _issues().is_empty():
		return
	Game.sfx("confirm", -4)
	finished.emit(result_sheet())

## Hoja final que se guarda: solo elecciones, sin campos internos.
func result_sheet() -> Dictionary:
	var out: Dictionary = sheet.duplicate(true)
	out["id"] = "hero"
	out["is_hero"] = true
	out["name"] = str(out.get("name", "")).strip_edges()
	var v: Dictionary = out.get("visual", {})
	v["hero"] = true
	out["visual"] = v
	out["ai"] = _cd().get("ai", "frontline")
	out["choices_level"] = level
	return out

# ================================================================== problemas pendientes

func _issues_by_step() -> Dictionary:
	if mode == "levelup":
		return _issues_level_up()
	var out := {}
	var full := _full()
	var need := CharacterSheet.required_skills(full, level)
	if sheet.get("skills", []).size() < need:
		out["skills"] = "Te faltan %d habilidades por elegir." % (need - sheet.get("skills", []).size())
	elif not _skills_feasible(sheet.get("skills", [])):
		out["skills"] = "Esa combinación de habilidades no encaja con lo que te dan tu clase y tu especie."
	var ecount := CharacterSheet.expertise_count(full, level)
	if ecount > 0 and sheet.get("expertise", []).size() < ecount:
		out["skills"] = "Elige %d habilidades para tu pericia." % ecount
	if sheet.get("ability_method", "") == "point_buy" and CharacterSheet.point_buy_spent(sheet.base_abilities) > CharacterSheet.POINT_BUY_TOTAL:
		out["abilities"] = "Has gastado más de 27 puntos."
	var cast: Dictionary = _cd().get("casting", {})
	if not cast.is_empty():
		var nc := _cantrip_count()
		var np := int(RulesDB.at_level(cast.get("prepared", {}), level, 0))
		if sheet.get("cantrips", []).size() < nc or _prepared().size() < np:
			out["spells"] = "Te quedan conjuros por elegir."
	if "magic_initiate" in sheet.get("feats", []):
		var mi: Dictionary = sheet.get("magic_initiate", {})
		if mi.get("cantrips", []).size() < 2 or str(mi.get("spell", "")).is_empty():
			out["spells"] = "Elige los conjuros de Iniciado en la magia."
	var mc := int(RulesDB.at_level(_cd().get("mastery_count", {}), level, 0))
	if mc > 0 and sheet.get("masteries", []).size() < mc:
		out["options"] = "Elige %d maestrías con armas." % mc
	var ic := int(RulesDB.at_level(_cd().get("invocation_count", {}), level, 0))
	if ic > 0 and _invocations().size() < ic:
		out["options"] = "Elige tu invocación sobrenatural."
	if str(sheet.get("name", "")).strip_edges().is_empty():
		out["identity"] = "Falta el nombre."
	return out

func _issues_level_up() -> Dictionary:
	var out := {}
	var full := _full()
	var need := CharacterSheet.required_skills(full, level)
	if sheet.get("skills", []).size() < need:
		out["advance"] = "Elige %d habilidades nuevas." % (need - sheet.get("skills", []).size())
	var ecount := CharacterSheet.expertise_count(full, level)
	if ecount > 0 and sheet.get("expertise", []).size() < ecount:
		out["options"] = "Elige tu pericia nueva."
	if sheet.get("class", "") == "sorcerer" and sheet.get("metamagic", []).size() < 2:
		out["options"] = "Elige dos opciones de metamagia."
	var ic := int(RulesDB.at_level(_cd().get("invocation_count", {}), level, 0))
	if ic > 0 and _invocations().size() < ic:
		out["options"] = "Te quedan invocaciones por elegir."
	var cast: Dictionary = _cd().get("casting", {})
	if not cast.is_empty():
		var np := int(RulesDB.at_level(cast.get("prepared", {}), level, 0))
		if sheet.get("cantrips", []).size() < _cantrip_count() or _prepared().size() < np:
			out["spells"] = "Te quedan conjuros por elegir."
	return out

func _issues() -> Array:
	return _issues_by_step().values()

# ================================================================== panel lateral

func _update_side() -> void:
	var full := _full()
	_preview.set_visual(CharacterSheet.visual_for(full))
	var nm := str(sheet.get("name", "")).strip_edges()
	_hero_name.text = nm if not nm.is_empty() else "Tu héroe"
	var sp_name: String = _spd().get("name", "")
	var lin: Dictionary = CharacterSheet.lineage_data(full)
	if not lin.is_empty():
		sp_name += " (" + str(lin.get("name", "")).to_lower() + ")"
	_hero_sub.text = "%s · %s · %s" % [sp_name, _cd().get("name", ""), _bgd().get("name", "")]
	if mode == "levelup":
		_hero_sub.text = "%s · %s · nivel %d" % [sp_name, _cd().get("name", ""), level]
	var c := Factory.make_from_sheet(full, level, "preview")
	var ab := CharacterSheet.final_abilities(full)
	var txt := "[center][color=#dcb366]PG[/color] %d   [color=#dcb366]CA[/color] %d   [color=#dcb366]Vel.[/color] %s m   [color=#dcb366]Inic.[/color] %s[/center]\n" % [
		c.max_hp, c.ac(), _m(c.speed()), _signed(c.initiative_bonus())]
	var cells: Array = []
	for a in CharacterSheet.ABILITIES:
		cells.append("[color=#b3a691]%s[/color] [b]%d[/b] [color=#b3a691](%s)[/color]" % [Loc.t("abs." + a), ab[a], _signed(CharacterSheet.mod(ab[a]))])
	txt += "[center]%s\n%s[/center]" % ["   ".join(cells.slice(0, 3)), "   ".join(cells.slice(3, 6))]
	_hero_stats.text = txt

static func _m(feet: int) -> String:
	var m := feet * 0.3
	return str(int(m)) if is_equal_approx(m, round(m)) else ("%.1f" % m).replace(".", ",")

static func _signed(v: int) -> String:
	return "+%d" % v if v >= 0 else "−%d" % abs(v)

# ================================================================== piezas de interfaz

## Tarjeta seleccionable: fondo, contenido (icono, título, texto) y un botón transparente encima.
func _card(title: String, sub: String, icon_name: String, selected: bool, cb: Callable, enabled := true, compact := false) -> Control:
	var card := MarginContainer.new()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var bgp := Panel.new()
	bgp.add_theme_stylebox_override("panel", UI.stone("slab_selected" if selected else ("slab" if enabled else "slab_disabled")))
	bgp.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(bgp)
	var m := MarginContainer.new()
	for side in ["left", "right"]:
		m.add_theme_constant_override("margin_" + side, 12)
	for side in ["top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 6 if compact else 9)
	m.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(m)
	var h := UI.hbox(10)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	m.add_child(h)
	if not icon_name.is_empty():
		var ic := UI.icon_rect(icon_name, 26 if compact else 34, UI.GOLD if selected else (UI.TEXT if enabled else UI.TEXT_DIM))
		ic.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		h.add_child(ic)
	var v := UI.vbox(1)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_child(v)
	var tl := UI.label(title, 17 if compact else 19, UI.TEXT if enabled else UI.TEXT_DIM, UI.FONT_BOLD)
	tl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	tl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	v.add_child(tl)
	if not sub.is_empty():
		var sl := UI.label(sub, 14 if compact else 15, UI.TEXT_DIM)
		sl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		sl.mouse_filter = Control.MOUSE_FILTER_IGNORE
		v.add_child(sl)
	var b := Button.new()
	b.flat = true
	b.focus_mode = Control.FOCUS_NONE
	b.mouse_filter = Control.MOUSE_FILTER_PASS
	b.disabled = not enabled
	for st in ["normal", "hover", "pressed", "disabled", "focus"]:
		b.add_theme_stylebox_override(st, StyleBoxEmpty.new())
	b.pressed.connect(func():
		Game.sfx("click", -8)
		cb.call())
	card.add_child(b)
	return card

func _grid(cols: int) -> GridContainer:
	var g := GridContainer.new()
	g.columns = cols
	g.add_theme_constant_override("h_separation", int(8 * UI.scale_f()))
	g.add_theme_constant_override("v_separation", int(8 * UI.scale_f()))
	g.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return g

## Columnas según el ancho disponible del panel.
func _cols(min_w: float) -> int:
	var w := _scroll.size.x if _scroll.size.x > 10 else 760.0
	return max(1, int(w / (min_w * UI.scale_f())))

func _section(text: String) -> Label:
	var l := UI.label(text, 18, UI.GOLD, UI.FONT_SC)
	return l

func _para(bb: String, size := 17) -> RichTextLabel:
	var r := UI.rich(bb, size)
	r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return r

func _chip(text: String, selected: bool, cb: Callable, enabled := true) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	b.mouse_filter = Control.MOUSE_FILTER_PASS
	b.disabled = not enabled
	b.custom_minimum_size = Vector2(0, 46 * UI.scale_f())
	b.add_theme_font_size_override("font_size", UI.fs(17))
	UI.stone_button(b, selected, 10)
	b.pressed.connect(func():
		Game.sfx("click", -8)
		cb.call())
	return b

func _flow() -> HFlowContainer:
	var f := HFlowContainer.new()
	f.add_theme_constant_override("h_separation", int(8 * UI.scale_f()))
	f.add_theme_constant_override("v_separation", int(8 * UI.scale_f()))
	f.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return f

func _swatch(color: String, selected: bool, cb: Callable) -> Button:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.mouse_filter = Control.MOUSE_FILTER_PASS
	b.custom_minimum_size = Vector2(48, 48) * UI.scale_f()
	var c := Color.html(color)
	for st in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(st, UI.box(c, UI.GOLD if selected else Color(0, 0, 0, 0.6), 24, 4 if selected else 2, 0))
	b.pressed.connect(func():
		Game.sfx("click", -10)
		cb.call())
	return b

func _detail_panel() -> VBoxContainer:
	var p := UI.panel("inset", 14)
	p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var v := UI.vbox(6)
	p.add_child(v)
	_content.add_child(p)
	return v

static func _feature_lines(ids: Array) -> String:
	var lines: Array = []
	for f in ids:
		lines.append("[b]%s.[/b] %s" % [RulesDB.feature_name(f), RulesDB.feature_desc(f)])
	return "\n".join(lines)

static func _ab_list(abs: Array) -> String:
	return ", ".join(abs.map(func(a): return Loc.t("ab." + a)))

# ================================================================== 1. clase

func _build_class() -> void:
	var g := _grid(_cols(250))
	_content.add_child(g)
	for cid in RulesDB.classes.keys():
		var cd: Dictionary = RulesDB.classes[cid]
		var stars := "●".repeat(int(cd.get("difficulty", 1))) + "○".repeat(3 - int(cd.get("difficulty", 1)))
		var id: String = cid
		g.add_child(_card(cd.get("name", cid), "%s · %s" % [cd.get("role", ""), stars], CLASS_ICONS.get(cid, "magic"),
			cid == sheet.class, func():
				_set_class(id)
				_compute_steps()
				_changed(), true, true))
	var cd := _cd()
	var v := _detail_panel()
	v.add_child(UI.title(cd.get("name", ""), 24))
	v.add_child(_para(str(cd.get("desc", ""))))
	var prim: Array = cd.get("primary", [])
	var prim_txt: String = Loc.t("ab." + str(prim[0])) if prim.size() > 0 else "—"
	if prim.size() > 1:
		prim_txt += " (después, %s)" % Loc.t("ab." + str(prim[1])).to_lower()
	var info := "[color=#dcb366]Dado de golpe:[/color] d%d   [color=#dcb366]Principal:[/color] %s   [color=#dcb366]Salvaciones:[/color] %s" % [
		int(cd.get("hit_die", 8)), prim_txt, _ab_list(cd.get("saves", []))]
	info += "\n[color=#dcb366]Armaduras:[/color] %s   [color=#dcb366]Armas:[/color] %s" % [_armor_text(cd.get("armor", [])), _weapons_text(cd.get("weapons", []))]
	info += "\n[color=#dcb366]Dificultad:[/color] %s" % ["Sencilla", "Media", "Exigente"][clamp(int(cd.get("difficulty", 1)) - 1, 0, 2)]
	v.add_child(_para(info, 16))
	v.add_child(_section("Rasgos de nivel 1"))
	v.add_child(_para(_feature_lines(CharacterSheet.features_gained({"class": sheet.class}, 1)), 16))
	var subs: Array = []
	for sc in cd.get("subclasses", {}).values():
		subs.append(sc.get("name", ""))
	v.add_child(_section("Más adelante"))
	var later := "Nivel 2: %s." % ", ".join(CharacterSheet.features_gained({"class": sheet.class}, 2).map(func(f): return RulesDB.feature_name(f)))
	later += "\nNivel 3: eliges %s (%s)." % [str(cd.get("subclass_label", "subclase")).to_lower(), ", ".join(subs)]
	v.add_child(_para(later, 16))

static func _armor_text(arr: Array) -> String:
	if arr.is_empty():
		return "ninguna"
	var names := {"light": "ligeras", "medium": "intermedias", "heavy": "pesadas", "shield": "escudos"}
	return ", ".join(arr.map(func(a): return names.get(a, a)))

static func _weapons_text(arr: Array) -> String:
	var names := {"simple": "sencillas", "martial": "marciales", "martial_light": "marciales ligeras",
		"martial_finesse_or_light": "marciales sutiles o ligeras"}
	return ", ".join(arr.map(func(a): return names.get(a, a)))

# ================================================================== 2. especie

func _build_species() -> void:
	var g := _grid(_cols(250))
	_content.add_child(g)
	for sid in RulesDB.species.keys():
		var sd: Dictionary = RulesDB.species[sid]
		var sizes: Array = sd.get("sizes", ["medium"])
		var size_txt := "Pequeño o mediano" if sizes.size() > 1 else ("Pequeño" if sizes[0] == "small" else "Mediano")
		var id: String = sid
		g.add_child(_card(sd.get("name", sid), "%s · %s m" % [size_txt, _m(int(sd.get("speed", 30)))], SPECIES_ICONS.get(sid, "footsteps"),
			sid == sheet.species, func():
				_set_species(id)
				_compute_steps()
				_changed(), true, true))
	var sd := _spd()
	var v := _detail_panel()
	v.add_child(UI.title(sd.get("name", ""), 24))
	v.add_child(_para(str(sd.get("desc", ""))))
	var info := "[color=#dcb366]Velocidad:[/color] %s m" % _m(int(sd.get("speed", 30)))
	if int(sd.get("darkvision", 0)) > 0:
		info += "   [color=#dcb366]Visión en la oscuridad:[/color] %s m" % _m(int(sd.darkvision))
	if not sd.get("resist", []).is_empty():
		info += "   [color=#dcb366]Resistencia:[/color] %s" % ", ".join(sd.resist.map(func(d): return Loc.dmg_type(d)))
	v.add_child(_para(info, 16))
	v.add_child(_para(_feature_lines(sd.get("traits", [])), 16))
	var full := _full()
	# Linaje
	if sd.has("lineages"):
		v.add_child(_section(sd.get("lineage_label", "Linaje")))
		var lg := _grid(_cols(260))
		v.add_child(lg)
		for lid in sd.lineages.keys():
			var ld: Dictionary = sd.lineages[lid]
			var id: String = lid
			lg.add_child(_card(ld.get("name", lid), ld.get("desc", ""), "", lid == full.get("lineage", ""), func():
				sheet["lineage"] = id
				_changed(), true, true))
	# Ascendencia (dracónidos, goliats)
	if sd.has("ancestries"):
		v.add_child(_section(sd.get("ancestry_label", "Ascendencia")))
		var ag := _grid(_cols(200) if sheet.species == "dragonborn" else _cols(260))
		v.add_child(ag)
		for aid in sd.ancestries.keys():
			var ad: Dictionary = sd.ancestries[aid]
			var sub := ""
			if ad.has("damage"):
				sub = "Aliento y resistencia: %s" % Loc.dmg_type(ad.damage)
			else:
				sub = ad.get("desc", "")
			var id: String = aid
			ag.add_child(_card(ad.get("name", aid), sub, "", aid == full.get("ancestry", ""), func():
				sheet["ancestry"] = id
				if sheet.species == "dragonborn":
					sheet.visual.erase("skin")
				_changed(), true, true))
	# Característica de los conjuros de linaje
	if sd.get("lineage_ability", false):
		v.add_child(_section("Característica para tus conjuros de linaje"))
		var f := _flow()
		v.add_child(f)
		for a in ["int", "wis", "cha"]:
			var id: String = a
			f.add_child(_chip(Loc.t("ab." + a), full.get("lineage_ability", "") == a, func():
				sheet["lineage_ability"] = id
				_changed()))
	# Tamaño
	var sizes: Array = sd.get("sizes", ["medium"])
	if sizes.size() > 1:
		v.add_child(_section("Tamaño"))
		var f2 := _flow()
		v.add_child(f2)
		for s in sizes:
			var id: String = s
			f2.add_child(_chip("Mediano" if s == "medium" else "Pequeño", full.get("size", "") == s, func():
				sheet["size"] = id
				_changed()))
	# Dote adicional (Versátil)
	if sd.get("extra_origin_feat", false):
		v.add_child(_section("Versátil: dote de origen adicional"))
		var fg := _grid(_cols(260))
		v.add_child(fg)
		var bg_feat: String = _bgd().get("feat", "")
		for fid in CharacterSheet.origin_feats():
			var fd: Dictionary = RulesDB.feats[fid]
			var taken: bool = fid == bg_feat
			var id: String = fid
			fg.add_child(_card(fd.get("name", fid), "Ya te la da tu trasfondo." if taken else fd.get("desc", ""), "",
				sheet.get("human_feat", "") == fid, func():
					sheet["human_feat"] = id
					sheet.erase("skills")
					sheet.erase("magic_initiate")
					_compute_steps()
					_changed(), not taken, true))

# ================================================================== 3. trasfondo

func _build_background() -> void:
	var g := _grid(_cols(250))
	_content.add_child(g)
	for bid in RulesDB.backgrounds.keys():
		var bd: Dictionary = RulesDB.backgrounds[bid]
		var feat_name: String = RulesDB.feats.get(bd.get("feat", ""), {}).get("name", "")
		var abs := " · ".join(bd.get("abilities", []).map(func(a): return Loc.t("abs." + a)))
		var id: String = bid
		g.add_child(_card(bd.get("name", bid), "%s · %s" % [abs, feat_name], "", bid == sheet.background, func():
			_set_background(id)
			_compute_steps()
			_changed(), true, true))
	var bd := _bgd()
	var v := _detail_panel()
	v.add_child(UI.title(bd.get("name", ""), 24))
	v.add_child(_para(str(bd.get("desc", ""))))
	var feat: Dictionary = RulesDB.feats.get(bd.get("feat", ""), {})
	var feat_txt: String = feat.get("name", "")
	if bd.get("feat", "") == "magic_initiate":
		feat_txt += " (%s)" % LIST_NAMES.get(bd.get("feat_list", "wizard"), "")
	var info := "[color=#dcb366]Dote:[/color] [b]%s.[/b] %s" % [feat_txt, feat.get("desc", "")]
	info += "\n[color=#dcb366]Habilidades:[/color] %s   [color=#dcb366]Herramienta:[/color] %s" % [
		", ".join(bd.get("skills", []).map(func(k): return Loc.t("skill." + k))), bd.get("tool", "—")]
	v.add_child(_para(info, 16))
	# Mejora de características
	v.add_child(_section("Mejora de características"))
	var allowed: Array = bd.get("abilities", [])
	var bonus: Dictionary = _full().get("bg_bonus", {})
	var three := bonus.size() == 3
	var mode := _flow()
	v.add_child(mode)
	mode.add_child(_chip("+2 y +1", not three, func():
		sheet["bg_bonus"] = CharacterSheet.default_bg_bonus(sheet)
		_changed()))
	mode.add_child(_chip("+1 a las tres", three, func():
		var b := {}
		for a in allowed:
			b[a] = 1
		sheet["bg_bonus"] = b
		_changed()))
	if not three:
		for amount in [2, 1]:
			var row := UI.hbox(8)
			v.add_child(row)
			var l := UI.label("+%d a:" % amount, 18, UI.TEXT, UI.FONT_BOLD)
			l.custom_minimum_size = Vector2(70, 0) * UI.scale_f()
			l.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			row.add_child(l)
			for a in allowed:
				var id: String = a
				var amt: int = amount
				row.add_child(_chip(Loc.t("ab." + a), int(bonus.get(a, 0)) == amount, func():
					_set_bonus(id, amt)))
	v.add_child(_para("[color=#b3a691]Las puntuaciones finales se ven en el paso Características.[/color]", 15))

func _set_bonus(a: String, amount: int) -> void:
	var b: Dictionary = _full().get("bg_bonus", {}).duplicate()
	var other := ""
	for k in b.keys():
		if k != a and int(b[k]) == amount:
			other = k
	var prev := int(b.get(a, 0))
	b.erase(a)
	if not other.is_empty():
		b.erase(other)
		# Intercambia: la otra recibe lo que tenía esta
		if prev > 0 and prev != amount:
			b[other] = prev
	b[a] = amount
	if b.size() < 2:
		for k in _bgd().get("abilities", []):
			if not b.has(k):
				b[k] = 3 - amount
				break
	sheet["bg_bonus"] = b
	_changed()

# ================================================================== 4. características

func _build_abilities() -> void:
	var method: String = sheet.get("ability_method", "standard")
	var f := _flow()
	_content.add_child(f)
	for m in [["standard", "Matriz estándar"], ["point_buy", "Compra de puntos"], ["roll", "Tirar 4d6"]]:
		var id: String = m[0]
		f.add_child(_chip(m[1], method == id, func(): _set_method(id)))
	var rec := _chip("Recomendado", false, func():
		sheet["ability_method"] = "standard"
		sheet["base_abilities"] = _cd().get("std_array", {}).duplicate()
		sheet.erase("bg_bonus")
		_abilities_touched = false
		_changed())
	f.add_child(rec)
	var expl := ""
	match method:
		"standard":
			expl = "Reparte 15, 14, 13, 12, 10 y 8. Con − y + intercambias el valor con la característica que tenga el siguiente."
		"point_buy":
			expl = "Todas empiezan en 8. Tienes 27 puntos: subir a 13 cuesta 1 por punto; 14 y 15 cuestan 2."
		"roll":
			expl = "Seis tiradas de 4d6 quedándote con los tres mejores. Con − y + intercambias los valores entre características."
	_content.add_child(_para("[color=#b3a691]%s[/color]" % expl, 16))
	if method == "roll":
		var rl := UI.hbox(10)
		_content.add_child(rl)
		var rb := UI.button("Volver a tirar", "d20", Vector2(220, 52))
		rb.pressed.connect(func():
			_roll_abilities()
			_changed())
		rl.add_child(rb)
		var rolls: Array = sheet.get("rolls", [])
		rl.add_child(UI.label("Tiradas: " + ", ".join(rolls.map(func(x): return str(x))), 18, UI.GOLD, UI.FONT_BOLD))
	if method == "point_buy":
		var spent := CharacterSheet.point_buy_spent(sheet.base_abilities)
		var left := CharacterSheet.POINT_BUY_TOTAL - spent
		_content.add_child(UI.label("Puntos restantes: %d" % left, 20, UI.HEAL if left == 0 else (UI.WARN if left > 0 else UI.ENEMY), UI.FONT_BOLD))
	var full := _full()
	var base: Dictionary = sheet.get("base_abilities", {})
	var bonus: Dictionary = full.get("bg_bonus", {})
	var final := CharacterSheet.final_abilities(full)
	var prim: Array = _cd().get("primary", [])
	var table := _grid(6)
	_content.add_child(table)
	for hdr in ["Característica", "", "Base", "", "Trasfondo", "Total"]:
		table.add_child(UI.label(hdr, 15, UI.TEXT_DIM, UI.FONT_SC))
	for a in CharacterSheet.ABILITIES:
		var nm := UI.label(("★ " if a in prim else "   ") + Loc.t("ab." + a), 20, UI.GOLD if a in prim else UI.TEXT, UI.FONT_BOLD)
		nm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		nm.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		table.add_child(nm)
		var id: String = a
		var minus := _chip("−", false, func(): _adjust(id, -1))
		minus.custom_minimum_size = Vector2(56, 50) * UI.scale_f()
		var plus := _chip("+", false, func(): _adjust(id, 1))
		plus.custom_minimum_size = Vector2(56, 50) * UI.scale_f()
		if method == "point_buy":
			minus.disabled = int(base.get(a, 8)) <= 8
			var nxt := int(base.get(a, 8)) + 1
			plus.disabled = nxt > 15 or CharacterSheet.point_buy_spent(base) - int(CharacterSheet.POINT_BUY_COST.get(nxt - 1, 0)) + int(CharacterSheet.POINT_BUY_COST.get(nxt, 99)) > CharacterSheet.POINT_BUY_TOTAL
		table.add_child(minus)
		var bl := UI.label(str(int(base.get(a, 10))), 22, UI.TEXT, UI.FONT_BOLD)
		bl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		bl.custom_minimum_size = Vector2(52, 0) * UI.scale_f()
		bl.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		table.add_child(bl)
		table.add_child(plus)
		var bon := int(bonus.get(a, 0))
		var bo := UI.label("+%d" % bon if bon > 0 else "—", 20, UI.HEAL if bon > 0 else UI.TEXT_DIM, UI.FONT_BOLD)
		bo.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		bo.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		table.add_child(bo)
		var tot := UI.label("%d (%s)" % [final[a], _signed(CharacterSheet.mod(final[a]))], 22, UI.GOLD if a in prim else UI.TEXT, UI.FONT_BOLD)
		tot.size_flags_vertical = Control.SIZE_SHRINK_CENTER
		table.add_child(tot)
	# Consejo
	var tips: Array = []
	for a in prim:
		if CharacterSheet.mod(final[a]) < 2:
			tips.append(Loc.t("ab." + a))
	if not tips.is_empty() and prim.size() > 0:
		_content.add_child(_para("[color=#f9b840]Consejo:[/color] a tu clase le conviene un modificador de +2 o más en %s." % " o ".join(tips), 16))
	if CharacterSheet.mod(final.con) < 1:
		_content.add_child(_para("[color=#b3a691]La Constitución alta te da más puntos de golpe a cada nivel.[/color]", 16))

func _set_method(m: String) -> void:
	if m == sheet.get("ability_method", ""):
		return
	sheet["ability_method"] = m
	_abilities_touched = true
	match m:
		"standard":
			sheet["base_abilities"] = _cd().get("std_array", {}).duplicate()
		"point_buy":
			# La matriz estándar cuesta exactamente 27 puntos: sirve de punto de partida
			if CharacterSheet.point_buy_spent(sheet.get("base_abilities", {})) > CharacterSheet.POINT_BUY_TOTAL:
				sheet["base_abilities"] = _cd().get("std_array", {}).duplicate()
		"roll":
			_roll_abilities()
	sheet.erase("bg_bonus")
	_changed()

func _roll_abilities() -> void:
	var rolls: Array = []
	for i in 6:
		var d: Array = []
		for j in 4:
			d.append(_rng.randi_range(1, 6))
		d.sort()
		rolls.append(d[1] + d[2] + d[3])
	rolls.sort()
	rolls.reverse()
	sheet["rolls"] = rolls
	_assign_rolls()

## Coloca las tiradas siguiendo el orden de preferencia de la clase.
func _assign_rolls() -> void:
	var rolls: Array = sheet.get("rolls", [])
	if rolls.size() != 6:
		return
	var std: Dictionary = _cd().get("std_array", {})
	var order: Array = CharacterSheet.ABILITIES.duplicate()
	order.sort_custom(func(x, y): return int(std.get(x, 10)) > int(std.get(y, 10)))
	var base := {}
	for i in 6:
		base[order[i]] = rolls[i]
	sheet["base_abilities"] = base

func _adjust(a: String, dir: int) -> void:
	_abilities_touched = true
	var base: Dictionary = sheet.get("base_abilities", {}).duplicate()
	var method: String = sheet.get("ability_method", "standard")
	if method == "point_buy":
		var nv: int = clamp(int(base.get(a, 8)) + dir, 8, 15)
		base[a] = nv
		if CharacterSheet.point_buy_spent(base) > CharacterSheet.POINT_BUY_TOTAL:
			return
	else:
		# Intercambio con la característica que tenga el valor siguiente
		var cur := int(base.get(a, 10))
		var values: Array = []
		for k in CharacterSheet.ABILITIES:
			var val := int(base.get(k, 10))
			if not val in values:
				values.append(val)
		values.sort()
		var idx := values.find(cur) + dir
		if idx < 0 or idx >= values.size():
			return
		var target: int = values[idx]
		for k in CharacterSheet.ABILITIES:
			if int(base.get(k, 10)) == target:
				base[k] = cur
				break
		base[a] = target
	sheet["base_abilities"] = base
	sheet.erase("bg_bonus")
	_changed()

# ================================================================== 5. habilidades

## Fuentes de habilidades elegibles: clase (de su lista), especie y dotes (cualquiera).
func _skill_sources() -> Array:
	var full := _full()
	var slots := CharacterSheet.skill_slots(full, level)
	var out: Array = []
	var cls_from: Array = _cd().get("skills", {}).get("from", CharacterSheet.SKILLS)
	for i in int(slots.class):
		out.append(cls_from)
	var spd := _spd()
	if spd.has("keen_senses"):
		out.append(spd.keen_senses)
	for i in int(spd.get("skill_choices", 0)):
		out.append(CharacterSheet.SKILLS)
	for i in int(slots.feats):
		out.append(CharacterSheet.SKILLS)
	for i in CharacterSheet.overlapping_fixed(full):
		out.append(CharacterSheet.SKILLS)
	for i in int(slots.get("class_bonus", 0)):
		out.append(cls_from if sheet.get("class", "") == "barbarian" else CharacterSheet.SKILLS)
	return out

## ¿Se pueden repartir las habilidades elegidas entre las fuentes disponibles?
func _skills_feasible(picks: Array) -> bool:
	var bg_sk: Array = CharacterSheet.fixed_skills(_full())
	var free: Array = picks.filter(func(k): return not k in bg_sk)
	var sources := _skill_sources()
	if free.size() > sources.size():
		return false
	return _match(free, 0, sources, [])

func _match(free: Array, i: int, sources: Array, used: Array) -> bool:
	if i >= free.size():
		return true
	for j in sources.size():
		if j in used or not free[i] in sources[j]:
			continue
		used.append(j)
		if _match(free, i + 1, sources, used):
			used.pop_back()
			return true
		used.pop_back()
	return false

func _build_skills() -> void:
	var full := _full()
	var bg_sk: Array = CharacterSheet.fixed_skills(full)
	var picks: Array = sheet.get("skills", []).duplicate()
	for k in bg_sk:
		if not k in picks:
			picks.append(k)
	sheet["skills"] = picks
	var need := CharacterSheet.required_skills(full, level)
	var left: int = need - picks.size()
	var slots := CharacterSheet.skill_slots(full, level)
	var src: Array = ["Trasfondo: %s" % ", ".join(_bgd().get("skills", []).map(func(k): return Loc.t("skill." + k)))]
	for k in _spd().get("skills", []):
		src.append("%s: %s" % [_spd().get("name", ""), Loc.t("skill." + k)])
	if CharacterSheet.overlapping_fixed(full) > 0:
		src.append("Repetida con el trasfondo: %d cualquiera" % CharacterSheet.overlapping_fixed(full))
	src.append("Clase: %d de su lista" % int(slots.class))
	if _spd().has("keen_senses"):
		src.append("Sentidos agudos: 1 entre %s" % ", ".join(_spd().keen_senses.map(func(k): return Loc.t("skill." + k))))
	if int(_spd().get("skill_choices", 0)) > 0:
		src.append("%s: %d cualquiera" % ["Versatilidad" if sheet.species == "half_elf" else "Hábil", int(_spd().skill_choices)])
	if int(slots.feats) > 0:
		src.append("Dote Habilidoso: %d cualquiera" % int(slots.feats))
	_content.add_child(_para("[color=#b3a691]%s[/color]" % " · ".join(src), 16))
	_content.add_child(UI.label("Te quedan %d por elegir" % left if left > 0 else "Habilidades completas", 20, UI.WARN if left > 0 else UI.HEAL, UI.FONT_BOLD))
	var c := Factory.make_from_sheet(full, level, "preview")
	var g := _grid(_cols(250))
	_content.add_child(g)
	for k in CharacterSheet.SKILLS:
		var ab: String = Creature.SKILL_ABILITY.get(k, "str")
		var on: bool = k in picks
		var locked: bool = k in bg_sk
		var can_add := left > 0 and _skills_feasible(picks + [k])
		var sub := "%s · %s" % [Loc.t("abs." + ab), ("especie" if k in _spd().get("skills", []) else "trasfondo") if locked else ("competente" if on else "")]
		var bonus := CharacterSheet.mod(int(CharacterSheet.final_abilities(full)[ab])) + (2 if on else 0) + (2 if on and k in sheet.get("expertise", []) else 0)
		var id: String = k
		g.add_child(_card("%s  %s" % [Loc.t("skill." + k), _signed(bonus)], sub.strip_edges().trim_suffix(" ·"), "check" if on else "",
			on, func(): _toggle_skill(id), (on and not locked) or (not on and can_add), true))
	# Pericia
	var ecount := CharacterSheet.expertise_count(full, level)
	if ecount > 0:
		var ex: Array = sheet.get("expertise", []).filter(func(x): return x in picks)
		sheet["expertise"] = ex
		_content.add_child(_section("Pericia: elige %d (doble bonificador)" % ecount))
		var f := _flow()
		_content.add_child(f)
		for k in picks:
			var id: String = k
			var on: bool = k in ex
			f.add_child(_chip(Loc.t("skill." + k), on, func():
				var e: Array = sheet.get("expertise", []).duplicate()
				if id in e:
					e.erase(id)
				elif e.size() < ecount:
					e.append(id)
				sheet["expertise"] = e
				_changed(), on or ex.size() < ecount))

func _toggle_skill(k: String) -> void:
	var picks: Array = sheet.get("skills", []).duplicate()
	if k in picks:
		picks.erase(k)
		sheet["expertise"] = sheet.get("expertise", []).filter(func(x): return x != k)
	else:
		picks.append(k)
	sheet["skills"] = picks
	_changed()

# ================================================================== 6. rasgos de clase

func _build_options() -> void:
	var cd := _cd()
	var full := _full()
	var cls: String = sheet.class
	if mode == "levelup":
		_build_options_level_up()
		return
	if CharacterSheet.fighting_style_level(cls) <= level:
		_content.add_child(_section("Estilo de combate"))
		var g := _grid(_cols(300))
		_content.add_child(g)
		for fid in CharacterSheet.fighting_styles_for(cls):
			var fd: Dictionary = RulesDB.feats[fid]
			var id: String = fid
			g.add_child(_card(fd.get("name", fid), fd.get("desc", ""), "", full.get("fighting_style", "") == fid, func():
				sheet["fighting_style"] = id
				_changed(), true, true))
	var orders: Dictionary = cd.get("orders", {})
	if not orders.is_empty():
		var key := "divine_order" if cls == "cleric" else "primal_order"
		_content.add_child(_section(RulesDB.feature_name(key)))
		var g2 := _grid(_cols(300))
		_content.add_child(g2)
		for oid in orders.keys():
			var od: Dictionary = orders[oid]
			var id: String = oid
			var k2: String = key
			g2.add_child(_card(od.get("name", oid), od.get("desc", ""), "", full.get(key, "") == oid, func():
				sheet[k2] = id
				for k in ["kit", "cantrips", "prepared", "masteries"]:
					sheet.erase(k)
				_changed(), true, true))
	var mc := int(RulesDB.at_level(cd.get("mastery_count", {}), level, 0))
	if mc > 0:
		var ms: Array = sheet.get("masteries", [])
		_content.add_child(_section("Maestría con armas: elige %d (%d/%d)" % [mc, ms.size(), mc]))
		_content.add_child(_para("[color=#b3a691]Con esas armas usas su propiedad de maestría. Las de tu equipo están marcadas con ⚔.[/color]", 15))
		var g3 := _grid(_cols(250))
		_content.add_child(g3)
		var mine: Array = full.get("weapons", [])
		for wid in _mastery_weapons():
			var wd: Dictionary = RulesDB.weapons[wid]
			var mprop: String = wd.get("mastery", "")
			var on: bool = wid in ms
			var id: String = wid
			g3.add_child(_card(("⚔ " if wid in mine else "") + wd.get("name", wid), "%s: %s" % [Loc.t("mastery." + mprop), Loc.t("mastery_desc." + mprop)], "",
				on, func():
					var m2: Array = sheet.get("masteries", []).duplicate()
					if id in m2:
						m2.erase(id)
					elif m2.size() < mc:
						m2.append(id)
					sheet["masteries"] = m2
					_changed(), on or ms.size() < mc, true))
	var ic := int(RulesDB.at_level(cd.get("invocation_count", {}), level, 0))
	if ic > 0:
		var cur := _invocations()
		_content.add_child(_section("Invocaciones sobrenaturales: elige %d" % ic))
		var g4 := _grid(_cols(300))
		_content.add_child(g4)
		var catalog: Dictionary = RulesDB.features.get("invocations", {})
		for iid in catalog.keys():
			var idata: Dictionary = catalog[iid]
			if int(idata.get("level", 1)) > level:
				continue
			var on: bool = iid in cur
			var req: String = idata.get("requires", "")
			var ok: bool = req.is_empty() or req in full.get("cantrips", [])
			var id: String = iid
			g4.add_child(_card(idata.get("name", iid), idata.get("desc", "") + ("" if ok else " (Requiere %s.)" % RulesDB.spell(req).get("name", req)), "",
				on, func():
					var inv: Array = _invocations().duplicate()
					if id in inv:
						inv.erase(id)
					else:
						if inv.size() >= ic:
							inv.pop_front()
						inv.append(id)
					var inv_all = sheet.get("invocations", {})
					inv_all = (inv_all if typeof(inv_all) == TYPE_DICTIONARY else {}).duplicate(true)
					inv_all[str(level)] = inv
					sheet["invocations"] = inv_all
					sheet.erase("tome_cantrips")
					sheet.erase("pact_weapon")
					_changed(), ok, true))
		if "pact_of_the_tome" in cur:
			_content.add_child(_section("Libro de las sombras: tres trucos de cualquier lista"))
			var tome: Array = full.get("tome_cantrips", [])
			var f := _flow()
			_content.add_child(f)
			for sid in _all_cantrips():
				var on: bool = sid in tome
				var id: String = sid
				f.add_child(_chip(RulesDB.spell(sid).get("name", sid), on, func():
					var t2: Array = _full().get("tome_cantrips", []).duplicate()
					if id in t2:
						t2.erase(id)
					elif t2.size() < 3:
						t2.append(id)
					sheet["tome_cantrips"] = t2
					_changed(), on or tome.size() < 3))
	var lines: Array = []
	for f2 in CharacterSheet.features_gained(full, 1):
		if not f2 in ["fighting_style", "weapon_mastery", "divine_order", "primal_order", "eldritch_invocations", "spellcasting", "pact_magic"]:
			lines.append(f2)
	if not lines.is_empty():
		_content.add_child(_section("Otros rasgos de nivel 1"))
		_content.add_child(_para(_feature_lines(lines), 16))

func _build_options_level_up() -> void:
	var cd := _cd()
	var full := _full()
	var cls: String = sheet.class
	if CharacterSheet.fighting_style_level(cls) == level:
		_content.add_child(_section("Estilo de combate"))
		var g := _grid(_cols(300))
		_content.add_child(g)
		for fid in CharacterSheet.fighting_styles_for(cls):
			var fd: Dictionary = RulesDB.feats[fid]
			var id: String = fid
			g.add_child(_card(fd.get("name", fid), fd.get("desc", ""), "", full.get("fighting_style", "") == fid, func():
				sheet["fighting_style"] = id
				_changed(), true, true))
	if cls == "sorcerer" and level >= 2:
		var mm: Array = sheet.get("metamagic", [])
		_content.add_child(_section("Metamagia: elige 2 (%d/2)" % mm.size()))
		var g2 := _grid(_cols(300))
		_content.add_child(g2)
		var opts: Dictionary = RulesDB.features.get("metamagic_options", {})
		for mid in opts.keys():
			var md: Dictionary = opts[mid]
			var on: bool = mid in mm
			var id: String = mid
			g2.add_child(_card(md.get("name", mid), "(%d %s) %s" % [int(md.get("cost", 1)), "punto" if int(md.get("cost", 1)) == 1 else "puntos", md.get("desc", "")], "metamagic",
				on, func():
					var m2: Array = sheet.get("metamagic", []).duplicate()
					if id in m2:
						m2.erase(id)
					elif m2.size() < 2:
						m2.append(id)
					sheet["metamagic"] = m2
					_changed(), on or mm.size() < 2, true))
	var ic := int(RulesDB.at_level(cd.get("invocation_count", {}), level, 0))
	if ic > int(RulesDB.at_level(cd.get("invocation_count", {}), level - 1, 0)):
		var cur := _invocations()
		_content.add_child(_section("Invocaciones sobrenaturales: %d en total (%d/%d)" % [ic, cur.size(), ic]))
		_content.add_child(_para("[color=#b3a691]Puedes cambiar las que ya tenías.[/color]", 15))
		var g4 := _grid(_cols(300))
		_content.add_child(g4)
		var catalog: Dictionary = RulesDB.features.get("invocations", {})
		for iid in catalog.keys():
			var idata: Dictionary = catalog[iid]
			if int(idata.get("level", 1)) > level:
				continue
			var on: bool = iid in cur
			var req: String = idata.get("requires", "")
			var ok: bool = req.is_empty() or req in full.get("cantrips", [])
			var id: String = iid
			g4.add_child(_card(idata.get("name", iid), idata.get("desc", "") + ("" if ok else " (Requiere %s.)" % RulesDB.spell(req).get("name", req)), "",
				on, func():
					var inv: Array = _invocations().duplicate()
					if id in inv:
						inv.erase(id)
					elif inv.size() < ic:
						inv.append(id)
					var inv_all = sheet.get("invocations", {})
					inv_all = (inv_all if typeof(inv_all) == TYPE_DICTIONARY else {}).duplicate(true)
					inv_all[str(level)] = inv
					sheet["invocations"] = inv_all
					_changed(), ok and (on or cur.size() < ic), true))
		if "lessons_of_the_first_ones" in cur:
			_content.add_child(_section("Lecciones de los primeros: una dote de origen"))
			var f := _flow()
			_content.add_child(f)
			for fid in CharacterSheet.origin_feats():
				var id: String = fid
				f.add_child(_chip(RulesDB.feats[fid].get("name", fid), full.get("lessons_feat", "") == fid, func():
					sheet["lessons_feat"] = id
					_changed(), not fid in full.get("feats", []) or RulesDB.feats[fid].get("repeatable", false)))
	var ecount := CharacterSheet.expertise_count(full, level)
	if ecount > CharacterSheet.expertise_count(full, level - 1):
		var ex: Array = sheet.get("expertise", [])
		var allowed: Array = cd.get("expertise_from", CharacterSheet.SKILLS)
		_content.add_child(_section("Pericia: %d en total (%d/%d)" % [ecount, ex.size(), ecount]))
		_content.add_child(_para("[color=#b3a691]Duplicas el bonificador por competencia en esas habilidades.[/color]", 15))
		var f2 := _flow()
		_content.add_child(f2)
		for k in full.get("skills", []):
			if not k in allowed and not k in ex:
				continue
			var locked: bool = k in _old_expertise
			var on: bool = k in ex
			var id: String = k
			f2.add_child(_chip(Loc.t("skill." + k), on, func():
				var e: Array = sheet.get("expertise", []).duplicate()
				if id in e:
					e.erase(id)
				elif e.size() < ecount:
					e.append(id)
				sheet["expertise"] = e
				_changed(), not locked and (on or ex.size() < ecount)))

## Paso «Nivel N»: puntos de golpe, rasgos nuevos, subclase y elecciones ligadas a ella.
func _build_advance() -> void:
	var full := _full()
	var cd := _cd()
	var prev := CharacterSheet.complete(sheet, level - 1)
	var hp_now := CharacterSheet.hp_at(full, level)
	var hp_gain := hp_now - CharacterSheet.hp_at(prev, level - 1)
	var v := _detail_panel()
	v.add_child(UI.label("+%d puntos de golpe (máximo %d)" % [hp_gain, hp_now], 22, UI.HEAL, UI.FONT_BOLD))
	var pb_now := RulesDB.prof_bonus_for(level)
	if pb_now > RulesDB.prof_bonus_for(level - 1):
		v.add_child(_para("Tu bonificador por competencia sube a +%d." % pb_now, 17))
	var cast: Dictionary = cd.get("casting", {})
	if not cast.is_empty():
		var a := RulesDB.slots_for(cast.get("type", "full"), level - 1)
		var b2 := RulesDB.slots_for(cast.get("type", "full"), level)
		if a != b2:
			var parts: Array = []
			for i in b2.size():
				if int(b2[i]) > 0:
					parts.append("%d de nivel %d" % [int(b2[i]), i + 1])
			v.add_child(_para("Espacios de conjuro: %s." % ", ".join(parts), 17))
		var np := int(RulesDB.at_level(cast.get("prepared", {}), level, 0))
		if np > int(RulesDB.at_level(cast.get("prepared", {}), level - 1, 0)):
			v.add_child(_para("Preparas %d conjuros (los eliges en el paso Conjuros)." % np, 17))
	var sub_feats: Array = cd.get("subclasses", {}).get(full.get("subclass", ""), {}).get("features", {}).get(str(level), [])
	var gained := CharacterSheet.features_gained(full, level).filter(func(f): return f != "subclass" and not f in sub_feats)
	if not gained.is_empty():
		v.add_child(_section("Rasgos nuevos"))
		v.add_child(_para(_feature_lines(gained), 16))
	# Subclase
	if level == 3:
		var sid: String = full.get("subclass", "")
		var scd: Dictionary = cd.get("subclasses", {}).get(sid, {})
		var p2 := _detail_panel()
		p2.add_child(_section(str(cd.get("subclass_label", "Subclase"))))
		p2.add_child(UI.title(scd.get("name", sid), 24))
		p2.add_child(_para(str(scd.get("desc", "")), 17))
		var sf: Array = scd.get("features", {}).get("3", [])
		if not sf.is_empty():
			p2.add_child(_para(_feature_lines(sf), 16))
		var ap: Array = []
		for l in scd.get("always_prepared", {}).keys():
			for x in scd.always_prepared[l]:
				ap.append(RulesDB.spell(x).get("name", x))
		if not ap.is_empty():
			p2.add_child(_para("[color=#dcb366]Conjuros siempre preparados:[/color] %s" % ", ".join(ap), 16))
		if sheet.class == "druid":
			p2.add_child(_section("Tierra de tu círculo"))
			var lg := _grid(_cols(260))
			p2.add_child(lg)
			var lands: Dictionary = RulesDB.features.get("lands", {})
			for lid in lands.keys():
				var ld: Dictionary = lands[lid]
				var id: String = lid
				var sp_names: Array = ld.get("spells", []).map(func(x): return RulesDB.spell(x).get("name", x))
				lg.add_child(_card(ld.get("name", lid), ", ".join(sp_names), "nature", full.get("land", "") == lid, func():
					sheet["land"] = id
					_changed(), true, true))
		if sheet.class == "ranger":
			p2.add_child(_section("Presa del cazador"))
			var pg := _grid(_cols(300))
			p2.add_child(pg)
			for pid in ["colossus_slayer", "horde_breaker"]:
				var id: String = pid
				pg.add_child(_card(RulesDB.feature_name(pid), RulesDB.feature_desc(pid), "mark", full.get("hunters_prey", "") == pid, func():
					sheet["hunters_prey"] = id
					_changed(), true, true))
	# Habilidades nuevas (Conocimiento primordial, Colegio del saber)
	var need := CharacterSheet.required_skills(full, level)
	var extra := need - _old_skills.size()
	if extra > 0:
		var picks: Array = sheet.get("skills", [])
		var new_picks: Array = picks.filter(func(k): return not k in _old_skills)
		var allowed: Array = cd.get("skills", {}).get("from", CharacterSheet.SKILLS) if sheet.class == "barbarian" else CharacterSheet.SKILLS
		var p3 := _detail_panel()
		p3.add_child(_section("Habilidades nuevas: elige %d (%d/%d)" % [extra, new_picks.size(), extra]))
		var f := _flow()
		p3.add_child(f)
		for k in allowed:
			if k in _old_skills:
				continue
			var on: bool = k in new_picks
			var id: String = k
			f.add_child(_chip(Loc.t("skill." + k), on, func():
				var pk: Array = sheet.get("skills", []).duplicate()
				if id in pk:
					pk.erase(id)
				elif pk.size() < need:
					pk.append(id)
				sheet["skills"] = pk
				_changed(), on or new_picks.size() < extra))

func _invocations() -> Array:
	return CharacterSheet.invocations_at(sheet, level)

func _mastery_weapons() -> Array:
	var cd := _cd()
	var profs: Array = cd.get("weapons", [])
	var out: Array = []
	for wid in RulesDB.weapons.keys():
		var wd: Dictionary = RulesDB.weapons[wid]
		if str(wd.get("mastery", "")).is_empty():
			continue
		if cd.get("mastery_melee_only", false) and wd.get("kind", "") != "melee":
			continue
		var cat: String = wd.get("cat", "simple")
		var ok: bool = cat in profs
		if cat == "martial" and "martial_finesse_or_light" in profs:
			ok = "finesse" in wd.get("props", []) or "light" in wd.get("props", [])
		if cat == "martial" and "martial_light" in profs:
			ok = "light" in wd.get("props", [])
		if ok:
			out.append(wid)
	# Primero las del equipo
	var mine: Array = _full().get("weapons", [])
	out.sort_custom(func(x, y): return (x in mine) and not (y in mine))
	return out

func _all_cantrips() -> Array:
	var out: Array = []
	for sid in RulesDB.spells.keys():
		var sp: Dictionary = RulesDB.spells[sid]
		if int(sp.get("level", -1)) == 0 and not sp.get("hidden", false):
			out.append(sid)
	return out

# ================================================================== 7. conjuros

func _cantrip_count() -> int:
	var cast: Dictionary = _cd().get("casting", {})
	var n := int(RulesDB.at_level(cast.get("cantrips", {}), level, 0))
	var full := _full()
	if full.get("divine_order", "") == "thaumaturge" or full.get("primal_order", "") == "magician":
		n += 1
	return n

func _prepared() -> Array:
	var prep = sheet.get("prepared", {})
	if typeof(prep) == TYPE_ARRAY:
		return prep
	return prep.get(str(level), [])

func _set_prepared(pl: Array) -> void:
	var prep = sheet.get("prepared", {})
	if typeof(prep) == TYPE_ARRAY:
		prep = {"1": prep}
	prep = prep.duplicate(true)
	prep[str(level)] = pl
	sheet["prepared"] = prep

func _build_spells() -> void:
	var cd := _cd()
	var cast: Dictionary = cd.get("casting", {})
	var full := _full()
	if not cast.is_empty():
		var ability: String = cast.get("ability", "int")
		var c := Factory.make_from_sheet(full, level, "preview")
		var slots: Array = RulesDB.slots_for(cast.get("type", "full"), level)
		var slot_txt: Array = []
		for i in slots.size():
			if int(slots[i]) > 0:
				slot_txt.append("%d de nivel %d" % [int(slots[i]), i + 1])
		var head := "Lanzas con %s: CD de salvación %d, ataque de conjuro %s. Espacios: %s." % [
			Loc.t("ab." + ability), c.spell_save_dc(), _signed(c.spell_attack_bonus()), ", ".join(slot_txt)]
		if cast.get("type", "") == "pact":
			head += " Los espacios de pacto se recuperan con un descanso corto."
		_content.add_child(_para("[color=#b3a691]%s[/color]" % head, 16))
		var lst: Array = cast.get("list", [])
		# Trucos
		var nc := _cantrip_count()
		if nc > 0:
			var cur: Array = sheet.get("cantrips", [])
			_content.add_child(_section("Trucos: elige %d (%d/%d)" % [nc, cur.size(), nc]))
			var g := _grid(_cols(330))
			_content.add_child(g)
			for sid in lst:
				var sp := RulesDB.spell(sid)
				if int(sp.get("level", -1)) != 0 or sp.get("hidden", false):
					continue
				var on: bool = sid in cur
				var id: String = sid
				g.add_child(_spell_card(sid, on, func():
					var cl: Array = sheet.get("cantrips", []).duplicate()
					if id in cl:
						cl.erase(id)
					elif cl.size() < nc:
						cl.append(id)
					sheet["cantrips"] = cl
					_changed(), on or cur.size() < nc))
		# Preparados
		var np := int(RulesDB.at_level(cast.get("prepared", {}), level, 0))
		var always := CharacterSheet.always_prepared(full, level)
		if np > 0:
			var prep := _prepared()
			var max_l := CharacterSheet.max_spell_level(full, level)
			_content.add_child(_section("Conjuros preparados: elige %d (%d/%d)" % [np, prep.size(), np]))
			for sl in range(max_l, 0, -1):
				if max_l > 1:
					_content.add_child(UI.label("Nivel %d" % sl, 17, UI.TEXT, UI.FONT_BOLD))
				var g2 := _grid(_cols(330))
				_content.add_child(g2)
				for sid in lst:
					var sp := RulesDB.spell(sid)
					if int(sp.get("level", 0)) != sl or sp.get("hidden", false) or sid in always:
						continue
					var on: bool = sid in prep
					var id: String = sid
					g2.add_child(_spell_card(sid, on, func():
						var pl: Array = _prepared().duplicate()
						if id in pl:
							pl.erase(id)
						elif pl.size() < np:
							pl.append(id)
						_set_prepared(pl)
						_changed(), on or prep.size() < np))
		if not always.is_empty():
			_content.add_child(_section("Siempre preparados"))
			var g3 := _grid(_cols(330))
			_content.add_child(g3)
			for sid in always:
				g3.add_child(_spell_card(sid, true, func(): pass, false))
	# Iniciado en la magia
	if "magic_initiate" in full.get("feats", []):
		_build_magic_initiate(full)
	# Conjuros de especie
	var lin := CharacterSheet.lineage_data(full)
	var extra: Array = []
	if lin.has("cantrip"):
		extra.append("%s (truco)" % RulesDB.spell(lin.cantrip).get("name", lin.cantrip))
	for l in lin.get("spells", {}).keys():
		extra.append("%s (nivel %s)" % [RulesDB.spell(lin.spells[l]).get("name", ""), l])
	if not extra.is_empty():
		_content.add_child(_section("Magia de linaje"))
		_content.add_child(_para(", ".join(extra) + ". [color=#b3a691]Usa %s.[/color]" % Loc.t("ab." + full.get("lineage_ability", "wis")), 16))

func _build_magic_initiate(full: Dictionary) -> void:
	var bd := _bgd()
	var mi: Dictionary = sheet.get("magic_initiate", {}).duplicate(true)
	var fixed_list: bool = bd.get("feat", "") == "magic_initiate"
	var lst: String = mi.get("list", bd.get("feat_list", "wizard") if fixed_list else "wizard")
	mi["list"] = lst
	_content.add_child(_section("Iniciado en la magia (%s)" % LIST_NAMES.get(lst, lst)))
	if not fixed_list:
		var lf := _flow()
		_content.add_child(lf)
		for l in ["cleric", "druid", "wizard"]:
			var id: String = l
			lf.add_child(_chip(LIST_NAMES[l], l == lst, func():
				sheet["magic_initiate"] = {"list": id}
				_changed()))
	var af := _flow()
	_content.add_child(af)
	af.add_child(UI.label("Característica:", 17, UI.TEXT_DIM))
	for a in ["int", "wis", "cha"]:
		var id: String = a
		af.add_child(_chip(Loc.t("ab." + a), full.get("magic_initiate", {}).get("ability", "") == a, func():
			var m2: Dictionary = sheet.get("magic_initiate", {}).duplicate(true)
			m2["ability"] = id
			sheet["magic_initiate"] = m2
			_changed()))
	var known: Array = sheet.get("cantrips", [])
	var cur: Array = mi.get("cantrips", [])
	_content.add_child(UI.label("Dos trucos (%d/2)" % cur.size(), 17, UI.TEXT, UI.FONT_BOLD))
	var g := _grid(_cols(330))
	_content.add_child(g)
	for sid in RulesDB.class_spell_list(lst, 0):
		var sp := RulesDB.spell(sid)
		if int(sp.get("level", -1)) != 0 or sp.get("hidden", false):
			continue
		var on: bool = sid in cur
		var dup: bool = sid in known
		var id: String = sid
		g.add_child(_spell_card(sid, on, func():
			var m3: Dictionary = sheet.get("magic_initiate", {}).duplicate(true)
			var cl: Array = m3.get("cantrips", []).duplicate()
			if id in cl:
				cl.erase(id)
			elif cl.size() < 2:
				cl.append(id)
			m3["cantrips"] = cl
			sheet["magic_initiate"] = m3
			_changed(), (on or cur.size() < 2) and not dup))
	_content.add_child(UI.label("Un conjuro de nivel 1 (gratis una vez al día)", 17, UI.TEXT, UI.FONT_BOLD))
	var g2 := _grid(_cols(330))
	_content.add_child(g2)
	for sid in RulesDB.class_spell_list(lst, 1):
		var sp := RulesDB.spell(sid)
		if int(sp.get("level", 0)) != 1 or sp.get("hidden", false):
			continue
		var on: bool = mi.get("spell", "") == sid
		var id: String = sid
		g2.add_child(_spell_card(sid, on, func():
			var m4: Dictionary = sheet.get("magic_initiate", {}).duplicate(true)
			m4["spell"] = id
			sheet["magic_initiate"] = m4
			_changed()))

func _spell_card(sid: String, on: bool, cb: Callable, enabled := true) -> Control:
	var sp := RulesDB.spell(sid)
	var bits: Array = []
	match sp.get("cast", "action"):
		"bonus":
			bits.append("adicional")
		"reaction":
			bits.append("reacción")
		"rider":
			bits.append("al impactar")
	if sp.get("concentration", false):
		bits.append("concentración")
	var desc: String = sp.get("desc", "")
	if sp.get("utility", false) and not ("exploración" in desc or "fuera de combate" in desc or "diálogos" in desc):
		bits.append("fuera de combate")
	var rng := int(sp.get("range", 0))
	if rng > 5:
		bits.append("%s m" % _m(rng))
	elif str(sp.get("target", "")) == "self":
		bits.append("personal")
	var sub: String = sp.get("desc", "")
	if not bits.is_empty():
		sub = "(%s) %s" % [", ".join(bits), sub]
	return _card(sp.get("name", sid), sub, RulesDB.spell_icon(sid), on, cb, enabled, true)

# ================================================================== 8. equipo

func _build_equipment() -> void:
	var cd := _cd()
	var full := _full()
	var g := _grid(1)
	_content.add_child(g)
	for k in cd.get("kits", []):
		var req: String = k.get("requires", "")
		if not req.is_empty() and req != full.get("divine_order", "") and req != full.get("primal_order", ""):
			continue
		var test: Dictionary = sheet.duplicate(true)
		test["kit"] = k.id
		var tf := CharacterSheet.complete(test, level)
		var c := Factory.make_from_sheet(tf, level, "preview")
		var parts: Array = []
		var arm: String = k.get("armor", "")
		parts.append("CA %d (%s%s)" % [c.ac(), RulesDB.armor.get(arm, {}).get("name", "sin armadura") if not arm.is_empty() else "sin armadura", ", escudo" if k.get("shield", false) else ""])
		var ws: Array = []
		for w in k.get("weapons", []):
			var wd: Dictionary = RulesDB.weapons.get(w, {})
			ws.append("%s (%s)" % [wd.get("name", w), wd.get("damage", "")])
		parts.append(", ".join(ws))
		var items: Array = []
		for it in k.get("items", {}).keys():
			items.append(_item_name(it))
		var gold := int(k.get("gold", 0)) + int(_bgd().get("gold", 0))
		var sub := " · ".join(parts)
		if not items.is_empty():
			sub += " · " + ", ".join(items)
		sub += " · %d po" % gold
		var arm_d: Dictionary = RulesDB.armor.get(arm, {})
		if int(arm_d.get("str_req", 0)) > int(CharacterSheet.final_abilities(tf).str):
			sub += " · [Fuerza insuficiente: −3 m de velocidad]"
		var id: String = k.id
		g.add_child(_card(k.get("name", id), sub, "melee", full.get("kit", "") == k.id, func():
			sheet["kit"] = id
			sheet.erase("masteries")
			_changed()))
	_content.add_child(_para("[color=#b3a691]Además: una poción de curación y el equipo de tu trasfondo (%s).[/color]" % ", ".join(
		_bgd().get("items", {}).keys().map(func(it): return _item_name(it))), 16))

static func _item_name(id: String) -> String:
	return str(RulesDB.items.get(id, {}).get("name", id.replace("_", " "))).to_lower()

# ================================================================== 9. aspecto

func _build_look() -> void:
	var v: Dictionary = sheet.get("visual", {})
	var full_v := CharacterSheet.visual_for(_full())
	_content.add_child(_section("Atuendo"))
	var f := _flow()
	_content.add_child(f)
	for o in BODY_OPTIONS:
		var id: String = o[0]
		f.add_child(_chip(o[1], full_v.get("model", "") == id, func(): _set_visual("model", id)))
	_content.add_child(_section("Rostro"))
	var f2 := _flow()
	_content.add_child(f2)
	for o in HEAD_OPTIONS:
		var id: String = o[0]
		f2.add_child(_chip(o[1], full_v.get("head", "") == id, func(): _set_visual("head", id)))
	var f3 := _flow()
	_content.add_child(f3)
	var model: String = full_v.get("model", "knight")
	if HAT_BODIES.has(model):
		f3.add_child(_chip(HAT_BODIES[model], v.get("hat", false), func(): _set_visual("hat", not sheet.visual.get("hat", false))))
	f3.add_child(_chip("Capa", v.get("cape", true), func(): _set_visual("cape", not sheet.visual.get("cape", true))))
	if _spd().get("visual", {}).get("beard", false) and full_v.get("head", "") != "barbarian":
		f3.add_child(_chip("Barba", v.get("beard", true), func(): _set_visual("beard", not sheet.visual.get("beard", true))))
	# Piel / escamas
	var skins: Array = _spd().get("visual", {}).get("skins", [])
	if sheet.species == "dragonborn":
		skins = []
		for ad in _spd().get("ancestries", {}).values():
			skins.append(ad.color)
	_content.add_child(_section("Escamas" if sheet.species == "dragonborn" else "Piel"))
	var sf := _flow()
	_content.add_child(sf)
	for col in skins:
		var id: String = col
		sf.add_child(_swatch(col, full_v.get("skin", "") == col, func(): _set_visual("skin", id)))
	if sheet.species != "dragonborn":
		_content.add_child(_section("Pelo"))
		var hf := _flow()
		_content.add_child(hf)
		for col in HAIR_COLORS:
			var id: String = col
			hf.add_child(_swatch(col, full_v.get("hair", "") == col, func(): _set_visual("hair", id)))
	_content.add_child(_section("Ropa"))
	var cf := _flow()
	_content.add_child(cf)
	for col in CLOTH_COLORS:
		var id: String = col
		cf.add_child(_swatch(col, full_v.get("cloth", "") == col, func(): _set_visual("cloth", id)))
	var rb := UI.button("Aspecto al azar", "d20", Vector2(260, 54))
	rb.pressed.connect(_random_look)
	_content.add_child(rb)

func _set_visual(key: String, value) -> void:
	var v: Dictionary = sheet.get("visual", {}).duplicate()
	v[key] = value
	sheet["visual"] = v
	_look_touched = true
	_changed()

func _random_look() -> void:
	var v: Dictionary = sheet.get("visual", {}).duplicate()
	v["head"] = HEAD_OPTIONS[_rng.randi() % HEAD_OPTIONS.size()][0]
	v["hair"] = HAIR_COLORS[_rng.randi() % HAIR_COLORS.size()]
	v["cloth"] = CLOTH_COLORS[_rng.randi() % CLOTH_COLORS.size()]
	var skins: Array = _spd().get("visual", {}).get("skins", [])
	if not skins.is_empty():
		v["skin"] = skins[_rng.randi() % skins.size()]
	v["cape"] = _rng.randf() < 0.7
	v["hat"] = _rng.randf() < 0.35
	sheet["visual"] = v
	_look_touched = true
	_changed()

# ================================================================== 10. nombre y resumen

func _build_identity() -> void:
	var row := UI.hbox(8)
	_content.add_child(row)
	var le := LineEdit.new()
	le.placeholder_text = "Nombre del héroe"
	le.text = sheet.get("name", "")
	le.max_length = 28
	le.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	le.custom_minimum_size = Vector2(0, 56 * UI.scale_f())
	le.add_theme_font_size_override("font_size", UI.fs(24))
	le.add_theme_stylebox_override("normal", UI.stone("inset", 12))
	le.add_theme_stylebox_override("focus", UI.stone("inset", 12))
	le.text_changed.connect(func(t: String):
		sheet["name"] = t
		_full_cache = {}
		_update_side()
		_update_step_bar()
		_next_btn.disabled = not _issues().is_empty())
	row.add_child(le)
	var dice := UI.button("", "d20", Vector2(56, 56))
	dice.tooltip_text = "Nombre al azar"
	dice.pressed.connect(func():
		sheet["name"] = CharacterSheet.random_name(sheet.species, sheet.get("pronoun", "m"), _rng)
		le.text = sheet.name
		_changed(false)
		_update_step_bar()
		_next_btn.disabled = not _issues().is_empty())
	row.add_child(dice)
	var pf := _flow()
	_content.add_child(pf)
	pf.add_child(UI.label("Te refieres a tu héroe como:", 17, UI.TEXT_DIM))
	for p in PRONOUNS:
		var id: String = p[0]
		pf.add_child(_chip(p[1], sheet.get("pronoun", "m") == id, func():
			sheet["pronoun"] = id
			_changed()))
	# Resumen
	_content.add_child(_section("Resumen"))
	_content.add_child(_para(_summary_bb(), 16))
	var issues := _issues()
	if not issues.is_empty():
		_content.add_child(_para("[color=#f9b840]Antes de empezar:[/color] " + " ".join(issues), 17))

func _summary_bb() -> String:
	var full := _full()
	var c := Factory.make_from_sheet(full, level, "preview")
	var lines: Array = []
	var feats: Array = full.get("feats", []).map(func(f): return RulesDB.feats.get(f, {}).get("name", f))
	if full.has("fighting_style"):
		feats.append(RulesDB.feats.get(full.fighting_style, {}).get("name", ""))
	lines.append("[color=#dcb366]Dotes:[/color] %s" % ", ".join(feats))
	var sk: Array = full.get("skills", []).map(func(k): return Loc.t("skill." + k) + (" (pericia)" if k in full.get("expertise", []) else ""))
	lines.append("[color=#dcb366]Habilidades:[/color] %s" % ", ".join(sk))
	lines.append("[color=#dcb366]Salvaciones:[/color] %s" % _ab_list(_cd().get("saves", [])))
	var ws: Array = full.get("weapons", []).map(func(w): return RulesDB.weapons.get(w, {}).get("name", w))
	var arm: String = full.get("armor", "")
	lines.append("[color=#dcb366]Equipo:[/color] %s%s%s · %d po" % [", ".join(ws), (", " + RulesDB.armor.get(arm, {}).get("name", "")) if not arm.is_empty() else "",
		", escudo" if full.get("shield", false) else "", int(full.get("gold", 0))])
	if not full.get("masteries", []).is_empty():
		lines.append("[color=#dcb366]Maestrías:[/color] %s" % ", ".join(full.masteries.map(func(w): return "%s (%s)" % [RulesDB.weapons.get(w, {}).get("name", w), Loc.t("mastery." + str(RulesDB.weapons.get(w, {}).get("mastery", "")))])))
	var spells: Array = c.known_spells().map(func(s): return RulesDB.spell(s).get("name", s))
	if not spells.is_empty():
		lines.append("[color=#dcb366]Conjuros:[/color] %s" % ", ".join(spells))
	var feats_cls: Array = CharacterSheet.features_gained(full, 1).map(func(f): return RulesDB.feature_name(f))
	lines.append("[color=#dcb366]Rasgos:[/color] %s" % ", ".join(feats_cls + _spd().get("traits", []).map(func(f): return RulesDB.feature_name(f))))
	return "\n".join(lines)
