class_name CharacterSheet
extends Object
## Hoja de personaje (formato de datos del creador y de los compañeros escritos).
## complete() rellena cualquier elección que falte con opciones recomendadas, de modo
## que una hoja a medias (o de un mercenario) siempre produce un personaje válido.

const SKILLS := ["acrobatics", "animal_handling", "arcana", "athletics", "deception", "history", "insight", "intimidation",
	"investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight_of_hand", "stealth", "survival"]
const ABILITIES := ["str", "dex", "con", "int", "wis", "cha"]
const STANDARD_ARRAY := [15, 14, 13, 12, 10, 8]
const POINT_BUY_COST := {8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9}
const POINT_BUY_TOTAL := 27
const MAX_LEVEL := 3

## Trasfondo recomendado por clase (si el jugador no elige).
const DEFAULT_BACKGROUND := {
	"barbarian": "soldier", "bard": "minstrel", "cleric": "acolyte", "druid": "warden", "fighter": "soldier",
	"monk": "criminal", "paladin": "noble", "ranger": "bounty_hunter", "rogue": "criminal", "sorcerer": "sage",
	"warlock": "sage", "wizard": "sage",
}
## Habilidades preferidas por clase (orden de recomendación).
const SKILL_PREFS := {
	"barbarian": ["athletics", "perception", "survival", "intimidation"],
	"bard": ["persuasion", "performance", "deception", "insight", "perception", "stealth"],
	"cleric": ["insight", "medicine", "religion", "persuasion"],
	"druid": ["perception", "nature", "medicine", "animal_handling", "survival"],
	"fighter": ["athletics", "perception", "intimidation", "survival"],
	"monk": ["acrobatics", "stealth", "insight", "athletics"],
	"paladin": ["athletics", "persuasion", "insight", "intimidation"],
	"ranger": ["perception", "stealth", "survival", "nature", "investigation"],
	"rogue": ["stealth", "perception", "acrobatics", "sleight_of_hand", "investigation", "deception"],
	"sorcerer": ["arcana", "persuasion", "insight", "deception"],
	"warlock": ["arcana", "deception", "intimidation", "investigation"],
	"wizard": ["arcana", "investigation", "history", "insight"],
}
const DEFAULT_INVOCATIONS := {"1": ["eldritch_mind"], "2": ["eldritch_mind", "agonizing_blast", "repelling_blast"]}

# ================================================================== utilidades

static func _get_level(table, level: int, default = null):
	return RulesDB.at_level(table, level, default)

static func class_data(s: Dictionary) -> Dictionary:
	return RulesDB.classes.get(s.get("class", "fighter"), {})

static func species_data(s: Dictionary) -> Dictionary:
	return RulesDB.species.get(s.get("species", "human"), {})

static func lineage_data(s: Dictionary) -> Dictionary:
	return species_data(s).get("lineages", {}).get(s.get("lineage", ""), {})

static func ancestry_data(s: Dictionary) -> Dictionary:
	return species_data(s).get("ancestries", {}).get(s.get("ancestry", ""), {})

static func casting_ability(s: Dictionary) -> String:
	return class_data(s).get("casting", {}).get("ability", "")

static func mod(score: int) -> int:
	return int(floor((score - 10) / 2.0))

static func origin_feats() -> Array:
	var out: Array = []
	for fid in RulesDB.feats.keys():
		if RulesDB.feats[fid].get("category", "") == "origin":
			out.append(fid)
	return out

static func fighting_styles_for(cls: String) -> Array:
	var out: Array = []
	for fid in RulesDB.feats.keys():
		var f: Dictionary = RulesDB.feats[fid]
		if f.get("category", "") != "fighting_style":
			continue
		var only: Array = f.get("only", [])
		if only.is_empty() or cls in only:
			out.append(fid)
	return out

static func fighting_style_level(cls: String) -> int:
	return int(RulesDB.classes.get(cls, {}).get("fighting_style_level", 99))

# ================================================================== características

## Puntuaciones finales (base + trasfondo). Si la hoja solo trae "abilities", ya son finales.
static func final_abilities(s: Dictionary) -> Dictionary:
	if not s.has("base_abilities") and s.has("abilities"):
		var out := {}
		for a in ABILITIES:
			out[a] = int(s.abilities.get(a, 10))
		return out
	var base: Dictionary = s.get("base_abilities", class_data(s).get("std_array", {}))
	var res := {}
	for a in ABILITIES:
		res[a] = int(base.get(a, 10))
	for a in s.get("bg_bonus", {}).keys():
		res[a] = res.get(a, 10) + int(s.bg_bonus[a])
	for a in ABILITIES:
		res[a] = min(20, res[a])
	return res

static func point_buy_spent(base: Dictionary) -> int:
	var total := 0
	for a in ABILITIES:
		total += int(POINT_BUY_COST.get(int(base.get(a, 8)), 99))
	return total

## Reparto por defecto del +2/+1 del trasfondo: a las características principales de la clase.
static func default_bg_bonus(s: Dictionary) -> Dictionary:
	var bg: Dictionary = RulesDB.backgrounds.get(s.get("background", ""), {})
	var allowed: Array = bg.get("abilities", ["str", "dex", "con"])
	var prim: Array = class_data(s).get("primary", [])
	var order: Array = []
	for a in prim:
		if a in allowed and not a in order:
			order.append(a)
	# después, la que tenga mayor puntuación base
	var base: Dictionary = s.get("base_abilities", class_data(s).get("std_array", {}))
	var rest := allowed.filter(func(a): return not a in order)
	# El +1 rinde más sobre una puntuación impar (13 → 14 sube el modificador)
	rest.sort_custom(func(x, y):
		var ox: bool = int(base.get(x, 10)) % 2 == 1
		var oy: bool = int(base.get(y, 10)) % 2 == 1
		if ox != oy:
			return ox
		return int(base.get(x, 10)) > int(base.get(y, 10)))
	order.append_array(rest)
	return {order[0]: 2, order[1]: 1}

# ================================================================== habilidades

## Cuántas habilidades elige el jugador además de las fijas del trasfondo.
static func skill_slots(s: Dictionary, level: int) -> Dictionary:
	var cd := class_data(s)
	var out := {"class": int(cd.get("skills", {}).get("choose", 2)), "species": 0, "feats": 0, "class_bonus": 0}
	var spd := species_data(s)
	out.species += int(spd.get("skill_choices", 0))
	if spd.has("keen_senses"):
		out.species += 1
	for f in all_feats(s, level):
		if f == "skilled":
			out.feats += 3
	var scd: Dictionary = cd.get("subclasses", {}).get(s.get("subclass", ""), {})
	if level >= 3:
		out.class_bonus += int(_get_level(scd.get("bonus_skills", {}), level, 0))
		if s.get("class", "") == "barbarian":
			out.class_bonus += 1   # Conocimiento primordial
	return out

## Habilidades fijas (trasfondo y especie). Si coinciden, la repetida se cambia por una a elegir.
static func fixed_skills(s: Dictionary) -> Array:
	var out: Array = []
	var bg: Dictionary = RulesDB.backgrounds.get(s.get("background", ""), {})
	for k in bg.get("skills", []) + species_data(s).get("skills", []):
		if not k in out:
			out.append(k)
	return out

## Cuántas habilidades fijas se pisan entre trasfondo y especie (cada una da una elección libre).
static func overlapping_fixed(s: Dictionary) -> int:
	var bg: Dictionary = RulesDB.backgrounds.get(s.get("background", ""), {})
	var n := 0
	for k in species_data(s).get("skills", []):
		if k in bg.get("skills", []):
			n += 1
	return n

static func required_skills(s: Dictionary, level: int) -> int:
	var slots := skill_slots(s, level)
	var bg: Dictionary = RulesDB.backgrounds.get(s.get("background", ""), {})
	var fixed: int = bg.get("skills", []).size() + species_data(s).get("skills", []).size()
	return fixed + int(slots.class) + int(slots.species) + int(slots.feats) + int(slots.class_bonus)

static func expertise_count(s: Dictionary, level: int) -> int:
	var cd := class_data(s)
	var n := 0
	for l in range(1, level + 1):
		n += int(cd.get("expertise_count", {}).get(str(l), 0))
	return n

static func expertise_list(s: Dictionary, level: int) -> Array:
	var e = s.get("expertise", [])
	if typeof(e) == TYPE_ARRAY:
		return e
	var out: Array = []
	for l in range(1, level + 1):
		for sk in e.get(str(l), []):
			if not sk in out:
				out.append(sk)
	return out

# ================================================================== dotes

## Todas las dotes del personaje hasta el nivel (origen, estilo de combate, invocaciones de dote).
static func all_feats(s: Dictionary, level: int) -> Array:
	var out: Array = []
	for f in s.get("feats", []):
		var fid: String = f
		if fid.begins_with("magic_initiate"):
			fid = "magic_initiate"
		if not fid in out or RulesDB.feats.get(fid, {}).get("repeatable", false):
			out.append(fid)
	if level >= 2 and "lessons_of_the_first_ones" in invocations_at(s, level) and s.has("lessons_feat"):
		out.append(s.lessons_feat)
	return out

static func invocations_at(s: Dictionary, level: int) -> Array:
	var inv = s.get("invocations", {})
	if typeof(inv) == TYPE_ARRAY:
		return inv
	var v = _get_level(inv, level, [])
	return v if v != null else []

# ================================================================== completar

static func complete(sheet: Dictionary, level: int) -> Dictionary:
	var s: Dictionary = sheet.duplicate(true)
	level = clamp(level, 1, MAX_LEVEL)
	if not RulesDB.classes.has(s.get("class", "")):
		s["class"] = "fighter"
	var cls: String = s["class"]
	var cd := class_data(s)
	if not RulesDB.species.has(s.get("species", "")):
		s["species"] = "human"
	var spd := species_data(s)
	# Linaje / ascendencia / tamaño
	if spd.has("lineages") and not spd.lineages.has(s.get("lineage", "")):
		s["lineage"] = spd.lineages.keys()[0]
	if spd.has("ancestries") and not spd.ancestries.has(s.get("ancestry", "")):
		s["ancestry"] = spd.ancestries.keys()[0]
	if spd.get("lineage_ability", false) and not s.get("lineage_ability", "") in ["int", "wis", "cha"]:
		var ca := casting_ability(s)
		s["lineage_ability"] = ca if ca in ["int", "wis", "cha"] else _best_mental(s)
	if not s.get("size", "") in spd.get("sizes", ["medium"]):
		s["size"] = spd.get("sizes", ["medium"])[0]
	# Subclase
	if level >= 3 and not cd.get("subclasses", {}).has(s.get("subclass", "")):
		s["subclass"] = cd.get("subclasses", {}).keys()[0]
	# Trasfondo
	if not RulesDB.backgrounds.has(s.get("background", "")):
		s["background"] = DEFAULT_BACKGROUND.get(cls, "soldier")
	var bg: Dictionary = RulesDB.backgrounds[s.background]
	# Características
	if not s.has("abilities") or s.has("base_abilities"):
		if not s.has("base_abilities"):
			s["base_abilities"] = cd.get("std_array", {}).duplicate()
		if not s.has("bg_bonus") or not _valid_bg_bonus(s.bg_bonus, bg):
			s["bg_bonus"] = default_bg_bonus(s)
	# Dotes de origen
	var feats: Array = s.get("feats", []).duplicate()
	var bg_feat: String = bg.get("feat", "")
	if not feats.has(bg_feat) and not (bg_feat == "magic_initiate" and _has_prefix(feats, "magic_initiate")):
		feats.push_front(bg_feat)
	if spd.get("extra_origin_feat", false) and _origin_feat_count(feats) < 2:
		feats.append("skilled" if not "skilled" in feats else "alert")
	s["feats"] = feats
	# Estilo de combate
	if level >= fighting_style_level(cls):
		if not s.get("fighting_style", "") in fighting_styles_for(cls):
			s["fighting_style"] = _default_style(s)
	else:
		s.erase("fighting_style")
	# Órdenes
	if cls == "cleric" and not s.get("divine_order", "") in ["protector", "thaumaturge"]:
		s["divine_order"] = "protector"
	if cls == "druid" and not s.get("primal_order", "") in ["warden", "magician"]:
		s["primal_order"] = "magician"
	# Equipo
	_complete_equipment(s)
	# Maestrías
	var mcount := int(_get_level(cd.get("mastery_count", {}), level, 0))
	if mcount > 0:
		var ms: Array = s.get("masteries", []).duplicate()
		ms = ms.filter(func(w): return RulesDB.weapons.has(w) and _mastery_ok(cd, w))
		for w in _mastery_candidates(s, cd):
			if ms.size() >= mcount:
				break
			if not w in ms:
				ms.append(w)
		s["masteries"] = ms.slice(0, mcount)
	# Habilidades
	_complete_skills(s, level)
	# Pericia
	var ecount := expertise_count(s, level)
	if ecount > 0:
		var ex := expertise_list(s, level)
		ex = ex.filter(func(k): return k in s.skills)
		var prefs: Array = ["stealth", "sleight_of_hand", "perception", "persuasion", "performance", "athletics", "arcana", "investigation"]
		if cls == "wizard":
			prefs = cd.get("expertise_from", ["arcana"])
		for k in prefs + s.skills:
			if ex.size() >= ecount:
				break
			if k in s.skills and not k in ex:
				ex.append(k)
		s["expertise"] = ex.slice(0, ecount)
	# Conjuros
	_complete_spells(s, level)
	if _has_prefix(feats, "magic_initiate"):
		s["magic_initiate"] = _complete_magic_initiate(s, bg)
	# Rasgos con elección
	if cls == "druid":
		var forms: Array = s.get("wild_shapes", []).filter(func(f): return f in cd.get("wild_shape_forms", []))
		for f in cd.get("wild_shape_forms", []):
			if forms.size() >= int(cd.get("wild_shape_known", 4)):
				break
			if not f in forms:
				forms.append(f)
		s["wild_shapes"] = forms
		if not s.get("land", "") in RulesDB.features.get("lands", {}).keys():
			s["land"] = "temperate"
	if cls == "ranger" and not s.get("hunters_prey", "") in ["colossus_slayer", "horde_breaker"]:
		s["hunters_prey"] = "colossus_slayer"
	if cls == "sorcerer" and level >= 2:
		var mm: Array = s.get("metamagic", []).filter(func(m): return RulesDB.features.get("metamagic_options", {}).has(m))
		for m in ["quickened", "empowered", "careful", "heightened"]:
			if mm.size() >= 2:
				break
			if not m in mm:
				mm.append(m)
		s["metamagic"] = mm.slice(0, 2)
	if cls == "warlock":
		_complete_invocations(s, level)
	# Identidad y aspecto
	if str(s.get("name", "")).strip_edges().is_empty():
		s["name"] = "Sin nombre"
	if not s.has("pronoun"):
		s["pronoun"] = "m"
	if not s.has("ai"):
		s["ai"] = cd.get("ai", "frontline")
	var vis: Dictionary = s.get("visual", {})
	if not vis.has("model"):
		vis["model"] = cd.get("visual", {}).get("model", "knight")
	s["visual"] = vis
	return s

static func _best_mental(s: Dictionary) -> String:
	var ab = final_abilities(s) if s.has("abilities") or s.has("base_abilities") else class_data(s).get("std_array", {})
	var best := "wis"
	for a in ["int", "wis", "cha"]:
		if int(ab.get(a, 10)) > int(ab.get(best, 10)):
			best = a
	return best

static func _valid_bg_bonus(b: Dictionary, bg: Dictionary) -> bool:
	var allowed: Array = bg.get("abilities", [])
	var total := 0
	for a in b.keys():
		if not a in allowed:
			return false
		var v := int(b[a])
		if v < 1 or v > 2:
			return false
		total += v
	return total == 3 and (b.size() == 2 or b.size() == 3)

static func _has_prefix(arr: Array, prefix: String) -> bool:
	for x in arr:
		if str(x).begins_with(prefix):
			return true
	return false

static func _origin_feat_count(feats: Array) -> int:
	var n := 0
	for f in feats:
		var fid: String = "magic_initiate" if str(f).begins_with("magic_initiate") else f
		if RulesDB.feats.get(fid, {}).get("category", "") == "origin":
			n += 1
	return n

static func _complete_magic_initiate(s: Dictionary, bg: Dictionary) -> Dictionary:
	var mi: Dictionary = s.get("magic_initiate", {}).duplicate(true)
	var lst: String = mi.get("list", bg.get("feat_list", "wizard"))
	if not lst in ["cleric", "druid", "wizard"]:
		lst = "wizard"
	mi["list"] = lst
	if not mi.get("ability", "") in ["int", "wis", "cha"]:
		mi["ability"] = "int" if lst == "wizard" else "wis"
		var ca := casting_ability(s)
		if ca in ["int", "wis", "cha"]:
			mi["ability"] = ca
	var cantrips: Array = mi.get("cantrips", []).filter(func(x): return int(RulesDB.spell(x).get("level", -1)) == 0 and x in RulesDB.class_spell_list(lst, 0))
	var rec: Dictionary = RulesDB.classes.get(lst, {}).get("casting", {}).get("recommended", {})
	var known: Array = s.get("cantrips", [])
	for x in rec.get("cantrips", []) + RulesDB.class_spell_list(lst, 0, false):
		if cantrips.size() >= 2:
			break
		if not x in cantrips and not x in known and int(RulesDB.spell(x).get("level", 0)) == 0:
			cantrips.append(x)
	mi["cantrips"] = cantrips.slice(0, 2)
	var spell: String = mi.get("spell", "")
	if int(RulesDB.spell(spell).get("level", 0)) != 1 or not spell in RulesDB.class_spell_list(lst, 1):
		spell = ""
		var pref := {"cleric": "healing_word", "druid": "entangle", "wizard": "shield"}
		spell = pref.get(lst, "")
	mi["spell"] = spell
	return mi

static func _default_style(s: Dictionary) -> String:
	var cls: String = s.class
	var weapons: Array = s.get("weapons", [])
	for w in weapons:
		var wd: Dictionary = RulesDB.weapons.get(w, {})
		if wd.get("kind", "") == "ranged" and wd.get("cat", "") == "martial":
			return "archery"
	for w in weapons:
		if "two_handed" in RulesDB.weapons.get(w, {}).get("props", []) and RulesDB.weapons[w].get("kind", "") == "melee":
			return "great_weapon_fighting"
	if cls == "ranger":
		return "archery"
	return "defense"

static func kit_for(s: Dictionary) -> Dictionary:
	var kits: Array = class_data(s).get("kits", [])
	for k in kits:
		if k.id == s.get("kit", ""):
			return k
	# Primero el kit propio de la orden elegida (Protector, Guardián), si existe
	for k in kits:
		var req: String = k.get("requires", "")
		if not req.is_empty() and (req == s.get("divine_order", "") or req == s.get("primal_order", "")):
			return k
	for k in kits:
		if str(k.get("requires", "")).is_empty():
			return k
	return {}

static func _complete_equipment(s: Dictionary) -> void:
	if s.has("weapons") and s.has("armor"):
		return
	var k := kit_for(s)
	if k.is_empty():
		return
	s["kit"] = k.id
	s["armor"] = k.get("armor", "")
	s["shield"] = k.get("shield", false)
	s["weapons"] = k.get("weapons", []).duplicate()
	s["ammo"] = k.get("ammo", {}).duplicate()
	var items: Dictionary = s.get("items", {}).duplicate()
	for it in k.get("items", {}).keys():
		items[it] = int(items.get(it, 0)) + int(k.items[it])
	if not items.has("potion_healing"):
		items["potion_healing"] = 1
	s["items"] = items
	var bg: Dictionary = RulesDB.backgrounds.get(s.get("background", ""), {})
	s["gold"] = int(k.get("gold", 0)) + int(bg.get("gold", 0))

static func _mastery_ok(cd: Dictionary, wid: String) -> bool:
	var w: Dictionary = RulesDB.weapons.get(wid, {})
	if str(w.get("mastery", "")).is_empty():
		return false
	if cd.get("mastery_melee_only", false) and w.get("kind", "") != "melee":
		return false
	return true

static func _mastery_candidates(s: Dictionary, cd: Dictionary) -> Array:
	var out: Array = []
	for w in s.get("weapons", []):
		if _mastery_ok(cd, w) and not w in out:
			out.append(w)
	for w in ["longsword", "greataxe", "shortsword", "handaxe", "javelin", "longbow", "shortbow", "rapier", "scimitar", "spear"]:
		if _mastery_ok(cd, w) and not w in out:
			out.append(w)
	return out

static func _complete_skills(s: Dictionary, level: int) -> void:
	var skills: Array = fixed_skills(s)
	for k in s.get("skills", []):
		if k in SKILLS and not k in skills:
			skills.append(k)
	var need := required_skills(s, level)
	var spd := species_data(s)
	# Sentidos agudos: una de su lista que no venga ya del trasfondo
	if spd.has("keen_senses"):
		var has_keen := false
		for k in spd.keen_senses:
			if k in skills and not k in RulesDB.backgrounds.get(s.background, {}).get("skills", []):
				has_keen = true
		if not has_keen:
			for k in spd.keen_senses:
				if not k in skills:
					skills.append(k)
					break
	var cd := class_data(s)
	var class_from: Array = cd.get("skills", {}).get("from", SKILLS)
	for k in SKILL_PREFS.get(s.class, []) + class_from + SKILLS:
		if skills.size() >= need:
			break
		if not k in skills:
			skills.append(k)
	s["skills"] = skills

static func _complete_spells(s: Dictionary, level: int) -> void:
	var cd := class_data(s)
	var cast: Dictionary = cd.get("casting", {})
	if cast.is_empty():
		s.erase("cantrips")
		s.erase("prepared")
		return
	var rec: Dictionary = cast.get("recommended", {})
	var lst: Array = cast.get("list", [])
	# Trucos
	var ncan := int(_get_level(cast.get("cantrips", {}), level, 0))
	if s.get("divine_order", "") == "thaumaturge" or s.get("primal_order", "") == "magician":
		ncan += 1
	var cantrips: Array = s.get("cantrips", []).filter(func(x): return x in lst and int(RulesDB.spell(x).get("level", -1)) == 0)
	for x in rec.get("cantrips", []) + lst:
		if cantrips.size() >= ncan:
			break
		if not x in cantrips and int(RulesDB.spell(x).get("level", -1)) == 0 and not RulesDB.spell(x).get("utility", false):
			cantrips.append(x)
	s["cantrips"] = cantrips.slice(0, ncan)
	# Preparados por nivel
	var prep = s.get("prepared", {})
	if typeof(prep) == TYPE_ARRAY:
		prep = {"1": prep}
	var out := {}
	var prev: Array = []
	var always := always_prepared(s, level)
	for l in range(1, level + 1):
		var n := int(_get_level(cast.get("prepared", {}), l, 0))
		var max_lvl := max_spell_level(s, l)
		var cur: Array
		if prep.has(str(l)):
			cur = prep[str(l)].duplicate()
		else:
			cur = prev.duplicate()
		cur = cur.filter(func(x): return x in lst and int(RulesDB.spell(x).get("level", 0)) >= 1 and int(RulesDB.spell(x).get("level", 0)) <= max_lvl and not x in always_prepared(s, l))
		var order: Array = []
		for k in ["1", "2", "3"]:
			if int(k) <= l:
				order.append_array(rec.get(k, []))
		for x in order + lst:
			if cur.size() >= n:
				break
			var sl := int(RulesDB.spell(x).get("level", 0))
			if sl >= 1 and sl <= max_lvl and not x in cur and not x in always_prepared(s, l) and not RulesDB.spell(x).get("utility", false):
				cur.append(x)
		out[str(l)] = cur.slice(0, n)
		prev = out[str(l)]
	s["prepared"] = out

## Nivel máximo de conjuro que puede preparar a ese nivel de clase.
static func max_spell_level(s: Dictionary, level: int) -> int:
	var t: String = class_data(s).get("casting", {}).get("type", "")
	var slots := RulesDB.slots_for(t, level)
	return slots.size()

## Conjuros siempre preparados por clase y subclase.
static func always_prepared(s: Dictionary, level: int) -> Array:
	var cd := class_data(s)
	var out: Array = []
	var cast_always: Dictionary = cd.get("casting", {}).get("always", {})
	for l in range(1, level + 1):
		for x in cast_always.get(str(l), []):
			if not x in out:
				out.append(x)
	var scd: Dictionary = cd.get("subclasses", {}).get(s.get("subclass", ""), {})
	if level >= 3:
		for l2 in range(1, level + 1):
			for x in scd.get("always_prepared", {}).get(str(l2), []):
				if not x in out:
					out.append(x)
		if s.get("class", "") == "druid":
			var land: Dictionary = RulesDB.features.get("lands", {}).get(s.get("land", "temperate"), {})
			for x in land.get("spells", []):
				if not x in out:
					out.append(x)
	return out

static func _complete_invocations(s: Dictionary, level: int) -> void:
	var cd := class_data(s)
	var catalog: Dictionary = RulesDB.features.get("invocations", {})
	var inv = s.get("invocations", {})
	if typeof(inv) == TYPE_ARRAY:
		inv = {"1": inv}
	var out := {}
	var prev: Array = []
	for l in range(1, level + 1):
		var n := int(_get_level(cd.get("invocation_count", {}), l, 0))
		var cur: Array = (inv.get(str(l), prev) as Array).duplicate()
		cur = cur.filter(func(i): return catalog.has(i) and int(catalog[i].get("level", 1)) <= l and _inv_req_ok(s, catalog[i]))
		var defaults: Array = DEFAULT_INVOCATIONS.get(str(min(l, 2)), [])
		for i in defaults + catalog.keys():
			if cur.size() >= n:
				break
			if not i in cur and catalog.has(i) and int(catalog[i].get("level", 1)) <= l and _inv_req_ok(s, catalog[i]):
				cur.append(i)
		out[str(l)] = cur.slice(0, n)
		prev = out[str(l)]
	s["invocations"] = out
	var cur_inv: Array = out.get(str(level), [])
	if "pact_of_the_tome" in cur_inv:
		var tome: Array = s.get("tome_cantrips", []).filter(func(x): return int(RulesDB.spell(x).get("level", -1)) == 0)
		for x in ["guidance", "sacred_flame", "fire_bolt", "toll_the_dead", "starry_wisp"]:
			if tome.size() >= 3:
				break
			if not x in tome and not x in s.get("cantrips", []):
				tome.append(x)
		s["tome_cantrips"] = tome.slice(0, 3)
	if "pact_of_the_blade" in cur_inv:
		if not s.get("pact_weapon", "") in s.get("weapons", []):
			for w in s.get("weapons", []):
				if RulesDB.weapons.get(w, {}).get("kind", "") == "melee":
					s["pact_weapon"] = w
					break
	if "lessons_of_the_first_ones" in cur_inv and not s.get("lessons_feat", "") in origin_feats():
		s["lessons_feat"] = "alert" if not "alert" in s.get("feats", []) else "savage_attacker"

static func _inv_req_ok(s: Dictionary, inv: Dictionary) -> bool:
	var req: String = inv.get("requires", "")
	if req.is_empty():
		return true
	return req in s.get("cantrips", [])

## Aspecto visual completo (modelo, colores, rasgos de especie, armas) de un héroe creado.
static func visual_for(sheet: Dictionary) -> Dictionary:
	var v: Dictionary = sheet.get("visual", {}).duplicate(true)
	var cd: Dictionary = RulesDB.classes.get(sheet.get("class", "fighter"), {})
	if not v.has("model"):
		v["model"] = cd.get("visual", {}).get("model", "knight")
	if not v.has("head"):
		v["head"] = v.model
	v["hero"] = true
	v["species"] = sheet.get("species", "human")
	v["lineage"] = sheet.get("lineage", "")
	v["ancestry"] = sheet.get("ancestry", "")
	v["size"] = sheet.get("size", "medium")
	v["weapons_list"] = sheet.get("weapons", [])
	v["shield_on"] = sheet.get("shield", false)
	v["class"] = sheet.get("class", "")
	var sp: Dictionary = RulesDB.species.get(v.species, {})
	if v.species == "dragonborn":
		# Escamas del color del linaje; el "pelo" del modelo se lee como cresta
		var anc: Dictionary = sp.get("ancestries", {}).get(v.ancestry, {})
		if not v.has("skin") or str(v.skin).is_empty():
			v["skin"] = anc.get("color", "#b33a2c")
		v["hair"] = Color.html(str(v.skin)).darkened(0.45).to_html(false)
		v["hat"] = false
	else:
		if not v.has("skin") or str(v.skin).is_empty():
			var skins: Array = sp.get("visual", {}).get("skins", [])
			if not skins.is_empty():
				v["skin"] = skins[0]
		# Siempre un color de pelo: así la barba y las cejas casan con el peinado
		if not v.has("hair") or str(v.hair).is_empty():
			v["hair"] = "#3b2a1e"
	if not v.has("cloth") or str(v.cloth).is_empty():
		v["cloth"] = "#3f5f9a"
	return v

# ================================================================== nombres

## Nombre inventado según especie y pronombre ("m", "f" o "n").
static func random_name(species: String, pronoun: String, rng: RandomNumberGenerator = null) -> String:
	if rng == null:
		rng = RandomNumberGenerator.new()
		rng.randomize()
	var nd: Dictionary = RulesDB.names.get(species, RulesDB.names.get("human", {}))
	# Herencia mixta: nombre de un pueblo y apellido del otro
	if nd.has("mix"):
		var srcs: Array = nd.mix
		var first_src: String = srcs[rng.randi() % srcs.size()]
		var other: String = srcs[0] if first_src != srcs[0] else srcs[srcs.size() - 1]
		var fn := random_name(first_src, pronoun, rng).split(" ")[0]
		var fam: Array = RulesDB.names.get(other, {}).get("family", [])
		return fn if fam.is_empty() else "%s %s" % [fn, fam[rng.randi() % fam.size()]]
	var starts: Array = nd.get("start", ["Al"])
	var ends: Array
	match pronoun:
		"f":
			ends = nd.get("end_f", ["a"])
		"m":
			ends = nd.get("end_m", ["an"])
		_:
			ends = nd.get("end_m", ["an"]) + nd.get("end_f", ["a"])
	# Los tieflings a veces adoptan un nombre de virtud
	if nd.has("virtue") and rng.randf() < 0.3:
		var virtues: Array = nd.virtue
		return virtues[rng.randi() % virtues.size()]
	var first: String = str(starts[rng.randi() % starts.size()]) + str(ends[rng.randi() % ends.size()])
	first = first.substr(0, 1).to_upper() + first.substr(1)
	var family: Array = nd.get("family", [])
	if family.is_empty():
		return first
	return "%s %s" % [first, family[rng.randi() % family.size()]]

# ================================================================== resumen

## Rasgos de clase y subclase ganados exactamente a un nivel (para la subida de nivel).
static func features_gained(s: Dictionary, level: int) -> Array:
	var cd := class_data(s)
	var out: Array = []
	for f in cd.get("features", {}).get(str(level), []):
		if f == "subclass":
			var scd: Dictionary = cd.get("subclasses", {}).get(s.get("subclass", ""), {})
			for sf in scd.get("features", {}).get(str(level), []):
				out.append(sf)
		else:
			out.append(f)
	return out

static func class_features_up_to(s: Dictionary, level: int) -> Array:
	var out: Array = []
	for l in range(1, level + 1):
		for f in features_gained(s, l):
			if not f in out:
				out.append(f)
	return out

static func hp_at(s: Dictionary, level: int) -> int:
	var cd := class_data(s)
	var hd := int(cd.get("hit_die", 8))
	var ab := final_abilities(s)
	var con := mod(int(ab.get("con", 10)))
	var hp := hd + con
	for l in range(2, level + 1):
		hp += int(hd / 2) + 1 + con
	if s.get("species", "") == "dwarf":
		hp += level
	if s.get("class", "") == "sorcerer" and s.get("subclass", "") == "draconic" and level >= 3:
		hp += 3 + (level - 3)
	return max(1, hp)

## Problemas que impiden dar la hoja por buena (para el creador).
static func validate(s: Dictionary, level: int) -> Array:
	var errs: Array = []
	if str(s.get("name", "")).strip_edges().is_empty():
		errs.append("Falta el nombre.")
	if s.has("base_abilities"):
		var method: String = s.get("ability_method", "standard")
		if method == "point_buy" and point_buy_spent(s.base_abilities) > POINT_BUY_TOTAL:
			errs.append("Has gastado más de 27 puntos.")
		if method == "standard":
			var vals: Array = []
			for a in ABILITIES:
				vals.append(int(s.base_abilities.get(a, 0)))
			vals.sort()
			var std := STANDARD_ARRAY.duplicate()
			std.sort()
			if vals != std:
				errs.append("Usa cada valor de la matriz estándar una vez.")
	var full := complete(s, level)
	if s.get("skills", []).size() < required_skills(full, level):
		errs.append("Te quedan habilidades por elegir.")
	return errs
