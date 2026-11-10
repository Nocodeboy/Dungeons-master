class_name MenuBackdrop
extends Node3D
## Diorama 3D detrás del menú: el toro de granito agrietado en el prado, al anochecer,
## con los cuatro compañeros a su alrededor. La cámara gira despacio.

var world: BattleWorld
var camera: Camera3D
var _center := Vector3.ZERO
var _angle := PI / 2
var _t := 0.0
var _models: Array = []

## Posiciones (relativas al toro): el grupo, en fila junto a la cerca, mirando a la cámara.
const SPOTS := [Vector2(3.4, 0.7), Vector2(4.0, 1.75), Vector2(3.8, -0.35), Vector2(4.3, -1.35)]
const CAM_DIST := 10.5
const CAM_HEIGHT := 3.3

func _ready() -> void:
	var battle := BattleSetup.build("e1_prado", 3, Game.current_party())
	world = BattleWorld.new()
	add_child(world)
	world.build(battle.map, "dusk", 11)
	world.set_grid_alpha(0.0)
	_center = world.statue_center if world.statue_center != Vector3.INF else world.board_center()
	var idx := 0
	for c in battle.creatures:
		if not c.is_pc or idx >= SPOTS.size():
			continue
		var m := ModelLibrary.make_creature_model(c)
		add_child(m)
		var off: Vector2 = SPOTS[idx]
		idx += 1
		m.position = _center + Vector3(off.x, 0, off.y)
		var cam_mid := _center + Vector3(CAM_DIST, 0, 0)
		var to := (cam_mid - m.position).normalized().lerp((_center - m.position).normalized(), 0.25)
		m.rotation.y = atan2(to.x, to.z)
		var inst: Node3D = m.get_child(0)
		var ap: AnimationPlayer = inst.find_child("AnimationPlayer", true, false)
		if ap:
			var an := ModelLibrary.anim_name(inst.get_meta("family", "kaykit"), "idle", ap)
			if an != "":
				var a := ap.get_animation(an)
				if a:
					a.loop_mode = Animation.LOOP_LINEAR
				ap.play(an)
				ap.seek(randf() * 1.5, true)
		_models.append(m)
	# Antorcha junto al toro para dar calidez
	world.add_light(_center + Vector3(4.6, 1.3, 2.6), Color(1.0, 0.6, 0.28), 1.8, 5.0)
	camera = Camera3D.new()
	camera.fov = 40
	camera.near = 0.2
	camera.far = 200
	add_child(camera)
	camera.current = true
	_update_camera()

func _process(delta: float) -> void:
	_t += delta
	_angle = PI / 2 + sin(_t * 0.06) * 0.32
	_update_camera()

func _update_camera() -> void:
	var p := _center + Vector3(sin(_angle) * CAM_DIST, CAM_HEIGHT, cos(_angle) * CAM_DIST)
	camera.look_at_from_position(p, _center + Vector3(1.6, 0.8, 0))
	# Desplaza el encuadre para que el toro y el grupo queden a la derecha, junto al menú
	camera.h_offset = -2.4
