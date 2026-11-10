class_name BattleWorld
extends Node3D
## Construye el escenario 3D a partir del mapa táctico y ofrece capas de resaltado.

const GROUND_SHADER := preload("res://assets/shaders/ground.gdshader")
const HIGHLIGHT_SHADER := preload("res://assets/shaders/highlight.gdshader")
const WATER_SHADER := preload("res://assets/shaders/water.gdshader")
const GRANITE_SHADER := preload("res://assets/shaders/granite.gdshader")

const KIND := {"grass": 0, "dirt": 1, "road": 2, "mud": 3, "stone": 4, "forest": 5, "rubble": 6, "brush": 7, "void": 15}

var map: BattleMap
var ambient: String = "dusk"
var rng := RandomNumberGenerator.new()
var ground_mat: ShaderMaterial
var highlight_layers: Dictionary = {}   ## nombre -> MultiMeshInstance3D
var lights: Array = []
var env: Environment
var sun: DirectionalLight3D
var statue_mat: ShaderMaterial
var statue_center := Vector3.INF   ## centro del toro de granito, si lo hay
var margin := 10
var margin_override := -1
var wall_height := 1.5
## Qué suelo pinta cada carácter del mapa ("dirt", "path", "paved", "mud", "grass"); lo fija el nivel.
var ground_override: Dictionary = {}
## Suelo pintado casilla a casilla (huertas, eras…): Vector2i -> "dirt" | "path" | …
var cell_ground: Dictionary = {}
## Modelo de las cercas ('f')
var fence_key := "fence"
var splat_rect := Rect2()
var water_mask: ImageTexture

func build(p_map: BattleMap, p_ambient: String, seed_value: int = 7) -> void:
	map = p_map
	ambient = p_ambient
	rng.seed = seed_value
	margin = 3 if ambient == "crypt" else 12
	if margin_override >= 0:
		margin = margin_override
	ModelLibrary.set_cover_squash(1.0)
	var prof := OS.has_environment("MG_PROFILE")
	var t0 := Time.get_ticks_msec()
	_build_environment()
	_build_ground()
	var t1 := Time.get_ticks_msec()
	_build_water()
	_build_obstacles()
	var t2 := Time.get_ticks_msec()
	_build_surroundings()
	_build_ground_cover()
	_build_extra()
	var t3 := Time.get_ticks_msec()
	_flush_batches()
	_build_ambient_fx()
	if prof:
		var n := 0
		for k in _mm.keys():
			n += (_mm[k] as Dictionary).size()
		print("perfil mundo: suelo %d ms, obstáculos %d ms, alrededores+cubierta %d ms, lotes %d ms (%d zonas-lote)" % [t1 - t0, t2 - t1, t3 - t2, Time.get_ticks_msec() - t3, n])
		var tot := 0
		var rows := []
		for k in _mm.keys():
			var cnt := 0
			var tris := 0
			for ch in (_mm[k] as Dictionary).keys():
				var lots: Array = _mm[k][ch]
				for b in lots:
					var mm: MultiMesh = b.mm
					var t := 0
					for si in mm.mesh.get_surface_count():
						var arr := mm.mesh.surface_get_arrays(si)
						var idx = arr[Mesh.ARRAY_INDEX]
						t += (idx.size() if idx != null else (arr[Mesh.ARRAY_VERTEX] as PackedVector3Array).size()) / 3
					tris += t * mm.instance_count
				cnt += (lots[0].mm as MultiMesh).instance_count if lots.size() > 0 else 0
			tot += tris
			rows.append([tris, k, cnt])
		rows.sort()
		rows.reverse()
		for r in rows.slice(0, 14):
			print("   %-16s %5d copias %8d triángulos" % [r[1], r[2], r[0]])
		print("   total en lotes: %d triángulos" % tot)
	for layer in ["move", "dash", "area", "target", "path", "focus"]:
		_make_layer(layer)

static func cell_center(cell: Vector2i) -> Vector3:
	var c := BattleMap.center(cell)
	return Vector3(c.x, 0.0, c.y)

static func world_to_cell(p: Vector3) -> Vector2i:
	return BattleMap.cell_at(Vector2(p.x, p.z))

## Tamaño del tablero en el mundo (ancho y fondo).
func board_size() -> Vector2:
	return Vector2(map.width + 0.5, (map.height - 1) * BattleMap.ROW_H + 1.0)

func board_center() -> Vector3:
	var sz := board_size()
	return Vector3(sz.x * 0.5, 0, sz.y * 0.5)

## Hexágono plano (6 triángulos desde el centro). UV.x vale 1 en el centro y 0 en el borde.
static func hex_mesh(scale := 1.0) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var pts: Array = []
	for i in 6:
		var a := deg_to_rad(-90.0 + 60.0 * i)
		pts.append(Vector3(cos(a), 0, sin(a)) * BattleMap.HEX_R * scale)
	for i in 6:
		st.set_normal(Vector3.UP)
		st.set_uv(Vector2(1, 0))
		st.add_vertex(Vector3.ZERO)
		st.set_uv(Vector2(0, 0))
		st.add_vertex(pts[i])
		st.set_uv(Vector2(0, 0))
		st.add_vertex(pts[(i + 1) % 6])
	return st.commit()

## Añade un hexágono de suelo a un SurfaceTool.
static func _add_hex(st: SurfaceTool, cell: Vector2i, y0: float, col: Color) -> void:
	var o := cell_center(cell) + Vector3(0, y0, 0)
	var pts: Array = []
	for i in 6:
		var a := deg_to_rad(-90.0 + 60.0 * i)
		pts.append(o + Vector3(cos(a), 0, sin(a)) * (BattleMap.HEX_R + 0.002))
	for i in 6:
		st.set_color(col)
		st.set_normal(Vector3.UP)
		st.set_uv(Vector2(1, 0))
		st.add_vertex(o)
		st.set_uv(Vector2(0, 0))
		st.add_vertex(pts[i])
		st.set_uv(Vector2(0, 0))
		st.add_vertex(pts[(i + 1) % 6])

## Rectángulo en el mundo que ocupan unas casillas (x, z).
static func cells_world_rect(cells: Array) -> Rect2:
	var lo := Vector2(INF, INF)
	var hi := Vector2(-INF, -INF)
	for c in cells:
		var p := BattleMap.center(c)
		lo = lo.min(p)
		hi = hi.max(p)
	return Rect2(lo - Vector2(0.5, 0.5), hi - lo + Vector2(1.0, 1.0))

# ================================================================== ambiente

func _build_environment() -> void:
	var we := WorldEnvironment.new()
	env = Environment.new()
	var sky := Sky.new()
	var psky := ProceduralSkyMaterial.new()
	sky.sky_material = psky
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.glow_enabled = true
	env.glow_intensity = 0.6
	env.glow_bloom = 0.05
	env.fog_enabled = true
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 40.0
	sun.shadow_blur = 1.5
	match ambient:
		"dusk":
			psky.sky_top_color = Color(0.20, 0.22, 0.42)
			psky.sky_horizon_color = Color(0.93, 0.55, 0.32)
			psky.ground_horizon_color = Color(0.45, 0.30, 0.22)
			psky.ground_bottom_color = Color(0.12, 0.10, 0.10)
			psky.sun_angle_max = 20
			env.ambient_light_color = Color(0.46, 0.42, 0.56)
			env.ambient_light_energy = 0.75
			env.fog_light_color = Color(0.42, 0.34, 0.40)
			env.fog_density = 0.006
			sun.light_color = Color(1.0, 0.72, 0.50)
			sun.light_energy = 1.05
			sun.rotation_degrees = Vector3(-34, -62, 0)
		"forest":
			psky.sky_top_color = Color(0.35, 0.52, 0.72)
			psky.sky_horizon_color = Color(0.86, 0.80, 0.60)
			psky.ground_horizon_color = Color(0.40, 0.42, 0.28)
			psky.ground_bottom_color = Color(0.12, 0.14, 0.08)
			env.ambient_light_color = Color(0.48, 0.55, 0.45)
			env.ambient_light_energy = 0.8
			env.fog_light_color = Color(0.40, 0.46, 0.38)
			env.fog_density = 0.008
			sun.light_color = Color(1.0, 0.86, 0.62)
			sun.light_energy = 1.3
			sun.rotation_degrees = Vector3(-42, -35, 0)
		"crypt":
			env.background_mode = Environment.BG_COLOR
			env.background_color = Color(0.02, 0.02, 0.03)
			env.ambient_light_color = Color(0.22, 0.26, 0.40)
			env.ambient_light_energy = 0.55
			env.fog_light_color = Color(0.06, 0.07, 0.10)
			env.fog_density = 0.03
			env.glow_intensity = 0.9
			sun.light_color = Color(0.45, 0.55, 0.85)
			sun.light_energy = 0.28
			sun.rotation_degrees = Vector3(-70, -20, 0)
		_:
			env.ambient_light_color = Color(0.6, 0.6, 0.6)
			sun.rotation_degrees = Vector3(-50, -30, 0)
	we.environment = env
	add_child(we)
	add_child(sun)
	apply_quality()
	if not Game.settings_changed.is_connected(apply_quality):
		Game.settings_changed.connect(apply_quality)

## Ajusta sombras y resplandor según la calidad gráfica elegida.
func apply_quality() -> void:
	if sun == null or env == null:
		return
	var q: String = Game.settings.get("quality", "medium")
	sun.shadow_enabled = q != "low"
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS if q == "high" else DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.directional_shadow_max_distance = 40.0 if q == "high" else 32.0
	env.glow_enabled = q != "low"
	# Nivel de detalle automático de las mallas: en el móvil se nota poco y ahorra mucho
	var vp := get_viewport()
	if vp:
		vp.mesh_lod_threshold = {"low": 6.0, "medium": 3.0, "high": 1.5}.get(q, 3.0)
		if OS.has_environment("MG_LOD"):
			vp.mesh_lod_threshold = float(OS.get_environment("MG_LOD"))

func add_light(pos: Vector3, color: Color, energy: float, rng_m: float, flicker := true) -> OmniLight3D:
	var l := OmniLight3D.new()
	l.position = pos
	l.light_color = color
	l.light_energy = energy
	l.omni_range = rng_m
	l.omni_attenuation = 1.2
	l.shadow_enabled = false
	if flicker:
		l.set_meta("base_energy", energy)
		l.set_meta("phase", rng.randf() * 10.0)
		lights.append(l)
	add_child(l)
	return l

# ------------------------------------------------------------------ partículas de ambiente

var ambient_fx: Node3D

func _build_ambient_fx() -> void:
	if Game.settings.get("quality", "medium") == "low":
		return
	ambient_fx = Node3D.new()
	ambient_fx.name = "Ambiente"
	add_child(ambient_fx)
	match ambient:
		"dusk":
			ambient_fx.add_child(AmbientFx.fireflies())
		"forest":
			ambient_fx.add_child(AmbientFx.leaves())
		"crypt":
			ambient_fx.add_child(AmbientFx.dust())

## El ambiente sigue al punto del suelo que mira la cámara.
func _follow_camera_fx() -> void:
	if ambient_fx == null:
		return
	var cam := get_viewport().get_camera_3d()
	if cam == null:
		return
	var o := cam.global_position
	var f := -cam.global_transform.basis.z
	if f.y > -0.05:
		return
	var t := -o.y / f.y
	ambient_fx.position = o + f * t

# ------------------------------------------------------------------ hierba aplastada en combate

## En combate la hierba se aplasta un poco para que se vean bien las casillas.
func flatten_cover(on: bool) -> void:
	var tw := create_tween()
	tw.tween_method(ModelLibrary.set_cover_squash, 0.45 if not on else 1.0, 0.45 if on else 1.0, 0.6)

func _process(delta: float) -> void:
	_follow_camera_fx()
	var t := Time.get_ticks_msec() / 1000.0
	for l in lights:
		var base: float = l.get_meta("base_energy")
		var ph: float = l.get_meta("phase")
		l.light_energy = base * (0.85 + 0.12 * sin(t * 7.3 + ph) + 0.06 * sin(t * 13.1 + ph * 2.0))

# ================================================================== suelo

func _tile_kind(c: Vector2i) -> int:
	var ch := map.tile(c)
	match ch:
		",": return KIND.forest if ambient == "forest" else KIND.grass
		".": return KIND.dirt
		":": return KIND.road
		"~": return KIND.mud
		"=", "#", "P": return KIND.stone
		"x": return KIND.rubble if ambient == "crypt" else KIND.dirt
		"b": return KIND.brush
		"H", "B": return KIND.dirt
		"w": return KIND.mud
		"T": return KIND.forest if ambient == "forest" else KIND.grass
		"r", "c", "f", "S", "g":
			return KIND.stone if ambient == "crypt" else (KIND.forest if ambient == "forest" else KIND.grass)
		" ": return KIND.void
	return KIND.grass

const GK := {"grass": 0, "dirt": 1, "path": 2, "paved": 3, "mud": 4}

## Tipo de suelo de una casilla para el mapa de mezcla: -1 vacío, 0 hierba, 1 tierra,
## 2 senda, 3 empedrado, 4 barro.
func _ground_kind(c: Vector2i) -> int:
	if not map.in_bounds(c):
		if ambient == "crypt":
			return -1
		# El camino sigue fuera del tablero por los lados (salidas)
		if c.y >= 0 and c.y < map.height:
			var edge := Vector2i(clampi(c.x, 0, map.width - 1), c.y)
			var ek := _ground_kind_in(edge)
			if ek in [1, 2]:
				return ek
		return 0
	return _ground_kind_in(c)

## Para las clases hijas: lo que se coloca antes de cerrar los lotes.
func _build_extra() -> void:
	pass

func _ground_kind_in(c: Vector2i) -> int:
	if cell_ground.has(c):
		return int(GK.get(cell_ground[c], 0))
	var ch := map.tile(c)
	if ground_override.has(ch):
		return int(GK.get(ground_override[ch], 0))
	var crypt := ambient == "crypt"
	match ch:
		".": return 1
		":": return 2
		"=", "P", "S": return 3
		"#": return -1 if crypt else 3
		"~", "w": return 4
		"x": return 3 if crypt else 1
		"H", "B": return 1
		"g": return 3 if crypt else 0
		"o", "O", "c", "r", "f":
			# Lo que hay debajo de un objeto: lo más común alrededor
			var votes := {}
			for n in BattleMap.neighbors(c):
				if map.in_bounds(n) and not map.tile(n) in ["o", "O", "c", "r", "f"]:
					var k := _ground_kind_in(n)
					votes[k] = int(votes.get(k, 0)) + 1
			var best := 3 if crypt else 0
			var bv := 0
			for k in votes.keys():
				if int(votes[k]) > bv:
					bv = votes[k]
					best = k
			return best
	return 3 if crypt else 0

## Mapa de mezcla del suelo (2 píxeles por unidad, con 4 muestras por píxel) y máscara del agua.
func _build_splat() -> void:
	var m := float(margin)
	var x0 := -m - 1.0
	var z0 := -m * BattleMap.ROW_H - 1.0
	var ppu := 2.0
	var iw := int(ceil((float(map.width) + 2.0 * m + 2.5) * ppu))
	var ih := int(ceil((float(map.height + 2 * margin) * BattleMap.ROW_H + 2.5) * ppu))
	var img := Image.create(iw, ih, false, Image.FORMAT_RGBA8)
	var wimg := Image.create(iw, ih, false, Image.FORMAT_L8)
	var cache := {}
	var subs := [Vector2(0.25, 0.25), Vector2(0.75, 0.25), Vector2(0.25, 0.75), Vector2(0.75, 0.75)]
	var any_water := false
	for py in ih:
		for px in iw:
			var acc := Color(0, 0, 0, 0)
			var wat := 0.0
			for sv: Vector2 in subs:
				var c := BattleMap.cell_at(Vector2(x0 + (px + sv.x) / ppu, z0 + (py + sv.y) / ppu))
				var k: int = cache.get(c, -99)
				if k == -99:
					k = _ground_kind(c)
					cache[c] = k
				match k:
					1: acc.r += 0.25
					2: acc.g += 0.25
					3: acc.b += 0.25
					4: acc.a += 0.25
				if map.in_bounds(c) and map.tile(c) == "w":
					wat += 0.25
			img.set_pixel(px, py, acc)
			if wat > 0.0:
				any_water = true
				wimg.set_pixel(px, py, Color(wat, wat, wat))
	splat_rect = Rect2(x0, z0, iw / ppu, ih / ppu)
	ground_mat.set_shader_parameter("splat", ImageTexture.create_from_image(img))
	ground_mat.set_shader_parameter("splat_rect", Vector4(splat_rect.position.x, splat_rect.position.y, splat_rect.size.x, splat_rect.size.y))
	if any_water:
		water_mask = ImageTexture.create_from_image(wimg)

const NOISE_TEX := preload("res://assets/textures/ground/noise.png")
const COBBLE_TEX := preload("res://assets/textures/ground/cobble.png")

func _build_ground() -> void:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var m := margin
	for y in range(-m, map.height + m):
		for x in range(-m, map.width + m):
			var c := Vector2i(x, y)
			var inside := map.in_bounds(c)
			var dout: int = max(max(-x, x - (map.width - 1)), max(-y, y - (map.height - 1)))
			var col := Color(0.0, 1.0 if inside else 0.0, clamp(dout / 3.0, 0.0, 1.0))
			_add_hex(st, c, 0.0, col)
	var mesh := st.commit()
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.name = "Ground"
	ground_mat = ShaderMaterial.new()
	ground_mat.shader = GROUND_SHADER
	ground_mat.set_shader_parameter("noise_tex", NOISE_TEX)
	ground_mat.set_shader_parameter("paved_tex", COBBLE_TEX)
	if ambient == "crypt":
		ground_mat.set_shader_parameter("base_mode", 2)
		ground_mat.set_shader_parameter("grid_alpha", 0.28)
		ground_mat.set_shader_parameter("grid_color", Color(0.0, 0.0, 0.0))
		ground_mat.set_shader_parameter("paved_tint", Color(0.62, 0.62, 0.70))
		ground_mat.set_shader_parameter("paved_scale", 0.55)
	elif ambient == "forest":
		ground_mat.set_shader_parameter("base_mode", 1)
		ground_mat.set_shader_parameter("grid_alpha", 0.2)
		ground_mat.set_shader_parameter("road_a", Color(0.42, 0.35, 0.24))
		ground_mat.set_shader_parameter("road_b", Color(0.52, 0.44, 0.31))
	else:
		ground_mat.set_shader_parameter("paved_tint", Color(0.84, 0.8, 0.76))
	_build_splat()
	mi.material_override = ground_mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)

func set_grid_alpha(a: float) -> void:
	if ground_mat:
		ground_mat.set_shader_parameter("grid_alpha", a)

func _build_water() -> void:
	var cells: Array = []
	for y in map.height:
		for x in map.width:
			if map.tile(Vector2i(x, y)) in ["~", "w"]:
				cells.append(Vector2i(x, y))
	if cells.is_empty() or water_mask == null:
		return
	var r := cells_world_rect(cells).grow(1.0)
	var mi := MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = r.size
	pm.subdivide_width = 0
	pm.subdivide_depth = 0
	mi.mesh = pm
	mi.position = Vector3(r.get_center().x, 0.04, r.get_center().y)
	var mat := ShaderMaterial.new()
	mat.shader = WATER_SHADER
	mat.set_shader_parameter("mask", water_mask)
	mat.set_shader_parameter("mask_rect", Vector4(splat_rect.position.x, splat_rect.position.y, splat_rect.size.x, splat_rect.size.y))
	mat.set_shader_parameter("noise_tex", NOISE_TEX)
	mi.material_override = mat
	mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(mi)
	# Juncos en las orillas y nenúfares en el agua honda
	for c in cells:
		if map.tile(c) == "~":
			if rng.randf() < 0.55:
				_place("reeds", c, rng.randf_range(0, 360), rng.randf_range(0.8, 1.2), Vector2(rng.randf_range(-0.3, 0.3), rng.randf_range(-0.3, 0.3)))
		elif rng.randf() < 0.12:
			_place("waterlily", c, rng.randf_range(0, 360), rng.randf_range(0.8, 1.1), Vector2(rng.randf_range(-0.25, 0.25), rng.randf_range(-0.25, 0.25)))

# ================================================================== obstáculos

const TALL_PROPS := ["tree", "tree_b", "trees_cluster", "trees_cluster_a", "trees_med", "dead_tree",
	"pine_1", "pine_2", "pine_3", "pine_4", "pine_5", "oak_1", "oak_2", "oak_3", "oak_4", "oak_5",
	"deadtree_1", "deadtree_2", "deadtree_3", "twisted"]
## Props numerosos que se dibujan en lote (MultiMesh, por zonas de CHUNK unidades para que
## solo se dibuje lo que cabe en pantalla): mucho más ligero en el móvil.
const BATCHED := ["tree", "tree_b", "trees_cluster", "trees_cluster_a", "trees_med", "dead_tree",
	"rock_a", "rock_b", "rock_c", "rock_d", "rock_e", "waterplant", "waterlily", "reeds",
	"pine_1", "pine_2", "pine_3", "pine_4", "pine_5", "oak_1", "oak_2", "oak_3", "oak_4", "oak_5",
	"deadtree_1", "deadtree_2", "deadtree_3", "twisted",
	"gpatch", "gpatch_0", "gpatch_1", "gpatch_2", "gpatch_3", "grass_s", "grass_t", "grass_ws", "grass_wt", "clover", "clover_b", "flowers_a", "flowers_b", "flower_a", "flower_b",
	"fern", "plant_1", "plant_7", "plant_7b", "bush_q", "bush_qf", "mushroom", "mushroom_shelf",
	"pebble_1", "pebble_2", "pebble_3", "pebble_4", "stepstone_1", "stepstone_2", "stepstone_3",
	"rock_m1", "rock_m2", "rock_m3", "cabbage", "carrots", "wheat_patch", "pumpkin"]
const CHUNK := 16.0
var tall_props: Array = []         ## árboles que se aclaran si tapan a las figuras: {key, ch, i, xf, pos, h}
var _faded: Dictionary = {}
var _batches: Dictionary = {}      ## key -> {zona (Vector2i) -> Array[Transform3D]}
var _mm: Dictionary = {}           ## key -> {zona -> Array de {mm: MultiMesh, part}}

func _place(key: String, cell: Vector2i, rot_deg: float = 0.0, scl: float = 1.0, offset := Vector2.ZERO) -> Node3D:
	if key in BATCHED:
		var xf := Transform3D(Basis(Vector3.UP, deg_to_rad(rot_deg)).scaled(Vector3.ONE * scl), cell_center(cell) + Vector3(offset.x, 0, offset.y))
		_batch(key, xf, map.in_bounds(cell))
		return null
	var p := ModelLibrary.make_prop(key)
	p.position = cell_center(cell) + Vector3(offset.x, 0, offset.y)
	p.rotation_degrees.y = rot_deg
	p.scale = Vector3.ONE * scl
	add_child(p)
	return p

## Añade una copia al lote de su zona. Los árboles del tablero se apuntan para poder aclararlos.
func _batch(key: String, xf: Transform3D, can_fade := true) -> void:
	var cs := CHUNK * 1.5 if key in TALL_PROPS else CHUNK
	var ch := Vector2i(floori(xf.origin.x / cs), floori(xf.origin.z / cs))
	if not _batches.has(key):
		_batches[key] = {}
	var per: Dictionary = _batches[key]
	if not per.has(ch):
		per[ch] = []
	per[ch].append(xf)
	if key in TALL_PROPS and can_fade:
		var hdef := float(ModelLibrary.PROPS.get(key, {}).get("height", 2.6))
		var hh := hdef * xf.basis.get_scale().y
		tall_props.append({"key": key, "ch": ch, "i": per[ch].size() - 1, "xf": xf, "pos": xf.origin, "h": hh,
			"r": hh * ModelLibrary.prop_spread(key) * 0.85})

## Crea los MultiMesh de todo lo colocado en lote. La cubierta del suelo (sin sombra) se deja
## de dibujar a cierta distancia de la cámara.
func _flush_batches() -> void:
	for key in _batches.keys():
		var parts: Array = ModelLibrary.prop_parts(key)
		var per: Dictionary = _batches[key]
		var by_chunk := {}
		for ch in per.keys():
			var xfs: Array = per[ch]
			var list: Array = []
			for part in parts:
				var mm := MultiMesh.new()
				mm.transform_format = MultiMesh.TRANSFORM_3D
				mm.mesh = part.mesh
				mm.instance_count = xfs.size()
				for i in xfs.size():
					mm.set_instance_transform(i, (xfs[i] as Transform3D) * (part.xform as Transform3D))
				var mmi := MultiMeshInstance3D.new()
				mmi.multimesh = mm
				if part.mat != null:
					mmi.material_override = part.mat
				if not part.get("shadow", true):
					mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
					mmi.visibility_range_end = 34.0
				add_child(mmi)
				list.append({"mm": mm, "part": part})
			by_chunk[ch] = list
		_mm[key] = by_chunk
	_batches.clear()

## Aclara los árboles que tapan a las figuras en pantalla (como en los clásicos).
func update_occlusion(cam: Camera3D, targets: Array) -> void:
	var want := {}
	var right := cam.global_transform.basis.x
	var cpos := cam.global_position
	for t in targets:
		var tp: Vector3 = t
		if cam.is_position_behind(tp):
			continue
		var ts := cam.unproject_position(tp)
		var tdist := cpos.distance_to(tp)
		for e: Dictionary in tall_props:
			var pos: Vector3 = e.pos
			if absf(pos.x - tp.x) > 7.0 or absf(pos.z - tp.z) > 7.0:
				continue
			if cpos.distance_to(pos + Vector3(0, 1.0, 0)) >= tdist:
				continue
			var h: float = e.h
			var base := cam.unproject_position(pos + Vector3(0, 0.3, 0))
			var top := cam.unproject_position(pos + Vector3(0, h, 0))
			var mid := pos + Vector3(0, h * 0.5, 0)
			var half := cam.unproject_position(mid + right * float(e.r)).distance_to(cam.unproject_position(mid))
			var r := Rect2(Vector2(min(base.x, top.x) - half, min(base.y, top.y)), Vector2(absf(base.x - top.x) + half * 2.0, absf(base.y - top.y)))
			if r.grow(18.0).has_point(ts):
				want[e] = true
	for e in _faded.keys():
		if not want.has(e):
			_set_fade(e, 0.0)
			_faded.erase(e)
	for e in want.keys():
		if not _faded.has(e):
			_set_fade(e, 0.72)
			_faded[e] = true

## Aclara un árbol: se quita del lote y se pone una copia con materiales translúcidos
## (vale en todos los renderizadores).
func _set_fade(e: Dictionary, a: float) -> void:
	var key: String = e.key
	var i: int = e.i
	var lots: Array = _mm.get(key, {}).get(e.ch, [])
	if a <= 0.0:
		for b in lots:
			(b.mm as MultiMesh).set_instance_transform(i, (e.xf as Transform3D) * (b.part.xform as Transform3D))
		if e.has("node") and is_instance_valid(e.node):
			e.node.queue_free()
		e.erase("node")
		return
	for b in lots:
		(b.mm as MultiMesh).set_instance_transform(i, Transform3D(Basis().scaled(Vector3.ONE * 0.0001), e.xf.origin))
	var n := ModelLibrary.make_prop(key)
	n.transform = e.xf
	add_child(n)
	e["node"] = n
	for mi in n.find_children("*", "MeshInstance3D", true, false):
		var m := mi as MeshInstance3D
		for si in m.mesh.get_surface_count():
			var src: Material = m.get_active_material(si)
			if src != null:
				var fm := ModelLibrary.fade_material(src, 1.0 - a)
				if fm != null:
					m.set_surface_override_material(si, fm)

func _build_obstacles() -> void:
	var done := {}
	var wall_cells: Array = []
	var fence_cells: Array = []
	for y in map.height:
		for x in map.width:
			var c := Vector2i(x, y)
			if done.has(c):
				continue
			var ch := map.tile(c)
			match ch:
				"H":
					var rect := _flood_rect(c, "H", done)
					_place_building(rect)
				"S":
					var rect2 := _flood_rect(c, "S", done)
					_place_statue(rect2)
				"T":
					if ambient == "crypt":
						_place("dead_tree", c, rng.randf_range(0, 360), rng.randf_range(0.8, 1.0))
					else:
						_place(_tree_key(), c, rng.randf_range(0, 360), rng.randf_range(0.85, 1.15), Vector2(rng.randf_range(-0.12, 0.12), rng.randf_range(-0.12, 0.12)))
				"r":
					var rk: String = ["rock_m1", "rock_m2", "rock_m3"][rng.randi() % 3]
					_place(rk, c, rng.randf_range(0, 360), rng.randf_range(0.8, 1.0))
					for i in rng.randi_range(1, 3):
						_place(["pebble_1", "pebble_3"][rng.randi() % 2], c, rng.randf_range(0, 360), rng.randf_range(0.8, 1.3), Vector2(rng.randf_range(-0.5, 0.5), rng.randf_range(-0.5, 0.5)))
				"c":
					var opts := ["crate", "barrel", "crate_b"]
					if ambient == "crypt":
						opts = ["barrel_d", "chest"]
					_place(opts[rng.randi() % opts.size()], c, rng.randf_range(-20, 20) + 90 * (rng.randi() % 4), 1.0)
					if rng.randf() < 0.6 and ambient != "crypt":
						_place(["barrel", "sack", "crate"][rng.randi() % 3], c, rng.randf_range(0, 360), 0.7, Vector2(rng.randf_range(-0.28, 0.28), rng.randf_range(-0.28, 0.28)))
				"f":
					fence_cells.append(c)
				"P":
					_place("pillar_deco" if rng.randf() < 0.5 else "pillar", c, 90 * (rng.randi() % 4), 1.0)
				"g":
					if ambient == "crypt":
						var horiz := map.tile(c + Vector2i(1, 0)) == "g" or rng.randf() < 0.5
						_place("coffin", c, 90.0 if horiz else 0.0, 1.0)
					else:
						_place("gravestone", c, rng.randf_range(-10, 10), 1.0)
				"x":
					_place("rubble", c, rng.randf_range(0, 360), rng.randf_range(0.6, 0.85))
					if rng.randf() < 0.5 and ambient == "crypt":
						_place(["skull", "bones", "ribcage"][rng.randi() % 3], c, rng.randf_range(0, 360), 1.0, Vector2(rng.randf_range(-0.3, 0.3), rng.randf_range(-0.3, 0.3)))
				"b":
					_place_bush(c)
				"#":
					wall_cells.append(c)
	if wall_cells.size() > 0:
		if ambient == "crypt":
			var dw := DungeonWalls.new()
			dw.name = "Muros"
			add_child(dw)
			dw.build(self, map, rng.randi(), wall_height)
		else:
			_build_walls(wall_cells)
	if fence_cells.size() > 0:
		_build_fences(fence_cells)

func _flood_rect(start: Vector2i, ch: String, done: Dictionary) -> Rect2:
	var cells: Array = []
	var minx := start.x
	var maxx := start.x
	var miny := start.y
	var maxy := start.y
	var stack := [start]
	while stack.size() > 0:
		var c: Vector2i = stack.pop_back()
		if done.has(c) or map.tile(c) != ch:
			continue
		done[c] = true
		minx = min(minx, c.x)
		maxx = max(maxx, c.x)
		miny = min(miny, c.y)
		maxy = max(maxy, c.y)
		for n in BattleMap.neighbors(c):
			stack.append(n)
		cells.append(c)
	return cells_world_rect(cells)

func _place_building(rect: Rect2) -> void:
	var keys := ["house_a", "house_b", "house_c", "house_d", "tavern"]
	var pieces := 1
	var horizontal := rect.size.x >= rect.size.y
	var long_side: int = max(rect.size.x, rect.size.y)
	var short_side: int = min(rect.size.x, rect.size.y)
	if long_side >= short_side * 2 and long_side >= 4:
		pieces = 2
	for i in pieces:
		var sub := Vector2(rect.size)
		var origin := Vector2(rect.position)
		if pieces == 2:
			if horizontal:
				sub.x /= 2.0
				origin.x += sub.x * i
			else:
				sub.y /= 2.0
				origin.y += sub.y * i
		var center := origin + sub * 0.5
		var key: String = keys[rng.randi() % keys.size()]
		var p := ModelLibrary.make_prop(key)
		var fit: float = min(sub.x, sub.y) * 1.05
		var def_fit: float = ModelLibrary.PROPS[key].fit
		p.scale = Vector3.ONE * (fit / def_fit)
		p.position = Vector3(center.x, 0, center.y)
		p.rotation_degrees.y = 90.0 * (rng.randi() % 4) + 30.0
		add_child(p)
		# Luz de ventana cálida al atardecer
		if ambient == "dusk" and rng.randf() < 0.7:
			add_light(Vector3(center.x, 0.9, center.y + sub.y * 0.55), Color(1.0, 0.62, 0.3), 1.1, 3.0)

func _place_statue(rect: Rect2) -> void:
	var center := Vector2(rect.position) + Vector2(rect.size) * 0.5
	statue_center = Vector3(center.x, 0, center.y)
	# Pedestal
	var ped := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(rect.size.x * 0.95, 0.35, rect.size.y * 0.95)
	ped.mesh = box
	statue_mat = ShaderMaterial.new()
	statue_mat.shader = GRANITE_SHADER
	statue_mat.set_shader_parameter("crack_amount", 1.0)
	statue_mat.set_shader_parameter("crack_glow", 1.4)
	var ped_mat := ShaderMaterial.new()
	ped_mat.shader = GRANITE_SHADER
	ped_mat.set_shader_parameter("base", Color(0.42, 0.40, 0.38))
	ped.material_override = ped_mat
	ped.position = Vector3(center.x, 0.175, center.y)
	add_child(ped)
	# El toro de granito de los Durn
	var bull: Node3D = ModelLibrary.scene(ModelLibrary.CREATURE_SCENES.bull).instantiate()
	var aabb := ModelLibrary._local_aabb(bull)
	var s = (rect.size.x * 0.95) / max(aabb.size.z, aabb.size.x)
	bull.scale = Vector3.ONE * s
	bull.position = Vector3(center.x, 0.35, center.y)
	bull.rotation_degrees.y = 90
	add_child(bull)
	for mi in bull.find_children("*", "MeshInstance3D", true, false):
		mi.material_override = statue_mat
	var ap: AnimationPlayer = bull.find_child("AnimationPlayer", true, false)
	if ap:
		ap.play("Idle_Headlow")
		ap.seek(0.4, true)
		ap.pause()
	add_light(Vector3(center.x, 1.4, center.y), Color(0.9, 0.12, 0.08), 0.9, 3.5)

## Cercas: tramos entre casillas de cerca vecinas, en cualquiera de las 3 direcciones del
## hexágono. Si tres cercas se tocan entre sí se quita un lado del triángulo.
var fence_along_z: bool:
	get:
		return str(ModelLibrary.PROPS.get(fence_key, {}).get("axis", "x")) == "z"

func _build_fences(cells: Array) -> void:
	var edges: Array = []
	var deg := {}
	for c in cells:
		for n in BattleMap.neighbors(c):
			if map.tile(n) == "f" and (n.y > c.y or (n.y == c.y and n.x > c.x)):
				edges.append([c, n])
				deg[c] = deg.get(c, 0) + 1
				deg[n] = deg.get(n, 0) + 1
	var removed := {}
	for e in edges:
		var a: Vector2i = e[0]
		var b: Vector2i = e[1]
		for m in BattleMap.neighbors(a):
			if m != b and map.tile(m) == "f" and m in BattleMap.neighbors(b):
				# Triángulo a-b-m: se quita el lado con más conexiones
				var key := "%s|%s" % [a, b]
				if int(deg[a]) + int(deg[b]) >= int(deg.get(m, 0)) + max(int(deg[a]), int(deg[b])) and not removed.has(key):
					removed[key] = true
					deg[a] -= 1
					deg[b] -= 1
				break
	var linked := {}
	for e in edges:
		var a2: Vector2i = e[0]
		var b2: Vector2i = e[1]
		if removed.has("%s|%s" % [a2, b2]):
			continue
		linked[a2] = true
		linked[b2] = true
		var o := cell_center(a2)
		var d := cell_center(b2) - o
		var f := ModelLibrary.make_prop(fence_key)
		f.position = o + d * 0.5
		f.rotation.y = atan2(d.x, d.z) + (0.0 if fence_along_z else PI * 0.5)
		add_child(f)
	for c2 in cells:
		if not linked.has(c2):
			_place(fence_key, c2, 90.0 if fence_along_z else 0.0, 1.0)

## Árbol para una casilla de bosque según el ambiente: pinos en el bosque, robles y pinos en la aldea.
func _tree_key() -> String:
	var r := rng.randf()
	# En calidad baja, árboles sencillos (sin hojas recortadas, mucho más baratos en el móvil)
	if Game.settings.get("quality", "medium") == "low":
		return "tree" if r < 0.5 else "tree_b"
	if ambient == "forest":
		if r < 0.05:
			return ["deadtree_1", "deadtree_2"][rng.randi() % 2]
		return ["pine_1", "pine_2", "pine_5", "pine_5"][rng.randi() % 4]
	if r < 0.55:
		return ["oak_3", "oak_4", "oak_5"][rng.randi() % 3]
	return ["pine_2", "pine_5"][rng.randi() % 2]

func _place_bush(c: Vector2i) -> void:
	var k := "bush_qf" if ambient == "dusk" and rng.randf() < 0.35 else "bush_q"
	_place(k, c, rng.randf_range(0, 360), rng.randf_range(0.85, 1.2), Vector2(rng.randf_range(-0.15, 0.15), rng.randf_range(-0.15, 0.15)))
	if rng.randf() < 0.6:
		_place("bush_q", c, rng.randf_range(0, 360), rng.randf_range(0.55, 0.75), Vector2(rng.randf_range(-0.4, 0.4), rng.randf_range(-0.4, 0.4)))

func _build_walls(cells: Array) -> void:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	var box := CylinderMesh.new()
	var h := wall_height
	box.top_radius = BattleMap.HEX_R * 1.02
	box.bottom_radius = BattleMap.HEX_R * 1.02
	box.height = h
	box.radial_segments = 6
	box.rings = 1
	mm.mesh = box
	var visible_cells: Array = []
	for c in cells:
		var near_floor := false
		for n in BattleMap.neighbors8(c):
			if map.walkable(n):
				near_floor = true
				break
		if near_floor:
			visible_cells.append(c)
	mm.instance_count = visible_cells.size()
	for i in visible_cells.size():
		var c: Vector2i = visible_cells[i]
		var hh := h + rng.randf_range(-0.05, 0.12)
		var xf := Transform3D(Basis(Vector3.UP, deg_to_rad(30.0)).scaled(Vector3(1.0, hh / h, 1.0)), cell_center(c) + Vector3(0, hh * 0.5, 0))
		mm.set_instance_transform(i, xf)
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	var mat := ShaderMaterial.new()
	mat.shader = GRANITE_SHADER
	mat.set_shader_parameter("base", Color(0.36, 0.35, 0.36))
	mat.set_shader_parameter("dark", Color(0.16, 0.15, 0.17))
	mat.set_shader_parameter("light", Color(0.55, 0.53, 0.52))
	mat.set_shader_parameter("scale", 5.0)
	mmi.material_override = mat
	add_child(mmi)
	# Antorchas en los muros que dan a la sala
	var placed := 0
	for c in visible_cells:
		var inward := Vector3.ZERO
		for n in BattleMap.neighbors(c):
			if map.walkable(n):
				inward = (cell_center(n) - cell_center(c)).normalized()
				break
		if inward == Vector3.ZERO:
			continue
		if (c.x + c.y * 3) % 5 == 0 and placed < 10:
			placed += 1
			var t := ModelLibrary.make_prop("torch_wall")
			var pos := cell_center(c) + inward * 0.45 + Vector3(0, min(0.85, wall_height - 0.2), 0)
			t.position = pos
			t.rotation.y = atan2(inward.x, inward.z)
			add_child(t)
			add_light(pos + inward * 0.3 + Vector3(0, 0.25, 0), Color(1.0, 0.55, 0.22), 1.6, 4.5)

# ================================================================== alrededores

func _build_surroundings() -> void:
	if ambient == "crypt":
		_crypt_dressing()
		return
	var w := map.width
	var h := map.height
	for y in range(-margin, h + margin):
		for x in range(-margin, w + margin):
			var c := Vector2i(x, y)
			if map.in_bounds(c):
				continue
			var dx: int = max(-x, x - (w - 1), 0)
			var dy: int = max(-y, y - (h - 1), 0)
			var d: int = max(dx, dy)
			if d < 2:
				continue
			# No tapar la continuación del camino
			var edge := Vector2i(clamp(x, 0, w - 1), clamp(y, 0, h - 1))
			if map.tile(edge) == ":" and y == edge.y:
				continue
			var chance := 0.05 + d * 0.035
			if ambient == "forest":
				chance = 0.2 + d * 0.05
			if rng.randf() < chance:
				if ambient == "dusk" and d >= 3 and rng.randf() < 0.18 and (y < -2 or y > h + 1):
					_place(["house_a", "house_b", "house_c", "house_d"][rng.randi() % 4], c, rng.randf_range(0, 360), 1.0)
				else:
					var k := _tree_key()
					var sc := rng.randf_range(0.9, 1.3)
					if d > 6:
						k = ["trees_cluster", "tree"][rng.randi() % 2]
						sc = rng.randf_range(1.1, 1.5)
					_place(k, c, rng.randf_range(0, 360), sc, Vector2(rng.randf_range(-0.3, 0.3), rng.randf_range(-0.3, 0.3)))
	# La sierra al fondo
	for i in 6:
		var ang := -0.6 + i * 0.28
		var dist := float(max(w, h)) + 14.0
		var pos := board_center() + Vector3(cos(ang + PI * 1.5) * dist, 0, sin(ang + PI * 1.5) * dist)
		var key := "mountain" if i % 2 == 0 else "mountain_b"
		var p := ModelLibrary.make_prop(key)
		p.position = pos
		p.scale = Vector3.ONE * rng.randf_range(1.2, 1.8)
		p.rotation_degrees.y = rng.randf_range(0, 360)
		add_child(p)

# ================================================================== cubierta del suelo

const COVER_MEADOW := [["gpatch", 84], ["clover", 6], ["flowers_a", 4], ["flower_b", 5]]
const COVER_FOREST := [["gpatch", 36], ["gpatch_3", 8], ["fern", 22], ["plant_1", 8], ["clover", 6], ["mushroom", 3], ["pebble_1", 4]]
const COVER_EDGE := [["gpatch_3", 55], ["gpatch", 38], ["flower_b", 5]]

func _pick(table: Array) -> String:
	var total := 0
	for e in table:
		total += int(e[1])
	var r := rng.randi() % total
	for e in table:
		r -= int(e[1])
		if r < 0:
			return e[0]
	return table[0][0]

## Hierba, flores, helechos y piedrecillas por las casillas libres (y un poco más allá del
## tablero). La densidad depende de la calidad gráfica.
func _build_ground_cover() -> void:
	if ambient == "crypt":
		return
	var q: String = Game.settings.get("quality", "medium")
	var dens := 0.5 if q == "low" else (1.0 if q == "medium" else 1.35)
	var table := COVER_FOREST if ambient == "forest" else COVER_MEADOW
	var ext := 6
	for y in range(-ext, map.height + ext):
		for x in range(-ext, map.width + ext):
			var c := Vector2i(x, y)
			var inside := map.in_bounds(c)
			var k := _ground_kind(c)
			var ch := map.tile(c) if inside else ("," if k == 0 else ":")
			if cell_ground.has(c):
				continue
			var n := 0.0
			var tab := table
			match ch:
				",":
					n = 1.4
					# Hierba alta en el borde de caminos y tierra
					if inside:
						for nb in BattleMap.neighbors(c):
							if map.in_bounds(nb) and _ground_kind_in(nb) in [1, 2]:
								n += 0.6
								tab = COVER_EDGE
								break
				"T":
					n = 0.7
				"b":
					n = 0.6
				"~":
					n = 1.0
					tab = COVER_EDGE
				":", ".":
					if k in [1, 2]:
						if rng.randf() < 0.14:
							_place(["pebble_1", "pebble_3"][rng.randi() % 2], c, rng.randf_range(0, 360), rng.randf_range(0.9, 1.4), Vector2(rng.randf_range(-0.4, 0.4), rng.randf_range(-0.4, 0.4)))
					continue
				_:
					continue
			if not inside:
				var dx: int = max(-x, x - (map.width - 1), 0)
				var dy: int = max(-y, y - (map.height - 1), 0)
				n *= clampf(1.0 - (max(dx, dy) - 1) / float(ext), 0.15, 1.0)
			n *= dens
			var cnt := int(n) + (1 if rng.randf() < n - int(n) else 0)
			for i in cnt:
				var key := _pick(tab)
				var a := rng.randf() * TAU
				var rr := sqrt(rng.randf()) * 0.48
				_place(key, c, rng.randf_range(0, 360), rng.randf_range(0.8, 1.25), Vector2(cos(a) * rr, sin(a) * rr))

func _crypt_dressing() -> void:
	# Velas y huesos por la sala, un altar en el estrado
	for y in map.height:
		for x in map.width:
			var c := Vector2i(x, y)
			if map.tile(c) == "=" and rng.randf() < 0.05:
				_place(["skull", "bones", "candles"][rng.randi() % 3], c, rng.randf_range(0, 360), 1.0, Vector2(rng.randf_range(-0.35, 0.35), rng.randf_range(-0.35, 0.35)))

# ================================================================== resaltados

func _make_layer(layer: String) -> void:
	var mmi := MultiMeshInstance3D.new()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = hex_mesh(0.96)
	mm.instance_count = 0
	mmi.multimesh = mm
	var mat := ShaderMaterial.new()
	mat.shader = HIGHLIGHT_SHADER
	if layer in ["target", "focus"]:
		mat.set_shader_parameter("pulse", 1.0)
	mmi.material_override = mat
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var heights := {"move": 0.02, "dash": 0.021, "area": 0.03, "target": 0.035, "path": 0.04, "focus": 0.045}
	mmi.position.y = heights.get(layer, 0.02)
	mmi.name = "HL_" + layer
	add_child(mmi)
	highlight_layers[layer] = mmi

## cells: Dictionary celda -> Color
func set_highlight(layer: String, cells: Dictionary) -> void:
	var mmi: MultiMeshInstance3D = highlight_layers.get(layer)
	if mmi == null:
		return
	var mm := mmi.multimesh
	mm.instance_count = cells.size()
	var i := 0
	for c in cells.keys():
		mm.set_instance_transform(i, Transform3D(Basis(), cell_center(c)))
		mm.set_instance_color(i, cells[c])
		i += 1

func clear_highlights(except: Array = []) -> void:
	for k in highlight_layers.keys():
		if not k in except:
			set_highlight(k, {})

# ================================================================== zonas de conjuro

var zone_nodes: Dictionary = {}   ## id -> Node3D

func _zone_mat(color: Color, alpha: float, emission := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_color = Color(color.r, color.g, color.b, alpha)
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	if emission > 0.0:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = emission
	return m

## Muestra (o actualiza) una zona persistente: niebla, oscuridad, telaraña, espinas...
func show_zone(id: int, kind: String, cells: Array, color: Color) -> void:
	hide_zone(id, false)
	var root := Node3D.new()
	root.name = "Zone_%d" % id
	add_child(root)
	zone_nodes[id] = root
	var zr := RandomNumberGenerator.new()
	zr.seed = id * 7919
	# Mancha de suelo
	var mmi := MultiMeshInstance3D.new()
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.mesh = hex_mesh(1.0)
	mm.instance_count = cells.size()
	for i in cells.size():
		mm.set_instance_transform(i, Transform3D(Basis(), cell_center(cells[i]) + Vector3(0, 0.025, 0)))
	mmi.multimesh = mm
	var ground_a := 0.42
	if kind in ["fog"]:
		ground_a = 0.25
	elif kind == "darkness":
		ground_a = 0.85
	mmi.material_override = _zone_mat(color, ground_a, 0.6 if kind == "moonbeam" else 0.0)
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	root.add_child(mmi)
	var center := Vector3.ZERO
	for c in cells:
		center += cell_center(c)
	if cells.size() > 0:
		center /= cells.size()
	match kind:
		"fog", "darkness":
			var sm := SphereMesh.new()
			sm.radius = 0.85
			sm.height = 1.4
			sm.radial_segments = 10
			sm.rings = 6
			var a := 0.32 if kind == "fog" else 0.82
			var col := Color(0.86, 0.88, 0.92) if kind == "fog" else Color(0.03, 0.02, 0.05)
			var mat := _zone_mat(col, a)
			for c in cells:
				if zr.randf() < 0.75:
					var s := MeshInstance3D.new()
					s.mesh = sm
					s.material_override = mat
					s.position = cell_center(c) + Vector3(zr.randf_range(-0.2, 0.2), zr.randf_range(0.4, 0.8), zr.randf_range(-0.2, 0.2))
					s.scale = Vector3.ONE * zr.randf_range(0.8, 1.25)
					s.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
					root.add_child(s)
		"moonbeam":
			var cyl := MeshInstance3D.new()
			var cm := CylinderMesh.new()
			cm.top_radius = 1.0
			cm.bottom_radius = 1.0
			cm.height = 6.0
			cyl.mesh = cm
			cyl.material_override = _zone_mat(Color(0.85, 0.9, 1.0), 0.22, 1.5)
			cyl.position = center + Vector3(0, 3.0, 0)
			cyl.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			root.add_child(cyl)
			var l := OmniLight3D.new()
			l.light_color = Color(0.8, 0.88, 1.0)
			l.light_energy = 2.0
			l.omni_range = 3.5
			l.position = center + Vector3(0, 1.2, 0)
			root.add_child(l)
		"web":
			var wm := _zone_mat(Color(0.95, 0.95, 0.92), 0.55)
			for c in cells:
				for k in 2:
					var strand := MeshInstance3D.new()
					var bm := BoxMesh.new()
					bm.size = Vector3(1.3, 0.012, 0.012)
					strand.mesh = bm
					strand.material_override = wm
					strand.position = cell_center(c) + Vector3(0, zr.randf_range(0.15, 0.9), 0)
					strand.rotation = Vector3(zr.randf_range(-0.4, 0.4), zr.randf_range(0, PI), zr.randf_range(-0.3, 0.3))
					root.add_child(strand)
		"spike", "entangle":
			var cone := CylinderMesh.new()
			cone.top_radius = 0.0
			cone.bottom_radius = 0.05 if kind == "spike" else 0.035
			cone.height = 0.42 if kind == "spike" else 0.45
			cone.radial_segments = 5
			var cmat := StandardMaterial3D.new()
			cmat.albedo_color = Color(0.42, 0.33, 0.18) if kind == "spike" else Color(0.25, 0.48, 0.18)
			for c in cells:
				for k in (7 if kind == "spike" else 5):
					var sp := MeshInstance3D.new()
					sp.mesh = cone
					sp.material_override = cmat
					sp.position = cell_center(c) + Vector3(zr.randf_range(-0.4, 0.4), cone.height * 0.5, zr.randf_range(-0.4, 0.4))
					sp.rotation = Vector3(zr.randf_range(-0.35, 0.35), 0, zr.randf_range(-0.35, 0.35))
					root.add_child(sp)
		"grease":
			# Charcos brillantes de grasa
			var gm := StandardMaterial3D.new()
			gm.albedo_color = Color(0.28, 0.22, 0.1, 0.85)
			gm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			gm.roughness = 0.08
			gm.metallic = 0.3
			gm.metallic_specular = 1.0
			var disc := CylinderMesh.new()
			disc.top_radius = 0.42
			disc.bottom_radius = 0.42
			disc.height = 0.02
			disc.radial_segments = 12
			for c in cells:
				for k in 2:
					var pd := MeshInstance3D.new()
					pd.mesh = disc
					pd.material_override = gm
					pd.position = cell_center(c) + Vector3(zr.randf_range(-0.2, 0.2), 0.035, zr.randf_range(-0.2, 0.2))
					pd.scale = Vector3(zr.randf_range(0.7, 1.15), 1, zr.randf_range(0.6, 1.0))
					pd.rotation.y = zr.randf_range(0, PI)
					pd.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
					root.add_child(pd)
	root.scale = Vector3(1, 0.05, 1)
	var tw := root.create_tween()
	tw.tween_property(root, "scale", Vector3.ONE, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

func hide_zone(id: int, animate := true) -> void:
	var n: Node3D = zone_nodes.get(id)
	if n == null:
		return
	zone_nodes.erase(id)
	if not animate:
		n.queue_free()
		return
	var tw := n.create_tween()
	tw.tween_property(n, "scale", Vector3(1, 0.02, 1), 0.3)
	tw.tween_callback(n.queue_free)
