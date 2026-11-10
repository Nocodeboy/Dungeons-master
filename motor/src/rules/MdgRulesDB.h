// Marca de Granito · núcleo de reglas portable.
// Base de datos de reglas cargada de Content/Data/*.json (los mismos JSON que la versión de Godot).
#pragma once

#include "MdgJson.h"

#include <memory>

namespace mdg
{

/** De dónde se leen los JSON. Unreal pone el suyo (IFileManager); las pruebas usan FolderSource. */
class DataSource
{
public:
	virtual ~DataSource() = default;
	/** Lee el archivo `rel` (ruta relativa con '/'). */
	virtual bool read_text(const std::string& rel, std::string& out) const = 0;
	/** Nombres de archivo (sin carpeta) de `rel_dir` que acaban en `ext`, en orden alfabético. */
	virtual StrList list_files(const std::string& rel_dir, const std::string& ext) const = 0;
};

/** Lee de una carpeta del disco con std::filesystem (pruebas y herramientas). */
class FolderSource : public DataSource
{
public:
	explicit FolderSource(std::string root) : root_(std::move(root)) {}
	bool read_text(const std::string& rel, std::string& out) const override;
	StrList list_files(const std::string& rel_dir, const std::string& ext) const override;

private:
	std::string root_;
};

class RulesDB
{
public:
	static Json weapons;
	static Json armor;
	static Json spells;
	static Json monsters;
	static Json classes;
	static Json species;
	static Json backgrounds;
	static Json feats;
	static Json features;
	static Json party;
	static Json names;
	static Json items;
	static Json encounters;
	static Json levels;
	static Json merchants;
	static Json world;
	static Json slot_tables;
	static bool loaded;
	/** Errores de la última carga (archivos que faltan o JSON inválido). */
	static StrList errors;

	/** Carga todo. Si ya estaba cargado no hace nada salvo que `force` sea true. */
	static bool load_all(const DataSource& src, bool force = false);
	static void clear();

	static const Json& spell(const std::string& id);
	/** Copia de los datos del arma con su "id". */
	static Json weapon(const std::string& id);
	/** Datos del monstruo con la herencia de "base" resuelta. */
	static Json monster_data(const std::string& id);
	static int prof_bonus_for(int level);
	/** Espacios de conjuro por nivel de espacio: "full", "half" o "pact". */
	static std::vector<int> slots_for(const std::string& caster, int level);
	/** Valor de una tabla por nivel {"1": x, "3": y}: el de la clave más alta <= nivel. */
	static Json at_level(const Json& table, int level, const Json& def = Json());
	static int at_level_int(const Json& table, int level, int def);
	static std::string at_level_str(const Json& table, int level, const std::string& def);
	static std::string feature_name(const std::string& fid);
	static std::string feature_desc(const std::string& fid);
	/** Conjuros de la lista de una clase. */
	static StrList class_spell_list(const std::string& cls, int max_level = 9, bool include_utility = true);
	static std::string spell_icon(const std::string& sid);
};

} // namespace mdg
