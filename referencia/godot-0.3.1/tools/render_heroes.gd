extends SceneTree
## Renderiza una fila de héroes personalizados para revisar el aspecto (especies, colores, armas).
## Uso: xvfb-run godot --path . -s tools/render_heroes.gd -- salida.png [cerca]
var frames := 0
var out := "/tmp/heroes.png"
var close := false

const HEROES := [
	{"class": "fighter", "species": "human", "visual": {"model": "knight", "head": "knight", "skin": "#c68a5c", "hair": "#2b1d14", "cloth": "#3f5f9a"}},
	{"class": "wizard", "species": "elf", "lineage": "high_elf", "visual": {"model": "mage", "head": "mage", "skin": "#f4d8c0", "hair": "#e8e0c8", "cloth": "#5a3a8a", "hat": true}},
	{"class": "cleric", "species": "dwarf", "visual": {"model": "knight", "head": "knight", "skin": "#d9a77d", "hair": "#a0461e", "cloth": "#c8b070"}},
	{"class": "bard", "species": "half_elf", "visual": {"model": "rogue", "head": "rogue", "skin": "#e6bc96", "hair": "#b5783a", "cloth": "#5a3a8a"}},
	{"class": "fighter", "species": "half_orc", "visual": {"model": "barbarian", "head": "knight", "skin": "#93a07c", "hair": "#1e1a17", "cloth": "#8a2a2a"}},
	{"class": "rogue", "species": "halfling", "visual": {"model": "rogue", "head": "rogue", "skin": "#e2b48a", "hair": "#6a4a2a", "cloth": "#4a6a3a"}},
	{"class": "barbarian", "species": "orc", "visual": {"model": "barbarian", "head": "barbarian", "skin": "#6b8a5c", "hair": "#1a1a1a", "cloth": "#7a3a2a"}},
	{"class": "warlock", "species": "tiefling", "lineage": "infernal", "visual": {"model": "rogue_hooded", "head": "rogue", "skin": "#b84a4a", "hair": "#20141e", "cloth": "#2a2a3a"}},
	{"class": "paladin", "species": "dragonborn", "ancestry": "gold", "visual": {"model": "knight", "head": "knight", "cloth": "#8a2a2a"}},
	{"class": "druid", "species": "gnome", "lineage": "forest_gnome", "visual": {"model": "mage", "head": "rogue", "skin": "#e3b58f", "hair": "#c86a2a", "cloth": "#3a6a4a"}},
	{"class": "ranger", "species": "goliath", "visual": {"model": "rogue", "head": "barbarian", "skin": "#a89a8c", "hair": "#3a3a3a", "cloth": "#5a4a2a"}},
]

func _init():
	var args = OS.get_cmdline_user_args()
	if args.size() > 0:
		out = args[0]
	close = args.size() > 1 and args[1] == "cerca"
	var root3d := Node3D.new()
	get_root().add_child(root3d)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color(0.35, 0.42, 0.5)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.7, 0.7, 0.75)
	e.ambient_light_energy = 0.7
	env.environment = e
	root3d.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-45, -25, 0)
	sun.shadow_enabled = true
	root3d.add_child(sun)
	var i := 0
	for h in HEROES:
		var sheet: Dictionary = CharacterSheet.complete(h.duplicate(true), 3)
		var v := ModelLibrary.hero_visual(sheet)
		var m := ModelLibrary.make_hero_model(v)
		m.position = Vector3((i - 5) * 1.15, 0, 0)
		root3d.add_child(m)
		var ap: AnimationPlayer = m.find_child("AnimationPlayer", true, false)
		if ap:
			ap.play("Idle")
		i += 1
	var cam := Camera3D.new()
	if close:
		cam.position = Vector3(0, 1.1, 3.0)
		cam.look_at_from_position(cam.position, Vector3(0, 0.95, 0))
		cam.fov = 90
	else:
		cam.position = Vector3(0, 2.2, 8.0)
		cam.look_at_from_position(cam.position, Vector3(0, 0.6, 0))
		cam.fov = 55
	root3d.add_child(cam)
	cam.current = true

func _process(_d):
	frames += 1
	if frames == 40:
		var img := get_root().get_viewport().get_texture().get_image()
		img.save_png(out)
		print("saved ", out)
		quit()
	return false
