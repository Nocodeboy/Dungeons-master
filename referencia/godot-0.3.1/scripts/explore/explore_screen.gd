class_name ExploreScreen
extends Node3D
## Exploración libre de un nivel: el grupo se mueve en formación, habla con la gente, abre
## cofres, encuentra cosas escondidas, cae en trampas o las desactiva, se esconde y, cuando
## un enemigo lo ve, el combate empieza ahí mismo, sobre el mismo escenario.

## leave("travel" | "level" | "menu" | "load" | "game_over" | "story", datos)
signal leave(what: String, data: Dictionary)

const RUN_SPEED := 3.6        ## casillas por segundo
const SNEAK_SPEED := 1.8
const DETECT_EVERY := 0.2
const PERCEIVE_RADIUS := 5    ## a qué distancia se notan las cosas escondidas
const SEARCH_RADIUS := 6

var level_id := ""
var level: Dictionary = {}
var map: BattleMap
var world: LevelWorld
var cam: CameraRig
var hud: ExploreHUD
var fx: FX
var portraits: Portraits
var cp: Campaign
var ls: Dictionary = {}

var members: Array = []          ## Creature del grupo vivas, en orden
var dead_members: Array = []     ## ids de los caídos para siempre
var views: Dictionary = {}       ## id -> UnitView (grupo, personajes y enemigos)
var leader := ""
var walkers: Dictionary = {}     ## id -> Array de casillas pendientes
var stealth := false
var in_battle := false
var busy := false
var battle_screen: BattleScreen

var objects: Dictionary = {}     ## id -> datos del objeto (del nivel)
var npcs: Dictionary = {}        ## id -> {data, creature}
var groups: Dictionary = {}      ## id -> {data, creatures, rolls}
var _arrive_cb: Callable = Callable()
var _detect_t := 0.0
var _step_t := 0.0
var _ui: CanvasLayer
var _follow := false
var _spawn := ""

# ================================================================== arranque

func start(p_level: String, spawn: String) -> void:
	cp = Game.campaign
	level_id = p_level
	_spawn = spawn
	level = RulesDB.levels.get(level_id, {})
	ls = cp.level_state(level_id)
	for k in ["found", "opened", "dead", "disarmed", "unlocked", "fired", "loot", "spent"]:
		if not ls.has(k):
			ls[k] = {} if k == "loot" else []
	var old_cell = cp.location.get("cell") if cp.location.get("level", "") == p_level else null
	cp.location = {"level": level_id, "spawn": spawn}
	if spawn == "saved" and old_cell != null:
		cp.location["cell"] = old_cell
	map = BattleMap.new()
	map.load_rows(level.get("rows", []))
	world = LevelWorld.new()
	add_child(world)
	world.build_level(level, map)
	world.set_grid_alpha(0.0)
	fx = FX.new()
	add_child(fx)
	cam = CameraRig.new()
	add_child(cam)
	var bsz := world.board_size()
	cam.setup(bsz.x, bsz.y)
	cam.tapped.connect(_on_tap)
	cam.long_pressed.connect(_on_long_press)
	portraits = Portraits.new()
	add_child(portraits)
	_ui = CanvasLayer.new()
	_ui.layer = 5
	add_child(_ui)
	_load_objects()
	_spawn_party(spawn)
	_spawn_npcs()
	_spawn_groups()
	hud = ExploreHUD.new()
	_ui.add_child(hud)
	hud.member_tapped.connect(_on_member_tapped)
	hud.member_held.connect(func(id): open_inventory(id))
	hud.action.connect(_on_hud_action)
	hud.menu_pressed.connect(open_menu)
	var to_render: Array = members.duplicate()
	for n in npcs.values():
		to_render.append(n.creature)
	await portraits.render_all(to_render)
	hud.setup(self)
	Game.play_music(level_music())
	var lv: UnitView = views.get(leader)
	if lv:
		cam.focus_on(lv.position, 13.0)
	_update_bull_glow()
	_check_triggers(true)
	Game.save_campaign("auto")
	if not OS.get_environment("MG_DO").is_empty():
		var cmds := OS.get_environment("MG_DO")
		OS.set_environment("MG_DO", OS.get_environment("MG_DO2"))
		OS.set_environment("MG_DO2", "")
		_debug_script(cmds)

## Solo para pruebas: órdenes separadas por «|» (goto:x,y · tap:objeto · npc:id · battle:grupo ·
## wait:s · shot:nombre · close · search · rest · inv · cam:x,y,dist · flag:nombre · key:tecla).
func _debug_script(cmds: String) -> void:
	var out_dir := OS.get_environment("OUT_DIR")
	if out_dir.is_empty():
		out_dir = "/tmp"
	for cmd in cmds.split("|", false):
		var parts := cmd.split(":", true, 1)
		var arg := parts[1] if parts.size() > 1 else ""
		match parts[0]:
			"wait":
				await get_tree().create_timer(float(arg)).timeout
			"goto":
				var xy := arg.split(",")
				move_party_to(Vector2i(int(xy[0]), int(xy[1])))
			"tap":
				var o: Dictionary = objects.get(arg, {})
				if not o.is_empty():
					_approach(_ocell(o), func(): interact(arg), map.tile(_ocell(o)) in ["o", "O", "B"] or o.type in ["chest", "trap", "sign", "board", "door"])
			"npc":
				var n: Dictionary = npcs.get(arg, {})
				if not n.is_empty():
					_approach(n.creature.cell, func(): talk_to(arg))
			"battle":
				start_battle(arg, false)
			"close":
				for ch in _ui.get_children():
					if ch.has_method("close"):
						ch.close()
			"search":
				search()
			"rest":
				open_rest()
			"inv":
				open_inventory(leader)
			"shop":
				var sp := arg.split(",")
				open_shop(sp[0], sp[1] if sp.size() > 1 else "")
			"give":
				var gp := arg.split(",")
				cp.give_item(gp[0], 1, gp.size() > 1 and gp[1] == "unid")
			"gold":
				cp.give_gold(int(arg))
			"travel":
				leave.emit("travel", {"from": level_id})
			"levelup":
				level_up(int(arg))
			"exit":
				use_exit({"to": arg})
			"kill":
				if groups.has(arg):
					for e in groups[arg].creatures:
						if views.has(e.id):
							views[e.id].queue_free()
							views.erase(e.id)
					groups.erase(arg)
					ls.dead.append(arg)
			"info":
				await RenderingServer.frame_post_draw
				print("info: prims=", RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_PRIMITIVES_IN_FRAME),
					" draws=", RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_DRAW_CALLS_IN_FRAME),
					" objs=", RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_TOTAL_OBJECTS_IN_FRAME),
					" vram=", RenderingServer.get_rendering_info(RenderingServer.RENDERING_INFO_VIDEO_MEM_USED) / 1048576, "MB",
					" fps=", Engine.get_frames_per_second())
			"draws":
				_debug_draws()
			"occ":
				print("árboles: ", world.tall_props.size(), " aclarados: ", world._faded.size(), " cam ", cam.camera.global_position)
			"stealth":
				toggle_stealth()
			"flag":
				cp.flags[arg] = true
			"cam":
				var v := arg.split(",")
				cam.focus_on(BattleWorld.cell_center(Vector2i(int(v[0]), int(v[1]))), float(v[2]) if v.size() > 2 else 13.0)
			"shot":
				await RenderingServer.frame_post_draw
				get_viewport().get_texture().get_image().save_png("%s/%s.png" % [out_dir, arg])
				print("captura: ", arg)
			"quit":
				get_tree().quit()

## Solo para pruebas: qué se dibuja (aprox. llamadas por grupo de nodos visibles en cámara).
func _debug_draws() -> void:
	var planes := cam.camera.get_frustum()
	var groups := {}
	for n in get_tree().root.find_children("*", "GeometryInstance3D", true, false):
		var gi := n as GeometryInstance3D
		if not gi.is_visible_in_tree():
			continue
		var aabb := gi.get_aabb()
		var gx := gi.global_transform * aabb
		var inside := true
		for pl: Plane in planes:
			var c := gx.get_center()
			var e := gx.size * 0.5
			var r := absf(pl.normal.x) * e.x + absf(pl.normal.y) * e.y + absf(pl.normal.z) * e.z
			if pl.distance_to(c) > r:
				inside = false
				break
		if not inside:
			continue
		var surf := 1
		if gi is MeshInstance3D and (gi as MeshInstance3D).mesh:
			surf = (gi as MeshInstance3D).mesh.get_surface_count()
		elif gi is MultiMeshInstance3D and (gi as MultiMeshInstance3D).multimesh and (gi as MultiMeshInstance3D).multimesh.mesh:
			surf = (gi as MultiMeshInstance3D).multimesh.mesh.get_surface_count()
		var p: Node = gi.get_parent()
		var key := gi.get_class()
		while p != null and p != world and p != self:
			key = p.name
			p = p.get_parent()
		if gi is MultiMeshInstance3D:
			key = "lote"
		var sh := gi.cast_shadow != GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var gr: Array = groups.get(key, [0, 0, 0])
		gr[0] += 1
		gr[1] += surf
		gr[2] += surf if sh else 0
		groups[key] = gr
	var rows := []
	for k in groups.keys():
		rows.append([groups[k][1] + groups[k][2], k, groups[k]])
	rows.sort()
	rows.reverse()
	for r in rows.slice(0, 25):
		print("   draws~%4d  %-24s nodos=%d superficies=%d sombra=%d" % [r[0], str(r[1]).left(24), r[2][0], r[2][1], r[2][2]])

## Música del nivel; puede cambiar con la historia ("music_flags": {bandera: pista}).
func level_music() -> String:
	var m: String = level.get("music", "aldea")
	var mf: Dictionary = level.get("music_flags", {})
	for f in mf.keys():
		if cp.flags.has(f):
			m = mf[f]
	return m

func member(id: String) -> Creature:
	for c in members:
		if c.id == id:
			return c
	return null

func _leader_c() -> Creature:
	var c := member(leader)
	if c == null and not members.is_empty():
		leader = members[0].id
		c = members[0]
	return c

func _flag(f: String) -> bool:
	return f.is_empty() or cp.flags.has(f)

# ================================================================== grupo

func _spawn_party(spawn: String) -> void:
	for v in views.values():
		if is_instance_valid(v) and v.creature.team == 0:
			v.queue_free()
	members.clear()
	dead_members.clear()
	var sp: Array = level.get("spawns", {}).get(spawn, level.get("spawns", {}).get("default", [2, 2]))
	if spawn == "saved" and cp.location.has("cell"):
		sp = cp.location.cell
	var start := Vector2i(int(sp[0]), int(sp[1]))
	var cells := _free_cells_near(start, cp.party.size())
	var i := 0
	for id in cp.party:
		if cp.is_dead(id):
			dead_members.append(id)
			continue
		var c := cp.creature_for(id)
		c.cell = cells[min(i, cells.size() - 1)]
		c.facing = Vector2(1, 0)
		members.append(c)
		var uv := UnitView.new()
		world.add_child(uv)
		uv.setup(c)
		uv.set_ring("hidden")
		uv.show_bar = false
		uv.bar.visible = false
		views[id] = uv
		i += 1
	if leader.is_empty() or member(leader) == null:
		leader = members[0].id if not members.is_empty() else ""

## Vuelve a crear las criaturas del grupo desde la campaña (tras un combate, un descanso o el inventario).
func rebuild_party() -> void:
	var keep: Dictionary = {}
	for c in members:
		keep[c.id] = c.cell
	members.clear()
	dead_members.clear()
	for id in cp.party:
		if cp.is_dead(id):
			dead_members.append(id)
			if views.has(id) and is_instance_valid(views[id]):
				views[id].queue_free()
				views.erase(id)
			continue
		var c := cp.creature_for(id)
		c.cell = keep.get(id, _leader_c().cell if not members.is_empty() else Vector2i(2, 2))
		members.append(c)
		if views.has(id) and is_instance_valid(views[id]):
			var uv: UnitView = views[id]
			uv.show_bar = false
			uv.bind(c)
			uv.set_ring("hidden")
			uv.show_name(false)
			uv.set_shadowed(stealth)
			if uv.downed:
				uv.get_up()
			uv.downed = false
		else:
			var nv := UnitView.new()
			world.add_child(nv)
			nv.setup(c)
			nv.set_ring("hidden")
			nv.show_bar = false
			nv.bar.visible = false
			views[id] = nv
	if member(leader) == null and not members.is_empty():
		leader = members[0].id
	if hud:
		await portraits.render_all(members)
		hud.refresh()

func _free_cells_near(start: Vector2i, n: int) -> Array:
	var out: Array = []
	var blocked := _blocked_cells()
	var frontier := [start]
	var seen := {start: true}
	while not frontier.is_empty() and out.size() < n:
		var c: Vector2i = frontier.pop_front()
		if map.walkable(c) and not blocked.has(c):
			out.append(c)
		for nb in BattleMap.neighbors(c):
			if not seen.has(nb) and map.in_bounds(nb):
				seen[nb] = true
				frontier.append(nb)
	if out.is_empty():
		out.append(start)
	return out

## Casillas por las que el grupo no puede pasar: personajes, enemigos y trampas a la vista.
func _blocked_cells() -> Dictionary:
	var b := {}
	for n in npcs.values():
		b[n.creature.cell] = true
	for g in groups.values():
		for e in g.creatures:
			if not e.dead:
				b[e.cell] = true
	for id in objects.keys():
		var o: Dictionary = objects[id]
		if o.type == "trap" and _object_visible(o) and not id in ls.disarmed:
			b[_ocell(o)] = true
	return b

static func _ocell(o: Dictionary) -> Vector2i:
	return Vector2i(int(o.cell[0]), int(o.cell[1]))

# ================================================================== objetos

func _load_objects() -> void:
	objects.clear()
	for o in level.get("objects", []):
		if o.get("type", "") == "npc":
			continue
		objects[str(o.id)] = o
	# Botín que dejaron los combates
	for lid in ls.loot.keys():
		if str(lid).begins_with("drop_") and not ls.loot[lid].is_empty():
			var d: Dictionary = ls.get("drops", {}).get(lid, {})
			if not d.is_empty():
				objects[lid] = d
	for id in objects.keys():
		_refresh_object(id)

## ¿Se ve el objeto ahora? (requisitos, escondido sin encontrar, abierto y vacío...)
func _object_visible(o: Dictionary) -> bool:
	if not _flag(str(o.get("requires", ""))):
		return false
	if not _flag(str(o.get("hidden_until", ""))):
		return false
	var id := str(o.id)
	if o.has("hidden") and not id in ls.found:
		return false
	if o.type == "trap" and id in ls.disarmed:
		return false
	if o.type in ["cache", "loot"] and id in ls.opened and _loot_of(o).is_empty():
		return false
	return true

func _refresh_object(id: String) -> void:
	var o: Dictionary = objects[id]
	var n: Node3D = world.object_nodes.get(id)
	var vis := _object_visible(o)
	if vis and n == null:
		n = world.make_object_node(o)
	if n != null:
		n.visible = vis
	# Cofres abiertos y vacíos: sin brillo
	if n != null and o.type in ["chest", "cache", "loot"]:
		world.set_object_glow(id, vis and not _loot_of(o).is_empty() and o.type != "chest" and o.type != "loot")

## Contenido actual de un contenedor (se guarda en el estado del nivel al abrirlo).
func _loot_of(o: Dictionary) -> Array:
	var id := str(o.id)
	if ls.loot.has(id):
		return ls.loot[id]
	var out: Array = []
	for e in o.get("loot", []):
		var item: String = e[0]
		var n := int(e[1]) if e.size() > 1 else 1
		var unid: bool = Items.is_magic(item) and Items.kind(item) in ["weapon", "armor", "shield", "wondrous"]
		out.append({"id": item, "n": n, "unid": unid})
	return out

# ================================================================== personajes

func _spawn_npcs() -> void:
	for n in npcs.values():
		var v: UnitView = views.get(n.creature.id)
		if v:
			v.queue_free()
			views.erase(n.creature.id)
	npcs.clear()
	for o in level.get("objects", []):
		if o.get("type", "") != "npc" or not _flag(str(o.get("requires", ""))):
			continue
		var c := Creature.new()
		c.id = "npc_" + str(o.id)
		c.template_id = c.id
		c.name = str(o.get("name", o.id))
		c.title = str(o.get("title", ""))
		c.team = 2
		c.species = str(o.get("visual", {}).get("species", "human"))
		var sheet := {"class": o.get("visual", {}).get("class", "fighter"), "species": c.species, "visual": o.get("visual", {}).duplicate()}
		c.visual = CharacterSheet.visual_for(sheet)
		c.visual.erase("weapons_list")
		c.size = "small" if c.species in ["halfling", "gnome"] else "medium"
		c.max_hp = 10
		c.hp = 10
		c.cell = _ocell(o)
		var f := deg_to_rad(float(o.get("face", 0)))
		c.facing = Vector2(sin(f), cos(f))
		var uv := UnitView.new()
		world.add_child(uv)
		uv.show_bar = false
		uv.setup(c)
		uv.set_ring("hidden")
		views[c.id] = uv
		npcs[str(o.id)] = {"data": o, "creature": c}

# ================================================================== enemigos

func _spawn_groups() -> void:
	groups.clear()
	for g in level.get("groups", []):
		var gid := str(g.id)
		if gid in ls.dead or not _flag(str(g.get("requires", ""))):
			continue
		if g.has("flag") and cp.flags.has(str(g.flag)):
			continue
		var cr: Array = []
		var counts := {}
		for e in g.get("enemies", []):
			var mid: String = e.id
			counts[mid] = int(counts.get(mid, 0)) + 1
			var m := Factory.make_monster(mid, counts[mid])
			m.id = "%s_%s" % [gid, m.id]
			m.cell = Vector2i(int(e.cell[0]), int(e.cell[1]))
			var f := deg_to_rad(float(e.get("face", 180)))
			m.facing = Vector2(sin(f), cos(f))
			cr.append(m)
			var uv := UnitView.new()
			world.add_child(uv)
			uv.show_bar = false
			uv.setup(m)
			uv.set_ring("hidden")
			views[m.id] = uv
		var totals := {}
		for m in cr:
			totals[m.template_id] = int(totals.get(m.template_id, 0)) + 1
		var idx := {}
		for m in cr:
			if int(totals[m.template_id]) > 1:
				idx[m.template_id] = int(idx.get(m.template_id, 0)) + 1
				m.name = "%s %d" % [m.name, idx[m.template_id]]
		groups[gid] = {"data": g, "creatures": cr, "rolls": {}}

## Percepción pasiva más alta de un grupo de enemigos.
func _group_pp(g: Dictionary) -> int:
	var best := 0
	for e in g.creatures:
		if not e.dead:
			best = max(best, e.passive_perception())
	return best

# ================================================================== bucle

func _process(delta: float) -> void:
	if cp != null:
		cp.playtime += delta
	if in_battle:
		_detect_t += delta
		if _detect_t >= DETECT_EVERY and battle_screen != null and is_instance_valid(battle_screen) and battle_screen.battle != null:
			_detect_t = 0.0
			var targets: Array = []
			for c in battle_screen.battle.creatures:
				var v: UnitView = views.get(c.id)
				if v and not c.dead:
					targets.append(v.position + Vector3(0, 0.6, 0))
			world.update_occlusion(cam.camera, targets)
		return
	_move_walkers(delta)
	if _follow:
		var lv: UnitView = views.get(leader)
		if lv:
			cam.focus_on(lv.position)
	_detect_t += delta
	if _detect_t >= DETECT_EVERY:
		_detect_t = 0.0
		if not busy:
			_detect()
		_occlusion()

func _occlusion() -> void:
	if cam == null or cam.camera == null:
		return
	var targets: Array = []
	for c in members:
		var v: UnitView = views.get(c.id)
		if v:
			targets.append(v.position + Vector3(0, 0.6, 0))
	world.update_occlusion(cam.camera, targets)

func _move_walkers(delta: float) -> void:
	if walkers.is_empty():
		return
	var speed := SNEAK_SPEED if stealth else RUN_SPEED
	var done: Array = []
	for id in walkers.keys():
		if not walkers.has(id):
			continue   # alguien ha parado al grupo (trampa, algo escondido...)
		var path: Array = walkers[id]
		var uv: UnitView = views.get(id)
		var c := member(id)
		if uv == null or c == null or path.is_empty():
			done.append(id)
			continue
		var target_cell: Vector2i = path[0]
		var target := BattleWorld.cell_center(target_cell)
		var to := target - uv.position
		to.y = 0
		var step := speed * delta
		if to.length() > 0.001:
			var ang := atan2(to.x, to.z)
			uv.rotation.y = lerp_angle(uv.rotation.y, ang, min(1.0, delta * 14.0))
		if to.length() <= step:
			uv.position = target
			c.cell = target_cell
			path.pop_front()
			if _on_enter_cell(c, target_cell) or walkers.is_empty():
				return
		else:
			uv.position += to.normalized() * step
		if path.is_empty():
			done.append(id)
	for id in done:
		walkers.erase(id)
		var v: UnitView = views.get(id)
		if v:
			v.play("idle", true)
	_step_t += delta
	if _step_t > (0.5 if stealth else 0.32):
		_step_t = 0.0
		Game.sfx("step_grass" if str(level.get("ambient", "")) != "crypt" else "step_stone", -18.0)
	if walkers.is_empty():
		_follow = false
		var lc := _leader_c()
		if lc:
			cp.location["cell"] = [lc.cell.x, lc.cell.y]
		if _arrive_cb.is_valid():
			var cb := _arrive_cb
			_arrive_cb = Callable()
			cb.call()

func _stop_all() -> void:
	for id in walkers.keys():
		var v: UnitView = views.get(id)
		var c := member(id)
		if v and c:
			v.position = BattleWorld.cell_center(c.cell)
			v.play("idle", true)
	walkers.clear()
	_arrive_cb = Callable()
	_follow = false

## Mueve el grupo: el líder va al destino y los demás a casillas libres detrás de él.
func move_party_to(goal: Vector2i, on_arrive := Callable()) -> bool:
	var lead := _leader_c()
	if lead == null:
		return false
	var blocked := _blocked_cells()
	var path := map.find_path(lead.cell, goal, blocked)
	if path.is_empty():
		return false
	var dests := _formation(goal, path, blocked)
	walkers.clear()
	if path.size() > 1:
		walkers[lead.id] = path.slice(1)
	var i := 1
	for c in members:
		if c == lead:
			continue
		var d: Vector2i = dests[min(i, dests.size() - 1)]
		i += 1
		var p := map.find_path(c.cell, d, blocked)
		if p.size() > 1:
			walkers[c.id] = p.slice(1)
	for id in walkers.keys():
		var v: UnitView = views.get(id)
		if v:
			v.play("walk" if stealth else "run", true)
	_arrive_cb = on_arrive
	_follow = true
	if walkers.is_empty() and on_arrive.is_valid():
		_arrive_cb = Callable()
		on_arrive.call()
	return true

## Casillas de llegada: el destino y, para los demás, las de detrás en el camino o las más cercanas libres.
func _formation(goal: Vector2i, path: Array, blocked: Dictionary) -> Array:
	var out: Array = [goal]
	var taken := {goal: true}
	for k in range(path.size() - 2, -1, -1):
		if out.size() >= members.size():
			break
		var c: Vector2i = path[k]
		if not taken.has(c) and not blocked.has(c):
			out.append(c)
			taken[c] = true
	if out.size() < members.size():
		for c in _free_cells_near(goal, members.size() + 6):
			if out.size() >= members.size():
				break
			if not taken.has(c):
				out.append(c)
				taken[c] = true
	return out

## Al pisar una casilla: trampas, disparadores y cosas escondidas. Devuelve true si se interrumpe el movimiento.
func _on_enter_cell(c: Creature, cell: Vector2i) -> bool:
	for id in objects.keys():
		var o: Dictionary = objects[id]
		if o.type == "trap" and _ocell(o) == cell and not id in ls.disarmed and _flag(str(o.get("requires", ""))):
			_spring_trap(id, c)
			return true
	if c.id == leader:
		_perceive()
		if _check_triggers(false):
			return true
	return false

# ================================================================== percepción y búsqueda

## Percepción pasiva: lo escondido cerca del grupo aparece si alguien lo nota.
func _perceive() -> void:
	var best := 0
	var who: Creature = null
	for c in members:
		var pp: int = c.passive_perception()
		if "perception" in c.item_adv:
			pp += 5
		if pp > best:
			best = pp
			who = c
	for id in objects.keys():
		var o: Dictionary = objects[id]
		if not o.has("hidden") or id in ls.found or not _flag(str(o.get("requires", ""))):
			continue
		var oc := _ocell(o)
		if _near_party(oc, PERCEIVE_RADIUS) and best >= int(o.hidden.get("dc", 15)):
			_reveal(id, who, "percepción pasiva %d" % best)

func _near_party(cell: Vector2i, r: int) -> bool:
	for c in members:
		if BattleMap.dist(c.cell, cell) <= r and (map.has_los(c.cell, cell) or BattleMap.dist(c.cell, cell) <= 1):
			return true
	return false

func _reveal(id: String, who: Creature, why: String) -> void:
	ls.found.append(id)
	var o: Dictionary = objects[id]
	_refresh_object(id)
	world.set_object_glow(id, true, Color(1.0, 0.8, 0.3) if o.type != "trap" else Color(1.0, 0.25, 0.2))
	Game.sfx("buff", -8)
	var p := BattleWorld.cell_center(_ocell(o)) + Vector3(0, 0.8, 0)
	fx.float_text(p, "¡Trampa!" if o.type == "trap" else "¡Algo escondido!", UI.ENEMY if o.type == "trap" else UI.GOLD, 0.9)
	var nm := BattleScreen.short_name(who) if who else ""
	if o.type == "trap":
		hud.toast("%s ve una trampa: %s (%s)." % [nm, o.get("name", "trampa"), why], UI.WARN)
		_stop_all()
	else:
		hud.toast("%s encuentra %s (%s)." % [nm, str(o.get("name", "algo")).to_lower(), why], UI.GOLD)
	if o.has("found_text"):
		hud.show_hint(str(o.found_text))

## Búsqueda activa: cada uno tira Percepción (o Investigación) contra lo escondido cercano.
func search() -> void:
	if busy or in_battle:
		return
	_stop_all()
	Game.sfx("page", -6)
	for c in members:
		var v: UnitView = views.get(c.id)
		if v:
			v.play_and_return("interact")
	var found_any := false
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var lines: Array = []
	for c in members:
		var sk := "perception" if c.skill_bonus("perception") >= c.skill_bonus("investigation") else "investigation"
		var roll := rng.randi_range(1, 20)
		if sk in c.item_adv:
			roll = max(roll, rng.randi_range(1, 20))
		var total: int = roll + c.skill_bonus(sk)
		lines.append("%s %d" % [BattleScreen.short_name(c), total])
		for id in objects.keys():
			var o: Dictionary = objects[id]
			if not o.has("hidden") or id in ls.found or not _flag(str(o.get("requires", ""))):
				continue
			if BattleMap.dist(c.cell, _ocell(o)) <= SEARCH_RADIUS and total >= int(o.hidden.get("dc", 15)):
				_reveal(id, c, "%s %d" % ["Percepción" if sk == "perception" else "Investigación", total])
				found_any = true
	if not found_any:
		hud.toast("Buscáis con calma… (%s). No encontráis nada más por aquí." % ", ".join(lines), UI.TEXT_DIM)

# ================================================================== trampas

func _spring_trap(id: String, c: Creature) -> void:
	_stop_all()
	var o: Dictionary = objects[id]
	if not id in ls.found:
		ls.found.append(id)
	ls.disarmed.append(id)   # una trampa salta una sola vez
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var dmg := Dice.roll_with(str(o.get("damage", "1d6")), rng)
	var save: Dictionary = o.get("save", {})
	var text := "¡%s pisa %s!" % [BattleScreen.short_name(c), str(o.get("name", "una trampa")).to_lower()]
	if not save.is_empty():
		var ab: String = save.get("ab", "dex")
		var r := rng.randi_range(1, 20) + c.save_bonus(ab)
		if r >= int(save.get("dc", 12)):
			dmg = int(dmg / 2)
			text += " Salva (%d) y se lleva la mitad." % r
		else:
			text += " Falla la salvación (%d)." % r
	var uv: UnitView = views.get(c.id)
	world.make_object_node(o)
	var n: Node3D = world.object_nodes.get(id)
	if n:
		n.visible = true
		var tw := n.create_tween()
		tw.tween_interval(1.4)
		tw.tween_property(n, "scale", Vector3.ONE * 0.01, 0.4)
		tw.tween_callback(func(): n.visible = false)
	_hurt(c, dmg, str(o.get("dtype", "piercing")))
	if uv:
		uv.hit()
	Game.sfx("hit_metal", -2)
	hud.toast(text + " %d de daño." % dmg, UI.ENEMY)
	if o.has("alarm"):
		var gid: String = o.alarm
		hud.show_banner("¡Una alarma!", UI.ENEMY, 1.2)
		hud.toast("Una cuerda tensa, un ruido de latas: el campamento sabe que estáis aquí.", UI.WARN)
		if groups.has(gid):
			await get_tree().create_timer(1.2).timeout
			start_battle(gid, false)

## Daño fuera de combate: nunca deja a nadie a menos de 1 PG.
func _hurt(c: Creature, dmg: int, dtype: String) -> void:
	var mult := 0.5 if dtype in c.resist else 1.0
	dmg = int(dmg * mult)
	var from_temp: int = min(c.temp_hp, dmg)
	c.temp_hp -= from_temp
	c.hp = max(1, c.hp - (dmg - from_temp))
	cp.capture(c)
	var uv: UnitView = views.get(c.id)
	if uv:
		uv.refresh()
		fx.float_text(uv.head_position(), "-%d" % dmg, UI.ENEMY, 0.8)
	hud.refresh()

func _trap_dialog(id: String) -> void:
	var o: Dictionary = objects[id]
	var dc := int(o.get("dc_disarm", 13))
	var tools := _who_has("thieves_tools")
	var opts: Array = []
	if tools != null:
		var best := _best_at_tools()
		var bonus := _tools_bonus(best)
		opts.append({"text": "Desactivarla: %s (%+d contra CD %d)" % [BattleScreen.short_name(best), bonus, dc], "icon": "lockpick",
			"cb": func(): _try_disarm(id, best)})
	else:
		opts.append({"text": "Desactivarla (hacen falta herramientas de ladrón)", "icon": "lockpick", "enabled": false})
	opts.append({"text": "Dejarla y rodearla", "icon": "cross"})
	ChoiceDialog.open(_ui, str(o.get("name", "Trampa")), "Trampa descubierta", str(o.get("desc", "Un mecanismo escondido. Si alguien lo pisa, saltará.")), opts)

func _try_disarm(id: String, c: Creature) -> void:
	var o: Dictionary = objects[id]
	var dc := int(o.get("dc_disarm", 13))
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var roll := rng.randi_range(1, 20)
	var total := roll + _tools_bonus(c)
	var uv: UnitView = views.get(c.id)
	if uv:
		uv.play_and_return("interact")
	if total >= dc:
		ls.disarmed.append(id)
		_refresh_object(id)
		Game.sfx("confirm", -6)
		hud.toast("%s desactiva %s (%d contra CD %d)." % [BattleScreen.short_name(c), str(o.get("name", "la trampa")).to_lower(), total, dc], UI.HEAL)
	elif total <= dc - 5:
		hud.toast("%s se equivoca (%d contra CD %d)…" % [BattleScreen.short_name(c), total, dc], UI.ENEMY)
		_spring_trap(id, c)
	else:
		Game.sfx("error", -8)
		hud.toast("%s no lo consigue (%d contra CD %d). Puede volver a intentarlo." % [BattleScreen.short_name(c), total, dc], UI.WARN)

## Herramientas de ladrón: Destreza + competencia (pícaros y criminales) + objetos.
func _tools_bonus(c: Creature) -> int:
	var b := c.mod("dex") + c.item_tools
	if c.cls == "rogue" or c.background == "criminal":
		b += c.prof_bonus
	return b

func _best_at_tools() -> Creature:
	var best: Creature = members[0]
	for c in members:
		if _tools_bonus(c) > _tools_bonus(best):
			best = c
	return best

func _who_has(item: String) -> Creature:
	for c in members:
		if Items.count(cp.sheet(c.id), item) > 0:
			return c
	return null

# ================================================================== detección y sigilo

func _detect() -> void:
	for gid in groups.keys():
		var g: Dictionary = groups[gid]
		var sight := int(g.data.get("sight", 8))
		var pp := _group_pp(g)
		for e in g.creatures:
			if e.dead:
				continue
			for c in members:
				var d := BattleMap.dist(e.cell, c.cell)
				if d > sight:
					continue
				if not map.has_los(e.cell, c.cell):
					continue
				if stealth and d > 2:
					if not g.rolls.has(c.id):
						g.rolls[c.id] = _stealth_roll(c)
						var ok: bool = int(g.rolls[c.id]) >= pp
						fx.float_text(views[c.id].head_position(), "Sigilo %d" % int(g.rolls[c.id]), UI.HEAL if ok else UI.ENEMY, 0.6)
					if int(g.rolls[c.id]) >= pp:
						continue
				_spotted(gid, e, c)
				return

func _stealth_roll(c: Creature) -> int:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var r := rng.randi_range(1, 20)
	var adv := "stealth" in c.item_adv
	var dis: bool = c.armor_data().get("stealth_dis", false)
	if adv and not dis:
		r = max(r, rng.randi_range(1, 20))
	elif dis and not adv:
		r = min(r, rng.randi_range(1, 20))
	return r + c.skill_bonus("stealth")

func _spotted(gid: String, e: Creature, c: Creature) -> void:
	_stop_all()
	var ev: UnitView = views.get(e.id)
	if ev:
		ev.face_point(views[c.id].position, 0.15)
		fx.float_text(ev.head_position() + Vector3(0, 0.3, 0), "¡!", UI.ENEMY, 0.7)
	start_battle(gid, false)

func toggle_stealth() -> void:
	stealth = not stealth
	for g in groups.values():
		g.rolls.clear()
	hud.refresh()
	hud.set_status("Sigilo: avanzáis agachados" if stealth else "")
	hud.toast("Sigilo activado: os movéis más despacio e intentáis que no os vean." if stealth else "Sigilo desactivado.", UI.MAGIC if stealth else UI.TEXT_DIM)
	for c in members:
		var v: UnitView = views.get(c.id)
		if v:
			v.set_shadowed(stealth)

# ================================================================== disparadores

func _check_triggers(on_load: bool) -> bool:
	var lead := _leader_c()
	for t in level.get("triggers", []):
		var tid := str(t.id)
		if t.get("once", true) and tid in ls.fired:
			continue
		if not _flag(str(t.get("requires", ""))):
			continue
		var hit := false
		if on_load and t.get("on_load", false) and (not t.has("spawn") or str(t.spawn) == _spawn):
			hit = true
		elif lead != null:
			for cc in t.get("cells", []):
				if Vector2i(int(cc[0]), int(cc[1])) == lead.cell:
					hit = true
					break
		if not hit:
			continue
		ls.fired.append(tid)
		if t.has("flag"):
			cp.flags[str(t.flag)] = true
		if t.has("journal"):
			add_journal(str(t.journal))
		if t.has("text"):
			_stop_all()
			_narrate(t.text, str(t.get("hint", "")))
			return true
		if t.has("hint"):
			hud.show_hint(str(t.hint))
	return false

func _narrate(lines: Array, hint := "") -> void:
	var txt := ""
	for l in lines:
		txt += Game.hero_text(str(l)) + "\n\n"
	var d := ChoiceDialog.open(_ui, str(level.get("name", "")), str(level.get("place", "")), txt.strip_edges(),
		[{"text": "Continuar", "icon": "check"}], null, 820)
	busy = true
	await d.closed
	busy = false
	if not hint.is_empty():
		hud.show_hint(hint)

func add_journal(text: String) -> void:
	if text in cp.journal:
		return
	cp.journal.append(text)
	hud.toast("Diario actualizado.", UI.GOLD)
	Game.sfx("page", -6)

# ================================================================== toques

func _unhandled_input(event: InputEvent) -> void:
	if in_battle:
		return
	if event is InputEventScreenTouch or event is InputEventScreenDrag:
		if event is InputEventScreenTouch and event.pressed and hud != null and hud.is_point_on_ui(event.position):
			return
		cam.handle_input(event)
		if event is InputEventScreenDrag:
			_follow = false
		return
	if event is InputEventMouseButton or event is InputEventMouseMotion:
		if event is InputEventMouseButton and event.pressed and hud != null and hud.is_point_on_ui(event.position):
			return
		cam.handle_input(event)

## Qué hay bajo un toque: {kind: npc|enemy|member|object|ground, id, cell}
func _pick(screen_pos: Vector2) -> Dictionary:
	var best := {}
	var best_d := 50.0
	for id in views.keys():
		var u: UnitView = views[id]
		if not is_instance_valid(u) or u.dead or not u.visible:
			continue
		for p in [u.global_position + Vector3(0, 0.15, 0), u.chest_position(), u.head_position()]:
			if cam.is_behind(p):
				continue
			var d := cam.screen_of(p).distance_to(screen_pos)
			if d < best_d:
				best_d = d
				var kind := "member" if u.creature.team == 0 else ("npc" if u.creature.team == 2 else "enemy")
				best = {"kind": kind, "id": id, "cell": u.creature.cell}
	for id in world.object_nodes.keys():
		var n: Node3D = world.object_nodes[id]
		if not n.visible or not objects.has(id):
			continue
		var p2 := n.global_position + Vector3(0, 0.35, 0)
		if cam.is_behind(p2):
			continue
		var d2 := cam.screen_of(p2).distance_to(screen_pos) * 0.9
		if d2 < best_d:
			best_d = d2
			best = {"kind": "object", "id": id, "cell": _ocell(objects[id])}
	if not best.is_empty():
		return best
	var gp = cam.ground_point(screen_pos)
	if gp == null:
		return {}
	var cell := BattleWorld.world_to_cell(gp)
	# Objetos sin modelo (puertas de edificios, el toro…) por su casilla o su edificio
	for id in objects.keys():
		var o: Dictionary = objects[id]
		if not _object_visible(o):
			continue
		if _ocell(o) == cell:
			return {"kind": "object", "id": id, "cell": cell}
		if o.type == "door" and o.has("target"):
			var tc := Vector2i(int(o.target[0]), int(o.target[1]))
			if BattleMap.dist(tc, cell) <= int(o.get("foot", 2)):
				return {"kind": "object", "id": id, "cell": _ocell(o)}
	return {"kind": "ground", "cell": cell}

func _on_tap(screen_pos: Vector2) -> void:
	if in_battle or busy or (hud != null and hud.is_point_on_ui(screen_pos)):
		return
	var t := _pick(screen_pos)
	if t.is_empty():
		return
	match str(t.kind):
		"member":
			set_leader(str(t.id))
		"npc":
			var nid := str(t.id).substr(4)
			_approach(t.cell, func(): talk_to(nid))
		"enemy":
			_attack_group(str(t.id))
		"object":
			var oid := str(t.id)
			var o: Dictionary = objects[oid]
			var adjacent: bool = map.tile(t.cell) in ["o", "O", "B"] or o.type in ["chest", "trap", "sign", "board", "door"]
			_approach(t.cell, func(): interact(oid), adjacent)
		"ground":
			var cell: Vector2i = t.cell
			var ex := _exit_at(cell)
			if not ex.is_empty():
				if not move_party_to(cell, func(): use_exit(ex)):
					use_exit(ex)
				return
			if not map.walkable(cell):
				Game.sfx("error", -12)
				return
			if move_party_to(cell):
				fx.float_text(BattleWorld.cell_center(cell) + Vector3(0, 0.2, 0), "•", UI.GOLD, 0.3)
			else:
				Game.sfx("error", -12)

func _on_long_press(screen_pos: Vector2) -> void:
	if in_battle or busy:
		return
	var t := _pick(screen_pos)
	if t.get("kind", "") == "member":
		open_inventory(str(t.id))
	elif t.get("kind", "") == "enemy":
		var e := _enemy_by_id(str(t.id))
		if e:
			hud.toast("%s · CA %d · PG %d" % [e.name, e.ac(), e.max_hp], UI.ENEMY)

func _enemy_by_id(id: String) -> Creature:
	for g in groups.values():
		for e in g.creatures:
			if e.id == id:
				return e
	return null

func _approach(cell: Vector2i, cb: Callable, adjacent := true) -> void:
	var lead := _leader_c()
	if lead == null:
		return
	if (adjacent and BattleMap.dist(lead.cell, cell) <= 1) or lead.cell == cell:
		_face(lead, cell)
		cb.call()
		return
	if not adjacent and map.walkable(cell):
		if move_party_to(cell, cb):
			return
	var blocked := _blocked_cells()
	var best: Array = []
	for n in BattleMap.neighbors(cell):
		if not map.walkable(n) or blocked.has(n):
			continue
		var p := map.find_path(lead.cell, n, blocked)
		if not p.is_empty() and (best.is_empty() or p.size() < best.size()):
			best = p
	if best.is_empty():
		hud.toast("No hay forma de llegar hasta ahí.", UI.TEXT_DIM)
		Game.sfx("error", -12)
		return
	move_party_to(best[best.size() - 1], func():
		_face(_leader_c(), cell)
		cb.call())

func _face(c: Creature, cell: Vector2i) -> void:
	var v: UnitView = views.get(c.id)
	if v:
		v.face_point(BattleWorld.cell_center(cell), 0.2)

func set_leader(id: String) -> void:
	if member(id) == null:
		return
	leader = id
	Game.sfx("select", -8)
	hud.refresh()
	hud.toast("%s va en cabeza." % BattleScreen.short_name(member(id)), UI.TEXT_DIM, 2.0)

func _on_member_tapped(id: String) -> void:
	if member(id) == null:
		return
	if id == leader:
		var v: UnitView = views.get(id)
		if v:
			cam.focus_on(v.position)
		return
	set_leader(id)

# ================================================================== salidas

func _exit_at(cell: Vector2i) -> Dictionary:
	for ex in level.get("exits", []):
		for cc in ex.get("cells", []):
			if Vector2i(int(cc[0]), int(cc[1])) == cell:
				return ex
	return {}

func use_exit(ex: Dictionary) -> void:
	if not _flag(str(ex.get("requires", ""))) or not ex.has("to"):
		hud.toast(str(ex.get("blocked", "Por aquí no se puede ir.")), UI.TEXT_DIM, 5.0)
		return
	var to: String = ex.to
	if to == "travel":
		leave.emit("travel", {"from": level_id})
	elif to.begins_with("level:"):
		var parts := to.split(":")
		leave.emit("level", {"level": parts[1], "spawn": parts[2] if parts.size() > 2 else "default"})

# ================================================================== interacción

func interact(id: String) -> void:
	var o: Dictionary = objects.get(id, {})
	if o.is_empty():
		return
	var lead := _leader_c()
	var v: UnitView = views.get(lead.id) if lead else null
	match str(o.type):
		"chest", "cache", "loot":
			if v:
				v.play_and_return("interact")
			if o.has("lock") and not id in ls.unlocked:
				_lock_dialog(id)
			else:
				_open_container(id)
		"sign", "board", "inspect":
			var txt := ""
			for l in o.get("text", []):
				txt += Game.hero_text(str(l)) + "\n\n"
			ChoiceDialog.open(_ui, str(o.get("name", "")), "", txt.strip_edges(), [{"text": "Cerrar", "icon": "check"}])
			if o.has("journal"):
				add_journal(str(o.journal))
		"door":
			var who: String = o.get("npc", "")
			if not who.is_empty() and npcs.has(who):
				talk_to(who)
			else:
				var closed: String = o.get("closed", "La puerta está cerrada. Nadie contesta.")
				hud.toast("%s: %s" % [o.get("name", "Puerta"), closed], UI.TEXT_DIM, 4.0)
		"trap":
			_trap_dialog(id)
		"stairs":
			var lines: Array = o.get("text", [])
			var txt2 := ""
			for l in lines:
				txt2 += Game.hero_text(str(l)) + "\n\n"
			var dest: String = o.get("to", "")
			ChoiceDialog.open(_ui, str(o.get("name", "")), "", txt2.strip_edges(), [
				{"text": "Bajar", "icon": "check", "cb": func(): use_exit({"to": dest})},
				{"text": "Todavía no", "icon": "cross"}])
		"campfire":
			open_rest(true)

func _lock_dialog(id: String) -> void:
	var o: Dictionary = objects[id]
	var lock: Dictionary = o.lock
	var dc := int(lock.get("dc", 13))
	var opts: Array = []
	var key: String = lock.get("key", "")
	if not key.is_empty():
		var holder := _who_has(key)
		if holder != null:
			opts.append({"text": "Abrir con %s" % Items.name_of(key).to_lower(), "icon": "key", "cb": func(): _unlock(id, "%s usa la llave." % BattleScreen.short_name(holder))})
	if _who_has("thieves_tools") != null:
		var best := _best_at_tools()
		opts.append({"text": "Forzar la cerradura: %s (%+d contra CD %d)" % [BattleScreen.short_name(best), _tools_bonus(best), dc], "icon": "lockpick",
			"cb": func(): _try_lock(id, best, "tools", dc)})
	else:
		opts.append({"text": "Forzar la cerradura (hacen falta herramientas de ladrón)", "icon": "lockpick", "enabled": false})
	var strong: Creature = members[0]
	for c in members:
		if c.skill_bonus("athletics") > strong.skill_bonus("athletics"):
			strong = c
	var adv := _who_has("crowbar") != null
	opts.append({"text": "Romperla a golpes: %s (Atletismo %+d contra CD %d%s)" % [BattleScreen.short_name(strong), strong.skill_bonus("athletics"), dc + 2, ", con palanca" if adv else ""],
		"icon": "fist", "cb": func(): _try_lock(id, strong, "force", dc + 2)})
	opts.append({"text": "Dejarlo", "icon": "cross"})
	ChoiceDialog.open(_ui, str(o.get("name", "Cerradura")), "Cerrado con llave", "Una cerradura sólida. Habrá que abrirla de alguna forma.", opts)

func _try_lock(id: String, c: Creature, how: String, dc: int) -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var roll := rng.randi_range(1, 20)
	if how == "force" and _who_has("crowbar") != null:
		roll = max(roll, rng.randi_range(1, 20))
	var total := roll + (_tools_bonus(c) if how == "tools" else c.skill_bonus("athletics"))
	var v: UnitView = views.get(c.id)
	if v:
		v.play_and_return("interact" if how == "tools" else "attack_melee")
	if how == "force":
		Game.sfx("hit_metal", -6)
	if total >= dc:
		_unlock(id, "%s lo consigue (%d contra CD %d)." % [BattleScreen.short_name(c), total, dc])
	else:
		Game.sfx("error", -8)
		hud.toast("%s no lo consigue (%d contra CD %d)." % [BattleScreen.short_name(c), total, dc], UI.WARN)

func _unlock(id: String, text: String) -> void:
	ls.unlocked.append(id)
	Game.sfx("confirm", -6)
	hud.toast(text, UI.HEAL)
	_open_container(id)

func _open_container(id: String) -> void:
	var o: Dictionary = objects[id]
	var entries := _loot_of(o)
	ls.loot[id] = entries
	if not id in ls.opened:
		ls.opened.append(id)
	if entries.is_empty():
		hud.toast("%s: vacío." % o.get("name", "Cofre"), UI.TEXT_DIM)
		_refresh_object(id)
		return
	var w := LootWindow.open(_ui, str(o.get("name", "Botín")), entries, func(idx: int) -> String: return _take_loot(entries, idx))
	busy = true
	await w.closed
	busy = false
	_refresh_object(id)
	hud.refresh()

## Coge un objeto de un contenedor: el oro va al bolsillo común; lo demás, a quien mejor le venga.
func _take_loot(entries: Array, idx: int) -> String:
	var e: Dictionary = entries[idx]
	entries.remove_at(idx)
	if e.id == "gold":
		cp.give_gold(int(e.n))
		hud.refresh()
		return ""
	var who := cp.give_item(str(e.id), int(e.n), bool(e.get("unid", false)))
	var c := member(who)
	return BattleScreen.short_name(c) if c else str(cp.sheet(who).get("name", who))

# ================================================================== personajes: hablar

func talk_to(nid: String) -> void:
	var n: Dictionary = npcs.get(nid, {})
	if n.is_empty():
		return
	var o: Dictionary = n.data
	var c: Creature = n.creature
	var v: UnitView = views.get(c.id)
	var lead := _leader_c()
	if v and lead:
		v.face_point(views[lead.id].position, 0.25)
		v.play_and_return("interact")
	var greet: Array = o.get("greet", ["…"])
	var text := "[i]%s[/i]" % greet[randi() % greet.size()]
	var opts: Array = []
	if o.has("shop"):
		opts.append({"text": "Comerciar", "icon": "shop", "cb": func(): open_shop(str(o.shop), nid)})
	if o.get("inn", false):
		var free := not cp.flags.has("inn_first_night")
		var cost := 0 if free else 2 * members.size()
		opts.append({"text": "Pasar la noche (%s)" % ("invita la casa" if free else "%d po" % cost), "icon": "rest",
			"enabled": cp.gold >= cost, "cb": func(): _inn_rest(cost)})
	if o.get("temple", false):
		var heal_cost := 10
		opts.append({"text": "Curar heridas (%d po)" % heal_cost, "icon": "heal", "enabled": cp.gold >= heal_cost, "cb": func(): _temple_heal(heal_cost)})
		var any_unid := false
		for id in cp.party:
			for e in Items.pack(cp.sheet(id)):
				if e.get("unid", false):
					any_unid = true
		opts.append({"text": "Identificar objetos (20 po)", "icon": "search", "enabled": any_unid and cp.gold >= 20, "cb": func(): _temple_identify(20)})
		for d in dead_members:
			var dn: String = cp.short_name(d)
			opts.append({"text": "Devolver a la vida a %s (150 po)" % dn, "icon": "ankh", "enabled": cp.gold >= 150, "cb": func(): _temple_raise(d, 150)})
	for t in o.get("talk", []):
		opts.append({"text": "Preguntar", "icon": "talk", "keep": true, "cb": func(): _npc_talk(nid)})
		break
	opts.append({"text": "Adiós", "icon": "cross"})
	var d := ChoiceDialog.open(_ui, c.name, str(o.get("title", "")), text, opts, Portraits.get_portrait(c))
	n["dialog"] = d
	busy = true
	await d.closed
	busy = false

func _npc_talk(nid: String) -> void:
	var n: Dictionary = npcs[nid]
	var o: Dictionary = n.data
	var lines: Array = o.get("talk", [])
	var txt := "[i]%s[/i]" % "\n\n".join(lines)
	# Recompensa de la alcaldesa cuando el campamento ha caído
	if nid == "maren" and cp.flags.has("camp_done") and not cp.flags.has("camp_paid"):
		cp.flags["camp_paid"] = true
		cp.give_gold(50)
		txt = "[i]«Me han dicho lo del campamento. Merrowick cumple su palabra: aquí tenéis las cincuenta piezas. Y una cosa más… el toro ha dejado de sangrar, pero la piedra de su pedestal se ha movido. Hermana Aldis dice que hay escalones debajo.»[/i]"
		hud.toast("Recibís 50 po.", UI.GOLD)
		Game.sfx("coins")
		hud.refresh()
	if o.has("journal"):
		add_journal(str(o.journal))
	if o.has("sets"):
		cp.flags[str(o.sets)] = true
	var d: ChoiceDialog = n.get("dialog")
	if d and is_instance_valid(d):
		d.set_text(txt)

func _inn_rest(cost: int) -> void:
	if cost > 0 and not cp.spend_gold(cost):
		return
	cp.flags["inn_first_night"] = true
	Game.play_music("posada", 0.8)
	await _do_long_rest("Cenáis caliente, dormís bajo techo y, por una noche, nadie os despierta.")
	await get_tree().create_timer(2.0).timeout
	Game.play_music(level_music(), 2.0)

func _temple_heal(cost: int) -> void:
	if not cp.spend_gold(cost):
		return
	for c in members:
		cp.state[c.id]["hp"] = c.max_hp
	Game.sfx("heal")
	hud.toast("La hermana Aldis os cura las heridas. Todos recuperáis los puntos de golpe.", UI.HEAL)
	rebuild_party()

func _temple_identify(cost: int) -> void:
	if not cp.spend_gold(cost):
		return
	var names: Array = []
	for id in cp.party:
		names.append_array(Items.identify_all(cp.sheet(id)))
	Game.sfx("buff")
	hud.toast("Identificado: %s." % ", ".join(names), UI.MAGIC, 6.0)
	hud.refresh()

func _temple_raise(id: String, cost: int) -> void:
	if not cp.spend_gold(cost):
		return
	var st: Dictionary = cp.state[id]
	st["dead"] = false
	st["hp"] = 1
	Game.sfx("radiant")
	hud.toast("%s vuelve a respirar." % str(cp.sheet(id).get("name", id)), UI.HEAL, 5.0)
	rebuild_party()

# ================================================================== descansos

func open_rest(at_camp := false) -> void:
	var near_enemy := false
	for g in groups.values():
		for e in g.creatures:
			if e.dead:
				continue
			for c in members:
				if BattleMap.dist(e.cell, c.cell) <= 14:
					near_enemy = true
	if not at_camp:
		for id in objects.keys():
			var o: Dictionary = objects[id]
			if o.type == "campfire" and _object_visible(o) and BattleMap.dist(_ocell(o), _leader_c().cell) <= 3:
				at_camp = true
	var hp_txt := ""
	for c in members:
		var st: Dictionary = cp.state[c.id]
		hp_txt += "%s: %d/%d PG · %d dados de golpe\n" % [BattleScreen.short_name(c), c.hp, c.max_hp, int(st.get("hit_dice", 0))]
	var opts: Array = []
	var short_ok := cp.short_rests_left > 0 and not near_enemy
	var hint := ""
	if near_enemy:
		hint = "hay enemigos cerca"
	elif cp.short_rests_left <= 0:
		hint = "haced un descanso largo"
	opts.append({"text": "Descanso corto: 1 hora (quedan %d)" % cp.short_rests_left, "icon": "hourglass", "enabled": short_ok, "hint": hint, "cb": _short_rest})
	var long_hint := "" if at_camp else "solo en la posada o junto a una hoguera segura"
	if near_enemy and at_camp:
		long_hint = "hay enemigos cerca"
	opts.append({"text": "Descanso largo: hasta mañana", "icon": "campfire", "enabled": at_camp and not near_enemy, "hint": long_hint,
		"cb": func(): _do_long_rest("Montáis guardias junto al fuego. La noche pasa sin sobresaltos.")})
	opts.append({"text": "Seguir", "icon": "cross"})
	ChoiceDialog.open(_ui, "Descansar", "Día %d" % cp.day, hp_txt.strip_edges() + "\n\n[color=#bfb3a0]El descanso corto cura con los dados de golpe y recupera algunos recursos (máximo dos entre descansos largos). El largo lo restablece todo.[/color]", opts)

func _short_rest() -> void:
	var rep := cp.short_rest()
	var lines: Array = []
	for c in members:
		var r: Dictionary = rep.get(c.id, {})
		if int(r.get("healed", 0)) > 0:
			lines.append("%s +%d PG (%d dados)" % [BattleScreen.short_name(c), int(r.healed), int(r.dice)])
	var ident: Array = rep.get("_identified", [])
	await _fade_time("Una hora después…")
	rebuild_party()
	hud.toast("Descanso corto. " + (", ".join(lines) if not lines.is_empty() else "Nadie necesitaba curarse."), UI.HEAL, 5.0)
	if not ident.is_empty():
		hud.toast("Al examinarlos con calma, descubrís qué son: %s." % ", ".join(ident), UI.MAGIC, 6.0)
	Game.save_campaign("auto")

func _do_long_rest(text: String) -> void:
	cp.long_rest()
	await _fade_time("Amanece. Día %d." % cp.day)
	rebuild_party()
	hud.toast(text, UI.HEAL, 5.0)
	hud.refresh()
	Game.save_campaign("auto")

func _fade_time(text: String) -> void:
	busy = true
	var cover := ColorRect.new()
	cover.color = Color(0.02, 0.015, 0.01, 0.0)
	cover.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	cover.mouse_filter = Control.MOUSE_FILTER_STOP
	_ui.add_child(cover)
	var l := UI.title(text, 34)
	l.set_anchors_preset(Control.PRESET_CENTER)
	l.grow_horizontal = Control.GROW_DIRECTION_BOTH
	l.grow_vertical = Control.GROW_DIRECTION_BOTH
	l.modulate.a = 0.0
	cover.add_child(l)
	var tw := create_tween()
	tw.tween_property(cover, "color:a", 0.92, 0.6)
	tw.parallel().tween_property(l, "modulate:a", 1.0, 0.6)
	tw.tween_interval(1.1)
	tw.tween_property(cover, "color:a", 0.0, 0.6)
	tw.parallel().tween_property(l, "modulate:a", 0.0, 0.5)
	await tw.finished
	cover.queue_free()
	busy = false

# ================================================================== combate sin cortes

func _attack_group(enemy_id: String) -> void:
	for gid in groups.keys():
		for e in groups[gid].creatures:
			if e.id == enemy_id:
				# Atacar sin que te hayan visto: los enemigos quedan sorprendidos
				var unseen: bool = stealth and not groups[gid].rolls.is_empty()
				for c in members:
					if not groups[gid].rolls.has(c.id) or int(groups[gid].rolls[c.id]) < _group_pp(groups[gid]):
						unseen = unseen and BattleMap.dist(c.cell, e.cell) > int(groups[gid].data.get("sight", 8))
				start_battle(gid, unseen)
				return

## Empieza el combate con un grupo (y los grupos enlazados) en el mismo escenario.
func start_battle(gid: String, surprise_enemies: bool) -> void:
	if in_battle or not groups.has(gid):
		return
	in_battle = true
	busy = true
	_stop_all()
	var g: Dictionary = groups[gid]
	var data: Dictionary = g.data
	var seed_value := int(Time.get_unix_time_from_system()) % 100000
	if not OS.get_environment("MG_SEED").is_empty():
		seed_value = int(OS.get_environment("MG_SEED"))
	map.set_overlay([], [])
	var battle := Battle.new(map, seed_value)
	battle.encounter = {"id": gid, "name": str(data.get("name", "¡Combate!")), "ambient": str(level.get("ambient", "dusk")),
		"tips": data.get("tips", []), "level": cp.party_level}
	battle.settings.sunlight = str(level.get("ambient", "")) == "day"
	var units := {}
	for c in members:
		c.facing = Vector2(sin(views[c.id].rotation.y), cos(views[c.id].rotation.y))
		BattleSetup.precast(battle, c, cp)
		battle.add_creature(c)
		units[c.id] = views[c.id]
		if stealth and g.rolls.has(c.id) and int(g.rolls[c.id]) >= _group_pp(g):
			battle.start_hidden[c.id] = int(g.rolls[c.id])
	var gids: Array = [gid]
	for lg in data.get("link", []):
		if groups.has(lg) and not lg in gids:
			gids.append(lg)
	for xg in gids:
		for e in groups[xg].creatures:
			if e.dead:
				continue
			battle.add_creature(e)
			units[e.id] = views[e.id]
			views[e.id].show_bar = true
			views[e.id].bar.visible = true
			if surprise_enemies:
				battle.surprised[e.id] = true
	for c in members:
		views[c.id].show_bar = true
		views[c.id].bar.visible = true
		views[c.id].set_shadowed(false)
	# Los vecinos se ponen a cubierto
	for n in npcs.values():
		var nv: UnitView = views.get(n.creature.id)
		if nv:
			var tw := nv.create_tween()
			tw.tween_property(nv, "scale", Vector3.ONE * 0.01, 0.4)
			tw.tween_callback(func(): nv.visible = false)
	hud.visible = false
	var gt := create_tween()
	gt.tween_method(func(a): world.set_grid_alpha(a), 0.0, 0.35 if str(level.get("ambient", "")) != "crypt" else 0.28, 0.6)
	world.flatten_cover(true)
	_scare_animals(units.values())
	if surprise_enemies:
		hud.show_banner("¡Los cogéis por sorpresa!", UI.HEAL)
	battle_screen = BattleScreen.new()
	add_child(battle_screen)
	battle_screen.finished.connect(_on_battle_finished.bind(gids))
	var music := "tumulo" if str(level.get("ambient", "")) == "crypt" else str(level.get("music_combat", "combate"))
	battle_screen.start_in_world(battle, world, cam, units, music)

## Los animales que andan cerca del combate se apartan.
func _scare_animals(unit_views: Array) -> void:
	if not world is LevelWorld:
		return
	for an in (world as LevelWorld).animals:
		var a := an as AmbientAnimal
		var near := Vector3.INF
		for v in unit_views:
			var pv: Vector3 = (v as Node3D).position
			if pv.distance_to(a.position) < 9.0 and (near == Vector3.INF or pv.distance_to(a.position) < near.distance_to(a.position)):
				near = pv
		if near != Vector3.INF:
			a.flee(near)

func _on_battle_finished(result: Dictionary, gids: Array) -> void:
	var bs := battle_screen
	var battle := bs.battle
	if result.get("exit", false):
		leave.emit("menu", {})
		return
	if result.get("load", false):
		leave.emit("load", {})
		return
	var won: bool = result.get("won", false)
	print("Combate terminado en el nivel: ", "victoria" if won else "derrota", " (", gids, ")")
	if not won:
		bs.detach()
		leave.emit("game_over", {})
		return
	cp.after_battle(battle, true)
	if cp.is_dead("hero"):
		# Como en los clásicos: sin el protagonista no hay historia
		bs.detach()
		leave.emit("game_over", {"text": "Tus compañeros han ganado el combate, pero tú no has sobrevivido. Sin la Marca, nadie sabrá qué duerme bajo el toro…"})
		return
	bs.detach()
	bs.queue_free()
	battle_screen = null
	var gt := create_tween()
	gt.tween_method(func(a): world.set_grid_alpha(a), 0.35, 0.0, 0.8)
	world.flatten_cover(false)
	# Botín: una bolsa donde cayó el último enemigo
	var loot: Array = []
	var drop_cell := Vector2i(-1, -1)
	for gid in gids:
		var g: Dictionary = groups[gid]
		ls.dead.append(gid)
		for e in g.creatures:
			drop_cell = e.cell
			loot.append_array(_monster_drops(e))
		for e2 in g.data.get("loot", []):
			var it: String = e2[0]
			var unid: bool = Items.is_magic(it) and Items.kind(it) in ["weapon", "armor", "shield", "wondrous"]
			loot.append({"id": it, "n": int(e2[1]) if e2.size() > 1 else 1, "unid": unid})
		for e3 in g.creatures:
			var v: UnitView = views.get(e3.id)
			if v and is_instance_valid(v):
				var tw := v.create_tween()
				tw.tween_interval(1.0)
				tw.tween_callback(v.queue_free)
			views.erase(e3.id)
		groups.erase(gid)
	loot = _merge_loot(loot)
	if not loot.is_empty() and drop_cell.x >= 0:
		var did := "drop_%s" % gids[0]
		var cell := drop_cell
		if not map.walkable(cell):
			cell = _free_cells_near(cell, 1)[0]
		var od := {"id": did, "type": "loot", "cell": [cell.x, cell.y], "name": "Restos del combate"}
		if not ls.has("drops"):
			ls["drops"] = {}
		ls.drops[did] = od
		ls.loot[did] = loot
		objects[did] = od
		_refresh_object(did)
	# Los vecinos vuelven
	for n in npcs.values():
		var nv: UnitView = views.get(n.creature.id)
		if nv:
			nv.visible = true
			var tw2 := nv.create_tween()
			tw2.tween_property(nv, "scale", Vector3.ONE, 0.4)
	for c in members:
		views[c.id].show_bar = false
	await rebuild_party()
	for c in members:
		views[c.id].bar.visible = false
	in_battle = false
	busy = false
	hud.visible = true
	Game.play_music(level_music())
	var data: Dictionary = {}
	for lv in level.get("groups", []):
		if str(lv.id) == gids[0]:
			data = lv
	if data.has("flag"):
		cp.flags[str(data.flag)] = true
	if data.has("journal"):
		add_journal(str(data.journal))
	if not loot.is_empty():
		hud.toast("Han dejado algo: mirad los restos del combate.", UI.GOLD)
	if data.has("after"):
		await _narrate(data.after)
	# NPC, objetos y salidas que dependían de este combate
	_spawn_npcs()
	_load_objects()
	_update_bull_glow()
	if data.has("level_after") and int(data.level_after) > cp.party_level:
		await level_up(int(data.level_after))
	if data.has("story_after"):
		leave.emit("story", {"text": data.story_after, "title": data.get("story_title", ""), "level": level_id})
		return
	Game.save_campaign("auto")
	hud.refresh()

## Lo que lleva encima cada monstruo (monedas, armas…).
func _monster_drops(e: Creature) -> Array:
	var out: Array = []
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	var drops: Array = RulesDB.monster_data(e.template_id).get("drops", [])
	for d in drops:
		if rng.randf() <= float(d.get("chance", 1.0)):
			var n := Dice.roll_with(str(d.get("n", "1")), rng) if typeof(d.get("n", 1)) == TYPE_STRING else int(d.get("n", 1))
			if n > 0:
				out.append({"id": str(d.id), "n": n, "unid": false})
	return out

func _merge_loot(list: Array) -> Array:
	var out: Array = []
	for e in list:
		var merged := false
		if e.id == "gold" or Items.stackable(e.id) or Items.kind(e.id) == "ammo":
			for o in out:
				if o.id == e.id:
					o.n = int(o.n) + int(e.n)
					merged = true
					break
		if not merged:
			out.append(e)
	return out

# ================================================================== niveles

## Subida de nivel: el héroe elige en el creador; los compañeros suben solos.
func level_up(lvl: int) -> void:
	busy = true
	hud.show_banner("¡Nivel %d!" % lvl, UI.GOLD, 1.8)
	Game.sfx("levelup")
	await get_tree().create_timer(1.6).timeout
	var hero_sheet := cp.hero()
	if not OS.get_environment("MG_AUTO_LEVEL").is_empty():
		hero_sheet["choices_level"] = lvl   # pruebas: el héroe sube con las elecciones por defecto
	for step in range(int(hero_sheet.get("choices_level", 1)) + 1, lvl + 1):
		var cc := CharacterCreator.new()
		cc.setup_level_up(cp.hero(), step)
		_ui.add_child(cc)
		var res: Array = []
		cc.finished.connect(func(sheet: Dictionary): res.append(sheet))
		cc.cancelled.connect(func(): res.append({}))
		while res.is_empty():
			await get_tree().process_frame
		if is_instance_valid(cc):
			cc.queue_free()
		if not res[0].is_empty():
			_merge_hero(res[0])
	cp.level_up_to(lvl)
	await rebuild_party()
	Game.play_music(level_music())
	busy = false

## El creador devuelve la hoja con las elecciones nuevas; el inventario se conserva.
func _merge_hero(sheet: Dictionary) -> void:
	var old := cp.hero()
	var s := sheet.duplicate(true)
	for k in ["id", "weapons", "armor", "shield", "shield_id", "worn", "pack", "items", "ammo", "charges", "kit"]:
		if old.has(k):
			s[k] = old[k]
	cp.members["hero"] = s
	Game.hero = s

# ================================================================== pantallas

func _on_hud_action(kind: String) -> void:
	if in_battle or busy:
		return
	match kind:
		"inventory":
			open_inventory(leader)
		"stealth":
			toggle_stealth()
		"search":
			search()
		"rest":
			open_rest()
		"journal":
			open_journal()

func open_inventory(id: String) -> void:
	if in_battle:
		return
	_stop_all()
	var inv := InventoryScreen.new()
	inv.setup(cp, id if not id.is_empty() else leader, members)
	_ui.add_child(inv)
	busy = true
	await inv.closed
	busy = false
	rebuild_party()

func open_shop(shop_id: String, nid: String) -> void:
	var sh := ShopScreen.new()
	sh.setup(cp, shop_id, leader, npcs.get(nid, {}).get("creature"))
	_ui.add_child(sh)
	busy = true
	await sh.closed
	busy = false
	rebuild_party()

func open_journal() -> void:
	var txt := ""
	if cp.journal.is_empty():
		txt = "[color=#bfb3a0]Todavía no hay nada anotado.[/color]"
	for i in range(cp.journal.size() - 1, -1, -1):
		txt += "• %s\n\n" % cp.journal[i]
	var r := UI.rich(txt.strip_edges(), 20)
	Modal.open(_ui, "Diario", r, 760)

func open_menu() -> void:
	if in_battle:
		return
	_stop_all()
	busy = true
	var menu := PauseMenu.new()
	menu.context = "explore"
	_ui.add_child(menu)
	var choice: String = await menu.closed
	busy = false
	match choice:
		"save":
			var ss := SaveScreen.new()
			ss.mode = "save"
			_ui.add_child(ss)
		"load":
			leave.emit("load", {})
		"exit":
			leave.emit("menu", {})

func _update_bull_glow() -> void:
	if world.bull_light:
		world.bull_light.light_energy = 0.0 if cp.flags.has("camp_done") else 0.9
		world.bull_light.set_meta("base_energy", world.bull_light.light_energy)
