// Marca de Granito · núcleo de reglas portable.
// Textos traducibles (data/lang/<idioma>.json). Español primero. Traducción de loc.gd.
#pragma once

#include "MdgRulesDB.h"
#include "MdgVar.h"

namespace mdg
{

class Loc
{
public:
	static std::string lang;

	/** Carga los idiomas disponibles (es siempre). */
	static void load(const DataSource& src);
	static void set_lang(const std::string& l);
	/** Traduce una clave y sustituye {marcadores} con str() de cada valor (como String.format). */
	static std::string t(const std::string& key, const Var& args = Var());
	static bool has(const std::string& key);
	/** Tabla de textos del idioma actual (para la operación «loc» sin claves). */
	static const Json& table();
	static std::string dmg_type(const std::string& t_id) { return t("dmg." + t_id); }
	static std::string cond(const std::string& c) { return t("cond." + c); }
	static std::string ability(const std::string& a) { return t("ab." + a); }
	static std::string ability_short(const std::string& a) { return t("abs." + a); }
	/** Pies a metros (5 pies = 1,5 m). */
	static std::string ft(int feet);

private:
	static Json tables;
	static const DataSource* source;
	static void load_lang(const std::string& l);
};

} // namespace mdg
