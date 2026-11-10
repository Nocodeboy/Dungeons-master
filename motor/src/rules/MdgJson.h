// Marca de Granito · núcleo de reglas portable.
// JSON (nlohmann, con orden de inserción como los Dictionary de Godot) y lectores tolerantes
// que imitan d.get(clave, defecto), int(x), str(x) y la «verdad» de GDScript.
#pragma once

#if defined(MDG_IN_UNREAL) && MDG_IN_UNREAL
#include "HAL/Platform.h"
THIRD_PARTY_INCLUDES_START
#pragma push_macro("check")
#pragma push_macro("verify")
#undef check
#undef verify
#endif

#include "nlohmann/json.hpp"

#if defined(MDG_IN_UNREAL) && MDG_IN_UNREAL
#pragma pop_macro("verify")
#pragma pop_macro("check")
THIRD_PARTY_INCLUDES_END
#endif

#include "MdgTypes.h"

namespace mdg
{

using Json = nlohmann::ordered_json;

const Json& jnull();
const Json& jempty_object();
const Json& jempty_array();

/** Hijo `k` de un objeto, o null si no es objeto o no lo tiene. */
const Json& jat(const Json& j, const std::string& k);
inline bool jhas(const Json& j, const std::string& k) { return j.is_object() && j.contains(k); }

/** «if x:» de GDScript: null, false, 0, "", [] y {} son falsos. */
bool jtruthy(const Json& v);
/** str(x) de GDScript. */
std::string jto_str(const Json& v);
/** int(x) de GDScript (trunca los decimales, convierte cadenas con to_int). */
int jto_int(const Json& v, int def = 0);
double jto_num(const Json& v, double def = 0.0);
/** bool(x) de GDScript. */
bool jto_bool(const Json& v, bool def = false);

/** d.get(k, def) leído como cadena/entero/número/booleano. Un null cuenta como ausente. */
std::string jstr(const Json& j, const std::string& k, const std::string& def = "");
int jint(const Json& j, const std::string& k, int def = 0);
double jnum(const Json& j, const std::string& k, double def = 0.0);
bool jbool(const Json& j, const std::string& k, bool def = false);
/** Hijo que es array (o un array vacío). */
const Json& jarr(const Json& j, const std::string& k);
/** Hijo que es objeto (o un objeto vacío). */
const Json& jobj(const Json& j, const std::string& k);

/** Elementos de un array como cadenas (str() de cada uno). */
StrList jstr_list(const Json& arr);
StrList jstrs(const Json& j, const std::string& k);
/** «s in arr». */
bool jin(const Json& arr, const std::string& s);
/** Claves de un objeto en orden. */
StrList jkeys(const Json& obj);
Json to_json(const StrList& v);
Json to_json(const std::vector<int>& v);
Json to_json(const Dict<int>& d);
Json to_json(const Dict<std::string>& d);
/** Diccionario {k: int(v)}. */
Dict<int> jint_dict(const Json& obj);
std::vector<int> jint_list(const Json& arr);

} // namespace mdg
