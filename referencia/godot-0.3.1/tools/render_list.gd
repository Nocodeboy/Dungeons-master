extends SceneTree
# godot --path . -s tools/render_list.gd -- out.png path1 path2 ...
var frames := 0
var out := ""
func _init():
	var args = OS.get_cmdline_user_args()
	out = args[0]
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
	root3d.add_child(sun)
	var paths = args.slice(1)
	var n = paths.size()
	for i in n:
		var ps = load(paths[i])
		var inst: Node3D
		if ps is PackedScene:
			inst = ps.instantiate()
		else:
			var gs := GLTFState.new(); var gd := GLTFDocument.new()
			gd.append_from_file(ProjectSettings.globalize_path(paths[i]), gs)
			inst = gd.generate_scene(gs)
		var aabb := _aabb(inst)
		print(paths[i], " aabb=", aabb)
		inst.position = Vector3((i - (n-1)/2.0) * 2.0, 0, 0)
		root3d.add_child(inst)
		var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
		if ap:
			print("  anims: ", ", ".join(ap.get_animation_list()))
			var l = ap.get_animation_list()
			if "Idle" in l: ap.play("Idle")
			elif l.size() > 0: ap.play(l[0])
	var cam := Camera3D.new()
	root3d.add_child(cam)
	cam.look_at_from_position(Vector3(0, 3.0, 9.5), Vector3(0, 1.0, 0))
	cam.fov = 55
	cam.current = true
func _aabb(n: Node) -> AABB:
	var r := AABB()
	var first := true
	for c in n.find_children("*", "MeshInstance3D", true, false):
		var a: AABB = c.get_aabb()
		if first: r = a; first = false
		else: r = r.merge(a)
	return r
func _process(_d):
	frames += 1
	if frames == 30:
		get_root().get_viewport().get_texture().get_image().save_png(out)
		quit()
	return false
