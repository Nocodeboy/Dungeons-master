class_name AmbientFx
extends Object
## Partículas de ambiente baratas (CPUParticles3D): luciérnagas al atardecer, hojas que caen en
## el bosque, polvo en la cripta y humo de chimeneas.

static var _soft_tex: GradientTexture2D

## Mancha redonda y suave para las partículas.
static func soft_texture() -> GradientTexture2D:
	if _soft_tex == null:
		var g := Gradient.new()
		g.set_color(0, Color(1, 1, 1, 1))
		g.set_color(1, Color(1, 1, 1, 0))
		g.add_point(0.45, Color(1, 1, 1, 0.55))
		_soft_tex = GradientTexture2D.new()
		_soft_tex.gradient = g
		_soft_tex.fill = GradientTexture2D.FILL_RADIAL
		_soft_tex.fill_from = Vector2(0.5, 0.5)
		_soft_tex.fill_to = Vector2(1.0, 0.5)
		_soft_tex.width = 32
		_soft_tex.height = 32
	return _soft_tex

static func _billboard_mat(col: Color, emissive: float, unshaded := true) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = soft_texture()
	m.albedo_color = col
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.billboard_mode = BaseMaterial3D.BILLBOARD_PARTICLES
	m.vertex_color_use_as_albedo = true
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED if unshaded else BaseMaterial3D.SHADING_MODE_PER_PIXEL
	if emissive > 0.0:
		m.emission_enabled = true
		m.emission = col
		m.emission_energy_multiplier = emissive
	m.disable_receive_shadows = true
	return m

static func _quad(size: float, mat: Material) -> QuadMesh:
	var q := QuadMesh.new()
	q.size = Vector2(size, size)
	q.material = mat
	return q

static func _ramp(points: Array) -> Gradient:
	var g := Gradient.new()
	g.offsets = PackedFloat32Array(points.map(func(p): return float(p[0])))
	g.colors = PackedColorArray(points.map(func(p): return p[1]))
	return g

static func _base(amount: int, lifetime: float, extents: Vector3) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = amount
	p.lifetime = lifetime
	p.preprocess = lifetime
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = extents
	p.local_coords = false
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.visibility_aabb = AABB(-extents - Vector3(2, 2, 2), extents * 2.0 + Vector3(4, 4, 4))
	return p

## Luciérnagas que parpadean sobre la hierba.
static func fireflies(amount := 36) -> CPUParticles3D:
	var p := _base(amount, 5.0, Vector3(9, 0.6, 9))
	p.mesh = _quad(0.07, _billboard_mat(Color(1.0, 0.9, 0.45), 3.0))
	p.direction = Vector3(0, 1, 0)
	p.spread = 180.0
	p.gravity = Vector3.ZERO
	p.initial_velocity_min = 0.05
	p.initial_velocity_max = 0.2
	p.damping_min = 0.0
	p.damping_max = 0.05
	p.color_ramp = _ramp([[0.0, Color(1, 1, 1, 0)], [0.15, Color(1, 1, 1, 1)], [0.3, Color(1, 1, 1, 0.2)],
		[0.5, Color(1, 1, 1, 0.9)], [0.75, Color(1, 1, 1, 0.1)], [1.0, Color(1, 1, 1, 0)]])
	p.position.y = 0.9
	return p

## Hojas que caen despacio y giran.
static func leaves(amount := 28) -> CPUParticles3D:
	var p := _base(amount, 7.0, Vector3(9, 0.5, 9))
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(1, 1, 1)
	m.vertex_color_use_as_albedo = true
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	m.disable_receive_shadows = true
	var q := QuadMesh.new()
	q.size = Vector2(0.07, 0.045)
	q.material = m
	p.mesh = q
	p.position.y = 3.2
	p.direction = Vector3(0.3, -1, 0.1)
	p.spread = 25.0
	p.gravity = Vector3(0.15, -0.25, 0.05)
	p.initial_velocity_min = 0.05
	p.initial_velocity_max = 0.15
	p.angular_velocity_min = -120.0
	p.angular_velocity_max = 120.0
	p.particle_flag_rotate_y = true
	p.angle_min = 0.0
	p.angle_max = 360.0
	p.color_initial_ramp = _ramp([[0.0, Color(0.55, 0.62, 0.22)], [0.5, Color(0.72, 0.6, 0.25)], [1.0, Color(0.6, 0.4, 0.18)]])
	p.color_ramp = _ramp([[0.0, Color(1, 1, 1, 0)], [0.1, Color(1, 1, 1, 1)], [0.85, Color(1, 1, 1, 1)], [1.0, Color(1, 1, 1, 0)]])
	return p

## Motas de polvo flotando en el aire quieto de la cripta.
static func dust(amount := 40) -> CPUParticles3D:
	var p := _base(amount, 8.0, Vector3(8, 0.9, 8))
	p.mesh = _quad(0.035, _billboard_mat(Color(0.75, 0.78, 0.9, 0.6), 0.6))
	p.position.y = 1.0
	p.direction = Vector3(0, 1, 0)
	p.spread = 180.0
	p.gravity = Vector3(0, 0.01, 0)
	p.initial_velocity_min = 0.01
	p.initial_velocity_max = 0.06
	p.color_ramp = _ramp([[0.0, Color(1, 1, 1, 0)], [0.3, Color(1, 1, 1, 0.8)], [0.7, Color(1, 1, 1, 0.8)], [1.0, Color(1, 1, 1, 0)]])
	return p

## Humo de chimenea: bocanadas grises que suben, crecen y se deshacen.
static func smoke() -> CPUParticles3D:
	var p := CPUParticles3D.new()
	p.amount = 12
	p.lifetime = 4.5
	p.preprocess = 4.5
	p.local_coords = false
	p.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	p.mesh = _quad(0.42, _billboard_mat(Color(0.78, 0.76, 0.74, 0.7), 0.0, true))
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.05
	p.direction = Vector3(0, 1, 0)
	p.spread = 12.0
	p.gravity = Vector3(0.12, 0.05, 0.04)
	p.initial_velocity_min = 0.22
	p.initial_velocity_max = 0.34
	p.angle_min = 0.0
	p.angle_max = 360.0
	var sc := Curve.new()
	sc.add_point(Vector2(0, 0.35))
	sc.add_point(Vector2(1, 1.6))
	p.scale_amount_curve = sc
	p.color_ramp = _ramp([[0.0, Color(1, 1, 1, 0)], [0.12, Color(1, 1, 1, 0.75)], [1.0, Color(1, 1, 1, 0)]])
	p.visibility_aabb = AABB(Vector3(-2, -1, -2), Vector3(4, 5, 4))
	return p
