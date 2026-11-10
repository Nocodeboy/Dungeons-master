// Marca de Granito · núcleo de reglas portable.
// Var: valor dinámico con la semántica de Variant de Godot. Los arrays y diccionarios se
// comparten por referencia (como en GDScript), los diccionarios conservan el orden de
// inserción y str() / int() / == se comportan como en Godot. El combate lo usa para los
// diccionarios que en la versión de Godot iban y venían entre funciones (perfiles de ataque,
// efectos, zonas, eventos...), y así la traducción es fiel línea a línea.
#pragma once

#include "MdgJson.h"

#include <initializer_list>
#include <memory>
#include <variant>

namespace mdg
{

struct Creature;
struct Effect;
class Var;
class VarDict;
using VarArray = std::vector<Var>;

class Var
{
public:
	enum class Type : uint8_t
	{
		Nil,
		Bool,
		Int,
		Float,
		String,
		CellT,
		Vec2T,
		Array,
		Dict,
		CreatureT,
		EffectT
	};

	Var() = default;
	Var(std::nullptr_t) {}
	Var(bool b) : v_(b) {}
	Var(int i) : v_(static_cast<int64_t>(i)) {}
	Var(int64_t i) : v_(i) {}
	Var(double d) : v_(d) {}
	Var(float f) : v_(static_cast<double>(f)) {}
	Var(const char* s) : v_(std::string(s)) {}
	Var(std::string s) : v_(std::move(s)) {}
	Var(const Cell& c) : v_(c) {}
	Var(const Vec2& v) : v_(v) {}
	Var(Creature* c);
	Var(const std::shared_ptr<Effect>& e);
	Var(std::shared_ptr<VarArray> a) : v_(std::move(a)) {}
	Var(std::shared_ptr<VarDict> d) : v_(std::move(d)) {}

	static Var array();
	static Var array(std::initializer_list<Var> items);
	static Var dict();
	static Var dict(std::initializer_list<std::pair<std::string, Var>> items);
	template <class T>
	static Var array_of(const std::vector<T>& v)
	{
		Var out = array();
		for (const T& x : v)
		{
			out.push(Var(x));
		}
		return out;
	}
	/** JSON -> Var. Los números pasan a Float, igual que JSON.parse_string de Godot. */
	static Var from_json(const Json& j);
	/** Var -> JSON para la vista: casillas y vectores como [x, y], criaturas por id. */
	Json to_json() const;

	Type type() const { return static_cast<Type>(v_.index()); }
	bool is_nil() const { return type() == Type::Nil; }
	bool is_bool() const { return type() == Type::Bool; }
	bool is_int() const { return type() == Type::Int; }
	bool is_float() const { return type() == Type::Float; }
	bool is_num() const { return is_int() || is_float(); }
	bool is_str() const { return type() == Type::String; }
	bool is_cell() const { return type() == Type::CellT; }
	bool is_vec2() const { return type() == Type::Vec2T; }
	bool is_array() const { return type() == Type::Array; }
	bool is_dict() const { return type() == Type::Dict; }
	bool is_creature() const { return type() == Type::CreatureT; }
	bool is_effect() const { return type() == Type::EffectT; }

	// ---------------------------------------------------------------- conversiones (Godot)
	/** «if x:» */
	bool truthy() const;
	/** int(x) */
	int to_int() const;
	/** float(x) */
	double to_float() const;
	/** str(x) */
	std::string str() const;
	/** Cadena si lo es; "" si es null; str() en otro caso. */
	std::string as_str() const;
	Cell cell() const;
	Vec2 vec2() const;
	Creature* creature() const;
	std::shared_ptr<Effect> effect() const;

	// ---------------------------------------------------------------- arrays
	VarArray& arr();
	const VarArray& arr() const;
	size_t size() const;
	bool is_empty() const { return size() == 0; }
	Var& at(size_t i);
	const Var& at(size_t i) const;
	void push(const Var& x);
	/** «x in array» o «k in dict». */
	bool contains(const Var& x) const;
	int count(const Var& x) const;
	/** Array.erase(x): quita la primera aparición. */
	void erase_item(const Var& x);
	Var duplicate(bool deep = false) const;
	StrList str_list() const;

	// ---------------------------------------------------------------- diccionarios
	VarDict& dct();
	const VarDict& dct() const;
	bool has(const Var& key) const;
	Var get(const Var& key, const Var& def = Var()) const;
	int geti(const Var& key, int def = 0) const { return get(key, Var(def)).to_int(); }
	double getf(const Var& key, double def = 0.0) const { return get(key, Var(def)).to_float(); }
	std::string gets(const Var& key, const std::string& def = "") const;
	bool getb(const Var& key, bool def = false) const { return get(key, Var(def)).truthy(); }
	/** d[k] (crea la clave si falta; un Var nulo se convierte en diccionario). */
	Var& operator[](const Var& key);
	Var& operator[](const char* key) { return (*this)[Var(key)]; }
	Var& operator[](const std::string& key) { return (*this)[Var(key)]; }
	void erase(const Var& key);
	std::vector<Var> keys() const;
	std::vector<Var> values() const;
	/** Dictionary.merge(otro, sobrescribir). */
	void merge(const Var& other, bool overwrite = false);

	/** == de Godot (int y float se comparan por valor; arrays y diccionarios por contenido). */
	bool operator==(const Var& o) const;
	bool operator!=(const Var& o) const { return !(*this == o); }
	/** Igualdad estricta para claves de diccionario (mismo tipo y valor). */
	bool key_equal(const Var& o) const;
	size_t hash() const;
	/** Identidad: mismo array/diccionario compartido o mismo valor simple. */
	bool same(const Var& o) const;

private:
	using Storage = std::variant<std::monostate, bool, int64_t, double, std::string, Cell, Vec2, std::shared_ptr<VarArray>,
		std::shared_ptr<VarDict>, Creature*, std::shared_ptr<Effect>>;
	Storage v_;
};

struct VarKeyHash
{
	size_t operator()(const Var& v) const { return v.hash(); }
};

struct VarKeyEq
{
	bool operator()(const Var& a, const Var& b) const { return a.key_equal(b); }
};

/** Diccionario de Var con orden de inserción. */
class VarDict
{
public:
	using Item = std::pair<Var, Var>;

	bool has(const Var& k) const { return index_.find(k) != index_.end(); }
	const Var* find(const Var& k) const;
	Var* find(const Var& k);
	Var& operator[](const Var& k);
	bool erase(const Var& k);
	size_t size() const { return items_.size(); }
	bool empty() const { return items_.empty(); }
	const std::vector<Item>& items() const { return items_; }
	std::vector<Item>& items() { return items_; }

private:
	void rebuild();
	std::vector<Item> items_;
	std::unordered_map<Var, size_t, VarKeyHash, VarKeyEq> index_;
};

inline Var vdict(std::initializer_list<std::pair<std::string, Var>> items)
{
	return Var::dict(items);
}

inline Var varr(std::initializer_list<Var> items)
{
	return Var::array(items);
}

/** Minúsculas de UTF-8 para el español (ASCII y letras acentuadas). */
std::string utf8_lower(const std::string& s);

} // namespace mdg
