// Volcado del núcleo en C++ con el mismo formato que Tests/parity/parity_dump.gd (versión de Godot).
// Uso: mdg_dump salida.json   y después   python3 Tests/parity/compare.py godot.json cpp.json
#include "MdgBattleMap.h"
#include "MdgCharacterSheet.h"
#include "MdgFactory.h"
#include "MdgRulesDB.h"

#include <cstdio>
#include <fstream>

using mdg::BattleMap;
using mdg::Cell;
using mdg::Creature;
using mdg::Json;

namespace
{

Json weapons_json(const std::vector<mdg::Var>& ws)
{
	Json out = Json::array();
	for (const mdg::Var& w : ws)
	{
		out.push_back(w.to_json());
	}
	return out;
}

Json summ(const Creature& c)
{
	Json saves = Json::object();
	for (const std::string& a : Creature::kAbilities)
	{
		saves[a] = c.save_bonus(a);
	}
	Json skills = Json::object();
	for (const std::string& s : mdg::CharacterSheet::kSkills)
	{
		skills[s] = c.skill_bonus(s);
	}
	Json o = Json::object();
	o["id"] = c.id;
	o["name"] = c.name;
	o["level"] = c.level;
	o["cls"] = c.cls;
	o["subclass"] = c.subclass;
	o["species"] = c.species;
	o["lineage"] = c.lineage;
	o["ancestry"] = c.ancestry;
	o["background"] = c.background;
	o["size"] = c.size;
	o["ctype"] = c.ctype;
	o["team"] = c.team;
	o["max_hp"] = c.max_hp;
	o["ac"] = c.ac();
	o["speed"] = c.speed();
	o["base_speed"] = c.base_speed;
	o["abilities"] = mdg::to_json(c.abilities);
	o["saves"] = saves;
	o["skills"] = skills;
	o["init"] = c.initiative_bonus();
	o["pp"] = c.passive_perception();
	o["pb"] = c.prof_bonus;
	o["traits"] = mdg::to_json(c.traits);
	o["feats"] = mdg::to_json(c.feats);
	o["resist"] = mdg::to_json(c.resist);
	o["vulnerable"] = mdg::to_json(c.vulnerable);
	o["immune"] = mdg::to_json(c.immune);
	o["condition_immune"] = mdg::to_json(c.condition_immune);
	o["masteries"] = mdg::to_json(c.masteries);
	o["expertise"] = mdg::to_json(c.expertise);
	o["skill_profs"] = mdg::to_json(c.skill_profs);
	o["save_profs"] = mdg::to_json(c.save_profs);
	o["weapons"] = weapons_json(c.weapons);
	o["cantrips"] = mdg::to_json(c.cantrips);
	o["prepared"] = mdg::to_json(c.prepared);
	o["always_prepared"] = mdg::to_json(c.always_prepared);
	o["at_will"] = mdg::to_json(c.at_will);
	o["known"] = mdg::to_json(c.known_spells());
	o["free_casts"] = mdg::to_json(c.free_casts);
	o["slots"] = mdg::to_json(c.slots);
	o["resources"] = mdg::to_json(c.resources);
	o["spell_source"] = mdg::to_json(c.spell_source);
	o["spell_ability"] = mdg::to_json(c.spell_ability);
	o["casting_ability"] = c.casting_ability;
	o["caster_type"] = c.caster_type;
	o["dc"] = c.spell_save_dc();
	o["atk"] = c.spell_attack_bonus();
	o["sneak"] = c.sneak_attack;
	o["martial_die"] = c.martial_die;
	o["rage_damage"] = c.rage_damage;
	o["bardic_die"] = c.bardic_die;
	o["pact_weapon"] = c.pact_weapon;
	o["breath_type"] = c.breath_type;
	o["ammo"] = mdg::to_json(c.ammo);
	o["items"] = mdg::to_json(c.items);
	o["darkvision"] = c.darkvision;
	o["fighting_style"] = c.fighting_style;
	o["armor_id"] = c.armor_id;
	o["has_shield"] = c.has_shield;
	o["wild_shapes"] = mdg::to_json(c.wild_shapes);
	o["metamagic"] = mdg::to_json(c.metamagic);
	o["multiattack"] = c.multiattack;
	o["life_drain"] = c.life_drain;
	o["bonus_actions"] = mdg::to_json(c.bonus_actions);
	o["reactions"] = mdg::to_json(c.reactions);
	o["ai"] = c.ai_profile;
	o["xp"] = c.xp;
	o["tags"] = mdg::to_json(c.tags);
	o["init_override"] = c.init_bonus_override;
	o["fixed_ac"] = c.fixed_ac;
	o["reach"] = c.reach_cells();
	o["sheet"] = c.sheet;
	o["visual"] = c.visual;
	Json ranged = Json::array();
	for (const mdg::Var& w : c.ranged_options())
	{
		ranged.push_back(w.get("id").to_json());
	}
	o["ranged"] = ranged;
	Json melee = Json::array();
	for (const mdg::Var& w : c.melee_weapons())
	{
		melee.push_back(w.get("id").to_json());
	}
	o["melee"] = melee;
	Json prof = Json::array();
	Json watk = Json::array();
	Json mastery = Json::array();
	for (const mdg::Var& w : c.weapons)
	{
		prof.push_back(c.is_proficient(w));
		watk.push_back(c.weapon_attack_ability(w));
		mastery.push_back(c.has_mastery(w));
	}
	o["prof"] = prof;
	o["watk"] = watk;
	o["mastery"] = mastery;
	return o;
}

Json cells_json(const std::vector<Cell>& v)
{
	Json out = Json::array();
	for (const Cell& c : v)
	{
		out.push_back(Json::array({c.x, c.y}));
	}
	return out;
}

Json map_dump(const Json& rows_json)
{
	BattleMap m;
	std::vector<std::string> rows;
	for (const Json& r : rows_json)
	{
		rows.push_back(mdg::jto_str(r));
	}
	m.load_rows(rows);
	const int w = m.width;
	const int h = m.height;
	Json covers = Json::array();
	for (int i = 0; i < 160; ++i)
	{
		const Cell a((i * 7 + 3) % w, (i * 13 + 1) % h);
		const Cell b((i * 11 + 5) % w, (i * 5 + 2) % h);
		covers.push_back(m.cover_between(a, b));
	}
	Json areas = Json::array();
	for (int i = 0; i < 24; ++i)
	{
		const Cell c((i * 5 + 2) % w, (i * 3 + 1) % h);
		const Cell t((i * 9 + 4) % w, (i * 7 + 3) % h);
		const mdg::Vec2 p = i % 2 == 1 ? BattleMap::corners(c)[static_cast<size_t>(i % 6)] : BattleMap::center(c);
		Json a = Json::object();
		a["sphere"] = cells_json(m.sphere_cells(p, 10 + 5 * (i % 3)));
		a["cone"] = cells_json(m.cone_cells(c, BattleMap::center(t), 15));
		a["cube"] = cells_json(m.cube_from_self(c, BattleMap::center(t), 15));
		a["square"] = cells_json(m.square_cells(p, 10));
		a["line"] = cells_json(m.line_cells(c, BattleMap::center(t), 30));
		a["eman"] = cells_json(m.emanation_cells(c, 10));
		const Cell snap = BattleMap::cell_at(BattleMap::snap_point(BattleMap::center(c) + mdg::Vec2(0.21f, -0.17f)));
		a["snap"] = Json::array({snap.x, snap.y});
		const Cell step = BattleMap::step_toward(c, BattleMap::center(t) - BattleMap::center(c));
		a["step"] = Json::array({step.x, step.y});
		areas.push_back(a);
	}
	auto mover = mdg::Factory::make_pc("brenna", 1);
	Json reach = Json::array();
	Json paths = Json::array();
	for (int i = 0; i < 6; ++i)
	{
		const Cell s((i * 17 + 6) % w, (i * 7 + 4) % h);
		if (!m.walkable(s))
		{
			reach.push_back(nullptr);
		}
		else
		{
			mover->cell = s;
			mdg::Occupancy occ;
			occ[s] = mover.get();
			const mdg::Reach r = m.reachable(s, 30, mover.get(), occ);
			Json cost_list = Json::array();
			for (const auto& kv : r.cost)
			{
				cost_list.push_back(Json::array({kv.first.x, kv.first.y, kv.second}));
			}
			reach.push_back(cost_list);
		}
		const Cell g((i * 23 + 9) % w, (i * 11 + 7) % h);
		paths.push_back(cells_json(m.find_path(s, g)));
	}
	Json out = Json::object();
	out["w"] = w;
	out["h"] = h;
	out["covers"] = covers;
	out["areas"] = areas;
	out["reach"] = reach;
	out["paths"] = paths;
	return out;
}

std::string godot_array_str(const Json& values)
{
	// str([..]) de GDScript para la clave de las variantes: ["x"] o []
	mdg::StrList parts;
	for (const Json& v : values)
	{
		parts.push_back("\"" + mdg::jto_str(v) + "\"");
	}
	return "[" + mdg::join(parts, ", ") + "]";
}

} // namespace

int main(int argc, char** argv)
{
	const std::string out_path = argc > 1 ? argv[1] : "parity_cpp.json";
	mdg::FolderSource src(MDG_DATA_DIR);
	if (!mdg::RulesDB::load_all(src))
	{
		for (const std::string& e : mdg::RulesDB::errors)
		{
			std::fprintf(stderr, "%s\n", e.c_str());
		}
		return 2;
	}
	using mdg::RulesDB;
	Json out = Json::object();
	out["party"] = Json::object();
	out["monsters"] = Json::object();
	out["synthetic"] = Json::object();
	out["names"] = Json::array();
	out["maps"] = Json::object();
	for (const std::string& pid : mdg::jkeys(RulesDB::party))
	{
		for (int lv : {1, 2, 3})
		{
			out["party"][mdg::format("%s@%d", pid.c_str(), lv)] = summ(*mdg::Factory::make_pc(pid, lv));
		}
	}
	for (const std::string& mid : mdg::jkeys(RulesDB::monsters))
	{
		out["monsters"][mid] = summ(*mdg::Factory::make_monster(mid, 1));
	}
	for (const std::string& cls : mdg::jkeys(RulesDB::classes))
	{
		for (const std::string& sp : mdg::jkeys(RulesDB::species))
		{
			std::vector<Json> variants = {Json::object()};
			const Json& spd = RulesDB::species[sp];
			if (spd.contains("lineages"))
			{
				variants.clear();
				for (const std::string& l : mdg::jkeys(spd["lineages"]))
				{
					variants.push_back(Json{{"lineage", l}});
				}
			}
			if (spd.contains("ancestries"))
			{
				variants.clear();
				for (const std::string& a : mdg::jkeys(spd["ancestries"]))
				{
					variants.push_back(Json{{"ancestry", a}});
				}
			}
			for (const Json& v : variants)
			{
				for (int lv : {1, 2, 3})
				{
					Json sheet = Json{{"name", "Prueba"}, {"class", cls}, {"species", sp}};
					Json vals = Json::array();
					for (auto it = v.begin(); it != v.end(); ++it)
					{
						sheet[it.key()] = it.value();
						vals.push_back(it.value());
					}
					const std::string key = mdg::format("%s|%s|%s@%d", cls.c_str(), sp.c_str(), godot_array_str(vals).c_str(), lv);
					out["synthetic"][key] = summ(*mdg::Factory::make_from_sheet(sheet, lv, "t"));
				}
			}
		}
		for (const std::string& sub : mdg::jkeys(mdg::jobj(RulesDB::classes[cls], "subclasses")))
		{
			Json sheet2 = Json{{"name", "Sub"}, {"class", cls}, {"species", "human"}, {"subclass", sub}};
			out["synthetic"][mdg::format("%s:%s@3", cls.c_str(), sub.c_str())] = summ(*mdg::Factory::make_from_sheet(sheet2, 3, "s"));
		}
	}
	for (const std::string& sp : mdg::jkeys(RulesDB::names))
	{
		for (const char* pr : {"m", "f", "n"})
		{
			for (int i = 0; i < 4; ++i)
			{
				mdg::Pcg32 rng(static_cast<uint64_t>(1000 + i));
				out["names"].push_back(mdg::CharacterSheet::random_name(sp, pr, &rng));
			}
		}
	}
	for (const std::string& eid : mdg::jkeys(RulesDB::encounters))
	{
		out["maps"]["enc:" + eid] = map_dump(mdg::jarr(RulesDB::encounters[eid], "rows"));
	}
	for (const std::string& lid : mdg::jkeys(RulesDB::levels))
	{
		out["maps"]["lvl:" + lid] = map_dump(mdg::jarr(RulesDB::levels[lid], "rows"));
	}
	std::ofstream f(out_path, std::ios::binary);
	f << out.dump();
	std::printf("volcado: %s\n", out_path.c_str());
	return 0;
}
