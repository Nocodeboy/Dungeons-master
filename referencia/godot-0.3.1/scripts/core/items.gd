class_name Items
extends Object
## Objetos: datos (data/items.json + armas y armaduras normales), nombres, precios y las
## operaciones de inventario y equipo sobre una hoja de personaje.
##
## En la hoja:
##   weapons: [ids]        armas a mano (la primera es la principal)
##   armor: id             armadura ("" sin armadura)
##   shield: bool          lleva escudo; shield_id: qué escudo ("shield", "shield_p1")
##   worn: {slot: id}      cloak, ring1, ring2, amulet, boots, gloves
##   items: {id: n}        objetos apilables (pociones, pergaminos, herramientas, tesoros, llaves)
##   pack: [{id, unid}]    equipo sin equipar (armas, armaduras, escudos, objetos maravillosos)
##   ammo: {clave: n}      munición (arrows, bolts, bullets) y armas arrojadizas de repuesto
##   charges: {id: n}      cargas de las varitas

const MAX_WEAPONS := 4
const MAX_ATTUNED := 3
const WORN_SLOTS := ["cloak", "ring1", "ring2", "amulet", "boots", "gloves"]
const SLOT_NAMES := {"weapon": "Arma", "armor": "Armadura", "shield": "Escudo", "cloak": "Capa", "ring": "Anillo",
	"ring1": "Anillo", "ring2": "Anillo", "amulet": "Amuleto", "boots": "Botas", "gloves": "Guantes"}
const RARITY_NAMES := {"common": "común", "uncommon": "infrecuente", "rare": "raro", "very_rare": "muy raro"}
const RARITY_COLORS := {"common": Color(0.85, 0.82, 0.76), "uncommon": Color(0.45, 0.85, 0.45), "rare": Color(0.45, 0.65, 1.0), "very_rare": Color(0.75, 0.5, 1.0)}
## Munición compartida por tipo de arma.
const AMMO_GROUP := {"shortbow": "arrows", "longbow": "arrows", "light_crossbow": "bolts", "heavy_crossbow": "bolts",
	"hand_crossbow": "bolts", "sling": "bullets"}
const AMMO_NAMES := {"arrows": "Flechas", "bolts": "Virotes", "bullets": "Balas de honda"}

# ================================================================== datos

## Datos de un objeto. Las armas y armaduras normales se generan a partir de sus tablas.
static func data(id: String) -> Dictionary:
	if RulesDB.items.has(id):
		return RulesDB.items[id]
	if RulesDB.weapons.has(id) and id != "unarmed":
		var w: Dictionary = RulesDB.weapons[id]
		return {"name": w.name, "kind": "weapon", "base": id, "value": w.get("cost", 1), "weight": w.get("weight", 1)}
	if RulesDB.armor.has(id):
		var a: Dictionary = RulesDB.armor[id]
		return {"name": a.name, "kind": "armor", "base": id, "value": a.get("cost", 10), "weight": a.get("weight", 10)}
	return {}

static func exists(id: String) -> bool:
	return not data(id).is_empty()

static func kind(id: String) -> String:
	return str(data(id).get("kind", ""))

## Arma o armadura base de un objeto ("longsword_p1" -> "longsword").
static func base_of(id: String) -> String:
	return str(data(id).get("base", id))

static func bonus(id: String) -> int:
	return int(data(id).get("bonus", 0))

static func is_magic(id: String) -> bool:
	var d := data(id)
	return d.has("rarity") and not d.kind in ["potion", "scroll"]

static func rarity(id: String) -> String:
	return str(data(id).get("rarity", ""))

static func needs_attunement(id: String) -> bool:
	return bool(data(id).get("attune", false))

## Hueco de equipo: weapon, armor, shield, cloak, ring, amulet, boots, gloves; "" si no se equipa.
static func slot_of(id: String) -> String:
	var d := data(id)
	match str(d.get("kind", "")):
		"weapon":
			return "weapon"
		"armor":
			return "armor"
		"shield":
			return "shield"
		"wondrous":
			return str(d.get("slot", ""))
	return ""

## ¿Se guarda apilado en items (pociones, pergaminos, herramientas...)?
static func stackable(id: String) -> bool:
	return slot_of(id).is_empty() and kind(id) != "ammo"

static func name_of(id: String, unid := false) -> String:
	var d := data(id)
	if d.is_empty():
		return id
	if unid and d.has("unid_name"):
		return str(d.unid_name) + " (sin identificar)"
	return str(d.get("name", id))

static func icon_of(id: String) -> String:
	var d := data(id)
	if d.has("icon"):
		return str(d.icon)
	match str(d.get("kind", "")):
		"weapon":
			var w: Dictionary = RulesDB.weapons.get(base_of(id), {})
			return "ranged" if w.get("kind", "") == "ranged" else "sword"
		"armor":
			return "armor"
	return "bag"

static func color_of(id: String, unid := false) -> Color:
	if unid:
		return Color(0.85, 0.7, 1.0)
	return RARITY_COLORS.get(rarity(id), Color(0.92, 0.88, 0.8))

## Precio de compra en piezas de oro (mínimo 1).
static func value(id: String) -> int:
	return max(1, int(ceil(float(data(id).get("value", 1)))))

## Lo que paga un comerciante: la mitad; los objetos sin identificar, como si fueran normales.
static func sell_value(id: String, unid := false) -> int:
	var v := float(data(id).get("value", 0))
	if unid:
		var b := base_of(id)
		v = float(data(b).get("value", 2)) if b != id else 20.0
	if kind(id) == "key":
		return 0
	return int(floor(v * (1.0 if kind(id) == "treasure" else 0.5)))

# ================================================================== resolución para el combate

## Arma lista para Factory: datos base más el bonificador mágico. El id sigue siendo el de la
## base (maestrías, competencias, modelos); item_id guarda el objeto real.
static func weapon_entry(id: String) -> Dictionary:
	var base := base_of(id)
	var w := RulesDB.weapon(base)
	if w.size() <= 1:
		return {}
	w["item_id"] = id
	var b := bonus(id)
	if b > 0:
		w["magic"] = b
		w["name"] = name_of(id)
	w["ammo_key"] = AMMO_GROUP.get(base, base)
	return w

static func armor_base(id: String) -> String:
	return base_of(id) if not id.is_empty() else ""

# ================================================================== descripción

## Texto con las reglas del objeto (BBCode).
static func describe(id: String, unid := false) -> String:
	var d := data(id)
	if d.is_empty():
		return ""
	var lines: Array = []
	var k: String = d.get("kind", "")
	if unid:
		lines.append("[color=#c8a8ff]Objeto mágico sin identificar.[/color] Un descanso corto o el conjuro Identificar revelarán qué hace.")
		var b := base_of(id)
		if b != id:
			lines.append(_base_line(b))
		return "\n".join(lines)
	match k:
		"weapon":
			lines.append(_base_line(base_of(id)))
		"armor":
			var a: Dictionary = RulesDB.armor.get(base_of(id), {})
			lines.append(_base_line(base_of(id)))
			if bonus(id) > 0:
				lines.append("CA %d%s" % [int(a.get("base", 10)) + bonus(id), _dex_text(a)])
	var tags: Array = []
	if d.has("rarity"):
		tags.append("Mágico, %s" % RARITY_NAMES.get(d.rarity, d.rarity))
	if d.get("attune", false):
		tags.append("requiere sintonía")
	var slot := slot_of(id)
	if not slot.is_empty() and k == "wondrous":
		tags.append(SLOT_NAMES.get(slot, slot))
	if not tags.is_empty():
		lines.append("[i]%s[/i]" % ", ".join(tags))
	if d.has("desc"):
		lines.append(str(d.desc))
	return "\n".join(lines)

static func _base_line(base: String) -> String:
	if RulesDB.weapons.has(base):
		var w: Dictionary = RulesDB.weapons[base]
		var props: Array = []
		for p in w.get("props", []):
			props.append(Loc.t("prop." + str(p)) if Loc.has("prop." + str(p)) else str(p))
		var rng := ""
		if w.has("range"):
			rng = " · distancia %s/%s" % [Loc.ft(int(w.range[0])), Loc.ft(int(w.range[1]))]
		var cat := "Arma sencilla" if w.get("cat", "") == "simple" else "Arma marcial"
		return "%s · %s %s%s%s" % [cat, w.damage, Loc.dmg_type(w.type), rng, (" · " + ", ".join(props)) if not props.is_empty() else ""]
	if RulesDB.armor.has(base):
		var a: Dictionary = RulesDB.armor[base]
		var cat2: String = {"light": "Armadura ligera", "medium": "Armadura intermedia", "heavy": "Armadura pesada"}.get(a.get("cat", ""), "Armadura")
		var extra := ""
		if int(a.get("str_req", 0)) > 0:
			extra += " · Fue %d" % int(a.str_req)
		if a.get("stealth_dis", false):
			extra += " · desventaja en Sigilo"
		return "%s · CA %d%s%s" % [cat2, int(a.get("base", 10)), _dex_text(a), extra]
	return ""

static func _dex_text(a: Dictionary) -> String:
	var cap := int(a.get("dex_cap", 99))
	if a.get("cat", "") == "heavy":
		return ""
	if cap >= 99:
		return " + Des"
	return " + Des (máx. %d)" % cap

# ================================================================== inventario de una hoja

static func pack(s: Dictionary) -> Array:
	if not s.has("pack"):
		s["pack"] = []
	return s.pack

static func stack(s: Dictionary) -> Dictionary:
	if not s.has("items"):
		s["items"] = {}
	return s.items

## Añade un objeto a la hoja. La munición va directa a quien usa ese tipo (si no, a la mochila).
static func add_to(s: Dictionary, id: String, n := 1, unid := false) -> void:
	if not exists(id):
		return
	var d := data(id)
	if d.get("kind", "") == "ammo":
		var key: String = d.get("ammo", "")
		if uses_ammo(s, key):
			var am: Dictionary = s.get("ammo", {})
			am[key] = int(am.get(key, 0)) + int(d.get("count", 1)) * n
			s["ammo"] = am
			return
		stack(s)[id] = int(stack(s).get(id, 0)) + n
		return
	if stackable(id):
		stack(s)[id] = int(stack(s).get(id, 0)) + n
		if d.get("kind", "") == "wand" and not s.get("charges", {}).has(id):
			var ch: Dictionary = s.get("charges", {})
			ch[id] = int(d.get("charges", 7))
			s["charges"] = ch
		return
	for i in n:
		var e := {"id": id}
		if unid and is_magic(id):
			e["unid"] = true
		pack(s).append(e)

## ¿Usa la hoja munición de este tipo (flechas, virotes...) o lleva esa arma arrojadiza?
static func uses_ammo(s: Dictionary, key: String) -> bool:
	for w in s.get("weapons", []):
		var b := base_of(w)
		if AMMO_GROUP.get(b, b) == key:
			return true
	return false

## Quita n unidades de un objeto apilable. Devuelve cuántas quitó.
static func take_stack(s: Dictionary, id: String, n := 1) -> int:
	var have := int(stack(s).get(id, 0))
	var taken: int = min(have, n)
	if taken <= 0:
		return 0
	if have - taken <= 0:
		stack(s).erase(id)
		if s.get("charges", {}).has(id):
			s.charges.erase(id)
	else:
		stack(s)[id] = have - taken
	return taken

static func count(s: Dictionary, id: String) -> int:
	var n := int(stack(s).get(id, 0))
	for e in pack(s):
		if e.id == id:
			n += 1
	return n

## Objetos de sintonía equipados.
static func attuned(s: Dictionary) -> Array:
	var out: Array = []
	for slot in WORN_SLOTS:
		var id: String = s.get("worn", {}).get(slot, "")
		if not id.is_empty() and needs_attunement(id):
			out.append(id)
	return out

## Equipa el objeto de la mochila en la posición `idx`. Devuelve "" o el motivo por el que no se puede.
static func equip(s: Dictionary, idx: int, ring_slot := "") -> String:
	var p := pack(s)
	if idx < 0 or idx >= p.size():
		return "No existe ese objeto."
	var e: Dictionary = p[idx]
	var id: String = e.id
	if e.get("unid", false):
		return "Identifícalo antes de usarlo (con un descanso corto o el conjuro Identificar)."
	var slot := slot_of(id)
	match slot:
		"weapon":
			var ws: Array = s.get("weapons", [])
			if ws.size() >= MAX_WEAPONS:
				return "Ya llevas %d armas a mano. Guarda una primero." % MAX_WEAPONS
			var w: Dictionary = RulesDB.weapons.get(base_of(id), {})
			if "two_handed" in w.get("props", []) and w.get("kind", "") == "melee" and bool(s.get("shield", false)) and ws.is_empty():
				pass
			p.remove_at(idx)
			ws.append(id)
			s["weapons"] = ws
			_sync_thrown_ammo(s, id)
		"armor":
			p.remove_at(idx)
			var old: String = s.get("armor", "")
			if not old.is_empty():
				p.append({"id": old})
			s["armor"] = id
		"shield":
			p.remove_at(idx)
			if bool(s.get("shield", false)):
				p.append({"id": s.get("shield_id", "shield")})
			s["shield"] = true
			s["shield_id"] = id
		"cloak", "amulet", "boots", "gloves", "ring":
			var target := slot
			if slot == "ring":
				target = ring_slot if ring_slot in ["ring1", "ring2"] else ("ring1" if str(s.get("worn", {}).get("ring1", "")).is_empty() else "ring2")
			var worn: Dictionary = s.get("worn", {})
			var old2: String = worn.get(target, "")
			if needs_attunement(id) and (old2.is_empty() or not needs_attunement(old2)) and attuned(s).size() >= MAX_ATTUNED:
				return "Ya estás en sintonía con %d objetos." % MAX_ATTUNED
			p.remove_at(idx)
			if not old2.is_empty():
				p.append({"id": old2})
			worn[target] = id
			s["worn"] = worn
		_:
			return "No se puede equipar."
	return ""

## Quita lo que hay en un hueco y lo guarda en la mochila. Para armas, `slot` es "weapon:N".
static func unequip(s: Dictionary, slot: String) -> String:
	if slot.begins_with("weapon:"):
		var i := int(slot.split(":")[1])
		var ws: Array = s.get("weapons", [])
		if i < 0 or i >= ws.size():
			return ""
		pack(s).append({"id": ws[i]})
		ws.remove_at(i)
		s["weapons"] = ws
		return ""
	match slot:
		"armor":
			if not str(s.get("armor", "")).is_empty():
				pack(s).append({"id": s.armor})
				s["armor"] = ""
		"shield":
			if bool(s.get("shield", false)):
				pack(s).append({"id": s.get("shield_id", "shield")})
				s["shield"] = false
				s.erase("shield_id")
		_:
			var worn: Dictionary = s.get("worn", {})
			if worn.has(slot) and not str(worn[slot]).is_empty():
				pack(s).append({"id": worn[slot]})
				worn.erase(slot)
	return ""

## Al equipar un arma arrojadiza sin repuestos, al menos la que se empuña cuenta como una.
static func _sync_thrown_ammo(s: Dictionary, id: String) -> void:
	var b := base_of(id)
	var w: Dictionary = RulesDB.weapons.get(b, {})
	if "thrown" in w.get("props", []) and w.get("kind", "") == "melee":
		var am: Dictionary = s.get("ammo", {})
		if not am.has(b):
			am[b] = 1
			s["ammo"] = am

## Identifica todo lo que lleva la hoja. Devuelve los nombres de lo identificado.
static func identify_all(s: Dictionary) -> Array:
	var out: Array = []
	for e in pack(s):
		if e.get("unid", false):
			e.erase("unid")
			out.append(name_of(e.id))
	return out

## Normaliza una hoja antigua: escudo, munición por grupos y huecos vacíos.
static func normalize(s: Dictionary) -> void:
	if not s.has("pack"):
		s["pack"] = []
	if not s.has("worn"):
		s["worn"] = {}
	if typeof(s.get("shield", false)) == TYPE_STRING:
		var sid: String = s.shield
		s["shield"] = not sid.is_empty()
		if not sid.is_empty():
			s["shield_id"] = sid
	var am: Dictionary = s.get("ammo", {})
	for k in am.keys():
		if AMMO_GROUP.has(k):
			var g: String = AMMO_GROUP[k]
			am[g] = int(am.get(g, 0)) + int(am[k])
			am.erase(k)
	s["ammo"] = am

## Modificadores de los objetos equipados (capa, anillos, botas...). Para Factory.
static func worn_mods(s: Dictionary) -> Dictionary:
	var out := {"ac": 0, "saves": 0, "checks": 0, "ac_unarmored": 0, "set": {}, "skill": {}, "adv": [], "resist": [],
		"immune_spell": [], "speed_min": 0, "ignore_armor_speed": false, "wound_closure": false, "tools": 0, "pearl": false}
	for slot in WORN_SLOTS:
		var id: String = s.get("worn", {}).get(slot, "")
		if id.is_empty():
			continue
		var m: Dictionary = data(id).get("mods", {})
		for k in ["ac", "saves", "checks", "ac_unarmored", "tools"]:
			out[k] += int(m.get(k, 0))
		for ab in m.get("set", {}).keys():
			out.set[ab] = max(int(out.set.get(ab, 0)), int(m.set[ab]))
		for sk in m.get("skill", {}).keys():
			out.skill[sk] = int(out.skill.get(sk, 0)) + int(m.skill[sk])
		for k2 in ["adv", "resist", "immune_spell"]:
			for x in m.get(k2, []):
				if not x in out[k2]:
					out[k2].append(x)
		out.speed_min = max(int(out.speed_min), int(m.get("speed_min", 0)))
		for k3 in ["ignore_armor_speed", "wound_closure", "pearl"]:
			if m.get(k3, false):
				out[k3] = true
	return out

## ¿Puede esta hoja leer el pergamino? (el conjuro tiene que estar en la lista de su clase)
static func can_read_scroll(s: Dictionary, id: String) -> bool:
	var sid: String = data(id).get("spell", "")
	var cls: String = s.get("class", "")
	return sid in RulesDB.classes.get(cls, {}).get("casting", {}).get("list", [])

## ¿Puede usar esta varita?
static func can_use_wand(s: Dictionary, id: String) -> bool:
	var d := data(id)
	if d.get("needs_caster", false):
		return not RulesDB.classes.get(s.get("class", ""), {}).get("casting", {}).is_empty()
	return true
