#include "MdgBattleSetup.h"

#include "MdgFactory.h"
#include "MdgRulesDB.h"

#include <algorithm>
#include <cstdlib>

namespace mdg
{

const StrList& BattleSetup::party_order()
{
	static const StrList kOrder = {"brenna", "pip", "ilyra", "odvar"};
	return kOrder;
}

const StrList& BattleSetup::precast_ok()
{
	static const StrList kOk = {"mage_armor", "false_life", "longstrider", "barkskin", "magic_weapon", "armor_of_agathys"};
	return kOk;
}

std::unique_ptr<Battle> BattleSetup::build(const std::string& encounter_id, int64_t seed_value, const Json& party_override)
{
	const Json& enc = jobj(RulesDB::encounters, encounter_id);
	BattleMap map;
	map.load_rows(jstrs(enc, "rows"));
	auto battle = std::make_unique<Battle>(std::move(map), seed_value);
	battle->encounter = enc;
	battle->settings["sunlight"] = jstr(enc, "ambient", "") == "day";
	const int level = jint(enc, "level", 1);
	const Json& spawns = jarr(enc, "party_spawn");

	Json party = party_override;
	if (!party.is_array() || party.empty())
	{
		party = Json::array();
		for (const std::string& pid : party_order())
		{
			party.push_back(pid);
		}
	}
	for (size_t i = 0; i < party.size(); ++i)
	{
		const Json& entry = party[i];
		CreaturePtr pc;
		if (entry.is_object())
		{
			const std::string def_id = format("pc%d", static_cast<int>(i));
			pc = Factory::make_from_sheet(entry, level, jhas(entry, "id") ? jstr(entry, "id", def_id) : def_id);
		}
		else
		{
			pc = Factory::make_pc(entry.is_string() ? entry.get<std::string>() : std::string(), level);
		}
		if (i < spawns.size() && spawns[i].is_array() && spawns[i].size() >= 2)
		{
			pc->cell = Cell(static_cast<int>(spawns[i][0].get<double>()), static_cast<int>(spawns[i][1].get<double>()));
		}
		else
		{
			pc->cell = Cell(1, 1 + static_cast<int>(i));
		}
		pc->facing = Vec2(1.0f, 0.0f);
		precast(*battle, *pc);
		battle->add_creature(pc);
	}

	Dict<int> counts;
	for (const Json& e : jarr(enc, "enemies"))
	{
		const std::string mid = jstr(e, "id", "");
		counts[mid] = counts.get(mid, 0) + 1;
		CreaturePtr m = Factory::make_monster(mid, counts[mid]);
		const Json& ec = jarr(e, "cell");
		m->cell = Cell(static_cast<int>(ec.at(0).get<double>()), static_cast<int>(ec.at(1).get<double>()));
		m->facing = Vec2(-1.0f, 0.0f);
		battle->add_creature(m);
	}

	// Numerar nombres repetidos ("Trasgo esbirro 2")
	Dict<int> totals;
	for (const CreaturePtr& c : battle->creatures)
	{
		if (!c->is_pc)
		{
			totals[c->template_id] = totals.get(c->template_id, 0) + 1;
		}
	}
	for (const CreaturePtr& c : battle->creatures)
	{
		if (!c->is_pc && totals.get(c->template_id, 0) > 1)
		{
			const size_t hash_pos = c->id.find('#');
			const std::string num = hash_pos == std::string::npos ? std::string() : c->id.substr(hash_pos + 1);
			c->name = format("%s %d", c->name.c_str(), static_cast<int>(std::strtol(num.c_str(), nullptr, 10)));
		}
	}
	return battle;
}

void BattleSetup::precast(Battle& battle, Creature& pc)
{
	StrList wanted = jstrs(pc.sheet, "precast");
	if (contains(pc.at_will, "mage_armor") && !contains(wanted, "mage_armor"))
	{
		wanted.push_back("mage_armor");
	}
	if (contains(pc.at_will, "false_life") && !contains(wanted, "false_life"))
	{
		wanted.push_back("false_life");
	}
	const StrList known = pc.known_spells();
	for (const std::string& sid : wanted)
	{
		if (!contains(precast_ok(), sid) || !contains(known, sid))
		{
			continue;
		}
		const Json& sp = RulesDB::spell(sid);
		const int lvl = jint(sp, "level", 1);
		if (sid == "mage_armor" && !pc.armor_id.empty())
		{
			continue;
		}
		// Pago: a voluntad, gratis o con el espacio más bajo
		int slot = lvl;
		if (contains(pc.at_will, sid))
		{
			// gratis
		}
		else if (pc.free_casts.get(sid, 0) > 0)
		{
			pc.free_casts[sid] -= 1;
		}
		else if (pc.has_slot(lvl))
		{
			slot = pc.lowest_slot(lvl);
			pc.slots[static_cast<size_t>(slot - 1)] -= 1;
		}
		else
		{
			continue;
		}
		if (sid == "mage_armor" || sid == "longstrider" || sid == "barkskin")
		{
			EffectPtr e = make_effect(sid);
			e->name = jstr(sp, "name", sid);
			e->source = &pc;
			e->positive = true;
			e->owner = &pc;
			pc.effects.push_back(e);
		}
		else if (sid == "magic_weapon")
		{
			EffectPtr mw = make_effect("magic_weapon");
			mw->name = "Arma mágica +1";
			mw->source = &pc;
			mw->positive = true;
			mw->owner = &pc;
			mw->data = vdict({{"bonus", 1}});
			pc.effects.push_back(mw);
		}
		else if (sid == "false_life")
		{
			int amt = 0;
			if (contains(pc.at_will, sid) && pc.has_trait("fiendish_vigor"))
			{
				amt = 12;
			}
			else
			{
				amt = battle.dice.roll("2d4+4").total + 5 * std::max(0, slot - 1);
			}
			pc.temp_hp = std::max(pc.temp_hp, amt);
		}
		else if (sid == "armor_of_agathys")
		{
			const int dmg = 5 * slot;
			pc.temp_hp = std::max(pc.temp_hp, dmg);
			EffectPtr ag = make_effect("agathys");
			ag->name = "Armadura de Agathys";
			ag->source = &pc;
			ag->positive = true;
			ag->owner = &pc;
			ag->data = vdict({{"dmg", dmg}});
			pc.effects.push_back(ag);
		}
	}
}

} // namespace mdg
