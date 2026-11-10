// Puente web · campaña: el documento de partida «cp» (port de campaign.gd sobre JSON) y sus
// operaciones cp_*, party_summary y has_item. La campaña no vive en el módulo: cada llamada
// recibe el documento, lo normaliza, lo cambia y lo devuelve.
#include "MdgCampana.h"

#include "MdgCharacterSheet.h"
#include "MdgFactory.h"
#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgWebInt.h"

namespace mdg::web
{

Json resumen_personaje(const Json& sheet, int level, const Json& state);

namespace
{

/** Unidades de un objeto en una hoja: apiladas, en la mochila y equipadas. */
int contar_todo(Json& s, const std::string& id)
{
	int n = Items::count(s, id);
	if (contains(jstrs(s, "weapons"), id))
	{
		n += 1;
	}
	if (jstr(s, "armor", "") == id)
	{
		n += 1;
	}
	if (jbool(s, "shield", false) && jstr(s, "shield_id", "shield") == id)
	{
		n += 1;
	}
	const Json& worn = jobj(s, "worn");
	for (const std::string& slot : Items::kWornSlots)
	{
		if (jstr(worn, slot, "") == id)
		{
			n += 1;
		}
	}
	return n;
}

Json con_cp(const Json& cp)
{
	Json o = Json::object();
	o["cp"] = cp;
	return o;
}

/** Estado de PG de un miembro para las respuestas de curar y dañar. */
Json pg_de(const Json& cp, const std::string& id)
{
	const Json& st = jobj(jobj(cp, "state"), id);
	const int max_hp = campana::max_hp(cp, id);
	const int hp = jint(st, "hp", max_hp);
	const bool dead = jbool(st, "dead", false);
	Json o = Json::object();
	o["id"] = id;
	o["hp"] = hp;
	o["max_hp"] = max_hp;
	o["temp_hp"] = jint(st, "temp_hp", 0);
	o["down"] = !dead && hp <= 0;
	o["dead"] = dead;
	return o;
}

/** Ids a los que afecta una curación o un daño: "all" = todo el grupo. */
StrList objetivos(const Json& cp, const Json& req)
{
	const std::string id = jstr(req, "id", "all");
	if (id == "all")
	{
		return jstrs(cp, "party");
	}
	return {id};
}

/** Une los campos de un único resultado a la respuesta (cp_heal / cp_damage con un id). */
void resultado_unico(Json& out, const Json& results, const Json& req)
{
	(void)req;
	if (results.size() != 1)
	{
		return;
	}
	for (const auto& kv : results.begin().value().items())
	{
		out[kv.key()] = kv.value();
	}
}

Json curar(Json& cp, const Json& req)
{
	Json results = Json::object();
	for (const std::string& id : objetivos(cp, req))
	{
		if (!campana::es_miembro(cp, id) || campana::muerto(cp, id))
		{
			continue;
		}
		const Json antes = pg_de(cp, id);
		const int amount = jint(req, "amount", -1);
		const int max_hp = antes["max_hp"].get<int>();
		const int hp = amount >= 0 ? std::min(antes["hp"].get<int>() + amount, max_hp) : max_hp;
		cp["state"][id]["hp"] = hp;
		results[id] = pg_de(cp, id);
	}
	Json out = con_cp(cp);
	out["ok"] = !results.empty();
	out["results"] = results;
	resultado_unico(out, results, req);
	return out;
}

double multiplicador(const Creature& c, const std::string& tipo)
{
	if (tipo.empty())
	{
		return 1.0;
	}
	double m = contains(c.resist, tipo) ? 0.5 : 1.0;
	if (contains(c.immune, tipo))
	{
		m = 0.0;
	}
	if (contains(c.vulnerable, tipo))
	{
		m = m + m;
	}
	return m;
}

Json danar(Json& cp, const Json& req)
{
	Json results = Json::object();
	for (const std::string& id : objetivos(cp, req))
	{
		if (!campana::es_miembro(cp, id) || campana::muerto(cp, id))
		{
			continue;
		}
		const int amount = std::max(0, jint(req, "amount", 0));
		const std::string tipo = jstr(req, "type", "");
		const bool letal = jbool(req, "lethal", false);
		const CreaturePtr c = campana::criatura(cp, id, -1);
		Json& st = cp["state"][id];
		const int dealt = static_cast<int>(multiplicador(*c, tipo) * amount);
		const int hp = jint(st, "hp", c->max_hp);
		const int absorbe = std::min(c->temp_hp, dealt);
		int nuevo = hp + absorbe - dealt;
		if (letal)
		{
			nuevo = std::max(nuevo, 0);
		}
		else
		{
			nuevo = std::max(nuevo, hp > 0 ? 1 : hp);
		}
		st["temp_hp"] = c->temp_hp - absorbe;
		st["hp"] = nuevo;
		Json r = pg_de(cp, id);
		r["dealt"] = dealt;
		r["name"] = campana::nombre_corto(cp, id);
		results[id] = r;
	}
	Json out = con_cp(cp);
	out["ok"] = !results.empty();
	out["results"] = results;
	resultado_unico(out, results, req);
	return out;
}

Json descanso_corto(Json& cp, const Json& req)
{
	if (jint(cp, "short_rests_left", 2) <= 0 && !jbool(req, "force", false))
	{
		Json out = con_cp(cp);
		out["ok"] = false;
		out["reason"] = "Ya no podéis descansar así: haced un descanso largo.";
		out["report"] = Json::object();
		out["identified"] = Json::array();
		return out;
	}
	Pcg32 local;
	Pcg32& rng = rng_de(req, local);
	Json report = campana::descanso_corto(cp, jobj(req, "spend"), rng);
	Json identificados = report.value("_identified", Json::array());
	report.erase("_identified");
	StrList partes;
	for (const std::string& id : jstrs(cp, "party"))
	{
		const Json& r = jobj(report, id);
		const int curado = jint(r, "healed", 0);
		if (curado <= 0)
		{
			continue;
		}
		const int dados = jint(r, "dice", 0);
		partes.push_back(format("%s +%d PG (%d %s)", campana::nombre_corto(cp, id).c_str(), curado, dados, dados == 1 ? "dado" : "dados"));
	}
	std::string texto = partes.empty() ? "Descanso corto. Nadie necesitaba curarse." : "Descanso corto. " + join(partes, ", ") + ".";
	if (!identificados.empty())
	{
		texto += " Al examinarlos con calma, descubrís qué son: " + join(jstr_list(identificados), ", ") + ".";
	}
	Json out = con_cp(cp);
	out["ok"] = true;
	out["reason"] = "";
	out["report"] = report;
	out["identified"] = identificados;
	out["text"] = texto;
	out["left"] = jint(cp, "short_rests_left", 0);
	return out;
}

Json subir_nivel(Json& cp, const Json& req)
{
	const int antes = campana::nivel(cp);
	const int destino = std::clamp(jint(req, "level", antes + 1), 1, CharacterSheet::kMaxLevel);
	// Elecciones de la subida (el creador en modo subida) por miembro: la hoja nueva conserva el
	// equipo y la identidad de la anterior
	static const char* const kConservar[] = {"id", "weapons", "armor", "shield", "shield_id", "worn", "pack",
		"items", "ammo", "charges", "kit", "mercenary", "is_hero"};
	for (const auto& kv : jobj(req, "choices").items())
	{
		if (!campana::es_miembro(cp, kv.key()) || !kv.value().is_object())
		{
			continue;
		}
		const Json viejo = cp["members"][kv.key()];
		Json k = kv.value();
		k.erase("_creator");
		for (const char* clave : kConservar)
		{
			if (viejo.contains(clave))
			{
				k[clave] = viejo[clave];
			}
		}
		k["choices_level"] = std::max(jint(k, "choices_level", destino), destino);
		cp["members"][kv.key()] = k;
	}
	for (auto& kv : cp["members"].items())
	{
		Json& m = kv.value();
		if (!m.is_object() || (!m.contains("choices_level") && !jbool(m, "is_hero", false)))
		{
			continue;
		}
		m["choices_level"] = std::max(jint(m, "choices_level", 1), destino);
	}
	std::map<std::string, int> max_antes;
	for (const std::string& id : jkeys(jobj(cp, "state")))
	{
		if (campana::es_miembro(cp, id))
		{
			max_antes[id] = campana::max_hp(cp, id);
		}
	}
	campana::subir_nivel(cp, destino);
	Json gained = Json::object();
	Json hp = Json::object();
	for (const std::string& id : jkeys(jobj(cp, "state")))
	{
		if (!campana::es_miembro(cp, id))
		{
			continue;
		}
		Json lista = Json::array();
		const Json& sheet = cp["members"][id];
		for (int l = antes + 1; l <= destino; ++l)
		{
			for (const std::string& f : CharacterSheet::features_gained(CharacterSheet::complete(sheet, l), l))
			{
				Json e = Json::object();
				e["id"] = f;
				e["name"] = RulesDB::feature_name(f);
				e["desc"] = RulesDB::feature_desc(f);
				e["level"] = l;
				lista.push_back(e);
			}
		}
		gained[id] = lista;
		hp[id] = campana::max_hp(cp, id) - max_antes[id];
	}
	Json out = con_cp(cp);
	out["ok"] = destino > antes;
	out["level"] = destino;
	out["gained"] = gained;
	out["hp"] = hp;
	return out;
}

Json contratar(Json& cp, const Json& req)
{
	const Json& sheet = jat(req, "sheet");
	Json out = con_cp(cp);
	if (jarr(cp, "party").size() >= 4)
	{
		out["ok"] = false;
		out["id"] = "";
		out["reason"] = format("El grupo ya está completo (%d).", 4);
		return out;
	}
	int n = 1;
	std::string id;
	for (;; ++n)
	{
		id = format("merc_%d", n);
		if (!jobj(cp, "members").contains(id))
		{
			break;
		}
	}
	Json s = sheet.is_object() ? sheet : Json::object();
	s.erase("_creator");
	s.erase("rolls");
	s["id"] = id;
	s["is_hero"] = false;
	s["mercenary"] = true;
	Json vis = jobj(s, "visual");
	vis["hero"] = true;
	s["visual"] = vis;
	if (!jhas(s, "ai"))
	{
		s["ai"] = jstr(CharacterSheet::class_data(s), "ai", "frontline");
	}
	campana::materializar(s);
	cp["members"][id] = s;
	cp["party"].push_back(id);
	cp["state"][id] = campana::estado_nuevo(cp, id);
	out = con_cp(cp);
	out["ok"] = true;
	out["id"] = id;
	out["reason"] = "";
	return out;
}

} // namespace

bool grupo_campana(const std::string& op, const Json& req, Json& out)
{
	const bool es_cp = op.rfind("cp_", 0) == 0;
	if (!es_cp && op != "party_summary" && op != "has_item")
	{
		return false;
	}
	if (op == "cp_new")
	{
		const Json& hero = jat(req, "hero");
		if (!hero.is_object() || hero.empty())
		{
			out = error_json("Falta la hoja del héroe.");
			return true;
		}
		const StrList comp = jhas(req, "companions") ? jstrs(req, "companions") : StrList{"brenna"};
		Pcg32 local;
		Pcg32& rng = rng_de(req, local);
		out = con_cp(campana::nueva(hero, comp, rng));
		return true;
	}
	const Json& raw = jat(req, "cp");
	if (!raw.is_object())
	{
		out = error_json("Falta el documento de campaña (cp).");
		return true;
	}
	Json cp = raw;
	campana::normalizar(cp);
	if (op == "cp_load")
	{
		out = con_cp(cp);
		return true;
	}
	if (op == "party_summary")
	{
		out = Json::array();
		for (const std::string& id : jstrs(cp, "party"))
		{
			if (!campana::es_miembro(cp, id))
			{
				continue;
			}
			Json r = resumen_personaje(cp["members"][id], campana::nivel(cp), jobj(jobj(cp, "state"), id));
			r["id"] = id;
			r["short_name"] = campana::nombre_corto(cp, id);
			r["is_hero"] = id == "hero";
			out.push_back(r);
		}
		return true;
	}
	if (op == "has_item")
	{
		const std::string item = jstr(req, "item", "");
		Json holders = Json::array();
		std::string who;
		int total = 0;
		for (const std::string& id : jstrs(cp, "party"))
		{
			if (!campana::es_miembro(cp, id))
			{
				continue;
			}
			const int n = contar_todo(cp["members"][id], item);
			if (n <= 0)
			{
				continue;
			}
			if (who.empty())
			{
				who = id;
			}
			total += n;
			Json h = Json::object();
			h["id"] = id;
			h["n"] = n;
			h["dead"] = campana::muerto(cp, id);
			holders.push_back(h);
		}
		out = Json::object();
		out["who"] = who.empty() ? Json() : Json(who);
		out["n"] = total;
		out["holders"] = holders;
		return true;
	}
	if (op == "cp_recruit")
	{
		const std::string id = jstr(req, "id", "");
		std::string reason;
		bool ok = false;
		if (!RulesDB::party.contains(id) && !campana::es_miembro(cp, id))
		{
			reason = "Ese compañero no existe.";
		}
		else if (!contains(jstrs(cp, "party"), id) && jarr(cp, "party").size() >= 4)
		{
			reason = format("El grupo ya está completo (%d). Despide a alguien primero.", 4);
		}
		else
		{
			ok = campana::reclutar(cp, id);
		}
		out = con_cp(cp);
		out["ok"] = ok;
		out["reason"] = reason;
		return true;
	}
	if (op == "cp_dismiss")
	{
		const std::string id = jstr(req, "id", "");
		bool ok = true;
		std::string reason;
		if (id == "hero")
		{
			ok = false;
			reason = "No puedes despedir a tu héroe.";
		}
		else
		{
			Json nueva = Json::array();
			for (const Json& x : jarr(cp, "party"))
			{
				if (!(x.is_string() && x.get<std::string>() == id))
				{
					nueva.push_back(x);
				}
			}
			cp["party"] = nueva;
		}
		out = con_cp(cp);
		out["ok"] = ok;
		out["reason"] = reason;
		return true;
	}
	if (op == "cp_hire")
	{
		out = contratar(cp, req);
		return true;
	}
	if (op == "cp_short_rest")
	{
		out = descanso_corto(cp, req);
		return true;
	}
	if (op == "cp_long_rest")
	{
		Pcg32 local;
		campana::descanso_largo(cp, rng_de(req, local));
		out = con_cp(cp);
		out["ok"] = true;
		out["day"] = jint(cp, "day", 1);
		out["text"] = format("Amanece. Día %d.", jint(cp, "day", 1));
		return true;
	}
	if (op == "cp_level_up")
	{
		out = subir_nivel(cp, req);
		return true;
	}
	if (op == "cp_gold")
	{
		const int delta = jint(req, "delta", 0);
		const int oro = jint(cp, "gold", 0);
		bool ok = true;
		std::string reason;
		if (delta < 0 && -delta > oro)
		{
			ok = false;
			reason = "No tenéis oro suficiente.";
		}
		else
		{
			cp["gold"] = oro + delta;
		}
		out = con_cp(cp);
		out["ok"] = ok;
		out["gold"] = jint(cp, "gold", 0);
		out["reason"] = reason;
		return true;
	}
	if (op == "cp_give")
	{
		const std::string item = jstr(req, "item", "");
		const int n = std::max(1, jint(req, "n", 1));
		if (item == "gold")
		{
			cp["gold"] = jint(cp, "gold", 0) + n;
			out = con_cp(cp);
			out["ok"] = true;
			out["who"] = Json();
			out["gold"] = jint(cp, "gold", 0);
			return true;
		}
		if (!Items::exists(item))
		{
			out = con_cp(cp);
			out["ok"] = false;
			out["who"] = Json();
			out["reason"] = "Ese objeto no existe: " + item;
			return true;
		}
		const bool unid = jhas(req, "unid") ? jbool(req, "unid", false) : false;
		const std::string who = campana::dar_objeto(cp, item, n, unid, jstr(req, "to", ""));
		out = con_cp(cp);
		out["ok"] = true;
		out["who"] = who;
		out["name"] = campana::nombre_corto(cp, who);
		out["item_name"] = Items::name_of(item, unid);
		return true;
	}
	if (op == "cp_heal")
	{
		out = curar(cp, req);
		return true;
	}
	if (op == "cp_damage")
	{
		out = danar(cp, req);
		return true;
	}
	if (op == "cp_pass_hours")
	{
		campana::pasar_horas(cp, jint(req, "hours", 1));
		out = con_cp(cp);
		return true;
	}
	if (op == "cp_revive")
	{
		const std::string id = jstr(req, "id", "");
		bool ok = false;
		if (campana::es_miembro(cp, id))
		{
			ok = campana::muerto(cp, id);
			if (ok)
			{
				cp["state"][id]["dead"] = false;
				cp["state"][id]["hp"] = 1;
			}
		}
		out = con_cp(cp);
		out["ok"] = ok;
		out["reason"] = ok ? std::string() : std::string("No está muerto.");
		return true;
	}
	if (op == "cp_level_state")
	{
		const std::string level = jstr(req, "level", "");
		Json st = cp["levels"][level];
		if (st.is_null())
		{
			st = Json::object();
			cp["levels"][level] = st;
		}
		out = con_cp(cp);
		out["state"] = st;
		return true;
	}
	out = error_json("op desconocida: " + op);
	return true;
}

} // namespace mdg::web
