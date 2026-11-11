// Marca de Granito · puente web: hojas de personaje (creador, validación, resumen y subida de nivel).
// sheet_new, sheet_set, sheet_options, sheet_complete, sheet_validate, sheet_finish, sheet_summary,
// level_choices y levelup_begin.
#include "MdgCharacterSheet.h"
#include "MdgCreador.h"
#include "MdgWebInt.h"

namespace mdg::web
{

Json resumen_personaje(const Json& sheet, int level, const Json& state);

namespace
{

/** Errores de la hoja para darla por buena: los de validate() y los avisos de los pasos. */
StrList errores(Json& s)
{
	const int lv = jint(jobj(s, "_creator"), "level", 1);
	StrList out = CharacterSheet::validate(s, lv);
	for (const std::string& a : creador::avisos(s))
	{
		if (!contains(out, a))
		{
			out.push_back(a);
		}
	}
	return out;
}

Json subida(const Json& req, int lvl, int hasta)
{
	if (lvl > CharacterSheet::kMaxLevel)
	{
		return error_json("No se puede subir más.");
	}
	Json s = jat(req, "sheet");
	if (!s.is_object())
	{
		s = Json::object();
	}
	creador::preparar_subida(s, lvl);
	Json out = Json::object();
	out["level"] = jint(jobj(s, "_creator"), "level", lvl);
	out["remaining"] = std::max(0, hasta - jint(jobj(s, "_creator"), "level", lvl));
	out["sheet"] = s;
	out["options"] = creador::opciones(s, jstr(req, "step", ""));
	return out;
}

} // namespace

bool grupo_hojas(const std::string& op, const Json& req, Json& out)
{
	if (op == "sheet_new")
	{
		Pcg32 local;
		Pcg32& rng = rng_de(req, local);
		Json s = creador::nueva(req, rng);
		out = Json::object();
		out["sheet"] = s;
		out["options"] = creador::opciones(s, "");
		return true;
	}
	if (op == "sheet_set")
	{
		Pcg32 local;
		Pcg32& rng = rng_de(req, local);
		Json s = creador::hoja_de(req);
		std::string motivo;
		if (jat(req, "sets").is_array())
		{
			// Se aplican todos; el motivo es el del último que no se ha podido
			for (const Json& set : jarr(req, "sets"))
			{
				const std::string m = creador::aplicar(s, set, rng);
				if (!m.empty())
				{
					motivo = m;
				}
			}
		}
		else if (!jat(req, "set").is_null())
		{
			motivo = jat(req, "set").is_object() ? creador::aplicar(s, jat(req, "set"), rng) : std::string("Falta qué cambiar.");
		}
		out = Json::object();
		out["sheet"] = s;
		out["ok"] = motivo.empty();
		out["reason"] = motivo;
		out["options"] = creador::opciones(s, jstr(req, "step", ""));
		return true;
	}
	if (op == "sheet_options")
	{
		Json s = creador::hoja_de(req);
		out = creador::opciones(s, jstr(req, "step", ""));
		return true;
	}
	if (op == "sheet_complete")
	{
		Json full = CharacterSheet::complete(jat(req, "sheet"), jint(req, "level", 1));
		if (full.is_object())
		{
			full.erase("_creator");
		}
		out = full;
		return true;
	}
	if (op == "sheet_validate")
	{
		Json s = creador::hoja_de(req);
		const StrList e = errores(s);
		out = Json::object();
		out["ok"] = e.empty();
		out["errors"] = to_json(e);
		return true;
	}
	if (op == "sheet_finish")
	{
		Json s = creador::hoja_de(req);
		const StrList e = creador::avisos(s);
		out = Json::object();
		out["sheet"] = creador::resultado(s);
		out["ok"] = e.empty();
		out["errors"] = to_json(e);
		return true;
	}
	if (op == "sheet_summary")
	{
		out = resumen_personaje(jat(req, "sheet"), jint(req, "level", 1), jat(req, "state"));
		return true;
	}
	if (op == "level_choices")
	{
		const Json& s = jat(req, "sheet");
		const int desde = jat(req, "from").is_number() ? jint(req, "from", 1) : jint(s, "choices_level", 1);
		out = subida(req, desde + 1, jat(req, "to").is_number() ? jint(req, "to", desde + 1) : desde + 1);
		return true;
	}
	if (op == "levelup_begin")
	{
		const int lvl = jint(req, "level", jint(jat(req, "sheet"), "choices_level", 1) + 1);
		out = subida(req, lvl, lvl);
		return true;
	}
	return false;
}

} // namespace mdg::web
