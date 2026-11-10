class_name DungeonWalls
extends Node3D
## Muros de mazmorra hechos con piezas de KayKit a lo largo del borde entre el suelo y la roca.
## Los hexágonos se aproximan con bloques de media unidad por fila y los zigzags de los muros
## verticales se enderezan. Los muros que quedan entre la cámara y la sala se bajan (vista en
## corte, como en los clásicos) y vuelven a subir si la cámara gira.

const PIECES := {
	"wall": "res://assets/models/dungeon/wall.glb",
	"wall_cracked": "res://assets/models/dungeon/wall_cracked.glb",
	"wall_broken": "res://assets/models/dungeon/wall_broken.glb",
	"wall_arched": "res://assets/models/dungeon/wall_arched.glb",
	"wall_shelves": "res://assets/models/dungeon/wall_shelves.glb",
}
const WEIGHTS := [["wall", 62], ["wall_cracked", 16], ["wall_arched", 9], ["wall_shelves", 8], ["wall_broken", 5]]
const THICK := 0.3
const MODEL_W := 4.0     ## ancho y alto de las piezas originales
const MODEL_H := 4.0

var map: BattleMap
var world: BattleWorld
var rng := RandomNumberGenerator.new()
var full_h := 1.7
var mid_h := 0.95
var low_h := 0.3
var pieces: Array = []           ## {variant, i, center, dir, normal, w, h, deco: Array[Node3D]}
var _mm: Dictionary = {}         ## variante -> Array de {mm, xform}
var _counts: Dictionary = {}
var _last_fwd := Vector3.ZERO
var _t := 0.0

func build(p_world: BattleWorld, p_map: BattleMap, seed_value: int, height: float) -> void:
	world = p_world
	map = p_map
	rng.seed = seed_value
	full_h = maxf(1.2, height * 2.0)
	var segs := _segments()
	for s in segs:
		_add_segment(s.a, s.b, s.n)
	_build_multimeshes()
	_decorate()
	update_cutaway(Vector3(0.57, 0, 0.82))

# ------------------------------------------------------------------ geometría

func _floor(c: Vector2i) -> bool:
	return map.in_bounds(c) and map.tile(c) != "#"

## ¿El bloque de media unidad `b` de la fila `r` es suelo?
func _block(b: int, r: int) -> bool:
	var x := floori((b if posmod(r, 2) == 0 else b - 1) / 2.0)
	return _floor(Vector2i(x, r))

func _row_z(r: int) -> float:
	return r * BattleMap.ROW_H + 0.5

## Tramos de muro: {a, b (extremos en planta), n (normal hacia la sala)}.
func _segments() -> Array:
	var out: Array = []
	var b0 := -4
	var b1 := map.width * 2 + 4
	var half := BattleMap.ROW_H * 0.5
	# --- Bordes verticales por fila, encadenados entre filas y enderezados
	var vert: Dictionary = {}   # fila -> Array de {x, n}
	for r in range(-1, map.height + 1):
		var list: Array = []
		for b in range(b0, b1):
			var f0 := _block(b, r)
			var f1 := _block(b + 1, r)
			if f0 != f1:
				list.append({"x": (b + 1) * 0.5, "n": -1 if f0 else 1, "r": r, "next": null, "prev": null})
		vert[r] = list
	for r in range(-1, map.height):
		for e in vert[r]:
			var best = null
			var bd := 0.51
			for e2 in vert[r + 1]:
				if e2.n == e.n and e2.prev == null and absf(float(e2.x) - float(e.x)) < bd:
					bd = absf(float(e2.x) - float(e.x))
					best = e2
			if best != null:
				e.next = best
				best.prev = e
	for r in range(-1, map.height + 1):
		for e in vert[r]:
			var xs: float = e.x
			if e.prev != null and e.next != null:
				xs = (float(e.prev.x) + 2.0 * float(e.x) + float(e.next.x)) / 4.0
			elif e.prev != null:
				xs = (float(e.prev.x) + float(e.x)) / 2.0
			elif e.next != null:
				xs = (float(e.next.x) + float(e.x)) / 2.0
			e["xs"] = xs
	_vc = vert
	# Tramos verticales: filas seguidas de una cadena con la misma x
	for r in range(-1, map.height + 1):
		for e in vert[r]:
			if e.prev != null and absf(float(e.prev.xs) - float(e.xs)) < 0.01:
				continue   # ya lo cubre el tramo que empieza más arriba
			var z0 := _row_z(r) - half
			var cur = e
			while cur.next != null and absf(float(cur.next.xs) - float(e.xs)) < 0.01:
				cur = cur.next
			var z1 := _row_z(int(cur.r)) + half
			out.append({"a": Vector2(e.xs, z0), "b": Vector2(e.xs, z1), "n": Vector2(float(e.n), 0)})
	# --- Bordes horizontales entre filas
	for r in range(-2, map.height + 1):
		var z := _row_z(r) + half
		var b := b0
		while b < b1:
			var up := _block(b, r)
			var dn := _block(b, r + 1)
			if up == dn:
				b += 1
				continue
			var start := b
			while b < b1 and _block(b, r) == up and _block(b, r + 1) == dn:
				b += 1
			var xa := start * 0.5
			var xb := b * 0.5
			if xb - xa <= 0.51:
				continue   # escalón de un zigzag: ya lo tapa el muro vertical enderezado
			var nz := -1.0 if up else 1.0
			xa = _snap_end(xa, r, -1)
			xb = _snap_end(xb, r, 1)
			out.append({"a": Vector2(xa, z), "b": Vector2(xb, z), "n": Vector2(0, nz)})
	return out

## Alarga el extremo de un muro horizontal hasta meterlo en el muro vertical que lo cierra.
func _snap_end(x: float, r: int, side: int) -> float:
	var best := x
	var bd := 0.4
	for rr in [r, r + 1]:
		for e in _vert_cache(rr):
			var d := absf(float(e.xs) - x)
			if d < bd:
				bd = d
				best = float(e.xs) + side * THICK * 0.5
	return best

var _vc: Dictionary = {}
func _vert_cache(r: int) -> Array:
	return _vc.get(r, [])

func _add_segment(a: Vector2, b: Vector2, n: Vector2) -> void:
	var v := b - a
	var length := v.length()
	if length < 0.05:
		return
	var cnt := maxi(1, roundi(length / 1.1))
	var pw := length / cnt
	var dir2 := v / length
	for i in cnt:
		var p := a + dir2 * (pw * (i + 0.5)) - n * (THICK * 0.5)
		var variant := _pick()
		pieces.append({"variant": variant, "center": Vector3(p.x, 0, p.y), "normal": Vector3(n.x, 0, n.y),
			"w": pw * 1.02, "h": full_h, "deco": []})

func _pick() -> String:
	var r := rng.randi() % 100
	for e in WEIGHTS:
		r -= int(e[1])
		if r < 0:
			return e[0]
	return "wall"

# ------------------------------------------------------------------ dibujo

func _xform(p: Dictionary, h: float) -> Transform3D:
	var nrm: Vector3 = p.normal
	var x_axis := Vector3.UP.cross(nrm)
	var basis := Basis(x_axis * (float(p.w) / MODEL_W), Vector3.UP * (h / MODEL_H), nrm * (THICK / 1.0))
	return Transform3D(basis, p.center)

func _build_multimeshes() -> void:
	var by_variant: Dictionary = {}
	for p in pieces:
		var v: String = p.variant
		if not by_variant.has(v):
			by_variant[v] = []
		p["i"] = (by_variant[v] as Array).size()
		by_variant[v].append(p)
	for v in by_variant.keys():
		var list: Array = []
		var scene: Node3D = ModelLibrary.scene(PIECES[v]).instantiate()
		for mi in scene.find_children("*", "MeshInstance3D", true, false):
			var m: MeshInstance3D = mi
			if m.mesh == null:
				continue
			var mm := MultiMesh.new()
			mm.transform_format = MultiMesh.TRANSFORM_3D
			mm.mesh = m.mesh
			mm.instance_count = (by_variant[v] as Array).size()
			var mmi := MultiMeshInstance3D.new()
			mmi.multimesh = mm
			add_child(mmi)
			list.append({"mm": mm, "xform": ModelLibrary._relative_xform(m, scene)})
		scene.free()
		_mm[v] = list
		_counts[v] = (by_variant[v] as Array).size()

## Antorchas y estandartes en algunos muros altos.
func _decorate() -> void:
	var placed := 0
	var order := pieces.duplicate()
	for idx in order.size():
		var p: Dictionary = order[idx]
		if p.variant != "wall" and p.variant != "wall_cracked":
			continue
		var c: Vector3 = p.center
		var nrm: Vector3 = p.normal
		var hsh := posmod(int(c.x * 7.0 + c.z * 13.0), 9)
		if hsh == 0 and placed < 12:
			placed += 1
			var t := ModelLibrary.make_prop("torch_wall")
			t.position = c + nrm * (THICK * 0.5) + Vector3(0, 0.95, 0)
			t.rotation.y = atan2(nrm.x, nrm.z)
			add_child(t)
			p.deco.append(t)
			world.add_light(t.position + nrm * 0.3 + Vector3(0, 0.25, 0), Color(1.0, 0.55, 0.22), 1.6, 4.5)
		elif hsh == 4:
			var bn := ModelLibrary.make_prop("banner_thin")
			bn.position = c + nrm * (THICK * 0.5 + 0.02) + Vector3(0, 0.2, 0)
			bn.rotation.y = atan2(nrm.x, nrm.z)
			add_child(bn)
			p.deco.append(bn)

## Ajusta la altura de cada muro según hacia dónde mira la cámara: alto si queda al fondo,
## bajo si tapa la sala.
func update_cutaway(cam_fwd: Vector3) -> void:
	var f := Vector3(cam_fwd.x, 0, cam_fwd.z).normalized()
	if f == Vector3.ZERO:
		return
	_last_fwd = f
	for p in pieces:
		var d: float = (p.normal as Vector3).dot(-f)
		var h := full_h if d > 0.35 else (low_h if d < -0.35 else mid_h)
		p.h = h
		for b in _mm.get(p.variant, []):
			(b.mm as MultiMesh).set_instance_transform(int(p.i), _xform(p, h) * (b.xform as Transform3D))
		for dn in p.deco:
			(dn as Node3D).visible = h >= full_h - 0.01

func _process(delta: float) -> void:
	_t += delta
	if _t < 0.2:
		return
	_t = 0.0
	var cam := get_viewport().get_camera_3d() if get_viewport() else null
	if cam == null:
		return
	var f := -cam.global_transform.basis.z
	f.y = 0
	f = f.normalized()
	if f.dot(_last_fwd) < 0.985:
		update_cutaway(f)
