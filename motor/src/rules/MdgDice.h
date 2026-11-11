// Marca de Granito · núcleo de reglas portable.
// Tiradas de dados deterministas. El generador es el PCG32 de Godot con la misma siembra, así que
// con la misma semilla salen exactamente los mismos números que en la versión de Godot.
#pragma once

#include "MdgTypes.h"

namespace mdg
{

/** PCG32 idéntico a RandomPCG / RandomNumberGenerator de Godot 4. */
class Pcg32
{
public:
	static constexpr uint64_t kDefaultSeed = 12047754176567800795ULL;
	static constexpr uint64_t kDefaultInc = 1442695040888963407ULL;

	explicit Pcg32(uint64_t seed_value = kDefaultSeed) { seed(seed_value); }

	void seed(uint64_t seed_value);
	uint64_t get_seed() const { return current_seed_; }
	/** Siembra con la hora y el reloj del sistema (rng.randomize()). */
	void randomize();
	/**
	 * Gancho para pruebas deterministas: si está puesto, randomize() toma de aquí la hora (en las
	 * unidades de system_clock de libc++, microsegundos) y los dos valores de random_device.
	 */
	using EntropiaFn = void (*)(uint64_t& reloj, uint32_t& r1, uint32_t& r2);
	static EntropiaFn entropia;
	/** randi(): 32 bits. */
	uint32_t rand();
	/** Entero en [0, bound). */
	uint32_t rand_bounded(uint32_t bound);
	/** randi_range(from, to), ambos incluidos. */
	int randi_range(int from, int to);
	/** randf() en [0, 1] con el método de Godot. */
	float randf();
	float randf_range(float from, float to) { return randf() * (to - from) + from; }

	/** Estado completo del generador (para rehacer un combate idéntico). */
	void get_state(uint64_t& s, uint64_t& i) const
	{
		s = state_;
		i = inc_;
	}
	void set_state(uint64_t s, uint64_t i)
	{
		state_ = s;
		inc_ = i;
	}

private:
	uint64_t state_ = 0;
	uint64_t inc_ = 0;
	uint64_t current_seed_ = 0;
	uint64_t current_inc_ = kDefaultInc;
};

struct DiceExpr
{
	int count = 0;
	int sides = 0;
	int bonus = 0;
};

struct D20Roll
{
	std::vector<int> rolls;
	int natural = 0;
};

struct RollResult
{
	int total = 0;
	std::vector<int> rolls;
	int bonus = 0;
	std::string dice;
};

class Dice
{
public:
	/** Semilla negativa = al azar. */
	explicit Dice(int64_t seed_value = -1);

	Pcg32 rng;

	int die(int sides);
	/** d20 con ventaja (1), normal (0) o desventaja (-1). `reroll_ones` es la Suerte mediana. */
	D20Roll d20(int mode = 0, bool reroll_ones = false);
	/** "2d6", "1d8+3", "3d6-1", "4". `crit` dobla los dados; `min_die` sube los dados bajos. */
	RollResult roll(const std::string& expr, bool crit = false, int min_die = 0);

	static DiceExpr parse(const std::string& expr);
	static int roll_with(const std::string& expr, Pcg32& r);
	static double average(const std::string& expr);
	static int max_value(const std::string& expr);
	/** "1d8" + 1 -> "2d8". */
	static std::string add_dice(const std::string& expr, int extra_count);
	static std::string with_bonus(const std::string& expr, int bonus);
	/** Probabilidad de que d20 + bonus >= objetivo. */
	static double p_success(double bonus, int target, int mode = 0, int crit_range = 20, bool auto_fail_one = true);

private:
	int d20_single(bool reroll_ones);
};

} // namespace mdg
