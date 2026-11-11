// Marca de Granito · creador de personajes: estado, cambios y pasos (port de character_creator.gd).
// Las vistas de cada paso están en MdgCreadorVistas.cpp.
#include "MdgCreador.h"
#include "MdgCreadorInt.h"

#include "MdgCharacterSheet.h"
#include "MdgRulesDB.h"

#include <algorithm>

namespace mdg::web::creador
{

// ================================================================== constantes

const StrList kChoiceKeys = {"lineage", "ancestry", "size", "lineage_ability", "background", "base_abilities", "bg_bonus", "fighting_style",
	"divine_order", "primal_order", "kit", "masteries", "skills", "expertise", "cantrips", "prepared", "magic_initiate", "invocations",
	"tome_cantrips", "pact_weapon"};
const StrList kClassKeys = {"subclass", "fighting_style", "divine_order", "primal_order", "kit", "masteries", "skills", "expertise", "cantrips",
	"prepared", "invocations", "metamagic", "wild_shapes", "land", "hunters_prey", "tome_cantrips", "pact_weapon", "lessons_feat",
	"magic_initiate", "bg_bonus"};
const StrList kHairColors = {"#1e1a17", "#3b2a1e", "#5a3a22", "#8a5a2b", "#b5783a", "#d8b070", "#e8e0c8", "#9a9a9a", "#a0461e", "#c86a2a",
	"#2e3a5a", "#4a6a3a"};
const StrList kClothColors = {"#3f5f9a", "#8a2a2a", "#3a6a4a", "#5a3a8a", "#c8b070", "#2a2a3a", "#7a4a2a", "#2f6c73", "#a41a5a", "#d4dbde",
	"#b45829", "#4a5155"};
const std::vector<std::pair<std::string, std::string>> kBodies = {
	{"knight", "Armadura"}, {"barbarian", "Pieles"}, {"mage", "Túnica"}, {"rogue", "Explorador"}, {"rogue_hooded", "Encapuchado"}};
const std::vector<std::pair<std::string, std::string>> kHeads = {
	{"knight", "Pelo corto"}, {"barbarian", "Rapado y barba"}, {"mage", "Arcano"}, {"rogue", "Melena"}, {"rogue_hooded", "Capucha"}};

// ================================================================== estado

Creador::Creador(Json& sheet, Pcg32* r) : s(sheet), rng(r)
{
	if (!s.is_object())
	{
		s = Json::object();
	}
	if (!s.contains("_creator") || !s["_creator"].is_object())
	{
		s["_creator"] = Json::object();
	}
}

Json& Creador::estado()
{
	return s["_creator"];
}

std::string Creador::modo()
{
	return jstr(estado(), "mode", "create");
}

int Creador::nivel()
{
	return jint(estado(), "level", 1);
}

bool Creador::bandera(const char* k)
{
	return jbool(estado(), k, true);
}

void Creador::poner(const char* k, bool v)
{
	estado()[k] = v;
}

const Json& Creador::cd()
{
	return jobj(RulesDB::classes, jstr(s, "class", "fighter"));
}

const Json& Creador::spd()
{
	return jobj(RulesDB::species, jstr(s, "species", "human"));
}

const Json& Creador::bgd()
{
	return jobj(RulesDB::backgrounds, jstr(s, "background", ""));
}

const Json& Creador::full()
{
	if (!cache_ok)
	{
		cache = CharacterSheet::complete(s, nivel());
		cache_ok = true;
	}
	return cache;
}

void Creador::invalidar()
{
	cache_ok = false;
}

void Creador::sincronizar_dotes()
{
	const std::string bg_feat = jstr(bgd(), "feat", "");
	Json feats = Json::array();
	if (!bg_feat.empty())
	{
		feats.push_back(bg_feat);
	}
	if (jbool(spd(), "extra_origin_feat", false))
	{
		std::string hf = jstr(s, "human_feat", "");
		if (hf.empty() || hf == bg_feat || !contains(CharacterSheet::origin_feats(), hf))
		{
			hf = bg_feat != "skilled" ? "skilled" : "alert";
			s["human_feat"] = hf;
		}
		feats.push_back(hf);
	}
	else
	{
		s.erase("human_feat");
	}
	if (jarr(s, "feats") != feats)
	{
		s["feats"] = feats;
		invalidar();
	}
}

void Creador::rellenar()
{
	invalidar();
	sincronizar_dotes();
	const Json f = full();
	for (const std::string& k : kChoiceKeys)
	{
		if (!s.contains(k) && f.contains(k))
		{
			s[k] = f[k];
		}
	}
	invalidar();
}

std::string Creador::al_azar(const StrList& opciones, int tope)
{
	if (opciones.empty())
	{
		return "";
	}
	const uint32_t n = static_cast<uint32_t>(tope > 0 ? std::min(tope, static_cast<int>(opciones.size())) : static_cast<int>(opciones.size()));
	return opciones[rng ? rng->rand() % n : 0];
}

void Creador::fijar_clase(const std::string& cid, bool forzar)
{
	if (cid == jstr(s, "class", "") && !forzar)
	{
		return;
	}
	s["class"] = cid;
	for (const std::string& k : kClassKeys)
	{
		s.erase(k);
	}
	invalidar();
	if (!bandera("bg_chosen"))
	{
		s["background"] = sheet_detail_default_background(cid);
		s.erase("skills");
	}
	if (!bandera("abilities_touched") || jstr(s, "ability_method", "standard") == "standard")
	{
		s["ability_method"] = "standard";
		s["base_abilities"] = jobj(cd(), "std_array");
		poner("abilities_touched", false);
	}
	else if (jstr(s, "ability_method", "") == "roll")
	{
		asignar_tiradas();
	}
	if (!bandera("look_touched"))
	{
		const std::string model = jstr(jobj(cd(), "visual"), "model", "knight");
		Json v = jobj(s, "visual");
		v["model"] = model;
		v["head"] = model == "rogue_hooded" ? std::string("rogue") : model;
		v["hat"] = false;
		v["cape"] = true;
		if (!v.contains("cloth"))
		{
			v["cloth"] = kClothColors[0];
		}
		s["visual"] = v;
	}
	rellenar();
}

void Creador::fijar_especie(const std::string& sid)
{
	if (sid == jstr(s, "species", ""))
	{
		return;
	}
	s["species"] = sid;
	for (const char* k : {"lineage", "ancestry", "size", "lineage_ability", "skills", "expertise", "human_feat", "magic_initiate"})
	{
		s.erase(k);
	}
	invalidar();
	Json v = jobj(s, "visual");
	const StrList skins = jstrs(jobj(spd(), "visual"), "skins");
	if (sid == "dragonborn")
	{
		v.erase("skin");
		// Un linaje vistoso por defecto (el negro apenas se distingue en el tablero)
		s["ancestry"] = al_azar({"red", "gold", "blue", "green", "silver", "bronze"});
	}
	else if (!skins.empty() && !contains(skins, jstr(v, "skin", "")))
	{
		v["skin"] = al_azar(skins, 3);
	}
	if (!bandera("look_touched"))
	{
		v["head"] = sid == "dwarf" ? std::string("barbarian")
								   : (jstr(v, "model", "") == "rogue_hooded" ? std::string("rogue") : jstr(v, "model", "knight"));
	}
	s["visual"] = v;
	rellenar();
}

void Creador::fijar_trasfondo(const std::string& bid)
{
	if (bid == jstr(s, "background", ""))
	{
		return;
	}
	s["background"] = bid;
	poner("bg_chosen", true);
	for (const char* k : {"bg_bonus", "skills", "expertise", "magic_initiate"})
	{
		s.erase(k);
	}
	rellenar();
}

void Creador::tirar_caracteristicas()
{
	std::vector<int> tiradas;
	for (int i = 0; i < 6; ++i)
	{
		std::vector<int> d;
		for (int j = 0; j < 4; ++j)
		{
			d.push_back(rng ? rng->randi_range(1, 6) : 3);
		}
		std::sort(d.begin(), d.end());
		tiradas.push_back(d[1] + d[2] + d[3]);
	}
	std::sort(tiradas.begin(), tiradas.end());
	std::reverse(tiradas.begin(), tiradas.end());
	s["rolls"] = to_json(tiradas);
	asignar_tiradas();
}

void Creador::asignar_tiradas()
{
	const Json& r = jarr(s, "rolls");
	if (r.size() != 6)
	{
		return;
	}
	const Json& std_a = jobj(cd(), "std_array");
	StrList orden = CharacterSheet::kAbilities;
	std::stable_sort(orden.begin(), orden.end(), [&](const std::string& x, const std::string& y) { return jint(std_a, x, 10) > jint(std_a, y, 10); });
	Json base = Json::object();
	for (size_t i = 0; i < 6; ++i)
	{
		base[orden[i]] = jto_int(r[i]);
	}
	s["base_abilities"] = base;
}

int Creador::trucos_a_elegir()
{
	const Json& cast = jobj(cd(), "casting");
	int n = RulesDB::at_level_int(jobj(cast, "cantrips"), nivel(), 0);
	const Json& f = full();
	if (jstr(f, "divine_order", "") == "thaumaturge" || jstr(f, "primal_order", "") == "magician")
	{
		++n;
	}
	return n;
}

StrList Creador::preparados()
{
	const Json& prep = jat(s, "prepared");
	if (prep.is_array())
	{
		return jstr_list(prep);
	}
	return jstrs(prep, std::to_string(nivel()));
}

void Creador::fijar_preparados(const StrList& pl)
{
	Json prep = jat(s, "prepared");
	if (prep.is_array())
	{
		Json o = Json::object();
		o["1"] = prep;
		prep = o;
	}
	if (!prep.is_object())
	{
		prep = Json::object();
	}
	prep[std::to_string(nivel())] = to_json(pl);
	s["prepared"] = prep;
}

StrList Creador::invocaciones()
{
	return CharacterSheet::invocations_at(s, nivel());
}

StrList Creador::armas_de_maestria()
{
	const Json& c = cd();
	const Json& profs = jarr(c, "weapons");
	StrList out;
	for (auto it = RulesDB::weapons.begin(); it != RulesDB::weapons.end(); ++it)
	{
		const Json& wd = it.value();
		if (jstr(wd, "mastery", "").empty())
		{
			continue;
		}
		if (jbool(c, "mastery_melee_only", false) && jstr(wd, "kind", "") != "melee")
		{
			continue;
		}
		const std::string cat = jstr(wd, "cat", "simple");
		bool ok = jin(profs, cat);
		if (cat == "martial" && jin(profs, "martial_finesse_or_light"))
		{
			ok = jin(jarr(wd, "props"), "finesse") || jin(jarr(wd, "props"), "light");
		}
		if (cat == "martial" && jin(profs, "martial_light"))
		{
			ok = jin(jarr(wd, "props"), "light");
		}
		if (ok)
		{
			out.push_back(it.key());
		}
	}
	const StrList mias = jstrs(full(), "weapons");
	std::stable_sort(out.begin(), out.end(), [&](const std::string& x, const std::string& y) { return contains(mias, x) && !contains(mias, y); });
	return out;
}

StrList Creador::todos_los_trucos()
{
	StrList out;
	for (auto it = RulesDB::spells.begin(); it != RulesDB::spells.end(); ++it)
	{
		if (jint(it.value(), "level", -1) == 0 && !jbool(it.value(), "hidden", false))
		{
			out.push_back(it.key());
		}
	}
	return out;
}

// ------------------------------------------------------------------ habilidades

std::vector<StrList> Creador::fuentes_de_habilidad()
{
	const Json& f = full();
	const auto slots = CharacterSheet::skill_slots(f, nivel());
	std::vector<StrList> out;
	const Json& sk = jobj(cd(), "skills");
	const StrList cls_from = sk.contains("from") ? jstrs(sk, "from") : CharacterSheet::kSkills;
	for (int i = 0; i < slots.cls; ++i)
	{
		out.push_back(cls_from);
	}
	if (spd().contains("keen_senses"))
	{
		out.push_back(jstrs(spd(), "keen_senses"));
	}
	for (int i = 0; i < jint(spd(), "skill_choices", 0); ++i)
	{
		out.push_back(CharacterSheet::kSkills);
	}
	for (int i = 0; i < slots.feats; ++i)
	{
		out.push_back(CharacterSheet::kSkills);
	}
	for (int i = 0; i < CharacterSheet::overlapping_fixed(f); ++i)
	{
		out.push_back(CharacterSheet::kSkills);
	}
	for (int i = 0; i < slots.class_bonus; ++i)
	{
		out.push_back(jstr(s, "class", "") == "barbarian" ? cls_from : CharacterSheet::kSkills);
	}
	return out;
}

namespace
{

bool encaja(const StrList& libres, size_t i, const std::vector<StrList>& fuentes, std::vector<bool>& usadas)
{
	if (i >= libres.size())
	{
		return true;
	}
	for (size_t j = 0; j < fuentes.size(); ++j)
	{
		if (usadas[j] || !contains(fuentes[j], libres[i]))
		{
			continue;
		}
		usadas[j] = true;
		if (encaja(libres, i + 1, fuentes, usadas))
		{
			usadas[j] = false;
			return true;
		}
		usadas[j] = false;
	}
	return false;
}

} // namespace

bool Creador::habilidades_posibles(const StrList& picks)
{
	const StrList fijas = CharacterSheet::fixed_skills(full());
	StrList libres;
	for (const std::string& k : picks)
	{
		if (!contains(fijas, k))
		{
			libres.push_back(k);
		}
	}
	const std::vector<StrList> fuentes = fuentes_de_habilidad();
	if (libres.size() > fuentes.size())
	{
		return false;
	}
	std::vector<bool> usadas(fuentes.size(), false);
	return encaja(libres, 0, fuentes, usadas);
}

// ------------------------------------------------------------------ pasos

bool Creador::tiene_rasgos()
{
	const Json& c = cd();
	const std::string cls = jstr(s, "class", "fighter");
	if (CharacterSheet::fighting_style_level(cls) <= nivel())
	{
		return true;
	}
	if (!jobj(c, "orders").empty())
	{
		return true;
	}
	if (RulesDB::at_level_int(jobj(c, "mastery_count"), nivel(), 0) > 0)
	{
		return true;
	}
	return RulesDB::at_level_int(jobj(c, "invocation_count"), nivel(), 0) > 0;
}

bool Creador::tiene_conjuros()
{
	return !jobj(cd(), "casting").empty() || jin(jarr(s, "feats"), "magic_initiate");
}

bool Creador::subida_tiene_rasgos()
{
	const Json& c = cd();
	const std::string cls = jstr(s, "class", "");
	const int lv = nivel();
	if (CharacterSheet::fighting_style_level(cls) == lv)
	{
		return true;
	}
	if (cls == "sorcerer" && lv == 2)
	{
		return true;
	}
	if (RulesDB::at_level_int(jobj(c, "invocation_count"), lv, 0) > RulesDB::at_level_int(jobj(c, "invocation_count"), lv - 1, 0))
	{
		return true;
	}
	return CharacterSheet::expertise_count(s, lv) > CharacterSheet::expertise_count(s, lv - 1);
}

StrList Creador::pasos()
{
	if (modo() == "levelup")
	{
		StrList p = {"advance"};
		if (subida_tiene_rasgos())
		{
			p.push_back("options");
		}
		if (!jobj(cd(), "casting").empty())
		{
			p.push_back("spells");
		}
		return p;
	}
	StrList p = {"class", "species", "background", "abilities", "skills"};
	if (tiene_rasgos())
	{
		p.push_back("options");
	}
	if (tiene_conjuros())
	{
		p.push_back("spells");
	}
	for (const char* k : {"equipment", "look", "identity"})
	{
		p.push_back(k);
	}
	return p;
}

Json Creador::avisos_por_paso()
{
	Json out = Json::object();
	const Json f = full();
	const int lv = nivel();
	const int need = CharacterSheet::required_skills(f, lv);
	const int tengo = static_cast<int>(jarr(s, "skills").size());
	if (modo() == "levelup")
	{
		if (tengo < need)
		{
			out["advance"] = format("Elige %d habilidades nuevas.", need - tengo);
		}
		const int ec = CharacterSheet::expertise_count(f, lv);
		if (ec > 0 && static_cast<int>(jarr(s, "expertise").size()) < ec)
		{
			out["options"] = "Elige tu pericia nueva.";
		}
		if (jstr(s, "class", "") == "sorcerer" && jarr(s, "metamagic").size() < 2)
		{
			out["options"] = "Elige dos opciones de metamagia.";
		}
		const int ic = RulesDB::at_level_int(jobj(cd(), "invocation_count"), lv, 0);
		if (ic > 0 && static_cast<int>(invocaciones().size()) < ic)
		{
			out["options"] = "Te quedan invocaciones por elegir.";
		}
		const Json& cast = jobj(cd(), "casting");
		if (!cast.empty())
		{
			const int np = RulesDB::at_level_int(jobj(cast, "prepared"), lv, 0);
			if (static_cast<int>(jarr(s, "cantrips").size()) < trucos_a_elegir() || static_cast<int>(preparados().size()) < np)
			{
				out["spells"] = "Te quedan conjuros por elegir.";
			}
		}
		return out;
	}
	if (tengo < need)
	{
		out["skills"] = format("Te faltan %d habilidades por elegir.", need - tengo);
	}
	else if (!habilidades_posibles(jstrs(s, "skills")))
	{
		out["skills"] = "Esa combinación de habilidades no encaja con lo que te dan tu clase y tu especie.";
	}
	const int ec = CharacterSheet::expertise_count(f, lv);
	if (ec > 0 && static_cast<int>(jarr(s, "expertise").size()) < ec)
	{
		out["skills"] = format("Elige %d habilidades para tu pericia.", ec);
	}
	if (jstr(s, "ability_method", "") == "point_buy" && CharacterSheet::point_buy_spent(jobj(s, "base_abilities")) > CharacterSheet::kPointBuyTotal)
	{
		out["abilities"] = "Has gastado más de 27 puntos.";
	}
	const Json& cast = jobj(cd(), "casting");
	if (!cast.empty())
	{
		const int np = RulesDB::at_level_int(jobj(cast, "prepared"), lv, 0);
		if (static_cast<int>(jarr(s, "cantrips").size()) < trucos_a_elegir() || static_cast<int>(preparados().size()) < np)
		{
			out["spells"] = "Te quedan conjuros por elegir.";
		}
	}
	if (jin(jarr(s, "feats"), "magic_initiate"))
	{
		const Json& mi = jobj(s, "magic_initiate");
		if (jarr(mi, "cantrips").size() < 2 || jstr(mi, "spell", "").empty())
		{
			out["spells"] = "Elige los conjuros de Iniciado en la magia.";
		}
	}
	const int mc = RulesDB::at_level_int(jobj(cd(), "mastery_count"), lv, 0);
	if (mc > 0 && static_cast<int>(jarr(s, "masteries").size()) < mc)
	{
		out["options"] = format("Elige %d maestrías con armas.", mc);
	}
	const int ic = RulesDB::at_level_int(jobj(cd(), "invocation_count"), lv, 0);
	if (ic > 0 && static_cast<int>(invocaciones().size()) < ic)
	{
		out["options"] = "Elige tu invocación sobrenatural.";
	}
	if (trim(jstr(s, "name", "")).empty())
	{
		out["identity"] = "Falta el nombre.";
	}
	return out;
}

// ================================================================== cambios

namespace
{

/** Pone o quita `id` de una lista con tope; si ya está llena devuelve el motivo y no la toca. */
std::string alternar(StrList& l, const std::string& id, size_t tope)
{
	const auto it = std::find(l.begin(), l.end(), id);
	if (it != l.end())
	{
		l.erase(it);
		return "";
	}
	if (l.size() >= tope)
	{
		return tope == 1 ? std::string("Ya has elegido. Quita la elección actual primero.")
						 : format("Ya has elegido %d. Quita alguna primero.", static_cast<int>(tope));
	}
	l.push_back(id);
	return "";
}

/** Aplica alternar() a la lista guardada en `s[clave]`. */
std::string alternar_en(Json& s, const char* clave, const StrList& base, const std::string& id, int tope)
{
	StrList l = base;
	const std::string err = alternar(l, id, static_cast<size_t>(std::max(tope, 0)));
	if (err.empty())
	{
		s[clave] = to_json(l);
	}
	return err;
}

} // namespace

std::string Creador::aplicar(const Json& set)
{
	const std::string what = jstr(set, "what", "");
	const Json& value = jat(set, "value");
	const std::string v = value.is_string() ? value.get<std::string>() : jto_str(value);
	const int lv = nivel();
	if (what == "class")
	{
		if (!RulesDB::classes.contains(v))
		{
			return "Esa clase no existe.";
		}
		if (modo() == "levelup")
		{
			return "No puedes cambiar de clase al subir de nivel.";
		}
		fijar_clase(v);
		return "";
	}
	if (what == "species")
	{
		if (!RulesDB::species.contains(v))
		{
			return "Esa especie no existe.";
		}
		fijar_especie(v);
		return "";
	}
	if (what == "lineage")
	{
		if (!jobj(spd(), "lineages").contains(v))
		{
			return "Ese linaje no existe.";
		}
		s["lineage"] = v;
		rellenar();
		return "";
	}
	if (what == "ancestry")
	{
		if (!jobj(spd(), "ancestries").contains(v))
		{
			return "Esa ascendencia no existe.";
		}
		s["ancestry"] = v;
		if (jstr(s, "species", "") == "dragonborn" && s.contains("visual") && s["visual"].is_object())
		{
			s["visual"].erase("skin");
		}
		rellenar();
		return "";
	}
	if (what == "lineage_ability")
	{
		if (v != "int" && v != "wis" && v != "cha")
		{
			return "Elige Inteligencia, Sabiduría o Carisma.";
		}
		s["lineage_ability"] = v;
		rellenar();
		return "";
	}
	if (what == "size")
	{
		if (!jin(spd().value("sizes", Json::array({"medium"})), v))
		{
			return "Tu especie no puede tener ese tamaño.";
		}
		s["size"] = v;
		rellenar();
		return "";
	}
	if (what == "human_feat")
	{
		if (!contains(CharacterSheet::origin_feats(), v) || v == jstr(bgd(), "feat", ""))
		{
			return "Elige otra dote de origen.";
		}
		s["human_feat"] = v;
		s.erase("skills");
		s.erase("magic_initiate");
		rellenar();
		return "";
	}
	if (what == "background")
	{
		if (!RulesDB::backgrounds.contains(v))
		{
			return "Ese trasfondo no existe.";
		}
		fijar_trasfondo(v);
		return "";
	}
	if (what == "bg_mode")
	{
		if (v == "1_1_1")
		{
			Json b = Json::object();
			for (const Json& a : jarr(bgd(), "abilities"))
			{
				b[jto_str(a)] = 1;
			}
			s["bg_bonus"] = b;
		}
		else
		{
			s["bg_bonus"] = CharacterSheet::default_bg_bonus(s);
		}
		rellenar();
		return "";
	}
	if (what == "bg_bonus")
	{
		const std::string a = jstr(set, "ability", v);
		const int amount = jint(set, "amount", 2);
		if (!jin(jarr(bgd(), "abilities"), a))
		{
			return "Tu trasfondo no mejora esa característica.";
		}
		Json b = jobj(full(), "bg_bonus");
		std::string otra;
		for (auto& kv : b.items())
		{
			if (kv.key() != a && jto_int(kv.value()) == amount)
			{
				otra = kv.key();
			}
		}
		const int antes = jint(b, a, 0);
		b.erase(a);
		if (!otra.empty())
		{
			b.erase(otra);
			if (antes > 0 && antes != amount)
			{
				b[otra] = antes;
			}
		}
		b[a] = amount;
		if (b.size() < 2)
		{
			for (const Json& k : jarr(bgd(), "abilities"))
			{
				if (!b.contains(jto_str(k)))
				{
					b[jto_str(k)] = 3 - amount;
					break;
				}
			}
		}
		s["bg_bonus"] = b;
		rellenar();
		return "";
	}
	if (what == "method")
	{
		if (v != "standard" && v != "point_buy" && v != "roll")
		{
			return "Método desconocido.";
		}
		if (v == jstr(s, "ability_method", ""))
		{
			return "";
		}
		s["ability_method"] = v;
		poner("abilities_touched", true);
		if (v == "standard")
		{
			s["base_abilities"] = jobj(cd(), "std_array");
		}
		else if (v == "point_buy")
		{
			if (CharacterSheet::point_buy_spent(jobj(s, "base_abilities")) > CharacterSheet::kPointBuyTotal)
			{
				s["base_abilities"] = jobj(cd(), "std_array");
			}
		}
		else
		{
			tirar_caracteristicas();
		}
		s.erase("bg_bonus");
		rellenar();
		return "";
	}
	if (what == "reroll")
	{
		if (jstr(s, "ability_method", "") != "roll")
		{
			return "Solo se puede volver a tirar con el método de tirar 4d6.";
		}
		tirar_caracteristicas();
		rellenar();
		return "";
	}
	if (what == "recommended")
	{
		s["ability_method"] = "standard";
		s["base_abilities"] = jobj(cd(), "std_array");
		s.erase("bg_bonus");
		poner("abilities_touched", false);
		rellenar();
		return "";
	}
	if (what == "adjust")
	{
		const std::string a = jstr(set, "ability", v);
		const int dir = jint(set, "dir", 1) >= 0 ? 1 : -1;
		if (!contains(CharacterSheet::kAbilities, a))
		{
			return "Característica desconocida.";
		}
		poner("abilities_touched", true);
		Json base = jobj(s, "base_abilities");
		if (jstr(s, "ability_method", "standard") == "point_buy")
		{
			const int nv = std::clamp(jint(base, a, 8) + dir, 8, 15);
			base[a] = nv;
			if (CharacterSheet::point_buy_spent(base) > CharacterSheet::kPointBuyTotal)
			{
				return "No te quedan puntos.";
			}
		}
		else
		{
			const int cur = jint(base, a, 10);
			std::vector<int> valores;
			for (const std::string& k : CharacterSheet::kAbilities)
			{
				const int val = jint(base, k, 10);
				if (std::find(valores.begin(), valores.end(), val) == valores.end())
				{
					valores.push_back(val);
				}
			}
			std::sort(valores.begin(), valores.end());
			const int idx = static_cast<int>(std::find(valores.begin(), valores.end(), cur) - valores.begin()) + dir;
			if (idx < 0 || idx >= static_cast<int>(valores.size()))
			{
				return "No se puede.";
			}
			const int objetivo = valores[static_cast<size_t>(idx)];
			for (const std::string& k : CharacterSheet::kAbilities)
			{
				if (jint(base, k, 10) == objetivo)
				{
					base[k] = cur;
					break;
				}
			}
			base[a] = objetivo;
		}
		s["base_abilities"] = base;
		s.erase("bg_bonus");
		rellenar();
		return "";
	}
	if (what == "skill")
	{
		const StrList fijas = CharacterSheet::fixed_skills(full());
		StrList picks = jstrs(s, "skills");
		if (contains(fijas, v))
		{
			return "Esa habilidad te la da tu trasfondo o tu especie.";
		}
		if (contains(picks, v))
		{
			picks.erase(std::find(picks.begin(), picks.end(), v));
			StrList ex;
			for (const std::string& x : jstrs(s, "expertise"))
			{
				if (x != v)
				{
					ex.push_back(x);
				}
			}
			s["expertise"] = to_json(ex);
		}
		else
		{
			StrList prueba = picks;
			for (const std::string& k : fijas)
			{
				if (!contains(prueba, k))
				{
					prueba.push_back(k);
				}
			}
			const int quedan = CharacterSheet::required_skills(full(), lv) - static_cast<int>(prueba.size());
			prueba.push_back(v);
			if (quedan <= 0 || !contains(CharacterSheet::kSkills, v) || !habilidades_posibles(prueba))
			{
				return "No puedes elegir esa habilidad ahora.";
			}
			picks.push_back(v);
		}
		s["skills"] = to_json(picks);
		rellenar();
		return "";
	}
	if (what == "new_skill")
	{
		const StrList viejas = jstrs(estado(), "old_skills");
		StrList picks = jstrs(s, "skills");
		if (contains(viejas, v))
		{
			return "Ya la tenías.";
		}
		const int need = CharacterSheet::required_skills(full(), lv);
		if (contains(picks, v))
		{
			picks.erase(std::find(picks.begin(), picks.end(), v));
		}
		else if (static_cast<int>(picks.size()) < need)
		{
			picks.push_back(v);
		}
		else
		{
			return "Ya has elegido todas.";
		}
		s["skills"] = to_json(picks);
		rellenar();
		return "";
	}
	if (what == "expertise")
	{
		const int ec = CharacterSheet::expertise_count(full(), lv);
		if (contains(jstrs(estado(), "old_expertise"), v))
		{
			return "Esa pericia ya la tenías.";
		}
		if (!contains(jstrs(s, "skills"), v))
		{
			return "Solo puedes elegir pericia en habilidades que tengas.";
		}
		const std::string err = alternar_en(s, "expertise", jstrs(s, "expertise"), v, ec);
		if (!err.empty())
		{
			return err;
		}
		rellenar();
		return "";
	}
	if (what == "fighting_style")
	{
		if (!contains(CharacterSheet::fighting_styles_for(jstr(s, "class", "")), v))
		{
			return "Ese estilo no es de tu clase.";
		}
		s["fighting_style"] = v;
		rellenar();
		return "";
	}
	if (what == "order")
	{
		if (!jobj(cd(), "orders").contains(v))
		{
			return "Esa orden no es de tu clase.";
		}
		s[jstr(s, "class", "") == "cleric" ? "divine_order" : "primal_order"] = v;
		for (const char* k : {"kit", "cantrips", "prepared", "masteries"})
		{
			s.erase(k);
		}
		rellenar();
		return "";
	}
	if (what == "mastery")
	{
		const int mc = RulesDB::at_level_int(jobj(cd(), "mastery_count"), lv, 0);
		if (!contains(armas_de_maestria(), v))
		{
			return "No puedes elegir maestría con esa arma.";
		}
		const std::string err = alternar_en(s, "masteries", jstrs(s, "masteries"), v, mc);
		if (!err.empty())
		{
			return err;
		}
		rellenar();
		return "";
	}
	if (what == "invocation")
	{
		const int ic = RulesDB::at_level_int(jobj(cd(), "invocation_count"), lv, 0);
		const Json& cat = jobj(RulesDB::features, "invocations");
		const Json& idata = jobj(cat, v);
		if (idata.empty() || jint(idata, "level", 1) > lv)
		{
			return "No puedes elegir esa invocación.";
		}
		const std::string req = jstr(idata, "requires", "");
		if (!req.empty() && !jin(jarr(full(), "cantrips"), req))
		{
			return "Requiere " + jstr(RulesDB::spell(req), "name", req) + ".";
		}
		StrList inv = invocaciones();
		const auto it = std::find(inv.begin(), inv.end(), v);
		if (it != inv.end())
		{
			inv.erase(it);
		}
		else if (modo() == "levelup")
		{
			const std::string err = alternar(inv, v, static_cast<size_t>(std::max(ic, 0)));
			if (!err.empty())
			{
				return err;
			}
		}
		else
		{
			if (static_cast<int>(inv.size()) >= ic && !inv.empty())
			{
				inv.erase(inv.begin());
			}
			inv.push_back(v);
		}
		Json todas = jat(s, "invocations").is_object() ? s["invocations"] : Json::object();
		todas[std::to_string(lv)] = to_json(inv);
		s["invocations"] = todas;
		if (modo() != "levelup")
		{
			s.erase("tome_cantrips");
			s.erase("pact_weapon");
		}
		rellenar();
		return "";
	}
	if (what == "tome_cantrip")
	{
		if (!contains(todos_los_trucos(), v))
		{
			return "Ese truco no existe.";
		}
		const std::string err = alternar_en(s, "tome_cantrips", jstrs(full(), "tome_cantrips"), v, 3);
		if (!err.empty())
		{
			return err;
		}
		rellenar();
		return "";
	}
	if (what == "lessons_feat")
	{
		if (!contains(CharacterSheet::origin_feats(), v))
		{
			return "Elige una dote de origen.";
		}
		s["lessons_feat"] = v;
		rellenar();
		return "";
	}
	if (what == "metamagic")
	{
		if (!jobj(RulesDB::features, "metamagic_options").contains(v))
		{
			return "Esa metamagia no existe.";
		}
		const std::string err = alternar_en(s, "metamagic", jstrs(s, "metamagic"), v, 2);
		if (!err.empty())
		{
			return err;
		}
		rellenar();
		return "";
	}
	if (what == "cantrip")
	{
		const Json& lista = jarr(jobj(cd(), "casting"), "list");
		if (!jin(lista, v) || jint(RulesDB::spell(v), "level", -1) != 0)
		{
			return "Ese truco no es de tu lista.";
		}
		const std::string err = alternar_en(s, "cantrips", jstrs(s, "cantrips"), v, trucos_a_elegir());
		if (!err.empty())
		{
			return err;
		}
		rellenar();
		return "";
	}
	if (what == "prepared" || what == "spell")
	{
		const Json& cast = jobj(cd(), "casting");
		const int np = RulesDB::at_level_int(jobj(cast, "prepared"), lv, 0);
		const Json& sp = RulesDB::spell(v);
		const int sl = jint(sp, "level", 0);
		if (!jin(jarr(cast, "list"), v) || sl < 1 || sl > CharacterSheet::max_spell_level(full(), lv) ||
			contains(CharacterSheet::always_prepared(full(), lv), v))
		{
			return "No puedes preparar ese conjuro.";
		}
		StrList pl = preparados();
		const std::string err = alternar(pl, v, static_cast<size_t>(std::max(np, 0)));
		if (!err.empty())
		{
			return err;
		}
		fijar_preparados(pl);
		rellenar();
		return "";
	}
	if (what == "mi_list")
	{
		if (v != "cleric" && v != "druid" && v != "wizard")
		{
			return "Elige clérigo, druida o mago.";
		}
		if (jstr(bgd(), "feat", "") == "magic_initiate")
		{
			return "Tu trasfondo fija la lista.";
		}
		Json mi = Json::object();
		mi["list"] = v;
		s["magic_initiate"] = mi;
		rellenar();
		return "";
	}
	if (what == "mi_ability")
	{
		if (v != "int" && v != "wis" && v != "cha")
		{
			return "Elige Inteligencia, Sabiduría o Carisma.";
		}
		Json mi = jobj(s, "magic_initiate");
		mi["ability"] = v;
		s["magic_initiate"] = mi;
		rellenar();
		return "";
	}
	if (what == "mi_cantrip" || what == "mi_spell")
	{
		Json mi = jobj(s, "magic_initiate");
		const bool fija = jstr(bgd(), "feat", "") == "magic_initiate";
		const std::string lista = jstr(mi, "list", fija ? jstr(bgd(), "feat_list", "wizard") : "wizard");
		const StrList del = RulesDB::class_spell_list(lista, what == "mi_cantrip" ? 0 : 1);
		if (what == "mi_cantrip")
		{
			if (!contains(del, v) || jint(RulesDB::spell(v), "level", -1) != 0)
			{
				return "Ese truco no es de esa lista.";
			}
			if (jin(jarr(s, "cantrips"), v))
			{
				return "Ya conoces ese truco.";
			}
			const std::string err = alternar_en(mi, "cantrips", jstrs(mi, "cantrips"), v, 2);
			if (!err.empty())
			{
				return err;
			}
		}
		else
		{
			if (!contains(del, v) || jint(RulesDB::spell(v), "level", 0) != 1)
			{
				return "Ese conjuro no es de esa lista.";
			}
			mi["spell"] = v;
		}
		s["magic_initiate"] = mi;
		rellenar();
		return "";
	}
	if (what == "kit")
	{
		const Json* kit = nullptr;
		for (const Json& k : jarr(cd(), "kits"))
		{
			if (jstr(k, "id", "") == v)
			{
				kit = &k;
			}
		}
		const std::string req = kit ? jstr(*kit, "requires", "") : std::string();
		if (!kit || (!req.empty() && req != jstr(full(), "divine_order", "") && req != jstr(full(), "primal_order", "")))
		{
			return "Ese equipo no está disponible.";
		}
		s["kit"] = v;
		s.erase("masteries");
		rellenar();
		return "";
	}
	if (what == "visual" || what == "visual_toggle")
	{
		// En visual_toggle la clave que se alterna viene en "value"
		const std::string key = what == "visual_toggle" ? v : jstr(set, "key", "");
		Json vis = jobj(s, "visual");
		if (what == "visual_toggle")
		{
			vis[key] = !jbool(vis, key, key == "cape" || key == "beard");
		}
		else
		{
			vis[key] = value;
		}
		s["visual"] = vis;
		poner("look_touched", true);
		rellenar();
		return "";
	}
	if (what == "random_look")
	{
		Json vis = jobj(s, "visual");
		StrList cabezas;
		for (const auto& h : kHeads)
		{
			cabezas.push_back(h.first);
		}
		vis["head"] = al_azar(cabezas);
		vis["hair"] = al_azar(kHairColors);
		vis["cloth"] = al_azar(kClothColors);
		const StrList skins = jstrs(jobj(spd(), "visual"), "skins");
		if (!skins.empty())
		{
			vis["skin"] = al_azar(skins);
		}
		vis["cape"] = rng ? rng->randf() < 0.7f : true;
		vis["hat"] = rng ? rng->randf() < 0.35f : false;
		s["visual"] = vis;
		poner("look_touched", true);
		rellenar();
		return "";
	}
	if (what == "name")
	{
		s["name"] = v;
		rellenar();
		return "";
	}
	if (what == "random_name")
	{
		s["name"] = CharacterSheet::random_name(jstr(s, "species", "human"), jstr(s, "pronoun", "m"), rng);
		rellenar();
		return "";
	}
	if (what == "pronoun")
	{
		if (v != "m" && v != "f" && v != "n")
		{
			return "Pronombre desconocido.";
		}
		s["pronoun"] = v;
		rellenar();
		return "";
	}
	if (what == "subclass")
	{
		if (!jobj(cd(), "subclasses").contains(v))
		{
			return "Esa subclase no es de tu clase.";
		}
		s["subclass"] = v;
		rellenar();
		return "";
	}
	if (what == "land")
	{
		if (!jobj(RulesDB::features, "lands").contains(v))
		{
			return "Esa tierra no existe.";
		}
		s["land"] = v;
		rellenar();
		return "";
	}
	if (what == "hunters_prey")
	{
		if (v != "colossus_slayer" && v != "horde_breaker")
		{
			return "Elige Matador de colosos o Rompehordas.";
		}
		s["hunters_prey"] = v;
		rellenar();
		return "";
	}
	return "Elección desconocida: " + what;
}

// ================================================================== subida de nivel

void Creador::preparar_subida(int lvl)
{
	estado()["mode"] = "levelup";
	estado()["level"] = std::clamp(lvl, 2, CharacterSheet::kMaxLevel);
	poner("bg_chosen", true);
	poner("abilities_touched", true);
	poner("look_touched", true);
	const int lv = nivel();
	estado()["old_skills"] = jarr(s, "skills");
	estado()["old_expertise"] = to_json(CharacterSheet::expertise_list(s, lv - 1));
	invalidar();
	const Json f = full();
	for (const char* k : {"subclass", "land", "hunters_prey", "metamagic", "fighting_style", "lessons_feat", "tome_cantrips", "pact_weapon",
			 "wild_shapes", "cantrips"})
	{
		if (f.contains(k) && !s.contains(k))
		{
			s[k] = f[k];
		}
	}
	s["skills"] = jarr(f, "skills");
	s["expertise"] = jarr(f, "expertise");
	Json prep = jat(s, "prepared");
	if (prep.is_array())
	{
		Json o = Json::object();
		o["1"] = prep;
		prep = o;
	}
	if (!prep.is_object())
	{
		prep = Json::object();
	}
	const std::string kl = std::to_string(lv);
	if (f.contains("prepared") && !prep.contains(kl))
	{
		prep[kl] = jarr(jobj(f, "prepared"), kl);
	}
	s["prepared"] = prep;
	if (f.contains("invocations"))
	{
		Json inv = jat(s, "invocations");
		if (inv.is_array())
		{
			Json o = Json::object();
			o["1"] = inv;
			inv = o;
		}
		if (!inv.is_object())
		{
			inv = Json::object();
		}
		if (!inv.contains(kl))
		{
			inv[kl] = jarr(jobj(f, "invocations"), kl);
		}
		s["invocations"] = inv;
	}
	invalidar();
}

// ================================================================== interfaz pública

Json hoja_de(const Json& req)
{
	Json s = jat(req, "sheet");
	if (!s.is_object())
	{
		s = Json::object();
	}
	if (!s.contains("_creator"))
	{
		Json st = Json::object();
		st["mode"] = "create";
		st["level"] = 1;
		st["bg_chosen"] = true;
		st["abilities_touched"] = true;
		st["look_touched"] = true;
		s["_creator"] = st;
	}
	if (jat(req, "level").is_number())
	{
		if (!s["_creator"].is_object())
		{
			s["_creator"] = Json::object();
		}
		s["_creator"]["level"] = std::clamp(jto_int(jat(req, "level")), 1, 3);
	}
	return s;
}

Json nueva(const Json& req, Pcg32& rng)
{
	Json s = Json::object();
	const std::string cls = jstr(req, "class", "fighter");
	const std::string sp = jstr(req, "species", "human");
	s["class"] = RulesDB::classes.contains(cls) ? cls : std::string("fighter");
	s["species"] = "human";
	s["ability_method"] = "standard";
	s["pronoun"] = jstr(req, "pronoun", "m");
	s["visual"] = Json::object();
	Json st = Json::object();
	st["mode"] = "create";
	st["level"] = 1;
	st["bg_chosen"] = false;
	st["abilities_touched"] = false;
	st["look_touched"] = false;
	s["_creator"] = st;
	Creador c(s, &rng);
	c.fijar_clase(jstr(s, "class", "fighter"), true);
	if (RulesDB::species.contains(sp))
	{
		c.fijar_especie(sp);
	}
	s["name"] = CharacterSheet::random_name(jstr(s, "species", "human"), jstr(s, "pronoun", "m"), &rng);
	return s;
}

std::string aplicar(Json& sheet, const Json& set, Pcg32& rng)
{
	Creador c(sheet, &rng);
	return c.aplicar(set);
}

StrList avisos(Json& sheet)
{
	Creador c(sheet, nullptr);
	StrList out;
	const Json av = c.avisos_por_paso();
	for (auto& kv : av.items())
	{
		out.push_back(jto_str(kv.value()));
	}
	return out;
}

void preparar_subida(Json& sheet, int nivel)
{
	Creador c(sheet, nullptr);
	c.preparar_subida(nivel);
}

Json resultado(const Json& sheet)
{
	Json out = sheet;
	Json s2 = sheet;
	Creador c(s2, nullptr);
	const int lv = c.nivel();
	const std::string ai = jstr(c.cd(), "ai", "frontline");
	out.erase("_creator");
	out.erase("rolls");
	out["id"] = "hero";
	out["is_hero"] = true;
	out["name"] = trim(jstr(out, "name", ""));
	Json v = jobj(out, "visual");
	v["hero"] = true;
	out["visual"] = v;
	out["ai"] = ai;
	out["choices_level"] = lv;
	return out;
}

} // namespace mdg::web::creador
