// Marca de Granito · puente web: pruebas fuera de combate (check, group_check, passive, best).
// Cada prueba es de habilidad, característica, salvación o herramienta y la hace un miembro del
// grupo de la campaña con su hoja y su estado guardado.
#include "MdgCampana.h"
#include "MdgCharacterSheet.h"
#include "MdgLoc.h"
#include "MdgWebInt.h"

namespace mdg::web
{

namespace
{

struct Prueba
{
	std::string kind;
	std::string id;
	std::string label;
};

/** Qué se prueba según la petición: skill, save, ability o tool (por defecto, Percepción). */
Prueba prueba_de(const Json& req)
{
	Prueba p;
	if (jhas(req, "skill"))
	{
		p.kind = "skill";
		p.id = jstr(req, "skill", "");
	}
	else if (jhas(req, "save"))
	{
		p.kind = "save";
		p.id = jstr(req, "save", "dex");
	}
	else if (jhas(req, "ability"))
	{
		p.kind = "ability";
		p.id = jstr(req, "ability", "str");
	}
	else if (jhas(req, "tool"))
	{
		p.kind = "tool";
		p.id = jstr(req, "tool", "thieves_tools");
	}
	else
	{
		p.kind = "skill";
		p.id = "perception";
	}
	// Herramientas y características pedidas como habilidad
	if (p.id == "thieves_tools")
	{
		p.kind = "tool";
	}
	else if (p.id == "tools")
	{
		p.kind = "tool";
		p.id = "thieves_tools";
	}
	if (p.kind == "skill" && !contains(CharacterSheet::kSkills, p.id) && contains(CharacterSheet::kAbilities, p.id))
	{
		p.kind = "ability";
	}
	if (p.kind == "skill")
	{
		p.label = Loc::t("skill." + p.id);
	}
	else if (p.kind == "ability")
	{
		p.label = Loc::t("ab." + p.id);
	}
	else if (p.kind == "save")
	{
		p.label = "Salvación de " + Loc::t("ab." + p.id);
	}
	else
	{
		p.label = p.id == "thieves_tools" ? "Herramientas de ladrón" : p.id;
	}
	return p;
}

/** Modificador de la prueba para una criatura. */
int modificador(const Creature& c, const Prueba& p)
{
	if (p.kind == "skill")
	{
		return c.skill_bonus(p.id);
	}
	if (p.kind == "save")
	{
		return c.save_bonus(p.id);
	}
	if (p.kind == "tool")
	{
		int b = c.mod("dex") + c.item_tools;
		if (c.cls == "rogue" || c.background == "criminal")
		{
			b += c.prof_bonus;
		}
		return b;
	}
	int b = c.mod(p.id) + c.item_checks;
	if (c.has_trait("jack_of_all_trades"))
	{
		b += c.prof_bonus / 2;
	}
	return b;
}

/** Miembros del grupo en orden que existen y no están muertos. */
StrList vivos(const Json& cp)
{
	StrList out;
	for (const std::string& id : jstrs(cp, "party"))
	{
		if (campana::es_miembro(cp, id) && !campana::muerto(cp, id))
		{
			out.push_back(id);
		}
	}
	return out;
}

int mod_de(const Json& cp, const std::string& id, const Prueba& p)
{
	CreaturePtr c = campana::criatura(cp, id, -1);
	return modificador(*c, p);
}

/** El que mejor lo haría (el primero si empatan); vacío si no queda nadie. */
std::string mejor(const Json& cp, const Prueba& p, int* mod_out = nullptr)
{
	std::string quien;
	int mejor_mod = 0;
	for (const std::string& id : vivos(cp))
	{
		const int m = mod_de(cp, id, p);
		if (quien.empty() || m > mejor_mod)
		{
			quien = id;
			mejor_mod = m;
		}
	}
	if (mod_out)
	{
		*mod_out = quien.empty() ? 0 : mejor_mod;
	}
	return quien;
}

/** Una tirada de prueba de `who` con ventaja, desventaja, bonificador y CD de la petición. */
Json tirada(const Json& cp, const std::string& who, const Prueba& p, const Json& req, Pcg32& rng)
{
	CreaturePtr c = campana::criatura(cp, who, -1);
	bool ventaja = jbool(req, "adv", false);
	bool desventaja = jbool(req, "dis", false);
	if (p.kind == "skill" && contains(c->item_adv, p.id))
	{
		ventaja = true;
	}
	if (p.kind == "skill" && p.id == "stealth" && jbool(c->armor_data(), "stealth_dis", false))
	{
		desventaja = true;
	}
	const int mod = modificador(*c, p) + jint(req, "bonus", 0);
	int kept = rng.randi_range(1, 20);
	Json d20 = Json::array({kept});
	int modo = 0;
	if (ventaja && !desventaja)
	{
		const int otra = rng.randi_range(1, 20);
		d20.push_back(otra);
		kept = std::max(kept, otra);
		modo = 1;
	}
	else if (desventaja && !ventaja)
	{
		const int otra = rng.randi_range(1, 20);
		d20.push_back(otra);
		kept = std::min(kept, otra);
		modo = -1;
	}
	const bool con_cd = jat(req, "dc").is_number();
	const int cd = jint(req, "dc", 0);
	const std::string nombre = campana::nombre_corto(cp, who);
	const int total = kept + mod;
	const std::string signo = mod >= 0 ? format("+ %d", mod) : format("− %d", -mod);
	std::string texto = format("%s: %s %d %s = %d", nombre.c_str(), p.label.c_str(), kept, signo.c_str(), total);
	if (modo == 1)
	{
		texto += " (con ventaja)";
	}
	else if (modo == -1)
	{
		texto += " (con desventaja)";
	}
	const bool supera = total >= cd;
	if (con_cd)
	{
		texto += format(" contra CD %d: %s", cd, supera ? "éxito" : "fallo");
	}
	Json out = Json::object();
	out["who"] = who;
	out["name"] = nombre;
	out["kind"] = p.kind;
	out["id"] = p.id;
	out["label"] = p.label;
	out["d20"] = d20;
	out["kept"] = kept;
	out["mode"] = modo;
	out["mod"] = mod;
	out["total"] = total;
	out["success"] = !con_cd || supera;
	out["crit"] = kept == 20;
	out["fumble"] = kept == 1;
	out["text"] = texto;
	out["dc"] = con_cd ? Json(cd) : Json();
	out["margin"] = con_cd ? Json(total - cd) : Json();
	return out;
}

} // namespace

bool grupo_pruebas(const std::string& op, const Json& req, Json& out)
{
	if (op != "check" && op != "group_check" && op != "passive" && op != "best")
	{
		return false;
	}
	const Json& raw = jat(req, "cp");
	if (!raw.is_object())
	{
		out = error_json("Falta el documento de campaña (cp).");
		return true;
	}
	Json cp = raw;
	campana::normalizar(cp);
	Pcg32 local;
	Pcg32& rng = rng_de(req, local);
	if (op == "check")
	{
		const Prueba p = prueba_de(req);
		std::string who = jstr(req, "who", "");
		if (who == "best")
		{
			who = mejor(cp, p);
		}
		else if (!campana::es_miembro(cp, who))
		{
			const StrList v = vivos(cp);
			who = v.empty() ? (campana::es_miembro(cp, "hero") ? "hero" : "") : v.front();
		}
		if (who.empty())
		{
			out = error_json("No hay nadie que pueda hacer la prueba.");
			return true;
		}
		out = tirada(cp, who, p, req, rng);
		return true;
	}
	if (op == "group_check")
	{
		const Prueba p = prueba_de(req);
		StrList quienes;
		const Json& w = jat(req, "who");
		if (w.is_array())
		{
			for (const std::string& id : jstr_list(w))
			{
				if (campana::es_miembro(cp, id) && !campana::muerto(cp, id))
				{
					quienes.push_back(id);
				}
			}
		}
		else
		{
			quienes = vivos(cp);
		}
		Json resultados = Json::array();
		int superan = 0;
		for (const std::string& id : quienes)
		{
			Json r = tirada(cp, id, p, req, rng);
			if (jbool(r, "success", false))
			{
				++superan;
			}
			resultados.push_back(std::move(r));
		}
		const int n = static_cast<int>(resultados.size());
		const int hacen_falta = (n + 1) / 2;
		const bool exito = n > 0 && superan >= hacen_falta;
		out = Json::object();
		out["results"] = resultados;
		out["success"] = exito;
		out["passed"] = superan;
		out["needed"] = hacen_falta;
		out["label"] = p.label;
		out["text"] = format("%s del grupo: %d de %d superan la prueba (hacen falta %d): %s", p.label.c_str(), superan, n,
			hacen_falta, exito ? "éxito" : "fallo");
		return true;
	}
	if (op == "passive")
	{
		Prueba p;
		p.kind = "skill";
		p.id = jstr(req, "skill", "perception");
		out = Json::object();
		for (const std::string& id : vivos(cp))
		{
			out[id] = 10 + mod_de(cp, id, p);
		}
		return true;
	}
	// best
	const Prueba p = prueba_de(req);
	int mod = 0;
	const std::string who = mejor(cp, p, &mod);
	out = Json::object();
	if (who.empty())
	{
		out["who"] = nullptr;
		out["mod"] = 0;
		return true;
	}
	out["who"] = who;
	out["name"] = campana::nombre_corto(cp, who);
	out["mod"] = mod;
	out["label"] = p.label;
	return true;
}

} // namespace mdg::web
