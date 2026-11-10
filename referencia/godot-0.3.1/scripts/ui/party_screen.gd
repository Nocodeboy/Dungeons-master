class_name PartyScreen
extends Control
## Elección de compañeros: el héroe y tres de los cuatro compañeros de la Marca.

signal done(ids: Array)
signal back

const BLURBS := {
	"brenna": "Escudo y espada. Aguanta la primera línea y protege a los frágiles.",
	"pip": "Ataques furtivos, arco corto y pies ligeros. Remata a los heridos.",
	"ilyra": "Cura, bendice y abrasa con luz sagrada. Mantiene al grupo en pie.",
	"odvar": "Conjuros de área, Dormir y Proyectil mágico. Frágil, pero decisivo.",
}

var selected: Array = []
var _cards := {}
var _go: Button
var _note: Label
var _portraits: Portraits

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	selected = Game.party_ids.duplicate() if Game.party_ids.size() == 3 else Game.default_companions(Game.hero.get("class", ""))
	var bg := ColorRect.new()
	bg.color = Color(0.045, 0.038, 0.033, 1.0)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)
	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 18)
	add_child(margin)
	var col := UI.vbox(12)
	margin.add_child(col)
	var top := UI.hbox(10)
	col.add_child(top)
	var x := UI.button("", "undo", Vector2(52, 52))
	x.tooltip_text = "Volver al creador"
	x.pressed.connect(func(): back.emit())
	top.add_child(x)
	var t := UI.title("Tu compañía", 30)
	t.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	top.add_child(t)
	var sub := UI.label("Elige a tres compañeros. Los demás te esperarán en Valdrecht.", 18, UI.TEXT_DIM)
	sub.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	top.add_child(sub)
	var body := UI.hbox(14)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	col.add_child(body)
	# El héroe
	var left := UI.panel("panel", 12)
	left.custom_minimum_size = Vector2(300 * UI.scale_f(), 0)
	body.add_child(left)
	var lv := UI.vbox(4)
	left.add_child(lv)
	var pv := HeroPreview.new()
	pv.size_flags_vertical = Control.SIZE_EXPAND_FILL
	lv.add_child(pv)
	pv.set_visual(CharacterSheet.visual_for(CharacterSheet.complete(Game.hero, 1)))
	var hn := UI.title(str(Game.hero.get("name", "")), 24)
	hn.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lv.add_child(hn)
	var cd: Dictionary = RulesDB.classes.get(Game.hero.get("class", ""), {})
	var hs := UI.label("%s · %s" % [RulesDB.species.get(Game.hero.get("species", ""), {}).get("name", ""), cd.get("name", "")], 17, UI.TEXT_DIM, UI.FONT_SC)
	hs.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lv.add_child(hs)
	var hr := UI.label(cd.get("role", ""), 16, UI.GOLD_DIM)
	hr.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lv.add_child(hr)
	# Compañeros
	var right := UI.vbox(10)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(right)
	var grid := GridContainer.new()
	grid.columns = 2
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	grid.size_flags_vertical = Control.SIZE_EXPAND_FILL
	right.add_child(grid)
	var twin: String = Game.ROLE_TWIN.get(Game.hero.get("class", ""), "")
	var creatures: Array = []
	for pid in Game.COMPANIONS:
		var c := Factory.make_pc(pid, 1)
		creatures.append(c)
		var card := _companion_card(pid, c, pid == twin)
		grid.add_child(card)
		_cards[pid] = card
	var bar := UI.hbox(10)
	right.add_child(bar)
	_note = UI.label("", 17, UI.TEXT_DIM)
	_note.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_note.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bar.add_child(_note)
	_go = UI.button("Partir hacia la Marca", "attack", Vector2(320, 62))
	_go.pressed.connect(func():
		if selected.size() == 3:
			Game.sfx("confirm", -4)
			done.emit(selected.duplicate()))
	bar.add_child(_go)
	_refresh()
	UI.fade_in(self, 0.35)
	# Retratos de los compañeros (se generan en un visor aparte)
	_portraits = Portraits.new()
	add_child(_portraits)
	await _portraits.render_all(creatures)
	for c in creatures:
		var card: Control = _cards.get(c.id)
		if card != null and is_instance_valid(card):
			var tr: TextureRect = card.find_child("Portrait", true, false)
			if tr != null:
				tr.texture = Portraits.get_portrait(c)

func _companion_card(pid: String, c: Creature, twin: bool) -> Control:
	var card := MarginContainer.new()
	card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	card.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var bgp := Panel.new()
	bgp.name = "Bg"
	bgp.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(bgp)
	var m := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		m.add_theme_constant_override("margin_" + side, 12)
	m.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(m)
	var h := UI.hbox(12)
	h.mouse_filter = Control.MOUSE_FILTER_IGNORE
	m.add_child(h)
	var frame := UI.panel("inset", 3)
	frame.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	var tr := TextureRect.new()
	tr.name = "Portrait"
	tr.custom_minimum_size = Vector2(96, 96) * UI.scale_f()
	tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
	tr.mouse_filter = Control.MOUSE_FILTER_IGNORE
	frame.add_child(tr)
	h.add_child(frame)
	var v := UI.vbox(2)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	v.alignment = BoxContainer.ALIGNMENT_CENTER
	v.mouse_filter = Control.MOUSE_FILTER_IGNORE
	h.add_child(v)
	var sheet: Dictionary = RulesDB.party.get(pid, {})
	var nm := UI.label(c.name, 21, UI.TEXT, UI.FONT_BOLD)
	nm.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(nm)
	var ti := UI.label("%s · %s %s" % [sheet.get("title", ""), RulesDB.classes.get(c.cls, {}).get("name", ""), RulesDB.species.get(c.species, {}).get("name", "").to_lower()], 15, UI.GOLD_DIM, UI.FONT_SC)
	ti.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	ti.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(ti)
	var bl := UI.label(BLURBS.get(pid, ""), 16, UI.TEXT_DIM)
	bl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bl.mouse_filter = Control.MOUSE_FILTER_IGNORE
	v.add_child(bl)
	var quote: Array = BattleScreen.BARKS.get(pid, {}).get("start", [])
	if not quote.is_empty():
		var q := UI.label("«%s»" % quote[0], 16, Color(0.91, 0.83, 0.66))
		q.add_theme_font_override("font", UI.italic())
		q.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		q.mouse_filter = Control.MOUSE_FILTER_IGNORE
		v.add_child(q)
	if twin:
		var tw := UI.label("Cubre el mismo papel que tu héroe.", 14, UI.WARN, UI.FONT_SC)
		tw.mouse_filter = Control.MOUSE_FILTER_IGNORE
		v.add_child(tw)
	var b := Button.new()
	b.flat = true
	b.focus_mode = Control.FOCUS_NONE
	b.mouse_filter = Control.MOUSE_FILTER_PASS
	for st in ["normal", "hover", "pressed", "focus"]:
		b.add_theme_stylebox_override(st, StyleBoxEmpty.new())
	var id := pid
	b.pressed.connect(func():
		Game.sfx("click", -8)
		_toggle(id))
	card.add_child(b)
	return card

func _toggle(pid: String) -> void:
	if pid in selected:
		selected.erase(pid)
	elif selected.size() < 3:
		selected.append(pid)
	else:
		# Sustituye al primero elegido: más cómodo que obligar a desmarcar
		selected.pop_front()
		selected.append(pid)
	_refresh()

func _refresh() -> void:
	for pid in _cards.keys():
		var card: Control = _cards[pid]
		var on: bool = pid in selected
		var bgp: Panel = card.get_node("Bg")
		bgp.add_theme_stylebox_override("panel", UI.stone("slab_selected" if on else "slab"))
		card.modulate = Color(1, 1, 1, 1) if on else Color(0.72, 0.72, 0.72, 1)
	_go.disabled = selected.size() != 3
	var left := Game.COMPANIONS.filter(func(p): return not p in selected)
	if selected.size() == 3 and left.size() == 1:
		_note.text = "%s se queda en Valdrecht." % BattleScreen.SHORT_NAMES.get(left[0], left[0])
	else:
		_note.text = "Elige %d más." % (3 - selected.size())
