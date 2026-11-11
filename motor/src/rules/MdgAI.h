// Marca de Granito · núcleo de reglas portable.
// IA de utilidad para monstruos y compañeros en modo automático. Evalúa (casilla de destino ×
// acción × objetivo) y ejecuta la mejor opción; las acciones adicionales y los rasgos de clase
// se deciden con reglas tácticas. Traducción de ai_brain.gd.
#pragma once

#include "MdgBattle.h"

namespace mdg
{

class AIBrain
{
public:
	explicit AIBrain(Battle& battle) : b(battle) {}

	/** Ampliación: "" (la IA publicada) o "tactico" (compañeros más cuidadosos; ver MdgAI.cpp). */
	std::string modo;

	Battle& b;
	bool debug = false;

	/** Juega el turno de `c` (sin terminarlo; quien llama hace end_turn). */
	void take_turn(Creature* c);
	void stand_up(Creature* c);
	void begin_plan();
	/** Daño que podrían hacerme los enemigos en su próximo turno si estoy en `cell`. */
	double threat_at(Creature* c, const Cell& cell);
	/** Prioridad de un objetivo: amenaza, fragilidad y concentración. */
	double target_value(Creature* c, Creature* t);
	double target_value_base(Creature* c, Creature* t);
	/** Ampliaciones: preferencias de la araña gigante y del modo táctico (0 en la IA publicada). */
	double target_bonus(Creature* c, Creature* t);
	/** Castigo que la IA arma antes de atacar (se gasta solo si impacta). */
	Var choose_rider(Creature* c, const Var& p, Creature* t);

private:
	struct Summary
	{
		bool melee = false;
		int reach = 1;
		int rmin = 0;
		int rmax = 0;
		double avg = 0.0;
		int bonus = 0;
		double mult = 1.0;
	};
	struct Dest
	{
		Cell cell;
		int cost = 0;
		bool dash = false;
	};

	std::unordered_map<std::string, std::vector<Summary>> enemy_summary_;
	Dict<double> tv_cache_;
	std::unordered_map<int, double> threat_cache_;
	Battle::MoveOptions opts_cache_;
	std::string opts_key_;

	bool step(Creature* c);
	std::string profile(const Creature* c) const { return c->ai_profile; }
	bool ranged_minded(const Creature* c) const;
	double risk_weight(const Creature* c) const;
	const std::vector<Summary>& summary(Creature* e);
	double kill_bonus(Creature* t);
	const Battle::MoveOptions& move_opts(Creature* c);
	std::vector<Dest> destinations(Creature* c, bool allow_dash = false);
	std::vector<Cell> path_for(Creature* c, const Cell& cell, bool dash);
	double oa_cost(Creature* c, const std::vector<Cell>& path);
	double zone_cost(Creature* c, const std::vector<Cell>& path, const Cell& end_cell);
	Var best_plan(Creature* c);
	bool reckless_worth(Creature* c, const Var& p, Creature* t);
	int min_enemy_dist(const Cell& cell, const std::vector<Creature*>& enemies) const;
	double position_bonus(Creature* c, const Cell& cell);
	Var fallback(Creature* c, const std::vector<Creature*>& enemies);
	double slot_cost(Creature* c, const Var& s, const Json& sp, int slot);
	double concentration_value(Creature* c);
	Var best_spell_use(Creature* c, const Var& s, const Cell& cell);
	Var best_point_use(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v, const std::string& meta);
	Var self_spell(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v);
	Var flaming_sphere_plan(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v);
	Var distribute(Creature* c, const std::string& sid, const std::vector<Creature*>& targets, int n, int slot);
	Var support_spell(Creature* c, const std::string& sid, const Json& sp, int slot, const Cell& cell, double slot_cost_v);
	Creature* best_frontliner(Creature* c, const std::vector<Creature*>& allies);
	double attack_power(Creature* c);
	Var channel_divinity(Creature* c, const Cell& cell);
	Var lands_aid_plan(Creature* c, const Cell& cell);
	Var zone_move_plan(Creature* c, const Var& z);
	Var breath_plan(Creature* c, const std::vector<Creature*>& enemies);
	std::string pick_metamagic(Creature* c, const Json& sp, int slot);
	bool pre_bonus(Creature* c);
	bool has_boss(const std::vector<Creature*>& enemies) const;
	Cell safest_cell_within(Creature* c, int rng);
	bool post_bonus(Creature* c);
	Var offhand_profile(Creature* c);
	int adjacent_enemies(Creature* c, const Cell& cell);
	bool ally_adjacent_to(Creature* c, Creature* t);
	Creature* best_enemy_adjacent(Creature* c);
	Creature* best_enemy_near(Creature* c, const Cell& cell, int rng);
	Cell free_adjacent(const Cell& cell);
	bool move_spiritual_weapon(Creature* c);
	void execute(Creature* c, const Var& plan);
	bool should_surge(Creature* c);
	void reposition(Creature* c);
	double reposition_score(Creature* c, const Cell& cell);
	void flee_from(Creature* c, Creature* from);
};

} // namespace mdg
