// Marca de Granito · creador de personajes y subida de nivel sobre la hoja (port del modelo de
// scripts/ui/character_creator.gd sin interfaz). El estado del creador viaja en la propia hoja,
// en "_creator" = {mode: "create"|"levelup", level, bg_chosen, abilities_touched, look_touched}.
#pragma once

#include "MdgDice.h"
#include "MdgJson.h"

namespace mdg::web::creador
{

/** Hoja de la petición con "_creator" (si falta, uno con todo «tocado») y el nivel pedido. */
Json hoja_de(const Json& req);

/** Hoja nueva del creador: guerrero humano con todo lo recomendado y un nombre al azar. */
Json nueva(const Json& req, Pcg32& rng);

/** Aplica un cambio {what, value, ...}; devuelve el motivo si no se ha podido ("" si sí). */
std::string aplicar(Json& sheet, const Json& set, Pcg32& rng);

/** Opciones y vistas para la interfaz (todas las vistas, o solo la del paso pedido). */
Json opciones(Json& sheet, const std::string& paso);

/** Hoja final del creador (sin campos internos), como result_sheet(). */
Json resultado(const Json& sheet);

/** Problemas pendientes del creador (los avisos de los pasos). */
StrList avisos(Json& sheet);

/** Prepara la hoja para la subida de nivel a `nivel` (setup_level_up). */
void preparar_subida(Json& sheet, int nivel);

} // namespace mdg::web::creador
