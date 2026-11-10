class_name Portraits
extends Node
## Retratos generados en tiempo real a partir de los modelos 3D (cabeza y hombros).

static var cache: Dictionary = {}

var _vp: SubViewport
var _cam: Camera3D
var _stage: Node3D

func _ready() -> void:
	_vp = SubViewport.new()
	_vp.size = Vector2i(192, 192)
	_vp.own_world_3d = true
	_vp.transparent_bg = true
	_vp.render_target_update_mode = SubViewport.UPDATE_DISABLED
	add_child(_vp)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.75, 0.72, 0.7)
	e.ambient_light_energy = 0.75
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.environment = e
	_vp.add_child(env)
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-25, 35, 0)
	key.light_energy = 1.25
	key.light_color = Color(1.0, 0.9, 0.78)
	_vp.add_child(key)
	var rim := DirectionalLight3D.new()
	rim.rotation_degrees = Vector3(-10, 200, 0)
	rim.light_energy = 0.8
	rim.light_color = Color(0.6, 0.7, 1.0)
	_vp.add_child(rim)
	_stage = Node3D.new()
	_vp.add_child(_stage)
	_cam = Camera3D.new()
	_cam.fov = 30
	_vp.add_child(_cam)
	_cam.current = true

static func key_for(c: Creature) -> String:
	# En forma salvaje se sigue mostrando su propio retrato
	var vis: Dictionary = c.visual
	if not c.form.is_empty() and c._form_backup.has("visual"):
		vis = c._form_backup.visual
	# Los héroes creados cambian de aspecto: la clave incluye su apariencia
	if vis.get("hero", false):
		return "%s_%d" % [c.template_id, hash(vis)]
	return c.template_id

## Genera (si hace falta) los retratos de una lista de criaturas.
func render_all(creatures: Array) -> void:
	for c in creatures:
		var k := key_for(c)
		if cache.has(k):
			continue
		cache[k] = await _render(c)

func _render(c: Creature) -> Texture2D:
	for ch in _stage.get_children():
		ch.free()
	var model := ModelLibrary.make_creature_model(c)
	_stage.add_child(model)
	var inst: Node3D = model.get_child(0)
	var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
	var fam: String = inst.get_meta("family", "kaykit")
	if ap:
		var an := ModelLibrary.anim_name(fam, "idle", ap)
		if an != "":
			ap.play(an)
			ap.seek(0.3, true)
			ap.pause()
	# Encuadre: cabeza y hombros según la familia del modelo
	var head_y := 0.95
	var dist := 1.15
	var side := 0.0
	match fam:
		"quat_animal":
			head_y = 0.55
			dist = 1.3
			side = 0.35
		"quat_monster":
			head_y = 0.8
			dist = 1.25
	if c.visual.get("hero", false):
		var sp: Dictionary = RulesDB.species.get(c.species, {}).get("visual", {})
		var sc := float(sp.get("scale", 1.0))
		if c.size == "small" and sc > 0.85:
			sc = 0.8
		head_y *= sc
		dist *= lerp(1.0, sc, 0.5)
	elif c.size == "small" and fam == "kaykit":
		head_y *= 0.88
	var look := Vector3(0, head_y, side)
	_cam.look_at_from_position(Vector3(0.38, head_y + 0.08, dist + side), look)
	model.rotation.y = deg_to_rad(10)
	_vp.render_target_update_mode = SubViewport.UPDATE_ONCE
	await RenderingServer.frame_post_draw
	await RenderingServer.frame_post_draw
	var img := _vp.get_texture().get_image()
	var tex := ImageTexture.create_from_image(img)
	return tex

static func get_portrait(c: Creature) -> Texture2D:
	return cache.get(key_for(c), null)
