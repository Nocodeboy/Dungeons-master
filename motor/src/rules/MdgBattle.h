// Marca de Granito · núcleo de reglas portable.
// Estado y resolución de un combate por turnos con reglas 5e (SRD 5.2.1). No sabe nada de
// gráficos: genera una cola de eventos que la vista reproduce. Traducción de battle.gd.
#pragma once

#include "MdgBattleMap.h"
#include "MdgCreature.h"
#include "MdgDice.h"
#include "MdgFactory.h"
#include "MdgVar.h"

#include <functional>
#include <memory>
#include <optional>

namespace mdg
{

class SpellResolver;
class ClassActions;

class Battle
{
public:
	static const StrList kPhysical;

	BattleMap map;
	Dice dice;
	/** Las criaturas del combate (dueño). */
	std::vector<CreaturePtr> creatures;
	/** Orden de iniciativa. */
	std::vector<Creature*> order;
	int turn_index = -1;
	int round_num = 0;
	Creature* current = nullptr;
	/** Cola de eventos para la vista (diccionarios con "t"). */
	std::vector<Var> events;
	StrList log_lines;
	bool over = false;
	int winner = -1;
	Var settings;
	/** Invocaciones: id -> {kind, owner, cell, ...}. */
	Var tokens;
	/** Zonas de conjuro persistentes. */
	std::vector<Var> zones;
	std::unique_ptr<SpellResolver> spells;
	std::unique_ptr<ClassActions> cls;
	Json encounter = Json::object();
	/** Sorpresa: ids con desventaja en la iniciativa y PJ que empiezan ocultos (con su Sigilo). */
	Dict<bool> surprised;
	Dict<int> start_hidden;
	int turn_counter = 0;
	// ---------------------------------------------------------------- ampliación: reacciones manuales
	/** Reacción de una unidad en modo manual que aún no tiene respuesta: la resolución se corta aquí. */
	struct ReactionPending
	{
		Var info;
	};
	/** Unidades (por id) y bandos ("0", "1") cuyas reacciones decide el jugador. */
	Dict<bool> manual_units;
	Dict<bool> manual_teams;
	/** Respuestas para la acción en curso (1 usar, 0 omitir), en el orden en que se preguntan. */
	std::vector<int> reaction_answers;
	size_t reaction_cursor = 0;
	bool is_manual(const Creature* c) const;
	/** -1: decide el núcleo (modo automático); 0: omitir; 1: usar. Sin respuesta: lanza ReactionPending. */
	int manual_choice(Creature* c, const Var& info);
	/** Estado del generador justo después de crearlo y estado impuesto para rehacer un combate. */
	uint64_t rng_initial_s = 0;
	uint64_t rng_initial_i = 0;
	static bool forced_rng;
	static uint64_t forced_rng_s;
	static uint64_t forced_rng_i;

	// ---------------------------------------------------------------- ampliación: retirada y telaraña (MdgAmpliaciones.cpp)
	/** Si el grupo puede retirarse ahora, quién provocaría ataques de oportunidad y qué cuesta. */
	Var retreat_info();
	/** Retirada del grupo: ataques de oportunidad de quien tenga a alguien a su alcance y fin del combate. */
	Var do_retreat();
	/** Criaturas atrapadas en la telaraña de una araña gigante que `c` puede alcanzar (ella misma incluida). */
	std::vector<Creature*> web_targets(Creature* c);
	/** Ataque de `c` contra la telaraña que atrapa a `trapped` (CA 10, 5 PG, vulnerable al fuego). */
	bool break_web(Creature* c, Creature* trapped);

	/** Aviso de cambios para la interfaz (la señal `changed` de Godot). */
	std::function<void()> on_changed;

	explicit Battle(BattleMap p_map, int64_t p_seed = -1);
	~Battle();
	Battle(const Battle&) = delete;
	Battle& operator=(const Battle&) = delete;

	// ---------------------------------------------------------------- utilidades
	Creature* add_creature(CreaturePtr c);
	Creature* get_creature(const std::string& cid) const;
	Occupancy occupancy() const;
	Creature* creature_at(const Cell& cell) const;
	std::vector<Creature*> allies_of(const Creature* c, bool include_self = false) const;
	std::vector<Creature*> enemies_of(const Creature* c) const;
	std::vector<Creature*> living(int team) const;
	std::vector<Creature*> standing(int team) const;
	std::vector<Cell> blockers_for(const Creature* a, const Creature* b) const;
	int cover(Creature* a, Creature* b, std::optional<Cell> from_cell = std::nullopt);
	bool can_see(Creature* a, Creature* b, std::optional<Cell> from_cell = std::nullopt) { return sees(a, b, from_cell); }
	void emit(const Var& e);
	void log_msg(const std::string& text);
	std::vector<Var> pop_events();
	static std::string nm(const Creature* c) { return c != nullptr ? c->name : "?"; }
	bool pc_reacts(const Creature* c) const;

	// ---------------------------------------------------------------- visión
	bool sees(Creature* v, Creature* t, std::optional<Cell> vcell = std::nullopt, std::optional<Cell> tcell = std::nullopt);
	int obscure_at(const Cell& cell) const;
	bool clear_sight(Creature* v, const Cell& vc, const Cell& tc) const;

	// ---------------------------------------------------------------- flujo
	void start();
	void end_turn();
	bool check_end();

	// ---------------------------------------------------------------- efectos
	EffectPtr attach_effect(Creature* target, const EffectPtr& e);
	void remove_effect(const EffectPtr& e, bool announce = true);
	void add_condition(Creature* c, const std::string& cond, const std::string& source);
	void remove_condition(Creature* c, const std::string& cond, const std::string& source = "");
	EffectPtr start_concentration(Creature* caster, const std::string& spell_id, int rounds);
	void link_to_concentration(Creature* caster, const EffectPtr& e);
	void end_concentration(Creature* caster, bool announce = false);
	/** Efecto descrito en datos: {kind, name, grants, positive, expires "cuando:quién", rounds, save_end, dot, escape, data}. */
	EffectPtr apply_effect_spec(Creature* target, const Var& spec, Creature* caster, const std::string& sid = "", int slot = 0,
		int dc = -1, bool link = true);

	// ---------------------------------------------------------------- zonas
	int add_zone(Var z);
	void remove_zone(int zid);
	Var get_zone(int zid) const;
	void move_zone(int zid, const Var& cells);
	std::vector<Var> zones_at(const Cell& cell) const;
	void zone_damage_save(Creature* c, Var z);

	// ---------------------------------------------------------------- tiradas
	/** opts: {auto_success, vs, conc, advantage, disadvantage, bonus, silent}. */
	Var saving_throw(Creature* c, const std::string& ab, int dc, Creature* source = nullptr, const Var& opts = Var());
	Var ability_check(Creature* c, const std::string& skill, int mode = 0);

	// ---------------------------------------------------------------- daño y curación
	double damage_multiplier(const Creature* target, const std::string& dtype) const;
	/** opts: {crit, raw, bond, magic, dot}. Devuelve el daño efectivo. */
	int apply_damage(Creature* target, int amount, const std::string& dtype, Creature* source = nullptr, const Var& opts = Var());
	void stabilize(Creature* c);
	int heal(Creature* target, int amount, Creature* source = nullptr, bool quiet = false);
	void gain_temp_hp(Creature* target, int amount);

	// ---------------------------------------------------------------- ataques
	std::vector<Var> attack_profiles(const Creature* c) const { return profiles_of(c); }
	/** Perfiles de ataque de una criatura (no depende del estado del combate: lo usa la hoja). */
	static std::vector<Var> profiles_of(const Creature* c);
	Var profile_by_key(const Creature* c, const std::string& key) const;
	bool in_attack_range(const Creature* c, const Var& p, const Creature* target, std::optional<Cell> from_cell = std::nullopt) const;
	Var best_melee_profile(const Creature* c) const;
	bool may_target(const Creature* a, const Creature* t) const;
	Var attack_mode(Creature* a, Creature* t, const std::string& kind, std::optional<Cell> from_cell = std::nullopt,
		const Var& p = Var());
	void consume_attack_effects(Creature* a, Creature* t, const Var& mode_info);
	int roll_attack_mods(Creature* a);
	int target_ac(Creature* t, Creature* a, std::optional<Cell> from_cell = std::nullopt, bool ignore_cover = false);
	int crit_range_for(const Creature* a, const std::string& kind) const;
	Var preview_attack(Creature* a, const Var& p, Creature* t, std::optional<Cell> from_cell = std::nullopt, const Var& opts = Var());
	Var extra_damage_preview(Creature* a, const Var& p, Creature* t, int mode, const Cell& fc, const Var& opts = Var());
	int attacks_per_action(const Creature* c) const;
	bool can_start_attack(const Creature* c, const Var& p) const;
	/** opts: {oa, offhand, cleave, bonus_strike, flurry, technique, rider, true_strike, free, horde}. */
	Var do_attack(Creature* a, const std::string& key, Creature* t, const Var& opts = Var());
	Var resolve_weapon_attack(Creature* a, const Var& p, Creature* t, const Var& opts);
	bool mirror_absorbs(Creature* a, Creature* t);
	bool try_shield(Creature* t, int attack_total, int ac, double avg_dmg = -1.0);
	int try_cutting_words(Creature* a, Creature* t, int total, int ac);

	// ---------------------------------------------------------------- movimiento forzado
	void push_away(Creature* t, const Cell& from_cell, int cells);
	void pull_toward(Creature* t, const Cell& to_cell, int cells);
	void teleport(Creature* c, const Cell& to);

	// ---------------------------------------------------------------- movimiento
	struct MoveOptions
	{
		CellMap<int> cost;
		CellMap<Cell> prev;
		CellMap<int> dash_cost;
		CellMap<Cell> dash_prev;
		bool crawl = false;
	};
	MoveOptions move_options(Creature* c);
	/** Ataques de oportunidad que provocaría el camino: [{enemy, at}]. */
	std::vector<std::pair<Creature*, Cell>> path_threats(Creature* c, const std::vector<Cell>& path);
	Cell do_move(Creature* c, std::vector<Cell> path, bool use_dash = false);
	void forced_flee(Creature* c, Creature* from);
	bool can_undo_move(const Creature* c) const;
	void undo_move(Creature* c);

	// ---------------------------------------------------------------- ocultarse
	void reveal(Creature* c);
	bool can_hide(Creature* c);

	// ---------------------------------------------------------------- acciones
	/** Comprueba y gasta: "action" | "bonus" | "free". */
	bool spend(Creature* c, const std::string& cost);
	bool do_dash(Creature* c, bool bonus = false);
	bool do_disengage(Creature* c, bool bonus = false);
	void add_dodge(Creature* c);
	bool do_dodge(Creature* c);
	bool do_hide(Creature* c, bool bonus = false);
	bool do_search(Creature* c);
	bool do_help(Creature* c, Creature* target);
	bool do_stabilize(Creature* c, Creature* target);
	bool do_wake(Creature* c, Creature* target);
	EffectPtr escape_effect(const Creature* c) const;
	bool do_escape(Creature* c);
	bool do_potion(Creature* c, Creature* target);
	StrList usable_potions(const Creature* c) const;
	bool do_item(Creature* c, Creature* target, const std::string& item_id);
	bool do_second_wind(Creature* c);
	bool do_action_surge(Creature* c);
	bool do_steady_aim(Creature* c);
	bool do_shove(Creature* c, Creature* target, bool prone = true);
	bool do_divine_spark(Creature* c, Creature* target);
	bool do_turn_undead(Creature* c);
	bool do_preserve_life(Creature* c);
	bool do_life_drain(Creature* a, Creature* t);
	void end_rage(Creature* c);

	// Usados por SpellResolver y ClassActions
	void reveal_quiet_drop(Creature* c) { drop_hidden(c); }

private:
	int zone_seq_ = 0;

	bool tracks(const Creature* v, const Creature* t) const;
	void next_turn();
	bool can_still_move(const Creature* c) const;
	void begin_turn(Creature* c);
	void start_turn_effects(Creature* c);
	void finish_turn(Creature* c);
	void expire_effects(const std::string& when, const Creature* who);
	void tick_rounds(Creature* who);
	void refresh_zone_overlay();
	void tick_zones(const Creature* who);
	void zone_turn_trigger(Creature* c, const std::string& when);
	void zone_enter(Creature* c, const Cell& cell, const Cell& prev);
	void zone_save(Creature* c, Var z, const Var& trig);
	void after_damage(Creature* target, int dmg, Creature* source, const std::string& dtype = "");
	void damage_reactions(Creature* target, Creature* source);
	void fall_unconscious(Creature* c, Creature* source);
	void kill(Creature* c, Creature* source);
	void on_dropped(Creature* c, Creature* source);
	void add_death_failure(Creature* c, int n);
	void death_save(Creature* c);
	bool sneak_eligible(Creature* a, Creature* t, const Var& p, int mode, const Cell& from_cell);
	Creature* horde_target(Creature* a, const Var& p, Creature* first);
	Creature* redirect_candidate(Creature* t, Creature* attacker);
	Var weapon_damage_parts(Creature* a, const Var& p, Creature* t, bool crit, const Var& mi, const Var& opts);
	Var offhand_weapon(const Creature* a, const Var& main) const;
	void on_hit_effects(Creature* a, const Var& p, Creature* t, int dmg, const Var& opts);
	Creature* cleave_target(Creature* a, Creature* first);
	bool try_deflect(Creature* t, Creature* a, Var parts, const std::string& kind);
	bool can_dash(const Creature* c) const;
	Var walk(Creature* c, const std::vector<Cell>& path, bool dashing, bool crawl, bool spend_move);
	void spend_dash(Creature* c);
	void drop_hidden(Creature* c);
	void check_reveal_by_position(Creature* c);
	void revert_form(Creature* c);
	void flaming_sphere_end_turn(Creature* c);
	void expire_end_turn_next(const Creature* who);
	void changed();

	friend class SpellResolver;
	friend class ClassActions;
};

} // namespace mdg
