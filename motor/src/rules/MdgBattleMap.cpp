#include "MdgBattleMap.h"

#include "MdgCreature.h"

#include <limits>

namespace mdg
{

namespace battlemap_detail
{

// Vecinos en «odd-r» según la paridad de la fila
const Cell kOddrEven[6] = {Cell(1, 0), Cell(0, -1), Cell(-1, -1), Cell(-1, 0), Cell(-1, 1), Cell(0, 1)};
const Cell kOddrOdd[6] = {Cell(1, 0), Cell(1, -1), Cell(0, -1), Cell(-1, 0), Cell(0, 1), Cell(1, 1)};

const Cell* dirs_for_row(int y)
{
	return (y & 1) == 1 ? kOddrOdd : kOddrEven;
}

Cell cube_round(double qf, double rf)
{
	const double sf = -qf - rf;
	double q = std::round(qf);
	double r = std::round(rf);
	const double s = std::round(sf);
	const double dq = std::fabs(q - qf);
	const double dr = std::fabs(r - rf);
	const double ds = std::fabs(s - sf);
	if (dq > dr && dq > ds)
	{
		q = -r - s;
	}
	else if (dr > ds)
	{
		r = -q - s;
	}
	return Cell(static_cast<int>(q), static_cast<int>(r));
}

uint64_t cover_key(const Cell& a, const Cell& b)
{
	auto p = [](int v) { return static_cast<uint64_t>(static_cast<uint16_t>(static_cast<int16_t>(v))); };
	return (p(a.x) << 48) | (p(a.y) << 32) | (p(b.x) << 16) | p(b.y);
}

double deg_to_rad(double d)
{
	return d * kPi / 180.0;
}

} // namespace battlemap_detail

// ------------------------------------------------------------------ terreno

const TileInfo& BattleMap::tile_info_for(char ch)
{
	static const TileInfo floor_t{true, 1, 0, "suelo", false, 0};
	static const TileInfo grass{true, 1, 0, "hierba", false, 0};
	static const TileInfo path{true, 1, 0, "camino", false, 0};
	static const TileInfo slabs{true, 1, 0, "losas", false, 0};
	static const TileInfo mud{true, 2, 0, "barro", true, 0};
	static const TileInfo brush{true, 2, 0, "maleza", true, 1};
	static const TileInfo rubble{true, 2, 0, "escombros", true, 0};
	static const TileInfo fence{true, 2, 1, "cerca", true, 0};
	static const TileInfo wall{false, 0, 3, "muro", false, 0};
	static const TileInfo house{false, 0, 3, "edificio", false, 0};
	static const TileInfo tree{false, 0, 3, "árbol", false, 0};
	static const TileInfo pillar{false, 0, 3, "columna", false, 0};
	static const TileInfo statue{false, 0, 3, "estatua", false, 0};
	static const TileInfo rock{false, 0, 1, "roca", false, 0};
	static const TileInfo crates{false, 0, 1, "cajas", false, 0};
	static const TileInfo grave{false, 0, 1, "lápida", false, 0};
	static const TileInfo water{false, 0, 0, "agua profunda", false, 0};
	static const TileInfo object{false, 0, 1, "objeto", false, 0};
	static const TileInfo tall_object{false, 0, 3, "objeto alto", false, 0};
	static const TileInfo empty{false, 0, 0, "vacío", false, 0};
	switch (ch)
	{
	case '.': return floor_t;
	case ',': return grass;
	case ':': return path;
	case '=': return slabs;
	case '~': return mud;
	case 'b': return brush;
	case 'x': return rubble;
	case 'f': return fence;
	case '#': return wall;
	case 'H': return house;
	case 'T': return tree;
	case 'P': return pillar;
	case 'S': return statue;
	case 'r': return rock;
	case 'c': return crates;
	case 'g': return grave;
	case 'w': return water;
	case 'B': return house;       // edificio colocado a mano (niveles)
	case 'o': return object;      // objeto colocado a mano (cofres, carros...)
	case 'O': return tall_object;
	case ' ': return empty;
	default: return floor_t;
	}
}

void BattleMap::load_rows(const std::vector<std::string>& p_rows)
{
	rows = p_rows;
	height = static_cast<int>(rows.size());
	width = 0;
	for (const std::string& r : rows)
	{
		width = std::max(width, static_cast<int>(r.size()));
	}
	for (std::string& r : rows)
	{
		while (static_cast<int>(r.size()) < width)
		{
			r += ' ';
		}
	}
	los_cache_.clear();
	obstacles_.clear();
	const size_t n = static_cast<size_t>(width) * static_cast<size_t>(height);
	walk_.assign(n, 0);
	cost_.assign(n, 0);
	cover_.assign(n, 0);
	zone_diff_.assign(n, 0);
	hazard_.assign(n, 0);
	for (int y = 0; y < height; ++y)
	{
		for (int x = 0; x < width; ++x)
		{
			const TileInfo& info = tile_info_for(rows[static_cast<size_t>(y)][static_cast<size_t>(x)]);
			const size_t i2 = static_cast<size_t>(x + y * width);
			walk_[i2] = info.walk ? 1 : 0;
			cost_[i2] = info.cost * kFt;
			cover_[i2] = static_cast<uint8_t>(info.cover);
			if (info.cover > 0)
			{
				obstacles_.push_back(Cell(x, y));
			}
		}
	}
}

char BattleMap::tile(const Cell& c) const
{
	if (!in_bounds(c))
	{
		return ' ';
	}
	return rows[static_cast<size_t>(c.y)][static_cast<size_t>(c.x)];
}

int BattleMap::move_cost(const Cell& c) const
{
	int base = tile_info(c).cost * kFt;
	if (in_bounds(c) && !zone_diff_.empty() && zone_diff_[static_cast<size_t>(c.x + c.y * width)] == 1)
	{
		base = std::max(base, 2 * kFt);
	}
	return base;
}

bool BattleMap::is_difficult(const Cell& c) const
{
	if (in_bounds(c) && !zone_diff_.empty() && zone_diff_[static_cast<size_t>(c.x + c.y * width)] == 1)
	{
		return true;
	}
	return tile_info(c).difficult;
}

void BattleMap::set_overlay(const std::vector<Cell>& difficult, const std::vector<Cell>& hazard)
{
	std::fill(zone_diff_.begin(), zone_diff_.end(), 0);
	std::fill(hazard_.begin(), hazard_.end(), 0);
	for (const Cell& c : difficult)
	{
		if (in_bounds(c))
		{
			zone_diff_[static_cast<size_t>(c.x + c.y * width)] = 1;
		}
	}
	for (const Cell& c2 : hazard)
	{
		if (in_bounds(c2))
		{
			hazard_[static_cast<size_t>(c2.x + c2.y * width)] = 1;
		}
	}
}

bool BattleMap::is_hazard(const Cell& c) const
{
	return in_bounds(c) && !hazard_.empty() && hazard_[static_cast<size_t>(c.x + c.y * width)] == 1;
}

// ------------------------------------------------------------------ geometría hexagonal

Cell BattleMap::to_axial(const Cell& c)
{
	return Cell(c.x - (c.y - (c.y & 1)) / 2, c.y);
}

Cell BattleMap::from_axial(const Cell& a)
{
	return Cell(a.x + (a.y - (a.y & 1)) / 2, a.y);
}

Vec2 BattleMap::center(const Cell& c)
{
	return Vec2(c.x + 0.5 + 0.5 * (c.y & 1), c.y * kRowH + 0.5);
}

Cell BattleMap::cell_at(const Vec2& p)
{
	const double r = (static_cast<double>(p.y) - 0.5) / kRowH;
	const double q = (static_cast<double>(p.x) - 0.5) - r * 0.5;
	return from_axial(battlemap_detail::cube_round(q, r));
}

int BattleMap::dist(const Cell& a, const Cell& b)
{
	const Cell aa = to_axial(a);
	const Cell bb = to_axial(b);
	const int dq = aa.x - bb.x;
	const int dr = aa.y - bb.y;
	return (std::abs(dq) + std::abs(dr) + std::abs(dq + dr)) / 2;
}

std::vector<Cell> BattleMap::neighbors(const Cell& c)
{
	const Cell* dirs = battlemap_detail::dirs_for_row(c.y);
	std::vector<Cell> out;
	out.reserve(6);
	for (int k = 0; k < 6; ++k)
	{
		out.push_back(c + dirs[k]);
	}
	return out;
}

Cell BattleMap::step_toward(const Cell& c, const Vec2& dir)
{
	if (dir.length() < 0.001f)
	{
		return c;
	}
	Cell best = c;
	float best_d = -std::numeric_limits<float>::infinity();
	const Vec2 o = center(c);
	const Vec2 nd = dir.normalized();
	for (const Cell& n : neighbors(c))
	{
		const Vec2 v = (center(n) - o).normalized();
		const float d = v.dot(nd);
		if (d > best_d)
		{
			best_d = d;
			best = n;
		}
	}
	return best;
}

std::vector<Vec2> BattleMap::corners(const Cell& c)
{
	const Vec2 o = center(c);
	std::vector<Vec2> out;
	out.reserve(6);
	for (int i = 0; i < 6; ++i)
	{
		const double ang = battlemap_detail::deg_to_rad(-90.0 + 60.0 * i);
		out.push_back(o + Vec2(std::cos(ang), std::sin(ang)) * static_cast<float>(kHexR));
	}
	return out;
}

std::vector<Vec2> BattleMap::candidate_points(const Cell& c)
{
	std::vector<Vec2> out;
	out.push_back(center(c));
	for (const Vec2& v : corners(c))
	{
		out.push_back(v);
	}
	return out;
}

Vec2 BattleMap::snap_point(const Vec2& p)
{
	Vec2 best = center(cell_at(p));
	for (const Vec2& q : candidate_points(cell_at(p)))
	{
		if (q.distance_to(p) < best.distance_to(p))
		{
			best = q;
		}
	}
	return best;
}

std::vector<Cell> BattleMap::within(const Cell& c, int r)
{
	std::vector<Cell> out;
	const Cell ac = to_axial(c);
	for (int dq = -r; dq <= r; ++dq)
	{
		const int lo = std::max(-r, -dq - r);
		const int hi = std::min(r, -dq + r);
		for (int dr = lo; dr <= hi; ++dr)
		{
			out.push_back(from_axial(ac + Cell(dq, dr)));
		}
	}
	return out;
}

std::vector<Cell> BattleMap::cells_on_segment(const Vec2& a, const Vec2& b, double step)
{
	std::vector<Cell> out;
	const int n = std::max(1, static_cast<int>(std::ceil(static_cast<double>(a.distance_to(b)) / step)));
	for (int i = 0; i <= n; ++i)
	{
		const Cell c = cell_at(a.lerp(b, static_cast<float>(static_cast<double>(i) / n)));
		add_unique(out, c);
	}
	return out;
}

// ------------------------------------------------------------------ línea de visión y cobertura

int BattleMap::cover_between(const Cell& from, const Cell& to, const std::vector<Cell>& blockers)
{
	if (from == to || dist(from, to) == 1)
	{
		return 0;
	}
	const uint64_t key = battlemap_detail::cover_key(from, to);
	auto it = los_cache_.find(key);
	if (it == los_cache_.end())
	{
		it = los_cache_.emplace(key, cover_hex(from, to)).first;
	}
	const CoverRes& res = it->second;
	if (res.cover >= 1)
	{
		return res.cover;
	}
	if (!res.half_cells.empty())
	{
		return 1;
	}
	if (blockers.empty())
	{
		return 0;
	}
	const std::vector<Cell> line = cells_on_segment(center(from), center(to), 0.12);
	for (const Cell& bc : blockers)
	{
		if (bc == from || bc == to)
		{
			continue;
		}
		if (contains(line, bc))
		{
			return 1;
		}
	}
	return 0;
}

BattleMap::CoverRes BattleMap::cover_hex(const Cell& from, const Cell& to) const
{
	const Vec2 a = center(from);
	const Vec2 b = center(to);
	// Salida rápida: ningún obstáculo cerca del segmento
	const Vec2 lo = Vec2(std::min(a.x, b.x), std::min(a.y, b.y)) - Vec2(1.0f, 1.0f);
	const Vec2 hi = Vec2(std::max(a.x, b.x), std::max(a.y, b.y)) + Vec2(1.0f, 1.0f);
	bool any = false;
	if (obstacles_.size() < 60)
	{
		for (const Cell& o : obstacles_)
		{
			const Vec2 oc = center(o);
			if (oc.x >= lo.x && oc.x <= hi.x && oc.y >= lo.y && oc.y <= hi.y)
			{
				any = true;
				break;
			}
		}
	}
	else
	{
		// Mapas grandes: solo las casillas del recuadro entre los dos puntos
		const int y0 = std::max(0, static_cast<int>(std::floor(lo.y / kRowH)) - 1);
		const int y1 = std::min(height - 1, static_cast<int>(std::ceil(hi.y / kRowH)) + 1);
		const int x0 = std::max(0, static_cast<int>(std::floor(lo.x)) - 1);
		const int x1 = std::min(width - 1, static_cast<int>(std::ceil(hi.x)) + 1);
		for (int yy = y0; yy <= y1 && !any; ++yy)
		{
			for (int xx = x0; xx <= x1; ++xx)
			{
				if (cover_[static_cast<size_t>(xx + yy * width)] > 0)
				{
					any = true;
					break;
				}
			}
		}
	}
	if (!any)
	{
		return CoverRes();
	}
	const Vec2 dir = (b - a).normalized();
	const Vec2 perp = Vec2(-dir.y, dir.x) * 0.38f;
	const Vec2 pts_from[3] = {a, a + perp, a - perp};
	const Vec2 pts_to[3] = {b, b + perp, b - perp};
	int best_blocked = 99;
	std::vector<Cell> best_half;
	for (const Vec2& pf : pts_from)
	{
		int blocked = 0;
		std::vector<Cell> halfs;
		for (const Vec2& pt : pts_to)
		{
			const TraceRes r = trace_hex(pf, pt, from, to);
			if (r.full)
			{
				blocked += 1;
			}
			else
			{
				for (const Cell& h : r.half_cells)
				{
					add_unique(halfs, h);
				}
			}
		}
		if (blocked < best_blocked || (blocked == best_blocked && halfs.size() < best_half.size()))
		{
			best_blocked = blocked;
			best_half = halfs;
		}
	}
	CoverRes res;
	if (best_blocked >= 3)
	{
		res.cover = 3;
	}
	else if (best_blocked == 2)
	{
		res.cover = 2;
	}
	else if (best_blocked == 1)
	{
		res.cover = 1;
	}
	res.half_cells = best_half;
	return res;
}

BattleMap::TraceRes BattleMap::trace_hex(const Vec2& a, const Vec2& b, const Cell& from, const Cell& to) const
{
	TraceRes out;
	for (const Cell& c : cells_on_segment(a, b))
	{
		if (c == from || c == to)
		{
			continue;
		}
		const int cv = tile_info(c).cover;
		if (cv >= 3)
		{
			out.full = true;
			break;
		}
		if (cv >= 1)
		{
			add_unique(out.half_cells, c);
		}
	}
	return out;
}

int BattleMap::cover_ac_bonus(int cover)
{
	switch (cover)
	{
	case 1: return 2;
	case 2: return 5;
	default: return 0;
	}
}

// ------------------------------------------------------------------ áreas

std::vector<Cell> BattleMap::sphere_cells(const Vec2& point, int radius_ft) const
{
	const double r = radius_ft / static_cast<double>(kFt);
	std::vector<Cell> out;
	for (const Cell& c : within(cell_at(point), static_cast<int>(std::ceil(r)) + 1))
	{
		if (in_bounds(c) && static_cast<double>(center(c).distance_to(point)) <= r + 0.02)
		{
			out.push_back(c);
		}
	}
	return out;
}

std::vector<Cell> BattleMap::cone_cells(const Cell& origin, const Vec2& toward, int length_ft)
{
	const Vec2 o = center(origin);
	Vec2 dir = toward - o;
	if (dir.length() < 0.01f)
	{
		dir = Vec2(0.0f, 1.0f);
	}
	dir = dir.normalized();
	const double length = length_ft / static_cast<double>(kFt);
	std::vector<Cell> out;
	const double half_angle = battlemap_detail::deg_to_rad(31.0);
	for (const Cell& c : within(origin, static_cast<int>(std::ceil(length))))
	{
		if (c == origin || !in_bounds(c))
		{
			continue;
		}
		const Vec2 v = center(c) - o;
		const double along = v.dot(dir);
		if (along <= 0.0 || along > length + 0.3)
		{
			continue;
		}
		if (std::fabs(static_cast<double>(v.angle_to(dir))) <= half_angle && has_los(origin, c))
		{
			out.push_back(c);
		}
	}
	return out;
}

std::vector<Cell> BattleMap::oriented_square(const Vec2& p, const Vec2& axis, double side, const Cell& exclude) const
{
	const Vec2 ax = axis.normalized();
	const Vec2 perp = Vec2(-ax.y, ax.x);
	const double half = side * 0.5 + 0.02;
	std::vector<Cell> out;
	for (const Cell& c : within(cell_at(p), static_cast<int>(std::ceil(side)) + 1))
	{
		if (!in_bounds(c) || c == exclude)
		{
			continue;
		}
		const Vec2 v = center(c) - p;
		if (std::fabs(static_cast<double>(v.dot(ax))) <= half && std::fabs(static_cast<double>(v.dot(perp))) <= half)
		{
			out.push_back(c);
		}
	}
	return out;
}

std::vector<Cell> BattleMap::cube_from_self(const Cell& origin, const Vec2& toward, int size_ft) const
{
	const double side = size_ft / static_cast<double>(kFt);
	Vec2 dir = toward - center(origin);
	if (dir.length() < 0.01f)
	{
		dir = Vec2(0.0f, 1.0f);
	}
	dir = dir.normalized();
	const Vec2 p = center(origin) + dir * (0.5 + side * 0.5);
	return oriented_square(p, dir, side, origin);
}

std::vector<Cell> BattleMap::square_cells(const Vec2& point, int size_ft) const
{
	return filter(oriented_square(point, Vec2(1.0f, 0.0f), size_ft / static_cast<double>(kFt)),
		[this](const Cell& c) { return tile_info(c).cover < 3; });
}

std::vector<Cell> BattleMap::line_cells(const Cell& origin, const Vec2& toward, int length_ft) const
{
	const Vec2 o = center(origin);
	Vec2 dir = toward - o;
	if (dir.length() < 0.01f)
	{
		dir = Vec2(0.0f, 1.0f);
	}
	dir = dir.normalized();
	const double length = length_ft / static_cast<double>(kFt);
	std::vector<Cell> out;
	double t = 0.5;
	while (t <= length + 0.3)
	{
		const Cell c = cell_at(o + dir * t);
		if (!in_bounds(c) || tile_info(c).cover >= 3)
		{
			break;
		}
		if (c != origin && !contains(out, c))
		{
			out.push_back(c);
		}
		t += 0.2;
	}
	return out;
}

std::vector<Cell> BattleMap::emanation_cells(const Cell& origin, int radius_ft)
{
	std::vector<Cell> out;
	for (const Cell& c : within(origin, radius_ft / kFt))
	{
		if (c != origin && in_bounds(c) && has_los(origin, c))
		{
			out.push_back(c);
		}
	}
	return out;
}

// ------------------------------------------------------------------ rutas

Reach BattleMap::reachable(const Cell& start, int budget_ft, const Creature* mover, const Occupancy& occ, bool crawl) const
{
	const bool trepa = mover != nullptr && mover->template_id == "giant_spider_srd";
	// Dijkstra con cola de cubos (los costes son múltiplos de 5 pies)
	const int n_cells = width * height;
	constexpr int kInf = 1 << 30;
	std::vector<int> cost_a(static_cast<size_t>(n_cells), kInf);
	std::vector<int> prev_a(static_cast<size_t>(n_cells), -1);
	std::vector<uint8_t> blocked(static_cast<size_t>(n_cells), 0);
	for (const auto& kv : occ)
	{
		if (in_bounds(kv.first) && !can_pass(kv.first, mover, occ))
		{
			blocked[static_cast<size_t>(kv.first.x + kv.first.y * width)] = 1;
		}
	}
	Reach out;
	if (!in_bounds(start))
	{
		return out;
	}
	const int si = start.x + start.y * width;
	cost_a[static_cast<size_t>(si)] = 0;
	const int nb = budget_ft / kFt + 1;
	std::vector<std::vector<int>> buckets(static_cast<size_t>(std::max(nb, 1)));
	buckets[0].push_back(si);
	std::vector<int> touched{si};
	for (size_t bi = 0; bi < buckets.size(); ++bi)
	{
		for (size_t idx = 0; idx < buckets[bi].size(); ++idx)
		{
			const int ci = buckets[bi][idx];
			const int cur_cost = cost_a[static_cast<size_t>(ci)];
			if (cur_cost != static_cast<int>(bi) * kFt)
			{
				continue;
			}
			const int cx = ci % width;
			const int cy = ci / width;
			const Cell* dirs = battlemap_detail::dirs_for_row(cy);
			for (int k = 0; k < 6; ++k)
			{
				const int nx = cx + dirs[k].x;
				const int ny = cy + dirs[k].y;
				if (nx < 0 || ny < 0 || nx >= width || ny >= height)
				{
					continue;
				}
				const int ni = nx + ny * width;
				const size_t uni = static_cast<size_t>(ni);
				if (walk_[uni] == 0 || blocked[uni] == 1)
				{
					continue;
				}
				int step = cost_[uni];
				if (zone_diff_[uni] == 1 && step < 2 * kFt)
				{
					step = 2 * kFt;
				}
				if (trepa)
				{
					// Ampliación (Trepar cual arácnido): la araña gigante del SRD no nota el terreno difícil
					step = kFt;
				}
				if (crawl)
				{
					step *= 2;
				}
				const int nc = cur_cost + step;
				if (nc > budget_ft)
				{
					continue;
				}
				if (nc < cost_a[uni])
				{
					if (cost_a[uni] == kInf)
					{
						touched.push_back(ni);
					}
					cost_a[uni] = nc;
					prev_a[uni] = ci;
					buckets[static_cast<size_t>(nc / kFt)].push_back(ni);
				}
			}
		}
	}
	for (int ti : touched)
	{
		const Cell c(ti % width, ti / width);
		out.cost[c] = cost_a[static_cast<size_t>(ti)];
		const int pv = prev_a[static_cast<size_t>(ti)];
		if (pv >= 0)
		{
			out.prev[c] = Cell(pv % width, pv / width);
		}
	}
	return out;
}

std::vector<Cell> BattleMap::find_path(const Cell& start, const Cell& goal, const CellMap<bool>& blocked, int max_iter) const
{
	if (start == goal)
	{
		return {start};
	}
	if (!in_bounds(goal) || !walkable(goal) || blocked.has(goal) || !in_bounds(start))
	{
		return {};
	}
	const int n_cells = width * height;
	constexpr int kInf = 1 << 29;
	std::vector<int> g(static_cast<size_t>(n_cells), kInf);
	std::vector<int> prev(static_cast<size_t>(n_cells), -1);
	const int si = start.x + start.y * width;
	const int gi = goal.x + goal.y * width;
	g[static_cast<size_t>(si)] = 0;
	std::map<int, std::vector<int>> buckets;
	const int f0 = dist(start, goal);
	buckets[f0] = {si};
	int fmin = f0;
	int iter = 0;
	bool found = false;
	while (iter < max_iter)
	{
		auto bit = buckets.find(fmin);
		if (bit == buckets.end() || bit->second.empty())
		{
			if (bit != buckets.end())
			{
				buckets.erase(bit);
			}
			if (buckets.empty())
			{
				break;
			}
			fmin = buckets.begin()->first;
			continue;
		}
		const int ci = bit->second.back();
		bit->second.pop_back();
		iter += 1;
		if (ci == gi)
		{
			found = true;
			break;
		}
		const int cx = ci % width;
		const int cy = ci / width;
		const Cell* dirs = battlemap_detail::dirs_for_row(cy);
		for (int k = 0; k < 6; ++k)
		{
			const int nx = cx + dirs[k].x;
			const int ny = cy + dirs[k].y;
			if (nx < 0 || ny < 0 || nx >= width || ny >= height)
			{
				continue;
			}
			const int ni = nx + ny * width;
			const size_t uni = static_cast<size_t>(ni);
			if (walk_[uni] == 0)
			{
				continue;
			}
			const Cell nc(nx, ny);
			if (blocked.has(nc) && ni != gi)
			{
				continue;
			}
			const int step = cost_[uni] > kFt ? 2 : 1;
			const int ng = g[static_cast<size_t>(ci)] + step;
			if (ng < g[uni])
			{
				g[uni] = ng;
				prev[uni] = ci;
				const int f = ng + dist(nc, goal);
				buckets[f].push_back(ni);
				if (f < fmin)
				{
					fmin = f;
				}
			}
		}
	}
	if (!found)
	{
		return {};
	}
	std::vector<Cell> out;
	int cur = gi;
	while (cur >= 0)
	{
		out.insert(out.begin(), Cell(cur % width, cur / width));
		if (cur == si)
		{
			break;
		}
		cur = prev[static_cast<size_t>(cur)];
	}
	return out;
}

bool BattleMap::can_pass(const Cell& cell, const Creature* mover, const Occupancy& occ)
{
	Creature* const* found = occ.find(cell);
	if (found == nullptr)
	{
		return true;
	}
	const Creature* o = *found;
	if (o == mover || o == nullptr || o->dead)
	{
		return true;
	}
	if (mover == nullptr)
	{
		return false;
	}
	if (o->team == mover->team)
	{
		return true;
	}
	if (o->is_down())
	{
		return true;
	}
	// Agilidad mediana: atravesar criaturas de tamaño mayor
	if (mover->has_trait("halfling_nimbleness") && o->size_rank() > mover->size_rank())
	{
		return true;
	}
	if (std::abs(o->size_rank() - mover->size_rank()) >= 2)
	{
		return true;
	}
	return false;
}

bool BattleMap::can_end_in(const Cell& cell, const Creature* mover, const Occupancy& occ)
{
	Creature* const* found = occ.find(cell);
	if (found == nullptr)
	{
		return true;
	}
	const Creature* o = *found;
	return o == mover || o == nullptr || o->dead;
}

std::vector<Cell> BattleMap::build_path(const CellMap<Cell>& prev, const Cell& start, const Cell& goal)
{
	std::vector<Cell> path;
	Cell cur = goal;
	if (cur != start && !prev.has(cur))
	{
		return {};
	}
	while (cur != start)
	{
		path.insert(path.begin(), cur);
		const Cell* p = prev.find(cur);
		if (p == nullptr)
		{
			return {};
		}
		cur = *p;
	}
	return path;
}

} // namespace mdg
