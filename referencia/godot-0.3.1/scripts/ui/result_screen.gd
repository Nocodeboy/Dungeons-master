class_name ResultScreen
extends Control
## Resultado del combate: victoria (estadísticas, relato final y subida de nivel) o derrota.
## Emite chosen("next" | "retry" | "menu").

signal chosen(what: String)

## Rasgos nuevos al subir de nivel (SRD 5.2.1, clases de nivel 1-3).
const LEVEL_UP := {
	2: {
		"brenna": ["[b]Oleada de acción[/b]: una vez por descanso, una acción extra en tu turno.", "[b]Mente táctica[/b] y más puntos de golpe."],
		"pip": ["[b]Acción astuta[/b]: Correr, Destrabarse o Esconderse como acción adicional."],
		"ilyra": ["[b]Canalizar divinidad[/b]: Chispa divina (cura o daña) y Expulsar muertos vivientes.", "Un espacio de conjuro más y [b]Orden imperiosa[/b] preparada."],
		"odvar": ["[b]Erudito[/b] y un espacio de conjuro más.", "Nuevo conjuro preparado: [b]Manos ardientes[/b]."],
	},
	3: {
		"brenna": ["Subclase [b]Campeón[/b]: [b]Crítico mejorado[/b], crítico con 19 o 20.", "[b]Atleta notable[/b]."],
		"pip": ["Subclase [b]Ladrón[/b]: [b]Manos rápidas[/b].", "[b]Puntería firme[/b] y [b]ataque furtivo de 2d6[/b]."],
		"ilyra": ["Subclase [b]Dominio de la Vida[/b]: tus curaciones sanan más y [b]Preservar la vida[/b].", "Espacios de nivel 2: [b]Arma espiritual[/b], [b]Inmovilizar persona[/b], [b]Auxilio[/b]."],
		"odvar": ["Subclase [b]Evocador[/b]: [b]Truco potente[/b], tus trucos hacen la mitad del daño aunque fallen.", "Espacios de nivel 2: [b]Rayo abrasador[/b] y [b]Estallido[/b]."],
	},
}

const PARTY := ["brenna", "pip", "ilyra", "odvar"]

const DEFEAT_TIPS := {
	"e1_prado": "Usa las cercas: dan cobertura media y obligan a los trasgos a rodear. Mantén a tus combatientes delante y castiga a los grupos con conjuros de área como Dormir.",
	"e2_pinar": "Los lobos derriban y cazan en manada. Formad juntos, con los más frágiles detrás de la primera línea, y usad el arroyo para frenarlos.",
	"e3_tumulo": "Golpea a los esqueletos con armas contundentes y no dejes que el tumulario aísle a nadie. Expulsar muertos vivientes y el daño radiante son tus mejores bazas.",
}

var result: Dictionary = {}

func setup(p_result: Dictionary) -> void:
	result = p_result

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	var veil := ColorRect.new()
	veil.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	veil.color = Color(0.03, 0.025, 0.02, 0.55)
	veil.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(veil)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 28 if side in ["top", "bottom"] else 40)
	add_child(margin)
	if result.get("won", false):
		_build_victory(margin)
	else:
		_build_defeat(margin)
	UI.fade_in(self, 0.5)

# ================================================================== victoria

func _build_victory(root: Control) -> void:
	var enc_id: String = result.get("encounter", "")
	var enc: Dictionary = RulesDB.encounters.get(enc_id, {})
	var col := UI.vbox(12)
	root.add_child(col)
	var head := UI.vbox(2)
	var t := UI.title("Victoria", 56)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	head.add_child(t)
	var rounds := int(result.get("rounds", 0))
	var prev_best := int(result.get("prev_best", 0))
	var sub := "%s · %d %s" % [enc.get("name", ""), rounds, "ronda" if rounds == 1 else "rondas"]
	if prev_best > 0 and rounds < prev_best:
		sub += " · ¡nuevo récord!"
	elif prev_best > 0:
		sub += " (récord: %d)" % prev_best
	var s := UI.label(sub, 21, UI.TEXT_DIM, UI.FONT_SC)
	s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	head.add_child(s)
	col.add_child(head)
	var body := UI.hbox(22)
	col.add_child(body)
	# Izquierda: estadísticas
	var left := UI.panel("panel", 18)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.size_flags_stretch_ratio = 0.9
	left.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	body.add_child(left)
	left.add_child(_stats_table())
	# Derecha: relato y subida de nivel
	var right := UI.panel("panel", 18)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	right.size_flags_vertical = Control.SIZE_SHRINK_BEGIN
	body.add_child(right)
	var sc := ScrollContainer.new()
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	right.add_child(sc)
	_fit_scroll.call_deferred(sc)
	var rv := UI.vbox(12)
	rv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	sc.add_child(rv)
	for para in enc.get("outro", []):
		var r := UI.rich(_style(Game.hero_text(para)), 20)
		r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		rv.add_child(r)
	var next_level := int(enc.get("level", 1)) + 1
	if LEVEL_UP.has(next_level):
		rv.add_child(_level_up_box(next_level))
	var fill := Control.new()
	fill.size_flags_vertical = Control.SIZE_EXPAND_FILL
	fill.mouse_filter = Control.MOUSE_FILTER_IGNORE
	col.add_child(fill)
	# Botones
	var bar := UI.hbox(12)
	bar.alignment = BoxContainer.ALIGNMENT_END
	var menu := UI.button("Menú", "menu", Vector2(170, 62))
	menu.pressed.connect(func(): chosen.emit("menu"))
	bar.add_child(menu)
	var again := UI.button("Repetir", "undo", Vector2(170, 62))
	again.pressed.connect(func(): chosen.emit("retry"))
	bar.add_child(again)
	var idx: int = Game.ENCOUNTER_ORDER.find(enc_id)
	var is_last: bool = idx == Game.ENCOUNTER_ORDER.size() - 1
	var nxt := UI.button("Créditos" if is_last else "Siguiente combate", "book" if is_last else "attack", Vector2(280, 62))
	nxt.pressed.connect(func(): chosen.emit("credits" if is_last else "next"))
	bar.add_child(nxt)
	col.add_child(bar)
	if LEVEL_UP.has(next_level):
		Game.sfx("levelup", -2)

## Ajusta la altura del relato a su contenido sin pasarse de la pantalla.
func _fit_scroll(sc: ScrollContainer) -> void:
	await get_tree().process_frame
	if not is_instance_valid(sc) or sc.get_child_count() == 0:
		return
	var content: Control = sc.get_child(0)
	var max_h := get_viewport_rect().size.y - 300.0
	sc.custom_minimum_size.y = min(content.get_combined_minimum_size().y, max_h)

func _stats_table() -> Control:
	var v := UI.vbox(8)
	v.add_child(UI.label("EL GRUPO", 17, UI.GOLD, UI.FONT_SC))
	var stats: Dictionary = result.get("stats", {})
	# El más destacado: daño + curación ×1,2 + bajas ×5
	var best_id := ""
	var best_v := -1.0
	for pid in stats:
		var st: Dictionary = stats[pid]
		var score := float(st.get("damage_dealt", 0)) + float(st.get("healed", 0)) * 1.2 + float(st.get("kills", 0)) * 5.0
		if score > best_v:
			best_v = score
			best_id = pid
	var order: Array = result.get("party", PARTY)
	for pid in order:
		if not stats.has(pid):
			continue
		var st: Dictionary = stats[pid]
		var row := UI.hbox(10)
		var tex: Texture2D = Portraits.cache.get(st.get("portrait", pid))
		var tr := TextureRect.new()
		tr.texture = tex
		tr.custom_minimum_size = Vector2(64, 64) * UI.scale_f()
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		var frame := UI.panel("slab_selected" if pid == best_id else "inset", 3)
		frame.add_child(tr)
		row.add_child(frame)
		var info := UI.vbox(2)
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		var nm: String = st.get("name", pid)
		var name_row := UI.hbox(8)
		name_row.add_child(UI.label(nm, 20, UI.TEXT, UI.FONT_BOLD))
		if pid == best_id and best_v > 0:
			name_row.add_child(UI.label("★ Destacado", 16, UI.GOLD, UI.FONT_SC))
		if st.get("dead", false):
			name_row.add_child(UI.label("† Caído", 16, UI.ENEMY, UI.FONT_SC))
		info.add_child(name_row)
		var parts: Array = []
		parts.append("Daño %d" % int(st.get("damage_dealt", 0)))
		if int(st.get("healed", 0)) > 0:
			parts.append("Curación %d" % int(st.get("healed", 0)))
		parts.append("Bajas %d" % int(st.get("kills", 0)))
		if int(st.get("crits", 0)) > 0:
			parts.append("Críticos %d" % int(st.get("crits", 0)))
		if int(st.get("downs", 0)) > 0:
			parts.append("Caídas %d" % int(st.get("downs", 0)))
		info.add_child(UI.label("  ·  ".join(parts), 17, UI.TEXT_DIM))
		row.add_child(info)
		v.add_child(row)
	return v

func _level_up_box(lvl: int) -> Control:
	var p := UI.panel("panel", 14)
	var v := UI.vbox(8)
	p.add_child(v)
	var h := UI.hbox(10)
	h.add_child(UI.icon_rect("levelup" if UI.icon("levelup") else "d20", 30, UI.GOLD))
	h.add_child(UI.title("¡Subida de nivel! Nivel %d" % lvl, 24))
	v.add_child(h)
	var names := {"brenna": "Brenna", "pip": "Pip", "ilyra": "Ilyra", "odvar": "Odvar"}
	var lines: Array = []
	var order: Array = result.get("party", PARTY)
	for pid in order:
		if pid == "hero" and Game.has_hero():
			var gained: Array = CharacterSheet.features_gained(CharacterSheet.complete(Game.hero, lvl), lvl)
			var fnames: Array = gained.map(func(f): return "[b]%s[/b]" % RulesDB.feature_name(f))
			var txt := (", ".join(fnames) + ". ") if not fnames.is_empty() else ""
			txt += "Antes del siguiente combate elegirás tus mejoras."
			lines.push_front("[color=#dbb366][b]%s[/b][/color] — %s" % [str(Game.hero.get("name", "Tu héroe")).split(" ")[0], txt])
			continue
		var feats: Array = LEVEL_UP[lvl].get(pid, [])
		if feats.is_empty():
			continue
		lines.append("[color=#dbb366][b]%s[/b][/color] — %s" % [names.get(pid, pid), " ".join(feats)])
	var r := UI.rich("\n".join(lines), 18)
	r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.add_child(r)
	return p

func _style(text: String) -> String:
	return text.replace("«", "[color=#e8d3a8][i]«").replace("»", "»[/i][/color]")

# ================================================================== derrota

func _build_defeat(root: Control) -> void:
	var enc_id: String = result.get("encounter", "")
	var enc: Dictionary = RulesDB.encounters.get(enc_id, {})
	var center := CenterContainer.new()
	root.add_child(center)
	var p := UI.panel("panel", 26)
	p.custom_minimum_size = Vector2(720, 0)
	center.add_child(p)
	var v := UI.vbox(14)
	p.add_child(v)
	var t := UI.title("Derrota", 54)
	t.add_theme_color_override("font_color", Color(0.85, 0.35, 0.28))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(t)
	var s := UI.label(enc.get("name", ""), 21, UI.TEXT_DIM, UI.FONT_SC)
	s.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	v.add_child(s)
	var r := UI.rich("El grupo ha caído. Pero en la Marca las leyendas se cuentan de nuevo cada invierno, y esta todavía puede acabar de otra manera.", 21)
	v.add_child(r)
	var tip: String = DEFEAT_TIPS.get(enc_id, "")
	if not tip.is_empty():
		var tp := UI.panel("inset", 12)
		var tr := UI.rich("[color=#dbb366][b]Consejo:[/b][/color] " + tip, 19)
		tp.add_child(tr)
		v.add_child(tp)
	var bar := UI.hbox(12)
	var menu := UI.button("Menú", "menu", Vector2(0, 64))
	menu.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	menu.pressed.connect(func(): chosen.emit("menu"))
	bar.add_child(menu)
	var retry := UI.button("Reintentar", "undo", Vector2(0, 64))
	retry.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	retry.size_flags_stretch_ratio = 1.6
	retry.pressed.connect(func(): chosen.emit("retry"))
	bar.add_child(retry)
	v.add_child(bar)
