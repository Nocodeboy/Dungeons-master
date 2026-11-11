// Pruebas del puente web (mdg_call): una o dos comprobaciones por grupo de operaciones, con
// valores sacados del núcleo publicado. La paridad completa la mide paridad/comparar.mjs.
#include "doctest.h"

#include "MdgJson.h"
#include "MdgWeb.h"

using mdg::Json;

namespace
{

Json llamar(const Json& req)
{
	static bool listo = false;
	if (!listo)
	{
		mdg::web::configurar(MDG_DATA_DIR);
		listo = true;
	}
	return Json::parse(mdg::web::call(req.dump()));
}

Json campana()
{
	const Json h = llamar({{"op", "sheet_new"}, {"seed", 3}})["sheet"];
	const Json f = llamar({{"op", "sheet_finish"}, {"sheet", h}})["sheet"];
	return llamar({{"op", "cp_new"}, {"hero", f}, {"companions", {"brenna", "pip", "ilyra"}}, {"seed", 1}})["cp"];
}

} // namespace

TEST_CASE("web: peticiones mal formadas y operaciones desconocidas")
{
	CHECK(Json::parse(mdg::web::call("no es json"))["error"] == "Petición JSON no válida.");
	CHECK(llamar({{"op", "nada"}})["error"] == "sin combate");
	CHECK(llamar({{"op", "data"}, {"name", "zz"}})["error"] == "No hay datos con ese nombre: zz");
}

TEST_CASE("web: creador de personajes")
{
	const Json r = llamar({{"op", "sheet_new"}, {"seed", 3}});
	CHECK(r["sheet"]["name"] == "Ulrec Dunmere");
	CHECK(r["sheet"]["class"] == "fighter");
	CHECK(r["options"]["ready"] == true);
	Json s = r["sheet"];
	const Json w = llamar({{"op", "sheet_set"}, {"sheet", s}, {"set", {{"what", "class"}, {"value", "wizard"}}}, {"step", "spells"}});
	CHECK(w["ok"] == true);
	CHECK(w["sheet"]["background"] == "sage");
	CHECK(w["options"]["views"].contains("spells"));
	const Json mal = llamar({{"op", "sheet_set"}, {"sheet", s}, {"set", {{"what", "class"}, {"value", "zz"}}}});
	CHECK(mal["reason"] == "Esa clase no existe.");
}

TEST_CASE("web: campaña, pruebas, inventario y tienda")
{
	const Json cp = campana();
	CHECK(cp["party"].size() == 4);
	const Json c = llamar({{"op", "check"}, {"cp", cp}, {"skill", "stealth"}, {"dc", 12}, {"seed", 5}});
	CHECK(c["who"] == "hero");
	CHECK(c["mode"] == -1);
	CHECK(c["text"] == "Ulrec: Sigilo 2 + 2 = 4 (con desventaja) contra CD 12: fallo");
	const Json inv = llamar({{"op", "inv"}, {"cp", cp}, {"who", "hero"}});
	CHECK(inv["slots"]["armor"]["id"] == "chain_mail");
	CHECK(inv["stats"]["ac"] == 19);
	const Json tienda = llamar({{"op", "shop"}, {"cp", cp}, {"merchant", "peddler"}});
	CHECK(tienda["stock"][0]["id"] == "potion_healing");
	CHECK(tienda["stock"][0]["price"] == 55);
}

TEST_CASE("web: mapa de exploración")
{
	CHECK(llamar({{"op", "xmap_cell"}, {"cell", {0, 0}}})["error"] == "No hay mapa cargado (llama antes a xmap_load).");
	const Json m = llamar({{"op", "xmap_load"}, {"rows", {"......", ".#....", "..~...", "..TT..", "......"}}});
	CHECK(m["w"] == 6);
	const Json p = llamar({{"op", "xmap_path"}, {"from", {0, 0}}, {"to", {5, 4}}});
	CHECK(p["cost"] == 7);
	CHECK(p["path"].size() == 8);
	const Json q = llamar({{"op", "xmap_path"}, {"from", {0, 0}}, {"to", {1, 1}}});
	CHECK(q["goal"] == Json::array({1, 0}));
}

TEST_CASE("web: combate de encuentro con IA")
{
	const Json r = llamar({{"op", "init"}, {"encounter", "e1_prado"}, {"seed", 7}});
	REQUIRE(r.contains("state"));
	CHECK(r["state"]["over"] == false);
	for (int i = 0; i < 400; ++i)
	{
		const Json st = llamar({{"op", "state"}});
		if (st["over"] == true)
		{
			break;
		}
		llamar({{"op", "ai_turn"}});
		llamar({{"op", "end_turn"}});
	}
	CHECK(llamar({{"op", "state"}})["over"] == true);
}
