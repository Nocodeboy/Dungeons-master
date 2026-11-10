// Marca de Granito · núcleo de reglas portable.
// Una criatura en combate: personaje jugador, compañero o monstruo. Solo datos y cálculos de
// reglas; la resolución vive en Battle. Traducción directa de scripts/core/creature.gd.
#pragma once

#include "MdgEffect.h"
#include "MdgVar.h"

namespace mdg
{

/** Estado del turno en curso (el diccionario `turn` de la versión de Godot). */
struct TurnState
{
	int action = 1;
	int bonus = 1;
	int reaction = 1;
	int movement = 0;
	bool moved = false;
	int moved_cells = 0;
	int attack_left = 0;
	std::string attack_source;
	bool light_attack_used = false;
	bool offhand_ready = false;
	bool nick_used = false;
	bool nick_ready = false;
	bool sneak_used = false;
	bool savage_used = false;
	bool cleave_used = false;
	bool disengaged = false;
	bool slot_spell_cast = false;
	bool action_surge_used = false;
	bool acted = false;
	Cell start_cell;
	Cell undo_cell;
	int undo_movement = 0;
	bool can_undo = true;
	bool attacked = false;
	bool attack_action = false;
	bool rage_extended = false;
	bool colossus_used = false;
	bool horde_used = false;
	bool frenzy_used = false;
	bool giant_used = false;
	bool life_drain_used = false;
	StrList attacked_ids;
	int straight_cells = 0;
	/** Id de la última arma usada. */
	std::string last_weapon;
	/** false hasta el primer reset_turn (el diccionario vacío de Godot). */
	bool started = false;
};

struct Creature
{
	static const StrList kAbilities;
	static const StrList kSizes;
	static const StrList kProtEvilTypes;
	static int size_order(const std::string& size);
	static std::string skill_ability(const std::string& skill);

	// --- Identidad ---
	std::string id;
	std::string template_id;
	std::string name;
	std::string title;
	/** 0 = grupo del jugador, 1 = enemigos. */
	int team = 0;
	bool is_pc = false;
	bool controlled_by_player = false;
	int level = 1;
	std::string cls;
	std::string subclass;
	std::string species;
	std::string lineage;
	std::string ancestry;
	std::string background;
	Json sheet = Json::object();
	std::string size = "medium";
	std::string ctype = "humanoid";
	StrList tags;
	std::string pronoun = "m";
	std::string ai_profile = "brute";
	Json visual = Json::object();
	int xp = 0;
	std::string cr;

	// --- Estadísticas ---
	Dict<int> abilities;
	StrList save_profs;
	Dict<int> save_overrides;
	StrList skill_profs;
	StrList expertise;
	Dict<int> skill_overrides;
	int prof_bonus = 2;
	int init_bonus_override = -999;
	int max_hp = 1;
	int hp = 1;
	int temp_hp = 0;
	int base_speed = 30;
	int fixed_ac = -1;
	std::string armor_id;
	bool has_shield = false;
	// Objetos mágicos equipados
	int armor_bonus = 0;
	int shield_bonus = 0;
	int item_ac = 0;
	int item_ac_unarmored = 0;
	int item_saves = 0;
	int item_checks = 0;
	int item_tools = 0;
	Dict<int> item_skill;
	/** Habilidades con ventaja (Sigilo con botas élficas...). */
	StrList item_adv;
	StrList immune_spells;
	int speed_min = 0;
	bool ignore_armor_speed = false;
	/** Varita -> cargas. */
	Dict<int> item_charges;
	/** Conjuro lanzado desde un objeto: {spell, dc, atk}. */
	Json item_cast = Json::object();
	std::string fighting_style;
	StrList resist;
	StrList vulnerable;
	StrList immune;
	StrList condition_immune;
	StrList traits;
	StrList feats;
	int darkvision = 0;

	// --- Ataques y magia ---
	/** Entradas de arma resueltas (PJ) o ataques (monstruos). */
	std::vector<Var> weapons;
	Json multiattack = Json::object();
	Json life_drain = Json::object();
	StrList bonus_actions;
	StrList reactions;
	StrList masteries;
	std::string sneak_attack;
	std::string casting_ability;
	std::string caster_type;
	StrList cantrips;
	StrList prepared;
	StrList always_prepared;
	/** Conjuros a voluntad sin espacio (invocaciones). */
	StrList at_will;
	/** Conjuro -> "class" | "species" | "feat" | "style" | "tome" | "invocation". */
	Dict<std::string> spell_source;
	/** Conjuro -> característica (si no es la de clase). */
	Dict<std::string> spell_ability;
	std::vector<int> slots_max;
	std::vector<int> slots;
	/** Conjuro -> usos sin espacio. */
	Dict<int> free_casts;
	Dict<int> resources;
	Dict<int> resources_max;
	Dict<int> items;
	Dict<int> ammo;
	// Clase y especie
	int rage_damage = 2;
	std::string bardic_die = "1d6";
	std::string martial_die;
	StrList wild_shapes;
	StrList metamagic;
	std::string pact_weapon;
	std::string breath_type;
	// Forma salvaje
	std::string form;

	struct FormBackup
	{
		Dict<int> abilities;
		int fixed_ac = -1;
		int base_speed = 30;
		std::string size;
		std::vector<Var> weapons;
		StrList traits;
		Json visual;
		int darkvision = 0;
		Dict<int> skill_overrides;
		Dict<int> ammo;
		bool valid = false;
	};
	FormBackup form_backup;

	// --- Estado de combate ---
	Cell cell;
	Vec2 facing = Vec2(0.0f, 1.0f);
	int initiative = 0;
	/** Nombre -> fuentes. */
	Dict<StrList> conditions;
	std::vector<EffectPtr> effects;
	bool dead = false;
	bool stable = false;
	int death_successes = 0;
	int death_failures = 0;
	EffectPtr concentration;
	std::string concentration_spell;
	int hidden_stealth = 0;
	TurnState turn;
	Dict<int> stats;

	Creature();

	// ---------------------------------------------------------------- básicos
	int mod(const std::string& ab) const;
	bool is_alive() const { return !dead; }
	bool is_down() const { return !dead && hp <= 0; }
	/** En pie y consciente (puede actuar si no está incapacitado). */
	bool is_active() const { return !dead && hp > 0; }
	bool bloodied() const { return hp <= max_hp / 2; }
	int size_rank() const;
	bool has_trait(const std::string& t) const;
	bool level_feature(const std::string& f) const { return has_trait(f); }
	bool is_raging() const { return has_effect("rage"); }
	bool wears_armor() const { return !armor_id.empty() && form.empty(); }
	bool unarmored_monk() const;

	// ---------------------------------------------------------------- condiciones
	bool add_condition(const std::string& c, const std::string& source = "base");
	void remove_condition(const std::string& c, const std::string& source = "");
	bool raw_has(const std::string& c) const;
	bool has_condition(const std::string& c) const;
	bool can_act() const;
	bool can_react() const;
	bool is_hidden() const { return has_effect("hidden"); }
	/** Invisible de verdad (conjuro o escondite), sin contar lo que lo anula. */
	bool is_invisible() const;
	StrList active_condition_list() const;

	// ---------------------------------------------------------------- efectos
	bool has_effect(const std::string& kind) const;
	EffectPtr get_effect(const std::string& kind) const;
	std::vector<EffectPtr> get_effects(const std::string& kind) const;

	// ---------------------------------------------------------------- CA y velocidad
	const Json& armor_data() const;
	int ac() const;
	int speed() const;

	// ---------------------------------------------------------------- tiradas
	int save_bonus(const std::string& ab) const;
	int skill_bonus(const std::string& skill) const;
	int passive_perception() const { return 10 + skill_bonus("perception"); }
	int initiative_bonus() const;
	/** Característica con la que se lanza un conjuro concreto. */
	std::string spell_ability_for(const std::string& sid = "") const;
	int spell_attack_bonus(const std::string& sid = "") const;
	int spell_save_dc(const std::string& sid = "") const;
	int spell_mod(const std::string& sid = "") const;

	// ---------------------------------------------------------------- armas
	bool is_monk_weapon(const Var& w) const;
	std::string weapon_attack_ability(const Var& w) const;
	bool is_proficient(const Var& w) const;
	bool has_mastery(const Var& w) const;
	/** Empuña con dos manos un arma versátil si no lleva escudo. */
	bool two_handing(const Var& w) const;
	std::vector<Var> melee_weapons() const;
	/** Armas a distancia y armas arrojadizas con munición disponible. */
	std::vector<Var> ranged_options() const;
	/** Munición que queda (-1 = sin límite). */
	int ammo_left(const Var& w) const;
	int reach_cells(const Var& w = Var()) const;

	// ---------------------------------------------------------------- magia
	StrList known_spells() const;
	bool has_slot(int level_min) const;
	int lowest_slot(int level_min) const;
	int total_slots() const;
	bool can_cast(const std::string& spell_id) const;

	// ---------------------------------------------------------------- forma salvaje
	/** Adopta la forma de una bestia (monsters.json). Conserva PG, mente y rasgos. */
	void enter_form(const std::string& form_id);
	void leave_form();

	// ---------------------------------------------------------------- turno
	void reset_turn();
	std::string short_label() const { return name; }
	double hp_ratio() const;
	std::string to_debug() const;
};

} // namespace mdg
