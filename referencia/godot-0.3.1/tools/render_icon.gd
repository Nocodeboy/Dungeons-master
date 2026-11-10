extends SceneTree
## Renderiza el icono de la aplicación: el toro de granito agrietado sobre fondo oscuro.
## xvfb-run -a godot --path . --rendering-driver opengl3 -s tools/render_icon.gd -- salida.png [transparente]

var frames := 0
var out := "/tmp/icon_raw.png"
var transparent := false
var vp: SubViewport

func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	if args.size() > 0:
		out = args[0]
	transparent = args.size() > 1 and args[1] == "transparente"
	vp = SubViewport.new()
	vp.size = Vector2i(1024, 1024)
	vp.transparent_bg = transparent
	vp.msaa_3d = Viewport.MSAA_4X
	vp.own_world_3d = true
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_COLOR if not transparent else Environment.BG_CLEAR_COLOR
	e.background_color = Color(0.09, 0.05, 0.04)
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.55, 0.5, 0.55)
	e.ambient_light_energy = 0.55
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	e.glow_enabled = true
	e.glow_intensity = 0.9
	e.glow_bloom = 0.0
	env.environment = e
	vp.add_child(env)
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-35, 40, 0)
	key.light_energy = 1.3
	key.light_color = Color(1.0, 0.82, 0.62)
	vp.add_child(key)
	var rim := DirectionalLight3D.new()
	rim.rotation_degrees = Vector3(-15, 200, 0)
	rim.light_energy = 1.4
	rim.light_color = Color(1.0, 0.35, 0.2)
	vp.add_child(rim)
	var red := OmniLight3D.new()
	red.position = Vector3(0, 0.9, 0.9)
	red.light_color = Color(1.0, 0.15, 0.08)
	red.light_energy = 1.5
	red.omni_range = 3.0
	vp.add_child(red)
	var mat := ShaderMaterial.new()
	mat.shader = load("res://assets/shaders/granite.gdshader")
	mat.set_shader_parameter("crack_amount", 1.0)
	mat.set_shader_parameter("crack_glow", 2.2)
	mat.set_shader_parameter("scale", 6.0)
	var bull: Node3D = (load("res://assets/models/creatures/Bull.gltf") as PackedScene).instantiate()
	vp.add_child(bull)
	for mi in bull.find_children("*", "MeshInstance3D", true, false):
		(mi as MeshInstance3D).material_override = mat
	var ap: AnimationPlayer = bull.find_child("AnimationPlayer", true, false)
	if ap:
		ap.play("Idle_Headlow")
		ap.seek(0.4, true)
		ap.pause()
	bull_node = bull

var bull_node: Node3D

func _frame() -> void:
	var bull := bull_node
	bull.rotation_degrees.y = 58
	var aabb := AABB()
	var first := true
	for mi in bull.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		var bb := m.global_transform * m.get_aabb()
		aabb = bb if first else aabb.merge(bb)
		first = false
	var center := aabb.get_center()
	bull.position -= Vector3(center.x, aabb.position.y, center.z)
	var h := aabb.size.y
	var w: float = max(aabb.size.x, aabb.size.z)
	var cam := Camera3D.new()
	cam.fov = 28
	vp.add_child(cam)
	var dist: float = max(h, w) * 2.35
	cam.look_at_from_position(Vector3(dist * 0.25, h * 0.75, dist), Vector3(0, h * 0.5, 0))
	cam.current = true

func _process(_d: float) -> bool:
	frames += 1
	if frames == 3:
		_frame()
	if frames == 14:
		var img := vp.get_texture().get_image()
		img.save_png(out)
		print("icono: ", out)
		quit()
		return true
	return false
