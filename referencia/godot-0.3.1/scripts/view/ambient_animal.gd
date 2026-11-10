class_name AmbientAnimal
extends Node3D
## Animal de ambiente (ovejas, vacas, cerdos, caballos, perros…): pace, mira alrededor y, si
## sabe andar, da algún paseo corto sin salir de su zona. No ocupa casillas ni entra en combate.

const KINDS := {
	"sheep": {"path": "res://assets/models/farm/Sheep.fbx", "scale": 0.13, "idle": ["Armature|Idle"]},
	"pig": {"path": "res://assets/models/farm/Pig.fbx", "scale": 0.12, "idle": ["Armature|Idle"]},
	"cow": {"path": "res://assets/models/creatures/Cow.gltf", "scale": 0.22, "idle": ["Idle", "Eating", "Idle_Headlow", "Eating", "Idle_2"], "walk": "Walk"},
	"donkey": {"path": "res://assets/models/creatures/Donkey.gltf", "scale": 0.21, "idle": ["Idle", "Eating", "Idle_Headlow", "Idle_2"], "walk": "Walk"},
	"horse": {"path": "res://assets/models/creatures/Horse.gltf", "scale": 0.27, "idle": ["Idle", "Eating", "Idle_Headlow", "Idle_2"], "walk": "Walk"},
	"dog": {"path": "res://assets/models/creatures/ShibaInu.gltf", "scale": 0.19, "idle": ["Idle", "Idle_2", "Idle_2_HeadLow", "Idle"], "walk": "Walk"},
	"deer": {"path": "res://assets/models/creatures/Deer.gltf", "scale": 0.26, "idle": ["Idle", "Eating", "Idle_2", "Idle_Headlow"], "walk": "Walk"},
}

var kind := "sheep"
var home := Vector3.ZERO
var radius := 1.2
var speed := 0.3
var model: Node3D
var ap: AnimationPlayer
var rng := RandomNumberGenerator.new()
var _state := "idle"
var _timer := 0.0
var _target := Vector3.ZERO
var _def: Dictionary = {}

func setup(p_kind: String, pos: Vector3, rot_deg: float, p_radius: float, seed_value: int) -> void:
	kind = p_kind
	_def = KINDS.get(kind, KINDS.sheep)
	home = pos
	position = pos
	radius = p_radius
	rotation_degrees.y = rot_deg
	rng.seed = seed_value
	model = ModelLibrary.scene(_def.path).instantiate()
	model.scale = Vector3.ONE * float(_def.scale)
	add_child(model)
	ap = model.find_child("AnimationPlayer", true, false)
	if ap:
		for a in ap.get_animation_list():
			var anim := ap.get_animation(a)
			if anim:
				anim.loop_mode = Animation.LOOP_LINEAR
	_idle()
	_timer = rng.randf_range(0.5, 5.0)
	if ap:
		ap.seek(rng.randf_range(0.0, 2.0), true)

func _play(n: String, speed_scale := 1.0) -> void:
	if ap and ap.has_animation(n):
		ap.play(n, 0.3, speed_scale)

func _idle() -> void:
	_state = "idle"
	var opts: Array = _def.get("idle", ["Idle"])
	_play(opts[rng.randi() % opts.size()], rng.randf_range(0.85, 1.1))
	_timer = rng.randf_range(3.0, 9.0)

func _process(delta: float) -> void:
	_timer -= delta
	if _state == "walk":
		var to := _target - position
		to.y = 0
		if to.length() < 0.05 or _timer <= 0.0:
			_idle()
			return
		var dir := to.normalized()
		rotation.y = lerp_angle(rotation.y, atan2(dir.x, dir.z), minf(1.0, delta * 4.0))
		position += dir * speed * delta
		return
	if _timer > 0.0:
		return
	if _def.has("walk") and radius > 0.1 and rng.randf() < 0.45:
		var a := rng.randf() * TAU
		_target = home + Vector3(cos(a), 0, sin(a)) * rng.randf_range(0.2, radius)
		_state = "walk"
		_timer = 8.0
		_play(_def.walk, 0.8)
	else:
		_idle()
		if rng.randf() < 0.3:
			var tw := create_tween()
			tw.tween_property(self, "rotation:y", rotation.y + rng.randf_range(-1.2, 1.2), 1.4).set_trans(Tween.TRANS_SINE)

## Se aleja trotando de un peligro y se queda pastando allí.
func flee(from: Vector3) -> void:
	if not _def.has("walk"):
		return
	var away := position - from
	away.y = 0
	if away.length() < 0.01:
		away = Vector3(1, 0, 0)
	_target = position + away.normalized() * 7.0
	home = _target
	radius = 0.8
	_state = "walk"
	_timer = 12.0
	speed = 1.4
	_play("Gallop" if ap and ap.has_animation("Gallop") else str(_def.walk), 1.0)
	var tw := create_tween()
	tw.tween_interval(6.0)
	tw.tween_callback(func(): speed = 0.3)
