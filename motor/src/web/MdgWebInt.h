// Marca de Granito · puente web: piezas compartidas entre los grupos de operaciones.
// Cada grupo (datos y hojas, campaña, objetos y tienda, pruebas, mapa de exploración y combate)
// atiende sus operaciones y devuelve false si la operación no es suya.
#pragma once

#include "MdgAI.h"
#include "MdgBattle.h"
#include "MdgDice.h"
#include "MdgJson.h"

#include <memory>
#include <string>

namespace mdg::web
{

/** Estado que vive en el módulo entre llamadas: el combate en curso y su IA. */
struct Contexto
{
	std::unique_ptr<Battle> battle;
	std::unique_ptr<AIBrain> ai;
	// Ampliaciones (reacciones manuales y retirada)
	/** Peticiones aplicadas al combate en curso con sus respuestas de reacción, para rehacerlo. */
	std::vector<std::pair<Json, std::vector<int>>> registro;
	/** Reacción pendiente: {req, answers, info} (null si no hay). */
	Json pendiente;
	bool rehaciendo = false;
	bool retirada = false;
	uint64_t rng_s = 0;
	uint64_t rng_i = 0;
};

Contexto& ctx();

/**
 * Generador para una petición: si trae "seed" numérica y no negativa, `local` sembrado con ella;
 * si no, el generador global del módulo (sembrado con randomize() la primera vez que se usa).
 */
Pcg32& rng_de(const Json& req, Pcg32& local);

/** {"error": mensaje} */
Json error_json(const std::string& mensaje);

/** Casilla como [x, y]. */
Json celda_json(const Cell& c);
/** Lista de casillas [[x, y], ...] de la petición (las entradas mal formadas se ignoran). */
std::vector<Cell> celdas_de(const Json& arr);
/** Texto de las reglas de un objeto, línea a línea (describe() de items.gd sin BBCode). */
StrList lineas_objeto(const std::string& id, bool unid);
/** Eventos pendientes del combate como array JSON (los vacía). */
Json eventos_json(Battle& b);

// Grupos de operaciones (cada uno en su archivo)
bool grupo_datos(const std::string& op, const Json& req, Json& out);
bool grupo_campana(const std::string& op, const Json& req, Json& out);
bool grupo_objetos(const std::string& op, const Json& req, Json& out);
bool grupo_pruebas(const std::string& op, const Json& req, Json& out);
bool grupo_xmap(const std::string& op, const Json& req, Json& out);
/** battle_start, battle_end e init (no necesitan combate en curso). */
bool grupo_inicio_combate(const std::string& op, const Json& req, Json& out);
/** Operaciones del combate en curso. Devuelve false si la operación no existe. */
bool grupo_combate(const std::string& op, const Json& req, Json& out);

/** Estado del combate para la vista; con `completo` añade el mapa y el encuentro. */
Json estado_json(Battle& b, bool completo);
/** Una criatura para la vista. */
Json criatura_json(const Creature& c);

} // namespace mdg::web
