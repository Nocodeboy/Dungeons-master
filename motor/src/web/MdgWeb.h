// Marca de Granito · puente web del núcleo de reglas.
// Una sola entrada: mdg::web::call(json) -> json, la misma que exporta rules.wasm como mdg_call.
#pragma once

#include <string>

namespace mdg::web
{

/** Atiende una petición {"op": ..., ...} y devuelve la respuesta JSON como texto. */
std::string call(const std::string& request);

} // namespace mdg::web
