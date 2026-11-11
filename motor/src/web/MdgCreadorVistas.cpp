// Marca de Granito · creador de personajes: opciones y vistas de cada paso para la interfaz
// (lo que _build_* de character_creator.gd dibujaba, como datos).
#include "MdgCreador.h"
#include "MdgCreadorInt.h"

#include "MdgCharacterSheet.h"
#include "MdgCreature.h"
#include "MdgFactory.h"
#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgWebInt.h"

#include <algorithm>
#include <cmath>
#include <map>

namespace mdg::web
{
Json tarjeta_conjuro(const std::string& sid);
}

namespace mdg::web::creador
{

namespace
{

const std::map<std::string, std::string> kTitulos = {{"class", "Clase"}, {"species", "Especie"}, {"background", "Trasfondo"},
	{"abilities", "Características"}, {"skills", "Habilidades"}, {"options", "Rasgos"}, {"spells", "Conjuros"}, {"equipment", "Equipo"},
	{"look", "Aspecto"}, {"identity", "Nombre"}};
const std::map<std::string, std::string> kPistas = {
	{"class", "Tu clase decide cómo luchas y qué papel tienes en el grupo."},
	{"species", "Tu especie te da rasgos innatos: visión, resistencias, magia o tamaño."},
	{"background", "Lo que hacías antes de la aventura: mejora tres características y te da una dote y dos habilidades."},
	{"abilities", "Reparte tus puntuaciones. ★ marca las características que más importan a tu clase."},
	{"skills", "Las habilidades en las que tienes competencia suman tu bonificador (+2) a esas pruebas."},
	{"options", "Elecciones propias de tu clase a nivel 1."},
	{"spells", "Trucos (a voluntad) y conjuros preparados de nivel 1. Puedes cambiarlos al subir de nivel."},
	{"equipment", "Elige el equipo inicial de tu clase. El oro sobrante se guarda para la aventura."},
	{"look", "Elige atuendo, rostro y colores."},
	{"identity", "Ponle nombre a tu héroe y repasa la hoja antes de empezar."},
	{"advance", "Lo que ganas al subir de nivel. Las elecciones nuevas vienen recomendadas; cámbialas si quieres."}};
const std::map<std::string, std::string> kIconosClase = {{"barbarian", "rage"}, {"bard", "lyre"}, {"cleric", "ankh"}, {"druid", "wild_shape"},
	{"fighter", "melee"}, {"monk", "fist"}, {"paladin", "sacred_weapon"}, {"ranger", "ranged"}, {"rogue", "hide"}, {"sorcerer", "sorcery"},
	{"warlock", "eldritch"}, {"wizard", "book"}};
const std::map<std::string, std::string> kIconosEspecie = {{"human", "footsteps"}, {"elf", "nature"}, {"half_elf", "faerie"}, {"half_orc", "fist"},
	{"dwarf", "melee"}, {"halfling", "dodging"}, {"gnome", "arcane"}, {"dragonborn", "dragon_breath"}, {"goliath", "growth"}, {"orc", "rage"},
	{"tiefling", "fire"}};
const std::map<std::string, std::string> kListas = {{"cleric", "Clérigo"}, {"druid", "Druida"}, {"wizard", "Mago"}};
const std::map<std::string, std::string> kSombreros = {{"knight", "Yelmo"}, {"barbarian", "Gorro de pieles"}, {"mage", "Sombrero"}};

/** Minúsculas en UTF-8 (ASCII y las mayúsculas acentuadas de Latin-1), como String.to_lower(). */
std::string to_lower(const std::string& t)
{
	std::string out = t;
	for (size_t i = 0; i < out.size(); ++i)
	{
		const unsigned char ch = static_cast<unsigned char>(out[i]);
		if (ch >= 'A' && ch <= 'Z')
		{
			out[i] = static_cast<char>(ch + 32);
		}
		else if (ch == 0xC3 && i + 1 < out.size())
		{
			const unsigned char n = static_cast<unsigned char>(out[i + 1]);
			if (n >= 0x80 && n <= 0x9E && n != 0x97)
			{
				out[i + 1] = static_cast<char>(n + 0x20);
			}
			++i;
		}
	}
	return out;
}

std::string de(const std::map<std::string, std::string>& m, const std::string& k, const std::string& def = "")
{
	const auto it = m.find(k);
	return it == m.end() ? def : it->second;
}

/** Metros como los escribe la interfaz: «9», «10,5». */
std::string metros(int pies)
{
	const double m = pies * 0.3;
	if (std::fabs(m - std::round(m)) < 1e-6)
	{
		return std::to_string(static_cast<int>(std::round(m)));
	}
	std::string t = format("%.1f", m);
	std::replace(t.begin(), t.end(), '.', ',');
	return t;
}

std::string con_signo(int v)
{
	return v >= 0 ? format("+%d", v) : format("−%d", -v);
}

std::string nombre_hab(const std::string& k)
{
	return Loc::t("skill." + k);
}

std::string lista_carac(const Json& arr)
{
	StrList out;
	for (const Json& a : arr)
	{
		out.push_back(Loc::t("ab." + jto_str(a)));
	}
	return join(out, ", ");
}

Json nombre_desc(const std::string& id, const std::string& name, const std::string& desc)
{
	Json o = Json::object();
	o["id"] = id;
	o["name"] = name;
	o["desc"] = desc;
	return o;
}

Json rasgo(const std::string& fid)
{
	return nombre_desc(fid, RulesDB::feature_name(fid), RulesDB::feature_desc(fid));
}

Json dote(const std::string& fid)
{
	const Json& fd = jobj(RulesDB::feats, fid);
	return nombre_desc(fid, jstr(fd, "name", fid), jstr(fd, "desc", ""));
}

Json chip(const std::string& id, const std::string& name, bool selected)
{
	Json o = Json::object();
	o["id"] = id;
	o["name"] = name;
	o["selected"] = selected;
	return o;
}

Json chip_on(const std::string& id, const std::string& name, bool on, bool enabled)
{
	Json o = Json::object();
	o["id"] = id;
	o["name"] = name;
	o["on"] = on;
	o["enabled"] = enabled;
	return o;
}

std::string texto_armaduras(const Json& arr)
{
	if (arr.empty())
	{
		return "ninguna";
	}
	static const std::map<std::string, std::string> n = {{"light", "ligeras"}, {"medium", "intermedias"}, {"heavy", "pesadas"}, {"shield", "escudos"}};
	StrList out;
	for (const Json& a : arr)
	{
		out.push_back(de(n, jto_str(a), jto_str(a)));
	}
	return join(out, ", ");
}

std::string texto_armas(const Json& arr)
{
	static const std::map<std::string, std::string> n = {{"simple", "sencillas"}, {"martial", "marciales"}, {"martial_light", "marciales ligeras"},
		{"martial_finesse_or_light", "marciales sutiles o ligeras"}};
	StrList out;
	for (const Json& a : arr)
	{
		out.push_back(de(n, jto_str(a), jto_str(a)));
	}
	return join(out, ", ");
}

std::string nombre_objeto(const std::string& id)
{
	std::string def = id;
	std::replace(def.begin(), def.end(), '_', ' ');
	return to_lower(jstr(jobj(RulesDB::items, id), "name", def));
}

} // namespace

// ================================================================== tarjeta de conjuro

Json Creador::tarjeta_hechizo(const std::string& sid, bool on, bool enabled)
{
	Json o = tarjeta_conjuro(sid);
	o["on"] = on;
	o["enabled"] = enabled;
	return o;
}

// ================================================================== héroe (panel lateral)

Json Creador::heroe()
{
	const Json f = full();
	CreaturePtr c = Factory::make_from_sheet(f, nivel(), "preview");
	const Dict<int> ab = CharacterSheet::final_abilities(f);
	Json h = Json::object();
	h["hp"] = c->max_hp;
	h["ac"] = c->ac();
	h["speed"] = c->speed();
	h["speed_m"] = metros(c->speed());
	h["initiative"] = c->initiative_bonus();
	h["initiative_text"] = con_signo(c->initiative_bonus());
	Json abs = Json::object();
	for (const std::string& a : CharacterSheet::kAbilities)
	{
		Json x = Json::object();
		x["score"] = ab.get(a, 10);
		x["mod"] = CharacterSheet::mod(ab.get(a, 10));
		x["short"] = Loc::t("abs." + a);
		x["name"] = Loc::t("ab." + a);
		abs[a] = x;
	}
	h["abilities"] = abs;
	const std::string nm = trim(jstr(s, "name", ""));
	h["name"] = nm.empty() ? std::string("Tu héroe") : nm;
	std::string sp_name = jstr(spd(), "name", "");
	const Json& lin = CharacterSheet::lineage_data(f);
	if (!lin.empty())
	{
		sp_name += " (" + to_lower(jstr(lin, "name", "")) + ")";
	}
	h["sub"] = modo() == "levelup" ? format("%s · %s · nivel %d", sp_name.c_str(), jstr(cd(), "name", "").c_str(), nivel())
								   : sp_name + " · " + jstr(cd(), "name", "") + " · " + jstr(bgd(), "name", "");
	h["visual"] = CharacterSheet::visual_for(f);
	return h;
}

// ================================================================== 1. clase

Json Creador::vista_clase()
{
	Json cards = Json::array();
	for (auto it = RulesDB::classes.begin(); it != RulesDB::classes.end(); ++it)
	{
		const Json& c = it.value();
		const int dif = jint(c, "difficulty", 1);
		std::string estrellas;
		for (int i = 0; i < 3; ++i)
		{
			estrellas += i < dif ? "●" : "○";
		}
		Json o = Json::object();
		o["id"] = it.key();
		o["name"] = jstr(c, "name", it.key());
		o["sub"] = jstr(c, "role", "") + " · " + estrellas;
		o["role"] = jstr(c, "role", "");
		o["difficulty"] = dif;
		o["icon"] = de(kIconosClase, it.key(), "magic");
		o["selected"] = it.key() == jstr(s, "class", "");
		cards.push_back(o);
	}
	const Json& c = cd();
	const std::string cls = jstr(s, "class", "fighter");
	const Json& prim = jarr(c, "primary");
	std::string prim_txt = prim.empty() ? std::string("—") : Loc::t("ab." + jto_str(prim[0]));
	if (prim.size() > 1)
	{
		prim_txt += " (después, " + to_lower(Loc::t("ab." + jto_str(prim[1]))) + ")";
	}
	Json det = Json::object();
	det["id"] = cls;
	det["name"] = jstr(c, "name", "");
	det["desc"] = jstr(c, "desc", "");
	det["hit_die"] = jint(c, "hit_die", 8);
	det["primary"] = prim_txt;
	det["saves"] = lista_carac(jarr(c, "saves"));
	det["armor"] = texto_armaduras(jarr(c, "armor"));
	det["weapons"] = texto_armas(jarr(c, "weapons"));
	static const char* difs[] = {"Sencilla", "Media", "Exigente"};
	det["difficulty"] = difs[std::clamp(jint(c, "difficulty", 1) - 1, 0, 2)];
	Json feats = Json::array();
	Json solo = Json::object();
	solo["class"] = cls;
	for (const std::string& fid : CharacterSheet::features_gained(solo, 1))
	{
		feats.push_back(rasgo(fid));
	}
	det["features"] = feats;
	StrList subs;
	const Json& scs = jobj(c, "subclasses");
	for (auto sit = scs.begin(); sit != scs.end(); ++sit)
	{
		subs.push_back(jstr(sit.value(), "name", ""));
	}
	StrList n2;
	for (const std::string& fid : CharacterSheet::features_gained(solo, 2))
	{
		n2.push_back(RulesDB::feature_name(fid));
	}
	Json later = Json::array();
	later.push_back("Nivel 2: " + join(n2, ", ") + ".");
	later.push_back("Nivel 3: eliges " + to_lower(jstr(c, "subclass_label", "subclase")) + " (" + join(subs, ", ") + ").");
	det["later"] = later;
	det["info"] = format("Dado de golpe: d%d · Principal: %s · Salvaciones: %s", jint(c, "hit_die", 8), prim_txt.c_str(),
		lista_carac(jarr(c, "saves")).c_str());
	Json v = Json::object();
	v["cards"] = cards;
	v["detail"] = det;
	return v;
}

// ================================================================== 2. especie

Json Creador::vista_especie()
{
	Json cards = Json::array();
	for (auto it = RulesDB::species.begin(); it != RulesDB::species.end(); ++it)
	{
		const Json& sd = it.value();
		const Json sizes = sd.value("sizes", Json::array({"medium"}));
		const std::string t = sizes.size() > 1 ? "Pequeño o mediano" : (jto_str(sizes[0]) == "small" ? "Pequeño" : "Mediano");
		Json o = Json::object();
		o["id"] = it.key();
		o["name"] = jstr(sd, "name", it.key());
		o["sub"] = t + " · " + metros(jint(sd, "speed", 30)) + " m";
		o["icon"] = de(kIconosEspecie, it.key(), "footsteps");
		o["selected"] = it.key() == jstr(s, "species", "");
		cards.push_back(o);
	}
	const Json& sd = spd();
	const Json f = full();
	Json det = Json::object();
	det["id"] = jstr(s, "species", "");
	det["name"] = jstr(sd, "name", "");
	det["desc"] = jstr(sd, "desc", "");
	std::string info = "Velocidad: " + metros(jint(sd, "speed", 30)) + " m";
	if (jint(sd, "darkvision", 0) > 0)
	{
		info += " · Visión en la oscuridad: " + metros(jint(sd, "darkvision", 0)) + " m";
	}
	if (!jarr(sd, "resist").empty())
	{
		StrList r;
		for (const Json& d : jarr(sd, "resist"))
		{
			r.push_back(Loc::dmg_type(jto_str(d)));
		}
		info += " · Resistencia: " + join(r, ", ");
	}
	det["info"] = info;
	Json tr = Json::array();
	for (const Json& t : jarr(sd, "traits"))
	{
		tr.push_back(rasgo(jto_str(t)));
	}
	det["traits"] = tr;
	Json v = Json::object();
	v["cards"] = cards;
	v["detail"] = det;
	if (sd.contains("lineages"))
	{
		Json lc = Json::array();
		const Json& ls = jobj(sd, "lineages");
		for (auto it = ls.begin(); it != ls.end(); ++it)
		{
			Json o = Json::object();
			o["id"] = it.key();
			o["name"] = jstr(it.value(), "name", it.key());
			o["desc"] = jstr(it.value(), "desc", "");
			o["selected"] = it.key() == jstr(f, "lineage", "");
			lc.push_back(o);
		}
		Json l = Json::object();
		l["label"] = jstr(sd, "lineage_label", "Linaje");
		l["cards"] = lc;
		v["lineages"] = l;
	}
	else
	{
		v["lineages"] = nullptr;
	}
	if (sd.contains("ancestries"))
	{
		Json ac = Json::array();
		const Json& as = jobj(sd, "ancestries");
		for (auto it = as.begin(); it != as.end(); ++it)
		{
			const Json& ad = it.value();
			Json o = Json::object();
			o["id"] = it.key();
			o["name"] = jstr(ad, "name", it.key());
			o["sub"] = ad.contains("damage") ? "Aliento y resistencia: " + Loc::dmg_type(jstr(ad, "damage", "")) : jstr(ad, "desc", "");
			o["color"] = jstr(ad, "color", "");
			o["selected"] = it.key() == jstr(f, "ancestry", "");
			ac.push_back(o);
		}
		Json a = Json::object();
		a["label"] = jstr(sd, "ancestry_label", "Ascendencia");
		a["cards"] = ac;
		v["ancestries"] = a;
	}
	else
	{
		v["ancestries"] = nullptr;
	}
	if (jbool(sd, "lineage_ability", false))
	{
		Json ch = Json::array();
		for (const char* a : {"int", "wis", "cha"})
		{
			ch.push_back(chip(a, Loc::t(std::string("ab.") + a), jstr(f, "lineage_ability", "") == a));
		}
		Json la = Json::object();
		la["label"] = "Característica para tus conjuros de linaje";
		la["chips"] = ch;
		v["lineage_ability"] = la;
	}
	else
	{
		v["lineage_ability"] = nullptr;
	}
	const Json sizes = sd.value("sizes", Json::array({"medium"}));
	if (sizes.size() > 1)
	{
		Json ch = Json::array();
		for (const Json& z : sizes)
		{
			const std::string id = jto_str(z);
			ch.push_back(chip(id, id == "medium" ? "Mediano" : "Pequeño", jstr(f, "size", "") == id));
		}
		Json sz = Json::object();
		sz["label"] = "Tamaño";
		sz["chips"] = ch;
		v["sizes"] = sz;
	}
	else
	{
		v["sizes"] = nullptr;
	}
	if (jbool(sd, "extra_origin_feat", false))
	{
		const std::string bg_feat = jstr(bgd(), "feat", "");
		Json fc = Json::array();
		for (const std::string& fid : CharacterSheet::origin_feats())
		{
			const Json& fd = jobj(RulesDB::feats, fid);
			const bool cogida = fid == bg_feat;
			Json o = Json::object();
			o["id"] = fid;
			o["name"] = jstr(fd, "name", fid);
			o["desc"] = cogida ? std::string("Ya te la da tu trasfondo.") : jstr(fd, "desc", "");
			o["selected"] = jstr(s, "human_feat", "") == fid;
			o["enabled"] = !cogida;
			fc.push_back(o);
		}
		Json hf = Json::object();
		hf["label"] = "Versátil: dote de origen adicional";
		hf["cards"] = fc;
		v["human_feat"] = hf;
	}
	else
	{
		v["human_feat"] = nullptr;
	}
	return v;
}

// ================================================================== 3. trasfondo

Json Creador::vista_trasfondo()
{
	Json cards = Json::array();
	for (auto it = RulesDB::backgrounds.begin(); it != RulesDB::backgrounds.end(); ++it)
	{
		const Json& bd = it.value();
		StrList abs;
		for (const Json& a : jarr(bd, "abilities"))
		{
			abs.push_back(Loc::t("abs." + jto_str(a)));
		}
		Json o = Json::object();
		o["id"] = it.key();
		o["name"] = jstr(bd, "name", it.key());
		o["sub"] = join(abs, " · ") + " · " + jstr(jobj(RulesDB::feats, jstr(bd, "feat", "")), "name", "");
		o["selected"] = it.key() == jstr(s, "background", "");
		cards.push_back(o);
	}
	const Json& bd = bgd();
	const Json& feat = jobj(RulesDB::feats, jstr(bd, "feat", ""));
	std::string feat_txt = jstr(feat, "name", "");
	if (jstr(bd, "feat", "") == "magic_initiate")
	{
		feat_txt += " (" + de(kListas, jstr(bd, "feat_list", "wizard")) + ")";
	}
	Json det = Json::object();
	det["id"] = jstr(s, "background", "");
	det["name"] = jstr(bd, "name", "");
	det["desc"] = jstr(bd, "desc", "");
	det["feat"] = nombre_desc(jstr(bd, "feat", ""), feat_txt, jstr(feat, "desc", ""));
	Json sk = Json::array();
	for (const Json& k : jarr(bd, "skills"))
	{
		sk.push_back(nombre_hab(jto_str(k)));
	}
	det["skills"] = sk;
	det["tool"] = jstr(bd, "tool", "—");
	det["gold"] = jint(bd, "gold", 0);
	const Json bonus = jobj(full(), "bg_bonus");
	Json allowed = Json::array();
	for (const Json& a : jarr(bd, "abilities"))
	{
		Json o = Json::object();
		o["id"] = jto_str(a);
		o["name"] = Loc::t("ab." + jto_str(a));
		allowed.push_back(o);
	}
	Json b = Json::object();
	b["mode"] = bonus.size() == 3 ? "1_1_1" : "2_1";
	b["allowed"] = allowed;
	b["values"] = bonus;
	Json v = Json::object();
	v["cards"] = cards;
	v["detail"] = det;
	v["bonus"] = b;
	v["note"] = "Las puntuaciones finales se ven en el paso Características.";
	return v;
}

// ================================================================== 4. características

Json Creador::vista_caracteristicas()
{
	const std::string metodo = jstr(s, "ability_method", "standard");
	Json metodos = Json::array();
	for (const auto& m : std::vector<std::pair<std::string, std::string>>{
			 {"standard", "Matriz estándar"}, {"point_buy", "Compra de puntos"}, {"roll", "Tirar 4d6"}})
	{
		metodos.push_back(chip(m.first, m.second, metodo == m.first));
	}
	std::string expl;
	if (metodo == "standard")
	{
		expl = "Reparte 15, 14, 13, 12, 10 y 8. Con − y + intercambias el valor con la característica que tenga el siguiente.";
	}
	else if (metodo == "point_buy")
	{
		expl = "Todas empiezan en 8. Tienes 27 puntos: subir a 13 cuesta 1 por punto; 14 y 15 cuestan 2.";
	}
	else if (metodo == "roll")
	{
		expl = "Seis tiradas de 4d6 quedándote con los tres mejores. Con − y + intercambias los valores entre características.";
	}
	const Json f = full();
	const Json& base = jobj(s, "base_abilities");
	const Json& bonus = jobj(f, "bg_bonus");
	const Dict<int> fin = CharacterSheet::final_abilities(f);
	const Json& prim = jarr(cd(), "primary");
	const int gastado = CharacterSheet::point_buy_spent(base);
	static const std::map<int, int> coste = {{8, 0}, {9, 1}, {10, 2}, {11, 3}, {12, 4}, {13, 5}, {14, 7}, {15, 9}};
	Json filas = Json::array();
	for (const std::string& a : CharacterSheet::kAbilities)
	{
		Json r = Json::object();
		r["id"] = a;
		r["name"] = Loc::t("ab." + a);
		r["short"] = Loc::t("abs." + a);
		r["primary"] = jin(prim, a);
		r["base"] = jint(base, a, 10);
		r["bonus"] = jint(bonus, a, 0);
		r["total"] = fin.get(a, 10);
		r["mod"] = CharacterSheet::mod(fin.get(a, 10));
		r["mod_text"] = con_signo(CharacterSheet::mod(fin.get(a, 10)));
		bool menos = true, mas = true;
		if (metodo == "point_buy")
		{
			const int b = jint(base, a, 8);
			menos = b > 8;
			const int sig = b + 1;
			const auto c0 = coste.find(sig - 1);
			const auto c1 = coste.find(sig);
			mas = !(sig > 15 || gastado - (c0 == coste.end() ? 0 : c0->second) + (c1 == coste.end() ? 99 : c1->second) > CharacterSheet::kPointBuyTotal);
		}
		r["can_minus"] = menos;
		r["can_plus"] = mas;
		filas.push_back(r);
	}
	Json consejos = Json::array();
	StrList flojas;
	for (const Json& a : prim)
	{
		if (CharacterSheet::mod(fin.get(jto_str(a), 10)) < 2)
		{
			flojas.push_back(Loc::t("ab." + jto_str(a)));
		}
	}
	if (!flojas.empty() && !prim.empty())
	{
		consejos.push_back("Consejo: a tu clase le conviene un modificador de +2 o más en " + join(flojas, " o ") + ".");
	}
	if (CharacterSheet::mod(fin.get("con", 10)) < 1)
	{
		consejos.push_back("La Constitución alta te da más puntos de golpe a cada nivel.");
	}
	Json v = Json::object();
	v["method"] = metodo;
	v["methods"] = metodos;
	v["explanation"] = expl;
	v["rows"] = filas;
	v["tips"] = consejos;
	v["rolls"] = metodo == "roll" ? jarr(s, "rolls") : Json();
	v["points_left"] = metodo == "point_buy" ? Json(CharacterSheet::kPointBuyTotal - gastado) : Json();
	return v;
}

// ================================================================== 5. habilidades

Json Creador::vista_habilidades()
{
	const Json f = full();
	const int lv = nivel();
	const StrList fijas = CharacterSheet::fixed_skills(f);
	StrList picks = jstrs(s, "skills");
	for (const std::string& k : fijas)
	{
		if (!contains(picks, k))
		{
			picks.push_back(k);
		}
	}
	const int need = CharacterSheet::required_skills(f, lv);
	const int left = need - static_cast<int>(picks.size());
	const auto slots = CharacterSheet::skill_slots(f, lv);
	StrList bg_sk;
	for (const Json& k : jarr(bgd(), "skills"))
	{
		bg_sk.push_back(nombre_hab(jto_str(k)));
	}
	StrList src = {"Trasfondo: " + join(bg_sk, ", ")};
	for (const Json& k : jarr(spd(), "skills"))
	{
		src.push_back(jstr(spd(), "name", "") + ": " + nombre_hab(jto_str(k)));
	}
	if (CharacterSheet::overlapping_fixed(f) > 0)
	{
		src.push_back(format("Repetida con el trasfondo: %d cualquiera", CharacterSheet::overlapping_fixed(f)));
	}
	src.push_back(format("Clase: %d de su lista", slots.cls));
	if (spd().contains("keen_senses"))
	{
		StrList ks;
		for (const Json& k : jarr(spd(), "keen_senses"))
		{
			ks.push_back(nombre_hab(jto_str(k)));
		}
		src.push_back("Sentidos agudos: 1 entre " + join(ks, ", "));
	}
	if (jint(spd(), "skill_choices", 0) > 0)
	{
		src.push_back(format("%s: %d cualquiera", jstr(s, "species", "") == "half_elf" ? "Versatilidad" : "Hábil", jint(spd(), "skill_choices", 0)));
	}
	if (slots.feats > 0)
	{
		src.push_back(format("Dote Versado: %d cualquiera", slots.feats));
	}
	const Dict<int> fin = CharacterSheet::final_abilities(f);
	const Json& sk = jobj(cd(), "skills");
	const StrList de_clase = sk.contains("from") ? jstrs(sk, "from") : CharacterSheet::kSkills;
	const StrList ex = jstrs(s, "expertise");
	const StrList de_especie = jstrs(spd(), "skills");
	Json cards = Json::array();
	for (const std::string& k : CharacterSheet::kSkills)
	{
		const std::string ab = Creature::skill_ability(k);
		const bool on = contains(picks, k);
		const bool bloqueada = contains(fijas, k);
		StrList prueba = picks;
		prueba.push_back(k);
		const bool puede = left > 0 && habilidades_posibles(prueba);
		const int b = CharacterSheet::mod(fin.get(ab, 10)) + (on ? 2 : 0) + (on && contains(ex, k) ? 2 : 0);
		std::string sub = Loc::t("abs." + ab);
		const std::string extra = bloqueada ? (contains(de_especie, k) ? "especie" : "trasfondo") : (on ? "competente" : "");
		if (!extra.empty())
		{
			sub += " · " + extra;
		}
		Json o = Json::object();
		o["id"] = k;
		o["name"] = nombre_hab(k);
		o["ability"] = ab;
		o["ability_short"] = Loc::t("abs." + ab);
		o["bonus"] = b;
		o["bonus_text"] = con_signo(b);
		o["on"] = on;
		o["locked"] = bloqueada;
		o["class_skill"] = contains(de_clase, k);
		o["enabled"] = (on && !bloqueada) || (!on && puede);
		o["sub"] = sub;
		cards.push_back(o);
	}
	Json v = Json::object();
	v["sources_text"] = join(src, " · ");
	v["left"] = left;
	v["need"] = need;
	v["done"] = left <= 0;
	v["cards"] = cards;
	v["status"] = left > 0 ? format("Te quedan %d por elegir", left) : std::string("Habilidades completas");
	const int ec = CharacterSheet::expertise_count(f, lv);
	if (ec > 0)
	{
		StrList elegidas;
		for (const std::string& x : ex)
		{
			if (contains(picks, x))
			{
				elegidas.push_back(x);
			}
		}
		Json chips = Json::array();
		for (const std::string& k : picks)
		{
			const bool on = contains(elegidas, k);
			chips.push_back(chip_on(k, nombre_hab(k), on, on || static_cast<int>(elegidas.size()) < ec));
		}
		Json e = Json::object();
		e["title"] = format("Pericia: elige %d (doble bonificador)", ec);
		e["count"] = ec;
		e["picked"] = static_cast<int>(elegidas.size());
		e["chips"] = chips;
		v["expertise"] = e;
	}
	else
	{
		v["expertise"] = nullptr;
	}
	return v;
}

// ================================================================== 6. rasgos

namespace
{

Json seccion_estilo(Creador& c, const Json& f)
{
	Json cards = Json::array();
	for (const std::string& fid : CharacterSheet::fighting_styles_for(jstr(c.s, "class", "")))
	{
		Json o = dote(fid);
		o["selected"] = jstr(f, "fighting_style", "") == fid;
		cards.push_back(o);
	}
	Json sec = Json::object();
	sec["kind"] = "fighting_style";
	sec["what"] = "fighting_style";
	sec["title"] = "Estilo de combate";
	sec["cards"] = cards;
	return sec;
}

Json seccion_invocaciones(Creador& c, const Json& f, int ic, bool subida)
{
	const StrList cur = c.invocaciones();
	const int lv = c.nivel();
	Json cards = Json::array();
	const Json& cat = jobj(RulesDB::features, "invocations");
	for (auto it = cat.begin(); it != cat.end(); ++it)
	{
		const Json& d = it.value();
		if (jint(d, "level", 1) > lv)
		{
			continue;
		}
		const bool on = contains(cur, it.key());
		const std::string req = jstr(d, "requires", "");
		const bool ok = req.empty() || jin(jarr(f, "cantrips"), req);
		Json o = Json::object();
		o["id"] = it.key();
		o["name"] = jstr(d, "name", it.key());
		o["desc"] = jstr(d, "desc", "") + (ok ? std::string() : " (Requiere " + jstr(RulesDB::spell(req), "name", req) + ".)");
		o["on"] = on;
		o["enabled"] = subida ? ok && (on || static_cast<int>(cur.size()) < ic) : ok;
		o["level"] = jint(d, "level", 1);
		cards.push_back(o);
	}
	Json sec = Json::object();
	sec["kind"] = "invocations";
	sec["what"] = "invocation";
	sec["title"] = subida ? format("Invocaciones sobrenaturales: %d en total (%d/%d)", ic, static_cast<int>(cur.size()), ic)
						  : format("Invocaciones sobrenaturales: elige %d", ic);
	sec["count"] = ic;
	sec["picked"] = static_cast<int>(cur.size());
	sec["cards"] = cards;
	if (subida)
	{
		sec["note"] = "Puedes cambiar las que ya tenías.";
	}
	return sec;
}

} // namespace

Json Creador::vista_rasgos()
{
	if (modo() == "levelup")
	{
		return vista_rasgos_subida();
	}
	const Json& c = cd();
	const Json f = full();
	const std::string cls = jstr(s, "class", "");
	const int lv = nivel();
	Json secs = Json::array();
	if (CharacterSheet::fighting_style_level(cls) <= lv)
	{
		secs.push_back(seccion_estilo(*this, f));
	}
	const Json& orders = jobj(c, "orders");
	if (!orders.empty())
	{
		const std::string key = cls == "cleric" ? "divine_order" : "primal_order";
		Json cards = Json::array();
		for (auto it = orders.begin(); it != orders.end(); ++it)
		{
			Json o = nombre_desc(it.key(), jstr(it.value(), "name", it.key()), jstr(it.value(), "desc", ""));
			o["selected"] = jstr(f, key, "") == it.key();
			cards.push_back(o);
		}
		Json sec = Json::object();
		sec["kind"] = "order";
		sec["what"] = "order";
		sec["key"] = key;
		sec["title"] = RulesDB::feature_name(key);
		sec["cards"] = cards;
		secs.push_back(sec);
	}
	const int mc = RulesDB::at_level_int(jobj(c, "mastery_count"), lv, 0);
	if (mc > 0)
	{
		const StrList ms = jstrs(s, "masteries");
		const StrList mias = jstrs(f, "weapons");
		Json cards = Json::array();
		for (const std::string& wid : armas_de_maestria())
		{
			const Json& wd = jobj(RulesDB::weapons, wid);
			const std::string mp = jstr(wd, "mastery", "");
			const bool on = contains(ms, wid);
			Json o = Json::object();
			o["id"] = wid;
			o["name"] = jstr(wd, "name", wid);
			o["mine"] = contains(mias, wid);
			o["mastery"] = mp;
			o["mastery_name"] = Loc::t("mastery." + mp);
			o["desc"] = Loc::t("mastery." + mp) + ": " + Loc::t("mastery_desc." + mp);
			o["on"] = on;
			o["enabled"] = on || static_cast<int>(ms.size()) < mc;
			cards.push_back(o);
		}
		Json sec = Json::object();
		sec["kind"] = "masteries";
		sec["what"] = "mastery";
		sec["title"] = format("Maestría con armas: elige %d (%d/%d)", mc, static_cast<int>(ms.size()), mc);
		sec["note"] = "Con esas armas usas su propiedad de maestría. Las de tu equipo están marcadas con ⚔.";
		sec["count"] = mc;
		sec["picked"] = static_cast<int>(ms.size());
		sec["cards"] = cards;
		secs.push_back(sec);
	}
	const int ic = RulesDB::at_level_int(jobj(c, "invocation_count"), lv, 0);
	if (ic > 0)
	{
		secs.push_back(seccion_invocaciones(*this, f, ic, false));
		if (contains(invocaciones(), "pact_of_the_tome"))
		{
			const StrList tomo = jstrs(f, "tome_cantrips");
			Json chips = Json::array();
			for (const std::string& sid : todos_los_trucos())
			{
				const bool on = contains(tomo, sid);
				chips.push_back(chip_on(sid, jstr(RulesDB::spell(sid), "name", sid), on, on || tomo.size() < 3));
			}
			Json sec = Json::object();
			sec["kind"] = "tome";
			sec["what"] = "tome_cantrip";
			sec["title"] = "Libro de las sombras: tres trucos de cualquier lista";
			sec["count"] = 3;
			sec["picked"] = static_cast<int>(tomo.size());
			sec["chips"] = chips;
			secs.push_back(sec);
		}
	}
	Json items = Json::array();
	static const StrList fuera = {"fighting_style", "weapon_mastery", "divine_order", "primal_order", "eldritch_invocations", "spellcasting",
		"pact_magic"};
	for (const std::string& fid : CharacterSheet::features_gained(f, 1))
	{
		if (!contains(fuera, fid))
		{
			items.push_back(rasgo(fid));
		}
	}
	if (!items.empty())
	{
		Json sec = Json::object();
		sec["kind"] = "features";
		sec["title"] = "Otros rasgos de nivel 1";
		sec["items"] = items;
		secs.push_back(sec);
	}
	Json v = Json::object();
	v["sections"] = secs;
	return v;
}

Json Creador::vista_rasgos_subida()
{
	const Json& c = cd();
	const Json f = full();
	const std::string cls = jstr(s, "class", "");
	const int lv = nivel();
	Json secs = Json::array();
	if (CharacterSheet::fighting_style_level(cls) == lv)
	{
		secs.push_back(seccion_estilo(*this, f));
	}
	if (cls == "sorcerer" && lv >= 2)
	{
		const StrList mm = jstrs(s, "metamagic");
		Json cards = Json::array();
		const Json& opts = jobj(RulesDB::features, "metamagic_options");
		for (auto it = opts.begin(); it != opts.end(); ++it)
		{
			const int coste = jint(it.value(), "cost", 1);
			const bool on = contains(mm, it.key());
			Json o = Json::object();
			o["id"] = it.key();
			o["name"] = jstr(it.value(), "name", it.key());
			o["desc"] = format("(%d %s) %s", coste, coste == 1 ? "punto" : "puntos", jstr(it.value(), "desc", "").c_str());
			o["icon"] = "metamagic";
			o["on"] = on;
			o["enabled"] = on || mm.size() < 2;
			cards.push_back(o);
		}
		Json sec = Json::object();
		sec["kind"] = "metamagic";
		sec["what"] = "metamagic";
		sec["title"] = format("Metamagia: elige 2 (%d/2)", static_cast<int>(mm.size()));
		sec["count"] = 2;
		sec["picked"] = static_cast<int>(mm.size());
		sec["cards"] = cards;
		secs.push_back(sec);
	}
	const int ic = RulesDB::at_level_int(jobj(c, "invocation_count"), lv, 0);
	if (ic > RulesDB::at_level_int(jobj(c, "invocation_count"), lv - 1, 0))
	{
		secs.push_back(seccion_invocaciones(*this, f, ic, true));
		if (contains(invocaciones(), "lessons_of_the_first_ones"))
		{
			Json chips = Json::array();
			for (const std::string& fid : CharacterSheet::origin_feats())
			{
				const Json& fd = jobj(RulesDB::feats, fid);
				Json o = chip(fid, jstr(fd, "name", fid), jstr(f, "lessons_feat", "") == fid);
				o["enabled"] = !jin(jarr(f, "feats"), fid) || jbool(fd, "repeatable", false);
				chips.push_back(o);
			}
			Json sec = Json::object();
			sec["kind"] = "lessons";
			sec["what"] = "lessons_feat";
			sec["title"] = "Lecciones de los primeros: una dote de origen";
			sec["chips"] = chips;
			secs.push_back(sec);
		}
	}
	const int ec = CharacterSheet::expertise_count(f, lv);
	if (ec > CharacterSheet::expertise_count(f, lv - 1))
	{
		const StrList ex = jstrs(s, "expertise");
		const StrList permitidas = c.contains("expertise_from") ? jstrs(c, "expertise_from") : CharacterSheet::kSkills;
		const StrList viejas = jstrs(estado(), "old_expertise");
		Json chips = Json::array();
		for (const std::string& k : jstrs(f, "skills"))
		{
			if (!contains(permitidas, k) && !contains(ex, k))
			{
				continue;
			}
			const bool on = contains(ex, k);
			Json ch = Json::object();
			ch["id"] = k;
			ch["name"] = nombre_hab(k);
			ch["on"] = on;
			ch["locked"] = contains(viejas, k);
			ch["enabled"] = !contains(viejas, k) && (on || static_cast<int>(ex.size()) < ec);
			chips.push_back(ch);
		}
		Json sec = Json::object();
		sec["kind"] = "expertise";
		sec["what"] = "expertise";
		sec["title"] = format("Pericia: %d en total (%d/%d)", ec, static_cast<int>(ex.size()), ec);
		sec["note"] = "Duplicas el bonificador por competencia en esas habilidades.";
		sec["count"] = ec;
		sec["chips"] = chips;
		secs.push_back(sec);
	}
	Json v = Json::object();
	v["sections"] = secs;
	return v;
}

// ================================================================== 7. conjuros

Json Creador::vista_conjuros()
{
	const Json& c = cd();
	const Json& cast = jobj(c, "casting");
	const Json f = full();
	const int lv = nivel();
	Json v = Json::object();
	if (!cast.empty())
	{
		const std::string ab = jstr(cast, "ability", "int");
		CreaturePtr cr = Factory::make_from_sheet(f, lv, "preview");
		const std::vector<int> slots = RulesDB::slots_for(jstr(cast, "type", "full"), lv);
		StrList st;
		for (size_t i = 0; i < slots.size(); ++i)
		{
			if (slots[i] > 0)
			{
				st.push_back(format("%d de nivel %d", slots[i], static_cast<int>(i) + 1));
			}
		}
		std::string head = format("Lanzas con %s: CD de salvación %d, ataque de conjuro %s. Espacios: %s.", Loc::t("ab." + ab).c_str(),
			cr->spell_save_dc(), con_signo(cr->spell_attack_bonus()).c_str(), join(st, ", ").c_str());
		if (jstr(cast, "type", "") == "pact")
		{
			head += " Los espacios de pacto se recuperan con un descanso corto.";
		}
		v["head"] = head;
		const Json& lista = jarr(cast, "list");
		const int nc = trucos_a_elegir();
		if (nc > 0)
		{
			const StrList cur = jstrs(s, "cantrips");
			Json cards = Json::array();
			for (const Json& sj : lista)
			{
				const std::string sid = jto_str(sj);
				const Json& sp = RulesDB::spell(sid);
				if (jint(sp, "level", -1) != 0 || jbool(sp, "hidden", false))
				{
					continue;
				}
				const bool on = contains(cur, sid);
				cards.push_back(tarjeta_hechizo(sid, on, on || static_cast<int>(cur.size()) < nc));
			}
			Json t = Json::object();
			t["title"] = format("Trucos: elige %d (%d/%d)", nc, static_cast<int>(cur.size()), nc);
			t["count"] = nc;
			t["picked"] = static_cast<int>(cur.size());
			t["what"] = "cantrip";
			t["cards"] = cards;
			v["cantrips"] = t;
		}
		else
		{
			v["cantrips"] = nullptr;
		}
		const int np = RulesDB::at_level_int(jobj(cast, "prepared"), lv, 0);
		const StrList siempre = CharacterSheet::always_prepared(f, lv);
		if (np > 0)
		{
			const StrList prep = preparados();
			const int max_l = CharacterSheet::max_spell_level(f, lv);
			Json niveles = Json::array();
			for (int sl = max_l; sl > 0; --sl)
			{
				Json cards = Json::array();
				for (const Json& sj : lista)
				{
					const std::string sid = jto_str(sj);
					const Json& sp = RulesDB::spell(sid);
					if (jint(sp, "level", 0) != sl || jbool(sp, "hidden", false) || contains(siempre, sid))
					{
						continue;
					}
					const bool on = contains(prep, sid);
					cards.push_back(tarjeta_hechizo(sid, on, on || static_cast<int>(prep.size()) < np));
				}
				Json n = Json::object();
				n["level"] = sl;
				n["title"] = format("Nivel %d", sl);
				n["cards"] = cards;
				niveles.push_back(n);
			}
			Json p = Json::object();
			p["title"] = format("Conjuros preparados: elige %d (%d/%d)", np, static_cast<int>(prep.size()), np);
			p["count"] = np;
			p["picked"] = static_cast<int>(prep.size());
			p["what"] = "prepared";
			p["by_level"] = niveles;
			v["prepared"] = p;
		}
		else
		{
			v["prepared"] = nullptr;
		}
		Json al = Json::array();
		for (const std::string& sid : siempre)
		{
			al.push_back(tarjeta_hechizo(sid, true, false));
		}
		v["always"] = al;
	}
	else
	{
		v["head"] = nullptr;
		v["cantrips"] = nullptr;
		v["prepared"] = nullptr;
		v["always"] = Json::array();
	}
	if (jin(jarr(f, "feats"), "magic_initiate"))
	{
		const Json& bd = bgd();
		const Json mi = jobj(s, "magic_initiate");
		const bool fija = jstr(bd, "feat", "") == "magic_initiate";
		const std::string lst = jstr(mi, "list", fija ? jstr(bd, "feat_list", "wizard") : "wizard");
		Json m = Json::object();
		m["title"] = "Iniciado en la magia (" + de(kListas, lst, lst) + ")";
		m["list"] = lst;
		m["fixed_list"] = fija;
		Json listas = Json::array();
		if (!fija)
		{
			for (const char* l : {"cleric", "druid", "wizard"})
			{
				listas.push_back(chip(l, de(kListas, l), lst == l));
			}
		}
		m["lists"] = listas;
		Json abs = Json::array();
		for (const char* a : {"int", "wis", "cha"})
		{
			abs.push_back(chip(a, Loc::t(std::string("ab.") + a), jstr(jobj(f, "magic_initiate"), "ability", "") == a));
		}
		m["abilities"] = abs;
		const StrList conocidos = jstrs(s, "cantrips");
		const StrList cur = jstrs(mi, "cantrips");
		Json tc = Json::array();
		for (const std::string& sid : RulesDB::class_spell_list(lst, 0))
		{
			const Json& sp = RulesDB::spell(sid);
			if (jint(sp, "level", -1) != 0 || jbool(sp, "hidden", false))
			{
				continue;
			}
			const bool on = contains(cur, sid);
			tc.push_back(tarjeta_hechizo(sid, on, (on || cur.size() < 2) && !contains(conocidos, sid)));
		}
		Json t = Json::object();
		t["title"] = format("Dos trucos (%d/2)", static_cast<int>(cur.size()));
		t["count"] = 2;
		t["cards"] = tc;
		m["cantrips"] = t;
		Json sc = Json::array();
		for (const std::string& sid : RulesDB::class_spell_list(lst, 1))
		{
			const Json& sp = RulesDB::spell(sid);
			if (jint(sp, "level", 0) != 1 || jbool(sp, "hidden", false))
			{
				continue;
			}
			sc.push_back(tarjeta_hechizo(sid, jstr(mi, "spell", "") == sid, true));
		}
		Json sp1 = Json::object();
		sp1["title"] = "Un conjuro de nivel 1 (gratis una vez al día)";
		sp1["cards"] = sc;
		m["spell"] = sp1;
		v["magic_initiate"] = m;
	}
	else
	{
		v["magic_initiate"] = nullptr;
	}
	const Json& lin = CharacterSheet::lineage_data(f);
	StrList extra;
	if (lin.contains("cantrip"))
	{
		extra.push_back(jstr(RulesDB::spell(jstr(lin, "cantrip", "")), "name", jstr(lin, "cantrip", "")) + " (truco)");
	}
	const Json& lsp = jobj(lin, "spells");
	for (auto it = lsp.begin(); it != lsp.end(); ++it)
	{
		extra.push_back(jstr(RulesDB::spell(jto_str(it.value())), "name", "") + " (nivel " + it.key() + ")");
	}
	if (!extra.empty())
	{
		v["lineage_magic"] = join(extra, ", ") + ". Usa " + Loc::t("ab." + jstr(f, "lineage_ability", "wis")) + ".";
	}
	else
	{
		v["lineage_magic"] = nullptr;
	}
	return v;
}

// ================================================================== 8. equipo

Json Creador::vista_equipo()
{
	const Json& c = cd();
	const Json f = full();
	const int lv = nivel();
	Json kits = Json::array();
	for (const Json& k : jarr(c, "kits"))
	{
		const std::string req = jstr(k, "requires", "");
		if (!req.empty() && req != jstr(f, "divine_order", "") && req != jstr(f, "primal_order", ""))
		{
			continue;
		}
		Json prueba = s;
		prueba["kit"] = jstr(k, "id", "");
		const Json tf = CharacterSheet::complete(prueba, lv);
		CreaturePtr cr = Factory::make_from_sheet(tf, lv, "preview");
		const std::string arm = jstr(k, "armor", "");
		const std::string arm_n = arm.empty() ? std::string("sin armadura") : jstr(jobj(RulesDB::armor, arm), "name", "sin armadura");
		StrList partes = {format("CA %d (%s%s)", cr->ac(), arm_n.c_str(), jbool(k, "shield", false) ? ", escudo" : "")};
		StrList ws;
		Json armas = Json::array();
		for (const Json& wj : jarr(k, "weapons"))
		{
			const std::string w = jto_str(wj);
			const Json& wd = jobj(RulesDB::weapons, w);
			ws.push_back(jstr(wd, "name", w) + " (" + jstr(wd, "damage", "") + ")");
			Json a = Json::object();
			a["id"] = w;
			a["name"] = jstr(wd, "name", w);
			a["damage"] = jstr(wd, "damage", "");
			armas.push_back(a);
		}
		partes.push_back(join(ws, ", "));
		StrList objs;
		const Json& its = jobj(k, "items");
		for (auto it = its.begin(); it != its.end(); ++it)
		{
			objs.push_back(nombre_objeto(it.key()));
		}
		const int oro = jint(k, "gold", 0) + jint(bgd(), "gold", 0);
		std::string sub = join(partes, " · ");
		if (!objs.empty())
		{
			sub += " · " + join(objs, ", ");
		}
		sub += format(" · %d po", oro);
		const bool falta_fuerza = jint(jobj(RulesDB::armor, arm), "str_req", 0) > CharacterSheet::final_abilities(tf).get("str", 10);
		if (falta_fuerza)
		{
			sub += " · [Fuerza insuficiente: −3 m de velocidad]";
		}
		Json o = Json::object();
		o["id"] = jstr(k, "id", "");
		o["name"] = jstr(k, "name", "");
		o["sub"] = sub;
		o["ac"] = cr->ac();
		o["gold"] = oro;
		o["armor"] = arm;
		o["shield"] = jbool(k, "shield", false);
		o["weapons"] = armas;
		o["items"] = its;
		o["str_warning"] = falta_fuerza;
		o["selected"] = jstr(f, "kit", "") == jstr(k, "id", "");
		kits.push_back(o);
	}
	StrList bg_items;
	const Json& bi = jobj(bgd(), "items");
	for (auto it = bi.begin(); it != bi.end(); ++it)
	{
		bg_items.push_back(nombre_objeto(it.key()));
	}
	Json v = Json::object();
	v["kits"] = kits;
	v["note"] = "Además: una poción de curación y el equipo de tu trasfondo (" + join(bg_items, ", ") + ").";
	return v;
}

// ================================================================== 9. aspecto

Json Creador::vista_aspecto()
{
	const Json& vis = jobj(s, "visual");
	const Json fv = CharacterSheet::visual_for(full());
	Json cuerpos = Json::array();
	for (const auto& o : kBodies)
	{
		cuerpos.push_back(chip(o.first, o.second, jstr(fv, "model", "") == o.first));
	}
	Json caras = Json::array();
	for (const auto& o : kHeads)
	{
		caras.push_back(chip(o.first, o.second, jstr(fv, "head", "") == o.first));
	}
	Json toggles = Json::array();
	const std::string model = jstr(fv, "model", "knight");
	auto toggle = [&](const std::string& key, const std::string& name, bool on) {
		Json t = Json::object();
		t["key"] = key;
		t["name"] = name;
		t["on"] = on;
		toggles.push_back(t);
	};
	if (kSombreros.count(model))
	{
		toggle("hat", de(kSombreros, model), jbool(vis, "hat", false));
	}
	toggle("cape", "Capa", jbool(vis, "cape", true));
	if (jbool(jobj(spd(), "visual"), "beard", false) && jstr(fv, "head", "") != "barbarian")
	{
		toggle("beard", "Barba", jbool(vis, "beard", true));
	}
	StrList pieles = jstrs(jobj(spd(), "visual"), "skins");
	const bool draco = jstr(s, "species", "") == "dragonborn";
	if (draco)
	{
		pieles.clear();
		const Json& as = jobj(spd(), "ancestries");
		for (auto it = as.begin(); it != as.end(); ++it)
		{
			pieles.push_back(jstr(it.value(), "color", ""));
		}
	}
	auto muestras = [&](const std::string& titulo, const std::string& key, const StrList& colores) {
		Json cs = Json::array();
		for (const std::string& col : colores)
		{
			Json x = Json::object();
			x["color"] = col;
			x["selected"] = jstr(fv, key, "") == col;
			cs.push_back(x);
		}
		Json m = Json::object();
		m["title"] = titulo;
		m["key"] = key;
		m["colors"] = cs;
		return m;
	};
	Json v = Json::object();
	v["bodies"] = cuerpos;
	v["heads"] = caras;
	v["toggles"] = toggles;
	v["skin"] = muestras(draco ? "Escamas" : "Piel", "skin", pieles);
	v["cloth"] = muestras("Ropa", "cloth", kClothColors);
	v["visual"] = fv;
	v["hair"] = draco ? Json() : muestras("Pelo", "hair", kHairColors);
	return v;
}

// ================================================================== 10. nombre y resumen

Json Creador::vista_nombre()
{
	const Json f = full();
	const int lv = nivel();
	CreaturePtr c = Factory::make_from_sheet(f, lv, "preview");
	Json v = Json::object();
	v["name"] = jstr(s, "name", "");
	v["max_length"] = 28;
	Json pr = Json::array();
	for (const auto& p : std::vector<std::pair<std::string, std::string>>{{"m", "Él"}, {"f", "Ella"}, {"n", "Elle"}})
	{
		pr.push_back(chip(p.first, p.second, jstr(s, "pronoun", "m") == p.first));
	}
	v["pronouns"] = pr;
	v["pronoun_label"] = "Te refieres a tu héroe como:";
	auto linea = [](const std::string& label, const std::string& text) {
		Json l = Json::object();
		l["label"] = label;
		l["text"] = text;
		return l;
	};
	Json res = Json::array();
	StrList dotes;
	for (const Json& fd : jarr(f, "feats"))
	{
		dotes.push_back(jstr(jobj(RulesDB::feats, jto_str(fd)), "name", jto_str(fd)));
	}
	if (f.contains("fighting_style"))
	{
		dotes.push_back(jstr(jobj(RulesDB::feats, jstr(f, "fighting_style", "")), "name", ""));
	}
	res.push_back(linea("Dotes", join(dotes, ", ")));
	StrList habs;
	const StrList ex = jstrs(f, "expertise");
	for (const std::string& k : jstrs(f, "skills"))
	{
		habs.push_back(nombre_hab(k) + (contains(ex, k) ? " (pericia)" : ""));
	}
	res.push_back(linea("Habilidades", join(habs, ", ")));
	res.push_back(linea("Salvaciones", lista_carac(jarr(cd(), "saves"))));
	StrList ws;
	for (const std::string& w : jstrs(f, "weapons"))
	{
		ws.push_back(jstr(jobj(RulesDB::weapons, w), "name", w));
	}
	const std::string arm = jstr(f, "armor", "");
	res.push_back(linea("Equipo", join(ws, ", ") + (arm.empty() ? std::string() : ", " + jstr(jobj(RulesDB::armor, arm), "name", "")) +
									  (jbool(f, "shield", false) ? ", escudo" : "") + format(" · %d po", jint(f, "gold", 0))));
	if (!jarr(f, "masteries").empty())
	{
		StrList ms;
		for (const std::string& w : jstrs(f, "masteries"))
		{
			const Json& wd = jobj(RulesDB::weapons, w);
			ms.push_back(jstr(wd, "name", w) + " (" + Loc::t("mastery." + jstr(wd, "mastery", "")) + ")");
		}
		res.push_back(linea("Maestrías", join(ms, ", ")));
	}
	StrList cs;
	for (const std::string& sid : c->known_spells())
	{
		cs.push_back(jstr(RulesDB::spell(sid), "name", sid));
	}
	if (!cs.empty())
	{
		res.push_back(linea("Conjuros", join(cs, ", ")));
	}
	StrList rs;
	for (const std::string& fid : CharacterSheet::features_gained(f, 1))
	{
		rs.push_back(RulesDB::feature_name(fid));
	}
	for (const Json& t : jarr(spd(), "traits"))
	{
		rs.push_back(RulesDB::feature_name(jto_str(t)));
	}
	res.push_back(linea("Rasgos", join(rs, ", ")));
	v["summary"] = res;
	Json is = Json::array();
	const Json av = avisos_por_paso();
	for (auto& kv : av.items())
	{
		is.push_back(kv.value());
	}
	v["issues"] = is;
	return v;
}

// ================================================================== subida: nivel N

Json Creador::vista_avance()
{
	const Json f = full();
	const Json& c = cd();
	const int lv = nivel();
	const Json prev = CharacterSheet::complete(s, lv - 1);
	const int hp_now = CharacterSheet::hp_at(f, lv);
	const int gana = hp_now - CharacterSheet::hp_at(prev, lv - 1);
	Json v = Json::object();
	v["title"] = format("Nivel %d", lv);
	v["hp_gain"] = gana;
	v["hp_max"] = hp_now;
	v["hp_text"] = format("+%d puntos de golpe (máximo %d)", gana, hp_now);
	v["hp_note"] = "Al subir se gana la media del dado de golpe.";
	Json lineas = Json::array();
	const int pb = RulesDB::prof_bonus_for(lv);
	if (pb > RulesDB::prof_bonus_for(lv - 1))
	{
		lineas.push_back(format("Tu bonificador por competencia sube a +%d.", pb));
	}
	const Json& cast = jobj(c, "casting");
	if (!cast.empty())
	{
		const std::vector<int> a = RulesDB::slots_for(jstr(cast, "type", "full"), lv - 1);
		const std::vector<int> b = RulesDB::slots_for(jstr(cast, "type", "full"), lv);
		if (a != b)
		{
			StrList partes;
			for (size_t i = 0; i < b.size(); ++i)
			{
				if (b[i] > 0)
				{
					partes.push_back(format("%d de nivel %d", b[i], static_cast<int>(i) + 1));
				}
			}
			lineas.push_back("Espacios de conjuro: " + join(partes, ", ") + ".");
		}
		const int np = RulesDB::at_level_int(jobj(cast, "prepared"), lv, 0);
		if (np > RulesDB::at_level_int(jobj(cast, "prepared"), lv - 1, 0))
		{
			lineas.push_back(format("Preparas %d conjuros (los eliges en el paso Conjuros).", np));
		}
	}
	v["lines"] = lineas;
	const Json& scd = jobj(jobj(c, "subclasses"), jstr(f, "subclass", ""));
	const StrList sub_feats = jstrs(jobj(scd, "features"), std::to_string(lv));
	Json nuevos = Json::array();
	for (const std::string& fid : CharacterSheet::features_gained(f, lv))
	{
		if (fid != "subclass" && !contains(sub_feats, fid))
		{
			nuevos.push_back(rasgo(fid));
		}
	}
	v["features"] = nuevos;
	if (lv == 3)
	{
		const std::string sid = jstr(f, "subclass", "");
		Json sc = Json::object();
		sc["label"] = jstr(c, "subclass_label", "Subclase");
		sc["id"] = sid;
		sc["name"] = jstr(scd, "name", sid);
		sc["desc"] = jstr(scd, "desc", "");
		Json sf = Json::array();
		for (const std::string& fid : jstrs(jobj(scd, "features"), "3"))
		{
			sf.push_back(rasgo(fid));
		}
		sc["features"] = sf;
		Json eleccion = Json::array();
		const Json& subs = jobj(c, "subclasses");
		for (auto it = subs.begin(); it != subs.end(); ++it)
		{
			Json o = nombre_desc(it.key(), jstr(it.value(), "name", it.key()), jstr(it.value(), "desc", ""));
			o["selected"] = it.key() == sid;
			eleccion.push_back(o);
		}
		sc["choices"] = eleccion;
		StrList ap;
		const Json& apj = jobj(scd, "always_prepared");
		for (auto it = apj.begin(); it != apj.end(); ++it)
		{
			for (const Json& x : it.value())
			{
				ap.push_back(jstr(RulesDB::spell(jto_str(x)), "name", jto_str(x)));
			}
		}
		sc["always_prepared"] = ap.empty() ? Json() : Json("Conjuros siempre preparados: " + join(ap, ", "));
		const std::string cls = jstr(s, "class", "");
		if (cls == "druid")
		{
			Json cards = Json::array();
			const Json& lands = jobj(RulesDB::features, "lands");
			for (auto it = lands.begin(); it != lands.end(); ++it)
			{
				StrList sn;
				for (const Json& x : jarr(it.value(), "spells"))
				{
					sn.push_back(jstr(RulesDB::spell(jto_str(x)), "name", jto_str(x)));
				}
				Json o = Json::object();
				o["id"] = it.key();
				o["name"] = jstr(it.value(), "name", it.key());
				o["sub"] = join(sn, ", ");
				o["icon"] = "nature";
				o["selected"] = jstr(f, "land", "") == it.key();
				cards.push_back(o);
			}
			Json l = Json::object();
			l["title"] = "Tierra de tu círculo";
			l["what"] = "land";
			l["cards"] = cards;
			sc["lands"] = l;
		}
		else
		{
			sc["lands"] = nullptr;
		}
		if (cls == "ranger")
		{
			Json cards = Json::array();
			for (const char* pid : {"colossus_slayer", "horde_breaker"})
			{
				Json o = rasgo(pid);
				o["icon"] = "mark";
				o["selected"] = jstr(f, "hunters_prey", "") == pid;
				cards.push_back(o);
			}
			Json p = Json::object();
			p["title"] = "Presa del cazador";
			p["what"] = "hunters_prey";
			p["cards"] = cards;
			sc["hunters_prey"] = p;
		}
		else
		{
			sc["hunters_prey"] = nullptr;
		}
		v["subclass"] = sc;
	}
	else
	{
		v["subclass"] = nullptr;
	}
	const int need = CharacterSheet::required_skills(f, lv);
	const StrList viejas = jstrs(estado(), "old_skills");
	const int extra = need - static_cast<int>(viejas.size());
	if (extra > 0)
	{
		const StrList picks = jstrs(s, "skills");
		StrList nuevas;
		for (const std::string& k : picks)
		{
			if (!contains(viejas, k))
			{
				nuevas.push_back(k);
			}
		}
		const Json& sk = jobj(c, "skills");
		const StrList permitidas =
			jstr(s, "class", "") == "barbarian" && sk.contains("from") ? jstrs(sk, "from") : CharacterSheet::kSkills;
		Json chips = Json::array();
		for (const std::string& k : permitidas)
		{
			if (contains(viejas, k))
			{
				continue;
			}
			const bool on = contains(nuevas, k);
			chips.push_back(chip_on(k, nombre_hab(k), on, on || static_cast<int>(nuevas.size()) < extra));
		}
		Json ns = Json::object();
		ns["title"] = format("Habilidades nuevas: elige %d (%d/%d)", extra, static_cast<int>(nuevas.size()), extra);
		ns["what"] = "new_skill";
		ns["count"] = extra;
		ns["picked"] = static_cast<int>(nuevas.size());
		ns["chips"] = chips;
		v["new_skills"] = ns;
	}
	else
	{
		v["new_skills"] = nullptr;
	}
	return v;
}

// ================================================================== opciones

Json Creador::vista(const std::string& paso)
{
	if (paso == "class")
	{
		return vista_clase();
	}
	if (paso == "species")
	{
		return vista_especie();
	}
	if (paso == "background")
	{
		return vista_trasfondo();
	}
	if (paso == "abilities")
	{
		return vista_caracteristicas();
	}
	if (paso == "skills")
	{
		return vista_habilidades();
	}
	if (paso == "options")
	{
		return vista_rasgos();
	}
	if (paso == "spells")
	{
		return vista_conjuros();
	}
	if (paso == "equipment")
	{
		return vista_equipo();
	}
	if (paso == "look")
	{
		return vista_aspecto();
	}
	if (paso == "identity")
	{
		return vista_nombre();
	}
	if (paso == "advance")
	{
		return vista_avance();
	}
	return Json();
}

Json Creador::opciones(const std::string& paso)
{
	const Json f = full();
	const Json& c = cd();
	const int lv = nivel();
	const bool subida = modo() == "levelup";
	Json o = Json::object();
	o["mode"] = modo();
	o["level"] = lv;
	o["title"] = subida ? std::string("Subida de nivel") : std::string("Crea tu héroe");
	const Json avisos = avisos_por_paso();
	Json pasos_j = Json::array();
	const StrList ps = pasos();
	for (const std::string& p : ps)
	{
		Json st = Json::object();
		st["id"] = p;
		st["title"] = p == "advance" ? format("Nivel %d", lv) : de(kTitulos, p, p);
		std::string pista = de(kPistas, p);
		if (subida && p == "options")
		{
			pista = format("Elecciones nuevas de tu clase a nivel %d.", lv);
		}
		else if (subida && p == "spells")
		{
			pista = "Al subir de nivel preparas más conjuros y puedes cambiar los que ya tenías.";
		}
		st["hint"] = pista;
		st["issue"] = avisos.contains(p) ? avisos[p] : Json();
		pasos_j.push_back(st);
	}
	o["steps"] = pasos_j;
	o["issues"] = avisos;
	Json errores = Json::array();
	for (auto& kv : avisos.items())
	{
		errores.push_back(kv.value());
	}
	o["errors"] = errores;
	o["ready"] = errores.empty();
	o["finish_label"] = subida ? std::string("Continuar") : std::string("Comenzar la aventura");
	o["hero"] = heroe();
	o["final_abilities"] = to_json(CharacterSheet::final_abilities(f));
	o["point_buy_spent"] = CharacterSheet::point_buy_spent(jobj(s, "base_abilities"));
	o["point_buy_max"] = CharacterSheet::kPointBuyTotal;
	o["standard_array"] = to_json(CharacterSheet::kStandardArray);
	o["recommended_abilities"] = jobj(c, "std_array");
	const StrList fijas = CharacterSheet::fixed_skills(f);
	const int need = CharacterSheet::required_skills(f, lv);
	StrList desde;
	for (const StrList& fuente : fuentes_de_habilidad())
	{
		for (const std::string& k : fuente)
		{
			if (!contains(fijas, k) && !contains(desde, k))
			{
				desde.push_back(k);
			}
		}
	}
	Json ss = Json::object();
	ss["count"] = need - static_cast<int>(fijas.size());
	ss["need"] = need;
	ss["from"] = to_json(desde);
	o["skill_slots"] = ss;
	o["fixed_skills"] = to_json(fijas);
	o["expertise_count"] = CharacterSheet::expertise_count(f, lv);
	if (c.contains("expertise_from"))
	{
		o["expertise_from"] = jarr(c, "expertise_from");
	}
	else
	{
		o["expertise_from"] = jarr(f, "skills");
	}
	o["feats_needed"] = 1 + (jbool(spd(), "extra_origin_feat", false) ? 1 : 0);
	Json of = Json::array();
	for (const std::string& fid : CharacterSheet::origin_feats())
	{
		of.push_back(dote(fid));
	}
	o["origin_feats"] = of;
	Json fs = Json::array();
	if (CharacterSheet::fighting_style_level(jstr(s, "class", "")) <= lv)
	{
		for (const std::string& fid : CharacterSheet::fighting_styles_for(jstr(s, "class", "")))
		{
			fs.push_back(dote(fid));
		}
	}
	o["fighting_styles"] = fs;
	const int ic = RulesDB::at_level_int(jobj(c, "invocation_count"), lv, 0);
	Json inv_from = Json::array();
	if (ic > 0)
	{
		const Json& cat = jobj(RulesDB::features, "invocations");
		for (auto it = cat.begin(); it != cat.end(); ++it)
		{
			if (jint(it.value(), "level", 1) > lv)
			{
				continue;
			}
			Json x = nombre_desc(it.key(), jstr(it.value(), "name", it.key()), jstr(it.value(), "desc", ""));
			x["requires"] = jstr(it.value(), "requires", "");
			inv_from.push_back(x);
		}
	}
	Json inv = Json::object();
	inv["count"] = ic;
	inv["from"] = inv_from;
	inv["chosen"] = to_json(invocaciones());
	o["invocations"] = inv;
	const int mc = RulesDB::at_level_int(jobj(c, "mastery_count"), lv, 0);
	Json ms_from = Json::array();
	if (mc > 0)
	{
		for (const std::string& wid : armas_de_maestria())
		{
			const Json& wd = jobj(RulesDB::weapons, wid);
			const std::string mp = jstr(wd, "mastery", "");
			Json x = Json::object();
			x["id"] = wid;
			x["name"] = jstr(wd, "name", wid);
			x["mastery"] = mp;
			x["mastery_name"] = Loc::t("mastery." + mp);
			x["desc"] = Loc::t("mastery_desc." + mp);
			ms_from.push_back(x);
		}
	}
	Json ms = Json::object();
	ms["count"] = mc;
	ms["from"] = ms_from;
	ms["chosen"] = jarr(s, "masteries");
	o["masteries"] = ms;
	const Json& cast = jobj(c, "casting");
	const Json& lista = jarr(cast, "list");
	Json tf = Json::array();
	Json sf = Json::array();
	const int max_l = CharacterSheet::max_spell_level(f, lv);
	const StrList siempre_p = CharacterSheet::always_prepared(f, lv);
	for (const Json& sj : lista)
	{
		const std::string sid = jto_str(sj);
		const Json& sp = RulesDB::spell(sid);
		if (jbool(sp, "hidden", false))
		{
			continue;
		}
		const int l = jint(sp, "level", 0);
		if (l == 0)
		{
			tf.push_back(tarjeta_conjuro(sid));
		}
		else if (l <= max_l && !contains(siempre_p, sid))
		{
			sf.push_back(tarjeta_conjuro(sid));
		}
	}
	Json ct = Json::object();
	ct["count"] = cast.empty() ? 0 : trucos_a_elegir();
	ct["from"] = tf;
	ct["chosen"] = jarr(s, "cantrips");
	o["cantrips"] = ct;
	Json sp = Json::object();
	sp["count"] = RulesDB::at_level_int(jobj(cast, "prepared"), lv, 0);
	sp["from"] = sf;
	Json alw = Json::array();
	for (const std::string& sid : siempre_p)
	{
		alw.push_back(tarjeta_conjuro(sid));
	}
	sp["always"] = alw;
	sp["chosen"] = cast.empty() ? Json::array() : to_json(preparados());
	o["spells"] = sp;
	const Json kd = CharacterSheet::kit_for(f);
	Json kit = Json::object();
	kit["id"] = jstr(f, "kit", "");
	kit["weapons"] = jarr(f, "weapons");
	kit["armor"] = jstr(f, "armor", "");
	kit["shield"] = jbool(f, "shield", false);
	kit["items"] = jobj(f, "items");
	kit["ammo"] = jobj(f, "ammo");
	kit["gold"] = jint(kd, "gold", 0);
	o["kit"] = kit;
	o["bg_gold"] = jint(bgd(), "gold", 0);
	o["gold"] = jint(f, "gold", 0);
	CreaturePtr cr = Factory::make_from_sheet(f, lv, "preview");
	o["hp"] = cr->max_hp;
	o["ac"] = cr->ac();
	Json vistas = Json::object();
	for (const char* p : {"class", "species", "background", "abilities", "skills", "options", "spells", "equipment", "look", "identity", "advance"})
	{
		if (contains(ps, p) && (paso.empty() || paso == p))
		{
			vistas[p] = vista(p);
		}
	}
	o["views"] = vistas;
	return o;
}

Json opciones(Json& sheet, const std::string& paso)
{
	Creador c(sheet, nullptr);
	return c.opciones(paso);
}

} // namespace mdg::web::creador
