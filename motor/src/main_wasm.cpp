// Punto de entrada de rules.wasm: exporta mdg_call(const char*) -> const char*.
// La respuesta vive en un búfer estático hasta la siguiente llamada (el JS no la libera).
#include "MdgWeb.h"

#include <emscripten/emscripten.h>

#include <string>

namespace
{
std::string g_respuesta;
}

extern "C" EMSCRIPTEN_KEEPALIVE const char* mdg_call(const char* peticion)
{
	g_respuesta = mdg::web::call(peticion != nullptr ? std::string(peticion) : std::string());
	return g_respuesta.c_str();
}
