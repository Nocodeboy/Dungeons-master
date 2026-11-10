// Puente web · combate: init y las operaciones del combate en curso (state, options, move,
// attack, cast, feature, ai_turn, end_turn...). El combate y su IA viven en el módulo entre
// llamadas (ctx()); cada acción devuelve los eventos que ha generado para que la vista los
// reproduzca.
#include "MdgBattleSetup.h"
#include "MdgRulesDB.h"
#include "MdgWebInt.h"

namespace mdg::web
{

bool grupo_combate_acciones(const std::string& op, const Json& req, Json& out);

Json criatura_json(const Creature& c)
{
	Json o = Json::object();
	o["id"] = c.id;
	o["name"] = c.name;
	o["template"] = c.template_id;
	o["team"] = c.team;
	o["is_pc"] = c.is_pc;
	o["cls"] = c.cls;
	o["level"] = c.level;
	o["size"] = c.size;
	o["ctype"] = c.ctype;
	o["cell"] = celda_json(c.cell);
	o["hp"] = c.hp;
	o["max_hp"] = c.max_hp;
	o["temp_hp"] = c.temp_hp;
	o["ac"] = c.ac();
	o["speed"] = c.speed();
	o["dead"] = c.dead;
	o["down"] = !c.dead && c.hp <= 0;
	o["stable"] = c.stable;
	o["death_successes"] = c.death_successes;
	o["death_failures"] = c.death_failures;
	o["hidden"] = c.has_effect("hidden");
	o["can_act"] = c.can_act();
	o["conditions"] = to_json(c.active_condition_list());
	Json efs = Json::array();
	for (const EffectPtr& e : c.effects)
	{
		if (e->name.empty())
		{
			continue;
		}
		Json x = Json::object();
		x["kind"] = e->kind;
		x["name"] = e->name;
		x["positive"] = e->positive;
		x["rounds"] = e->rounds_left;
		efs.push_back(x);
	}
	o["effects"] = efs;
	o["concentration"] = c.concentration_spell;
	o["slots"] = to_json(c.slots);
	o["slots_max"] = to_json(c.slots_max);
	Json t = Json::object();
	t["action"] = c.turn.action;
	t["bonus"] = c.turn.bonus;
	t["reaction"] = c.turn.reaction;
	t["movement"] = c.turn.movement;
	t["attack_left"] = c.turn.attack_left;
	t["offhand_ready"] = c.turn.offhand_ready;
	t["disengaged"] = c.turn.disengaged;
	t["moved"] = c.turn.moved;
	o["turn"] = t;
	return o;
}

Json estado_json(Battle& b, bool completo)
{
	Json o = Json::object();
	o["round"] = b.round_num;
	o["current"] = b.current != nullptr ? b.current->id : std::string();
	o["over"] = b.over;
	o["winner"] = b.winner;
	Json order = Json::array();
	for (const Creature* c : b.order)
	{
		order.push_back(c->id);
	}
	o["order"] = order;
	Json cs = Json::array();
	for (const CreaturePtr& c : b.creatures)
	{
		cs.push_back(criatura_json(*c));
	}
	o["creatures"] = cs;
	o["tokens"] = b.tokens.to_json();
	Json zs = Json::array();
	for (const Var& z : b.zones)
	{
		zs.push_back(z.to_json());
	}
	o["zones"] = zs;
	if (!completo)
	{
		return o;
	}
	Json map = Json::object();
	map["w"] = b.map.width;
	map["h"] = b.map.height;
	map["rows"] = to_json(b.map.rows);
	o["map"] = map;
	Json enc = Json::object();
	enc["id"] = jstr(b.encounter, "id", "");
	enc["name"] = jstr(b.encounter, "name", "");
	enc["place"] = jstr(b.encounter, "place", "");
	enc["intro"] = b.encounter.value("intro", Json::array());
	enc["outro"] = b.encounter.value("outro", Json());
	enc["tips"] = b.encounter.value("tips", Json());
	o["encounter"] = enc;
	return o;
}

namespace
{

/** Pone en marcha un combate nuevo (sustituye al anterior) y devuelve {state, events}. */
Json arrancar(std::unique_ptr<Battle> battle)
{
	Contexto& cx = ctx();
	cx.battle = std::move(battle);
	if (!cx.battle)
	{
		return error_json("encuentro");
	}
	cx.ai.reset();
	cx.ai = std::make_unique<AIBrain>(*cx.battle);
	cx.battle->start();
	Json out = Json::object();
	out["state"] = estado_json(*cx.battle, true);
	out["events"] = eventos_json(*cx.battle);
	return out;
}

Json solo_eventos(Battle& b)
{
	Json out = Json::object();
	out["events"] = eventos_json(b);
	return out;
}

} // namespace

Json arrancar_combate(std::unique_ptr<Battle> battle)
{
	return arrancar(std::move(battle));
}

bool grupo_inicio_combate(const std::string& op, const Json& req, Json& out)
{
	if (op == "init")
	{
		const std::string enc = jstr(req, "encounter", "e1_prado");
		if (!RulesDB::encounters.contains(enc))
		{
			out = error_json("No existe el encuentro: " + enc);
			return true;
		}
		ctx().ai.reset();
		int64_t seed = -1;
		const Json& s = jat(req, "seed");
		if (s.is_number())
		{
			seed = s.get<int64_t>();
		}
		const Json party = req.value("party", Json::array());
		out = arrancar(BattleSetup::build(enc, seed, party, jint(req, "level", -1)));
		return true;
	}
	return false;
}

bool grupo_combate(const std::string& op, const Json& req, Json& out)
{
	Contexto& cx = ctx();
	Battle& b = *cx.battle;
	if (op == "state")
	{
		out = estado_json(b, false);
		return true;
	}
	if (op == "ai_turn")
	{
		Creature* c = b.current;
		if (c != nullptr && !b.over && !c->dead && c->hp > 0)
		{
			cx.ai->take_turn(c);
		}
		out = solo_eventos(b);
		return true;
	}
	if (op == "end_turn")
	{
		b.end_turn();
		out = solo_eventos(b);
		return true;
	}
	return grupo_combate_acciones(op, req, out);
}

} // namespace mdg::web
