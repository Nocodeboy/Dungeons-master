class_name HeroPreview
extends SubViewportContainer
## Vista 3D de un héroe sobre un pedestal. Se gira arrastrando con el dedo o el ratón.

var _vp: SubViewport
var _stage: Node3D
var _pivot: Node3D
var _cam: Camera3D
var _model: Node3D
var _dragging := false
var _spin := 0.0          ## velocidad de giro residual tras soltar
var _idle_turn := true
var _visual_key := 0

func _init() -> void:
	stretch = true
	mouse_filter = Control.MOUSE_FILTER_STOP
	_vp = SubViewport.new()
	_vp.own_world_3d = true
	_vp.transparent_bg = true
	_vp.msaa_3d = Viewport.MSAA_2X
	_vp.render_target_update_mode = SubViewport.UPDATE_WHEN_VISIBLE
	add_child(_vp)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color(0.72, 0.68, 0.66)
	e.ambient_light_energy = 0.55
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.environment = e
	_vp.add_child(env)
	var key := DirectionalLight3D.new()
	key.rotation_degrees = Vector3(-35, 30, 0)
	key.light_energy = 1.0
	key.light_color = Color(1.0, 0.9, 0.78)
	key.shadow_enabled = true
	_vp.add_child(key)
	var rim := DirectionalLight3D.new()
	rim.rotation_degrees = Vector3(-15, 200, 0)
	rim.light_energy = 0.75
	rim.light_color = Color(0.55, 0.65, 1.0)
	_vp.add_child(rim)
	_stage = Node3D.new()
	_vp.add_child(_stage)
	# Pedestal de piedra con un aro dorado
	var ped := MeshInstance3D.new()
	var cyl := CylinderMesh.new()
	cyl.top_radius = 0.62
	cyl.bottom_radius = 0.7
	cyl.height = 0.16
	cyl.radial_segments = 32
	ped.mesh = cyl
	var stone := StandardMaterial3D.new()
	stone.albedo_color = Color(0.24, 0.21, 0.19)
	stone.roughness = 0.95
	ped.material_override = stone
	ped.position = Vector3(0, -0.08, 0)
	_stage.add_child(ped)
	var ring := MeshInstance3D.new()
	var tor := TorusMesh.new()
	tor.inner_radius = 0.6
	tor.outer_radius = 0.64
	tor.rings = 48
	tor.ring_segments = 6
	ring.mesh = tor
	var gold := StandardMaterial3D.new()
	gold.albedo_color = Color(0.86, 0.7, 0.4)
	gold.metallic = 0.7
	gold.roughness = 0.35
	ring.material_override = gold
	ring.position = Vector3(0, 0.0, 0)
	_stage.add_child(ring)
	_pivot = Node3D.new()
	_stage.add_child(_pivot)
	_cam = Camera3D.new()
	_cam.fov = 30
	_vp.add_child(_cam)
	_cam.look_at_from_position(Vector3(0, 1.05, 4.1), Vector3(0, 0.62, 0))
	_cam.current = true

## Cambia el aspecto. Solo reconstruye el modelo si algo ha cambiado.
func set_visual(v: Dictionary) -> void:
	var k := hash(v)
	if k == _visual_key and _model != null:
		return
	_visual_key = k
	var rot := _pivot.rotation.y
	if _model != null:
		_model.queue_free()
	_model = ModelLibrary.make_hero_model(v)
	_pivot.add_child(_model)
	_pivot.rotation.y = rot
	var inst: Node3D = _model.get_child(0)
	var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
	if ap:
		var an := ModelLibrary.anim_name("kaykit", "idle", ap)
		if an != "":
			ap.play(an)

## Encuadre más cercano (retrato) o de cuerpo entero.
func set_close(close: bool) -> void:
	if close:
		_cam.look_at_from_position(Vector3(0, 1.05, 3.45), Vector3(0, 0.7, 0))
	else:
		_cam.look_at_from_position(Vector3(0, 1.05, 4.1), Vector3(0, 0.62, 0))

func _process(delta: float) -> void:
	if _dragging:
		return
	if abs(_spin) > 0.01:
		_pivot.rotation.y += _spin * delta
		_spin = lerp(_spin, 0.0, clamp(delta * 3.0, 0.0, 1.0))
	elif _idle_turn:
		# Vuelve despacio a mirar de frente
		_pivot.rotation.y = lerp_angle(_pivot.rotation.y, deg_to_rad(-12), clamp(delta * 0.8, 0.0, 1.0))

func _gui_input(ev: InputEvent) -> void:
	# Solo eventos táctiles: el proyecto emula toques con el ratón (evita girar el doble)
	if ev is InputEventScreenTouch:
		_dragging = ev.pressed
		accept_event()
	elif ev is InputEventScreenDrag:
		_pivot.rotation.y += ev.relative.x * 0.012
		_spin = ev.relative.x * 0.6
		accept_event()
