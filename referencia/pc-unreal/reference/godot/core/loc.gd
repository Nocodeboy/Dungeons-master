class_name Loc
extends Object
## Textos traducibles. Español primero; el inglés se añade en data/lang/en.json.

static var lang: String = "es"
static var _tables: Dictionary = {}

static func _static_init() -> void:
	_load_lang("es")

static func set_lang(l: String) -> void:
	lang = l
	_load_lang(l)

static func _load_lang(l: String) -> void:
	if _tables.has(l):
		return
	var path := "res://data/lang/%s.json" % l
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		_tables[l] = {}
		return
	var parsed = JSON.parse_string(f.get_as_text())
	_tables[l] = parsed if typeof(parsed) == TYPE_DICTIONARY else {}

## Traduce una clave y sustituye {marcadores}. Si falta en el idioma, usa el español.
static func t(key: String, args: Dictionary = {}) -> String:
	var table: Dictionary = _tables.get(lang, {})
	var s = table.get(key, null)
	if s == null:
		s = _tables.get("es", {}).get(key, key)
	var out: String = str(s)
	if not args.is_empty():
		out = out.format(args)
	return out

static func has(key: String) -> bool:
	return _tables.get(lang, {}).has(key) or _tables.get("es", {}).has(key)

static func dmg_type(t_id: String) -> String:
	return t("dmg." + t_id)

static func cond(c: String) -> String:
	return t("cond." + c)

static func ability(a: String) -> String:
	return t("ab." + a)

static func ability_short(a: String) -> String:
	return t("abs." + a)

## Pies a metros con el redondeo habitual de las ediciones en español (5 pies = 1,5 m).
static func ft(feet: int) -> String:
	var m := feet * 0.3
	var s := ("%.1f" % m).replace(".", ",")
	if s.ends_with(",0"):
		s = s.substr(0, s.length() - 2)
	return s + " m"
