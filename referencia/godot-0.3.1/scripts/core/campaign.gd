class_name Campaign
extends RefCounted
## Estado de una partida: personajes (hojas que cambian con el equipo y los niveles),
## grupo activo, estado entre combates (PG, espacios, recursos, dados de golpe),
## oro, ubicación y memoria del mundo. Se guarda con to_dict() y se carga con from_dict().

const VERSION := 1
const MAX_PARTY := 4
## Recursos que se recuperan con un descanso corto (enteros) o solo uno por descanso corto.
const SHORT_REST_FULL := ["action_surge", "focus", "adrenaline_rush"]
const SHORT_REST_ONE := ["second_wind", "channel_divinity", "wild_shape", "rage"]

var members: Dictionary = {}     ## id -> hoja de personaje
var party: Array = []            ## ids del grupo activo, en orden
var state: Dictionary = {}       ## id -> {hp, temp_hp, slots, resources, free_casts, hit_dice, dead}
var party_level := 1
var gold := 0
var location: Dictionary = {}    ## {"level": id, "cell": [x, y]}
var flags: Dictionary = {}       ## memoria del mundo (cofres abiertos, combates ganados, decisiones)
var journal: Array = []
var day := 1
var playtime := 0.0
var short_rests_left := 2        ## descansos cortos hasta el próximo descanso largo
var levels: Dictionary = {}      ## nivel -> {opened, taken, dead, found, disarmed, unlocked, items...}
var merchants: Dictionary = {}   ## comerciante -> {stock: {id: n}, gold}

# ================================================================== creación

static func new_game(hero: Dictionary, companions: Array) -> Campaign:
	var cp := Campaign.new()
	var h := hero.duplicate(true)
	h["id"] = "hero"
	# El oro inicial (paquete de clase y trasfondo) se calcula antes de fijar el equipo
	var full := CharacterSheet.complete(h, 1)
	cp.gold = int(h.get("gold", full.get("gold", 0)))
	if cp.gold <= 0:
		var kit := CharacterSheet.kit_for(full)
		cp.gold = int(kit.get("gold", 0)) + int(RulesDB.backgrounds.get(str(full.get("background", "")), {}).get("gold", 0))
	materialize(h)
	cp.members["hero"] = h
	cp.party.append("hero")
	for pid in companions:
		cp.recruit(pid)
	cp.long_rest()
	cp.day = 1
	return cp

## Deja escrito en la hoja el equipo inicial (armas, armadura, munición y objetos), para
## que el inventario pueda cambiarlo después.
static func materialize(s: Dictionary) -> void:
	if not s.has("weapons") or not s.has("armor"):
		var full := CharacterSheet.complete(s, 1)
		for k in ["kit", "weapons", "armor", "shield", "ammo", "items"]:
			if full.has(k):
				s[k] = full[k].duplicate(true) if typeof(full[k]) in [TYPE_ARRAY, TYPE_DICTIONARY] else full[k]
	if not s.has("items"):
		s["items"] = {}
	Items.normalize(s)

## Une un compañero escrito (data/party.json) al grupo. Devuelve false si no cabe.
func recruit(pid: String) -> bool:
	if not members.has(pid):
		var s: Dictionary = RulesDB.party.get(pid, {}).duplicate(true)
		if s.is_empty():
			return false
		s["id"] = pid
		materialize(s)
		members[pid] = s
	if pid in party:
		return true
	if party.size() >= MAX_PARTY:
		return false
	party.append(pid)
	if not state.has(pid):
		state[pid] = _fresh_state(pid)
	return true

func dismiss(pid: String) -> void:
	party.erase(pid)

func sheet(id: String) -> Dictionary:
	return members.get(id, {})

func hero() -> Dictionary:
	return members.get("hero", {})

const SHORT_NAMES := {"brenna": "Brenna", "pip": "Pip", "ilyra": "Ilyra", "odvar": "Odvar"}

## Nombre corto para la interfaz («Odvar», no «Maese Odvar Stonebrow»).
func short_name(id: String) -> String:
	if SHORT_NAMES.has(id):
		return SHORT_NAMES[id]
	return str(sheet(id).get("name", id)).split(" ")[0]

func is_dead(id: String) -> bool:
	return bool(state.get(id, {}).get("dead", false))

## Hojas del grupo listas para BattleSetup (los caídos no luchan).
func party_sheets() -> Array:
	var out: Array = []
	for id in party:
		if not is_dead(id):
			out.append(members[id])
	return out

# ================================================================== estado entre combates

## Criatura con su estado actual (PG, espacios, recursos...).
func creature_for(id: String, level := -1) -> Creature:
	var lvl := party_level if level < 0 else level
	var c := Factory.make_from_sheet(members[id], lvl, id)
	apply_state(c)
	return c

func _fresh_state(id: String) -> Dictionary:
	var c := Factory.make_from_sheet(members[id], party_level, id)
	return {"hp": c.max_hp, "temp_hp": 0, "slots": c.slots_max.duplicate(), "resources": c.resources_max.duplicate(),
		"free_casts": c.free_casts.duplicate(), "hit_dice": party_level, "dead": false}

func apply_state(c: Creature) -> void:
	var st: Dictionary = state.get(c.id, {})
	if st.is_empty():
		return
	c.hp = clamp(int(st.get("hp", c.max_hp)), 0, c.max_hp)
	c.temp_hp = int(st.get("temp_hp", 0))
	var sl: Array = st.get("slots", [])
	for i in c.slots.size():
		if i < sl.size():
			c.slots[i] = clamp(int(sl[i]), 0, int(c.slots_max[i]) if i < c.slots_max.size() else int(sl[i]))
	var res: Dictionary = st.get("resources", {})
	for k in res.keys():
		if c.resources.has(k):
			c.resources[k] = min(int(res[k]), int(c.resources_max.get(k, res[k])))
	var fc: Dictionary = st.get("free_casts", {})
	for k in fc.keys():
		if c.free_casts.has(k):
			c.free_casts[k] = min(int(fc[k]), int(c.free_casts[k]))
	if c.hp <= 0:
		c.hp = 1   # nunca empieza un combate inconsciente

func capture(c: Creature) -> void:
	if not members.has(c.id):
		return
	var st: Dictionary = state.get(c.id, _fresh_state(c.id))
	if not c.form.is_empty():
		c.leave_form()
	st["hp"] = c.hp
	st["temp_hp"] = c.temp_hp
	st["slots"] = c.slots.duplicate()
	st["resources"] = c.resources.duplicate()
	st["free_casts"] = c.free_casts.duplicate()
	st["dead"] = c.dead
	state[c.id] = st
	# Consumibles y munición gastados
	var s: Dictionary = members[c.id]
	var items: Dictionary = s.get("items", {}).duplicate()
	for k in c.items.keys():
		items[k] = int(c.items[k])
	s["items"] = items
	var ammo: Dictionary = s.get("ammo", {}).duplicate()
	for k in c.ammo.keys():
		# Tras el combate se recupera la mitad de la munición disparada (reglas)
		var before := int(ammo.get(k, c.ammo[k]))
		var spent: int = max(0, before - int(c.ammo[k]))
		ammo[k] = int(c.ammo[k]) + int(spent / 2)
	s["ammo"] = ammo
	if not c.item_charges.is_empty():
		s["charges"] = c.item_charges.duplicate()

## Tras un combate: guarda el estado de todos los PJ. Si se gana, los caídos se estabilizan a 1 PG.
func after_battle(battle: Battle, won: bool) -> void:
	for c in battle.creatures:
		if c.is_pc and members.has(c.id):
			if won and not c.dead and c.hp <= 0:
				c.hp = 1
			capture(c)

# ================================================================== descansos

## Descanso corto (1 hora): dados de golpe para curar y recursos de descanso corto.
## `spend`: id -> dados a gastar; vacío = los necesarios para curar sin desperdiciar.
func short_rest(spend: Dictionary = {}, rng: RandomNumberGenerator = null) -> Dictionary:
	if rng == null:
		rng = RandomNumberGenerator.new()
		rng.randomize()
	var report := {}
	short_rests_left = max(0, short_rests_left - 1)
	var identified: Array = []
	for id in party:
		identified.append_array(Items.identify_all(members[id]))
	for id in party:
		if is_dead(id):
			continue
		var c := creature_for(id)
		var st: Dictionary = state[id]
		var hd := int(RulesDB.classes.get(c.cls, {}).get("hit_die", 8))
		var con := c.mod("con")
		var healed := 0
		var used := 0
		var want: int = int(spend.get(id, -1))
		while int(st.hit_dice) > 0 and c.hp < c.max_hp:
			if want >= 0 and used >= want:
				break
			# Automático: no gastar si el dado medio sobraría de largo
			if want < 0 and c.max_hp - c.hp < int(hd / 2.0) and used > 0:
				break
			var roll: int = max(1, rng.randi_range(1, hd) * (2 if c.has_trait("wound_closure") else 1) + con)
			c.hp = min(c.max_hp, c.hp + roll)
			healed += roll
			used += 1
			st.hit_dice = int(st.hit_dice) - 1
		st.hp = c.hp
		# Recursos
		var res: Dictionary = st.get("resources", {})
		for k in SHORT_REST_FULL:
			if c.resources_max.has(k):
				res[k] = int(c.resources_max[k])
		for k in SHORT_REST_ONE:
			if c.resources_max.has(k):
				res[k] = min(int(c.resources_max[k]), int(res.get(k, 0)) + 1)
		st.resources = res
		# Magia de pacto: los espacios del brujo vuelven con un descanso corto
		if c.caster_type == "pact":
			st.slots = c.slots_max.duplicate()
		# Recuperación arcana (mago): una vez al día, espacios por valor de la mitad del nivel
		elif c.cls == "wizard" and not bool(st.get("arcane_recovery_used", false)):
			var budget: int = int(ceil(party_level / 2.0))
			var sl: Array = st.get("slots", []).duplicate()
			var got := false
			for i in range(min(sl.size(), 5) - 1, -1, -1):
				while budget >= i + 1 and int(sl[i]) < int(c.slots_max[i]):
					sl[i] = int(sl[i]) + 1
					budget -= i + 1
					got = true
			if got:
				st.slots = sl
				st["arcane_recovery_used"] = true
		# Pasa una hora: se acaban los conjuros de una hora
		var bl: Array = st.get("buffs", [])
		st["buffs"] = bl.filter(func(x): return x in BattleSetup.LONG_BUFFS)
		state[id] = st
		report[id] = {"healed": healed, "dice": used}
	flags["last_rest"] = "short"
	report["_identified"] = identified
	return report

## Descanso largo: todo vuelve (PG, espacios, recursos y dados de golpe).
func long_rest() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	for id in party:
		if is_dead(id):
			continue
		state[id] = _fresh_state(id)
		# Varitas: recuperan cargas al amanecer
		var s: Dictionary = members[id]
		var ch: Dictionary = s.get("charges", {})
		for wid in ch.keys():
			var d := Items.data(wid)
			ch[wid] = min(int(d.get("charges", 7)), int(ch[wid]) + Dice.roll_with(str(d.get("recharge", "1d6+1")), rng))
		s.erase("pearl_used")
		Items.identify_all(s)
	short_rests_left = 2
	day += 1
	flags["last_rest"] = "long"

# ================================================================== niveles

## Sube el nivel del grupo: cada PJ gana la diferencia de PG máximos, un dado de golpe y
## los espacios y usos nuevos (llegan llenos).
func level_up_to(lvl: int) -> void:
	lvl = clamp(lvl, 1, CharacterSheet.MAX_LEVEL)
	if lvl <= party_level:
		return
	var old_level := party_level
	party_level = lvl
	for id in members.keys():
		if not state.has(id):
			continue
		var old_c := Factory.make_from_sheet(members[id], old_level, id)
		var c := Factory.make_from_sheet(members[id], party_level, id)
		var st: Dictionary = state[id]
		st.hp = int(st.get("hp", 0)) + c.max_hp - old_c.max_hp
		st.hit_dice = int(st.get("hit_dice", 0)) + (lvl - old_level)
		var sl: Array = st.get("slots", [])
		var new_sl: Array = []
		for i in c.slots_max.size():
			var old_max: int = int(old_c.slots_max[i]) if i < old_c.slots_max.size() else 0
			var cur: int = int(sl[i]) if i < sl.size() else 0
			new_sl.append(min(int(c.slots_max[i]), cur + int(c.slots_max[i]) - old_max))
		st.slots = new_sl
		var res: Dictionary = st.get("resources", {})
		for k in c.resources_max.keys():
			var old_m := int(old_c.resources_max.get(k, 0))
			res[k] = min(int(c.resources_max[k]), int(res.get(k, 0)) + int(c.resources_max[k]) - old_m)
		st.resources = res
		var fc: Dictionary = st.get("free_casts", {})
		for k in c.free_casts.keys():
			var old_f := int(old_c.free_casts.get(k, 0))
			fc[k] = min(int(c.free_casts[k]), int(fc.get(k, 0)) + int(c.free_casts[k]) - old_f)
		st.free_casts = fc
		state[id] = st

# ================================================================== guardado

func to_dict() -> Dictionary:
	return {"version": VERSION, "members": members, "party": party, "state": state, "party_level": party_level,
		"gold": gold, "location": location, "flags": flags, "journal": journal, "day": day, "playtime": playtime,
		"short_rests_left": short_rests_left, "levels": levels, "merchants": merchants}

static func from_dict(d: Dictionary) -> Campaign:
	var cp := Campaign.new()
	cp.members = d.get("members", {})
	cp.party = d.get("party", [])
	cp.state = d.get("state", {})
	cp.party_level = int(d.get("party_level", 1))
	cp.gold = int(d.get("gold", 0))
	cp.location = d.get("location", {})
	cp.flags = d.get("flags", {})
	cp.journal = d.get("journal", [])
	cp.day = int(d.get("day", 1))
	cp.playtime = float(d.get("playtime", 0.0))
	cp.short_rests_left = int(d.get("short_rests_left", 2))
	cp.levels = d.get("levels", {})
	cp.merchants = d.get("merchants", {})
	for id in cp.members.keys():
		_normalize_sheet(cp.members[id])
	# JSON convierte enteros en float: normalizar el estado
	for id in cp.state.keys():
		var st: Dictionary = cp.state[id]
		for k in ["hp", "temp_hp", "hit_dice"]:
			st[k] = int(st.get(k, 0))
		st["slots"] = st.get("slots", []).map(func(x): return int(x))
		var res: Dictionary = st.get("resources", {})
		for r in res.keys():
			res[r] = int(res[r])
		var fc: Dictionary = st.get("free_casts", {})
		for r in fc.keys():
			fc[r] = int(fc[r])
	return cp

## JSON guarda todos los números como reales: vuelven a enteros los recuentos.
static func _normalize_sheet(s: Dictionary) -> void:
	for k in ["items", "ammo", "charges"]:
		var d: Dictionary = s.get(k, {})
		for x in d.keys():
			d[x] = int(d[x])
	Items.normalize(s)

# ================================================================== oro y objetos

func spend_gold(n: int) -> bool:
	if n > gold:
		return false
	gold -= n
	return true

func give_gold(n: int) -> void:
	gold += max(0, n)

## Da un objeto a un miembro (por defecto, al primero del grupo que pueda usarlo).
func give_item(id: String, n := 1, unid := false, to := "") -> String:
	var who := to
	if who.is_empty() or not members.has(who):
		who = _best_holder(id)
	Items.add_to(members[who], id, n, unid)
	return who

func _best_holder(id: String) -> String:
	var d := Items.data(id)
	if d.get("kind", "") == "ammo":
		for pid in party:
			if Items.uses_ammo(members[pid], str(d.get("ammo", ""))):
				return pid
	if d.get("kind", "") == "scroll":
		for pid in party:
			if Items.can_read_scroll(members[pid], id):
				return pid
	if id == "thieves_tools":
		for pid in party:
			if members[pid].get("class", "") == "rogue":
				return pid
	return party[0] if not party.is_empty() else "hero"

## Estado guardado de un nivel explorable (cofres abiertos, enemigos muertos...).
func level_state(level_id: String) -> Dictionary:
	if not levels.has(level_id):
		levels[level_id] = {}
	return levels[level_id]

## Pasa el tiempo (viaje): terminan los conjuros de una hora (y todos si son 8 horas o más).
func pass_hours(h: int) -> void:
	for id in state.keys():
		var bl: Array = state[id].get("buffs", [])
		state[id]["buffs"] = bl.filter(func(x): return x in BattleSetup.LONG_BUFFS) if h < 8 else []
