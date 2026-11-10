// Herramienta nativa: lee peticiones JSON (una por línea) de la entrada estándar y escribe cada
// respuesta en una línea. Sirve para depurar y para el arnés de paridad sin compilar a wasm.
#include "MdgWeb.h"

#include <iostream>
#include <string>

int main()
{
	std::ios::sync_with_stdio(false);
	std::string linea;
	while (std::getline(std::cin, linea))
	{
		if (linea.empty())
		{
			continue;
		}
		std::cout << mdg::web::call(linea) << '\n' << std::flush;
	}
	return 0;
}
