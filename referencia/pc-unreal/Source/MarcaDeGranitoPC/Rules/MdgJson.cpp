#include "MdgJson.h"

#include <cstdarg>
#include <cstdlib>
#include <cstdio>

namespace mdg
{

std::string format(const char* fmt, ...)
{
	char buf[1024];
	va_list args;
	va_start(args, fmt);
	const int n = std::vsnprintf(buf, sizeof(buf), fmt, args);
	va_end(args);
	if (n < 0)
	{
		return std::string();
	}
	if (static_cast<size_t>(n) < sizeof(buf))
	{
		return std::string(buf, static_cast<size_t>(n));
	}
	std::string big(static_cast<size_t>(n) + 1, '\0');
	va_start(args, fmt);
	std::vsnprintf(&big[0], big.size(), fmt, args);
	va_end(args);
	big.resize(static_cast<size_t>(n));
	return big;
}

std::string join(const StrList& parts, const std::string& sep)
{
	std::string out;
	for (size_t i = 0; i < parts.size(); ++i)
	{
		if (i > 0)
		{
			out += sep;
		}
		out += parts[i];
	}
	return out;
}

const Json& jnull()
{
	static const Json value;
	return value;
}

const Json& jempty_object()
{
	static const Json value = Json::object();
	return value;
}

const Json& jempty_array()
{
	static const Json value = Json::array();
	return value;
}

const Json& jat(const Json& j, const std::string& k)
{
	if (!j.is_object())
	{
		return jnull();
	}
	auto it = j.find(k);
	return it == j.end() ? jnull() : *it;
}

bool jtruthy(const Json& v)
{
	switch (v.type())
	{
	case Json::value_t::null:
		return false;
	case Json::value_t::boolean:
		return v.get<bool>();
	case Json::value_t::number_integer:
		return v.get<int64_t>() != 0;
	case Json::value_t::number_unsigned:
		return v.get<uint64_t>() != 0;
	case Json::value_t::number_float:
		return v.get<double>() != 0.0;
	case Json::value_t::string:
		return !v.get_ref<const std::string&>().empty();
	case Json::value_t::array:
	case Json::value_t::object:
		return !v.empty();
	default:
		return false;
	}
}

std::string jto_str(const Json& v)
{
	switch (v.type())
	{
	case Json::value_t::null:
		return "<null>";
	case Json::value_t::boolean:
		return v.get<bool>() ? "true" : "false";
	case Json::value_t::number_integer:
		return std::to_string(v.get<int64_t>());
	case Json::value_t::number_unsigned:
		return std::to_string(v.get<uint64_t>());
	case Json::value_t::number_float:
	{
		// Godot lee todos los números del JSON como float y str(1.0) da "1.0".
		const double d = v.get<double>();
		if (std::floor(d) == d && std::fabs(d) < 1e15)
		{
			return format("%.0f.0", d);
		}
		return format("%.14g", d);
	}
	case Json::value_t::string:
		return v.get<std::string>();
	default:
		return v.dump();
	}
}

int jto_int(const Json& v, int def)
{
	switch (v.type())
	{
	case Json::value_t::boolean:
		return v.get<bool>() ? 1 : 0;
	case Json::value_t::number_integer:
		return static_cast<int>(v.get<int64_t>());
	case Json::value_t::number_unsigned:
		return static_cast<int>(v.get<uint64_t>());
	case Json::value_t::number_float:
		return static_cast<int>(v.get<double>());
	case Json::value_t::string:
		return godot_to_int(v.get_ref<const std::string&>());
	default:
		return def;
	}
}

double jto_num(const Json& v, double def)
{
	switch (v.type())
	{
	case Json::value_t::boolean:
		return v.get<bool>() ? 1.0 : 0.0;
	case Json::value_t::number_integer:
		return static_cast<double>(v.get<int64_t>());
	case Json::value_t::number_unsigned:
		return static_cast<double>(v.get<uint64_t>());
	case Json::value_t::number_float:
		return v.get<double>();
	case Json::value_t::string:
		return std::atof(v.get_ref<const std::string&>().c_str());
	default:
		return def;
	}
}

bool jto_bool(const Json& v, bool def)
{
	if (v.is_null())
	{
		return def;
	}
	return jtruthy(v);
}

std::string jstr(const Json& j, const std::string& k, const std::string& def)
{
	const Json& v = jat(j, k);
	if (v.is_null())
	{
		return def;
	}
	return jto_str(v);
}

int jint(const Json& j, const std::string& k, int def)
{
	const Json& v = jat(j, k);
	return v.is_null() ? def : jto_int(v, def);
}

double jnum(const Json& j, const std::string& k, double def)
{
	const Json& v = jat(j, k);
	return v.is_null() ? def : jto_num(v, def);
}

bool jbool(const Json& j, const std::string& k, bool def)
{
	const Json& v = jat(j, k);
	return v.is_null() ? def : jtruthy(v);
}

const Json& jarr(const Json& j, const std::string& k)
{
	const Json& v = jat(j, k);
	return v.is_array() ? v : jempty_array();
}

const Json& jobj(const Json& j, const std::string& k)
{
	const Json& v = jat(j, k);
	return v.is_object() ? v : jempty_object();
}

StrList jstr_list(const Json& arr)
{
	StrList out;
	if (!arr.is_array())
	{
		return out;
	}
	out.reserve(arr.size());
	for (const Json& e : arr)
	{
		out.push_back(jto_str(e));
	}
	return out;
}

StrList jstrs(const Json& j, const std::string& k)
{
	return jstr_list(jat(j, k));
}

bool jin(const Json& arr, const std::string& s)
{
	if (!arr.is_array())
	{
		return false;
	}
	for (const Json& e : arr)
	{
		if (e.is_string() && e.get_ref<const std::string&>() == s)
		{
			return true;
		}
	}
	return false;
}

StrList jkeys(const Json& obj)
{
	StrList out;
	if (!obj.is_object())
	{
		return out;
	}
	for (auto it = obj.begin(); it != obj.end(); ++it)
	{
		out.push_back(it.key());
	}
	return out;
}

Json to_json(const StrList& v)
{
	Json out = Json::array();
	for (const std::string& s : v)
	{
		out.push_back(s);
	}
	return out;
}

Json to_json(const std::vector<int>& v)
{
	Json out = Json::array();
	for (int i : v)
	{
		out.push_back(i);
	}
	return out;
}

Json to_json(const Dict<int>& d)
{
	Json out = Json::object();
	for (const auto& kv : d)
	{
		out[kv.first] = kv.second;
	}
	return out;
}

Json to_json(const Dict<std::string>& d)
{
	Json out = Json::object();
	for (const auto& kv : d)
	{
		out[kv.first] = kv.second;
	}
	return out;
}

Dict<int> jint_dict(const Json& obj)
{
	Dict<int> out;
	if (!obj.is_object())
	{
		return out;
	}
	for (auto it = obj.begin(); it != obj.end(); ++it)
	{
		out[it.key()] = jto_int(it.value());
	}
	return out;
}

std::vector<int> jint_list(const Json& arr)
{
	std::vector<int> out;
	if (!arr.is_array())
	{
		return out;
	}
	for (const Json& e : arr)
	{
		out.push_back(jto_int(e));
	}
	return out;
}

} // namespace mdg
