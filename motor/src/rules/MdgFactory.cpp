#include "MdgFactory.h"

#include "MdgCharacterSheet.h"
#include "MdgItems.h"
#include "MdgRulesDB.h"

namespace mdg
{

CreaturePtr Factory::make_pc(const std::string& pid, int level)
{
	return make_from_sheet(jobj(RulesDB::party, pid), level, pid);
}

CreaturePtr Factory::make_from_sheet(const Json& sheet, int level, const std::string& cid)
{
	Json s = CharacterSheet::complete(sheet, level);
	Items::normalize(s);
	CreaturePtr cp = std::make_shared<Creature>();
	Creature& c = *cp;
	c.id = !cid.empty() ? cid : jstr(s, "id", "pc");
	c.template_id = c.id;
	c.sheet = s;
	c.name = jstr(s, "name", c.id);
	c.title = jstr(s, "title", "");
	c.pronoun = jstr(s, "pronoun", "m");
	c.team = 0;
	c.is_pc = true;
	c.controlled_by_player = true;
	c.level = level;
	c.cls = jstr(s, "class", "fighter");
	c.subclass = level >= 3 ? jstr(s, "subclass", "") : "";
	c.species = jstr(s, "species", "human");
	c.lineage = jstr(s, "lineage", "");
	c.ancestry = jstr(s, "ancestry", "");
	c.background = jstr(s, "background", "");
	c.ctype = "humanoid";
	c.abilities = CharacterSheet::final_abilities(s);
	c.prof_bonus = RulesDB::prof_bonus_for(level);
	c.visual = jobj(s, "visual");
	if (jbool(c.visual, "hero", false))
	{
		c.visual = CharacterSheet::visual_for(s);
	}
	c.ai_profile = jstr(s, "ai", "frontline");
	const Json& cd = jobj(RulesDB::classes, c.cls);
	c.save_profs = jstrs(cd, "saves");
	c.skill_profs = jstrs(s, "skills");
	c.expertise = CharacterSheet::expertise_list(s, level);
	c.feats = CharacterSheet::all_feats(s, level);
	c.fighting_style = jstr(s, "fighting_style", "");
	c.masteries = jstrs(s, "masteries");
	c.armor_id = Items::armor_base(jstr(s, "armor", ""));
	c.armor_bonus = Items::bonus(jstr(s, "armor", ""));
	c.has_shield = jbool(s, "shield", false);
	c.shield_bonus = c.has_shield ? Items::bonus(jstr(s, "shield_id", "shield")) : 0;
	const WornMods wm = Items::worn_mods(s);
	c.item_ac = wm.ac;
	c.item_ac_unarmored = wm.ac_unarmored;
	c.item_saves = wm.saves;
	c.item_checks = wm.checks;
	c.item_tools = wm.tools;
	c.item_skill = wm.skill;
	c.item_adv = wm.adv;
	c.immune_spells = wm.immune_spell;
	c.speed_min = wm.speed_min;
	c.ignore_armor_speed = wm.ignore_armor_speed;
	c.item_charges = jint_dict(jobj(s, "charges"));
	const int con_before = c.mod("con");
	for (const auto& kv : wm.set)
	{
		c.abilities[kv.first] = std::max(c.abilities.get(kv.first, 10), kv.second);
	}
	c.items = jint_dict(jobj(s, "items"));
	c.ammo = jint_dict(jobj(s, "ammo"));
	c.size = jstr(s, "size", "medium");
	c.resources.clear();
	// ---- Especie
	apply_species(c, s, level);
	for (const std::string& r : wm.resist)
	{
		add_unique(c.resist, r);
	}
	if (wm.wound_closure)
	{
		c.traits.push_back("wound_closure");
	}
	// ---- Rasgos de clase y subclase
	for (const std::string& f : CharacterSheet::class_features_up_to(s, level))
	{
		add_unique(c.traits, f);
	}
	if (jstr(s, "divine_order", "") == "protector" || jstr(s, "primal_order", "") == "warden")
	{
		c.traits.push_back("protector");
	}
	if (jstr(s, "primal_order", "") == "warden")
	{
		c.traits.push_back("warden");
	}
	if (c.cls == "ranger" && level >= 3)
	{
		c.traits.push_back(jstr(s, "hunters_prey", "colossus_slayer"));
	}
	// ---- Puntos de golpe
	c.max_hp = CharacterSheet::hp_at(s, level) + (c.mod("con") - con_before) * level;
	c.hp = c.max_hp;
	// ---- Recursos de clase
	apply_class_resources(c, cd, s, level);
	// ---- Armas
	c.weapons.clear();
	for (const std::string& wid : jstrs(s, "weapons"))
	{
		const Json entry = Items::weapon_entry(wid);
		if (entry.empty())
		{
			continue;
		}
		Var w = Var::from_json(entry);
		if (entry.contains("magic"))
		{
			w["magic"] = jint(entry, "magic");   // entero, como en Godot
		}
		c.weapons.push_back(w);
	}
	bool has_melee = false;
	for (const Var& w : c.weapons)
	{
		if (w.gets("kind", "") == "melee")
		{
			has_melee = true;
		}
	}
	if (c.cls == "monk" || !has_melee)
	{
		Var u = Var::from_json(RulesDB::weapon("unarmed"));
		u["ammo_key"] = "unarmed";
		c.weapons.push_back(u);
	}
	// ---- Magia
	apply_spells(c, cd, s, level);
	c.slots_max = c.slots;
	c.resources_max = c.resources;
	return cp;
}

void Factory::apply_species(Creature& c, const Json& s, int level)
{
	const Json& sp = RulesDB::species.contains(c.species) ? RulesDB::species[c.species] : jobj(RulesDB::species, "human");
	const Json& lin = jobj(jobj(sp, "lineages"), c.lineage);
	const Json& anc = jobj(jobj(sp, "ancestries"), c.ancestry);
	c.base_speed = jint(lin, "speed", jint(sp, "speed", 30));
	c.darkvision = jint(lin, "darkvision", jint(sp, "darkvision", 0));
	c.traits = jstrs(sp, "traits");
	c.resist = jstrs(sp, "resist");
	if (lin.contains("resist"))
	{
		add_unique(c.resist, jstr(lin, "resist"));
	}
	if (c.species == "human")
	{
		c.resources["heroic_inspiration"] = 1;
	}
	else if (c.species == "dwarf")
	{
		c.resources["stonecunning"] = c.prof_bonus;
	}
	else if (c.species == "dragonborn")
	{
		const std::string dtype = jstr(anc, "damage", "fire");
		add_unique(c.resist, dtype);
		c.breath_type = dtype;
		c.resources["breath_weapon"] = c.prof_bonus;
	}
	else if (c.species == "goliath")
	{
		c.traits.push_back(jstr(anc, "feature", "stones_endurance"));
		c.resources["giant_ancestry"] = c.prof_bonus;
	}
	else if (c.species == "orc")
	{
		c.resources["adrenaline_rush"] = c.prof_bonus;
		c.resources["relentless_endurance"] = 1;
	}
	else if (c.species == "half_orc")
	{
		c.resources["relentless_endurance"] = 1;
	}
	// Magia del linaje (élfico, gnomo, tiflin)
	const std::string lab = jstr(s, "lineage_ability", "int");
	StrList lin_cantrips;
	if (lin.contains("cantrip"))
	{
		lin_cantrips.push_back(jstr(lin, "cantrip"));
	}
	for (const std::string& x : jstrs(lin, "cantrips"))
	{
		lin_cantrips.push_back(x);
	}
	if (c.species == "tiefling")
	{
		lin_cantrips.push_back("thaumaturgy");
	}
	for (const std::string& x : lin_cantrips)
	{
		add_spell(c, x, "species", lab);
	}
	const Json& lin_spells = jobj(lin, "spells");
	for (auto it = lin_spells.begin(); it != lin_spells.end(); ++it)
	{
		if (level >= godot_to_int(it.key()))
		{
			add_spell(c, jto_str(it.value()), "species", lab, true);
		}
	}
}

void Factory::apply_class_resources(Creature& c, const Json& cd, const Json& s, int level)
{
	if (c.cls == "barbarian")
	{
		c.resources["rage"] = RulesDB::at_level_int(jat(cd, "rages"), level, 2);
		c.rage_damage = RulesDB::at_level_int(jat(cd, "rage_damage"), level, 2);
	}
	else if (c.cls == "bard")
	{
		c.resources["bardic_inspiration"] = std::max(1, c.mod("cha"));
		c.bardic_die = "1d6";
	}
	else if (c.cls == "cleric")
	{
		if (level >= 2)
		{
			c.resources["channel_divinity"] = RulesDB::at_level_int(jat(cd, "channel_divinity_uses"), level, 2);
		}
	}
	else if (c.cls == "druid")
	{
		if (level >= 2)
		{
			c.resources["wild_shape"] = RulesDB::at_level_int(jat(cd, "wild_shape_uses"), level, 2);
			c.wild_shapes = jstrs(s, "wild_shapes");
		}
	}
	else if (c.cls == "fighter")
	{
		c.resources["second_wind"] = RulesDB::at_level_int(jat(cd, "second_wind_uses"), level, 2);
		if (level >= 2)
		{
			c.resources["action_surge"] = 1;
		}
	}
	else if (c.cls == "monk")
	{
		c.martial_die = RulesDB::at_level_str(jat(cd, "martial_arts_die"), level, "1d6");
		if (level >= 2)
		{
			c.resources["focus"] = RulesDB::at_level_int(jat(cd, "focus_points"), level, 2);
			c.resources["uncanny_metabolism"] = 1;
		}
	}
	else if (c.cls == "paladin")
	{
		c.resources["lay_on_hands"] = jint(cd, "lay_on_hands_pool", 5) * level;
		if (level >= 3)
		{
			c.resources["channel_divinity"] = RulesDB::at_level_int(jat(cd, "channel_divinity_uses"), level, 2);
		}
	}
	else if (c.cls == "rogue")
	{
		c.sneak_attack = RulesDB::at_level_str(jat(cd, "sneak_attack"), level, "1d6");
	}
	else if (c.cls == "sorcerer")
	{
		c.resources["innate_sorcery"] = jint(cd, "innate_sorcery_uses", 2);
		if (level >= 2)
		{
			c.resources["sorcery_points"] = RulesDB::at_level_int(jat(cd, "sorcery_points"), level, 2);
			c.metamagic = jstrs(s, "metamagic");
		}
	}
	else if (c.cls == "warlock")
	{
		for (const std::string& inv : CharacterSheet::invocations_at(s, level))
		{
			add_unique(c.traits, inv);
		}
		if (contains(c.traits, std::string("pact_of_the_blade")))
		{
			c.pact_weapon = jstr(s, "pact_weapon", "");
		}
	}
}

void Factory::add_spell(Creature& c, const std::string& sid, const std::string& source, const std::string& ability, bool free_daily)
{
	const Json& sp = RulesDB::spell(sid);
	if (sp.empty())
	{
		return;
	}
	const int lvl = jint(sp, "level", 0);
	if (lvl == 0)
	{
		add_unique(c.cantrips, sid);
	}
	else if (free_daily)
	{
		c.free_casts[sid] = c.free_casts.get(sid, 0) + 1;
	}
	else if (!contains(c.prepared, sid) && !contains(c.always_prepared, sid))
	{
		c.prepared.push_back(sid);
	}
	if (!c.spell_source.has(sid) || source == "class")
	{
		c.spell_source[sid] = source;
		if (!ability.empty())
		{
			c.spell_ability[sid] = ability;
		}
	}
}

void Factory::apply_spells(Creature& c, const Json& cd, const Json& s, int level)
{
	const Json& cast = jobj(cd, "casting");
	if (!cast.empty())
	{
		c.casting_ability = jstr(cast, "ability", "");
		c.caster_type = jstr(cast, "type", "");
		c.slots_max = RulesDB::slots_for(c.caster_type, level);
		c.slots = c.slots_max;
		for (const std::string& x : jstrs(s, "cantrips"))
		{
			add_spell(c, x, "class");
		}
		const Json prep_now = RulesDB::at_level(jat(s, "prepared"), level, Json::array());
		for (const std::string& x : jstr_list(prep_now))
		{
			add_spell(c, x, "class");
		}
		for (const std::string& x : CharacterSheet::always_prepared(s, level))
		{
			add_unique(c.always_prepared, x);
			erase_first(c.prepared, x);
			if (jint(RulesDB::spell(x), "level", 0) == 0)
			{
				add_spell(c, x, "class");
			}
			c.spell_source[x] = "class";
		}
		// Usos gratuitos de clase
		if (c.cls == "paladin" && level >= 2)
		{
			c.free_casts["divine_smite"] = c.free_casts.get("divine_smite", 0) + 1;
		}
		if (c.cls == "ranger")
		{
			c.free_casts["hunters_mark"] =
				c.free_casts.get("hunters_mark", 0) + RulesDB::at_level_int(jat(cd, "favored_enemy_uses"), level, 2);
		}
	}
	// Iniciado en la magia
	const Json& mi = jobj(s, "magic_initiate");
	if (!mi.empty() && contains(c.feats, std::string("magic_initiate")))
	{
		const std::string ab = jstr(mi, "ability", "int");
		for (const std::string& x : jstrs(mi, "cantrips"))
		{
			add_spell(c, x, "feat", ab);
		}
		const std::string sp = jstr(mi, "spell", "");
		if (!sp.empty())
		{
			add_spell(c, sp, "feat", ab, true);
		}
	}
	// Guerrero bendito / druídico: dos trucos de otra lista
	if (c.fighting_style == "blessed_warrior" || c.fighting_style == "druidic_warrior")
	{
		const bool cleric_list = c.fighting_style == "blessed_warrior";
		const std::string ab2 = cleric_list ? "cha" : "wis";
		StrList picks = jstrs(s, "style_cantrips");
		if (picks.size() < 2)
		{
			picks = cleric_list ? StrList{"sacred_flame", "guidance"} : StrList{"starry_wisp", "guidance"};
		}
		for (const std::string& x : head(picks, 2))
		{
			add_spell(c, x, "style", ab2);
		}
	}
	// Brujo: invocaciones mágicas
	if (c.cls == "warlock")
	{
		if (contains(c.traits, std::string("pact_of_the_tome")))
		{
			for (const std::string& x : jstrs(s, "tome_cantrips"))
			{
				add_spell(c, x, "tome", "cha");
			}
		}
		if (contains(c.traits, std::string("armor_of_shadows")))
		{
			c.at_will.push_back("mage_armor");
			c.spell_source["mage_armor"] = "invocation";
			c.spell_ability["mage_armor"] = "cha";
		}
		if (contains(c.traits, std::string("fiendish_vigor")))
		{
			c.at_will.push_back("false_life");
			c.spell_source["false_life"] = "invocation";
			c.spell_ability["false_life"] = "cha";
		}
	}
	// Sin clase lanzadora: la característica del primer conjuro que tenga
	if (c.casting_ability.empty())
	{
		for (const auto& kv : c.spell_ability)
		{
			c.casting_ability = kv.second;
			break;
		}
	}
}

CreaturePtr Factory::make_monster(const std::string& mid, int index)
{
	const Json m = RulesDB::monster_data(mid);
	CreaturePtr cp = std::make_shared<Creature>();
	Creature& c = *cp;
	c.id = format("%s#%d", mid.c_str(), index);
	c.template_id = mid;
	c.name = jstr(m, "name", mid);
	c.team = 1;
	c.is_pc = false;
	c.size = jstr(m, "size", "medium");
	c.ctype = jstr(m, "type", "humanoid");
	c.tags = jstrs(m, "tags");
	c.abilities = jint_dict(jobj(m, "abilities"));
	c.save_overrides = jint_dict(jobj(m, "saves"));
	c.skill_overrides = jint_dict(jobj(m, "skills"));
	c.prof_bonus = jint(m, "pb", 2);
	c.fixed_ac = jint(m, "ac", 10);
	c.max_hp = jint(m, "hp", 1);
	c.hp = c.max_hp;
	c.base_speed = jint(m, "speed", 30);
	c.init_bonus_override = jint(m, "init", c.mod("dex"));
	c.resist = jstrs(m, "resist");
	c.vulnerable = jstrs(m, "vulnerable");
	c.immune = jstrs(m, "immune");
	c.condition_immune = jstrs(m, "condition_immune");
	c.traits = jstrs(m, "traits");
	c.darkvision = jint(m, "darkvision", 0);
	c.multiattack = jobj(m, "multiattack");
	c.life_drain = jobj(m, "life_drain");
	c.bonus_actions = jstrs(m, "bonus_actions");
	c.reactions = jstrs(m, "reactions");
	c.visual = jobj(m, "visual");
	c.ai_profile = jstr(m, "ai", "brute");
	c.xp = jint(m, "xp", 0);
	c.cr = jstr(m, "cr", "");
	c.weapons = monster_attacks(m, c);
	// Ampliación: los monstruos nuevos (marcados con _ampliacion) usan sus acciones con recarga del
	// SRD (como la telaraña de la araña gigante); los publicados las ignoran, como en el original.
	if (jbool(m, "_ampliacion", false))
	{
		for (const Json& sp : jarr(m, "spells"))
		{
			const std::string sid = jstr(sp, "id", "");
			if (sid.empty() || RulesDB::spell(sid).empty())
			{
				continue;
			}
			c.spell_ability[sid] = jstr(sp, "ability", "dex");
			c.spell_source[sid] = "monster";
			c.free_casts[sid] = jint(sp, "uses", 1);
			if (jint(sp, "recharge", 0) > 0)
			{
				c.recharge[sid] = jint(sp, "recharge", 6);
			}
		}
	}
	return cp;
}

std::vector<Var> Factory::monster_attacks(const Json& m, Creature& c)
{
	std::vector<Var> out;
	for (const Json& a : jarr(m, "attacks"))
	{
		Var w = Var::from_json(a);
		w["monster"] = true;
		if (w.gets("kind") == "ranged" && !w.has("props"))
		{
			w["props"] = Var::array();
		}
		if (w.has("ammo"))
		{
			const std::string wid = w.gets("id");
			c.ammo[wid] = w.geti("ammo");
			w["ammo_key"] = wid;
		}
		out.push_back(w);
	}
	return out;
}

std::string Factory::species_name(const std::string& sp)
{
	return jstr(jobj(RulesDB::species, sp), "name", sp);
}

std::string Factory::background_name(const std::string& bg)
{
	return jstr(jobj(RulesDB::backgrounds, bg), "name", bg);
}

} // namespace mdg
