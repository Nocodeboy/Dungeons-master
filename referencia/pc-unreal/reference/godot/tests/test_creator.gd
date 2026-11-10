extends RefCounted
## Pruebas del creador de personajes (lógica, sin interfaz en pantalla).

var runner

const CLASSES := ["barbarian", "bard", "cleric", "druid", "fighter", "monk", "paladin", "ranger", "rogue", "sorcerer", "warlock", "wizard"]
const SPECIES := ["human", "elf", "half_elf", "dwarf", "halfling", "gnome", "dragonborn", "goliath", "orc", "half_orc", "tiefling"]

func _creator(cls: String, sp: String) -> CharacterCreator:
	var cc := CharacterCreator.new()
	cc.sheet = {"class": cls, "species": "human", "ability_method": "standard", "pronoun": "m", "visual": {}}
	cc._set_class(cls, true)
	cc._set_species(sp)
	cc.sheet["name"] = "Prueba"
	cc._refill()
	return cc

## Con las elecciones recomendadas, cualquier combinación está lista para jugar.
func test_defaults_are_complete_for_every_combo() -> void:
	for cls in CLASSES:
		for sp in SPECIES:
			var cc := _creator(cls, sp)
			var issues := cc._issues()
			runner.check(issues.is_empty(), "%s %s: %s" % [cls, sp, str(issues)])
			var r := cc.result_sheet()
			runner.check(r.get("is_hero", false) and r.visual.get("hero", false), "marca de héroe")
			for lvl in [1, 2, 3]:
				var errs := CharacterSheet.validate(CharacterSheet.complete(r, lvl), lvl)
				runner.check(errs.is_empty(), "%s %s nv%d: %s" % [cls, sp, lvl, str(errs)])
			var c := Factory.make_from_sheet(r, 1, "hero")
			runner.check(c.max_hp > 0 and c.visual.get("hero", false), "%s %s: criatura" % [cls, sp])
			cc.free()

func test_class_change_resets_dependent_choices() -> void:
	var cc := _creator("wizard", "elf")
	runner.check(not cc.sheet.get("cantrips", []).is_empty(), "el mago trae trucos")
	cc._set_class("fighter")
	cc._refill()
	runner.check(not cc.sheet.has("cantrips") or cc.sheet.cantrips.is_empty(), "el guerrero no tiene trucos")
	runner.check(cc.sheet.get("masteries", []).size() == 3, "el guerrero elige 3 maestrías")
	runner.eq(cc.sheet.background, "soldier", "trasfondo recomendado")
	runner.check(cc._issues().is_empty(), str(cc._issues()))
	cc.free()

func test_skills_feasibility() -> void:
	var cc := _creator("fighter", "elf")
	# Sentidos agudos solo admite Perspicacia, Percepción o Supervivencia
	var bg_sk: Array = cc._bgd().skills
	var ok := bg_sk + ["athletics", "intimidation", "perception"]
	runner.check(cc._skills_feasible(ok), "combinación válida")
	var bad := bg_sk + ["athletics", "intimidation", "arcana"]
	runner.check(not cc._skills_feasible(bad), "Arcanos no es de la lista del guerrero ni de Sentidos agudos")
	cc.sheet["skills"] = bg_sk + ["athletics"]
	runner.check(cc._issues_by_step().has("skills"), "faltan habilidades")
	cc.free()

func test_ability_methods() -> void:
	var cc := _creator("rogue", "halfling")
	cc._set_method("point_buy")
	runner.eq(CharacterSheet.point_buy_spent(cc.sheet.base_abilities), 27, "la matriz estándar cuesta 27")
	cc._adjust("dex", 1)
	runner.eq(int(cc.sheet.base_abilities.dex), 15, "no se puede pasar de 27 puntos")
	cc._adjust("cha", -1)
	runner.eq(int(cc.sheet.base_abilities.cha), 8, "mínimo 8")
	cc._set_method("standard")
	var before: int = int(cc.sheet.base_abilities.dex)
	cc._adjust("str", 1)
	var vals: Array = cc.sheet.base_abilities.values().map(func(x): return int(x))
	vals.sort()
	runner.eq(vals, [8, 10, 12, 13, 14, 15], "intercambiar mantiene la matriz")
	cc._set_method("roll")
	runner.eq(cc.sheet.get("rolls", []).size(), 6, "seis tiradas")
	for v in cc.sheet.rolls:
		runner.check(int(v) >= 3 and int(v) <= 18, "tirada en rango")
	runner.check(before > 0, "")
	cc.free()

func test_background_bonus_swaps() -> void:
	var cc := _creator("cleric", "dwarf")
	cc._set_background("sage")
	cc._refill()
	cc._set_bonus("wis", 2)
	cc._set_bonus("con", 1)
	runner.eq(cc.sheet.bg_bonus, {"wis": 2, "con": 1}, "reparto +2/+1")
	cc._set_bonus("con", 2)
	runner.eq(int(cc.sheet.bg_bonus.get("con", 0)), 2, "el +2 pasa a Constitución")
	runner.eq(int(cc.sheet.bg_bonus.get("wis", 0)), 1, "y Sabiduría queda con +1")
	cc.free()

func test_human_extra_feat_and_magic_initiate() -> void:
	var cc := _creator("fighter", "human")
	cc.sheet["human_feat"] = "magic_initiate"
	cc.sheet.erase("magic_initiate")
	cc._refill()
	runner.check("magic_initiate" in cc.sheet.feats, "dote elegida")
	var mi: Dictionary = cc._full().get("magic_initiate", {})
	runner.eq(mi.get("cantrips", []).size(), 2, "dos trucos de Iniciado")
	runner.check(cc._has_spells(), "aparece el paso de conjuros")
	var c := Factory.make_from_sheet(cc.result_sheet(), 1, "hero")
	runner.check(c.known_spells().size() >= 3, "conoce los conjuros de Iniciado")
	cc.free()

func test_random_names_are_not_empty() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 3
	for sp in SPECIES:
		for p in ["m", "f", "n"]:
			var n := CharacterSheet.random_name(sp, p, rng)
			runner.check(n.length() >= 3, "%s %s: '%s'" % [sp, p, n])

func test_hero_in_battle() -> void:
	var cc := _creator("paladin", "dragonborn")
	var hero := cc.result_sheet()
	cc.free()
	var b := BattleSetup.build("e1_prado", 3, [hero, "pip", "ilyra", "odvar"])
	var h := b.get_creature("hero")
	runner.check(h != null and h.is_pc, "el héroe entra en combate")
	runner.check(h.visual.get("hero", false) and str(h.visual.get("skin", "")) != "", "aspecto de héroe con escamas")
	var ai := AIBrain.new(b)
	b.start()
	var guard := 0
	while not b.over and guard < 300:
		guard += 1
		ai.take_turn(b.current)
		if not b.over:
			b.end_turn()
	runner.check(b.over, "el combate termina")

## Subir de nivel con lo recomendado deja la hoja lista en todas las clases.
func test_level_up_defaults() -> void:
	for cls in CLASSES:
		var cc := _creator(cls, "human")
		var hero := cc.result_sheet()
		cc.free()
		for lvl in [2, 3]:
			var lu := CharacterCreator.new()
			lu.setup_level_up(hero, lvl)
			lu._compute_steps()
			var issues := lu._issues()
			runner.check(issues.is_empty(), "%s nv%d: %s" % [cls, lvl, str(issues)])
			hero = lu.result_sheet()
			lu.free()
			runner.eq(int(hero.choices_level), lvl, "%s: nivel de elecciones" % cls)
			var errs := CharacterSheet.validate(CharacterSheet.complete(hero, lvl), lvl)
			runner.check(errs.is_empty(), "%s nv%d: %s" % [cls, lvl, str(errs)])
		# Sigue valiendo para niveles anteriores (repetir encuentros)
		var c1 := Factory.make_from_sheet(hero, 1, "hero")
		var c3 := Factory.make_from_sheet(hero, 3, "hero")
		runner.check(c3.max_hp > c1.max_hp, "%s: más PG a nivel 3" % cls)
		runner.check(c1.subclass.is_empty() and not c3.subclass.is_empty(), "%s: subclase solo a nivel 3" % cls)

func test_level_up_choices_are_kept() -> void:
	var cc := _creator("sorcerer", "elf")
	var hero := cc.result_sheet()
	cc.free()
	var lu := CharacterCreator.new()
	lu.setup_level_up(hero, 2)
	lu.sheet["metamagic"] = ["twinned", "careful"]
	var prep: Array = lu._prepared().duplicate()
	runner.eq(prep.size(), 4, "el hechicero prepara 4 a nivel 2")
	hero = lu.result_sheet()
	lu.free()
	var c := Factory.make_from_sheet(hero, 2, "hero")
	runner.eq(c.metamagic, ["twinned", "careful"], "metamagia elegida")
	runner.check(hero.prepared.has("1") and hero.prepared.has("2"), "preparados por nivel")

func test_party_order_and_companions() -> void:
	var saved_hero: Dictionary = Game.hero
	var saved_ids: Array = Game.party_ids
	var cc := _creator("wizard", "gnome")
	Game.hero = cc.result_sheet()
	cc.free()
	Game.party_ids = []
	var party := Game.current_party()
	runner.eq(party.size(), 4, "héroe y tres compañeros")
	runner.check(not "odvar" in party, "el mago deja fuera a Odvar por defecto")
	runner.eq(party[0], "brenna", "el frente sale primero")
	runner.check(typeof(party[3]) == TYPE_DICTIONARY, "el mago sale el último")
	Game.hero = saved_hero
	Game.party_ids = saved_ids

func test_half_elf_and_half_orc() -> void:
	var cc := _creator("bard", "half_elf")
	var full := cc._full()
	runner.eq(CharacterSheet.skill_slots(full, 1).species, 2, "Versatilidad: dos habilidades")
	var he := Factory.make_from_sheet(cc.result_sheet(), 1, "hero")
	runner.check(he.has_trait("fey_ancestry") and he.darkvision == 60, "semielfo: linaje feérico y visión")
	cc.free()
	var co := _creator("barbarian", "half_orc")
	runner.check("intimidation" in co.sheet.skills, "Amenazador da Intimidación")
	runner.check(co._issues().is_empty(), str(co._issues()))
	var ho := Factory.make_from_sheet(co.result_sheet(), 1, "hero")
	runner.eq(int(ho.resources.get("relentless_endurance", 0)), 1, "aguante incansable")
	runner.check(ho.has_trait("savage_attacks"), "ataques salvajes")
	co.free()
	# Trasfondo que ya da Intimidación: la repetida se cambia por otra libre
	var cs := _creator("fighter", "half_orc")
	cs._set_background("soldier")
	cs._refill()
	runner.check(cs._issues().is_empty(), "soldado semiorco: %s" % str(cs._issues()))
	cs.free()
