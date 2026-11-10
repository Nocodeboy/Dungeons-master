class_name UnitView
extends Node3D
## Representación 3D de una criatura: modelo animado, anillo, barra de vida e iconos de estado.

const RING_SHADER := preload("res://assets/shaders/ring.gdshader")
const BAR_SHADER := preload("res://assets/shaders/bar.gdshader")

const STATUS_ICONS := {
	"unconscious": "death", "paralyzed": "hold", "prone": "hold", "frightened": "turn_undead",
	"poisoned": "potion", "invisible": "hide", "incapacitated": "sleep", "blinded": "blind",
	"restrained": "restrained", "charmed": "charm",
}
const EFFECT_ICONS := {
	"giant_strength": "armor_up", "antitoxin": "potion",
	"bless": "bless", "shield_of_faith": "shield_faith", "sanctuary": "sanctuary", "sleep": "sleep",
	"hold_person": "hold", "turned": "turn_undead", "dodge": "dodge", "hidden": "hide", "shield_spell": "shield",
	"guiding_bolt": "guiding", "sapped": "melee", "slowed_weapon": "footsteps", "slowed_frost": "frost",
	"concentration": "magic", "aid": "aid", "mage_armor": "mage_armor", "steady_aim": "steady_aim",
	"rage": "rage", "reckless": "attack", "bardic_inspiration": "bless", "hunters_mark": "target", "hexed": "curse",
	"bane": "curse", "outlined": "faerie", "outlined_shine": "faerie", "heroism": "bless", "blur": "magic",
	"mirror_image": "magic", "barkskin": "shield", "magic_weapon": "melee", "divine_favor": "bless",
	"sacred_weapon": "bless", "innate_sorcery": "magic", "longstrider": "footsteps", "prot_evil": "sanctuary",
	"warding_bond": "shield_faith", "searing": "fire", "acid_dot": "acid", "enfeebled": "curse", "mocked": "psychic",
	"agathys": "frost", "enlarged": "aid", "reduced": "curse", "frosts_chill": "frost",
}
const POSITIVE_ICONS := ["bless", "shield_faith", "sanctuary", "aid", "mage_armor", "shield", "dodge", "hide", "steady_aim", "magic", "rage", "footsteps"]

var creature: Creature
var model: Node3D
var inst: Node3D
var ap: AnimationPlayer
var family: String = "kaykit"
var ring: MeshInstance3D
var ring_mat: ShaderMaterial
var bar: MeshInstance3D
var bar_mat: ShaderMaterial
var name_label: Label3D
var status_root: Node3D
var downed := false
var dead := false
var height := 1.15
var _idle_action := "idle"
var _shown_hp := -1.0
var show_bar := true      ## en la exploración no se ven las barras de vida

func setup(c: Creature) -> void:
	creature = c
	name = c.id
	model = ModelLibrary.make_creature_model(c)
	add_child(model)
	inst = model.get_child(0)
	family = inst.get_meta("family", "kaykit")
	ap = inst.find_child("AnimationPlayer", true, false)
	if family == "quat_animal":
		height = 0.75
	elif family == "quat_monster":
		height = 1.0
	if c.size == "small":
		height *= 0.88
	_setup_loops()
	_make_ring()
	_make_bar()
	_make_label()
	status_root = Node3D.new()
	status_root.position = Vector3(0, height + 0.42, 0)
	add_child(status_root)
	position = BattleWorld.cell_center(c.cell)
	rotation.y = atan2(c.facing.x, c.facing.y)
	play("idle", true)
	refresh()

static var _shadow_mat: StandardMaterial3D

## Figura en sombra (oculta o avanzando con sigilo): una capa oscura y translúcida encima.
func set_shadowed(on: bool) -> void:
	if _shadow_mat == null:
		_shadow_mat = StandardMaterial3D.new()
		_shadow_mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		_shadow_mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_shadow_mat.albedo_color = Color(0.08, 0.1, 0.2, 0.6)
	if model == null:
		return
	for mi in model.find_children("*", "MeshInstance3D", true, false):
		(mi as GeometryInstance3D).material_overlay = _shadow_mat if on else null

## Cambia la criatura que representa (la exploración y el combate usan objetos distintos).
func bind(c: Creature) -> void:
	var old_vis := creature.visual if creature != null else {}
	var old_size := creature.size if creature != null else ""
	creature = c
	if c.visual != old_vis or c.size != old_size:
		rebuild_model()
	dead = c.dead
	downed = c.hp <= 0 and not c.dead
	position = BattleWorld.cell_center(c.cell)
	if name_label:
		name_label.text = c.name
	_shown_hp = -1.0
	refresh()

func _setup_loops() -> void:
	if ap == null:
		return
	for action in ["idle", "combat_idle", "walk", "run"]:
		var an := ModelLibrary.anim_name(family, action, ap)
		if an != "":
			var a := ap.get_animation(an)
			if a:
				a.loop_mode = Animation.LOOP_LINEAR

func _make_ring() -> void:
	ring = MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.95, 0.95)
	q.orientation = PlaneMesh.FACE_Y
	ring.mesh = q
	ring_mat = ShaderMaterial.new()
	ring_mat.shader = RING_SHADER
	ring.material_override = ring_mat
	ring.position.y = 0.04
	ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(ring)
	set_ring("idle")

func _make_bar() -> void:
	bar = MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(0.62, 0.075)
	bar.mesh = q
	bar_mat = ShaderMaterial.new()
	bar_mat.shader = BAR_SHADER
	bar_mat.render_priority = 2
	bar.material_override = bar_mat
	bar.position = Vector3(0, height + 0.2, 0)
	bar.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(bar)

func _make_label() -> void:
	name_label = Label3D.new()
	name_label.text = creature.name
	name_label.font = UI.FONT_BOLD
	name_label.font_size = 40
	name_label.pixel_size = 0.0045
	name_label.outline_size = 10
	name_label.outline_modulate = Color(0, 0, 0, 0.85)
	name_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	name_label.no_depth_test = true
	name_label.render_priority = 3
	name_label.position = Vector3(0, height + 0.34, 0)
	name_label.visible = false
	add_child(name_label)

# ------------------------------------------------------------------ estado visual

func set_ring(state: String) -> void:
	var col := UI.ally_color() if creature.team == 0 else UI.enemy_color()
	var pulse := 0.0
	var a := 0.75
	match state:
		"active":
			col = UI.GOLD
			pulse = 1.0
			a = 1.0
		"target":
			col = Color(1.0, 0.85, 0.3)
			pulse = 1.0
			a = 1.0
		"hover":
			a = 1.0
		"hidden":
			a = 0.0
	ring_mat.set_shader_parameter("color", Color(col.r, col.g, col.b, a))
	ring_mat.set_shader_parameter("pulse", pulse)
	ring.visible = state != "hidden" and not dead

func show_name(v: bool) -> void:
	name_label.visible = v and not dead

func refresh() -> void:
	var c := creature
	var ratio := c.hp_ratio()
	bar_mat.set_shader_parameter("ratio", ratio)
	bar_mat.set_shader_parameter("fill_color", UI.hp_color(ratio) if c.team == 0 else Color(0.82, 0.2, 0.16))
	bar_mat.set_shader_parameter("temp", 0.0)
	if _shown_hp < 0:
		_shown_hp = ratio
		bar_mat.set_shader_parameter("ghost", ratio)
	elif abs(_shown_hp - ratio) > 0.001:
		var from := _shown_hp
		_shown_hp = ratio
		var tw := create_tween()
		tw.tween_method(func(v): bar_mat.set_shader_parameter("ghost", v), max(from, ratio), ratio, 0.6).set_delay(0.25)
	bar.visible = show_bar and not dead
	_refresh_status()
	# Oculto: en sombra
	set_shadowed(c.is_hidden())

func _refresh_status() -> void:
	for ch in status_root.get_children():
		ch.queue_free()
	if dead:
		return
	var icons: Array = []
	for cond in creature.active_condition_list():
		var ic: String = STATUS_ICONS.get(cond, "")
		if ic != "" and not ic in icons:
			icons.append(ic)
	for e in creature.effects:
		var ic2: String = EFFECT_ICONS.get(e.kind, "")
		if ic2 != "" and not ic2 in icons:
			icons.append(ic2)
	icons = icons.slice(0, 5)
	var n := icons.size()
	for i in n:
		var sp := Sprite3D.new()
		sp.texture = UI.icon(icons[i])
		sp.pixel_size = 0.0004
		sp.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		sp.no_depth_test = true
		sp.render_priority = 3
		sp.modulate = _icon_color(icons[i])
		sp.position = Vector3((i - (n - 1) / 2.0) * 0.22, 0, 0)
		status_root.add_child(sp)

func _icon_color(ic: String) -> Color:
	if ic in POSITIVE_ICONS:
		return Color(0.65, 0.85, 1.0)
	return Color(1.0, 0.6, 0.45)

## Rehace el modelo (forma salvaje o vuelta a la normalidad).
func rebuild_model() -> void:
	if model != null:
		model.queue_free()
	model = ModelLibrary.make_creature_model(creature)
	add_child(model)
	inst = model.get_child(0)
	family = inst.get_meta("family", "kaykit")
	ap = inst.find_child("AnimationPlayer", true, false)
	height = 1.15
	if family == "quat_animal":
		height = 0.75
	elif family == "quat_monster":
		height = 1.0
	if creature.size == "small":
		height *= 0.88
	_setup_loops()
	status_root.position = Vector3(0, height + 0.42, 0)
	bar.position = Vector3(0, height + 0.2, 0)
	name_label.position = Vector3(0, height + 0.34, 0)
	apply_size()
	play("idle", true)
	refresh()

## Agrandar/reducir: escala del modelo.
func apply_size() -> void:
	if model == null:
		return
	var s := 1.0
	if creature.has_effect("enlarged"):
		s = 1.35
	elif creature.has_effect("reduced"):
		s = 0.7
	var tw := create_tween()
	tw.tween_property(model, "scale", Vector3.ONE * s, 0.35).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)

# ------------------------------------------------------------------ animación

func play(action: String, loop := false, blend := 0.18, variant := -1) -> float:
	if ap == null:
		return 0.5
	var v := variant if variant >= 0 else randi() % 3
	var an := ModelLibrary.anim_name(family, action, ap, v)
	if an.is_empty():
		return 0.4
	ap.play(an, blend)
	if loop:
		_idle_action = action
	return ap.get_animation(an).length

func play_and_return(action: String, variant := -1) -> float:
	var len := play(action, false, 0.12, variant)
	var tw := create_tween()
	tw.tween_interval(max(0.1, len - 0.15))
	tw.tween_callback(func():
		if not downed and not dead:
			play(_idle_action, true))
	return len

func face_point(p: Vector3, t := 0.15) -> void:
	var d := p - position
	if Vector2(d.x, d.z).length() < 0.01:
		return
	var target_y := atan2(d.x, d.z)
	var cur := rotation.y
	var diff := wrapf(target_y - cur, -PI, PI)
	var tw := create_tween()
	tw.tween_property(self, "rotation:y", cur + diff, t)

func move_along(cells: Array, step_time := 0.24, step_sfx := "step_grass") -> void:
	if cells.is_empty():
		return
	play("run" if cells.size() > 1 else "walk", true)
	for i in cells.size():
		var target := BattleWorld.cell_center(cells[i])
		face_point(target, 0.08)
		var tw := create_tween()
		tw.tween_property(self, "position", target, step_time)
		if i % 2 == 0:
			Game.sfx(step_sfx, -14.0)
		await tw.finished
	play("idle", true)

func slide_to(cell: Vector2i, t := 0.25) -> void:
	var tw := create_tween()
	tw.tween_property(self, "position", BattleWorld.cell_center(cell), t).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await tw.finished

func teleport_to(cell: Vector2i) -> void:
	var tw := create_tween()
	tw.tween_property(self, "scale", Vector3(0.1, 1.4, 0.1), 0.18)
	await tw.finished
	position = BattleWorld.cell_center(cell)
	var tw2 := create_tween()
	tw2.tween_property(self, "scale", Vector3.ONE, 0.22).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	await tw2.finished

## Ataque: devuelve cuando llega el momento del impacto (la animación sigue).
func attack(kind: String, target_pos: Vector3) -> void:
	face_point(target_pos, 0.12)
	var action := "attack_melee"
	match kind:
		"ranged", "ranged_spell_weapon":
			action = "attack_ranged"
			_show_ranged(true)
		"thrown":
			action = "throw"
		"ranged_spell", "spell":
			action = "cast"
		"melee_spell":
			action = "cast"
	var len := play_and_return(action)
	await get_tree().create_timer(clamp(len * 0.42, 0.25, 0.6)).timeout
	if kind == "ranged":
		var tw := create_tween()
		tw.tween_interval(0.5)
		tw.tween_callback(func(): _show_ranged(false))

func _show_ranged(on: bool) -> void:
	var v: Dictionary = creature.visual
	var rname: String = v.get("ranged", "")
	if rname.is_empty():
		return
	for slot_name in ["handslot_r", "handslot_l"]:
		var slot: Node = inst.find_child(slot_name, true, false)
		if slot == null:
			continue
		for ch in slot.get_children():
			if ch is MeshInstance3D:
				if ch.name == rname:
					ch.visible = on
				elif ch.name == v.get("weapon_r", "") or ch.name == v.get("weapon_l", ""):
					ch.visible = not on

func cast(buff := false) -> void:
	var len := play_and_return("cast_buff" if buff else "cast")
	await get_tree().create_timer(clamp(len * 0.45, 0.3, 0.7)).timeout

func hit() -> void:
	if downed or dead:
		return
	play_and_return("hit")
	var tw := create_tween()
	var base := model.position
	tw.tween_property(model, "position", base + Vector3(0, 0.05, 0), 0.06)
	tw.tween_property(model, "position", base, 0.12)

func block() -> void:
	if downed or dead:
		return
	play_and_return("block")

func die() -> void:
	dead = true
	downed = false
	play("death", false, 0.1)
	ring.visible = false
	bar.visible = false
	name_label.visible = false
	for ch in status_root.get_children():
		ch.queue_free()
	await get_tree().create_timer(1.6).timeout
	# Los monstruos se desvanecen; los compañeros se quedan en el suelo
	if creature.team != 0:
		var tw := create_tween()
		tw.tween_property(self, "position:y", -0.6, 1.4).set_delay(0.8)
		tw.tween_callback(func(): visible = false)

func fall_down() -> void:
	downed = true
	play("down", false, 0.1)

func get_up() -> void:
	downed = false
	var len := play("revive", false, 0.1)
	var tw := create_tween()
	tw.tween_interval(max(0.2, len - 0.1))
	tw.tween_callback(func(): play("idle", true))

func cheer() -> void:
	if not downed and not dead:
		play_and_return("cheer")

func head_position() -> Vector3:
	return global_position + Vector3(0, height, 0)

func chest_position() -> Vector3:
	return global_position + Vector3(0, height * 0.6, 0)
