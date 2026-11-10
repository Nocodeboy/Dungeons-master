#include "MdgWeb.h"

#include "MdgJson.h"

namespace mdg::web
{

std::string call(const std::string& request)
{
	(void)request;
	return "{\"error\":\"sin combate\"}";
}

} // namespace mdg::web
