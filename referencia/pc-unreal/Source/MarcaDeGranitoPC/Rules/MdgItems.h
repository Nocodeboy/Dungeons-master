// Marca de Granito · núcleo de reglas portable.
// Objetos: datos (items.json + armas y armaduras normales), precios y las operaciones de
// inventario y equipo sobre una hoja de personaje. Traducción de scripts/core/items.gd
// (sin la parte de textos de interfaz, que irá con la localización).
//
// En la hoja:
//   weapons: [ids]        armas a mano (la primera es la principal)
//   armor: id             armadura ("" sin armadura)
//   shield: bool          lleva escudo; shield_id: qué escudo ("shield", "shield_p1")
//   worn: {slot: id}      cloak, ring1, ring2, amulet, boots, gloves
//   items: {id: n}        objetos apilables (pociones, pergaminos, herramientas, tesoros, llaves)
//   pack: [{id, unid}]    equipo sin equipar
//   ammo: {clave: n}      munición (arrows, bolts, bullets) y armas arrojadizas de repuesto
//   charges: {id: n}      cargas de las varitas
#pragma once

#include "MdgJson.h"

namespace mdg
{

/** Modificadores de los objetos equipados (capa, anillos, botas...). */
struct WornMods
{
	int ac = 0;
	int saves = 0;
	int checks = 0;
	int ac_unarmored = 0;
	int tools = 0;
	Dict<int> set;
	Dict<int> skill;
	StrList adv;
	StrList resist;
	StrList immune_spell;
	int speed_min = 0;
	bool ignore_armor_speed = false;
	bool wound_closure = false;
	bool pearl = false;
};

class Items
{
public:
	static constexpr int kMaxWeapons = 4;
	static constexpr int kMaxAttuned = 3;
	static const StrList kWornSlots;

	/** Grupo de munición de un arma ("longbow" -> "arrows"); si no tiene, el propio id. */
	static std::string ammo_group(const std::string& weapon_base);

	static Json data(const std::string& id);
	static bool exists(const std::string& id) { return !data(id).empty(); }
	static std::string kind(const std::string& id);
	/** Arma o armadura base ("longsword_p1" -> "longsword"). */
	static std::string base_of(const std::string& id);
	static int bonus(const std::string& id);
	static bool is_magic(const std::string& id);
	static std::string rarity(const std::string& id);
	static bool needs_attunement(const std::string& id);
	/** weapon, armor, shield, cloak, ring, amulet, boots, gloves; "" si no se equipa. */
	static std::string slot_of(const std::string& id);
	static bool stackable(const std::string& id);
	static std::string name_of(const std::string& id, bool unid = false);
	static std::string icon_of(const std::string& id);
	/** Precio de compra en piezas de oro (mínimo 1). */
	static int value(const std::string& id);
	/** Lo que paga un comerciante. */
	static int sell_value(const std::string& id, bool unid = false);

	/** Arma lista para Factory: datos base + bonificador mágico (id = base, item_id = objeto). */
	static Json weapon_entry(const std::string& id);
	static std::string armor_base(const std::string& id) { return !id.empty() ? base_of(id) : std::string(); }

	// Inventario de una hoja
	static Json& pack(Json& s);
	static Json& stack(Json& s);
	static void add_to(Json& s, const std::string& id, int n = 1, bool unid = false);
	static bool uses_ammo(const Json& s, const std::string& key);
	static int take_stack(Json& s, const std::string& id, int n = 1);
	static int count(Json& s, const std::string& id);
	static StrList attuned(const Json& s);
	/** "" si se pudo equipar o el motivo por el que no. */
	static std::string equip(Json& s, int idx, const std::string& ring_slot = "");
	static std::string unequip(Json& s, const std::string& slot);
	static StrList identify_all(Json& s);
	/** Normaliza una hoja antigua: escudo, munición por grupos y huecos vacíos. */
	static void normalize(Json& s);
	static WornMods worn_mods(const Json& s);
	static bool can_read_scroll(const Json& s, const std::string& id);
	static bool can_use_wand(const Json& s, const std::string& id);

private:
	static void sync_thrown_ammo(Json& s, const std::string& id);
};

} // namespace mdg
