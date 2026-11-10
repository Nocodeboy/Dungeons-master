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

/** Camino de la petición: [[x, y], ...]. Como en el publicado, un elemento mal formado lanza. */
std::vector<Cell> camino_de(const Json& req)
{
	const Json v = req.value("path", Json::array());
	std::vector<Cell> out;
	if (!v.is_array())
	{
		return out;
	}
	for (const Json& e : v)
	{
		out.emplace_back(e.at(0).get<int>(), e.at(1).get<int>());
	}
	return out;
}

Json linea(const char* t, const std::string& s)
{
	Json l = Json::object();
	l["t"] = t;
	l["s"] = s;
	return l;
}

std::string razones(const Var& lista)
{
	StrList r;
	if (lista.is_array())
	{
		for (const Var& x : lista.arr())
		{
			r.push_back(Loc::t("reason." + x.str()));
		}
	}
	return join(r, ", ");
}

std::string uno_decimal(double v)
{
	return format("%.1f", v);
}

/** Perfil de ataque para un objetivo (_attack_profile_for de battle_screen.gd). */
Var perfil_para(Battle& b, Creature* c, Creature* t, const std::string& clave)
{
	const std::vector<Var> perfiles = b.attack_profiles(c);
	if (!clave.empty())
	{
		for (const Var& p : perfiles)
		{
			if (p.gets("key") == clave)
			{
				return p;
			}
		}
	}
	const bool adyacente = BattleMap::dist(c->cell, t->cell) <= 1;
	Var mejor;
	double mejor_v = -1.0;
	for (const Var& p : perfiles)
	{
		double v = 0.0;
		if (b.in_attack_range(c, p, t))
		{
			const Var pv = b.preview_attack(c, p, t);
			v = pv.getf("expected") + ((adyacente && p.gets("kind") == "melee") ? 2.0 : 0.0);
			if (p.gets("kind") == "thrown" && adyacente)
			{
				v -= 1.0;
			}
		}
		else if (p.gets("kind") == "melee")
		{
			v = 0.2;
		}
		if (v > mejor_v)
		{
			mejor_v = v;
			mejor = p;
		}
	}
	return mejor;
}

Json plan_ataque(Battle& b, const Json& req)
{
	Creature* c = controlable(b);
	Creature* t = b.get_creature(jstr(req, "target", ""));
	Json o = Json::object();
	o["ok"] = false;
	if (c == nullptr || t == nullptr || t->dead || t->hp <= 0 || t->team == c->team)
	{
		o["reason"] = "Objetivo no válido";
		return o;
	}
	if (c->turn.action <= 0 && c->turn.attack_left <= 0)
	{
		o["reason"] = "Ya has usado tu acción";
		return o;
	}
	const Var p = perfil_para(b, c, t, jstr(req, "key", ""));
	if (p.is_nil())
	{
		o["reason"] = "No tienes con qué atacar";
		return o;
	}
	const Battle::MoveOptions mo = b.move_options(c);
	std::vector<Cell> path;
	if (!b.in_attack_range(c, p, t) || b.cover(c, t) > 2)
	{
		if (p.gets("kind") != "melee")
		{
			o["reason"] = "Fuera de alcance";
			return o;
		}
		bool hay = false;
		Cell mejor;
		int mejor_coste = 99999;
		for (const Cell& n : BattleMap::neighbors(t->cell))
		{
			const int* cn = mo.cost.find(n);
			if (cn == nullptr || BattleMap::dist(n, t->cell) > p.geti("reach"))
			{
				continue;
			}
			const int coste = *cn + static_cast<int>(b.path_threats(c, BattleMap::build_path(mo.prev, c->cell, n)).size()) * 100;
			if (coste < mejor_coste)
			{
				mejor_coste = coste;
				mejor = n;
				hay = true;
			}
		}
		if (!hay)
		{
			o["reason"] = "No llegas este turno";
			return o;
		}
		path = BattleMap::build_path(mo.prev, c->cell, mejor);
	}
	const Cell desde = path.empty() ? c->cell : path.back();
	const Var pv = b.preview_attack(c, p, t, desde, Var::dict());
	Json lines = Json::array();
	lines.push_back(linea("b", p.gets("name") + " → " + t->name));
	lines.push_back(linea("", "Probabilidad de impacto: " + std::to_string(static_cast<int>(std::round(pv.getf("p_hit") * 100.0))) + " %"));
	std::string dano;
	const Var dmg = p.get("damage", Var::array());
	if (dmg.is_array())
	{
		for (const Var& d : dmg.arr())
		{
			dano += d.gets("dice") + " " + Loc::dmg_type(d.gets("type")) + " ";
		}
	}
	lines.push_back(linea("", "Daño: " + dano + "(media " + uno_decimal(pv.getf("avg")) + ")"));
	const int modo = pv.geti("mode");
	if (modo > 0)
	{
		lines.push_back(linea("good", "Ventaja: " + razones(pv.get("adv"))));
	}
	else if (modo < 0)
	{
		lines.push_back(linea("warn", "Desventaja: " + razones(pv.get("dis"))));
	}
	else if (pv.get("adv").size() > 0 && pv.get("dis").size() > 0)
	{
		lines.push_back(linea("dim", "Ventaja y desventaja se anulan"));
	}
	const int cob = pv.geti("cover");
	if (cob == 1)
	{
		lines.push_back(linea("gold", "Cobertura media (+2 CA)"));
	}
	else if (cob == 2)
	{
		lines.push_back(linea("gold", "Cobertura de tres cuartos (+5 CA)"));
	}
	const Var w = p.get("weapon", Var::dict());
	if (c->is_pc && c->has_mastery(w))
	{
		lines.push_back(linea("magic", "Maestría: " + Loc::t("mastery." + w.gets("mastery"))));
	}
	const Var extras = pv.get("extras", Var::array());
	if (extras.is_array())
	{
		for (const Var& ex : extras.arr())
		{
			lines.push_back(linea("magic", ex.str()));
		}
	}
	bool arriesgado = false;
	if (!path.empty())
	{
		const int* cf = mo.cost.find(path.back());
		lines.push_back(linea("dim", "Te moverás " + Loc::ft(cf != nullptr ? *cf : 0) + " antes de atacar."));
		arriesgado = !b.path_threats(c, path).empty();
		if (arriesgado)
		{
			lines.push_back(linea("bad", "¡Provocarás un ataque de oportunidad!"));
		}
	}
	o["ok"] = true;
	o["key"] = p.gets("key");
	o["name"] = p.gets("name");
	o["kind"] = p.gets("kind");
	o["target"] = t->id;
	Json pj = Json::array();
	for (const Cell& x : path)
	{
		pj.push_back(celda_json(x));
	}
	o["path"] = pj;
	o["risky"] = arriesgado;
	o["p_hit"] = pv.getf("p_hit");
	o["lines"] = lines;
	o["button"] = path.empty() ? "Atacar" : "Moverse y atacar";
	Json otros = Json::array();
	for (const Var& x : b.attack_profiles(c))
	{
		if (x.gets("key") == p.gets("key"))
		{
			continue;
		}
		Json e = Json::object();
		e["key"] = x.gets("key");
		e["name"] = x.gets("name");
		otros.push_back(e);
	}
	o["others"] = otros;
	return o;
}

/** Une los eventos pendientes al final de `lista`. */
void anadir_eventos(Battle& b, Json& lista)
{
	for (Json& e : eventos_json(b))
	{
		lista.push_back(std::move(e));
	}
}

Json atacar(Battle& b, const Json& req)
{
	Creature* c = controlable(b);
	Creature* t = b.get_creature(jstr(req, "target", ""));
	Json o = Json::object();
	Json evs = Json::array();
	if (c == nullptr || t == nullptr)
	{
		o["events"] = evs;
		return o;
	}
	const std::string clave = jstr(req, "key", "");
	const std::vector<Cell> path = camino_de(req);
	if (!path.empty())
	{
		b.do_move(c, path, false);
		anadir_eventos(b, evs);
		const Var p = b.profile_by_key(c, clave);
		if (b.over || !c->can_act() || t->dead || t->hp <= 0 || p.is_nil() || !b.in_attack_range(c, p, t))
		{
			o["events"] = evs;
			return o;
		}
	}
	b.do_attack(c, clave, t, Var::dict());
	anadir_eventos(b, evs);
	o["events"] = evs;
	o["offhand"] = Json();
	if (!b.over && c->turn.offhand_ready && c->turn.bonus > 0 && !t->dead && t->hp > 0)
	{
		Var off;
		const std::string usada = c->turn.last_weapon;
		for (const Var& p : b.attack_profiles(c))
		{
			if (p.gets("kind") == "melee" && p.get("props", Var::array()).contains(Var("light")) &&
				p.get("weapon", Var::dict()).gets("id") != usada)
			{
				off = p;
			}
		}
		if (!off.is_nil())
		{
			Json x = Json::object();
			x["key"] = off.gets("key");
			x["name"] = off.gets("name");
			x["target"] = t->id;
			x["target_name"] = t->name;
			o["offhand"] = x;
		}
	}
	return o;
}

/** Datos de lanzamiento a partir de la petición (targets, point ajustado, dir, cell...). */
Var datos_conjuro(const Json& req)
{
	Var data = Var::dict();
	Var targets = Var::array();
	const Json tl = req.value("targets", Json::array());
	if (tl.is_array())
	{
		for (const Json& x : tl)
		{
			targets.push(Var(x.get<std::string>()));
		}
	}
	data["targets"] = targets;
	if (jhas(req, "point"))
	{
		const Json& pt = req["point"];
		data["point"] = BattleMap::snap_point(Vec2(pt.at(0).get<float>(), pt.at(1).get<float>()));
	}
	if (jhas(req, "dir"))
	{
		const Json& d = req["dir"];
		data["dir"] = Vec2(d.at(0).get<float>(), d.at(1).get<float>());
	}
	if (jhas(req, "cell"))
	{
		const Json& d = req["cell"];
		data["cell"] = Cell(d.at(0).get<int>(), d.at(1).get<int>());
	}
	const std::string sid = jstr(req, "spell", "");
	if (sid == "command")
	{
		data["cmd"] = "grovel";
	}
	if (sid == "spiritual_weapon")
	{
		data["targets"] = Var::array();
	}
	return data;
}

Json empezar_conjuro(Battle& b, const Json& req)
{
	Creature* c = controlable(b);
	Json o = Json::object();
	if (c == nullptr)
	{
		return o;
	}
	const std::string sid = jstr(req, "spell", "");
	const int slot = jint(req, "slot", 0);
	const Json& sp = RulesDB::spell(sid);
	o["name"] = jstr(sp, "name", sid);
	const std::string target = jstr(sp, "target", "creature");
	o["target"] = target;
	o["area"] = jhas(sp, "area");
	o["max"] = b.spells->max_targets(sp, slot, "");
	o["n"] = b.spells->n_darts(c, sp, slot);
	const int alcance = b.spells->spell_cells(sp, c, "");
	o["range"] = alcance;
	Json valid = Json::array();
	for (const Creature* x : b.spells->valid_targets(c, sid))
	{
		valid.push_back(x->id);
	}
	o["valid"] = valid;
	Json cells = Json::array();
	const bool casilla = target == "cell";
	for (int y = c->cell.y - alcance; y <= c->cell.y + alcance; ++y)
	{
		for (int x = c->cell.x - alcance; x <= c->cell.x + alcance; ++x)
		{
			const Cell cell(x, y);
			if (x < 0 || y < 0 || x >= b.map.width || y >= b.map.height)
			{
				continue;
			}
			if (BattleMap::dist(cell, c->cell) > alcance)
			{
				continue;
			}
			if (casilla && (!b.map.tile_info(cell).walk || b.creature_at(cell) != nullptr))
			{
				continue;
			}
			if (b.map.cover_between(c->cell, cell) > 2)
			{
				continue;
			}
			cells.push_back(celda_json(cell));
		}
	}
	o["cells"] = cells;
	return o;
}

Json vista_conjuro(Battle& b, const Json& req)
{
	Creature* c = controlable(b);
	Json o = Json::object();
	if (c == nullptr)
	{
		o["can"] = false;
		return o;
	}
	const std::string sid = jstr(req, "spell", "");
	const int slot = jint(req, "slot", 0);
	Var data = datos_conjuro(req);
	const Json& sp = RulesDB::spell(sid);
	Json lines = Json::array();
	lines.push_back(linea("b", jstr(sp, "name", sid)));
	const bool area = jhas(req, "point") || jhas(req, "dir") || (jstr(sp, "target", "") == "self" && jhas(sp, "area"));
	if (area)
	{
		if (data.has("point") && !b.spells->point_in_range(c, sid, data.get("point").vec2()))
		{
			o["ok"] = false;
			o["reason"] = "Fuera de alcance";
			return o;
		}
		if (data.has("point"))
		{
			o["point"] = data.get("point").to_json();
		}
		const std::vector<Cell> cells = b.spells->area_cells(c, sid, data, std::nullopt, -1);
		const Var pv = b.spells->preview(c, sid, slot, data);
		int aliados = 0;
		int enemigos = 0;
		Json aliados_hit = Json::array();
		const Var afectados = pv.get("affected", Var::array());
		if (afectados.is_array())
		{
			for (const Var& a : afectados.arr())
			{
				if (a.geti("team") == c->team)
				{
					aliados += 1;
					aliados_hit.push_back(a.gets("id"));
				}
				else
				{
					enemigos += 1;
				}
			}
		}
		Json area_j = Json::array();
		for (const Cell& x : cells)
		{
			area_j.push_back(celda_json(x));
		}
		o["area"] = area_j;
		o["allies_hit"] = aliados_hit;
		lines.push_back(linea("", "Enemigos en el área: " + std::to_string(enemigos)));
		if (pv.getf("enemy_dmg") > 0.0)
		{
			lines.push_back(linea("", "Daño esperado total: " + uno_decimal(pv.getf("enemy_dmg"))));
		}
		if (aliados > 0)
		{
			lines.push_back(linea("bad", "¡Cuidado! Alcanza a " + std::to_string(aliados) + " aliado(s)."));
		}
		o["can"] = enemigos > 0 || aliados > 0;
		lines.push_back(linea("dim", jstr(sp, "desc", "")));
		o["ok"] = true;
		o["lines"] = lines;
		return o;
	}
	const Var pv = b.spells->preview(c, sid, slot, data);
	const Var targets = data.get("targets", Var::array());
	if (targets.size() > 0)
	{
		Creature* t = b.get_creature(targets.at(0).str());
		if (t != nullptr && jhas(sp, "attack"))
		{
			const Var mi = b.attack_mode(c, t, jstr(sp, "attack", ""));
			const int ac = b.target_ac(t, c);
			const double p = Dice::p_success(c->spell_attack_bonus(sid), ac, mi.geti("mode"), 20, true);
			lines.push_back(linea("", "Probabilidad de impacto: " + std::to_string(static_cast<int>(std::round(p * 100.0))) + " %"));
			if (mi.geti("mode") < 0)
			{
				lines.push_back(linea("warn", "Desventaja: " + razones(mi.get("dis"))));
			}
			else if (mi.geti("mode") > 0)
			{
				lines.push_back(linea("good", "Ventaja: " + razones(mi.get("adv"))));
			}
		}
		else if (t != nullptr && jhas(sp, "save"))
		{
			const int dc = b.spells->save_dc(c, sid);
			const std::string ab = jstr(jobj(sp, "save"), "ability", "dex");
			const double p = Dice::p_success(t->save_bonus(ab), dc, 0, 21, false);
			lines.push_back(linea("", "Salvación de " + Loc::ability(ab) + format(" CD %d: falla el ", dc) +
				std::to_string(static_cast<int>(std::round((1.0 - p) * 100.0))) + " %"));
		}
	}
	if (pv.getf("enemy_dmg") > 0.0)
	{
		lines.push_back(linea("", "Daño esperado: " + uno_decimal(pv.getf("enemy_dmg"))));
	}
	if (pv.getf("heal") > 0.0)
	{
		lines.push_back(linea("", "Curación media: " + uno_decimal(pv.getf("heal"))));
	}
	o["can"] = true;
	lines.push_back(linea("dim", jstr(sp, "desc", "")));
	o["ok"] = true;
	o["lines"] = lines;
	return o;
}

/** ¿Vale `o` como objetivo de la acción simple `what`? (_simple_valid de battle_screen.gd). */
bool objetivo_simple(Battle& b, Creature* c, const std::string& what, Creature* o)
{
	const int d = BattleMap::dist(c->cell, o->cell);
	if (what.rfind("feat:", 0) == 0)
	{
		for (Creature* x : b.cls->valid_targets(c, what.substr(5)))
		{
			if (x == o)
			{
				return true;
			}
		}
		return false;
	}
	if (what.rfind("potion:", 0) == 0)
	{
		const bool cura = jhas(jobj(Items::data(what.substr(7)), "use"), "heal");
		return o->team == c->team && !o->dead && d <= 1 && (o->hp < o->max_hp || !cura);
	}
	if (what == "help" || what == "shove")
	{
		return o->team != c->team && !o->dead && o->hp > 0 && d <= 1;
	}
	if (what == "stabilize")
	{
		return o->team == c->team && !o->dead && o->hp <= 0 && !o->stable && d <= 1;
	}
	return false;
}

Json accion_simple(Battle& b, const Json& req)
{
	Creature* c = controlable(b);
	Json o = Json::object();
	o["ok"] = false;
	if (c == nullptr)
	{
		o["events"] = Json::array();
		return o;
	}
	const std::string what = jstr(req, "what", "");
	Creature* t = b.get_creature(jstr(req, "target", ""));
	bool ok = false;
	if (what == "dash")
	{
		ok = b.do_dash(c, false);
	}
	else if (what == "hide")
	{
		ok = b.do_hide(c, false);
	}
	else if (what == "dodge")
	{
		ok = b.do_dodge(c);
	}
	else if (what == "disengage")
	{
		ok = b.do_disengage(c, false);
	}
	else if (t != nullptr && objetivo_simple(b, c, what, t))
	{
		if (what.rfind("feat:", 0) == 0)
		{
			ok = b.cls->use(c, what.substr(5), vdict({{"target", t->id}}));
		}
		else if (what.rfind("potion:", 0) == 0)
		{
			ok = b.do_item(c, t, what.substr(7));
		}
		else if (what == "help")
		{
			ok = b.do_help(c, t);
		}
		else if (what == "shove")
		{
			ok = b.do_shove(c, t, true);
		}
		else if (what == "stabilize")
		{
			ok = b.do_stabilize(c, t);
		}
	}
	o["ok"] = ok;
	o["events"] = eventos_json(b);
	return o;
}

Json usar_rasgo(Battle& b, const Json& req)
{
	Creature* c = controlable(b);
	Json o = Json::object();
	if (c == nullptr)
	{
		o["events"] = Json::array();
		return o;
	}
	Var data = Var::dict();
	if (jhas(req, "choice"))
	{
		data["choice"] = req["choice"].get<std::string>();
	}
	if (jhas(req, "point"))
	{
		const Json& pt = req["point"];
		data["point"] = Vec2(pt.at(0).get<float>(), pt.at(1).get<float>());
	}
	if (jhas(req, "dir"))
	{
		const Json& d = req["dir"];
		data["dir"] = Vec2(d.at(0).get<float>(), d.at(1).get<float>());
	}
	if (jhas(req, "cell"))
	{
		const Json& d = req["cell"];
		data["cell"] = Cell(d.at(0).get<int>(), d.at(1).get<int>());
	}
	o["ok"] = b.cls->use(c, jstr(req, "id", ""), data);
	o["events"] = eventos_json(b);
	return o;
}

} // namespace

bool grupo_combate_acciones(const std::string& op, const Json& req, Json& out)
{
	Battle& b = *ctx().battle;
	if (op == "options")
	{
		Creature* c = controlable(b);
		out = c != nullptr ? opciones(b, c) : Json();
		return true;
	}
	if (op == "threats")
	{
		Creature* c = controlable(b);
		out = Json::array();
		if (c != nullptr)
		{
			for (const auto& th : b.path_threats(c, camino_de(req)))
			{
				out.push_back(th.first->name);
			}
		}
		return true;
	}
	if (op == "move")
	{
		Creature* c = controlable(b);
		if (c != nullptr)
		{
			const std::vector<Cell> path = camino_de(req);
			b.do_move(c, path, req.value("dash", false));
		}
		out = Json::object();
		out["events"] = eventos_json(b);
		return true;
	}
	if (op == "undo_move")
	{
		Creature* c = controlable(b);
		if (c != nullptr && b.can_undo_move(c))
		{
			b.undo_move(c);
		}
		out = Json::object();
		out["events"] = eventos_json(b);
		return true;
	}
	if (op == "attack_plan")
	{
		out = plan_ataque(b, req);
		return true;
	}
	if (op == "attack")
	{
		out = atacar(b, req);
		return true;
	}
	if (op == "offhand")
	{
		Creature* c = controlable(b);
		Creature* t = b.get_creature(jstr(req, "target", ""));
		if (c != nullptr && t != nullptr)
		{
			b.do_attack(c, jstr(req, "key", ""), t, vdict({{"offhand", true}}));
		}
		out = Json::object();
		out["events"] = eventos_json(b);
		return true;
	}
	if (op == "spell_begin")
	{
		out = empezar_conjuro(b, req);
		return true;
	}
	if (op == "spell_preview")
	{
		out = vista_conjuro(b, req);
		return true;
	}
	if (op == "cast")
	{
		Creature* c = controlable(b);
		out = Json::object();
		if (c == nullptr)
		{
			out["events"] = Json::array();
			return true;
		}
		const std::string sid = jstr(req, "spell", "");
		const int slot = jint(req, "slot", 0);
		const Var data = datos_conjuro(req);
		out["ok"] = b.spells->cast(c, sid, slot, data);
		out["events"] = eventos_json(b);
		return true;
	}
	if (op == "simple_targets")
	{
		Creature* c = controlable(b);
		out = Json::array();
		if (c != nullptr)
		{
			const std::string what = jstr(req, "what", "");
			for (const CreaturePtr& o : b.creatures)
			{
				if (!o->dead && objetivo_simple(b, c, what, o.get()))
				{
					out.push_back(o->id);
				}
			}
		}
		return true;
	}
	if (op == "simple")
	{
		out = accion_simple(b, req);
		return true;
	}
	if (op == "feature")
	{
		out = usar_rasgo(b, req);
		return true;
	}
	return false;
}

} // namespace mdg::web
