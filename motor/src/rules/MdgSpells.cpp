#include "MdgSpells.h"

#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgSort.h"

namespace mdg
{

namespace spells_detail
{

const StrList kTransmuteTypes = {"acid", "cold", "fire", "lightning", "poison", "thunder"};

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

/** [t.cell] + vecinos: el objetivo y quien esté a 1,5 m. */
std::vector<Cell> burst_cells(const Cell& center)
{
	std::vector<Cell> cells = {center};
	for (const Cell& n : BattleMap::neighbors(center))
	{
		cells.push_back(n);
	}
	return cells;
}

} // namespace spells_detail

int SpellResolver::meta_cost(const std::string& meta)
{
	if (meta == "heightened" || meta == "quickened")
	{
		return 2;
	}
	for (const char* m : {"careful", "distant", "empowered", "extended", "seeking", "subtle", "transmuted", "twinned"})
	{
		if (meta == m)
		{
			return 1;
		}
	}
	return 99;
}

double SpellResolver::control_weight_of(const std::string& kind)
{
	static const Dict<double> table = []() {
		Dict<double> d;
		d["blinded_spell"] = 1.0;
		d["blinded_long"] = 1.3;
		d["laughing"] = 1.5;
		d["entangled"] = 0.9;
		d["webbed"] = 0.9;
		d["ensnared"] = 0.9;
		d["outlined"] = 0.5;
		d["bane"] = 0.4;
		d["mocked"] = 0.25;
		d["enfeebled"] = 0.6;
		d["charmed_by"] = 0.4;
		d["suggested"] = 1.4;
		d["frightened_spell"] = 0.6;
		d["poisoned_spell"] = 0.3;
		d["no_reactions"] = 0.1;
		d["mind_spiked"] = 0.05;
		d["no_heal"] = 0.05;
		d["outlined_wisp"] = 0.0;
		return d;
	}();
	return table.get(kind, 0.3);
}

// ================================================================== consulta

int SpellResolver::spell_cells(const Json& sp, const Creature* c, const std::string& meta) const
{
	int r = jint(sp, "range", 0);
	if (c != nullptr && jstr(sp, "special_hit", "") == "eldritch_blast" && c->has_trait("eldritch_spear"))
	{
		r = 300;
	}
	if (meta == "distant")
	{
		r = r == 5 ? 30 : r * 2;
	}
	if (r <= 5)
	{
		return r == 5 ? 1 : 0;
	}
	return r / 5;
}

int SpellResolver::cantrip_mult(const Creature* c) const
{
	if (c->level >= 17)
	{
		return 4;
	}
	if (c->level >= 11)
	{
		return 3;
	}
	if (c->level >= 5)
	{
		return 2;
	}
	return 1;
}

std::string SpellResolver::parent_of(const std::string& sid) const
{
	const Json& sp = RulesDB::spell(sid);
	return sp.contains("requires_effect") ? jto_str(sp["requires_effect"]) : sid;
}

std::vector<Var> SpellResolver::available(Creature* c)
{
	std::vector<Var> out;
	StrList ids = c->known_spells();
	// Acciones derivadas de efectos activos (Lanzar llama, Tajo de fuego, Exhalar aliento)
	for (auto it = RulesDB::spells.begin(); it != RulesDB::spells.end(); ++it)
	{
		const Json& dsp = it.value();
		if (jbool(dsp, "hidden", false) && c->has_effect(jstr(dsp, "requires_effect", "")))
		{
			ids.push_back(it.key());
		}
	}
	for (const std::string& sid : ids)
	{
		const Json& sp = RulesDB::spell(sid);
		const std::string cast_kind = jstr(sp, "cast");
		if (sp.empty() || jbool(sp, "utility", false) || cast_kind == "reaction" || cast_kind == "rider")
		{
			continue;
		}
		if (sid == "mage_armor" && !contains(c->at_will, sid))
		{
			continue;
		}
		Var entry = vdict({{"id", sid}, {"name", jstr(sp, "name")}, {"level", jint(sp, "level")}, {"cost", cast_kind},
			{"desc", jstr(sp, "desc", "")}, {"target", jstr(sp, "target")}, {"usable", true}, {"reason", ""}, {"slots", Var::array()},
			{"free", false}, {"at_will", contains(c->at_will, sid)}, {"concentration", jbool(sp, "concentration", false)},
			{"derived", jbool(sp, "hidden", false)}});
		const int lvl = jint(sp, "level");
		if (lvl > 0 && !contains(c->at_will, sid))
		{
			if (c->free_casts.get(sid, 0) > 0)
			{
				entry["free"] = true;
				entry["slots"].push(lvl);
			}
			for (int i = lvl - 1; i < static_cast<int>(c->slots.size()); ++i)
			{
				if (i >= 0 && c->slots[static_cast<size_t>(i)] > 0 && !entry.get("slots").contains(Var(i + 1)))
				{
					entry["slots"].push(i + 1);
				}
			}
			if (entry.get("slots").is_empty())
			{
				entry["usable"] = false;
				entry["reason"] = "Sin espacios de conjuro";
			}
			else if (c->turn.slot_spell_cast && !entry.getb("free"))
			{
				entry["usable"] = false;
				entry["reason"] = "Ya gastaste un espacio este turno";
			}
		}
		else if (lvl > 0)
		{
			entry["slots"].push(lvl);
		}
		if (!jbool(sp, "hidden", false) && (c->is_raging() || !c->form.empty()))
		{
			entry["usable"] = false;
			entry["reason"] = "No puedes lanzar conjuros ahora";
		}
		else if (cast_kind == "action" && (c->turn.action <= 0 && c->turn.attack_left <= 0))
		{
			entry["usable"] = false;
			entry["reason"] = "Sin acción";
		}
		else if (cast_kind == "action" && c->turn.attack_left > 0 && c->turn.action <= 0)
		{
			entry["usable"] = false;
			entry["reason"] = "Ya has usado la acción para atacar";
		}
		else if (cast_kind == "bonus" && c->turn.bonus <= 0)
		{
			entry["usable"] = false;
			entry["reason"] = "Sin acción adicional";
		}
		if (entry.getb("usable") && !has_any_target(c, sid))
		{
			entry["usable"] = false;
			entry["reason"] = "Sin objetivos válidos";
		}
		out.push_back(entry);
	}
	godot_sort(out, [](const Var& x, const Var& y) {
		const int lx = x.geti("level");
		const int ly = y.geti("level");
		return lx != ly ? lx < ly : x.gets("name") < y.gets("name");
	});
	return out;
}

bool SpellResolver::has_any_target(Creature* c, const std::string& sid)
{
	const std::string tt = jstr(RulesDB::spell(sid), "target");
	if (tt == "point" || tt == "direction" || tt == "cell" || tt == "self")
	{
		return true;
	}
	return !valid_targets(c, sid).empty();
}

std::vector<Creature*> SpellResolver::valid_targets(Creature* c, const std::string& sid, std::optional<Cell> from_cell, const std::string& meta)
{
	const Json& sp = RulesDB::spell(sid);
	const Cell fc = from_cell ? *from_cell : c->cell;
	const int rng = spell_cells(sp, c, meta);
	std::vector<Creature*> out;
	const std::string tt = jstr(sp, "target");
	if (tt == "weapon")
	{
		for (Creature* o : b.enemies_of(c))
		{
			if (o->is_active() && !weapon_profile_for(c, o, fc).is_empty() && b.sees(c, o, fc) && b.may_target(c, o))
			{
				out.push_back(o);
			}
		}
		return out;
	}
	for (const CreaturePtr& op : b.creatures)
	{
		Creature* o = op.get();
		if (o->dead)
		{
			continue;
		}
		const int d = BattleMap::dist(fc, o->cell);
		if (d > std::max(rng, 0))
		{
			if (!(tt == "self" && o == c))
			{
				continue;
			}
		}
		if (tt == "enemy" || tt == "darts" || tt == "rays" || tt == "enemies")
		{
			if (o->team == c->team || !o->is_active() || !b.sees(c, o, fc) || !b.may_target(c, o))
			{
				continue;
			}
			if (jbool(sp, "no_beasts", false) && o->ctype == "beast")
			{
				continue;
			}
		}
		else if (tt == "enemy_humanoid")
		{
			if (o->team == c->team || !o->is_active() || o->ctype != "humanoid" || !b.sees(c, o, fc) || !b.may_target(c, o))
			{
				continue;
			}
		}
		else if (tt == "ally" || tt == "allies")
		{
			if (o->team != c->team)
			{
				continue;
			}
		}
		else if (tt == "ally_other")
		{
			if (o->team != c->team || o == c)
			{
				continue;
			}
		}
		else if (tt == "creature")
		{
			if (!o->is_active())
			{
				continue;
			}
			if (o->team != c->team && (!b.sees(c, o, fc) || !b.may_target(c, o)))
			{
				continue;
			}
		}
		else if (tt == "downed_ally")
		{
			if (o->team != c->team || !o->is_down() || o->stable)
			{
				continue;
			}
		}
		else if (tt == "ally_unarmored")
		{
			if (o->team != c->team || !o->armor_id.empty())
			{
				continue;
			}
		}
		else if (tt == "self")
		{
			if (o != c)
			{
				continue;
			}
		}
		else
		{
			continue;
		}
		if (o != c && d > 1 && b.map.cover_between(fc, o->cell) >= 3)
		{
			continue;
		}
		out.push_back(o);
	}
	return out;
}

Var SpellResolver::weapon_profile_for(Creature* c, Creature* t, const Cell& fc)
{
	Var best = Var::dict();
	double best_v = -1.0;
	for (const Var& p : b.attack_profiles(c))
	{
		if (!b.in_attack_range(c, p, t, fc) || b.map.cover_between(fc, t->cell) >= 3)
		{
			continue;
		}
		const double v = Dice::average(p.get("die").as_str()) + (p.gets("kind") == "melee" ? 2.0 : 0.0);
		if (v > best_v)
		{
			best_v = v;
			best = p;
		}
	}
	return best;
}

int SpellResolver::area_radius(const Json& sp, int slot) const
{
	const Json& area_def = jobj(sp, "area");
	int r = jint(area_def, "radius", 5);
	if (sp.contains("upcast_radius") && slot > jint(sp, "level"))
	{
		r += jint(sp, "upcast_radius") * (slot - jint(sp, "level"));
	}
	return r;
}

std::vector<Cell> SpellResolver::area_cells(Creature* c, const std::string& sid, const Var& data, std::optional<Cell> from_cell, int slot)
{
	const Json& sp = RulesDB::spell(sid);
	const Json& area_def = jobj(sp, "area");
	const Cell fc = from_cell ? *from_cell : c->cell;
	if (area_def.empty())
	{
		return {};
	}
	if (slot < 0)
	{
		slot = data.has("slot") ? data.geti("slot") : jint(sp, "level", 0);
	}
	const std::string shape = jstr(area_def, "shape");
	const Vec2 default_dir = BattleMap::center(fc) + Vec2(0.0f, 1.0f);
	if (shape == "sphere")
	{
		const Vec2 corner = data.has("point") ? data.get("point").vec2() : BattleMap::center(fc);
		return b.map.sphere_cells(corner, area_radius(sp, slot));
	}
	if (shape == "square")
	{
		const Vec2 corner2 = data.has("point") ? data.get("point").vec2() : BattleMap::center(fc);
		return b.map.square_cells(corner2, jint(area_def, "size"));
	}
	const Vec2 dir = data.has("dir") ? data.get("dir").vec2() : default_dir;
	if (shape == "cone")
	{
		return b.map.cone_cells(fc, dir, jint(area_def, "length"));
	}
	if (shape == "cube")
	{
		return b.map.cube_from_self(fc, dir, jint(area_def, "size"));
	}
	if (shape == "line")
	{
		return b.map.line_cells(fc, dir, jint(area_def, "length"));
	}
	if (shape == "emanation")
	{
		return b.map.emanation_cells(fc, jint(area_def, "radius"));
	}
	return {};
}

std::vector<Creature*> SpellResolver::creatures_in(const std::vector<Cell>& cells, const Creature* exclude) const
{
	std::vector<Creature*> out;
	for (const CreaturePtr& op : b.creatures)
	{
		if (op->dead || op.get() == exclude)
		{
			continue;
		}
		if (contains(cells, op->cell))
		{
			out.push_back(op.get());
		}
	}
	return out;
}

bool SpellResolver::point_in_range(Creature* c, const std::string& sid, const Vec2& point, std::optional<Cell> from_cell, const std::string& meta)
{
	const Json& sp = RulesDB::spell(sid);
	const Cell fc = from_cell ? *from_cell : c->cell;
	const Cell center = BattleMap::cell_at(point);
	const int d = BattleMap::dist(fc, center);
	return d <= spell_cells(sp, c, meta) && (center == fc || b.map.has_los(fc, center));
}

std::vector<Creature*> SpellResolver::area_targets(Creature* c, const std::string& sid, const Var& data, std::optional<Cell> from_cell, int slot)
{
	const Json& sp = RulesDB::spell(sid);
	const std::vector<Cell> cells = area_cells(c, sid, data, from_cell, slot);
	std::vector<Creature*> targets = creatures_in(cells, c);
	if (jbool(sp, "only_enemies", false))
	{
		targets = filter(targets, [c](Creature* o) { return o->team != c->team; });
	}
	return targets;
}

// ================================================================== previsión

std::string SpellResolver::damage_type(Creature* c, const Json& sp, Creature* t, const Var& data) const
{
	(void)c;
	const Json& dmg = jobj(sp, "damage");
	const std::string dtype = jstr(dmg, "type", "");
	if (data.has("dtype"))
	{
		return data.get("dtype").str();
	}
	StrList choices = jstrs(sp, "damage_choice");
	if (data.gets("meta", "") == "transmuted")
	{
		choices = spells_detail::kTransmuteTypes;
	}
	if (!choices.empty() && t != nullptr)
	{
		std::string best = contains(choices, dtype) ? dtype : choices[0];
		for (const std::string& ch : choices)
		{
			if (b.damage_multiplier(t, ch) > b.damage_multiplier(t, best))
			{
				best = ch;
			}
		}
		return best;
	}
	return dtype;
}

std::string SpellResolver::damage_expr(const Creature* c, const Json& sp, int slot) const
{
	const Json& dmg = jobj(sp, "damage");
	if (dmg.empty())
	{
		return "";
	}
	std::string expr = jstr(dmg, "dice");
	// Acciones derivadas cuyo daño fijó el conjuro original
	const std::string req = jstr(sp, "requires_effect", "");
	if (!req.empty())
	{
		EffectPtr fe = c->get_effect(req);
		if (fe && fe->data.has("dice"))
		{
			expr = fe->data.get("dice").str();
		}
	}
	const int lvl = jint(sp, "level");
	if (lvl == 0 && req.empty())
	{
		const int mult = cantrip_mult(c);
		if (mult > 1 && !jbool(sp, "cantrip_beams", false))
		{
			expr = Dice::add_dice(expr, Dice::parse(expr).count * (mult - 1));
		}
	}
	else if (sp.contains("upcast_dice") && slot > lvl && lvl > 0)
	{
		const int extra = Dice::parse(jstr(sp, "upcast_dice")).count * (slot - lvl);
		expr = Dice::add_dice(expr, extra);
	}
	if (jbool(dmg, "mod", false))
	{
		const std::string parent = !req.empty() ? req : std::string();
		expr = Dice::with_bonus(expr, c->spell_mod(parent));
	}
	if (jstr(sp, "special_hit", "") == "eldritch_blast" && c->has_trait("agonizing_blast"))
	{
		expr = Dice::with_bonus(expr, std::max(0, c->mod("cha")));
	}
	return expr;
}

std::string SpellResolver::heal_expr(const Creature* c, const Json& sp, int slot, const std::string& sid) const
{
	const Json& h = jobj(sp, "heal");
	std::string expr = jstr(h, "dice", "0");
	if (sp.contains("upcast_heal") && slot > jint(sp, "level"))
	{
		expr = Dice::add_dice(expr, Dice::parse(jstr(sp, "upcast_heal")).count * (slot - jint(sp, "level")));
	}
	int bonus = 0;
	if (jbool(h, "mod", false))
	{
		bonus += c->spell_mod(sid);
	}
	if (slot > 0 && c->has_trait("disciple_of_life"))
	{
		bonus += 2 + slot;
	}
	return Dice::with_bonus(expr, bonus);
}

int SpellResolver::save_dc(const Creature* c, const std::string& sid) const
{
	const std::string req = parent_of(sid);
	EffectPtr fe = req != sid ? c->get_effect(req) : nullptr;
	if (fe && fe->data.has("dc"))
	{
		return fe->data.geti("dc");
	}
	return c->spell_save_dc(req);
}

int SpellResolver::attack_bonus(const Creature* c, const std::string& sid) const
{
	return c->spell_attack_bonus(parent_of(sid));
}

int SpellResolver::max_targets(const Json& sp, int slot, const std::string& meta) const
{
	int max_t = jint(sp, "max_targets", 1);
	const int eff = slot + (meta == "twinned" ? 1 : 0);
	if (sp.contains("upcast_targets") && eff > jint(sp, "level"))
	{
		max_t += jint(sp, "upcast_targets") * (eff - jint(sp, "level"));
	}
	return max_t;
}

int SpellResolver::n_darts(const Creature* c, const Json& sp, int slot) const
{
	if (jbool(sp, "cantrip_beams", false))
	{
		return cantrip_mult(c);
	}
	return jint(sp, "darts", 1) + jint(sp, "upcast_darts", 0) * std::max(0, slot - jint(sp, "level"));
}

Var SpellResolver::preview(Creature* c, const std::string& sid, int slot, const Var& data, std::optional<Cell> from_cell)
{
	const Json& sp = RulesDB::spell(sid);
	const Cell fc = from_cell ? *from_cell : c->cell;
	double res_enemy = 0.0;
	double res_ally = 0.0;
	double res_heal = 0.0;
	double res_control = 0.0;
	double res_kills = 0.0;
	Var affected = Var::array();
	auto result = [&]() {
		return vdict({{"enemy_dmg", res_enemy}, {"ally_dmg", res_ally}, {"heal", res_heal}, {"affected", affected}, {"control", res_control},
			{"kills", res_kills}});
	};
	const std::string dexpr = damage_expr(c, sp, slot);
	double avg = !dexpr.empty() ? Dice::average(dexpr) : 0.0;
	if (sid == "toll_the_dead")
	{
		avg = 0.0;
	}
	std::vector<Creature*> targets;
	const std::string sp_target = jstr(sp, "target");
	const Var data_targets = data.get("targets", Var::array());
	if (sp.contains("area"))
	{
		targets = area_targets(c, sid, data, fc, slot);
	}
	else if (sp_target == "weapon")
	{
		for (const Var& tidv : data_targets.arr())
		{
			Creature* tw = b.get_creature(tidv.as_str());
			if (tw != nullptr)
			{
				const Var p = true_strike_profile(c, tw, fc);
				if (!p.is_empty())
				{
					const Var pv = b.preview_attack(c, p, tw, fc);
					res_enemy += pv.getf("expected");
					if (pv.getf("avg") >= tw->hp)
					{
						res_kills += pv.getf("p_hit");
					}
					affected.push(vdict({{"id", tw->id}, {"expected", pv.get("expected")}, {"p", pv.get("p_hit")}, {"team", tw->team}}));
				}
			}
		}
		return result();
	}
	else
	{
		for (const Var& tidv : data_targets.arr())
		{
			Creature* t = b.get_creature(tidv.as_str());
			if (t != nullptr)
			{
				targets.push_back(t);
			}
		}
	}
	const int dc = save_dc(c, sid);
	int careful_left = data.gets("meta", "") == "careful" ? std::max(1, c->mod("cha")) : 0;
	const int sp_level = jint(sp, "level");
	for (Creature* t : targets)
	{
		double expv = 0.0;
		double p_effect = 1.0;
		double t_avg = avg;
		if (sid == "toll_the_dead")
		{
			t_avg = Dice::average(t->hp < t->max_hp ? jstr(sp, "wounded_dice") : jstr(jobj(sp, "damage"), "dice"));
		}
		const std::string dtype = damage_type(c, sp, t, data);
		if (sp.contains("attack"))
		{
			const Var mi = b.attack_mode(c, t, jstr(sp, "attack"), fc, vdict({{"spell", sid}}));
			const int ac = t->ac() + BattleMap::cover_ac_bonus(b.map.cover_between(fc, t->cell, b.blockers_for(c, t)));
			p_effect = Dice::p_success(attack_bonus(c, sid), ac, mi.geti("mode"));
			if (data.gets("meta", "") == "seeking")
			{
				p_effect = 1.0 - (1.0 - p_effect) * (1.0 - p_effect);
			}
			expv = p_effect * t_avg;
			if (jbool(sp, "miss_half", false))
			{
				expv += (1.0 - p_effect) * t_avg * 0.5;
			}
			if (sp_level == 0 && c->has_trait("potent_cantrip"))
			{
				expv += (1.0 - p_effect) * t_avg * 0.5;
			}
			if (sid == "ice_knife")
			{
				const Json& burst = jobj(sp, "burst");
				std::string bexpr = jstr(burst, "dice");
				if (slot > 1)
				{
					bexpr = Dice::add_dice(bexpr, Dice::parse(jstr(burst, "upcast")).count * (slot - 1));
				}
				const double pf_b = 1.0 - Dice::p_success(t->save_bonus("dex"), dc, 0, 21, false);
				expv += pf_b * Dice::average(bexpr) * b.damage_multiplier(t, "cold");
			}
		}
		else if (sp.contains("save"))
		{
			const Json& sv = jobj(sp, "save");
			if (jbool(sv, "enemies_only", false) && t->team == c->team)
			{
				p_effect = 1.0;
			}
			else
			{
				int mode = 0;
				if (jbool(sv, "hostile_adv", false))
				{
					mode = 1;
				}
				if (jstr(sv, "ability", "") == "dex" && t->has_trait("danger_sense"))
				{
					mode = 1;
				}
				const std::string sab = jstr(sv, "ability");
				double p_save = Dice::p_success(t->save_bonus(sab), dc, mode, 21, false);
				if ((sab == "str" || sab == "dex") && (t->has_condition("paralyzed") || t->has_condition("unconscious")))
				{
					p_save = 0.0;
				}
				if (t->team == c->team && careful_left > 0)
				{
					p_save = 1.0;
					careful_left -= 1;
				}
				p_effect = 1.0 - p_save;
				if (sid == "sleep" && (t->ctype == "undead" || contains(t->condition_immune, std::string("exhaustion")) || t->has_trait("trance")))
				{
					p_effect = 0.0;
				}
				if (sid == "hold_person" && t->ctype != "humanoid")
				{
					p_effect = 0.0;
				}
				expv = p_effect * t_avg + (jbool(sv, "half", false) ? p_save * t_avg * 0.5 : 0.0);
				if (sp_level == 0 && c->has_trait("potent_cantrip") && !jbool(sv, "half", false))
				{
					expv += p_save * t_avg * 0.5;
				}
			}
		}
		else if (sid == "magic_missile")
		{
			expv = t_avg * data_targets.count(Var(t->id));
		}
		else
		{
			expv = t_avg;
		}
		if ((sp_target == "rays" || sp_target == "darts") && sid != "magic_missile")
		{
			expv *= data_targets.count(Var(t->id));
		}
		expv = !dtype.empty() ? expv * b.damage_multiplier(t, dtype) : expv;
		if (t->team != c->team)
		{
			res_enemy += expv;
			if (expv >= t->hp)
			{
				res_kills += p_effect;
			}
			const double w = control_weight(sp);
			if (w > 0.0 || jin(jarr(sp, "tags"), "control"))
			{
				res_control += p_effect * std::max(w, 0.6) * (1.0 + std::min(t->hp, 40) / 10.0);
			}
		}
		else
		{
			res_ally += expv;
			if (sp.contains("on_fail_effect") && !jbool(sp, "only_enemies", false))
			{
				res_control -= p_effect * control_weight(sp) * 2.0;
			}
		}
		affected.push(vdict({{"id", t->id}, {"expected", expv}, {"p", p_effect}, {"team", t->team}}));
	}
	if (sp.contains("heal"))
	{
		const std::string hexpr = heal_expr(c, sp, slot, sid);
		for (const Var& tidv : data_targets.arr())
		{
			Creature* t2 = b.get_creature(tidv.as_str());
			if (t2 != nullptr)
			{
				res_heal += std::min(Dice::average(hexpr), static_cast<double>(t2->max_hp - t2->hp));
			}
		}
	}
	return result();
}

double SpellResolver::control_weight(const Json& sp) const
{
	const Json& spec = sp.contains("on_fail_effect") ? jobj(sp, "on_fail_effect") : jobj(sp, "on_hit_effect");
	if (!spec.empty())
	{
		return control_weight_of(jstr(spec, "kind", ""));
	}
	const std::string of = jstr(sp, "on_fail", "");
	if (of == "prone")
	{
		return 0.4;
	}
	if (of == "flee_reaction")
	{
		return 0.3;
	}
	if (of == "push10")
	{
		return 0.15;
	}
	return 0.0;
}

// ================================================================== tiradas de daño

int SpellResolver::roll_damage(Creature* c, const Json& sp, const std::string& expr, bool crit, const Var& data)
{
	const RollResult r = b.dice.roll(expr, crit);
	std::vector<int> rolls = r.rolls;
	const DiceExpr p = Dice::parse(expr);
	if (data.gets("meta", "") == "empowered" && p.sides > 0)
	{
		int n = std::max(1, c->mod("cha"));
		std::vector<int> idx;
		for (size_t i = 0; i < rolls.size(); ++i)
		{
			idx.push_back(static_cast<int>(i));
		}
		godot_sort(idx, [&rolls](int x, int y) { return rolls[static_cast<size_t>(x)] < rolls[static_cast<size_t>(y)]; });
		for (int i : idx)
		{
			if (n <= 0)
			{
				break;
			}
			if (static_cast<double>(rolls[static_cast<size_t>(i)]) < (p.sides + 1) / 2.0)
			{
				rolls[static_cast<size_t>(i)] = b.dice.die(p.sides);
				n -= 1;
			}
		}
	}
	int total = p.bonus;
	for (int v : rolls)
	{
		total += v;
	}
	if (jbool(sp, "exploding", false) && p.sides > 0)
	{
		int extra_left = std::max(0, c->spell_mod());
		for (int v : rolls)
		{
			if (extra_left <= 0)
			{
				break;
			}
			if (v == p.sides)
			{
				total += b.dice.die(p.sides);
				extra_left -= 1;
			}
		}
	}
	return total;
}

// ================================================================== lanzamiento

Var SpellResolver::slot_cost_ok(Creature* c, const std::string& sid, const Json& sp, int slot)
{
	const int lvl = jint(sp, "level");
	if (lvl == 0 || contains(c->at_will, sid))
	{
		return vdict({{"ok", true}, {"free", false}, {"slot", lvl > 0 ? slot : 0}});
	}
	if (c->free_casts.get(sid, 0) > 0 && slot <= lvl)
	{
		return vdict({{"ok", true}, {"free", true}, {"slot", lvl}});
	}
	if (slot < lvl)
	{
		slot = lvl;
	}
	if (slot - 1 >= static_cast<int>(c->slots.size()) || slot < 1 || c->slots[static_cast<size_t>(slot - 1)] <= 0)
	{
		return vdict({{"ok", false}});
	}
	if (c->turn.slot_spell_cast)
	{
		return vdict({{"ok", false}});
	}
	return vdict({{"ok", true}, {"free", false}, {"slot", slot}});
}

bool SpellResolver::cast(Creature* c, const std::string& sid, int slot, Var data)
{
	const Json& sp = RulesDB::spell(sid);
	if (sp.empty() || !c->can_act())
	{
		return false;
	}
	if (!data.is_dict())
	{
		data = Var::dict();
	}
	if (jbool(sp, "hidden", false))
	{
		if (!c->has_effect(jstr(sp, "requires_effect", "")))
		{
			return false;
		}
	}
	else if (c->is_raging() || !c->form.empty())
	{
		return false;
	}
	const int lvl = jint(sp, "level");
	const std::string item_id = data.gets("item", "");
	const Var pay = item_id.empty() ? slot_cost_ok(c, sid, sp, slot) : item_cost(c, item_id, sid, slot);
	if (!pay.getb("ok"))
	{
		return false;
	}
	slot = pay.geti("slot");
	// Metamagia
	std::string meta = data.gets("meta", "");
	if (!meta.empty())
	{
		if (!contains(c->metamagic, meta) || c->resources.get("sorcery_points", 0) < meta_cost(meta))
		{
			meta.clear();
			data.erase("meta");
		}
	}
	if (!validate(c, sid, slot, data))
	{
		return false;
	}
	std::string cost = jstr(sp, "cast") == "bonus" ? "bonus" : "action";
	if (meta == "quickened" && cost == "action")
	{
		cost = "bonus";
	}
	if (!b.spend(c, cost))
	{
		return false;
	}
	if (!meta.empty())
	{
		c->resources["sorcery_points"] -= meta_cost(meta);
		b.emit(vdict({{"t", "feature"}, {"who", c->id}, {"feature", "metamagic"}, {"name", RulesDB::feature_name(meta)}}));
		b.log_msg(Loc::t("log.metamagic", vdict({{"who", Battle::nm(c)}, {"meta", RulesDB::feature_name(meta)}})));
	}
	if (pay.getb("item", false))
	{
		// Pergamino (se consume) o varita (gasta cargas)
		const Json idata = Items::data(item_id);
		if (jstr(idata, "kind", "") == "scroll")
		{
			c->items[item_id] = c->items.get(item_id, 0) - 1;
			if (c->items.get(item_id, 0) <= 0)
			{
				c->items.erase(item_id);
			}
		}
		else
		{
			c->item_charges[item_id] = c->item_charges.get(item_id, 0) - pay.geti("charges");
		}
		c->item_cast = Json{{"spell", sid}};
		if (idata.contains("dc"))
		{
			c->item_cast["dc"] = jint(idata, "dc");
		}
		if (idata.contains("atk"))
		{
			c->item_cast["atk"] = jint(idata, "atk");
		}
		b.emit(vdict({{"t", "item"}, {"who", c->id}, {"target", c->id}, {"item", item_id}}));
	}
	else if (lvl > 0 && !contains(c->at_will, sid))
	{
		if (pay.getb("free"))
		{
			c->free_casts[sid] -= 1;
		}
		else
		{
			c->slots[static_cast<size_t>(slot - 1)] -= 1;
			c->turn.slot_spell_cast = true;
		}
	}
	// Santuario e invisibilidad terminan si el protegido lanza un conjuro
	EffectPtr sanct = c->get_effect("sanctuary");
	if (sanct)
	{
		b.remove_effect(sanct);
	}
	EffectPtr inv = c->get_effect("invisible_spell");
	if (inv)
	{
		b.remove_effect(inv);
	}
	b.reveal(c);
	c->turn.rage_extended = true;
	data["slot"] = slot;
	Var ev = vdict({{"t", "cast"}, {"who", c->id}, {"spell", sid}, {"name", jstr(sp, "name")}, {"slot", slot},
		{"targets", data.get("targets", Var::array()).duplicate()}, {"point", data.get("point")}, {"dir", data.get("dir")},
		{"cell", data.get("cell")}, {"cells", Var::array()}, {"fx", jstr(sp, "fx", "")}});
	if (sp.contains("area"))
	{
		ev["cells"] = spells_detail::cells_var(area_cells(c, sid, data, std::nullopt, slot));
	}
	if (!jarr(sp, "damage_choice").empty() || meta == "transmuted")
	{
		const Var tl = data.get("targets", Var::array());
		Creature* t0 = tl.size() > 0 ? b.get_creature(tl.at(0).as_str()) : nullptr;
		ev["dtype"] = damage_type(c, sp, t0, data);
	}
	b.emit(ev);
	if (lvl > 0 && slot > lvl)
	{
		b.log_msg(Loc::t("log.cast_slot", vdict({{"who", Battle::nm(c)}, {"spell", jstr(sp, "name")}, {"slot", slot}})));
	}
	else
	{
		b.log_msg(Loc::t("log.cast", vdict({{"who", Battle::nm(c)}, {"spell", jstr(sp, "name")}})));
	}
	if (jbool(sp, "concentration", false))
	{
		int rounds = jint(sp, "duration", 10);
		if (meta == "extended")
		{
			rounds *= 2;
		}
		b.start_concentration(c, sid, rounds);
		if (meta == "extended")
		{
			EffectPtr xc = make_effect("extended_conc");
			xc->source = c;
			b.attach_effect(c, xc);
			b.link_to_concentration(c, xc);
		}
	}
	resolve(c, sid, sp, slot, data);
	c->item_cast = Json::object();
	b.check_end();
	return true;
}

Var SpellResolver::item_cost(Creature* c, const std::string& item_id, const std::string& sid, int slot)
{
	const Json d = Items::data(item_id);
	if (jstr(d, "spell", "") != sid)
	{
		return vdict({{"ok", false}});
	}
	const int lvl = jint(RulesDB::spell(sid), "level", 1);
	const std::string k = jstr(d, "kind", "");
	if (k == "scroll")
	{
		if (c->items.get(item_id, 0) <= 0)
		{
			return vdict({{"ok", false}});
		}
		return vdict({{"ok", true}, {"free", true}, {"item", true}, {"slot", jint(d, "level", lvl)}, {"charges", 0}});
	}
	if (k == "wand")
	{
		const int s = sid == "magic_missile" ? std::clamp(slot, lvl, 3) : lvl;
		const int cost = sid == "magic_missile" ? s : 1;
		if (c->item_charges.get(item_id, 0) < cost)
		{
			return vdict({{"ok", false}});
		}
		return vdict({{"ok", true}, {"free", true}, {"item", true}, {"slot", s}, {"charges", cost}});
	}
	return vdict({{"ok", false}});
}

bool SpellResolver::cast_reaction(Creature* c, const std::string& sid, Creature* target)
{
	const Json& sp = RulesDB::spell(sid);
	if (!c->can_react() || target == nullptr || target->dead)
	{
		return false;
	}
	const int lvl = jint(sp, "level");
	int slot = lvl;
	if (c->free_casts.get(sid, 0) > 0)
	{
		c->free_casts[sid] -= 1;
	}
	else
	{
		slot = c->lowest_slot(lvl);
		if (slot <= 0)
		{
			return false;
		}
		c->slots[static_cast<size_t>(slot - 1)] -= 1;
	}
	c->turn.reaction = 0;
	b.emit(vdict({{"t", "reaction"}, {"who", c->id}, {"name", jstr(sp, "name")}, {"spell", sid}, {"target", target->id}}));
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", sid}, {"name", jstr(sp, "name")}, {"slot", slot}, {"targets", varr({target->id})},
		{"cells", Var::array()}, {"fx", jstr(sp, "fx", "")}}));
	b.log_msg(Loc::t("log.cast", vdict({{"who", Battle::nm(c)}, {"spell", jstr(sp, "name")}})));
	single_save(c, target, sid, sp, slot, Var::dict());
	return true;
}

bool SpellResolver::validate(Creature* c, const std::string& sid, int slot, const Var& data)
{
	const Json& sp = RulesDB::spell(sid);
	const std::string tt = jstr(sp, "target");
	const std::string meta = data.gets("meta", "");
	if (tt == "point")
	{
		return data.has("point") && point_in_range(c, sid, data.get("point").vec2(), std::nullopt, meta);
	}
	if (tt == "direction")
	{
		return data.has("dir");
	}
	if (tt == "cell")
	{
		const Cell cell = data.has("cell") ? data.get("cell").cell() : Cell(-99, -99);
		if (!b.map.in_bounds(cell) || BattleMap::dist(c->cell, cell) > spell_cells(sp, c, meta))
		{
			return false;
		}
		if (!b.map.has_los(c->cell, cell))
		{
			return false;
		}
		if (sid == "misty_step" || sid == "flaming_sphere")
		{
			return b.map.walkable(cell) && b.creature_at(cell) == nullptr;
		}
		return true;
	}
	if (tt == "self")
	{
		return true;
	}
	const std::vector<Creature*> valid = valid_targets(c, sid, std::nullopt, meta);
	const Var ids = data.get("targets", Var::array());
	if (ids.is_empty())
	{
		return false;
	}
	if (tt == "darts" || tt == "rays")
	{
		if (static_cast<int>(ids.size()) != n_darts(c, sp, slot))
		{
			return false;
		}
	}
	else if (static_cast<int>(ids.size()) > max_targets(sp, slot, meta))
	{
		return false;
	}
	for (const Var& tid : ids.arr())
	{
		Creature* t = b.get_creature(tid.as_str());
		if (t == nullptr || !contains(valid, t))
		{
			return false;
		}
	}
	return true;
}

// ================================================================== resolución

void SpellResolver::resolve(Creature* c, const std::string& sid, const Json& sp, int slot, Var data)
{
	const std::string kind = jstr(sp, "special", "");
	const Var ids = data.get("targets", Var::array());
	if (!kind.empty() && resolve_special(c, sid, sp, slot, data, kind))
	{
		return;
	}
	// --- Genéricos
	if (sp.contains("self_effect"))
	{
		Var spec = Var::from_json(sp["self_effect"]);
		if (data.gets("meta", "") == "extended" && spec.has("rounds"))
		{
			spec["rounds"] = spec.geti("rounds") * 2;
		}
		b.apply_effect_spec(c, spec, c, sid, slot);
		return;
	}
	if (sp.contains("target_effect"))
	{
		const Var spec = Var::from_json(sp["target_effect"]);
		for (const Var& tid : ids.arr())
		{
			Creature* tt = b.get_creature(tid.as_str());
			EffectPtr e = b.apply_effect_spec(tt, spec, c, sid, slot);
			if (e && e->kind == "heroism")
			{
				e->data["temp"] = std::max(1, c->spell_mod(sid));
				b.gain_temp_hp(tt, e->data.geti("temp"));
			}
		}
		return;
	}
	if (sp.contains("temp_hp"))
	{
		const Json& th = jobj(sp, "temp_hp");
		int amt = b.dice.roll(jstr(th, "dice")).total + jint(sp, "upcast_temp", 0) * std::max(0, slot - jint(sp, "level"));
		if (sid == "false_life" && contains(c->at_will, sid) && c->has_trait("fiendish_vigor"))
		{
			amt = Dice::max_value(jstr(th, "dice"));
		}
		b.gain_temp_hp(c, amt);
		return;
	}
	if (sp.contains("heal"))
	{
		const std::string hexpr = heal_expr(c, sp, slot, sid);
		for (const Var& tid : ids.arr())
		{
			Creature* th2 = b.get_creature(tid.as_str());
			const int amount = b.dice.roll(hexpr).total;
			b.heal(th2, amount, c);
		}
		return;
	}
	const std::string sp_target = jstr(sp, "target");
	if (sp_target == "darts")
	{
		cast_magic_missile(c, sp, slot, ids);
		return;
	}
	if (sp_target == "rays")
	{
		for (const Var& tid : ids.arr())
		{
			Creature* tr = b.get_creature(tid.as_str());
			if (tr == nullptr || tr->dead)
			{
				continue;
			}
			spell_attack(c, tr, sid, sp, slot, data);
		}
		return;
	}
	if (sp.contains("area"))
	{
		resolve_area(c, sid, sp, slot, data);
		return;
	}
	bool first = true;
	for (const Var& tid : ids.arr())
	{
		Creature* t = b.get_creature(tid.as_str());
		if (t == nullptr || t->dead)
		{
			continue;
		}
		if (sp.contains("attack"))
		{
			spell_attack(c, t, sid, sp, slot, data);
		}
		else if (sp.contains("save"))
		{
			Var d2 = data.duplicate();
			d2["heighten"] = first && data.gets("meta", "") == "heightened";
			single_save(c, t, sid, sp, slot, d2);
		}
		first = false;
	}
}

bool SpellResolver::resolve_special(Creature* c, const std::string& sid, const Json& sp, int slot, Var data, const std::string& kind)
{
	const Var ids = data.get("targets", Var::array());
	const std::string sp_name = jstr(sp, "name");
	auto first_target = [this, &ids]() -> Creature* { return ids.size() > 0 ? b.get_creature(ids.at(0).as_str()) : nullptr; };
	if (kind == "stabilize")
	{
		for (const Var& tid : ids.arr())
		{
			b.stabilize(b.get_creature(tid.as_str()));
		}
	}
	else if (kind == "sleep")
	{
		cast_sleep(c, sp, data);
	}
	else if (kind == "bless")
	{
		for (const Var& tid : ids.arr())
		{
			Creature* t = b.get_creature(tid.as_str());
			EffectPtr e = make_effect("bless");
			e->name = sp_name;
			e->source = c;
			e->positive = true;
			e->spell_id = sid;
			b.attach_effect(t, e);
			b.link_to_concentration(c, e);
		}
	}
	else if (kind == "shield_of_faith")
	{
		Creature* t2 = first_target();
		EffectPtr e2 = make_effect("shield_of_faith");
		e2->name = sp_name;
		e2->source = c;
		e2->positive = true;
		b.attach_effect(t2, e2);
		b.link_to_concentration(c, e2);
	}
	else if (kind == "sanctuary")
	{
		Creature* t3 = first_target();
		EffectPtr e3 = make_effect("sanctuary");
		e3->name = sp_name;
		e3->source = c;
		e3->positive = true;
		e3->rounds_left = jint(sp, "duration", 10);
		e3->data = vdict({{"dc", c->spell_save_dc(sid)}});
		b.attach_effect(t3, e3);
	}
	else if (kind == "command")
	{
		for (const Var& tid : ids.arr())
		{
			Creature* t4 = b.get_creature(tid.as_str());
			const bool dis = data.gets("meta", "") == "heightened" && tid == ids.at(0);
			const Var r = b.saving_throw(t4, "wis", c->spell_save_dc(sid), c, vdict({{"disadvantage", dis}}));
			if (!r.getb("success"))
			{
				EffectPtr e4 = make_effect("command");
				e4->name = sp_name;
				e4->source = c;
				e4->data = vdict({{"cmd", data.get("cmd", "grovel")}});
				b.attach_effect(t4, e4);
			}
		}
	}
	else if (kind == "hold_person")
	{
		for (const Var& tid : ids.arr())
		{
			Creature* t5 = b.get_creature(tid.as_str());
			if (t5->ctype != "humanoid")
			{
				continue;
			}
			const bool dis = data.gets("meta", "") == "heightened" && tid == ids.at(0);
			const Var r5 = b.saving_throw(t5, "wis", c->spell_save_dc(sid), c, vdict({{"disadvantage", dis}}));
			if (!r5.getb("success"))
			{
				EffectPtr e5 = make_effect("hold_person");
				e5->name = sp_name;
				e5->source = c;
				e5->grants = {"paralyzed"};
				e5->data = vdict({{"dc", c->spell_save_dc(sid)}});
				b.attach_effect(t5, e5);
				b.link_to_concentration(c, e5);
			}
		}
		if (c->concentration && c->concentration_spell == sid)
		{
			bool any_hold = false;
			for (const Var& l : c->concentration->data.get("linked").arr())
			{
				if (l.effect() && l.effect()->kind == "hold_person")
				{
					any_hold = true;
				}
			}
			if (!any_hold)
			{
				b.end_concentration(c);
			}
		}
	}
	else if (kind == "aid")
	{
		const int amount = 5 * (slot - 1);
		for (const Var& tid : ids.arr())
		{
			Creature* t6 = b.get_creature(tid.as_str());
			EffectPtr e6 = make_effect("aid");
			e6->name = sp_name;
			e6->source = c;
			e6->positive = true;
			e6->data = vdict({{"amount", amount}});
			b.attach_effect(t6, e6);
			t6->max_hp += amount;
			b.emit(vdict({{"t", "max_hp"}, {"who", t6->id}, {"max", t6->max_hp}, {"hp", t6->hp}}));
			b.heal(t6, amount, c);
		}
	}
	else if (kind == "lesser_restoration")
	{
		Creature* t7 = first_target();
		for (const char* cond : {"paralyzed", "poisoned", "blinded", "deafened"})
		{
			const std::vector<EffectPtr> snapshot = t7->effects;
			for (const EffectPtr& e7 : snapshot)
			{
				if (contains(e7->grants, std::string(cond)))
				{
					b.remove_effect(e7);
				}
			}
			b.remove_condition(t7, cond);
		}
	}
	else if (kind == "teleport")
	{
		b.teleport(c, data.get("cell").cell());
	}
	else if (kind == "spiritual_weapon")
	{
		cast_spiritual_weapon(c, sp, slot, data);
	}
	else if (kind == "flaming_sphere")
	{
		cast_flaming_sphere(c, sid, sp, slot, data);
	}
	else if (kind == "mage_armor")
	{
		Creature* t8 = ids.size() > 0 ? first_target() : c;
		EffectPtr e8 = make_effect("mage_armor");
		e8->name = sp_name;
		e8->source = c;
		e8->positive = true;
		b.attach_effect(t8, e8);
	}
	else if (kind == "produce_flame")
	{
		self_marker(c, "produce_flame", "Llama en la mano", 100, Var::dict());
	}
	else if (kind == "shillelagh")
	{
		self_marker(c, "shillelagh", "Garrote", 10, Var::dict());
	}
	else if (kind == "flame_blade")
	{
		const std::string fdice = Dice::add_dice("3d6", std::max(0, slot - 2));
		EffectPtr fe = self_marker(c, "flame_blade", "Hoja de fuego", -1, vdict({{"dice", fdice}}));
		b.link_to_concentration(c, fe);
	}
	else if (kind == "expeditious_retreat")
	{
		EffectPtr ee = self_marker(c, "exp_retreat", "Retirada expeditiva", -1, Var::dict());
		b.link_to_concentration(c, ee);
		c->turn.movement += c->speed();
		b.emit(vdict({{"t", "dash"}, {"who", c->id}}));
	}
	else if (kind == "dragons_breath")
	{
		Creature* tdb = ids.size() > 0 ? first_target() : c;
		std::string dtype = data.gets("dtype", "fire");
		if (!jin(jarr(sp, "damage_choice"), dtype))
		{
			dtype = "fire";
		}
		EffectPtr edb = make_effect("dragons_breath");
		edb->name = "Aliento de dragón";
		edb->source = c;
		edb->positive = true;
		edb->data = vdict({{"dice", Dice::add_dice("3d6", std::max(0, slot - 2))}, {"dtype", dtype}, {"dc", c->spell_save_dc(sid)}});
		b.attach_effect(tdb, edb);
		b.link_to_concentration(c, edb);
	}
	else if (kind == "armor_of_agathys")
	{
		const int amt = 5 * std::max(1, slot);
		b.gain_temp_hp(c, amt);
		EffectPtr old = c->get_effect("agathys");
		if (old)
		{
			b.remove_effect(old);
		}
		EffectPtr ea = make_effect("agathys");
		ea->name = "Armadura de Agathys";
		ea->source = c;
		ea->positive = true;
		ea->data = vdict({{"dmg", amt}});
		b.attach_effect(c, ea);
	}
	else if (kind == "mark")
	{
		Creature* tm = first_target();
		EffectPtr em = make_effect(jstr(sp, "mark_kind"));
		em->name = sp_name;
		em->source = c;
		em->data = vdict({{"damage", sp.contains("mark_damage") ? Var::from_json(sp["mark_damage"]) : vdict({{"dice", "1d6"}, {"type", "force"}})}});
		b.attach_effect(tm, em);
		b.link_to_concentration(c, em);
	}
	else if (kind == "enlarge_reduce")
	{
		Creature* te = first_target();
		if (te->team == c->team)
		{
			EffectPtr en = make_effect("enlarged");
			en->name = "Agrandado";
			en->source = c;
			en->positive = true;
			b.attach_effect(te, en);
			b.link_to_concentration(c, en);
			b.emit(vdict({{"t", "resize"}, {"who", te->id}}));
		}
		else
		{
			const Var rr = b.saving_throw(te, "con", c->spell_save_dc(sid), c, vdict({{"disadvantage", data.gets("meta", "") == "heightened"}}));
			if (!rr.getb("success"))
			{
				EffectPtr rd = make_effect("reduced");
				rd->name = "Reducido";
				rd->source = c;
				b.attach_effect(te, rd);
				b.link_to_concentration(c, rd);
				b.emit(vdict({{"t", "resize"}, {"who", te->id}}));
			}
			else
			{
				b.end_concentration(c);
			}
		}
	}
	else if (kind == "true_strike")
	{
		Creature* tt = first_target();
		const Var p = true_strike_profile(c, tt);
		if (p.is_empty())
		{
			return true;
		}
		b.resolve_weapon_attack(c, p, tt, vdict({{"free", true}, {"true_strike", true}}));
	}
	else
	{
		return false;
	}
	return true;
}

EffectPtr SpellResolver::self_marker(Creature* c, const std::string& kind, const std::string& name, int rounds, const Var& data)
{
	EffectPtr old = c->get_effect(kind);
	if (old)
	{
		b.remove_effect(old);
	}
	EffectPtr e = make_effect(kind);
	e->name = name;
	e->source = c;
	e->positive = true;
	e->rounds_left = rounds;
	e->data = data.is_dict() ? data : Var::dict();
	b.attach_effect(c, e);
	return e;
}

Var SpellResolver::true_strike_profile(Creature* c, Creature* t, std::optional<Cell> from_cell)
{
	const Cell fc = from_cell ? *from_cell : c->cell;
	const Var base = weapon_profile_for(c, t, fc);
	if (base.is_empty())
	{
		return Var::dict();
	}
	Var p = base.duplicate(true);
	const int m = c->spell_mod("true_strike");
	int magic = 0;
	EffectPtr mw = c->get_effect("magic_weapon");
	if (mw)
	{
		magic = mw->data.geti("bonus", 1);
	}
	p["bonus"] = m + (c->is_proficient(p.get("weapon")) ? c->prof_bonus : 0) + magic;
	const std::string wtype = p.get("damage").at(0).get("type").as_str();
	const std::string dtype = b.damage_multiplier(t, "radiant") > b.damage_multiplier(t, wtype) ? "radiant" : wtype;
	p["damage"] = varr({vdict({{"dice", Dice::with_bonus(p.get("die").str(), m + magic)}, {"type", dtype}})});
	p["ability_mod"] = m;
	p["ability"] = c->spell_ability_for("true_strike");
	p["str_based"] = false;
	p["name"] = "Golpe certero";
	p["spell_like"] = true;
	return p;
}

// ================================================================== ataques de conjuro

void SpellResolver::spell_attack(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, Var data)
{
	const std::string kind = jstr(sp, "attack");
	const Var mi = b.attack_mode(c, t, kind, std::nullopt, vdict({{"spell", parent_of(sid)}}));
	const int mode = mi.geti("mode");
	b.consume_attack_effects(c, t, mi);
	D20Roll r = b.dice.d20(mode, c->has_trait("luck"));
	int nat = r.natural;
	const int bless = b.roll_attack_mods(c);
	const int abonus = attack_bonus(c, sid);
	int total = nat + abonus + bless;
	int ac = b.target_ac(t, c);
	bool crit = nat == 20;
	bool hit = crit || (nat != 1 && total >= ac);
	// Conjuro certero: repite un fallo
	if (!hit && data.gets("meta", "") == "seeking" && !data.getb("sought", false))
	{
		data["sought"] = true;
		r = b.dice.d20(mode, c->has_trait("luck"));
		nat = r.natural;
		total = nat + abonus + bless;
		crit = nat == 20;
		hit = crit || (nat != 1 && total >= ac);
	}
	if (hit && !crit)
	{
		const int cw = b.try_cutting_words(c, t, total, ac);
		if (cw > 0)
		{
			total -= cw;
			hit = total >= ac;
		}
	}
	if (hit && !crit && b.try_shield(t, total, ac, sp.contains("damage") ? Dice::average(damage_expr(c, sp, slot)) : -1.0))
	{
		ac += 5;
		hit = total >= ac;
	}
	if (hit && (t->has_condition("paralyzed") || t->has_condition("unconscious")) && BattleMap::dist(c->cell, t->cell) <= 1)
	{
		crit = true;
	}
	const std::string dtype = damage_type(c, sp, t, data);
	b.emit(vdict({{"t", "attack"}, {"who", c->id}, {"target", t->id}, {"name", jstr(sp, "name")}, {"kind", kind}, {"natural", nat},
		{"rolls", Var::array_of(r.rolls)}, {"bonus", abonus}, {"bless", bless}, {"total", total}, {"ac", ac}, {"hit", hit}, {"crit", crit},
		{"mode", mode}, {"adv", mi.get("adv")}, {"dis", mi.get("dis")}, {"spell", true}, {"sid", sid}, {"fx", jstr(sp, "fx", "")},
		{"dtype", dtype}}));
	const Var args = vdict({{"who", Battle::nm(c)}, {"target", Battle::nm(t)}, {"weapon", utf8_lower(jstr(sp, "name"))}, {"total", total},
		{"ac", ac}, {"nat", nat}});
	if (crit)
	{
		b.log_msg(Loc::t("log.attack_crit", args));
	}
	else if (hit)
	{
		b.log_msg(Loc::t("log.attack_hit", args));
	}
	else
	{
		b.log_msg(Loc::t("log.attack_miss", args));
	}
	const std::string expr = damage_expr(c, sp, slot);
	if (hit)
	{
		if (b.mirror_absorbs(c, t))
		{
			after_spell_attack(c, t, sid, sp, slot, data, false);
			return;
		}
		const int amount = !expr.empty() ? roll_damage(c, sp, expr, crit, data) : 0;
		int dealt = 0;
		if (amount > 0)
		{
			dealt = b.apply_damage(t, amount, dtype, c, vdict({{"crit", crit}, {"magic", true}}));
		}
		if (jstr(sp, "special_hit", "") == "chromatic_leap" && !data.getb("leapt", false))
		{
			chromatic_leap(c, t, sid, sp, slot, data);
		}
		if (!t->dead)
		{
			apply_on_hit(c, t, sid, sp, dealt, slot);
		}
	}
	else
	{
		if (jbool(sp, "miss_half", false) && !expr.empty())
		{
			const int half = roll_damage(c, sp, expr, false, data) / 2;
			if (half > 0)
			{
				b.apply_damage(t, half, dtype, c, vdict({{"magic", true}}));
			}
		}
		else if (jint(sp, "level") == 0 && c->has_trait("potent_cantrip") && !expr.empty())
		{
			const int half2 = b.dice.roll(expr).total / 2;
			if (half2 > 0)
			{
				b.log_msg(Loc::t("log.potent_cantrip", vdict({{"target", Battle::nm(t)}})));
				b.apply_damage(t, half2, dtype, c, vdict({{"magic", true}}));
			}
		}
	}
	after_spell_attack(c, t, sid, sp, slot, data, hit);
}

void SpellResolver::after_spell_attack(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, const Var& data, bool hit)
{
	(void)data;
	(void)hit;
	if (sid == "ice_knife")
	{
		ice_knife_burst(c, t, sp, slot);
	}
}

void SpellResolver::apply_on_hit(Creature* c, Creature* t, const std::string& sid, const Json& sp, int dealt, int slot)
{
	(void)dealt;
	const std::string oh = jstr(sp, "on_hit", "");
	if (oh == "slow10_caster_turn")
	{
		EffectPtr e = make_effect("slowed_frost");
		e->name = "Escarcha";
		e->source = c;
		e->expires = "start_turn";
		e->expires_who = c;
		b.attach_effect(t, e);
	}
	else if (oh == "no_reactions")
	{
		EffectPtr e2 = make_effect("no_reactions");
		e2->name = "Sin reacciones";
		e2->source = c;
		e2->expires = "start_turn";
		e2->expires_who = t;
		b.attach_effect(t, e2);
	}
	else if (oh == "guiding_bolt")
	{
		EffectPtr e3 = make_effect("guiding_bolt");
		e3->name = "Marcado";
		e3->source = c;
		e3->expires = "end_turn_next";
		e3->expires_who = c;
		e3->data = vdict({{"skip_first_end", b.current == c}});
		b.attach_effect(t, e3);
	}
	else if (oh == "pull10")
	{
		if (t->size_rank() <= 3)
		{
			b.pull_toward(t, c->cell, 2);
		}
	}
	if (sp.contains("on_hit_effect"))
	{
		b.apply_effect_spec(t, Var::from_json(sp["on_hit_effect"]), c, sid, slot, c->spell_save_dc(sid));
	}
	if (jstr(sp, "special_hit", "") == "eldritch_blast" && c->has_trait("repelling_blast") && t->size_rank() <= 3 && t->is_active())
	{
		b.push_away(t, c->cell, 2);
	}
}

void SpellResolver::chromatic_leap(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, const Var& data)
{
	// Salta si salieron dados repetidos (aprox.: probabilidad de pares en 3d8)
	const int n = Dice::parse(damage_expr(c, sp, slot)).count;
	std::vector<int> seen;
	bool pair = false;
	for (int i = 0; i < n; ++i)
	{
		const int v = b.dice.die(8);
		if (contains(seen, v))
		{
			pair = true;
		}
		add_unique(seen, v);
	}
	if (!pair)
	{
		return;
	}
	Creature* best = nullptr;
	for (Creature* e : b.enemies_of(c))
	{
		if (e != t && e->is_active() && BattleMap::dist(e->cell, t->cell) <= 6 && b.sees(c, e))
		{
			if (best == nullptr || e->hp < best->hp)
			{
				best = e;
			}
		}
	}
	if (best == nullptr)
	{
		return;
	}
	b.log_msg(Loc::t("log.chromatic_leap", vdict({{"target", Battle::nm(best)}})));
	Var d2 = data.duplicate();
	d2["leapt"] = true;
	spell_attack(c, best, sid, sp, slot, d2);
}

void SpellResolver::ice_knife_burst(Creature* c, Creature* t, const Json& sp, int slot)
{
	const Json& burst = jobj(sp, "burst");
	std::string expr = jstr(burst, "dice");
	if (slot > 1)
	{
		expr = Dice::add_dice(expr, Dice::parse(jstr(burst, "upcast")).count * (slot - 1));
	}
	const int dmg = b.dice.roll(expr).total;
	const std::vector<Cell> cells = spells_detail::burst_cells(t->cell);
	b.emit(vdict({{"t", "burst"}, {"who", c->id}, {"cells", spells_detail::cells_var(cells)}, {"fx", "frost"}}));
	for (Creature* o : creatures_in(cells))
	{
		if (o->dead)
		{
			continue;
		}
		const Var r = b.saving_throw(o, "dex", c->spell_save_dc("ice_knife"), c);
		if (!r.getb("success"))
		{
			b.apply_damage(o, dmg, "cold", c, vdict({{"magic", true}}));
		}
	}
}

// ================================================================== salvaciones

void SpellResolver::single_save(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, const Var& data)
{
	const Json& sv = jobj(sp, "save");
	const int dc = save_dc(c, sid);
	if (jbool(sv, "enemies_only", false) && t->team == c->team)
	{
		return;
	}
	Var opts = vdict({{"disadvantage", data.getb("heighten", false)}});
	if (jbool(sv, "hostile_adv", false))
	{
		opts["advantage"] = true;
	}
	if (sp.contains("on_fail_effect"))
	{
		const Json& g = jarr(jobj(sp, "on_fail_effect"), "grants");
		if (jin(g, "charmed"))
		{
			opts["vs"] = "charmed";
		}
		else if (jin(g, "frightened"))
		{
			opts["vs"] = "frightened";
		}
	}
	const Var r = b.saving_throw(t, jstr(sv, "ability"), dc, c, opts);
	const bool success = r.getb("success");
	const Json& dmg = jobj(sp, "damage");
	if (!dmg.empty())
	{
		std::string expr = damage_expr(c, sp, slot);
		if (sid == "toll_the_dead" && t->hp < t->max_hp)
		{
			expr = Dice::add_dice(jstr(sp, "wounded_dice"), Dice::parse(jstr(sp, "wounded_dice")).count * (cantrip_mult(c) - 1));
		}
		const int total = roll_damage(c, sp, expr, false, data);
		const std::string dtype = damage_type(c, sp, t, data);
		if (!success)
		{
			b.apply_damage(t, total, dtype, c, vdict({{"magic", true}}));
		}
		else if (jbool(sv, "half", false))
		{
			b.apply_damage(t, total / 2, dtype, c, vdict({{"magic", true}}));
		}
		else if (jint(sp, "level") == 0 && c->has_trait("potent_cantrip"))
		{
			b.log_msg(Loc::t("log.potent_cantrip", vdict({{"target", Battle::nm(t)}})));
			b.apply_damage(t, total / 2, dtype, c, vdict({{"magic", true}}));
		}
	}
	if (t->dead)
	{
		return;
	}
	if (!success)
	{
		apply_on_fail(c, t, sid, sp, slot, dc);
	}
	else if (sp.contains("on_success_effect"))
	{
		b.apply_effect_spec(t, Var::from_json(sp["on_success_effect"]), c, sid, slot, dc, false);
	}
}

void SpellResolver::apply_on_fail(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, int dc)
{
	if (sp.contains("on_fail_effect"))
	{
		b.apply_effect_spec(t, Var::from_json(sp["on_fail_effect"]), c, sid, slot, dc);
	}
	const std::string of = jstr(sp, "on_fail", "");
	if (of == "push10")
	{
		if (!t->dead)
		{
			b.push_away(t, c->cell, 2);
		}
	}
	else if (of == "prone")
	{
		if (t->is_active() && !t->has_condition("prone"))
		{
			b.add_condition(t, "prone", sid);
		}
	}
	else if (of == "flee_reaction")
	{
		if (t->is_active() && t->can_react())
		{
			t->turn.reaction = 0;
			b.forced_flee(t, c);
		}
	}
}

void SpellResolver::resolve_area(Creature* c, const std::string& sid, const Json& sp, int slot, const Var& data)
{
	const std::vector<Cell> cells = area_cells(c, sid, data, std::nullopt, slot);
	std::vector<Creature*> targets = area_targets(c, sid, data, std::nullopt, slot);
	if (jbool(sp, "exclude_caster", false))
	{
		erase_first(targets, c);
	}
	const Json& sv = jobj(sp, "save");
	const Json& dmg = jobj(sp, "damage");
	const int dc = save_dc(c, sid);
	int careful_left = data.gets("meta", "") == "careful" ? std::max(1, c->mod("cha")) : 0;
	const int total = !dmg.empty() ? roll_damage(c, sp, damage_expr(c, sp, slot), false, data) : 0;
	bool first = true;
	for (Creature* t : targets)
	{
		if (t->dead)
		{
			continue;
		}
		if (sv.empty())
		{
			continue;
		}
		Var opts = Var::dict();
		if (t->team == c->team && careful_left > 0)
		{
			opts["auto_success"] = true;
			careful_left -= 1;
		}
		else if (first && data.gets("meta", "") == "heightened" && t->team != c->team)
		{
			opts["disadvantage"] = true;
			first = false;
		}
		const Var r = b.saving_throw(t, jstr(sv, "ability", "dex"), dc, c, opts);
		const std::string dtype = damage_type(c, sp, t, data);
		if (!r.getb("success"))
		{
			if (total > 0)
			{
				b.apply_damage(t, total, dtype, c, vdict({{"magic", true}}));
			}
			if (!t->dead)
			{
				apply_on_fail(c, t, sid, sp, slot, dc);
			}
		}
		else if (jbool(sv, "half", false) && total > 0)
		{
			b.apply_damage(t, total / 2, dtype, c, vdict({{"magic", true}}));
		}
	}
	if (sp.contains("zone"))
	{
		create_zone(c, sid, sp, slot, data, cells, dc);
	}
}

void SpellResolver::create_zone(Creature* c, const std::string& sid, const Json& sp, int slot, const Var& data, const std::vector<Cell>& cells,
	int dc)
{
	const Json& spec = jobj(sp, "zone");
	Var z = Var::from_json(spec);
	z["cells"] = spells_detail::cells_var(cells);
	z["spell"] = sid;
	z["owner"] = Var(c);
	z["dc"] = dc;
	if (sp.contains("on_fail_effect"))
	{
		z["effect"] = Var::from_json(sp["on_fail_effect"]);
	}
	if (sp.contains("damage"))
	{
		z["damage"] = vdict({{"dice", damage_expr(c, sp, slot)}, {"type", jstr(jobj(sp, "damage"), "type")}});
		z["save"] = jstr(jobj(sp, "save"), "ability", "con");
	}
	if (spec.contains("rounds"))
	{
		z["rounds_left"] = jint(spec, "rounds") * (data.gets("meta", "") == "extended" ? 2 : 1);
	}
	if (data.has("point"))
	{
		z["point"] = data.get("point");
	}
	const int zid = b.add_zone(z);
	if (jbool(sp, "concentration", false) && c->concentration && c->concentration_spell == sid)
	{
		EffectPtr link = make_effect("zone_link");
		link->source = c;
		link->data = vdict({{"zone", zid}});
		b.attach_effect(c, link);
		b.link_to_concentration(c, link);
	}
}

bool SpellResolver::move_zone_action(Creature* c, int zid, const Vec2& point)
{
	Var z = b.get_zone(zid);
	if (z.is_empty() || z.get("owner").creature() != c || !z.has("movable"))
	{
		return false;
	}
	const Vec2 old = z.has("point") ? z.get("point").vec2() : point;
	const Cell center = BattleMap::cell_at(point);
	if (BattleMap::dist(BattleMap::cell_at(old), center) > z.geti("movable") || !b.map.in_bounds(center))
	{
		return false;
	}
	if (!b.spend(c, "action"))
	{
		return false;
	}
	const Json& sp = RulesDB::spell(z.get("spell").str());
	const std::vector<Cell> cells = b.map.sphere_cells(point, area_radius(sp, jint(sp, "level", 2)));
	z["point"] = point;
	b.move_zone(zid, spells_detail::cells_var(cells));
	b.log_msg(Loc::t("log.zone_move", vdict({{"who", Battle::nm(c)}, {"spell", jstr(sp, "name", "")}})));
	for (Creature* o : creatures_in(cells))
	{
		if (!o->dead && o->is_active() && z.getb("enter_damage", false))
		{
			b.zone_damage_save(o, z);
		}
	}
	return true;
}

void SpellResolver::cast_sleep(Creature* c, const Json& sp, const Var& data)
{
	(void)sp;
	const std::vector<Cell> cells = area_cells(c, "sleep", data);
	bool any = false;
	for (Creature* t : creatures_in(cells, c))
	{
		if (t->team == c->team || !t->is_active())
		{
			continue;
		}
		if (t->ctype == "undead" || contains(t->condition_immune, std::string("exhaustion")) || t->has_trait("trance"))
		{
			b.emit(vdict({{"t", "immune"}, {"who", t->id}, {"what", "sleep"}}));
			continue;
		}
		const Var r = b.saving_throw(t, "wis", c->spell_save_dc("sleep"), c);
		if (!r.getb("success"))
		{
			EffectPtr e = make_effect("sleep");
			e->name = "Adormecido";
			e->source = c;
			e->grants = {"incapacitated"};
			e->data = vdict({{"dc", c->spell_save_dc("sleep")}, {"stage", 1}});
			b.attach_effect(t, e);
			b.link_to_concentration(c, e);
			any = true;
		}
	}
	if (!any)
	{
		b.end_concentration(c);
	}
}

void SpellResolver::cast_magic_missile(Creature* c, const Json& sp, int slot, const Var& ids)
{
	const std::string expr = damage_expr(c, sp, slot);
	Dict<bool> shielded;
	for (const Var& tidv : ids.arr())
	{
		const std::string tid = tidv.as_str();
		Creature* t = b.get_creature(tid);
		if (t == nullptr || t->dead)
		{
			continue;
		}
		if (!shielded.has(tid))
		{
			shielded[tid] = contains(t->immune_spells, std::string("magic_missile")) || t->has_effect("shield_spell") || b.try_shield(t, 0, 99);
		}
		b.emit(vdict({{"t", "missile"}, {"who", c->id}, {"target", t->id}}));
		if (shielded.get(tid, false))
		{
			continue;
		}
		const int amount = b.dice.roll(expr).total;
		b.apply_damage(t, amount, "force", c, vdict({{"magic", true}}));
	}
}

// ================================================================== invocaciones

void SpellResolver::cast_spiritual_weapon(Creature* c, const Json& sp, int slot, const Var& data)
{
	const std::string tid = "sw_" + c->id;
	const Cell cell = data.get("cell").cell();
	b.tokens[Var(tid)] = vdict({{"kind", "spiritual_weapon"}, {"owner", Var(c)}, {"cell", cell}, {"slot", slot}});
	EffectPtr ctrl = make_effect("spiritual_weapon_ctrl");
	ctrl->name = jstr(sp, "name");
	ctrl->source = c;
	ctrl->positive = true;
	ctrl->data = vdict({{"token", tid}, {"slot", slot}});
	b.attach_effect(c, ctrl);
	b.link_to_concentration(c, ctrl);
	b.emit(vdict({{"t", "summon"}, {"id", tid}, {"kind", "spiritual_weapon"}, {"owner", c->id}, {"cell", cell}}));
	const Var tl = data.get("targets", Var::array());
	const std::string target_id = tl.size() > 0 ? tl.at(0).as_str() : std::string();
	Creature* t = !target_id.empty() ? b.get_creature(target_id) : sw_auto_target(c, cell);
	if (t != nullptr && BattleMap::dist(t->cell, cell) <= 1)
	{
		sw_attack(c, t, slot);
	}
}

Creature* SpellResolver::sw_auto_target(Creature* c, const Cell& cell)
{
	Creature* best = nullptr;
	for (Creature* e : b.enemies_of(c))
	{
		if (e->is_active() && BattleMap::dist(e->cell, cell) <= 1)
		{
			if (best == nullptr || e->hp < best->hp)
			{
				best = e;
			}
		}
	}
	return best;
}

void SpellResolver::sw_attack(Creature* c, Creature* t, int slot)
{
	const Json& sp = RulesDB::spell("spiritual_weapon");
	const std::string tid = "sw_" + c->id;
	const Cell cell = b.tokens.get(Var(tid)).get("cell").cell();
	const Var mi = b.attack_mode(c, t, "melee_spell", cell);
	const int mode = mi.geti("mode");
	const D20Roll r = b.dice.d20(mode, c->has_trait("luck"));
	const int nat = r.natural;
	const int total = nat + c->spell_attack_bonus("spiritual_weapon") + b.roll_attack_mods(c);
	const int ac = t->ac() + BattleMap::cover_ac_bonus(b.map.cover_between(cell, t->cell));
	const bool crit = nat == 20;
	const bool hit = crit || (nat != 1 && total >= ac);
	b.emit(vdict({{"t", "attack"}, {"who", c->id}, {"target", t->id}, {"name", jstr(sp, "name")}, {"kind", "melee_spell"}, {"natural", nat},
		{"rolls", Var::array_of(r.rolls)}, {"bonus", c->spell_attack_bonus("spiritual_weapon")}, {"total", total}, {"ac", ac}, {"hit", hit},
		{"crit", crit}, {"mode", mode}, {"adv", mi.get("adv")}, {"dis", mi.get("dis")}, {"spell", true}, {"token", tid}}));
	b.log_msg(Loc::t("log.spiritual_weapon_attack", vdict({{"who", Battle::nm(c)}, {"target", Battle::nm(t)}})));
	if (hit)
	{
		const std::string expr = damage_expr(c, sp, slot);
		const int amount = b.dice.roll(expr, crit).total;
		b.apply_damage(t, amount, "force", c, vdict({{"crit", crit}, {"magic", true}}));
	}
}

bool SpellResolver::spiritual_weapon_turn(Creature* c, const Cell& to, Creature* target)
{
	const std::string tid = "sw_" + c->id;
	if (!b.tokens.has(Var(tid)) || c->turn.bonus <= 0 || !c->can_act())
	{
		return false;
	}
	Var tk = b.tokens.get(Var(tid));
	const Cell from = tk.get("cell").cell();
	if (BattleMap::dist(from, to) > 4 || !b.map.in_bounds(to))
	{
		return false;
	}
	if (!b.spend(c, "bonus"))
	{
		return false;
	}
	tk["cell"] = to;
	b.emit(vdict({{"t", "summon_move"}, {"id", tid}, {"from", from}, {"to", to}}));
	if (target != nullptr && BattleMap::dist(target->cell, to) <= 1 && target->is_active())
	{
		sw_attack(c, target, tk.geti("slot"));
	}
	return true;
}

void SpellResolver::cast_flaming_sphere(Creature* c, const std::string& sid, const Json& sp, int slot, const Var& data)
{
	const std::string tid = "fs_" + c->id;
	const Cell cell = data.get("cell").cell();
	b.tokens[Var(tid)] = vdict({{"kind", "flaming_sphere"}, {"owner", Var(c)}, {"cell", cell}, {"slot", slot}, {"dice", damage_expr(c, sp, slot)},
		{"dc", c->spell_save_dc(sid)}, {"hits", Var::dict()}});
	EffectPtr ctrl = make_effect("flaming_sphere_ctrl");
	ctrl->name = jstr(sp, "name");
	ctrl->source = c;
	ctrl->positive = true;
	ctrl->data = vdict({{"token", tid}, {"slot", slot}});
	b.attach_effect(c, ctrl);
	b.link_to_concentration(c, ctrl);
	b.emit(vdict({{"t", "summon"}, {"id", tid}, {"kind", "flaming_sphere"}, {"owner", c->id}, {"cell", cell}}));
}

void SpellResolver::flaming_sphere_hit(Var tk, Creature* t)
{
	Var hits = tk.get("hits", Var::dict());
	if (hits.geti(Var(t->id), -1) == b.turn_counter)
	{
		return;
	}
	hits[Var(t->id)] = b.turn_counter;
	tk["hits"] = hits;
	Creature* owner = tk.get("owner").creature();
	const int dmg = b.dice.roll(tk.get("dice").str()).total;
	const Var r = b.saving_throw(t, "dex", tk.geti("dc"), owner);
	b.emit(vdict({{"t", "zone_hit"}, {"id", -1}, {"who", t->id}, {"token", "fs_" + (owner != nullptr ? owner->id : std::string())}}));
	b.apply_damage(t, !r.getb("success") ? dmg : dmg / 2, "fire", owner, vdict({{"magic", true}}));
}

bool SpellResolver::flaming_sphere_turn(Creature* c, Creature* target)
{
	const std::string tid = "fs_" + c->id;
	if (!b.tokens.has(Var(tid)) || target == nullptr || !target->is_active())
	{
		return false;
	}
	Var tk = b.tokens.get(Var(tid));
	const Cell from = tk.get("cell").cell();
	Cell best(-99, -99);
	int best_d = 99;
	for (const Cell& n : BattleMap::neighbors(target->cell))
	{
		const int dd = BattleMap::dist(from, n);
		if (dd <= 6 && dd < best_d && b.map.walkable(n) && b.creature_at(n) == nullptr)
		{
			best_d = dd;
			best = n;
		}
	}
	if (best == Cell(-99, -99))
	{
		return false;
	}
	if (!b.spend(c, "bonus"))
	{
		return false;
	}
	tk["cell"] = best;
	b.emit(vdict({{"t", "summon_move"}, {"id", tid}, {"from", from}, {"to", best}}));
	flaming_sphere_hit(tk, target);
	return true;
}

// ================================================================== castigos y conjuros al impactar

std::vector<Var> SpellResolver::rider_options(Creature* c, const Var& p)
{
	std::vector<Var> out;
	if (c->turn.bonus <= 0 || c->is_raging() || !c->form.empty())
	{
		return out;
	}
	const std::string pkind = p.gets("kind");
	for (const std::string& sid : c->known_spells())
	{
		const Json& sp = RulesDB::spell(sid);
		if (jstr(sp, "cast", "") != "rider")
		{
			continue;
		}
		const std::string need = jstr(sp, "rider", "weapon");
		if (need == "melee" && pkind != "melee")
		{
			continue;
		}
		if (need == "ranged" && pkind != "ranged" && pkind != "thrown")
		{
			continue;
		}
		const int lvl = jint(sp, "level");
		if (c->free_casts.get(sid, 0) > 0)
		{
			out.push_back(vdict({{"spell", sid}, {"slot", lvl}, {"name", jstr(sp, "name")}, {"free", true}}));
		}
		if (c->turn.slot_spell_cast)
		{
			continue;
		}
		for (int i = lvl - 1; i < static_cast<int>(c->slots.size()); ++i)
		{
			if (i >= 0 && c->slots[static_cast<size_t>(i)] > 0)
			{
				out.push_back(vdict({{"spell", sid}, {"slot", i + 1}, {"name", jstr(sp, "name")}, {"free", false}}));
			}
		}
	}
	return out;
}

bool SpellResolver::c_free(const Creature* a, const std::string& sid) const
{
	return a->free_casts.get(sid, 0) > 0;
}

Var SpellResolver::apply_rider_damage(Creature* a, Creature* t, const Var& p, const Var& rider, bool crit, Var parts)
{
	(void)p;
	const std::string sid = rider.gets("spell", "");
	const Json& sp = RulesDB::spell(sid);
	if (sp.empty() || a->turn.bonus <= 0)
	{
		return Var::dict();
	}
	if (rider.getb("crit_only", false) && !crit)
	{
		return Var::dict();
	}
	const int lvl = jint(sp, "level");
	int slot = rider.has("slot") ? rider.geti("slot") : lvl;
	bool free_cast = false;
	if (c_free(a, sid) && slot <= lvl)
	{
		free_cast = true;
		slot = lvl;
	}
	else if (slot - 1 >= static_cast<int>(a->slots.size()) || slot < 1 || a->slots[static_cast<size_t>(slot - 1)] <= 0 ||
			 a->turn.slot_spell_cast)
	{
		return Var::dict();
	}
	a->turn.bonus -= 1;
	if (free_cast)
	{
		a->free_casts[sid] -= 1;
	}
	else
	{
		a->slots[static_cast<size_t>(slot - 1)] -= 1;
		a->turn.slot_spell_cast = true;
	}
	b.emit(vdict({{"t", "cast"}, {"who", a->id}, {"spell", sid}, {"name", jstr(sp, "name")}, {"slot", slot}, {"targets", varr({t->id})},
		{"cells", Var::array()}, {"fx", jstr(sp, "fx", "")}, {"rider", true}}));
	b.log_msg(Loc::t("log.smite", vdict({{"who", Battle::nm(a)}, {"spell", jstr(sp, "name")}})));
	if (jbool(sp, "concentration", false))
	{
		b.start_concentration(a, sid, jint(sp, "duration", 10));
	}
	if (sp.contains("damage") && jint(sp, "rider_area", 0) == 0)
	{
		const std::string expr = damage_expr(a, sp, slot);
		int amt = b.dice.roll(expr, crit).total;
		if (sp.contains("vs_fiend_undead") && (t->ctype == "fiend" || t->ctype == "undead"))
		{
			amt += b.dice.roll(jstr(sp, "vs_fiend_undead"), crit).total;
		}
		parts.push(vdict({{"amount", amt}, {"type", jstr(jobj(sp, "damage"), "type")}}));
	}
	return vdict({{"spell", sid}, {"slot", slot}});
}

void SpellResolver::apply_rider_after(Creature* a, Creature* t, const Var& p, const Var& info)
{
	(void)p;
	const std::string sid = info.gets("spell");
	const Json& sp = RulesDB::spell(sid);
	const int slot = info.geti("slot");
	const int dc = a->spell_save_dc(sid);
	if (jint(sp, "rider_area", 0) > 0)
	{
		// Granizo de espinas: el objetivo y quien esté a 1,5 m
		const std::vector<Cell> cells = spells_detail::burst_cells(t->cell);
		b.emit(vdict({{"t", "burst"}, {"who", a->id}, {"cells", spells_detail::cells_var(cells)}, {"fx", jstr(sp, "fx", "")}}));
		const int total = b.dice.roll(damage_expr(a, sp, slot)).total;
		for (Creature* o : creatures_in(cells, a))
		{
			if (o->dead)
			{
				continue;
			}
			const Var r = b.saving_throw(o, jstr(jobj(sp, "save"), "ability"), dc, a);
			b.apply_damage(o, !r.getb("success") ? total : total / 2, jstr(jobj(sp, "damage"), "type"), a, vdict({{"magic", true}}));
		}
		return;
	}
	if (t->dead)
	{
		if (jbool(sp, "concentration", false))
		{
			b.end_concentration(a);
		}
		return;
	}
	const Json& rs = jobj(sp, "rider_save");
	if (rs.empty())
	{
		if (sp.contains("rider_effect"))
		{
			b.apply_effect_spec(t, Var::from_json(sp["rider_effect"]), a, sid, slot, dc);
		}
		return;
	}
	Var opts = Var::dict();
	if (jbool(rs, "large_adv", false) && t->size_rank() >= 3)
	{
		opts["advantage"] = true;
	}
	const Var r2 = b.saving_throw(t, jstr(rs, "ability"), dc, a, opts);
	if (r2.getb("success"))
	{
		if (jbool(sp, "concentration", false))
		{
			b.end_concentration(a);
		}
		return;
	}
	const std::string fail = jstr(rs, "fail", "");
	if (fail == "push10_prone")
	{
		b.push_away(t, a->cell, 2);
		if (t->is_active())
		{
			b.add_condition(t, "prone", sid);
		}
	}
	else if (fail == "effect")
	{
		b.apply_effect_spec(t, Var::from_json(sp["rider_effect"]), a, sid, slot, dc);
	}
}

} // namespace mdg
