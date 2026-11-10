// Marca de Granito · núcleo de reglas portable.
// Hoja de personaje (formato del creador y de los compañeros escritos). complete() rellena
// cualquier elección que falte con opciones recomendadas: una hoja a medias (o de un
// mercenario) siempre da un personaje válido. Traducción de scripts/core/character_sheet.gd.
#pragma once

#include "MdgDice.h"
#include "MdgJson.h"

namespace mdg
{

class CharacterSheet
{
public:
	static const StrList kSkills;
	static const StrList kAbilities;
	static const std::vector<int> kStandardArray;
	static constexpr int kPointBuyTotal = 27;
	static constexpr int kMaxLevel = 3;

	static int point_buy_cost(int score);

	static const Json& class_data(const Json& s);
	static const Json& species_data(const Json& s);
	static const Json& lineage_data(const Json& s);
	static const Json& ancestry_data(const Json& s);
	static std::string casting_ability(const Json& s);
	static int mod(int score) { return ability_mod(score); }
	static StrList origin_feats();
	static StrList fighting_styles_for(const std::string& cls);
	static int fighting_style_level(const std::string& cls);

	// Características
	/** Puntuaciones finales (base + trasfondo). Si la hoja solo trae "abilities", ya son finales. */
	static Dict<int> final_abilities(const Json& s);
	static int point_buy_spent(const Json& base);
	/** Reparto por defecto del +2/+1 del trasfondo. */
	static Json default_bg_bonus(const Json& s);

	// Habilidades
	struct SkillSlots
	{
		int cls = 0;
		int species = 0;
		int feats = 0;
		int class_bonus = 0;
	};
	static SkillSlots skill_slots(const Json& s, int level);
	static StrList fixed_skills(const Json& s);
	static int overlapping_fixed(const Json& s);
	static int required_skills(const Json& s, int level);
	static int expertise_count(const Json& s, int level);
	static StrList expertise_list(const Json& s, int level);

	// Dotes
	static StrList all_feats(const Json& s, int level);
	static StrList invocations_at(const Json& s, int level);

	// Completar
	static Json complete(const Json& sheet, int level);
	static Json kit_for(const Json& s);
	static int max_spell_level(const Json& s, int level);
	static StrList always_prepared(const Json& s, int level);
	/** Aspecto visual completo de un héroe creado. */
	static Json visual_for(const Json& sheet);
	/** Nombre inventado según especie y pronombre ("m", "f" o "n"). */
	static std::string random_name(const std::string& species, const std::string& pronoun, Pcg32* rng = nullptr);

	// Resumen
	static StrList features_gained(const Json& s, int level);
	static StrList class_features_up_to(const Json& s, int level);
	static int hp_at(const Json& s, int level);
	/** Problemas que impiden dar la hoja por buena (para el creador). */
	static StrList validate(const Json& s, int level);

private:
	static std::string best_mental(const Json& s);
	static bool valid_bg_bonus(const Json& b, const Json& bg);
	static bool has_prefix(const StrList& arr, const std::string& prefix);
	static int origin_feat_count(const StrList& feats);
	static Json complete_magic_initiate(const Json& s, const Json& bg);
	static std::string default_style(const Json& s);
	static void complete_equipment(Json& s);
	static bool mastery_ok(const Json& cd, const std::string& wid);
	static StrList mastery_candidates(const Json& s, const Json& cd);
	static void complete_skills(Json& s, int level);
	static void complete_spells(Json& s, int level);
	static void complete_invocations(Json& s, int level);
	static bool inv_req_ok(const Json& s, const Json& inv);
};

} // namespace mdg
