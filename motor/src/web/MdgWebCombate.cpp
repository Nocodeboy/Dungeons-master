// Puente web · combate: init y las operaciones del combate en curso (state, options, move,
// attack, cast, feature, ai_turn, end_turn...). El combate y su IA viven en el módulo entre
// llamadas (ctx()); cada acción devuelve los eventos que ha generado para que la vista los
// reproduzca.
#include "MdgBattleSetup.h"
#include "MdgCampana.h"
#include "MdgItems.h"
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

namespace
{

/**
 * Conjuros de larga duración antes del combate (precast de battle_setup.gd con campaña): los que
 * siguen activos de un combate anterior no se vuelven a pagar y los nuevos quedan apuntados.
 */
void precast_campana(Battle& battle, Creature& pc, Json& cp)
{
	const bool con_estado = jobj(cp, "state").contains(pc.id);
	const StrList activos = con_estado ? jstrs(cp["state"][pc.id], "buffs") : StrList();
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
		if (!contains(BattleSetup::precast_ok(), sid) || !contains(known, sid))
		{
			continue;
		}
		const Json& sp = RulesDB::spell(sid);
		const int lvl = jint(sp, "level", 1);
		if (sid == "mage_armor" && !pc.armor_id.empty())
		{
			continue;
		}
		int slot = lvl;
		if (contains(activos, sid))
		{
			if (sid == "false_life" || sid == "armor_of_agathys")
			{
				continue;
			}
		}
		else if (contains(pc.at_will, sid))
		{
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
		if (con_estado && !contains(activos, sid))
		{
			Json bl = cp["state"][pc.id].value("buffs", Json::array());
			bl.push_back(sid);
			cp["state"][pc.id]["buffs"] = bl;
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

Cell celda_de(const Json& v, const Cell& def)
{
	if (v.is_array() && v.size() >= 2)
	{
		return Cell(jto_int(v[0]), jto_int(v[1]));
	}
	return def;
}

/** battle_start: combate en el mapa de exploración con el grupo de la campaña. */
Json empezar_en_mapa(const Json& req)
{
	const Json& raw = jat(req, "cp");
	if (!raw.is_object())
	{
		return error_json("Falta el documento de campaña (cp).");
	}
	Json cp = raw;
	campana::normalizar(cp);
	const StrList rows = jstrs(req, "rows");
	if (rows.empty())
	{
		return error_json("Faltan las filas del mapa (rows).");
	}
	BattleMap map;
	map.load_rows(rows);
	int64_t seed = -1;
	const Json& s = jat(req, "seed");
	if (s.is_number())
	{
		seed = s.get<int64_t>();
	}
	ctx().ai.reset();
	auto battle = std::make_unique<Battle>(std::move(map), seed);
	Json enc = jobj(req, "encounter");
	if (!jhas(enc, "id"))
	{
		enc["id"] = jstr(req, "group", "combate");
	}
	if (!jhas(enc, "name"))
	{
		enc["name"] = "¡Combate!";
	}
	enc["level"] = campana::nivel(cp);
	battle->encounter = enc;
	battle->settings["sunlight"] = jhas(enc, "sunlight") ? jbool(enc, "sunlight", false) : jstr(enc, "ambient", "") == "day";
	Json party = req.value("party", Json::array());
	if (!party.is_array() || party.empty())
	{
		party = Json::array();
		for (const std::string& id : jstrs(cp, "party"))
		{
			Json e = Json::object();
			e["id"] = id;
			party.push_back(e);
		}
	}
	const Json& hidden = jobj(req, "hidden");
	int pcs = 0;
	int indice = -1;
	for (const Json& e : party)
	{
		indice += 1;
		const std::string id = e.is_string() ? e.get<std::string>() : jstr(e, "id", "");
		if (!campana::es_miembro(cp, id) || campana::muerto(cp, id))
		{
			continue;
		}
		CreaturePtr pc = campana::criatura(cp, id, -1);
		pc->cell = celda_de(jat(e, "cell"), Cell(1, 1 + indice));
		pc->facing = Vec2(1.0f, 0.0f);
		precast_campana(*battle, *pc, cp);
		if (hidden.contains(id))
		{
			battle->start_hidden[id] = jto_int(hidden[id], 0);
		}
		battle->add_creature(pc);
		pcs += 1;
	}
	Dict<int> counts;
	for (const Json& e : jarr(req, "enemies"))
	{
		std::string mid = jstr(e, "monster", "");
		if (mid.empty())
		{
			mid = jstr(e, "id", "");
		}
		if (!RulesDB::monsters.contains(mid))
		{
			continue;
		}
		counts[mid] = counts.get(mid, 0) + 1;
		CreaturePtr m = Factory::make_monster(mid, counts[mid]);
		const std::string eid = jstr(e, "id", "");
		if (!eid.empty() && jhas(e, "monster"))
		{
			m->id = eid;
		}
		m->cell = celda_de(jat(e, "cell"), m->cell);
		m->facing = Vec2(-1.0f, 0.0f);
		if (jbool(e, "surprised", false))
		{
			battle->surprised[m->id] = true;
		}
		battle->add_creature(m);
	}
	Dict<int> totals;
	for (const CreaturePtr& c : battle->creatures)
	{
		if (!c->is_pc)
		{
			totals[c->template_id] = totals.get(c->template_id, 0) + 1;
		}
	}
	Dict<int> vistos;
	for (const CreaturePtr& c : battle->creatures)
	{
		if (!c->is_pc && totals.get(c->template_id, 0) > 1)
		{
			vistos[c->template_id] = vistos.get(c->template_id, 0) + 1;
			c->name = format("%s %d", c->name.c_str(), vistos[c->template_id]);
		}
	}
	for (const std::string& id : jstrs(req, "surprised"))
	{
		battle->surprised[id] = true;
	}
	if (pcs == 0)
	{
		ctx().battle.reset();
		return error_json("No hay nadie del grupo en condiciones de luchar.");
	}
	Json out = arrancar(std::move(battle));
	out["cp"] = cp;
	return out;
}

/** battle_end: guarda en la campaña cómo han quedado los PJ y hace el recuento (bajas, botín). */
Json terminar(const Json& req)
{
	Contexto& cx = ctx();
	if (!cx.battle)
	{
		return error_json("No hay combate en curso.");
	}
	const Json& raw = jat(req, "cp");
	if (!raw.is_object())
	{
		return error_json("Falta el documento de campaña (cp).");
	}
	Json cp = raw;
	campana::normalizar(cp);
	Battle& b = *cx.battle;
	const bool won = jhas(req, "won") ? jbool(req, "won", false) : b.winner == 0;
	for (const CreaturePtr& c : b.creatures)
	{
		if (c->is_pc && campana::es_miembro(cp, c->id))
		{
			if (won && !c->dead && c->hp <= 0)
			{
				c->hp = 1;
			}
			campana::capturar(cp, *c);
			Json& st = cp["state"][c->id];
			st["buffs"] = st.value("buffs", Json::array());
		}
	}
	Json dead = Json::array();
	Json survivors = Json::array();
	Json enemies_dead = Json::array();
	Json enemies_alive = Json::array();
	Json loot = Json::array();
	int xp = 0;
	Pcg32 local;
	Pcg32& rng = rng_de(req, local);
	auto anadir_botin = [&](const std::string& id, int n, bool unid) {
		for (Json& l : loot)
		{
			if (jstr(l, "id", "") == id && jbool(l, "unid", false) == unid)
			{
				l["n"] = jint(l, "n", 0) + n;
				return;
			}
		}
		Json l = Json::object();
		l["id"] = id;
		l["n"] = n;
		l["unid"] = unid;
		l["name"] = id == "gold" ? std::string("Oro") : Items::name_of(id, unid);
		loot.push_back(l);
	};
	for (const CreaturePtr& c : b.creatures)
	{
		if (c->is_pc)
		{
			(c->dead ? dead : survivors).push_back(c->id);
			continue;
		}
		const bool caido = c->dead || c->hp <= 0;
		(caido ? enemies_dead : enemies_alive).push_back(c->id);
		if (!caido)
		{
			continue;
		}
		xp += c->xp;
		const Json md = RulesDB::monster_data(c->template_id);
		for (const Json& d : jarr(md, "drops"))
		{
			const float x = rng.randf();
			const double chance = jnum(d, "chance", 1.0);
			if (!(static_cast<float>(chance) >= x))
			{
				continue;
			}
			const Json& nv = jat(d, "n");
			const int n = nv.is_string() ? Dice::roll_with(nv.get<std::string>(), rng) : jint(d, "n", 1);
			if (n > 0)
			{
				anadir_botin(jstr(d, "id", ""), n, false);
			}
		}
	}
	for (const Json& l : jarr(req, "loot"))
	{
		if (l.is_array() && !l.empty())
		{
			anadir_botin(jto_str(l[0]), l.size() > 1 ? jto_int(l[1], 1) : 1, false);
		}
		else
		{
			// Como en el publicado, una entrada que no es lista se lee como objeto (una cadena da id "")
			anadir_botin(jstr(l, "id", ""), jint(l, "n", 1), jbool(l, "unid", false));
		}
	}
	Json out = Json::object();
	out["cp"] = cp;
	out["won"] = won;
	out["dead"] = dead;
	out["survivors"] = survivors;
	out["hero_dead"] = campana::muerto(cp, "hero");
	out["xp"] = xp;
	out["loot"] = loot;
	out["enemies_dead"] = enemies_dead;
	out["enemies_alive"] = enemies_alive;
	out["rounds"] = b.round_num;
	Json captured = Json::object();
	for (const Json& id : survivors)
	{
		captured[id.get<std::string>()] = jobj(jobj(cp, "state"), id.get<std::string>());
	}
	out["captured"] = captured;
	cx.ai.reset();
	cx.battle.reset();
	return out;
}

} // namespace

bool grupo_inicio_combate(const std::string& op, const Json& req, Json& out)
{
	if (op == "battle_start")
	{
		out = empezar_en_mapa(req);
		return true;
	}
	if (op == "battle_end")
	{
		out = terminar(req);
		return true;
	}
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
