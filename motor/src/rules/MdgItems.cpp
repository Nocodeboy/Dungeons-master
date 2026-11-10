#include "MdgItems.h"

#include "MdgRulesDB.h"

namespace mdg
{

const StrList Items::kWornSlots = {"cloak", "ring1", "ring2", "amulet", "boots", "gloves"};

std::string Items::ammo_group(const std::string& weapon_base)
{
	static const Dict<std::string> groups = []() {
		Dict<std::string> d;
		d["shortbow"] = "arrows";
		d["longbow"] = "arrows";
		d["light_crossbow"] = "bolts";
		d["heavy_crossbow"] = "bolts";
		d["hand_crossbow"] = "bolts";
		d["sling"] = "bullets";
		return d;
	}();
	return groups.get(weapon_base, weapon_base);
}

namespace items_detail
{

bool has_ammo_group(const std::string& k)
{
	return Items::ammo_group(k) != k;
}

} // namespace items_detail

// ------------------------------------------------------------------ datos

Json Items::data(const std::string& id)
{
	if (RulesDB::items.contains(id))
	{
		return RulesDB::items[id];
	}
	if (RulesDB::weapons.contains(id) && id != "unarmed")
	{
		const Json& w = RulesDB::weapons[id];
		Json d = Json::object();
		d["name"] = jat(w, "name");
		d["kind"] = "weapon";
		d["base"] = id;
		d["value"] = jhas(w, "cost") ? w["cost"] : Json(1);
		d["weight"] = jhas(w, "weight") ? w["weight"] : Json(1);
		return d;
	}
	if (RulesDB::armor.contains(id))
	{
		const Json& a = RulesDB::armor[id];
		Json d = Json::object();
		d["name"] = jat(a, "name");
		d["kind"] = "armor";
		d["base"] = id;
		d["value"] = jhas(a, "cost") ? a["cost"] : Json(10);
		d["weight"] = jhas(a, "weight") ? a["weight"] : Json(10);
		return d;
	}
	return Json::object();
}

std::string Items::kind(const std::string& id)
{
	return jstr(data(id), "kind", "");
}

std::string Items::base_of(const std::string& id)
{
	return jstr(data(id), "base", id);
}

int Items::bonus(const std::string& id)
{
	return jint(data(id), "bonus", 0);
}

bool Items::is_magic(const std::string& id)
{
	const Json d = data(id);
	const std::string k = jstr(d, "kind");
	return d.contains("rarity") && k != "potion" && k != "scroll";
}

std::string Items::rarity(const std::string& id)
{
	return jstr(data(id), "rarity", "");
}

bool Items::needs_attunement(const std::string& id)
{
	return jbool(data(id), "attune", false);
}

std::string Items::slot_of(const std::string& id)
{
	const Json d = data(id);
	const std::string k = jstr(d, "kind", "");
	if (k == "weapon" || k == "armor" || k == "shield")
	{
		return k;
	}
	if (k == "wondrous")
	{
		return jstr(d, "slot", "");
	}
	return "";
}

bool Items::stackable(const std::string& id)
{
	return slot_of(id).empty() && kind(id) != "ammo";
}

std::string Items::name_of(const std::string& id, bool unid)
{
	const Json d = data(id);
	if (d.empty())
	{
		return id;
	}
	if (unid && d.contains("unid_name"))
	{
		return jstr(d, "unid_name") + " (sin identificar)";
	}
	return jstr(d, "name", id);
}

std::string Items::icon_of(const std::string& id)
{
	const Json d = data(id);
	if (d.contains("icon"))
	{
		return jstr(d, "icon");
	}
	const std::string k = jstr(d, "kind", "");
	if (k == "weapon")
	{
		const Json& w = jobj(RulesDB::weapons, base_of(id));
		return jstr(w, "kind") == "ranged" ? "ranged" : "sword";
	}
	if (k == "armor")
	{
		return "armor";
	}
	return "bag";
}

int Items::value(const std::string& id)
{
	return std::max(1, static_cast<int>(std::ceil(jnum(data(id), "value", 1.0))));
}

int Items::sell_value(const std::string& id, bool unid)
{
	double v = jnum(data(id), "value", 0.0);
	if (unid)
	{
		const std::string b = base_of(id);
		v = b != id ? jnum(data(b), "value", 2.0) : 20.0;
	}
	if (kind(id) == "key")
	{
		return 0;
	}
	return static_cast<int>(std::floor(v * (kind(id) == "treasure" ? 1.0 : 0.5)));
}

// ------------------------------------------------------------------ resolución para el combate

Json Items::weapon_entry(const std::string& id)
{
	const std::string base = base_of(id);
	Json w = RulesDB::weapon(base);
	if (w.size() <= 1)
	{
		return Json::object();
	}
	w["item_id"] = id;
	const int b = bonus(id);
	if (b > 0)
	{
		w["magic"] = b;
		w["name"] = name_of(id);
	}
	w["ammo_key"] = ammo_group(base);
	return w;
}

// ------------------------------------------------------------------ inventario

Json& Items::pack(Json& s)
{
	if (!s.contains("pack") || !s["pack"].is_array())
	{
		s["pack"] = Json::array();
	}
	return s["pack"];
}

Json& Items::stack(Json& s)
{
	if (!s.contains("items") || !s["items"].is_object())
	{
		s["items"] = Json::object();
	}
	return s["items"];
}

void Items::add_to(Json& s, const std::string& id, int n, bool unid)
{
	if (!exists(id))
	{
		return;
	}
	const Json d = data(id);
	if (jstr(d, "kind") == "ammo")
	{
		const std::string key = jstr(d, "ammo", "");
		if (uses_ammo(s, key))
		{
			Json am = jobj(s, "ammo");
			am[key] = jint(am, key, 0) + jint(d, "count", 1) * n;
			s["ammo"] = am;
			return;
		}
		Json& st = stack(s);
		st[id] = jint(st, id, 0) + n;
		return;
	}
	if (stackable(id))
	{
		Json& st = stack(s);
		st[id] = jint(st, id, 0) + n;
		if (jstr(d, "kind") == "wand" && !jobj(s, "charges").contains(id))
		{
			Json ch = jobj(s, "charges");
			ch[id] = jint(d, "charges", 7);
			s["charges"] = ch;
		}
		return;
	}
	for (int i = 0; i < n; ++i)
	{
		Json e = Json::object();
		e["id"] = id;
		if (unid && is_magic(id))
		{
			e["unid"] = true;
		}
		pack(s).push_back(e);
	}
}

bool Items::uses_ammo(const Json& s, const std::string& key)
{
	for (const std::string& w : jstrs(s, "weapons"))
	{
		if (ammo_group(base_of(w)) == key)
		{
			return true;
		}
	}
	return false;
}

int Items::take_stack(Json& s, const std::string& id, int n)
{
	Json& st = stack(s);
	const int have = jint(st, id, 0);
	const int taken = std::min(have, n);
	if (taken <= 0)
	{
		return 0;
	}
	if (have - taken <= 0)
	{
		st.erase(id);
		if (s.contains("charges") && s["charges"].is_object() && s["charges"].contains(id))
		{
			s["charges"].erase(id);
		}
	}
	else
	{
		st[id] = have - taken;
	}
	return taken;
}

int Items::count(Json& s, const std::string& id)
{
	int n = jint(stack(s), id, 0);
	for (const Json& e : pack(s))
	{
		if (jstr(e, "id") == id)
		{
			n += 1;
		}
	}
	return n;
}

StrList Items::attuned(const Json& s)
{
	StrList out;
	const Json& worn = jobj(s, "worn");
	for (const std::string& slot : kWornSlots)
	{
		const std::string id = jstr(worn, slot, "");
		if (!id.empty() && needs_attunement(id))
		{
			out.push_back(id);
		}
	}
	return out;
}

std::string Items::equip(Json& s, int idx, const std::string& ring_slot)
{
	Json& p = pack(s);
	if (idx < 0 || idx >= static_cast<int>(p.size()))
	{
		return "No existe ese objeto.";
	}
	const Json e = p[static_cast<size_t>(idx)];
	const std::string id = jstr(e, "id");
	if (jbool(e, "unid", false))
	{
		return "Identifícalo antes de usarlo (con un descanso corto o el conjuro Identificar).";
	}
	const std::string slot = slot_of(id);
	if (slot == "weapon")
	{
		Json ws = jarr(s, "weapons");
		if (static_cast<int>(ws.size()) >= kMaxWeapons)
		{
			return format("Ya llevas %d armas a mano. Guarda una primero.", kMaxWeapons);
		}
		p.erase(p.begin() + idx);
		ws.push_back(id);
		s["weapons"] = ws;
		sync_thrown_ammo(s, id);
	}
	else if (slot == "armor")
	{
		p.erase(p.begin() + idx);
		const std::string old = jstr(s, "armor", "");
		if (!old.empty())
		{
			p.push_back(Json{{"id", old}});
		}
		s["armor"] = id;
	}
	else if (slot == "shield")
	{
		p.erase(p.begin() + idx);
		if (jbool(s, "shield", false))
		{
			p.push_back(Json{{"id", jstr(s, "shield_id", "shield")}});
		}
		s["shield"] = true;
		s["shield_id"] = id;
	}
	else if (slot == "cloak" || slot == "amulet" || slot == "boots" || slot == "gloves" || slot == "ring")
	{
		std::string target = slot;
		Json worn = jobj(s, "worn");
		if (slot == "ring")
		{
			if (ring_slot == "ring1" || ring_slot == "ring2")
			{
				target = ring_slot;
			}
			else
			{
				target = jstr(worn, "ring1", "").empty() ? "ring1" : "ring2";
			}
		}
		const std::string old2 = jstr(worn, target, "");
		if (needs_attunement(id) && (old2.empty() || !needs_attunement(old2)) && static_cast<int>(attuned(s).size()) >= kMaxAttuned)
		{
			return format("Ya estás en sintonía con %d objetos.", kMaxAttuned);
		}
		p.erase(p.begin() + idx);
		if (!old2.empty())
		{
			p.push_back(Json{{"id", old2}});
		}
		worn[target] = id;
		s["worn"] = worn;
	}
	else
	{
		return "No se puede equipar.";
	}
	return "";
}

std::string Items::unequip(Json& s, const std::string& slot)
{
	if (starts_with(slot, "weapon:"))
	{
		const int i = godot_to_int(slot.substr(7));
		Json ws = jarr(s, "weapons");
		if (i < 0 || i >= static_cast<int>(ws.size()))
		{
			return "";
		}
		pack(s).push_back(Json{{"id", ws[static_cast<size_t>(i)]}});
		ws.erase(ws.begin() + i);
		s["weapons"] = ws;
		return "";
	}
	if (slot == "armor")
	{
		if (!jstr(s, "armor", "").empty())
		{
			const std::string old = jstr(s, "armor");
			pack(s).push_back(Json{{"id", old}});
			s["armor"] = "";
		}
	}
	else if (slot == "shield")
	{
		if (jbool(s, "shield", false))
		{
			const std::string sid = jstr(s, "shield_id", "shield");
			pack(s).push_back(Json{{"id", sid}});
			s["shield"] = false;
			s.erase("shield_id");
		}
	}
	else
	{
		Json worn = jobj(s, "worn");
		if (worn.contains(slot) && !jstr(worn, slot, "").empty())
		{
			const std::string old = jstr(worn, slot);
			pack(s).push_back(Json{{"id", old}});
			worn.erase(slot);
			s["worn"] = worn;
		}
	}
	return "";
}

void Items::sync_thrown_ammo(Json& s, const std::string& id)
{
	const std::string b = base_of(id);
	const Json& w = jobj(RulesDB::weapons, b);
	if (jin(jarr(w, "props"), "thrown") && jstr(w, "kind") == "melee")
	{
		Json am = jobj(s, "ammo");
		if (!am.contains(b))
		{
			am[b] = 1;
			s["ammo"] = am;
		}
	}
}

StrList Items::identify_all(Json& s)
{
	StrList out;
	for (Json& e : pack(s))
	{
		if (jbool(e, "unid", false))
		{
			e.erase("unid");
			out.push_back(name_of(jstr(e, "id")));
		}
	}
	return out;
}

void Items::normalize(Json& s)
{
	if (!s.contains("pack"))
	{
		s["pack"] = Json::array();
	}
	if (!s.contains("worn"))
	{
		s["worn"] = Json::object();
	}
	if (s.contains("shield") && s["shield"].is_string())
	{
		const std::string sid = s["shield"].get<std::string>();
		s["shield"] = !sid.empty();
		if (!sid.empty())
		{
			s["shield_id"] = sid;
		}
	}
	Json am = jobj(s, "ammo");
	for (const std::string& k : jkeys(am))
	{
		if (items_detail::has_ammo_group(k))
		{
			const std::string g = ammo_group(k);
			const int add = jint(am, k, 0);
			am[g] = jint(am, g, 0) + add;
			am.erase(k);
		}
	}
	s["ammo"] = am;
}

WornMods Items::worn_mods(const Json& s)
{
	WornMods out;
	const Json& worn = jobj(s, "worn");
	for (const std::string& slot : kWornSlots)
	{
		const std::string id = jstr(worn, slot, "");
		if (id.empty())
		{
			continue;
		}
		const Json m = jobj(data(id), "mods");
		out.ac += jint(m, "ac", 0);
		out.saves += jint(m, "saves", 0);
		out.checks += jint(m, "checks", 0);
		out.ac_unarmored += jint(m, "ac_unarmored", 0);
		out.tools += jint(m, "tools", 0);
		const Json& set = jobj(m, "set");
		for (auto it = set.begin(); it != set.end(); ++it)
		{
			out.set[it.key()] = std::max(out.set.get(it.key(), 0), jto_int(it.value()));
		}
		const Json& skill = jobj(m, "skill");
		for (auto it = skill.begin(); it != skill.end(); ++it)
		{
			out.skill[it.key()] = out.skill.get(it.key(), 0) + jto_int(it.value());
		}
		for (const std::string& x : jstrs(m, "adv"))
		{
			add_unique(out.adv, x);
		}
		for (const std::string& x : jstrs(m, "resist"))
		{
			add_unique(out.resist, x);
		}
		for (const std::string& x : jstrs(m, "immune_spell"))
		{
			add_unique(out.immune_spell, x);
		}
		out.speed_min = std::max(out.speed_min, jint(m, "speed_min", 0));
		if (jbool(m, "ignore_armor_speed", false))
		{
			out.ignore_armor_speed = true;
		}
		if (jbool(m, "wound_closure", false))
		{
			out.wound_closure = true;
		}
		if (jbool(m, "pearl", false))
		{
			out.pearl = true;
		}
	}
	return out;
}

bool Items::can_read_scroll(const Json& s, const std::string& id)
{
	const std::string sid = jstr(data(id), "spell", "");
	const Json& cd = jobj(RulesDB::classes, jstr(s, "class", ""));
	return jin(jarr(jobj(cd, "casting"), "list"), sid);
}

bool Items::can_use_wand(const Json& s, const std::string& id)
{
	const Json d = data(id);
	if (jbool(d, "needs_caster", false))
	{
		const Json& cd = jobj(RulesDB::classes, jstr(s, "class", ""));
		return !jobj(cd, "casting").empty();
	}
	return true;
}

} // namespace mdg
