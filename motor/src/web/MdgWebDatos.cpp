// Puente web · datos y fichas: data, loc, monster_info, item_info, random_name.
// (Las operaciones del creador de personajes, sheet_*, están en MdgWebHoja.cpp.)
#include "MdgCharacterSheet.h"
#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgWebInt.h"

namespace mdg::web
{

bool grupo_hojas(const std::string& op, const Json& req, Json& out);
/** Texto de las reglas de un objeto, línea a línea (describe() de items.gd sin BBCode). */
StrList lineas_objeto(const std::string& id, bool unid);

namespace
{

const Json* tabla_datos(const std::string& nombre)
{
	if (nombre == "classes") return &RulesDB::classes;
	if (nombre == "species") return &RulesDB::species;
	if (nombre == "backgrounds") return &RulesDB::backgrounds;
	if (nombre == "feats") return &RulesDB::feats;
	if (nombre == "spells") return &RulesDB::spells;
	if (nombre == "weapons") return &RulesDB::weapons;
	if (nombre == "armor") return &RulesDB::armor;
	if (nombre == "items") return &RulesDB::items;
	if (nombre == "party") return &RulesDB::party;
	if (nombre == "monsters") return &RulesDB::monsters;
	if (nombre == "features") return &RulesDB::features;
	if (nombre == "names") return &RulesDB::names;
	if (nombre == "encounters") return &RulesDB::encounters;
	if (nombre == "levels") return &RulesDB::levels;
	if (nombre == "merchants") return &RulesDB::merchants;
	if (nombre == "world") return &RulesDB::world;
	return nullptr;
}

std::string con_signo(int v)
{
	return v >= 0 ? format("+%d", v) : format("%d", v);
}

/** "Nombre: descripción" de un rasgo traducido. */
Json rasgo(const std::string& id, const Var& args = Var())
{
	const std::string texto = Loc::t("trait." + id, args);
	Json t = Json::object();
	t["id"] = id;
	const size_t p = texto.find(": ");
	if (p != std::string::npos)
	{
		t["name"] = texto.substr(0, p);
		t["desc"] = texto.substr(p + 2);
	}
	else
	{
		t["name"] = texto;
		t["desc"] = "";
	}
	return t;
}

Json monster_info(const std::string& id)
{
	const Json d = RulesDB::monster_data(id);
	Json o = Json::object();
	o["id"] = id;
	o["name"] = jstr(d, "name", id);
	const std::string size = jstr(d, "size", "medium");
	o["size"] = size;
	o["size_name"] = Loc::t("size." + size);
	const std::string type = jstr(d, "type", "humanoid");
	o["type"] = type;
	o["type_name"] = Loc::t("ctype." + type);
	o["cr"] = jstr(d, "cr", "0");
	o["xp"] = jint(d, "xp", 0);
	o["ac"] = jint(d, "ac", 10);
	o["hp"] = jint(d, "hp", 1);
	o["hp_dice"] = jstr(d, "hp_dice", "");
	const int speed = jint(d, "speed", 30);
	o["speed"] = speed;
	std::string speed_text = Loc::ft(speed);
	if (jint(d, "climb", 0) > 0) speed_text += ", trepar " + Loc::ft(jint(d, "climb", 0));
	if (jint(d, "fly", 0) > 0) speed_text += ", volar " + Loc::ft(jint(d, "fly", 0));
	if (jint(d, "swim", 0) > 0) speed_text += ", nadar " + Loc::ft(jint(d, "swim", 0));
	o["speed_text"] = speed_text;
	Json abil = Json::object();
	const Json& ab = jobj(d, "abilities");
	for (const std::string& a : Creature::kAbilities)
	{
		const int score = jint(ab, a, 10);
		Json e = Json::object();
		e["score"] = score;
		e["mod"] = ability_mod(score);
		e["short"] = Loc::ability_short(a);
		abil[a] = e;
	}
	o["abilities"] = abil;
	Json skills = Json::array();
	for (const auto& kv : jobj(d, "skills").items())
	{
		Json e = Json::object();
		e["id"] = kv.key();
		e["name"] = Loc::t("skill." + kv.key());
		e["mod"] = jto_int(kv.value(), 0);
		skills.push_back(e);
	}
	o["skills"] = skills;
	o["passive_perception"] = jint(d, "passive_perception", 10);
	const int dv = jint(d, "darkvision", 0);
	o["darkvision"] = dv;
	o["darkvision_text"] = dv > 0 ? Loc::ft(dv) : std::string();
	for (const char* k : {"resist", "immune", "vulnerable"})
	{
		Json l = Json::array();
		for (const std::string& t : jstrs(d, k))
		{
			l.push_back(Loc::dmg_type(t));
		}
		o[k] = l;
	}
	Json traits = Json::array();
	for (const char* k : {"traits", "bonus_actions", "reactions"})
	{
		for (const std::string& t : jstrs(d, k))
		{
			traits.push_back(rasgo(t));
		}
	}
	const Json& multi = jobj(d, "multiattack");
	if (jint(multi, "count", 0) > 0)
	{
		Json t = rasgo("multiattack", vdict({{"n", jint(multi, "count", 0)}}));
		traits.push_back(t);
	}
	const Json& drain = jobj(d, "life_drain");
	if (!drain.empty())
	{
		traits.push_back(rasgo("life_drain", vdict({{"dc", jint(drain, "dc", 10)}})));
	}
	o["traits"] = traits;
	Json attacks = Json::array();
	for (const Json& a : jarr(d, "attacks"))
	{
		Json e = Json::object();
		e["id"] = jstr(a, "id", "");
		e["name"] = jstr(a, "name", "");
		const std::string kind = jstr(a, "kind", "melee");
		e["kind"] = kind;
		const int bonus = jint(a, "bonus", 0);
		e["to_hit"] = bonus;
		e["to_hit_text"] = con_signo(bonus);
		StrList partes;
		for (const Json& dmg : jarr(a, "damage"))
		{
			partes.push_back(jstr(dmg, "dice", "") + " " + Loc::dmg_type(jstr(dmg, "type", "")));
		}
		e["damage"] = join(partes, " + ");
		const Json& rng = jarr(a, "range");
		if (kind != "melee" && rng.size() >= 2)
		{
			e["range"] = Loc::ft(jto_int(rng[0])) + "/" + Loc::ft(jto_int(rng[1]));
		}
		else
		{
			e["range"] = Loc::ft(jint(a, "reach", 5));
		}
		attacks.push_back(e);
	}
	o["attacks"] = attacks;
	Json actions = Json::array();
	const int pb = jint(d, "pb", 2);
	for (const Json& s : jarr(d, "spells"))
	{
		const std::string sid = jstr(s, "id", "");
		const Json& sp = RulesDB::spell(sid);
		Json e = Json::object();
		e["id"] = sid;
		e["name"] = Loc::has("action." + sid) ? Loc::t("action." + sid) : jstr(sp, "name", sid);
		e["desc"] = jstr(sp, "desc", "");
		const std::string abl = jstr(s, "ability", "cha");
		e["dc"] = jint(s, "dc", 8 + pb + ability_mod(jint(ab, abl, 10)));
		actions.push_back(e);
	}
	o["actions"] = actions;
	o["desc"] = jstr(d, "form_desc", "");
	o["visual"] = jobj(d, "visual");
	return o;
}

const char* nombre_hueco(const std::string& slot)
{
	if (slot == "weapon") return "Arma";
	if (slot == "armor") return "Armadura";
	if (slot == "shield") return "Escudo";
	if (slot == "cloak") return "Capa";
	if (slot == "ring" || slot == "ring1" || slot == "ring2") return "Anillo";
	if (slot == "amulet") return "Amuleto";
	if (slot == "boots") return "Botas";
	if (slot == "gloves") return "Guantes";
	return nullptr;
}

std::string nombre_rareza(const std::string& r)
{
	if (r == "common") return "común";
	if (r == "uncommon") return "infrecuente";
	if (r == "rare") return "raro";
	if (r == "very_rare") return "muy raro";
	return r;
}

std::string texto_des(const Json& a)
{
	const int cap = jint(a, "dex_cap", 99);
	if (jstr(a, "cat", "") == "heavy") return "";
	if (cap >= 99) return " + Des";
	return format(" + Des (máx. %d)", cap);
}

std::string linea_base(const std::string& base)
{
	if (RulesDB::weapons.contains(base))
	{
		const Json& w = RulesDB::weapons[base];
		StrList props;
		for (const std::string& p : jstrs(w, "props"))
		{
			props.push_back(Loc::has("prop." + p) ? Loc::t("prop." + p) : p);
		}
		std::string rng;
		const Json& r = jarr(w, "range");
		if (r.size() >= 2)
		{
			rng = " · distancia " + Loc::ft(jto_int(r[0])) + "/" + Loc::ft(jto_int(r[1]));
		}
		const std::string cat = jstr(w, "cat", "") == "simple" ? "Arma sencilla" : "Arma marcial";
		return cat + " · " + jstr(w, "damage", "") + " " + Loc::dmg_type(jstr(w, "type", "")) + rng +
			(props.empty() ? std::string() : " · " + join(props, ", "));
	}
	if (RulesDB::armor.contains(base))
	{
		const Json& a = RulesDB::armor[base];
		const std::string c = jstr(a, "cat", "");
		const std::string cat = c == "light" ? "Armadura ligera" : c == "medium" ? "Armadura intermedia" : c == "heavy" ? "Armadura pesada" : "Armadura";
		std::string extra;
		if (jint(a, "str_req", 0) > 0) extra += format(" · Fue %d", jint(a, "str_req", 0));
		if (jbool(a, "stealth_dis", false)) extra += " · desventaja en Sigilo";
		return cat + format(" · CA %d", jint(a, "base", 10)) + texto_des(a) + extra;
	}
	return "";
}

Json item_info(const std::string& id, bool unid)
{
	const Json d = Items::data(id);
	Json o = Json::object();
	o["id"] = id;
	o["name"] = Items::name_of(id, unid);
	o["real_name"] = Items::name_of(id);
	const std::string kind = jstr(d, "kind", "");
	o["kind"] = kind;
	const std::string slot = Items::slot_of(id);
	o["slot"] = slot;
	const char* sn = nombre_hueco(slot);
	o["slot_name"] = sn != nullptr ? std::string(sn) : slot;
	o["base"] = Items::base_of(id);
	const StrList lineas = lineas_objeto(id, unid);
	o["desc"] = join(lineas, "\n");
	o["lines"] = to_json(lineas);
	o["price"] = Items::value(id);
	o["sell"] = Items::sell_value(id, unid);
	o["weight"] = jnum(d, "weight", 0.0);
	o["magic"] = Items::is_magic(id);
	const std::string rar = Items::rarity(id);
	o["rarity"] = rar;
	o["rarity_name"] = rar.empty() ? std::string() : nombre_rareza(rar);
	o["attune"] = Items::needs_attunement(id);
	o["unidentified_name"] = jstr(d, "unid_name", "");
	o["icon"] = Items::icon_of(id);
	Json props = Json::array();
	const std::string base = Items::base_of(id);
	if (kind == "weapon" && RulesDB::weapons.contains(base))
	{
		for (const std::string& p : jstrs(RulesDB::weapons[base], "props"))
		{
			props.push_back(Loc::has("prop." + p) ? Loc::t("prop." + p) : p);
		}
	}
	o["props"] = props;
	o["stackable"] = Items::stackable(id);
	return o;
}

} // namespace

StrList lineas_objeto(const std::string& id, bool unid)
{
	const Json d = Items::data(id);
	StrList lines;
	if (d.empty())
	{
		return lines;
	}
	const std::string k = jstr(d, "kind", "");
	if (unid)
	{
		lines.push_back("Objeto mágico sin identificar. Un descanso corto o el conjuro Identificar revelarán qué hace.");
		const std::string b = Items::base_of(id);
		if (b != id)
		{
			lines.push_back(linea_base(b));
		}
		return lines;
	}
	if (k == "weapon")
	{
		lines.push_back(linea_base(Items::base_of(id)));
	}
	else if (k == "armor")
	{
		const Json& a = jobj(RulesDB::armor, Items::base_of(id));
		lines.push_back(linea_base(Items::base_of(id)));
		if (Items::bonus(id) > 0)
		{
			lines.push_back(format("CA %d", jint(a, "base", 10) + Items::bonus(id)) + texto_des(a));
		}
	}
	StrList tags;
	if (jhas(d, "rarity"))
	{
		tags.push_back("Mágico, " + nombre_rareza(jstr(d, "rarity", "")));
	}
	if (jbool(d, "attune", false))
	{
		tags.push_back("requiere sintonía");
	}
	const std::string slot = Items::slot_of(id);
	if (!slot.empty() && k == "wondrous")
	{
		const char* sn = nombre_hueco(slot);
		tags.push_back(sn != nullptr ? std::string(sn) : slot);
	}
	if (!tags.empty())
	{
		lines.push_back(join(tags, ", "));
	}
	if (jhas(d, "desc"))
	{
		lines.push_back(jstr(d, "desc", ""));
	}
	return lines;
}

bool grupo_datos(const std::string& op, const Json& req, Json& out)
{
	if (op == "data")
	{
		const std::string nombre = jstr(req, "name", "");
		const Json* t = tabla_datos(nombre);
		out = t != nullptr ? *t : error_json("No hay datos con ese nombre: " + nombre);
		return true;
	}
	if (op == "loc")
	{
		const Json& keys = jat(req, "keys");
		if (!keys.is_array())
		{
			// Sin claves: la tabla entera del idioma
			out = Json::object();
			for (const auto& kv : Loc::table().items())
			{
				out[kv.key()] = kv.value();
			}
			return true;
		}
		out = Json::object();
		for (const Json& k : keys)
		{
			const std::string key = jto_str(k);
			out[key] = Loc::t(key);
		}
		return true;
	}
	if (op == "monster_info")
	{
		const std::string id = jstr(req, "id", "");
		out = RulesDB::monsters.contains(id) ? monster_info(id) : error_json("Ese monstruo no existe: " + id);
		return true;
	}
	if (op == "item_info")
	{
		const std::string id = jstr(req, "id", "");
		out = Items::exists(id) ? item_info(id, jbool(req, "unid", false)) : error_json("Ese objeto no existe: " + id);
		return true;
	}
	if (op == "random_name")
	{
		Pcg32 local;
		Pcg32& rng = rng_de(req, local);
		out = Json::object();
		out["name"] = CharacterSheet::random_name(jstr(req, "species", "human"), jstr(req, "pronoun", "m"), &rng);
		return true;
	}
	return grupo_hojas(op, req, out);
}

} // namespace mdg::web
