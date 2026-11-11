// Puente web · hoja resumida de un personaje (party_summary, sheet_summary) y tarjeta de conjuro
// (también la usa el creador). Se calcula con la criatura que sale de la hoja completada al nivel
// pedido y, si lo hay, el estado guardado entre combates (PG, espacios, recursos...).
#include "MdgBattle.h"
#include "MdgCharacterSheet.h"
#include "MdgFactory.h"
#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgWebInt.h"

namespace mdg::web
{

namespace
{

/** "+3" o "−1" (con el signo menos tipográfico, como en la hoja). */
std::string signo(int v)
{
	return v >= 0 ? format("+%d", v) : format("−%d", -v);
}

std::string con_mas(int v)
{
	return v >= 0 ? format("+%d", v) : format("%d", v);
}

Json nombre_desc(const std::string& id, const std::string& name, const std::string& desc)
{
	Json o = Json::object();
	o["id"] = id;
	o["name"] = name;
	o["desc"] = desc;
	return o;
}

/** Nombres especiales de algunos recursos (los demás salen del nombre del rasgo). */
std::string nombre_recurso(const std::string& k)
{
	static const Dict<std::string> kNombres = [] {
		Dict<std::string> d;
		d["focus"] = "Puntos de concentración";
		d["heroic_inspiration"] = "Inspiración heroica";
		d["stonecunning"] = "Conocimiento de la piedra";
		d["breath_weapon"] = "Arma de aliento";
		d["giant_ancestry"] = "Ascendencia gigante";
		d["adrenaline_rush"] = "Arrebato de adrenalina";
		d["relentless_endurance"] = "Aguante incansable";
		d["innate_sorcery"] = "Hechicería innata";
		d["sorcery_points"] = "Puntos de hechicería";
		d["uncanny_metabolism"] = "Metabolismo asombroso";
		return d;
	}();
	const std::string* n = kNombres.find(k);
	return n != nullptr ? *n : RulesDB::feature_name(k);
}

std::string idioma_de_especie(const std::string& sp)
{
	static const Dict<std::string> kIdiomas = [] {
		Dict<std::string> d;
		d["elf"] = "Élfico";
		d["half_elf"] = "Élfico";
		d["dwarf"] = "Enano";
		d["halfling"] = "Mediano";
		d["gnome"] = "Gnomo";
		d["dragonborn"] = "Dracónico";
		d["goliath"] = "Gigante";
		d["orc"] = "Orco";
		d["half_orc"] = "Orco";
		d["tiefling"] = "Infernal";
		return d;
	}();
	const std::string* n = kIdiomas.find(sp);
	return n != nullptr ? *n : std::string();
}

void anadir_unico(Json& lista, const std::string& s)
{
	for (const Json& x : lista)
	{
		if (x.is_string() && x.get_ref<const std::string&>() == s)
		{
			return;
		}
	}
	lista.push_back(s);
}

Json partes_ca(const Creature& c)
{
	Json parts = Json::array();
	const int dex = c.mod("dex");
	if (c.wears_armor())
	{
		const Json& a = c.armor_data();
		std::string t = jstr(a, "name", c.armor_id) + format(" %d", jint(a, "base", 10));
		if (jstr(a, "cat", "") != "heavy")
		{
			const int cap = jint(a, "dex_cap", 99);
			t += " + Des " + signo(std::min(dex, cap));
		}
		parts.push_back(t);
		if (c.armor_bonus > 0)
		{
			parts.push_back(format("Armadura mágica +%d", c.armor_bonus));
		}
		if (c.fighting_style == "defense")
		{
			parts.push_back("Estilo Defensa +1");
		}
	}
	else
	{
		parts.push_back("10 + Des " + signo(dex));
		if (c.has_trait("unarmored_defense_barbarian"))
		{
			parts.push_back("Defensa sin armadura (Con " + signo(c.mod("con")) + ")");
		}
		else if (c.has_trait("unarmored_defense_monk"))
		{
			parts.push_back("Defensa sin armadura (Sab " + signo(c.mod("wis")) + ")");
		}
		else if (c.has_trait("draconic_resilience"))
		{
			parts.push_back("Resistencia dracónica (Car " + signo(c.mod("cha")) + ")");
		}
	}
	if (c.has_shield)
	{
		parts.push_back(format("Escudo +%d", 2 + c.shield_bonus));
	}
	const int obj = c.item_ac + (c.wears_armor() ? 0 : c.item_ac_unarmored);
	if (obj != 0)
	{
		parts.push_back("Objetos " + signo(obj));
	}
	return parts;
}

} // namespace

Json tarjeta_conjuro(const std::string& sid)
{
	const Json& sp = RulesDB::spell(sid);
	const std::string cast = jstr(sp, "cast", "action");
	StrList bits;
	if (cast == "bonus")
	{
		bits.push_back("adicional");
	}
	else if (cast == "reaction")
	{
		bits.push_back("reacción");
	}
	else if (cast == "rider")
	{
		bits.push_back("al impactar");
	}
	if (jbool(sp, "concentration", false))
	{
		bits.push_back("concentración");
	}
	const std::string desc = jstr(sp, "desc", "");
	// Utilidad fuera del combate, salvo que la descripción ya lo diga
	if (jbool(sp, "utility", false) &&
		!(desc.find("exploración") != std::string::npos || desc.find("fuera de combate") != std::string::npos ||
			desc.find("diálogos") != std::string::npos))
	{
		bits.push_back("fuera de combate");
	}
	const int range = jint(sp, "range", 0);
	if (range >= 6)
	{
		bits.push_back(Loc::ft(range));
	}
	else if (jstr(sp, "target", "") == "self")
	{
		bits.push_back("personal");
	}
	const std::string school = jstr(sp, "school", "");
	Json o = Json::object();
	o["id"] = sid;
	o["name"] = jstr(sp, "name", sid);
	o["level"] = jint(sp, "level", 0);
	o["school"] = school;
	o["school_name"] = school.empty() ? std::string() : Loc::t("school." + school);
	o["icon"] = RulesDB::spell_icon(sid);
	o["cast"] = cast;
	o["concentration"] = jbool(sp, "concentration", false);
	o["tags"] = sp.value("tags", Json::array());
	o["bits"] = to_json(bits);
	o["sub"] = bits.empty() ? desc : "(" + join(bits, ", ") + ") " + desc;
	o["desc"] = desc;
	return o;
}

Json resumen_personaje(const Json& sheet, int level_in, const Json& state)
{
	const int level = std::clamp(level_in, 1, 3);
	const Json full = CharacterSheet::complete(sheet, level);
	const CreaturePtr cp = Factory::make_from_sheet(full, level, jstr(sheet, "id", "pc"));
	Creature& c = *cp;
	const int hp = jint(state, "hp", c.max_hp);
	const int temp = jint(state, "temp_hp", 0);
	std::vector<int> slots = c.slots_max;
	if (jhas(state, "slots"))
	{
		slots = jint_list(jarr(state, "slots"));
	}
	Dict<int> recursos = c.resources;
	const Json& sres = jobj(state, "resources");
	for (const auto& kv : sres.items())
	{
		if (recursos.has(kv.key()))
		{
			recursos[kv.key()] = std::min(jto_int(kv.value(), 0), c.resources_max.get(kv.key(), 0));
		}
	}
	Json o = Json::object();
	o["id"] = c.id;
	o["name"] = c.name;
	const size_t esp = c.name.find(' ');
	o["short_name"] = esp == std::string::npos ? c.name : c.name.substr(0, esp);
	o["title"] = c.title;
	o["pronoun"] = c.pronoun;
	o["species"] = c.species;
	o["species_name"] = jstr(jobj(RulesDB::species, c.species), "name", c.species);
	o["class"] = c.cls;
	const Json& cd = jobj(RulesDB::classes, c.cls);
	o["class_name"] = jstr(cd, "name", c.cls);
	o["subclass"] = c.subclass;
	o["subclass_name"] = jstr(jobj(jobj(cd, "subclasses"), c.subclass), "name", "");
	o["background"] = c.background;
	o["background_name"] = jstr(jobj(RulesDB::backgrounds, c.background), "name", c.background);
	o["level"] = c.level;
	o["prof"] = c.prof_bonus;
	Json abil = Json::object();
	for (const std::string& a : Creature::kAbilities)
	{
		Json e = Json::object();
		e["score"] = c.abilities.get(a, 10);
		e["mod"] = c.mod(a);
		e["save"] = c.save_bonus(a);
		e["save_prof"] = contains(c.save_profs, a);
		e["name"] = Loc::t("ab." + a);
		e["short"] = Loc::ability_short(a);
		abil[a] = e;
	}
	o["abilities"] = abil;
	o["ac"] = c.ac();
	o["ac_parts"] = partes_ca(c);
	o["hp"] = hp;
	o["max_hp"] = c.max_hp;
	o["temp_hp"] = temp;
	o["speed"] = c.speed();
	o["speed_text"] = Loc::ft(c.speed());
	o["initiative"] = c.initiative_bonus();
	Json pas = Json::object();
	pas["perception"] = 10 + c.skill_bonus("perception");
	pas["investigation"] = 10 + c.skill_bonus("investigation");
	pas["insight"] = 10 + c.skill_bonus("insight");
	o["passive"] = pas;
	o["darkvision"] = c.darkvision;
	o["darkvision_text"] = c.darkvision > 0 ? Loc::ft(c.darkvision) : std::string();
	o["size"] = c.size;
	Json skills = Json::array();
	for (const std::string& s : CharacterSheet::kSkills)
	{
		const std::string ab = Creature::skill_ability(s);
		Json e = Json::object();
		e["id"] = s;
		e["name"] = Loc::t("skill." + s);
		e["ability"] = ab;
		e["ability_short"] = Loc::ability_short(ab);
		e["mod"] = c.skill_bonus(s);
		e["prof"] = contains(c.skill_profs, s);
		e["expert"] = contains(c.expertise, s);
		e["adv"] = contains(c.item_adv, s);
		skills.push_back(e);
	}
	o["skills"] = skills;
	Json langs = Json::array({"Común"});
	const std::string li = idioma_de_especie(c.species);
	if (!li.empty())
	{
		anadir_unico(langs, li);
	}
	if (c.cls == "rogue")
	{
		anadir_unico(langs, "Jerga de ladrones");
	}
	if (c.cls == "druid")
	{
		anadir_unico(langs, "Druídico");
	}
	o["languages"] = langs;
	Json tools = Json::array();
	const std::string tool = jstr(jobj(RulesDB::backgrounds, c.background), "tool", "");
	if (!tool.empty())
	{
		tools.push_back(tool);
	}
	if (c.cls == "rogue")
	{
		anadir_unico(tools, "Herramientas de ladrón");
	}
	o["tools"] = tools;
	Json attacks = Json::array();
	for (const Var& p : Battle::profiles_of(&c))
	{
		const Var w = p.get("weapon", Var::dict());
		Json e = Json::object();
		e["key"] = p.gets("key");
		e["name"] = p.gets("name");
		const std::string kind = p.gets("kind");
		e["kind"] = kind;
		e["to_hit"] = p.geti("bonus");
		e["to_hit_text"] = signo(p.geti("bonus"));
		StrList partes;
		const Var dmg = p.get("damage", Var::array());
		if (dmg.is_array())
		{
			for (const Var& d : dmg.arr())
			{
				partes.push_back(d.gets("dice") + " " + Loc::dmg_type(d.gets("type")));
			}
		}
		e["damage"] = join(partes, " + ");
		e["mastery"] = c.has_mastery(w) ? Loc::t("mastery." + w.gets("mastery")) : std::string();
		if (kind == "melee")
		{
			e["range"] = Loc::ft(std::max(1, p.geti("reach", 1)) * 5);
		}
		else
		{
			const Var r = p.get("range", Var::array());
			e["range"] = Loc::ft(r.size() > 0 ? r.at(0).to_int() * 5 : 0) + "/" + Loc::ft(r.size() > 1 ? r.at(1).to_int() * 5 : 0);
		}
		e["ammo"] = kind == "melee" ? -1 : c.ammo_left(w);
		attacks.push_back(e);
	}
	o["attacks"] = attacks;
	const StrList known = c.known_spells();
	if (known.empty())
	{
		o["spells"] = Json();
	}
	else
	{
		Json sp = Json::object();
		std::string ab = c.casting_ability;
		if (ab.empty())
		{
			ab = c.spell_ability_for(known.front());
		}
		const std::string sid0 = c.casting_ability.empty() ? known.front() : std::string();
		sp["ability"] = ab;
		sp["ability_name"] = Loc::t("ab." + ab);
		sp["dc"] = c.spell_save_dc(sid0);
		sp["attack"] = c.spell_attack_bonus(sid0);
		sp["caster"] = c.caster_type;
		Json sl = Json::array();
		for (size_t i = 0; i < c.slots_max.size(); ++i)
		{
			if (c.slots_max[i] <= 0)
			{
				continue;
			}
			Json e = Json::object();
			e["level"] = static_cast<int>(i) + 1;
			e["cur"] = i < slots.size() ? slots[i] : 0;
			e["max"] = c.slots_max[i];
			sl.push_back(e);
		}
		sp["slots"] = sl;
		Json cantrips = Json::array();
		Json prepared = Json::array();
		for (const std::string& sid : known)
		{
			Json card = tarjeta_conjuro(sid);
			card["source"] = c.spell_source.get(sid, "class");
			card["at_will"] = contains(c.at_will, sid);
			card["free"] = c.free_casts.get(sid, 0);
			if (jint(RulesDB::spell(sid), "level", 0) == 0)
			{
				cantrips.push_back(card);
			}
			else
			{
				prepared.push_back(card);
			}
		}
		sp["cantrips"] = cantrips;
		sp["prepared"] = prepared;
		o["spells"] = sp;
	}
	Json feats_j = Json::array();
	Json features = Json::array();
	for (const std::string& f : CharacterSheet::class_features_up_to(full, level))
	{
		Json e = nombre_desc(f, RulesDB::feature_name(f), RulesDB::feature_desc(f));
		if (recursos.has(f))
		{
			e["uses"] = recursos.get(f, 0);
			e["max"] = c.resources_max.get(f, 0);
		}
		features.push_back(e);
	}
	o["features"] = features;
	Json res = Json::object();
	for (const auto& kv : recursos)
	{
		Json e = Json::object();
		e["name"] = nombre_recurso(kv.first);
		e["cur"] = kv.second;
		e["max"] = c.resources_max.get(kv.first, 0);
		res[kv.first] = e;
	}
	o["resources"] = res;
	Json traits = Json::array();
	StrList tl = jstrs(CharacterSheet::species_data(full), "traits");
	for (const std::string& t : jstrs(CharacterSheet::lineage_data(full), "traits"))
	{
		tl.push_back(t);
	}
	for (const std::string& t : tl)
	{
		traits.push_back(nombre_desc(t, RulesDB::feature_name(t), RulesDB::feature_desc(t)));
	}
	o["traits"] = traits;
	StrList fl = c.feats;
	if (!c.fighting_style.empty())
	{
		fl.push_back(c.fighting_style);
	}
	for (const std::string& f : fl)
	{
		const Json& fd = jobj(RulesDB::feats, f);
		feats_j.push_back(nombre_desc(f, jstr(fd, "name", f), jstr(fd, "desc", "")));
	}
	o["feats"] = feats_j;
	Json mast = Json::array();
	for (const std::string& w : c.masteries)
	{
		const Json& wd = jobj(RulesDB::weapons, w);
		const std::string m = jstr(wd, "mastery", "");
		Json e = Json::object();
		e["id"] = w;
		e["name"] = jstr(wd, "name", w);
		e["mastery"] = Loc::t("mastery." + m);
		e["desc"] = Loc::t("mastery_desc." + m);
		mast.push_back(e);
	}
	o["masteries"] = mast;
	Json conds = Json::array();
	for (const std::string& k : c.active_condition_list())
	{
		conds.push_back(Loc::cond(k));
	}
	o["conditions"] = conds;
	o["resist"] = to_json(c.resist);
	Json hd = Json::object();
	hd["cur"] = jint(state, "hit_dice", level);
	hd["max"] = level;
	hd["die"] = format("d%d", jint(cd, "hit_die", 8));
	o["hit_dice"] = hd;
	o["dead"] = jbool(state, "dead", false);
	o["buffs"] = state.is_object() ? state.value("buffs", Json::array()) : Json::array();
	o["visual"] = c.visual;
	return o;
}

} // namespace mdg::web
