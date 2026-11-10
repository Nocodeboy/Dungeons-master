#include "MdgBattle.h"

#include "MdgClassActions.h"
#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgSort.h"
#include "MdgSpells.h"

namespace mdg
{

const StrList Battle::kPhysical = {"bludgeoning", "piercing", "slashing"};

namespace battle_detail
{

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

bool has_effect_ptr(const Creature* c, const EffectPtr& e)
{
	return std::find(c->effects.begin(), c->effects.end(), e) != c->effects.end();
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

std::vector<Cell> var_cells(const Var& v)
{
	std::vector<Cell> out;
	for (const Var& e : v.arr())
	{
		out.push_back(e.cell());
	}
	return out;
}

std::string src_id(const Creature* source)
{
	return source != nullptr ? source->id : std::string();
}

} // namespace battle_detail

Battle::Battle(BattleMap p_map, int64_t p_seed) : map(std::move(p_map)), dice(p_seed)
{
	settings = vdict({{"pc_reactions", "auto"}, {"sunlight", false}});
	tokens = Var::dict();
	spells = std::make_unique<SpellResolver>(*this);
	cls = std::make_unique<ClassActions>(*this);
}

Battle::~Battle() = default;

void Battle::changed()
{
	if (on_changed)
	{
		on_changed();
	}
}

// ================================================================== utilidades

Creature* Battle::add_creature(CreaturePtr c)
{
	Creature* raw = c.get();
	creatures.push_back(std::move(c));
	raw->reset_turn();
	return raw;
}

Creature* Battle::get_creature(const std::string& cid) const
{
	for (const CreaturePtr& c : creatures)
	{
		if (c->id == cid)
		{
			return c.get();
		}
	}
	return nullptr;
}

Occupancy Battle::occupancy() const
{
	Occupancy occ;
	for (const CreaturePtr& c : creatures)
	{
		if (!c->dead)
		{
			occ[c->cell] = c.get();
		}
	}
	return occ;
}

Creature* Battle::creature_at(const Cell& cell) const
{
	for (const CreaturePtr& c : creatures)
	{
		if (!c->dead && c->cell == cell)
		{
			return c.get();
		}
	}
	return nullptr;
}

std::vector<Creature*> Battle::allies_of(const Creature* c, bool include_self) const
{
	std::vector<Creature*> out;
	for (const CreaturePtr& o : creatures)
	{
		if (o->team == c->team && !o->dead && (include_self || o.get() != c))
		{
			out.push_back(o.get());
		}
	}
	return out;
}

std::vector<Creature*> Battle::enemies_of(const Creature* c) const
{
	std::vector<Creature*> out;
	for (const CreaturePtr& o : creatures)
	{
		if (o->team != c->team && !o->dead)
		{
			out.push_back(o.get());
		}
	}
	return out;
}

std::vector<Creature*> Battle::living(int team) const
{
	std::vector<Creature*> out;
	for (const CreaturePtr& o : creatures)
	{
		if (o->team == team && !o->dead)
		{
			out.push_back(o.get());
		}
	}
	return out;
}

std::vector<Creature*> Battle::standing(int team) const
{
	std::vector<Creature*> out;
	for (const CreaturePtr& o : creatures)
	{
		if (o->team == team && o->is_active())
		{
			out.push_back(o.get());
		}
	}
	return out;
}

std::vector<Cell> Battle::blockers_for(const Creature* a, const Creature* b) const
{
	std::vector<Cell> out;
	for (const CreaturePtr& o : creatures)
	{
		if (o.get() != a && o.get() != b && o->is_active())
		{
			out.push_back(o->cell);
		}
	}
	return out;
}

int Battle::cover(Creature* a, Creature* b, std::optional<Cell> from_cell)
{
	const Cell fc = from_cell ? *from_cell : a->cell;
	return map.cover_between(fc, b->cell, blockers_for(a, b));
}

void Battle::emit(const Var& e)
{
	events.push_back(e);
}

void Battle::log_msg(const std::string& text)
{
	log_lines.push_back(text);
	emit(vdict({{"t", "log"}, {"text", text}}));
}

std::vector<Var> Battle::pop_events()
{
	std::vector<Var> e;
	e.swap(events);
	return e;
}

bool Battle::pc_reacts(const Creature* c) const
{
	// ¿Puede esta criatura usar reacciones automáticas? (ajuste «reacciones» del jugador)
	return !c->is_pc || settings.gets("pc_reactions", "auto") != "never";
}

// ================================================================== visión y oscurecimiento

bool Battle::sees(Creature* v, Creature* t, std::optional<Cell> vcell, std::optional<Cell> tcell)
{
	if (v == t)
	{
		return true;
	}
	if (v->has_condition("blinded"))
	{
		return false;
	}
	if (t->team != v->team && t->is_invisible() && !tracks(v, t))
	{
		return false;
	}
	if (zones.empty())
	{
		return true;
	}
	const Cell vc = vcell ? *vcell : v->cell;
	const Cell tc = tcell ? *tcell : t->cell;
	return clear_sight(v, vc, tc);
}

bool Battle::tracks(const Creature* v, const Creature* t) const
{
	for (const EffectPtr& e : t->get_effects("mind_spiked"))
	{
		if (e->source == v)
		{
			return true;
		}
	}
	return false;
}

int Battle::obscure_at(const Cell& cell) const
{
	int o = 0;
	for (const Var& z : zones)
	{
		if (z.getf("obscure", 0) > o && z.get("set").has(Var(cell)))
		{
			o = z.geti("obscure");
		}
	}
	return o;
}

bool Battle::clear_sight(Creature* v, const Cell& vc, const Cell& tc) const
{
	bool has_heavy = false;
	for (const Var& z : zones)
	{
		if (z.geti("obscure", 0) >= 2)
		{
			has_heavy = true;
			break;
		}
	}
	if (!has_heavy)
	{
		return true;
	}
	for (const Cell& cell : BattleMap::cells_on_segment(BattleMap::center(vc), BattleMap::center(tc), 0.3))
	{
		const int o = obscure_at(cell);
		if (o == 2)
		{
			return false;
		}
		if (o == 3 && !(v->has_trait("devils_sight") && BattleMap::dist(vc, tc) <= 24))
		{
			return false;
		}
	}
	return true;
}

// ================================================================== flujo del combate

void Battle::start()
{
	round_num = 0;
	order.clear();
	for (const CreaturePtr& cp : creatures)
	{
		Creature* c = cp.get();
		c->reset_turn();
		int mode = 0;
		if (c->has_trait("remarkable_athlete"))
		{
			mode = 1;
		}
		if (surprised.has(c->id))
		{
			mode = mode == 0 ? -1 : 0;
		}
		const D20Roll r = dice.d20(mode, c->has_trait("luck"));
		c->initiative = r.natural + c->initiative_bonus();
		order.push_back(c);
		emit(vdict({{"t", "initiative"}, {"who", c->id}, {"roll", c->initiative}}));
	}
	godot_sort(order, [](Creature* a, Creature* b) {
		if (a->initiative != b->initiative)
		{
			return a->initiative > b->initiative;
		}
		if (a->mod("dex") != b->mod("dex"))
		{
			return a->mod("dex") > b->mod("dex");
		}
		return a->team < b->team;
	});
	// Metabolismo asombroso: el monje recupera foco al tirar iniciativa
	for (const CreaturePtr& cp : creatures)
	{
		Creature* c = cp.get();
		if (c->resources.get("uncanny_metabolism", 0) > 0 &&
			(c->resources.get("focus", 0) < c->resources_max.get("focus", 0) || c->hp < c->max_hp))
		{
			c->resources["uncanny_metabolism"] -= 1;
			c->resources["focus"] = c->resources_max.get("focus", 0);
			emit(vdict({{"t", "feature"}, {"who", c->id}, {"feature", "uncanny_metabolism"}}));
			log_msg(Loc::t("log.uncanny_metabolism", vdict({{"who", nm(c)}})));
			heal(c, dice.roll(c->martial_die).total + c->level, c, true);
		}
	}
	// Los que se acercaron sin ser vistos empiezan ocultos (ventaja en su primer ataque)
	for (const auto& kv : start_hidden)
	{
		Creature* hc = get_creature(kv.first);
		if (hc != nullptr && !hc->dead)
		{
			hc->hidden_stealth = kv.second;
			EffectPtr he = make_effect("hidden");
			he->name = Loc::cond("invisible");
			he->source = hc;
			he->positive = true;
			he->grants = {"invisible"};
			attach_effect(hc, he);
		}
	}
	turn_index = -1;
	next_turn();
}

void Battle::next_turn()
{
	if (check_end() || order.empty())
	{
		return;
	}
	int guard = 0;
	while (guard < 200)
	{
		guard += 1;
		turn_index += 1;
		if (turn_index >= static_cast<int>(order.size()))
		{
			turn_index = 0;
		}
		if (turn_index == 0)
		{
			round_num += 1;
			emit(vdict({{"t", "round"}, {"n", round_num}}));
			log_msg(Loc::t("log.round", vdict({{"n", round_num}})));
		}
		Creature* c = order[static_cast<size_t>(turn_index)];
		if (c->dead)
		{
			continue;
		}
		current = c;
		begin_turn(c);
		if (over)
		{
			return;
		}
		if (c->dead)
		{
			continue;
		}
		// Si no puede actuar en absoluto, el turno pasa solo
		if (!c->is_active() || (c->has_condition("incapacitated") && !can_still_move(c)) || c->has_effect("command_skip"))
		{
			finish_turn(c);
			if (over)
			{
				return;
			}
			continue;
		}
		return;
	}
}

bool Battle::can_still_move(const Creature* c) const
{
	// Expulsar muertos vivientes: incapacitado pero huye (se mueve)
	return c->has_effect("turned") && c->speed() > 0;
}

void Battle::begin_turn(Creature* c)
{
	c->reset_turn();
	turn_counter += 1;
	emit(vdict({{"t", "turn"}, {"who", c->id}, {"round", round_num}}));
	// Caducan efectos de inicio de turno de esta criatura
	expire_effects("start_turn", c);
	tick_rounds(c);
	tick_zones(c);
	start_turn_effects(c);
	if (c->dead || over)
	{
		return;
	}
	zone_turn_trigger(c, "start");
	// Reconsidera velocidad tras expirar efectos
	c->turn.movement = c->speed();
	c->turn.undo_movement = c->turn.movement;
	// Orden imperiosa: arrodillarse o quedarse quieto
	EffectPtr cmd = c->get_effect("command");
	if (cmd)
	{
		const std::string which = cmd->data.gets("cmd", "grovel");
		remove_effect(cmd, false);
		if (which == "grovel")
		{
			add_condition(c, "prone", "command");
			log_msg(Loc::t("log.command_grovel", vdict({{"who", nm(c)}})));
		}
		else
		{
			log_msg(Loc::t("log.command_halt", vdict({{"who", nm(c)}})));
		}
		EffectPtr skip = make_effect("command_skip");
		skip->expires = "end_turn";
		skip->expires_who = c;
		attach_effect(c, skip);
	}
	// La furia acaba si queda incapacitado
	if (c->is_raging() && c->has_condition("incapacitated"))
	{
		end_rage(c);
	}
	// Tiradas de muerte
	if (c->is_pc && c->is_down() && !c->stable)
	{
		death_save(c);
	}
	changed();
}

void Battle::start_turn_effects(Creature* c)
{
	const std::vector<EffectPtr> snapshot = c->effects;
	for (const EffectPtr& e : snapshot)
	{
		if (!battle_detail::has_effect_ptr(c, e) || c->dead)
		{
			continue;
		}
		const Var dot = e->data.get("dot", Var::dict());
		if (!dot.is_empty() && dot.gets("when", "") == "start_turn")
		{
			if (e->kind == "ensnared" && !c->has_condition("restrained"))
			{
				continue;
			}
			const int amount = dice.roll(dot.get("dice").str()).total;
			log_msg(Loc::t("log.dot", vdict({{"who", nm(c)}, {"effect", e->name}})));
			apply_damage(c, amount, dot.get("type").str(), e->source, vdict({{"magic", true}, {"dot", true}}));
			if (c->dead || !battle_detail::has_effect_ptr(c, e))
			{
				continue;
			}
			if (dot.has("then_save"))
			{
				const Var r = saving_throw(c, dot.get("then_save").str(), dot.geti("dc", 10), e->source);
				if (r.getb("success"))
				{
					remove_effect(e);
				}
			}
		}
		if (e->kind == "heroism" && battle_detail::has_effect_ptr(c, e))
		{
			const int amt = std::max(0, e->data.geti("temp", 0));
			if (amt > c->temp_hp)
			{
				c->temp_hp = amt;
				emit(vdict({{"t", "temp_hp"}, {"who", c->id}, {"amount", amt}}));
			}
		}
	}
}

void Battle::end_turn()
{
	if (over || current == nullptr)
	{
		return;
	}
	Creature* c = current;
	finish_turn(c);
	if (!over)
	{
		next_turn();
	}
	changed();
}

void Battle::finish_turn(Creature* c)
{
	// Salvaciones de final de turno
	const std::vector<EffectPtr> snapshot = c->effects;
	for (const EffectPtr& e : snapshot)
	{
		if (!battle_detail::has_effect_ptr(c, e) || c->dead)
		{
			continue;
		}
		if (e->kind == "hold_person")
		{
			const Var r = saving_throw(c, "wis", e->data.geti("dc"), e->source);
			if (r.getb("success"))
			{
				remove_effect(e);
				log_msg(Loc::t("log.hold_end", vdict({{"who", nm(c)}})));
			}
			continue;
		}
		if (e->kind == "sleep")
		{
			if (e->data.geti("stage", 1) == 1)
			{
				const Var r2 = saving_throw(c, "wis", e->data.geti("dc"), e->source);
				if (r2.getb("success"))
				{
					remove_effect(e);
					log_msg(Loc::t("log.sleep_resist", vdict({{"who", nm(c)}})));
				}
				else
				{
					e->data["stage"] = 2;
					e->grants = {"unconscious"};
					log_msg(Loc::t("log.sleep_stage2", vdict({{"who", nm(c)}})));
					emit(vdict({{"t", "condition"}, {"who", c->id}, {"cond", "unconscious"}, {"on", true}}));
				}
			}
			continue;
		}
		const Var dot = e->data.get("dot", Var::dict());
		if (!dot.is_empty() && dot.gets("when", "") == "end_turn")
		{
			log_msg(Loc::t("log.dot", vdict({{"who", nm(c)}, {"effect", e->name}})));
			apply_damage(c, dice.roll(dot.get("dice").str()).total, dot.get("type").str(), e->source, vdict({{"magic", true}, {"dot", true}}));
			if (c->dead)
			{
				break;
			}
		}
		const Var se = e->data.get("save_end", Var::dict());
		if (!se.is_empty() && se.gets("when", "end_turn") == "end_turn" && battle_detail::has_effect_ptr(c, e))
		{
			const Var r3 = saving_throw(c, se.get("ability").str(), se.geti("dc", 10), e->source);
			if (r3.getb("success"))
			{
				remove_effect(e);
				log_msg(Loc::t("log.effect_end", vdict({{"effect", e->name}, {"who", nm(c)}})));
			}
		}
	}
	if (!c->dead)
	{
		zone_turn_trigger(c, "end");
		flaming_sphere_end_turn(c);
	}
	// Mantener la furia
	EffectPtr rage = c->get_effect("rage");
	if (rage)
	{
		if (rage->data.getb("fresh", false))
		{
			rage->data["fresh"] = false;
		}
		else if (!c->turn.rage_extended)
		{
			end_rage(c);
		}
	}
	expire_effects("end_turn", c);
	expire_end_turn_next(c);
	emit(vdict({{"t", "turn_end"}, {"who", c->id}}));
	check_end();
}

bool Battle::check_end()
{
	if (over)
	{
		return true;
	}
	const size_t pcs_up = standing(0).size();
	int foes_alive = 0;
	for (const CreaturePtr& c : creatures)
	{
		if (c->team == 1 && !c->dead)
		{
			foes_alive += 1;
		}
	}
	if (foes_alive == 0)
	{
		over = true;
		winner = 0;
		log_msg(Loc::t("log.victory"));
		emit(vdict({{"t", "end"}, {"winner", 0}}));
		return true;
	}
	if (pcs_up == 0)
	{
		over = true;
		winner = 1;
		log_msg(Loc::t("log.defeat"));
		emit(vdict({{"t", "end"}, {"winner", 1}}));
		return true;
	}
	return false;
}

// ================================================================== efectos

EffectPtr Battle::attach_effect(Creature* target, const EffectPtr& e)
{
	e->owner = target;
	target->effects.push_back(e);
	for (const std::string& g : e->grants)
	{
		emit(vdict({{"t", "condition"}, {"who", target->id}, {"cond", g}, {"on", true}}));
	}
	if (!e->name.empty())
	{
		emit(vdict({{"t", "effect"}, {"who", target->id}, {"kind", e->kind}, {"name", e->name}, {"on", true}, {"positive", e->positive}}));
	}
	return e;
}

void Battle::remove_effect(const EffectPtr& e, bool announce)
{
	(void)announce;
	if (!e)
	{
		return;
	}
	Creature* o = e->owner;
	if (o == nullptr || !battle_detail::has_effect_ptr(o, e))
	{
		return;
	}
	// Se guarda una referencia: borrarlo de la lista no debe destruirlo aún
	const EffectPtr keep = e;
	o->effects.erase(std::find(o->effects.begin(), o->effects.end(), keep));
	for (const std::string& g : keep->grants)
	{
		if (!o->has_condition(g))
		{
			emit(vdict({{"t", "condition"}, {"who", o->id}, {"cond", g}, {"on", false}}));
		}
	}
	if (!keep->name.empty())
	{
		emit(vdict({{"t", "effect"}, {"who", o->id}, {"kind", keep->kind}, {"name", keep->name}, {"on", false}}));
	}
	// Fin de efectos concretos
	const std::string& k = keep->kind;
	if (k == "aid")
	{
		const int amt = keep->data.geti("amount", 5);
		o->max_hp = std::max(1, o->max_hp - amt);
		o->hp = std::min(o->hp, o->max_hp);
	}
	else if (k == "spiritual_weapon_ctrl" || k == "flaming_sphere_ctrl")
	{
		const std::string tid = keep->data.gets("token", "");
		if (tokens.has(Var(tid)))
		{
			tokens.erase(Var(tid));
			emit(vdict({{"t", "unsummon"}, {"id", tid}}));
		}
	}
	else if (k == "zone_link")
	{
		remove_zone(keep->data.geti("zone", -1));
	}
	else if (k == "wild_shape")
	{
		revert_form(o);
	}
	else if (k == "enlarged" || k == "reduced")
	{
		emit(vdict({{"t", "resize"}, {"who", o->id}}));
	}
	// Si era el registro de concentración, deshace los efectos enlazados
	if (k == "concentration")
	{
		const Var linked = keep->data.get("linked", Var::array());
		for (const Var& l : linked.arr())
		{
			remove_effect(l.effect());
		}
		if (o->concentration == keep)
		{
			o->concentration = nullptr;
			o->concentration_spell.clear();
		}
	}
}

void Battle::expire_effects(const std::string& when, const Creature* who)
{
	for (const CreaturePtr& cp : creatures)
	{
		const std::vector<EffectPtr> snapshot = cp->effects;
		for (const EffectPtr& e : snapshot)
		{
			if (e->expires == when && e->expires_who == who && battle_detail::has_effect_ptr(cp.get(), e))
			{
				remove_effect(e);
			}
		}
	}
}

void Battle::tick_rounds(Creature* who)
{
	// Las duraciones en rondas cuentan al inicio del turno de quien creó el efecto.
	for (const CreaturePtr& cp : creatures)
	{
		const std::vector<EffectPtr> snapshot = cp->effects;
		for (const EffectPtr& e : snapshot)
		{
			if (e->rounds_left > 0 && e->source == who && battle_detail::has_effect_ptr(cp.get(), e))
			{
				e->rounds_left -= 1;
				if (e->rounds_left <= 0)
				{
					if (e->kind == "concentration")
					{
						end_concentration(who);
					}
					else
					{
						remove_effect(e);
					}
				}
			}
		}
	}
}

void Battle::add_condition(Creature* c, const std::string& cond, const std::string& source)
{
	const bool had = c->has_condition(cond);
	if (c->add_condition(cond, source) && !had)
	{
		emit(vdict({{"t", "condition"}, {"who", c->id}, {"cond", cond}, {"on", true}}));
		log_msg(Loc::t("log.condition_on", vdict({{"who", nm(c)}, {"cond", utf8_lower(Loc::cond(cond))}})));
	}
}

void Battle::remove_condition(Creature* c, const std::string& cond, const std::string& source)
{
	const bool had = c->has_condition(cond);
	c->remove_condition(cond, source);
	if (had && !c->has_condition(cond))
	{
		emit(vdict({{"t", "condition"}, {"who", c->id}, {"cond", cond}, {"on", false}}));
	}
}

EffectPtr Battle::start_concentration(Creature* caster, const std::string& spell_id, int rounds)
{
	end_concentration(caster);
	EffectPtr ce = make_effect("concentration");
	ce->source = caster;
	ce->rounds_left = rounds;
	ce->data = vdict({{"linked", Var::array()}, {"spell", spell_id}});
	ce->name = "";
	attach_effect(caster, ce);
	caster->concentration = ce;
	caster->concentration_spell = spell_id;
	emit(vdict({{"t", "concentration"}, {"who", caster->id}, {"spell", spell_id}, {"on", true}}));
	return ce;
}

void Battle::link_to_concentration(Creature* caster, const EffectPtr& e)
{
	if (caster->concentration && e)
	{
		caster->concentration->data["linked"].push(Var(e));
		e->concentration = true;
	}
}

void Battle::end_concentration(Creature* caster, bool announce)
{
	if (!caster->concentration)
	{
		return;
	}
	const std::string sp = caster->concentration_spell;
	const EffectPtr ce = caster->concentration;
	caster->concentration = nullptr;
	caster->concentration_spell.clear();
	if (announce)
	{
		log_msg(Loc::t("log.conc_lost", vdict({{"who", nm(caster)}, {"spell", jstr(RulesDB::spell(sp), "name", sp)}})));
	}
	emit(vdict({{"t", "concentration"}, {"who", caster->id}, {"spell", sp}, {"on", false}}));
	remove_effect(ce);
}

EffectPtr Battle::apply_effect_spec(Creature* target, const Var& spec, Creature* caster, const std::string& sid, int slot, int dc, bool link)
{
	if (target == nullptr || target->dead)
	{
		return nullptr;
	}
	const Var grants = spec.get("grants", Var::array());
	for (const Var& gv : grants.arr())
	{
		const std::string g = gv.as_str();
		if (contains(target->condition_immune, g))
		{
			emit(vdict({{"t", "immune"}, {"who", target->id}, {"what", g}}));
			return nullptr;
		}
		if (g == "frightened" && target->has_effect("heroism"))
		{
			emit(vdict({{"t", "immune"}, {"who", target->id}, {"what", g}}));
			return nullptr;
		}
		if ((g == "charmed" || g == "frightened") && target->has_effect("prot_evil") && caster != nullptr &&
			contains(Creature::kProtEvilTypes, caster->ctype))
		{
			emit(vdict({{"t", "immune"}, {"who", target->id}, {"what", g}}));
			return nullptr;
		}
	}
	const Json& sp = RulesDB::spell(sid);
	EffectPtr e = make_effect(spec.has("kind") ? spec.get("kind").str() : std::string("effect"));
	e->name = spec.has("name") ? spec.get("name").str() : jstr(sp, "name", "");
	e->source = caster;
	e->positive = spec.getb("positive", false);
	e->grants = grants.str_list();
	e->spell_id = sid;
	e->data = spec.get("data", Var::dict()).duplicate(true);
	if (!e->data.is_dict())
	{
		e->data = Var::dict();
	}
	const int base_lvl = jint(sp, "level", 1);
	if (spec.has("save_end"))
	{
		Var se = spec.get("save_end").duplicate();
		se["dc"] = dc;
		e->data["save_end"] = se;
	}
	if (spec.has("dot"))
	{
		Var dot = spec.get("dot").duplicate();
		std::string expr = dot.get("dice").as_str();
		if (dot.has("upcast") && slot > base_lvl)
		{
			expr = Dice::add_dice(expr, Dice::parse(dot.get("upcast").str()).count * (slot - base_lvl));
		}
		dot["dice"] = expr;
		dot["dc"] = dc;
		e->data["dot"] = dot;
	}
	if (spec.has("escape"))
	{
		e->data["escape"] = vdict({{"skill", spec.get("escape")}, {"dc", dc}});
	}
	if (spec.getb("ends_on_damage_from_team", false) && caster != nullptr)
	{
		e->data["ends_on_team"] = caster->team;
	}
	const std::string ex = spec.gets("expires", "");
	if (!ex.empty())
	{
		const size_t colon = ex.find(':');
		const std::string first = colon == std::string::npos ? ex : ex.substr(0, colon);
		const std::string second = colon == std::string::npos ? std::string() : ex.substr(colon + 1);
		Creature* who = (colon == std::string::npos || second == "caster") ? caster : target;
		e->expires = first;
		e->expires_who = who;
		if (e->expires == "end_turn_next")
		{
			e->data["skip_first_end"] = (current == who);
		}
	}
	if (spec.has("rounds"))
	{
		e->rounds_left = spec.geti("rounds");
	}
	attach_effect(target, e);
	if (link && caster != nullptr && jbool(sp, "concentration", false) && caster->concentration && caster->concentration_spell == sid)
	{
		link_to_concentration(caster, e);
	}
	return e;
}

// ================================================================== zonas

int Battle::add_zone(Var z)
{
	zone_seq_ += 1;
	z["id"] = zone_seq_;
	Var st = Var::dict();
	for (const Var& cell : z.get("cells").arr())
	{
		st[cell] = true;
	}
	z["set"] = st;
	z["hits"] = Var::dict();
	zones.push_back(z);
	refresh_zone_overlay();
	emit(vdict({{"t", "zone"}, {"id", z.get("id")}, {"kind", z.get("kind", "")}, {"cells", z.get("cells").duplicate()},
		{"color", z.get("color", "#ffffff")}, {"on", true}}));
	return z.geti("id");
}

void Battle::remove_zone(int zid)
{
	const std::vector<Var> snapshot = zones;
	for (const Var& z : snapshot)
	{
		if (z.geti("id") == zid)
		{
			for (auto it = zones.begin(); it != zones.end(); ++it)
			{
				if (*it == z)
				{
					zones.erase(it);
					break;
				}
			}
			emit(vdict({{"t", "zone"}, {"id", zid}, {"on", false}}));
		}
	}
	refresh_zone_overlay();
}

Var Battle::get_zone(int zid) const
{
	for (const Var& z : zones)
	{
		if (z.geti("id") == zid)
		{
			return z;
		}
	}
	return Var::dict();
}

void Battle::move_zone(int zid, const Var& cells)
{
	Var z = get_zone(zid);
	if (z.is_empty())
	{
		return;
	}
	z["cells"] = cells;
	Var st = Var::dict();
	for (const Var& cell : cells.arr())
	{
		st[cell] = true;
	}
	z["set"] = st;
	refresh_zone_overlay();
	emit(vdict({{"t", "zone"}, {"id", zid}, {"kind", z.get("kind", "")}, {"cells", cells.duplicate()}, {"color", z.get("color", "#ffffff")},
		{"on", true}, {"moved", true}}));
}

std::vector<Var> Battle::zones_at(const Cell& cell) const
{
	std::vector<Var> out;
	for (const Var& z : zones)
	{
		if (z.get("set").has(Var(cell)))
		{
			out.push_back(z);
		}
	}
	return out;
}

void Battle::refresh_zone_overlay()
{
	std::vector<Cell> diff;
	std::vector<Cell> hazard;
	for (const Var& z : zones)
	{
		if (z.getb("difficult", false))
		{
			for (const Cell& c : battle_detail::var_cells(z.get("cells")))
			{
				diff.push_back(c);
			}
		}
		if (z.has("per_cell") || z.getb("enter_damage", false) || z.has("enter"))
		{
			for (const Cell& c : battle_detail::var_cells(z.get("cells")))
			{
				hazard.push_back(c);
			}
		}
	}
	map.set_overlay(diff, hazard);
}

void Battle::tick_zones(const Creature* who)
{
	const std::vector<Var> snapshot = zones;
	for (Var z : snapshot)
	{
		if (z.get("owner").creature() == who && who != nullptr && z.geti("rounds_left", -1) > 0)
		{
			z["rounds_left"] = z.geti("rounds_left") - 1;
			if (z.geti("rounds_left") <= 0)
			{
				remove_zone(z.geti("id"));
			}
		}
	}
}

void Battle::zone_turn_trigger(Creature* c, const std::string& when)
{
	for (const Var& z : zones_at(c->cell))
	{
		if (c->dead || !c->is_active())
		{
			return;
		}
		if (z.has(Var(when)))
		{
			zone_save(c, z, z.get(Var(when)));
		}
		if (when == "end" && z.getb("end_damage", false))
		{
			zone_damage_save(c, z);
		}
	}
}

void Battle::zone_enter(Creature* c, const Cell& cell, const Cell& prev)
{
	for (const Var& z : zones_at(cell))
	{
		if (c->dead)
		{
			return;
		}
		const Var per = z.get("per_cell", Var::dict());
		if (!per.is_empty())
		{
			const int amt = dice.roll(per.get("dice").str()).total;
			log_msg(Loc::t("log.zone_spikes", vdict({{"who", nm(c)}})));
			apply_damage(c, amt, per.get("type").str(), z.get("owner").creature(), vdict({{"magic", true}}));
			if (c->dead || !c->is_active())
			{
				return;
			}
		}
		if (z.get("set").has(Var(prev)))
		{
			continue;
		}
		if (z.has("enter"))
		{
			zone_save(c, z, z.get("enter"));
		}
		if (z.getb("enter_damage", false))
		{
			zone_damage_save(c, z);
		}
	}
}

void Battle::zone_save(Creature* c, Var z, const Var& trig)
{
	const std::string fail = trig.gets("fail", "");
	const std::string key = format("%d:%s", z.geti("id"), fail.c_str());
	if (fail == "effect")
	{
		// telaraña: una vez por turno y no si ya está atrapado
		for (const EffectPtr& e : c->effects)
		{
			if (e->data.get("zone", -1) == Var(z.geti("id")))
			{
				return;
			}
		}
		if (z.get("hits").geti(Var(c->id + key), -1) == turn_counter)
		{
			return;
		}
	}
	z["hits"][Var(c->id + key)] = turn_counter;
	if (fail == "prone" && c->has_condition("prone"))
	{
		return;
	}
	Creature* owner = z.get("owner").creature();
	const Var r = saving_throw(c, trig.get("save").str(), z.geti("dc", 10), owner);
	if (r.getb("success"))
	{
		return;
	}
	if (fail == "prone")
	{
		add_condition(c, "prone", "zone");
	}
	else if (fail == "effect")
	{
		const Var spec = z.get("effect", Var::dict());
		if (!spec.is_empty())
		{
			EffectPtr e = apply_effect_spec(c, spec, owner, z.gets("spell", ""), 0, z.geti("dc", 10), true);
			if (e)
			{
				e->data["zone"] = z.geti("id");
			}
		}
	}
}

void Battle::zone_damage_save(Creature* c, Var z)
{
	if (z.get("hits").geti(Var(c->id), -1) == turn_counter)
	{
		return;
	}
	z["hits"][Var(c->id)] = turn_counter;
	Creature* owner = z.get("owner").creature();
	const Var dmg = z.get("damage", Var::dict());
	if (dmg.is_empty())
	{
		return;
	}
	const int total = dice.roll(dmg.get("dice").str()).total;
	const Var r = saving_throw(c, z.get("save", "con").str(), z.geti("dc", 10), owner);
	const int amount = !r.getb("success") ? total : total / 2;
	emit(vdict({{"t", "zone_hit"}, {"id", z.get("id")}, {"who", c->id}}));
	apply_damage(c, amount, dmg.get("type").str(), owner, vdict({{"magic", true}}));
	if (!r.getb("success") && z.gets("kind", "") == "moonbeam" && !c->form.empty())
	{
		EffectPtr ws = c->get_effect("wild_shape");
		if (ws)
		{
			remove_effect(ws);
		}
	}
}

// ================================================================== tiradas de salvación

Var Battle::saving_throw(Creature* c, const std::string& ab, int dc, Creature* source, const Var& opts)
{
	if (opts.getb("auto_success", false))
	{
		emit(vdict({{"t", "save"}, {"who", c->id}, {"ability", ab}, {"dc", dc}, {"total", 99}, {"natural", 20}, {"success", true},
			{"auto_fail", false}, {"careful", true}}));
		return vdict({{"who", c->id}, {"ability", ab}, {"dc", dc}, {"natural", 20}, {"rolls", varr({20})}, {"bonus", 0}, {"bless", 0},
			{"total", 99}, {"success", true}, {"auto_fail", false}, {"mode", 0}});
	}
	bool auto_fail = false;
	if ((ab == "str" || ab == "dex") && (c->has_condition("paralyzed") || c->has_condition("unconscious") || c->has_condition("stunned")))
	{
		auto_fail = true;
	}
	int adv = 0;
	int dis = 0;
	if (ab == "dex" && c->has_effect("dodge") && c->speed() > 0 && !c->has_condition("incapacitated"))
	{
		adv += 1;
	}
	if (ab == "dex" && c->has_condition("restrained"))
	{
		dis += 1;
	}
	if (ab == "dex" && c->has_trait("danger_sense") && !c->has_condition("incapacitated"))
	{
		adv += 1;
	}
	if (ab == "str" && (c->is_raging() || c->has_effect("enlarged")))
	{
		adv += 1;
	}
	if (ab == "str" && (c->has_effect("reduced") || c->has_effect("enfeebled")))
	{
		dis += 1;
	}
	if ((ab == "int" || ab == "wis" || ab == "cha") && c->has_trait("gnomish_cunning"))
	{
		adv += 1;
	}
	const std::string vs = opts.gets("vs", "");
	if (vs == "poisoned" && (c->has_trait("dwarven_resilience") || c->has_effect("antitoxin")))
	{
		adv += 1;
	}
	if (vs == "frightened" && c->has_trait("brave"))
	{
		adv += 1;
	}
	if (vs == "charmed" && c->has_trait("fey_ancestry"))
	{
		adv += 1;
	}
	if ((vs == "charmed" || vs == "frightened") && c->has_effect("prot_evil") && source != nullptr &&
		contains(Creature::kProtEvilTypes, source->ctype))
	{
		adv += 1;
	}
	if (opts.getb("conc", false) && (c->has_trait("eldritch_mind") || c->has_effect("extended_conc")))
	{
		adv += 1;
	}
	if (opts.getb("advantage", false))
	{
		adv += 1;
	}
	if (opts.getb("disadvantage", false))
	{
		dis += 1;
	}
	int mode = 0;
	if (adv > 0 && dis == 0)
	{
		mode = 1;
	}
	else if (dis > 0 && adv == 0)
	{
		mode = -1;
	}
	D20Roll r = dice.d20(mode, c->has_trait("luck"));
	int bonus = c->save_bonus(ab);
	int bless = 0;
	if (c->has_effect("bless"))
	{
		bless += dice.die(4);
	}
	if (c->has_effect("bane"))
	{
		bless -= dice.die(4);
	}
	if (c->has_effect("warding_bond"))
	{
		bonus += 1;
	}
	int total = r.natural + bonus + bless + opts.geti("bonus", 0);
	bool success = total >= dc && !auto_fail;
	// Inspiración bárdica y heroica para salvar una tirada fallida
	if (!success && !auto_fail)
	{
		EffectPtr bi = c->get_effect("bardic_inspiration");
		if (bi && total + Dice::max_value(bi->data.get("die", "1d6").str()) >= dc)
		{
			const int extra = dice.roll(bi->data.get("die", "1d6").str()).total;
			remove_effect(bi);
			total += extra;
			success = total >= dc;
			emit(vdict({{"t", "inspiration"}, {"who", c->id}, {"amount", extra}, {"kind", "bardic"}}));
			log_msg(Loc::t("log.bardic_used", vdict({{"who", nm(c)}, {"n", extra}})));
		}
		if (!success && c->resources.get("heroic_inspiration", 0) > 0 && c->is_pc && !opts.getb("conc", false))
		{
			c->resources["heroic_inspiration"] -= 1;
			const D20Roll r2 = dice.d20(mode, c->has_trait("luck"));
			const int total2 = r2.natural + bonus + bless + opts.geti("bonus", 0);
			emit(vdict({{"t", "inspiration"}, {"who", c->id}, {"amount", 0}, {"kind", "heroic"}}));
			log_msg(Loc::t("log.heroic_used", vdict({{"who", nm(c)}})));
			if (total2 > total)
			{
				total = total2;
				r = r2;
			}
			success = total >= dc;
		}
	}
	Var res = vdict({{"who", c->id}, {"ability", ab}, {"dc", dc}, {"natural", r.natural}, {"rolls", Var::array_of(r.rolls)}, {"bonus", bonus},
		{"bless", bless}, {"total", total}, {"success", success}, {"auto_fail", auto_fail}, {"mode", mode}});
	emit(vdict({{"t", "save"}, {"who", c->id}, {"ability", ab}, {"dc", dc}, {"total", total}, {"natural", r.natural}, {"success", success},
		{"auto_fail", auto_fail}}));
	if (!opts.getb("silent", false))
	{
		log_msg(Loc::t(success ? "log.save_ok" : "log.save_fail",
			vdict({{"who", nm(c)}, {"ability", Loc::ability(ab)}, {"total", total}, {"dc", dc}})));
	}
	return res;
}

Var Battle::ability_check(Creature* c, const std::string& skill, int mode)
{
	auto worsen = [](int m) { return m == 0 ? -1 : (m > 0 ? 0 : -1); };
	auto improve = [](int m) { return m == 0 ? 1 : (m < 0 ? 0 : 1); };
	if (c->has_condition("poisoned") || c->has_condition("frightened"))
	{
		mode = worsen(mode);
	}
	const std::string ab = Creature::skill_ability(skill);
	if (ab == "str" && (c->is_raging() || c->has_effect("enlarged")))
	{
		mode = improve(mode);
	}
	if (ab == "str" && (c->has_effect("reduced") || c->has_effect("enfeebled")))
	{
		mode = worsen(mode);
	}
	if (skill == "athletics" && c->has_trait("remarkable_athlete"))
	{
		mode = improve(mode);
	}
	if (contains(c->item_adv, skill))
	{
		mode = improve(mode);
	}
	if (skill == "stealth" && jbool(c->armor_data(), "stealth_dis", false))
	{
		mode = worsen(mode);
	}
	const D20Roll r = dice.d20(mode, c->has_trait("luck"));
	const int total = r.natural + c->skill_bonus(skill);
	return vdict({{"natural", r.natural}, {"total", total}});
}

// ================================================================== daño y curación

double Battle::damage_multiplier(const Creature* target, const std::string& dtype) const
{
	if (contains(target->immune, dtype))
	{
		return 0.0;
	}
	double m = 1.0;
	if (contains(target->resist, dtype) || target->has_effect("warding_bond") || (target->is_raging() && contains(kPhysical, dtype)))
	{
		m = 0.5;
	}
	if (contains(target->vulnerable, dtype))
	{
		m *= 2.0;
	}
	return m;
}

int Battle::apply_damage(Creature* target, int amount, const std::string& dtype, Creature* source, const Var& opts)
{
	if (target->dead || amount <= 0)
	{
		return 0;
	}
	const bool crit = opts.getb("crit", false);
	int dmg = amount;
	const bool raw = opts.getb("raw", false);
	const std::string sid = battle_detail::src_id(source);
	if (!raw && contains(target->immune, dtype))
	{
		log_msg(Loc::t("log.damage_immune", vdict({{"target", nm(target)}, {"type", Loc::dmg_type(dtype)}})));
		emit(vdict({{"t", "damage"}, {"who", target->id}, {"amount", 0}, {"type", dtype}, {"hp", target->hp}, {"max", target->max_hp},
			{"immune", true}, {"source", sid}}));
		return 0;
	}
	bool resisted = false;
	if (!raw)
	{
		if (contains(target->resist, dtype) || target->has_effect("warding_bond") || (target->is_raging() && contains(kPhysical, dtype)))
		{
			dmg = dmg / 2;
			resisted = true;
		}
		if (contains(target->vulnerable, dtype))
		{
			dmg *= 2;
		}
	}
	// Reacción: Aguante de la piedra (goliat)
	if (!raw && dmg > 0 && target->has_trait("stones_endurance") && target->resources.get("giant_ancestry", 0) > 0 && target->can_react() &&
		pc_reacts(target))
	{
		const bool lethal = dmg >= target->hp + target->temp_hp;
		if (lethal || dmg >= std::max(7, static_cast<int>(target->max_hp * 0.25)))
		{
			const int red = dice.roll("1d12").total + target->mod("con");
			target->resources["giant_ancestry"] -= 1;
			target->turn.reaction = 0;
			dmg = std::max(0, dmg - red);
			emit(vdict({{"t", "reaction"}, {"who", target->id}, {"name", RulesDB::feature_name("stones_endurance")}}));
			log_msg(Loc::t("log.stones_endurance", vdict({{"who", nm(target)}, {"n", red}})));
			if (dmg <= 0)
			{
				return 0;
			}
		}
	}
	// Puntos de golpe temporales
	if (target->temp_hp > 0)
	{
		const int absorbed = std::min(target->temp_hp, dmg);
		target->temp_hp -= absorbed;
		dmg -= absorbed;
		if (target->temp_hp <= 0)
		{
			EffectPtr ag = target->get_effect("agathys");
			if (ag)
			{
				remove_effect(ag);
			}
		}
	}
	const int hp_before = target->hp;
	target->stats["damage_taken"] += dmg;
	if (source != nullptr)
	{
		source->stats["damage_dealt"] += dmg;
	}
	// Ya estaba en el suelo
	if (target->is_pc && target->hp <= 0)
	{
		emit(vdict({{"t", "damage"}, {"who", target->id}, {"amount", dmg}, {"type", dtype}, {"hp", 0}, {"max", target->max_hp}, {"crit", crit},
			{"source", sid}}));
		if (dmg >= target->max_hp)
		{
			kill(target, source);
		}
		else
		{
			target->stable = false;
			add_death_failure(target, crit ? 2 : 1);
		}
		return dmg;
	}
	target->hp -= dmg;
	std::string text = Loc::t("log.damage", vdict({{"target", nm(target)}, {"amount", dmg}, {"type", Loc::dmg_type(dtype)}}));
	if (resisted)
	{
		text += " " + Loc::t("log.damage_resisted", vdict({{"target", nm(target)}}));
	}
	if (!raw && contains(target->vulnerable, dtype))
	{
		text += " " + Loc::t("log.damage_vulnerable", vdict({{"target", nm(target)}}));
	}
	log_msg(text);
	// Vínculo protector: el lanzador recibe el mismo daño
	EffectPtr wb = target->get_effect("warding_bond");
	if (wb && dmg > 0 && wb->source != nullptr && wb->source != target && !wb->source->dead && !opts.getb("bond", false))
	{
		apply_damage(wb->source, dmg, dtype, nullptr, vdict({{"raw", true}, {"bond", true}}));
	}
	if (target->hp <= 0)
	{
		const int overflow = dmg - hp_before;
		if (!target->is_pc)
		{
			// Fortaleza de no muerto
			if (target->has_trait("undead_fortitude") && dtype != "radiant" && !crit)
			{
				const Var r = saving_throw(target, "con", 5 + dmg, source, vdict({{"silent", true}}));
				if (r.getb("success"))
				{
					target->hp = 1;
					emit(vdict({{"t", "damage"}, {"who", target->id}, {"amount", dmg}, {"type", dtype}, {"hp", 1}, {"max", target->max_hp},
						{"crit", crit}, {"source", sid}}));
					log_msg(Loc::t("log.undead_fortitude", vdict({{"who", nm(target)}})));
					after_damage(target, dmg, source, dtype);
					return dmg;
				}
			}
			target->hp = 0;
			emit(vdict({{"t", "damage"}, {"who", target->id}, {"amount", dmg}, {"type", dtype}, {"hp", 0}, {"max", target->max_hp}, {"crit", crit},
				{"source", sid}}));
			kill(target, source);
			return dmg;
		}
		// Aguante incansable (orco)
		if (overflow < target->max_hp && target->resources.get("relentless_endurance", 0) > 0)
		{
			target->resources["relentless_endurance"] -= 1;
			target->hp = 1;
			emit(vdict({{"t", "damage"}, {"who", target->id}, {"amount", dmg}, {"type", dtype}, {"hp", 1}, {"max", target->max_hp}, {"crit", crit},
				{"source", sid}}));
			emit(vdict({{"t", "feature"}, {"who", target->id}, {"feature", "relentless_endurance"}}));
			log_msg(Loc::t("log.relentless", vdict({{"who", nm(target)}})));
			after_damage(target, dmg, source, dtype);
			return dmg;
		}
		target->hp = 0;
		emit(vdict({{"t", "damage"}, {"who", target->id}, {"amount", dmg}, {"type", dtype}, {"hp", 0}, {"max", target->max_hp}, {"crit", crit},
			{"source", sid}}));
		if (overflow >= target->max_hp)
		{
			kill(target, source);
		}
		else
		{
			fall_unconscious(target, source);
		}
		return dmg;
	}
	emit(vdict({{"t", "damage"}, {"who", target->id}, {"amount", dmg}, {"type", dtype}, {"hp", target->hp}, {"max", target->max_hp},
		{"crit", crit}, {"source", sid}}));
	after_damage(target, dmg, source, dtype);
	return dmg;
}

void Battle::after_damage(Creature* target, int dmg, Creature* source, const std::string& dtype)
{
	(void)dtype;
	if (dmg <= 0)
	{
		return;
	}
	const std::vector<EffectPtr> snapshot = target->effects;
	for (const EffectPtr& e : snapshot)
	{
		if (!battle_detail::has_effect_ptr(target, e))
		{
			continue;
		}
		if (e->kind == "sleep")
		{
			remove_effect(e);
			log_msg(Loc::t("log.sleep_wake", vdict({{"who", nm(target)}})));
		}
		else if (e->kind == "turned")
		{
			remove_effect(e);
			log_msg(Loc::t("log.turn_end", vdict({{"who", nm(target)}})));
		}
		else if (e->kind == "laughing")
		{
			const Var se = e->data.get("save_end", Var::dict());
			const Var r0 = saving_throw(target, "wis", se.geti("dc", 10), e->source, vdict({{"advantage", true}}));
			if (r0.getb("success"))
			{
				remove_effect(e);
				log_msg(Loc::t("log.effect_end", vdict({{"effect", e->name}, {"who", nm(target)}})));
			}
		}
		if (battle_detail::has_effect_ptr(target, e) && e->data.has("ends_on_team") && source != nullptr &&
			source->team == e->data.geti("ends_on_team"))
		{
			remove_effect(e);
			log_msg(Loc::t("log.effect_end", vdict({{"effect", e->name}, {"who", nm(target)}})));
		}
	}
	// Concentración
	if (target->concentration && target->is_active())
	{
		const int dc = std::clamp(dmg / 2, 10, 30);
		const Var r = saving_throw(target, "con", dc, source, vdict({{"silent", true}, {"conc", true}}));
		if (r.getb("success"))
		{
			log_msg(Loc::t("log.conc_kept", vdict({{"who", nm(target)}})));
		}
		else
		{
			end_concentration(target, true);
		}
	}
	// Reacciones al recibir daño de una criatura
	if (source != nullptr && source != target && !source->dead && target->is_active() && source->team != target->team)
	{
		damage_reactions(target, source);
	}
}

void Battle::damage_reactions(Creature* target, Creature* source)
{
	if (!target->can_react() || !pc_reacts(target))
	{
		return;
	}
	const int d = BattleMap::dist(target->cell, source->cell);
	if (d > 12 || !sees(target, source))
	{
		return;
	}
	// Trueno de la tormenta (goliat)
	if (target->has_trait("storms_thunder") && target->resources.get("giant_ancestry", 0) > 0)
	{
		target->resources["giant_ancestry"] -= 1;
		target->turn.reaction = 0;
		emit(vdict({{"t", "reaction"}, {"who", target->id}, {"name", RulesDB::feature_name("storms_thunder")}, {"target", source->id}}));
		log_msg(Loc::t("log.storms_thunder", vdict({{"who", nm(target)}, {"target", nm(source)}})));
		apply_damage(source, dice.roll("1d8").total, "thunder", target);
		return;
	}
	// Reprensión infernal
	if (contains(target->known_spells(), std::string("hellish_rebuke")) && target->can_cast("hellish_rebuke") && !target->is_raging())
	{
		const bool free_cast = target->free_casts.get("hellish_rebuke", 0) > 0;
		if (free_cast || target->total_slots() >= 2 || source->hp <= 14)
		{
			spells->cast_reaction(target, "hellish_rebuke", source);
		}
	}
}

void Battle::fall_unconscious(Creature* c, Creature* source)
{
	c->hp = 0;
	c->death_successes = 0;
	c->death_failures = 0;
	c->stable = false;
	c->stats["downs"] += 1;
	c->add_condition("unconscious", "dying");
	if (c->concentration)
	{
		end_concentration(c, true);
	}
	end_rage(c);
	EffectPtr ws = c->get_effect("wild_shape");
	if (ws)
	{
		remove_effect(ws);
	}
	drop_hidden(c);
	emit(vdict({{"t", "downed"}, {"who", c->id}}));
	log_msg(Loc::t("log.downed", vdict({{"who", nm(c)}})));
	on_dropped(c, source);
}

void Battle::kill(Creature* c, Creature* source)
{
	const bool was_up = c->hp > 0 || !c->is_pc;
	c->dead = true;
	c->hp = 0;
	c->remove_condition("unconscious", "dying");
	if (c->concentration)
	{
		end_concentration(c);
	}
	end_rage(c);
	// quita sus invocaciones
	for (const Var& tid : tokens.keys())
	{
		if (tokens.get(tid).get("owner").creature() == c)
		{
			tokens.erase(tid);
			emit(vdict({{"t", "unsummon"}, {"id", tid}}));
		}
	}
	const std::vector<Var> snapshot = zones;
	for (const Var& z : snapshot)
	{
		if (z.get("owner").creature() == c)
		{
			remove_zone(z.geti("id"));
		}
	}
	if (source != nullptr && source != c)
	{
		source->stats["kills"] += 1;
	}
	emit(vdict({{"t", "death"}, {"who", c->id}}));
	log_msg(Loc::t(c->is_pc ? "log.death_pc" : "log.death", vdict({{"who", nm(c)}})));
	if (was_up)
	{
		on_dropped(c, source);
	}
	check_end();
}

void Battle::on_dropped(Creature* c, Creature* source)
{
	for (const CreaturePtr& wp : creatures)
	{
		Creature* w = wp.get();
		if (w->dead || !w->is_active() || w->team == c->team || !w->has_trait("dark_ones_blessing"))
		{
			continue;
		}
		if (source == w || BattleMap::dist(w->cell, c->cell) <= 2)
		{
			const int amt = std::max(1, w->mod("cha") + w->level);
			if (amt > w->temp_hp)
			{
				w->temp_hp = amt;
				emit(vdict({{"t", "temp_hp"}, {"who", w->id}, {"amount", amt}}));
				log_msg(Loc::t("log.dark_blessing", vdict({{"who", nm(w)}, {"n", amt}})));
			}
		}
	}
}

void Battle::add_death_failure(Creature* c, int n)
{
	c->death_failures += n;
	emit(vdict({{"t", "death_save"}, {"who", c->id}, {"successes", c->death_successes}, {"failures", c->death_failures}, {"roll", 0}}));
	if (c->death_failures >= 3)
	{
		kill(c, nullptr);
	}
}

void Battle::death_save(Creature* c)
{
	const D20Roll r = dice.d20(0, c->has_trait("luck"));
	int nat = r.natural;
	const int bless = c->has_effect("bless") ? dice.die(4) : 0;
	int total = nat + bless;
	if (total < 10 && c->resources.get("heroic_inspiration", 0) > 0)
	{
		c->resources["heroic_inspiration"] -= 1;
		const D20Roll r2 = dice.d20(0, c->has_trait("luck"));
		log_msg(Loc::t("log.heroic_used", vdict({{"who", nm(c)}})));
		if (r2.natural > nat)
		{
			nat = r2.natural;
			total = nat + bless;
		}
	}
	// Periapto de cierre de heridas: un 9 o menos cuenta como un 10
	if (c->has_trait("wound_closure") && total < 10)
	{
		nat = 10;
		total = 10;
	}
	if (nat == 20)
	{
		emit(vdict({{"t", "death_save"}, {"who", c->id}, {"roll", nat}, {"successes", c->death_successes}, {"failures", c->death_failures},
			{"nat20", true}}));
		log_msg(Loc::t("log.death_save_20", vdict({{"who", nm(c)}})));
		heal(c, 1, nullptr, true);
		return;
	}
	if (nat == 1)
	{
		c->death_failures += 2;
	}
	else if (total >= 10)
	{
		c->death_successes += 1;
	}
	else
	{
		c->death_failures += 1;
	}
	emit(vdict({{"t", "death_save"}, {"who", c->id}, {"roll", nat}, {"successes", c->death_successes}, {"failures", c->death_failures}}));
	if (total >= 10 && nat != 1)
	{
		log_msg(Loc::t("log.death_save_ok", vdict({{"who", nm(c)}, {"roll", total}, {"s", c->death_successes}})));
	}
	else
	{
		log_msg(Loc::t("log.death_save_fail", vdict({{"who", nm(c)}, {"roll", total}, {"f", c->death_failures}})));
	}
	if (c->death_failures >= 3)
	{
		kill(c, nullptr);
	}
	else if (c->death_successes >= 3)
	{
		stabilize(c);
	}
}

void Battle::stabilize(Creature* c)
{
	if (c == nullptr)
	{
		return;
	}
	c->stable = true;
	c->death_successes = 0;
	c->death_failures = 0;
	emit(vdict({{"t", "stable"}, {"who", c->id}}));
	log_msg(Loc::t("log.stable", vdict({{"who", nm(c)}})));
}

int Battle::heal(Creature* target, int amount, Creature* source, bool quiet)
{
	if (target == nullptr || target->dead || amount <= 0)
	{
		return 0;
	}
	if (target->has_effect("no_heal"))
	{
		log_msg(Loc::t("log.no_heal", vdict({{"who", nm(target)}})));
		emit(vdict({{"t", "immune"}, {"who", target->id}, {"what", "heal"}}));
		return 0;
	}
	const int before = target->hp;
	const bool was_down = target->hp <= 0;
	target->hp = std::min(target->max_hp, target->hp + amount);
	const int gained = target->hp - before;
	if (source != nullptr)
	{
		source->stats["healed"] += gained;
	}
	if (was_down && target->hp > 0)
	{
		target->remove_condition("unconscious", "dying");
		target->death_successes = 0;
		target->death_failures = 0;
		target->stable = false;
		target->add_condition("prone", "fell");
		emit(vdict({{"t", "revive"}, {"who", target->id}, {"hp", target->hp}}));
		log_msg(Loc::t("log.revive", vdict({{"who", nm(target)}})));
	}
	emit(vdict({{"t", "heal"}, {"who", target->id}, {"amount", gained}, {"hp", target->hp}, {"max", target->max_hp},
		{"source", battle_detail::src_id(source)}}));
	if (!quiet)
	{
		log_msg(Loc::t("log.heal", vdict({{"target", nm(target)}, {"amount", gained}})));
	}
	return gained;
}

void Battle::gain_temp_hp(Creature* target, int amount)
{
	if (amount > target->temp_hp)
	{
		target->temp_hp = amount;
		emit(vdict({{"t", "temp_hp"}, {"who", target->id}, {"amount", amount}}));
		log_msg(Loc::t("log.temp_hp", vdict({{"who", nm(target)}, {"n", amount}})));
	}
}

// ================================================================== perfiles de ataque

std::vector<Var> Battle::attack_profiles(const Creature* c) const
{
	std::vector<Var> out;
	for (const Var& w : c->weapons)
	{
		if (w.getb("monster", false))
		{
			const Var rng = w.get("range", varr({5, 5}));
			Var p = vdict({{"key", "m:" + w.gets("id")}, {"name", w.get("name", w.get("id"))}, {"kind", w.get("kind")}, {"weapon", w},
				{"bonus", w.geti("bonus")}, {"damage", w.get("damage")}, {"reach", w.geti("reach", 5) / 5},
				{"range", varr({rng.at(0).to_int() / 5, rng.at(1).to_int() / 5})}, {"ability_mod", 0}, {"props", w.get("props", Var::array())},
				{"ability", w.gets("kind") == "melee" ? "str" : "dex"}});
			if (w.gets("kind") == "ranged" && c->ammo.has(w.gets("id")) && c->ammo.get(w.gets("id"), 0) <= 0)
			{
				continue;
			}
			if (c->is_pc && c->has_effect("magic_weapon"))
			{
				p["bonus"] = p.geti("bonus") + 1;
			}
			out.push_back(p);
			continue;
		}
		const Var props = w.get("props", Var::array());
		const std::string ab = c->weapon_attack_ability(w);
		const int m = c->mod(ab);
		int bonus = m + (c->is_proficient(w) ? c->prof_bonus : 0);
		int dmg_bonus = m;
		const std::string wkind = w.gets("kind");
		if (c->fighting_style == "archery" && wkind == "ranged")
		{
			bonus += 2;
		}
		EffectPtr mw = c->get_effect("magic_weapon");
		// Arma mágica +N (no se suma al conjuro Arma mágica: cuenta el mayor)
		const int magic = std::max(w.geti("magic", 0), mw ? mw->data.geti("bonus", 1) : 0);
		bonus += magic;
		dmg_bonus += magic;
		if (c->has_effect("sacred_weapon") && wkind == "melee")
		{
			bonus += std::max(1, c->mod("cha"));
		}
		std::string die = w.get("damage").as_str();
		if (c->two_handing(w) && w.has("versatile"))
		{
			die = w.get("versatile").as_str();
		}
		const std::string wid = w.gets("id", "");
		if (wid == "unarmed")
		{
			die = "1";
		}
		if (c->has_effect("shillelagh") && (wid == "club" || wid == "quarterstaff"))
		{
			die = "1d8";
		}
		if (c->cls == "monk" && c->unarmored_monk() && c->is_monk_weapon(w) && !c->martial_die.empty())
		{
			if (Dice::average(c->martial_die) > Dice::average(die))
			{
				die = c->martial_die;
			}
		}
		std::string dtype = w.get("type").as_str();
		if (c->has_effect("shillelagh") && (wid == "club" || wid == "quarterstaff"))
		{
			dtype = "force";
		}
		const bool str_based = ab == "str";
		if (wkind == "melee")
		{
			out.push_back(vdict({{"key", "w:" + wid}, {"name", w.get("name")}, {"kind", "melee"}, {"weapon", w}, {"bonus", bonus},
				{"damage", varr({vdict({{"dice", Dice::with_bonus(die, dmg_bonus)}, {"type", dtype}})})}, {"die", die},
				{"reach", props.contains(Var("reach")) ? 2 : 1}, {"range", varr({1, 1})}, {"ability_mod", m}, {"props", props}, {"ability", ab},
				{"str_based", str_based}}));
			if (props.contains(Var("thrown")) && c->ammo_left(w) != 0)
			{
				std::string tab = ab;
				if (tab == "dex" && !props.contains(Var("finesse")))
				{
					tab = "str";
				}
				const int tm = c->mod(tab);
				const Var wr = w.get("range");
				out.push_back(vdict({{"key", "t:" + wid}, {"name", w.get("name").str() + " (arrojada)"}, {"kind", "thrown"}, {"weapon", w},
					{"bonus", tm + (c->is_proficient(w) ? c->prof_bonus : 0) + magic},
					{"damage", varr({vdict({{"dice", Dice::with_bonus(w.get("damage").as_str(), tm + magic)}, {"type", w.get("type")}})})},
					{"die", w.get("damage")}, {"reach", 1}, {"range", varr({wr.at(0).to_int() / 5, wr.at(1).to_int() / 5})}, {"ability_mod", tm},
					{"props", props}, {"ability", tab}, {"str_based", tab == "str"}}));
			}
		}
		else
		{
			if (c->ammo_left(w) == 0)
			{
				continue;
			}
			const Var wr = w.get("range");
			out.push_back(vdict({{"key", "w:" + wid}, {"name", w.get("name")}, {"kind", "ranged"}, {"weapon", w}, {"bonus", bonus},
				{"damage", varr({vdict({{"dice", Dice::with_bonus(die, dmg_bonus)}, {"type", w.get("type")}})})}, {"die", die}, {"reach", 1},
				{"range", varr({wr.at(0).to_int() / 5, wr.at(1).to_int() / 5})}, {"ability_mod", m}, {"props", props}, {"ability", ab},
				{"str_based", false}}));
		}
	}
	return out;
}

Var Battle::profile_by_key(const Creature* c, const std::string& key) const
{
	for (const Var& p : attack_profiles(c))
	{
		if (p.gets("key") == key)
		{
			return p;
		}
	}
	return Var::dict();
}

bool Battle::in_attack_range(const Creature* c, const Var& p, const Creature* target, std::optional<Cell> from_cell) const
{
	const Cell fc = from_cell ? *from_cell : c->cell;
	const int d = BattleMap::dist(fc, target->cell);
	if (p.gets("kind") == "melee")
	{
		return d <= p.geti("reach");
	}
	return d <= p.get("range").at(1).to_int() && d >= 1;
}

Var Battle::best_melee_profile(const Creature* c) const
{
	Var best = Var::dict();
	double best_v = -1.0;
	for (const Var& p : attack_profiles(c))
	{
		if (p.gets("kind") != "melee")
		{
			continue;
		}
		double v = 0.0;
		for (const Var& d : p.get("damage").arr())
		{
			v += Dice::average(d.get("dice").as_str());
		}
		v += p.getf("bonus") * 0.5;
		if (v > best_v)
		{
			best_v = v;
			best = p;
		}
	}
	return best;
}

bool Battle::may_target(const Creature* a, const Creature* t) const
{
	for (const EffectPtr& e : a->get_effects("charmed_by"))
	{
		if (e->source == t)
		{
			return false;
		}
	}
	if (a->has_effect("suggested"))
	{
		return false;
	}
	return true;
}

// ================================================================== ventaja y desventaja

Var Battle::attack_mode(Creature* a, Creature* t, const std::string& kind, std::optional<Cell> from_cell, const Var& p)
{
	const Cell fc = from_cell ? *from_cell : a->cell;
	Var adv = Var::array();
	Var dis = Var::array();
	const int d = BattleMap::dist(fc, t->cell);
	const bool ranged = kind == "ranged" || kind == "thrown" || kind == "ranged_spell";
	// Visión
	const bool a_sees = sees(a, t, fc);
	const bool t_sees = sees(t, a, std::nullopt, fc) && !t->has_condition("unconscious");
	if (!t_sees && !t->has_condition("unconscious"))
	{
		adv.push(a->is_hidden() ? "hidden" : "unseen");
	}
	if (!a_sees)
	{
		if (a->has_condition("blinded"))
		{
			dis.push("self_blinded");
		}
		else if (t->is_hidden())
		{
			dis.push("target_hidden");
		}
		else
		{
			dis.push("cant_see");
		}
	}
	// Atacante
	if (a->has_condition("prone"))
	{
		dis.push("self_prone");
	}
	if (a->has_condition("poisoned"))
	{
		dis.push("self_poisoned");
	}
	if (a->has_condition("restrained"))
	{
		dis.push("self_restrained");
	}
	if (a->has_effect("turned") || a->has_condition("frightened"))
	{
		dis.push("self_frightened");
	}
	if (a->has_effect("sapped"))
	{
		dis.push("sapped");
	}
	if (a->has_effect("mocked"))
	{
		dis.push("mocked");
	}
	if (a->has_effect("enfeebled") && p.gets("ability", "") == "str")
	{
		dis.push("enfeebled");
	}
	if (a->has_effect("steady_aim"))
	{
		adv.push("steady_aim");
	}
	if (a->has_effect("reckless") && p.getb("str_based", false))
	{
		adv.push("reckless");
	}
	if (a->has_effect("innate_sorcery") && ends_with(kind, "_spell") && a->spell_source.get(p.get("spell", "").str(), "class") == "class")
	{
		adv.push("innate_sorcery");
	}
	for (const EffectPtr& e : a->get_effects("vex"))
	{
		if (e->data.gets("vs", "") == t->id)
		{
			adv.push("vex");
			break;
		}
	}
	if (settings.getb("sunlight", false) && a->has_trait("sunlight_sensitivity"))
	{
		dis.push("sunlight");
	}
	// Objetivo
	if (t->has_condition("paralyzed"))
	{
		adv.push("paralyzed");
	}
	else if (t->has_condition("unconscious"))
	{
		adv.push("unconscious");
	}
	else if (t->has_condition("prone"))
	{
		if (d <= 1)
		{
			adv.push("prone_close");
		}
		else
		{
			dis.push("prone_far");
		}
	}
	if (t->has_condition("restrained"))
	{
		adv.push("restrained");
	}
	if (t->has_condition("blinded") && !adv.contains(Var("unseen")) && !adv.contains(Var("hidden")))
	{
		adv.push("target_blinded");
	}
	if (t->has_effect("guiding_bolt"))
	{
		adv.push("guiding_bolt");
	}
	if (t->has_effect("outlined") || t->has_effect("outlined_shine"))
	{
		adv.push("outlined");
	}
	if (t->has_effect("reckless"))
	{
		adv.push("reckless_target");
	}
	for (const EffectPtr& e : t->get_effects("helped"))
	{
		if (e->source != nullptr && e->source->team == a->team)
		{
			adv.push("help");
			break;
		}
	}
	if (t->has_effect("dodge") && !t->has_condition("incapacitated") && t->speed() > 0)
	{
		dis.push("dodge");
	}
	if (t->has_effect("blur"))
	{
		dis.push("blur");
	}
	if (t->has_effect("prot_evil") && contains(Creature::kProtEvilTypes, a->ctype))
	{
		dis.push("prot_evil");
	}
	if (a->has_trait("pack_tactics"))
	{
		for (Creature* ally : allies_of(a))
		{
			if (ally->can_act() && BattleMap::dist(ally->cell, t->cell) <= 1)
			{
				adv.push("pack_tactics");
				break;
			}
		}
	}
	// Distancia
	if (ranged)
	{
		for (Creature* e : enemies_of(a))
		{
			if (e->can_act() && BattleMap::dist(fc, e->cell) <= 1 && !e->is_hidden() && sees(e, a, std::nullopt, fc))
			{
				dis.push("ranged_in_melee");
				break;
			}
		}
		if (!p.is_empty() && p.has("range") && d > p.get("range").at(0).to_int())
		{
			dis.push("long_range");
		}
	}
	if (!p.is_empty() && a->is_pc && p.get("props", Var::array()).contains(Var("heavy")) && a->form.empty())
	{
		const std::string need = kind == "melee" ? "str" : "dex";
		if (a->abilities.get(need, 10) < 13)
		{
			dis.push("heavy_small");
		}
	}
	int mode = 0;
	if (adv.size() > 0 && dis.size() == 0)
	{
		mode = 1;
	}
	else if (dis.size() > 0 && adv.size() == 0)
	{
		mode = -1;
	}
	return vdict({{"mode", mode}, {"adv", adv}, {"dis", dis}});
}

void Battle::consume_attack_effects(Creature* a, Creature* t, const Var& mode_info)
{
	(void)mode_info;
	// Efectos de un solo uso que se gastan al tirar
	EffectPtr gb = t->get_effect("guiding_bolt");
	if (gb)
	{
		remove_effect(gb);
	}
	for (const EffectPtr& e : a->get_effects("vex"))
	{
		if (e->data.gets("vs", "") == t->id)
		{
			remove_effect(e);
		}
	}
	EffectPtr sa = a->get_effect("steady_aim");
	if (sa)
	{
		remove_effect(sa);
	}
	for (const EffectPtr& e : t->get_effects("helped"))
	{
		if (e->source != nullptr && e->source->team == a->team)
		{
			remove_effect(e);
			break;
		}
	}
	for (const char* k : {"sapped", "mocked"})
	{
		EffectPtr x = a->get_effect(k);
		if (x)
		{
			remove_effect(x);
		}
	}
	// Atacar rompe la invisibilidad del conjuro y extiende la furia
	EffectPtr inv = a->get_effect("invisible_spell");
	if (inv)
	{
		remove_effect(inv);
	}
	if (t->team != a->team)
	{
		a->turn.rage_extended = true;
	}
	a->turn.attacked = true;
}

int Battle::roll_attack_mods(Creature* a)
{
	int m = 0;
	if (a->has_effect("bless"))
	{
		m += dice.die(4);
	}
	if (a->has_effect("bane"))
	{
		m -= dice.die(4);
	}
	return m;
}

// ================================================================== previsión de ataque (interfaz/IA)

int Battle::target_ac(Creature* t, Creature* a, std::optional<Cell> from_cell, bool ignore_cover)
{
	int ac = t->ac();
	if (!ignore_cover)
	{
		const int cv = map.cover_between(from_cell ? *from_cell : a->cell, t->cell, blockers_for(a, t));
		ac += BattleMap::cover_ac_bonus(cv);
	}
	return ac;
}

int Battle::crit_range_for(const Creature* a, const std::string& kind) const
{
	if (a->has_trait("improved_critical") && !ends_with(kind, "_spell"))
	{
		return 19;
	}
	return 20;
}

Var Battle::preview_attack(Creature* a, const Var& p, Creature* t, std::optional<Cell> from_cell, const Var& opts)
{
	const Cell fc = from_cell ? *from_cell : a->cell;
	const std::string kind = p.gets("kind");
	const Var mi = attack_mode(a, t, kind, fc, p);
	const int mode = mi.geti("mode");
	const int cv = map.cover_between(fc, t->cell, blockers_for(a, t));
	const int ac = t->ac() + BattleMap::cover_ac_bonus(cv);
	const int crit_range = crit_range_for(a, kind);
	const double bonus = p.getf("bonus") + (a->has_effect("bless") ? 2.5 : 0.0) - (a->has_effect("bane") ? 2.5 : 0.0);
	const double p_hit = Dice::p_success(bonus, ac, mode, crit_range);
	double avg = 0.0;
	for (const Var& d : p.get("damage").arr())
	{
		avg += Dice::average(d.get("dice").as_str()) * damage_multiplier(t, d.get("type").as_str());
	}
	const Var extra = extra_damage_preview(a, p, t, mode, fc, opts);
	avg += extra.getf("avg");
	const bool auto_crit = (t->has_condition("paralyzed") || t->has_condition("unconscious")) && BattleMap::dist(fc, t->cell) <= 1;
	double expected = p_hit * avg;
	if (auto_crit)
	{
		expected = p_hit * avg * 1.6;
	}
	// Imagen múltiple: parte de los impactos acaban en un doble
	EffectPtr mir = t->get_effect("mirror_image");
	if (mir && !a->has_condition("blinded"))
	{
		const int n = mir->data.geti("dupes", 0);
		expected *= std::pow(1.0 / 3.0, n);
	}
	return vdict({{"p_hit", p_hit}, {"avg", avg}, {"expected", expected}, {"mode", mode}, {"adv", mi.get("adv")}, {"dis", mi.get("dis")},
		{"cover", cv}, {"ac", ac}, {"in_range", in_attack_range(a, p, t, fc)}, {"los", cv < 3}, {"extras", extra.get("lines")}});
}

Var Battle::extra_damage_preview(Creature* a, const Var& p, Creature* t, int mode, const Cell& fc, const Var& opts)
{
	double avg = 0.0;
	Var lines = Var::array();
	if (!a->sneak_attack.empty() && !a->turn.sneak_used && sneak_eligible(a, t, p, mode, fc))
	{
		avg += Dice::average(a->sneak_attack);
		lines.push(format("+ Ataque furtivo %s", a->sneak_attack.c_str()));
	}
	const Var weapon = p.get("weapon", Var::dict());
	const Var adv_extra = weapon.get("adv_extra", Var::dict());
	if (!adv_extra.is_empty() && mode > 0)
	{
		avg += Dice::average(adv_extra.get("dice").as_str());
	}
	if (a->is_raging() && p.getb("str_based", false))
	{
		avg += a->rage_damage;
		lines.push(format("+%d furia", a->rage_damage));
		if (a->has_trait("frenzy") && a->has_effect("reckless") && !a->turn.frenzy_used)
		{
			avg += a->rage_damage * 3.5;
			lines.push(format("+ Frenesí %dd6", a->rage_damage));
		}
	}
	for (const char* mk : {"hunters_mark", "hexed"})
	{
		for (const EffectPtr& e : t->get_effects(mk))
		{
			if (e->source == a)
			{
				avg += 3.5;
				lines.push("+1d6 " + utf8_lower(e->name));
			}
		}
	}
	if (a->has_effect("divine_favor") && !p.getb("spell_like", false))
	{
		avg += 2.5;
		lines.push("+1d4 favor divino");
	}
	if (a->has_trait("colossus_slayer") && t->hp < t->max_hp && !a->turn.colossus_used)
	{
		avg += 4.5;
		lines.push("+1d8 asesino de colosos");
	}
	if (a->has_effect("enlarged"))
	{
		avg += 2.5;
	}
	if (a->has_effect("reduced"))
	{
		avg -= 2.5;
	}
	if (a->has_effect("enfeebled"))
	{
		avg -= 4.5;
	}
	const Var charge = weapon.get("charge", Var::dict());
	if (!charge.is_empty() && a->turn.moved_cells >= charge.geti("min_cells", 4))
	{
		avg += Dice::average(charge.get("dice").str());
		lines.push("+ carga");
	}
	const Var rider = opts.get("rider", Var::dict());
	if (!rider.is_empty())
	{
		const Json& rsp = RulesDB::spell(rider.get("spell", "").str());
		const std::string rexpr = spells->damage_expr(a, rsp, rider.geti("slot", 1));
		if (!rexpr.empty() && jint(rsp, "rider_area", 0) == 0)
		{
			double ravg = Dice::average(rexpr);
			if (rsp.contains("vs_fiend_undead") && (t->ctype == "fiend" || t->ctype == "undead"))
			{
				ravg += Dice::average(jstr(rsp, "vs_fiend_undead"));
			}
			avg += ravg * damage_multiplier(t, jstr(jobj(rsp, "damage"), "type", ""));
			lines.push("+ " + jstr(rsp, "name", ""));
		}
	}
	return vdict({{"avg", std::max(0.0, avg)}, {"lines", lines}});
}

bool Battle::sneak_eligible(Creature* a, Creature* t, const Var& p, int mode, const Cell& from_cell)
{
	(void)from_cell;
	const Var props = p.get("props", Var::array());
	const std::string kind = p.gets("kind");
	if (!(props.contains(Var("finesse")) || kind == "ranged" || kind == "thrown"))
	{
		return false;
	}
	if (mode > 0)
	{
		return true;
	}
	if (mode < 0)
	{
		return false;
	}
	for (Creature* ally : allies_of(a))
	{
		if (ally->can_act() && BattleMap::dist(ally->cell, t->cell) <= 1)
		{
			return true;
		}
	}
	return false;
}

// ================================================================== ataque con arma

int Battle::attacks_per_action(const Creature* c) const
{
	if (!c->multiattack.empty())
	{
		return jint(c->multiattack, "count", 1);
	}
	return 1;
}

bool Battle::can_start_attack(const Creature* c, const Var& p) const
{
	(void)p;
	if (!c->can_act())
	{
		return false;
	}
	if (c->turn.attack_left > 0)
	{
		return true;
	}
	return c->turn.action > 0;
}

Var Battle::do_attack(Creature* a, const std::string& key, Creature* t, const Var& opts)
{
	const Var p = profile_by_key(a, key);
	if (p.is_empty() || t == nullptr || t->dead)
	{
		return vdict({{"ok", false}});
	}
	const bool is_oa = opts.getb("oa", false);
	const bool offhand = opts.getb("offhand", false);
	const bool free_attack = opts.getb("cleave", false) || opts.getb("free", false);
	if (!is_oa && !offhand && !free_attack)
	{
		if (!can_start_attack(a, p))
		{
			return vdict({{"ok", false}, {"reason", "no_action"}});
		}
		if (!in_attack_range(a, p, t))
		{
			return vdict({{"ok", false}, {"reason", "range"}});
		}
		if (cover(a, t) >= 3)
		{
			return vdict({{"ok", false}, {"reason", "los"}});
		}
		if (!may_target(a, t))
		{
			return vdict({{"ok", false}, {"reason", "charmed"}});
		}
		if (a->turn.attack_left <= 0)
		{
			a->turn.action -= 1;
			a->turn.attack_left = attacks_per_action(a);
			a->turn.attack_source = "attack";
			a->turn.attack_action = true;
		}
		a->turn.attack_left -= 1;
	}
	else if (offhand)
	{
		if (a->turn.bonus <= 0 && !a->turn.nick_ready)
		{
			return vdict({{"ok", false}});
		}
		if (a->turn.nick_ready)
		{
			a->turn.nick_ready = false;
			a->turn.nick_used = true;
		}
		else
		{
			a->turn.bonus -= 1;
		}
		a->turn.offhand_ready = false;
	}
	a->turn.acted = true;
	a->turn.can_undo = false;
	// Atacar rompe el santuario propio
	EffectPtr own_sanct = a->get_effect("sanctuary");
	if (own_sanct)
	{
		remove_effect(own_sanct);
	}
	// Santuario del objetivo
	EffectPtr sanct = t->get_effect("sanctuary");
	if (sanct && t->team != a->team)
	{
		const Var sr = saving_throw(a, "wis", sanct->data.geti("dc"), sanct->source, vdict({{"silent", true}}));
		if (!sr.getb("success"))
		{
			log_msg(Loc::t("log.sanctuary_block", vdict({{"who", nm(a)}, {"target", nm(t)}})));
			emit(vdict({{"t", "blocked"}, {"who", a->id}, {"target", t->id}, {"reason", "sanctuary"}}));
			reveal(a);
			return vdict({{"ok", true}, {"blocked", true}});
		}
		log_msg(Loc::t("log.sanctuary_pass", vdict({{"who", nm(a)}, {"target", nm(t)}})));
	}
	// Redirigir ataque (cabecilla trasgo)
	if (contains(t->reactions, std::string("redirect_attack")) && t->can_react())
	{
		Creature* swap_ally = redirect_candidate(t, a);
		if (swap_ally != nullptr)
		{
			t->turn.reaction = 0;
			const Cell tc = t->cell;
			t->cell = swap_ally->cell;
			swap_ally->cell = tc;
			emit(vdict({{"t", "swap"}, {"a", t->id}, {"b", swap_ally->id}, {"a_cell", t->cell}, {"b_cell", swap_ally->cell}}));
			log_msg(Loc::t("log.redirect", vdict({{"who", nm(t)}, {"ally", nm(swap_ally)}})));
			t = swap_ally;
		}
	}
	const Var res = resolve_weapon_attack(a, p, t, opts);
	// Rompehordas: otro ataque contra una criatura junto al primer objetivo
	if (a->has_trait("horde_breaker") && !a->turn.horde_used && !is_oa && !opts.getb("horde", false) && !a->dead && a->can_act())
	{
		Creature* other = horde_target(a, p, t);
		if (other != nullptr)
		{
			a->turn.horde_used = true;
			log_msg(Loc::t("log.horde_breaker", vdict({{"who", nm(a)}, {"target", nm(other)}})));
			resolve_weapon_attack(a, p, other, vdict({{"horde", true}}));
		}
	}
	return res;
}

Creature* Battle::horde_target(Creature* a, const Var& p, Creature* first)
{
	Creature* best = nullptr;
	for (Creature* e : enemies_of(a))
	{
		if (e == first || !e->is_active() || contains(a->turn.attacked_ids, e->id))
		{
			continue;
		}
		if (BattleMap::dist(e->cell, first->cell) <= 1 && in_attack_range(a, p, e) && cover(a, e) < 3)
		{
			if (best == nullptr || e->hp < best->hp)
			{
				best = e;
			}
		}
	}
	return best;
}

Creature* Battle::redirect_candidate(Creature* t, Creature* attacker)
{
	(void)attacker;
	Creature* best = nullptr;
	for (Creature* ally : allies_of(t))
	{
		if (ally->is_active() && BattleMap::dist(ally->cell, t->cell) <= 1 && ally->size_rank() <= 2)
		{
			if (best == nullptr || ally->hp > best->hp)
			{
				best = ally;
			}
		}
	}
	return best;
}

Var Battle::resolve_weapon_attack(Creature* a, const Var& p, Creature* t, const Var& opts)
{
	const bool offhand = opts.getb("offhand", false);
	const bool cleave = opts.getb("cleave", false);
	const std::string kind = p.gets("kind");
	const Var weapon = p.get("weapon");
	const Var mi = attack_mode(a, t, kind, std::nullopt, p);
	const int mode = mi.geti("mode");
	consume_attack_effects(a, t, mi);
	add_unique(a->turn.attacked_ids, t->id);
	if (!opts.getb("oa", false))
	{
		a->turn.last_weapon = weapon.gets("id", "");
	}
	const D20Roll r = dice.d20(mode, a->has_trait("luck"));
	const int nat = r.natural;
	const int bless = roll_attack_mods(a);
	int total = nat + p.geti("bonus") + bless;
	int ac = target_ac(t, a);
	const int crit_range = crit_range_for(a, kind);
	bool crit = nat >= crit_range;
	bool hit = crit || (nat != 1 && total >= ac);
	// Inspiración bárdica del atacante para convertir el fallo en acierto
	if (!hit && nat != 1)
	{
		EffectPtr bi = a->get_effect("bardic_inspiration");
		if (bi && total + Dice::max_value(bi->data.get("die", "1d6").str()) >= ac)
		{
			const int extra = dice.roll(bi->data.get("die", "1d6").str()).total;
			remove_effect(bi);
			total += extra;
			hit = total >= ac;
			emit(vdict({{"t", "inspiration"}, {"who", a->id}, {"amount", extra}, {"kind", "bardic"}}));
			log_msg(Loc::t("log.bardic_used", vdict({{"who", nm(a)}, {"n", extra}})));
		}
	}
	// Reacciones defensivas: Palabras cortantes y Escudo
	if (hit && !crit)
	{
		const int cw = try_cutting_words(a, t, total, ac);
		if (cw > 0)
		{
			total -= cw;
			hit = total >= ac;
		}
	}
	if (hit && !crit)
	{
		double avg_dmg = 0.0;
		for (const Var& d : p.get("damage").arr())
		{
			avg_dmg += Dice::average(d.get("dice").as_str());
		}
		if (try_shield(t, total, ac, avg_dmg))
		{
			ac += 5;
			hit = total >= ac;
		}
	}
	if (hit && (t->has_condition("paralyzed") || t->has_condition("unconscious")) && BattleMap::dist(a->cell, t->cell) <= 1)
	{
		crit = true;
	}
	reveal(a);
	// Munición y arrojadizas
	if (kind == "ranged" || kind == "thrown")
	{
		const std::string wk = weapon.gets("ammo_key", weapon.gets("id", ""));
		if (a->ammo.has(wk))
		{
			a->ammo[wk] = std::max(0, a->ammo.get(wk, 0) - 1);
		}
	}
	const Var ev = vdict({{"t", "attack"}, {"who", a->id}, {"target", t->id}, {"name", p.get("name")}, {"kind", kind}, {"natural", nat},
		{"rolls", Var::array_of(r.rolls)}, {"bonus", p.get("bonus")}, {"bless", bless}, {"total", total}, {"ac", ac}, {"hit", hit},
		{"crit", crit}, {"mode", mode}, {"adv", mi.get("adv")}, {"dis", mi.get("dis")}, {"weapon", weapon.get("id", "")},
		{"oa", opts.getb("oa", false)}, {"offhand", offhand}, {"unarmed", weapon.gets("id", "") == "unarmed"},
		{"flurry", opts.getb("flurry", false)}});
	emit(ev);
	const Var args = vdict({{"who", nm(a)}, {"target", nm(t)}, {"weapon", utf8_lower(p.get("name").str())}, {"total", total}, {"ac", ac},
		{"nat", nat}});
	if (crit)
	{
		log_msg(Loc::t("log.attack_crit", args));
		a->stats["crits"] += 1;
	}
	else if (hit)
	{
		log_msg(Loc::t("log.attack_hit", args));
	}
	else if (nat == 1)
	{
		log_msg(Loc::t("log.attack_fumble", args));
	}
	else
	{
		log_msg(Loc::t("log.attack_miss", args));
	}
	Var result = vdict({{"ok", true}, {"hit", hit}, {"crit", crit}, {"target", Var(t)}, {"damage", 0}});
	// Arma ligera: ataque adicional con la otra mano
	if (a->is_pc && kind == "melee" && p.get("props").contains(Var("light")) && !offhand && !cleave && !opts.getb("oa", false) &&
		!opts.getb("bonus_strike", false) && a->form.empty())
	{
		const Var ow = offhand_weapon(a, weapon);
		if (!ow.is_nil())
		{
			a->turn.offhand_ready = true;
			if (a->has_mastery(ow) && ow.gets("mastery", "") == "nick" && !a->turn.nick_used)
			{
				a->turn.nick_ready = true;
			}
		}
	}
	if (!hit)
	{
		// Rozar
		if (a->is_pc && a->has_mastery(weapon) && weapon.gets("mastery", "") == "graze" && p.geti("ability_mod") > 0)
		{
			log_msg(Loc::t("log.graze", vdict({{"who", nm(a)}, {"target", nm(t)}})));
			apply_damage(t, p.geti("ability_mod"), weapon.get("type").as_str(), a);
		}
		return result;
	}
	// Imagen múltiple: el golpe puede acabar en un doble
	if (mirror_absorbs(a, t))
	{
		return result;
	}
	// Daño
	Var parts = weapon_damage_parts(a, p, t, crit, mi, opts);
	// Castigos y conjuros que se lanzan al impactar
	Var rider_info = Var::dict();
	const Var rider = opts.get("rider", Var::dict());
	if (!rider.is_empty())
	{
		rider_info = spells->apply_rider_damage(a, t, p, rider, crit, parts);
	}
	// Desviar ataques (monje)
	const bool deflected = try_deflect(t, a, parts, kind);
	int total_dmg = 0;
	for (const Var& part : parts.arr())
	{
		if (t->dead)
		{
			break;
		}
		total_dmg += apply_damage(t, part.geti("amount"), part.get("type").as_str(), a, vdict({{"crit", crit}}));
	}
	result["damage"] = total_dmg;
	if (deflected)
	{
		result["deflected"] = true;
	}
	// Armadura de Agathys: el atacante cuerpo a cuerpo sufre frío
	if (kind == "melee" && !a->dead)
	{
		EffectPtr ag = t->get_effect("agathys");
		if (ag && !t->dead)
		{
			log_msg(Loc::t("log.agathys", vdict({{"who", nm(t)}, {"target", nm(a)}})));
			apply_damage(a, ag->data.geti("dmg", 5), "cold", t);
		}
	}
	// Efectos al impactar
	if (!a->dead)
	{
		on_hit_effects(a, p, t, total_dmg, opts);
		if (!rider_info.is_empty())
		{
			spells->apply_rider_after(a, t, p, rider_info);
		}
	}
	return result;
}

Var Battle::weapon_damage_parts(Creature* a, const Var& p, Creature* t, bool crit, const Var& mi, const Var& opts)
{
	const bool offhand = opts.getb("offhand", false);
	const bool cleave = opts.getb("cleave", false);
	const std::string kind = p.gets("kind");
	const Var weapon = p.get("weapon");
	const Var pdamage = p.get("damage");
	const int ability_mod = p.geti("ability_mod");
	Var parts = Var::array();
	const bool gwf = a->fighting_style == "great_weapon_fighting" && kind == "melee" &&
					 (p.get("props").contains(Var("two_handed")) || (a->two_handing(weapon) && weapon.has("versatile")));
	for (size_t i = 0; i < pdamage.size(); ++i)
	{
		const Var dpart = pdamage.at(i);
		std::string expr = dpart.get("dice").as_str();
		if (offhand && ability_mod > 0 && a->fighting_style != "two_weapon_fighting")
		{
			expr = Dice::with_bonus(expr, -ability_mod);
		}
		if (cleave && ability_mod > 0)
		{
			expr = Dice::with_bonus(expr, -ability_mod);
		}
		RollResult roll = dice.roll(expr, crit, gwf ? 3 : 0);
		// Atacante salvaje: dos tiradas de los dados del arma, se queda la mejor
		if (i == 0 && a->has_trait("savage_attacker") && !a->turn.savage_used && !weapon.getb("monster", false))
		{
			const RollResult roll2 = dice.roll(expr, crit, gwf ? 3 : 0);
			a->turn.savage_used = true;
			if (roll2.total > roll.total)
			{
				roll = roll2;
			}
		}
		// Ataques salvajes (semiorco): un dado de arma más en los críticos cuerpo a cuerpo
		if (i == 0 && crit && kind == "melee" && a->has_trait("savage_attacks") && !weapon.getb("monster", false))
		{
			const DiceExpr die = Dice::parse(expr);
			if (die.sides > 0)
			{
				roll.total += dice.roll(format("1d%d", die.sides)).total;
			}
		}
		std::string dtype = dpart.get("type").as_str();
		if (a->has_effect("sacred_weapon") && kind == "melee" && damage_multiplier(t, "radiant") > damage_multiplier(t, dtype))
		{
			dtype = "radiant";
		}
		parts.push(vdict({{"amount", std::max(0, roll.total)}, {"type", dtype}}));
	}
	const std::string wtype =
		!weapon.getb("monster", false) ? weapon.gets("type", "bludgeoning") : pdamage.at(0).get("type").str();
	// Ataque furtivo
	if (!a->sneak_attack.empty() && !a->turn.sneak_used && sneak_eligible(a, t, p, mi.geti("mode"), a->cell))
	{
		a->turn.sneak_used = true;
		const RollResult sroll = dice.roll(a->sneak_attack, crit);
		parts.push(vdict({{"amount", sroll.total}, {"type", wtype}, {"sneak", true}}));
		emit(vdict({{"t", "sneak"}, {"who", a->id}, {"target", t->id}, {"amount", sroll.total}}));
	}
	// Extra con ventaja (trasgos)
	const Var adv_extra = weapon.get("adv_extra", Var::dict());
	if (!adv_extra.is_empty() && mi.geti("mode") > 0)
	{
		const RollResult xr = dice.roll(adv_extra.get("dice").as_str(), crit);
		parts.push(vdict({{"amount", xr.total}, {"type", adv_extra.get("type")}}));
	}
	// Carga del alce
	const Var charge = weapon.get("charge", Var::dict());
	if (!charge.is_empty() && a->turn.moved_cells >= charge.geti("min_cells", 4))
	{
		parts.push(vdict({{"amount", dice.roll(charge.get("dice").str(), crit).total}, {"type", charge.get("type").str()}}));
		if (t->size_rank() <= 3 && !t->has_condition("prone"))
		{
			add_condition(t, "prone", "charge");
		}
	}
	// Furia y Frenesí
	if (a->is_raging() && p.getb("str_based", false))
	{
		parts.at(0)["amount"] = parts.at(0).geti("amount") + a->rage_damage;
		if (a->has_trait("frenzy") && a->has_effect("reckless") && !a->turn.frenzy_used)
		{
			a->turn.frenzy_used = true;
			const int fr = dice.roll(format("%dd6", a->rage_damage), crit).total;
			parts.push(vdict({{"amount", fr}, {"type", wtype}}));
			emit(vdict({{"t", "feature"}, {"who", a->id}, {"feature", "frenzy"}}));
		}
	}
	// Marca del cazador y maleficio
	for (const char* mk : {"hunters_mark", "hexed"})
	{
		for (const EffectPtr& e : t->get_effects(mk))
		{
			if (e->source == a)
			{
				const Var md = e->data.get("damage", vdict({{"dice", "1d6"}, {"type", "force"}}));
				parts.push(vdict({{"amount", dice.roll(md.get("dice").str(), crit).total}, {"type", md.get("type").str()}}));
			}
		}
	}
	// Favor divino
	if (a->has_effect("divine_favor"))
	{
		parts.push(vdict({{"amount", dice.roll("1d4", crit).total}, {"type", "radiant"}}));
	}
	// Asesino de colosos
	if (a->has_trait("colossus_slayer") && t->hp < t->max_hp && !a->turn.colossus_used)
	{
		a->turn.colossus_used = true;
		parts.push(vdict({{"amount", dice.roll("1d8", crit).total}, {"type", wtype}}));
	}
	// Agrandar / reducir / debilitado
	if (a->has_effect("enlarged"))
	{
		parts.push(vdict({{"amount", dice.roll("1d4", crit).total}, {"type", wtype}}));
	}
	if (a->has_effect("reduced"))
	{
		parts.at(0)["amount"] = std::max(1, parts.at(0).geti("amount") - dice.die(4));
	}
	if (a->has_effect("enfeebled"))
	{
		parts.at(0)["amount"] = std::max(0, parts.at(0).geti("amount") - dice.roll("1d8").total);
	}
	// Linaje de gigante (goliat): una vez por turno
	if (a->resources.get("giant_ancestry", 0) > 0 && !a->turn.giant_used && pc_reacts(a))
	{
		if (a->has_trait("fires_burn"))
		{
			a->resources["giant_ancestry"] -= 1;
			a->turn.giant_used = true;
			parts.push(vdict({{"amount", dice.roll("1d10", crit).total}, {"type", "fire"}}));
			emit(vdict({{"t", "feature"}, {"who", a->id}, {"feature", "fires_burn"}}));
		}
		else if (a->has_trait("frosts_chill"))
		{
			a->resources["giant_ancestry"] -= 1;
			a->turn.giant_used = true;
			parts.push(vdict({{"amount", dice.roll("1d6", crit).total}, {"type", "cold"}}));
			emit(vdict({{"t", "feature"}, {"who", a->id}, {"feature", "frosts_chill"}}));
			EffectPtr fe = make_effect("frosts_chill");
			fe->name = RulesDB::feature_name("frosts_chill");
			fe->source = a;
			fe->expires = "start_turn";
			fe->expires_who = a;
			attach_effect(t, fe);
		}
	}
	return parts;
}

bool Battle::mirror_absorbs(Creature* a, Creature* t)
{
	EffectPtr mir = t->get_effect("mirror_image");
	if (!mir || a->has_condition("blinded") || a->has_trait("blindsight"))
	{
		return false;
	}
	const int n = mir->data.geti("dupes", 0);
	for (int i = 0; i < n; ++i)
	{
		if (dice.die(6) >= 3)
		{
			mir->data["dupes"] = n - 1;
			mir->name = format("Imágenes ×%d", n - 1);
			emit(vdict({{"t", "mirror"}, {"who", t->id}, {"left", n - 1}}));
			log_msg(Loc::t("log.mirror_hit", vdict({{"who", nm(t)}})));
			if (n - 1 <= 0)
			{
				remove_effect(mir);
			}
			else
			{
				emit(vdict({{"t", "effect"}, {"who", t->id}, {"kind", "mirror_image"}, {"name", mir->name}, {"on", true}, {"positive", true}}));
			}
			return true;
		}
	}
	return false;
}

Var Battle::offhand_weapon(const Creature* a, const Var& main) const
{
	for (const Var& w : a->weapons)
	{
		if (w != main && w.gets("kind", "") == "melee" && w.get("props", Var::array()).contains(Var("light")) &&
			w.gets("id", "") != main.gets("id", ""))
		{
			return w;
		}
	}
	return Var();
}

void Battle::on_hit_effects(Creature* a, const Var& p, Creature* t, int dmg, const Var& opts)
{
	const Var w = p.get("weapon");
	// Mordisco de lobo o mastín
	if (w.gets("on_hit", "") == "prone_if_medium" && !t->dead && t->size_rank() <= 2 && !t->has_condition("prone"))
	{
		add_condition(t, "prone", "bite");
		log_msg(Loc::t("log.wolf_prone", vdict({{"target", nm(t)}})));
	}
	if (t->dead)
	{
		return;
	}
	// Embestida de la colina (goliat)
	if (a->has_trait("hills_tumble") && a->resources.get("giant_ancestry", 0) > 0 && !a->turn.giant_used && t->size_rank() <= 3 &&
		!t->has_condition("prone") && t->is_active())
	{
		a->resources["giant_ancestry"] -= 1;
		a->turn.giant_used = true;
		emit(vdict({{"t", "feature"}, {"who", a->id}, {"feature", "hills_tumble"}}));
		add_condition(t, "prone", "hills_tumble");
	}
	// Técnica de la mano abierta (golpes de la Ráfaga)
	if (opts.getb("flurry", false) && a->has_trait("open_hand_technique") && t->is_active())
	{
		std::string tech = opts.gets("technique", "auto");
		if (tech == "auto")
		{
			tech = !t->has_condition("prone") ? "topple" : "addle";
		}
		const int dc = 8 + a->mod("wis") + a->prof_bonus;
		if (tech == "topple")
		{
			const Var rt = saving_throw(t, "dex", dc, a);
			if (!rt.getb("success"))
			{
				add_condition(t, "prone", "open_hand");
			}
		}
		else if (tech == "push")
		{
			const Var rp = saving_throw(t, "str", dc, a);
			if (!rp.getb("success"))
			{
				push_away(t, a->cell, 3);
			}
		}
		else if (tech == "addle")
		{
			EffectPtr ae = make_effect("no_reactions");
			ae->name = "Desequilibrado";
			ae->source = a;
			ae->expires = "start_turn";
			ae->expires_who = t;
			attach_effect(t, ae);
		}
	}
	if (!a->is_pc || !a->has_mastery(w))
	{
		return;
	}
	const std::string m = w.gets("mastery", "");
	if (m == "sap")
	{
		if (!t->has_effect("sapped"))
		{
			EffectPtr e = make_effect("sapped");
			e->name = Loc::t("mastery.sap");
			e->source = a;
			e->expires = "start_turn";
			e->expires_who = a;
			attach_effect(t, e);
			log_msg(Loc::t("log.sap", vdict({{"target", nm(t)}})));
		}
	}
	else if (m == "vex")
	{
		if (dmg > 0)
		{
			EffectPtr e2 = make_effect("vex");
			e2->source = a;
			e2->data = vdict({{"vs", t->id}});
			// dura hasta el final del siguiente turno del atacante
			e2->expires = "end_turn_next";
			e2->expires_who = a;
			e2->data["skip_first_end"] = (current == a);
			attach_effect(a, e2);
			log_msg(Loc::t("log.vex", vdict({{"who", nm(a)}, {"target", nm(t)}})));
		}
	}
	else if (m == "slow")
	{
		if (dmg > 0 && !t->has_effect("slowed_weapon"))
		{
			EffectPtr e3 = make_effect("slowed_weapon");
			e3->name = Loc::t("mastery.slow");
			e3->source = a;
			e3->expires = "start_turn";
			e3->expires_who = a;
			attach_effect(t, e3);
			log_msg(Loc::t("log.slow", vdict({{"target", nm(t)}})));
		}
	}
	else if (m == "topple")
	{
		if (!t->has_condition("prone") && t->is_active())
		{
			const int dc2 = 8 + p.geti("ability_mod") + a->prof_bonus;
			const Var r = saving_throw(t, "con", dc2, a);
			if (!r.getb("success"))
			{
				add_condition(t, "prone", "topple");
			}
		}
	}
	else if (m == "push")
	{
		if (t->size_rank() <= 3 && t->is_active())
		{
			push_away(t, a->cell, 2);
		}
	}
	else if (m == "cleave")
	{
		if (!a->turn.cleave_used && !opts.getb("cleave", false))
		{
			Creature* second = cleave_target(a, t);
			if (second != nullptr)
			{
				a->turn.cleave_used = true;
				log_msg(Loc::t("log.cleave", vdict({{"who", nm(a)}, {"target", nm(second)}})));
				resolve_weapon_attack(a, p, second, vdict({{"cleave", true}}));
			}
		}
	}
}

Creature* Battle::cleave_target(Creature* a, Creature* first)
{
	Creature* best = nullptr;
	for (Creature* e : enemies_of(a))
	{
		if (e == first || !e->is_active())
		{
			continue;
		}
		if (BattleMap::dist(e->cell, first->cell) <= 1 && BattleMap::dist(e->cell, a->cell) <= a->reach_cells())
		{
			if (best == nullptr || e->hp < best->hp)
			{
				best = e;
			}
		}
	}
	return best;
}

bool Battle::try_shield(Creature* t, int attack_total, int ac, double avg_dmg)
{
	if (!t->can_react() || !contains(t->known_spells(), std::string("shield")) || !t->can_cast("shield"))
	{
		return false;
	}
	if (attack_total >= ac + 5)
	{
		return false;
	}
	const bool free_cast = t->free_casts.get("shield", 0) > 0;
	if (!free_cast && !t->has_slot(1))
	{
		return false;
	}
	if (!pc_reacts(t))
	{
		return false;
	}
	if (t->is_pc && avg_dmg >= 0.0 && !free_cast)
	{
		const int total_slots = t->total_slots();
		const bool lethal = avg_dmg >= t->hp;
		const bool dangerous = avg_dmg >= t->hp * 0.25;
		if (!lethal && (total_slots <= 1 || !dangerous))
		{
			return false;
		}
	}
	if (free_cast)
	{
		t->free_casts["shield"] -= 1;
	}
	else
	{
		const int lvl = t->lowest_slot(1);
		t->slots[static_cast<size_t>(lvl - 1)] -= 1;
	}
	t->turn.reaction = 0;
	EffectPtr e = make_effect("shield_spell");
	e->name = jstr(RulesDB::spell("shield"), "name", "Escudo");
	e->source = t;
	e->positive = true;
	e->expires = "start_turn";
	e->expires_who = t;
	attach_effect(t, e);
	emit(vdict({{"t", "reaction"}, {"who", t->id}, {"name", e->name}, {"spell", "shield"}}));
	log_msg(Loc::t("log.shield", vdict({{"who", nm(t)}})));
	return true;
}

int Battle::try_cutting_words(Creature* a, Creature* t, int total, int ac)
{
	(void)t;
	for (const CreaturePtr& bp : creatures)
	{
		Creature* bard = bp.get();
		if (bard->dead || bard->team == a->team || !bard->has_trait("cutting_words"))
		{
			continue;
		}
		if (bard->resources.get("bardic_inspiration", 0) <= 0 || !bard->can_react() || !pc_reacts(bard))
		{
			continue;
		}
		if (BattleMap::dist(bard->cell, a->cell) > 12 || !sees(bard, a))
		{
			continue;
		}
		const int die_max = Dice::max_value(bard->bardic_die);
		if (total - ac >= die_max)
		{
			continue;
		}
		bard->resources["bardic_inspiration"] -= 1;
		bard->turn.reaction = 0;
		const int n = dice.roll(bard->bardic_die).total;
		emit(vdict({{"t", "reaction"}, {"who", bard->id}, {"name", RulesDB::feature_name("cutting_words")}, {"target", a->id}}));
		log_msg(Loc::t("log.cutting_words", vdict({{"who", nm(bard)}, {"target", nm(a)}, {"n", n}})));
		return n;
	}
	return 0;
}

bool Battle::try_deflect(Creature* t, Creature* a, Var parts, const std::string& kind)
{
	if (!t->has_trait("deflect_attacks") || !t->can_react() || !pc_reacts(t) || t->dead)
	{
		return false;
	}
	int phys = 0;
	for (const Var& part : parts.arr())
	{
		if (contains(kPhysical, part.get("type").as_str()))
		{
			phys += part.geti("amount");
		}
	}
	if (phys <= 0)
	{
		return false;
	}
	int total = 0;
	for (const Var& part : parts.arr())
	{
		total += part.geti("amount");
	}
	if (total < 5 && total < t->hp)
	{
		return false;
	}
	t->turn.reaction = 0;
	const int red = dice.roll("1d10").total + t->mod("dex") + t->level;
	int left = red;
	for (Var& part : parts.arr())
	{
		if (left <= 0)
		{
			break;
		}
		const int cut = std::min(part.geti("amount"), left);
		part["amount"] = part.geti("amount") - cut;
		left -= cut;
	}
	emit(vdict({{"t", "reaction"}, {"who", t->id}, {"name", RulesDB::feature_name("deflect_attacks")}}));
	log_msg(Loc::t("log.deflect", vdict({{"who", nm(t)}, {"n", red}})));
	int rest = 0;
	for (const Var& part : parts.arr())
	{
		rest += part.geti("amount");
	}
	// Devolver el golpe con 1 punto de foco
	if (rest <= 0 && t->resources.get("focus", 0) > 0 && !a->dead)
	{
		const bool dist_ok = BattleMap::dist(t->cell, a->cell) <= (kind == "melee" ? 1 : 12);
		if (dist_ok)
		{
			t->resources["focus"] -= 1;
			const int dc = 8 + t->mod("wis") + t->prof_bonus;
			const Var rr = saving_throw(a, "dex", dc, t);
			if (!rr.getb("success"))
			{
				// Dos tiradas en orden (en C++ el orden de los sumandos no está garantizado)
				const int first_roll = dice.roll(t->martial_die).total;
				const int second_roll = dice.roll(t->martial_die).total;
				const int amt = first_roll + second_roll + t->mod("dex");
				log_msg(Loc::t("log.deflect_back", vdict({{"who", nm(t)}, {"target", nm(a)}})));
				apply_damage(a, amt, "bludgeoning", t);
			}
		}
	}
	return true;
}

// ================================================================== empujones y teletransporte

void Battle::push_away(Creature* t, const Cell& from_cell, int cells)
{
	const Vec2 dir = BattleMap::center(t->cell) - BattleMap::center(from_cell);
	if (dir.length() < 0.01f)
	{
		return;
	}
	const Cell start_cell = t->cell;
	Cell cur = t->cell;
	const Occupancy occ = occupancy();
	for (int i = 0; i < cells; ++i)
	{
		const Cell nxt = BattleMap::step_toward(cur, dir);
		Creature* const* o = occ.find(nxt);
		if (!map.walkable(nxt) || (o != nullptr && *o != t && !(*o)->dead))
		{
			break;
		}
		cur = nxt;
	}
	if (cur != start_cell)
	{
		t->cell = cur;
		emit(vdict({{"t", "push"}, {"who", t->id}, {"from", start_cell}, {"to", cur}}));
		log_msg(Loc::t("log.push", vdict({{"who", nm(t)}})));
		zone_enter(t, cur, start_cell);
	}
}

void Battle::pull_toward(Creature* t, const Cell& to_cell, int cells)
{
	const Cell start_cell = t->cell;
	Cell cur = t->cell;
	const Occupancy occ = occupancy();
	for (int i = 0; i < cells; ++i)
	{
		if (BattleMap::dist(cur, to_cell) <= 1)
		{
			break;
		}
		const Cell nxt = BattleMap::step_toward(cur, BattleMap::center(to_cell) - BattleMap::center(cur));
		Creature* const* o = occ.find(nxt);
		if (!map.walkable(nxt) || (o != nullptr && *o != t && !(*o)->dead))
		{
			break;
		}
		cur = nxt;
	}
	if (cur != start_cell)
	{
		t->cell = cur;
		emit(vdict({{"t", "push"}, {"who", t->id}, {"from", start_cell}, {"to", cur}}));
		log_msg(Loc::t("log.pull", vdict({{"who", nm(t)}})));
		zone_enter(t, cur, start_cell);
	}
}

void Battle::teleport(Creature* c, const Cell& to)
{
	const Cell from = c->cell;
	c->cell = to;
	emit(vdict({{"t", "teleport"}, {"who", c->id}, {"from", from}, {"to", to}}));
	log_msg(Loc::t("log.teleport", vdict({{"who", nm(c)}})));
	zone_enter(c, to, from);
}

// ================================================================== movimiento

Battle::MoveOptions Battle::move_options(Creature* c)
{
	const Occupancy occ = occupancy();
	bool crawl = false;
	int budget = c->turn.movement;
	if (c->has_condition("prone"))
	{
		// levantarse cuesta media velocidad
		const int stand = c->speed() / 2;
		if (budget >= stand && c->speed() > 0 && !c->has_effect("laughing"))
		{
			budget -= stand;
		}
		else
		{
			crawl = true;
		}
	}
	const Reach r = map.reachable(c->cell, budget, c, occ, crawl);
	MoveOptions out;
	for (const auto& kv : r.cost)
	{
		if (BattleMap::can_end_in(kv.first, c, occ))
		{
			out.cost[kv.first] = kv.second;
		}
	}
	out.prev = r.prev;
	// Con carrera (si queda acción o acción adicional de Acción astuta)
	if (can_dash(c))
	{
		const Reach r2 = map.reachable(c->cell, budget + c->speed(), c, occ, crawl);
		out.dash_prev = r2.prev;
		for (const auto& kv : r2.cost)
		{
			if (BattleMap::can_end_in(kv.first, c, occ) && !out.cost.has(kv.first))
			{
				out.dash_cost[kv.first] = kv.second;
			}
		}
	}
	out.crawl = crawl;
	return out;
}

bool Battle::can_dash(const Creature* c) const
{
	if (c->speed() <= 0)
	{
		return false;
	}
	if (c->turn.action > 0 && c->turn.attack_left <= 0)
	{
		return true;
	}
	if ((c->level_feature("cunning_action") || c->has_effect("exp_retreat")) && c->turn.bonus > 0)
	{
		return true;
	}
	return false;
}

std::vector<std::pair<Creature*, Cell>> Battle::path_threats(Creature* c, const std::vector<Cell>& path)
{
	std::vector<std::pair<Creature*, Cell>> out;
	if (c->turn.disengaged)
	{
		return out;
	}
	Cell cur = c->cell;
	StrList used;
	for (const Cell& nxt : path)
	{
		for (Creature* e : enemies_of(c))
		{
			if (contains(used, e->id) || !e->can_react() || e->is_down() || e->has_effect("no_oa"))
			{
				continue;
			}
			if (!sees(e, c, std::nullopt, cur))
			{
				continue;
			}
			const int reach = e->reach_cells();
			if (e->melee_weapons().empty())
			{
				bool any_melee = false;
				for (const Var& x : attack_profiles(e))
				{
					if (x.gets("kind") == "melee")
					{
						any_melee = true;
						break;
					}
				}
				if (!any_melee)
				{
					continue;
				}
			}
			if (BattleMap::dist(cur, e->cell) <= reach && BattleMap::dist(nxt, e->cell) > reach)
			{
				out.emplace_back(e, cur);
				used.push_back(e->id);
			}
		}
		cur = nxt;
	}
	return out;
}

Cell Battle::do_move(Creature* c, std::vector<Cell> path, bool use_dash)
{
	if (path.empty() || !c->is_active())
	{
		return c->cell;
	}
	const MoveOptions opts = move_options(c);
	const Cell goal = path.back();
	bool dashing = false;
	if (!opts.cost.has(goal))
	{
		if (use_dash || opts.dash_cost.has(goal))
		{
			if (!opts.dash_cost.has(goal))
			{
				return c->cell;
			}
			dashing = true;
		}
		else
		{
			return c->cell;
		}
	}
	path = BattleMap::build_path(dashing ? opts.dash_prev : opts.prev, c->cell, goal);
	if (path.empty())
	{
		return c->cell;
	}
	if (dashing)
	{
		spend_dash(c);
	}
	// Levantarse
	if (c->has_condition("prone") && !opts.crawl)
	{
		c->turn.movement -= c->speed() / 2;
		remove_condition(c, "prone");
		emit(vdict({{"t", "stand"}, {"who", c->id}}));
		log_msg(Loc::t("log.stand_up", vdict({{"who", nm(c)}})));
	}
	const Var res = walk(c, path, dashing, opts.crawl, true);
	if (res.getb("provoked") || dashing)
	{
		c->turn.can_undo = false;
	}
	return c->cell;
}

Var Battle::walk(Creature* c, const std::vector<Cell>& path, bool dashing, bool crawl, bool spend_move)
{
	Var walked = Var::array();
	Cell cur = c->cell;
	bool stopped = false;
	bool provoked = false;
	for (const Cell& nxt : path)
	{
		// Ataques de oportunidad al salir del alcance
		if (!c->turn.disengaged && !c->is_hidden())
		{
			for (Creature* e : enemies_of(c))
			{
				if (!e->can_react() || e->is_down() || e->has_effect("no_oa"))
				{
					continue;
				}
				const Var mp = best_melee_profile(e);
				if (mp.is_empty())
				{
					continue;
				}
				const int reach = mp.geti("reach");
				if (BattleMap::dist(cur, e->cell) <= reach && BattleMap::dist(nxt, e->cell) > reach && sees(e, c))
				{
					if (!pc_reacts(e) || !may_target(e, c))
					{
						continue;
					}
					if (walked.size() > 0)
					{
						emit(vdict({{"t", "move"}, {"who", c->id}, {"path", walked.duplicate()}, {"dash", dashing}}));
						walked.arr().clear();
					}
					e->turn.reaction = 0;
					provoked = true;
					log_msg(Loc::t("log.oa", vdict({{"who", nm(e)}, {"target", nm(c)}})));
					resolve_weapon_attack(e, mp, c, vdict({{"oa", true}}));
					if (!c->is_active() || c->has_condition("prone") || c->speed() <= 0 || c->has_condition("incapacitated"))
					{
						stopped = true;
						break;
					}
				}
			}
			if (stopped)
			{
				break;
			}
		}
		int step = map.move_cost(nxt);
		if (crawl)
		{
			step *= 2;
		}
		if (spend_move)
		{
			c->turn.movement -= step;
		}
		const Cell prev = c->cell;
		c->cell = nxt;
		c->turn.moved = true;
		c->turn.moved_cells += 1;
		walked.push(Var(nxt));
		cur = nxt;
		if (c->turn.movement < 0)
		{
			c->turn.movement = 0;
		}
		// Zonas de conjuro
		if (!zones.empty())
		{
			const int before_hp = c->hp;
			const bool was_restrained = c->has_condition("restrained");
			if (!zones_at(nxt).empty())
			{
				emit(vdict({{"t", "move"}, {"who", c->id}, {"path", walked.duplicate()}, {"dash", dashing}}));
				walked.arr().clear();
				zone_enter(c, nxt, prev);
			}
			if (!c->is_active() || c->has_condition("prone") || (c->has_condition("restrained") && !was_restrained) || c->speed() <= 0)
			{
				stopped = true;
				break;
			}
			if (c->hp < before_hp && c->hp <= 0)
			{
				stopped = true;
				break;
			}
		}
	}
	if (walked.size() > 0)
	{
		emit(vdict({{"t", "move"}, {"who", c->id}, {"path", walked}, {"dash", dashing}}));
	}
	if (stopped)
	{
		log_msg(Loc::t("log.move_stop", vdict({{"who", nm(c)}})));
	}
	// Al moverse se puede perder el escondite
	if (c->is_hidden())
	{
		check_reveal_by_position(c);
	}
	return vdict({{"provoked", provoked}, {"stopped", stopped}});
}

void Battle::forced_flee(Creature* c, Creature* from)
{
	if (!c->is_active() || c->speed() <= 0)
	{
		return;
	}
	const Occupancy occ = occupancy();
	const Reach r = map.reachable(c->cell, c->speed(), c, occ, false);
	Cell best = c->cell;
	int best_d = BattleMap::dist(c->cell, from->cell);
	for (const auto& kv : r.cost)
	{
		if (!BattleMap::can_end_in(kv.first, c, occ))
		{
			continue;
		}
		const int d = BattleMap::dist(kv.first, from->cell);
		if (d > best_d)
		{
			best_d = d;
			best = kv.first;
		}
	}
	if (best == c->cell)
	{
		return;
	}
	const std::vector<Cell> path = BattleMap::build_path(r.prev, c->cell, best);
	log_msg(Loc::t("log.flee", vdict({{"who", nm(c)}})));
	walk(c, path, false, false, false);
}

bool Battle::can_undo_move(const Creature* c) const
{
	return c == current && c->turn.can_undo && c->turn.moved && !c->turn.acted;
}

void Battle::undo_move(Creature* c)
{
	if (!can_undo_move(c))
	{
		return;
	}
	const Cell from = c->cell;
	c->cell = c->turn.undo_cell;
	c->turn.movement = c->turn.undo_movement;
	c->turn.moved = false;
	c->turn.moved_cells = 0;
	emit(vdict({{"t", "teleport"}, {"who", c->id}, {"from", from}, {"to", c->cell}, {"undo", true}}));
}

void Battle::spend_dash(Creature* c)
{
	if (c->turn.action > 0 && c->turn.attack_left <= 0)
	{
		c->turn.action -= 1;
	}
	else if ((c->level_feature("cunning_action") || c->has_effect("exp_retreat")) && c->turn.bonus > 0)
	{
		c->turn.bonus -= 1;
	}
	c->turn.movement += c->speed();
	c->turn.acted = true;
	emit(vdict({{"t", "dash"}, {"who", c->id}}));
	log_msg(Loc::t("log.dash", vdict({{"who", nm(c)}})));
}

// ================================================================== ocultarse

void Battle::drop_hidden(Creature* c)
{
	for (const EffectPtr& e : c->get_effects("hidden"))
	{
		remove_effect(e);
	}
}

void Battle::reveal(Creature* c)
{
	if (c->is_hidden())
	{
		drop_hidden(c);
		emit(vdict({{"t", "reveal"}, {"who", c->id}}));
		log_msg(Loc::t("log.revealed", vdict({{"who", nm(c)}})));
	}
}

void Battle::check_reveal_by_position(Creature* c)
{
	for (Creature* e : enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		const int cv = map.cover_between(e->cell, c->cell, blockers_for(e, c));
		if (cv == 0 && BattleMap::dist(e->cell, c->cell) <= 6 && e->passive_perception() >= c->hidden_stealth - 5 &&
			clear_sight(e, e->cell, c->cell))
		{
			reveal(c);
			return;
		}
	}
}

bool Battle::can_hide(Creature* c)
{
	if (c->is_hidden())
	{
		return false;
	}
	if (obscure_at(c->cell) >= 2)
	{
		return true;
	}
	for (Creature* e : enemies_of(c))
	{
		if (!e->is_active())
		{
			continue;
		}
		if (!sees(e, c))
		{
			continue;
		}
		const bool stealthy = c->has_trait("naturally_stealthy");
		const int cv = map.cover_between(e->cell, c->cell, stealthy ? blockers_for(e, c) : std::vector<Cell>());
		const int need = stealthy ? 1 : 2;
		if (cv < need)
		{
			return false;
		}
	}
	return true;
}

// ================================================================== acciones de turno

bool Battle::spend(Creature* c, const std::string& cost)
{
	if (cost == "action")
	{
		if (c->turn.action <= 0 || c->turn.attack_left > 0)
		{
			if (c->turn.attack_left > 0)
			{
				// abandonar ataques restantes de la acción de Atacar
				c->turn.attack_left = 0;
				if (c->turn.action <= 0)
				{
					return false;
				}
			}
			else
			{
				return false;
			}
		}
		c->turn.action -= 1;
	}
	else if (cost == "bonus")
	{
		if (c->turn.bonus <= 0)
		{
			return false;
		}
		c->turn.bonus -= 1;
		c->turn.rage_extended = true;
	}
	c->turn.acted = true;
	c->turn.can_undo = false;
	return true;
}

bool Battle::do_dash(Creature* c, bool bonus)
{
	if (!spend(c, bonus ? "bonus" : "action"))
	{
		return false;
	}
	c->turn.movement += c->speed();
	emit(vdict({{"t", "dash"}, {"who", c->id}}));
	log_msg(Loc::t("log.dash", vdict({{"who", nm(c)}})));
	return true;
}

bool Battle::do_disengage(Creature* c, bool bonus)
{
	if (!spend(c, bonus ? "bonus" : "action"))
	{
		return false;
	}
	c->turn.disengaged = true;
	emit(vdict({{"t", "disengage"}, {"who", c->id}}));
	log_msg(Loc::t(!c->is_pc ? "log.nimble_escape" : "log.disengage", vdict({{"who", nm(c)}})));
	return true;
}

void Battle::add_dodge(Creature* c)
{
	EffectPtr e = make_effect("dodge");
	e->name = "Esquivar";
	e->source = c;
	e->positive = true;
	e->expires = "start_turn";
	e->expires_who = c;
	attach_effect(c, e);
}

bool Battle::do_dodge(Creature* c)
{
	if (!spend(c, "action"))
	{
		return false;
	}
	add_dodge(c);
	log_msg(Loc::t("log.dodge", vdict({{"who", nm(c)}})));
	return true;
}

bool Battle::do_hide(Creature* c, bool bonus)
{
	if (!can_hide(c))
	{
		log_msg(Loc::t("log.hide_no_cover", vdict({{"who", nm(c)}})));
		return false;
	}
	if (!spend(c, bonus ? "bonus" : "action"))
	{
		return false;
	}
	const Var r = ability_check(c, "stealth");
	const int total = r.geti("total");
	if (total >= 15)
	{
		c->hidden_stealth = total;
		EffectPtr e = make_effect("hidden");
		e->name = Loc::cond("invisible");
		e->source = c;
		e->positive = true;
		e->grants = {"invisible"};
		attach_effect(c, e);
		emit(vdict({{"t", "hide"}, {"who", c->id}, {"success", true}, {"total", total}}));
		log_msg(Loc::t("log.hide_ok", vdict({{"who", nm(c)}, {"total", total}})));
	}
	else
	{
		emit(vdict({{"t", "hide"}, {"who", c->id}, {"success", false}, {"total", total}}));
		log_msg(Loc::t("log.hide_fail", vdict({{"who", nm(c)}, {"total", total}})));
	}
	return true;
}

bool Battle::do_search(Creature* c)
{
	if (!spend(c, "action"))
	{
		return false;
	}
	bool found = false;
	for (Creature* e : enemies_of(c))
	{
		if (e->is_hidden() && map.has_los(c->cell, e->cell))
		{
			const Var r = ability_check(c, "perception");
			if (r.geti("total") >= e->hidden_stealth)
			{
				reveal(e);
				found = true;
			}
		}
	}
	if (!found)
	{
		log_msg(Loc::t("log.search_fail", vdict({{"who", nm(c)}})));
	}
	return true;
}

bool Battle::do_help(Creature* c, Creature* target)
{
	if (target == nullptr || BattleMap::dist(c->cell, target->cell) > 1 || target->team == c->team)
	{
		return false;
	}
	if (!spend(c, "action"))
	{
		return false;
	}
	EffectPtr e = make_effect("helped");
	e->name = "Distraído";
	e->source = c;
	e->expires = "start_turn";
	e->expires_who = c;
	attach_effect(target, e);
	log_msg(Loc::t("log.help", vdict({{"who", nm(c)}, {"target", nm(target)}})));
	return true;
}

bool Battle::do_stabilize(Creature* c, Creature* target)
{
	if (target == nullptr || !target->is_down() || BattleMap::dist(c->cell, target->cell) > 1)
	{
		return false;
	}
	if (!spend(c, "action"))
	{
		return false;
	}
	const Var r = ability_check(c, "medicine");
	if (r.geti("total") >= 10)
	{
		log_msg(Loc::t("log.stabilize_ok", vdict({{"who", nm(c)}, {"target", nm(target)}})));
		stabilize(target);
	}
	else
	{
		log_msg(Loc::t("log.stabilize_fail", vdict({{"who", nm(c)}, {"target", nm(target)}})));
	}
	return true;
}

bool Battle::do_wake(Creature* c, Creature* target)
{
	if (target == nullptr || BattleMap::dist(c->cell, target->cell) > 1)
	{
		return false;
	}
	EffectPtr sl = target->get_effect("sleep");
	if (!sl)
	{
		return false;
	}
	if (!spend(c, "action"))
	{
		return false;
	}
	remove_effect(sl);
	log_msg(Loc::t("log.wake", vdict({{"who", nm(c)}, {"target", nm(target)}})));
	return true;
}

EffectPtr Battle::escape_effect(const Creature* c) const
{
	for (const EffectPtr& e : c->effects)
	{
		if (e->data.has("escape") && contains(e->grants, std::string("restrained")))
		{
			return e;
		}
	}
	return nullptr;
}

bool Battle::do_escape(Creature* c)
{
	EffectPtr e = escape_effect(c);
	if (!e)
	{
		return false;
	}
	if (!spend(c, "action"))
	{
		return false;
	}
	const std::string skill = c->skill_bonus("athletics") >= c->skill_bonus("acrobatics") ? "athletics" : "acrobatics";
	const Var r = ability_check(c, skill);
	const int total = r.geti("total");
	const int dc = e->data.get("escape").geti("dc", 10);
	emit(vdict({{"t", "escape"}, {"who", c->id}, {"success", total >= dc}, {"total", total}}));
	if (total >= dc)
	{
		remove_effect(e);
		log_msg(Loc::t("log.escape_ok", vdict({{"who", nm(c)}, {"total", total}, {"dc", dc}})));
	}
	else
	{
		log_msg(Loc::t("log.escape_fail", vdict({{"who", nm(c)}, {"total", total}, {"dc", dc}})));
	}
	return true;
}

bool Battle::do_potion(Creature* c, Creature* target)
{
	for (const char* pid : {"potion_greater_healing", "potion_healing"})
	{
		if (c->items.get(pid, 0) > 0)
		{
			return do_item(c, target, pid);
		}
	}
	return false;
}

StrList Battle::usable_potions(const Creature* c) const
{
	StrList out;
	for (const auto& kv : c->items)
	{
		if (kv.second > 0 && Items::kind(kv.first) == "potion")
		{
			out.push_back(kv.first);
		}
	}
	return out;
}

bool Battle::do_item(Creature* c, Creature* target, const std::string& item_id)
{
	const Json d = Items::data(item_id);
	if (jstr(d, "kind", "") != "potion" || c->items.get(item_id, 0) <= 0)
	{
		return false;
	}
	if (target == nullptr || target->dead || BattleMap::dist(c->cell, target->cell) > 1)
	{
		return false;
	}
	if (!spend(c, "bonus"))
	{
		return false;
	}
	c->items[item_id] = c->items.get(item_id, 0) - 1;
	if (c->items.get(item_id, 0) <= 0)
	{
		c->items.erase(item_id);
	}
	emit(vdict({{"t", "item"}, {"who", c->id}, {"target", target->id}, {"item", item_id}}));
	log_msg(Loc::t("log.item", vdict({{"who", nm(c)}, {"item", jstr(d, "name", item_id)}})));
	const Json& use = jobj(d, "use");
	if (use.contains("heal"))
	{
		heal(target, dice.roll(jstr(use, "heal")).total, c);
	}
	if (use.contains("set"))
	{
		const Json& set = jobj(use, "set");
		for (auto it = set.begin(); it != set.end(); ++it)
		{
			target->abilities[it.key()] = std::max(target->abilities.get(it.key(), 10), jto_int(it.value()));
		}
		EffectPtr e = make_effect("giant_strength");
		e->name = jstr(d, "name", item_id);
		e->positive = true;
		e->owner = target;
		target->effects.push_back(e);
		emit(vdict({{"t", "buff"}, {"who", target->id}, {"kind", "giant_strength"}}));
	}
	if (use.contains("effect"))
	{
		EffectPtr e2 = make_effect(jstr(use, "effect"));
		e2->name = jstr(d, "name", item_id);
		e2->positive = true;
		e2->owner = target;
		target->effects.push_back(e2);
		emit(vdict({{"t", "buff"}, {"who", target->id}, {"kind", jstr(use, "effect")}}));
	}
	return true;
}

bool Battle::do_second_wind(Creature* c)
{
	return cls->use(c, "second_wind");
}

bool Battle::do_action_surge(Creature* c)
{
	return cls->use(c, "action_surge");
}

bool Battle::do_steady_aim(Creature* c)
{
	return cls->use(c, "steady_aim");
}

bool Battle::do_shove(Creature* c, Creature* target, bool prone)
{
	if (target == nullptr || BattleMap::dist(c->cell, target->cell) > 1 || target->team == c->team)
	{
		return false;
	}
	if (target->size_rank() > c->size_rank() + 1)
	{
		return false;
	}
	if (c->turn.attack_left <= 0)
	{
		if (c->turn.action <= 0)
		{
			return false;
		}
		c->turn.action -= 1;
		c->turn.attack_left = attacks_per_action(c);
		c->turn.attack_action = true;
	}
	c->turn.attack_left -= 1;
	c->turn.acted = true;
	c->turn.can_undo = false;
	c->turn.rage_extended = true;
	int ab_mod = c->mod("str");
	if (c->cls == "monk" && c->unarmored_monk())
	{
		ab_mod = std::max(ab_mod, c->mod("dex"));
	}
	const int dc = 8 + ab_mod + c->prof_bonus;
	const std::string ab = target->save_bonus("str") >= target->save_bonus("dex") ? "str" : "dex";
	const Var r = saving_throw(target, ab, dc, c);
	emit(vdict({{"t", "shove"}, {"who", c->id}, {"target", target->id}, {"success", !r.getb("success")}}));
	if (r.getb("success"))
	{
		log_msg(Loc::t("log.shove_fail", vdict({{"who", nm(c)}, {"target", nm(target)}})));
	}
	else if (prone)
	{
		add_condition(target, "prone", "shove");
		log_msg(Loc::t("log.shove_prone", vdict({{"who", nm(c)}, {"target", nm(target)}})));
	}
	else
	{
		push_away(target, c->cell, 1);
		log_msg(Loc::t("log.shove_push", vdict({{"who", nm(c)}, {"target", nm(target)}})));
	}
	reveal(c);
	return true;
}

bool Battle::do_divine_spark(Creature* c, Creature* target)
{
	return cls->use(c, "divine_spark", vdict({{"target", target != nullptr ? target->id : std::string()}}));
}

bool Battle::do_turn_undead(Creature* c)
{
	return cls->use(c, "turn_undead");
}

bool Battle::do_preserve_life(Creature* c)
{
	return cls->use(c, "preserve_life");
}

// ---- Furia y forma salvaje (fin)

void Battle::end_rage(Creature* c)
{
	EffectPtr rg = c->get_effect("rage");
	if (rg)
	{
		remove_effect(rg);
		log_msg(Loc::t("log.rage_end", vdict({{"who", nm(c)}})));
	}
}

void Battle::revert_form(Creature* c)
{
	if (c->form.empty())
	{
		return;
	}
	c->leave_form();
	emit(vdict({{"t", "shape"}, {"who", c->id}, {"form", ""}}));
	log_msg(Loc::t("log.wild_shape_end", vdict({{"who", nm(c)}})));
}

// ---- Esfera llameante: daño al acabar el turno junto a ella

void Battle::flaming_sphere_end_turn(Creature* c)
{
	for (const Var& tid : tokens.keys())
	{
		const Var tk = tokens.get(tid);
		if (tk.gets("kind", "") != "flaming_sphere" || c->dead)
		{
			continue;
		}
		if (BattleMap::dist(tk.get("cell").cell(), c->cell) <= 1)
		{
			spells->flaming_sphere_hit(tk, c);
		}
	}
}

// ---- Monstruos

bool Battle::do_life_drain(Creature* a, Creature* t)
{
	if (a->life_drain.empty() || t == nullptr || BattleMap::dist(a->cell, t->cell) > 1)
	{
		return false;
	}
	if (a->turn.attack_left <= 0)
	{
		if (a->turn.action <= 0)
		{
			return false;
		}
		a->turn.action -= 1;
		a->turn.attack_left = attacks_per_action(a);
	}
	if (a->turn.life_drain_used)
	{
		return false;
	}
	a->turn.attack_left -= 1;
	a->turn.life_drain_used = true;
	a->turn.acted = true;
	emit(vdict({{"t", "special"}, {"who", a->id}, {"target", t->id}, {"name", "Drenar vida"}}));
	log_msg(Loc::t("log.life_drain_try", vdict({{"who", nm(a)}, {"target", nm(t)}})));
	const Var r = saving_throw(t, "con", jint(a->life_drain, "dc"), a);
	if (!r.getb("success"))
	{
		const int dmg = apply_damage(t, dice.roll(jstr(a->life_drain, "dice")).total, jstr(a->life_drain, "type"), a);
		if (!t->dead && dmg > 0)
		{
			t->max_hp = std::max(1, t->max_hp - dmg);
			t->hp = std::min(t->hp, t->max_hp);
			log_msg(Loc::t("log.life_drain", vdict({{"who", nm(a)}, {"target", nm(t)}, {"max", t->max_hp}})));
			emit(vdict({{"t", "max_hp"}, {"who", t->id}, {"max", t->max_hp}, {"hp", t->hp}}));
		}
	}
	return true;
}

// ---- Efectos que duran hasta el final del SIGUIENTE turno de alguien

void Battle::expire_end_turn_next(const Creature* who)
{
	for (const CreaturePtr& cp : creatures)
	{
		const std::vector<EffectPtr> snapshot = cp->effects;
		for (const EffectPtr& e : snapshot)
		{
			if (e->expires == "end_turn_next" && e->expires_who == who && battle_detail::has_effect_ptr(cp.get(), e))
			{
				if (e->data.getb("skip_first_end", false))
				{
					e->data["skip_first_end"] = false;
				}
				else
				{
					remove_effect(e);
				}
			}
		}
	}
}

} // namespace mdg
