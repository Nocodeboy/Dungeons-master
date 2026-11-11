// Pruebas del combate: montaje de encuentros, reglas de daño y combates completos con la IA.
// Los valores «de oro» salen de la versión de Godot (Tests/parity/battle_dump.gd): si cambian aquí
// y no allí, el port se ha separado de Godot.
#include "doctest.h"

#include "MdgAI.h"
#include "MdgBattleSetup.h"
#include "MdgRulesDB.h"

#include <chrono>
#include <cstdint>

using namespace mdg;

namespace
{

struct SimOut
{
	std::unique_ptr<Battle> battle;
	double slowest_ms = 0.0;
};

SimOut simulate(const std::string& enc, int64_t seed, const Json& party = Json::array())
{
	SimOut out;
	out.battle = BattleSetup::build(enc, seed, party);
	Battle& b = *out.battle;
	AIBrain ai(b);
	b.start();
	int guard = 0;
	while (!b.over && guard < 600)
	{
		guard += 1;
		const auto t0 = std::chrono::steady_clock::now();
		ai.take_turn(b.current);
		const double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t0).count();
		out.slowest_ms = std::max(out.slowest_ms, ms);
		if (!b.over)
		{
			b.end_turn();
		}
		if (b.round_num > 25)
		{
			break;
		}
	}
	return out;
}

uint64_t fnv1a(const StrList& lines)
{
	uint64_t h = 0xcbf29ce484222325ULL;
	for (size_t i = 0; i < lines.size(); ++i)
	{
		if (i > 0)
		{
			h ^= static_cast<unsigned char>('\n');
			h *= 0x100000001b3ULL;
		}
		for (const char ch : lines[i])
		{
			h ^= static_cast<unsigned char>(ch);
			h *= 0x100000001b3ULL;
		}
	}
	return h;
}

Json class_party(std::initializer_list<const char*> classes)
{
	Json out = Json::array();
	for (const char* cls : classes)
	{
		Json sheet = Json::object();
		sheet["id"] = std::string("pc_") + cls + std::to_string(out.size());
		sheet["name"] = jstr(jobj(RulesDB::classes, cls), "name", cls);
		sheet["class"] = cls;
		out.push_back(sheet);
	}
	return out;
}

Creature* first_of(Battle& b, const std::string& template_id)
{
	for (const CreaturePtr& c : b.creatures)
	{
		if (c->template_id == template_id)
		{
			return c.get();
		}
	}
	return nullptr;
}

} // namespace

TEST_CASE("montaje del encuentro de los trasgos")
{
	std::unique_ptr<Battle> b = BattleSetup::build("e1_prado", 1000);
	REQUIRE(b->creatures.size() == 11);
	int pcs = 0;
	for (const CreaturePtr& c : b->creatures)
	{
		pcs += c->is_pc ? 1 : 0;
	}
	CHECK(pcs == 4);
	CHECK(b->creatures[0]->id == "brenna");
	CHECK(b->creatures[3]->id == "odvar");
	// Los repetidos llevan número; el único arquero, no
	CHECK(b->get_creature("goblin_minion#3")->name == "Trasgo esbirro 3");
	CHECK(b->get_creature("goblin_archer#1")->name == "Trasgo arquero");
	CHECK_FALSE(b->settings.getb("sunlight"));
	// Las casillas de salida del grupo salen del encuentro
	const Json& spawns = jarr(b->encounter, "party_spawn");
	REQUIRE(spawns.size() >= 1);
	CHECK(b->creatures[0]->cell == Cell(static_cast<int>(spawns[0][0].get<double>()), static_cast<int>(spawns[0][1].get<double>())));
}

TEST_CASE("vulnerabilidad e inmunidad al daño")
{
	std::unique_ptr<Battle> b = BattleSetup::build("e3_tumulo", 5);
	Creature* sk = first_of(*b, "skeleton");
	REQUIRE(sk != nullptr);
	const int hp0 = sk->hp;
	CHECK(b->apply_damage(sk, 3, "bludgeoning") == 6);
	CHECK(sk->hp == hp0 - 6);
	CHECK(b->apply_damage(sk, 5, "poison") == 0);
	CHECK(sk->hp == hp0 - 6);
}

TEST_CASE("misma semilla, mismo combate")
{
	const SimOut a = simulate("e1_prado", 4242);
	const SimOut c = simulate("e1_prado", 4242);
	CHECK(a.battle->log_lines == c.battle->log_lines);
	CHECK(a.battle->winner == c.battle->winner);
	const SimOut d = simulate("e1_prado", 4243);
	CHECK(a.battle->log_lines != d.battle->log_lines);
}

TEST_CASE("los combates terminan")
{
	for (const char* enc : {"e1_prado", "e2_pinar", "e3_tumulo"})
	{
		for (int64_t seed = 100; seed < 106; ++seed)
		{
			const SimOut s = simulate(enc, seed);
			CHECK_MESSAGE(s.battle->over, std::string(enc) << " semilla " << seed);
			CHECK(s.battle->winner >= 0);
		}
	}
}

TEST_CASE("idéntico a Godot (registro completo)")
{
	struct Golden
	{
		const char* enc;
		int64_t seed;
		int party;
		size_t lines;
		int winner;
		int rounds;
		uint64_t hash;
	};
	const Golden cases[] = {
		{"e1_prado", 7000, 0, 49, 0, 3, 0x41641df2c82f968fULL},
		{"e2_pinar", 7000, 0, 124, 0, 6, 0x3c504750f4da57c7ULL},
		{"e3_tumulo", 7000, 0, 130, 0, 6, 0x4c8fd30181b7a15fULL},
		{"e3_tumulo", 7051, 3, 203, 1, 8, 0x3a52ff80a66e45aaULL},
		{"e2_pinar", 7017, 1, 196, 0, 7, 0x0d0eb50b19c90bb4ULL},
	};
	for (const Golden& g : cases)
	{
		const Json party = g.party == 0   ? Json::array()
						   : g.party == 1 ? class_party({"barbarian", "bard", "cleric", "druid"})
										  : class_party({"rogue", "sorcerer", "warlock", "wizard"});
		const SimOut s = simulate(g.enc, g.seed, party);
		CAPTURE(g.enc);
		CAPTURE(g.seed);
		CHECK(s.battle->log_lines.size() == g.lines);
		CHECK(s.battle->winner == g.winner);
		CHECK(s.battle->round_num == g.rounds);
		CHECK(fnv1a(s.battle->log_lines) == g.hash);
		MESSAGE(std::string(g.enc) << ": turno de IA más lento " << s.slowest_ms << " ms");
	}
}
