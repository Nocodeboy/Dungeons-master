#include "MdgAI.h"

#include "MdgClassActions.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgSort.h"
#include "MdgSpells.h"

#include <cstdio>
#include <limits>

namespace mdg
{

namespace ai_detail
{

constexpr double kInf = std::numeric_limits<double>::infinity();

bool in_list(const std::string& x, std::initializer_list<const char*> items)
{
	for (const char* s : items)
	{
		if (x == s)
		{
			return true;
		}
	}
	return false;
}

std::vector<Cell> var_cells(const Var& v)
{
	std::vector<Cell> out;
	for (const Var& e : v.arr())
	{
		out.push_back(e.cell());
	}
	return out;
}

Var cells_var(const std::vector<Cell>& cells)
{
	Var out = Var::array();
	for (const Cell& c : cells)
	{
		out.push(Var(c));
	}
	return out;
}

std::vector<Creature*> active_only(const std::vector<Creature*>& v)
{
	return filter(v, [](Creature* e) { return e->is_active(); });
}

} // namespace ai_detail

// ================================================================== turno completo

void AIBrain::take_turn(Creature* c)
{
	if (!c->is_active())
	{
		return;
	}
	// Expulsado: solo huye
	if (c->has_effect("turned"))
	{
		flee_from(c, b.get_creature(c->get_effect("turned")->data.get("from", "").str()));
		return;
	}
	if (!c->can_act())
	{
		return;
	}
	// Sugestionado: se aparta del combate
	EffectPtr sug = c->get_effect("suggested");
	if (sug)
	{
		flee_from(c, sug->source);
		if (c->turn.action > 0)
		{
			b.do_dodge(c);
		}
		return;
	}
	if (c->has_condition("prone") && c->speed() > 0 && !c->has_effect("laughing"))
	{
		stand_up(c);
	}
	int guard = 0;
	while (guard < 10 && c->can_act() && !b.over)
	{
		guard += 1;
		if (!step(c))
		{
			break;
		}
	}
	// Usa el movimiento sobrante para colocarse mejor
	if (c->is_active() && c->turn.movement >= 5 && !b.over)
	{
		reposition(c);
	}
}

void AIBrain::stand_up(Creature* c)
{
	if (!c->has_condition("prone"))
	{
		return;
	}
	const int cost = c->speed() / 2;
	if (c->turn.movement >= cost)
	{
		c->turn.movement -= cost;
		b.remove_condition(c, "prone");
		b.emit(vdict({{"t", "stand"}, {"who", c->id}}));
		b.log_msg(Loc::t("log.stand_up", vdict({{"who", Battle::nm(c)}})));
	}
}

bool AIBrain::step(Creature* c)
{
	// 1) Acciones adicionales prioritarias antes de moverse
	if (pre_bonus(c))
	{
		return true;
	}
	// 2) Acción principal (con posible movimiento previo)
	const bool has_main = c->turn.action > 0 || c->turn.attack_left > 0;
	if (has_main)
	{
		const Var plan = best_plan(c);
		if (!plan.is_empty() && plan.getf("score") > 0.05)
		{
			execute(c, plan);
			return true;
		}
	}
	// 3) Acciones adicionales posteriores
	if (post_bonus(c))
	{
		return true;
	}
	return false;
}

// ================================================================== evaluación

bool AIBrain::ranged_minded(const Creature* c) const
{
	return ai_detail::in_list(profile(c), {"archer", "caster", "skirmisher_pc", "healer", "support", "archer_pc"}) && c->form.empty();
}

double AIBrain::risk_weight(const Creature* c) const
{
	if (!c->form.empty())
	{
		return 0.2;
	}
	const std::string p = profile(c);
	if (ai_detail::in_list(p, {"archer", "caster", "skirmisher_pc", "healer", "support", "archer_pc"}))
	{
		return 0.9;
	}
	if (p == "skirmisher")
	{
		return 0.45;
	}
	if (p == "skirmisher_melee")
	{
		return 0.3;
	}
	if (p == "boss" || p == "brute" || p == "pack")
	{
		return 0.15;
	}
	if (p == "frontline")
	{
		return 0.12;
	}
	return 0.4;
}

void AIBrain::begin_plan()
{
	enemy_summary_.clear();
	tv_cache_.clear();
	threat_cache_.clear();
}

const std::vector<AIBrain::Summary>& AIBrain::summary(Creature* e)
{
	auto it = enemy_summary_.find(e->id);
	if (it != enemy_summary_.end())
	{
		return it->second;
	}
	std::vector<Summary> out;
	for (const Var& p : b.attack_profiles(e))
	{
		double avg = 0.0;
		for (const Var& dd : p.get("damage").arr())
		{
			avg += Dice::average(dd.get("dice").as_str());
		}
		Summary s;
		s.melee = p.gets("kind") == "melee";
		s.reach = p.geti("reach");
		s.rmin = p.get("range").at(0).to_int();
		s.rmax = p.get("range").at(1).to_int();
		s.avg = avg;
		s.bonus = p.geti("bonus");
		s.mult = static_cast<double>(b.attacks_per_action(e));
		out.push_back(s);
	}
	bool any_ranged = false;
	for (const Summary& s : out)
	{
		if (!s.melee)
		{
			any_ranged = true;
		}
	}
	if (!e->casting_ability.empty() && e->form.empty() && !any_ranged)
	{
		Summary s;
		s.melee = false;
		s.reach = 1;
		s.rmin = 12;
		s.rmax = 24;
		s.avg = 6.0;
		s.bonus = e->spell_attack_bonus();
		s.mult = 1.0;
		out.push_back(s);
	}
	return enemy_summary_.emplace(e->id, std::move(out)).first->second;
}

double AIBrain::threat_at(Creature* c, const Cell& cell)
{
	// Como en Godot, la caché va por casilla (no por criatura) hasta el siguiente begin_plan()
	const int tkey = cell.x * 1000 + cell.y;
	auto it = threat_cache_.find(tkey);
	if (it != threat_cache_.end())
	{
		return it->second;
	}
	double total = 0.0;
	const int my_ac = c->ac();
	for (Creature* e : b.enemies_of(c))
	{
		if (!e->is_active() || e->has_condition("incapacitated") || e->has_effect("suggested"))
		{
			continue;
		}
		double best = 0.0;
		const int move_cells = e->speed() / 5;
		const int d = BattleMap::dist(e->cell, cell);
		for (const Summary& s : summary(e))
		{
			bool ok = false;
			if (s.melee)
			{
				ok = d <= move_cells + s.reach;
			}
			else
			{
				ok = d <= s.rmax;
			}
			if (!ok)
			{
				continue;
			}
			best = std::max(best, s.avg * Dice::p_success(s.bonus, my_ac, e->has_condition("blinded") ? -1 : 0) * s.mult);
		}
		total += best;
	}
	threat_cache_[tkey] = total;
	return total;
}

double AIBrain::target_value(Creature* c, Creature* t)
{
	return target_value_base(c, t) + target_bonus(c, t);
}

double AIBrain::target_bonus(Creature* c, Creature* t)
{
	double v = 0.0;
	if (c != nullptr && c->template_id == "giant_spider_srd")
	{
		// Araña gigante: muerde al que ya está en su telaraña y la lanza al lanzador
		if (t->has_effect("spider_web_srd"))
		{
			v += 1.5;
		}
		else if (!t->casting_ability.empty() || t->concentration)
		{
			v += 0.6;
		}
	}
	if (modo == "tactico" && c != nullptr && c->team == 0 && t->team != 0)
	{
		// Compañeros: primero quien amenaza al héroe
		Creature* heroe = b.get_creature("hero");
		if (heroe != nullptr && heroe != c && !heroe->dead && BattleMap::dist(heroe->cell, t->cell) <= 1)
		{
			v += 1.5;
		}
	}
	return v;
}

double AIBrain::target_value_base(Creature* c, Creature* t)
{
	(void)c;
	const std::string key = t->id + ":" + std::to_string(t->hp);
	if (const double* cached = tv_cache_.find(key))
	{
		return *cached;
	}
	double v = 1.0;
	double dmg_out = 0.0;
	for (const Summary& s : summary(t))
	{
		dmg_out = std::max(dmg_out, s.avg);
	}
	if (!t->casting_ability.empty())
	{
		dmg_out = std::max(dmg_out, 7.0);
	}
	v += dmg_out / 6.0;
	if (t->concentration)
	{
		v += 0.8;
	}
	if (t->ai_profile == "healer")
	{
		v += 0.5;
	}
	v += (1.0 - t->hp_ratio()) * 0.6;
	if (t->has_condition("prone") || t->has_condition("paralyzed") || t->has_condition("restrained"))
	{
		v += 0.2;
	}
	if (t->has_condition("incapacitated") || t->has_effect("suggested"))
	{
		v *= 0.5;
	}
	tv_cache_[key] = v;
	return v;
}

double AIBrain::kill_bonus(Creature* t)
{
	return t != nullptr ? 4.0 + target_value(nullptr, t) * 2.0 : 0.0;
}

// ------------------------------------------------------------------ candidatos de destino

const Battle::MoveOptions& AIBrain::move_opts(Creature* c)
{
	std::string key = format("%s|%d|%d,%d|%d|%d|%d", c->id.c_str(), c->turn.movement, c->cell.x, c->cell.y, c->turn.action, c->turn.bonus,
		static_cast<int>(b.zones.size()));
	for (const CreaturePtr& o : b.creatures)
	{
		key += !o->dead ? format("|%d,%d", o->cell.x, o->cell.y) : std::string("|x");
	}
	if (key != opts_key_)
	{
		opts_key_ = key;
		opts_cache_ = b.move_options(c);
	}
	return opts_cache_;
}

std::vector<AIBrain::Dest> AIBrain::destinations(Creature* c, bool allow_dash)
{
	const Battle::MoveOptions& opts = move_opts(c);
	std::vector<Dest> out;
	for (const auto& kv : opts.cost)
	{
		out.push_back(Dest{kv.first, kv.second, false});
	}
	if (allow_dash)
	{
		for (const auto& kv : opts.dash_cost)
		{
			out.push_back(Dest{kv.first, kv.second, true});
		}
	}
	return out;
}

std::vector<Cell> AIBrain::path_for(Creature* c, const Cell& cell, bool dash)
{
	const Battle::MoveOptions& opts = move_opts(c);
	return BattleMap::build_path(dash ? opts.dash_prev : opts.prev, c->cell, cell);
}

double AIBrain::oa_cost(Creature* c, const std::vector<Cell>& path)
{
	double total = 0.0;
	for (const auto& th : b.path_threats(c, path))
	{
		Creature* e = th.first;
		const Var mp = b.best_melee_profile(e);
		if (mp.is_empty())
		{
			continue;
		}
		double avg = 0.0;
		for (const Var& dd : mp.get("damage").arr())
		{
			avg += Dice::average(dd.get("dice").as_str());
		}
		total += avg * Dice::p_success(mp.getf("bonus"), c->ac(), 0);
	}
	return total;
}

double AIBrain::zone_cost(Creature* c, const std::vector<Cell>& path, const Cell& end_cell)
{
	if (b.zones.empty())
	{
		return 0.0;
	}
	double total = 0.0;
	for (const Cell& cell : path)
	{
		for (const Var& z : b.zones_at(cell))
		{
			if (z.has("per_cell"))
			{
				const Var pc = z.get("per_cell");
				total += Dice::average(pc.get("dice").str()) * b.damage_multiplier(c, pc.get("type").str());
			}
		}
	}
	for (const Var& z2 : b.zones_at(end_cell))
	{
		if (z2.getb("end_damage", false))
		{
			total += Dice::average(z2.get("damage").get("dice").str()) * 0.75;
		}
		if (z2.has("end") || z2.has("start") || z2.has("enter"))
		{
			total += 3.5;
		}
	}
	return total;
}

// ------------------------------------------------------------------ mejor plan

Var AIBrain::best_plan(Creature* c)
{
	begin_plan();
	std::vector<Creature*> enemies = filter(b.enemies_of(c), [this, c](Creature* e) { return e->is_active() && b.may_target(c, e); });
	if (enemies.empty())
	{
		return Var::dict();
	}
	const std::vector<Dest> dests = destinations(c);
	const double rw = risk_weight(c);
	const double hp_factor = 1.0 + (1.0 - c->hp_ratio()) * 1.5;
	const std::vector<Var> profiles = b.attack_profiles(c);
	const bool can_attack = c->turn.action > 0 || c->turn.attack_left > 0;
	const bool can_cast = c->turn.action > 0 && c->turn.attack_left <= 0;
	std::vector<Var> spell_list;
	if ((can_cast && !c->known_spells().empty()) || c->has_effect("produce_flame") || c->has_effect("flame_blade") ||
		c->has_effect("dragons_breath"))
	{
		spell_list = filter(b.spells->available(c), [](const Var& s) { return s.getb("usable") && s.gets("cost") == "action"; });
	}
	const std::string prof = profile(c);
	struct Cand
	{
		double v = 0.0;
		Cell cell;
		Var plan;
		double ub = 0.0;
	};
	std::vector<Cand> cands;
	CellMap<double> pos_cache;
	CellMap<double> threat_map;
	for (const Dest& d : dests)
	{
		threat_map[d.cell] = threat_at(c, d.cell);
	}
	if (!threat_map.has(c->cell))
	{
		threat_map[c->cell] = threat_at(c, c->cell);
	}
	// El riesgo inevitable (el de la casilla más segura a su alcance) no debe disuadir de actuar
	double min_th = ai_detail::kInf;
	for (const auto& kv : threat_map)
	{
		min_th = std::min(min_th, kv.second);
	}
	// --- Ataques con arma
	CellMap<bool> safe_cells;
	safe_cells[c->cell] = true;
	if (can_attack)
	{
		int max_rng = 0;
		for (const Var& p : profiles)
		{
			if (p.gets("kind") != "melee")
			{
				max_rng = std::max(max_rng, p.get("range").at(0).to_int());
			}
		}
		std::vector<Dest> with_los;
		if (max_rng > 0)
		{
			for (const Dest& d : dests)
			{
				for (Creature* t : enemies)
				{
					const int dd = BattleMap::dist(d.cell, t->cell);
					if (dd <= max_rng && b.map.has_los(d.cell, t->cell))
					{
						with_los.push_back(d);
						break;
					}
				}
			}
		}
		godot_sort(with_los, [&threat_map](const Dest& x, const Dest& y) { return threat_map.get(x.cell) < threat_map.get(y.cell); });
		for (const Dest& d : head(with_los, 14))
		{
			safe_cells[d.cell] = true;
		}
		for (const Dest& d : dests)
		{
			const Cell cell = d.cell;
			for (const Var& p : profiles)
			{
				const bool is_melee = p.gets("kind") == "melee";
				if (!is_melee && !safe_cells.has(cell))
				{
					continue;
				}
				for (Creature* t : enemies)
				{
					if (is_melee && BattleMap::dist(cell, t->cell) > p.geti("reach"))
					{
						continue;
					}
					if (!b.in_attack_range(c, p, t, cell))
					{
						continue;
					}
					const Var pv = b.preview_attack(c, p, t, cell);
					if (!pv.getb("los"))
					{
						continue;
					}
					const double expv = pv.getf("expected");
					double v = expv * target_value(c, t);
					if (expv >= t->hp * 0.9)
					{
						v += kill_bonus(t) * pv.getf("p_hit");
					}
					if (ai_detail::in_list(prof, {"archer", "skirmisher_pc", "caster", "support", "archer_pc"}) && p.gets("kind") == "melee" &&
						c->form.empty())
					{
						v *= 0.75;
					}
					if (p.gets("kind") == "thrown" && c->ammo_left(p.get("weapon")) <= 1)
					{
						v *= 0.85;
					}
					cands.push_back(Cand{v, cell, vdict({{"kind", "attack"}, {"key", p.get("key")}, {"target", t->id}}), 0.0});
				}
			}
			if (!c->life_drain.empty() && !c->turn.life_drain_used)
			{
				for (Creature* t : enemies)
				{
					if (BattleMap::dist(cell, t->cell) <= 1)
					{
						const double ps = 1.0 - Dice::p_success(t->save_bonus("con"), jint(c->life_drain, "dc"), 0, 21, false);
						const double v2 = ps * Dice::average(jstr(c->life_drain, "dice")) * target_value(c, t) * 1.15;
						cands.push_back(Cand{v2, cell, vdict({{"kind", "life_drain"}, {"target", t->id}}), 0.0});
					}
				}
			}
		}
		// Arma de aliento (sustituye un ataque)
		if (c->resources.get("breath_weapon", 0) > 0 && c->form.empty())
		{
			const Var bp = breath_plan(c, enemies);
			if (!bp.is_empty())
			{
				cands.push_back(Cand{bp.getf("value"), c->cell, bp, 0.0});
			}
		}
	}
	// --- Conjuros, rasgos de acción y rescates
	if (can_cast)
	{
		std::vector<Cell> spell_dests = {c->cell};
		const bool feature_ok = c->resources.get("channel_divinity", 0) > 0 || c->level_feature("lands_aid");
		if (!spell_list.empty() || feature_ok)
		{
			std::vector<Dest> ranked = dests;
			godot_sort(ranked, [&threat_map](const Dest& x, const Dest& y) { return threat_map.get(x.cell) < threat_map.get(y.cell); });
			for (const Dest& d : head(ranked, 6))
			{
				add_unique(spell_dests, d.cell);
			}
			// y algún destino cercano a los enemigos para áreas cortas
			std::vector<Dest> near = dests;
			godot_sort(near, [this, &enemies](const Dest& x, const Dest& y) {
				return min_enemy_dist(x.cell, enemies) < min_enemy_dist(y.cell, enemies);
			});
			for (const Dest& d : head(near, 3))
			{
				add_unique(spell_dests, d.cell);
			}
		}
		for (const Cell& cell : spell_dests)
		{
			for (const Var& s : spell_list)
			{
				const Var sp_plan = best_spell_use(c, s, cell);
				if (!sp_plan.is_empty())
				{
					Var pl = sp_plan.duplicate();
					pl["kind"] = "spell";
					cands.push_back(Cand{sp_plan.getf("value"), cell, pl, 0.0});
				}
			}
			if (c->resources.get("channel_divinity", 0) > 0 && c->cls == "cleric")
			{
				const Var cd_plan = channel_divinity(c, cell);
				if (!cd_plan.is_empty())
				{
					cands.push_back(Cand{cd_plan.getf("value"), cell, cd_plan, 0.0});
				}
			}
			if (c->level_feature("lands_aid") && c->resources.get("wild_shape", 0) > 0 && c->form.empty())
			{
				const Var la = lands_aid_plan(c, cell);
				if (!la.is_empty())
				{
					cands.push_back(Cand{la.getf("value"), cell, la, 0.0});
				}
			}
		}
		for (const Dest& d : dests)
		{
			for (Creature* ally : b.allies_of(c))
			{
				if (BattleMap::dist(d.cell, ally->cell) <= 1)
				{
					if (ally->is_down() && !ally->stable)
					{
						cands.push_back(Cand{6.0 + ally->death_failures * 3.0, d.cell, vdict({{"kind", "stabilize"}, {"target", ally->id}}), 0.0});
					}
					if (ally->has_effect("sleep"))
					{
						cands.push_back(Cand{5.0 + ally->hp / 4.0, d.cell, vdict({{"kind", "wake"}, {"target", ally->id}}), 0.0});
					}
				}
			}
		}
		// Mover Rayo de luna sobre los enemigos
		for (const Var& z : std::vector<Var>(b.zones))
		{
			if (z.get("owner").creature() == c && z.has("movable"))
			{
				const Var zp = zone_move_plan(c, z);
				if (!zp.is_empty())
				{
					cands.push_back(Cand{zp.getf("value"), c->cell, zp, 0.0});
				}
			}
		}
		// Liberarse de un apresamiento
		EffectPtr esc = b.escape_effect(c);
		if (esc)
		{
			const bool adjacent = adjacent_enemies(c, c->cell) > 0;
			const double p_ok =
				Dice::p_success(std::max(c->skill_bonus("athletics"), c->skill_bonus("acrobatics")), esc->data.get("escape").geti("dc", 10));
			const double v_esc = p_ok * ((!adjacent || ranged_minded(c)) ? 6.0 : 2.5);
			cands.push_back(Cand{v_esc, c->cell, vdict({{"kind", "escape"}}), 0.0});
		}
		// Ampliación: romper la telaraña de la araña gigante (la propia, o la de un aliado tras acercarse)
		bool hay_tela = false;
		for (Creature* x : b.allies_of(c))
		{
			hay_tela = hay_tela || x->has_effect("spider_web_srd");
		}
		if (hay_tela || c->has_effect("spider_web_srd"))
		{
			const Var mp = b.best_melee_profile(c);
			const int bonus = mp.is_empty() ? c->mod("str") + c->prof_bonus : mp.geti("bonus");
			double p_hit = Dice::p_success(bonus, 10);
			if (c->has_condition("restrained"))
			{
				p_hit *= p_hit;
			}
			double dano = 0.0;
			for (const Var& dd : mp.get("damage", Var::array()).arr())
			{
				dano += Dice::average(dd.get("dice").as_str());
			}
			const double p_romper = p_hit * std::min(1.0, std::max(1.0, dano) / 5.0);
			// Lo que vale soltarlo: la ventaja que pierden los enemigos que lo tienen al lado (doble si
			// pueden tumbarlo) y poder volver a moverse
			const auto valor = [&](Creature* t) {
				double v = 2.0 + (ranged_minded(t) ? 1.5 : 0.0);
				for (Creature* e : b.enemies_of(t))
				{
					if (e->is_active() && BattleMap::dist(e->cell, t->cell) <= 1)
					{
						const double ap = attack_power(e);
						v += 0.3 * ap * (t->hp <= 2.0 * ap ? 2.0 : 1.0);
					}
				}
				return p_romper * v;
			};
			if (c->has_effect("spider_web_srd"))
			{
				cands.push_back(Cand{valor(c), c->cell, vdict({{"kind", "web"}, {"target", c->id}}), 0.0});
			}
			for (const Dest& d : dests)
			{
				for (Creature* ally : b.allies_of(c))
				{
					if (ally != c && ally->has_effect("spider_web_srd") && BattleMap::dist(d.cell, ally->cell) <= 1)
					{
						cands.push_back(Cand{valor(ally), d.cell, vdict({{"kind", "web"}, {"target", ally->id}}), 0.0});
					}
				}
			}
		}
	}
	// --- Ampliación: modo táctico de los compañeros (no cambia nada con el modo publicado)
	if (modo == "tactico" && c->team == 0)
	{
		const bool fragil = (c->ac() <= 13 || c->hp_ratio() <= 0.4) && ranged_minded(c);
		Creature* heroe = b.get_creature("hero");
		const bool heroe_amenazado = heroe != nullptr && heroe != c && !heroe->dead && adjacent_enemies(heroe, heroe->cell) > 0;
		for (Cand& cand : cands)
		{
			if (cand.plan.gets("kind") == "spell")
			{
				const Var ts = cand.plan.get("data").get("targets", Var::array());
				bool enemigos = false;
				bool casi_muertos = true;
				bool herido = false;
				bool caido = false;
				for (const Var& tid : ts.arr())
				{
					Creature* t = b.get_creature(tid.as_str());
					if (t == nullptr)
					{
						continue;
					}
					if (t->team != c->team)
					{
						enemigos = true;
						casi_muertos = casi_muertos && t->hp <= std::max(6, static_cast<int>(t->max_hp * 0.25));
					}
					else if (t->is_down())
					{
						caido = true;
					}
					else if (t->hp_ratio() <= 0.35)
					{
						herido = true;
					}
				}
				// No se gastan espacios en enemigos que caen con cualquier cosa
				if (cand.plan.geti("slot") > 0 && enemigos && casi_muertos)
				{
					cand.v *= 0.35;
				}
				// Curar antes de que un aliado caiga (o levantarlo si ya ha caído)
				if (caido)
				{
					cand.v += 6.0;
				}
				else if (herido)
				{
					cand.v += 3.5;
				}
			}
			// Los frágiles no se quedan en el cuerpo a cuerpo
			if (fragil)
			{
				cand.v -= 2.5 * adjacent_enemies(c, cand.cell);
			}
			// Interponerse: los de cuerpo a cuerpo se ponen junto al héroe cuando le amenazan
			if (heroe_amenazado && !ranged_minded(c) && BattleMap::dist(cand.cell, heroe->cell) <= 1)
			{
				cand.v += 1.0;
			}
		}
	}
	// --- Ramificación y poda: el riesgo siempre resta
	for (Cand& cand : cands)
	{
		if (!pos_cache.has(cand.cell))
		{
			pos_cache[cand.cell] = position_bonus(c, cand.cell);
		}
		cand.ub = cand.v + pos_cache.get(cand.cell);
	}
	godot_sort(cands, [](const Cand& x, const Cand& y) { return x.ub > y.ub; });
	Var best = Var::dict();
	double best_score = -ai_detail::kInf;
	struct Risk
	{
		double cost = 0.0;
		std::vector<Cell> path;
	};
	CellMap<Risk> risk_cache;
	for (const Cand& cand : cands)
	{
		if (cand.ub <= best_score)
		{
			break;
		}
		const Cell cell = cand.cell;
		if (!risk_cache.has(cell))
		{
			const std::vector<Cell> path = cell == c->cell ? std::vector<Cell>() : path_for(c, cell, false);
			if (cell != c->cell && path.empty())
			{
				risk_cache[cell] = Risk{ai_detail::kInf, path};
			}
			else
			{
				const double th = threat_map.has(cell) ? threat_map.get(cell) : threat_at(c, cell);
				risk_cache[cell] = Risk{std::max(0.0, th - min_th) * rw * hp_factor + oa_cost(c, path) * 1.3 + zone_cost(c, path, cell), path};
			}
		}
		const Risk rc = risk_cache.get(cell);
		const double sc = cand.ub - rc.cost;
		if (sc > best_score)
		{
			best_score = sc;
			best = cand.plan.duplicate();
			best.merge(vdict({{"score", sc}, {"cell", cell}, {"path", ai_detail::cells_var(rc.path)}}), true);
		}
	}
	// --- Sin ataque útil: acercarse corriendo o esquivar
	if (best.is_empty() || best_score < 0.5)
	{
		const Var alt = fallback(c, enemies);
		if (!alt.is_empty() && (best.is_empty() || alt.getf("score") > best_score))
		{
			best = alt;
		}
	}
	return best;
}

bool AIBrain::reckless_worth(Creature* c, const Var& p, Creature* t)
{
	const Var pv = b.preview_attack(c, p, t, c->cell);
	const double ph = std::clamp(pv.getf("p_hit"), 0.05, 0.95);
	const double per_hit = pv.getf("expected") / ph;
	const double attacks = c->turn.attack_left > 0 ? static_cast<double>(std::max(1, c->turn.attack_left))
												   : static_cast<double>(b.attacks_per_action(c));
	const double gain = (1.0 - std::pow(1.0 - ph, 2) - ph) * per_hit * attacks;
	begin_plan();
	const double cost = threat_at(c, c->cell) * 0.4 * (c->is_raging() ? 0.5 : 1.0);
	const double hp_factor = 1.0 + (1.0 - c->hp_ratio()) * 1.5;
	return gain > cost * hp_factor;
}

int AIBrain::min_enemy_dist(const Cell& cell, const std::vector<Creature*>& enemies) const
{
	int m = 999;
	for (Creature* e : enemies)
	{
		m = std::min(m, BattleMap::dist(cell, e->cell));
	}
	return m;
}

double AIBrain::position_bonus(Creature* c, const Cell& cell)
{
	double bonus = 0.0;
	const std::string prof = profile(c);
	// Táctica de manada / ataque furtivo: estar junto a aliados que flanquean
	if (prof == "pack" || c->has_trait("pack_tactics"))
	{
		for (Creature* e : b.enemies_of(c))
		{
			if (BattleMap::dist(cell, e->cell) <= 1)
			{
				for (Creature* a : b.allies_of(c))
				{
					if (BattleMap::dist(a->cell, e->cell) <= 1)
					{
						bonus += 0.6;
					}
				}
			}
		}
	}
	// Los tiradores prefieren distancia
	if (ranged_minded(c))
	{
		int md = 999;
		for (Creature* e : b.enemies_of(c))
		{
			if (e->is_active())
			{
				md = std::min(md, BattleMap::dist(cell, e->cell));
			}
		}
		if (md <= 1)
		{
			bonus -= 1.2;
		}
		else if (md >= 3)
		{
			bonus += 0.4;
		}
	}
	// El frente protege a los débiles
	if (prof == "frontline")
	{
		for (Creature* e : b.enemies_of(c))
		{
			if (!e->is_active())
			{
				continue;
			}
			for (Creature* a : b.allies_of(c))
			{
				if (ai_detail::in_list(a->ai_profile, {"caster", "healer", "support"}) && BattleMap::dist(a->cell, e->cell) <= 2 &&
					BattleMap::dist(cell, e->cell) <= 1)
				{
					bonus += 0.8;
				}
			}
		}
	}
	// El cabecilla trasgo quiere aliados al lado (redirigir ataque)
	if (contains(c->reactions, std::string("redirect_attack")))
	{
		for (Creature* a : b.allies_of(c))
		{
			if (BattleMap::dist(a->cell, cell) <= 1)
			{
				bonus += 0.3;
				break;
			}
		}
	}
	return bonus;
}

Var AIBrain::fallback(Creature* c, const std::vector<Creature*>& enemies)
{
	// Correr hacia el enemigo más cercano (o alejarse si es tirador sin línea)
	if (c->turn.action <= 0 || c->turn.attack_left > 0)
	{
		return Var::dict();
	}
	const std::vector<Dest> dests = destinations(c, true);
	Var best = Var::dict();
	double best_sc = -ai_detail::kInf;
	const bool ranged = ranged_minded(c);
	const double rw = risk_weight(c);
	Creature* target = nullptr;
	int td = 999;
	for (Creature* e : enemies)
	{
		const int d = BattleMap::dist(c->cell, e->cell);
		if (d < td)
		{
			td = d;
			target = e;
		}
	}
	if (target == nullptr)
	{
		return Var::dict();
	}
	for (const Dest& d : dests)
	{
		const Cell cell = d.cell;
		const int dist_after = min_enemy_dist(cell, enemies);
		double sc = 0.0;
		if (ranged)
		{
			// buscar línea de visión a buena distancia
			bool los = false;
			for (Creature* e : enemies)
			{
				if (b.map.has_los(cell, e->cell) && BattleMap::dist(cell, e->cell) <= 16)
				{
					los = true;
					break;
				}
			}
			sc = (los ? 2.0 : 0.0) + std::clamp(dist_after, 2, 6) * 0.2 - threat_at(c, cell) * rw * 0.5;
		}
		else
		{
			sc = (td - dist_after) * 0.5 - threat_at(c, cell) * rw * 0.3;
		}
		sc -= zone_cost(c, {}, cell) * 0.5;
		if (sc > best_sc)
		{
			best_sc = sc;
			best = vdict({{"score", std::max(0.1, sc * 0.2)}, {"cell", cell}, {"path", ai_detail::cells_var(path_for(c, cell, d.dash))},
				{"dash", d.dash}, {"kind", d.dash ? "dash" : "move_only"}});
		}
	}
	// Esquivar si está acorralado y malherido
	if (c->hp_ratio() < 0.35 && threat_at(c, c->cell) > c->hp * 0.6)
	{
		const double dodge_sc = 0.6;
		if (best.is_empty() || dodge_sc > best.getf("score"))
		{
			return vdict({{"score", dodge_sc}, {"cell", c->cell}, {"path", Var::array()}, {"kind", "dodge"}});
		}
	}
	if (!best.is_empty() && best.gets("kind") == "move_only" && best.get("cell").cell() == c->cell)
	{
		return Var::dict();
	}
	return best;
}

// ------------------------------------------------------------------ conjuros

double AIBrain::slot_cost(Creature* c, const Var& s, const Json& sp, int slot)
{
	double cost = 0.0;
	if (slot > 0 && !s.getb("free") && !s.getb("at_will", false))
	{
		cost = 2.5 * slot;
		if (c->total_slots() <= 1)
		{
			cost += 2.0;
		}
	}
	if (jbool(sp, "concentration", false) && c->concentration)
	{
		cost += concentration_value(c);
	}
	return cost;
}

double AIBrain::concentration_value(Creature* c)
{
	if (!c->concentration)
	{
		return 0.0;
	}
	double v = 4.0;
	const std::string& cs = c->concentration_spell;
	if (ai_detail::in_list(cs, {"hold_person", "hideous_laughter", "suggestion"}))
	{
		for (const Var& l : c->concentration->data.get("linked", Var::array()).arr())
		{
			EffectPtr e = l.effect();
			if (e && e->owner != nullptr && !e->owner->dead)
			{
				v += 8.0;
			}
		}
	}
	else if (ai_detail::in_list(cs, {"moonbeam", "spike_growth", "entangle", "web", "spiritual_weapon", "flaming_sphere", "bless", "bane", "faerie_fire"}))
	{
		v += 5.0;
	}
	else if (cs == "hunters_mark" || cs == "hex")
	{
		v += 2.5;
	}
	return v;
}

Var AIBrain::best_spell_use(Creature* c, const Var& s, const Cell& cell)
{
	const std::string sid = s.gets("id");
	const Json& sp = RulesDB::spell(sid);
	const Var slots = s.get("slots", Var::array());
	const int slot = slots.size() > 0 ? slots.at(0).to_int() : 0;
	Var best = Var::dict();
	double best_v = 0.0;
	const double slot_cost_v = slot_cost(c, s, sp, slot);
	const std::string meta = pick_metamagic(c, sp, slot);
	const std::string tt = jstr(sp, "target");
	if (tt == "enemy" || tt == "enemy_humanoid" || tt == "weapon")
	{
		for (Creature* t : b.spells->valid_targets(c, sid, cell))
		{
			Var data = vdict({{"targets", varr({t->id})}, {"cmd", "grovel"}});
			if (!meta.empty())
			{
				data["meta"] = meta;
			}
			const Var pv = b.spells->preview(c, sid, slot, data, cell);
			double v = pv.getf("enemy_dmg") * target_value(c, t) + pv.getf("kills") * kill_bonus(t) + pv.getf("control") * 2.5 - slot_cost_v;
			if (sid == "command" || sid == "hold_person")
			{
				v = pv.getf("control") * (2.0 + target_value(c, t)) - slot_cost_v;
			}
			else if (sid == "spider_web_srd")
			{
				// Ampliación (araña gigante): la telaraña vale más sobre lanzadores y los más peligrosos
				v = pv.getf("control") * (2.5 + target_value(c, t)) - slot_cost_v;
			}
			else if (jstr(sp, "special", "") == "mark")
			{
				v = 0.0;
			}
			if (v > best_v)
			{
				best_v = v;
				best = vdict({{"value", v}, {"spell", sid}, {"slot", slot}, {"data", data}});
			}
		}
	}
	else if (tt == "enemies")
	{
		std::vector<Creature*> targets = b.spells->valid_targets(c, sid, cell);
		godot_sort(targets, [this, c](Creature* x, Creature* y) { return target_value(c, x) > target_value(c, y); });
		Var ids = Var::array();
		for (Creature* t : targets)
		{
			if (static_cast<int>(ids.size()) < b.spells->max_targets(sp, slot))
			{
				ids.push(t->id);
			}
		}
		if (ids.size() >= 2)
		{
			const Var pv5 = b.spells->preview(c, sid, slot, vdict({{"targets", ids}}), cell);
			const double v5 = pv5.getf("control") * 1.6 + pv5.getf("enemy_dmg") - slot_cost_v;
			if (v5 > best_v)
			{
				best_v = v5;
				best = vdict({{"value", v5}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", ids}})}});
			}
		}
	}
	else if (tt == "darts" || tt == "rays")
	{
		const int n = b.spells->n_darts(c, sp, slot);
		const std::vector<Creature*> targets = b.spells->valid_targets(c, sid, cell);
		if (targets.empty())
		{
			return Var::dict();
		}
		const Var ids = distribute(c, sid, targets, n, slot);
		double v2 = 0.0;
		for (Creature* t2 : targets)
		{
			const int cnt = ids.count(Var(t2->id));
			if (cnt == 0)
			{
				continue;
			}
			const Var single = b.spells->preview(c, sid, slot, vdict({{"targets", varr({t2->id})}}), cell);
			v2 += single.getf("enemy_dmg") * target_value(c, t2) * (sid == "magic_missile" ? 1.2 : 1.0) /
				  static_cast<double>(std::max<size_t>(1, single.get("affected").size()));
		}
		const Var pv2 = b.spells->preview(c, sid, slot, vdict({{"targets", ids}}), cell);
		if (sid == "magic_missile")
		{
			v2 = pv2.getf("enemy_dmg") * 1.2;
		}
		v2 += pv2.getf("kills") * 4.5 - slot_cost_v;
		if (v2 > best_v)
		{
			best_v = v2;
			best = vdict({{"value", v2}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", ids}})}});
		}
	}
	else if (tt == "point")
	{
		best = best_point_use(c, sid, sp, slot, cell, slot_cost_v, meta);
	}
	else if (tt == "direction")
	{
		std::vector<Vec2> dirs;
		for (Creature* e : b.enemies_of(c))
		{
			if (e->is_active() && BattleMap::dist(cell, e->cell) <= 6)
			{
				dirs.push_back(BattleMap::center(e->cell));
			}
		}
		for (const Cell& n : BattleMap::neighbors(cell))
		{
			dirs.push_back(BattleMap::center(cell) + (BattleMap::center(n) - BattleMap::center(cell)) * 2.0f);
		}
		for (const Vec2& dir : dirs)
		{
			Var data4 = vdict({{"dir", dir}});
			if (meta == "careful")
			{
				data4["meta"] = meta;
			}
			const Var pv4 = b.spells->preview(c, sid, slot, data4, cell);
			int hits2 = 0;
			for (const Var& a : pv4.get("affected").arr())
			{
				if (a.geti("team") != c->team)
				{
					hits2 += 1;
				}
			}
			double v4 = pv4.getf("enemy_dmg") * 1.1 + pv4.getf("kills") * 4.0 + pv4.getf("control") * 2.5 - pv4.getf("ally_dmg") * 3.0 - slot_cost_v;
			if (hits2 < 2 && slot > 0)
			{
				v4 *= 0.45;
			}
			if (hits2 == 0)
			{
				v4 = -1.0;
			}
			if (v4 > best_v)
			{
				best_v = v4;
				best = vdict({{"value", v4}, {"spell", sid}, {"slot", slot}, {"data", data4}});
			}
		}
	}
	else if (tt == "self")
	{
		best = self_spell(c, sid, sp, slot, cell, slot_cost_v);
	}
	else if (tt == "cell")
	{
		if (sid == "flaming_sphere")
		{
			best = flaming_sphere_plan(c, sid, sp, slot, cell, slot_cost_v);
		}
	}
	else if (tt == "ally" || tt == "allies" || tt == "ally_other" || tt == "creature")
	{
		best = support_spell(c, sid, sp, slot, cell, slot_cost_v);
	}
	else if (tt == "downed_ally")
	{
		for (Creature* t3 : b.spells->valid_targets(c, sid, cell))
		{
			const double v5b = 3.0 + t3->death_failures * 2.5;
			if (v5b > best_v)
			{
				best_v = v5b;
				best = vdict({{"value", v5b}, {"spell", sid}, {"slot", 0}, {"data", vdict({{"targets", varr({t3->id})}})}});
			}
		}
	}
	if (!best.is_empty() && !meta.empty() && !best.get("data").has("meta") && meta != "careful")
	{
		best["data"]["meta"] = meta;
		if (meta == "quickened")
		{
			best["value"] = best.getf("value") + 1.5;
		}
	}
	return best;
}

Var AIBrain::best_point_use(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v,
	const std::string& meta)
{
	Var best = Var::dict();
	double best_v = 0.0;
	std::vector<Vec2> tried;
	const Json& zone = jobj(sp, "zone");
	const std::string zkind = jstr(zone, "kind", "");
	if (zkind == "fog" || zkind == "darkness")
	{
		return Var::dict();
	}
	for (Creature* e : b.enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		for (const Vec2& pt : BattleMap::candidate_points(e->cell))
		{
			if (contains(tried, pt))
			{
				continue;
			}
			tried.push_back(pt);
			if (!b.spells->point_in_range(c, sid, pt, cell))
			{
				continue;
			}
			Var data = vdict({{"point", pt}});
			if (meta == "careful")
			{
				data["meta"] = meta;
			}
			const Var pv3 = b.spells->preview(c, sid, slot, data, cell);
			double v3 = pv3.getf("enemy_dmg") * 1.1 + pv3.getf("kills") * 4.0 + pv3.getf("control") * 3.0 - pv3.getf("ally_dmg") * 2.5 - slot_cost_v;
			int hits = 0;
			int ally_in = 0;
			for (const Var& a : pv3.get("affected").arr())
			{
				if (a.geti("team") != c->team)
				{
					hits += 1;
				}
				else
				{
					ally_in += 1;
				}
			}
			// Zonas persistentes: valen más (siguen haciendo daño o estorbando)
			if (!zone.empty())
			{
				const std::vector<Cell> cells = b.spells->area_cells(c, sid, data, cell, slot);
				int foes_in = 0;
				int friends_in = 0;
				for (Creature* o : b.spells->creatures_in(cells, c))
				{
					if (o->team != c->team)
					{
						foes_in += 1;
					}
					else
					{
						friends_in += 1;
					}
				}
				if (zone.contains("per_cell"))
				{
					v3 += foes_in * 3.0 - friends_in * 4.0;
				}
				if (jbool(zone, "end_damage", false))
				{
					v3 += pv3.getf("enemy_dmg") * 0.5;
				}
				if (jbool(zone, "difficult", false))
				{
					v3 += foes_in * 0.6;
				}
				hits = std::max(hits, foes_in);
				ally_in = std::max(ally_in, friends_in);
			}
			if (ally_in > 0 && !jbool(sp, "only_enemies", false) && pv3.getf("ally_dmg") <= 0.0 && sp.contains("on_fail_effect"))
			{
				v3 -= ally_in * 3.0;
			}
			// El área debe tocar a más de uno para merecer el espacio
			if (hits < 2 && slot > 0 && sid != "sleep")
			{
				v3 *= 0.5;
			}
			if (hits == 0)
			{
				continue;
			}
			if (v3 > best_v)
			{
				best_v = v3;
				best = vdict({{"value", v3}, {"spell", sid}, {"slot", slot}, {"data", data}});
			}
		}
	}
	return best;
}

Var AIBrain::self_spell(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v)
{
	// Áreas desde uno mismo (Palabra radiante, Brazos de Hadar, Palmada atronadora)
	if (sp.contains("area"))
	{
		const Var pv = b.spells->preview(c, sid, slot, Var::dict(), cell);
		int hits = 0;
		for (const Var& a : pv.get("affected").arr())
		{
			if (a.geti("team") != c->team)
			{
				hits += 1;
			}
		}
		if (hits == 0)
		{
			return Var::dict();
		}
		double v = pv.getf("enemy_dmg") * 1.1 + pv.getf("kills") * 4.0 + pv.getf("control") * 2.0 - pv.getf("ally_dmg") * 3.0 - slot_cost_v;
		if (hits < 2 && slot > 0)
		{
			v *= 0.5;
		}
		return vdict({{"value", v}, {"spell", sid}, {"slot", slot}, {"data", Var::dict()}});
	}
	const double threat = threat_at(c, cell);
	double v2 = 0.0;
	if (sid == "mirror_image")
	{
		if (c->has_effect("mirror_image"))
		{
			return Var::dict();
		}
		v2 = threat * 1.4 - slot_cost_v;
	}
	else if (sid == "blur")
	{
		if (c->has_effect("blur"))
		{
			return Var::dict();
		}
		v2 = threat * 0.9 - slot_cost_v;
	}
	else if (sid == "false_life")
	{
		v2 = (threat > 3.0 ? 8.0 : 2.0) - slot_cost_v - c->temp_hp;
	}
	else if (sid == "armor_of_agathys")
	{
		if (c->has_effect("agathys"))
		{
			return Var::dict();
		}
		v2 = (5.0 * slot + (adjacent_enemies(c, cell) > 0 ? 5.0 * slot : 0.0)) * 0.6 - slot_cost_v;
	}
	else
	{
		return Var::dict();
	}
	if (v2 <= 0.0)
	{
		return Var::dict();
	}
	return vdict({{"value", v2}, {"spell", sid}, {"slot", slot}, {"data", Var::dict()}});
}

Var AIBrain::flaming_sphere_plan(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v)
{
	if (b.tokens.has(Var("fs_" + c->id)))
	{
		return Var::dict();
	}
	Var best = Var::dict();
	double best_v = 0.0;
	const int rng = b.spells->spell_cells(sp, c);
	for (Creature* e : b.enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		for (const Cell& n : BattleMap::neighbors(e->cell))
		{
			if (!b.map.walkable(n) || b.creature_at(n) != nullptr || BattleMap::dist(cell, n) > rng || !b.map.has_los(cell, n))
			{
				continue;
			}
			int foes = 0;
			int friends = 0;
			for (const CreaturePtr& op : b.creatures)
			{
				Creature* o = op.get();
				if (o->dead || BattleMap::dist(o->cell, n) > 1)
				{
					continue;
				}
				if (o->team != c->team)
				{
					foes += 1;
				}
				else if (o != c)
				{
					friends += 1;
				}
			}
			const double v = foes * 5.5 + 4.0 - friends * 5.0 - slot_cost_v;
			if (v > best_v)
			{
				best_v = v;
				best = vdict({{"value", v}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"cell", n}})}});
			}
		}
	}
	return best;
}

Var AIBrain::distribute(Creature* c, const std::string& sid, const std::vector<Creature*>& targets, int n, int slot)
{
	// Reparte dardos/rayos: primero rematar, luego al objetivo más valioso.
	const Json& sp = RulesDB::spell(sid);
	const double per = Dice::average(b.spells->damage_expr(c, sp, slot));
	Dict<double> remaining;
	for (Creature* t : targets)
	{
		remaining[t->id] = static_cast<double>(t->hp);
	}
	Var ids = Var::array();
	std::vector<Creature*> sorted = targets;
	godot_sort(sorted, [this, c](Creature* x, Creature* y) { return target_value(c, x) > target_value(c, y); });
	for (int i = 0; i < n; ++i)
	{
		Creature* pick = nullptr;
		// rematar al que menos necesite
		for (Creature* t : sorted)
		{
			if (remaining.get(t->id) > 0 && remaining.get(t->id) <= per * (n - i))
			{
				if (pick == nullptr || remaining.get(t->id) < remaining.get(pick->id))
				{
					pick = t;
				}
			}
		}
		if (pick == nullptr)
		{
			for (Creature* t : sorted)
			{
				if (remaining.get(t->id) > 0)
				{
					pick = t;
					break;
				}
			}
		}
		if (pick == nullptr)
		{
			pick = sorted[0];
		}
		ids.push(pick->id);
		remaining[pick->id] = remaining.get(pick->id) - per;
	}
	return ids;
}

Var AIBrain::support_spell(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v)
{
	const std::vector<Creature*> allies = b.spells->valid_targets(c, sid, cell);
	if (allies.empty())
	{
		return Var::dict();
	}
	Var best = Var::dict();
	double best_v = 0.0;
	if (sp.contains("heal"))
	{
		for (Creature* a : allies)
		{
			if (a->team != c->team)
			{
				continue;
			}
			const int missing = a->max_hp - a->hp;
			if (missing <= 0)
			{
				continue;
			}
			const double amt = std::min(Dice::average(b.spells->heal_expr(c, sp, slot, sid)), static_cast<double>(missing));
			const double urgency = 1.0 + (1.0 - a->hp_ratio()) * 2.5;
			double v = amt * urgency * 0.35;
			if (a->is_down())
			{
				v += 12.0 + a->death_failures * 3.0;
			}
			else if (a->hp_ratio() > 0.6)
			{
				v *= 0.3;
			}
			v -= slot_cost_v;
			if (v > best_v)
			{
				best_v = v;
				best = vdict({{"value", v}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", varr({a->id})}})}});
			}
		}
		return best;
	}
	const std::vector<Creature*> enemies = ai_detail::active_only(b.enemies_of(c));
	if (sid == "bless")
	{
		if (c->concentration)
		{
			return Var::dict();
		}
		Var picks = Var::array();
		std::vector<Creature*> cands = ai_detail::active_only(allies);
		godot_sort(cands, [this](Creature* x, Creature* y) { return attack_power(x) > attack_power(y); });
		for (Creature* a : cands)
		{
			if (static_cast<int>(picks.size()) < b.spells->max_targets(sp, slot))
			{
				picks.push(a->id);
			}
		}
		double v2 = static_cast<double>(picks.size()) * 2.4 - slot_cost_v * 0.6;
		if (enemies.size() >= 3)
		{
			v2 += 1.5;
		}
		return picks.size() >= 2 ? vdict({{"value", v2}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", picks}})}}) : Var::dict();
	}
	if (sid == "aid")
	{
		Var picks2 = Var::array();
		for (Creature* a : allies)
		{
			if (picks2.size() < 3)
			{
				picks2.push(a->id);
			}
		}
		double v3 = 0.0;
		for (const Var& idv : picks2.arr())
		{
			Creature* a2 = b.get_creature(idv.as_str());
			v3 += 5.0 * (a2->hp_ratio() > 0.6 ? 0.3 : 0.8) + (a2->is_down() ? 10.0 : 0.0);
		}
		return vdict({{"value", v3 - slot_cost_v}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", picks2}})}});
	}
	if (sid == "heroism")
	{
		if (c->concentration)
		{
			return Var::dict();
		}
		Creature* tank = best_frontliner(c, allies);
		if (tank == nullptr || threat_at(tank, tank->cell) < 4.0)
		{
			return Var::dict();
		}
		return vdict({{"value", 3.5 - slot_cost_v * 0.5}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", varr({tank->id})}})}});
	}
	if (sid == "protection_from_evil_and_good")
	{
		if (c->concentration)
		{
			return Var::dict();
		}
		int evil = 0;
		for (Creature* e : enemies)
		{
			if (contains(Creature::kProtEvilTypes, e->ctype))
			{
				evil += 1;
			}
		}
		if (evil == 0)
		{
			return Var::dict();
		}
		Creature* tank2 = best_frontliner(c, allies);
		if (tank2 == nullptr)
		{
			return Var::dict();
		}
		return vdict({{"value", 2.0 + evil * 1.2 - slot_cost_v}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", varr({tank2->id})}})}});
	}
	if (sid == "enlarge_reduce")
	{
		if (c->concentration)
		{
			return Var::dict();
		}
		Creature* tgt = nullptr;
		double bv = 0.0;
		for (Creature* o : b.spells->valid_targets(c, sid, cell))
		{
			double v4 = 0.0;
			if (o->team == c->team)
			{
				v4 = ai_detail::in_list(o->ai_profile, {"frontline", "skirmisher_melee"}) ? attack_power(o) * 0.35 : 0.0;
			}
			else
			{
				v4 = attack_power(o) * 0.3 * (1.0 - Dice::p_success(o->save_bonus("con"), c->spell_save_dc(sid), 0, 21, false));
			}
			if (v4 > bv)
			{
				bv = v4;
				tgt = o;
			}
		}
		if (tgt == nullptr)
		{
			return Var::dict();
		}
		return vdict({{"value", bv * 2.0 - slot_cost_v}, {"spell", sid}, {"slot", slot}, {"data", vdict({{"targets", varr({tgt->id})}})}});
	}
	return Var::dict();
}

Creature* AIBrain::best_frontliner(Creature* c, const std::vector<Creature*>& allies)
{
	Creature* best = nullptr;
	double bv = -1.0;
	for (Creature* a : allies)
	{
		if (!a->is_active() || a->team != c->team)
		{
			continue;
		}
		const double v = threat_at(a, a->cell) + (a->ai_profile == "frontline" ? 3.0 : 0.0);
		if (v > bv)
		{
			bv = v;
			best = a;
		}
	}
	return best;
}

double AIBrain::attack_power(Creature* c)
{
	double best = 0.0;
	for (const Var& p : b.attack_profiles(c))
	{
		double avg = 0.0;
		for (const Var& dd : p.get("damage").arr())
		{
			avg += Dice::average(dd.get("dice").as_str());
		}
		best = std::max(best, avg);
	}
	return best;
}

Var AIBrain::channel_divinity(Creature* c, const Cell& cell)
{
	Var best = Var::dict();
	double best_v = 0.0;
	// Expulsar muertos vivientes
	int undead = 0;
	for (Creature* e : b.enemies_of(c))
	{
		if (e->ctype == "undead" && e->is_active() && BattleMap::dist(cell, e->cell) <= 6)
		{
			undead += 1;
		}
	}
	if (undead >= 2)
	{
		const double v = undead * 2.2;
		if (v > best_v)
		{
			best_v = v;
			best = vdict({{"value", v}, {"kind", "turn_undead"}});
		}
	}
	// Preservar la vida
	if (c->level_feature("preserve_life"))
	{
		double need = 0.0;
		for (Creature* a : b.allies_of(c, true))
		{
			if (BattleMap::dist(cell, a->cell) <= 6 && a->hp < a->max_hp / 2)
			{
				need += std::min(a->max_hp / 2 - a->hp, 15) + (a->is_down() ? 8.0 : 0.0);
			}
		}
		const double v2 = need * 0.45;
		if (v2 > best_v)
		{
			best_v = v2;
			best = vdict({{"value", v2}, {"kind", "preserve_life"}});
		}
	}
	// Chispa divina
	for (Creature* t : b.enemies_of(c))
	{
		if (t->is_active() && BattleMap::dist(cell, t->cell) <= 6 && b.map.has_los(cell, t->cell))
		{
			const double avg = Dice::average(format("1d8+%d", c->mod("wis")));
			const double pf = 1.0 - Dice::p_success(t->save_bonus("con"), c->spell_save_dc(), 0, 21, false);
			const double v3 = (pf * avg + (1.0 - pf) * avg * 0.5) * target_value(c, t) * 0.8 - 1.5;
			if (v3 > best_v)
			{
				best_v = v3;
				best = vdict({{"value", v3}, {"kind", "divine_spark"}, {"target", t->id}});
			}
		}
	}
	for (Creature* a3 : b.allies_of(c, true))
	{
		if (BattleMap::dist(cell, a3->cell) <= 6 && a3->is_down())
		{
			const double v4 = 11.0;
			if (v4 > best_v)
			{
				best_v = v4;
				best = vdict({{"value", v4}, {"kind", "divine_spark"}, {"target", a3->id}});
			}
		}
	}
	return best;
}

Var AIBrain::lands_aid_plan(Creature* c, const Cell& cell)
{
	Var best = Var::dict();
	double best_v = 0.0;
	std::vector<Vec2> tried;
	for (Creature* e : b.enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		for (const Vec2& pt : BattleMap::candidate_points(e->cell))
		{
			if (contains(tried, pt))
			{
				continue;
			}
			tried.push_back(pt);
			const Cell center = BattleMap::cell_at(pt);
			if (BattleMap::dist(cell, center) > 12 || !b.map.has_los(cell, center))
			{
				continue;
			}
			const std::vector<Cell> cells = b.cls->lands_aid_cells(c, pt);
			double v = 0.0;
			int foes = 0;
			for (Creature* o : b.spells->creatures_in(cells))
			{
				if (o->team != c->team && o->is_active())
				{
					const double pf = 1.0 - Dice::p_success(o->save_bonus("con"), c->spell_save_dc(), 0, 21, false);
					v += (pf * 7.0 + (1.0 - pf) * 3.5) * target_value(c, o);
					foes += 1;
				}
				else if (o->team == c->team && o->hp < o->max_hp)
				{
					v += std::min(7.0, static_cast<double>(o->max_hp - o->hp)) * 0.4 + (o->is_down() ? 8.0 : 0.0);
				}
			}
			if (foes < 2)
			{
				v *= 0.6;
			}
			v -= 3.0;
			if (v > best_v)
			{
				best_v = v;
				best = vdict({{"value", v}, {"kind", "feature"}, {"feature", "lands_aid"}, {"data", vdict({{"point", pt}})}});
			}
		}
	}
	return best;
}

Var AIBrain::zone_move_plan(Creature* c, const Var& z)
{
	const Json& sp = RulesDB::spell(z.get("spell").str());
	const Vec2 old = z.has("point") ? z.get("point").vec2() : Vec2();
	const Cell oc = BattleMap::cell_at(old);
	// ¿Ya hay enemigos dentro? Entonces no merece la pena moverlo
	for (Creature* o : b.spells->creatures_in(ai_detail::var_cells(z.get("cells"))))
	{
		if (o->team != c->team && o->is_active())
		{
			return Var::dict();
		}
	}
	Var best = Var::dict();
	double best_v = 0.0;
	for (Creature* e : b.enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		const Vec2 pt = BattleMap::center(e->cell);
		const Cell center = e->cell;
		if (BattleMap::dist(oc, center) > z.geti("movable"))
		{
			continue;
		}
		const std::vector<Cell> cells = b.map.sphere_cells(pt, jint(jobj(sp, "area"), "radius", 5));
		int foes = 0;
		int friends = 0;
		for (Creature* o : b.spells->creatures_in(cells))
		{
			if (o->team != c->team)
			{
				foes += 1;
			}
			else
			{
				friends += 1;
			}
		}
		const double v = foes * 6.0 - friends * 7.0;
		if (v > best_v)
		{
			best_v = v;
			best = vdict({{"value", v}, {"kind", "feature"}, {"feature", "zone_move"}, {"data", vdict({{"zone", z.get("id")}, {"point", pt}})}});
		}
	}
	return best;
}

Var AIBrain::breath_plan(Creature* c, const std::vector<Creature*>& enemies)
{
	Var best = Var::dict();
	double best_v = 0.0;
	const double avg = Dice::average(b.cls->breath_dice(c));
	for (Creature* e : enemies)
	{
		if (BattleMap::dist(c->cell, e->cell) > 6)
		{
			continue;
		}
		const Vec2 dir = BattleMap::center(e->cell);
		for (const char* shape : {"cone", "line"})
		{
			const std::vector<Cell> cells = b.cls->breath_cells(c, shape, dir);
			double v = 0.0;
			int foes = 0;
			for (Creature* o : b.spells->creatures_in(cells, c))
			{
				const double pf = 1.0 - Dice::p_success(o->save_bonus("dex"), b.cls->breath_dc(c), 0, 21, false);
				const double expv = (pf * avg + (1.0 - pf) * avg * 0.5) * b.damage_multiplier(o, c->breath_type);
				if (o->team != c->team)
				{
					v += expv * target_value(c, o);
					foes += 1;
					if (expv >= o->hp)
					{
						v += 3.0;
					}
				}
				else
				{
					v -= expv * 3.0;
				}
			}
			if (foes < 2)
			{
				v *= 0.6;
			}
			if (v > best_v)
			{
				best_v = v;
				best = vdict({{"value", v}, {"kind", "feature"}, {"feature", std::string("breath_") + shape}, {"data", vdict({{"dir", dir}})}});
			}
		}
	}
	return best;
}

// ================================================================== metamagia

std::string AIBrain::pick_metamagic(Creature* c, const Json& sp, int slot)
{
	if (c->metamagic.empty())
	{
		return "";
	}
	const int spn = c->resources.get("sorcery_points", 0);
	if (spn <= 0 || jbool(sp, "hidden", false))
	{
		return "";
	}
	const int lvl = jint(sp, "level", 0);
	auto has_mm = [c](const char* m) { return contains(c->metamagic, std::string(m)); };
	// Acelerado: un conjuro con espacio como acción adicional si aún queda la acción para un truco
	if (has_mm("quickened") && spn >= 2 && lvl >= 1 && jstr(sp, "cast") == "action" && c->turn.bonus > 0 && slot <= 2)
	{
		return "quickened";
	}
	if (has_mm("heightened") && spn >= 2 && lvl >= 1 && sp.contains("save") && jin(jarr(sp, "tags"), "control"))
	{
		return "heightened";
	}
	if (has_mm("careful") && sp.contains("area") && sp.contains("save") && lvl >= 1)
	{
		return "careful";
	}
	if (has_mm("twinned") && sp.contains("upcast_targets") && lvl >= 1)
	{
		return "twinned";
	}
	if (has_mm("empowered") && sp.contains("damage") && lvl >= 1)
	{
		return "empowered";
	}
	if (has_mm("seeking") && sp.contains("attack") && lvl >= 1)
	{
		return "seeking";
	}
	return "";
}

// ================================================================== acciones adicionales

bool AIBrain::pre_bonus(Creature* c)
{
	if (c->turn.bonus <= 0)
	{
		return false;
	}
	const std::vector<Creature*> enemies = ai_detail::active_only(b.enemies_of(c));
	const StrList known = c->known_spells();
	auto knows = [&known](const char* sid) { return contains(known, std::string(sid)); };
	// Curar a un aliado caído con Palabra de curación
	if (knows("healing_word") && c->can_cast("healing_word") && !c->turn.slot_spell_cast)
	{
		Creature* downed = nullptr;
		for (Creature* a : b.allies_of(c, true))
		{
			if (a->is_down() && BattleMap::dist(c->cell, a->cell) <= 12 && b.map.has_los(c->cell, a->cell))
			{
				downed = a;
				break;
			}
		}
		if (downed == nullptr)
		{
			for (Creature* a : b.allies_of(c, true))
			{
				if (a->is_active() && a->hp_ratio() < 0.25 && BattleMap::dist(c->cell, a->cell) <= 12 && b.map.has_los(c->cell, a->cell))
				{
					downed = a;
					break;
				}
			}
		}
		if (downed != nullptr)
		{
			const int slot = c->free_casts.get("healing_word", 0) <= 0 ? c->lowest_slot(1) : 1;
			if (b.spells->cast(c, "healing_word", slot, vdict({{"targets", varr({downed->id})}})))
			{
				return true;
			}
		}
	}
	// Imposición de manos a un aliado caído al lado
	if (c->resources.get("lay_on_hands", 0) > 0)
	{
		for (Creature* a : b.allies_of(c, true))
		{
			if (BattleMap::dist(c->cell, a->cell) <= 1 && (a->is_down() || (a == c && c->hp_ratio() < 0.3)))
			{
				const int pool = c->resources.get("lay_on_hands", 0);
				const int amt = !a->is_down() ? std::min(pool, std::max(5, a->max_hp / 2 - a->hp)) : std::min(pool, 8);
				if (b.cls->use(c, "lay_on_hands", vdict({{"target", a->id}, {"amount", amt}})))
				{
					return true;
				}
			}
		}
	}
	// Segundo aliento
	if (c->resources.get("second_wind", 0) > 0 && c->hp_ratio() < 0.45)
	{
		if (b.cls->use(c, "second_wind"))
		{
			return true;
		}
	}
	// Poción a un aliado caído adyacente o a uno mismo muy malherido
	if (c->items.get("potion_healing", 0) + c->items.get("potion_greater_healing", 0) > 0)
	{
		for (Creature* a : b.allies_of(c, true))
		{
			if (a->is_down() && BattleMap::dist(c->cell, a->cell) <= 1)
			{
				if (b.do_potion(c, a))
				{
					return true;
				}
			}
		}
		if (c->hp_ratio() < 0.3 && c->resources.get("second_wind", 0) <= 0 && c->form.empty())
		{
			if (b.do_potion(c, c))
			{
				return true;
			}
		}
	}
	if (enemies.empty())
	{
		return false;
	}
	const int nearest = min_enemy_dist(c->cell, enemies);
	const int reach_soon = c->speed() / 5 + 2;
	// Furia: cuando el combate está a su alcance
	if (c->resources.get("rage", 0) > 0 && !c->is_raging() && nearest <= reach_soon)
	{
		if (b.cls->use(c, "rage"))
		{
			return true;
		}
	}
	// Forma salvaje: el druida sin espacios útiles se lanza como bestia
	if (c->resources.get("wild_shape", 0) > 0 && c->form.empty() && nearest <= reach_soon + 2)
	{
		const std::vector<Var> usable_spells = filter(b.spells->available(c),
			[](const Var& s) { return s.getb("usable") && s.geti("level") >= 1 && s.gets("cost") == "action"; });
		if (usable_spells.empty() || c->total_slots() == 0 ||
			(c->concentration && ai_detail::in_list(c->concentration_spell, {"moonbeam", "spike_growth", "entangle", "web"})))
		{
			std::string form = contains(c->wild_shapes, std::string("wolf")) ? "wolf" : (!c->wild_shapes.empty() ? c->wild_shapes[0] : "");
			if (nearest > 7 && contains(c->wild_shapes, std::string("elk")))
			{
				form = "elk";
			}
			if (!form.empty() && b.cls->use(c, "wild_shape", vdict({{"choice", form}})))
			{
				return true;
			}
		}
	}
	// Marca del cazador / Maleficio sobre la presa principal
	for (const char* msid : {"hunters_mark", "hex"})
	{
		if (knows(msid) && c->can_cast(msid) && !c->concentration && !c->turn.slot_spell_cast)
		{
			Creature* prey = best_enemy_near(c, c->cell, 18);
			if (prey != nullptr && (c->free_casts.get(msid, 0) > 0 || c->total_slots() >= 1))
			{
				const int slot = c->free_casts.get(msid, 0) <= 0 ? c->lowest_slot(1) : 1;
				if (b.spells->cast(c, msid, slot, vdict({{"targets", varr({prey->id})}})))
				{
					return true;
				}
			}
		}
	}
	if (!b.cls->mark_info(c).is_empty() && b.cls->mark_info(c).getb("free", false))
	{
		Creature* prey2 = best_enemy_near(c, c->cell, 18);
		if (prey2 != nullptr && b.cls->use(c, "move_mark", vdict({{"target", prey2->id}})))
		{
			return true;
		}
	}
	// Arma espiritual: invocarla o moverla
	if (knows("spiritual_weapon"))
	{
		if (b.tokens.has(Var("sw_" + c->id)))
		{
			if (move_spiritual_weapon(c))
			{
				return true;
			}
		}
		else if (c->can_cast("spiritual_weapon") && !c->turn.slot_spell_cast && !c->concentration)
		{
			Creature* tgt = best_enemy_near(c, c->cell, 12);
			if (tgt != nullptr)
			{
				const Cell place = free_adjacent(tgt->cell);
				if (place != Cell(-99, -99))
				{
					if (b.spells->cast(c, "spiritual_weapon", c->lowest_slot(2), vdict({{"cell", place}, {"targets", varr({tgt->id})}})))
					{
						return true;
					}
				}
			}
		}
	}
	// Escudo de fe sobre el frente si nos concentramos en nada
	if (knows("shield_of_faith") && !c->concentration && c->can_cast("shield_of_faith") && !c->turn.slot_spell_cast)
	{
		Creature* tank = nullptr;
		for (Creature* a : b.allies_of(c, true))
		{
			if (a->is_active() && a->ai_profile == "frontline" && BattleMap::dist(c->cell, a->cell) <= 12)
			{
				tank = a;
			}
		}
		const bool heavy_caster = knows("bless") || knows("hunters_mark");
		if (tank != nullptr && threat_at(tank, tank->cell) > 4.0 && c->total_slots() >= 2 && !heavy_caster)
		{
			if (b.spells->cast(c, "shield_of_faith", c->lowest_slot(1), vdict({{"targets", varr({tank->id})}})))
			{
				return true;
			}
		}
	}
	// Hechicería innata antes de un conjuro importante
	if (c->resources.get("innate_sorcery", 0) > 0 && !c->has_effect("innate_sorcery") && c->turn.action > 0 &&
		(enemies.size() >= 2 || has_boss(enemies)))
	{
		if (nearest <= 24 && b.cls->use(c, "innate_sorcery"))
		{
			return true;
		}
	}
	// Fuente de magia: sin espacios, crea uno
	if (c->resources.get("sorcery_points", 0) >= 2 && c->total_slots() == 0 && c->turn.action > 0)
	{
		const std::string choice = (c->level >= 3 && c->resources.get("sorcery_points", 0) >= 3) ? "2" : "1";
		if (b.cls->use(c, "create_slot", vdict({{"choice", choice}})))
		{
			return true;
		}
	}
	// Crear llama: para lanzarla con la acción
	if (knows("produce_flame") && !c->has_effect("produce_flame") && c->form.empty() && !c->is_raging() && nearest <= 14)
	{
		const std::vector<Var> better = filter(b.spells->available(c), [](const Var& s) {
			return s.getb("usable") && s.geti("level") >= 1 && s.gets("cost") == "action" && s.gets("id") != "produce_flame";
		});
		if (better.empty() || c->total_slots() <= 1)
		{
			if (b.spells->cast(c, "produce_flame", 0, Var::dict()))
			{
				return true;
			}
		}
	}
	// Paso brumoso para escapar si está rodeado y es frágil
	if (knows("misty_step") && c->can_cast("misty_step") && !c->turn.slot_spell_cast && ranged_minded(c))
	{
		if (adjacent_enemies(c, c->cell) >= 1 && c->hp_ratio() < 0.6)
		{
			const Cell cell = safest_cell_within(c, 6);
			if (cell != c->cell && b.spells->cast(c, "misty_step", c->lowest_slot(2), vdict({{"cell", cell}})))
			{
				return true;
			}
		}
	}
	// Subidón de adrenalina / Paso del viento para alcanzar al enemigo
	if (nearest > c->speed() / 5 + c->reach_cells() && nearest <= c->speed() * 2 / 5 + 1 && !ranged_minded(c) && c->turn.action > 0)
	{
		if (c->resources.get("adrenaline_rush", 0) > 0 && b.cls->use(c, "adrenaline_rush"))
		{
			return true;
		}
		if (c->cls == "monk" && c->unarmored_monk() && b.cls->use(c, "step_of_wind_free"))
		{
			return true;
		}
	}
	// Pícaro: destrabarse para disparar a gusto
	if (c->level_feature("cunning_action") && profile(c) == "skirmisher_pc")
	{
		if (adjacent_enemies(c, c->cell) > 0 && !c->turn.disengaged && c->turn.action > 0)
		{
			if (b.do_disengage(c, true))
			{
				return true;
			}
		}
	}
	// Trasgos: escabullirse si están cuerpo a cuerpo y prefieren distancia o van mal
	if (contains(c->bonus_actions, std::string("nimble_escape")) && adjacent_enemies(c, c->cell) > 0 && !c->turn.disengaged)
	{
		if (profile(c) == "archer" || (c->hp_ratio() < 0.5 && c->turn.action > 0))
		{
			if (b.do_disengage(c, true))
			{
				return true;
			}
		}
	}
	// Puntería firme (pícaro nv3): si no se ha movido y tiene objetivo a distancia
	if (c->level_feature("steady_aim") && !c->turn.moved && c->turn.action > 0)
	{
		const std::vector<Var> ranged = filter(b.attack_profiles(c), [](const Var& p) { return p.gets("kind") == "ranged"; });
		if (!ranged.empty())
		{
			for (Creature* e : enemies)
			{
				if (b.in_attack_range(c, ranged[0], e) && b.map.has_los(c->cell, e->cell) && adjacent_enemies(c, c->cell) == 0)
				{
					const Var mi = b.attack_mode(c, e, "ranged", std::nullopt, ranged[0]);
					if (mi.geti("mode") <= 0 && !ally_adjacent_to(c, e))
					{
						if (b.cls->use(c, "steady_aim"))
						{
							return true;
						}
					}
					break;
				}
			}
		}
	}
	return false;
}

bool AIBrain::has_boss(const std::vector<Creature*>& enemies) const
{
	for (Creature* e : enemies)
	{
		if (e->ai_profile == "boss" || e->max_hp >= 40)
		{
			return true;
		}
	}
	return false;
}

Cell AIBrain::safest_cell_within(Creature* c, int rng)
{
	Cell best = c->cell;
	double best_v = threat_at(c, c->cell) + adjacent_enemies(c, c->cell) * 3.0;
	for (int y = c->cell.y - rng; y <= c->cell.y + rng; ++y)
	{
		for (int x = c->cell.x - rng; x <= c->cell.x + rng; ++x)
		{
			const Cell cell(x, y);
			if (!b.map.walkable(cell) || b.creature_at(cell) != nullptr || !b.map.has_los(c->cell, cell))
			{
				continue;
			}
			const double v = threat_at(c, cell) + adjacent_enemies(c, cell) * 3.0;
			if (v < best_v - 1.0)
			{
				best_v = v;
				best = cell;
			}
		}
	}
	return best;
}

bool AIBrain::post_bonus(Creature* c)
{
	if (c->turn.bonus <= 0 && !c->turn.nick_ready)
	{
		return false;
	}
	// Ataque con la otra mano
	if (c->turn.offhand_ready)
	{
		const Var main_off = offhand_profile(c);
		if (!main_off.is_empty())
		{
			Creature* t = best_enemy_adjacent(c);
			if (t != nullptr)
			{
				b.do_attack(c, main_off.gets("key"), t, vdict({{"offhand", true}}));
				return true;
			}
		}
	}
	if (c->turn.bonus <= 0)
	{
		return false;
	}
	// Monje: ráfaga o golpe adicional
	if (c->cls == "monk" && c->unarmored_monk() && c->form.empty())
	{
		Creature* t2 = best_enemy_adjacent(c);
		if (t2 != nullptr)
		{
			if (c->resources.get("focus", 0) > 0 && (c->resources.get("focus", 0) >= 2 || t2->hp > 4))
			{
				if (b.cls->use(c, "flurry", vdict({{"target", t2->id}})))
				{
					return true;
				}
			}
			if (b.cls->use(c, "martial_strike", vdict({{"target", t2->id}})))
			{
				return true;
			}
		}
		if (c->hp_ratio() < 0.4 && adjacent_enemies(c, c->cell) > 0 && c->resources.get("focus", 0) > 0)
		{
			if (b.cls->use(c, "patient_defense"))
			{
				return true;
			}
		}
	}
	// Imposición de manos tras moverse
	if (c->resources.get("lay_on_hands", 0) > 0)
	{
		for (Creature* a : b.allies_of(c, true))
		{
			if (BattleMap::dist(c->cell, a->cell) <= 1 && (a->is_down() || a->hp_ratio() < 0.35))
			{
				const int amt = std::min(c->resources.get("lay_on_hands", 0), std::max(5, a->max_hp / 2 - a->hp));
				if (b.cls->use(c, "lay_on_hands", vdict({{"target", a->id}, {"amount", amt}})))
				{
					return true;
				}
			}
		}
	}
	// Mover arma espiritual / esfera llameante
	if (b.tokens.has(Var("sw_" + c->id)) && move_spiritual_weapon(c))
	{
		return true;
	}
	if (b.tokens.has(Var("fs_" + c->id)))
	{
		Creature* tfs = best_enemy_near(c, b.tokens.get(Var("fs_" + c->id)).get("cell").cell(), 7);
		if (tfs != nullptr && b.cls->use(c, "sphere_move", vdict({{"target", tfs->id}})))
		{
			return true;
		}
	}
	// Inspiración bárdica al aliado que más pega
	if (c->resources.get("bardic_inspiration", 0) > 0)
	{
		Creature* best = nullptr;
		double bv = 0.0;
		for (Creature* a : b.allies_of(c))
		{
			if (a->is_active() && !a->has_effect("bardic_inspiration") && BattleMap::dist(c->cell, a->cell) <= 12)
			{
				const double v = attack_power(a) + (a->ai_profile == "frontline" ? 2.0 : 0.0);
				if (v > bv)
				{
					bv = v;
					best = a;
				}
			}
		}
		if (best != nullptr && (c->resources.get("bardic_inspiration", 0) > 1 || b.enemies_of(c).size() >= 2))
		{
			if (b.cls->use(c, "bardic_inspiration", vdict({{"target", best->id}})))
			{
				return true;
			}
		}
	}
	// Pícaro se esconde tras atacar
	if (c->level_feature("cunning_action") && profile(c) == "skirmisher_pc" && c->turn.action <= 0)
	{
		if (b.can_hide(c))
		{
			if (b.do_hide(c, true))
			{
				return true;
			}
		}
	}
	// Trasgo que ya atacó: esconderse si puede
	if (contains(c->bonus_actions, std::string("nimble_escape")) && c->turn.action <= 0 && b.can_hide(c) && b.dice.rng.randf() < 0.5f)
	{
		if (b.do_hide(c, true))
		{
			return true;
		}
	}
	// Curación adicional menor
	if (contains(c->known_spells(), std::string("healing_word")) && c->can_cast("healing_word") && !c->turn.slot_spell_cast)
	{
		for (Creature* a : b.allies_of(c, true))
		{
			if (a->is_active() && a->hp_ratio() < 0.35 && BattleMap::dist(c->cell, a->cell) <= 12 && b.map.has_los(c->cell, a->cell))
			{
				const int slot = c->free_casts.get("healing_word", 0) <= 0 ? c->lowest_slot(1) : 1;
				if (b.spells->cast(c, "healing_word", slot, vdict({{"targets", varr({a->id})}})))
				{
					return true;
				}
			}
		}
	}
	return false;
}

Var AIBrain::offhand_profile(Creature* c)
{
	const std::string used = c->turn.last_weapon;
	for (const Var& p : b.attack_profiles(c))
	{
		if (p.gets("kind") == "melee" && p.get("props").contains(Var("light")) && p.get("weapon").gets("id", "") != used)
		{
			return p;
		}
	}
	return Var::dict();
}

int AIBrain::adjacent_enemies(Creature* c, const Cell& cell)
{
	int n = 0;
	for (Creature* e : b.enemies_of(c))
	{
		if (e->is_active() && !e->has_condition("incapacitated") && BattleMap::dist(cell, e->cell) <= 1)
		{
			n += 1;
		}
	}
	return n;
}

bool AIBrain::ally_adjacent_to(Creature* c, Creature* t)
{
	for (Creature* a : b.allies_of(c))
	{
		if (a->is_active() && BattleMap::dist(a->cell, t->cell) <= 1)
		{
			return true;
		}
	}
	return false;
}

Creature* AIBrain::best_enemy_adjacent(Creature* c)
{
	Creature* best = nullptr;
	for (Creature* e : b.enemies_of(c))
	{
		if (e->is_active() && BattleMap::dist(c->cell, e->cell) <= 1 && b.may_target(c, e))
		{
			if (best == nullptr || e->hp < best->hp)
			{
				best = e;
			}
		}
	}
	return best;
}

Creature* AIBrain::best_enemy_near(Creature* c, const Cell& cell, int rng)
{
	Creature* best = nullptr;
	double best_v = -1.0;
	for (Creature* e : b.enemies_of(c))
	{
		if (e->is_active() && BattleMap::dist(cell, e->cell) <= rng && b.map.has_los(cell, e->cell) && b.sees(c, e))
		{
			const double v = target_value(c, e) - BattleMap::dist(cell, e->cell) * 0.05;
			if (v > best_v)
			{
				best_v = v;
				best = e;
			}
		}
	}
	return best;
}

Cell AIBrain::free_adjacent(const Cell& cell)
{
	for (const Cell& n : BattleMap::neighbors(cell))
	{
		if (b.map.walkable(n) && b.creature_at(n) == nullptr)
		{
			return n;
		}
	}
	return Cell(-99, -99);
}

bool AIBrain::move_spiritual_weapon(Creature* c)
{
	const std::string tid = "sw_" + c->id;
	const Cell from = b.tokens.get(Var(tid)).get("cell").cell();
	Creature* best = nullptr;
	Cell best_cell = from;
	for (Creature* e : b.enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		for (const Cell& n : BattleMap::neighbors(e->cell))
		{
			if (BattleMap::dist(from, n) <= 4 && b.map.in_bounds(n))
			{
				if (best == nullptr || target_value(c, e) > target_value(c, best))
				{
					best = e;
					best_cell = n;
				}
				break;
			}
		}
	}
	if (best == nullptr)
	{
		return false;
	}
	return b.spells->spiritual_weapon_turn(c, best_cell, best);
}

// ================================================================== ejecución

Var AIBrain::choose_rider(Creature* c, const Var& p, Creature* t)
{
	const std::vector<Var> opts = b.spells->rider_options(c, p);
	if (opts.empty())
	{
		return Var::dict();
	}
	const bool important = t->ctype == "undead" || t->ctype == "fiend" || t->ai_profile == "boss" || t->max_hp >= 30;
	Var best = Var::dict();
	for (const Var& o : opts)
	{
		const Json& sp = RulesDB::spell(o.get("spell").str());
		// Áreas solo si hay varios enemigos juntos
		if (jint(sp, "rider_area", 0) > 0)
		{
			int near = 0;
			for (Creature* e : b.enemies_of(c))
			{
				if (e->is_active() && BattleMap::dist(e->cell, t->cell) <= 1)
				{
					near += 1;
				}
			}
			if (near < 2)
			{
				continue;
			}
		}
		if (jbool(sp, "concentration", false) && c->concentration)
		{
			continue;
		}
		if (o.getb("free"))
		{
			return vdict({{"spell", o.get("spell")}, {"slot", o.get("slot")}, {"crit_only", !important && t->hp > 10}});
		}
		if (best.is_empty() || o.geti("slot") < best.geti("slot"))
		{
			best = o;
		}
	}
	if (best.is_empty())
	{
		return Var::dict();
	}
	const StrList known = c->known_spells();
	const int keep_slots = (contains(known, std::string("cure_wounds")) || contains(known, std::string("bless"))) ? 1 : 0;
	if (c->total_slots() <= keep_slots)
	{
		return vdict({{"spell", best.get("spell")}, {"slot", best.get("slot")}, {"crit_only", true}});
	}
	return vdict({{"spell", best.get("spell")}, {"slot", best.get("slot")}, {"crit_only", !important}});
}

void AIBrain::execute(Creature* c, const Var& plan)
{
	if (debug)
	{
		std::printf("IA %s -> %s %s %s sc=%s\n", c->name.c_str(), plan.get("kind").str().c_str(), plan.get("target", "").str().c_str(),
			plan.get("spell", plan.get("feature", "")).str().c_str(), plan.get("score").str().c_str());
	}
	const std::vector<Cell> path = ai_detail::var_cells(plan.get("path", Var::array()));
	if (!path.empty() && plan.get("cell").cell() != c->cell)
	{
		b.do_move(c, path, plan.getb("dash", false));
		if (!c->can_act() || b.over)
		{
			return;
		}
	}
	const std::string kind = plan.gets("kind");
	if (kind == "attack")
	{
		Creature* t = b.get_creature(plan.gets("target"));
		if (t == nullptr || t->dead)
		{
			return;
		}
		const Var p = b.profile_by_key(c, plan.gets("key"));
		if (p.is_empty() || !b.in_attack_range(c, p, t))
		{
			return;
		}
		c->turn.last_weapon = p.get("weapon").gets("id", "");
		// Rasgos gratuitos al empezar a atacar
		if (!c->turn.attacked)
		{
			if (c->level_feature("reckless_attack") && p.getb("str_based", false) && reckless_worth(c, p, t))
			{
				b.cls->use(c, "reckless");
			}
			if (c->level_feature("sacred_weapon") && c->resources.get("channel_divinity", 0) > 0 && p.gets("kind") == "melee" &&
				!c->has_effect("sacred_weapon"))
			{
				b.cls->use(c, "sacred_weapon");
			}
		}
		Var opts = Var::dict();
		const Var rider = choose_rider(c, p, t);
		if (!rider.is_empty())
		{
			opts["rider"] = rider;
		}
		b.do_attack(c, plan.gets("key"), t, opts);
		// Oleada de acción: si queda un enemigo al alcance tras el ataque
		if (c->resources.get("action_surge", 0) > 0 && c->turn.action <= 0 && c->turn.attack_left <= 0 && !c->turn.action_surge_used)
		{
			if (should_surge(c))
			{
				b.cls->use(c, "action_surge");
			}
		}
	}
	else if (kind == "life_drain")
	{
		b.do_life_drain(c, b.get_creature(plan.gets("target")));
	}
	else if (kind == "spell")
	{
		b.spells->cast(c, plan.gets("spell"), plan.geti("slot"), plan.get("data"));
	}
	else if (kind == "turn_undead")
	{
		b.do_turn_undead(c);
	}
	else if (kind == "preserve_life")
	{
		b.do_preserve_life(c);
	}
	else if (kind == "divine_spark")
	{
		b.do_divine_spark(c, b.get_creature(plan.gets("target")));
	}
	else if (kind == "feature")
	{
		b.cls->use(c, plan.gets("feature"), plan.get("data", Var::dict()));
	}
	else if (kind == "escape")
	{
		b.do_escape(c);
	}
	else if (kind == "web")
	{
		b.break_web(c, b.get_creature(plan.gets("target")));
	}
	else if (kind == "stabilize")
	{
		b.do_stabilize(c, b.get_creature(plan.gets("target")));
	}
	else if (kind == "wake")
	{
		b.do_wake(c, b.get_creature(plan.gets("target")));
	}
	else if (kind == "dodge")
	{
		b.do_dodge(c);
	}
	// "dash" y "move_only": ya se movió; el siguiente paso lo reevaluará
}

bool AIBrain::should_surge(Creature* c)
{
	for (Creature* e : b.enemies_of(c))
	{
		if (e->is_active() && BattleMap::dist(c->cell, e->cell) <= 1)
		{
			return true;
		}
	}
	return false;
}

// ================================================================== recolocación y huida

void AIBrain::reposition(Creature* c)
{
	const std::string prof = profile(c);
	if ((ai_detail::in_list(prof, {"brute", "boss", "pack", "frontline", "skirmisher_melee"}) || !c->form.empty()) &&
		adjacent_enemies(c, c->cell) > 0)
	{
		return;
	}
	const std::vector<Dest> dests = destinations(c);
	if (dests.size() <= 1)
	{
		return;
	}
	Cell best_cell = c->cell;
	double best_sc = reposition_score(c, c->cell);
	std::vector<std::pair<double, Cell>> scored;
	for (const Dest& d : dests)
	{
		scored.emplace_back(reposition_score(c, d.cell), d.cell);
	}
	godot_sort(scored, [](const std::pair<double, Cell>& x, const std::pair<double, Cell>& y) { return x.first > y.first; });
	for (const auto& entry : scored)
	{
		if (entry.first <= best_sc + 0.3)
		{
			break;
		}
		const std::vector<Cell> path = path_for(c, entry.second, false);
		const double sc = entry.first - oa_cost(c, path) * 1.5 - zone_cost(c, path, entry.second);
		if (sc > best_sc + 0.3)
		{
			best_sc = sc;
			best_cell = entry.second;
		}
	}
	if (best_cell != c->cell)
	{
		b.do_move(c, path_for(c, best_cell, false));
	}
}

double AIBrain::reposition_score(Creature* c, const Cell& cell)
{
	double sc = -threat_at(c, cell) * risk_weight(c) - zone_cost(c, {}, cell);
	int md = 999;
	for (Creature* e : b.enemies_of(c))
	{
		if (e->is_active())
		{
			md = std::min(md, BattleMap::dist(cell, e->cell));
		}
	}
	if (!ranged_minded(c))
	{
		sc -= md * 0.4;
	}
	else
	{
		// tiradores: distancia media y línea de visión
		int los = 0;
		for (Creature* e : b.enemies_of(c))
		{
			if (e->is_active() && b.map.has_los(cell, e->cell))
			{
				los += 1;
			}
		}
		sc += std::min(los, 2) * 0.6;
		if (md <= 1)
		{
			sc -= 2.0;
		}
	}
	return sc;
}

void AIBrain::flee_from(Creature* c, Creature* from)
{
	if (from == nullptr)
	{
		return;
	}
	const std::vector<Dest> dests = destinations(c);
	Cell best_cell = c->cell;
	int best_d = BattleMap::dist(c->cell, from->cell);
	for (const Dest& d : dests)
	{
		const int dd = BattleMap::dist(d.cell, from->cell);
		if (dd > best_d)
		{
			best_d = dd;
			best_cell = d.cell;
		}
	}
	if (best_cell != c->cell)
	{
		b.do_move(c, path_for(c, best_cell, false));
	}
}

} // namespace mdg
