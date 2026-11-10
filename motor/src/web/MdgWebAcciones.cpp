// Puente web · acciones del jugador en su turno: options, threats, move, undo_move, attack_plan,
// attack, offhand, spell_begin, spell_preview, cast, simple_targets, simple y feature.
// Lo que en la versión de Godot hacía la interfaz (battle_screen.gd y battle_hud.gd) vive aquí.
#include "MdgClassActions.h"
#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgSpells.h"
#include "MdgWebInt.h"

namespace mdg::web
{

namespace
{

/** El personaje del turno, si lo lleva el jugador y puede actuar (si no, nullptr). */
Creature* controlable(Battle& b)
{
	Creature* c = b.current;
	if (c == nullptr || b.over || c->team != 0)
	{
		return nullptr;
	}
	return c->can_act() ? c : nullptr;
}

Json mapa_movimiento(const CellMap<int>& coste, const CellMap<Cell>& previo)
{
	Json out = Json::array();
	for (const auto& kv : coste)
	{
		const Cell& cell = kv.first;
		const Cell* p = previo.find(cell);
		const Cell pc = p != nullptr ? *p : cell;
		out.push_back(Json::array({cell.x, cell.y, kv.second, pc.x, pc.y}));
	}
	return out;
}

Json accion(const char* id, const char* title, const char* cost, const std::string& desc, bool enabled, const char* target)
{
	Json o = Json::object();
	o["id"] = id;
	o["icon"] = id;
	o["title"] = title;
	o["cost"] = cost;
	o["desc"] = desc;
	o["enabled"] = enabled;
	o["target"] = target;
	return o;
}

/** Texto de daño de un perfil: ["1d8+3 cortante", ...]. */
Json texto_dano(const Var& p)
{
	Json out = Json::array();
	const Var dmg = p.get("damage", Var::array());
	if (!dmg.is_array())
	{
		return out;
	}
	for (const Var& d : dmg.arr())
	{
		out.push_back(d.gets("dice") + " " + Loc::dmg_type(d.gets("type")));
	}
	return out;
}

/** ¿Le queda algo útil en el turno? (_nothing_left de battle_screen.gd). */
bool nada_que_hacer(Battle& b, Creature* c)
{
	if (c->turn.action > 0 || c->turn.attack_left > 0)
	{
		return false;
	}
	if (c->turn.movement >= 5 && c->speed() > 0)
	{
		return false;
	}
	if (c->turn.bonus > 0)
	{
		for (const Var& f : b.cls->list(c))
		{
			if (f.getb("enabled") && f.gets("cost_key") == "bonus")
			{
				return false;
			}
		}
		for (const auto& kv : c->items)
		{
			if (kv.second > 0 && Items::kind(kv.first) == "potion")
			{
				return false;
			}
		}
		for (const Var& s : b.spells->available(c))
		{
			if (s.getb("usable") && s.gets("cost") == "bonus")
			{
				return false;
			}
		}
		if (c->turn.offhand_ready)
		{
			return false;
		}
	}
	return true;
}

Json opciones(Battle& b, Creature* c)
{
	Json o = Json::object();
	const Battle::MoveOptions mo = b.move_options(c);
	o["move"] = mapa_movimiento(mo.cost, mo.prev);
	if (c->turn.action > 0 && c->turn.attack_left <= 0)
	{
		o["dash"] = mapa_movimiento(mo.dash_cost, mo.dash_prev);
	}
	else
	{
		o["dash"] = Json::array();
	}
	Json profiles = Json::array();
	for (const Var& p : b.attack_profiles(c))
	{
		Json pj = p.to_json();
		const Var w = p.get("weapon", Var::dict());
		if (c->is_pc && c->has_mastery(w))
		{
			pj["mastery_name"] = Loc::t("mastery." + w.gets("mastery"));
		}
		else
		{
			pj["mastery_name"] = "";
		}
		pj["ammo_left"] = p.gets("kind") == "melee" ? -1 : c->ammo_left(w);
		pj["damage_text"] = texto_dano(p);
		profiles.push_back(pj);
	}
	o["profiles"] = profiles;
	Json spells = Json::array();
	for (const Var& s : b.spells->available(c))
	{
		Json sj = s.to_json();
		const std::string sid = s.gets("id");
		const Json& sp = RulesDB::spell(sid);
		sj["icon"] = RulesDB::spell_icon(sid);
		sj["upcastable"] = jhas(sp, "upcast_dice") || jhas(sp, "upcast_heal") || jhas(sp, "upcast_targets") ||
			jhas(sp, "upcast_darts") || jhas(sp, "upcast_temp") || jhas(sp, "upcast_radius");
		sj["fx"] = jstr(sp, "fx", "");
		spells.push_back(sj);
	}
	o["spells"] = spells;
	Json features = Json::array();
	for (const Var& f : b.cls->list(c))
	{
		features.push_back(f.to_json());
	}
	o["features"] = features;
	const bool act = c->turn.action > 0 && c->turn.attack_left <= 0;
	Json actions = Json::array();
	actions.push_back(accion("dash", "Correr", "Acción", "Ganas movimiento extra igual a tu velocidad.", act, "none"));
	actions.push_back(accion("disengage", "Destrabarse", "Acción", "Te alejas sin provocar ataques de oportunidad.",
		act && !c->turn.disengaged, "none"));
	actions.push_back(accion("dodge", "Esquivar", "Acción", "Hasta tu siguiente turno, los ataques contra ti tienen desventaja.", act, "none"));
	actions.push_back(accion("hide", "Esconderse", "Acción", "Sigilo CD 15 si nadie te ve con claridad.", act && b.can_hide(c), "none"));
	actions.push_back(accion("help", "Ayudar", "Acción", "Distraes a un enemigo adyacente: el siguiente ataque aliado tiene ventaja.", act, "help"));
	actions.push_back(accion("shove", "Empujar / Derribar", "Ataque",
		format("FUE o DES del objetivo contra CD %d: queda derribado.", 8 + c->mod("str") + c->prof_bonus),
		c->turn.action > 0 || c->turn.attack_left > 0, "shove"));
	actions.push_back(accion("stabilize", "Estabilizar", "Acción", "Medicina CD 10 sobre un aliado caído adyacente.", act, "stabilize"));
	o["actions"] = actions;
	Json items = Json::array();
	for (const auto& kv : c->items)
	{
		if (kv.second <= 0)
		{
			continue;
		}
		const Json d = Items::data(kv.first);
		if (jstr(d, "kind", "") != "potion")
		{
			continue;
		}
		Json it = Json::object();
		it["id"] = kv.first;
		it["icon"] = "potion";
		it["title"] = jstr(d, "name", "") + " ×" + std::to_string(kv.second);
		it["cost"] = "Adicional";
		it["desc"] = jstr(d, "desc", "");
		it["enabled"] = c->turn.bonus > 0;
		it["target"] = "potion:" + kv.first;
		items.push_back(it);
	}
	o["items"] = items;
	o["can_undo"] = b.can_undo_move(c);
	o["nothing_left"] = nada_que_hacer(b, c);
	return o;
}

} // namespace

bool grupo_combate_acciones(const std::string& op, const Json& req, Json& out)
{
	(void)req;
	Battle& b = *ctx().battle;
	if (op == "options")
	{
		Creature* c = controlable(b);
		out = c != nullptr ? opciones(b, c) : Json();
		return true;
	}
	return false;
}

} // namespace mdg::web
