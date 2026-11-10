#include "MdgDice.h"

#include <chrono>
#include <cmath>
#include <random>

namespace mdg
{

namespace dice_detail
{

uint32_t count_leading_zeros32(uint32_t v)
{
	if (v == 0)
	{
		return 32;
	}
	uint32_t n = 0;
	while ((v & 0x80000000u) == 0)
	{
		v <<= 1;
		++n;
	}
	return n;
}

std::string lower_no_spaces(const std::string& expr)
{
	std::string e;
	e.reserve(expr.size());
	for (char ch : expr)
	{
		if (ch == ' ')
		{
			continue;
		}
		e.push_back((ch >= 'A' && ch <= 'Z') ? static_cast<char>(ch - 'A' + 'a') : ch);
	}
	return e;
}

} // namespace dice_detail

// ------------------------------------------------------------------ Pcg32

void Pcg32::seed(uint64_t seed_value)
{
	current_seed_ = seed_value;
	// pcg32_srandom_r(&pcg, seed, inc)
	state_ = 0u;
	inc_ = (current_inc_ << 1u) | 1u;
	rand();
	state_ += seed_value;
	rand();
	current_seed_ = seed_value;
}

Pcg32::EntropiaFn Pcg32::entropia = nullptr;

void Pcg32::randomize()
{
	if (entropia != nullptr)
	{
		uint64_t t = 0;
		uint32_t r1 = 0;
		uint32_t r2 = 0;
		entropia(t, r1, r2);
		seed((t ^ ((static_cast<uint64_t>(r1) << 32) ^ static_cast<uint64_t>(r2))) * (state_ | 1u) + kDefaultInc);
		return;
	}
	const uint64_t t = static_cast<uint64_t>(std::chrono::system_clock::now().time_since_epoch().count());
	std::random_device rd;
	const uint64_t r = (static_cast<uint64_t>(rd()) << 32) ^ static_cast<uint64_t>(rd());
	seed((t ^ r) * (state_ | 1u) + kDefaultInc);
}

uint32_t Pcg32::rand()
{
	const uint64_t oldstate = state_;
	state_ = oldstate * 6364136223846793005ULL + inc_;
	const uint32_t xorshifted = static_cast<uint32_t>(((oldstate >> 18u) ^ oldstate) >> 27u);
	const uint32_t rot = static_cast<uint32_t>(oldstate >> 59u);
	return (xorshifted >> rot) | (xorshifted << ((0u - rot) & 31u));
}

uint32_t Pcg32::rand_bounded(uint32_t bound)
{
	if (bound == 0)
	{
		return 0;
	}
	const uint32_t threshold = (0u - bound) % bound;
	for (;;)
	{
		const uint32_t r = rand();
		if (r >= threshold)
		{
			return r % bound;
		}
	}
}

int Pcg32::randi_range(int from, int to)
{
	if (from == to)
	{
		return from;
	}
	const uint32_t span = static_cast<uint32_t>(std::abs(from - to)) + 1u;
	return static_cast<int>(rand_bounded(span)) + std::min(from, to);
}

float Pcg32::randf()
{
	const uint32_t proto_exp_offset = rand();
	if (proto_exp_offset == 0)
	{
		return 0.0f;
	}
	const uint32_t significand = rand() | 0x80000001u;
	const int exp = -32 - static_cast<int>(dice_detail::count_leading_zeros32(proto_exp_offset));
	return std::ldexp(static_cast<float>(significand), exp);
}

// ------------------------------------------------------------------ Dice

Dice::Dice(int64_t seed_value)
{
	if (seed_value >= 0)
	{
		rng.seed(static_cast<uint64_t>(seed_value));
	}
	else
	{
		rng.randomize();
	}
}

int Dice::die(int sides)
{
	return rng.randi_range(1, sides);
}

int Dice::d20_single(bool reroll_ones)
{
	int r = die(20);
	if (reroll_ones && r == 1)
	{
		r = die(20);
	}
	return r;
}

D20Roll Dice::d20(int mode, bool reroll_ones)
{
	D20Roll out;
	const int a = d20_single(reroll_ones);
	if (mode == 0)
	{
		out.rolls = {a};
		out.natural = a;
		return out;
	}
	const int b = d20_single(reroll_ones);
	out.rolls = {a, b};
	out.natural = mode > 0 ? std::max(a, b) : std::min(a, b);
	return out;
}

RollResult Dice::roll(const std::string& expr, bool crit, int min_die)
{
	const DiceExpr parsed = parse(expr);
	RollResult out;
	out.dice = expr;
	out.bonus = parsed.bonus;
	const int count = parsed.count * (crit ? 2 : 1);
	for (int i = 0; i < count; ++i)
	{
		int r = parsed.sides > 0 ? die(parsed.sides) : 0;
		if (min_die > 0 && r < min_die)
		{
			r = min_die;
		}
		out.rolls.push_back(r);
	}
	out.total = parsed.bonus;
	for (int r : out.rolls)
	{
		out.total += r;
	}
	return out;
}

DiceExpr Dice::parse(const std::string& expr)
{
	const std::string e = dice_detail::lower_no_spaces(expr);
	DiceExpr out;
	if (e.empty())
	{
		return out;
	}
	const size_t dpos = e.find('d');
	if (dpos == std::string::npos)
	{
		out.bonus = godot_to_int(e);
		return out;
	}
	const std::string c_str = e.substr(0, dpos);
	out.count = c_str.empty() ? 1 : godot_to_int(c_str);
	const std::string rest = e.substr(dpos + 1);
	size_t sign_pos = std::string::npos;
	for (size_t i = 0; i < rest.size(); ++i)
	{
		if (rest[i] == '+' || rest[i] == '-')
		{
			sign_pos = i;
			break;
		}
	}
	if (sign_pos == std::string::npos)
	{
		out.sides = godot_to_int(rest);
	}
	else
	{
		out.sides = godot_to_int(rest.substr(0, sign_pos));
		out.bonus = godot_to_int(rest.substr(sign_pos));
	}
	return out;
}

int Dice::roll_with(const std::string& expr, Pcg32& r)
{
	const DiceExpr p = parse(expr);
	int total = p.bonus;
	for (int i = 0; i < p.count; ++i)
	{
		total += r.randi_range(1, std::max(1, p.sides));
	}
	return total;
}

double Dice::average(const std::string& expr)
{
	const DiceExpr p = parse(expr);
	// En GDScript: p.count * (p.sides + 1) / 2.0 + p.bonus
	return static_cast<double>(p.count * (p.sides + 1)) / 2.0 + p.bonus;
}

int Dice::max_value(const std::string& expr)
{
	const DiceExpr p = parse(expr);
	return p.count * p.sides + p.bonus;
}

std::string Dice::add_dice(const std::string& expr, int extra_count)
{
	const DiceExpr p = parse(expr);
	std::string s = format("%dd%d", p.count + extra_count, p.sides);
	if (p.bonus > 0)
	{
		s += format("+%d", p.bonus);
	}
	else if (p.bonus < 0)
	{
		s += format("%d", p.bonus);
	}
	return s;
}

std::string Dice::with_bonus(const std::string& expr, int bonus)
{
	const DiceExpr p = parse(expr);
	const int b = p.bonus + bonus;
	std::string s;
	if (p.count > 0)
	{
		s = format("%dd%d", p.count, p.sides);
	}
	if (b > 0)
	{
		s += !s.empty() ? format("+%d", b) : std::to_string(b);
	}
	else if (b < 0)
	{
		s += format("%d", b);
	}
	if (s.empty())
	{
		s = "0";
	}
	return s;
}

double Dice::p_success(double bonus, int target, int mode, int crit_range, bool auto_fail_one)
{
	double p = 0.0;
	for (int r = 1; r <= 20; ++r)
	{
		bool ok = false;
		if (r >= crit_range)
		{
			ok = true;
		}
		else if (r == 1 && auto_fail_one)
		{
			ok = false;
		}
		else
		{
			ok = (r + bonus) >= target;
		}
		if (ok)
		{
			p += 0.05;
		}
	}
	if (mode > 0)
	{
		return 1.0 - (1.0 - p) * (1.0 - p);
	}
	if (mode < 0)
	{
		return p * p;
	}
	return p;
}

} // namespace mdg
