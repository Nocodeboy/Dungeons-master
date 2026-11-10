extends SceneTree
# Uso: godot --path . -s tools/render_preview.gd -- out.png
var frames := 0
var out := "user://preview.png"
func _init():
	var args = OS.get_cmdline_user_args()
	if args.size() > 0: out = args[0]
	var root3d := Node3D.new()
	get_root().add_child(root3d)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color(0.35, 0.42, 0.5)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.6, 0.6, 0.65)
	e.ambient_light_energy = 0.6
	env.environment = e
	root3d.add_child(env)
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -30, 0)
	sun.shadow_enabled = true
	root3d.add_child(sun)
	var names = ["Knight","Rogue_Hooded","Mage","Barbarian","Rogue","Skeleton_Warrior","Skeleton_Minion","Skeleton_Rogue","Skeleton_Mage"]
	var i := 0
	for f in names:
		var ps: PackedScene = load("res://assets/models/characters/%s.glb" % f)
		var inst: Node3D = ps.instantiate()
		inst.position = Vector3((i - 4) * 1.6, 0, 0)
		root3d.add_child(inst)
		var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
		if ap: ap.play("Idle")
		i += 1
	var cam := Camera3D.new()
	cam.position = Vector3(0, 3.0, 9.5)
	cam.look_at_from_position(cam.position, Vector3(0, 1.0, 0))
	cam.fov = 55
	root3d.add_child(cam)
	cam.current = true
func _process(_d):
	frames += 1
	if frames == 30:
		var img := get_root().get_viewport().get_texture().get_image()
		img.save_png(out)
		print("saved ", out)
		quit()
	return false
