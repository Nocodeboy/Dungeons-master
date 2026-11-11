// Marca de Granito · creador de personajes: piezas internas compartidas por el modelo y las vistas.
#pragma once

#include "MdgDice.h"
#include "MdgJson.h"

#include <utility>
#include <vector>

namespace mdg
{
namespace sheet_detail
{
std::string default_background(const std::string& cls);
}
} // namespace mdg

namespace mdg::web::creador
{

extern const StrList kChoiceKeys;
extern const StrList kClassKeys;
extern const StrList kHairColors;
extern const StrList kClothColors;
extern const std::vector<std::pair<std::string, std::string>> kBodies;
extern const std::vector<std::pair<std::string, std::string>> kHeads;

inline std::string sheet_detail_default_background(const std::string& cls)
{
	return mdg::sheet_detail::default_background(cls);
}

/** El creador sobre una hoja (con su "_creator"). */
struct Creador
{
	Json& s;
	Pcg32* rng;
	Json cache;
	bool cache_ok = false;

	Creador(Json& sheet, Pcg32* r);

	Json& estado();
	std::string modo();
	int nivel();
	bool bandera(const char* k);
	void poner(const char* k, bool v);

	const Json& cd();
	const Json& spd();
	const Json& bgd();
	/** Hoja completada al nivel del creador (en caché hasta el siguiente cambio). */
	const Json& full();
	void invalidar();

	void sincronizar_dotes();
	void rellenar();
	std::string al_azar(const StrList& opciones, int tope = 0);

	void fijar_clase(const std::string& cid, bool forzar = false);
	void fijar_especie(const std::string& sid);
	void fijar_trasfondo(const std::string& bid);
	void tirar_caracteristicas();
	void asignar_tiradas();

	int trucos_a_elegir();
	StrList preparados();
	void fijar_preparados(const StrList& pl);
	StrList invocaciones();
	StrList armas_de_maestria();
	StrList todos_los_trucos();

	std::vector<StrList> fuentes_de_habilidad();
	bool habilidades_posibles(const StrList& picks);

	bool tiene_rasgos();
	bool tiene_conjuros();
	bool subida_tiene_rasgos();
	StrList pasos();
	Json avisos_por_paso();

	std::string aplicar(const Json& set);
	void preparar_subida(int lvl);

	// Vistas (MdgCreadorVistas.cpp)
	Json opciones(const std::string& paso);
	Json vista(const std::string& paso);
	Json vista_clase();
	Json vista_especie();
	Json vista_trasfondo();
	Json vista_caracteristicas();
	Json vista_habilidades();
	Json vista_rasgos();
	Json vista_rasgos_subida();
	Json vista_conjuros();
	Json vista_equipo();
	Json vista_aspecto();
	Json vista_nombre();
	Json vista_avance();
	Json tarjeta_hechizo(const std::string& sid, bool on, bool enabled);
	Json heroe();
};

} // namespace mdg::web::creador
