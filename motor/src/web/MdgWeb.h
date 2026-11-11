// Marca de Granito · puente web del núcleo de reglas.
// Una sola entrada: mdg::web::call(json) -> json, la misma que exporta rules.wasm como mdg_call.
#pragma once

#include <string>

namespace mdg::web
{

/** Atiende una petición {"op": ..., ...} y devuelve la respuesta JSON como texto. */
std::string call(const std::string& request);

/** Carpeta de los JSON de reglas (por defecto "/data", la de los archivos embebidos del wasm). */
void configurar(const std::string& carpeta_datos);

} // namespace mdg::web
