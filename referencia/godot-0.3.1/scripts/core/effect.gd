class_name Effect
extends RefCounted
## Efecto temporal sobre una criatura (conjuros, maestrías, acciones...).
## Las condiciones que concede se suman a las de la criatura mientras dure.

static var _next_uid := 1

var uid: int
var kind: String              ## "bless", "shield", "sap", "vex", "hold_person"...
var name: String = ""         ## nombre visible
var source: Creature = null   ## quien lo creó
var owner: Creature = null    ## quien lo tiene
var data: Dictionary = {}
## Cuándo caduca: "start_turn" / "end_turn" del creador o del portador, o "never".
var expires: String = "never"
var expires_who: Creature = null
var rounds_left: int = -1     ## -1 = sin límite de rondas
var concentration: bool = false
var grants: Array = []        ## condiciones que concede ("paralyzed", "incapacitated"...)
var uses: int = -1            ## -1 = ilimitado; si llega a 0 se elimina
var spell_id: String = ""
var icon: String = ""
var positive: bool = false    ## para colorear en la interfaz

func _init(p_kind: String = "") -> void:
	uid = _next_uid
	_next_uid += 1
	kind = p_kind

func describe() -> String:
	return name if not name.is_empty() else kind
