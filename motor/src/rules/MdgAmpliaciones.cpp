// Marca de Granito · ampliaciones del núcleo que no estaban en el publicado: retirada del combate y
// telaraña de la araña gigante del SRD 5.2.1 (un objeto con CA 10 y 5 PG que hay que romper).
#include "MdgBattle.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"

namespace mdg
{

namespace
{

/** ¿Atrapado de forma que no puede huir? */
bool atrapado(const Creature* c)
{
	return c->has_condition("restrained") || c->has_condition("grappled") || c->has_condition("paralyzed") ||
		   c->has_condition("stunned") || c->has_condition("petrified");
}

} // namespace

// ================================================================== retirada

Var Battle::retreat_info()
{
	std::string motivo;
	if (over)
	{
		motivo = "El combate ya ha terminado.";
	}
	else if (current == nullptr || current->team != 0)
	{
		motivo = "Solo podéis retiraros en el turno de alguien del grupo.";
	}
	else if (standing(0).empty())
	{
		motivo = "No queda nadie en pie para retirarse.";
	}
	Var provocan = Var::array();
	Var arrastrados = Var::array();
	Var atrapados = Var::array();
	for (Creature* c : living(0))
	{
		if (c->is_down())
		{
			arrastrados.push(c->id);
			continue;
		}
		if (atrapado(c))
		{
			atrapados.push(c->id);
			continue;
		}
		if ((c == current && c->turn.disengaged) || c->is_hidden())
		{
			continue;
		}
		Var por = Var::array();
		for (Creature* e : enemies_of(c))
		{
			if (!e->can_react() || e->is_down() || e->has_effect("no_oa"))
			{
				continue;
			}
			const Var mp = best_melee_profile(e);
			if (mp.is_empty() || BattleMap::dist(c->cell, e->cell) > mp.geti("reach") || !sees(e, c) || !may_target(e, c))
			{
				continue;
			}
			por.push(e->id);
		}
		if (por.size() > 0)
		{
			provocan.push(vdict({{"who", c->id}, {"by", por}}));
		}
	}
	if (motivo.empty() && atrapados.size() > 0)
	{
		Creature* a = get_creature(atrapados.at(0).as_str());
		motivo = nm(a) + " está atrapado y no puede huir.";
	}
	std::string texto = "Retirarse termina el combate: sin botín ni experiencia y perdéis la décima parte del oro.";
	if (provocan.size() > 0)
	{
		texto += " Los enemigos que tengan a alguien a su alcance le atacarán al huir.";
	}
	if (arrastrados.size() > 0)
	{
		texto += " Los caídos se llevan a rastras.";
	}
	return vdict({{"can", motivo.empty()}, {"reason", motivo}, {"provoked", provocan}, {"carried", arrastrados}, {"trapped", atrapados},
		{"penalty", vdict({{"loot", false}, {"xp", 0}, {"gold_pct", 10}})}, {"text", texto}});
}

Var Battle::do_retreat()
{
	const Var info = retreat_info();
	if (!info.getb("can"))
	{
		return vdict({{"ok", false}, {"reason", info.get("reason")}});
	}
	for (const Var& pv : info.get("provoked").arr())
	{
		Creature* c = get_creature(pv.gets("who"));
		for (const Var& eid : pv.get("by").arr())
		{
			Creature* e = get_creature(eid.as_str());
			if (c == nullptr || e == nullptr || !c->is_active() || !e->can_react() || e->is_down())
			{
				continue;
			}
			const Var mp = best_melee_profile(e);
			if (mp.is_empty())
			{
				continue;
			}
			e->turn.reaction = 0;
			log_msg(Loc::t("log.oa", vdict({{"who", nm(e)}, {"target", nm(c)}})));
			resolve_weapon_attack(e, mp, c, vdict({{"oa", true}}));
		}
	}
	over = true;
	winner = 1;
	log_msg("El grupo se retira del combate.");
	emit(vdict({{"t", "retreat"}}));
	emit(vdict({{"t", "end"}, {"winner", 1}, {"retreat", true}}));
	return vdict({{"ok", true}});
}

// ================================================================== telaraña de la araña gigante

std::vector<Creature*> Battle::web_targets(Creature* c)
{
	std::vector<Creature*> out;
	if (c == nullptr || c->dead || !c->can_act())
	{
		return out;
	}
	for (const CreaturePtr& x : creatures)
	{
		if (x->dead || !x->has_effect("spider_web_srd"))
		{
			continue;
		}
		if (x.get() == c || (x->team == c->team && BattleMap::dist(x->cell, c->cell) <= 1))
		{
			out.push_back(x.get());
		}
	}
	return out;
}

bool Battle::break_web(Creature* c, Creature* trapped)
{
	EffectPtr e = trapped != nullptr ? trapped->get_effect("spider_web_srd") : nullptr;
	if (e == nullptr || !contains(web_targets(c), trapped))
	{
		return false;
	}
	if (c->turn.attack_left > 0)
	{
		c->turn.attack_left -= 1;
	}
	else if (!spend(c, "action"))
	{
		return false;
	}
	Var p = best_melee_profile(c);
	const int bonus = p.is_empty() ? c->mod("str") + c->prof_bonus : p.geti("bonus");
	const int modo = c->has_condition("restrained") ? -1 : 0;
	const D20Roll r = dice.d20(modo);
	const int total = r.natural + bonus;
	Var web = e->data.get("web", vdict({{"hp", 5}, {"ac", 10}}));
	const bool impacta = r.natural == 20 || (r.natural != 1 && total >= web.geti("ac", 10));
	int dano = 0;
	if (impacta)
	{
		const Var partes = p.is_empty() ? varr({vdict({{"dice", "1"}, {"type", "bludgeoning"}})}) : p.get("damage");
		for (const Var& d : partes.arr())
		{
			const std::string tipo = d.gets("type");
			int n = dice.roll(d.gets("dice"), r.natural == 20).total;
			if (tipo == "fire")
			{
				n *= 2;
			}
			else if (tipo == "poison" || tipo == "psychic")
			{
				n = 0;
			}
			dano += n;
		}
	}
	const int resto = std::max(0, web.geti("hp", 5) - dano);
	web["hp"] = resto;
	e->data["web"] = web;
	emit(vdict({{"t", "web_attack"}, {"who", c->id}, {"target", trapped->id}, {"hit", impacta}, {"total", total}, {"damage", dano},
		{"web_hp", resto}}));
	log_msg(nm(c) + (impacta ? " golpea la telaraña que atrapa a " : " falla contra la telaraña que atrapa a ") + nm(trapped) + ".");
	if (resto <= 0)
	{
		remove_effect(e);
		emit(vdict({{"t", "web_broken"}, {"who", trapped->id}}));
		log_msg("La telaraña se rompe: " + nm(trapped) + " queda libre.");
	}
	changed();
	return true;
}

} // namespace mdg
