class_name LevelWorld
extends BattleWorld
## Escenario de un nivel explorable: el mismo mundo del combate más los edificios y
## objetos colocados a mano (data/levels/*.json), las luces y los objetos interactivos.

var level: Dictionary = {}
var object_nodes: Dictionary = {}   ## id de objeto -> Node3D
var bull_light: OmniLight3D

var animals: Array = []

func build_level(p_level: Dictionary, p_map: BattleMap) -> void:
	level = p_level
	margin_override = 3 if str(level.get("ambient", "")) == "crypt" else 8
	wall_height = float(level.get("wall_height", 1.5))
	ground_override = level.get("ground", {})
	fence_key = str(level.get("fence", "fence"))
	for pt in level.get("paint", []):
		for c in pt.cells:
			cell_ground[Vector2i(int(c[0]), int(c[1]))] = str(pt.ground)
	build(p_map, str(level.get("ambient", "dusk")), int(str(level.get("id", "x")).hash()) % 1000)
	for pr in level.get("props", []):
		_place_level_prop(pr)
	for a in level.get("animals", []):
		var an := AmbientAnimal.new()
		add_child(an)
		var ac := Vector2i(int(a.cell[0]), int(a.cell[1]))
		an.setup(str(a.kind), cell_center(ac), float(a.get("rot", rng.randf_range(0, 360))), float(a.get("wander", 1.0)), rng.randi())
		animals.append(an)

## Decoración que no ocupa casilla (cultivos, flores, herramientas…), en lote si se puede.
func _build_extra() -> void:
	for d in level.get("decor", []):
		var c := Vector2i(int(d.cell[0]), int(d.cell[1]))
		var off := Vector2.ZERO
		if d.has("offset"):
			off = Vector2(float(d.offset[0]), float(d.offset[1]))
		_place(str(d.key), c, float(d.get("rot", rng.randf_range(0, 360))), float(d.get("scale", 1.0)), off)
	for l in level.get("lights", []):
		var c := Vector2i(int(l.cell[0]), int(l.cell[1]))
		var lt := add_light(cell_center(c) + Vector3(0, float(l.get("height", 1.2)), 0), Color.html(str(l.color)),
			float(l.get("energy", 1.2)), float(l.get("range", 4.0)), true)
		if float(l.get("energy", 1.2)) <= 0.0:
			bull_light = lt

## Prop colocado a mano: modelo, casilla, giro y escala (los edificios llevan "foot").
func _place_level_prop(pr: Dictionary) -> void:
	var key: String = pr.get("key", "")
	if key == "footbridge":
		var fb := _footbridge(float(pr.get("length", 2.8)), float(pr.get("width", 1.15)))
		fb.position = cell_center(Vector2i(int(pr.cell[0]), int(pr.cell[1])))
		fb.rotation_degrees.y = float(pr.get("rot", 0))
		add_child(fb)
		return
	if not ModelLibrary.PROPS.has(key):
		return
	var p := ModelLibrary.make_prop(key)
	var c := Vector2i(int(pr.cell[0]), int(pr.cell[1]))
	p.position = cell_center(c)
	if pr.has("offset"):
		p.position += Vector3(float(pr.offset[0]), 0, float(pr.offset[1]))
	p.rotation_degrees.y = float(pr.get("rot", 0))
	p.scale = Vector3.ONE * float(pr.get("scale", 1.0))
	add_child(p)
	if pr.get("smoke", false) and Game.settings.get("quality", "medium") != "low":
		var top := _top_point(p)
		if top != Vector3.INF:
			var sm := AmbientFx.smoke()
			sm.position = top + Vector3(0, 0.05, 0)
			add_child(sm)
	if pr.has("foot") and ambient == "dusk" and rng.randf() < 0.8:
		var r := float(pr.foot) + 0.6
		var a := deg_to_rad(float(pr.get("rot", 0)))
		add_light(p.position + Vector3(sin(a) * r, 0.9, cos(a) * r), Color(1.0, 0.62, 0.3), 0.9, 3.0)

## Punto más alto de un modelo (la chimenea, en las casas de KayKit), en coordenadas del nivel.
func _top_point(n: Node3D) -> Vector3:
	var pts := PackedVector3Array()
	var maxy := -INF
	for mi in n.find_children("*", "MeshInstance3D", true, false):
		var m: MeshInstance3D = mi
		if m.mesh == null:
			continue
		var xf := global_transform.affine_inverse() * m.global_transform
		for si in m.mesh.get_surface_count():
			var verts: PackedVector3Array = m.mesh.surface_get_arrays(si)[Mesh.ARRAY_VERTEX]
			for v in verts:
				var w := xf * v
				pts.append(w)
				maxy = maxf(maxy, w.y)
	if pts.is_empty():
		return Vector3.INF
	var acc := Vector3.ZERO
	var cnt := 0
	for w in pts:
		if w.y > maxy - 0.06:
			acc += w
			cnt += 1
	return acc / cnt

## Visual de un objeto interactivo. Devuelve el nodo (o null si no tiene modelo).
func make_object_node(o: Dictionary) -> Node3D:
	var c := Vector2i(int(o.cell[0]), int(o.cell[1]))
	var holder := Node3D.new()
	holder.position = cell_center(c)
	holder.rotation_degrees.y = float(o.get("rot", 0))
	match str(o.get("type", "")):
		"chest":
			var ch := ModelLibrary.make_prop("chest")
			ch.rotation_degrees.y = float(o.get("rot", rng.randf_range(-30, 30)))
			holder.add_child(ch)
		"cache":
			var sk := ModelLibrary.make_prop("sack")
			sk.scale *= 0.9
			holder.add_child(sk)
			var st := ModelLibrary.make_prop("stones")
			st.scale *= 0.6
			st.position = Vector3(0.22, 0, -0.15)
			holder.add_child(st)
		"loot":
			var bag := ModelLibrary.make_prop("sack")
			bag.scale *= 0.8
			holder.add_child(bag)
		"sign":
			holder.add_child(_sign_mesh(false))
		"board":
			holder.add_child(_sign_mesh(true))
		"campfire":
			holder.add_child(_campfire_mesh())
			add_light(holder.position + Vector3(0, 0.6, 0), Color(1.0, 0.55, 0.2), 1.6, 5.0)
		"stairs":
			holder.add_child(_stairs_mesh())
		"trap":
			holder.add_child(_trap_mesh())
		_:
			holder.free()
			return null
	add_child(holder)
	object_nodes[str(o.get("id", ""))] = holder
	return holder

## Pasarela de tablones con barandilla sobre un arroyo (a lo largo de su eje Z).
func _footbridge(length: float, width: float) -> Node3D:
	var n := Node3D.new()
	var plank := _wood_mat(Color(0.48, 0.34, 0.21))
	var dark := _wood_mat(Color(0.32, 0.22, 0.14))
	var count := int(length / 0.2)
	for i in count:
		var z := -length * 0.5 + (i + 0.5) * length / count
		var b := _box(Vector3(width * rng.randf_range(0.94, 1.0), 0.05, length / count * 0.86), Vector3(rng.randf_range(-0.02, 0.02), 0.07, z), plank)
		b.rotation_degrees.y = rng.randf_range(-2.5, 2.5)
		n.add_child(b)
	for sx in [-1.0, 1.0]:
		n.add_child(_box(Vector3(0.09, 0.08, length + 0.1), Vector3(sx * width * 0.36, 0.03, 0), dark))
		var posts := int(length / 0.7) + 1
		for j in posts:
			var z2 := -length * 0.5 + j * length / (posts - 1)
			n.add_child(_box(Vector3(0.07, 0.5, 0.07), Vector3(sx * width * 0.5, 0.3, z2), dark))
		n.add_child(_box(Vector3(0.06, 0.06, length), Vector3(sx * width * 0.5, 0.52, 0), plank))
	return n

func _wood_mat(col := Color(0.42, 0.29, 0.18)) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.roughness = 0.9
	return m

func _box(size: Vector3, pos: Vector3, mat: Material) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var b := BoxMesh.new()
	b.size = size
	mi.mesh = b
	mi.position = pos
	mi.material_override = mat
	return mi

func _sign_mesh(board: bool) -> Node3D:
	var n := Node3D.new()
	var wood := _wood_mat()
	if board:
		n.add_child(_box(Vector3(0.08, 1.3, 0.08), Vector3(-0.38, 0.65, 0), wood))
		n.add_child(_box(Vector3(0.08, 1.3, 0.08), Vector3(0.38, 0.65, 0), wood))
		n.add_child(_box(Vector3(0.95, 0.6, 0.06), Vector3(0, 0.95, 0), _wood_mat(Color(0.5, 0.36, 0.22))))
		for i in 3:
			n.add_child(_box(Vector3(0.22, 0.26, 0.01), Vector3(-0.28 + i * 0.28, 0.95, 0.04), _wood_mat(Color(0.92, 0.88, 0.76))))
	else:
		n.add_child(_box(Vector3(0.09, 1.2, 0.09), Vector3(0, 0.6, 0), wood))
		n.add_child(_box(Vector3(0.7, 0.24, 0.05), Vector3(0.18, 1.0, 0), _wood_mat(Color(0.55, 0.4, 0.24))))
	return n

func _campfire_mesh() -> Node3D:
	var n := Node3D.new()
	var wood := _wood_mat(Color(0.3, 0.2, 0.12))
	for i in 4:
		var lg := _box(Vector3(0.5, 0.08, 0.08), Vector3(0, 0.06, 0), wood)
		lg.rotation_degrees.y = i * 45
		n.add_child(lg)
	var stones := Color(0.45, 0.43, 0.42)
	for i in 8:
		var a := TAU * i / 8.0
		n.add_child(_box(Vector3(0.12, 0.1, 0.12), Vector3(cos(a) * 0.3, 0.05, sin(a) * 0.3), _wood_mat(stones)))
	var fire := MeshInstance3D.new()
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 0.16
	cone.height = 0.4
	fire.mesh = cone
	var fm := StandardMaterial3D.new()
	fm.albedo_color = Color(1.0, 0.55, 0.15)
	fm.emission_enabled = true
	fm.emission = Color(1.0, 0.45, 0.1)
	fm.emission_energy_multiplier = 3.0
	fire.material_override = fm
	fire.position.y = 0.25
	n.add_child(fire)
	return n

func _stairs_mesh() -> Node3D:
	var n := Node3D.new()
	var stone := ShaderMaterial.new()
	stone.shader = GRANITE_SHADER
	stone.set_shader_parameter("base", Color(0.3, 0.29, 0.28))
	var dark := StandardMaterial3D.new()
	dark.albedo_color = Color(0.02, 0.02, 0.02)
	n.add_child(_box(Vector3(0.8, 0.02, 0.8), Vector3(0, 0.012, 0), dark))
	for i in 3:
		n.add_child(_box(Vector3(0.8, 0.06, 0.2), Vector3(0, 0.03 - i * 0.02, -0.3 + i * 0.22), stone))
	return n

func _trap_mesh() -> Node3D:
	var n := Node3D.new()
	var metal := StandardMaterial3D.new()
	metal.albedo_color = Color(0.35, 0.33, 0.3)
	metal.metallic = 0.6
	metal.roughness = 0.5
	var ring := MeshInstance3D.new()
	var tor := TorusMesh.new()
	tor.inner_radius = 0.16
	tor.outer_radius = 0.22
	ring.mesh = tor
	ring.material_override = metal
	ring.position.y = 0.03
	n.add_child(ring)
	for i in 6:
		var a := TAU * i / 6.0
		var tooth := _box(Vector3(0.04, 0.1, 0.04), Vector3(cos(a) * 0.19, 0.08, sin(a) * 0.19), metal)
		n.add_child(tooth)
	return n

## Brillo pulsante sobre un objeto (algo que se puede usar o que se acaba de encontrar).
func set_object_glow(id: String, on: bool, color := Color(1.0, 0.85, 0.4)) -> void:
	var n: Node3D = object_nodes.get(id)
	if n == null:
		return
	var old := n.get_node_or_null("Glow")
	if old:
		old.queue_free()
	if not on:
		return
	var l := OmniLight3D.new()
	l.name = "Glow"
	l.light_color = color
	l.light_energy = 0.8
	l.omni_range = 1.4
	l.position.y = 0.6
	n.add_child(l)
