extends SceneTree
## Ejecuta un solo archivo de pruebas: TESTFILE=test_x.gd
var failures := 0
var passed := 0
var current_test := ""
func _initialize() -> void:
	var f := OS.get_environment("TESTFILE")
	var script: GDScript = load("res://tests/" + f)
	var inst = script.new()
	inst.set("runner", self)
	for m in script.get_script_method_list():
		var mname: String = m.name
		if mname.begins_with("test_"):
			current_test = f + "::" + mname
			var before := failures
			inst.call(mname)
			if failures == before:
				passed += 1
			else:
				print("  ✗ ", current_test)
	print("\nPRUEBAS: %d correctas, %d fallos" % [passed, failures])
	quit(1 if failures > 0 else 0)
func check(cond: bool, msg: String = "") -> void:
	if not cond:
		failures += 1
		print("FALLO en ", current_test, ": ", msg)
func eq(a, b, msg: String = "") -> void:
	if a != b:
		failures += 1
		print("FALLO en ", current_test, ": ", msg, " (esperado ", b, ", obtenido ", a, ")")
