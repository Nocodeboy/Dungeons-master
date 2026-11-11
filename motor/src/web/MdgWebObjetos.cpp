// Marca de Granito · puente web: inventario y tienda fuera de combate.
// inv da la vista de inventario de un miembro (huecos, mochila, munición y estadísticas);
// inv_preview, inv_equip, inv_unequip, inv_give, inv_drop, inv_use e identify cambian el equipo
// sobre el documento de campaña; shop, shop_buy y shop_sell son la tienda de un comerciante.
// Port de inventory_screen.gd y shop_screen.gd con el modelo de vista en JSON.
#include "MdgBattle.h"
#include "MdgCampana.h"
#include "MdgItems.h"
#include "MdgLoc.h"
#include "MdgRulesDB.h"
#include "MdgWebInt.h"

#include <algorithm>
#include <cmath>
#include <map>

namespace mdg::web
{

namespace
{

const StrList kOpsObjetos = {"inv", "inv_preview", "inv_equip", "inv_unequip", "inv_give", "inv_use", "inv_drop", "identify", "shop",
	"shop_buy", "shop_sell"};

/** Miembro al que se refiere la petición: el pedido si es del grupo; si no, el primero vivo del grupo. */
std::string quien_de(const Json& cp, const std::string& who)
{
	if (campana::es_miembro(cp, who))
	{
		return who;
	}
	for (const std::string& id : jstrs(cp, "party"))
	{
		if (campana::es_miembro(cp, id) && !campana::muerto(cp, id))
		{
			return id;
		}
	}
	return "hero";
}

/** Resumen de un objeto para la vista. */
Json resumen(const std::string& id, bool unid)
{
	Json o = Json::object();
	o["id"] = id;
	o["name"] = Items::name_of(id, unid);
	o["kind"] = Items::kind(id);
	o["icon"] = Items::icon_of(id);
	o["rarity"] = unid ? std::string() : Items::rarity(id);
	o["magic"] = Items::is_magic(id);
	o["unid"] = unid;
	return o;
}

/** Orden de la mochila por tipo (los tipos que no están en la lista van delante). */
int orden_mochila(const std::string& id)
{
	static const StrList orden = {"potion", "scroll", "wand", "ammo", "tool", "gear", "treasure", "key"};
	const auto it = std::find(orden.begin(), orden.end(), Items::kind(id));
	return it == orden.end() ? -1 : static_cast<int>(it - orden.begin());
}

/** Orden del género de la tienda por tipo. */
int orden_tienda(const std::string& id)
{
	static const StrList orden = {"weapon", "armor", "shield", "ammo", "potion", "scroll", "wand", "wondrous", "tool", "gear", "treasure"};
	const auto it = std::find(orden.begin(), orden.end(), Items::kind(id));
	return it == orden.end() ? -1 : static_cast<int>(it - orden.begin());
}

std::string con_signo(int v)
{
	return v >= 0 ? format("+%d", v) : format("−%d", -v);
}

/** Ataques para la vista (los tres primeros perfiles). */
Json ataques(const Creature& c)
{
	Json out = Json::array();
	for (const Var& p : Battle::profiles_of(&c))
	{
		if (out.size() >= 3)
		{
			break;
		}
		StrList partes;
		const Var danos = p.get("damage");
		for (const Var& d : danos.arr())
		{
			partes.push_back(d.gets("dice") + " " + Loc::dmg_type(d.gets("type")));
		}
		Json a = Json::object();
		a["key"] = p.gets("key");
		a["name"] = p.gets("name");
		a["to_hit"] = p.geti("bonus");
		a["to_hit_text"] = con_signo(p.geti("bonus"));
		a["damage"] = join(partes, " + ");
		a["item_id"] = p.get("weapon").gets("item_id");
		out.push_back(a);
	}
	return out;
}

int pg_actuales(const Json& cp, const std::string& who, const Creature& c)
{
	return jint(jobj(jobj(cp, "state"), who), "hp", c.max_hp);
}

Json hueco(const std::string& key, const std::string& label, const std::string& id)
{
	Json o = Json::object();
	o["key"] = key;
	o["label"] = label;
	o["empty"] = id.empty();
	if (id.empty())
	{
		o["id"] = nullptr;
		return o;
	}
	const Json r = resumen(id, false);
	for (auto& kv : r.items())
	{
		o[kv.key()] = kv.value();
	}
	return o;
}

std::string nombre_municion(const std::string& k)
{
	if (k == "arrows")
	{
		return "Flechas";
	}
	if (k == "bolts")
	{
		return "Virotes";
	}
	if (k == "bullets")
	{
		return "Balas de honda";
	}
	return jstr(RulesDB::weapon(k), "name", k);
}

Json vista(const Json& cp, const std::string& who)
{
	CreaturePtr c = campana::criatura(cp, who, -1);
	const Json s = jobj(jobj(cp, "members"), who);
	Json slots = Json::object();
	Json orden = Json::array();
	const Json ws = jarr(s, "weapons");
	for (int i = 0; i < Items::kMaxWeapons; ++i)
	{
		const std::string key = format("weapon:%d", i);
		slots[key] = hueco(key, format("Arma %d", i + 1), i < static_cast<int>(ws.size()) ? jto_str(ws[static_cast<size_t>(i)]) : "");
		orden.push_back(key);
	}
	slots["armor"] = hueco("armor", "Armadura", jstr(s, "armor", ""));
	orden.push_back("armor");
	slots["shield"] = hueco("shield", "Escudo", jbool(s, "shield", false) ? jstr(s, "shield_id", "shield") : "");
	orden.push_back("shield");
	static const std::map<std::string, std::string> nombres_hueco = {{"cloak", "Capa"}, {"ring1", "Anillo"}, {"ring2", "Anillo"},
		{"amulet", "Amuleto"}, {"boots", "Botas"}, {"gloves", "Guantes"}};
	const Json& worn = jobj(s, "worn");
	for (const std::string& k : Items::kWornSlots)
	{
		const auto it = nombres_hueco.find(k);
		slots[k] = hueco(k, it == nombres_hueco.end() ? k : it->second, jstr(worn, k, ""));
		orden.push_back(k);
	}
	// Mochila: primero los objetos sueltos, después los que se apilan
	Json bolsa = Json::array();
	const Json& pack = jarr(s, "pack");
	for (size_t i = 0; i < pack.size(); ++i)
	{
		const std::string id = jstr(pack[i], "id", "");
		const bool unid = jbool(pack[i], "unid", false);
		Json e = resumen(id, unid);
		e["where"] = "pack";
		e["idx"] = static_cast<int>(i);
		e["n"] = 1;
		const std::string slot = unid ? std::string() : Items::slot_of(id);
		e["slot"] = slot;
		e["equippable"] = !slot.empty();
		e["value"] = Items::sell_value(id, unid);
		bolsa.push_back(e);
	}
	const Json& st = jobj(s, "items");
	StrList ids = jkeys(st);
	std::stable_sort(ids.begin(), ids.end(), [](const std::string& a, const std::string& b) { return orden_mochila(a) < orden_mochila(b); });
	for (const std::string& id : ids)
	{
		const int n = jint(st, id, 0);
		if (n <= 0)
		{
			continue;
		}
		Json e = resumen(id, false);
		e["where"] = "stack";
		e["n"] = n;
		std::string label = Items::name_of(id);
		if (Items::kind(id) == "wand")
		{
			const int cargas = jint(jobj(s, "charges"), id, 0);
			e["charges"] = cargas;
			label += format(" (%d cargas)", cargas);
		}
		else if (n > 1)
		{
			label += format(" ×%d", n);
		}
		e["label"] = label;
		e["usable"] = Items::kind(id) == "potion" && jobj(Items::data(id), "use").contains("heal");
		e["value"] = Items::sell_value(id);
		bolsa.push_back(e);
	}
	Json municion = Json::array();
	const Json& am = jobj(s, "ammo");
	for (auto& kv : am.items())
	{
		Json e = Json::object();
		e["key"] = kv.key();
		e["name"] = nombre_municion(kv.key());
		e["n"] = jto_int(kv.value());
		municion.push_back(e);
	}
	Json sintonia = Json::object();
	sintonia["n"] = static_cast<int>(Items::attuned(s).size());
	sintonia["max"] = Items::kMaxAttuned;
	Json stats = Json::object();
	stats["ac"] = c->ac();
	stats["hp"] = pg_actuales(cp, who, *c);
	stats["max_hp"] = c->max_hp;
	stats["speed"] = c->speed();
	stats["speed_text"] = Loc::ft(c->speed());
	stats["attacks"] = ataques(*c);
	Json abs = Json::object();
	for (const std::string& a : {"str", "dex", "con", "int", "wis", "cha"})
	{
		abs[a] = c->abilities.get(a, 10);
	}
	stats["abilities"] = abs;
	Json out = Json::object();
	out["who"] = who;
	out["name"] = c->name;
	out["short_name"] = campana::nombre_corto(cp, who);
	out["slots"] = slots;
	out["slot_order"] = orden;
	out["weapons"] = ws;
	out["bag"] = bolsa;
	out["ammo"] = municion;
	out["attuned"] = sintonia;
	out["gold"] = jint(cp, "gold", 0);
	out["stats"] = stats;
	out["dead"] = campana::muerto(cp, who);
	return out;
}

/** Id del objeto de la petición (cadena, o "id" de un objeto). */
std::string id_de(const Json& item)
{
	if (item.is_string())
	{
		return item.get<std::string>();
	}
	return jstr(item, "id", "");
}

/** Índice en la mochila del objeto de la petición ({idx}, número o id); -1 si no está. */
int indice_de(const Json& s, const Json& item)
{
	const Json& pack = jarr(s, "pack");
	int idx = -1;
	if (item.is_object() && item.contains("idx"))
	{
		idx = jint(item, "idx", -1);
	}
	else if (item.is_number())
	{
		idx = jto_int(item, -1);
	}
	else
	{
		const std::string id = id_de(item);
		for (size_t i = 0; i < pack.size(); ++i)
		{
			if (jstr(pack[i], "id", "") == id)
			{
				return static_cast<int>(i);
			}
		}
		return -1;
	}
	return idx >= 0 && idx < static_cast<int>(pack.size()) ? idx : -1;
}

bool es_de_mochila(const Json& item)
{
	return (item.is_object() && item.contains("idx")) || item.is_number();
}

Json con_cp(const Json& cp)
{
	Json o = Json::object();
	o["cp"] = cp;
	return o;
}

Json resultado(const Json& cp, bool ok, const std::string& reason, const std::string& text, bool con_texto = true)
{
	Json o = con_cp(cp);
	o["ok"] = ok;
	o["reason"] = reason;
	if (con_texto)
	{
		o["text"] = text;
	}
	return o;
}

Json cifras(const Creature& c)
{
	Json o = Json::object();
	o["ac"] = c.ac();
	o["speed"] = c.speed();
	o["max_hp"] = c.max_hp;
	o["attacks"] = ataques(c);
	return o;
}

Json cambio(const std::string& que, int de, int a)
{
	Json o = Json::object();
	o["what"] = que;
	o["from"] = de;
	o["to"] = a;
	o["better"] = a > de;
	return o;
}

Json vista_previa(const Json& cp, const std::string& who, const Json& req)
{
	const Json& s = jobj(jobj(cp, "members"), who);
	const int idx = indice_de(s, jat(req, "item"));
	Json out = Json::object();
	if (idx < 0)
	{
		out["ok"] = false;
		out["reason"] = "No existe ese objeto.";
		out["lines"] = Json::array({"No existe ese objeto."});
		return out;
	}
	const std::string id = jstr(jarr(s, "pack")[static_cast<size_t>(idx)], "id", "");
	CreaturePtr antes = campana::criatura(cp, who, -1);
	Json copia = cp;
	const std::string err = Items::equip(copia["members"][who], idx, jstr(req, "slot", ""));
	CreaturePtr despues = campana::criatura(copia, who, -1);
	out["ok"] = err.empty();
	out["reason"] = err;
	out["item"] = id;
	out["before"] = cifras(*antes);
	out["after"] = cifras(*despues);
	if (!err.empty())
	{
		out["lines"] = Json::array({err});
		return out;
	}
	Json lineas = Json::array();
	Json cambios = Json::array();
	if (despues->ac() != antes->ac())
	{
		lineas.push_back(format("CA %d → %d", antes->ac(), despues->ac()));
		cambios.push_back(cambio("ac", antes->ac(), despues->ac()));
	}
	const std::vector<Var> pb = Battle::profiles_of(antes.get());
	const std::vector<Var> pa = Battle::profiles_of(despues.get());
	if (Items::slot_of(id) == "weapon")
	{
		for (const Var& p : pa)
		{
			if (p.get("weapon").gets("item_id") == id)
			{
				StrList dados;
				const Var danos = p.get("damage");
				for (const Var& d : danos.arr())
				{
					dados.push_back(d.gets("dice"));
				}
				lineas.push_back("Con " + p.gets("name") + ": " + con_signo(p.geti("bonus")) + " · " + join(dados, " "));
				break;
			}
		}
	}
	else if (!pb.empty() && !pa.empty() && pa[0].geti("bonus") != pb[0].geti("bonus"))
	{
		lineas.push_back("Ataque " + con_signo(pb[0].geti("bonus")) + " → " + con_signo(pa[0].geti("bonus")));
		cambios.push_back(cambio("attack", pb[0].geti("bonus"), pa[0].geti("bonus")));
	}
	if (despues->speed() != antes->speed())
	{
		lineas.push_back("Velocidad " + Loc::ft(antes->speed()) + " → " + Loc::ft(despues->speed()));
		cambios.push_back(cambio("speed", antes->speed(), despues->speed()));
	}
	if (despues->max_hp != antes->max_hp)
	{
		lineas.push_back(format("PG máx. %d → %d", antes->max_hp, despues->max_hp));
		cambios.push_back(cambio("max_hp", antes->max_hp, despues->max_hp));
	}
	out["lines"] = lineas;
	out["changes"] = cambios;
	return out;
}

/** inv_give e inv_drop: saca el objeto de `who` y, si hay destinatario, se lo da. */
Json dar_o_dejar(Json& cp, const std::string& who, const std::string& to, const Json& req)
{
	Json& s = cp["members"][who];
	const Json& item = jat(req, "item");
	const std::string id = id_de(item);
	std::string nombre;
	if (!es_de_mochila(item) && (Items::stackable(id) || Items::kind(id) == "ammo"))
	{
		const int hay = jint(jobj(s, "items"), id, 0);
		int n = hay;
		if (jat(req, "n").is_number())
		{
			n = std::max(1, jint(req, "n", hay));
		}
		const int cargas = jint(jobj(s, "charges"), id, -1);
		const int quitadas = Items::take_stack(s, id, n);
		if (quitadas <= 0)
		{
			return resultado(cp, false, "No lo lleva.", "No lo lleva.");
		}
		nombre = Items::name_of(id) + (quitadas != 1 ? format(" ×%d", quitadas) : std::string());
		if (!to.empty())
		{
			Json& d = cp["members"][to];
			Json& dst = Items::stack(d);
			dst[id] = jint(dst, id, 0) + quitadas;
			if (cargas >= 0)
			{
				Json ch = jobj(d, "charges");
				ch[id] = cargas;
				d["charges"] = ch;
			}
		}
	}
	else
	{
		const int idx = indice_de(s, item);
		if (idx < 0)
		{
			return resultado(cp, false, "No lo lleva.", "No lo lleva.");
		}
		Json& pack = Items::pack(s);
		const Json e = pack[static_cast<size_t>(idx)];
		pack.erase(pack.begin() + idx);
		nombre = Items::name_of(jstr(e, "id", ""), jbool(e, "unid", false));
		if (!to.empty())
		{
			Items::pack(cp["members"][to]).push_back(e);
		}
	}
	const std::string yo = campana::nombre_corto(cp, who);
	const std::string texto =
		to.empty() ? yo + " deja " + nombre + "." : yo + " da " + nombre + " a " + campana::nombre_corto(cp, to) + ".";
	return resultado(cp, true, "", texto);
}

Json usar(Json& cp, const std::string& who, const Json& req, Pcg32& rng)
{
	const std::string id = id_de(jat(req, "item"));
	const Json d = Items::data(id);
	Json& s = cp["members"][who];
	if (id == "pearl_power" || jbool(jobj(d, "mods"), "pearl", false))
	{
		if (jbool(s, "pearl_used", false))
		{
			return resultado(cp, false, "La perla ya se ha usado hoy.", "La perla ya se ha usado hoy.");
		}
		CreaturePtr c = campana::criatura(cp, who, -1);
		Json& st = cp["state"][who];
		Json slots = jarr(st, "slots");
		for (int i = std::min(3, static_cast<int>(slots.size())) - 1; i >= 0; --i)
		{
			const int max_i = i < static_cast<int>(c->slots_max.size()) ? c->slots_max[static_cast<size_t>(i)] : 0;
			if (jto_int(slots[static_cast<size_t>(i)]) < max_i)
			{
				slots[static_cast<size_t>(i)] = jto_int(slots[static_cast<size_t>(i)]) + 1;
				st["slots"] = slots;
				s["pearl_used"] = true;
				return resultado(cp, true, "", format("Recuperas un espacio de conjuro de nivel %d.", i + 1));
			}
		}
		return resultado(cp, false, "No te falta ningún espacio de conjuro.", "No te falta ningún espacio de conjuro.");
	}
	const std::string k = Items::kind(id);
	if (k == "potion" && jobj(d, "use").contains("heal"))
	{
		std::string objetivo = jstr(req, "target", "");
		if (!campana::es_miembro(cp, objetivo))
		{
			objetivo = who;
		}
		if (jint(jobj(s, "items"), id, 0) <= 0)
		{
			return resultado(cp, false, "No lo lleva.", "", false);
		}
		if (campana::muerto(cp, objetivo))
		{
			return resultado(cp, false, "Ya no puede beber nada.", "", false);
		}
		CreaturePtr c = campana::criatura(cp, objetivo, -1);
		Json& st = cp["state"][objetivo];
		const int hp = jint(st, "hp", c->max_hp);
		if (hp >= c->max_hp)
		{
			return resultado(cp, false, "No le hace falta: está ileso.", "No le hace falta: está ileso.");
		}
		Items::take_stack(s, id, 1);
		const int cura = Dice::roll_with(jstr(jobj(d, "use"), "heal", "0"), rng);
		const int nuevo = std::min(c->max_hp, hp + cura);
		cp["state"][objetivo]["hp"] = nuevo;
		Json o = resultado(cp, true, "", "", false);
		o["healed"] = cura;
		o["hp"] = nuevo;
		o["max_hp"] = c->max_hp;
		o["text"] = format("%s recupera %d PG.", campana::nombre_corto(cp, objetivo).c_str(), cura);
		return o;
	}
	std::string motivo = "No se puede usar así.";
	if (k == "scroll" || k == "wand")
	{
		motivo = "Se usa en combate, desde el botón Objetos.";
	}
	else if (k == "potion")
	{
		motivo = "Se bebe en combate, desde el botón Objetos.";
	}
	return resultado(cp, false, motivo, motivo);
}

/** Género del comerciante guardado en la campaña (se crea con el de los datos la primera vez). */
Json& genero(Json& cp, const std::string& mid)
{
	Json& ms = cp["merchants"];
	if (!ms.is_object())
	{
		ms = Json::object();
	}
	if (!ms.contains(mid) || !ms[mid].is_object() || !ms[mid].contains("stock") || !ms[mid]["stock"].is_object())
	{
		Json m = Json::object();
		m["stock"] = jobj(jobj(RulesDB::merchants, mid), "stock");
		ms[mid] = m;
	}
	return ms[mid]["stock"];
}

int precio(const Json& tienda, const std::string& id)
{
	// Con un margen para que 50 × 1,1 no salga 56 por el error de coma flotante
	return static_cast<int>(std::ceil(Items::value(id) * jnum(tienda, "markup", 1.0) - 1e-9));
}

bool le_interesa(const Json& tienda, const std::string& id)
{
	return jin(jarr(tienda, "buys"), Items::kind(id));
}

Json ver_tienda(Json& cp, const std::string& mid, const std::string& who)
{
	const Json& tienda = jobj(RulesDB::merchants, mid);
	const Json stock = genero(cp, mid);
	const int oro = jint(cp, "gold", 0);
	StrList ids = jkeys(stock);
	std::stable_sort(ids.begin(), ids.end(), [](const std::string& a, const std::string& b) {
		const int oa = orden_tienda(a), ob = orden_tienda(b);
		return oa != ob ? oa < ob : Items::value(a) < Items::value(b);
	});
	Json genero_j = Json::array();
	for (const std::string& id : ids)
	{
		const int n = jint(stock, id, 0);
		if (n == 0 || !Items::exists(id))
		{
			continue;
		}
		Json e = resumen(id, false);
		const int p = precio(tienda, id);
		e["n"] = n;
		e["unlimited"] = n < 0;
		e["price"] = p;
		e["can_afford"] = oro >= p;
		e["label"] = Items::name_of(id) + (n < 0 ? std::string() : format("  (%d)", n));
		e["desc"] = join(lineas_objeto(id, false), "\n");
		genero_j.push_back(e);
	}
	StrList vendedores;
	if (!who.empty())
	{
		if (campana::es_miembro(cp, who) && !campana::muerto(cp, who))
		{
			vendedores.push_back(who);
		}
	}
	else
	{
		for (const std::string& id : jstrs(cp, "party"))
		{
			if (campana::es_miembro(cp, id) && !campana::muerto(cp, id))
			{
				vendedores.push_back(id);
			}
		}
	}
	Json compra = Json::array();
	for (const std::string& m : vendedores)
	{
		const Json& s = jobj(jobj(cp, "members"), m);
		const Json& pack = jarr(s, "pack");
		for (size_t i = 0; i < pack.size(); ++i)
		{
			const std::string id = jstr(pack[i], "id", "");
			const bool unid = jbool(pack[i], "unid", false);
			const int v = Items::sell_value(id, unid);
			if (!le_interesa(tienda, id) || v <= 0)
			{
				continue;
			}
			Json e = resumen(id, unid);
			e["who"] = m;
			e["where"] = "pack";
			e["idx"] = static_cast<int>(i);
			e["n"] = 1;
			e["price"] = v;
			compra.push_back(e);
		}
		const Json& st = jobj(s, "items");
		for (auto& kv : st.items())
		{
			const std::string id = kv.key();
			const int n = jto_int(kv.value());
			const int v = Items::sell_value(id);
			if (!le_interesa(tienda, id) || n <= 0 || v <= 0)
			{
				continue;
			}
			Json e = resumen(id, false);
			e["who"] = m;
			e["where"] = "stack";
			e["n"] = n;
			e["price"] = v;
			e["label"] = Items::name_of(id) + (n > 1 ? format(" ×%d", n) : std::string());
			compra.push_back(e);
		}
	}
	Json out = Json::object();
	out["id"] = mid;
	out["name"] = jstr(tienda, "name", "Tienda");
	out["npc"] = jstr(tienda, "who", "");
	out["markup"] = jat(tienda, "markup").is_null() ? Json(1.0) : jat(tienda, "markup");
	out["buys_kinds"] = jarr(tienda, "buys");
	out["stock"] = genero_j;
	out["buys"] = compra;
	out["gold"] = oro;
	out["who"] = who;
	return out;
}

Json comprar(Json& cp, const std::string& mid, const std::string& who, const Json& req)
{
	const Json& tienda = jobj(RulesDB::merchants, mid);
	Json& stock = genero(cp, mid);
	const std::string id = jstr(req, "item", "");
	const int n = std::max(1, jint(req, "n", 1));
	const int quedan = jint(stock, id, 0);
	const int total = precio(tienda, id) * n;
	std::string motivo;
	if (quedan == 0 || !Items::exists(id))
	{
		motivo = "No le queda.";
	}
	else if (quedan > 0 && n > quedan)
	{
		motivo = format("Solo le quedan %d.", quedan);
	}
	else if (jint(cp, "gold", 0) < total)
	{
		motivo = "No tenéis oro suficiente.";
	}
	Json out = con_cp(cp);
	if (!motivo.empty())
	{
		out["ok"] = false;
		out["reason"] = motivo;
		out["who"] = "";
		out["price"] = total;
		out["gold"] = jint(cp, "gold", 0);
		out["text"] = motivo;
		return out;
	}
	cp["gold"] = jint(cp, "gold", 0) - total;
	if (quedan > 0)
	{
		stock[id] = quedan - n;
	}
	const std::string receptor = campana::dar_objeto(cp, id, n, false, who);
	out = con_cp(cp);
	out["ok"] = true;
	out["reason"] = "";
	out["who"] = receptor;
	out["price"] = total;
	out["gold"] = jint(cp, "gold", 0);
	out["text"] = campana::nombre_corto(cp, receptor) + " compra: " + Items::name_of(id) + (n > 1 ? format(" ×%d", n) : std::string()) + ".";
	return out;
}

Json vender(Json& cp, const std::string& mid, const std::string& who, const Json& req)
{
	const Json& tienda = jobj(RulesDB::merchants, mid);
	Json& s = cp["members"][who];
	if (!s.is_object())
	{
		s = Json::object();
	}
	const Json& item = jat(req, "item");
	const std::string id = id_de(item);
	auto fallo = [&](const std::string& motivo) {
		Json o = resultado(cp, false, motivo, "", false);
		o["price"] = 0;
		o["gold"] = jint(cp, "gold", 0);
		o["text"] = motivo;
		return o;
	};
	int cobrado = 0;
	std::string nombre;
	const int idx = indice_de(s, item);
	if (es_de_mochila(item) || idx >= 0)
	{
		if (idx < 0)
		{
			return fallo("No lo lleva.");
		}
		Json& pack = Items::pack(s);
		const Json e = pack[static_cast<size_t>(idx)];
		const std::string eid = jstr(e, "id", "");
		const bool unid = jbool(e, "unid", false);
		const int v = Items::sell_value(eid, unid);
		if (!le_interesa(tienda, eid) || v <= 0)
		{
			return fallo("Eso no le interesa.");
		}
		pack.erase(pack.begin() + idx);
		cobrado = v;
		nombre = Items::name_of(eid, unid);
		if (!unid)
		{
			Json& stock = genero(cp, mid);
			if (jint(stock, eid, 0) >= 0)
			{
				stock[eid] = jint(stock, eid, 0) + 1;
			}
		}
	}
	else
	{
		const int v = Items::sell_value(id);
		if (!le_interesa(tienda, id) || v <= 0)
		{
			return fallo("Eso no le interesa.");
		}
		const int n = std::max(1, jint(req, "n", 1));
		const int quitadas = Items::take_stack(s, id, n);
		if (quitadas <= 0)
		{
			return fallo("No lo lleva.");
		}
		cobrado = v * quitadas;
		nombre = Items::name_of(id) + (quitadas > 1 ? format(" ×%d", quitadas) : std::string());
		Json& stock = genero(cp, mid);
		if (jint(stock, id, 0) >= 0)
		{
			stock[id] = jint(stock, id, 0) + quitadas;
		}
	}
	cp["gold"] = jint(cp, "gold", 0) + cobrado;
	Json o = resultado(cp, true, "", "", false);
	o["price"] = cobrado;
	o["gold"] = jint(cp, "gold", 0);
	o["text"] = format("Vendido: %s por %d po.", nombre.c_str(), cobrado);
	return o;
}

Json identificar(Json& cp, const Json& req)
{
	const int coste = jint(req, "cost", 0);
	if (coste > 0)
	{
		if (jint(cp, "gold", 0) < coste)
		{
			Json o = resultado(cp, false, "No tenéis oro suficiente.", "", false);
			o["identified"] = Json::array();
			return o;
		}
		cp["gold"] = jint(cp, "gold", 0) - coste;
	}
	StrList nombres;
	for (const std::string& id : jstrs(cp, "party"))
	{
		if (!campana::es_miembro(cp, id))
		{
			continue;
		}
		for (const std::string& n : Items::identify_all(cp["members"][id]))
		{
			nombres.push_back(n);
		}
	}
	Json o = resultado(cp, true, "", "", false);
	o["identified"] = to_json(nombres);
	o["text"] = nombres.empty() ? std::string("No hay nada que identificar.") : "Identificado: " + join(nombres, ", ") + ".";
	return o;
}

} // namespace

bool grupo_objetos(const std::string& op, const Json& req, Json& out)
{
	if (!contains(kOpsObjetos, op))
	{
		return false;
	}
	const Json& raw = jat(req, "cp");
	if (!raw.is_object())
	{
		out = error_json("Falta el documento de campaña (cp).");
		return true;
	}
	Json cp = raw;
	campana::normalizar(cp);
	if (op == "identify")
	{
		out = identificar(cp, req);
		return true;
	}
	if (op == "shop" || op == "shop_buy" || op == "shop_sell")
	{
		const std::string mid = jstr(req, "merchant", "");
		if (!RulesDB::merchants.is_object() || !RulesDB::merchants.contains(mid))
		{
			out = error_json("Ese comerciante no existe: " + mid);
			return true;
		}
		if (op == "shop")
		{
			out = ver_tienda(cp, mid, jstr(req, "who", ""));
			return true;
		}
		// Compra el pedido o, si no es del grupo, el primero que pueda usarlo (como cp_give);
		// vende el pedido o el primero vivo del grupo
		std::string who = jstr(req, "who", "");
		if (!campana::es_miembro(cp, who))
		{
			who = op == "shop_buy" ? std::string() : quien_de(cp, who);
		}
		genero(cp, mid);
		out = op == "shop_buy" ? comprar(cp, mid, who, req) : vender(cp, mid, who, req);
		return true;
	}
	const std::string who = quien_de(cp, jstr(req, op == "inv_give" ? "from" : "who", ""));
	if (!campana::es_miembro(cp, who))
	{
		out = error_json("No es del grupo: " + who);
		return true;
	}
	if (op == "inv")
	{
		out = vista(cp, who);
	}
	else if (op == "inv_preview")
	{
		out = vista_previa(cp, who, req);
	}
	else if (op == "inv_equip")
	{
		Json& s = cp["members"][who];
		const int idx = indice_de(s, jat(req, "item"));
		if (idx < 0)
		{
			out = resultado(cp, false, "No existe ese objeto.", "No existe ese objeto.");
			return true;
		}
		const std::string id = jstr(jarr(s, "pack")[static_cast<size_t>(idx)], "id", "");
		const std::string err = Items::equip(s, idx, jstr(req, "slot", ""));
		out = err.empty() ? resultado(cp, true, "", campana::nombre_corto(cp, who) + " se equipa: " + Items::name_of(id) + ".")
						  : resultado(cp, false, err, err);
	}
	else if (op == "inv_unequip")
	{
		Items::unequip(cp["members"][who], jstr(req, "slot", ""));
		out = resultado(cp, true, "", "Guardado en la mochila.");
	}
	else if (op == "inv_give")
	{
		const std::string to = jstr(req, "to", "");
		if (to.empty() || !campana::es_miembro(cp, to) || to == who)
		{
			out = resultado(cp, false, "Elige a otro miembro del grupo.", "", false);
			return true;
		}
		out = dar_o_dejar(cp, who, to, req);
	}
	else if (op == "inv_drop")
	{
		out = dar_o_dejar(cp, who, "", req);
	}
	else
	{
		Pcg32 local;
		out = usar(cp, who, req, rng_de(req, local));
	}
	return true;
}

} // namespace mdg::web
