// Marca de Granito · núcleo de reglas portable.
// Tablero táctico hexagonal: terreno, línea de visión, cobertura, áreas y rutas.
// Hexágonos con vértice arriba («pointy-top») en coordenadas «odd-r»: (columna, fila), con las
// filas impares desplazadas medio hexágono a la derecha. Cada hexágono mide 1,5 m (5 pies).
// Las posiciones continuas van en el «plano de casillas»: 1 unidad entre centros vecinos.
// Traducción de scripts/core/battle_map.gd.
#pragma once

#include "MdgTypes.h"

#include <map>
#include <memory>

namespace mdg
{

struct Creature;

struct TileInfo
{
	bool walk = true;
	int cost = 1;
	/** 0 ninguna, 1 media (obstáculo bajo), 3 total (bloquea la vista). */
	int cover = 0;
	const char* name = "suelo";
	bool difficult = false;
	int obscure = 0;
};

/** Resultado de reachable(): coste en pies y casilla anterior, en el orden en que se tocaron. */
struct Reach
{
	CellMap<int> cost;
	CellMap<Cell> prev;
};

/** Casilla -> criatura que la ocupa (sin propiedad). */
using Occupancy = CellMap<Creature*>;

class BattleMap
{
public:
	static constexpr int kFt = 5;
	static constexpr double kRowH = 0.8660254;  ///< separación entre filas (√3/2)
	static constexpr double kHexR = 0.5773503;  ///< radio del hexágono (centro a vértice): 1/√3

	static const TileInfo& tile_info_for(char ch);

	int width = 0;
	int height = 0;
	std::vector<std::string> rows;

	void load_rows(const std::vector<std::string>& p_rows);

	bool in_bounds(const Cell& c) const { return c.x >= 0 && c.y >= 0 && c.x < width && c.y < height; }
	char tile(const Cell& c) const;
	const TileInfo& tile_info(const Cell& c) const { return tile_info_for(tile(c)); }
	bool walkable(const Cell& c) const { return in_bounds(c) && tile_info(c).walk; }
	int move_cost(const Cell& c) const;
	bool is_difficult(const Cell& c) const;
	/** Capas de las zonas de conjuro: terreno difícil y casillas peligrosas. */
	void set_overlay(const std::vector<Cell>& difficult, const std::vector<Cell>& hazard);
	bool is_hazard(const Cell& c) const;

	// ---------------------------------------------------------------- geometría hexagonal
	static Cell to_axial(const Cell& c);
	static Cell from_axial(const Cell& a);
	/** Centro de una casilla en el plano de casillas. */
	static Vec2 center(const Cell& c);
	/** Casilla que contiene un punto del plano. */
	static Cell cell_at(const Vec2& p);
	/** Distancia en hexágonos. */
	static int dist(const Cell& a, const Cell& b);
	static int dist_ft(const Cell& a, const Cell& b) { return dist(a, b) * kFt; }
	static std::vector<Cell> neighbors(const Cell& c);
	/** Vecino de `c` que más se alinea con `dir`. */
	static Cell step_toward(const Cell& c, const Vec2& dir);
	/** Vértices del hexágono, empezando por el de arriba. */
	static std::vector<Vec2> corners(const Cell& c);
	/** Centro y vértices: puntos de origen posibles para un área. */
	static std::vector<Vec2> candidate_points(const Cell& c);
	static Vec2 snap_point(const Vec2& p);
	/** Casillas a `r` o menos de `c` (incluida). */
	static std::vector<Cell> within(const Cell& c, int r);
	/** Casillas que atraviesa el segmento entre dos puntos del plano (muestreado). */
	static std::vector<Cell> cells_on_segment(const Vec2& a, const Vec2& b, double step = 0.18);

	// ---------------------------------------------------------------- visión y cobertura
	void clear_cache() { los_cache_.clear(); }
	/** 0 ninguna, 1 media (+2), 2 tres cuartos (+5), 3 total (sin visión). `blockers` = criaturas. */
	int cover_between(const Cell& from, const Cell& to, const std::vector<Cell>& blockers = {});
	bool has_los(const Cell& from, const Cell& to) { return cover_between(from, to) < 3; }
	static int cover_ac_bonus(int cover);

	// ---------------------------------------------------------------- áreas
	std::vector<Cell> sphere_cells(const Vec2& point, int radius_ft) const;
	std::vector<Cell> cone_cells(const Cell& origin, const Vec2& toward, int length_ft);
	std::vector<Cell> cube_from_self(const Cell& origin, const Vec2& toward, int size_ft) const;
	std::vector<Cell> square_cells(const Vec2& point, int size_ft) const;
	std::vector<Cell> line_cells(const Cell& origin, const Vec2& toward, int length_ft) const;
	std::vector<Cell> emanation_cells(const Cell& origin, int radius_ft);

	// ---------------------------------------------------------------- rutas
	/** Dijkstra desde `start`. El que se mueve atraviesa aliados y criaturas caídas. */
	Reach reachable(const Cell& start, int budget_ft, const Creature* mover, const Occupancy& occ, bool crawl = false) const;
	/** A* para la exploración: [start, ..., goal] o vacío. El terreno difícil cuesta el doble. */
	std::vector<Cell> find_path(const Cell& start, const Cell& goal, const CellMap<bool>& blocked = {}, int max_iter = 20000) const;
	static bool can_end_in(const Cell& cell, const Creature* mover, const Occupancy& occ);
	static std::vector<Cell> build_path(const CellMap<Cell>& prev, const Cell& start, const Cell& goal);

private:
	struct CoverRes
	{
		int cover = 0;
		std::vector<Cell> half_cells;
	};
	CoverRes cover_hex(const Cell& from, const Cell& to) const;
	struct TraceRes
	{
		bool full = false;
		std::vector<Cell> half_cells;
	};
	TraceRes trace_hex(const Vec2& a, const Vec2& b, const Cell& from, const Cell& to) const;
	std::vector<Cell> oriented_square(const Vec2& p, const Vec2& axis, double side, const Cell& exclude = Cell(-9999, -9999)) const;
	static bool can_pass(const Cell& cell, const Creature* mover, const Occupancy& occ);

	std::unordered_map<uint64_t, CoverRes> los_cache_;
	std::vector<Cell> obstacles_;
	std::vector<uint8_t> walk_;
	std::vector<int> cost_;
	std::vector<uint8_t> cover_;
	std::vector<uint8_t> zone_diff_;
	std::vector<uint8_t> hazard_;
};

} // namespace mdg
