extends SceneTree
## Muestra la orientación de los edificios (la caja roja marca +Z).
func _initialize() -> void:
	var root := Node3D.new()
	get_root().add_child(root)
	var keys := ["tavern", "blacksmith", "church", "house_a", "house_b", "well", "windmill", "mill", "market", "mine"]
	var i := 0
	for k in keys:
		if not ModelLibrary.PROPS.has(k):
			continue
		var p := ModelLibrary.make_prop(k)
		p.position = Vector3((i % 5) * 5.0, 0, int(i / 5) * 6.0)
		root.add_child(p)
		var m := MeshInstance3D.new()
		var b := BoxMesh.new()
		b.size = Vector3(0.4, 0.4, 0.4)
		m.mesh = b
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color.RED
		m.material_override = mat
		m.position = p.position + Vector3(0, 0.2, 2.0)
		root.add_child(m)
		var l := Label3D.new()
		l.text = k
		l.font_size = 96
		l.position = p.position + Vector3(0, 3, -1.5)
		l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		root.add_child(l)
		i += 1
	var cam := Camera3D.new()
	root.add_child(cam)
	cam.fov = 30
	cam.look_at_from_position(Vector3(10, 9, 14), Vector3(10, 0, 3))
	cam.current = true
	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-60, 30, 0)
	root.add_child(sun)
	var we := WorldEnvironment.new()
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.3, 0.4, 0.3)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.6, 0.6, 0.6)
	we.environment = env
	root.add_child(we)
	await create_timer(1.5).timeout
	get_root().get_texture().get_image().save_png(OS.get_environment("OUT"))
	quit()
