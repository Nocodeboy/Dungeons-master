class_name RulesDB
extends Object
## Base de datos de reglas cargada desde data/*.json (estática, sin autoload).

static var weapons: Dictionary = {}
static var armor: Dictionary = {}
static var spells: Dictionary = {}
static var monsters: Dictionary = {}
static var classes: Dictionary = {}
static var species: Dictionary = {}
static var backgrounds: Dictionary = {}
static var feats: Dictionary = {}
static var features: Dictionary = {}
static var party: Dictionary = {}
static var names: Dictionary = {}
static var items: Dictionary = {}
static var encounters: Dictionary = {}
static var levels: Dictionary = {}
static var merchants: Dictionary = {}
static var slot_tables: Dictionary = {}
static var _loaded := false

static func _static_init() -> void:
	load_all()

static func load_all() -> void:
	if _loaded:
		return
	weapons = _load("res://data/weapons.json")
	armor = _load("res://data/armor.json")
	spells = _load("res://data/spells.json")
	monsters = _load("res://data/monsters.json")
	classes = _load("res://data/classes.json")
	species = _load("res://data/species.json")
	backgrounds = _load("res://data/backgrounds.json")
	feats = _load("res://data/feats.json")
	features = _load("res://data/features.json")
	party = _load("res://data/party.json")
	names = _load("res://data/names.json")
	items = _load("res://data/items.json")
	slot_tables = classes.get("_spell_slots", {})
	for d in [weapons, armor, spells, monsters, classes, party, species, backgrounds, feats, features, names, items]:
		for key in d.keys():
			if str(key).begins_with("_"):
				d.erase(key)
	merchants = _load("res://data/merchants.json")
	merchants.erase("_fuente")
	levels = {}
	var ldir := DirAccess.open("res://data/levels")
	if ldir:
		for f in ldir.get_files():
			if f.ends_with(".json"):
				var lv := _load("res://data/levels/" + f)
				levels[lv.get("id", f.get_basename())] = lv
	encounters = {}
	var dir := DirAccess.open("res://data/encounters")
	if dir:
		for f in dir.get_files():
			if f.ends_with(".json"):
				var e := _load("res://data/encounters/" + f)
				encounters[e.get("id", f.get_basename())] = e
	_loaded = true

static func _load(path: String) -> Dictionary:
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		push_error("No se pudo abrir " + path)
		return {}
	var txt := f.get_as_text()
	var parsed = JSON.parse_string(txt)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("JSON inválido: " + path)
		return {}
	return parsed

static func spell(id: String) -> Dictionary:
	return spells.get(id, {})

static func weapon(id: String) -> Dictionary:
	var w: Dictionary = weapons.get(id, {}).duplicate(true)
	w["id"] = id
	return w

static func monster_data(id: String) -> Dictionary:
	var m: Dictionary = monsters.get(id, {})
	if m.has("base"):
		var merged: Dictionary = monsters.get(m.base, {}).duplicate(true)
		for k in m.keys():
			if k != "base":
				merged[k] = m[k]
		return merged
	return m.duplicate(true)

static func prof_bonus_for(level: int) -> int:
	return 2 + int((level - 1) / 4)

## Espacios de conjuro por nivel de espacio: "full", "half" o "pact".
static func slots_for(caster: String, level: int) -> Array:
	var table: Dictionary = slot_tables.get(caster, {})
	var out: Array = []
	for v in table.get(str(level), []):
		out.append(int(v))
	return out

## Valor de una tabla por nivel {"1": x, "3": y}: el de la clave más alta <= nivel.
static func at_level(table, level: int, default = null):
	if typeof(table) != TYPE_DICTIONARY:
		return table if table != null else default
	var best = default
	var best_l := -1
	for k in table.keys():
		var l := int(k)
		if l <= level and l > best_l:
			best_l = l
			best = table[k]
	return best

static func feature_name(fid: String) -> String:
	var f: Dictionary = features.get(fid, {})
	if f.is_empty():
		for group in ["invocations", "metamagic_options"]:
			if features.get(group, {}).has(fid):
				return features[group][fid].get("name", fid)
		if feats.has(fid):
			return feats[fid].get("name", fid)
		return fid
	return f.get("name", fid)

static func feature_desc(fid: String) -> String:
	var f: Dictionary = features.get(fid, {})
	if f.is_empty():
		for group in ["invocations", "metamagic_options"]:
			if features.get(group, {}).has(fid):
				return features[group][fid].get("desc", "")
		if feats.has(fid):
			return feats[fid].get("desc", "")
	return f.get("desc", "")

## Conjuros de una lista de clase (para Iniciado en la magia y el creador).
static func class_spell_list(cls: String, max_level := 9, include_utility := true) -> Array:
	var out: Array = []
	var cd: Dictionary = classes.get(cls, {})
	for sid in cd.get("casting", {}).get("list", []):
		var sp: Dictionary = spells.get(sid, {})
		if sp.is_empty() or int(sp.get("level", 0)) > max_level:
			continue
		if not include_utility and sp.get("utility", false):
			continue
		out.append(sid)
	return out

## Icono de cada conjuro (assets/icons).
const SPELL_ICONS := {"guidance": "bless", "light": "sun", "mage_hand": "open_palm", "detect_magic": "arcane", "feather_fall": "feather",
	"speak_with_animals": "paw", "alter_self": "mirror", "message": "speaker", "minor_illusion": "mirror", "dancing_lights": "sun",
	"mending": "restore", "thaumaturgy": "thunder", "druidcraft": "nature", "prestidigitation": "magic", "fire_bolt": "fire", "ray_of_frost": "frost", "shocking_grasp": "lightning", "sacred_flame": "flame", "spare_the_dying": "ankh",
	"magic_missile": "missile", "sleep": "sleep", "thunderwave": "thunder", "burning_hands": "fire_ray", "shield": "shield", "mage_armor": "mage_armor",
	"bless": "bless", "cure_wounds": "heal", "healing_word": "heal", "guiding_bolt": "guiding", "shield_of_faith": "shield_faith", "command": "command",
	"sanctuary": "sanctuary", "scorching_ray": "fire_ray", "shatter": "shatter", "misty_step": "teleport", "hold_person": "hold",
	"spiritual_weapon": "spiritual_weapon", "aid": "aid", "lesser_restoration": "restore",
	"vicious_mockery": "psychic", "dissonant_whispers": "psychic", "mind_spike": "psychic", "starry_wisp": "guiding", "true_strike": "smite",
	"eldritch_blast": "eldritch", "chill_touch": "chill", "poison_spray": "poison", "ray_of_sickness": "poison", "acid_splash": "acid", "acid_arrow": "acid",
	"produce_flame": "flame", "produce_flame_hurl": "fire", "shillelagh": "club", "sorcerous_burst": "arcane", "toll_the_dead": "bell",
	"word_of_radiance": "sun", "thunderclap": "thunder", "thorn_whip": "nature", "bane": "curse", "hex": "curse", "charm_person": "charm",
	"suggestion": "charm", "hideous_laughter": "laugh", "chromatic_orb": "arcane", "color_spray": "color", "divine_favor": "bless",
	"divine_smite": "smite", "searing_smite": "smite", "thunderous_smite": "smite", "wrathful_smite": "smite", "shining_smite": "smite",
	"ensnaring_strike": "restrained", "hail_of_thorns": "nature", "entangle": "restrained", "expeditious_retreat": "wind", "longstrider": "feather",
	"faerie_fire": "faerie", "false_life": "heroism", "fog_cloud": "fog", "grease": "grease", "hellish_rebuke": "fire", "heroism": "heroism",
	"hunters_mark": "mark", "ice_knife": "ice_knife", "inflict_wounds": "chill", "protection_from_evil_and_good": "sanctuary",
	"armor_of_agathys": "agathys", "arms_of_hadar": "tentacles", "barkskin": "armor_up", "blindness_deafness": "blind", "blur": "magic_shield",
	"darkness": "darkness", "dragons_breath": "dragon_breath", "dragons_breath_exhale": "breath", "enlarge_reduce": "growth",
	"flame_blade": "fire", "flame_blade_strike": "fire", "flaming_sphere": "fire", "invisibility": "invisible", "magic_weapon": "armor_up",
	"mirror_image": "mirror", "moonbeam": "moon", "ray_of_enfeeblement": "curse", "spike_growth": "spikes", "warding_bond": "bond", "web": "web"}

static func spell_icon(sid: String) -> String:
	return SPELL_ICONS.get(sid, "magic")
