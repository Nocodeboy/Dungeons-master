// Marca de Granito · núcleo de reglas portable (sin dependencias de Unreal).
// Tipos básicos: casillas, vectores 2D, diccionarios con orden de inserción y utilidades.
//
// Normas para todo el núcleo (se compila dentro de Unreal y con g++/clang fuera):
//  - Nada de identificadores que choquen con macros de Unreal: check, verify, ensure, PI, IN, OUT,
//    TEXT, DELTA, INDEX_NONE... Las constantes van en kCamelCase.
//  - Nada de "using namespace" ni funciones con el mismo nombre en espacios anónimos de varios .cpp
//    (Unreal junta varios .cpp en uno al compilar).
//  - Sin variables que sombreen a otras (Unreal lo trata como error).
#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <functional>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

namespace mdg
{

constexpr double kPi = 3.14159265358979323846;

// ------------------------------------------------------------------ casillas y vectores

/** Casilla del tablero (columna, fila) en coordenadas «odd-r». Equivale a Vector2i de Godot. */
struct Cell
{
	int x = 0;
	int y = 0;

	constexpr Cell() = default;
	constexpr Cell(int px, int py) : x(px), y(py) {}

	constexpr bool operator==(const Cell& o) const { return x == o.x && y == o.y; }
	constexpr bool operator!=(const Cell& o) const { return !(*this == o); }
	constexpr bool operator<(const Cell& o) const { return y != o.y ? y < o.y : x < o.x; }
	constexpr Cell operator+(const Cell& o) const { return Cell(x + o.x, y + o.y); }
	constexpr Cell operator-(const Cell& o) const { return Cell(x - o.x, y - o.y); }
};

struct CellHash
{
	size_t operator()(const Cell& c) const noexcept
	{
		return std::hash<int64_t>()((static_cast<int64_t>(c.x) << 32) ^ static_cast<int64_t>(static_cast<uint32_t>(c.y)));
	}
};

/** Vector 2D en float de 32 bits, como Vector2 de Godot (las operaciones se hacen en float). */
struct Vec2
{
	float x = 0.0f;
	float y = 0.0f;

	constexpr Vec2() = default;
	constexpr Vec2(float px, float py) : x(px), y(py) {}
	Vec2(double px, double py) : x(static_cast<float>(px)), y(static_cast<float>(py)) {}

	Vec2 operator+(const Vec2& o) const { return Vec2(x + o.x, y + o.y); }
	Vec2 operator-(const Vec2& o) const { return Vec2(x - o.x, y - o.y); }
	Vec2 operator-() const { return Vec2(-x, -y); }
	Vec2 operator*(float s) const { return Vec2(x * s, y * s); }
	Vec2 operator*(double s) const { const float f = static_cast<float>(s); return Vec2(x * f, y * f); }
	bool operator==(const Vec2& o) const { return x == o.x && y == o.y; }
	bool operator!=(const Vec2& o) const { return !(*this == o); }

	float length() const { return std::sqrt(x * x + y * y); }
	float length_squared() const { return x * x + y * y; }
	Vec2 normalized() const
	{
		float l = x * x + y * y;
		if (l != 0.0f)
		{
			l = std::sqrt(l);
			return Vec2(x / l, y / l);
		}
		return *this;
	}
	float dot(const Vec2& o) const { return x * o.x + y * o.y; }
	float cross(const Vec2& o) const { return x * o.y - y * o.x; }
	float distance_to(const Vec2& o) const { return (*this - o).length(); }
	float angle_to(const Vec2& o) const { return std::atan2(cross(o), dot(o)); }
	Vec2 lerp(const Vec2& to, float w) const { return Vec2(x + (to.x - x) * w, y + (to.y - y) * w); }
};

// ------------------------------------------------------------------ diccionario ordenado

/**
 * Diccionario que conserva el orden de inserción, como Dictionary de Godot.
 * Borrar y volver a insertar una clave la manda al final (igual que en Godot).
 */
template <class K, class V, class H = std::hash<K>>
class OMap
{
public:
	using Item = std::pair<K, V>;

	bool has(const K& k) const { return index_.find(k) != index_.end(); }
	size_t size() const { return items_.size(); }
	bool empty() const { return items_.empty(); }
	void clear()
	{
		items_.clear();
		index_.clear();
	}

	/** Valor de la clave o `def` si no está. */
	V get(const K& k, const V& def = V()) const
	{
		auto it = index_.find(k);
		return it == index_.end() ? def : items_[it->second].second;
	}

	const V* find(const K& k) const
	{
		auto it = index_.find(k);
		return it == index_.end() ? nullptr : &items_[it->second].second;
	}

	V* find(const K& k)
	{
		auto it = index_.find(k);
		return it == index_.end() ? nullptr : &items_[it->second].second;
	}

	/** Acceso con inserción al final si falta (como d[k] = v en Godot). */
	V& operator[](const K& k)
	{
		auto it = index_.find(k);
		if (it != index_.end())
		{
			return items_[it->second].second;
		}
		index_.emplace(k, items_.size());
		items_.emplace_back(k, V());
		return items_.back().second;
	}

	void set(const K& k, const V& v) { (*this)[k] = v; }

	bool erase(const K& k)
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

	std::vector<K> keys() const
	{
		std::vector<K> out;
		out.reserve(items_.size());
		for (const Item& i : items_)
		{
			out.push_back(i.first);
		}
		return out;
	}

	typename std::vector<Item>::const_iterator begin() const { return items_.begin(); }
	typename std::vector<Item>::const_iterator end() const { return items_.end(); }
	typename std::vector<Item>::iterator begin() { return items_.begin(); }
	typename std::vector<Item>::iterator end() { return items_.end(); }

	bool operator==(const OMap& o) const { return items_ == o.items_; }

private:
	void rebuild()
	{
		index_.clear();
		for (size_t i = 0; i < items_.size(); ++i)
		{
			index_.emplace(items_[i].first, i);
		}
	}

	std::vector<Item> items_;
	std::unordered_map<K, size_t, H> index_;
};

template <class V>
using Dict = OMap<std::string, V>;

template <class V>
using CellMap = OMap<Cell, V, CellHash>;

using StrList = std::vector<std::string>;

// ------------------------------------------------------------------ utilidades de listas

template <class T>
inline bool contains(const std::vector<T>& v, const T& x)
{
	return std::find(v.begin(), v.end(), x) != v.end();
}

inline bool contains(const StrList& v, const char* x)
{
	return std::find(v.begin(), v.end(), std::string(x)) != v.end();
}

/** Añade si no está. Devuelve true si lo añadió. */
template <class T>
inline bool add_unique(std::vector<T>& v, const T& x)
{
	if (contains(v, x))
	{
		return false;
	}
	v.push_back(x);
	return true;
}

/** Quita la primera aparición (como Array.erase de Godot). */
template <class T>
inline void erase_first(std::vector<T>& v, const T& x)
{
	auto it = std::find(v.begin(), v.end(), x);
	if (it != v.end())
	{
		v.erase(it);
	}
}

/** Array.slice(0, n) de Godot. */
template <class T>
inline std::vector<T> head(const std::vector<T>& v, size_t n)
{
	return std::vector<T>(v.begin(), v.begin() + static_cast<std::ptrdiff_t>(std::min(n, v.size())));
}

template <class T, class F>
inline std::vector<T> filter(const std::vector<T>& v, F pred)
{
	std::vector<T> out;
	for (const T& x : v)
	{
		if (pred(x))
		{
			out.push_back(x);
		}
	}
	return out;
}

template <class T>
inline std::vector<T> concat(std::vector<T> a, const std::vector<T>& b)
{
	a.insert(a.end(), b.begin(), b.end());
	return a;
}

// ------------------------------------------------------------------ cadenas

inline bool starts_with(const std::string& s, const std::string& prefix)
{
	return s.size() >= prefix.size() && s.compare(0, prefix.size(), prefix) == 0;
}

inline bool ends_with(const std::string& s, const std::string& suffix)
{
	return s.size() >= suffix.size() && s.compare(s.size() - suffix.size(), suffix.size(), suffix) == 0;
}

/** String.to_int() de Godot: ignora lo que no son cifras, admite signo menos y para en el punto. */
inline int godot_to_int(const std::string& s)
{
	int64_t integer = 0;
	int sign = 1;
	for (char ch : s)
	{
		if (ch >= '0' && ch <= '9')
		{
			integer = integer * 10 + (ch - '0');
			if (integer > 2147483647LL)
			{
				integer = 2147483647LL;
			}
		}
		else if (ch == '-' && integer == 0)
		{
			sign = -sign;
		}
		else if (ch == '.')
		{
			break;
		}
	}
	return static_cast<int>(integer * sign);
}

std::string format(const char* fmt, ...);

inline std::string trim(const std::string& s)
{
	const char* ws = " \t\r\n";
	const size_t a = s.find_first_not_of(ws);
	if (a == std::string::npos)
	{
		return "";
	}
	const size_t b = s.find_last_not_of(ws);
	return s.substr(a, b - a + 1);
}

std::string join(const StrList& parts, const std::string& sep);

/** floor((v - 10) / 2): modificador de una puntuación de característica. */
inline int ability_mod(int score)
{
	return static_cast<int>(std::floor((score - 10) / 2.0));
}

} // namespace mdg
