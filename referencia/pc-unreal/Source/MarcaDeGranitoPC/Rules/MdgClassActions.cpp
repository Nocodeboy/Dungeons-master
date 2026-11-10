#include "MdgClassActions.h"

#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgSort.h"
#include "MdgSpells.h"

namespace mdg
{

namespace class_actions_detail
{

std::string cost_text(const std::string& cost)
{
	if (cost == "action")
	{
		return "Acción";
	}
	if (cost == "bonus")
	{
		return "Adicional";
	}
	if (cost == "free")
	{
		return "Gratis";
	}
	if (cost == "attack")
	{
		return "Ataque";
	}
	return cost;
}

std::string form_icon(const std::string& f)
{
	if (f == "wolf")
	{
		return "wild_shape";
	}
	if (f == "elk")
	{
		return "elk";
	}
	if (f == "riding_horse")
	{
		return "horse";
	}
	return "paw";
}

} // namespace class_actions_detail

// ================================================================== consulta

bool ClassActions::has_action(const Creature* c) const
{
	return c->turn.action > 0 && c->turn.attack_left <= 0;
}

bool ClassActions::has_attack(const Creature* c) const
{
	return c->turn.action > 0 || c->turn.attack_left > 0;
}

Var ClassActions::make_entry(const std::string& id, const std::string& title, const std::string& icon, const std::string& cost,
	const std::string& desc, bool enabled, const std::string& target, const Var& extra)
{
	Var e = vdict({{"id", id}, {"title", title}, {"icon", icon}, {"cost", class_actions_detail::cost_text(cost)}, {"cost_key", cost},
		{"desc", desc}, {"enabled", enabled}, {"target", target}});
	e.merge(extra, true);
	return e;
}

std::vector<Var> ClassActions::list(Creature* c)
{
	std::vector<Var> out;
	const bool bonus_ok = c->turn.bonus > 0;
	const Dict<int>& res = c->resources;
	// --- Guerrero
	if (res.has("second_wind"))
	{
		out.push_back(make_entry("second_wind", "Tomar aliento", "second_wind", "bonus",
			format("Recuperas 1d10 + %d PG. Usos: %d", c->level, res.get("second_wind", 0)), res.get("second_wind", 0) > 0 && bonus_ok));
	}
	if (res.has("action_surge"))
	{
		out.push_back(make_entry("action_surge", "Oleada de acción", "action_surge", "free",
			format("Ganas una acción adicional este turno. Usos: %d", res.get("action_surge", 0)),
			res.get("action_surge", 0) > 0 && !c->turn.action_surge_used));
	}
	// --- Pícaro
	if (c->level_feature("cunning_action"))
	{
		out.push_back(make_entry("cunning_dash", "Acción astuta: Correr", "dash", "bonus", "Duplicas tu movimiento este turno.", bonus_ok));
		out.push_back(make_entry("cunning_disengage", "Acción astuta: Destrabarse", "disengage", "bonus",
			"Tu movimiento no provoca ataques de oportunidad.", bonus_ok && !c->turn.disengaged));
		out.push_back(make_entry("cunning_hide", "Acción astuta: Esconderse", "hide", "bonus",
			"Sigilo CD 15 si nadie te ve con claridad. Atacarás con ventaja.", bonus_ok && b.can_hide(c)));
	}
	if (c->level_feature("steady_aim"))
	{
		out.push_back(make_entry("steady_aim", "Puntería firme", "steady_aim", "bonus", "Ventaja en tu siguiente ataque. No puedes haberte movido.",
			bonus_ok && !c->turn.moved));
	}
	// --- Canalizar divinidad
	if (res.has("channel_divinity"))
	{
		const int cd_n = res.get("channel_divinity", 0);
		if (c->cls == "cleric")
		{
			out.push_back(make_entry("divine_spark", "Chispa divina", "divine_spark", "action",
				format("1d8 + %d: cura a un aliado o daña a un enemigo (CON mitad). Usos: %d", c->mod("wis"), cd_n), cd_n > 0 && has_action(c),
				"creature", vdict({{"range", 6}})));
			out.push_back(make_entry("turn_undead", "Expulsar muertos vivientes", "turn_undead", "action",
				"Los no muertos a 9 m que fallen SAB huyen aterrados.", cd_n > 0 && has_action(c)));
			if (c->level_feature("preserve_life"))
			{
				out.push_back(make_entry("preserve_life", "Preservar la vida", "preserve_life", "action",
					format("Reparte %d PG entre aliados malheridos a 9 m.", 5 * c->level), cd_n > 0 && has_action(c)));
			}
		}
		if (c->level_feature("sacred_weapon"))
		{
			out.push_back(make_entry("sacred_weapon", "Arma sagrada", "sacred_weapon", "free",
				format("+%d al ataque con tu arma y daño radiante durante 10 minutos. Usos: %d", std::max(1, c->mod("cha")), cd_n),
				cd_n > 0 && has_attack(c) && !c->has_effect("sacred_weapon")));
		}
	}
	if (b.tokens.has(Var("sw_" + c->id)))
	{
		out.push_back(make_entry("sw_move", "Mover arma espiritual", "spiritual_weapon", "bonus", "Mueve el arma hasta 6 m y ataca.", bonus_ok, "enemy"));
	}
	// --- Bárbaro
	if (res.has("rage"))
	{
		if (!c->is_raging())
		{
			const bool heavy = jstr(c->armor_data(), "cat", "") == "heavy";
			out.push_back(make_entry("rage", "Furia", "rage", "bonus",
				format("Resistencia física, +%d al daño de Fuerza y ventaja en Fuerza. Usos: %d", c->rage_damage, res.get("rage", 0)),
				res.get("rage", 0) > 0 && bonus_ok && !heavy));
		}
	}
	if (c->level_feature("reckless_attack"))
	{
		out.push_back(make_entry("reckless", "Ataque temerario", "reckless", "free",
			"Ventaja en tus ataques de Fuerza este turno, pero los ataques contra ti también la tienen.",
			has_attack(c) && !c->turn.attacked && !c->has_effect("reckless")));
	}
	// --- Bardo
	if (res.has("bardic_inspiration"))
	{
		out.push_back(make_entry("bardic_inspiration", "Inspiración bárdica", "lyre", "bonus",
			format("Un aliado a 18 m gana %s para sumar a una tirada fallida. Usos: %d", c->bardic_die.c_str(), res.get("bardic_inspiration", 0)),
			res.get("bardic_inspiration", 0) > 0 && bonus_ok, "ally_other", vdict({{"range", 12}})));
	}
	// --- Druida
	if (res.has("wild_shape"))
	{
		if (c->form.empty())
		{
			Var opts = Var::array();
			for (const std::string& f : c->wild_shapes)
			{
				const Json m = RulesDB::monster_data(f);
				opts.push(vdict({{"id", f}, {"title", jstr(m, "name", f)},
					{"desc", format("CA %d · %s · %s", jint(m, "ac", 10), Loc::ft(jint(m, "speed", 30)).c_str(), jstr(m, "form_desc", "").c_str())},
					{"icon", class_actions_detail::form_icon(f)}}));
			}
			out.push_back(make_entry("wild_shape", "Forma salvaje", "wild_shape", "bonus",
				format("Te conviertes en bestia: conservas tus PG y ganas %d temporales. No puedes lanzar conjuros. Usos: %d", c->level,
					res.get("wild_shape", 0)),
				res.get("wild_shape", 0) > 0 && bonus_ok && !c->is_raging(), "choice", vdict({{"options", opts}})));
		}
		else
		{
			out.push_back(make_entry("wild_shape_end", "Recuperar tu forma", "wild_shape", "bonus", "Vuelves a tu forma normal.", bonus_ok));
		}
		if (c->level_feature("lands_aid"))
		{
			out.push_back(make_entry("lands_aid", "Auxilio de la tierra", "nature", "action",
				"Esfera de 3 m a 18 m: enemigos 2d6 necrótico (CON mitad) y un aliado recupera 2d6. Gasta Forma salvaje.",
				res.get("wild_shape", 0) > 0 && has_action(c) && c->form.empty(), "point", vdict({{"range", 12}, {"radius", 10}})));
		}
	}
	// --- Monje
	if (c->cls == "monk" && c->unarmored_monk())
	{
		out.push_back(make_entry("martial_strike", "Golpe sin armas adicional", "fist", "bonus",
			format("Artes marciales: un golpe sin armas (%s + DES).", c->martial_die.c_str()), bonus_ok, "enemy_adjacent"));
		if (res.has("focus"))
		{
			const int fp = res.get("focus", 0);
			out.push_back(make_entry("flurry", "Ráfaga de golpes", "fist", "bonus", format("1 punto de foco: dos golpes sin armas. Foco: %d", fp),
				bonus_ok && fp > 0, "enemy_adjacent"));
			out.push_back(make_entry("patient_defense", "Defensa paciente", "dodging", "bonus",
				format("1 punto de foco: Destrabarse y Esquivar. Foco: %d", fp), bonus_ok && fp > 0));
			out.push_back(make_entry("step_of_wind", "Paso del viento", "wind", "bonus", format("1 punto de foco: Correr y Destrabarse. Foco: %d", fp),
				bonus_ok && fp > 0));
			out.push_back(make_entry("patient_defense_free", "Destrabarse (monje)", "disengage", "bonus", "Destrabarse como acción adicional, gratis.",
				bonus_ok && !c->turn.disengaged));
			out.push_back(make_entry("step_of_wind_free", "Correr (monje)", "dash", "bonus", "Correr como acción adicional, gratis.", bonus_ok));
		}
	}
	// --- Paladín
	if (res.has("lay_on_hands"))
	{
		out.push_back(make_entry("lay_on_hands", "Imposición de manos", "lay_hands", "bonus",
			format("Curas a un aliado adyacente o a ti de tu reserva. Quedan %d PG.", res.get("lay_on_hands", 0)),
			res.get("lay_on_hands", 0) > 0 && bonus_ok, "ally_touch", vdict({{"range", 1}})));
	}
	// --- Marcas (Marca del cazador, Maleficio)
	const Var mk = mark_info(c);
	if (!mk.is_empty() && mk.getb("free", false))
	{
		out.push_back(make_entry("move_mark", "Mover " + jstr(RulesDB::spell(mk.gets("spell")), "name", ""), "mark", "bonus",
			"Tu presa ha caído: marca a otro enemigo a 27 m.", bonus_ok, "enemy", vdict({{"range", 18}})));
	}
	// --- Hechicero
	if (res.has("innate_sorcery"))
	{
		out.push_back(make_entry("innate_sorcery", "Hechicería innata", "sorcery", "bonus",
			format("1 minuto: +1 a la CD y ventaja en ataques de conjuro. Usos: %d", res.get("innate_sorcery", 0)),
			res.get("innate_sorcery", 0) > 0 && bonus_ok && !c->has_effect("innate_sorcery")));
	}
	if (res.has("sorcery_points"))
	{
		const int sp_n = res.get("sorcery_points", 0);
		Var copts = Var::array();
		if (c->level >= 2)
		{
			copts.push(vdict({{"id", "1"}, {"title", "Espacio de nivel 1"}, {"desc", "Cuesta 2 puntos de hechicería."}, {"enabled", sp_n >= 2},
				{"icon", "magic"}}));
		}
		if (c->level >= 3)
		{
			copts.push(vdict({{"id", "2"}, {"title", "Espacio de nivel 2"}, {"desc", "Cuesta 3 puntos de hechicería."}, {"enabled", sp_n >= 3},
				{"icon", "magic"}}));
		}
		out.push_back(make_entry("create_slot", "Crear espacio de conjuro", "slot", "bonus",
			format("Fuente de magia: conviertes puntos de hechicería (%d) en un espacio.", sp_n), bonus_ok && sp_n >= 2, "choice",
			vdict({{"options", copts}})));
		Var vopts = Var::array();
		for (size_t i = 0; i < c->slots.size(); ++i)
		{
			if (c->slots[i] > 0)
			{
				const int lv = static_cast<int>(i) + 1;
				vopts.push(vdict({{"id", std::to_string(lv)}, {"title", format("Gastar un espacio de nivel %d", lv)},
					{"desc", format("Ganas %d punto(s) de hechicería.", lv)}, {"enabled", true}, {"icon", "magic"}}));
			}
		}
		out.push_back(make_entry("convert_slot", "Espacio a puntos de hechicería", "slot", "free",
			"Fuente de magia: gastas un espacio y ganas tantos puntos como su nivel.",
			!vopts.is_empty() && sp_n < c->resources_max.get("sorcery_points", 0) + 2, "choice", vdict({{"options", vopts}})));
	}
	// --- Especies
	if (res.has("breath_weapon"))
	{
		const std::string dt = Loc::dmg_type(c->breath_type);
		const bool ok = has_attack(c) && res.get("breath_weapon", 0) > 0 && c->form.empty();
		out.push_back(make_entry("breath_cone", "Arma de aliento (cono)", "breath", "attack",
			format("Cono de 4,5 m: %s de %s (DES mitad, CD %d). Sustituye un ataque. Usos: %d", breath_dice(c).c_str(), dt.c_str(), breath_dc(c),
				res.get("breath_weapon", 0)),
			ok, "direction", vdict({{"shape", "cone"}})));
		out.push_back(make_entry("breath_line", "Arma de aliento (línea)", "breath", "attack",
			format("Línea de 9 m: %s de %s (DES mitad, CD %d). Sustituye un ataque.", breath_dice(c).c_str(), dt.c_str(), breath_dc(c)), ok,
			"direction", vdict({{"shape", "line"}})));
	}
	if (c->has_trait("clouds_jaunt") && res.get("giant_ancestry", 0) > 0)
	{
		out.push_back(make_entry("clouds_jaunt", "Salto de las nubes", "teleport", "bonus",
			format("Te teletransportas hasta 9 m. Usos: %d", res.get("giant_ancestry", 0)), bonus_ok, "cell", vdict({{"range", 6}})));
	}
	if (res.has("adrenaline_rush"))
	{
		out.push_back(make_entry("adrenaline_rush", "Subidón de adrenalina", "dash", "bonus",
			format("Corres y ganas %d PG temporales. Usos: %d", c->prof_bonus, res.get("adrenaline_rush", 0)),
			res.get("adrenaline_rush", 0) > 0 && bonus_ok));
	}
	// --- Conjuros con acciones posteriores
	if (c->has_effect("exp_retreat"))
	{
		out.push_back(make_entry("exp_dash", "Correr (Retirada expeditiva)", "wind", "bonus", "Correr como acción adicional.", bonus_ok));
	}
	for (const Var& z : b.zones)
	{
		if (z.get("owner").creature() == c && z.has("movable"))
		{
			out.push_back(make_entry("zone_move", "Mover " + jstr(RulesDB::spell(z.get("spell").str()), "name", ""), "moon", "action",
				"Desplaza el área hasta " + Loc::ft(z.geti("movable") * 5) + ".", has_action(c), "point",
				vdict({{"zone", z.get("id")}, {"range", z.geti("movable")}})));
		}
	}
	if (b.tokens.has(Var("fs_" + c->id)))
	{
		out.push_back(make_entry("sphere_move", "Mover esfera llameante", "fire", "bonus", "La haces rodar hasta 9 m y embiste a un enemigo.",
			bonus_ok, "enemy"));
	}
	// --- Escapar de un apresamiento
	if (b.escape_effect(c))
	{
		EffectPtr ee = b.escape_effect(c);
		out.push_back(make_entry("escape", "Liberarse", "escape", "action",
			format("Prueba de Atletismo o Acrobacias contra CD %d para librarte de %s.", ee->data.get("escape").geti("dc", 10),
				utf8_lower(ee->name).c_str()),
			has_action(c)));
	}
	return out;
}

Var ClassActions::entry(Creature* c, const std::string& id)
{
	for (const Var& e : list(c))
	{
		if (e.gets("id") == id)
		{
			return e;
		}
	}
	return Var::dict();
}

int ClassActions::breath_dc(const Creature* c) const
{
	return 8 + c->mod("con") + c->prof_bonus;
}

std::string ClassActions::breath_dice(const Creature* c) const
{
	if (c->level >= 17)
	{
		return "4d10";
	}
	if (c->level >= 11)
	{
		return "3d10";
	}
	if (c->level >= 5)
	{
		return "2d10";
	}
	return "1d10";
}

std::vector<Cell> ClassActions::breath_cells(Creature* c, const std::string& shape, const Vec2& dir)
{
	if (shape == "line")
	{
		return b.map.line_cells(c->cell, dir, 30);
	}
	return b.map.cone_cells(c->cell, dir, 15);
}

Var ClassActions::mark_info(Creature* c) const
{
	if (!c->concentration || (c->concentration_spell != "hunters_mark" && c->concentration_spell != "hex"))
	{
		return Var::dict();
	}
	const std::string kind = c->concentration_spell == "hunters_mark" ? "hunters_mark" : "hexed";
	Creature* holder = nullptr;
	for (const CreaturePtr& op : b.creatures)
	{
		for (const EffectPtr& e : op->get_effects(kind))
		{
			if (e->source == c)
			{
				holder = op.get();
			}
		}
	}
	const bool free_mark = holder == nullptr || holder->dead || holder->hp <= 0;
	return vdict({{"spell", c->concentration_spell}, {"kind", kind}, {"holder", Var(holder)}, {"free", free_mark}});
}

std::vector<Creature*> ClassActions::valid_targets(Creature* c, const std::string& id)
{
	const Var e = entry(c, id);
	std::vector<Creature*> out;
	const std::string tt = e.gets("target", "none");
	const int rng = e.geti("range", 1);
	for (const CreaturePtr& op : b.creatures)
	{
		Creature* o = op.get();
		if (o->dead)
		{
			continue;
		}
		const int d = BattleMap::dist(c->cell, o->cell);
		if (tt == "enemy_adjacent")
		{
			if (o->team != c->team && o->is_active() && d <= 1 && b.may_target(c, o))
			{
				out.push_back(o);
			}
		}
		else if (tt == "enemy")
		{
			if (o->team == c->team || !o->is_active())
			{
				continue;
			}
			if (id == "sw_move" || id == "sphere_move")
			{
				const std::string tid = (id == "sw_move" ? "sw_" : "fs_") + c->id;
				if (!b.tokens.has(Var(tid)))
				{
					continue;
				}
				const Cell from = b.tokens.get(Var(tid)).get("cell").cell();
				const int reach = id == "sw_move" ? 4 : 6;
				if (BattleMap::dist(from, o->cell) <= reach + 1)
				{
					out.push_back(o);
				}
			}
			else if (d <= rng && b.sees(c, o) && b.map.has_los(c->cell, o->cell))
			{
				out.push_back(o);
			}
		}
		else if (tt == "creature")
		{
			if (d <= rng && b.map.has_los(c->cell, o->cell) &&
				((o->team == c->team && o->hp < o->max_hp) || (o->team != c->team && o->is_active() && b.sees(c, o))))
			{
				out.push_back(o);
			}
		}
		else if (tt == "ally_other")
		{
			if (o->team == c->team && o != c && o->is_active() && d <= rng && !o->has_effect("bardic_inspiration"))
			{
				out.push_back(o);
			}
		}
		else if (tt == "ally_touch")
		{
			if (o->team == c->team && d <= 1 && (o->hp < o->max_hp || o->has_condition("poisoned")))
			{
				out.push_back(o);
			}
		}
	}
	return out;
}

// ================================================================== uso

bool ClassActions::use(Creature* c, const std::string& id, const Var& data)
{
	if (!c->can_act() && id != "wild_shape_end")
	{
		return false;
	}
	Creature* t = data.has("target") ? b.get_creature(data.get("target", "").str()) : nullptr;
	if (id == "second_wind")
	{
		if (c->resources.get("second_wind", 0) <= 0 || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["second_wind"] -= 1;
		feature_event(c, id);
		b.log_msg(Loc::t("log.second_wind", vdict({{"who", Battle::nm(c)}})));
		const int amount = b.dice.roll(format("1d10+%d", c->level)).total;
		b.heal(c, amount, c);
		return true;
	}
	if (id == "action_surge")
	{
		if (c->resources.get("action_surge", 0) <= 0 || c->turn.action_surge_used)
		{
			return false;
		}
		c->resources["action_surge"] -= 1;
		c->turn.action += 1;
		c->turn.action_surge_used = true;
		c->turn.can_undo = false;
		feature_event(c, id);
		b.log_msg(Loc::t("log.action_surge", vdict({{"who", Battle::nm(c)}})));
		return true;
	}
	if (id == "cunning_dash" || id == "exp_dash" || id == "step_of_wind_free")
	{
		return b.do_dash(c, true);
	}
	if (id == "cunning_disengage" || id == "patient_defense_free")
	{
		return b.do_disengage(c, true);
	}
	if (id == "cunning_hide")
	{
		return b.do_hide(c, true);
	}
	if (id == "steady_aim")
	{
		if (!c->level_feature("steady_aim") || c->turn.moved || !b.spend(c, "bonus"))
		{
			return false;
		}
		EffectPtr e = make_effect("steady_aim");
		e->name = "Puntería firme";
		e->source = c;
		e->positive = true;
		e->expires = "end_turn";
		e->expires_who = c;
		b.attach_effect(c, e);
		c->turn.movement = 0;
		b.log_msg(Loc::t("log.steady_aim", vdict({{"who", Battle::nm(c)}})));
		return true;
	}
	if (id == "divine_spark")
	{
		return divine_spark(c, t);
	}
	if (id == "turn_undead")
	{
		return turn_undead(c);
	}
	if (id == "preserve_life")
	{
		return preserve_life(c);
	}
	if (id == "sw_move")
	{
		return sw_move(c, t);
	}
	if (id == "rage")
	{
		return rage(c);
	}
	if (id == "reckless")
	{
		if (c->turn.attacked || c->has_effect("reckless"))
		{
			return false;
		}
		EffectPtr r = make_effect("reckless");
		r->name = "Temerario";
		r->source = c;
		r->expires = "start_turn";
		r->expires_who = c;
		b.attach_effect(c, r);
		feature_event(c, id);
		b.log_msg(Loc::t("log.reckless", vdict({{"who", Battle::nm(c)}})));
		return true;
	}
	if (id == "bardic_inspiration")
	{
		if (t == nullptr || t == c || t->team != c->team || c->resources.get("bardic_inspiration", 0) <= 0)
		{
			return false;
		}
		if (BattleMap::dist(c->cell, t->cell) > 12 || t->has_effect("bardic_inspiration") || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["bardic_inspiration"] -= 1;
		EffectPtr bi = make_effect("bardic_inspiration");
		bi->name = format("Inspiración (%s)", c->bardic_die.c_str());
		bi->source = c;
		bi->positive = true;
		bi->rounds_left = 100;
		bi->data = vdict({{"die", c->bardic_die}});
		b.attach_effect(t, bi);
		b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", "bardic_inspiration"}, {"name", "Inspiración bárdica"}, {"targets", varr({t->id})},
			{"slot", 0}}));
		b.log_msg(Loc::t("log.bardic", vdict({{"who", Battle::nm(c)}, {"target", Battle::nm(t)}})));
		return true;
	}
	if (id == "wild_shape")
	{
		return wild_shape(c, data.get("choice", "").str());
	}
	if (id == "wild_shape_end")
	{
		EffectPtr ws = c->get_effect("wild_shape");
		if (!ws || !b.spend(c, "bonus"))
		{
			return false;
		}
		b.remove_effect(ws);
		return true;
	}
	if (id == "lands_aid")
	{
		return lands_aid(c, data.has("point") ? data.get("point").vec2() : BattleMap::center(c->cell), data.get("heal_target", "").str());
	}
	if (id == "martial_strike")
	{
		if (t == nullptr || !b.spend(c, "bonus"))
		{
			return false;
		}
		b.do_attack(c, "w:unarmed", t, vdict({{"free", true}, {"bonus_strike", true}}));
		return true;
	}
	if (id == "flurry")
	{
		if (t == nullptr || c->resources.get("focus", 0) <= 0 || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["focus"] -= 1;
		feature_event(c, id);
		b.log_msg(Loc::t("log.flurry", vdict({{"who", Battle::nm(c)}})));
		const std::string tech = data.gets("technique", "auto");
		for (int i = 0; i < 2; ++i)
		{
			if (t == nullptr || t->dead || !t->is_active() || BattleMap::dist(c->cell, t->cell) > 1)
			{
				t = adjacent_enemy(c);
			}
			if (t == nullptr || !c->can_act())
			{
				break;
			}
			b.do_attack(c, "w:unarmed", t, vdict({{"free", true}, {"bonus_strike", true}, {"flurry", true}, {"technique", tech}}));
		}
		return true;
	}
	if (id == "patient_defense")
	{
		if (c->resources.get("focus", 0) <= 0 || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["focus"] -= 1;
		c->turn.disengaged = true;
		b.add_dodge(c);
		feature_event(c, id);
		b.log_msg(Loc::t("log.patient_defense", vdict({{"who", Battle::nm(c)}})));
		return true;
	}
	if (id == "step_of_wind")
	{
		if (c->resources.get("focus", 0) <= 0 || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["focus"] -= 1;
		c->turn.disengaged = true;
		c->turn.movement += c->speed();
		feature_event(c, id);
		b.emit(vdict({{"t", "dash"}, {"who", c->id}}));
		b.log_msg(Loc::t("log.step_of_wind", vdict({{"who", Battle::nm(c)}})));
		return true;
	}
	if (id == "lay_on_hands")
	{
		return lay_on_hands(c, t, data.geti("amount", -1));
	}
	if (id == "sacred_weapon")
	{
		if (c->resources.get("channel_divinity", 0) <= 0 || c->has_effect("sacred_weapon"))
		{
			return false;
		}
		c->resources["channel_divinity"] -= 1;
		EffectPtr sw = make_effect("sacred_weapon");
		sw->name = "Arma sagrada";
		sw->source = c;
		sw->positive = true;
		sw->rounds_left = 100;
		b.attach_effect(c, sw);
		feature_event(c, id);
		b.log_msg(Loc::t("log.sacred_weapon", vdict({{"who", Battle::nm(c)}})));
		return true;
	}
	if (id == "move_mark")
	{
		return move_mark(c, t);
	}
	if (id == "innate_sorcery")
	{
		if (c->resources.get("innate_sorcery", 0) <= 0 || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["innate_sorcery"] -= 1;
		EffectPtr isor = make_effect("innate_sorcery");
		isor->name = "Hechicería innata";
		isor->source = c;
		isor->positive = true;
		isor->rounds_left = 10;
		b.attach_effect(c, isor);
		feature_event(c, id);
		b.log_msg(Loc::t("log.innate_sorcery", vdict({{"who", Battle::nm(c)}})));
		return true;
	}
	if (id == "create_slot")
	{
		const int lvl = data.get("choice", "1").to_int();
		const int cost = lvl == 1 ? 2 : 3;
		if (c->resources.get("sorcery_points", 0) < cost || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["sorcery_points"] -= cost;
		while (static_cast<int>(c->slots.size()) < lvl)
		{
			c->slots.push_back(0);
		}
		c->slots[static_cast<size_t>(lvl - 1)] += 1;
		feature_event(c, id);
		b.log_msg(Loc::t("log.create_slot", vdict({{"who", Battle::nm(c)}, {"lvl", lvl}})));
		return true;
	}
	if (id == "convert_slot")
	{
		const int lv = data.get("choice", "1").to_int();
		if (lv < 1 || lv > static_cast<int>(c->slots.size()) || c->slots[static_cast<size_t>(lv - 1)] <= 0)
		{
			return false;
		}
		c->slots[static_cast<size_t>(lv - 1)] -= 1;
		c->resources["sorcery_points"] = c->resources.get("sorcery_points", 0) + lv;
		b.log_msg(Loc::t("log.convert_slot", vdict({{"who", Battle::nm(c)}, {"n", lv}})));
		return true;
	}
	if (id == "breath_cone" || id == "breath_line")
	{
		const Vec2 dir = data.has("dir") ? data.get("dir").vec2() : BattleMap::center(c->cell) + Vec2(0.0f, 1.0f);
		return breath(c, id == "breath_line" ? "line" : "cone", dir);
	}
	if (id == "clouds_jaunt")
	{
		const Cell cell = data.has("cell") ? data.get("cell").cell() : Cell(-99, -99);
		if (c->resources.get("giant_ancestry", 0) <= 0 || !b.map.walkable(cell) || b.creature_at(cell) != nullptr ||
			BattleMap::dist(c->cell, cell) > 6 || !b.map.has_los(c->cell, cell))
		{
			return false;
		}
		if (!b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["giant_ancestry"] -= 1;
		feature_event(c, id);
		b.teleport(c, cell);
		return true;
	}
	if (id == "adrenaline_rush")
	{
		if (c->resources.get("adrenaline_rush", 0) <= 0 || !b.spend(c, "bonus"))
		{
			return false;
		}
		c->resources["adrenaline_rush"] -= 1;
		c->turn.movement += c->speed();
		feature_event(c, id);
		b.emit(vdict({{"t", "dash"}, {"who", c->id}}));
		b.log_msg(Loc::t("log.adrenaline_rush", vdict({{"who", Battle::nm(c)}})));
		b.gain_temp_hp(c, c->prof_bonus);
		return true;
	}
	if (id == "zone_move")
	{
		return b.spells->move_zone_action(c, data.geti("zone", -1), data.has("point") ? data.get("point").vec2() : Vec2());
	}
	if (id == "sphere_move")
	{
		return b.spells->flaming_sphere_turn(c, t);
	}
	if (id == "escape")
	{
		return b.do_escape(c);
	}
	return false;
}

void ClassActions::feature_event(Creature* c, const std::string& id)
{
	b.emit(vdict({{"t", "feature"}, {"who", c->id}, {"feature", id}}));
}

Creature* ClassActions::adjacent_enemy(Creature* c)
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

// ================================================================== rasgos concretos

bool ClassActions::divine_spark(Creature* c, Creature* target)
{
	if (c->resources.get("channel_divinity", 0) <= 0 || target == nullptr)
	{
		return false;
	}
	if (BattleMap::dist(c->cell, target->cell) > 6 || !b.map.has_los(c->cell, target->cell))
	{
		return false;
	}
	if (!b.spend(c, "action"))
	{
		return false;
	}
	c->resources["channel_divinity"] -= 1;
	const int amount = b.dice.roll(format("1d8+%d", c->mod("wis"))).total;
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", "divine_spark"}, {"name", "Chispa divina"}, {"targets", varr({target->id})}, {"slot", 0}}));
	b.log_msg(Loc::t("log.divine_spark", vdict({{"who", Battle::nm(c)}})));
	b.reveal(c);
	if (target->team == c->team)
	{
		b.heal(target, amount, c);
	}
	else
	{
		const Var r = b.saving_throw(target, "con", c->spell_save_dc(), c);
		const int dmg = !r.getb("success") ? amount : amount / 2;
		const std::string dtype = b.damage_multiplier(target, "radiant") >= b.damage_multiplier(target, "necrotic") ? "radiant" : "necrotic";
		b.apply_damage(target, dmg, dtype, c);
	}
	return true;
}

bool ClassActions::turn_undead(Creature* c)
{
	if (c->resources.get("channel_divinity", 0) <= 0)
	{
		return false;
	}
	if (!b.spend(c, "action"))
	{
		return false;
	}
	c->resources["channel_divinity"] -= 1;
	StrList affected;
	for (Creature* e : b.enemies_of(c))
	{
		if (e->ctype == "undead" && e->is_active() && BattleMap::dist(c->cell, e->cell) <= 6)
		{
			affected.push_back(e->id);
		}
	}
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", "turn_undead"}, {"name", "Expulsar muertos vivientes"},
		{"targets", Var::array_of(affected)}, {"slot", 0}}));
	b.reveal(c);
	for (const std::string& aid : affected)
	{
		Creature* e = b.get_creature(aid);
		const Var r = b.saving_throw(e, "wis", c->spell_save_dc(), c, vdict({{"vs", "frightened"}}));
		if (!r.getb("success"))
		{
			EffectPtr ef = make_effect("turned");
			ef->name = "Expulsado";
			ef->source = c;
			ef->grants = {"frightened", "incapacitated"};
			ef->rounds_left = 10;
			ef->data = vdict({{"from", c->id}});
			b.attach_effect(e, ef);
			b.log_msg(Loc::t("log.turned", vdict({{"who", Battle::nm(e)}})));
		}
	}
	return true;
}

bool ClassActions::preserve_life(Creature* c)
{
	if (c->resources.get("channel_divinity", 0) <= 0 || !c->level_feature("preserve_life"))
	{
		return false;
	}
	if (!b.spend(c, "action"))
	{
		return false;
	}
	c->resources["channel_divinity"] -= 1;
	int pool = 5 * c->level;
	std::vector<Creature*> cands;
	for (Creature* a : b.allies_of(c, true))
	{
		if (a->bloodied() && BattleMap::dist(c->cell, a->cell) <= 6 && a->hp < a->max_hp / 2)
		{
			cands.push_back(a);
		}
	}
	godot_sort(cands, [](Creature* x, Creature* y) { return x->hp_ratio() < y->hp_ratio(); });
	Var ids = Var::array();
	for (Creature* x : cands)
	{
		ids.push(x->id);
	}
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", "preserve_life"}, {"name", "Preservar la vida"}, {"targets", ids}, {"slot", 0}}));
	b.log_msg(Loc::t("log.preserve_life", vdict({{"who", Battle::nm(c)}})));
	b.reveal(c);
	int guard = 0;
	while (pool > 0 && guard < 50)
	{
		guard += 1;
		bool gave = false;
		for (Creature* a : cands)
		{
			const int cap = a->max_hp / 2 - a->hp;
			if (cap <= 0 || pool <= 0)
			{
				continue;
			}
			const int amt = std::min(cap, std::max(1, static_cast<int>(std::ceil(pool / 2.0))));
			b.heal(a, amt, c);
			pool -= amt;
			gave = true;
		}
		if (!gave)
		{
			break;
		}
	}
	return true;
}

bool ClassActions::sw_move(Creature* c, Creature* target)
{
	const std::string tid = "sw_" + c->id;
	if (!b.tokens.has(Var(tid)) || target == nullptr)
	{
		return false;
	}
	const Cell from = b.tokens.get(Var(tid)).get("cell").cell();
	Cell best = target->cell;
	int best_d = 99;
	for (const Cell& n : BattleMap::neighbors(target->cell))
	{
		const int dd = BattleMap::dist(from, n);
		if (dd <= 4 && dd < best_d && b.map.in_bounds(n))
		{
			best_d = dd;
			best = n;
		}
	}
	if (best == target->cell)
	{
		return false;
	}
	return b.spells->spiritual_weapon_turn(c, best, target);
}

bool ClassActions::rage(Creature* c)
{
	if (c->resources.get("rage", 0) <= 0 || c->is_raging())
	{
		return false;
	}
	if (jstr(c->armor_data(), "cat", "") == "heavy")
	{
		return false;
	}
	if (!b.spend(c, "bonus"))
	{
		return false;
	}
	c->resources["rage"] -= 1;
	if (c->concentration)
	{
		b.end_concentration(c, true);
	}
	EffectPtr e = make_effect("rage");
	e->name = "Furia";
	e->source = c;
	e->positive = true;
	e->rounds_left = 100;
	e->data = vdict({{"fresh", true}});
	b.attach_effect(c, e);
	feature_event(c, "rage");
	b.log_msg(Loc::t("log.rage", vdict({{"who", Battle::nm(c)}})));
	return true;
}

bool ClassActions::wild_shape(Creature* c, const std::string& form_id)
{
	if (c->resources.get("wild_shape", 0) <= 0 || !contains(c->wild_shapes, form_id) || !c->form.empty())
	{
		return false;
	}
	if (!b.spend(c, "bonus"))
	{
		return false;
	}
	c->resources["wild_shape"] -= 1;
	c->enter_form(form_id);
	EffectPtr e = make_effect("wild_shape");
	const std::string form_name = jstr(RulesDB::monster_data(form_id), "name", form_id);
	e->name = "Forma: " + form_name;
	e->source = c;
	e->positive = true;
	e->data = vdict({{"form", form_id}});
	b.attach_effect(c, e);
	c->turn.movement = std::max(0, c->speed() - (c->turn.undo_movement - c->turn.movement));
	b.emit(vdict({{"t", "shape"}, {"who", c->id}, {"form", form_id}}));
	b.log_msg(Loc::t("log.wild_shape", vdict({{"who", Battle::nm(c)}, {"form", utf8_lower(form_name)}})));
	b.gain_temp_hp(c, c->level);
	return true;
}

std::vector<Cell> ClassActions::lands_aid_cells(Creature* c, const Vec2& point)
{
	(void)c;
	return b.map.sphere_cells(point, 10);
}

bool ClassActions::lands_aid(Creature* c, const Vec2& point, const std::string& heal_id)
{
	if (c->resources.get("wild_shape", 0) <= 0)
	{
		return false;
	}
	const Cell center = BattleMap::cell_at(point);
	if (BattleMap::dist(c->cell, center) > 12 || !b.map.has_los(c->cell, center))
	{
		return false;
	}
	if (!b.spend(c, "action"))
	{
		return false;
	}
	c->resources["wild_shape"] -= 1;
	const std::vector<Cell> cells = lands_aid_cells(c, point);
	Var cells_v = Var::array();
	for (const Cell& cell : cells)
	{
		cells_v.push(Var(cell));
	}
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", "lands_aid"}, {"name", "Auxilio de la tierra"}, {"targets", Var::array()},
		{"cells", cells_v}, {"slot", 0}}));
	b.log_msg(Loc::t("log.lands_aid", vdict({{"who", Battle::nm(c)}})));
	const int dmg = b.dice.roll("2d6").total;
	const std::vector<Creature*> in_area = b.spells->creatures_in(cells);
	Creature* heal_t = b.get_creature(heal_id);
	for (Creature* t : in_area)
	{
		if (t->team != c->team && t->is_active())
		{
			const Var r = b.saving_throw(t, "con", c->spell_save_dc(), c);
			b.apply_damage(t, !r.getb("success") ? dmg : dmg / 2, "necrotic", c, vdict({{"magic", true}}));
		}
	}
	if (heal_t == nullptr || !contains(in_area, heal_t) || heal_t->team != c->team)
	{
		heal_t = nullptr;
		for (Creature* t2 : in_area)
		{
			if (t2->team == c->team && (heal_t == nullptr || t2->hp_ratio() < heal_t->hp_ratio()))
			{
				heal_t = t2;
			}
		}
	}
	if (heal_t != nullptr && heal_t->hp < heal_t->max_hp)
	{
		const int amount = b.dice.roll("2d6").total;
		b.heal(heal_t, amount, c);
	}
	return true;
}

bool ClassActions::lay_on_hands(Creature* c, Creature* t, int amount)
{
	if (t == nullptr || BattleMap::dist(c->cell, t->cell) > 1 || t->team != c->team)
	{
		return false;
	}
	const int pool = c->resources.get("lay_on_hands", 0);
	if (pool <= 0)
	{
		return false;
	}
	const int missing = t->max_hp - t->hp;
	const bool cure = t->has_condition("poisoned") && pool >= 5 && (missing <= 0 || amount == -2);
	if (missing <= 0 && !cure)
	{
		return false;
	}
	if (!b.spend(c, "bonus"))
	{
		return false;
	}
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", "lay_on_hands"}, {"name", "Imposición de manos"}, {"targets", varr({t->id})}, {"slot", 0}}));
	if (cure)
	{
		c->resources["lay_on_hands"] -= 5;
		const std::vector<EffectPtr> snapshot = t->effects;
		for (const EffectPtr& e : snapshot)
		{
			if (contains(e->grants, std::string("poisoned")))
			{
				b.remove_effect(e);
			}
		}
		b.remove_condition(t, "poisoned");
		b.log_msg(Loc::t("log.lay_on_hands_cure", vdict({{"who", Battle::nm(c)}, {"target", Battle::nm(t)}})));
		return true;
	}
	const int amt = amount <= 0 ? std::min(pool, missing) : std::min(pool, amount);
	c->resources["lay_on_hands"] -= amt;
	b.log_msg(Loc::t("log.lay_on_hands", vdict({{"who", Battle::nm(c)}, {"target", Battle::nm(t)}})));
	b.heal(t, amt, c);
	return true;
}

bool ClassActions::move_mark(Creature* c, Creature* t)
{
	const Var mk = mark_info(c);
	if (mk.is_empty() || !mk.getb("free") || t == nullptr || t->team == c->team || !t->is_active())
	{
		return false;
	}
	if (BattleMap::dist(c->cell, t->cell) > 18 || !b.sees(c, t))
	{
		return false;
	}
	if (!b.spend(c, "bonus"))
	{
		return false;
	}
	const std::string kind = mk.gets("kind");
	Creature* holder = mk.get("holder").creature();
	if (holder != nullptr)
	{
		for (const EffectPtr& e : holder->get_effects(kind))
		{
			if (e->source == c)
			{
				b.remove_effect(e);
			}
		}
	}
	const Json& sp = RulesDB::spell(mk.gets("spell"));
	EffectPtr e2 = make_effect(kind);
	e2->name = jstr(sp, "name", "");
	e2->source = c;
	e2->data = vdict({{"damage", sp.contains("mark_damage") ? Var::from_json(sp["mark_damage"]) : vdict({{"dice", "1d6"}, {"type", "force"}})}});
	b.attach_effect(t, e2);
	b.link_to_concentration(c, e2);
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", mk.get("spell")}, {"name", jstr(sp, "name", "")}, {"targets", varr({t->id})}, {"slot", 0}}));
	b.log_msg(Loc::t("log.move_mark", vdict({{"who", Battle::nm(c)}, {"target", Battle::nm(t)}})));
	return true;
}

bool ClassActions::breath(Creature* c, const std::string& shape, const Vec2& dir)
{
	if (c->resources.get("breath_weapon", 0) <= 0 || !has_attack(c))
	{
		return false;
	}
	// Sustituye un ataque de la acción de Atacar
	if (c->turn.attack_left <= 0)
	{
		c->turn.action -= 1;
		c->turn.attack_left = b.attacks_per_action(c);
		c->turn.attack_action = true;
	}
	c->turn.attack_left -= 1;
	c->turn.acted = true;
	c->turn.can_undo = false;
	c->turn.rage_extended = true;
	c->resources["breath_weapon"] -= 1;
	const std::vector<Cell> cells = breath_cells(c, shape, dir);
	Var cells_v = Var::array();
	for (const Cell& cell : cells)
	{
		cells_v.push(Var(cell));
	}
	b.emit(vdict({{"t", "cast"}, {"who", c->id}, {"spell", "breath_weapon"}, {"name", "Arma de aliento"}, {"targets", Var::array()},
		{"cells", cells_v}, {"slot", 0}, {"dtype", c->breath_type}}));
	b.log_msg(Loc::t("log.breath", vdict({{"who", Battle::nm(c)}})));
	b.reveal(c);
	const int dmg = b.dice.roll(breath_dice(c)).total;
	for (Creature* t : b.spells->creatures_in(cells, c))
	{
		if (t->dead)
		{
			continue;
		}
		const Var r = b.saving_throw(t, "dex", breath_dc(c), c);
		b.apply_damage(t, !r.getb("success") ? dmg : dmg / 2, c->breath_type, c);
	}
	return true;
}

} // namespace mdg
