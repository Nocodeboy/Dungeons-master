#include "MdgWeb.h"

#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgWebInt.h"

#include <exception>

namespace mdg::web
{

namespace
{

std::string g_carpeta_datos = "/data";
std::unique_ptr<FolderSource> g_fuente;

Pcg32 g_rng;
bool g_rng_listo = false;

/** Carga las reglas la primera vez. Devuelve false (y rellena `out`) si no se pueden leer. */
bool asegurar_datos(Json& out)
{
	if (RulesDB::loaded && RulesDB::errors.empty())
	{
		return true;
	}
	if (!g_fuente)
	{
		g_fuente = std::make_unique<FolderSource>(g_carpeta_datos);
	}
	const bool ok = RulesDB::load_all(*g_fuente, true);
	Loc::load(*g_fuente);
	if (ok && RulesDB::errors.empty())
	{
		return true;
	}
	out = Json::object();
	out["error"] = "No se han podido cargar los datos de reglas.";
	out["details"] = to_json(RulesDB::errors);
	return false;
}

} // namespace

Contexto& ctx()
{
	static Contexto c;
	return c;
}

Pcg32& rng_de(const Json& req, Pcg32& local)
{
	const Json& s = jat(req, "seed");
	if (s.is_number() && jto_int(s, 0) >= 0)
	{
		local.seed(static_cast<uint64_t>(static_cast<int64_t>(jto_int(s, 0))));
		return local;
	}
	if (!g_rng_listo)
	{
		g_rng.randomize();
		g_rng_listo = true;
	}
	return g_rng;
}

Json error_json(const std::string& mensaje)
{
	Json o = Json::object();
	o["error"] = mensaje;
	return o;
}

Json celda_json(const Cell& c)
{
	return Json::array({c.x, c.y});
}

std::vector<Cell> celdas_de(const Json& arr)
{
	std::vector<Cell> out;
	if (!arr.is_array())
	{
		return out;
	}
	for (const Json& e : arr)
	{
		if (e.is_array() && e.size() >= 2)
		{
			out.emplace_back(jto_int(e[0]), jto_int(e[1]));
		}
	}
	return out;
}

Json eventos_json(Battle& b)
{
	Json out = Json::array();
	for (const Var& e : b.pop_events())
	{
		out.push_back(e.to_json());
	}
	return out;
}

void configurar(const std::string& carpeta_datos)
{
	g_carpeta_datos = carpeta_datos;
	g_fuente.reset();
}

std::string call(const std::string& request)
{
	const Json req = Json::parse(request, nullptr, false);
	if (req.is_discarded() || !req.is_object())
	{
		return "{\"error\":\"Petición JSON no válida.\"}";
	}
	// Como en el publicado: un "op" que no sea cadena lanza type_error fuera del try
	const std::string op = req.value("op", std::string());
	Json out;
	if (!asegurar_datos(out))
	{
		return out.dump();
	}
	try
	{
		if (grupo_datos(op, req, out) || grupo_campana(op, req, out) || grupo_objetos(op, req, out) ||
			grupo_pruebas(op, req, out) || grupo_xmap(op, req, out) || grupo_inicio_combate(op, req, out))
		{
			return out.dump();
		}
		if (!ctx().battle)
		{
			return error_json("sin combate").dump();
		}
		if (grupo_combate(op, req, out))
		{
			return out.dump();
		}
		return error_json("op desconocida: " + op).dump();
	}
	catch (const std::exception& e)
	{
		return error_json(std::string("Error interno del núcleo: ") + e.what()).dump();
	}
}

} // namespace mdg::web
