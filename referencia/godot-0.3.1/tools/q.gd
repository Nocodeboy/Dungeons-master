extends SceneTree
func _initialize() -> void:
	for pid in ["brenna", "pip", "ilyra", "odvar"]:
		for l in [1, 2, 3]:
			var c := Factory.make_pc(pid, l)
			print(pid, " ", l, " ", c.cls, " res=", c.resources_max, " slots=", c.slots_max, " fc=", c.free_casts, " hp=", c.max_hp)
	quit()
