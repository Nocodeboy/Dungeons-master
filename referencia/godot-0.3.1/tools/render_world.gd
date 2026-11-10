extends SceneTree
## Renderiza un encuentro para revisar el aspecto: godot --path . -s tools/render_world.gd -- e1_prado out.png [yaw] [dist]
var frames := 0
var out := ""
func _initialize() -> void:
	var args := OS.get_cmdline_user_args()
	var enc_id: String = args[0]
	out = args[1]
	var yaw: float = float(args[2]) if args.size() > 2 else 35.0
	var dist: float = float(args[3]) if args.size() > 3 else 17.0
	var b := BattleSetup.build(enc_id, 1)
	var world := BattleWorld.new()
	get_root().add_child(world)
	world.build(b.map, b.encounter.get("ambient", "dusk"), 3)
	for c in b.creatures:
		var m := ModelLibrary.make_creature_model(c)
		m.position = BattleWorld.cell_center(c.cell)
		m.rotation.y = atan2(c.facing.x, c.facing.y)
		world.add_child(m)
		var ap: AnimationPlayer = m.find_child("AnimationPlayer", true, false)
		if ap:
			var fam: String = m.get_child(0).get_meta("family")
			var an := ModelLibrary.anim_name(fam, "idle", ap)
			if an != "": ap.play(an)
	var cam := Camera3D.new()
	world.add_child(cam)
	var center := world.board_center()
	var pitch := deg_to_rad(52.0)
	var yr := deg_to_rad(yaw)
	var off := Vector3(sin(yr) * cos(pitch), sin(pitch), cos(yr) * cos(pitch)) * dist
	cam.look_at_from_position(center + off, center)
	cam.fov = 40
	cam.current = true
func _process(_d):
	frames += 1
	if frames == 40:
		get_root().get_viewport().get_texture().get_image().save_png(out)
		quit()
	return false
