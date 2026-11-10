extends SceneTree
func _init():
	for f in ["Knight","Rogue_Hooded","Mage","Barbarian","Rogue","Skeleton_Warrior","Skeleton_Minion","Skeleton_Rogue","Skeleton_Mage"]:
		var path = "res://assets/models/characters/%s.glb" % f
		var gs := GLTFState.new()
		var gd := GLTFDocument.new()
		var err = gd.append_from_file(ProjectSettings.globalize_path(path), gs)
		if err != OK:
			print("ERR ", f, err); continue
		var root = gd.generate_scene(gs)
		print("== ", f)
		_dump(root, 0)
		var ap = root.find_child("AnimationPlayer", true, false)
		if ap:
			print("  anims(", ap.get_animation_list().size(), "): ", ", ".join(ap.get_animation_list()))
		root.free()
	quit()
func _dump(n, d):
	if d > 4: return
	var extra = ""
	if n is Skeleton3D:
		var bones = []
		for i in n.get_bone_count(): bones.append(n.get_bone_name(i))
		extra = " bones=" + ",".join(bones)
	if n is MeshInstance3D: extra = " mesh"
	if n is BoneAttachment3D: extra = " attach->" + n.bone_name
	print("  ".repeat(d+1), n.name, " <", n.get_class(), ">", extra)
	for c in n.get_children(): _dump(c, d+1)
