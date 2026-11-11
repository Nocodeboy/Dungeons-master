// Herramienta nativa: lee peticiones JSON (una por línea) de la entrada estándar y escribe cada
// respuesta en una línea. Sirve para depurar y para el arnés de paridad sin compilar a wasm.
//
// Con MDG_DETERMINISTA=1 imita el azar fijo que pone el arnés al wasm (paridad/modulo.mjs): reloj
// fijo y bytes de random_device en secuencia, para que las salidas sin semilla coincidan.
#include "MdgDice.h"
#include "MdgWeb.h"

#include <cstdlib>
#include <exception>
#include <iostream>
#include <string>

namespace
{

uint32_t g_contador = 0;

uint32_t bytes_fijos()
{
	uint32_t v = 0;
	for (int i = 0; i < 4; ++i)
	{
		const uint32_t b = (g_contador++ * 37u + 11u) & 255u;
		v |= b << (8 * i);
	}
	return v;
}

void entropia_fija(uint64_t& reloj, uint32_t& r1, uint32_t& r2)
{
	// 7 nov 2026 12:00:00 UTC en microsegundos (system_clock de libc++ en Emscripten)
	reloj = 1794052800000000ULL;
	r1 = bytes_fijos();
	r2 = bytes_fijos();
}

} // namespace

int main()
{
	const char* det = std::getenv("MDG_DETERMINISTA");
	if (det != nullptr && std::string(det) == "1")
	{
		mdg::Pcg32::entropia = entropia_fija;
	}
	mdg::web::configurar(MDG_DATA_DIR);
	std::ios::sync_with_stdio(false);
	std::string linea;
	while (std::getline(std::cin, linea))
	{
		try
		{
			std::cout << mdg::web::call(linea) << '\n' << std::flush;
		}
		catch (const std::exception&)
		{
			// En el wasm la excepción llega a JS como WebAssembly.Exception
			std::cout << "{\"excepcion\":\"Exception\"}\n" << std::flush;
		}
	}
	return 0;
}
