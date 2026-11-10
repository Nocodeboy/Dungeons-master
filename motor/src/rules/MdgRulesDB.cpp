#include "MdgRulesDB.h"

#include <filesystem>
#include <fstream>
#include <sstream>
#include <unordered_map>

namespace mdg
{

Json RulesDB::weapons = Json::object();
Json RulesDB::armor = Json::object();
Json RulesDB::spells = Json::object();
Json RulesDB::monsters = Json::object();
Json RulesDB::classes = Json::object();
Json RulesDB::species = Json::object();
Json RulesDB::backgrounds = Json::object();
Json RulesDB::feats = Json::object();
Json RulesDB::features = Json::object();
Json RulesDB::party = Json::object();
Json RulesDB::names = Json::object();
Json RulesDB::items = Json::object();
Json RulesDB::encounters = Json::object();
Json RulesDB::levels = Json::object();
Json RulesDB::merchants = Json::object();
Json RulesDB::world = Json::object();
Json RulesDB::slot_tables = Json::object();
bool RulesDB::loaded = false;
StrList RulesDB::errors;

// ------------------------------------------------------------------ FolderSource

bool FolderSource::read_text(const std::string& rel, std::string& out) const
{
	const std::filesystem::path p = std::filesystem::path(root_) / rel;
	std::ifstream f(p, std::ios::binary);
	if (!f)
	{
		return false;
	}
	std::ostringstream ss;
	ss << f.rdbuf();
	out = ss.str();
	return true;
}

StrList FolderSource::list_files(const std::string& rel_dir, const std::string& ext) const
{
	StrList out;
	const std::filesystem::path p = std::filesystem::path(root_) / rel_dir;
	std::error_code ec;
	if (!std::filesystem::is_directory(p, ec))
	{
		return out;
	}
	for (const auto& entry : std::filesystem::directory_iterator(p, ec))
	{
		if (!entry.is_regular_file())
		{
			continue;
		}
		const std::string name = entry.path().filename().string();
		if (ends_with(name, ext))
		{
			out.push_back(name);
		}
	}
	std::sort(out.begin(), out.end());
	return out;
}

// ------------------------------------------------------------------ carga

namespace rulesdb_detail
{

Json load_json(const DataSource& src, const std::string& rel)
{
	std::string text;
	if (!src.read_text(rel, text))
	{
		RulesDB::errors.push_back("No se pudo abrir " + rel);
		return Json::object();
	}
	// Quita la marca BOM de UTF-8 si la hay
	if (text.size() >= 3 && static_cast<unsigned char>(text[0]) == 0xEF && static_cast<unsigned char>(text[1]) == 0xBB &&
		static_cast<unsigned char>(text[2]) == 0xBF)
	{
		text.erase(0, 3);
	}
	Json parsed = Json::parse(text, nullptr, false);
	if (parsed.is_discarded() || !parsed.is_object())
	{
		RulesDB::errors.push_back("JSON inválido: " + rel);
		return Json::object();
	}
	return parsed;
}

void erase_private_keys(Json& d)
{
	if (!d.is_object())
	{
		return;
	}
	for (const std::string& k : jkeys(d))
	{
		if (starts_with(k, "_"))
		{
			d.erase(k);
		}
	}
}

std::string basename_no_ext(const std::string& f)
{
	const size_t dot = f.rfind('.');
	return dot == std::string::npos ? f : f.substr(0, dot);
}

} // namespace rulesdb_detail

bool RulesDB::load_all(const DataSource& src, bool force)
{
	if (loaded && !force)
	{
		return true;
	}
	errors.clear();
	weapons = rulesdb_detail::load_json(src, "weapons.json");
	armor = rulesdb_detail::load_json(src, "armor.json");
	spells = rulesdb_detail::load_json(src, "spells.json");
	monsters = rulesdb_detail::load_json(src, "monsters.json");
	classes = rulesdb_detail::load_json(src, "classes.json");
	species = rulesdb_detail::load_json(src, "species.json");
	backgrounds = rulesdb_detail::load_json(src, "backgrounds.json");
	feats = rulesdb_detail::load_json(src, "feats.json");
	features = rulesdb_detail::load_json(src, "features.json");
	party = rulesdb_detail::load_json(src, "party.json");
	names = rulesdb_detail::load_json(src, "names.json");
	items = rulesdb_detail::load_json(src, "items.json");
	slot_tables = jobj(classes, "_spell_slots");
	for (Json* d : {&weapons, &armor, &spells, &monsters, &classes, &party, &species, &backgrounds, &feats, &features, &names, &items})
	{
		rulesdb_detail::erase_private_keys(*d);
	}
	merchants = rulesdb_detail::load_json(src, "merchants.json");
	merchants.erase("_fuente");
	world = rulesdb_detail::load_json(src, "world.json");
	levels = Json::object();
	for (const std::string& f : src.list_files("levels", ".json"))
	{
		Json lv = rulesdb_detail::load_json(src, "levels/" + f);
		const std::string id = jstr(lv, "id", rulesdb_detail::basename_no_ext(f));
		levels[id] = std::move(lv);
	}
	encounters = Json::object();
	for (const std::string& f : src.list_files("encounters", ".json"))
	{
		Json e = rulesdb_detail::load_json(src, "encounters/" + f);
		const std::string id = jstr(e, "id", rulesdb_detail::basename_no_ext(f));
		encounters[id] = std::move(e);
	}
	loaded = true;
	return errors.empty();
}

void RulesDB::clear()
{
	for (Json* d : {&weapons, &armor, &spells, &monsters, &classes, &species, &backgrounds, &feats, &features, &party, &names, &items,
			 &encounters, &levels, &merchants, &world, &slot_tables})
	{
		*d = Json::object();
	}
	loaded = false;
	errors.clear();
}

// ------------------------------------------------------------------ consultas

const Json& RulesDB::spell(const std::string& id)
{
	return jobj(spells, id);
}

Json RulesDB::weapon(const std::string& id)
{
	Json w = jobj(weapons, id);
	w["id"] = id;
	return w;
}

Json RulesDB::monster_data(const std::string& id)
{
	const Json& m = jobj(monsters, id);
	if (m.contains("base"))
	{
		Json merged = jobj(monsters, jstr(m, "base"));
		for (auto it = m.begin(); it != m.end(); ++it)
		{
			if (it.key() != "base")
			{
				merged[it.key()] = it.value();
			}
		}
		return merged;
	}
	return m;
}

int RulesDB::prof_bonus_for(int level)
{
	return 2 + (level - 1) / 4;
}

std::vector<int> RulesDB::slots_for(const std::string& caster, int level)
{
	const Json& table = jobj(slot_tables, caster);
	return jint_list(jarr(table, std::to_string(level)));
}

Json RulesDB::at_level(const Json& table, int level, const Json& def)
{
	if (!table.is_object())
	{
		return table.is_null() ? def : table;
	}
	Json best = def;
	int best_l = -1;
	for (auto it = table.begin(); it != table.end(); ++it)
	{
		const int l = godot_to_int(it.key());
		if (l <= level && l > best_l)
		{
			best_l = l;
			best = it.value();
		}
	}
	return best;
}

int RulesDB::at_level_int(const Json& table, int level, int def)
{
	return jto_int(at_level(table, level, Json(def)), def);
}

std::string RulesDB::at_level_str(const Json& table, int level, const std::string& def)
{
	const Json v = at_level(table, level, Json(def));
	return v.is_null() ? def : jto_str(v);
}

std::string RulesDB::feature_name(const std::string& fid)
{
	const Json& f = jobj(features, fid);
	if (f.empty())
	{
		for (const char* group : {"invocations", "metamagic_options"})
		{
			const Json& g = jobj(features, group);
			if (g.contains(fid))
			{
				return jstr(g[fid], "name", fid);
			}
		}
		if (feats.contains(fid))
		{
			return jstr(feats[fid], "name", fid);
		}
		return fid;
	}
	return jstr(f, "name", fid);
}

std::string RulesDB::feature_desc(const std::string& fid)
{
	const Json& f = jobj(features, fid);
	if (f.empty())
	{
		for (const char* group : {"invocations", "metamagic_options"})
		{
			const Json& g = jobj(features, group);
			if (g.contains(fid))
			{
				return jstr(g[fid], "desc", "");
			}
		}
		if (feats.contains(fid))
		{
			return jstr(feats[fid], "desc", "");
		}
	}
	return jstr(f, "desc", "");
}

StrList RulesDB::class_spell_list(const std::string& cls, int max_level, bool include_utility)
{
	StrList out;
	const Json& cd = jobj(classes, cls);
	for (const std::string& sid : jstrs(jobj(cd, "casting"), "list"))
	{
		const Json& sp = jobj(spells, sid);
		if (sp.empty() || jint(sp, "level", 0) > max_level)
		{
			continue;
		}
		if (!include_utility && jbool(sp, "utility", false))
		{
			continue;
		}
		out.push_back(sid);
	}
	return out;
}

std::string RulesDB::spell_icon(const std::string& sid)
{
	static const std::unordered_map<std::string, std::string> icons = {
		{"guidance", "bless"}, {"light", "sun"}, {"mage_hand", "open_palm"}, {"detect_magic", "arcane"},
		{"feather_fall", "feather"}, {"speak_with_animals", "paw"}, {"alter_self", "mirror"}, {"message", "speaker"},
		{"minor_illusion", "mirror"}, {"dancing_lights", "sun"}, {"mending", "restore"}, {"thaumaturgy", "thunder"},
		{"druidcraft", "nature"}, {"prestidigitation", "magic"}, {"fire_bolt", "fire"}, {"ray_of_frost", "frost"},
		{"shocking_grasp", "lightning"}, {"sacred_flame", "flame"}, {"spare_the_dying", "ankh"},
		{"magic_missile", "missile"}, {"sleep", "sleep"}, {"thunderwave", "thunder"}, {"burning_hands", "fire_ray"},
		{"shield", "shield"}, {"mage_armor", "mage_armor"}, {"bless", "bless"}, {"cure_wounds", "heal"},
		{"healing_word", "heal"}, {"guiding_bolt", "guiding"}, {"shield_of_faith", "shield_faith"}, {"command", "command"},
		{"sanctuary", "sanctuary"}, {"scorching_ray", "fire_ray"}, {"shatter", "shatter"}, {"misty_step", "teleport"},
		{"hold_person", "hold"}, {"spiritual_weapon", "spiritual_weapon"}, {"aid", "aid"}, {"lesser_restoration", "restore"},
		{"vicious_mockery", "psychic"}, {"dissonant_whispers", "psychic"}, {"mind_spike", "psychic"},
		{"starry_wisp", "guiding"}, {"true_strike", "smite"}, {"eldritch_blast", "eldritch"}, {"chill_touch", "chill"},
		{"poison_spray", "poison"}, {"ray_of_sickness", "poison"}, {"acid_splash", "acid"}, {"acid_arrow", "acid"},
		{"produce_flame", "flame"}, {"produce_flame_hurl", "fire"}, {"shillelagh", "club"}, {"sorcerous_burst", "arcane"},
		{"toll_the_dead", "bell"}, {"word_of_radiance", "sun"}, {"thunderclap", "thunder"}, {"thorn_whip", "nature"},
		{"bane", "curse"}, {"hex", "curse"}, {"charm_person", "charm"}, {"suggestion", "charm"},
		{"hideous_laughter", "laugh"}, {"chromatic_orb", "arcane"}, {"color_spray", "color"}, {"divine_favor", "bless"},
		{"divine_smite", "smite"}, {"searing_smite", "smite"}, {"thunderous_smite", "smite"}, {"wrathful_smite", "smite"},
		{"shining_smite", "smite"}, {"ensnaring_strike", "restrained"}, {"hail_of_thorns", "nature"},
		{"entangle", "restrained"}, {"expeditious_retreat", "wind"}, {"longstrider", "feather"}, {"faerie_fire", "faerie"},
		{"false_life", "heroism"}, {"fog_cloud", "fog"}, {"grease", "grease"}, {"hellish_rebuke", "fire"},
		{"heroism", "heroism"}, {"hunters_mark", "mark"}, {"ice_knife", "ice_knife"}, {"inflict_wounds", "chill"},
		{"protection_from_evil_and_good", "sanctuary"}, {"armor_of_agathys", "agathys"}, {"arms_of_hadar", "tentacles"},
		{"barkskin", "armor_up"}, {"blindness_deafness", "blind"}, {"blur", "magic_shield"}, {"darkness", "darkness"},
		{"dragons_breath", "dragon_breath"}, {"dragons_breath_exhale", "breath"}, {"enlarge_reduce", "growth"},
		{"flame_blade", "fire"}, {"flame_blade_strike", "fire"}, {"flaming_sphere", "fire"}, {"invisibility", "invisible"},
		{"magic_weapon", "armor_up"}, {"mirror_image", "mirror"}, {"moonbeam", "moon"}, {"ray_of_enfeeblement", "curse"},
		{"spike_growth", "spikes"}, {"warding_bond", "bond"}, {"web", "web"},
	};
	auto it = icons.find(sid);
	return it == icons.end() ? std::string("magic") : it->second;
}

} // namespace mdg
