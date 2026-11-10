class_name ModelLibrary
extends Object
## Carga y prepara los modelos 3D (personajes, criaturas y props) con su escala y armas.

const CELL := 1.0
const CHAR_SCALE := 0.56

const CHAR_SCENES := {
	"knight": "res://assets/models/characters/Knight.glb",
	"rogue": "res://assets/models/characters/Rogue.glb",
	"rogue_hooded": "res://assets/models/characters/Rogue_Hooded.glb",
	"mage": "res://assets/models/characters/Mage.glb",
	"barbarian": "res://assets/models/characters/Barbarian.glb",
	"skeleton_warrior": "res://assets/models/characters/Skeleton_Warrior.glb",
	"skeleton_minion": "res://assets/models/characters/Skeleton_Minion.glb",
	"skeleton_rogue": "res://assets/models/characters/Skeleton_Rogue.glb",
	"skeleton_mage": "res://assets/models/characters/Skeleton_Mage.glb",
}
const CREATURE_SCENES := {
	"goblin_minion": "res://assets/models/creatures/Orc.gltf",
	"goblin_warrior": "res://assets/models/creatures/Orc.gltf",
	"goblin_archer": "res://assets/models/creatures/Tribal.gltf",
	"goblin_boss": "res://assets/models/creatures/Orc_Skull.gltf",
	"wolf": "res://assets/models/creatures/Wolf.gltf",
	"bull": "res://assets/models/creatures/Bull.gltf",
	"mastiff": "res://assets/models/creatures/Husky.gltf",
	"elk": "res://assets/models/creatures/Stag.gltf",
	"horse": "res://assets/models/creatures/Horse.gltf",
}
const ANIMAL_SCALE := {"wolf": 0.24, "bull": 0.3, "mastiff": 0.21, "elk": 0.3, "horse": 0.27}
const WEAPON_SCENES := {
	"blade": "res://assets/models/weapons/Skeleton_Blade.gltf",
	"skel_axe": "res://assets/models/weapons/Skeleton_Axe.gltf",
	"skel_shield": "res://assets/models/weapons/Skeleton_Shield_Small_A.gltf",
	"skel_shield_large": "res://assets/models/weapons/Skeleton_Shield_Large_A.gltf",
	"skel_crossbow": "res://assets/models/weapons/Skeleton_Crossbow.gltf",
	"skel_staff": "res://assets/models/weapons/Skeleton_Staff.gltf",
}
const RETEXTURE := {
	"cleric": "res://assets/models/textures/rogue_ilyra.png",
	"pip": "res://assets/models/textures/rogue_pip.png",
}

static var _scene_cache: Dictionary = {}

static func scene(path: String) -> PackedScene:
	if _scene_cache.has(path):
		return _scene_cache[path]
	var ps: PackedScene = load(path)
	_scene_cache[path] = ps
	return ps

## Familia de animaciones del modelo: "kaykit", "quat_monster" o "quat_animal".
static func family_of(model: String) -> String:
	if model in CHAR_SCENES:
		return "kaykit"
	if ANIMAL_SCALE.has(model):
		return "quat_animal"
	return "quat_monster"

## Crea el nodo visual de una criatura según su configuración `visual`.
static func make_creature_model(c: Creature) -> Node3D:
	var v: Dictionary = c.visual
	if v.get("hero", false):
		return make_hero_model(v)
	var model: String = v.get("model", "knight")
	var root := Node3D.new()
	root.name = "Model"
	var inst: Node3D
	if model == "goblin":
		var key := "goblin_" + str(v.get("variant", "warrior"))
		inst = scene(CREATURE_SCENES.get(key, CREATURE_SCENES.goblin_warrior)).instantiate()
		inst.scale = Vector3.ONE * (0.33 if key != "goblin_boss" else 0.38)
		inst.set_meta("family", "quat_monster")
		_tint(inst, _goblin_tint(key))
	elif CREATURE_SCENES.has(model):
		inst = scene(CREATURE_SCENES[model]).instantiate()
		inst.scale = Vector3.ONE * float(ANIMAL_SCALE.get(model, 0.3))
		inst.set_meta("family", "quat_animal")
	else:
		inst = scene(CHAR_SCENES.get(model, CHAR_SCENES.knight)).instantiate()
		inst.scale = Vector3.ONE * CHAR_SCALE * float(v.get("scale", 1.0))
		inst.set_meta("family", "kaykit")
		_setup_kaykit_loadout(inst, v, model)
		if v.has("recolor"):
			_retexture(inst, RETEXTURE.get(v.recolor, ""))
		elif c.template_id == "pip":
			_retexture(inst, RETEXTURE.pip)
	if v.has("tint"):
		var t: Array = v.tint
		_tint(inst, Color(t[0], t[1], t[2]))
	if c.size == "small" and model != "goblin":
		inst.scale *= 0.92
	root.add_child(inst)
	return root

static func _goblin_tint(key: String) -> Color:
	match key:
		"goblin_minion":
			return Color(0.85, 0.95, 0.75)
		"goblin_archer":
			return Color(0.95, 0.9, 0.8)
	return Color(1, 1, 1)

## Deja visibles solo las armas configuradas en las manos.
static func _setup_kaykit_loadout(inst: Node3D, v: Dictionary, model: String) -> void:
	var keep: Array = []
	for k in ["weapon_r", "weapon_l", "shield_l"]:
		if v.has(k):
			keep.append(v[k])
	var ranged: String = v.get("ranged", "")
	var skel: Skeleton3D = inst.find_child("Skeleton3D", true, false)
	for slot_name in ["handslot_r", "handslot_l"]:
		var slot: Node = inst.find_child(slot_name, true, false)
		if slot == null:
			continue
		for ch in slot.get_children():
			if ch is MeshInstance3D:
				ch.visible = ch.name in keep
				if ch.name == ranged:
					ch.set_meta("ranged_weapon", true)
	# Armas que el modelo no trae: espada y escudo del caballero, armas de esqueleto
	if str(v.get("weapon_r", "")) == "sword_from_knight" or str(v.get("shield_l", "")) == "shield_from_knight":
		var knight: Node3D = scene(CHAR_SCENES.knight).instantiate()
		_borrow_mesh(knight, inst, "handslot_r", "1H_Sword")
		_borrow_mesh(knight, inst, "handslot_l", "Badge_Shield")
		knight.free()
	for k in ["weapon_r", "shield_l"]:
		var wkey: String = v.get(k, "")
		if WEAPON_SCENES.has(wkey):
			var w: Node3D = scene(WEAPON_SCENES[wkey]).instantiate()
			var bone := "handslot.r" if k == "weapon_r" else "handslot.l"
			if skel:
				var att := BoneAttachment3D.new()
				att.bone_name = bone
				skel.add_child(att)
				att.add_child(w)
	# Cabeza sin casco para el arquero esqueleto no hace falta; nada más

static func _borrow_mesh(from_root: Node3D, to_root: Node3D, slot_name: String, mesh_name: String) -> void:
	var src_slot: Node = from_root.find_child(slot_name, true, false)
	var dst_slot: Node = to_root.find_child(slot_name, true, false)
	if src_slot == null or dst_slot == null:
		return
	var src: MeshInstance3D = src_slot.find_child(mesh_name, false, false)
	if src == null:
		return
	var m := MeshInstance3D.new()
	m.name = mesh_name
	m.mesh = src.mesh
	m.transform = src.transform
	for i in src.get_surface_override_material_count():
		m.set_surface_override_material(i, src.get_surface_override_material(i))
	dst_slot.add_child(m)

static func _retexture(inst: Node3D, tex_path: String) -> void:
	if tex_path.is_empty():
		return
	var tex: Texture2D = load(tex_path)
	for mi in inst.find_children("*", "MeshInstance3D", true, false):
		var mesh: Mesh = mi.mesh
		if mesh == null:
			continue
		for s in mesh.get_surface_count():
			var mat = mi.get_active_material(s)
			if mat is StandardMaterial3D and mat.albedo_texture != null:
				var path: String = mat.albedo_texture.resource_path
				if "rogue" in path.to_lower() or "rogue" in str(mi.name).to_lower() or "Rogue" in str(inst.name):
					var m2: StandardMaterial3D = mat.duplicate()
					m2.albedo_texture = tex
					mi.set_surface_override_material(s, m2)

static func _tint(inst: Node3D, color: Color) -> void:
	if color == Color(1, 1, 1):
		return
	for mi in inst.find_children("*", "MeshInstance3D", true, false):
		var mesh: Mesh = mi.mesh
		if mesh == null:
			continue
		for s in mesh.get_surface_count():
			var mat = mi.get_active_material(s)
			if mat is StandardMaterial3D:
				var m2: StandardMaterial3D = mat.duplicate()
				m2.albedo_color = m2.albedo_color * color
				mi.set_surface_override_material(s, m2)

# ------------------------------------------------------------------ animaciones

const ANIMS := {
	"kaykit": {
		"idle": ["Idle"], "combat_idle": ["2H_Melee_Idle", "Idle"], "walk": ["Walking_A"], "run": ["Running_A"],
		"attack_melee": ["1H_Melee_Attack_Chop", "1H_Melee_Attack_Slice_Diagonal", "1H_Melee_Attack_Stab"],
		"attack_2h": ["2H_Melee_Attack_Chop", "2H_Melee_Attack_Slice"],
		"attack_ranged": ["2H_Ranged_Shoot"], "attack_ranged_1h": ["1H_Ranged_Shoot"], "throw": ["Throw"],
		"cast": ["Spellcast_Shoot"], "cast_buff": ["Spellcast_Raise"], "cast_long": ["Spellcast_Long"],
		"hit": ["Hit_A", "Hit_B"], "block": ["Block_Hit", "Block"], "dodge": ["Dodge_Backward"],
		"death": ["Death_A", "Death_B"], "down": ["Death_A"], "revive": ["Lie_StandUp"],
		"cheer": ["Cheer"], "use": ["Use_Item"], "interact": ["Interact"], "taunt": ["Taunt", "Cheer"],
		"awaken": ["Skeletons_Awaken_Standing"],
	},
	"quat_monster": {
		"idle": ["Idle"], "combat_idle": ["Idle"], "walk": ["Walk"], "run": ["Run"],
		"attack_melee": ["Weapon", "Punch"], "attack_2h": ["Weapon"], "attack_ranged": ["Punch"], "attack_ranged_1h": ["Punch"], "throw": ["Punch"],
		"cast": ["Wave"], "cast_buff": ["Yes"], "cast_long": ["Wave"],
		"hit": ["HitReact"], "block": ["HitReact"], "dodge": ["Duck"],
		"death": ["Death"], "down": ["Death"], "revive": ["Idle"], "cheer": ["Yes", "Jump"], "use": ["Yes"], "interact": ["Yes"], "taunt": ["Wave"],
		"awaken": ["Idle"],
	},
	"quat_animal": {
		"idle": ["Idle", "Idle_2"], "combat_idle": ["Idle"], "walk": ["Walk"], "run": ["Gallop"],
		"attack_melee": ["Attack", "Attack_Headbutt"], "attack_2h": ["Attack"], "attack_ranged": ["Attack"], "attack_ranged_1h": ["Attack"], "throw": ["Attack"],
		"cast": ["Idle"], "cast_buff": ["Idle"], "cast_long": ["Idle"],
		"hit": ["Idle_HitReact1", "Idle_HitReact2"], "block": ["Idle_HitReact1"], "dodge": ["Idle_HitReact2"],
		"death": ["Death"], "down": ["Death"], "revive": ["Idle"], "cheer": ["Idle_2"], "use": ["Idle"], "interact": ["Idle"], "taunt": ["Idle_2"],
		"awaken": ["Idle"],
	},
}

static func anim_name(family: String, action: String, ap: AnimationPlayer, variant: int = 0) -> String:
	var opts: Array = ANIMS.get(family, ANIMS.kaykit).get(action, ["Idle"])
	var valid: Array = []
	for o in opts:
		if ap.has_animation(o):
			valid.append(o)
	if valid.is_empty():
		return ""
	return valid[variant % valid.size()]

# ------------------------------------------------------------------ props

const PROPS := {
	"house_a": {"path": "res://assets/models/village/building_home_A_red.gltf", "fit": 2.6},
	"house_b": {"path": "res://assets/models/village/building_home_B_red.gltf", "fit": 2.6},
	"house_c": {"path": "res://assets/models/village/building_home_A_yellow.gltf", "fit": 2.6},
	"house_d": {"path": "res://assets/models/village/building_home_B_yellow.gltf", "fit": 2.6},
	"tavern": {"path": "res://assets/models/village/building_tavern_red.gltf", "fit": 3.2},
	"church": {"path": "res://assets/models/village/building_church_red.gltf", "fit": 3.4},
	"blacksmith": {"path": "res://assets/models/village/building_blacksmith_red.gltf", "fit": 2.8},
	"well": {"path": "res://assets/models/village/building_well_red.gltf", "fit": 1.3},
	"fence": {"path": "res://assets/models/village/fence_wood_straight.gltf", "fit": 1.05, "axis": "z"},
	"fence_stone": {"path": "res://assets/models/village/fence_stone_straight.gltf", "fit": 1.05, "axis": "z"},
	"barrel": {"path": "res://assets/models/village/barrel.gltf", "fit": 0.55},
	"crate": {"path": "res://assets/models/village/crate_A_big.gltf", "fit": 0.6},
	"crate_b": {"path": "res://assets/models/village/crate_B_big.gltf", "fit": 0.6},
	"sack": {"path": "res://assets/models/village/sack.gltf", "fit": 0.45},
	"wheelbarrow": {"path": "res://assets/models/village/wheelbarrow.gltf", "fit": 0.9},
	"lumber": {"path": "res://assets/models/village/resource_lumber.gltf", "fit": 0.9},
	"market": {"path": "res://assets/models/village/building_market_red.gltf", "fit": 2.6},
	"windmill": {"path": "res://assets/models/village/building_windmill_red.gltf", "fit": 3.0},
	"watermill": {"path": "res://assets/models/village/building_watermill_red.gltf", "fit": 3.0},
	"mine": {"path": "res://assets/models/village/building_mine_red.gltf", "fit": 3.0},
	"lumbermill": {"path": "res://assets/models/village/building_lumbermill_red.gltf", "fit": 3.0},
	"tower": {"path": "res://assets/models/village/building_tower_A_red.gltf", "fit": 2.2},
	"grain": {"path": "res://assets/models/village/building_grain.gltf", "fit": 2.4},
	"ruin": {"path": "res://assets/models/village/building_destroyed.gltf", "fit": 2.6},
	"stage": {"path": "res://assets/models/village/building_stage_A.gltf", "fit": 2.4},
	"bridge": {"path": "res://assets/models/village/building_bridge_A.gltf", "fit": 3.0},
	"house_blue": {"path": "res://assets/models/village/building_home_A_blue.gltf", "fit": 2.6},
	"house_green": {"path": "res://assets/models/village/building_home_B_green.gltf", "fit": 2.6},
	"dirt_yard": {"path": "res://assets/models/village/building_dirt.gltf", "fit": 2.0},
	"gate": {"path": "res://assets/models/village/fence_wood_straight_gate.gltf", "fit": 1.05, "axis": "z"},
	"crate_open": {"path": "res://assets/models/village/crate_open.gltf", "fit": 0.6},
	"crate_small": {"path": "res://assets/models/village/crate_A_small.gltf", "fit": 0.4},
	"arrows_bucket": {"path": "res://assets/models/village/bucket_arrows.gltf", "fit": 0.4},
	"bucket": {"path": "res://assets/models/village/bucket_water.gltf", "fit": 0.4},
	"flag": {"path": "res://assets/models/village/flag_red.gltf", "height": 1.8},
	"target": {"path": "res://assets/models/village/target.gltf", "height": 1.0},
	"pallet": {"path": "res://assets/models/village/pallet.gltf", "fit": 0.8},
	"stump": {"path": "res://assets/models/village/tree_single_A_cut.gltf", "fit": 0.7},
	"stumps": {"path": "res://assets/models/village/trees_A_cut.gltf", "fit": 1.6},
	"stones": {"path": "res://assets/models/village/resource_stone.gltf", "fit": 0.9},
	"tent": {"path": "res://assets/models/village/tent.gltf", "fit": 1.6},
	"weaponrack": {"path": "res://assets/models/village/weaponrack.gltf", "fit": 0.9},
	"crate_long": {"path": "res://assets/models/village/crate_long_A.gltf", "fit": 0.9},
	"tree": {"path": "res://assets/models/nature/tree_single_A.gltf", "height": 2.4},
	"tree_b": {"path": "res://assets/models/nature/tree_single_B.gltf", "height": 2.6},
	"trees_cluster": {"path": "res://assets/models/nature/trees_B_large.gltf", "fit": 3.4},
	"trees_cluster_a": {"path": "res://assets/models/nature/trees_A_large.gltf", "fit": 3.4},
	"trees_med": {"path": "res://assets/models/nature/trees_B_medium.gltf", "fit": 2.6},
	"rock_a": {"path": "res://assets/models/nature/rock_single_A.gltf", "fit": 0.9},
	"rock_b": {"path": "res://assets/models/nature/rock_single_B.gltf", "fit": 0.9},
	"rock_c": {"path": "res://assets/models/nature/rock_single_C.gltf", "fit": 0.9},
	"rock_d": {"path": "res://assets/models/nature/rock_single_D.gltf", "fit": 0.9},
	"rock_e": {"path": "res://assets/models/nature/rock_single_E.gltf", "fit": 0.9},
	"hill": {"path": "res://assets/models/nature/hill_single_A.gltf", "fit": 3.0},
	"mountain": {"path": "res://assets/models/nature/mountain_A_grass_trees.gltf", "fit": 7.0},
	"mountain_b": {"path": "res://assets/models/nature/mountain_B_grass_trees.gltf", "fit": 7.0},
	"waterplant": {"path": "res://assets/models/nature/waterplant_A.gltf", "fit": 0.6},
	"waterlily": {"path": "res://assets/models/nature/waterlily_A.gltf", "fit": 0.45, "shadow": false},
	"reeds": {"path": "res://assets/models/qnature/Grass_Wispy_Tall.gltf", "height": 0.62, "foliage": true, "sway": 0.06, "sway_ref": 0.6, "shadow": false, "tint": [0.85, 1.0, 0.8]},
	"pillar": {"path": "res://assets/models/dungeon/pillar.glb", "fit": 0.95},
	"pillar_deco": {"path": "res://assets/models/dungeon/pillar_decorated.glb", "fit": 0.95},
	"column": {"path": "res://assets/models/dungeon/column.glb", "fit": 0.95},
	"rubble": {"path": "res://assets/models/dungeon/rubble_half.glb", "fit": 0.95},
	"rubble_large": {"path": "res://assets/models/dungeon/rubble_large.glb", "fit": 1.6},
	"torch_wall": {"path": "res://assets/models/dungeon/torch_mounted.glb", "height": 0.55},
	"torch": {"path": "res://assets/models/dungeon/torch_lit.glb", "height": 0.9},
	"candles": {"path": "res://assets/models/dungeon/candle_triple.glb", "fit": 0.35},
	"barrel_d": {"path": "res://assets/models/dungeon/barrel_large.glb", "fit": 0.6},
	"chest": {"path": "res://assets/models/dungeon/chest.glb", "fit": 0.7},
	"banner": {"path": "res://assets/models/dungeon/banner_patternA_red.glb", "height": 1.4},
	"banner_thin": {"path": "res://assets/models/dungeon/banner_thin_red.glb", "height": 1.05},
	"coffin": {"path": "res://assets/models/dungeon/coffin_decorated.gltf", "fit": 0.95},
	"coffin_plain": {"path": "res://assets/models/dungeon/coffin.gltf", "fit": 0.95},
	"gravestone": {"path": "res://assets/models/dungeon/gravestone.gltf", "fit": 0.8},
	"grave": {"path": "res://assets/models/dungeon/grave_A.gltf", "fit": 0.95},
	"skull": {"path": "res://assets/models/dungeon/skull.gltf", "fit": 0.22},
	"bones": {"path": "res://assets/models/dungeon/bone_A.gltf", "fit": 0.35},
	"ribcage": {"path": "res://assets/models/dungeon/ribcage.gltf", "fit": 0.4},
	"shrine": {"path": "res://assets/models/dungeon/shrine_candles.gltf", "fit": 0.9},
	"lantern": {"path": "res://assets/models/dungeon/lantern_standing.gltf", "height": 0.9},
	"dead_tree": {"path": "res://assets/models/dungeon/tree_dead_large.gltf", "height": 2.4},
	# --- Naturaleza estilizada (Quaternius, CC0): árboles con viento
	"pine_1": {"path": "res://assets/models/qnature/Pine_1.gltf", "height": 3.4, "foliage": true, "sway": 0.05, "sway_ref": 3.4, "tint": [0.92, 0.95, 0.85], "up_normal": 0.3},
	"pine_2": {"path": "res://assets/models/qnature/Pine_2.gltf", "height": 3.3, "foliage": true, "sway": 0.05, "sway_ref": 3.4, "tint": [0.92, 0.95, 0.85], "up_normal": 0.3},
	"pine_3": {"path": "res://assets/models/qnature/Pine_3.gltf", "height": 3.7, "foliage": true, "sway": 0.05, "sway_ref": 3.4, "tint": [0.92, 0.95, 0.85], "up_normal": 0.3},
	"pine_4": {"path": "res://assets/models/qnature/Pine_4.gltf", "height": 4.3, "foliage": true, "sway": 0.05, "sway_ref": 3.4, "tint": [0.92, 0.95, 0.85], "up_normal": 0.3},
	"pine_5": {"path": "res://assets/models/qnature/Pine_5.gltf", "height": 3.8, "foliage": true, "sway": 0.05, "sway_ref": 3.4, "tint": [0.92, 0.95, 0.85], "up_normal": 0.3},
	"oak_1": {"path": "res://assets/models/qnature/CommonTree_1.gltf", "height": 3.2, "foliage": true, "sway": 0.06, "sway_ref": 3.2, "tint": [1.0, 1.0, 0.9], "up_normal": 0.35},
	"oak_2": {"path": "res://assets/models/qnature/CommonTree_2.gltf", "height": 3.3, "foliage": true, "sway": 0.06, "sway_ref": 3.2, "tint": [1.0, 1.0, 0.9], "up_normal": 0.35},
	"oak_3": {"path": "res://assets/models/qnature/CommonTree_3.gltf", "height": 3.9, "foliage": true, "sway": 0.06, "sway_ref": 3.2, "tint": [1.0, 1.0, 0.9], "up_normal": 0.35},
	"oak_4": {"path": "res://assets/models/qnature/CommonTree_4.gltf", "height": 3.9, "foliage": true, "sway": 0.06, "sway_ref": 3.2, "tint": [1.0, 1.0, 0.9], "up_normal": 0.35},
	"oak_5": {"path": "res://assets/models/qnature/CommonTree_5.gltf", "height": 3.1, "foliage": true, "sway": 0.06, "sway_ref": 3.2, "tint": [1.0, 1.0, 0.9], "up_normal": 0.35},
	"deadtree_1": {"path": "res://assets/models/qnature/DeadTree_1.gltf", "height": 3.0, "foliage": true, "sway": 0.02, "sway_ref": 3.0},
	"deadtree_2": {"path": "res://assets/models/qnature/DeadTree_2.gltf", "height": 3.4, "foliage": true, "sway": 0.02, "sway_ref": 3.0},
	"deadtree_3": {"path": "res://assets/models/qnature/DeadTree_3.gltf", "height": 3.6, "foliage": true, "sway": 0.02, "sway_ref": 3.0},
	"twisted": {"path": "res://assets/models/qnature/TwistedTree_1.gltf", "height": 4.6, "foliage": true, "sway": 0.05, "sway_ref": 4.0},
	# --- Cubierta del suelo (en lote, sin sombra)
	"gpatch_0": {"proc": "grass", "variant": 0, "shadow": false},
	"gpatch_1": {"proc": "grass", "variant": 1, "shadow": false},
	"gpatch_2": {"proc": "grass", "variant": 2, "shadow": false},
	"gpatch_3": {"proc": "grass", "variant": 3, "shadow": false},
	"wheat_patch": {"proc": "grass", "variant": 4, "shadow": false},
	"gpatch": {"proc": "grass", "variant": 5, "shadow": false},
	"grass_s": {"path": "res://assets/models/qnature/Grass_Common_Short.gltf", "height": 0.3, "foliage": true, "sway": 0.05, "sway_ref": 0.35, "shadow": false},
	"grass_t": {"path": "res://assets/models/qnature/Grass_Common_Tall.gltf", "height": 0.42, "foliage": true, "sway": 0.06, "sway_ref": 0.4, "shadow": false},
	"grass_ws": {"path": "res://assets/models/qnature/Grass_Wispy_Short.gltf", "height": 0.26, "foliage": true, "sway": 0.05, "sway_ref": 0.35, "shadow": false},
	"grass_wt": {"path": "res://assets/models/qnature/Grass_Wispy_Tall.gltf", "height": 0.4, "foliage": true, "sway": 0.06, "sway_ref": 0.4, "shadow": false},
	"clover": {"path": "res://assets/models/qnature/Clover_1.gltf", "height": 0.18, "foliage": true, "sway": 0.02, "sway_ref": 0.2, "shadow": false},
	"clover_b": {"path": "res://assets/models/qnature/Clover_2.gltf", "height": 0.2, "foliage": true, "sway": 0.02, "sway_ref": 0.2, "shadow": false},
	"flowers_a": {"path": "res://assets/models/qnature/Flower_3_Group.gltf", "height": 0.34, "foliage": true, "sway": 0.05, "sway_ref": 0.35, "shadow": false},
	"flowers_b": {"path": "res://assets/models/qnature/Flower_4_Group.gltf", "height": 0.38, "foliage": true, "sway": 0.05, "sway_ref": 0.35, "shadow": false},
	"flower_a": {"path": "res://assets/models/qnature/Flower_3_Single.gltf", "height": 0.32, "foliage": true, "sway": 0.05, "sway_ref": 0.35, "shadow": false},
	"flower_b": {"path": "res://assets/models/qnature/Flower_4_Single.gltf", "height": 0.36, "foliage": true, "sway": 0.05, "sway_ref": 0.35, "shadow": false},
	"fern": {"path": "res://assets/models/qnature/Fern_1.gltf", "fit": 0.95, "foliage": true, "sway": 0.03, "sway_ref": 0.3, "shadow": false},
	"plant_1": {"path": "res://assets/models/qnature/Plant_1.gltf", "height": 0.28, "foliage": true, "sway": 0.03, "sway_ref": 0.3, "shadow": false},
	"plant_7": {"path": "res://assets/models/qnature/Plant_7.gltf", "fit": 0.45, "foliage": true, "sway": 0.0, "sway_ref": 1.0, "shadow": false},
	"plant_7b": {"path": "res://assets/models/qnature/Plant_7_Big.gltf", "fit": 0.6, "foliage": true, "sway": 0.0, "sway_ref": 1.0, "shadow": false},
	"bush_q": {"path": "res://assets/models/qnature/Bush_Common.gltf", "height": 0.6, "foliage": true, "sway": 0.03, "sway_ref": 0.6, "leaf_tex": "res://assets/models/qnature/tex/Leaves_NormalTree_C.png", "tint": [1.15, 1.2, 1.0]},
	"bush_qf": {"path": "res://assets/models/qnature/Bush_Common_Flowers.gltf", "height": 0.6, "foliage": true, "sway": 0.03, "sway_ref": 0.6, "tint": [1.15, 1.2, 1.0]},
	"mushroom": {"path": "res://assets/models/qnature/Mushroom_Common.gltf", "height": 0.12, "shadow": false},
	"mushroom_shelf": {"path": "res://assets/models/qnature/Mushroom_Laetiporus.gltf", "height": 0.16, "shadow": false},
	"pebble_1": {"path": "res://assets/models/qnature/Pebble_Round_1.gltf", "fit": 0.16, "shadow": false},
	"pebble_2": {"path": "res://assets/models/qnature/Pebble_Round_3.gltf", "fit": 0.14, "shadow": false},
	"pebble_3": {"path": "res://assets/models/qnature/Pebble_Square_1.gltf", "fit": 0.15, "shadow": false},
	"pebble_4": {"path": "res://assets/models/qnature/Pebble_Square_3.gltf", "fit": 0.13, "shadow": false},
	"stepstone_1": {"path": "res://assets/models/qnature/RockPath_Round_Small_1.gltf", "fit": 0.62, "shadow": false},
	"stepstone_2": {"path": "res://assets/models/qnature/RockPath_Round_Small_2.gltf", "fit": 0.6, "shadow": false},
	"stepstone_3": {"path": "res://assets/models/qnature/RockPath_Square_Small_1.gltf", "fit": 0.58, "shadow": false},
	"rock_m1": {"path": "res://assets/models/qnature/Rock_Medium_1.gltf", "fit": 0.95},
	"rock_m2": {"path": "res://assets/models/qnature/Rock_Medium_2.gltf", "fit": 0.9},
	"rock_m3": {"path": "res://assets/models/qnature/Rock_Medium_3.gltf", "fit": 0.95},
	# --- Atrezo de aldea (Quaternius Fantasy Props y Medieval Village, CC0)
	"q_barrel": {"path": "res://assets/models/qprops/Barrel.gltf", "height": 0.55},
	"q_barrel_apples": {"path": "res://assets/models/qprops/Barrel_Apples.gltf", "height": 0.55},
	"q_barrel_holder": {"path": "res://assets/models/qprops/Barrel_Holder.gltf", "fit": 0.9},
	"q_bench": {"path": "res://assets/models/qprops/Bench.gltf", "fit": 1.2},
	"q_bucket": {"path": "res://assets/models/qprops/Bucket_Wooden_1.gltf", "fit": 0.3},
	"q_cage": {"path": "res://assets/models/qprops/Cage_Small.gltf", "fit": 0.5},
	"q_candles": {"path": "res://assets/models/qprops/CandleStick_Stand.gltf", "height": 0.85},
	"q_candles3": {"path": "res://assets/models/qprops/CandleStick_Triple.gltf", "height": 0.3},
	"q_cauldron": {"path": "res://assets/models/qprops/Cauldron.gltf", "fit": 0.6},
	"q_chain": {"path": "res://assets/models/qprops/Chain_Coil.gltf", "fit": 0.55},
	"q_chest": {"path": "res://assets/models/qprops/Chest_Wood.gltf", "fit": 0.75},
	"q_coins": {"path": "res://assets/models/qprops/Coin_Pile.gltf", "fit": 0.22},
	"q_coins2": {"path": "res://assets/models/qprops/Coin_Pile_2.gltf", "fit": 0.3},
	"q_crate": {"path": "res://assets/models/qprops/Crate_Wooden.gltf", "fit": 0.6},
	"q_crate_metal": {"path": "res://assets/models/qprops/Crate_Metal.gltf", "fit": 0.55},
	"q_dummy": {"path": "res://assets/models/qprops/Dummy.gltf", "height": 1.15},
	"q_farmcrate_apple": {"path": "res://assets/models/qprops/FarmCrate_Apple.gltf", "fit": 0.5},
	"q_farmcrate_carrot": {"path": "res://assets/models/qprops/FarmCrate_Carrot.gltf", "fit": 0.5},
	"q_farmcrate": {"path": "res://assets/models/qprops/FarmCrate_Empty.gltf", "fit": 0.5},
	"q_lantern": {"path": "res://assets/models/qprops/Lantern_Wall.gltf", "height": 0.7},
	"q_pot": {"path": "res://assets/models/qprops/Pot_1_Lid.gltf", "fit": 0.35},
	"q_rope": {"path": "res://assets/models/qprops/Rope_3.gltf", "fit": 0.6},
	"q_shield": {"path": "res://assets/models/qprops/Shield_Wooden.gltf", "fit": 0.4},
	"q_stall_cart": {"path": "res://assets/models/qprops/Stall_Cart_Empty.gltf", "fit": 1.8},
	"q_stall": {"path": "res://assets/models/qprops/Stall_Empty.gltf", "fit": 1.3},
	"q_stool": {"path": "res://assets/models/qprops/Stool.gltf", "height": 0.35},
	"q_table": {"path": "res://assets/models/qprops/Table_Large.gltf", "fit": 1.5},
	"q_torch": {"path": "res://assets/models/qprops/Torch_Metal.gltf", "height": 0.45},
	"q_vase": {"path": "res://assets/models/qprops/Vase_2.gltf", "height": 0.38},
	"q_vase_s": {"path": "res://assets/models/qprops/Vase_4.gltf", "height": 0.32},
	"q_vase_rubble": {"path": "res://assets/models/qprops/Vase_Rubble_Medium.gltf", "fit": 0.5},
	"q_weaponstand": {"path": "res://assets/models/qprops/WeaponStand.gltf", "fit": 0.9},
	"q_whetstone": {"path": "res://assets/models/qprops/Whetstone.gltf", "fit": 0.75},
	"q_workbench": {"path": "res://assets/models/qprops/Workbench.gltf", "fit": 1.2},
	"q_anvil": {"path": "res://assets/models/qprops/Anvil_Log.gltf", "height": 0.62},
	"q_bag": {"path": "res://assets/models/qprops/Bag.gltf", "height": 0.42},
	"q_banner": {"path": "res://assets/models/qprops/Banner_1.gltf", "height": 1.5},
	"q_banner2": {"path": "res://assets/models/qprops/Banner_2.gltf", "height": 1.4},
	"q_pickaxe": {"path": "res://assets/models/qprops/Pickaxe_Bronze.gltf", "height": 0.55},
	"q_axe": {"path": "res://assets/models/qprops/Axe_Bronze.gltf", "fit": 0.5},
	"q_chair": {"path": "res://assets/models/qprops/Chair_1.gltf", "height": 0.6},
	"wagon": {"path": "res://assets/models/qvillage/Prop_Wagon.gltf", "fit": 1.7},
	"q_fence": {"path": "res://assets/models/qvillage/Prop_WoodenFence_Single.gltf", "fit": 1.05},
	"q_fence_b": {"path": "res://assets/models/qvillage/Prop_WoodenFence_Extension1.gltf", "fit": 1.05},
	"vine_1": {"path": "res://assets/models/qvillage/Prop_Vine1.gltf", "height": 1.0, "foliage": true, "sway": 0.01, "sway_ref": 1.0},
	"vine_2": {"path": "res://assets/models/qvillage/Prop_Vine4.gltf", "height": 1.0, "foliage": true, "sway": 0.01, "sway_ref": 1.0},
	# --- Huerta (Quaternius Crops, CC0)
	"pumpkin": {"path": "res://assets/models/farm/Pumpkin_3.fbx", "fit": 0.4},
	"cabbage": {"path": "res://assets/models/farm/Lettuce_4.fbx", "fit": 0.3, "shadow": false},
	"carrots": {"path": "res://assets/models/farm/Carrot_3.fbx", "height": 0.25, "shadow": false},
}

static var _aabb_cache: Dictionary = {}

## Proporción radio/altura de un prop (para saber cuánto tapa un árbol en pantalla).
static func prop_spread(key: String) -> float:
	if not _aabb_cache.has(key):
		make_prop(key).free()
	var a: AABB = _aabb_cache.get(key, AABB(Vector3.ZERO, Vector3.ONE))
	return maxf(a.size.x, a.size.z) * 0.5 / maxf(a.size.y, 0.001)

## Instancia un prop ajustado: "fit" = tamaño máximo en planta (casillas), "height" = altura.
static func make_prop(key: String) -> Node3D:
	var def: Dictionary = PROPS.get(key, {})
	if def.is_empty():
		return Node3D.new()
	if def.has("proc"):
		var pm := MeshInstance3D.new()
		pm.mesh = grass_patch_mesh(int(def.get("variant", 0)))
		pm.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		var ph := Node3D.new()
		ph.name = key
		ph.add_child(pm)
		return ph
	var inst: Node3D = scene(def.path).instantiate()
	if def.get("foliage", false):
		_apply_foliage(inst, key, def)
	# Lo pequeño no proyecta sombra (ahorra una pasada de dibujo por pieza en el móvil)
	var small: bool = float(def.get("height", 9.0)) < 0.5 or float(def.get("fit", 9.0)) < 0.5
	if not def.get("shadow", not small):
		for mi in inst.find_children("*", "MeshInstance3D", true, false):
			(mi as MeshInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	var aabb: AABB
	if _aabb_cache.has(key):
		aabb = _aabb_cache[key]
	else:
		aabb = _local_aabb(inst)
		_aabb_cache[key] = aabb
	var s := 1.0
	if def.has("height"):
		s = float(def.height) / max(0.001, aabb.size.y)
	elif def.has("fit"):
		s = float(def.fit) / max(0.001, max(aabb.size.x, aabb.size.z))
	inst.scale = Vector3.ONE * s
	# Centrar en planta y apoyar en el suelo
	var center := aabb.get_center()
	inst.position = Vector3(-center.x * s, -aabb.position.y * s, -center.z * s)
	var holder := Node3D.new()
	holder.name = key
	holder.add_child(inst)
	return holder

# ------------------------------------------------------------------ hierba hecha a mano

static var _grass_meshes: Dictionary = {}
static var _grass_mat: ShaderMaterial

## Parche de hierba: varias matas de briznas finas con degradado de color. Muy pocos
## triángulos para poder sembrar mucha; las normales miran arriba para que se ilumine
## como el suelo. Variantes: 0-1 verde, 2 con hierba seca, 3 alta.
static func grass_patch_mesh(variant: int) -> ArrayMesh:
	if _grass_meshes.has(variant):
		return _grass_meshes[variant]
	if _grass_mat == null:
		_grass_mat = ShaderMaterial.new()
		_grass_mat.shader = FOLIAGE_SHADER
		_grass_mat.set_shader_parameter("use_vcol", true)
		_grass_mat.set_shader_parameter("alpha_cut", 0.0)
		_grass_mat.set_shader_parameter("sway", 0.05)
		_grass_mat.set_shader_parameter("sway_ref", 0.3)
		_grass_mat.set_shader_parameter("up_normal", 1.0)
	var rng := RandomNumberGenerator.new()
	rng.seed = 1000 + variant
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	if variant == 4:
		_wheat_patch(st, rng)
	var tufts := 0 if variant == 4 else (9 if variant == 5 else 6 + variant % 2)
	for t in tufts:
		var tc := Vector2(rng.randf_range(-0.4, 0.4), rng.randf_range(-0.4, 0.4))
		var blades := rng.randi_range(7, 10)
		var tall := variant == 3 or (variant == 5 and rng.randf() < 0.14)
		var hbase := rng.randf_range(0.14, 0.26) * (1.45 if tall else 1.0)
		var dry := rng.randf() < (0.4 if variant == 2 else (0.2 if variant == 5 else 0.08))
		var base_col := Color(0.26, 0.36, 0.12).lerp(Color(0.3, 0.38, 0.14), rng.randf())
		var tip_col := Color(0.58, 0.68, 0.27).lerp(Color(0.46, 0.62, 0.22), rng.randf() * 0.7)
		if dry:
			tip_col = Color(0.76, 0.68, 0.36).lerp(Color(0.66, 0.6, 0.3), rng.randf())
		for b in blades:
			# Cada brizna es un solo triángulo inclinado hacia fuera
			var ang := rng.randf() * TAU
			var dir := Vector3(cos(ang), 0, sin(ang))
			var lean := rng.randf_range(0.04, 0.13)
			var h := hbase * rng.randf_range(0.65, 1.15)
			var w := rng.randf_range(0.028, 0.045)
			var root := Vector3(tc.x, 0, tc.y) + dir * rng.randf_range(0.0, 0.05)
			var side := Vector3(-dir.z, 0, dir.x) * w
			var tip := root + dir * lean + Vector3(0, h, 0)
			for v in [[root - side, base_col], [root + side, base_col], [tip, tip_col]]:
				st.set_color((v[1] as Color).srgb_to_linear())
				st.set_normal(Vector3.UP)
				st.set_uv(Vector2(0.5, 0.5))
				st.add_vertex(v[0])
	var mesh := st.commit()
	mesh.surface_set_material(0, _grass_mat)
	_grass_meshes[variant] = mesh
	return mesh

## Trigo: espigas en hileras con su cabeza dorada (una brizna y un rombo por espiga).
static func _wheat_patch(st: SurfaceTool, rng: RandomNumberGenerator) -> void:
	var stalk_lo := Color(0.52, 0.5, 0.24)
	for row in 5:
		for k in 7:
			var root := Vector3(-0.45 + k * 0.15 + rng.randf_range(-0.04, 0.04), 0, -0.4 + row * 0.2 + rng.randf_range(-0.05, 0.05))
			var h := rng.randf_range(0.42, 0.58)
			var lean := Vector3(rng.randf_range(-0.04, 0.04), 0, rng.randf_range(-0.04, 0.04))
			var top := root + lean + Vector3(0, h, 0)
			var w := 0.017
			var gold := Color(0.9, 0.76, 0.4).lerp(Color(0.82, 0.7, 0.34), rng.randf())
			var stalk_hi := Color(0.84, 0.74, 0.38)
			var side := Vector3(w, 0, w * 0.5)
			var tri := [[root - side, stalk_lo], [root + side, stalk_lo], [top, stalk_hi]]
			# cabeza: rombo vertical
			var hh := 0.1
			var hw := 0.025
			var c0 := top
			var c1 := top + lean * 0.3 + Vector3(0, hh, 0)
			var mid := (c0 + c1) * 0.5
			var hs := Vector3(hw, 0, hw * 0.4)
			tri += [[c0, gold], [mid + hs, gold], [c1, gold], [c0, gold], [c1, gold], [mid - hs, gold]]
			for v in tri:
				st.set_color((v[1] as Color).srgb_to_linear())
				st.set_normal(Vector3.UP)
				st.set_uv(Vector2(0.5, 0.5))
				st.add_vertex(v[0])

# ------------------------------------------------------------------ vegetación con viento

const FOLIAGE_SHADER := preload("res://assets/shaders/foliage.gdshader")
const FOLIAGE_FADE_SHADER := preload("res://assets/shaders/foliage_fade.gdshader")
static var _foliage_mesh_cache: Dictionary = {}
static var _foliage_mat_cache: Dictionary = {}
static var _fade_cache: Dictionary = {}

## Cambia los materiales de un modelo de vegetación por el sombreador con viento.
## Las mallas convertidas se comparten entre todas las copias (y los lotes).
static func _apply_foliage(root: Node, key: String, def: Dictionary) -> void:
	for n in root.find_children("*", "MeshInstance3D", true, false):
		var mi: MeshInstance3D = n
		if mi.mesh == null:
			continue
		var ck := "%s|%d" % [key, mi.mesh.get_instance_id()]
		var m: Mesh = _foliage_mesh_cache.get(ck)
		if m == null:
			var lv: Array = def.get("lod", [0, 0])
			if lv[0] > 0 or lv[1] > 0:
				m = reduced_mesh(mi.mesh, lv[0], lv[1])
			else:
				m = mi.mesh.duplicate()
			for si in m.get_surface_count():
				m.surface_set_material(si, _foliage_material(mi.get_active_material(si), def))
			_foliage_mesh_cache[ck] = m
		mi.mesh = m
		for si in mi.get_surface_override_material_count():
			mi.set_surface_override_material(si, null)

## Copia de una malla usando los niveles de detalle que genera Godot al importar: menos
## triángulos para lo que hay a montones. `leaf` se aplica a las superficies de hojas y
## `other` al resto (troncos).
static func reduced_mesh(mesh: Mesh, leaf: int, other: int) -> ArrayMesh:
	var out := ArrayMesh.new()
	for si in mesh.get_surface_count():
		var arrays := mesh.surface_get_arrays(si)
		var mat := mesh.surface_get_material(si)
		var nm := mat.resource_name if mat != null else ""
		var level := leaf if (nm.begins_with("Lea") or nm.begins_with("Grass") or nm.begins_with("Flower")) else other
		var d := RenderingServer.mesh_get_surface(mesh.get_rid(), si)
		var lods: Array = d.get("lods", [])
		if level > 0 and lods.size() > 0:
			var l: Dictionary = lods[mini(level, lods.size()) - 1]
			var bytes: PackedByteArray = l.index_data
			var idx := PackedInt32Array()
			if int(d.vertex_count) > 65535:
				idx = bytes.to_int32_array()
			else:
				idx.resize(bytes.size() / 2)
				for i in idx.size():
					idx[i] = bytes.decode_u16(i * 2)
			arrays[Mesh.ARRAY_INDEX] = idx
		out.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays)
		out.surface_set_material(si, mat)
	return out

static func _foliage_material(src: Material, def: Dictionary) -> Material:
	if not src is BaseMaterial3D:
		return src
	var b: BaseMaterial3D = src
	var ck := "%d|%s|%s|%s|%s" % [b.get_instance_id(), def.get("tint", []), def.get("sway", 0.04), def.get("sway_ref", 1.0), def.get("leaf_tex", "")]
	if _foliage_mat_cache.has(ck):
		return _foliage_mat_cache[ck]
	var sm := ShaderMaterial.new()
	sm.shader = FOLIAGE_SHADER
	var nm := b.resource_name
	var tex: Texture2D = b.albedo_texture
	if def.has("leaf_tex") and nm.begins_with("Leaves"):
		tex = load(def.leaf_tex)
	sm.set_shader_parameter("albedo_tex", tex)
	var col := b.albedo_color
	if def.has("tint") and not nm.begins_with("Bark"):
		var t: Array = def.tint
		col = Color(col.r * t[0], col.g * t[1], col.b * t[2], col.a)
	sm.set_shader_parameter("albedo", col)
	sm.set_shader_parameter("use_vcol", b.vertex_color_use_as_albedo)
	sm.set_shader_parameter("alpha_cut", b.alpha_scissor_threshold if b.transparency == BaseMaterial3D.TRANSPARENCY_ALPHA_SCISSOR else 0.0)
	sm.set_shader_parameter("sway", float(def.get("sway", 0.04)))
	sm.set_shader_parameter("sway_ref", float(def.get("sway_ref", 1.0)))
	sm.set_shader_parameter("up_normal", float(def.get("up_normal", 0.0 if nm.begins_with("Bark") else 0.45)))
	sm.resource_name = nm
	_foliage_mat_cache[ck] = sm
	return sm

## Altura relativa de la cubierta del suelo (hierba, flores, helechos): 1 normal, menos en combate.
static func set_cover_squash(v: float) -> void:
	if _grass_mat:
		_grass_mat.set_shader_parameter("squash", v)
	for m in _foliage_mat_cache.values():
		var sm := m as ShaderMaterial
		if sm and float(sm.get_shader_parameter("sway_ref")) < 0.8:
			sm.set_shader_parameter("squash", v)

## Versión translúcida de un material (para aclarar lo que tapa a las figuras).
static func fade_material(src: Material, alpha: float) -> Material:
	var ck := "%d|%.2f" % [src.get_instance_id(), alpha]
	if _fade_cache.has(ck):
		return _fade_cache[ck]
	var out: Material = null
	if src is ShaderMaterial and (src as ShaderMaterial).shader == FOLIAGE_SHADER:
		var f := (src as ShaderMaterial).duplicate() as ShaderMaterial
		f.shader = FOLIAGE_FADE_SHADER
		f.set_shader_parameter("fade_alpha", alpha)
		out = f
	elif src is BaseMaterial3D:
		var fm := (src as BaseMaterial3D).duplicate() as BaseMaterial3D
		fm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA_DEPTH_PRE_PASS
		fm.albedo_color.a = alpha
		out = fm
	_fade_cache[ck] = out
	return out

static var _parts_cache: Dictionary = {}

## Piezas de malla de un prop ya ajustado (para dibujar muchos en lote con MultiMesh).
static func prop_parts(key: String) -> Array:
	if _parts_cache.has(key):
		return _parts_cache[key]
	var holder := make_prop(key)
	var out: Array = []
	for mi in holder.find_children("*", "MeshInstance3D", true, false):
		var m: MeshInstance3D = mi
		if m.mesh == null:
			continue
		out.append({"mesh": m.mesh, "xform": _relative_xform(m, holder), "mat": m.material_override,
			"shadow": m.cast_shadow != GeometryInstance3D.SHADOW_CASTING_SETTING_OFF})
	holder.free()
	_parts_cache[key] = out
	return out

static func _local_aabb(n: Node3D) -> AABB:
	var r := AABB()
	var first := true
	for mi in n.find_children("*", "MeshInstance3D", true, false):
		var m: MeshInstance3D = mi
		if m.mesh == null:
			continue
		var xf := _relative_xform(m, n)
		var a: AABB = xf * m.mesh.get_aabb()
		if first:
			r = a
			first = false
		else:
			r = r.merge(a)
	return r

static func _relative_xform(node: Node3D, root: Node3D) -> Transform3D:
	var xf := Transform3D.IDENTITY
	var cur: Node = node
	while cur != null and cur != root:
		if cur is Node3D:
			xf = (cur as Node3D).transform * xf
		cur = cur.get_parent()
	return xf

# ================================================================== héroes personalizados

const CHAR_SHADER := preload("res://assets/shaders/character.gdshader")
const PART_PREFIX := {"knight": "Knight", "barbarian": "Barbarian", "mage": "Mage", "rogue": "Rogue", "rogue_hooded": "Rogue"}
const HEAD_MESH := {"knight": "Knight_Head", "barbarian": "Barbarian_Head", "mage": "Mage_Head", "rogue": "Rogue_Head", "rogue_hooded": "Rogue_Head_Hooded"}
const HAT_MESH := {"knight": "Knight_Helmet", "barbarian": "Barbarian_Hat", "mage": "Mage_Hat"}
const CLOTH_CELLS := {"knight": Vector4(0, 1, -1, -1), "barbarian": Vector4(0, 1, 1, 1), "mage": Vector4(0, 1, 1, 1), "rogue": Vector4(0, 1, 1, 1), "rogue_hooded": Vector4(0, 1, 1, 1)}
## Qué malla de KayKit representa cada arma (o "proc:" para las que se generan por código).
const WEAPON_MESH := {
	"longsword": "1H_Sword", "shortsword": "1H_Sword", "scimitar": "1H_Sword", "rapier": "1H_Sword", "sickle": "Knife",
	"greatsword": "2H_Sword", "greataxe": "2H_Axe", "halberd": "2H_Axe", "glaive": "2H_Axe",
	"handaxe": "1H_Axe", "battleaxe": "1H_Axe", "war_pick": "1H_Axe",
	"quarterstaff": "2H_Staff", "dagger": "Knife", "dart": "Throwable",
	"hand_crossbow": "1H_Crossbow", "light_crossbow": "2H_Crossbow", "heavy_crossbow": "2H_Crossbow",
	"mace": "proc:mace", "morningstar": "proc:mace", "flail": "proc:mace", "club": "proc:club", "greatclub": "proc:club",
	"warhammer": "proc:hammer", "maul": "proc:hammer", "light_hammer": "proc:hammer",
	"spear": "proc:spear", "javelin": "proc:spear",
	"longbow": "proc:bow", "shortbow": "proc:bow",
}
const MESH_SOURCE := {
	"1H_Sword": "knight", "2H_Sword": "knight", "1H_Sword_Offhand": "knight", "Badge_Shield": "knight", "Round_Shield": "knight",
	"Rectangle_Shield": "knight", "Spike_Shield": "knight", "1H_Axe": "barbarian", "2H_Axe": "barbarian", "1H_Axe_Offhand": "barbarian",
	"Barbarian_Round_Shield": "barbarian", "Mug": "barbarian", "2H_Staff": "mage", "1H_Wand": "mage", "Spellbook": "mage",
	"Knife": "rogue", "Knife_Offhand": "rogue", "1H_Crossbow": "rogue", "2H_Crossbow": "rogue", "Throwable": "rogue",
}
## Luminancia original (piel, pelo, ropa) del atlas de cada modelo KayKit.
const SWATCH_LUMA := {
	"knight": Vector3(0.80, 0.70, 0.36), "mage": Vector3(0.80, 0.10, 0.29), "rogue": Vector3(0.80, 0.42, 0.31),
	"rogue_hooded": Vector3(0.80, 0.42, 0.31), "barbarian": Vector3(0.80, 0.57, 0.40),
}
const SHIELD_MESH := {"knight": "Badge_Shield", "barbarian": "Barbarian_Round_Shield", "mage": "Round_Shield", "rogue": "Round_Shield", "rogue_hooded": "Round_Shield"}

## Aspecto visual de un personaje creado por el jugador a partir de su hoja.
static func hero_visual(sheet: Dictionary) -> Dictionary:
	return CharacterSheet.visual_for(sheet)

static func _find_mesh(root: Node, mesh_name: String) -> MeshInstance3D:
	for mi in root.find_children("*", "MeshInstance3D", true, false):
		if mi.name == mesh_name:
			return mi
	return null

## Modelo completo de héroe: cuerpo, cabeza, colores, rasgos de especie y armas.
static func make_hero_model(v: Dictionary) -> Node3D:
	var body: String = v.get("model", "knight")
	if not CHAR_SCENES.has(body):
		body = "knight"
	var inst: Node3D = scene(CHAR_SCENES[body]).instantiate()
	inst.set_meta("family", "kaykit")
	var skel: Skeleton3D = inst.find_child("Skeleton3D", true, false)
	# Cabeza de otro modelo (todos comparten esqueleto)
	var head: String = v.get("head", body)
	if head != body and HEAD_MESH.has(head):
		var own := _find_mesh(inst, HEAD_MESH[body])
		if own != null:
			own.visible = false
		var src: Node3D = scene(CHAR_SCENES[head]).instantiate()
		var hm := _find_mesh(src, HEAD_MESH[head])
		if hm != null and skel != null:
			var copy := MeshInstance3D.new()
			copy.name = "BorrowedHead"
			copy.mesh = hm.mesh
			copy.skin = hm.skin
			copy.set_meta("source_model", head)
			for i in hm.get_surface_override_material_count():
				copy.set_surface_override_material(i, hm.get_active_material(i))
			skel.add_child(copy)
			copy.skeleton = NodePath("..")
			copy.transform = hm.transform
		src.free()
	# Sombrero y capa
	for m in HAT_MESH.values():
		var hat := _find_mesh(inst, m)
		if hat != null:
			hat.visible = v.get("hat", false)
	var cape := _find_mesh(inst, PART_PREFIX[body] + "_Cape")
	if cape != null:
		cape.visible = v.get("cape", true)
	# Armas y escudo
	_hero_loadout(inst, v)
	# Colores
	_apply_palette(inst, v, body)
	# Rasgos de especie
	_species_parts(inst, skel, v)
	# Escala
	var sp: Dictionary = RulesDB.species.get(v.get("species", "human"), {})
	var vis: Dictionary = sp.get("visual", {})
	var s := float(vis.get("scale", 1.0))
	if v.get("size", "medium") == "small" and s > 0.85:
		s = 0.8
	var w := float(vis.get("width", 1.0))
	inst.scale = Vector3(w, 1.0, w) * CHAR_SCALE * s
	var root := Node3D.new()
	root.name = "Model"
	root.add_child(inst)
	return root

static func _hero_loadout(inst: Node3D, v: Dictionary) -> void:
	# Oculta todo lo que traiga en las manos
	for slot_name in ["handslot_r", "handslot_l"]:
		var slot: Node = inst.find_child(slot_name, true, false)
		if slot == null:
			continue
		for ch in slot.get_children():
			if ch is MeshInstance3D:
				ch.visible = false
	var weapons: Array = v.get("weapons_list", [])
	var melee := ""
	var ranged := ""
	var offhand := ""
	for wid in weapons:
		var wd: Dictionary = RulesDB.weapons.get(wid, {})
		if wd.get("kind", "") == "ranged" and ranged.is_empty():
			ranged = wid
		elif wd.get("kind", "") == "melee" and melee.is_empty() and wid != "javelin":
			melee = wid
		elif wd.get("kind", "") == "melee" and offhand.is_empty() and "light" in wd.get("props", []) and wid != melee:
			offhand = wid
	if melee.is_empty():
		for wid in weapons:
			if RulesDB.weapons.get(wid, {}).get("kind", "") == "melee":
				melee = wid
				break
	var cls: String = v.get("class", "")
	if melee.is_empty() and ranged.is_empty() and cls in ["wizard", "sorcerer", "warlock"]:
		_attach_weapon(inst, "handslot_r", "1H_Wand")
	if not melee.is_empty():
		_attach_weapon(inst, "handslot_r", WEAPON_MESH.get(melee, "1H_Sword"))
	elif not ranged.is_empty():
		_attach_weapon(inst, "handslot_r", WEAPON_MESH.get(ranged, "proc:bow"))
	if not ranged.is_empty() and not melee.is_empty():
		var rn := _attach_weapon(inst, "handslot_r", WEAPON_MESH.get(ranged, "proc:bow"))
		if rn != null:
			rn.visible = false
			rn.set_meta("ranged_weapon", true)
	if v.get("shield_on", false):
		_attach_weapon(inst, "handslot_l", SHIELD_MESH.get(v.get("model", "knight"), "Round_Shield"))
	elif not offhand.is_empty():
		var om: String = WEAPON_MESH.get(offhand, "1H_Sword")
		om = {"1H_Sword": "1H_Sword_Offhand", "Knife": "Knife_Offhand", "1H_Axe": "1H_Axe_Offhand"}.get(om, om)
		_attach_weapon(inst, "handslot_l", om)
	elif cls == "wizard":
		_attach_weapon(inst, "handslot_l", "Spellbook")

## Coloca una malla de arma (de cualquier modelo KayKit o generada) en una mano.
static func _attach_weapon(inst: Node3D, slot_name: String, mesh_name: String) -> MeshInstance3D:
	var slot: Node = inst.find_child(slot_name, true, false)
	if slot == null:
		return null
	if mesh_name.begins_with("proc:"):
		var pm := _proc_weapon(mesh_name.substr(5))
		slot.add_child(pm)
		return pm
	var own: Node = slot.find_child(mesh_name, false, false)
	if own is MeshInstance3D:
		own.visible = true
		return own
	var src_model: String = MESH_SOURCE.get(mesh_name, "knight")
	var src: Node3D = scene(CHAR_SCENES[src_model]).instantiate()
	var found := _find_mesh(src, mesh_name)
	var m: MeshInstance3D = null
	if found != null:
		m = MeshInstance3D.new()
		m.name = mesh_name
		m.mesh = found.mesh
		m.transform = found.transform
		for i in found.get_surface_override_material_count():
			m.set_surface_override_material(i, found.get_active_material(i))
		slot.add_child(m)
	src.free()
	return m

## Armas sencillas generadas por código para las que KayKit no trae malla.
static func _proc_weapon(kind: String) -> MeshInstance3D:
	var root := MeshInstance3D.new()
	root.name = "proc_" + kind
	var wood := StandardMaterial3D.new()
	wood.albedo_color = Color(0.45, 0.3, 0.18)
	var metal := StandardMaterial3D.new()
	metal.albedo_color = Color(0.62, 0.64, 0.68)
	metal.metallic = 0.6
	metal.roughness = 0.4
	var handle := CylinderMesh.new()
	handle.top_radius = 0.045
	handle.bottom_radius = 0.045
	handle.radial_segments = 8
	match kind:
		"mace", "club":
			handle.height = 0.9
			root.mesh = handle
			root.material_override = wood
			root.position = Vector3(0, 0.35, 0)
			var head := MeshInstance3D.new()
			var hs := SphereMesh.new()
			hs.radius = 0.16 if kind == "mace" else 0.13
			hs.height = hs.radius * 2.2
			hs.radial_segments = 8
			hs.rings = 4
			head.mesh = hs
			head.material_override = metal if kind == "mace" else wood
			head.position = Vector3(0, 0.45, 0)
			root.add_child(head)
		"hammer":
			handle.height = 1.0
			root.mesh = handle
			root.material_override = wood
			root.position = Vector3(0, 0.4, 0)
			var hh := MeshInstance3D.new()
			var hb := BoxMesh.new()
			hb.size = Vector3(0.42, 0.2, 0.2)
			hh.mesh = hb
			hh.material_override = metal
			hh.position = Vector3(0, 0.5, 0)
			root.add_child(hh)
		"spear":
			handle.height = 2.0
			handle.top_radius = 0.035
			handle.bottom_radius = 0.035
			root.mesh = handle
			root.material_override = wood
			root.position = Vector3(0, 0.55, 0)
			var tip := MeshInstance3D.new()
			var tm := CylinderMesh.new()
			tm.top_radius = 0.0
			tm.bottom_radius = 0.08
			tm.height = 0.3
			tm.radial_segments = 4
			tip.mesh = tm
			tip.material_override = metal
			tip.position = Vector3(0, 1.15, 0)
			root.add_child(tip)
		"bow":
			var arc := TorusMesh.new()
			arc.inner_radius = 0.62
			arc.outer_radius = 0.68
			arc.rings = 16
			arc.ring_segments = 6
			root.mesh = arc
			root.material_override = wood
			root.rotation_degrees = Vector3(0, 0, 90)
			root.scale = Vector3(1.0, 1.0, 0.45)
			root.position = Vector3(0.0, 0.1, 0.25)
	return root

static func _apply_palette(inst: Node3D, v: Dictionary, body: String) -> void:
	var skin = v.get("skin", "")
	var hair = v.get("hair", "")
	var cloth = v.get("cloth", "")
	if str(skin).is_empty() and str(hair).is_empty() and str(cloth).is_empty():
		return
	var skel: Skeleton3D = inst.find_child("Skeleton3D", true, false)
	if skel == null:
		return
	for mi in skel.find_children("*", "MeshInstance3D", true, false):
		if not mi.visible:
			continue
		var src_model: String = mi.get_meta("source_model", body)
		for s in mi.mesh.get_surface_count():
			var mat = mi.get_active_material(s)
			if not (mat is StandardMaterial3D) or mat.albedo_texture == null:
				continue
			var sm := ShaderMaterial.new()
			sm.shader = CHAR_SHADER
			sm.set_shader_parameter("albedo_tex", mat.albedo_texture)
			var lum: Vector3 = SWATCH_LUMA.get(src_model, Vector3(0.8, 0.5, 0.4))
			sm.set_shader_parameter("skin_base", lum.x)
			sm.set_shader_parameter("hair_base", lum.y)
			sm.set_shader_parameter("cloth_base", lum.z)
			if not str(skin).is_empty():
				sm.set_shader_parameter("recolor_skin", true)
				sm.set_shader_parameter("skin_color", Color.html(str(skin)))
			if not str(hair).is_empty():
				sm.set_shader_parameter("recolor_hair", true)
				sm.set_shader_parameter("hair_color", Color.html(str(hair)))
			if not str(cloth).is_empty():
				sm.set_shader_parameter("recolor_cloth", true)
				sm.set_shader_parameter("cloth_color", Color.html(str(cloth)))
				sm.set_shader_parameter("cloth_cells", CLOTH_CELLS.get(src_model, Vector4(0, 1, -1, -1)))
			mi.set_surface_override_material(s, sm)

## Orejas, cuernos, colmillos, barba y cola según la especie.
static func _species_parts(inst: Node3D, skel: Skeleton3D, v: Dictionary) -> void:
	if skel == null:
		return
	var species: String = v.get("species", "human")
	var sp: Dictionary = RulesDB.species.get(species, {})
	var vis: Dictionary = sp.get("visual", {})
	var skin_c := Color.html(str(v.get("skin", "#e0ac83")))
	var hair_c := Color.html(str(v.get("hair", "#5a3a22")))
	var head_att := BoneAttachment3D.new()
	head_att.bone_name = "head"
	skel.add_child(head_att)
	var skin_m := StandardMaterial3D.new()
	skin_m.albedo_color = skin_c
	skin_m.roughness = 0.85
	var horn_m := StandardMaterial3D.new()
	horn_m.albedo_color = Color(0.25, 0.2, 0.18) if species == "tiefling" else Color(0.85, 0.8, 0.68)
	horn_m.roughness = 0.6
	var hair_m := StandardMaterial3D.new()
	hair_m.albedo_color = hair_c
	hair_m.roughness = 0.9
	var ivory := StandardMaterial3D.new()
	ivory.albedo_color = Color(0.95, 0.92, 0.82)
	# Espacio del hueso "head": la cabeza ocupa x ±0.54, y 0..1.0, z -0.5..0.53 (cara hacia +z)
	if vis.get("ears", false):
		var ear_len := 0.42 if species == "elf" else 0.34
		if str(vis.get("ears")) == "half":
			ear_len = 0.26
		for side in [-1, 1]:
			var ear := MeshInstance3D.new()
			var cm := CylinderMesh.new()
			cm.top_radius = 0.0
			cm.bottom_radius = 0.115
			cm.height = ear_len
			cm.radial_segments = 6
			ear.mesh = cm
			ear.material_override = skin_m
			var dir := Vector3(0.86 * side, 0.5, -0.12).normalized()
			ear.position = Vector3(0.5 * side, 0.46, 0.0) + dir * ear_len * 0.5
			ear.rotation_degrees = Vector3(-7, 0, -60 * side)
			ear.scale = Vector3(1.0, 1.0, 0.4)
			head_att.add_child(ear)
	var horns: String = str(vis.get("horns", ""))
	if not horns.is_empty() and not v.get("hat", false):
		for side in [-1, 1]:
			var horn := MeshInstance3D.new()
			var hm := CylinderMesh.new()
			hm.top_radius = 0.0
			hm.bottom_radius = 0.09
			hm.height = 0.42 if horns == "curl" else 0.55
			hm.radial_segments = 6
			horn.mesh = hm
			horn.material_override = horn_m
			if horns == "curl":
				horn.position = Vector3(0.28 * side, 1.1, 0.12)
				horn.rotation_degrees = Vector3(-15, 0, -22 * side)
			else:
				horn.position = Vector3(0.26 * side, 1.02, -0.5)
				horn.rotation_degrees = Vector3(-60, 0, -10 * side)
			head_att.add_child(horn)
	if vis.get("scales", false):
		# Hocico: le da a la cabeza una silueta dracónida
		var snout := MeshInstance3D.new()
		var sb := CylinderMesh.new()
		sb.radial_segments = 4
		sb.rings = 1
		sb.bottom_radius = 0.3
		sb.top_radius = 0.19
		sb.height = 0.32
		snout.mesh = sb
		snout.material_override = skin_m
		snout.position = Vector3(0, 0.28, 0.6)
		snout.rotation_degrees = Vector3(90, 45, 0)
		snout.scale = Vector3(1.0, 1.0, 0.62)
		head_att.add_child(snout)
		for side in [-1, 1]:
			var nostril := MeshInstance3D.new()
			var nb := BoxMesh.new()
			nb.size = Vector3(0.07, 0.05, 0.02)
			nostril.mesh = nb
			var dark := StandardMaterial3D.new()
			dark.albedo_color = skin_c.darkened(0.6)
			nostril.material_override = dark
			nostril.position = Vector3(0.08 * side, 0.33, 0.77)
			head_att.add_child(nostril)
	if vis.get("tusks", false):
		for side in [-1, 1]:
			var tusk := MeshInstance3D.new()
			var tm := CylinderMesh.new()
			tm.top_radius = 0.0
			var small_tusk: bool = str(vis.get("tusks")) == "small"
			tm.bottom_radius = 0.04 if small_tusk else 0.055
			tm.height = 0.13 if small_tusk else 0.2
			tm.radial_segments = 5
			tusk.mesh = tm
			tusk.material_override = ivory
			tusk.position = Vector3(0.17 * side, 0.26, 0.56)
			tusk.rotation_degrees = Vector3(10, 0, 10 * side)
			head_att.add_child(tusk)
	if vis.get("beard", false) and v.get("beard", true) and v.get("head", "") != "barbarian":
		# Barba de bloque, al estilo de las cabezas de KayKit
		var beard := MeshInstance3D.new()
		var bm := SphereMesh.new()
		bm.radius = 0.33
		bm.height = 0.66
		bm.radial_segments = 8
		bm.rings = 4
		beard.mesh = bm
		beard.material_override = hair_m
		beard.position = Vector3(0, 0.12, 0.4)
		beard.scale = Vector3(1.0, 1.05, 0.55)
		head_att.add_child(beard)
		var tip := MeshInstance3D.new()
		var tm2 := PrismMesh.new()
		tm2.size = Vector3(0.4, 0.26, 0.2)
		tip.mesh = tm2
		tip.material_override = hair_m
		tip.position = Vector3(0, -0.2, 0.46)
		tip.rotation_degrees = Vector3(180, 0, 0)
		head_att.add_child(tip)
	if vis.get("tail", false):
		var hip_att := BoneAttachment3D.new()
		hip_att.bone_name = "hips"
		skel.add_child(hip_att)
		var tail := MeshInstance3D.new()
		var tl := CylinderMesh.new()
		tl.top_radius = 0.0
		tl.bottom_radius = 0.06
		tl.height = 0.95
		tl.radial_segments = 6
		tail.mesh = tl
		tail.material_override = skin_m
		tail.position = Vector3(0, -0.05, -0.42)
		tail.rotation_degrees = Vector3(-118, 0, 0)
		hip_att.add_child(tail)
