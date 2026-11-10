#include "MdgCampana.h"

#include "MdgCharacterSheet.h"
#include "MdgFactory.h"
#include "MdgItems.h"
#include "MdgRulesDB.h"

#include <cmath>

namespace mdg::web::campana
{

namespace
{

constexpr int kMaxGrupo = 4;
const StrList kDescansoCortoTodo = {"action_surge", "focus", "adrenaline_rush"};
const StrList kDescansoCortoUno = {"second_wind", "channel_divinity", "wild_shape", "rage"};
/** Conjuros que siguen activos tras un descanso corto o un viaje de menos de 8 horas. */
const StrList kBuffsLargos = {"mage_armor"};

const std::map<std::string, std::string>& nombres_cortos()
{
	static const std::map<std::string, std::string> kNombres = {
		{"brenna", "Brenna"}, {"pip", "Pip"}, {"ilyra", "Ilyra"}, {"odvar", "Odvar"}};
	return kNombres;
}

Json lista_enteros(const Json& v)
{
	Json out = Json::array();
	if (v.is_array())
	{
		for (const Json& x : v)
		{
			out.push_back(jto_int(x, 0));
		}
	}
	return out;
}

void enteros_en(Json& d)
{
	if (!d.is_object())
	{
		return;
	}
	for (auto& kv : d.items())
	{
		kv.value() = jto_int(kv.value(), 0);
	}
}

} // namespace

int nivel(const Json& cp)
{
	return std::clamp(jint(cp, "party_level", 1), 1, CharacterSheet::kMaxLevel);
}

bool es_miembro(const Json& cp, const std::string& id)
{
	return jobj(cp, "members").contains(id);
}

bool muerto(const Json& cp, const std::string& id)
{
	return jbool(jobj(jobj(cp, "state"), id), "dead", false);
}

std::string nombre_corto(const Json& cp, const std::string& id)
{
	const auto it = nombres_cortos().find(id);
	if (it != nombres_cortos().end())
	{
		return it->second;
	}
	const std::string nombre = jstr(jobj(jobj(cp, "members"), id), "name", id);
	const size_t p = nombre.find(' ');
	return p == std::string::npos ? nombre : nombre.substr(0, p);
}

int max_hp(const Json& cp, const std::string& id)
{
	if (!es_miembro(cp, id))
	{
		return 0;
	}
	return Factory::make_from_sheet(cp["members"][id], nivel(cp), id)->max_hp;
}

void materializar(Json& s)
{
	if (!jhas(s, "weapons") || !jhas(s, "armor"))
	{
		const Json full = CharacterSheet::complete(s, 1);
		for (const char* k : {"kit", "weapons", "armor", "shield", "ammo", "items"})
		{
			if (full.contains(k))
			{
				s[k] = full[k];
			}
		}
	}
	if (!jhas(s, "items"))
	{
		s["items"] = Json::object();
	}
	s.erase("gold");
	Items::normalize(s);
}

Json estado_nuevo(const Json& cp, const std::string& id)
{
	const CreaturePtr c = Factory::make_from_sheet(cp["members"][id], nivel(cp), id);
	Json st = Json::object();
	st["hp"] = c->max_hp;
	st["temp_hp"] = 0;
	st["slots"] = to_json(c->slots_max);
	st["resources"] = to_json(c->resources_max);
	st["free_casts"] = to_json(c->free_casts);
	st["hit_dice"] = nivel(cp);
	st["dead"] = false;
	return st;
}

bool reclutar(Json& cp, const std::string& id)
{
	if (!es_miembro(cp, id))
	{
		Json s = jobj(RulesDB::party, id);
		if (s.empty())
		{
			return false;
		}
		s["id"] = id;
		materializar(s);
		cp["members"][id] = s;
	}
	if (contains(jstrs(cp, "party"), id))
	{
		return true;
	}
	if (jarr(cp, "party").size() >= static_cast<size_t>(kMaxGrupo))
	{
		return false;
	}
	cp["party"].push_back(id);
	if (!jobj(cp, "state").contains(id))
	{
		cp["state"][id] = estado_nuevo(cp, id);
	}
	return true;
}

Json nueva(const Json& hero, const StrList& companions, Pcg32& rng)
{
	Json cp = Json::object();
	normalizar(cp);
	Json h = hero;
	h.erase("_creator");
	h["id"] = "hero";
	const Json full = CharacterSheet::complete(h, 1);
	int oro = jhas(h, "gold") ? jint(h, "gold", 0) : jint(full, "gold", 0);
	if (oro <= 0)
	{
		const Json kit = CharacterSheet::kit_for(full);
		oro = jint(kit, "gold", 0) + jint(jobj(RulesDB::backgrounds, jstr(full, "background", "")), "gold", 0);
	}
	cp["gold"] = oro;
	materializar(h);
	cp["members"]["hero"] = h;
	cp["party"].push_back("hero");
	for (const std::string& pid : companions)
	{
		reclutar(cp, pid);
	}
	descanso_largo(cp, rng);
	cp["day"] = 1;
	return cp;
}

Json por_defecto()
{
	Json d = Json::object();
	d["version"] = 1;
	d["members"] = Json::object();
	d["party"] = Json::array();
	d["state"] = Json::object();
	d["party_level"] = 1;
	d["gold"] = 0;
	d["location"] = Json::object();
	d["flags"] = Json::object();
	d["journal"] = Json::array();
	d["day"] = 1;
	d["playtime"] = 0.0;
	d["short_rests_left"] = 2;
	d["levels"] = Json::object();
	d["merchants"] = Json::object();
	return d;
}

void normalizar(Json& cp)
{
	if (!cp.is_object())
	{
		cp = por_defecto();
	}
	// Claves que faltan o de otro tipo: el valor por defecto (los números valen entre sí)
	const Json defecto = por_defecto();
	for (const auto& kv : defecto.items())
	{
		if (!cp.contains(kv.key()))
		{
			cp[kv.key()] = kv.value();
			continue;
		}
		const Json& v = cp[kv.key()];
		if (v.type() != kv.value().type() && !(v.is_number() && kv.value().is_number()))
		{
			cp[kv.key()] = kv.value();
		}
	}
	for (const char* k : {"party_level", "gold", "day", "short_rests_left", "version"})
	{
		cp[k] = jto_int(cp[k], 0);
	}
	cp["party_level"] = std::clamp(jint(cp, "party_level", 1), 1, CharacterSheet::kMaxLevel);
	if (cp["members"].is_object())
	{
		for (auto& kv : cp["members"].items())
		{
			Json& s = kv.value();
			if (!s.is_object())
			{
				continue;
			}
			for (const char* k : {"items", "ammo", "charges"})
			{
				if (s.contains(k))
				{
					enteros_en(s[k]);
				}
			}
			Items::normalize(s);
		}
	}
	if (cp["state"].is_object())
	{
		for (auto& kv : cp["state"].items())
		{
			Json& st = kv.value();
			if (!st.is_object())
			{
				continue;
			}
			for (const char* k : {"hp", "temp_hp", "hit_dice"})
			{
				st[k] = jint(st, k, 0);
			}
			st["slots"] = lista_enteros(jat(st, "slots"));
			if (st.contains("resources"))
			{
				enteros_en(st["resources"]);
			}
			if (st.contains("free_casts"))
			{
				enteros_en(st["free_casts"]);
			}
			st["dead"] = jbool(st, "dead", false);
		}
	}
}

CreaturePtr criatura(const Json& cp, const std::string& id, int level)
{
	const int lvl = level < 0 ? nivel(cp) : level;
	CreaturePtr c = Factory::make_from_sheet(cp["members"][id], lvl, id);
	aplicar_estado(cp, *c);
	return c;
}

void aplicar_estado(const Json& cp, Creature& c)
{
	const Json& st = jobj(jobj(cp, "state"), c.id);
	if (st.empty())
	{
		return;
	}
	c.hp = std::clamp(jint(st, "hp", c.max_hp), 0, c.max_hp);
	c.temp_hp = jint(st, "temp_hp", 0);
	const std::vector<int> sl = jint_list(jarr(st, "slots"));
	for (size_t i = 0; i < c.slots.size(); ++i)
	{
		if (i < sl.size())
		{
			c.slots[i] = std::clamp(sl[i], 0, i < c.slots_max.size() ? c.slots_max[i] : sl[i]);
		}
	}
	for (const auto& kv : jobj(st, "resources").items())
	{
		if (c.resources.has(kv.key()))
		{
			c.resources[kv.key()] = std::min(jto_int(kv.value(), 0), c.resources_max.get(kv.key(), jto_int(kv.value(), 0)));
		}
	}
	for (const auto& kv : jobj(st, "free_casts").items())
	{
		if (c.free_casts.has(kv.key()))
		{
			c.free_casts[kv.key()] = std::min(jto_int(kv.value(), 0), c.free_casts.get(kv.key(), 0));
		}
	}
	if (c.hp <= 0)
	{
		c.hp = 1;
	}
}

void capturar(Json& cp, Creature& c)
{
	if (!es_miembro(cp, c.id))
	{
		return;
	}
	Json st = jobj(cp, "state").contains(c.id) ? cp["state"][c.id] : estado_nuevo(cp, c.id);
	if (!c.form.empty())
	{
		c.leave_form();
	}
	st["hp"] = c.hp;
	st["temp_hp"] = c.temp_hp;
	st["slots"] = to_json(c.slots);
	st["resources"] = to_json(c.resources);
	st["free_casts"] = to_json(c.free_casts);
	st["dead"] = c.dead;
	cp["state"][c.id] = st;
	Json& s = cp["members"][c.id];
	Json items = jobj(s, "items");
	for (const auto& kv : c.items)
	{
		items[kv.first] = kv.second;
	}
	s["items"] = items;
	Json ammo = jobj(s, "ammo");
	for (const auto& kv : c.ammo)
	{
		const int antes = jint(ammo, kv.first, kv.second);
		const int gastada = std::max(0, antes - kv.second);
		ammo[kv.first] = kv.second + gastada / 2;
	}
	s["ammo"] = ammo;
	if (!c.item_charges.empty())
	{
		s["charges"] = to_json(c.item_charges);
	}
}

Json descanso_corto(Json& cp, const Json& spend, Pcg32& rng)
{
	Json report = Json::object();
	cp["short_rests_left"] = std::max(0, jint(cp, "short_rests_left", 2) - 1);
	Json identificados = Json::array();
	for (const std::string& id : jstrs(cp, "party"))
	{
		if (es_miembro(cp, id))
		{
			for (const std::string& n : Items::identify_all(cp["members"][id]))
			{
				identificados.push_back(n);
			}
		}
	}
	const int lvl = nivel(cp);
	for (const std::string& id : jstrs(cp, "party"))
	{
		if (!es_miembro(cp, id) || muerto(cp, id))
		{
			continue;
		}
		CreaturePtr c = criatura(cp, id, -1);
		Json st = cp["state"][id];
		const int hd = jint(jobj(RulesDB::classes, c->cls), "hit_die", 8);
		const int con = c->mod("con");
		int curado = 0;
		int usados = 0;
		Json tiradas = Json::array();
		const int quiere = jint(spend, id, -1);
		while (jint(st, "hit_dice", 0) > 0 && c->hp < c->max_hp)
		{
			if (quiere >= 0 && usados >= quiere)
			{
				break;
			}
			if (quiere < 0 && c->max_hp - c->hp < hd / 2 && usados > 0)
			{
				break;
			}
			const int dado = rng.randi_range(1, hd);
			tiradas.push_back(dado);
			const int r = std::max(1, dado * (c->has_trait("wound_closure") ? 2 : 1) + con);
			c->hp = std::min(c->max_hp, c->hp + r);
			curado += r;
			usados += 1;
			st["hit_dice"] = jint(st, "hit_dice", 0) - 1;
		}
		st["hp"] = c->hp;
		Json res = jobj(st, "resources");
		for (const std::string& k : kDescansoCortoTodo)
		{
			if (c->resources_max.has(k))
			{
				res[k] = c->resources_max.get(k, 0);
			}
		}
		for (const std::string& k : kDescansoCortoUno)
		{
			if (c->resources_max.has(k))
			{
				res[k] = std::min(c->resources_max.get(k, 0), jint(res, k, 0) + 1);
			}
		}
		st["resources"] = res;
		if (c->caster_type == "pact")
		{
			st["slots"] = to_json(c->slots_max);
		}
		else if (c->cls == "wizard" && !jbool(st, "arcane_recovery_used", false))
		{
			int presupuesto = static_cast<int>(std::ceil(lvl / 2.0));
			std::vector<int> sl = jint_list(jarr(st, "slots"));
			bool algo = false;
			for (int i = std::min(static_cast<int>(sl.size()), 5) - 1; i >= 0; --i)
			{
				while (presupuesto >= i + 1 && sl[i] < c->slots_max[i])
				{
					sl[i] += 1;
					presupuesto -= i + 1;
					algo = true;
				}
			}
			if (algo)
			{
				st["slots"] = to_json(sl);
				st["arcane_recovery_used"] = true;
			}
		}
		Json buffs = Json::array();
		for (const Json& b : jarr(st, "buffs"))
		{
			if (b.is_string() && contains(kBuffsLargos, b.get<std::string>()))
			{
				buffs.push_back(b);
			}
		}
		st["buffs"] = buffs;
		cp["state"][id] = st;
		Json r = Json::object();
		r["healed"] = curado;
		r["dice"] = usados;
		r["rolls"] = tiradas;
		r["die"] = hd;
		r["con"] = con;
		r["hit_dice_left"] = jint(st, "hit_dice", 0);
		report[id] = r;
	}
	cp["flags"]["last_rest"] = "short";
	report["_identified"] = identificados;
	return report;
}

void descanso_largo(Json& cp, Pcg32& rng)
{
	for (const std::string& id : jstrs(cp, "party"))
	{
		if (!es_miembro(cp, id) || muerto(cp, id))
		{
			continue;
		}
		cp["state"][id] = estado_nuevo(cp, id);
		Json& s = cp["members"][id];
		if (s.contains("charges") && s["charges"].is_object())
		{
			for (auto& kv : s["charges"].items())
			{
				const Json d = Items::data(kv.key());
				kv.value() = std::min(jint(d, "charges", 7), jto_int(kv.value(), 0) + Dice::roll_with(jstr(d, "recharge", "1d6+1"), rng));
			}
		}
		s.erase("pearl_used");
		Items::identify_all(s);
	}
	cp["short_rests_left"] = 2;
	cp["day"] = jint(cp, "day", 1) + 1;
	cp["flags"]["last_rest"] = "long";
}

void subir_nivel(Json& cp, int lvl_in)
{
	const int lvl = std::clamp(lvl_in, 1, CharacterSheet::kMaxLevel);
	const int antes = nivel(cp);
	if (lvl <= antes)
	{
		return;
	}
	cp["party_level"] = lvl;
	for (const std::string& id : jkeys(jobj(cp, "members")))
	{
		if (!jobj(cp, "state").contains(id))
		{
			continue;
		}
		const CreaturePtr viejo = Factory::make_from_sheet(cp["members"][id], antes, id);
		const CreaturePtr c = Factory::make_from_sheet(cp["members"][id], lvl, id);
		Json st = cp["state"][id];
		st["hp"] = jint(st, "hp", 0) + c->max_hp - viejo->max_hp;
		st["hit_dice"] = jint(st, "hit_dice", 0) + (lvl - antes);
		const std::vector<int> sl = jint_list(jarr(st, "slots"));
		Json nuevo = Json::array();
		for (size_t i = 0; i < c->slots_max.size(); ++i)
		{
			const int old_max = i < viejo->slots_max.size() ? viejo->slots_max[i] : 0;
			const int cur = i < sl.size() ? sl[i] : 0;
			nuevo.push_back(std::min(c->slots_max[i], cur + c->slots_max[i] - old_max));
		}
		st["slots"] = nuevo;
		Json res = jobj(st, "resources");
		for (const auto& kv : c->resources_max)
		{
			const int old_m = viejo->resources_max.get(kv.first, 0);
			res[kv.first] = std::min(kv.second, jint(res, kv.first, 0) + kv.second - old_m);
		}
		st["resources"] = res;
		Json fc = jobj(st, "free_casts");
		for (const auto& kv : c->free_casts)
		{
			const int old_f = viejo->free_casts.get(kv.first, 0);
			fc[kv.first] = std::min(kv.second, jint(fc, kv.first, 0) + kv.second - old_f);
		}
		st["free_casts"] = fc;
		cp["state"][id] = st;
	}
}

std::string dar_objeto(Json& cp, const std::string& id, int n, bool unid, const std::string& to)
{
	std::string who = to;
	if (who.empty() || !es_miembro(cp, who))
	{
		const Json d = Items::data(id);
		const StrList party = jstrs(cp, "party");
		who.clear();
		if (jstr(d, "kind", "") == "ammo")
		{
			for (const std::string& pid : party)
			{
				if (es_miembro(cp, pid) && Items::uses_ammo(cp["members"][pid], jstr(d, "ammo", "")))
				{
					who = pid;
					break;
				}
			}
		}
		if (who.empty() && jstr(d, "kind", "") == "scroll")
		{
			for (const std::string& pid : party)
			{
				if (es_miembro(cp, pid) && Items::can_read_scroll(cp["members"][pid], id))
				{
					who = pid;
					break;
				}
			}
		}
		if (who.empty() && id == "thieves_tools")
		{
			for (const std::string& pid : party)
			{
				if (es_miembro(cp, pid) && jstr(cp["members"][pid], "class", "") == "rogue")
				{
					who = pid;
					break;
				}
			}
		}
		if (who.empty())
		{
			who = party.empty() ? std::string("hero") : party.front();
		}
	}
	Items::add_to(cp["members"][who], id, n, unid);
	return who;
}

void pasar_horas(Json& cp, int horas)
{
	if (!cp["state"].is_object())
	{
		return;
	}
	for (auto& kv : cp["state"].items())
	{
		Json& st = kv.value();
		if (!st.is_object())
		{
			continue;
		}
		Json buffs = Json::array();
		if (horas < 8)
		{
			for (const Json& b : jarr(st, "buffs"))
			{
				if (b.is_string() && contains(kBuffsLargos, b.get<std::string>()))
				{
					buffs.push_back(b);
				}
			}
		}
		st["buffs"] = buffs;
	}
}

} // namespace mdg::web::campana
