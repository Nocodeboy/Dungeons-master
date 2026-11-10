extends Node
## Estado global: ajustes, progreso guardado, música y efectos de sonido.

signal settings_changed

const SAVE_PATH := "user://partida.json"
const ENCOUNTER_ORDER := ["e1_prado", "e2_pinar", "e3_tumulo"]

var settings := {
	"anim_speed": 1.0,          ## 1.0 o 2.0
	"enemy_speed": 1.5,         ## acelera los turnos enemigos
	"reactions": "auto",        ## "auto" | "never"
	"dice_details": true,
	"text_scale": 1.0,
	"colorblind": false,
	"music_volume": 0.7,
	"sfx_volume": 0.9,
	"lang": "es",
	"auto_companions": {},      ## id -> bool (guiones de compañero)
	"tips": true,
	"quality": "medium",        ## "low" | "medium" | "high"
}
var progress := {
	"unlocked": ["e1_prado"],
	"completed": [],
	"best_rounds": {},
	"last": "",
}
var current_encounter: String = ""
## Partida en curso (campaña con exploración). null si no hay ninguna cargada.
var campaign: Campaign = null
const SAVE_DIR := "user://partidas"
const SLOTS := ["auto", "1", "2", "3", "4", "5", "6"]
## Héroe creado por el jugador (hoja de personaje) y compañeros elegidos.
var hero: Dictionary = {}
var party_ids: Array = []

var _music: AudioStreamPlayer
var _music_b: AudioStreamPlayer
var _music_key := ""
var _sfx_pool: Array = []
var _sfx_cache: Dictionary = {}

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	load_game()
	if OS.has_environment("MG_QUALITY"):   # solo para pruebas
		settings["quality"] = OS.get_environment("MG_QUALITY")
	Loc.set_lang(settings.lang)
	_music = AudioStreamPlayer.new()
	_music.bus = "Master"
	add_child(_music)
	_music_b = AudioStreamPlayer.new()
	add_child(_music_b)
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_sfx_pool.append(p)
	apply_graphics.call_deferred()

## Antialiasing y resolución 3D según la calidad gráfica.
func apply_graphics() -> void:
	var vp := get_viewport()
	if vp == null:
		return
	var q: String = settings.get("quality", "medium")
	vp.msaa_3d = Viewport.MSAA_DISABLED if q == "low" else Viewport.MSAA_2X
	vp.scaling_3d_scale = 0.75 if q == "low" else 1.0
	var env_scale := OS.get_environment("MG_3D_SCALE")
	if not env_scale.is_empty():
		vp.scaling_3d_scale = float(env_scale)

# ================================================================== guardado

func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return
	var data = JSON.parse_string(f.get_as_text())
	if typeof(data) != TYPE_DICTIONARY:
		return
	for k in data.get("settings", {}).keys():
		settings[k] = data.settings[k]
	for k in data.get("progress", {}).keys():
		progress[k] = data.progress[k]
	hero = data.get("hero", {})
	party_ids = data.get("party_ids", [])

func save_game() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		push_warning("No se pudo guardar la partida")
		return
	f.store_string(JSON.stringify({"version": 2, "settings": settings, "progress": progress, "hero": hero, "party_ids": party_ids}, "  "))

# ================================================================== partidas (ranuras)

func _slot_path(slot: String) -> String:
	return "%s/%s.json" % [SAVE_DIR, slot]

## Guarda la campaña en una ranura. Devuelve true si ha ido bien.
func save_campaign(slot: String) -> bool:
	if campaign == null:
		return false
	DirAccess.make_dir_recursive_absolute(SAVE_DIR)
	var f := FileAccess.open(_slot_path(slot), FileAccess.WRITE)
	if f == null:
		push_warning("No se pudo guardar en " + slot)
		return false
	var h := campaign.hero()
	var place: String = RulesDB.levels.get(str(campaign.location.get("level", "")), {}).get("name", "")
	var meta := {"slot": slot, "hero": h.get("name", ""), "class": h.get("class", ""), "species": h.get("species", ""),
		"level": campaign.party_level, "place": place, "day": campaign.day, "playtime": campaign.playtime,
		"time": Time.get_datetime_string_from_system(false, true), "unix": Time.get_unix_time_from_system()}
	f.store_string(JSON.stringify({"meta": meta, "campaign": campaign.to_dict()}))
	f.close()
	return true

## Carga una ranura en `campaign`. Devuelve true si ha ido bien.
func load_campaign(slot: String) -> bool:
	if not FileAccess.file_exists(_slot_path(slot)):
		return false
	var f := FileAccess.open(_slot_path(slot), FileAccess.READ)
	if f == null:
		return false
	var data = JSON.parse_string(f.get_as_text())
	if typeof(data) != TYPE_DICTIONARY or not data.has("campaign"):
		return false
	campaign = Campaign.from_dict(data.campaign)
	hero = campaign.hero()
	return true

## Lista de partidas guardadas: [{slot, hero, level, place, day, time, unix, playtime}], la más reciente primero.
func list_saves() -> Array:
	var out: Array = []
	for slot in SLOTS:
		var p := _slot_path(slot)
		if not FileAccess.file_exists(p):
			continue
		var f := FileAccess.open(p, FileAccess.READ)
		if f == null:
			continue
		var data = JSON.parse_string(f.get_as_text())
		if typeof(data) == TYPE_DICTIONARY and data.has("meta"):
			out.append(data.meta)
	out.sort_custom(func(a, b): return float(a.get("unix", 0)) > float(b.get("unix", 0)))
	return out

func has_saves() -> bool:
	return not list_saves().is_empty()

func delete_save(slot: String) -> void:
	if FileAccess.file_exists(_slot_path(slot)):
		DirAccess.remove_absolute(_slot_path(slot))

func set_setting(key: String, value) -> void:
	settings[key] = value
	if key == "lang":
		Loc.set_lang(value)
	if key == "music_volume":
		_apply_music_volume()
	if key in ["text_scale", "colorblind"]:
		UI.reset_theme()
	if key == "quality":
		apply_graphics()
	save_game()
	settings_changed.emit()

const COMPANIONS := ["brenna", "pip", "ilyra", "odvar"]
## Compañero que cubre el mismo papel que cada clase (por defecto se queda fuera).
const ROLE_TWIN := {
	"barbarian": "brenna", "fighter": "brenna", "paladin": "brenna", "monk": "pip", "rogue": "pip", "ranger": "pip",
	"cleric": "ilyra", "druid": "ilyra", "bard": "ilyra", "wizard": "odvar", "sorcerer": "odvar", "warlock": "odvar",
}
const ROLE_RANK := {"frontline": 0, "skirmisher_pc": 1, "archer_pc": 2, "healer": 2, "support": 2, "caster": 3}

func default_companions(cls: String) -> Array:
	var twin: String = ROLE_TWIN.get(cls, "")
	return COMPANIONS.filter(func(p): return p != twin)

## Grupo para los combates: el héroe y tres compañeros, ordenados por papel
## (el frente ocupa las primeras posiciones de salida).
func current_party() -> Array:
	if hero.is_empty():
		return BattleSetup.PARTY_ORDER.duplicate()
	var ids: Array = party_ids if party_ids.size() == 3 else default_companions(hero.get("class", ""))
	var list: Array = [hero]
	list.append_array(ids)
	var rank := func(e) -> int:
		var ai: String = e.get("ai", "frontline") if typeof(e) == TYPE_DICTIONARY else RulesDB.party.get(e, {}).get("ai", "frontline")
		return int(ROLE_RANK.get(ai, 1))
	var out: Array = []
	for r in [0, 1, 2, 3]:
		for e in list:
			if rank.call(e) == r:
				out.append(e)
	for e in list:
		if not e in out:
			out.append(e)
	return out

func set_party(ids: Array) -> void:
	party_ids = ids.duplicate()
	save_game()

## Adapta al pronombre del héroe las palabras marcadas en los textos del relato.
func hero_text(text: String) -> String:
	var p: String = hero.get("pronoun", "m")
	var forms := {"Marcado": {"m": "Marcado", "f": "Marcada", "n": "Marcade"}}
	for w in forms.keys():
		text = text.replace(w, forms[w].get(p, w))
	return text

## Nivel hasta el que el jugador ya ha hecho las elecciones de su héroe.
func hero_level() -> int:
	return int(hero.get("choices_level", 1))

func set_hero(sheet: Dictionary) -> void:
	hero = sheet.duplicate(true)
	save_game()

func has_hero() -> bool:
	return not hero.is_empty()

func is_unlocked(enc_id: String) -> bool:
	return enc_id in progress.unlocked

func mark_completed(enc_id: String, rounds: int) -> void:
	if not enc_id in progress.completed:
		progress.completed.append(enc_id)
	var best: int = int(progress.best_rounds.get(enc_id, 9999))
	if rounds < best:
		progress.best_rounds[enc_id] = rounds
	var idx := ENCOUNTER_ORDER.find(enc_id)
	if idx >= 0 and idx + 1 < ENCOUNTER_ORDER.size():
		var nxt: String = ENCOUNTER_ORDER[idx + 1]
		if not nxt in progress.unlocked:
			progress.unlocked.append(nxt)
	save_game()

func next_encounter() -> String:
	for e in ENCOUNTER_ORDER:
		if not e in progress.completed:
			return e
	return ENCOUNTER_ORDER[ENCOUNTER_ORDER.size() - 1]

func reset_progress() -> void:
	progress = {"unlocked": ["e1_prado"], "completed": [], "best_rounds": {}, "last": ""}
	save_game()

## Nueva partida: borra el progreso y el héroe (los ajustes se conservan).
func new_game() -> void:
	hero = {}
	party_ids = []
	reset_progress()

func is_auto(pid: String) -> bool:
	return bool(settings.auto_companions.get(pid, false))

func set_auto(pid: String, v: bool) -> void:
	settings.auto_companions[pid] = v
	save_game()

# ================================================================== música

const MUSIC := {
	"menu": "res://assets/music/menu.ogg",
	"relato": "res://assets/music/relato.ogg",
	"combate": "res://assets/music/combate.ogg",
	"tumulo": "res://assets/music/tumulo.ogg",
	"victoria": "res://assets/music/victoria.ogg",
	"derrota": "res://assets/music/derrota.ogg",
	"aldea": "res://assets/music/aldea.ogg",
	"aldea_tarde": "res://assets/music/aldea_tarde.ogg",
	"posada": "res://assets/music/posada.ogg",
	"bosque": "res://assets/music/bosque.ogg",
}

func play_music(key: String, fade := 1.2) -> void:
	if key == _music_key:
		return
	_music_key = key
	var path: String = MUSIC.get(key, "")
	if path.is_empty():
		return
	var stream: AudioStream = load(path)
	if stream is AudioStreamOggVorbis:
		stream.loop = not key in ["victoria", "derrota"]
	# Fundido cruzado
	var old := _music
	_music = _music_b
	_music_b = old
	_music.stream = stream
	_music.volume_db = -40.0
	_music.play()
	var target := _vol_db(float(settings.music_volume))
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(_music, "volume_db", target, fade)
	tw.tween_property(old, "volume_db", -40.0, fade)
	tw.chain().tween_callback(old.stop)

func stop_music(fade := 1.0) -> void:
	_music_key = ""
	var tw := create_tween()
	tw.tween_property(_music, "volume_db", -40.0, fade)
	tw.tween_callback(_music.stop)

func _apply_music_volume() -> void:
	if _music and _music.playing:
		_music.volume_db = _vol_db(float(settings.music_volume))

func _vol_db(v: float) -> float:
	return linear_to_db(clamp(v, 0.0001, 1.0)) - 4.0

# ================================================================== efectos

const SFX := {
	"click": ["click_001", "click_002"], "select": ["select_001"], "confirm": ["confirmation_001"], "back": ["back_001"],
	"error": ["error_001"], "open": ["open_001"], "close": ["close_001"], "toggle": ["toggle_001"], "tick": ["tick_001"],
	"turn": ["bong_001"], "page": ["bookFlip1"], "book": ["bookOpen"],
	"hit_metal": ["impactMetal_medium_000", "impactMetal_medium_001", "impactMetal_medium_002"],
	"hit_flesh": ["impactPunch_medium_000", "impactPunch_medium_001", "impactPunch_medium_002"],
	"hit_bone": ["impactPlate_light_000", "impactPlate_light_001", "impactWood_light_000"],
	"swing": ["knifeSlice", "knifeSlice2", "chop"], "draw": ["drawKnife1", "drawKnife2"],
	"miss": ["cloth1", "cloth2"], "block": ["impactMetal_medium_001"],
	"step_grass": ["footstep_grass_000", "footstep_grass_001", "footstep_grass_002", "footstep_grass_003"],
	"step_stone": ["footstep_concrete_000", "footstep_concrete_001", "footstep_concrete_002", "footstep_concrete_003"],
	"arrow": ["sfx_arrow"], "fire": ["sfx_fire"], "frost": ["sfx_frost"], "lightning": ["sfx_lightning"], "thunder": ["sfx_thunder"],
	"missile": ["sfx_missile"], "heal": ["sfx_heal"], "buff": ["sfx_buff"], "radiant": ["sfx_radiant"], "necrotic": ["sfx_necrotic"],
	"sleep": ["sfx_sleep"], "teleport": ["sfx_teleport"], "shield": ["sfx_shield"], "thud": ["sfx_thud"], "crit": ["sfx_crit"],
	"dice": ["sfx_dice"], "levelup": ["sfx_levelup"], "victory": ["sfx_victory"], "defeat": ["sfx_defeat"], "bite": ["sfx_bite"],
	"potion": ["glass_002"], "coins": ["handleCoins"],
}

func sfx(key: String, volume := 0.0, pitch_var := 0.08) -> void:
	var list: Array = SFX.get(key, [])
	if list.is_empty():
		return
	var name: String = list[randi() % list.size()]
	var stream: AudioStream = _sfx_cache.get(name)
	if stream == null:
		var path := "res://assets/sfx/%s.ogg" % name
		if not ResourceLoader.exists(path):
			return
		stream = load(path)
		_sfx_cache[name] = stream
	for p in _sfx_pool:
		if not p.playing:
			p.stream = stream
			p.volume_db = _vol_db(float(settings.sfx_volume)) + volume
			p.pitch_scale = 1.0 + randf_range(-pitch_var, pitch_var)
			p.play()
			return

func vibrate(ms := 30) -> void:
	if OS.has_feature("mobile"):
		Input.vibrate_handheld(ms)
