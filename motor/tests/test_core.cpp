// Equivalente de tests/test_core.gd de la versión de Godot (mismos valores esperados).
#include "doctest.h"

#include "MdgBattleMap.h"
#include "MdgDice.h"
#include "MdgFactory.h"
#include "MdgRulesDB.h"
#include "MdgSort.h"
#include "MdgVar.h"

#include <cmath>

using mdg::BattleMap;
using mdg::Cell;
using mdg::Dice;
using mdg::Factory;

namespace
{
BattleMap make_map(const std::vector<std::string>& rows)
{
	BattleMap m;
	m.load_rows(rows);
	return m;
}
} // namespace

TEST_CASE("dados: análisis y probabilidades")
{
	const mdg::DiceExpr p = Dice::parse("2d6+3");
	CHECK(p.count == 2);
	CHECK(p.sides == 6);
	CHECK(p.bonus == 3);
	CHECK(Dice::average("1d8+2") == doctest::Approx(6.5));
	CHECK(Dice::with_bonus("1d6", -2) == "1d6-2");
	CHECK(Dice::add_dice("1d10", 1) == "2d10");
	CHECK(std::fabs(Dice::p_success(5, 15, 0) - 0.55) < 0.001);
	CHECK(Dice::p_success(5, 15, 1) > 0.55);
	CHECK(Dice::p_success(5, 15, -1) < 0.55);
	CHECK(Dice::parse("4").bonus == 4);
	CHECK(Dice::parse("d6").count == 1);
	CHECK(Dice::with_bonus("1d4", -1) == "1d4-1");
	CHECK(Dice::with_bonus("0", 3) == "3");
	CHECK(Dice::max_value("2d6+1") == 13);
}

TEST_CASE("dados: mismo generador que Godot")
{
	// Valores sacados de Godot 4.7 con RandomNumberGenerator (seed = 42 / 7 / 123)
	Dice d(42);
	const std::vector<int> expected = {18, 9, 1, 16, 13, 17, 19, 4, 10, 12};
	for (int e : expected)
	{
		CHECK(d.die(20) == e);
	}
	mdg::Pcg32 r(7);
	CHECK(r.rand() == 1352667803u);
	CHECK(r.rand() == 3706616521u);
	r.seed(7);
	CHECK(r.randf() == doctest::Approx(0.431506962).epsilon(1e-7));
	CHECK(r.randf() == doctest::Approx(0.707069993).epsilon(1e-7));
	CHECK(r.randf() == doctest::Approx(0.900402844).epsilon(1e-7));
	r.seed(123);
	const std::vector<int> ranged = {4, -2, 1, -3, 5, 1};
	for (int e : ranged)
	{
		CHECK(r.randi_range(-3, 5) == e);
	}
}

TEST_CASE("grupo: hojas de los compañeros")
{
	auto u = Factory::make_pc("brenna", 1);
	CHECK(u->max_hp == 12);
	CHECK(u->ac() == 19); // cota 16 + escudo 2 + defensa 1
	auto u3 = Factory::make_pc("brenna", 3);
	CHECK(u3->max_hp == 28);
	CHECK(u3->has_trait("improved_critical"));
	auto t = Factory::make_pc("pip", 1);
	CHECK(t->max_hp == 10);
	CHECK(t->ac() == 14);
	CHECK(t->sneak_attack == "1d6");
	CHECK(t->skill_bonus("stealth") == 7);
	CHECK(t->size == "small");
	auto j = Factory::make_pc("ilyra", 3);
	CHECK(j->slots == std::vector<int>{4, 2});
	CHECK(mdg::contains(j->known_spells(), std::string("aid")));
	CHECK(j->base_speed == 35);
	CHECK(j->spell_save_dc() == 13);
	auto o = Factory::make_pc("odvar", 1);
	CHECK(o->max_hp == 9);
	CHECK(o->ac() == 11);
	CHECK(o->spell_attack_bonus() == 5);
	CHECK(o->free_casts.has("mage_armor"));
}

TEST_CASE("monstruos")
{
	auto g = Factory::make_monster("goblin_warrior", 1);
	CHECK(g->max_hp == 10);
	CHECK(g->ac() == 15);
	CHECK(g->size == "small");
	auto s = Factory::make_monster("skeleton_archer", 2);
	CHECK(s->max_hp == 13);
	CHECK(s->ai_profile == "archer");
	CHECK(mdg::contains(s->vulnerable, std::string("bludgeoning")));
	auto w = Factory::make_monster("wight", 1);
	CHECK(mdg::jint(w->multiattack, "count") == 2);
}

TEST_CASE("cobertura")
{
	BattleMap m = make_map({"..........", "....#.....", "....#.....", "....#.....", ".........."});
	CHECK(m.cover_between(Cell(2, 2), Cell(7, 2)) == 3);
	CHECK(m.cover_between(Cell(2, 0), Cell(7, 0)) == 0);
	CHECK(m.cover_between(Cell(2, 2), Cell(7, 4)) == 3);
	BattleMap m3 = make_map({"..........", "....#.....", "....#.....", "..........", ".........."});
	const int cv = m3.cover_between(Cell(2, 2), Cell(7, 3));
	CHECK(cv >= 1);
	CHECK(cv <= 2);
	CHECK(m3.cover_between(Cell(5, 4), Cell(5, 1)) == 0);
	BattleMap m2 = make_map({"......", "..r...", "......"});
	CHECK(m2.cover_between(Cell(0, 1), Cell(4, 1)) == 1);
}

TEST_CASE("áreas y geometría hexagonal")
{
	BattleMap m = make_map({"..........", "..........", "..........", "..........", ".........."});
	const Cell c(4, 2);
	CHECK(m.sphere_cells(BattleMap::center(c), 5).size() == 7);
	CHECK(m.sphere_cells(BattleMap::corners(c)[1], 5).size() == 3);
	CHECK(BattleMap::within(c, 2).size() == 19);
	const auto cube = m.cube_from_self(Cell(4, 0), BattleMap::center(Cell(4, 3)), 15);
	CHECK(cube.size() >= 8);
	CHECK(cube.size() <= 12);
	CHECK_FALSE(mdg::contains(cube, Cell(4, 0)));
	const auto cone = m.cone_cells(Cell(1, 2), BattleMap::center(Cell(6, 2)), 15);
	CHECK(cone.size() >= 5);
	CHECK(cone.size() <= 9);
	CHECK(BattleMap::neighbors(c).size() == 6);
	for (const Cell& n : BattleMap::neighbors(c))
	{
		CHECK(BattleMap::dist(c, n) == 1);
		CHECK(std::fabs(BattleMap::center(c).distance_to(BattleMap::center(n)) - 1.0f) < 0.001f);
		CHECK(BattleMap::cell_at(BattleMap::center(n)) == n);
	}
	CHECK(BattleMap::dist(Cell(0, 0), Cell(3, 4)) == 5);
}

TEST_CASE("rutas")
{
	BattleMap m = make_map({"........", "...#....", "...#....", "........"});
	auto c = Factory::make_pc("brenna", 1);
	c->cell = Cell(1, 1);
	mdg::Occupancy occ;
	occ[c->cell] = c.get();
	const mdg::Reach r = m.reachable(c->cell, 30, c.get(), occ);
	CHECK(r.cost.has(Cell(4, 1)));
	CHECK_FALSE(r.cost.has(Cell(3, 1)));
	CHECK(r.cost.get(Cell(2, 2), -1) == 5);
	const auto path = m.find_path(Cell(1, 1), Cell(5, 1));
	REQUIRE_FALSE(path.empty());
	CHECK(path.front() == Cell(1, 1));
	CHECK(path.back() == Cell(5, 1));
}

TEST_CASE("godot_sort ordena los empates igual que Godot")
{
	// Referencia: Array.sort_custom de Godot 4.7 con [float((i * 7919) % 13), i] y x[0] > y[0]
	const std::vector<std::pair<int, std::string>> expected = {
		{10, "6,5,4,3,9,2,8,1,7,0"},
		{17, "6,12,5,11,4,10,16,3,9,15,2,8,14,1,7,13,0"},
		{40, "32,19,6,25,38,12,31,18,5,37,24,11,17,4,30,23,36,10,16,29,3,35,22,9,15,2,28,34,21,8,1,27,14,7,33,20,39,26,13,0"},
		{100, "97,84,58,32,45,6,19,71,38,25,90,64,12,51,77,70,83,31,44,5,57,96,18,50,37,11,76,89,24,63,95,17,43,30,4,69,82,56,49,"
			  "36,75,62,88,23,10,42,29,81,16,94,68,3,55,74,61,48,35,87,22,9,54,80,41,28,15,93,67,2,86,73,99,60,8,47,34,21,66,1,53,"
			  "14,79,92,40,27,98,7,20,33,85,46,59,72,26,39,91,78,13,52,65,0"},
	};
	for (const auto& [n, order] : expected)
	{
		std::vector<std::pair<double, int>> arr;
		for (int i = 0; i < n; ++i)
		{
			arr.emplace_back(static_cast<double>((i * 7919) % 13), i);
		}
		mdg::godot_sort(arr, [](const std::pair<double, int>& x, const std::pair<double, int>& y) { return x.first > y.first; });
		std::string got;
		for (size_t i = 0; i < arr.size(); ++i)
		{
			got += (i > 0 ? "," : "") + std::to_string(arr[i].second);
		}
		CHECK(got == order);
	}
}

TEST_CASE("str() de reales igual que Godot")
{
	// Referencia: print(str(v)) en Godot 4.7
	const std::vector<std::pair<double, std::string>> cases = {
		{0.8 * 7.5, "6.0"}, {0.7 * 10.0, "7.0"}, {0.1 + 0.2, "0.3"}, {6.0, "6.0"}, {-0.0, "0.0"},
		{1e20, "100000000000000000000.0"}, {123456.000000001, "123456.000000001"}, {-6.000000000000001, "-6.0"},
		{1.0 / 3.0, "0.33333333333333"}, {2.5e-7, "0.00000025"}, {99.99999999999999, "100.0"},
		{0.30000000000000004, "0.3"}, {-1e-16, "-0.0"}, {1e15 + 0.3, "1000000000000000.25"},
	};
	for (const auto& [v, expected] : cases)
	{
		CHECK(mdg::Var(v).str() == expected);
	}
}
