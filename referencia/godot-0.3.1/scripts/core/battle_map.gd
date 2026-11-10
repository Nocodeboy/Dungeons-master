class_name BattleMap
extends RefCounted
## Tablero táctico hexagonal: terreno, línea de visión, cobertura y rutas.
## Hexágonos con vértice arriba («pointy-top») en coordenadas de desplazamiento «odd-r»:
## (columna, fila), con las filas impares desplazadas medio hexágono a la derecha.
## Cada hexágono mide 1,5 m (5 pies) de centro a centro (regla de cuadrícula hexagonal de 5e).
## Las posiciones continuas (puntos de origen de áreas, direcciones) van en el «plano de
## casillas»: x a lo ancho, y a lo largo, con 1 unidad entre centros vecinos.

const FT := 5
## cover: 0 ninguna, 1 media (obstáculo bajo), 3 total (bloquea la vista)
const TILES := {
	".": {"walk": true, "cost": 1, "cover": 0, "name": "suelo"},
	",": {"walk": true, "cost": 1, "cover": 0, "name": "hierba"},
	":": {"walk": true, "cost": 1, "cover": 0, "name": "camino"},
	"=": {"walk": true, "cost": 1, "cover": 0, "name": "losas"},
	"~": {"walk": true, "cost": 2, "cover": 0, "name": "barro", "difficult": true},
	"b": {"walk": true, "cost": 2, "cover": 0, "name": "maleza", "difficult": true, "obscure": 1},
	"x": {"walk": true, "cost": 2, "cover": 0, "name": "escombros", "difficult": true},
	"f": {"walk": true, "cost": 2, "cover": 1, "name": "cerca", "difficult": true},
	"#": {"walk": false, "cost": 0, "cover": 3, "name": "muro"},
	"H": {"walk": false, "cost": 0, "cover": 3, "name": "edificio"},
	"T": {"walk": false, "cost": 0, "cover": 3, "name": "árbol"},
	"P": {"walk": false, "cost": 0, "cover": 3, "name": "columna"},
	"S": {"walk": false, "cost": 0, "cover": 3, "name": "estatua"},
	"r": {"walk": false, "cost": 0, "cover": 1, "name": "roca"},
	"c": {"walk": false, "cost": 0, "cover": 1, "name": "cajas"},
	"g": {"walk": false, "cost": 0, "cover": 1, "name": "lápida"},
	"w": {"walk": false, "cost": 0, "cover": 0, "name": "agua profunda"},
	"B": {"walk": false, "cost": 0, "cover": 3, "name": "edificio"},   ## edificio colocado a mano (niveles)
	"o": {"walk": false, "cost": 0, "cover": 1, "name": "objeto"},     ## objeto colocado a mano (cofres, carros...)
	"O": {"walk": false, "cost": 0, "cover": 3, "name": "objeto alto"},
	" ": {"walk": false, "cost": 0, "cover": 0, "name": "vacío"},
}

var width: int = 0
var height: int = 0
var rows: Array = []   ## Array[String]
var _los_cache: Dictionary = {}
var _obstacles: Array = []   ## casillas que dan algún tipo de cobertura
var _walk: PackedByteArray = PackedByteArray()
var _cost: PackedInt32Array = PackedInt32Array()
var _cover: PackedByteArray = PackedByteArray()
var _zone_diff: PackedByteArray = PackedByteArray()   ## terreno difícil creado por conjuros
var _hazard: PackedByteArray = PackedByteArray()      ## casillas peligrosas (para la IA)

func load_rows(p_rows: Array) -> void:
	rows = p_rows.duplicate()
	height = rows.size()
	width = 0
	for r in rows:
		width = max(width, r.length())
	for i in rows.size():
		while rows[i].length() < width:
			rows[i] += " "
	_los_cache.clear()
	_obstacles.clear()
	_walk.resize(width * height)
	_cost.resize(width * height)
	_cover.resize(width * height)
	_zone_diff.resize(width * height)
	_zone_diff.fill(0)
	_hazard.resize(width * height)
	_hazard.fill(0)
	for y in height:
		for x in width:
			var info: Dictionary = TILES.get(rows[y][x], TILES["."])
			var i2 := x + y * width
			_walk[i2] = 1 if info.walk else 0
			_cost[i2] = int(info.cost) * FT
			_cover[i2] = int(info.cover)
			if int(info.cover) > 0:
				_obstacles.append(Vector2i(x, y))

func in_bounds(c: Vector2i) -> bool:
	return c.x >= 0 and c.y >= 0 and c.x < width and c.y < height

func tile(c: Vector2i) -> String:
	if not in_bounds(c):
		return " "
	return rows[c.y][c.x]

func tile_info(c: Vector2i) -> Dictionary:
	return TILES.get(tile(c), TILES["."])

func walkable(c: Vector2i) -> bool:
	return in_bounds(c) and tile_info(c).walk

func move_cost(c: Vector2i) -> int:
	var base := int(tile_info(c).cost) * FT
	if in_bounds(c) and _zone_diff.size() > 0 and _zone_diff[c.x + c.y * width] == 1:
		base = max(base, 2 * FT)
	return base

func is_difficult(c: Vector2i) -> bool:
	if in_bounds(c) and _zone_diff.size() > 0 and _zone_diff[c.x + c.y * width] == 1:
		return true
	return tile_info(c).get("difficult", false)

## Capas de las zonas de conjuro: terreno difícil y casillas peligrosas.
func set_overlay(difficult: Array, hazard: Array) -> void:
	_zone_diff.fill(0)
	_hazard.fill(0)
	for c in difficult:
		if in_bounds(c):
			_zone_diff[c.x + c.y * width] = 1
	for c2 in hazard:
		if in_bounds(c2):
			_hazard[c2.x + c2.y * width] = 1

func is_hazard(c: Vector2i) -> bool:
	return in_bounds(c) and _hazard.size() > 0 and _hazard[c.x + c.y * width] == 1

# ------------------------------------------------------------------ geometría hexagonal

const ROW_H := 0.8660254   ## separación entre filas (√3/2) con 1 unidad entre centros vecinos
const HEX_R := 0.5773503   ## radio del hexágono (centro a vértice): 1/√3
## Direcciones axiales (q, r): E, NE, NO, O, SO, SE
const AXIAL_DIRS := [Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1), Vector2i(-1, 0), Vector2i(-1, 1), Vector2i(0, 1)]
## Vecinos en «odd-r» según la paridad de la fila
const ODDR_EVEN := [Vector2i(1, 0), Vector2i(0, -1), Vector2i(-1, -1), Vector2i(-1, 0), Vector2i(-1, 1), Vector2i(0, 1)]
const ODDR_ODD := [Vector2i(1, 0), Vector2i(1, -1), Vector2i(0, -1), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(1, 1)]

static func to_axial(c: Vector2i) -> Vector2i:
	return Vector2i(c.x - (c.y - (c.y & 1)) / 2, c.y)

static func from_axial(a: Vector2i) -> Vector2i:
	return Vector2i(a.x + (a.y - (a.y & 1)) / 2, a.y)

## Centro de una casilla en el plano de casillas.
static func center(c: Vector2i) -> Vector2:
	return Vector2(c.x + 0.5 + 0.5 * (c.y & 1), c.y * ROW_H + 0.5)

## Casilla que contiene un punto del plano.
static func cell_at(p: Vector2) -> Vector2i:
	var r := (p.y - 0.5) / ROW_H
	var q := (p.x - 0.5) - r * 0.5
	return from_axial(_cube_round(q, r))

static func _cube_round(qf: float, rf: float) -> Vector2i:
	var sf := -qf - rf
	var q := roundf(qf)
	var r := roundf(rf)
	var s := roundf(sf)
	var dq := absf(q - qf)
	var dr := absf(r - rf)
	var ds := absf(s - sf)
	if dq > dr and dq > ds:
		q = -r - s
	elif dr > ds:
		r = -q - s
	return Vector2i(int(q), int(r))

static func dist(a: Vector2i, b: Vector2i) -> int:
	## Distancia en hexágonos.
	var aa := to_axial(a)
	var bb := to_axial(b)
	var dq := aa.x - bb.x
	var dr := aa.y - bb.y
	return (absi(dq) + absi(dr) + absi(dq + dr)) / 2

static func dist_ft(a: Vector2i, b: Vector2i) -> int:
	return dist(a, b) * FT

static func neighbors(c: Vector2i) -> Array:
	var dirs: Array = ODDR_ODD if (c.y & 1) == 1 else ODDR_EVEN
	var out: Array = []
	for d in dirs:
		out.append(c + d)
	return out

## Compatibilidad con el código escrito para la cuadrícula: ahora son los 6 vecinos.
static func neighbors8(c: Vector2i) -> Array:
	return neighbors(c)

## Vecino de `c` que más se alinea con la dirección `dir` (en el plano de casillas).
static func step_toward(c: Vector2i, dir: Vector2) -> Vector2i:
	if dir.length() < 0.001:
		return c
	var best := c
	var best_d := -INF
	var o := center(c)
	var nd := dir.normalized()
	for n in neighbors(c):
		var v: Vector2 = (center(n) - o).normalized()
		var d := v.dot(nd)
		if d > best_d:
			best_d = d
			best = n
	return best

## Vértices del hexágono (en el plano de casillas), empezando por el de arriba.
static func corners(c: Vector2i) -> Array:
	var o := center(c)
	var out: Array = []
	for i in 6:
		var ang := deg_to_rad(-90.0 + 60.0 * i)
		out.append(o + Vector2(cos(ang), sin(ang)) * HEX_R)
	return out

## Puntos de origen posibles para un área dentro de una casilla: su centro y sus vértices.
static func candidate_points(c: Vector2i) -> Array:
	return [center(c)] + corners(c)

## Ajusta un punto al centro o vértice más cercano (origen de esferas y cuadrados).
static func snap_point(p: Vector2) -> Vector2:
	var best := center(cell_at(p))
	for q in candidate_points(cell_at(p)):
		if q.distance_to(p) < best.distance_to(p):
			best = q
	return best

## Casillas a `r` o menos de `c` (incluida).
static func within(c: Vector2i, r: int) -> Array:
	var out: Array = []
	var ac := to_axial(c)
	for dq in range(-r, r + 1):
		for dr in range(max(-r, -dq - r), min(r, -dq + r) + 1):
			out.append(from_axial(ac + Vector2i(dq, dr)))
	return out

## Casillas que atraviesa el segmento entre dos puntos del plano (muestreado).
static func cells_on_segment(a: Vector2, b: Vector2, step := 0.18) -> Array:
	var out: Array = []
	var n: int = max(1, int(ceil(a.distance_to(b) / step)))
	for i in range(n + 1):
		var c := cell_at(a.lerp(b, float(i) / n))
		if not c in out:
			out.append(c)
	return out

# ------------------------------------------------------------------ línea de visión y cobertura

func clear_cache() -> void:
	_los_cache.clear()

## Grado de cobertura entre dos casillas: 0 (ninguna), 1 (media, +2), 2 (tres cuartos, +5)
## o 3 (total, sin visión). Versión hexagonal del método de esquinas: desde el mejor de tres
## puntos de la casilla del atacante se trazan líneas a tres puntos de la del objetivo.
## `blockers` son casillas ocupadas por criaturas (dan cobertura media).
func cover_between(from: Vector2i, to: Vector2i, blockers: Array = []) -> int:
	if from == to or dist(from, to) == 1:
		return 0
	var key := "%d,%d>%d,%d" % [from.x, from.y, to.x, to.y]
	var base_cover: int
	var half_cells: Array
	if _los_cache.has(key):
		var cached: Array = _los_cache[key]
		base_cover = cached[0]
		half_cells = cached[1]
	else:
		var res := _cover_hex(from, to)
		base_cover = res[0]
		half_cells = res[1]
		_los_cache[key] = res
	if base_cover >= 1:
		return base_cover
	if half_cells.size() > 0:
		return 1
	if blockers.is_empty():
		return 0
	var line := cells_on_segment(center(from), center(to), 0.12)
	for bc in blockers:
		if bc == from or bc == to:
			continue
		if bc in line:
			return 1
	return 0

func _cover_hex(from: Vector2i, to: Vector2i) -> Array:
	var a := center(from)
	var b := center(to)
	# Salida rápida: ningún obstáculo cerca del segmento
	var lo := Vector2(min(a.x, b.x), min(a.y, b.y)) - Vector2.ONE
	var hi := Vector2(max(a.x, b.x), max(a.y, b.y)) + Vector2.ONE
	var any := false
	if _obstacles.size() < 60:
		for o in _obstacles:
			var oc := center(o)
			if oc.x >= lo.x and oc.x <= hi.x and oc.y >= lo.y and oc.y <= hi.y:
				any = true
				break
	else:
		# Mapas grandes: se miran solo las casillas del recuadro entre los dos puntos
		var y0: int = max(0, int(floor(lo.y / ROW_H)) - 1)
		var y1: int = min(height - 1, int(ceil(hi.y / ROW_H)) + 1)
		var x0: int = max(0, int(floor(lo.x)) - 1)
		var x1: int = min(width - 1, int(ceil(hi.x)) + 1)
		for yy in range(y0, y1 + 1):
			for xx in range(x0, x1 + 1):
				if _cover[xx + yy * width] > 0:
					any = true
					break
			if any:
				break
	if not any:
		return [0, []]
	var dir := (b - a).normalized()
	var perp := Vector2(-dir.y, dir.x) * 0.38
	var pts_from := [a, a + perp, a - perp]
	var pts_to := [b, b + perp, b - perp]
	var best_blocked := 99
	var best_half: Array = []
	for pf in pts_from:
		var blocked := 0
		var halfs: Array = []
		for pt in pts_to:
			var r := _trace_hex(pf, pt, from, to)
			if r.full:
				blocked += 1
			else:
				for h in r.half_cells:
					if not h in halfs:
						halfs.append(h)
		if blocked < best_blocked or (blocked == best_blocked and halfs.size() < best_half.size()):
			best_blocked = blocked
			best_half = halfs
	var cover := 0
	if best_blocked >= 3:
		cover = 3
	elif best_blocked == 2:
		cover = 2
	elif best_blocked == 1:
		cover = 1
	return [cover, best_half]

func _trace_hex(a: Vector2, b: Vector2, from: Vector2i, to: Vector2i) -> Dictionary:
	var full := false
	var half_cells: Array = []
	for c in cells_on_segment(a, b):
		if c == from or c == to:
			continue
		var cv: int = tile_info(c).cover
		if cv >= 3:
			full = true
			break
		elif cv >= 1 and not c in half_cells:
			half_cells.append(c)
	return {"full": full, "half_cells": half_cells}

func has_los(from: Vector2i, to: Vector2i) -> bool:
	return cover_between(from, to) < 3

static func cover_ac_bonus(cover: int) -> int:
	match cover:
		1: return 2
		2: return 5
	return 0

# ------------------------------------------------------------------ áreas
# Las áreas se miden con geometría real sobre los centros de los hexágonos: una casilla está
# dentro si su centro lo está. Los puntos de origen son centros o vértices de hexágono.

## Esfera: casillas cuyo centro está a `radius_ft` o menos del punto de origen
## (un centro o un vértice de hexágono).
func sphere_cells(point: Vector2, radius_ft: int) -> Array:
	var r := radius_ft / float(FT)
	var out: Array = []
	for c in within(cell_at(point), int(ceil(r)) + 1):
		if in_bounds(c) and center(c).distance_to(point) <= r + 0.02:
			out.append(c)
	return out

## Cono desde la casilla del lanzador hacia `toward` (punto del plano).
## Como en las reglas, a cada distancia el cono es tan ancho como largo es hasta ahí.
func cone_cells(origin: Vector2i, toward: Vector2, length_ft: int) -> Array:
	var o := center(origin)
	var dir := toward - o
	if dir.length() < 0.01:
		dir = Vector2(0, 1)
	dir = dir.normalized()
	var length := length_ft / float(FT)
	var out: Array = []
	var half_angle := deg_to_rad(31.0)
	for c in within(origin, int(ceil(length))):
		if c == origin or not in_bounds(c):
			continue
		var v := center(c) - o
		var along := v.dot(dir)
		if along <= 0.0 or along > length + 0.3:
			continue
		if absf(v.angle_to(dir)) <= half_angle and has_los(origin, c):
			out.append(c)
	return out

## Cuadrado orientado: casillas cuyo centro cae dentro de un cuadrado de lado `side`
## centrado en `p` y alineado con `axis`.
func _oriented_square(p: Vector2, axis: Vector2, side: float, exclude := Vector2i(-9999, -9999)) -> Array:
	var ax := axis.normalized()
	var perp := Vector2(-ax.y, ax.x)
	var half := side * 0.5 + 0.02
	var out: Array = []
	for c in within(cell_at(p), int(ceil(side)) + 1):
		if not in_bounds(c) or c == exclude:
			continue
		var v := center(c) - p
		if absf(v.dot(ax)) <= half and absf(v.dot(perp)) <= half:
			out.append(c)
	return out

## Cubo de `size_ft` que parte del borde de la casilla del lanzador hacia `toward`.
func cube_from_self(origin: Vector2i, toward: Vector2, size_ft: int) -> Array:
	var side := size_ft / float(FT)
	var dir := toward - center(origin)
	if dir.length() < 0.01:
		dir = Vector2(0, 1)
	dir = dir.normalized()
	var p := center(origin) + dir * (0.5 + side * 0.5)
	return _oriented_square(p, dir, side, origin)

## Cuadrado (o cubo) de `size_ft` centrado en `point`, alineado con el tablero.
func square_cells(point: Vector2, size_ft: int) -> Array:
	return _oriented_square(point, Vector2(1, 0), size_ft / float(FT)).filter(func(c): return tile_info(c).cover < 3)

## Línea de 1,5 m de ancho desde la casilla del lanzador hacia `toward`.
func line_cells(origin: Vector2i, toward: Vector2, length_ft: int) -> Array:
	var o := center(origin)
	var dir := toward - o
	if dir.length() < 0.01:
		dir = Vector2(0, 1)
	dir = dir.normalized()
	var length := length_ft / float(FT)
	var out: Array = []
	var t := 0.5
	while t <= length + 0.3:
		var c := cell_at(o + dir * t)
		if not in_bounds(c) or tile_info(c).cover >= 3:
			break
		if c != origin and not c in out:
			out.append(c)
		t += 0.2
	return out

## Emanación: casillas a `radius_ft` o menos de la criatura (sin contar su casilla).
func emanation_cells(origin: Vector2i, radius_ft: int) -> Array:
	var out: Array = []
	for c in within(origin, int(radius_ft / FT)):
		if c != origin and in_bounds(c) and has_los(origin, c):
			out.append(c)
	return out

# ------------------------------------------------------------------ rutas

## Dijkstra desde `start`. Devuelve {cost: Dictionary(cell->ft), prev: Dictionary(cell->cell)}.
## `occ` casilla->Creature; el que se mueve puede atravesar aliados y criaturas caídas.
func reachable(start: Vector2i, budget_ft: int, mover: Creature, occ: Dictionary, crawl: bool = false) -> Dictionary:
	## Dijkstra con cola de cubos sobre arrays (los costes son múltiplos de 5 pies).
	var n_cells := width * height
	var cost_a := PackedInt32Array()
	cost_a.resize(n_cells)
	cost_a.fill(1 << 30)
	var prev_a := PackedInt32Array()
	prev_a.resize(n_cells)
	prev_a.fill(-1)
	# Casillas bloqueadas por criaturas que no se pueden atravesar
	var blocked := PackedByteArray()
	blocked.resize(n_cells)
	for cell in occ.keys():
		if in_bounds(cell) and not _can_pass(cell, mover, occ):
			blocked[cell.x + cell.y * width] = 1
	var si := start.x + start.y * width
	cost_a[si] = 0
	var nb := int(budget_ft / FT) + 1
	var buckets: Array = []
	buckets.resize(max(nb, 1))
	for i in buckets.size():
		buckets[i] = PackedInt32Array()
	buckets[0].append(si)
	var touched := PackedInt32Array([si])
	for bi in buckets.size():
		var bucket: PackedInt32Array = buckets[bi]
		var idx := 0
		while idx < bucket.size():
			var ci: int = bucket[idx]
			idx += 1
			var cur_cost: int = cost_a[ci]
			if cur_cost != bi * FT:
				continue
			var cx := ci % width
			var cy := int(ci / width)
			var dirs: Array = ODDR_ODD if (cy & 1) == 1 else ODDR_EVEN
			for k in 6:
				var dd: Vector2i = dirs[k]
				var nx: int = cx + dd.x
				var ny: int = cy + dd.y
				if nx < 0 or ny < 0 or nx >= width or ny >= height:
					continue
				var ni := nx + ny * width
				if _walk[ni] == 0 or blocked[ni] == 1:
					continue
				var step: int = _cost[ni]
				if _zone_diff[ni] == 1 and step < 2 * FT:
					step = 2 * FT
				if crawl:
					step *= 2
				var nc := cur_cost + step
				if nc > budget_ft:
					continue
				if nc < cost_a[ni]:
					if cost_a[ni] == 1 << 30:
						touched.append(ni)
					cost_a[ni] = nc
					prev_a[ni] = ci
					var target_b: PackedInt32Array = buckets[int(nc / FT)]
					target_b.append(ni)
					buckets[int(nc / FT)] = target_b
			bucket = buckets[bi]
	var cost := {}
	var prev := {}
	for ti in touched:
		var cell := Vector2i(ti % width, int(ti / width))
		cost[cell] = cost_a[ti]
		if prev_a[ti] >= 0:
			prev[cell] = Vector2i(prev_a[ti] % width, int(prev_a[ti] / width))
	return {"cost": cost, "prev": prev}

## Ruta más corta (A* con cubos) para la exploración: devuelve [start, ..., goal] o [] si no hay.
## `blocked`: casillas prohibidas (personajes, trampas vistas). El terreno difícil cuesta el doble.
func find_path(start: Vector2i, goal: Vector2i, blocked: Dictionary = {}, max_iter := 20000) -> Array:
	if start == goal:
		return [start]
	if not in_bounds(goal) or not walkable(goal) or blocked.has(goal):
		return []
	var n_cells := width * height
	var g := PackedInt32Array()
	g.resize(n_cells)
	g.fill(1 << 29)
	var prev := PackedInt32Array()
	prev.resize(n_cells)
	prev.fill(-1)
	var si := start.x + start.y * width
	var gi := goal.x + goal.y * width
	g[si] = 0
	var buckets := {}
	var f0 := dist(start, goal)
	buckets[f0] = PackedInt32Array([si])
	var fmin := f0
	var iter := 0
	var found := false
	while iter < max_iter:
		if not buckets.has(fmin) or (buckets[fmin] as PackedInt32Array).is_empty():
			buckets.erase(fmin)
			if buckets.is_empty():
				break
			fmin = buckets.keys().min()
			continue
		var arr: PackedInt32Array = buckets[fmin]
		var ci: int = arr[arr.size() - 1]
		arr.resize(arr.size() - 1)
		buckets[fmin] = arr
		iter += 1
		if ci == gi:
			found = true
			break
		var cx := ci % width
		var cy := int(ci / width)
		var dirs: Array = ODDR_ODD if (cy & 1) == 1 else ODDR_EVEN
		for k in 6:
			var dd: Vector2i = dirs[k]
			var nx: int = cx + dd.x
			var ny: int = cy + dd.y
			if nx < 0 or ny < 0 or nx >= width or ny >= height:
				continue
			var ni := nx + ny * width
			if _walk[ni] == 0:
				continue
			var nc := Vector2i(nx, ny)
			if blocked.has(nc) and ni != gi:
				continue
			var step: int = 2 if _cost[ni] > FT else 1
			var ng: int = g[ci] + step
			if ng < g[ni]:
				g[ni] = ng
				prev[ni] = ci
				var f := ng + dist(nc, goal)
				if not buckets.has(f):
					buckets[f] = PackedInt32Array()
				var b2: PackedInt32Array = buckets[f]
				b2.append(ni)
				buckets[f] = b2
				if f < fmin:
					fmin = f
	if not found:
		return []
	var out: Array = []
	var cur := gi
	while cur >= 0:
		out.push_front(Vector2i(cur % width, int(cur / width)))
		if cur == si:
			break
		cur = prev[cur]
	return out

func _can_pass(cell: Vector2i, mover: Creature, occ: Dictionary) -> bool:
	if not occ.has(cell):
		return true
	var o: Creature = occ[cell]
	if o == mover or o.dead:
		return true
	if o.team == mover.team:
		return true
	if o.is_down():
		return true
	# Agilidad mediana: atravesar criaturas de tamaño mayor
	if mover.has_trait("halfling_nimbleness") and o.size_rank() > mover.size_rank():
		return true
	if abs(o.size_rank() - mover.size_rank()) >= 2:
		return true
	return false

static func can_end_in(cell: Vector2i, mover: Creature, occ: Dictionary) -> bool:
	if not occ.has(cell):
		return true
	var o: Creature = occ[cell]
	return o == mover or o.dead

static func build_path(prev: Dictionary, start: Vector2i, goal: Vector2i) -> Array:
	var path: Array = []
	var cur := goal
	if cur != start and not prev.has(cur):
		return []
	while cur != start:
		path.push_front(cur)
		cur = prev[cur]
	return path
