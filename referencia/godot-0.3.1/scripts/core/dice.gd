class_name Dice
extends RefCounted
## Tiradas de dados deterministas (semilla) para reglas, simulaciones y repeticiones.

var rng := RandomNumberGenerator.new()

func _init(seed_value: int = -1) -> void:
	if seed_value >= 0:
		rng.seed = seed_value
	else:
		rng.randomize()

func die(sides: int) -> int:
	return rng.randi_range(1, sides)

## Tira un d20 con ventaja (1), normal (0) o desventaja (-1).
## Devuelve {rolls, natural}. `reroll_ones` implementa la Suerte mediana.
func d20(mode: int = 0, reroll_ones: bool = false) -> Dictionary:
	var a := _d20_single(reroll_ones)
	if mode == 0:
		return {"rolls": [a], "natural": a}
	var b := _d20_single(reroll_ones)
	var nat: int = max(a, b) if mode > 0 else min(a, b)
	return {"rolls": [a, b], "natural": nat}

func _d20_single(reroll_ones: bool) -> int:
	var r := die(20)
	if reroll_ones and r == 1:
		r = die(20)
	return r

## Tira una expresión de dados: "2d6", "1d8+3", "3d6-1", "4".
## Devuelve {total, rolls:Array[int], bonus:int, dice:String}.
func roll(expr: String, crit: bool = false, min_die: int = 0) -> Dictionary:
	var parsed := Dice.parse(expr)
	var rolls: Array[int] = []
	var count: int = parsed.count * (2 if crit else 1)
	for i in count:
		var r := die(parsed.sides) if parsed.sides > 0 else 0
		if min_die > 0 and r < min_die:
			r = min_die
		rolls.append(r)
	var total: int = parsed.bonus
	for r in rolls:
		total += r
	return {"total": total, "rolls": rolls, "bonus": parsed.bonus, "dice": expr}

## Analiza "XdY+Z". Un número suelto se trata como bonificador fijo.
static func parse(expr: String) -> Dictionary:
	var e := expr.replace(" ", "").to_lower()
	var count := 0
	var sides := 0
	var bonus := 0
	if e.is_empty():
		return {"count": 0, "sides": 0, "bonus": 0}
	var dpos := e.find("d")
	if dpos == -1:
		return {"count": 0, "sides": 0, "bonus": int(e)}
	var c_str := e.substr(0, dpos)
	count = 1 if c_str.is_empty() else int(c_str)
	var rest := e.substr(dpos + 1)
	var sign_pos := -1
	for i in rest.length():
		if rest[i] == "+" or rest[i] == "-":
			sign_pos = i
			break
	if sign_pos == -1:
		sides = int(rest)
	else:
		sides = int(rest.substr(0, sign_pos))
		bonus = int(rest.substr(sign_pos))
	return {"count": count, "sides": sides, "bonus": bonus}

## Tirada rápida con un generador cualquiera (fuera del combate).
static func roll_with(expr: String, rng: RandomNumberGenerator) -> int:
	var p := Dice.parse(expr)
	var total: int = p.bonus
	for i in int(p.count):
		total += rng.randi_range(1, max(1, int(p.sides)))
	return total

## Valor medio de una expresión (para la IA y las previsiones de la interfaz).
static func average(expr: String) -> float:
	var p := Dice.parse(expr)
	return p.count * (p.sides + 1) / 2.0 + p.bonus

static func max_value(expr: String) -> int:
	var p := Dice.parse(expr)
	return p.count * p.sides + p.bonus

## Suma de dados con el mismo número de caras: "1d8" + "1d8" -> "2d8".
static func add_dice(expr: String, extra_count: int) -> String:
	var p := Dice.parse(expr)
	var s := "%dd%d" % [p.count + extra_count, p.sides]
	if p.bonus > 0:
		s += "+%d" % p.bonus
	elif p.bonus < 0:
		s += "%d" % p.bonus
	return s

static func with_bonus(expr: String, bonus: int) -> String:
	var p := Dice.parse(expr)
	var b: int = p.bonus + bonus
	var s := ""
	if p.count > 0:
		s = "%dd%d" % [p.count, p.sides]
	if b > 0:
		s += ("+%d" % b) if not s.is_empty() else str(b)
	elif b < 0:
		s += "%d" % b
	if s.is_empty():
		s = "0"
	return s

## Probabilidad de que d20 + bonus >= objetivo, con modo de ventaja.
static func p_success(bonus: float, target: int, mode: int = 0, crit_range: int = 20, auto_fail_one: bool = true) -> float:
	# Probabilidad con un solo dado
	var need := target - bonus
	var p := 0.0
	for r in range(1, 21):
		var ok := false
		if r >= crit_range:
			ok = true
		elif r == 1 and auto_fail_one:
			ok = false
		else:
			ok = (r + bonus) >= target
		if ok:
			p += 0.05
	if mode > 0:
		return 1.0 - (1.0 - p) * (1.0 - p)
	elif mode < 0:
		return p * p
	return p
