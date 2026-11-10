class_name BattleSetup
extends Object
## Construye un Battle a partir de un encuentro de data/encounters.

const PARTY_ORDER := ["brenna", "pip", "ilyra", "odvar"]
## Conjuros que el grupo lanza antes de entrar en combate si puede.
const PRECAST_OK := ["mage_armor", "false_life", "longstrider", "barkskin", "magic_weapon", "armor_of_agathys"]

## party_override: lista de ids de data/party.json o de hojas de personaje (Dictionary con "id").
## `campaign`: si se da, los PJ entran con su estado guardado (PG, espacios, recursos).
static func build(encounter_id: String, seed_value: int = -1, party_override: Array = [], campaign: Campaign = null) -> Battle:
	var enc: Dictionary = RulesDB.encounters.get(encounter_id, {})
	var map := BattleMap.new()
	map.load_rows(enc.get("rows", []))
	var battle := Battle.new(map, seed_value)
	battle.encounter = enc
	battle.settings.sunlight = enc.get("ambient", "") in ["day"]
	var level: int = int(enc.get("level", 1))
	var spawns: Array = enc.get("party_spawn", [])
	var party: Array = party_override if not party_override.is_empty() else PARTY_ORDER
	for i in party.size():
		var entry = party[i]
		var pc: Creature
		if typeof(entry) == TYPE_DICTIONARY:
			pc = Factory.make_from_sheet(entry, level, str(entry.get("id", "pc%d" % i)))
		else:
			pc = Factory.make_pc(str(entry), level)
		if campaign != null:
			campaign.apply_state(pc)
		var sp: Array = spawns[i] if i < spawns.size() else [1, 1 + i]
		pc.cell = Vector2i(int(sp[0]), int(sp[1]))
		pc.facing = Vector2(1, 0)
		precast(battle, pc, campaign)
		battle.add_creature(pc)
	var counts := {}
	for e in enc.get("enemies", []):
		var mid: String = e.id
		counts[mid] = counts.get(mid, 0) + 1
		var m := Factory.make_monster(mid, counts[mid])
		m.cell = Vector2i(int(e.cell[0]), int(e.cell[1]))
		m.facing = Vector2(-1, 0)
		battle.add_creature(m)
	# Numerar nombres repetidos ("Trasgo esbirro 2")
	var totals := {}
	for c in battle.creatures:
		if not c.is_pc:
			totals[c.template_id] = totals.get(c.template_id, 0) + 1
	for c in battle.creatures:
		if not c.is_pc and totals[c.template_id] > 1:
			c.name = "%s %d" % [c.name, int(c.id.split("#")[1])]
	return battle

## Conjuros que duran horas: siguen activos entre combates hasta el próximo descanso.
const LONG_BUFFS := ["mage_armor"]
const HOUR_BUFFS := ["false_life", "longstrider", "barkskin", "magic_weapon", "armor_of_agathys"]

## Conjuros de larga duración lanzados antes del combate (Armadura de mago, Falsa vida...).
## Con `campaign`, los que siguen activos de un combate anterior no se vuelven a pagar.
static func precast(battle: Battle, pc: Creature, campaign: Campaign = null) -> void:
	var active: Array = []
	if campaign != null and campaign.state.has(pc.id):
		active = campaign.state[pc.id].get("buffs", [])
	var wanted: Array = pc.sheet.get("precast", []).duplicate()
	if "mage_armor" in pc.at_will and not "mage_armor" in wanted:
		wanted.append("mage_armor")
	if "false_life" in pc.at_will and not "false_life" in wanted:
		wanted.append("false_life")
	for sid in wanted:
		if not sid in PRECAST_OK or not sid in pc.known_spells():
			continue
		var sp := RulesDB.spell(sid)
		var lvl := int(sp.get("level", 1))
		if sid == "mage_armor" and not pc.armor_id.is_empty():
			continue
		# Pago: a voluntad, gratis o con el espacio más bajo
		var slot := lvl
		if sid in active:
			# Sigue activo: los PG temporales ya vienen guardados en el estado
			if sid in ["false_life", "armor_of_agathys"]:
				continue
		elif sid in pc.at_will:
			pass
		elif pc.free_casts.get(sid, 0) > 0:
			pc.free_casts[sid] -= 1
		elif pc.has_slot(lvl):
			slot = pc.lowest_slot(lvl)
			pc.slots[slot - 1] -= 1
		else:
			continue
		if campaign != null and campaign.state.has(pc.id) and not sid in active:
			var bl: Array = campaign.state[pc.id].get("buffs", [])
			bl.append(sid)
			campaign.state[pc.id]["buffs"] = bl
		match sid:
			"mage_armor", "longstrider", "barkskin":
				var kind: String = {"mage_armor": "mage_armor", "longstrider": "longstrider", "barkskin": "barkskin"}[sid]
				var e := Effect.new(kind)
				e.name = sp.get("name", sid)
				e.source = pc
				e.positive = true
				e.owner = pc
				pc.effects.append(e)
			"magic_weapon":
				var mw := Effect.new("magic_weapon")
				mw.name = "Arma mágica +1"
				mw.source = pc
				mw.positive = true
				mw.owner = pc
				mw.data = {"bonus": 1}
				pc.effects.append(mw)
			"false_life":
				var amt: int = 12 if (sid in pc.at_will and pc.has_trait("fiendish_vigor")) else battle.dice.roll("2d4+4").total + 5 * max(0, slot - 1)
				pc.temp_hp = max(pc.temp_hp, amt)
			"armor_of_agathys":
				var dmg := 5 * slot
				pc.temp_hp = max(pc.temp_hp, dmg)
				var ag := Effect.new("agathys")
				ag.name = "Armadura de Agathys"
				ag.source = pc
				ag.positive = true
				ag.owner = pc
				ag.data = {"dmg": dmg}
				pc.effects.append(ag)
