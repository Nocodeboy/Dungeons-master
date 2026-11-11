// Marca de Granito · puente web: mapa de exploración (xmap_*).
// El juego carga las filas del nivel con xmap_load y después pregunta por casillas, rutas, línea
// de visión, alcance y huecos libres. El mapa es un BattleMap (la misma rejilla hexagonal que el
// combate) que vive en el módulo entre llamadas.
#include "MdgBattleMap.h"
#include "MdgWebInt.h"

#include <deque>

namespace mdg::web
{

namespace
{

BattleMap g_xmap;
bool g_xmap_cargado = false;

/** Casilla [x, y] con dos números; si no, `defecto`. */
Cell celda_de(const Json& v, const Cell& defecto)
{
	if (v.is_array() && v.size() >= 2 && v[0].is_number() && v[1].is_number())
	{
		return Cell(jto_int(v[0]), jto_int(v[1]));
	}
	return defecto;
}

/** Casillas prohibidas de la petición ("blocked"). */
CellMap<bool> bloqueadas(const Json& req)
{
	CellMap<bool> out;
	for (const Json& e : jarr(req, "blocked"))
	{
		out[celda_de(e, Cell(0, 0))] = true;
	}
	return out;
}

bool libre(const Cell& c, const CellMap<bool>& bloq)
{
	return g_xmap.in_bounds(c) && g_xmap.walkable(c) && !bloq.has(c);
}

/** Coste en pasos de entrar en una casilla (2 en terreno difícil). */
int paso(const Cell& c)
{
	return g_xmap.is_difficult(c) ? 2 : 1;
}

Json cargar(const Json& req)
{
	std::vector<std::string> filas;
	for (const Json& f : jarr(req, "rows"))
	{
		filas.push_back(jto_str(f));
	}
	g_xmap = BattleMap();
	g_xmap.load_rows(filas);
	g_xmap_cargado = true;
	Json out = Json::object();
	out["w"] = g_xmap.width;
	out["h"] = g_xmap.height;
	return out;
}

Json casilla(const Json& req)
{
	const Cell c = celda_de(jat(req, "cell"), Cell(-1, -1));
	Json out = Json::object();
	if (!g_xmap.in_bounds(c))
	{
		out["in_bounds"] = false;
		out["walkable"] = false;
		return out;
	}
	const TileInfo& t = g_xmap.tile_info(c);
	out["in_bounds"] = true;
	out["terrain"] = std::string(1, g_xmap.tile(c));
	out["name"] = t.name;
	out["walkable"] = g_xmap.walkable(c);
	out["difficult"] = g_xmap.is_difficult(c);
	out["cover"] = t.cover;
	out["blocks_los"] = t.cover >= 3;
	out["obscure"] = t.obscure;
	return out;
}

Json transitables(const Json& req)
{
	Json ok = Json::array();
	Json dificil = Json::array();
	for (const Json& e : jarr(req, "cells"))
	{
		const Cell c = celda_de(e, Cell(-1, -1));
		ok.push_back(g_xmap.walkable(c));
		dificil.push_back(g_xmap.is_difficult(c));
	}
	Json out = Json::object();
	out["ok"] = ok;
	out["difficult"] = dificil;
	return out;
}

Json ruta(const Json& req)
{
	const Cell desde = celda_de(jat(req, "from"), Cell(-1, -1));
	const Cell hasta = celda_de(jat(req, "to"), Cell(-1, -1));
	const CellMap<bool> bloq = bloqueadas(req);
	const bool adyacente = jbool(req, "adjacent", false);
	std::vector<Cell> camino;
	Cell meta = hasta;
	if (!adyacente && libre(hasta, bloq))
	{
		camino = g_xmap.find_path(desde, hasta, bloq);
	}
	else
	{
		// Destino ocupado o que no se pisa (o se pide llegar al lado): la vecina más cercana
		size_t mejor = static_cast<size_t>(1) << 30;
		for (const Cell& v : BattleMap::neighbors(hasta))
		{
			if (v == desde)
			{
				camino = {desde};
				meta = v;
				break;
			}
			if (!libre(v, bloq))
			{
				continue;
			}
			std::vector<Cell> p = g_xmap.find_path(desde, v, bloq);
			if (p.empty() || p.size() >= mejor)
			{
				continue;
			}
			mejor = p.size();
			camino = std::move(p);
			meta = v;
		}
	}
	int coste = 0;
	for (size_t i = 1; i < camino.size(); ++i)
	{
		coste += paso(camino[i]);
	}
	const int maximo = jint(req, "max", -1);
	if (maximo >= 0 && coste > maximo)
	{
		// Se corta donde se acaba el movimiento
		int acumulado = 0;
		size_t n = 1;
		for (; n < camino.size(); ++n)
		{
			const int c = paso(camino[n]);
			if (acumulado + c > maximo)
			{
				break;
			}
			acumulado += c;
		}
		camino.resize(std::min(n, camino.size()));
		coste = acumulado;
	}
	Json p = Json::array();
	for (const Cell& c : camino)
	{
		p.push_back(celda_json(c));
	}
	Json out = Json::object();
	out["path"] = p;
	out["cost"] = coste;
	out["ok"] = !camino.empty();
	out["goal"] = celda_json(meta);
	return out;
}

Json vision(const Json& req)
{
	const Cell desde = celda_de(jat(req, "from"), Cell(-1, -1));
	const Cell hasta = celda_de(jat(req, "to"), Cell(-1, -1));
	std::vector<Cell> estorbos;
	for (const Json& e : jarr(req, "blockers"))
	{
		estorbos.push_back(celda_de(e, Cell(0, 0)));
	}
	const int cobertura = g_xmap.cover_between(desde, hasta, estorbos);
	Json out = Json::object();
	out["los"] = cobertura < 3;
	out["cover"] = cobertura;
	out["dist"] = BattleMap::dist(desde, hasta);
	return out;
}

Json alcance(const Json& req)
{
	// Dijkstra con cubos; las casillas salen en el orden en que se tocaron por primera vez
	const Cell desde = celda_de(jat(req, "from"), Cell(-1, -1));
	const int maximo = jint(req, "max", 6);
	const CellMap<bool> bloq = bloqueadas(req);
	CellMap<int> coste;
	coste[desde] = 0;
	std::vector<std::vector<Cell>> cubos(static_cast<size_t>(std::max(maximo, 0)) + 1);
	cubos[0].push_back(desde);
	for (size_t b = 0; b < cubos.size(); ++b)
	{
		for (size_t i = 0; i < cubos[b].size(); ++i)
		{
			const Cell c = cubos[b][i];
			if (coste.get(c, -1) != static_cast<int>(b))
			{
				continue;
			}
			for (const Cell& v : BattleMap::neighbors(c))
			{
				if (!libre(v, bloq))
				{
					continue;
				}
				const int nc = static_cast<int>(b) + paso(v);
				const int* ya = coste.find(v);
				if (nc > maximo || (ya && *ya <= nc))
				{
					continue;
				}
				coste[v] = nc;
				cubos[static_cast<size_t>(nc)].push_back(v);
			}
		}
	}
	Json celdas = Json::array();
	for (const auto& kv : coste)
	{
		celdas.push_back(Json::array({kv.first.x, kv.first.y, kv.second}));
	}
	Json out = Json::object();
	out["cells"] = celdas;
	return out;
}

Json huecos(const Json& req)
{
	const Cell cerca = celda_de(jat(req, "near"), Cell(-1, -1));
	const int n = jint(req, "n", 1);
	const CellMap<bool> bloq = bloqueadas(req);
	Json celdas = Json::array();
	CellMap<bool> visto;
	std::deque<Cell> cola{cerca};
	visto[cerca] = true;
	while (!cola.empty())
	{
		const Cell c = cola.front();
		cola.pop_front();
		if (libre(c, bloq))
		{
			celdas.push_back(celda_json(c));
			if (static_cast<int>(celdas.size()) >= n)
			{
				break;
			}
		}
		for (const Cell& v : BattleMap::neighbors(c))
		{
			if (visto.has(v) || !g_xmap.in_bounds(v))
			{
				continue;
			}
			visto[v] = true;
			cola.push_back(v);
		}
	}
	Json out = Json::object();
	out["cells"] = celdas;
	return out;
}

} // namespace

bool grupo_xmap(const std::string& op, const Json& req, Json& out)
{
	if (op.rfind("xmap_", 0) != 0)
	{
		return false;
	}
	if (op == "xmap_load")
	{
		out = cargar(req);
		return true;
	}
	if (!g_xmap_cargado)
	{
		out = error_json("No hay mapa cargado (llama antes a xmap_load).");
		return true;
	}
	if (op == "xmap_path")
	{
		out = ruta(req);
	}
	else if (op == "xmap_los")
	{
		out = vision(req);
	}
	else if (op == "xmap_walkable")
	{
		out = transitables(req);
	}
	else if (op == "xmap_cell")
	{
		out = casilla(req);
	}
	else if (op == "xmap_reach")
	{
		out = alcance(req);
	}
	else if (op == "xmap_free")
	{
		out = huecos(req);
	}
	else
	{
		out = error_json("op desconocida: " + op);
	}
	return true;
}

} // namespace mdg::web
