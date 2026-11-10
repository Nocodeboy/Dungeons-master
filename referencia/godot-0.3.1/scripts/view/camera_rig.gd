class_name CameraRig
extends Node3D
## Cámara isométrica: arrastrar para desplazar, pellizcar para acercar, girar con dos dedos.

signal tapped(screen_pos: Vector2)
signal long_pressed(screen_pos: Vector2)

var camera: Camera3D
var yaw := deg_to_rad(215.0)
var pitch := deg_to_rad(54.0)
var distance := 14.0
var min_dist := 7.0
var max_dist := 26.0
var target := Vector3.ZERO
var bounds := Rect2(0, 0, 20, 12)
var input_enabled := true

var _touches: Dictionary = {}       ## índice -> posición
var _drag_start := Vector2.ZERO
var _drag_moved := false
var _press_time := 0
var _pinch_dist := 0.0
var _twist_angle := 0.0
var _goal_target := Vector3.ZERO
var _goal_yaw := 0.0
var _goal_dist := 14.0
var _long_press_fired := false
const TAP_SLOP := 14.0
const LONG_PRESS_MS := 550

func _ready() -> void:
	camera = Camera3D.new()
	camera.fov = 38.0
	camera.near = 0.2
	camera.far = 200.0
	add_child(camera)
	camera.current = true
	_goal_target = target
	_goal_yaw = yaw
	_goal_dist = distance
	_apply()

func setup(board_w: float, board_h: float) -> void:
	bounds = Rect2(-1, -1, board_w + 2, board_h + 2)
	target = Vector3(board_w * 0.5, 0, board_h * 0.5)
	_goal_target = target
	var fit: float = max(board_w, board_h * 1.6)
	distance = clamp(fit * 0.9, min_dist, max_dist)
	_goal_dist = distance
	_apply()

func focus_on(p: Vector3, dist := -1.0) -> void:
	_goal_target = Vector3(p.x, 0, p.z)
	if dist > 0:
		_goal_dist = clamp(dist, min_dist, max_dist)

func rotate_step(dir: int) -> void:
	_goal_yaw += dir * PI / 2.0

func zoom_by(f: float) -> void:
	_goal_dist = clamp(_goal_dist * f, min_dist, max_dist)

func _process(delta: float) -> void:
	var k: float = 1.0 - exp(-delta * 8.0)
	target = target.lerp(_goal_target, k)
	yaw = lerp_angle(yaw, _goal_yaw, k)
	distance = lerp(distance, _goal_dist, k)
	# Pulsación larga
	if _touches.size() == 1 and not _drag_moved and not _long_press_fired and _press_time > 0:
		if Time.get_ticks_msec() - _press_time > LONG_PRESS_MS:
			_long_press_fired = true
			long_pressed.emit(_drag_start)
	_apply()

func _apply() -> void:
	var off := Vector3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)) * distance
	camera.position = target + off
	camera.look_at(target, Vector3.UP)

func _clamp_goal() -> void:
	_goal_target.x = clamp(_goal_target.x, bounds.position.x, bounds.end.x)
	_goal_target.z = clamp(_goal_target.z, bounds.position.y, bounds.end.y)

## Procesa la entrada de cámara. Devuelve true si la ha consumido.
func handle_input(event: InputEvent) -> bool:
	if not input_enabled:
		return false
	if event is InputEventScreenTouch:
		var st := event as InputEventScreenTouch
		if st.pressed:
			_touches[st.index] = st.position
			if _touches.size() == 1:
				_drag_start = st.position
				_drag_moved = false
				_long_press_fired = false
				_press_time = Time.get_ticks_msec()
			elif _touches.size() == 2:
				_drag_moved = true
				var pts: Array = _touches.values()
				_pinch_dist = (pts[0] as Vector2).distance_to(pts[1])
				_twist_angle = ((pts[1] as Vector2) - (pts[0] as Vector2)).angle()
		else:
			var was_single := _touches.size() == 1
			_touches.erase(st.index)
			if was_single and not _drag_moved and not _long_press_fired:
				tapped.emit(st.position)
			if _touches.is_empty():
				_press_time = 0
		return true
	if event is InputEventScreenDrag:
		var sd := event as InputEventScreenDrag
		_touches[sd.index] = sd.position
		if _touches.size() == 1:
			if not _drag_moved and sd.position.distance_to(_drag_start) > TAP_SLOP:
				_drag_moved = true
			if _drag_moved:
				_pan(sd.relative)
		elif _touches.size() >= 2:
			var pts2: Array = _touches.values()
			var a: Vector2 = pts2[0]
			var b: Vector2 = pts2[1]
			var d := a.distance_to(b)
			if _pinch_dist > 0:
				_goal_dist = clamp(_goal_dist * (_pinch_dist / max(1.0, d)), min_dist, max_dist)
			_pinch_dist = d
			var ang := (b - a).angle()
			_goal_yaw -= wrapf(ang - _twist_angle, -PI, PI)
			_twist_angle = ang
		return true
	# Ratón (escritorio y pruebas)
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_WHEEL_UP and mb.pressed:
			zoom_by(0.9)
			return true
		if mb.button_index == MOUSE_BUTTON_WHEEL_DOWN and mb.pressed:
			zoom_by(1.1)
			return true
	if event is InputEventMouseMotion:
		var mm := event as InputEventMouseMotion
		if mm.button_mask & MOUSE_BUTTON_MASK_RIGHT:
			_goal_yaw -= mm.relative.x * 0.008
			return true
		if mm.button_mask & MOUSE_BUTTON_MASK_MIDDLE:
			_pan(mm.relative)
			return true
	return false

func _pan(rel: Vector2) -> void:
	var scale_f := distance / 700.0
	var right := Vector3(cos(yaw), 0, -sin(yaw))
	var fwd := Vector3(-sin(yaw), 0, -cos(yaw))
	_goal_target -= right * rel.x * scale_f
	_goal_target -= fwd * rel.y * scale_f * -1.0
	_clamp_goal()
	target = _goal_target

## Rayo desde la pantalla al plano del suelo (y = 0).
func ground_point(screen_pos: Vector2) -> Variant:
	var from := camera.project_ray_origin(screen_pos)
	var dir := camera.project_ray_normal(screen_pos)
	if abs(dir.y) < 0.0001:
		return null
	var t := -from.y / dir.y
	if t < 0:
		return null
	return from + dir * t

func screen_of(p: Vector3) -> Vector2:
	return camera.unproject_position(p)

func is_behind(p: Vector3) -> bool:
	return camera.is_position_behind(p)
