class_name InventoryScreen
extends Control
## Inventario y equipo de cada personaje: huecos de equipo, mochila, estadísticas y el
## cambio al momento en CA, ataque y daño al equipar algo.

signal closed

var cp: Campaign
var current := ""
var members: Array = []      ## Creature del grupo (para retratos y orden)
var _tabs: HBoxContainer
var _slots: VBoxContainer
var _stats: RichTextLabel
var _bag: VBoxContainer
var _detail: VBoxContainer
var _gold: Label
var _sel := {}               ## {where: "slot"|"pack"|"stack", key, idx}
var _dummy_battle: Battle

func setup(p_cp: Campaign, who: String, p_members: Array) -> void:
	cp = p_cp
	members = p_members
	current = who if cp.members.has(who) else str(cp.party[0])

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	z_index = 40
	_dummy_battle = Battle.new(BattleMap.new(), 1)
	var dim := ColorRect.new()
	dim.color = Color(0, 0, 0, 0.6)
	dim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(dim)
	var root := UI.panel("panel", 18)
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.offset_left = 24
	root.offset_right = -24
	root.offset_top = 16
	root.offset_bottom = -16
	add_child(root)
	var v := UI.vbox(10)
	root.add_child(v)
	# Cabecera
	var head := UI.hbox(12)
	head.add_child(UI.title("Inventario", 32))
	_tabs = UI.hbox(8)
	_tabs.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(_tabs)
	head.add_child(UI.icon_rect("coins", 28, UI.GOLD))
	_gold = UI.label("", 24, UI.GOLD, UI.FONT_BOLD)
	head.add_child(_gold)
	var x := UI.button("", "cross", Vector2(60, 60))
	x.pressed.connect(close)
	head.add_child(x)
	v.add_child(head)
	v.add_child(UI.divider())
	# Cuerpo: equipo | estadísticas y detalle | mochila
	var body := UI.hbox(14)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(body)
	var left := UI.vbox(6)
	left.custom_minimum_size.x = 360
	left.add_child(UI.label("Equipo", 20, UI.GOLD, UI.FONT_SC))
	var ls := ScrollContainer.new()
	ls.size_flags_vertical = Control.SIZE_EXPAND_FILL
	ls.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_slots = UI.vbox(4)
	_slots.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ls.add_child(_slots)
	left.add_child(ls)
	body.add_child(left)
	var mid := UI.vbox(8)
	mid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var sp := UI.panel("inset", 12)
	_stats = UI.rich("", 18)
	_stats.fit_content = true
	sp.add_child(_stats)
	mid.add_child(sp)
	var dp := UI.panel("inset", 12)
	dp.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var ds := ScrollContainer.new()
	ds.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_detail = UI.vbox(8)
	_detail.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ds.add_child(_detail)
	dp.add_child(ds)
	mid.add_child(dp)
	body.add_child(mid)
	var right := UI.vbox(6)
	right.custom_minimum_size.x = 380
	right.add_child(UI.label("Mochila", 20, UI.GOLD, UI.FONT_SC))
	var rs := ScrollContainer.new()
	rs.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rs.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_bag = UI.vbox(4)
	_bag.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rs.add_child(_bag)
	right.add_child(rs)
	body.add_child(right)
	_refresh()
	UI.fade_in(self, 0.15)
	Game.sfx("book", -6)

func close() -> void:
	if is_queued_for_deletion():
		return
	Game.sfx("close", -8)
	closed.emit()
	queue_free()

func _sheet() -> Dictionary:
	return cp.members[current]

func _creature(sheet: Dictionary) -> Creature:
	return Factory.make_from_sheet(sheet, cp.party_level, current)

# ================================================================== refresco

func _refresh() -> void:
	_gold.text = "%d po" % cp.gold
	_build_tabs()
	_build_slots()
	_build_bag()
	_build_stats()
	_build_detail()

func _build_tabs() -> void:
	for ch in _tabs.get_children():
		ch.queue_free()
	for id in cp.party:
		var c: Creature = null
		for m in members:
			if m.id == id:
				c = m
		var nm: String = cp.short_name(id)
		var b := UI.button(nm, "", Vector2(0, 56))
		if c != null and Portraits.get_portrait(c) != null:
			b.icon = Portraits.get_portrait(c)
			b.expand_icon = false
			b.add_theme_constant_override("icon_max_width", 44)
		UI.stone_button(b, id == current, 8)
		var pid: String = id
		b.pressed.connect(func():
			current = pid
			_sel = {}
			_refresh())
		_tabs.add_child(b)

func _slot_row(label: String, id: String, key: String) -> void:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(0, 54)
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.clip_text = true
	var empty := id.is_empty()
	b.text = "%s:  %s" % [label, "—" if empty else Items.name_of(id)]
	b.icon = UI.icon(Items.icon_of(id) if not empty else _slot_icon(key))
	b.expand_icon = false
	b.add_theme_constant_override("icon_max_width", 32)
	if not empty:
		b.add_theme_color_override("font_color", Items.color_of(id))
	else:
		b.add_theme_color_override("font_color", UI.TEXT_DIM)
	UI.stone_button(b, _sel.get("where", "") == "slot" and _sel.get("key", "") == key, 8)
	b.pressed.connect(func():
		Game.sfx("select", -10)
		_sel = {"where": "slot", "key": key, "id": id}
		_refresh())
	_slots.add_child(b)

func _slot_icon(key: String) -> String:
	if key.begins_with("weapon"):
		return "sword"
	return {"armor": "armor", "shield": "shield", "cloak": "cloak", "ring1": "ring", "ring2": "ring", "amulet": "amulet",
		"boots": "boots", "gloves": "gauntlets"}.get(key, "bag")

func _build_slots() -> void:
	for ch in _slots.get_children():
		ch.queue_free()
	var s := _sheet()
	var ws: Array = s.get("weapons", [])
	for i in Items.MAX_WEAPONS:
		_slot_row("Arma %d" % (i + 1), str(ws[i]) if i < ws.size() else "", "weapon:%d" % i)
	_slot_row("Armadura", str(s.get("armor", "")), "armor")
	_slot_row("Escudo", str(s.get("shield_id", "shield")) if bool(s.get("shield", false)) else "", "shield")
	var worn: Dictionary = s.get("worn", {})
	for k in Items.WORN_SLOTS:
		_slot_row(Items.SLOT_NAMES[k], str(worn.get(k, "")), k)
	# Munición
	var am: Dictionary = s.get("ammo", {})
	if not am.is_empty():
		var parts: Array = []
		for k in am.keys():
			var nm: String = Items.AMMO_NAMES.get(k, RulesDB.weapons.get(k, {}).get("name", k))
			parts.append("%s %d" % [nm, int(am[k])])
		var l := UI.label("Munición: " + ", ".join(parts), 16, UI.TEXT_DIM)
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		_slots.add_child(l)
	var att := Items.attuned(s).size()
	_slots.add_child(UI.label("Sintonía: %d/%d objetos" % [att, Items.MAX_ATTUNED], 16, UI.TEXT_DIM))

func _build_bag() -> void:
	for ch in _bag.get_children():
		ch.queue_free()
	var s := _sheet()
	var p := Items.pack(s)
	var any := false
	for i in p.size():
		var e: Dictionary = p[i]
		_bag_row(Items.name_of(e.id, e.get("unid", false)), e.id, e.get("unid", false), {"where": "pack", "idx": i, "id": e.id})
		any = true
	var st := Items.stack(s)
	var keys: Array = st.keys()
	keys.sort_custom(func(a, b): return _kind_order(a) < _kind_order(b))
	for id in keys:
		var n := int(st[id])
		if n <= 0:
			continue
		var nm := Items.name_of(id)
		if Items.kind(id) == "wand":
			nm += " (%d cargas)" % int(s.get("charges", {}).get(id, 0))
		elif n > 1:
			nm += " ×%d" % n
		_bag_row(nm, id, false, {"where": "stack", "id": id})
		any = true
	if not any:
		_bag.add_child(UI.label("La mochila está vacía.", 18, UI.TEXT_DIM))

func _kind_order(id: String) -> int:
	return ["potion", "scroll", "wand", "ammo", "tool", "gear", "treasure", "key"].find(Items.kind(id))

func _bag_row(text: String, id: String, unid: bool, sel: Dictionary) -> void:
	var b := Button.new()
	b.focus_mode = Control.FOCUS_NONE
	b.custom_minimum_size = Vector2(0, 50)
	b.alignment = HORIZONTAL_ALIGNMENT_LEFT
	b.clip_text = true
	b.text = text
	b.icon = UI.icon(Items.icon_of(id))
	b.expand_icon = false
	b.add_theme_constant_override("icon_max_width", 30)
	b.add_theme_color_override("font_color", Items.color_of(id, unid))
	var selected: bool = _sel.get("where", "") == sel.where and _sel.get("id", "") == sel.id and _sel.get("idx", -1) == sel.get("idx", -1)
	UI.stone_button(b, selected, 8)
	b.pressed.connect(func():
		Game.sfx("select", -10)
		_sel = sel
		_refresh())
	_bag.add_child(b)

func _build_stats() -> void:
	var s := _sheet()
	var c := _creature(s)
	var st: Dictionary = cp.state.get(current, {})
	var hp := int(st.get("hp", c.max_hp))
	var lines: Array = []
	lines.append("[font_size=24][b]%s[/b][/font_size]  [color=#bfb3a0]%s %s · nivel %d[/color]" % [c.name, Factory.species_name(c.species), RulesDB.classes.get(c.cls, {}).get("name", c.cls), c.level])
	lines.append("[b]CA[/b] %d    [b]PG[/b] %d/%d    [b]Velocidad[/b] %s" % [c.ac(), hp, c.max_hp, Loc.ft(c.speed())])
	var profs := _dummy_battle.attack_profiles(c)
	var shown := 0
	for p in profs:
		if shown >= 3:
			break
		var dmg := ""
		for d in p.damage:
			dmg += "%s %s " % [d.dice, Loc.dmg_type(d.type)]
		lines.append("[b]%s[/b] %+d · %s" % [p.name, int(p.bonus), dmg.strip_edges()])
		shown += 1
	var ab_line := ""
	for a in ["str", "dex", "con", "int", "wis", "cha"]:
		ab_line += "%s %d  " % [Loc.ability_short(a), int(c.abilities[a])]
	lines.append("[color=#bfb3a0]%s[/color]" % ab_line.strip_edges())
	_stats.text = "\n".join(lines)

# ================================================================== detalle y acciones

func _build_detail() -> void:
	for ch in _detail.get_children():
		ch.queue_free()
	if _sel.is_empty():
		_detail.add_child(UI.label("Toca un objeto para ver qué hace.", 18, UI.TEXT_DIM))
		return
	var s := _sheet()
	var id: String = _sel.get("id", "")
	var where: String = _sel.where
	if where == "slot" and id.is_empty():
		_detail.add_child(UI.label("Hueco vacío. Elige algo de la mochila para equiparlo.", 18, UI.TEXT_DIM))
		return
	var unid := false
	if where == "pack":
		var p := Items.pack(s)
		if int(_sel.idx) >= p.size():
			_sel = {}
			_build_detail()
			return
		unid = p[int(_sel.idx)].get("unid", false)
	_detail.add_child(UI.label(Items.name_of(id, unid), 24, Items.color_of(id, unid), UI.FONT_BOLD))
	var r := UI.rich(Items.describe(id, unid), 18)
	r.fit_content = true
	_detail.add_child(r)
	var val := Items.sell_value(id, unid)
	if val > 0:
		_detail.add_child(UI.label("Valor: %d po" % (val * (1 if Items.kind(id) == "treasure" else 2)), 16, UI.TEXT_DIM))
	var acts := UI.hbox(8)
	_detail.add_child(acts)
	match where:
		"slot":
			_add_act(acts, "Quitar", "undo", func():
				Items.unequip(s, str(_sel.key))
				_sel = {}
				_refresh())
			if str(id) == "pearl_power" or Items.data(id).get("mods", {}).get("pearl", false):
				_add_act(acts, "Usar la perla", "magic", _use_pearl)
		"pack":
			if not unid and not Items.slot_of(id).is_empty():
				var preview := _equip_preview(int(_sel.idx))
				if not preview.is_empty():
					var pv := UI.rich(preview, 18)
					pv.fit_content = true
					_detail.add_child(pv)
				var slot := Items.slot_of(id)
				if slot == "ring":
					_add_act(acts, "Anillo izq.", "ring", func(): _equip(int(_sel.idx), "ring1"))
					_add_act(acts, "Anillo der.", "ring", func(): _equip(int(_sel.idx), "ring2"))
				else:
					_add_act(acts, "Equipar", "check", func(): _equip(int(_sel.idx)))
		"stack":
			var k := Items.kind(id)
			if k == "potion" and Items.data(id).get("use", {}).has("heal"):
				for m in cp.party:
					if cp.is_dead(m):
						continue
					var mn: String = cp.short_name(m)
					var mid: String = m
					_add_act(acts, "Dar de beber a %s" % mn, "potion", func(): _drink(id, mid))
			elif k in ["scroll", "wand"]:
				_detail.add_child(UI.label("Se usa en combate, desde el botón Objetos.", 16, UI.TEXT_DIM))
			elif k == "potion":
				_detail.add_child(UI.label("Se bebe en combate, desde el botón Objetos.", 16, UI.TEXT_DIM))
	# Dar a otro
	if where in ["pack", "stack"]:
		var give := UI.hbox(6)
		give.add_child(UI.label("Dar a:", 17, UI.TEXT_DIM))
		for m in cp.party:
			if m == current or cp.is_dead(m):
				continue
			var mn2: String = cp.short_name(m)
			var to: String = m
			var gb := UI.button(mn2, "", Vector2(0, 48))
			gb.pressed.connect(func(): _give(to))
			give.add_child(gb)
		_detail.add_child(give)

func _add_act(box: HBoxContainer, text: String, icon_name: String, cb: Callable) -> void:
	var b := UI.button(text, icon_name, Vector2(0, 54))
	b.pressed.connect(cb)
	box.add_child(b)

## Cambio en CA y ataque al equipar (texto con colores).
func _equip_preview(idx: int) -> String:
	var s := _sheet()
	var before := _creature(s)
	var copy := s.duplicate(true)
	var err := Items.equip(copy, idx)
	if not err.is_empty():
		return "[color=#f0a060]%s[/color]" % err
	var after := _creature(copy)
	var out: Array = []
	if after.ac() != before.ac():
		out.append("CA %d → [color=%s]%d[/color]" % [before.ac(), "#7fd86f" if after.ac() > before.ac() else "#e86a5a", after.ac()])
	var pb := _dummy_battle.attack_profiles(before)
	var pa := _dummy_battle.attack_profiles(after)
	var id: String = Items.pack(s)[idx].id
	if Items.slot_of(id) == "weapon":
		for p in pa:
			if p.weapon.get("item_id", "") == id:
				var dmg := ""
				for d in p.damage:
					dmg += "%s " % d.dice
				out.append("Con %s: %+d · %s" % [p.name, int(p.bonus), dmg.strip_edges()])
				break
	elif not pb.is_empty() and not pa.is_empty() and int(pa[0].bonus) != int(pb[0].bonus):
		out.append("Ataque %+d → %+d" % [int(pb[0].bonus), int(pa[0].bonus)])
	if after.speed() != before.speed():
		out.append("Velocidad %s → %s" % [Loc.ft(before.speed()), Loc.ft(after.speed())])
	if after.max_hp != before.max_hp:
		out.append("PG máx. %d → %d" % [before.max_hp, after.max_hp])
	return "\n".join(out)

func _equip(idx: int, ring_slot := "") -> void:
	var err := Items.equip(_sheet(), idx, ring_slot)
	if not err.is_empty():
		Game.sfx("error", -6)
		_detail.add_child(UI.label(err, 17, UI.WARN))
		return
	Game.sfx("draw", -6)
	_sel = {}
	_refresh()

func _give(to: String) -> void:
	var s := _sheet()
	var dst: Dictionary = cp.members[to]
	match str(_sel.where):
		"pack":
			var p := Items.pack(s)
			var e: Dictionary = p[int(_sel.idx)]
			p.remove_at(int(_sel.idx))
			Items.pack(dst).append(e)
		"stack":
			var id: String = _sel.id
			var n := int(Items.stack(s).get(id, 0))
			var ch := int(s.get("charges", {}).get(id, -1))
			Items.take_stack(s, id, n)
			Items.stack(dst)[id] = int(Items.stack(dst).get(id, 0)) + n
			if ch >= 0:
				var dc: Dictionary = dst.get("charges", {})
				dc[id] = ch
				dst["charges"] = dc
	Game.sfx("page", -8)
	_sel = {}
	_refresh()

func _drink(id: String, who: String) -> void:
	var st: Dictionary = cp.state.get(who, {})
	var c := Factory.make_from_sheet(cp.sheet(who), cp.party_level, who)
	if int(st.get("hp", 0)) >= c.max_hp:
		_detail.add_child(UI.label("No le hace falta: está ileso.", 17, UI.TEXT_DIM))
		return
	Items.take_stack(_sheet(), id, 1)
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var heal := Dice.roll_with(str(Items.data(id).use.heal), rng)
	st["hp"] = min(c.max_hp, int(st.get("hp", 0)) + heal)
	Game.sfx("potion")
	_sel = {}
	_refresh()
	_detail.add_child(UI.label("%s recupera %d PG." % [c.name.split(" ")[0], heal], 18, UI.HEAL))

func _use_pearl() -> void:
	var s := _sheet()
	if s.get("pearl_used", false):
		_detail.add_child(UI.label("La perla ya se ha usado hoy.", 17, UI.TEXT_DIM))
		return
	var st: Dictionary = cp.state.get(current, {})
	var c := _creature(s)
	var sl: Array = st.get("slots", [])
	for i in range(min(3, sl.size()) - 1, -1, -1):
		if int(sl[i]) < int(c.slots_max[i]):
			sl[i] = int(sl[i]) + 1
			s["pearl_used"] = true
			Game.sfx("buff")
			_refresh()
			_detail.add_child(UI.label("Recuperas un espacio de conjuro de nivel %d." % (i + 1), 18, UI.MAGIC))
			return
	_detail.add_child(UI.label("No te falta ningún espacio de conjuro.", 17, UI.TEXT_DIM))
