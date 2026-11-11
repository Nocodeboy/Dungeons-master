#define DOCTEST_CONFIG_IMPLEMENT
#include "doctest.h"

#include "MdgLoc.h"
#include "MdgRulesDB.h"

#include <cstdio>

int main(int argc, char** argv)
{
	mdg::FolderSource src(MDG_DATA_DIR);
	if (!mdg::RulesDB::load_all(src))
	{
		for (const std::string& e : mdg::RulesDB::errors)
		{
			std::fprintf(stderr, "%s\n", e.c_str());
		}
		return 2;
	}
	mdg::Loc::load(src);
	doctest::Context ctx;
	ctx.applyCommandLine(argc, argv);
	return ctx.run();
}
