// Marca de Granito · núcleo de reglas portable.
// Lanzamiento y resolución de conjuros (SRD 5.2.1) dentro de un Battle. Casi todo es genérico
// y sale de spells.json: ataque/salvación, daño, efecto, área, zona persistente y castigos.
// Lo singular vive en special(). Traducción de spell_resolver.gd.
#pragma once

#include "MdgBattle.h"

namespace mdg
{

class SpellResolver
{
public:
	explicit SpellResolver(Battle& battle) : b(battle) {}

	Battle& b;

	static int meta_cost(const std::string& meta);
	static double control_weight_of(const std::string& kind);

	// ---------------------------------------------------------------- consulta
	int spell_cells(const Json& sp, const Creature* c = nullptr, const std::string& meta = "") const;
	int cantrip_mult(const Creature* c) const;
	std::string parent_of(const std::string& sid) const;
	/** Conjuros utilizables ahora (interfaz e IA): [{id, name, level, cost, target, usable, reason, slots, free, ...}]. */
	std::vector<Var> available(Creature* c);
	std::vector<Creature*> valid_targets(Creature* c, const std::string& sid, std::optional<Cell> from_cell = std::nullopt,
		const std::string& meta = "");
	std::vector<Cell> area_cells(Creature* c, const std::string& sid, const Var& data, std::optional<Cell> from_cell = std::nullopt,
		int slot = -1);
	std::vector<Creature*> creatures_in(const std::vector<Cell>& cells, const Creature* exclude = nullptr) const;
	bool point_in_range(Creature* c, const std::string& sid, const Vec2& point, std::optional<Cell> from_cell = std::nullopt,
		const std::string& meta = "");
	std::vector<Creature*> area_targets(Creature* c, const std::string& sid, const Var& data, std::optional<Cell> from_cell = std::nullopt,
		int slot = -1);

	// ---------------------------------------------------------------- previsión
	std::string damage_type(Creature* c, const Json& sp, Creature* t, const Var& data) const;
	std::string damage_expr(const Creature* c, const Json& sp, int slot) const;
	std::string heal_expr(const Creature* c, const Json& sp, int slot, const std::string& sid = "") const;
	int save_dc(const Creature* c, const std::string& sid) const;
	int attack_bonus(const Creature* c, const std::string& sid) const;
	int max_targets(const Json& sp, int slot, const std::string& meta = "") const;
	int n_darts(const Creature* c, const Json& sp, int slot) const;
	/** {enemy_dmg, ally_dmg, heal, affected, control, kills}. */
	Var preview(Creature* c, const std::string& sid, int slot, const Var& data, std::optional<Cell> from_cell = std::nullopt);
	int roll_damage(Creature* c, const Json& sp, const std::string& expr, bool crit = false, const Var& data = Var());

	// ---------------------------------------------------------------- lanzamiento
	/** data: {targets:[ids], point:Vector2, dir:Vector2, cell:Vector2i, cmd, dtype, meta, item}. Se modifica (slot). */
	bool cast(Creature* c, const std::string& sid, int slot, Var data);
	Var item_cost(Creature* c, const std::string& item_id, const std::string& sid, int slot);
	bool cast_reaction(Creature* c, const std::string& sid, Creature* target);
	Var true_strike_profile(Creature* c, Creature* t, std::optional<Cell> from_cell = std::nullopt);
	bool move_zone_action(Creature* c, int zid, const Vec2& point);
	bool spiritual_weapon_turn(Creature* c, const Cell& to, Creature* target);
	void flaming_sphere_hit(Var tk, Creature* t);
	bool flaming_sphere_turn(Creature* c, Creature* target);

	// ---------------------------------------------------------------- castigos
	std::vector<Var> rider_options(Creature* c, const Var& p);
	Var apply_rider_damage(Creature* a, Creature* t, const Var& p, const Var& rider, bool crit, Var parts);
	void apply_rider_after(Creature* a, Creature* t, const Var& p, const Var& info);

private:
	bool has_any_target(Creature* c, const std::string& sid);
	Var weapon_profile_for(Creature* c, Creature* t, const Cell& fc);
	int area_radius(const Json& sp, int slot) const;
	double control_weight(const Json& sp) const;
	Var slot_cost_ok(Creature* c, const std::string& sid, const Json& sp, int slot);
	bool validate(Creature* c, const std::string& sid, int slot, const Var& data);
	void resolve(Creature* c, const std::string& sid, const Json& sp, int slot, Var data);
	bool resolve_special(Creature* c, const std::string& sid, const Json& sp, int slot, Var data, const std::string& kind);
	EffectPtr self_marker(Creature* c, const std::string& kind, const std::string& name, int rounds, const Var& data);
	void spell_attack(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, Var data);
	void after_spell_attack(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, const Var& data, bool hit);
	void apply_on_hit(Creature* c, Creature* t, const std::string& sid, const Json& sp, int dealt, int slot);
	void chromatic_leap(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, const Var& data);
	void ice_knife_burst(Creature* c, Creature* t, const Json& sp, int slot);
	void single_save(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, const Var& data);
	void apply_on_fail(Creature* c, Creature* t, const std::string& sid, const Json& sp, int slot, int dc);
	void resolve_area(Creature* c, const std::string& sid, const Json& sp, int slot, const Var& data);
	void create_zone(Creature* c, const std::string& sid, const Json& sp, int slot, const Var& data, const std::vector<Cell>& cells, int dc);
	void cast_sleep(Creature* c, const Json& sp, const Var& data);
	void cast_magic_missile(Creature* c, const Json& sp, int slot, const Var& ids);
	void cast_spiritual_weapon(Creature* c, const Json& sp, int slot, const Var& data);
	Creature* sw_auto_target(Creature* c, const Cell& cell);
	void sw_attack(Creature* c, Creature* t, int slot);
	void cast_flaming_sphere(Creature* c, const std::string& sid, const Json& sp, int slot, const Var& data);
	bool c_free(const Creature* a, const std::string& sid) const;
};

} // namespace mdg
