// Volcado de combates completos (IA contra IA) con el mismo recorrido que Tests/parity/battle_dump.gd.
// Uso: mdg_battle_dump salida.json [semillas] [probe]   y después   python3 Tests/parity/compare.py godot.json cpp.json
#include "MdgAI.h"
#include "MdgBattleSetup.h"
#include "MdgClassActions.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgSpells.h"

#include <cstdio>
#include <cstdlib>
#include <fstream>

using mdg::Json;
using mdg::Var;

namespace
{

const std::vector<std::string> kEncounters = {"e1_prado", "e2_pinar", "e3_tumulo"};
const std::vector<std::vector<std::string>> kParties = {
	{},
	{"barbarian", "bard", "cleric", "druid"},
	{"fighter", "monk", "paladin", "ranger"},
	{"rogue", "sorcerer", "warlock", "wizard"},
	{"fighter:orc", "wizard:tiefling", "cleric:dwarf", "ranger:dragonborn"},
	{"paladin:goliath", "rogue:halfling", "warlock:half_elf", "sorcerer:gnome"},
	{"monk:elf", "druid:human", "bard:half_orc", "barbarian:dragonborn"},
};

Json party_from(const std::vector<std::string>& toks)
{
	Json out = Json::array();
	for (const std::string& tok : toks)
	{
		const size_t colon = tok.find(':');
		const std::string cls = tok.substr(0, colon);
		Json sheet = Json::object();
		sheet["id"] = "pc_" + cls + std::to_string(out.size());
		sheet["name"] = mdg::jstr(mdg::jobj(mdg::RulesDB::classes, cls), "name", cls);
		sheet["class"] = cls;
		if (colon != std::string::npos)
		{
			sheet["species"] = tok.substr(colon + 1);
		}
		out.push_back(sheet);
	}
	return out;
}

Json canon(const Var& v)
{
	switch (v.type())
	{
	case Var::Type::Nil:
		return nullptr;
	case Var::Type::Bool:
		return v.truthy();
	case Var::Type::Int:
		return v.to_int();
	case Var::Type::String:
		return v.as_str();
	case Var::Type::Float:
		return "f:" + v.str();
	case Var::Type::CellT:
		return mdg::format("V(%d,%d)", v.cell().x, v.cell().y);
	case Var::Type::Vec2T:
		return "v(" + Var(static_cast<double>(v.vec2().x)).str() + "," + Var(static_cast<double>(v.vec2().y)).str() + ")";
	case Var::Type::Array:
	{
		Json out = Json::array();
		for (size_t i = 0; i < v.size(); ++i)
		{
			out.push_back(canon(v.at(i)));
		}
		return out;
	}
	case Var::Type::Dict:
	{
		Json out = Json::object();
		for (const auto& kv : v.dct().items())
		{
			out[kv.first.str()] = canon(kv.second);
		}
		return out;
	}
	case Var::Type::CreatureT:
		return v.creature() != nullptr ? Json("C:" + v.creature()->id) : Json(nullptr);
	case Var::Type::EffectT:
		return v.effect() != nullptr ? Json("E:" + v.effect()->kind) : Json(nullptr);
	}
	return "?";
}

template <class V>
Json dict_json(const mdg::Dict<V>& d)
{
	Json out = Json::object();
	for (const auto& kv : d)
	{
		out[kv.first] = kv.second;
	}
	return out;
}

Json final_state(const mdg::Creature& c)
{
	Json o = Json::object();
	o["id"] = c.id;
	o["name"] = c.name;
	o["hp"] = c.hp;
	o["temp_hp"] = c.temp_hp;
	o["max_hp"] = c.max_hp;
	o["dead"] = c.dead;
	o["stable"] = c.stable;
	o["ds"] = Json::array({c.death_successes, c.death_failures});
	o["cell"] = canon(Var(c.cell));
	Json conds = Json::object();
	for (const auto& kv : c.conditions)
	{
		conds[kv.first] = kv.second;
	}
	o["conditions"] = conds;
	Json effs = Json::array();
	for (const auto& e : c.effects)
	{
		effs.push_back(e->kind);
	}
	o["effects"] = effs;
	o["slots"] = c.slots;
	o["resources"] = dict_json(c.resources);
	o["items"] = dict_json(c.items);
	o["form"] = c.form;
	o["conc"] = c.concentration_spell;
	o["stats"] = dict_json(c.stats);
	return o;
}

Json ids_json(const std::vector<mdg::Creature*>& cs)
{
	Json out = Json::array();
	for (const mdg::Creature* x : cs)
	{
		out.push_back(x->id);
	}
	return out;
}

Json canon_list(const std::vector<Var>& vs)
{
	Json out = Json::array();
	for (const Var& v : vs)
	{
		out.push_back(canon(v));
	}
	return out;
}

/** Las consultas de la interfaz al empezar el turno de un PJ (igual que probe() en battle_dump.gd). */
Json probe(mdg::Battle& b, mdg::Creature* c, bool try_undo)
{
	Json p = Json::object();
	p["who"] = c->id;
	p["round"] = b.round_num;
	const mdg::Battle::MoveOptions mo = b.move_options(c);
	int total = 0;
	Json cells = Json::array();
	for (const auto& kv : mo.cost)
	{
		total += kv.second;
		cells.push_back(canon(Var(kv.first)));
	}
	int dtotal = 0;
	for (const auto& kv : mo.dash_cost)
	{
		dtotal += kv.second;
	}
	p["move"] = Json::array({mo.cost.size(), total, mo.dash_cost.size(), dtotal, mo.crawl});
	p["move_cells"] = cells;
	const std::vector<Var> profs = b.attack_profiles(c);
	p["profiles"] = canon_list(profs);
	Json vs = Json::array();
	for (mdg::Creature* e : b.enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		for (const Var& pr : profs)
		{
			Json one = Json::object();
			one["e"] = e->id;
			one["key"] = canon(pr.get("key"));
			one["range"] = b.in_attack_range(c, pr, e);
			one["mode"] = canon(b.attack_mode(c, e, pr.gets("kind"), std::nullopt, pr));
			one["ac"] = b.target_ac(e, c);
			one["cover"] = b.cover(c, e);
			one["prev"] = canon(b.preview_attack(c, pr, e));
			vs.push_back(one);
		}
	}
	p["vs"] = vs;
	const std::vector<Var> av = b.spells->available(c);
	p["spells"] = canon_list(av);
	Json st = Json::object();
	for (const Var& sp : av)
	{
		if (sp.getb("usable"))
		{
			st[sp.gets("id")] = ids_json(b.spells->valid_targets(c, sp.gets("id")));
		}
	}
	p["spell_targets"] = st;
	const std::vector<Var> cl = b.cls->list(c);
	p["cls"] = canon_list(cl);
	Json ct = Json::object();
	for (const Var& en : cl)
	{
		ct[en.gets("id")] = ids_json(b.cls->valid_targets(c, en.gets("id")));
	}
	p["cls_targets"] = ct;
	p["potions"] = b.usable_potions(c);
	Json riders = Json::array();
	for (const Var& pr : profs)
	{
		riders.push_back(canon_list(b.spells->rider_options(c, pr)));
	}
	p["riders"] = riders;
	// Ruta a la casilla más lejana (la primera con el coste máximo)
	mdg::Cell far = c->cell;
	int best = -1;
	for (const auto& kv : mo.cost)
	{
		if (kv.second > best)
		{
			best = kv.second;
			far = kv.first;
		}
	}
	const std::vector<mdg::Cell> path = mdg::BattleMap::build_path(mo.prev, c->cell, far);
	Json pj = Json::array();
	for (const mdg::Cell& x : path)
	{
		pj.push_back(canon(Var(x)));
	}
	p["path"] = pj;
	Json threats = Json::array();
	for (const auto& th : b.path_threats(c, path))
	{
		threats.push_back(Json::array({th.first->id, canon(Var(th.second))}));
	}
	p["threats"] = threats;
	if (try_undo && far != c->cell && threats.empty())
	{
		b.do_move(c, path);
		p["undo"] = Json::array({b.can_undo_move(c), canon(Var(c->cell))});
		b.undo_move(c);
		p["after"] = Json::array({canon(Var(c->cell)), b.can_undo_move(c), c->turn.moved});
	}
	return p;
}

} // namespace

int main(int argc, char** argv)
{
	const std::string out_path = argc > 1 ? argv[1] : "battle_cpp.json";
	const int nseeds = argc > 2 ? std::atoi(argv[2]) : 2;
	const bool probing = argc > 3 && std::string(argv[3]) == "probe";
	mdg::FolderSource src(MDG_DATA_DIR);
	if (!mdg::RulesDB::load_all(src))
	{
		for (const std::string& e : mdg::RulesDB::errors)
		{
			std::fprintf(stderr, "%s\n", e.c_str());
		}
		return 2;
	}
	mdg::Loc::load(src);
	std::vector<std::string> keys;
	for (const std::string& eid : kEncounters)
	{
		for (int lvl = 1; lvl <= 3; ++lvl)
		{
			const std::string k = mdg::format("x_%s_%d", eid.c_str(), lvl);
			Json e = mdg::RulesDB::encounters[eid];
			e["level"] = lvl;
			mdg::RulesDB::encounters[k] = e;
			keys.push_back(k);
		}
	}
	Json battles = Json::array();
	for (const std::string& k : keys)
	{
		for (size_t pi = 0; pi < kParties.size(); ++pi)
		{
			for (int s = 0; s < nseeds; ++s)
			{
				const int64_t seed_value = 7000 + 131 * s + 17 * static_cast<int64_t>(pi);
				std::unique_ptr<mdg::Battle> b = mdg::BattleSetup::build(k, seed_value, party_from(kParties[pi]));
				mdg::AIBrain ai(*b);
				b->start();
				int guard = 0;
				Json probes = Json::array();
				while (!b->over && guard < 600)
				{
					guard += 1;
					if (probing && b->current->is_pc && b->current->can_act())
					{
						probes.push_back(probe(*b, b->current, probes.empty()));
					}
					ai.take_turn(b->current);
					if (!b->over)
					{
						b->end_turn();
					}
					if (b->round_num > 25)
					{
						break;
					}
				}
				Json one = Json::object();
				one["key"] = mdg::format("%s/p%d/s%lld", k.c_str(), static_cast<int>(pi), static_cast<long long>(seed_value));
				one["winner"] = b->winner;
				one["over"] = b->over;
				one["round"] = b->round_num;
				one["guard"] = guard;
				one["log"] = b->log_lines;
				Json evs = Json::array();
				for (const Var& e : b->events)
				{
					evs.push_back(canon(e));
				}
				one["events"] = evs;
				Json fin = Json::array();
				for (const auto& c : b->creatures)
				{
					fin.push_back(final_state(*c));
				}
				one["final"] = fin;
				one["probes"] = probes;
				battles.push_back(one);
				std::fprintf(stderr, "%s ronda %d ganador %d\n", one["key"].get<std::string>().c_str(), b->round_num, b->winner);
			}
		}
	}
	Json root = Json::object();
	root["battles"] = battles;
	std::ofstream f(out_path);
	f << root.dump(1);
	std::printf("combates: %zu -> %s\n", battles.size(), out_path.c_str());
	return 0;
}
