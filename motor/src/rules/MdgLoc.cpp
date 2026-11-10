#include "MdgLoc.h"

namespace mdg
{

std::string Loc::lang = "es";
Json Loc::tables = Json::object();
const DataSource* Loc::source = nullptr;

void Loc::load(const DataSource& src)
{
	source = &src;
	tables = Json::object();
	load_lang("es");
	if (lang != "es")
	{
		load_lang(lang);
	}
	source = nullptr;
}

void Loc::set_lang(const std::string& l)
{
	lang = l;
}

void Loc::load_lang(const std::string& l)
{
	if (tables.contains(l) || source == nullptr)
	{
		return;
	}
	std::string text;
	if (!source->read_text("lang/" + l + ".json", text))
	{
		tables[l] = Json::object();
		return;
	}
	Json parsed = Json::parse(text, nullptr, false);
	tables[l] = (!parsed.is_discarded() && parsed.is_object()) ? parsed : Json::object();
}

std::string Loc::t(const std::string& key, const Var& args)
{
	const Json& table = jobj(tables, lang);
	std::string out;
	if (table.contains(key))
	{
		out = jto_str(table[key]);
	}
	else
	{
		out = jstr(jobj(tables, "es"), key, key);
	}
	if (args.is_dict())
	{
		// String.format(dict): cada clave, en orden, sustituye todas sus apariciones de {clave}
		for (const auto& kv : args.dct().items())
		{
			const std::string ph = "{" + kv.first.as_str() + "}";
			const std::string val = kv.second.str();
			size_t pos = 0;
			while ((pos = out.find(ph, pos)) != std::string::npos)
			{
				out.replace(pos, ph.size(), val);
				pos += val.size();
			}
		}
	}
	return out;
}

const Json& Loc::table()
{
	return jobj(tables, lang);
}

bool Loc::has(const std::string& key)
{
	return jobj(tables, lang).contains(key) || jobj(tables, "es").contains(key);
}

std::string Loc::ft(int feet)
{
	const double m = feet * 0.3;
	std::string s = format("%.1f", m);
	for (char& ch : s)
	{
		if (ch == '.')
		{
			ch = ',';
		}
	}
	if (ends_with(s, ",0"))
	{
		s = s.substr(0, s.size() - 2);
	}
	return s + " m";
}

} // namespace mdg
