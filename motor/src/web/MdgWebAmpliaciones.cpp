// Marca de Granito · puente web: operaciones de las ampliaciones del núcleo (no existen en el
// publicado, así que no cambian nada del corpus de paridad).
//   set_manual {team | id, on}   reacciones decididas por el jugador (ver react en MdgWebCombate.cpp)
//   set_ai {mode}                IA de los compañeros: "" (publicada) o "tactico"
//   retreat_info / retreat       retirada del combate
//   simple {what: "web", target} / simple_targets {what: "web"}   romper la telaraña de la araña gigante
#include "MdgWebInt.h"

namespace mdg::web
{

namespace
{

Json manual_json(const Battle& b)
{
	Json teams = Json::object();
	for (const auto& kv : b.manual_teams)
	{
		teams[kv.first] = kv.second;
	}
	Json units = Json::object();
	for (const auto& kv : b.manual_units)
	{
		units[kv.first] = kv.second;
	}
	Json o = Json::object();
	o["teams"] = teams;
	o["units"] = units;
	return o;
}

} // namespace

/** Añade a options la acción de romper la telaraña cuando hay alguien atrapado al alcance. */
void anadir_acciones_ampliadas(Json& out)
{
	Contexto& cx = ctx();
	if (!cx.battle || !out.is_object() || !out.contains("actions") || !out["actions"].is_array())
	{
		return;
	}
	Battle& b = *cx.battle;
	Creature* c = b.current;
	if (c == nullptr || b.web_targets(c).empty())
	{
		return;
	}
	Json a = Json::object();
	a["id"] = "web";
	a["name"] = "Romper la telaraña";
	a["desc"] = "Ataque contra la telaraña (CA 10, 5 PG, vulnerable al fuego): al romperla, quien estaba atrapado queda libre.";
	a["target"] = "web";
	a["cost"] = "Ataque";
	a["enabled"] = c->turn.action > 0 || c->turn.attack_left > 0;
	out["actions"].push_back(a);
}

bool grupo_combate_ampliado(const std::string& op, const Json& req, Json& out)
{
	Contexto& cx = ctx();
	Battle& b = *cx.battle;
	if (op == "set_manual")
	{
		const bool on = jbool(req, "on", true);
		if (jat(req, "id").is_string())
		{
			b.manual_units[jstr(req, "id", "")] = on;
		}
		else
		{
			b.manual_teams[std::to_string(jint(req, "team", 0))] = on;
		}
		out = Json::object();
		out["ok"] = true;
		out["manual"] = manual_json(b);
		return true;
	}
	if (op == "set_ai")
	{
		cx.ai->modo = jstr(req, "mode", "");
		out = Json::object();
		out["ok"] = true;
		out["mode"] = cx.ai->modo;
		return true;
	}
	if (op == "retreat_info")
	{
		out = b.retreat_info().to_json();
		return true;
	}
	if (op == "retreat")
	{
		const Var r = b.do_retreat();
		if (r.getb("ok"))
		{
			cx.retirada = true;
		}
		out = r.to_json();
		out["events"] = eventos_json(b);
		out["state"] = estado_json(b, false);
		return true;
	}
	if ((op == "simple_targets" || op == "simple") && jstr(req, "what", "") == "web")
	{
		Creature* c = b.current;
		if (op == "simple_targets")
		{
			out = Json::array();
			for (Creature* t : b.web_targets(c))
			{
				out.push_back(t->id);
			}
			return true;
		}
		const bool ok = c != nullptr && b.break_web(c, b.get_creature(jstr(req, "target", "")));
		out = Json::object();
		out["ok"] = ok;
		out["events"] = eventos_json(b);
		return true;
	}
	return false;
}

} // namespace mdg::web
