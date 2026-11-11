#include "MdgVar.h"

#include "MdgCreature.h"
#include "MdgEffect.h"

#include <algorithm>
#include <cmath>

namespace mdg
{

namespace var_detail
{

const Var& nil_var()
{
	static const Var v;
	return v;
}

VarArray& empty_array()
{
	static VarArray a;
	a.clear();
	return a;
}

VarDict& empty_dict()
{
	static VarDict d;
	return d;
}

/**
 * String::num_real de Godot 4: entero exacto -> "N.0"; si no, 14 decimales «sanos» (menos los dígitos
 * enteros por encima de 10) y se quitan los ceros finales dejando siempre uno tras el punto ("6.0", "-0.0").
 * Con decimales negativos Godot usa "%lf" (6 decimales).
 */
std::string godot_float_str(double d)
{
	if (std::isnan(d))
	{
		return "nan";
	}
	if (std::isinf(d))
	{
		return d > 0 ? "inf" : "-inf";
	}
	if (std::fabs(d) < 9.2e18 && d == static_cast<double>(static_cast<int64_t>(d)))
	{
		return std::to_string(static_cast<int64_t>(d)) + ".0";
	}
	int decimals = 14;
	const double abs_num = std::fabs(d);
	if (abs_num > 10)
	{
		decimals -= static_cast<int>(std::floor(std::log10(abs_num)));
	}
	std::string s = decimals < 0 ? format("%f", d) : format("%.*f", std::min(decimals, 32), d);
	const size_t dot = s.find('.');
	if (dot != std::string::npos)
	{
		while (s.size() > dot + 2 && s.back() == '0')
		{
			s.pop_back();
		}
	}
	return s;
}

std::string quoted_str(const Var& v)
{
	return v.is_str() ? "\"" + v.str() + "\"" : v.str();
}

size_t mix(size_t h, size_t v)
{
	return h ^ (v + 0x9e3779b97f4a7c15ULL + (h << 6) + (h >> 2));
}

} // namespace var_detail

// ------------------------------------------------------------------ construcción

Var::Var(Creature* c)
{
	if (c != nullptr)
	{
		v_ = c;
	}
}

Var::Var(const std::shared_ptr<Effect>& e)
{
	if (e)
	{
		v_ = e;
	}
}

Var Var::array()
{
	return Var(std::make_shared<VarArray>());
}

Var Var::array(std::initializer_list<Var> items)
{
	auto a = std::make_shared<VarArray>(items);
	return Var(a);
}

Var Var::dict()
{
	return Var(std::make_shared<VarDict>());
}

Var Var::dict(std::initializer_list<std::pair<std::string, Var>> items)
{
	Var out = dict();
	VarDict& d = out.dct();
	for (const auto& kv : items)
	{
		d[Var(kv.first)] = kv.second;
	}
	return out;
}

Var Var::from_json(const Json& j)
{
	switch (j.type())
	{
	case Json::value_t::null:
		return Var();
	case Json::value_t::boolean:
		return Var(j.get<bool>());
	case Json::value_t::number_integer:
		return Var(static_cast<double>(j.get<int64_t>()));
	case Json::value_t::number_unsigned:
		return Var(static_cast<double>(j.get<uint64_t>()));
	case Json::value_t::number_float:
		return Var(j.get<double>());
	case Json::value_t::string:
		return Var(j.get<std::string>());
	case Json::value_t::array:
	{
		Var out = array();
		for (const Json& e : j)
		{
			out.push(from_json(e));
		}
		return out;
	}
	case Json::value_t::object:
	{
		Var out = dict();
		VarDict& d = out.dct();
		for (auto it = j.begin(); it != j.end(); ++it)
		{
			d[Var(it.key())] = from_json(it.value());
		}
		return out;
	}
	default:
		return Var();
	}
}

Json Var::to_json() const
{
	switch (type())
	{
	case Type::Nil:
		return Json();
	case Type::Bool:
		return Json(std::get<bool>(v_));
	case Type::Int:
		return Json(std::get<int64_t>(v_));
	case Type::Float:
		return Json(std::get<double>(v_));
	case Type::String:
		return Json(std::get<std::string>(v_));
	case Type::CellT:
	{
		const Cell c = std::get<Cell>(v_);
		return Json::array({c.x, c.y});
	}
	case Type::Vec2T:
	{
		const Vec2 v = std::get<Vec2>(v_);
		return Json::array({static_cast<double>(v.x), static_cast<double>(v.y)});
	}
	case Type::Array:
	{
		Json out = Json::array();
		for (const Var& e : arr())
		{
			out.push_back(e.to_json());
		}
		return out;
	}
	case Type::Dict:
	{
		Json out = Json::object();
		for (const auto& kv : dct().items())
		{
			out[kv.first.str()] = kv.second.to_json();
		}
		return out;
	}
	case Type::CreatureT:
		return Json(std::get<Creature*>(v_)->id);
	case Type::EffectT:
		return Json(std::get<std::shared_ptr<Effect>>(v_)->kind);
	}
	return Json();
}

// ------------------------------------------------------------------ conversiones

bool Var::truthy() const
{
	switch (type())
	{
	case Type::Nil:
		return false;
	case Type::Bool:
		return std::get<bool>(v_);
	case Type::Int:
		return std::get<int64_t>(v_) != 0;
	case Type::Float:
		return std::get<double>(v_) != 0.0;
	case Type::String:
		return !std::get<std::string>(v_).empty();
	case Type::CellT:
		return std::get<Cell>(v_) != Cell(0, 0);
	case Type::Vec2T:
		return std::get<Vec2>(v_) != Vec2(0.0f, 0.0f);
	case Type::Array:
		return !arr().empty();
	case Type::Dict:
		return !dct().empty();
	case Type::CreatureT:
	case Type::EffectT:
		return true;
	}
	return false;
}

int Var::to_int() const
{
	switch (type())
	{
	case Type::Bool:
		return std::get<bool>(v_) ? 1 : 0;
	case Type::Int:
		return static_cast<int>(std::get<int64_t>(v_));
	case Type::Float:
		return static_cast<int>(std::get<double>(v_));
	case Type::String:
		return godot_to_int(std::get<std::string>(v_));
	default:
		return 0;
	}
}

double Var::to_float() const
{
	switch (type())
	{
	case Type::Bool:
		return std::get<bool>(v_) ? 1.0 : 0.0;
	case Type::Int:
		return static_cast<double>(std::get<int64_t>(v_));
	case Type::Float:
		return std::get<double>(v_);
	case Type::String:
		return std::atof(std::get<std::string>(v_).c_str());
	default:
		return 0.0;
	}
}

std::string Var::str() const
{
	switch (type())
	{
	case Type::Nil:
		return "<null>";
	case Type::Bool:
		return std::get<bool>(v_) ? "true" : "false";
	case Type::Int:
		return std::to_string(std::get<int64_t>(v_));
	case Type::Float:
		return var_detail::godot_float_str(std::get<double>(v_));
	case Type::String:
		return std::get<std::string>(v_);
	case Type::CellT:
	{
		const Cell c = std::get<Cell>(v_);
		return format("(%d, %d)", c.x, c.y);
	}
	case Type::Vec2T:
	{
		const Vec2 v = std::get<Vec2>(v_);
		return "(" + var_detail::godot_float_str(v.x) + ", " + var_detail::godot_float_str(v.y) + ")";
	}
	case Type::Array:
	{
		StrList parts;
		for (const Var& e : arr())
		{
			parts.push_back(var_detail::quoted_str(e));
		}
		return "[" + join(parts, ", ") + "]";
	}
	case Type::Dict:
	{
		StrList parts;
		for (const auto& kv : dct().items())
		{
			parts.push_back(var_detail::quoted_str(kv.first) + ": " + var_detail::quoted_str(kv.second));
		}
		return "{ " + join(parts, ", ") + " }";
	}
	case Type::CreatureT:
		return "<Creature:" + std::get<Creature*>(v_)->id + ">";
	case Type::EffectT:
		return "<Effect:" + std::get<std::shared_ptr<Effect>>(v_)->kind + ">";
	}
	return "";
}

std::string Var::as_str() const
{
	if (is_str())
	{
		return std::get<std::string>(v_);
	}
	if (is_nil())
	{
		return "";
	}
	return str();
}

std::string Var::gets(const Var& key, const std::string& def) const
{
	const Var v = get(key, Var());
	if (v.is_nil())
	{
		return def;
	}
	return v.as_str();
}

Cell Var::cell() const
{
	if (is_cell())
	{
		return std::get<Cell>(v_);
	}
	if (is_vec2())
	{
		const Vec2 v = std::get<Vec2>(v_);
		return Cell(static_cast<int>(v.x), static_cast<int>(v.y));
	}
	if (is_array() && arr().size() >= 2)
	{
		return Cell(arr()[0].to_int(), arr()[1].to_int());
	}
	return Cell();
}

Vec2 Var::vec2() const
{
	if (is_vec2())
	{
		return std::get<Vec2>(v_);
	}
	if (is_cell())
	{
		const Cell c = std::get<Cell>(v_);
		return Vec2(static_cast<float>(c.x), static_cast<float>(c.y));
	}
	if (is_array() && arr().size() >= 2)
	{
		return Vec2(arr()[0].to_float(), arr()[1].to_float());
	}
	return Vec2();
}

Creature* Var::creature() const
{
	return is_creature() ? std::get<Creature*>(v_) : nullptr;
}

std::shared_ptr<Effect> Var::effect() const
{
	return is_effect() ? std::get<std::shared_ptr<Effect>>(v_) : nullptr;
}

// ------------------------------------------------------------------ arrays

VarArray& Var::arr()
{
	if (is_nil())
	{
		v_ = std::make_shared<VarArray>();
	}
	if (!is_array())
	{
		return var_detail::empty_array();
	}
	return *std::get<std::shared_ptr<VarArray>>(v_);
}

const VarArray& Var::arr() const
{
	if (!is_array())
	{
		return var_detail::empty_array();
	}
	return *std::get<std::shared_ptr<VarArray>>(v_);
}

size_t Var::size() const
{
	if (is_array())
	{
		return arr().size();
	}
	if (is_dict())
	{
		return dct().size();
	}
	if (is_str())
	{
		return std::get<std::string>(v_).size();
	}
	return 0;
}

Var& Var::at(size_t i)
{
	VarArray& a = arr();
	if (i >= a.size())
	{
		static Var dummy;
		dummy = Var();
		return dummy;
	}
	return a[i];
}

const Var& Var::at(size_t i) const
{
	const VarArray& a = arr();
	return i < a.size() ? a[i] : var_detail::nil_var();
}

void Var::push(const Var& x)
{
	arr().push_back(x);
}

bool Var::contains(const Var& x) const
{
	if (is_dict())
	{
		return dct().has(x);
	}
	for (const Var& e : arr())
	{
		if (e == x)
		{
			return true;
		}
	}
	return false;
}

int Var::count(const Var& x) const
{
	int n = 0;
	for (const Var& e : arr())
	{
		if (e == x)
		{
			n += 1;
		}
	}
	return n;
}

void Var::erase_item(const Var& x)
{
	if (!is_array())
	{
		return;
	}
	VarArray& a = arr();
	for (auto it = a.begin(); it != a.end(); ++it)
	{
		if (*it == x)
		{
			a.erase(it);
			return;
		}
	}
}

Var Var::duplicate(bool deep) const
{
	if (is_array())
	{
		Var out = array();
		for (const Var& e : arr())
		{
			out.push(deep ? e.duplicate(true) : e);
		}
		return out;
	}
	if (is_dict())
	{
		Var out = dict();
		VarDict& d = out.dct();
		for (const auto& kv : dct().items())
		{
			d[kv.first] = deep ? kv.second.duplicate(true) : kv.second;
		}
		return out;
	}
	return *this;
}

StrList Var::str_list() const
{
	StrList out;
	for (const Var& e : arr())
	{
		out.push_back(e.as_str());
	}
	return out;
}

// ------------------------------------------------------------------ diccionarios

VarDict& Var::dct()
{
	if (is_nil())
	{
		v_ = std::make_shared<VarDict>();
	}
	if (!is_dict())
	{
		return var_detail::empty_dict();
	}
	return *std::get<std::shared_ptr<VarDict>>(v_);
}

const VarDict& Var::dct() const
{
	if (!is_dict())
	{
		return var_detail::empty_dict();
	}
	return *std::get<std::shared_ptr<VarDict>>(v_);
}

bool Var::has(const Var& key) const
{
	return is_dict() && dct().has(key);
}

Var Var::get(const Var& key, const Var& def) const
{
	if (!is_dict())
	{
		return def;
	}
	const Var* v = dct().find(key);
	return v != nullptr ? *v : def;
}

Var& Var::operator[](const Var& key)
{
	return dct()[key];
}

void Var::erase(const Var& key)
{
	if (is_dict())
	{
		dct().erase(key);
	}
}

std::vector<Var> Var::keys() const
{
	std::vector<Var> out;
	for (const auto& kv : dct().items())
	{
		out.push_back(kv.first);
	}
	return out;
}

std::vector<Var> Var::values() const
{
	std::vector<Var> out;
	for (const auto& kv : dct().items())
	{
		out.push_back(kv.second);
	}
	return out;
}

void Var::merge(const Var& other, bool overwrite)
{
	if (!other.is_dict())
	{
		return;
	}
	VarDict& d = dct();
	for (const auto& kv : other.dct().items())
	{
		if (overwrite || !d.has(kv.first))
		{
			d[kv.first] = kv.second;
		}
	}
}

// ------------------------------------------------------------------ comparación

bool Var::operator==(const Var& o) const
{
	if (is_num() && o.is_num())
	{
		if (is_int() && o.is_int())
		{
			return std::get<int64_t>(v_) == std::get<int64_t>(o.v_);
		}
		return to_float() == o.to_float();
	}
	if (type() != o.type())
	{
		return false;
	}
	switch (type())
	{
	case Type::Nil:
		return true;
	case Type::Bool:
		return std::get<bool>(v_) == std::get<bool>(o.v_);
	case Type::String:
		return std::get<std::string>(v_) == std::get<std::string>(o.v_);
	case Type::CellT:
		return std::get<Cell>(v_) == std::get<Cell>(o.v_);
	case Type::Vec2T:
		return std::get<Vec2>(v_) == std::get<Vec2>(o.v_);
	case Type::Array:
	{
		const VarArray& a = arr();
		const VarArray& b = o.arr();
		if (&a == &b)
		{
			return true;
		}
		if (a.size() != b.size())
		{
			return false;
		}
		for (size_t i = 0; i < a.size(); ++i)
		{
			if (a[i] != b[i])
			{
				return false;
			}
		}
		return true;
	}
	case Type::Dict:
	{
		const VarDict& a = dct();
		const VarDict& b = o.dct();
		if (&a == &b)
		{
			return true;
		}
		if (a.size() != b.size())
		{
			return false;
		}
		for (const auto& kv : a.items())
		{
			const Var* bv = b.find(kv.first);
			if (bv == nullptr || *bv != kv.second)
			{
				return false;
			}
		}
		return true;
	}
	case Type::CreatureT:
		return std::get<Creature*>(v_) == std::get<Creature*>(o.v_);
	case Type::EffectT:
		return std::get<std::shared_ptr<Effect>>(v_) == std::get<std::shared_ptr<Effect>>(o.v_);
	default:
		return false;
	}
}

bool Var::key_equal(const Var& o) const
{
	if (type() != o.type())
	{
		return false;
	}
	return *this == o;
}

bool Var::same(const Var& o) const
{
	if (type() != o.type())
	{
		return false;
	}
	if (is_array())
	{
		return std::get<std::shared_ptr<VarArray>>(v_) == std::get<std::shared_ptr<VarArray>>(o.v_);
	}
	if (is_dict())
	{
		return std::get<std::shared_ptr<VarDict>>(v_) == std::get<std::shared_ptr<VarDict>>(o.v_);
	}
	return *this == o;
}

size_t Var::hash() const
{
	const size_t t = static_cast<size_t>(type());
	switch (type())
	{
	case Type::Nil:
		return 0;
	case Type::Bool:
		return var_detail::mix(t, std::get<bool>(v_) ? 1u : 0u);
	case Type::Int:
		return var_detail::mix(t, std::hash<int64_t>()(std::get<int64_t>(v_)));
	case Type::Float:
		return var_detail::mix(t, std::hash<double>()(std::get<double>(v_)));
	case Type::String:
		return var_detail::mix(t, std::hash<std::string>()(std::get<std::string>(v_)));
	case Type::CellT:
		return var_detail::mix(t, CellHash()(std::get<Cell>(v_)));
	case Type::Vec2T:
	{
		const Vec2 v = std::get<Vec2>(v_);
		return var_detail::mix(var_detail::mix(t, std::hash<float>()(v.x)), std::hash<float>()(v.y));
	}
	case Type::CreatureT:
		return var_detail::mix(t, std::hash<const void*>()(std::get<Creature*>(v_)));
	case Type::EffectT:
		return var_detail::mix(t, std::hash<const void*>()(std::get<std::shared_ptr<Effect>>(v_).get()));
	case Type::Array:
	{
		size_t h = t;
		for (const Var& e : arr())
		{
			h = var_detail::mix(h, e.hash());
		}
		return h;
	}
	case Type::Dict:
	{
		size_t h = t;
		for (const auto& kv : dct().items())
		{
			h = var_detail::mix(h, kv.first.hash());
			h = var_detail::mix(h, kv.second.hash());
		}
		return h;
	}
	}
	return t;
}

// ------------------------------------------------------------------ VarDict

const Var* VarDict::find(const Var& k) const
{
	auto it = index_.find(k);
	return it == index_.end() ? nullptr : &items_[it->second].second;
}

Var* VarDict::find(const Var& k)
{
	auto it = index_.find(k);
	return it == index_.end() ? nullptr : &items_[it->second].second;
}

Var& VarDict::operator[](const Var& k)
{
	auto it = index_.find(k);
	if (it != index_.end())
	{
		return items_[it->second].second;
	}
	index_.emplace(k, items_.size());
	items_.emplace_back(k, Var());
	return items_.back().second;
}

bool VarDict::erase(const Var& k)
{
	auto it = index_.find(k);
	if (it == index_.end())
	{
		return false;
	}
	items_.erase(items_.begin() + static_cast<std::ptrdiff_t>(it->second));
	rebuild();
	return true;
}

void VarDict::rebuild()
{
	index_.clear();
	for (size_t i = 0; i < items_.size(); ++i)
	{
		index_.emplace(items_[i].first, i);
	}
}

// ------------------------------------------------------------------ texto

std::string utf8_lower(const std::string& s)
{
	std::string out = s;
	for (size_t i = 0; i < out.size(); ++i)
	{
		const unsigned char c0 = static_cast<unsigned char>(out[i]);
		if (c0 >= 'A' && c0 <= 'Z')
		{
			out[i] = static_cast<char>(c0 - 'A' + 'a');
		}
		else if (c0 == 0xC3 && i + 1 < out.size())
		{
			const unsigned char c1 = static_cast<unsigned char>(out[i + 1]);
			if (c1 >= 0x80 && c1 <= 0x9E && c1 != 0x97)
			{
				out[i + 1] = static_cast<char>(c1 + 0x20);
			}
			i += 1;
		}
	}
	return out;
}

} // namespace mdg
