class_name ShopScreen
extends Control
## Comercio: lo que vende el comerciante (izquierda) y lo que puede venderle cada personaje
## (derecha). El oro es del grupo. Lo vendido se puede recomprar.

signal closed

var cp: Campaign
var shop_id := ""
var shop: Dictionary = {}
var who := ""
var merchant: Creature
var _buy: VBoxContainer
var _sell: VBoxContainer
var _tabs: HBoxContainer
var _gold: Label
var _info: RichTextLabel

func setup(p_cp: Campaign, p_shop: String, p_who: String, p_merchant: Creature) -> void:
	cp = p_cp
	shop_id = p_shop
	shop = RulesDB.merchants.get(shop_id, {})
	who = p_who if cp.members.has(p_who) else str(cp.party[0])
	merchant = p_merchant
	if not cp.merchants.has(shop_id):
		cp.merchants[shop_id] = {"stock": shop.get("stock", {}).duplicate()}

func _stock() -> Dictionary:
	return cp.merchants[shop_id].stock

func _ready() -> void:
	theme = UI.theme()
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_STOP
	z_index = 40
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
	var head := UI.hbox(12)
	if merchant != null and Portraits.get_portrait(merchant) != null:
		var tr := TextureRect.new()
		tr.texture = Portraits.get_portrait(merchant)
		tr.custom_minimum_size = Vector2(64, 64)
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_COVERED
		head.add_child(tr)
	var t := UI.title(str(shop.get("name", "Tienda")), 32)
	t.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	head.add_child(t)
	head.add_child(UI.icon_rect("coins", 28, UI.GOLD))
	_gold = UI.label("", 24, UI.GOLD, UI.FONT_BOLD)
	head.add_child(_gold)
	var x := UI.button("", "cross", Vector2(60, 60))
	x.pressed.connect(close)
	head.add_child(x)
	v.add_child(head)
	v.add_child(UI.divider())
	var body := UI.hbox(16)
	body.size_flags_vertical = Control.SIZE_EXPAND_FILL
	v.add_child(body)
	var left := UI.vbox(6)
	left.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left.add_child(UI.label("Se vende", 20, UI.GOLD, UI.FONT_SC))
	var ls := ScrollContainer.new()
	ls.size_flags_vertical = Control.SIZE_EXPAND_FILL
	ls.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_buy = UI.vbox(4)
	_buy.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	ls.add_child(_buy)
	left.add_child(ls)
	body.add_child(left)
	var right := UI.vbox(6)
	right.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	var rh := UI.hbox(8)
	rh.add_child(UI.label("Vender", 20, UI.GOLD, UI.FONT_SC))
	_tabs = UI.hbox(6)
	rh.add_child(_tabs)
	right.add_child(rh)
	var rs := ScrollContainer.new()
	rs.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rs.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	_sell = UI.vbox(4)
	_sell.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rs.add_child(_sell)
	right.add_child(rs)
	body.add_child(right)
	var ip := UI.panel("inset", 10)
	_info = UI.rich("[color=#bfb3a0]Toca el nombre de un objeto para ver qué hace. Lo que compres lo lleva el personaje elegido a la derecha.[/color]", 17)
	_info.fit_content = true
	ip.add_child(_info)
	v.add_child(ip)
	_refresh()
	UI.fade_in(self, 0.15)
	Game.sfx("coins", -8)

func close() -> void:
	if is_queued_for_deletion():
		return
	Game.sfx("close", -8)
	closed.emit()
	queue_free()

func _price(id: String) -> int:
	return int(ceil(Items.value(id) * float(shop.get("markup", 1.0))))

func _refresh() -> void:
	_gold.text = "%d po" % cp.gold
	_build_tabs()
	_build_buy()
	_build_sell()

func _build_tabs() -> void:
	for ch in _tabs.get_children():
		ch.queue_free()
	for id in cp.party:
		if cp.is_dead(id):
			continue
		var nm: String = cp.short_name(id)
		var b := UI.button(nm, "", Vector2(0, 48))
		UI.stone_button(b, id == who, 8)
		var pid: String = id
		b.pressed.connect(func():
			who = pid
			_refresh())
		_tabs.add_child(b)

func _row(box: VBoxContainer, id: String, unid: bool, label: String, price: int, btn_text: String, enabled: bool, cb: Callable) -> void:
	var row := PanelContainer.new()
	row.add_theme_stylebox_override("panel", UI.stone("inset", 6))
	var h := UI.hbox(8)
	row.add_child(h)
	h.add_child(UI.icon_rect(Items.icon_of(id), 30, Items.color_of(id, unid)))
	var nb := Button.new()
	nb.flat = true
	nb.focus_mode = Control.FOCUS_NONE
	nb.text = label
	nb.alignment = HORIZONTAL_ALIGNMENT_LEFT
	nb.clip_text = true
	nb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	nb.add_theme_color_override("font_color", Items.color_of(id, unid))
	nb.pressed.connect(func():
		_info.text = "[b]%s[/b]\n%s" % [Items.name_of(id, unid), Items.describe(id, unid)])
	h.add_child(nb)
	h.add_child(UI.label("%d po" % price, 18, UI.GOLD, UI.FONT_BOLD))
	var b := UI.button(btn_text, "", Vector2(104, 48))
	b.disabled = not enabled
	b.pressed.connect(cb)
	h.add_child(b)
	box.add_child(row)

func _build_buy() -> void:
	for ch in _buy.get_children():
		ch.queue_free()
	var st := _stock()
	var ids: Array = st.keys()
	ids.sort_custom(func(a, b): return _order(a) < _order(b) if _order(a) != _order(b) else Items.value(a) < Items.value(b))
	for id in ids:
		var n := int(st[id])
		if n == 0 or not Items.exists(id):
			continue
		var price := _price(id)
		var lbl := Items.name_of(id) + ("" if n < 0 else "  (%d)" % n)
		var iid: String = id
		_row(_buy, id, false, lbl, price, "Comprar", cp.gold >= price, func(): _do_buy(iid))

func _order(id: String) -> int:
	return ["weapon", "armor", "shield", "ammo", "potion", "scroll", "wand", "wondrous", "tool", "gear", "treasure"].find(Items.kind(id))

func _do_buy(id: String) -> void:
	var price := _price(id)
	if not cp.spend_gold(price):
		Game.sfx("error")
		return
	var st := _stock()
	if int(st[id]) > 0:
		st[id] = int(st[id]) - 1
	Items.add_to(cp.members[who], id, 1)
	Game.sfx("coins", -4)
	var nm: String = cp.short_name(who)
	_info.text = "[color=#7fd86f]%s compra: %s.[/color]" % [nm, Items.name_of(id)]
	_refresh()

func _build_sell() -> void:
	for ch in _sell.get_children():
		ch.queue_free()
	var s: Dictionary = cp.members[who]
	var buys: Array = shop.get("buys", [])
	var any := false
	var p := Items.pack(s)
	for i in p.size():
		var e: Dictionary = p[i]
		var k := Items.kind(e.id)
		if not k in buys:
			continue
		var val := Items.sell_value(e.id, e.get("unid", false))
		if val <= 0:
			continue
		var idx := i
		_row(_sell, e.id, e.get("unid", false), Items.name_of(e.id, e.get("unid", false)), val, "Vender", true, func(): _do_sell_pack(idx))
		any = true
	var stk := Items.stack(s)
	for id in stk.keys():
		var k2 := Items.kind(id)
		if not k2 in buys or int(stk[id]) <= 0:
			continue
		var val2 := Items.sell_value(id)
		if val2 <= 0:
			continue
		var sid: String = id
		_row(_sell, id, false, Items.name_of(id) + (" ×%d" % int(stk[id]) if int(stk[id]) > 1 else ""), val2, "Vender", true, func(): _do_sell_stack(sid))
		any = true
	if not any:
		_sell.add_child(UI.label("Nada que le interese a este comerciante.", 18, UI.TEXT_DIM))

func _do_sell_pack(idx: int) -> void:
	var s: Dictionary = cp.members[who]
	var p := Items.pack(s)
	if idx >= p.size():
		return
	var e: Dictionary = p[idx]
	var val := Items.sell_value(e.id, e.get("unid", false))
	p.remove_at(idx)
	cp.give_gold(val)
	if not e.get("unid", false):
		var st := _stock()
		if int(st.get(e.id, 0)) >= 0:
			st[e.id] = int(st.get(e.id, 0)) + 1
	Game.sfx("coins", -4)
	_info.text = "[color=#d8b56a]Vendido: %s por %d po.[/color]" % [Items.name_of(e.id, e.get("unid", false)), val]
	_refresh()

func _do_sell_stack(id: String) -> void:
	var s: Dictionary = cp.members[who]
	if Items.take_stack(s, id, 1) <= 0:
		return
	var val := Items.sell_value(id)
	cp.give_gold(val)
	var st := _stock()
	if int(st.get(id, 0)) >= 0:
		st[id] = int(st.get(id, 0)) + 1
	Game.sfx("coins", -4)
	_info.text = "[color=#d8b56a]Vendido: %s por %d po.[/color]" % [Items.name_of(id), val]
	_refresh()
