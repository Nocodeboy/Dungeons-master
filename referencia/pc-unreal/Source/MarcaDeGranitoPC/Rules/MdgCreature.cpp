#include "MdgCreature.h"

#include "MdgFactory.h"
#include "MdgRulesDB.h"

namespace mdg
{

const StrList Creature::kAbilities = {"str", "dex", "con", "int", "wis", "cha"};
const StrList Creature::kSizes = {"tiny", "small", "medium", "large", "huge", "gargantuan"};
const StrList Creature::kProtEvilTypes = {"aberration", "celestial", "elemental", "fey", "fiend", "undead"};

int Creature::size_order(const std::string& s)
{
	for (size_t i = 0; i < kSizes.size(); ++i)
	{
		if (kSizes[i] == s)
		{
			return static_cast<int>(i);
		}
	}
	return 2;
}

std::string Creature::skill_ability(const std::string& skill)
{
	static const Dict<std::string> table = []() {
		Dict<std::string> d;
		const char* pairs[][2] = {{"acrobatics", "dex"}, {"animal_handling", "wis"}, {"arcana", "int"}, {"athletics", "str"},
			{"deception", "cha"}, {"history", "int"}, {"insight", "wis"}, {"intimidation", "cha"}, {"investigation", "int"},
			{"medicine", "wis"}, {"nature", "int"}, {"perception", "wis"}, {"performance", "cha"}, {"persuasion", "cha"},
			{"religion", "int"}, {"sleight_of_hand", "dex"}, {"stealth", "dex"}, {"survival", "wis"}};
		for (const auto& p : pairs)
		{
			d[p[0]] = p[1];
		}
		return d;
	}();
	return table.get(skill, "dex");
}

Creature::Creature()
{
	for (const std::string& a : kAbilities)
	{
		abilities[a] = 10;
	}
	for (const char* k : {"damage_dealt", "damage_taken", "kills", "healed", "crits", "downs"})
	{
		stats[k] = 0;
	}
}

// ------------------------------------------------------------------ básicos

int Creature::mod(const std::string& ab) const
{
	return ability_mod(abilities.get(ab, 10));
}

int Creature::size_rank() const
{
	int r = size_order(size);
	if (has_effect("enlarged"))
	{
		r += 1;
	}
	if (has_effect("reduced"))
	{
		r -= 1;
	}
	return std::clamp(r, 0, 5);
}

bool Creature::has_trait(const std::string& t) const
{
	return contains(traits, t) || contains(feats, t);
}

bool Creature::unarmored_monk() const
{
	return cls == "monk" && armor_id.empty() && !has_shield && form.empty();
}

// ------------------------------------------------------------------ condiciones

bool Creature::add_condition(const std::string& c, const std::string& source)
{
	if (contains(condition_immune, c))
	{
		return false;
	}
	if (c == "frightened" && has_effect("heroism"))
	{
		return false;
	}
	add_unique(conditions[c], source);
	return true;
}

void Creature::remove_condition(const std::string& c, const std::string& source)
{
	StrList* srcs = conditions.find(c);
	if (srcs == nullptr)
	{
		return;
	}
	if (source.empty())
	{
		conditions.erase(c);
		return;
	}
	erase_first(*srcs, source);
	if (srcs->empty())
	{
		conditions.erase(c);
	}
}

bool Creature::raw_has(const std::string& c) const
{
	if (conditions.has(c))
	{
		return true;
	}
	for (const EffectPtr& e : effects)
	{
		if (contains(e->grants, c))
		{
			return true;
		}
	}
	return false;
}

bool Creature::has_condition(const std::string& c) const
{
	if (contains(condition_immune, c))
	{
		return false;
	}
	if (c == "frightened" && has_effect("heroism"))
	{
		return false;
	}
	if (raw_has(c))
	{
		return true;
	}
	if (c == "incapacitated")
	{
		return raw_has("paralyzed") || raw_has("unconscious") || raw_has("stunned") || raw_has("petrified");
	}
	if (c == "prone")
	{
		return raw_has("unconscious");
	}
	return false;
}

bool Creature::can_act() const
{
	return is_active() && !has_condition("incapacitated");
}

bool Creature::can_react() const
{
	const int reaction_left = turn.started ? turn.reaction : 1;
	return can_act() && reaction_left > 0 && !has_effect("no_reactions");
}

bool Creature::is_invisible() const
{
	if (!has_condition("invisible"))
	{
		return false;
	}
	for (const char* k : {"outlined", "outlined_wisp", "outlined_shine"})
	{
		if (has_effect(k))
		{
			return false;
		}
	}
	return true;
}

StrList Creature::active_condition_list() const
{
	StrList out;
	for (const char* c : {"unconscious", "paralyzed", "incapacitated", "prone", "restrained", "blinded", "frightened", "charmed",
			 "poisoned", "grappled", "invisible"})
	{
		const std::string cs(c);
		if (!has_condition(cs))
		{
			continue;
		}
		if (cs == "incapacitated" && (has_condition("unconscious") || has_condition("paralyzed")))
		{
			continue;
		}
		if (cs == "prone" && has_condition("unconscious"))
		{
			continue;
		}
		out.push_back(cs);
	}
	return out;
}

// ------------------------------------------------------------------ efectos

bool Creature::has_effect(const std::string& kind) const
{
	for (const EffectPtr& e : effects)
	{
		if (e->kind == kind)
		{
			return true;
		}
	}
	return false;
}

EffectPtr Creature::get_effect(const std::string& kind) const
{
	for (const EffectPtr& e : effects)
	{
		if (e->kind == kind)
		{
			return e;
		}
	}
	return nullptr;
}

std::vector<EffectPtr> Creature::get_effects(const std::string& kind) const
{
	std::vector<EffectPtr> out;
	for (const EffectPtr& e : effects)
	{
		if (e->kind == kind)
		{
			out.push_back(e);
		}
	}
	return out;
}

// ------------------------------------------------------------------ CA y velocidad

const Json& Creature::armor_data() const
{
	if (armor_id.empty())
	{
		return jempty_object();
	}
	return jobj(RulesDB::armor, armor_id);
}

int Creature::ac() const
{
	int total = 0;
	if (fixed_ac >= 0)
	{
		total = fixed_ac;
	}
	else
	{
		const Json& a = armor_data();
		const int dex = mod("dex");
		if (a.empty())
		{
			total = 10 + dex;
			if (has_effect("mage_armor"))
			{
				total = std::max(total, 13 + dex);
			}
			if (has_trait("unarmored_defense_barbarian"))
			{
				total = std::max(total, 10 + dex + mod("con"));
			}
			if (has_trait("unarmored_defense_monk") && !has_shield)
			{
				total = std::max(total, 10 + dex + mod("wis"));
			}
			if (has_trait("draconic_resilience"))
			{
				total = std::max(total, 10 + dex + mod("cha"));
			}
		}
		else
		{
			// Las armaduras pesadas ignoran la Destreza (también la negativa)
			total = jstr(a, "cat") == "heavy" ? jint(a, "base") : jint(a, "base") + std::min(dex, jint(a, "dex_cap"));
			total += armor_bonus;
			if (fighting_style == "defense")
			{
				total += 1;
			}
		}
		if (has_shield)
		{
			total += 2 + shield_bonus;
		}
		else if (a.empty())
		{
			total += item_ac_unarmored;
		}
		total += item_ac;
	}
	if (has_effect("barkskin"))
	{
		total = std::max(total, 17);
	}
	for (const EffectPtr& e : effects)
	{
		if (e->kind == "shield_of_faith")
		{
			total += 2;
		}
		else if (e->kind == "shield_spell")
		{
			total += 5;
		}
		else if (e->kind == "warding_bond")
		{
			total += 1;
		}
	}
	return total;
}

int Creature::speed() const
{
	if (has_condition("grappled") || has_condition("restrained") || has_condition("paralyzed") || has_condition("unconscious"))
	{
		return 0;
	}
	if (has_effect("steady_aim") || has_effect("speed_zero"))
	{
		return 0;
	}
	int s = form.empty() ? std::max(base_speed, speed_min) : base_speed;
	const Json& a = armor_data();
	if (form.empty() && !ignore_armor_speed && !a.empty() && jint(a, "str_req", 0) > abilities.get("str", 10))
	{
		s -= 10;
	}
	if (unarmored_monk() && level >= 2)
	{
		s += RulesDB::at_level_int(jat(jobj(RulesDB::classes, "monk"), "unarmored_movement"), level, 10);
	}
	bool weapon_slow = false;
	for (const EffectPtr& e : effects)
	{
		if (e->kind == "slowed_weapon")
		{
			weapon_slow = true;
		}
		else if (e->kind == "slowed_frost" || e->kind == "frosts_chill")
		{
			s -= 10;
		}
		else if (e->kind == "longstrider")
		{
			s += 10;
		}
	}
	if (weapon_slow)
	{
		s -= 10;
	}
	return std::max(0, s);
}

// ------------------------------------------------------------------ tiradas

int Creature::save_bonus(const std::string& ab) const
{
	if (const int* o = save_overrides.find(ab))
	{
		return *o;
	}
	int b = mod(ab) + item_saves;
	if (contains(save_profs, ab))
	{
		b += prof_bonus;
	}
	return b;
}

int Creature::skill_bonus(const std::string& skill) const
{
	if (const int* o = skill_overrides.find(skill))
	{
		return *o;
	}
	const std::string ab = skill_ability(skill);
	int b = mod(ab) + item_checks + item_skill.get(skill, 0);
	if (contains(expertise, skill))
	{
		b += prof_bonus * 2;
	}
	else if (contains(skill_profs, skill))
	{
		b += prof_bonus;
	}
	else if (has_trait("jack_of_all_trades"))
	{
		b += prof_bonus / 2;
	}
	return b;
}

int Creature::initiative_bonus() const
{
	if (init_bonus_override > -999)
	{
		return init_bonus_override;
	}
	int b = mod("dex") + item_checks;
	if (has_trait("alert"))
	{
		b += prof_bonus;
	}
	else if (has_trait("jack_of_all_trades"))
	{
		b += prof_bonus / 2;
	}
	return b;
}

std::string Creature::spell_ability_for(const std::string& sid) const
{
	if (!sid.empty())
	{
		if (const std::string* a = spell_ability.find(sid))
		{
			return *a;
		}
	}
	return casting_ability;
}

int Creature::spell_attack_bonus(const std::string& sid) const
{
	if (!item_cast.empty() && jstr(item_cast, "spell") == sid && item_cast.contains("atk"))
	{
		return jint(item_cast, "atk");
	}
	const std::string ab = spell_ability_for(sid);
	return !ab.empty() ? prof_bonus + mod(ab) : 0;
}

int Creature::spell_save_dc(const std::string& sid) const
{
	if (!item_cast.empty() && jstr(item_cast, "spell") == sid && item_cast.contains("dc"))
	{
		return jint(item_cast, "dc");
	}
	const std::string ab = spell_ability_for(sid);
	if (ab.empty())
	{
		return 10;
	}
	int dc = 8 + prof_bonus + mod(ab);
	if (has_effect("innate_sorcery") && spell_source.get(sid, "class") == "class")
	{
		dc += 1;
	}
	return dc;
}

int Creature::spell_mod(const std::string& sid) const
{
	const std::string ab = spell_ability_for(sid);
	return !ab.empty() ? mod(ab) : 0;
}

// ------------------------------------------------------------------ armas

namespace creature_detail
{

bool has_prop(const Var& w, const char* prop)
{
	return w.get("props").contains(Var(prop));
}

} // namespace creature_detail

bool Creature::is_monk_weapon(const Var& w) const
{
	if (w.gets("id") == "unarmed")
	{
		return true;
	}
	if (w.gets("kind") != "melee")
	{
		return false;
	}
	const std::string cat = w.gets("cat", "simple");
	return cat == "simple" || (cat == "martial" && creature_detail::has_prop(w, "light"));
}

std::string Creature::weapon_attack_ability(const Var& w) const
{
	if (w.getb("monster", false))
	{
		return "";
	}
	const std::string wid = w.gets("id");
	// Garrote mágico y arma de pacto usan la característica mágica
	if (has_effect("shillelagh") && (wid == "club" || wid == "quarterstaff"))
	{
		const std::string sab = spell_ability_for("shillelagh");
		if (mod(sab) > mod("str"))
		{
			return sab;
		}
	}
	if (!pact_weapon.empty() && wid == pact_weapon && has_trait("pact_of_the_blade"))
	{
		if (mod("cha") >= std::max(mod("str"), creature_detail::has_prop(w, "finesse") ? mod("dex") : -99))
		{
			return "cha";
		}
	}
	if (cls == "monk" && unarmored_monk() && is_monk_weapon(w))
	{
		return mod("dex") >= mod("str") ? "dex" : "str";
	}
	if (w.gets("kind", "melee") == "ranged")
	{
		return "dex";
	}
	if (creature_detail::has_prop(w, "finesse"))
	{
		return mod("dex") >= mod("str") ? "dex" : "str";
	}
	return "str";
}

bool Creature::is_proficient(const Var& w) const
{
	if (w.getb("monster", false) || w.gets("id") == "unarmed")
	{
		return true;
	}
	if (!is_pc)
	{
		return true;
	}
	if (!pact_weapon.empty() && w.gets("id") == pact_weapon && has_trait("pact_of_the_blade"))
	{
		return true;
	}
	const Json& c = jobj(RulesDB::classes, cls);
	const Json& profs = jarr(c, "weapons");
	const std::string cat = w.gets("cat", "simple");
	if (jin(profs, cat))
	{
		return true;
	}
	if (cat == "martial" && jin(profs, "martial_finesse_or_light"))
	{
		return creature_detail::has_prop(w, "finesse") || creature_detail::has_prop(w, "light");
	}
	if (cat == "martial" && jin(profs, "martial_light"))
	{
		return creature_detail::has_prop(w, "light");
	}
	if (cat == "martial" && (has_trait("protector") || has_trait("warden")))
	{
		return true;
	}
	return false;
}

bool Creature::has_mastery(const Var& w) const
{
	return contains(masteries, w.gets("id")) && !w.gets("mastery").empty() && form.empty();
}

bool Creature::two_handing(const Var& w) const
{
	if (!creature_detail::has_prop(w, "versatile"))
	{
		return false;
	}
	return !has_shield;
}

std::vector<Var> Creature::melee_weapons() const
{
	std::vector<Var> out;
	for (const Var& w : weapons)
	{
		if (w.gets("kind", "melee") == "melee" && !w.getb("thrown_only", false))
		{
			out.push_back(w);
		}
	}
	return out;
}

std::vector<Var> Creature::ranged_options() const
{
	std::vector<Var> out;
	for (const Var& w : weapons)
	{
		if (w.gets("kind", "melee") == "ranged")
		{
			if (ammo_left(w) != 0)
			{
				out.push_back(w);
			}
		}
		else if (creature_detail::has_prop(w, "thrown") && ammo_left(w) != 0)
		{
			out.push_back(w);
		}
	}
	return out;
}

int Creature::ammo_left(const Var& w) const
{
	const std::string key = w.gets("ammo_key", w.gets("id"));
	if (const int* n = ammo.find(key))
	{
		return *n;
	}
	return -1;
}

int Creature::reach_cells(const Var& w) const
{
	if (w.is_nil() || w.is_empty())
	{
		int best = 1;
		for (const Var& mw : melee_weapons())
		{
			best = std::max(best, creature_detail::has_prop(mw, "reach") ? 2 : 1);
		}
		return best;
	}
	return creature_detail::has_prop(w, "reach") ? 2 : 1;
}

// ------------------------------------------------------------------ magia

StrList Creature::known_spells() const
{
	StrList out;
	for (const std::string& s : cantrips)
	{
		add_unique(out, s);
	}
	for (const std::string& s : always_prepared)
	{
		add_unique(out, s);
	}
	for (const std::string& s : prepared)
	{
		add_unique(out, s);
	}
	for (const std::string& s : free_casts.keys())
	{
		add_unique(out, s);
	}
	for (const std::string& s : at_will)
	{
		add_unique(out, s);
	}
	return out;
}

bool Creature::has_slot(int level_min) const
{
	for (size_t i = static_cast<size_t>(std::max(0, level_min - 1)); i < slots.size(); ++i)
	{
		if (slots[i] > 0)
		{
			return true;
		}
	}
	return false;
}

int Creature::lowest_slot(int level_min) const
{
	for (size_t i = static_cast<size_t>(std::max(0, level_min - 1)); i < slots.size(); ++i)
	{
		if (slots[i] > 0)
		{
			return static_cast<int>(i) + 1;
		}
	}
	return 0;
}

int Creature::total_slots() const
{
	int n = 0;
	for (int v : slots)
	{
		n += v;
	}
	return n;
}

bool Creature::can_cast(const std::string& spell_id) const
{
	const Json& sp = RulesDB::spell(spell_id);
	if (sp.empty())
	{
		return false;
	}
	if (!form.empty() || is_raging())
	{
		return false;
	}
	const int lvl = jint(sp, "level");
	if (lvl == 0 || contains(at_will, spell_id))
	{
		return true;
	}
	if (free_casts.get(spell_id, 0) > 0)
	{
		return true;
	}
	return has_slot(lvl);
}

// ------------------------------------------------------------------ forma salvaje

void Creature::enter_form(const std::string& form_id)
{
	if (!form.empty())
	{
		leave_form();
	}
	const Json m = RulesDB::monster_data(form_id);
	if (m.empty())
	{
		return;
	}
	form_backup.abilities = abilities;
	form_backup.fixed_ac = fixed_ac;
	form_backup.base_speed = base_speed;
	form_backup.size = size;
	form_backup.weapons = weapons;
	form_backup.traits = traits;
	form_backup.visual = visual;
	form_backup.darkvision = darkvision;
	form_backup.skill_overrides = skill_overrides;
	form_backup.ammo = ammo;
	form_backup.valid = true;
	form = form_id;
	const Json& ab = jobj(m, "abilities");
	for (const char* a : {"str", "dex", "con"})
	{
		abilities[a] = jint(ab, a, abilities.get(a, 10));
	}
	fixed_ac = jint(m, "ac", 10);
	base_speed = jint(m, "speed", 30);
	size = jstr(m, "size", "medium");
	darkvision = std::max(darkvision, jint(m, "darkvision", 0));
	for (const std::string& t : jstrs(m, "traits"))
	{
		add_unique(traits, t);
	}
	const Json& skills = jobj(m, "skills");
	for (auto it = skills.begin(); it != skills.end(); ++it)
	{
		const int from_form = jto_int(it.value());
		const int own = skill_bonus(it.key());
		skill_overrides[it.key()] = std::max(from_form, own);
	}
	weapons = Factory::monster_attacks(m, *this);
	Json vis = jobj(m, "visual");
	vis["form_of"] = id;
	visual = vis;
}

void Creature::leave_form()
{
	if (form.empty())
	{
		return;
	}
	const FormBackup& b = form_backup;
	abilities = b.abilities;
	fixed_ac = b.fixed_ac;
	base_speed = b.base_speed;
	size = b.size;
	weapons = b.weapons;
	traits = b.traits;
	visual = b.visual;
	darkvision = b.darkvision;
	skill_overrides = b.skill_overrides;
	ammo = b.ammo;
	form.clear();
	form_backup = FormBackup();
}

// ------------------------------------------------------------------ turno

void Creature::reset_turn()
{
	TurnState t;
	t.started = true;
	t.movement = speed();
	t.start_cell = cell;
	t.undo_cell = cell;
	t.undo_movement = speed();
	turn = t;
}

double Creature::hp_ratio() const
{
	return std::clamp(static_cast<double>(hp) / static_cast<double>(std::max(1, max_hp)), 0.0, 1.0);
}

std::string Creature::to_debug() const
{
	StrList quoted;
	for (const std::string& c : active_condition_list())
	{
		quoted.push_back("\"" + c + "\"");
	}
	return format("%s [%s] HP %d/%d CA %d [%s]", name.c_str(), id.c_str(), hp, max_hp, ac(), join(quoted, ", ").c_str());
}

} // namespace mdg
