class_name FX
extends Node3D
## Efectos visuales: números flotantes, proyectiles, estallidos y áreas.

var tokens: Dictionary = {}   ## invocaciones visibles (arma espiritual, esfera llameante)

const STYLE_COLORS := {
	"fire": Color(1.0, 0.5, 0.15), "fire_cone": Color(1.0, 0.5, 0.15), "frost": Color(0.55, 0.85, 1.0),
	"radiant": Color(1.0, 0.92, 0.55), "missile": Color(0.75, 0.55, 1.0), "necrotic": Color(0.45, 0.9, 0.55),
	"force": Color(0.85, 0.85, 1.0), "psychic": Color(1.0, 0.5, 0.85), "poison": Color(0.6, 0.95, 0.25),
	"acid": Color(0.75, 1.0, 0.2), "thunder": Color(0.75, 0.8, 1.0), "lightning": Color(0.7, 0.95, 1.0),
	"nature": Color(0.45, 0.9, 0.35), "charm": Color(1.0, 0.6, 0.9), "curse": Color(0.65, 0.3, 0.85),
	"arcane": Color(0.7, 0.5, 1.0), "eldritch": Color(0.8, 0.35, 1.0), "buff": Color(1.0, 0.9, 0.55),
	"heal": Color(0.5, 1.0, 0.55), "wind": Color(0.92, 0.95, 1.0), "web": Color(0.95, 0.95, 0.9),
	"fog": Color(0.85, 0.88, 0.92), "darkness": Color(0.15, 0.1, 0.2), "moon": Color(0.85, 0.9, 1.0),
	"color": Color(1.0, 0.8, 1.0), "faerie": Color(0.75, 0.55, 1.0), "grease": Color(0.6, 0.5, 0.25),
	"shatter": Color(0.85, 0.75, 1.0), "sleep": Color(0.6, 0.5, 1.0), "command": Color(0.85, 0.7, 1.0),
	"mark": Color(0.85, 1.0, 0.4),
}

static func style_color(style: String) -> Color:
	return STYLE_COLORS.get(style, Color(0.85, 0.85, 1.0))

func _glow_mat(color: Color, energy := 2.5) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = color
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = energy
	return m

func _alpha_mat(color: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.albedo_color = color
	m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m

# ------------------------------------------------------------------ textos flotantes

func float_text(pos: Vector3, text: String, color: Color, scale_f := 1.0, rise := 0.9, dur := 1.25) -> void:
	var l := Label3D.new()
	l.text = text
	l.font = UI.FONT_BOLD
	l.font_size = int(64 * scale_f)
	l.pixel_size = 0.005
	l.outline_size = 14
	l.outline_modulate = Color(0, 0, 0, 0.9)
	l.modulate = color
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.no_depth_test = true
	l.render_priority = 5
	l.position = pos + Vector3(randf_range(-0.12, 0.12), 0, randf_range(-0.12, 0.12))
	add_child(l)
	l.scale = Vector3.ONE * 0.4
	var tw := create_tween()
	tw.set_parallel(true)
	tw.tween_property(l, "scale", Vector3.ONE, 0.18).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_property(l, "position:y", pos.y + rise, dur).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_property(l, "modulate:a", 0.0, dur * 0.4).set_delay(dur * 0.6)
	tw.chain().tween_callback(l.queue_free)

func dice_text(pos: Vector3, text: String, good: bool) -> void:
	float_text(pos + Vector3(0, 0.25, 0), text, Color(0.95, 0.9, 0.75) if good else Color(0.78, 0.75, 0.70), 0.72, 0.5, 1.8)

# ------------------------------------------------------------------ proyectiles

func projectile(from: Vector3, to: Vector3, style: String, speed := 14.0) -> void:
	var node := Node3D.new()
	add_child(node)
	var color := Color(1, 1, 1)
	match style:
		"arrow", "bolt", "dagger", "javelin":
			var mi := MeshInstance3D.new()
			var cyl := CylinderMesh.new()
			cyl.top_radius = 0.012
			cyl.bottom_radius = 0.012
			cyl.height = 0.45 if style != "javelin" else 0.75
			mi.mesh = cyl
			var m := StandardMaterial3D.new()
			m.albedo_color = Color(0.5, 0.36, 0.22) if style != "dagger" else Color(0.75, 0.75, 0.8)
			mi.material_override = m
			mi.rotation_degrees.x = 90
			node.add_child(mi)
		"fire":
			color = Color(1.0, 0.5, 0.15)
		"frost":
			color = Color(0.55, 0.85, 1.0)
		"radiant":
			color = Color(1.0, 0.92, 0.55)
		"missile":
			color = Color(0.75, 0.55, 1.0)
		"necrotic":
			color = Color(0.45, 0.9, 0.55)
		_:
			color = style_color(style)
	if not style in ["arrow", "bolt", "dagger", "javelin"]:
		var orb := MeshInstance3D.new()
		var sph := SphereMesh.new()
		sph.radius = 0.09
		sph.height = 0.18
		orb.mesh = sph
		orb.material_override = _glow_mat(color, 3.0)
		node.add_child(orb)
		var trail := CPUParticles3D.new()
		trail.amount = 24
		trail.lifetime = 0.35
		trail.local_coords = false
		trail.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
		trail.emission_sphere_radius = 0.05
		trail.gravity = Vector3.ZERO
		trail.initial_velocity_min = 0.0
		trail.initial_velocity_max = 0.2
		trail.scale_amount_min = 0.5
		trail.scale_amount_max = 1.0
		var pm := SphereMesh.new()
		pm.radius = 0.04
		pm.height = 0.08
		trail.mesh = pm
		trail.material_override = _glow_mat(color, 2.0)
		node.add_child(trail)
		var light := OmniLight3D.new()
		light.light_color = color
		light.light_energy = 1.2
		light.omni_range = 2.2
		node.add_child(light)
	node.position = from
	var dist := from.distance_to(to)
	var dur: float = clamp(dist / speed, 0.12, 0.9)
	var arc := 0.0
	if style in ["arrow", "bolt", "javelin", "dagger"]:
		arc = min(1.2, dist * 0.06)
	var state := [from]
	var tw := create_tween()
	tw.tween_method(func(t: float):
		var p := from.lerp(to, t)
		p.y += sin(t * PI) * arc
		var dir: Vector3 = p - state[0]
		if dir.length() > 0.0005 and abs(dir.normalized().dot(Vector3.UP)) < 0.99:
			node.look_at_from_position(p, p + dir, Vector3.UP)
		else:
			node.position = p
		state[0] = p, 0.0, 1.0, dur)
	await tw.finished
	node.queue_free()

func beam(from: Vector3, to: Vector3, color: Color, dur := 0.35, width := 0.06) -> void:
	var mi := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	var length := from.distance_to(to)
	cyl.top_radius = width
	cyl.bottom_radius = width
	cyl.height = length
	mi.mesh = cyl
	mi.material_override = _glow_mat(color, 4.0)
	add_child(mi)
	mi.position = (from + to) * 0.5
	mi.look_at_from_position(mi.position, to, Vector3.UP if abs((to - from).normalized().dot(Vector3.UP)) < 0.98 else Vector3.RIGHT)
	mi.rotate_object_local(Vector3.RIGHT, PI / 2)
	var tw := create_tween()
	tw.tween_property(mi, "scale", Vector3(0.1, 1, 0.1), dur).set_delay(dur * 0.5)
	tw.tween_callback(mi.queue_free)

# ------------------------------------------------------------------ estallidos

func burst(pos: Vector3, color: Color, amount := 24, speed := 2.0, size := 0.06, lifetime := 0.6, gravity := -2.0) -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 0.9
	p.amount = amount
	p.lifetime = lifetime
	p.position = pos
	p.direction = Vector3.UP
	p.spread = 180.0
	p.initial_velocity_min = speed * 0.5
	p.initial_velocity_max = speed
	p.gravity = Vector3(0, gravity, 0)
	p.scale_amount_min = 0.6
	p.scale_amount_max = 1.2
	var m := SphereMesh.new()
	m.radius = size
	m.height = size * 2
	m.radial_segments = 6
	m.rings = 3
	p.mesh = m
	p.material_override = _glow_mat(color, 2.0)
	add_child(p)
	p.emitting = true
	var tw := create_tween()
	tw.tween_interval(lifetime + 0.5)
	tw.tween_callback(p.queue_free)

func flash_light(pos: Vector3, color: Color, energy := 3.0, rng := 4.0, dur := 0.4) -> void:
	var l := OmniLight3D.new()
	l.position = pos
	l.light_color = color
	l.light_energy = energy
	l.omni_range = rng
	add_child(l)
	var tw := create_tween()
	tw.tween_property(l, "light_energy", 0.0, dur)
	tw.tween_callback(l.queue_free)

func area_flash(cells: Array, color: Color, dur := 0.7, height := 0.08) -> void:
	for c in cells:
		var mi := MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(0.96, 0.96)
		q.orientation = PlaneMesh.FACE_Y
		mi.mesh = q
		var m := _alpha_mat(Color(color.r, color.g, color.b, 0.75))
		m.emission_enabled = true
		m.emission = color
		mi.material_override = m
		mi.position = BattleWorld.cell_center(c) + Vector3(0, height, 0)
		add_child(mi)
		var tw := create_tween()
		tw.tween_property(m, "albedo_color:a", 0.0, dur).set_delay(0.1)
		tw.tween_callback(mi.queue_free)
		if randf() < 0.5:
			burst(mi.position + Vector3(0, 0.2, 0), color, 8, 1.5, 0.05, 0.5, 1.0)

func ring_wave(pos: Vector3, radius: float, color: Color, dur := 0.5) -> void:
	var mi := MeshInstance3D.new()
	var tor := TorusMesh.new()
	tor.inner_radius = 0.85
	tor.outer_radius = 1.0
	mi.mesh = tor
	mi.material_override = _glow_mat(color, 3.0)
	mi.position = pos + Vector3(0, 0.15, 0)
	mi.scale = Vector3(0.2, 0.2, 0.2)
	add_child(mi)
	var tw := create_tween()
	tw.tween_property(mi, "scale", Vector3(radius, 0.5, radius), dur).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(mi, "transparency", 1.0, dur)
	tw.tween_callback(mi.queue_free)

func pillar(pos: Vector3, color: Color, dur := 0.8) -> void:
	var mi := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.28
	cyl.bottom_radius = 0.36
	cyl.height = 2.6
	mi.mesh = cyl
	var m := _alpha_mat(Color(color.r, color.g, color.b, 0.55))
	m.emission_enabled = true
	m.emission = color
	m.emission_energy_multiplier = 3.0
	mi.material_override = m
	mi.position = pos + Vector3(0, 1.3, 0)
	mi.scale = Vector3(0.2, 1, 0.2)
	add_child(mi)
	var tw := create_tween()
	tw.tween_property(mi, "scale", Vector3(1, 1, 1), 0.15)
	tw.tween_property(m, "albedo_color:a", 0.0, dur)
	tw.tween_callback(mi.queue_free)
	flash_light(pos + Vector3(0, 1, 0), color, 3.0, 4.0, dur)

func sparkles(pos: Vector3, color: Color, amount := 18) -> void:
	burst(pos, color, amount, 1.2, 0.04, 1.0, 1.5)

func smoke(pos: Vector3, color := Color(0.4, 0.4, 0.45)) -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 0.8
	p.amount = 16
	p.lifetime = 1.0
	p.position = pos
	p.spread = 180
	p.initial_velocity_min = 0.3
	p.initial_velocity_max = 0.8
	p.gravity = Vector3(0, 0.6, 0)
	p.scale_amount_min = 1.0
	p.scale_amount_max = 2.2
	var m := SphereMesh.new()
	m.radius = 0.1
	m.height = 0.2
	p.mesh = m
	var mat := _alpha_mat(Color(color.r, color.g, color.b, 0.5))
	p.material_override = mat
	add_child(p)
	p.emitting = true
	var tw := create_tween()
	tw.tween_interval(1.6)
	tw.tween_callback(p.queue_free)

# ------------------------------------------------------------------ invocaciones

func spawn_token(id: String, cell: Vector2i, color := Color(0.75, 0.85, 1.0), kind := "spiritual_weapon") -> void:
	if kind == "flaming_sphere":
		_spawn_sphere(id, cell)
		return
	var holder := Node3D.new()
	holder.position = BattleWorld.cell_center(cell) + Vector3(0, 0.9, 0)
	var sword := MeshInstance3D.new()
	var blade := BoxMesh.new()
	blade.size = Vector3(0.08, 0.9, 0.03)
	sword.mesh = blade
	sword.material_override = _glow_mat(color, 2.5)
	holder.add_child(sword)
	var guard := MeshInstance3D.new()
	var g := BoxMesh.new()
	g.size = Vector3(0.32, 0.06, 0.06)
	guard.mesh = g
	guard.position.y = -0.32
	guard.material_override = _glow_mat(color, 2.5)
	holder.add_child(guard)
	var light := OmniLight3D.new()
	light.light_color = color
	light.light_energy = 1.4
	light.omni_range = 2.5
	holder.add_child(light)
	add_child(holder)
	tokens[id] = holder
	sparkles(holder.position, color, 24)
	var tw := holder.create_tween().set_loops()
	tw.tween_property(holder, "position:y", 1.05, 0.9).set_trans(Tween.TRANS_SINE)
	tw.tween_property(holder, "position:y", 0.85, 0.9).set_trans(Tween.TRANS_SINE)
	var tw2 := holder.create_tween().set_loops()
	tw2.tween_property(holder, "rotation:y", TAU, 3.0).as_relative()

func _spawn_sphere(id: String, cell: Vector2i) -> void:
	var holder := Node3D.new()
	holder.position = BattleWorld.cell_center(cell) + Vector3(0, 0.45, 0)
	var orb := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.4
	sm.height = 0.8
	orb.mesh = sm
	orb.material_override = _glow_mat(Color(1.0, 0.45, 0.1), 3.5)
	holder.add_child(orb)
	var fire := CPUParticles3D.new()
	fire.amount = 40
	fire.lifetime = 0.6
	fire.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	fire.emission_sphere_radius = 0.35
	fire.gravity = Vector3(0, 2.0, 0)
	fire.initial_velocity_min = 0.1
	fire.initial_velocity_max = 0.5
	var pm := SphereMesh.new()
	pm.radius = 0.06
	pm.height = 0.12
	fire.mesh = pm
	fire.material_override = _glow_mat(Color(1.0, 0.6, 0.2), 2.5)
	holder.add_child(fire)
	var light := OmniLight3D.new()
	light.light_color = Color(1.0, 0.55, 0.2)
	light.light_energy = 2.5
	light.omni_range = 3.5
	holder.add_child(light)
	add_child(holder)
	tokens[id] = holder
	burst(holder.position, Color(1.0, 0.5, 0.15), 24, 2.0)
	var tw := holder.create_tween().set_loops()
	tw.tween_property(orb, "scale", Vector3.ONE * 1.08, 0.4).set_trans(Tween.TRANS_SINE)
	tw.tween_property(orb, "scale", Vector3.ONE * 0.94, 0.4).set_trans(Tween.TRANS_SINE)

func move_token(id: String, cell: Vector2i) -> void:
	var t: Node3D = tokens.get(id)
	if t == null:
		return
	var tw := create_tween()
	var target := BattleWorld.cell_center(cell)
	tw.tween_property(t, "position:x", target.x, 0.35)
	tw.parallel().tween_property(t, "position:z", target.z, 0.35)
	await tw.finished

func token_strike(id: String, target_pos: Vector3) -> void:
	var t: Node3D = tokens.get(id)
	if t == null:
		return
	var start := t.position
	var tw := create_tween()
	tw.tween_property(t, "position", target_pos + Vector3(0, 0.3, 0), 0.15)
	tw.tween_property(t, "position", start, 0.25)
	await get_tree().create_timer(0.15).timeout

func remove_token(id: String) -> void:
	var t: Node3D = tokens.get(id)
	if t == null:
		return
	tokens.erase(id)
	sparkles(t.position, Color(0.8, 0.85, 1.0), 16)
	t.queue_free()

func token_position(id: String) -> Vector3:
	var t: Node3D = tokens.get(id)
	return t.position if t else Vector3.ZERO
