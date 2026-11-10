#include "MdgCharacterSheet.h"

#include "MdgRulesDB.h"

namespace mdg
{

const StrList CharacterSheet::kSkills = {"acrobatics", "animal_handling", "arcana", "athletics", "deception", "history", "insight",
	"intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight_of_hand",
	"stealth", "survival"};
const StrList CharacterSheet::kAbilities = {"str", "dex", "con", "int", "wis", "cha"};
const std::vector<int> CharacterSheet::kStandardArray = {15, 14, 13, 12, 10, 8};

namespace sheet_detail
{

const StrList kMentalAbilities = {"int", "wis", "cha"};

/** Trasfondo recomendado por clase (si el jugador no elige). */
std::string default_background(const std::string& cls)
{
	static const Dict<std::string> table = []() {
		Dict<std::string> d;
		const char* pairs[][2] = {{"barbarian", "soldier"}, {"bard", "minstrel"}, {"cleric", "acolyte"}, {"druid", "warden"},
			{"fighter", "soldier"}, {"monk", "criminal"}, {"paladin", "noble"}, {"ranger", "bounty_hunter"}, {"rogue", "criminal"},
			{"sorcerer", "sage"}, {"warlock", "sage"}, {"wizard", "sage"}};
		for (const auto& p : pairs)
		{
			d[p[0]] = p[1];
		}
		return d;
	}();
	return table.get(cls, "soldier");
}

/** Habilidades preferidas por clase (orden de recomendación). */
StrList skill_prefs(const std::string& cls)
{
	static const Dict<StrList> table = []() {
		Dict<StrList> d;
		d["barbarian"] = {"athletics", "perception", "survival", "intimidation"};
		d["bard"] = {"persuasion", "performance", "deception", "insight", "perception", "stealth"};
		d["cleric"] = {"insight", "medicine", "religion", "persuasion"};
		d["druid"] = {"perception", "nature", "medicine", "animal_handling", "survival"};
		d["fighter"] = {"athletics", "perception", "intimidation", "survival"};
		d["monk"] = {"acrobatics", "stealth", "insight", "athletics"};
		d["paladin"] = {"athletics", "persuasion", "insight", "intimidation"};
		d["ranger"] = {"perception", "stealth", "survival", "nature", "investigation"};
		d["rogue"] = {"stealth", "perception", "acrobatics", "sleight_of_hand", "investigation", "deception"};
		d["sorcerer"] = {"arcana", "persuasion", "insight", "deception"};
		d["warlock"] = {"arcana", "deception", "intimidation", "investigation"};
		d["wizard"] = {"arcana", "investigation", "history", "insight"};
		return d;
	}();
	return table.get(cls, StrList());
}

StrList default_invocations(int level)
{
	if (level >= 2)
	{
		return {"eldritch_mind", "agonizing_blast", "repelling_blast"};
	}
	return {"eldritch_mind"};
}

int spell_level_or(const std::string& sid, int def)
{
	return jint(RulesDB::spell(sid), "level", def);
}

bool spell_utility(const std::string& sid)
{
	return jbool(RulesDB::spell(sid), "utility", false);
}

/** Color "#rrggbb" -> componentes 0..1. */
void parse_html_color(const std::string& html, float& r, float& g, float& b)
{
	std::string h = html;
	if (!h.empty() && h[0] == '#')
	{
		h = h.substr(1);
	}
	auto hex2 = [&h](size_t pos) -> float {
		if (pos + 2 > h.size())
		{
			return 0.0f;
		}
		return static_cast<float>(std::strtol(h.substr(pos, 2).c_str(), nullptr, 16)) / 255.0f;
	};
	r = hex2(0);
	g = hex2(2);
	b = hex2(4);
}

std::string to_html_rgb(float r, float g, float b)
{
	auto comp = [](float v) {
		int iv = static_cast<int>(std::round(v * 255.0f));
		return std::clamp(iv, 0, 255);
	};
	return format("%02x%02x%02x", comp(r), comp(g), comp(b));
}

/** Primera letra en mayúscula (ASCII y letras latinas acentuadas en UTF-8). */
std::string capitalize_first(const std::string& s)
{
	if (s.empty())
	{
		return s;
	}
	std::string out = s;
	const unsigned char c0 = static_cast<unsigned char>(out[0]);
	if (c0 >= 'a' && c0 <= 'z')
	{
		out[0] = static_cast<char>(c0 - 'a' + 'A');
	}
	else if (c0 == 0xC3 && out.size() > 1)
	{
		const unsigned char c1 = static_cast<unsigned char>(out[1]);
		if (c1 >= 0xA0 && c1 <= 0xBE && c1 != 0xB7)
		{
			out[1] = static_cast<char>(c1 - 0x20);
		}
	}
	return out;
}

} // namespace sheet_detail

int CharacterSheet::point_buy_cost(int score)
{
	switch (score)
	{
	case 8: return 0;
	case 9: return 1;
	case 10: return 2;
	case 11: return 3;
	case 12: return 4;
	case 13: return 5;
	case 14: return 7;
	case 15: return 9;
	default: return 99;
	}
}

// ================================================================== utilidades

const Json& CharacterSheet::class_data(const Json& s)
{
	return jobj(RulesDB::classes, jstr(s, "class", "fighter"));
}

const Json& CharacterSheet::species_data(const Json& s)
{
	return jobj(RulesDB::species, jstr(s, "species", "human"));
}

const Json& CharacterSheet::lineage_data(const Json& s)
{
	return jobj(jobj(species_data(s), "lineages"), jstr(s, "lineage", ""));
}

const Json& CharacterSheet::ancestry_data(const Json& s)
{
	return jobj(jobj(species_data(s), "ancestries"), jstr(s, "ancestry", ""));
}

std::string CharacterSheet::casting_ability(const Json& s)
{
	return jstr(jobj(class_data(s), "casting"), "ability", "");
}

StrList CharacterSheet::origin_feats()
{
	StrList out;
	for (auto it = RulesDB::feats.begin(); it != RulesDB::feats.end(); ++it)
	{
		if (jstr(it.value(), "category", "") == "origin")
		{
			out.push_back(it.key());
		}
	}
	return out;
}

StrList CharacterSheet::fighting_styles_for(const std::string& cls)
{
	StrList out;
	for (auto it = RulesDB::feats.begin(); it != RulesDB::feats.end(); ++it)
	{
		const Json& f = it.value();
		if (jstr(f, "category", "") != "fighting_style")
		{
			continue;
		}
		const Json& only = jarr(f, "only");
		if (only.empty() || jin(only, cls))
		{
			out.push_back(it.key());
		}
	}
	return out;
}

int CharacterSheet::fighting_style_level(const std::string& cls)
{
	return jint(jobj(RulesDB::classes, cls), "fighting_style_level", 99);
}

// ================================================================== características

Dict<int> CharacterSheet::final_abilities(const Json& s)
{
	if (!s.contains("base_abilities") && s.contains("abilities"))
	{
		Dict<int> out;
		const Json& ab = jobj(s, "abilities");
		for (const std::string& a : kAbilities)
		{
			out[a] = jint(ab, a, 10);
		}
		return out;
	}
	const Json& base = s.contains("base_abilities") ? jobj(s, "base_abilities") : jobj(class_data(s), "std_array");
	Dict<int> res;
	for (const std::string& a : kAbilities)
	{
		res[a] = jint(base, a, 10);
	}
	const Json& bonus = jobj(s, "bg_bonus");
	for (auto it = bonus.begin(); it != bonus.end(); ++it)
	{
		res[it.key()] = res.get(it.key(), 10) + jto_int(it.value());
	}
	for (const std::string& a : kAbilities)
	{
		res[a] = std::min(20, res.get(a, 10));
	}
	return res;
}

int CharacterSheet::point_buy_spent(const Json& base)
{
	int total = 0;
	for (const std::string& a : kAbilities)
	{
		total += point_buy_cost(jint(base, a, 8));
	}
	return total;
}

Json CharacterSheet::default_bg_bonus(const Json& s)
{
	const Json& bg = jobj(RulesDB::backgrounds, jstr(s, "background", ""));
	const StrList allowed = bg.contains("abilities") ? jstrs(bg, "abilities") : StrList{"str", "dex", "con"};
	const StrList prim = jstrs(class_data(s), "primary");
	StrList order;
	for (const std::string& a : prim)
	{
		if (contains(allowed, a) && !contains(order, a))
		{
			order.push_back(a);
		}
	}
	const Json& base = s.contains("base_abilities") ? jobj(s, "base_abilities") : jobj(class_data(s), "std_array");
	StrList rest = filter(allowed, [&order](const std::string& a) { return !contains(order, a); });
	// El +1 rinde más sobre una puntuación impar (13 -> 14 sube el modificador)
	std::stable_sort(rest.begin(), rest.end(), [&base](const std::string& x, const std::string& y) {
		const bool ox = jint(base, x, 10) % 2 == 1;
		const bool oy = jint(base, y, 10) % 2 == 1;
		if (ox != oy)
		{
			return ox;
		}
		return jint(base, x, 10) > jint(base, y, 10);
	});
	order.insert(order.end(), rest.begin(), rest.end());
	Json out = Json::object();
	if (order.size() >= 1)
	{
		out[order[0]] = 2;
	}
	if (order.size() >= 2)
	{
		out[order[1]] = 1;
	}
	return out;
}

// ================================================================== habilidades

CharacterSheet::SkillSlots CharacterSheet::skill_slots(const Json& s, int level)
{
	const Json& cd = class_data(s);
	SkillSlots out;
	out.cls = jint(jobj(cd, "skills"), "choose", 2);
	const Json& spd = species_data(s);
	out.species += jint(spd, "skill_choices", 0);
	if (spd.contains("keen_senses"))
	{
		out.species += 1;
	}
	for (const std::string& f : all_feats(s, level))
	{
		if (f == "skilled")
		{
			out.feats += 3;
		}
	}
	const Json& scd = jobj(jobj(cd, "subclasses"), jstr(s, "subclass", ""));
	if (level >= 3)
	{
		out.class_bonus += RulesDB::at_level_int(jobj(scd, "bonus_skills"), level, 0);
		if (jstr(s, "class", "") == "barbarian")
		{
			out.class_bonus += 1; // Conocimiento primordial
		}
	}
	return out;
}

StrList CharacterSheet::fixed_skills(const Json& s)
{
	StrList out;
	const Json& bg = jobj(RulesDB::backgrounds, jstr(s, "background", ""));
	for (const std::string& k : concat(jstrs(bg, "skills"), jstrs(species_data(s), "skills")))
	{
		add_unique(out, k);
	}
	return out;
}

int CharacterSheet::overlapping_fixed(const Json& s)
{
	const Json& bg = jobj(RulesDB::backgrounds, jstr(s, "background", ""));
	int n = 0;
	for (const std::string& k : jstrs(species_data(s), "skills"))
	{
		if (jin(jarr(bg, "skills"), k))
		{
			n += 1;
		}
	}
	return n;
}

int CharacterSheet::required_skills(const Json& s, int level)
{
	const SkillSlots slots = skill_slots(s, level);
	const Json& bg = jobj(RulesDB::backgrounds, jstr(s, "background", ""));
	const int fixed = static_cast<int>(jarr(bg, "skills").size() + jarr(species_data(s), "skills").size());
	return fixed + slots.cls + slots.species + slots.feats + slots.class_bonus;
}

int CharacterSheet::expertise_count(const Json& s, int level)
{
	const Json& table = jobj(class_data(s), "expertise_count");
	int n = 0;
	for (int l = 1; l <= level; ++l)
	{
		n += jint(table, std::to_string(l), 0);
	}
	return n;
}

StrList CharacterSheet::expertise_list(const Json& s, int level)
{
	const Json& e = jat(s, "expertise");
	if (e.is_null() || e.is_array())
	{
		return jstr_list(e);
	}
	StrList out;
	for (int l = 1; l <= level; ++l)
	{
		for (const std::string& sk : jstrs(e, std::to_string(l)))
		{
			add_unique(out, sk);
		}
	}
	return out;
}

// ================================================================== dotes

StrList CharacterSheet::all_feats(const Json& s, int level)
{
	StrList out;
	for (const std::string& f : jstrs(s, "feats"))
	{
		std::string fid = f;
		if (starts_with(fid, "magic_initiate"))
		{
			fid = "magic_initiate";
		}
		if (!contains(out, fid) || jbool(jobj(RulesDB::feats, fid), "repeatable", false))
		{
			out.push_back(fid);
		}
	}
	if (level >= 2 && contains(invocations_at(s, level), std::string("lessons_of_the_first_ones")) && s.contains("lessons_feat"))
	{
		out.push_back(jstr(s, "lessons_feat"));
	}
	return out;
}

StrList CharacterSheet::invocations_at(const Json& s, int level)
{
	const Json& inv = jat(s, "invocations");
	if (inv.is_array())
	{
		return jstr_list(inv);
	}
	const Json v = RulesDB::at_level(inv.is_null() ? jempty_object() : inv, level, Json::array());
	return v.is_array() ? jstr_list(v) : StrList();
}

// ================================================================== completar

Json CharacterSheet::complete(const Json& sheet, int level_in)
{
	Json s = sheet.is_object() ? sheet : Json::object();
	const int level = std::clamp(level_in, 1, kMaxLevel);
	if (!RulesDB::classes.contains(jstr(s, "class", "")))
	{
		s["class"] = "fighter";
	}
	const std::string cls = jstr(s, "class");
	const Json& cd = class_data(s);
	if (!RulesDB::species.contains(jstr(s, "species", "")))
	{
		s["species"] = "human";
	}
	const Json& spd = species_data(s);
	// Linaje / ascendencia / tamaño
	if (spd.contains("lineages") && !jobj(spd, "lineages").contains(jstr(s, "lineage", "")))
	{
		const StrList keys = jkeys(jobj(spd, "lineages"));
		if (!keys.empty())
		{
			s["lineage"] = keys[0];
		}
	}
	if (spd.contains("ancestries") && !jobj(spd, "ancestries").contains(jstr(s, "ancestry", "")))
	{
		const StrList keys = jkeys(jobj(spd, "ancestries"));
		if (!keys.empty())
		{
			s["ancestry"] = keys[0];
		}
	}
	if (jbool(spd, "lineage_ability", false) && !contains(sheet_detail::kMentalAbilities, jstr(s, "lineage_ability", "")))
	{
		const std::string ca = casting_ability(s);
		s["lineage_ability"] = contains(sheet_detail::kMentalAbilities, ca) ? ca : best_mental(s);
	}
	const StrList sizes = spd.contains("sizes") ? jstrs(spd, "sizes") : StrList{"medium"};
	if (!contains(sizes, jstr(s, "size", "")) && !sizes.empty())
	{
		s["size"] = sizes[0];
	}
	// Subclase
	if (level >= 3 && !jobj(cd, "subclasses").contains(jstr(s, "subclass", "")))
	{
		const StrList keys = jkeys(jobj(cd, "subclasses"));
		if (!keys.empty())
		{
			s["subclass"] = keys[0];
		}
	}
	// Trasfondo
	if (!RulesDB::backgrounds.contains(jstr(s, "background", "")))
	{
		s["background"] = sheet_detail::default_background(cls);
	}
	const Json& bg = jobj(RulesDB::backgrounds, jstr(s, "background"));
	// Características
	if (!s.contains("abilities") || s.contains("base_abilities"))
	{
		if (!s.contains("base_abilities"))
		{
			s["base_abilities"] = jobj(cd, "std_array");
		}
		if (!s.contains("bg_bonus") || !valid_bg_bonus(s["bg_bonus"], bg))
		{
			s["bg_bonus"] = default_bg_bonus(s);
		}
	}
	// Dotes de origen
	StrList feats = jstrs(s, "feats");
	const std::string bg_feat = jstr(bg, "feat", "");
	if (!contains(feats, bg_feat) && !(bg_feat == "magic_initiate" && has_prefix(feats, "magic_initiate")))
	{
		feats.insert(feats.begin(), bg_feat);
	}
	if (jbool(spd, "extra_origin_feat", false) && origin_feat_count(feats) < 2)
	{
		feats.push_back(!contains(feats, std::string("skilled")) ? "skilled" : "alert");
	}
	s["feats"] = to_json(feats);
	// Estilo de combate
	if (level >= fighting_style_level(cls))
	{
		if (!contains(fighting_styles_for(cls), jstr(s, "fighting_style", "")))
		{
			s["fighting_style"] = default_style(s);
		}
	}
	else
	{
		s.erase("fighting_style");
	}
	// Órdenes
	if (cls == "cleric")
	{
		const std::string o = jstr(s, "divine_order", "");
		if (o != "protector" && o != "thaumaturge")
		{
			s["divine_order"] = "protector";
		}
	}
	if (cls == "druid")
	{
		const std::string o = jstr(s, "primal_order", "");
		if (o != "warden" && o != "magician")
		{
			s["primal_order"] = "magician";
		}
	}
	// Equipo
	complete_equipment(s);
	// Maestrías
	const int mcount = RulesDB::at_level_int(jobj(cd, "mastery_count"), level, 0);
	if (mcount > 0)
	{
		StrList ms = filter(jstrs(s, "masteries"), [&cd](const std::string& w) { return RulesDB::weapons.contains(w) && mastery_ok(cd, w); });
		for (const std::string& w : mastery_candidates(s, cd))
		{
			if (static_cast<int>(ms.size()) >= mcount)
			{
				break;
			}
			add_unique(ms, w);
		}
		s["masteries"] = to_json(head(ms, static_cast<size_t>(mcount)));
	}
	// Habilidades
	complete_skills(s, level);
	// Pericia
	const int ecount = expertise_count(s, level);
	if (ecount > 0)
	{
		const StrList skills = jstrs(s, "skills");
		StrList ex = filter(expertise_list(s, level), [&skills](const std::string& k) { return contains(skills, k); });
		StrList prefs = {"stealth", "sleight_of_hand", "perception", "persuasion", "performance", "athletics", "arcana", "investigation"};
		if (cls == "wizard")
		{
			prefs = cd.contains("expertise_from") ? jstrs(cd, "expertise_from") : StrList{"arcana"};
		}
		for (const std::string& k : concat(prefs, skills))
		{
			if (static_cast<int>(ex.size()) >= ecount)
			{
				break;
			}
			if (contains(skills, k) && !contains(ex, k))
			{
				ex.push_back(k);
			}
		}
		s["expertise"] = to_json(head(ex, static_cast<size_t>(ecount)));
	}
	// Conjuros
	complete_spells(s, level);
	if (has_prefix(feats, "magic_initiate"))
	{
		s["magic_initiate"] = complete_magic_initiate(s, bg);
	}
	// Rasgos con elección
	if (cls == "druid")
	{
		const Json& allowed = jarr(cd, "wild_shape_forms");
		StrList forms = filter(jstrs(s, "wild_shapes"), [&allowed](const std::string& f) { return jin(allowed, f); });
		for (const std::string& f : jstr_list(allowed))
		{
			if (static_cast<int>(forms.size()) >= jint(cd, "wild_shape_known", 4))
			{
				break;
			}
			add_unique(forms, f);
		}
		s["wild_shapes"] = to_json(forms);
		if (!jobj(RulesDB::features, "lands").contains(jstr(s, "land", "")))
		{
			s["land"] = "temperate";
		}
	}
	if (cls == "ranger")
	{
		const std::string hp = jstr(s, "hunters_prey", "");
		if (hp != "colossus_slayer" && hp != "horde_breaker")
		{
			s["hunters_prey"] = "colossus_slayer";
		}
	}
	if (cls == "sorcerer" && level >= 2)
	{
		const Json& opts = jobj(RulesDB::features, "metamagic_options");
		StrList mm = filter(jstrs(s, "metamagic"), [&opts](const std::string& m) { return opts.contains(m); });
		for (const char* m : {"quickened", "empowered", "careful", "heightened"})
		{
			if (mm.size() >= 2)
			{
				break;
			}
			add_unique(mm, std::string(m));
		}
		s["metamagic"] = to_json(head(mm, 2));
	}
	if (cls == "warlock")
	{
		complete_invocations(s, level);
	}
	// Identidad y aspecto
	if (trim(jstr(s, "name", "")).empty())
	{
		s["name"] = "Sin nombre";
	}
	if (!s.contains("pronoun"))
	{
		s["pronoun"] = "m";
	}
	if (!s.contains("ai"))
	{
		s["ai"] = jstr(cd, "ai", "frontline");
	}
	Json vis = jobj(s, "visual");
	if (!vis.contains("model"))
	{
		vis["model"] = jstr(jobj(cd, "visual"), "model", "knight");
	}
	s["visual"] = vis;
	return s;
}

std::string CharacterSheet::best_mental(const Json& s)
{
	const Dict<int> ab = (s.contains("abilities") || s.contains("base_abilities")) ? final_abilities(s)
																					 : jint_dict(jobj(class_data(s), "std_array"));
	std::string best = "wis";
	for (const std::string& a : sheet_detail::kMentalAbilities)
	{
		if (ab.get(a, 10) > ab.get(best, 10))
		{
			best = a;
		}
	}
	return best;
}

bool CharacterSheet::valid_bg_bonus(const Json& b, const Json& bg)
{
	if (!b.is_object())
	{
		return false;
	}
	const Json& allowed = jarr(bg, "abilities");
	int total = 0;
	for (auto it = b.begin(); it != b.end(); ++it)
	{
		if (!jin(allowed, it.key()))
		{
			return false;
		}
		const int v = jto_int(it.value());
		if (v < 1 || v > 2)
		{
			return false;
		}
		total += v;
	}
	return total == 3 && (b.size() == 2 || b.size() == 3);
}

bool CharacterSheet::has_prefix(const StrList& arr, const std::string& prefix)
{
	for (const std::string& x : arr)
	{
		if (starts_with(x, prefix))
		{
			return true;
		}
	}
	return false;
}

int CharacterSheet::origin_feat_count(const StrList& feats)
{
	int n = 0;
	for (const std::string& f : feats)
	{
		const std::string fid = starts_with(f, "magic_initiate") ? std::string("magic_initiate") : f;
		if (jstr(jobj(RulesDB::feats, fid), "category", "") == "origin")
		{
			n += 1;
		}
	}
	return n;
}

Json CharacterSheet::complete_magic_initiate(const Json& s, const Json& bg)
{
	Json mi = jobj(s, "magic_initiate");
	std::string lst = jstr(mi, "list", jstr(bg, "feat_list", "wizard"));
	if (lst != "cleric" && lst != "druid" && lst != "wizard")
	{
		lst = "wizard";
	}
	mi["list"] = lst;
	if (!contains(sheet_detail::kMentalAbilities, jstr(mi, "ability", "")))
	{
		mi["ability"] = lst == "wizard" ? "int" : "wis";
		const std::string ca = casting_ability(s);
		if (contains(sheet_detail::kMentalAbilities, ca))
		{
			mi["ability"] = ca;
		}
	}
	const StrList lst0 = RulesDB::class_spell_list(lst, 0);
	StrList cantrips = filter(jstrs(mi, "cantrips"),
		[&lst0](const std::string& x) { return sheet_detail::spell_level_or(x, -1) == 0 && contains(lst0, x); });
	const Json& rec = jobj(jobj(jobj(RulesDB::classes, lst), "casting"), "recommended");
	const StrList known = jstrs(s, "cantrips");
	for (const std::string& x : concat(jstrs(rec, "cantrips"), RulesDB::class_spell_list(lst, 0, false)))
	{
		if (cantrips.size() >= 2)
		{
			break;
		}
		if (!contains(cantrips, x) && !contains(known, x) && sheet_detail::spell_level_or(x, 0) == 0)
		{
			cantrips.push_back(x);
		}
	}
	mi["cantrips"] = to_json(head(cantrips, 2));
	std::string spell = jstr(mi, "spell", "");
	if (sheet_detail::spell_level_or(spell, 0) != 1 || !contains(RulesDB::class_spell_list(lst, 1), spell))
	{
		if (lst == "cleric")
		{
			spell = "healing_word";
		}
		else if (lst == "druid")
		{
			spell = "entangle";
		}
		else if (lst == "wizard")
		{
			spell = "shield";
		}
		else
		{
			spell = "";
		}
	}
	mi["spell"] = spell;
	return mi;
}

std::string CharacterSheet::default_style(const Json& s)
{
	const std::string cls = jstr(s, "class");
	const StrList weapons = jstrs(s, "weapons");
	for (const std::string& w : weapons)
	{
		const Json& wd = jobj(RulesDB::weapons, w);
		if (jstr(wd, "kind", "") == "ranged" && jstr(wd, "cat", "") == "martial")
		{
			return "archery";
		}
	}
	for (const std::string& w : weapons)
	{
		const Json& wd = jobj(RulesDB::weapons, w);
		if (jin(jarr(wd, "props"), "two_handed") && jstr(wd, "kind", "") == "melee")
		{
			return "great_weapon_fighting";
		}
	}
	if (cls == "ranger")
	{
		return "archery";
	}
	return "defense";
}

Json CharacterSheet::kit_for(const Json& s)
{
	const Json& kits = jarr(class_data(s), "kits");
	for (const Json& k : kits)
	{
		if (jstr(k, "id") == jstr(s, "kit", ""))
		{
			return k;
		}
	}
	// Primero el kit propio de la orden elegida (Protector, Guardián), si existe
	for (const Json& k : kits)
	{
		const std::string req = jstr(k, "requires", "");
		if (!req.empty() && (req == jstr(s, "divine_order", "") || req == jstr(s, "primal_order", "")))
		{
			return k;
		}
	}
	for (const Json& k : kits)
	{
		if (jstr(k, "requires", "").empty())
		{
			return k;
		}
	}
	return Json::object();
}

void CharacterSheet::complete_equipment(Json& s)
{
	if (s.contains("weapons") && s.contains("armor"))
	{
		return;
	}
	const Json k = kit_for(s);
	if (k.empty())
	{
		return;
	}
	s["kit"] = jat(k, "id");
	s["armor"] = jstr(k, "armor", "");
	s["shield"] = jbool(k, "shield", false);
	s["weapons"] = jarr(k, "weapons");
	s["ammo"] = jobj(k, "ammo");
	Json kit_items = jobj(s, "items");
	const Json& kit_extra = jobj(k, "items");
	for (auto it = kit_extra.begin(); it != kit_extra.end(); ++it)
	{
		kit_items[it.key()] = jint(kit_items, it.key(), 0) + jto_int(it.value());
	}
	if (!kit_items.contains("potion_healing"))
	{
		kit_items["potion_healing"] = 1;
	}
	s["items"] = kit_items;
	const Json& bg = jobj(RulesDB::backgrounds, jstr(s, "background", ""));
	s["gold"] = jint(k, "gold", 0) + jint(bg, "gold", 0);
}

bool CharacterSheet::mastery_ok(const Json& cd, const std::string& wid)
{
	const Json& w = jobj(RulesDB::weapons, wid);
	if (jstr(w, "mastery", "").empty())
	{
		return false;
	}
	if (jbool(cd, "mastery_melee_only", false) && jstr(w, "kind", "") != "melee")
	{
		return false;
	}
	return true;
}

StrList CharacterSheet::mastery_candidates(const Json& s, const Json& cd)
{
	StrList out;
	for (const std::string& w : jstrs(s, "weapons"))
	{
		if (mastery_ok(cd, w) && !contains(out, w))
		{
			out.push_back(w);
		}
	}
	for (const char* w : {"longsword", "greataxe", "shortsword", "handaxe", "javelin", "longbow", "shortbow", "rapier", "scimitar", "spear"})
	{
		if (mastery_ok(cd, w) && !contains(out, std::string(w)))
		{
			out.push_back(w);
		}
	}
	return out;
}

void CharacterSheet::complete_skills(Json& s, int level)
{
	StrList skills = fixed_skills(s);
	for (const std::string& k : jstrs(s, "skills"))
	{
		if (contains(kSkills, k) && !contains(skills, k))
		{
			skills.push_back(k);
		}
	}
	const int need = required_skills(s, level);
	const Json& spd = species_data(s);
	// Sentidos agudos: una de su lista que no venga ya del trasfondo
	if (spd.contains("keen_senses"))
	{
		const Json& bg_skills = jarr(jobj(RulesDB::backgrounds, jstr(s, "background", "")), "skills");
		bool has_keen = false;
		for (const std::string& k : jstrs(spd, "keen_senses"))
		{
			if (contains(skills, k) && !jin(bg_skills, k))
			{
				has_keen = true;
			}
		}
		if (!has_keen)
		{
			for (const std::string& k : jstrs(spd, "keen_senses"))
			{
				if (!contains(skills, k))
				{
					skills.push_back(k);
					break;
				}
			}
		}
	}
	const Json& cd = class_data(s);
	const Json& skills_def = jobj(cd, "skills");
	const StrList class_from = skills_def.contains("from") ? jstrs(skills_def, "from") : kSkills;
	for (const std::string& k : concat(concat(sheet_detail::skill_prefs(jstr(s, "class")), class_from), kSkills))
	{
		if (static_cast<int>(skills.size()) >= need)
		{
			break;
		}
		add_unique(skills, k);
	}
	s["skills"] = to_json(skills);
}

void CharacterSheet::complete_spells(Json& s, int level)
{
	const Json& cd = class_data(s);
	const Json& cast = jobj(cd, "casting");
	if (cast.empty())
	{
		s.erase("cantrips");
		s.erase("prepared");
		return;
	}
	const Json& rec = jobj(cast, "recommended");
	const StrList lst = jstrs(cast, "list");
	// Trucos
	int ncan = RulesDB::at_level_int(jobj(cast, "cantrips"), level, 0);
	if (jstr(s, "divine_order", "") == "thaumaturge" || jstr(s, "primal_order", "") == "magician")
	{
		ncan += 1;
	}
	StrList cantrips =
		filter(jstrs(s, "cantrips"), [&lst](const std::string& x) { return contains(lst, x) && sheet_detail::spell_level_or(x, -1) == 0; });
	for (const std::string& x : concat(jstrs(rec, "cantrips"), lst))
	{
		if (static_cast<int>(cantrips.size()) >= ncan)
		{
			break;
		}
		if (!contains(cantrips, x) && sheet_detail::spell_level_or(x, -1) == 0 && !sheet_detail::spell_utility(x))
		{
			cantrips.push_back(x);
		}
	}
	s["cantrips"] = to_json(head(cantrips, static_cast<size_t>(std::max(0, ncan))));
	// Preparados por nivel
	Json prep = jat(s, "prepared");
	if (prep.is_array())
	{
		Json wrapped = Json::object();
		wrapped["1"] = prep;
		prep = wrapped;
	}
	else if (!prep.is_object())
	{
		prep = Json::object();
	}
	Json out = Json::object();
	StrList prev;
	for (int l = 1; l <= level; ++l)
	{
		const int n = RulesDB::at_level_int(jobj(cast, "prepared"), l, 0);
		const int max_lvl = max_spell_level(s, l);
		const StrList always_l = always_prepared(s, l);
		StrList cur = prep.contains(std::to_string(l)) ? jstrs(prep, std::to_string(l)) : prev;
		cur = filter(cur, [&lst, max_lvl, &always_l](const std::string& x) {
			const int sl = sheet_detail::spell_level_or(x, 0);
			return contains(lst, x) && sl >= 1 && sl <= max_lvl && !contains(always_l, x);
		});
		StrList order;
		for (int k = 1; k <= 3; ++k)
		{
			if (k <= l)
			{
				const StrList r = jstrs(rec, std::to_string(k));
				order.insert(order.end(), r.begin(), r.end());
			}
		}
		for (const std::string& x : concat(order, lst))
		{
			if (static_cast<int>(cur.size()) >= n)
			{
				break;
			}
			const int sl = sheet_detail::spell_level_or(x, 0);
			if (sl >= 1 && sl <= max_lvl && !contains(cur, x) && !contains(always_l, x) && !sheet_detail::spell_utility(x))
			{
				cur.push_back(x);
			}
		}
		prev = head(cur, static_cast<size_t>(std::max(0, n)));
		out[std::to_string(l)] = to_json(prev);
	}
	s["prepared"] = out;
}

int CharacterSheet::max_spell_level(const Json& s, int level)
{
	const std::string t = jstr(jobj(class_data(s), "casting"), "type", "");
	return static_cast<int>(RulesDB::slots_for(t, level).size());
}

StrList CharacterSheet::always_prepared(const Json& s, int level)
{
	const Json& cd = class_data(s);
	StrList out;
	const Json& cast_always = jobj(jobj(cd, "casting"), "always");
	for (int l = 1; l <= level; ++l)
	{
		for (const std::string& x : jstrs(cast_always, std::to_string(l)))
		{
			add_unique(out, x);
		}
	}
	const Json& scd = jobj(jobj(cd, "subclasses"), jstr(s, "subclass", ""));
	if (level >= 3)
	{
		const Json& sub_always = jobj(scd, "always_prepared");
		for (int l2 = 1; l2 <= level; ++l2)
		{
			for (const std::string& x : jstrs(sub_always, std::to_string(l2)))
			{
				add_unique(out, x);
			}
		}
		if (jstr(s, "class", "") == "druid")
		{
			const Json& land = jobj(jobj(RulesDB::features, "lands"), jstr(s, "land", "temperate"));
			for (const std::string& x : jstrs(land, "spells"))
			{
				add_unique(out, x);
			}
		}
	}
	return out;
}

void CharacterSheet::complete_invocations(Json& s, int level)
{
	const Json& cd = class_data(s);
	const Json& catalog = jobj(RulesDB::features, "invocations");
	Json inv = jat(s, "invocations");
	if (inv.is_array())
	{
		Json wrapped = Json::object();
		wrapped["1"] = inv;
		inv = wrapped;
	}
	else if (!inv.is_object())
	{
		inv = Json::object();
	}
	auto usable = [&s, &catalog](const std::string& i, int l) {
		return catalog.contains(i) && jint(catalog[i], "level", 1) <= l && inv_req_ok(s, catalog[i]);
	};
	Json out = Json::object();
	StrList prev;
	for (int l = 1; l <= level; ++l)
	{
		const int n = RulesDB::at_level_int(jobj(cd, "invocation_count"), l, 0);
		StrList cur = inv.contains(std::to_string(l)) ? jstrs(inv, std::to_string(l)) : prev;
		cur = filter(cur, [&usable, l](const std::string& i) { return usable(i, l); });
		for (const std::string& i : concat(sheet_detail::default_invocations(std::min(l, 2)), jkeys(catalog)))
		{
			if (static_cast<int>(cur.size()) >= n)
			{
				break;
			}
			if (!contains(cur, i) && usable(i, l))
			{
				cur.push_back(i);
			}
		}
		prev = head(cur, static_cast<size_t>(std::max(0, n)));
		out[std::to_string(l)] = to_json(prev);
	}
	s["invocations"] = out;
	const StrList cur_inv = jstrs(out, std::to_string(level));
	if (contains(cur_inv, std::string("pact_of_the_tome")))
	{
		StrList tome = filter(jstrs(s, "tome_cantrips"), [](const std::string& x) { return sheet_detail::spell_level_or(x, -1) == 0; });
		const StrList known = jstrs(s, "cantrips");
		for (const char* x : {"guidance", "sacred_flame", "fire_bolt", "toll_the_dead", "starry_wisp"})
		{
			if (tome.size() >= 3)
			{
				break;
			}
			if (!contains(tome, std::string(x)) && !contains(known, std::string(x)))
			{
				tome.push_back(x);
			}
		}
		s["tome_cantrips"] = to_json(head(tome, 3));
	}
	if (contains(cur_inv, std::string("pact_of_the_blade")))
	{
		const StrList weapons = jstrs(s, "weapons");
		if (!contains(weapons, jstr(s, "pact_weapon", "")))
		{
			for (const std::string& w : weapons)
			{
				if (jstr(jobj(RulesDB::weapons, w), "kind", "") == "melee")
				{
					s["pact_weapon"] = w;
					break;
				}
			}
		}
	}
	if (contains(cur_inv, std::string("lessons_of_the_first_ones")) && !contains(origin_feats(), jstr(s, "lessons_feat", "")))
	{
		s["lessons_feat"] = !contains(jstrs(s, "feats"), std::string("alert")) ? "alert" : "savage_attacker";
	}
}

bool CharacterSheet::inv_req_ok(const Json& s, const Json& inv)
{
	const std::string req = jstr(inv, "requires", "");
	if (req.empty())
	{
		return true;
	}
	return jin(jarr(s, "cantrips"), req);
}

Json CharacterSheet::visual_for(const Json& sheet)
{
	Json v = jobj(sheet, "visual");
	const Json& cd = jobj(RulesDB::classes, jstr(sheet, "class", "fighter"));
	if (!v.contains("model"))
	{
		v["model"] = jstr(jobj(cd, "visual"), "model", "knight");
	}
	if (!v.contains("head"))
	{
		v["head"] = v["model"];
	}
	v["hero"] = true;
	v["species"] = jstr(sheet, "species", "human");
	v["lineage"] = jstr(sheet, "lineage", "");
	v["ancestry"] = jstr(sheet, "ancestry", "");
	v["size"] = jstr(sheet, "size", "medium");
	v["weapons_list"] = jarr(sheet, "weapons");
	v["shield_on"] = jbool(sheet, "shield", false);
	v["class"] = jstr(sheet, "class", "");
	const Json& sp = jobj(RulesDB::species, jstr(v, "species"));
	if (jstr(v, "species") == "dragonborn")
	{
		// Escamas del color del linaje; el "pelo" del modelo se lee como cresta
		const Json& anc = jobj(jobj(sp, "ancestries"), jstr(v, "ancestry"));
		if (!v.contains("skin") || jstr(v, "skin", "").empty())
		{
			v["skin"] = jstr(anc, "color", "#b33a2c");
		}
		float r = 0.0f;
		float g = 0.0f;
		float b = 0.0f;
		sheet_detail::parse_html_color(jstr(v, "skin"), r, g, b);
		const float k = 1.0f - 0.45f;
		v["hair"] = sheet_detail::to_html_rgb(r * k, g * k, b * k);
		v["hat"] = false;
	}
	else
	{
		if (!v.contains("skin") || jstr(v, "skin", "").empty())
		{
			const Json& skins = jarr(jobj(sp, "visual"), "skins");
			if (!skins.empty())
			{
				v["skin"] = skins[0];
			}
		}
		// Siempre un color de pelo: así la barba y las cejas casan con el peinado
		if (!v.contains("hair") || jstr(v, "hair", "").empty())
		{
			v["hair"] = "#3b2a1e";
		}
	}
	if (!v.contains("cloth") || jstr(v, "cloth", "").empty())
	{
		v["cloth"] = "#3f5f9a";
	}
	return v;
}

// ================================================================== nombres

std::string CharacterSheet::random_name(const std::string& species, const std::string& pronoun, Pcg32* rng)
{
	Pcg32 local;
	if (rng == nullptr)
	{
		local.randomize();
		rng = &local;
	}
	const Json& nd = RulesDB::names.contains(species) ? RulesDB::names[species] : jobj(RulesDB::names, "human");
	auto pick = [rng](const StrList& arr) -> std::string {
		if (arr.empty())
		{
			return "";
		}
		return arr[rng->rand() % static_cast<uint32_t>(arr.size())];
	};
	// Herencia mixta: nombre de un pueblo y apellido del otro
	if (nd.contains("mix"))
	{
		const StrList srcs = jstrs(nd, "mix");
		const std::string first_src = pick(srcs);
		const std::string other = first_src != srcs[0] ? srcs[0] : srcs[srcs.size() - 1];
		const std::string full = random_name(first_src, pronoun, rng);
		const std::string fn = full.substr(0, full.find(' '));
		const StrList fam = jstrs(jobj(RulesDB::names, other), "family");
		return fam.empty() ? fn : fn + " " + pick(fam);
	}
	const StrList starts = nd.contains("start") ? jstrs(nd, "start") : StrList{"Al"};
	StrList ends;
	const StrList end_m = nd.contains("end_m") ? jstrs(nd, "end_m") : StrList{"an"};
	const StrList end_f = nd.contains("end_f") ? jstrs(nd, "end_f") : StrList{"a"};
	if (pronoun == "f")
	{
		ends = end_f;
	}
	else if (pronoun == "m")
	{
		ends = end_m;
	}
	else
	{
		ends = concat(end_m, end_f);
	}
	// Los tieflings a veces adoptan un nombre de virtud
	if (nd.contains("virtue") && rng->randf() < 0.3f)
	{
		return pick(jstrs(nd, "virtue"));
	}
	const std::string start = pick(starts);
	const std::string end = pick(ends);
	const std::string first = sheet_detail::capitalize_first(start + end);
	const StrList family = jstrs(nd, "family");
	if (family.empty())
	{
		return first;
	}
	return first + " " + pick(family);
}

// ================================================================== resumen

StrList CharacterSheet::features_gained(const Json& s, int level)
{
	const Json& cd = class_data(s);
	StrList out;
	for (const std::string& f : jstrs(jobj(cd, "features"), std::to_string(level)))
	{
		if (f == "subclass")
		{
			const Json& scd = jobj(jobj(cd, "subclasses"), jstr(s, "subclass", ""));
			for (const std::string& sf : jstrs(jobj(scd, "features"), std::to_string(level)))
			{
				out.push_back(sf);
			}
		}
		else
		{
			out.push_back(f);
		}
	}
	return out;
}

StrList CharacterSheet::class_features_up_to(const Json& s, int level)
{
	StrList out;
	for (int l = 1; l <= level; ++l)
	{
		for (const std::string& f : features_gained(s, l))
		{
			add_unique(out, f);
		}
	}
	return out;
}

int CharacterSheet::hp_at(const Json& s, int level)
{
	const Json& cd = class_data(s);
	const int hd = jint(cd, "hit_die", 8);
	const Dict<int> ab = final_abilities(s);
	const int con = mod(ab.get("con", 10));
	int hp = hd + con;
	for (int l = 2; l <= level; ++l)
	{
		hp += hd / 2 + 1 + con;
	}
	if (jstr(s, "species", "") == "dwarf")
	{
		hp += level;
	}
	if (jstr(s, "class", "") == "sorcerer" && jstr(s, "subclass", "") == "draconic" && level >= 3)
	{
		hp += 3 + (level - 3);
	}
	return std::max(1, hp);
}

StrList CharacterSheet::validate(const Json& s, int level)
{
	StrList errs;
	if (trim(jstr(s, "name", "")).empty())
	{
		errs.push_back("Falta el nombre.");
	}
	if (s.contains("base_abilities"))
	{
		const std::string method = jstr(s, "ability_method", "standard");
		const Json& base = jobj(s, "base_abilities");
		if (method == "point_buy" && point_buy_spent(base) > kPointBuyTotal)
		{
			errs.push_back("Has gastado más de 27 puntos.");
		}
		if (method == "standard")
		{
			std::vector<int> vals;
			for (const std::string& a : kAbilities)
			{
				vals.push_back(jint(base, a, 0));
			}
			std::sort(vals.begin(), vals.end());
			std::vector<int> std_sorted = kStandardArray;
			std::sort(std_sorted.begin(), std_sorted.end());
			if (vals != std_sorted)
			{
				errs.push_back("Usa cada valor de la matriz estándar una vez.");
			}
		}
	}
	const Json full = complete(s, level);
	if (static_cast<int>(jarr(s, "skills").size()) < required_skills(full, level))
	{
		errs.push_back("Te quedan habilidades por elegir.");
	}
	return errs;
}

} // namespace mdg
