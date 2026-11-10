extends SceneTree
## Comprueba que todos los scripts compilan: godot --headless --path . -s tools/check_scripts.gd
func _initialize() -> void:
	var files: Array = []
	_collect("res://scripts", files)
	for f in files:
		var sc: GDScript = load(f)
		if sc == null or not sc.can_instantiate():
			printerr("FALLA: ", f)
	printerr("revisados ", files.size())
	quit()
func _collect(path: String, out: Array) -> void:
	var d := DirAccess.open(path)
	if d == null: return
	for f in d.get_files():
		if f.ends_with(".gd"): out.append(path + "/" + f)
	for sub in d.get_directories():
		_collect(path + "/" + sub, out)
