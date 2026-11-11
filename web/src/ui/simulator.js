// ui/simulator.js
// Simulador JS de las operaciones del núcleo que la versión publicada aún no tenía (hojas, campaña,
// inventario, tiendas, pruebas), sobre los datos de datos/reglas/*.json. Lo usa rules-bridge.js como
// respaldo cuando mdg_call contesta «op desconocida».
// Reconstruido de publicado/juego.js (módulo __esm «Vw»).

import reglasEspecies from '../datos/reglas/especies.json';
import reglasClases from '../datos/reglas/clases.json';
import reglasTrasfondos from '../datos/reglas/trasfondos.json';
import reglasDotes from '../datos/reglas/dotes.json';
import reglasConjuros from '../datos/reglas/conjuros.json';
import reglasArmas from '../datos/reglas/armas.json';
import reglasArmaduras from '../datos/reglas/armaduras.json';
import reglasObjetos from '../datos/reglas/objetos.json';
import reglasComerciantes from '../datos/reglas/comerciantes.json';
import reglasCompaneros from '../datos/reglas/companeros.json';
import reglasNombres from '../datos/reglas/nombres.json';
import reglasRasgos from '../datos/reglas/rasgos.json';

function itemDef(id) {
  if (!id) return null;
  if (reglasArmas[id]) {
    let def = reglasArmas[id];
    return {
      ...def,
      id,
      kind: 'weapon',
      slot: 'main',
      price: def.cost ?? 0,
      icon: def.kind === 'ranged' ? 'ranged' : 'sword',
    };
  }
  if (reglasArmaduras[id]) {
    let def = reglasArmaduras[id];
    return { ...def, id, kind: 'armor', slot: 'armor', price: def.cost ?? 0, icon: 'armor' };
  }
  if (reglasObjetos[id]) {
    let def = reglasObjetos[id],
      slot = def.slot || '';
    return (
      (def.kind === 'weapon' || (def.base && reglasArmas[def.base])) && (slot = 'main'),
      (def.kind === 'armor' || (def.base && reglasArmaduras[def.base])) && (slot = 'armor'),
      slot === 'shield' && (slot = 'off'),
      def.kind === 'ammo' && (slot = 'ammo'),
      { ...def, id, slot, price: def.value ?? 0 }
    );
  }
  return { id, name: id, kind: 'gear', price: 0 };
}
function itemInfo(id) {
  let def = itemDef(id),
    props = [];
  if (def.kind === 'weapon' || reglasArmas[def.base]) {
    let weapon = reglasArmas[def.base] || def;
    props.push(
      `${weapon.damage}${def.bonus ? ` + ${def.bonus}` : ''} ${DAMAGE_TYPES[weapon.type] || weapon.type}`,
    );
    for (let prop of weapon.props || [])
      props.push(
        {
          finesse: 'Sutil',
          light: 'Ligera',
          heavy: 'Pesada',
          two_handed: 'A dos manos',
          versatile: `Vers\xE1til (${weapon.versatile})`,
          thrown: 'Arrojadiza',
          ammunition: 'Munici\xF3n',
          loading: 'Recarga',
          reach: 'Alcance',
        }[prop] || prop,
      );
    weapon.mastery &&
      props.push(
        `Maestr\xEDa: ${{ cleave: 'Hendir', graze: 'Rozar', nick: 'Encadenar', push: 'Empujar', sap: 'Debilitar', slow: 'Ralentizar', topple: 'Derribar', vex: 'Hostigar' }[weapon.mastery]}`,
      );
  }
  if (def.kind === 'armor' || reglasArmaduras[def.base]) {
    let armor = reglasArmaduras[def.base] || def;
    (props.push(
      `CA ${armor.base}${armor.dex_cap === 0 ? '' : armor.dex_cap ? ' + Des (m\xE1x. 2)' : ' + Des'}`,
    ),
      armor.str_req && props.push(`Fuerza ${armor.str_req}`),
      armor.stealth_dis && props.push('Desventaja en Sigilo'));
  }
  return (
    def.attune && props.push('Requiere sinton\xEDa'),
    {
      id,
      name: def.name || id,
      kind: def.kind,
      slot: def.slot || '',
      desc: def.desc || '',
      price: def.price || 0,
      weight: def.weight || 0,
      props,
      magic: (!!def.rarity && def.rarity !== 'common') || !!def.bonus,
      rarity: def.rarity || 'common',
      unidentified_name: def.unid_name || '',
      icon: def.icon || '',
    }
  );
}
function abilityScores(sheet) {
  let base = sheet.base_abilities || sheet.abilities || reglasClases[sheet.class]?.std_array || {},
    scores = {};
  for (let key of ABILITIES) scores[key] = Number(base[key] ?? 10) + Number((sheet.bg_bonus || {})[key] || 0);
  return scores;
}
function defaultBgBonus(sheet) {
  let allowed = (reglasTrasfondos[sheet.background] || {}).abilities || ['str', 'dex', 'con'],
    primary = reglasClases[sheet.class]?.primary || [],
    order = [...allowed].sort(
      (a, b) =>
        (primary.indexOf(b) >= 0 ? 1 : 0) - (primary.indexOf(a) >= 0 ? 1 : 0) ||
        (reglasClases[sheet.class]?.std_array?.[b] || 0) - (reglasClases[sheet.class]?.std_array?.[a] || 0),
    );
  return { [order[0]]: 2, [order[1]]: 1 };
}
function originFeatIds() {
  return Object.keys(reglasDotes).filter((id) => reglasDotes[id].category === 'origin');
}
function originFeats(sheet) {
  let feats = [],
    bgFeat = reglasTrasfondos[sheet.background]?.feat;
  return (
    bgFeat && feats.push(bgFeat),
    reglasEspecies[sheet.species]?.extra_origin_feat &&
      feats.push(sheet.human_feat || (bgFeat === 'skilled' ? 'alert' : 'skilled')),
    feats
  );
}
function skillPicks(sheet, level) {
  let cls = reglasClases[sheet.class] || {},
    species = reglasEspecies[sheet.species] || {},
    count = Number(cls.skills?.choose || 2);
  return (
    species.keen_senses && count++,
    (count += Number(species.skill_choices || 0)),
    originFeats(sheet).includes('skilled') && (count += 3),
    count + (sheet.class === 'bard' && level >= 3 ? 3 : 0)
  );
}
function fixedSkills(sheet) {
  return [
    ...(reglasTrasfondos[sheet.background]?.skills || []),
    ...(reglasEspecies[sheet.species]?.skills || []),
  ];
}
function cantripCount(sheet, level) {
  return Number(byLevel(reglasClases[sheet.class]?.casting?.cantrips, level, 0));
}
function preparedCount(sheet, level) {
  return Number(byLevel(reglasClases[sheet.class]?.casting?.prepared, level, 0));
}
function maxSpellLevel(classId, level) {
  let type = reglasClases[classId]?.casting?.type;
  return type === 'full'
    ? level >= 3
      ? 2
      : 1
    : type === 'half'
      ? level >= 2
        ? 1
        : 0
      : type === 'pact'
        ? level >= 3
          ? 2
          : 1
        : 0;
}
function slotTable(classId, level) {
  let type = reglasClases[classId]?.casting?.type;
  return type === 'full'
    ? [[2, 3, 4][level - 1] || 4, level >= 3 ? 2 : 0]
    : type === 'half'
      ? level >= 2
        ? [level === 2 ? 2 : 3]
        : []
      : type === 'pact'
        ? level >= 3
          ? [0, 2]
          : [level >= 2 ? 2 : 1]
        : [];
}
function spellEntry(id) {
  let def = reglasConjuros[id] || {};
  return {
    id,
    name: def.name || id,
    level: def.level || 0,
    school: def.school || '',
    tags: def.tags || [],
    desc: def.desc || '',
    concentration: !!def.concentration,
    ritual: !!def.ritual,
    cast: def.cast || 'action',
    range: def.range || 0,
  };
}
function preparedIds(sheet) {
  let prepared = sheet.prepared;
  return Array.isArray(prepared)
    ? prepared
    : prepared && typeof prepared == 'object'
      ? [...new Set(Object.values(prepared).flat())]
      : [];
}
/** Rellena una hoja con los valores por defecto de su clase, especie y trasfondo (sheet_complete). */
function completeSheet(input, level = 1) {
  let sheet = clone(input || {});
  ((sheet.class ??= 'fighter'),
    (sheet.species ??= 'human'),
    (sheet.background ??= CLASS_BACKGROUND[sheet.class] || 'soldier'),
    (sheet.ability_method ??= 'standard'),
    (sheet.base_abilities ??= clone(reglasClases[sheet.class]?.std_array || {})),
    (!sheet.bg_bonus || !Object.keys(sheet.bg_bonus).length) && (sheet.bg_bonus = defaultBgBonus(sheet)));
  let species = reglasEspecies[sheet.species] || {};
  (species.lineages && !species.lineages[sheet.lineage] && (sheet.lineage = Object.keys(species.lineages)[0]),
    species.ancestries &&
      !species.ancestries[sheet.ancestry] &&
      (sheet.ancestry = Object.keys(species.ancestries)[0]),
    species.lineage_ability && !sheet.lineage_ability && (sheet.lineage_ability = 'int'),
    (species.sizes || []).length > 1 && !sheet.size && (sheet.size = 'medium'),
    (sheet.feats = originFeats(sheet)));
  let cls = reglasClases[sheet.class] || {},
    fixed = fixedSkills(sheet);
  if (sheet.skills) sheet.skills = [...new Set([...fixed, ...sheet.skills])];
  else {
    let pool = [...(cls.skills?.from || [])].filter((skill) => !fixed.includes(skill));
    ((sheet.skills = [...fixed, ...pool.slice(0, Number(cls.skills?.choose || 2))]),
      species.keen_senses &&
        sheet.skills.push(
          species.keen_senses.find((skill) => !sheet.skills.includes(skill)) || 'perception',
        ));
  }
  let expertiseCount = Number(byLevel(cls.expertise_count, level, 0));
  expertiseCount && !sheet.expertise && (sheet.expertise = sheet.skills.slice(0, expertiseCount));
  let masteryCount = Number(byLevel(cls.mastery_count, level, 0));
  (masteryCount &&
    !sheet.masteries &&
    (sheet.masteries = (cls.kits?.[0]?.weapons || []).slice(0, masteryCount)),
    cls.fighting_style_level &&
      cls.fighting_style_level <= level &&
      !sheet.fighting_style &&
      (sheet.fighting_style = 'defense'),
    cls.orders &&
      !sheet[sheet.class === 'cleric' ? 'divine_order' : 'primal_order'] &&
      (sheet[sheet.class === 'cleric' ? 'divine_order' : 'primal_order'] = Object.keys(cls.orders)[0]));
  let casting = cls.casting;
  if (casting) {
    let recommended = casting.recommended || {};
    (sheet.cantrips ||
      (sheet.cantrips = (
        recommended.cantrips || casting.list.filter((spell) => (reglasConjuros[spell]?.level || 0) === 0)
      ).slice(0, cantripCount(sheet, level))),
      sheet.prepared ||
        (sheet.prepared = {
          1: (recommended[1] || casting.list.filter((spell) => reglasConjuros[spell]?.level === 1)).slice(
            0,
            preparedCount(sheet, level),
          ),
        }));
  }
  return (
    cls.subclasses && level >= 3 && !sheet.subclass && (sheet.subclass = Object.keys(cls.subclasses)[0]),
    sheet.kit || (sheet.kit = cls.kits?.[0]?.id || ''),
    (sheet.name ??= ''),
    (sheet.pronoun ??= 'm'),
    sheet
  );
}
function kitOf(sheet) {
  let cls = reglasClases[sheet.class] || {};
  return (cls.kits || []).find((kit) => kit.id === sheet.kit) || cls.kits?.[0] || {};
}
function maxHp(sheet, level) {
  let cls = reglasClases[sheet.class] || {},
    hitDie = Number(cls.hit_die || 8),
    conMod = abilityMod(abilityScores(sheet).con),
    hp = hitDie + conMod + (level - 1) * (Math.floor(hitDie / 2) + 1 + conMod);
  return (sheet.species === 'dwarf' && (hp += level), Math.max(1, hp));
}
function armorClass(sheet) {
  let scores = abilityScores(sheet),
    dexMod = abilityMod(scores.dex),
    parts = [],
    kit = sheet.weapons ? null : kitOf(sheet),
    armorId = kit ? kit.armor : sheet.armor,
    armor = armorId ? reglasArmaduras[itemDef(armorId).base || armorId] : null,
    ac;
  if (armor) {
    let dexBonus = armor.dex_cap === 0 ? 0 : armor.dex_cap ? Math.min(armor.dex_cap, dexMod) : dexMod;
    ((ac = armor.base + dexBonus),
      parts.push(`${armor.name} ${armor.base}`),
      dexBonus && parts.push(`Destreza ${dexBonus >= 0 ? '+' : ''}${dexBonus}`));
  } else
    sheet.class === 'barbarian'
      ? ((ac = 10 + dexMod + abilityMod(scores.con)), parts.push('Defensa sin armadura'))
      : sheet.class === 'monk'
        ? ((ac = 10 + dexMod + abilityMod(scores.wis)), parts.push('Defensa sin armadura'))
        : ((ac = 10 + dexMod), parts.push('Base 10', `Destreza ${dexMod >= 0 ? '+' : ''}${dexMod}`));
  if (kit ? kit.shield : sheet.shield) {
    let shieldBonus = 2 + Number(itemDef(sheet.shield_id || 'shield').bonus || 0);
    ((ac += shieldBonus), parts.push(`Escudo +${shieldBonus}`));
  }
  sheet.fighting_style === 'defense' && armor && ((ac += 1), parts.push('Defensa +1'));
  for (let slot of ['cloak', 'ring1', 'ring2', 'amulet', 'boots', 'gloves']) {
    let bonus = itemDef(sheet.worn?.[slot])?.mods?.ac;
    bonus && ((ac += bonus), parts.push(`${itemDef(sheet.worn[slot]).name} +${bonus}`));
  }
  return { ac, parts };
}
function attackList(sheet, level) {
  let scores = abilityScores(sheet),
    list = [],
    weapons = [...(sheet.weapons || kitOf(sheet).weapons || [])].slice(0, 3);
  weapons.length || weapons.push('unarmed');
  for (let weaponId of weapons) {
    let item = itemDef(weaponId),
      weapon = reglasArmas[item.base || weaponId] || {
        name: 'Desarmado',
        damage: '1',
        type: 'bludgeoning',
        props: [],
        kind: 'melee',
      },
      ranged = weapon.kind === 'ranged',
      useDex = ranged || ((weapon.props || []).includes('finesse') && scores.dex > scores.str),
      dmgMod = abilityMod(useDex ? scores.dex : scores.str) + Number(item.bonus || 0),
      toHit = dmgMod + profBonus(level);
    list.push({
      key: weaponId,
      name: item.name || weapon.name,
      to_hit: toHit,
      damage:
        `${weapon.damage}${dmgMod ? (dmgMod > 0 ? ` + ${dmgMod}` : ` \u2212 ${-dmgMod}`) : ''} ${DAMAGE_TYPES[weapon.type] || ''}`.trim(),
      mastery: (sheet.masteries || []).includes(item.base || weaponId) ? weapon.mastery : '',
      range: ranged ? `${Math.round((weapon.range || 80) * 0.3)} m` : '1,5 m',
      ammo: ranged ? (sheet.ammo?.[item.base || weaponId] ?? null) : null,
    });
  }
  return list;
}
/** Resumen de una hoja a un nivel: características, CA, PG, habilidades, ataques, conjuros… (sheet_summary). */
function sheetSummary(input, level = 1, state = null) {
  let sheet = completeSheet(input, level);
  for (let key of ['weapons', 'armor', 'shield', 'shield_id', 'worn', 'pack', 'items', 'ammo'])
    input?.[key] !== void 0 && (sheet[key] = input[key]);
  let cls = reglasClases[sheet.class] || {},
    species = reglasEspecies[sheet.species] || {},
    scores = abilityScores(sheet),
    prof = profBonus(level),
    saveProfs = cls.saves || [],
    armor = armorClass(sheet),
    hp = maxHp(sheet, level),
    skills = SKILLS.map((id) => {
      let proficient = (sheet.skills || []).includes(id),
        expert = (sheet.expertise || []).includes(id);
      return {
        id,
        name: SKILL_NAMES[id],
        ability: SKILL_ABILITY[id],
        mod: abilityMod(scores[SKILL_ABILITY[id]]) + (proficient ? prof : 0) + (expert ? prof : 0),
        prof: proficient,
        expert,
      };
    }),
    skillMod = (id) => skills.find((skill) => skill.id === id).mod,
    casting = cls.casting,
    features = [];
  for (let lvl = 1; lvl <= level; lvl++)
    for (let feature of cls.features?.[String(lvl)] || []) feature !== 'subclass' && features.push(feature);
  if (sheet.subclass)
    for (let lvl = 1; lvl <= level; lvl++)
      for (let feature of cls.subclasses?.[sheet.subclass]?.features?.[String(lvl)] || [])
        features.push(feature);
  for (let trait of species.traits || []) features.push(trait);
  let st = state || {},
    lineage = species.lineages?.[sheet.lineage],
    ancestry = species.ancestries?.[sheet.ancestry];
  return {
    name: sheet.name || 'Sin nombre',
    species_name:
      species.name +
      (lineage ? ` (${lineage.name.toLowerCase()})` : ancestry ? ` (${ancestry.name.toLowerCase()})` : ''),
    class_name: cls.name,
    subclass_name: cls.subclasses?.[sheet.subclass]?.name || '',
    background_name: reglasTrasfondos[sheet.background]?.name || '',
    level,
    prof,
    abilities: Object.fromEntries(
      ABILITIES.map((key) => [
        key,
        {
          score: scores[key],
          mod: abilityMod(scores[key]),
          save: abilityMod(scores[key]) + (saveProfs.includes(key) ? prof : 0),
          save_prof: saveProfs.includes(key),
        },
      ]),
    ),
    ac: armor.ac,
    ac_parts: armor.parts,
    hp: st.hp ?? hp,
    max_hp: hp,
    temp_hp: st.temp_hp || 0,
    speed: Number(lineage?.speed || species.speed || 30),
    speed_text: `${String(Number(lineage?.speed || species.speed || 30) * 0.3).replace('.', ',')} m`,
    initiative: abilityMod(scores.dex) + (sheet.feats.includes('alert') ? prof : 0),
    passive: {
      perception: 10 + skillMod('perception'),
      investigation: 10 + skillMod('investigation'),
      insight: 10 + skillMod('insight'),
    },
    darkvision: Number(lineage?.darkvision || species.darkvision || 0),
    skills,
    languages: [
      'Com\xFAn',
      ...(sheet.species === 'dwarf' ? ['Enano'] : sheet.species === 'elf' ? ['\xC9lfico'] : []),
    ],
    tools: [reglasTrasfondos[sheet.background]?.tool].filter(Boolean),
    attacks: attackList(sheet, level),
    spells: casting
      ? {
          ability: casting.ability,
          dc: 8 + prof + abilityMod(scores[casting.ability]),
          attack: prof + abilityMod(scores[casting.ability]),
          slots: slotTable(sheet.class, level)
            .map((count, index) => ({ level: index + 1, cur: st.slots?.[index] ?? count, max: count }))
            .filter((slot) => slot.max > 0),
          cantrips: (sheet.cantrips || []).map(spellEntry),
          prepared: preparedIds(sheet).map(spellEntry),
        }
      : null,
    features: [...new Set(features)].map((id) => ({
      id,
      name: reglasRasgos[id]?.name || id,
      desc: reglasRasgos[id]?.desc || '',
      uses: id === 'second_wind' ? 2 : null,
      max: id === 'second_wind' ? 2 : null,
    })),
    feats: sheet.feats.map((id) => ({
      id,
      name: reglasDotes[id]?.name || id,
      desc: reglasDotes[id]?.desc || '',
    })),
    resources: {},
    conditions: st.conditions || [],
    traits: species.traits || [],
    hit_dice: { cur: st.hit_dice ?? level, max: level, die: Number(cls.hit_die || 8) },
    saves: Object.fromEntries(
      ABILITIES.map((key) => [key, abilityMod(scores[key]) + (saveProfs.includes(key) ? prof : 0)]),
    ),
    class: sheet.class,
    species: sheet.species,
    background: sheet.background,
    pronoun: sheet.pronoun,
  };
}
/** Opciones y errores del creador para una hoja (sheet_options). */
function sheetOptions(input, level = 1) {
  let sheet = completeSheet(input, level),
    cls = reglasClases[sheet.class] || {},
    species = reglasEspecies[sheet.species] || {},
    errors = [],
    scores = abilityScores(sheet),
    spent = ABILITIES.reduce((total, key) => total + (POINT_BUY_COST[sheet.base_abilities?.[key]] ?? 99), 0);
  sheet.ability_method === 'point_buy' && spent > 27 && errors.push('Has gastado m\xE1s de 27 puntos.');
  let skillCount = skillPicks(sheet, level),
    fixed = fixedSkills(sheet),
    chosen = (input.skills || sheet.skills).filter((skill) => !fixed.includes(skill));
  chosen.length < skillCount &&
    errors.push(`Te faltan ${skillCount - chosen.length} habilidades por elegir.`);
  let casting = cls.casting,
    hasInitiate = sheet.feats.includes('magic_initiate'),
    spellList = casting?.list || [],
    maxLevel = maxSpellLevel(sheet.class, level),
    cantripsNeeded = cantripCount(sheet, level),
    preparedNeeded = preparedCount(sheet, level);
  (casting &&
    ((input.cantrips || sheet.cantrips).length < cantripsNeeded ||
      preparedIds(input.prepared ? input : sheet).length < preparedNeeded) &&
    errors.push('Te quedan conjuros por elegir.'),
    String(input.name || '').trim() || errors.push('Falta el nombre.'));
  let kit = kitOf(sheet),
    masteriesNeeded = Number(byLevel(cls.mastery_count, level, 0)),
    invocationsNeeded = Number(byLevel(cls.invocation_count, level, 0)),
    initiateList = reglasTrasfondos[sheet.background]?.feat_list || 'wizard';
  return {
    final_abilities: scores,
    point_buy_spent: spent,
    point_buy_max: 27,
    standard_array: [15, 14, 13, 12, 10, 8],
    recommended_abilities: clone(cls.std_array || {}),
    primary: cls.primary || [],
    skill_slots: {
      count: skillCount,
      from: cls.skills?.from || SKILLS,
      any: Number(species.skill_choices || 0) + (sheet.feats.includes('skilled') ? 3 : 0),
      keen: species.keen_senses || [],
    },
    fixed_skills: fixed,
    expertise_count: Number(byLevel(cls.expertise_count, level, 0)),
    expertise_from: cls.expertise_from || sheet.skills,
    feats_needed: species.extra_origin_feat ? 1 : 0,
    origin_feats: originFeatIds().map((id) => ({
      id,
      name: reglasDotes[id].name,
      desc: reglasDotes[id].desc,
    })),
    feats: sheet.feats.map((id) => ({
      id,
      name: reglasDotes[id]?.name || id,
      desc: reglasDotes[id]?.desc || '',
    })),
    fighting_styles:
      cls.fighting_style_level && cls.fighting_style_level <= level
        ? Object.keys(reglasDotes)
            .filter(
              (id) =>
                reglasDotes[id].category === 'fighting_style' &&
                (id !== 'blessed_warrior' || sheet.class === 'paladin') &&
                (id !== 'druidic_warrior' || sheet.class === 'ranger'),
            )
            .map((id) => ({ id, name: reglasDotes[id].name, desc: reglasDotes[id].desc }))
        : [],
    orders: cls.orders
      ? {
          key: sheet.class === 'cleric' ? 'divine_order' : 'primal_order',
          label: reglasRasgos[sheet.class === 'cleric' ? 'divine_order' : 'primal_order']?.name || 'Orden',
          from: Object.entries(cls.orders).map(([id, order]) => ({ id, name: order.name, desc: order.desc })),
        }
      : null,
    invocations: invocationsNeeded
      ? {
          count: invocationsNeeded,
          from: Object.entries(reglasRasgos.invocations || {})
            .filter(([, inv]) => (inv.level || 1) <= level)
            .map(([id, inv]) => ({ id, name: inv.name, desc: inv.desc, requires: inv.requires || '' })),
        }
      : null,
    masteries: masteriesNeeded
      ? {
          count: masteriesNeeded,
          from: Object.entries(reglasArmas)
            .filter(
              ([, weapon]) =>
                weapon.mastery &&
                (cls.weapons || []).some(
                  (cat) =>
                    cat === weapon.cat || cat === 'martial' || (cat === 'simple' && weapon.cat === 'simple'),
                ),
            )
            .map(([id, weapon]) => ({
              id,
              name: weapon.name,
              mastery: weapon.mastery,
              desc: '',
              mine: (kit.weapons || []).includes(id),
            })),
        }
      : null,
    cantrips: casting
      ? {
          count: cantripsNeeded,
          from: spellList.filter((id) => (reglasConjuros[id]?.level || 0) === 0).map(spellEntry),
          recommended: casting.recommended?.cantrips || [],
        }
      : null,
    spells: casting
      ? {
          count: preparedNeeded,
          max_level: maxLevel,
          from: spellList
            .filter(
              (id) =>
                reglasConjuros[id] && reglasConjuros[id].level >= 1 && reglasConjuros[id].level <= maxLevel,
            )
            .map(spellEntry),
          always: [],
          recommended: [
            ...(casting.recommended?.['1'] || []),
            ...(level >= 2 ? casting.recommended?.['2'] || [] : []),
          ],
        }
      : null,
    magic_initiate: hasInitiate
      ? {
          list: initiateList,
          cantrips: {
            count: 2,
            from: Object.keys(reglasConjuros)
              .filter(
                (id) =>
                  reglasConjuros[id].level === 0 &&
                  (reglasClases[initiateList]?.casting?.list || []).includes(id),
              )
              .map(spellEntry),
          },
          spell: {
            count: 1,
            from: Object.keys(reglasConjuros)
              .filter(
                (id) =>
                  reglasConjuros[id].level === 1 &&
                  (reglasClases[initiateList]?.casting?.list || []).includes(id),
              )
              .map(spellEntry),
          },
        }
      : null,
    kits: (cls.kits || []).map((kit) => ({
      id: kit.id,
      name: kit.name,
      weapons: (kit.weapons || []).map((id) => reglasArmas[id]?.name || id),
      armor: reglasArmaduras[kit.armor]?.name || '',
      shield: !!kit.shield,
      items: Object.entries(kit.items || {}).map(
        ([id, n]) => `${reglasObjetos[id]?.name || id}${n > 1 ? ` \xD7${n}` : ''}`,
      ),
      ammo: Object.entries(kit.ammo || {}).map(
        ([id, n]) =>
          `${n} ${reglasArmas[id]?.kind === 'ranged' ? 'proyectiles' : (reglasArmas[id]?.name || id).toLowerCase()}`,
      ),
      gold: kit.gold || 0,
      gold_instead: Math.max(50, (kit.gold || 0) + 60),
    })),
    kit: sheet.kit,
    bg_items: Object.entries(reglasTrasfondos[sheet.background]?.items || {}).map(
      ([id, n]) => `${reglasObjetos[id]?.name || id}${n > 1 ? ` \xD7${n}` : ''}`,
    ),
    bg_gold: reglasTrasfondos[sheet.background]?.gold || 0,
    bg_gold_instead: 50,
    hp: maxHp(sheet, level),
    ac: armorClass(sheet).ac,
    speed: Number(species.speed || 30),
    errors,
    sheet,
  };
}
function randomName({ species = 'human', pronoun = 'm' } = {}) {
  let table = reglasNombres[species] || reglasNombres.human,
    pick = (list) => list[randomDie(list.length) - 1],
    endings =
      pronoun === 'f' ? table.end_f : pronoun === 'n' ? [...table.end_m, ...table.end_f] : table.end_m,
    first = pick(table.start) + pick(endings);
  return { name: table.family ? `${first} ${pick(table.family)}` : first };
}
function ensureGear(member) {
  if (member.weapons) return member;
  let kit = kitOf(member);
  ((member.weapons = [...(kit.weapons || [])]),
    (member.armor = kit.armor || ''),
    (member.shield = !!kit.shield),
    (member.worn = {}),
    (member.pack = []),
    (member.items = { ...(kit.items || {}) }),
    (member.ammo = {}));
  for (let [id, n] of Object.entries(kit.ammo || {})) member.ammo[id] = n;
  for (let [id, n] of Object.entries(reglasTrasfondos[member.background]?.items || {}))
    member.items[id] = (member.items[id] || 0) + n;
  return ((member.items.potion_healing = (member.items.potion_healing || 0) + 1), member);
}
function itemBrief(id, unid = !1) {
  let def = itemDef(id);
  return {
    id,
    name: unid ? def.unid_name || `${def.name} (sin identificar)` : def.name || id,
    kind: def.kind,
    icon: def.icon || '',
    rarity: unid ? '' : def.rarity || '',
    magic: !!(def.rarity && def.rarity !== 'common') || !!def.bonus,
    unid,
  };
}
/** Inventario de un miembro: ranuras, mochila, munición y estadísticas (inv). */
function inventory(cp, who) {
  let member = ensureGear(cp.members[who]),
    slots = {},
    order = [],
    addSlot = (key, label, id) => {
      ((slots[key] = id ? { key, label, empty: !1, ...itemBrief(id) } : { key, label, empty: !0, id: null }),
        order.push(key));
    };
  for (let index = 0; index < 4; index++)
    addSlot(`weapon:${index}`, `Arma ${index + 1}`, member.weapons[index] || '');
  (addSlot('armor', 'Armadura', member.armor),
    addSlot('shield', 'Escudo', member.shield ? member.shield_id || 'shield' : ''));
  for (let [key, label] of [
    ['cloak', 'Capa'],
    ['ring1', 'Anillo'],
    ['ring2', 'Anillo'],
    ['amulet', 'Amuleto'],
    ['boots', 'Botas'],
    ['gloves', 'Guantes'],
  ])
    addSlot(key, label, member.worn?.[key] || '');
  let bag = [];
  member.pack.forEach((entry, index) =>
    bag.push({
      ...itemBrief(entry.id, !!entry.unid),
      where: 'pack',
      idx: index,
      n: 1,
      slot: entry.unid ? '' : equipSlot(entry.id),
      equippable: !entry.unid && !!equipSlot(entry.id),
      value: Math.max(1, Math.floor((itemDef(entry.id).price || 2) / 2)),
    }),
  );
  for (let [id, n] of Object.entries(member.items || {}))
    n > 0 &&
      bag.push({
        ...itemBrief(id),
        where: 'stack',
        n,
        label: `${itemDef(id).name}${n > 1 ? ` \xD7${n}` : ''}`,
        usable: itemDef(id).kind === 'potion' && !!itemDef(id).use?.heal,
        value: Math.max(1, Math.floor((itemDef(id).price || 2) / 2)),
      });
  let summary = sheetSummary(member, cp.party_level, cp.state[who]);
  return {
    who,
    name: member.name,
    short_name: String(member.name).split(' ')[0],
    slots,
    slot_order: order,
    weapons: member.weapons,
    bag,
    ammo: Object.entries(member.ammo || {}).map(([id, n]) => ({
      key: id,
      name: AMMO_NAMES[AMMO_FOR[id] || id] || reglasArmas[id]?.name || id,
      n,
    })),
    attuned: { n: Object.values(member.worn || {}).filter((id) => itemDef(id)?.attune).length, max: 3 },
    gold: cp.gold,
    stats: {
      ac: summary.ac,
      hp: summary.hp,
      max_hp: summary.max_hp,
      speed: summary.speed,
      speed_text: summary.speed_text,
      attacks: summary.attacks.map((atk) => ({
        ...atk,
        to_hit_text: (atk.to_hit >= 0 ? '+' : '\u2212') + Math.abs(atk.to_hit),
      })),
      abilities: Object.fromEntries(
        Object.entries(summary.abilities).map(([key, ability]) => [key, ability.score]),
      ),
    },
    dead: !!cp.state[who]?.dead,
  };
}
function equipFromPack(member, index, slot) {
  let entry = member.pack[index];
  if (!entry) return 'No existe ese objeto.';
  if (entry.unid) return 'Primero ten\xE9is que identificarlo.';
  let kind = equipSlot(entry.id);
  if (!kind) return 'Eso no se puede equipar.';
  if ((member.pack.splice(index, 1), (member.worn ??= {}), kind === 'weapon'))
    member.weapons.length >= 4
      ? (member.pack.push({ id: member.weapons[0] }), (member.weapons[0] = entry.id))
      : member.weapons.unshift(entry.id);
  else if (kind === 'armor')
    (member.armor && member.pack.push({ id: member.armor }), (member.armor = entry.id));
  else if (kind === 'shield')
    (member.shield && member.pack.push({ id: member.shield_id || 'shield' }),
      (member.shield = !0),
      (member.shield_id = entry.id));
  else {
    let where = kind === 'ring' ? slot || (member.worn.ring1 ? 'ring2' : 'ring1') : kind;
    (member.worn[where] && member.pack.push({ id: member.worn[where] }), (member.worn[where] = entry.id));
  }
  return '';
}
function unequipSlot(member, slot) {
  if (slot.startsWith('weapon:')) {
    let index = Number(slot.split(':')[1]);
    return member.weapons[index]
      ? (member.pack.push({ id: member.weapons[index] }), member.weapons.splice(index, 1), '')
      : 'No hay nada ah\xED.';
  }
  return slot === 'armor'
    ? member.armor
      ? (member.pack.push({ id: member.armor }), (member.armor = ''), '')
      : 'No hay nada ah\xED.'
    : slot === 'shield'
      ? member.shield
        ? (member.pack.push({ id: member.shield_id || 'shield' }),
          (member.shield = !1),
          delete member.shield_id,
          '')
        : 'No hay nada ah\xED.'
      : member.worn?.[slot]
        ? (member.pack.push({ id: member.worn[slot] }), delete member.worn[slot], '')
        : 'No hay nada ah\xED.';
}
function giveItem(member, id, n = 1, unid = !1) {
  if ((ensureGear(member), isStackable(id) && !unid)) member.items[id] = (member.items[id] || 0) + n;
  else for (let i = 0; i < n; i++) member.pack.push(unid ? { id, unid: !0 } : { id });
}
function freshState(cp, id) {
  let summary = sheetSummary(cp.members[id], cp.party_level);
  return {
    hp: summary.max_hp,
    temp_hp: 0,
    slots: (summary.spells?.slots || []).map((slot) => slot.max),
    resources: {},
    free_casts: {},
    hit_dice: cp.party_level,
    dead: !1,
    buffs: [],
  };
}
function newCampaign({ hero, companions = [] }) {
  let heroSheet = ensureGear(completeSheet(hero, 1));
  ((heroSheet.id = 'hero'), (heroSheet.is_hero = !0));
  let cp = {
    members: { hero: heroSheet },
    party: ['hero'],
    state: {},
    party_level: 1,
    gold: (kitOf(heroSheet).gold || 0) + (reglasTrasfondos[heroSheet.background]?.gold || 0),
    location: { level: 'merrowick', spawn: 'arrival', name: 'Merrowick' },
    flags: {},
    journal: [],
    day: 1,
    playtime: 0,
    short_rests_left: 2,
    levels: {},
    merchants: Object.fromEntries(
      Object.keys(reglasComerciantes)
        .filter((id) => !id.startsWith('_'))
        .map((id) => [id, { stock: clone(reglasComerciantes[id].stock) }]),
    ),
  };
  for (let id of companions) recruit(cp, id);
  for (let id of cp.party) cp.state[id] = freshState(cp, id);
  return { cp };
}
function recruit(cp, id) {
  let def = reglasCompaneros[id];
  if (!def || cp.party.length >= 4) return !1;
  let member = clone(def);
  return (
    (member.id = id),
    (member.base_abilities = member.abilities),
    delete member.abilities,
    (member.bg_bonus = { str: 0 }),
    (member.worn = {}),
    (member.pack = []),
    (member.items = { ...(member.items || {}) }),
    (cp.members[id] = member),
    cp.party.push(id),
    (cp.state[id] = freshState(cp, id)),
    !0
  );
}
/** Devuelve {op: (args) => respuesta} con la misma forma de petición y respuesta que mdg_call. */
function createSimulator() {
  return {
    data: ({ name }) => clone(DATA_TABLES[name] ?? {}),
    loc: () => ({}),
    sheet_options: ({ sheet, level = 1 }) => sheetOptions(sheet, level),
    sheet_complete: ({ sheet, level = 1 }) => completeSheet(sheet, level),
    sheet_validate: ({ sheet, level = 1 }) => {
      let errors = sheetOptions(sheet, level).errors;
      return { ok: !errors.length, errors };
    },
    random_name: randomName,
    sheet_summary: ({ sheet, level = 1, state }) => sheetSummary(sheet, level, state),
    level_choices: ({ sheet, from = 1, to = 2 }) => {
      let full = completeSheet(sheet, to),
        opts = sheetOptions(full, to),
        cls = reglasClases[full.class] || {},
        gained = [];
      for (let featureId of cls.features?.[String(to)] || [])
        gained.push(
          featureId === 'subclass'
            ? { id: 'subclass', name: cls.subclass_label || 'Subclase', desc: 'Eliges tu especialidad.' }
            : {
                id: featureId,
                name: reglasRasgos[featureId]?.name || featureId,
                desc: reglasRasgos[featureId]?.desc || '',
              },
        );
      return {
        ...opts,
        from,
        to,
        hp_gain: maxHp(full, to) - maxHp(full, from),
        hp_avg: Math.floor((cls.hit_die || 8) / 2) + 1 + abilityMod(abilityScores(full).con),
        hit_die: cls.hit_die || 8,
        prof: profBonus(to),
        gained,
        subclasses:
          to === 3 && cls.subclasses
            ? {
                label: cls.subclass_label || 'Subclase',
                from: Object.entries(cls.subclasses).map(([id, sub]) => ({
                  id,
                  name: sub.name,
                  desc: sub.desc,
                })),
              }
            : null,
        new_cantrips: cantripCount(full, to) - cantripCount(full, from),
        new_spells: preparedCount(full, to) - preparedCount(full, from),
        metamagic:
          full.class === 'sorcerer' && to === 2
            ? {
                count: 2,
                from: Object.entries(reglasRasgos.metamagic_options || {}).map(([id, opt]) => ({
                  id,
                  name: opt.name,
                  desc: opt.desc,
                  cost: opt.cost,
                })),
              }
            : null,
      };
    },
    cp_new: newCampaign,
    cp_recruit: ({ cp, id }) => {
      cp = clone(cp);
      let ok = recruit(cp, id);
      return { cp, ok, reason: ok ? '' : 'El grupo est\xE1 completo.' };
    },
    cp_dismiss: ({ cp, id }) => (
      (cp = clone(cp)),
      (cp.party = cp.party.filter((memberId) => memberId !== id)),
      { cp }
    ),
    cp_short_rest: ({ cp, spend = {} }) => {
      cp = clone(cp);
      let report = {};
      cp.short_rests_left = Math.max(0, (cp.short_rests_left ?? 2) - 1);
      for (let id of cp.party) {
        let st = cp.state[id],
          summary = sheetSummary(cp.members[id], cp.party_level, st),
          healed = 0,
          rolls = [],
          dice = Number(spend[id] ?? 0);
        for (; dice-- > 0 && st.hit_dice > 0;) {
          let roll = randomDie(summary.hit_dice.die);
          (rolls.push(roll), (healed += Math.max(1, roll + summary.abilities.con.mod)), st.hit_dice--);
        }
        ((st.hp = Math.min(summary.max_hp, st.hp + healed)),
          (report[id] = {
            healed,
            dice: rolls.length,
            rolls,
            die: summary.hit_dice.die,
            con: summary.abilities.con.mod,
            hp: st.hp,
            max_hp: summary.max_hp,
          }));
      }
      let identified = [];
      for (let id of cp.party)
        for (let entry of ensureGear(cp.members[id]).pack)
          entry.unid && (delete entry.unid, identified.push(itemInfo(entry.id).name));
      return {
        cp,
        report,
        identified,
        text: identified.length ? `Identific\xE1is: ${identified.join(', ')}.` : '',
      };
    },
    cp_long_rest: ({ cp }) => {
      cp = clone(cp);
      for (let id of cp.party) cp.state[id] = freshState(cp, id);
      return ((cp.short_rests_left = 2), (cp.day = (cp.day || 1) + 1), { cp });
    },
    cp_level_up: ({ cp, level, choices = {} }) => {
      cp = clone(cp);
      let gained = {};
      for (let id of cp.party) {
        Object.assign(cp.members[id], choices[id] || {});
        let cls = reglasClases[cp.members[id].class] || {};
        gained[id] = (cls.features?.[String(level)] || []).map((featureId) => ({
          id: featureId,
          name: reglasRasgos[featureId]?.name || featureId,
          desc: reglasRasgos[featureId]?.desc || '',
        }));
      }
      cp.party_level = level;
      for (let id of cp.party) cp.state[id] = freshState(cp, id);
      return { cp, gained };
    },
    cp_gold: ({ cp, delta }) => (
      (cp = clone(cp)),
      cp.gold + delta < 0 ? { cp, ok: !1 } : ((cp.gold += delta), { cp, ok: !0 })
    ),
    cp_give: ({ cp, item, n = 1, unid, to }) => {
      cp = clone(cp);
      let who = to && cp.party.includes(to) ? to : cp.party[0];
      return (giveItem(cp.members[who], item, n, unid), { cp, who, ok: !0 });
    },
    cp_heal: ({ cp, id, amount }) => {
      cp = clone(cp);
      let st = cp.state[id],
        maxHpValue = sheetSummary(cp.members[id], cp.party_level).max_hp;
      return ((st.hp = Math.min(maxHpValue, st.hp + amount)), { cp, hp: st.hp, down: !1, dead: !1 });
    },
    cp_damage: ({ cp, id, amount }) => {
      cp = clone(cp);
      let st = cp.state[id];
      return ((st.hp = Math.max(0, st.hp - amount)), { cp, hp: st.hp, down: st.hp <= 0, dead: !1 });
    },
    cp_pass_hours: ({ cp, hours }) => (
      (cp = clone(cp)),
      (cp.hour = ((cp.hour ?? 18) + hours) % 24),
      (cp.hour ?? 18) < hours && (cp.day = (cp.day || 1) + 1),
      { cp }
    ),
    party_summary: ({ cp }) =>
      cp.party.map((id) => ({
        id,
        ...sheetSummary(cp.members[id], cp.party_level, cp.state[id]),
        dead: !!cp.state[id]?.dead,
        is_hero: id === 'hero',
        title: reglasCompaneros[id]?.title || '',
      })),
    item_info: ({ id, unid }) => {
      let info = itemInfo(id);
      return {
        ...info,
        name: (unid && info.unidentified_name) || info.name,
        real_name: info.name,
        lines: [
          info.desc,
          ...info.props.filter((prop) => typeof prop == 'string' && /CA|Fuerza|Sigilo|sintonía/.test(prop)),
        ].filter(Boolean),
        sell: Math.max(1, Math.floor((info.price || 2) / 2)),
        rarity_name:
          { uncommon: 'Poco com\xFAn', rare: 'Raro', very_rare: 'Muy raro', legendary: 'Legendario' }[
            info.rarity
          ] || '',
        attune: !!itemDef(id).attune,
        props: info.props.filter((prop) => !/^CA|Maestría|Fuerza|Sigilo|sintonía/.test(prop)).slice(1),
      };
    },
    inv: ({ cp, who }) => inventory(clone(cp), who || cp.party[0]),
    inv_preview: ({ cp, who, item, slot }) => {
      let copy = clone(cp),
        member = ensureGear(copy.members[who]),
        before = sheetSummary(member, copy.party_level, copy.state[who]),
        error = equipFromPack(member, typeof item == 'object' ? item.idx : item, slot);
      if (error)
        return { ok: !1, reason: error, lines: [error], before: { ac: before.ac }, after: { ac: before.ac } };
      let after = sheetSummary(member, copy.party_level, copy.state[who]),
        changes = [];
      after.ac !== before.ac &&
        changes.push({ what: 'ac', from: before.ac, to: after.ac, better: after.ac > before.ac });
      let oldAttack = before.attacks[0],
        newAttack = after.attacks[0];
      return (
        oldAttack &&
          newAttack &&
          newAttack.to_hit !== oldAttack.to_hit &&
          changes.push({
            what: 'attack',
            from: oldAttack.to_hit,
            to: newAttack.to_hit,
            better: newAttack.to_hit > oldAttack.to_hit,
          }),
        {
          ok: !0,
          reason: '',
          before: { ac: before.ac, attacks: before.attacks },
          after: { ac: after.ac, attacks: after.attacks },
          lines:
            newAttack && newAttack.key !== oldAttack?.key
              ? [
                  `Con ${newAttack.name}: ${newAttack.to_hit >= 0 ? '+' : '\u2212'}${Math.abs(newAttack.to_hit)} \xB7 ${newAttack.damage}`,
                ]
              : [],
          changes,
        }
      );
    },
    inv_equip: ({ cp, who, item, slot }) => {
      cp = clone(cp);
      let member = ensureGear(cp.members[who]),
        name = itemDef(member.pack[typeof item == 'object' ? item.idx : item]?.id)?.name,
        error = equipFromPack(member, typeof item == 'object' ? item.idx : item, slot);
      return {
        cp,
        ok: !error,
        reason: error,
        text: error || `${String(member.name).split(' ')[0]} se equipa: ${name}.`,
      };
    },
    inv_unequip: ({ cp, who, slot }) => {
      cp = clone(cp);
      let error = unequipSlot(ensureGear(cp.members[who]), slot);
      return { cp, ok: !error, reason: error, text: error || 'Guardado en la mochila.' };
    },
    inv_give: ({ cp, from, who, to, item, n }) => {
      ((cp = clone(cp)), (from = from || who));
      let giver = ensureGear(cp.members[from]),
        receiver = ensureGear(cp.members[to]),
        what = '';
      if (typeof item == 'object') {
        let entry = giver.pack.splice(item.idx, 1)[0];
        if (!entry) return { cp, ok: !1, reason: 'No lo lleva.' };
        (receiver.pack.push(entry), (what = itemDef(entry.id).name));
      } else {
        let qty = Math.min(n ?? giver.items[item] ?? 0, giver.items[item] ?? 0);
        if (qty <= 0) return { cp, ok: !1, reason: 'No lo lleva.' };
        ((giver.items[item] -= qty),
          giver.items[item] || delete giver.items[item],
          (receiver.items[item] = (receiver.items[item] || 0) + qty),
          (what = `${itemDef(item).name}${qty > 1 ? ` \xD7${qty}` : ''}`));
      }
      return {
        cp,
        ok: !0,
        text: `${String(giver.name).split(' ')[0]} da ${what} a ${String(receiver.name).split(' ')[0]}.`,
      };
    },
    inv_drop: ({ cp, who, item, n }) => {
      cp = clone(cp);
      let member = ensureGear(cp.members[who]);
      return (
        typeof item == 'object'
          ? member.pack.splice(item.idx, 1)
          : ((member.items[item] = Math.max(0, (member.items[item] || 0) - (n || member.items[item]))),
            member.items[item] || delete member.items[item]),
        { cp, ok: !0, text: `${String(member.name).split(' ')[0]} lo deja.` }
      );
    },
    inv_use: ({ cp, who, item, target }) => {
      cp = clone(cp);
      let member = ensureGear(cp.members[who]),
        def = itemDef(item);
      if (!def.use?.heal) return { cp, ok: !1, reason: 'Se usa en combate, desde el bot\xF3n Objetos.' };
      if (!(member.items[item] > 0)) return { cp, ok: !1, reason: 'No lo lleva.' };
      let targetId = target || who,
        st = cp.state[targetId],
        maxHpValue = sheetSummary(cp.members[targetId], cp.party_level).max_hp;
      if (st.hp >= maxHpValue) return { cp, ok: !1, reason: 'No le hace falta: est\xE1 ileso.' };
      (member.items[item]--, member.items[item] || delete member.items[item]);
      let healed = rollFormula(def.use.heal);
      return (
        (st.hp = Math.min(maxHpValue, st.hp + healed)),
        {
          cp,
          ok: !0,
          healed,
          hp: st.hp,
          max_hp: maxHpValue,
          text: `${String(cp.members[targetId].name).split(' ')[0]} recupera ${healed} PG.`,
        }
      );
    },
    identify: ({ cp }) => {
      cp = clone(cp);
      let names = [];
      for (let id of cp.party)
        for (let entry of ensureGear(cp.members[id]).pack)
          entry.unid && (delete entry.unid, names.push(itemDef(entry.id).name));
      return { cp, identified: names };
    },
    shop: ({ cp, merchant, who }) => {
      let def = reglasComerciantes[merchant] || {},
        stock = cp.merchants?.[merchant]?.stock || def.stock || {},
        forSale = Object.entries(stock)
          .filter(([, qty]) => qty !== 0)
          .map(([id, qty]) => {
            let price = Math.ceil((itemDef(id).price || 1) * (def.markup || 1));
            return {
              ...itemBrief(id),
              n: qty,
              unlimited: qty < 0,
              price,
              can_afford: cp.gold >= price,
              label: `${itemDef(id).name}${qty < 0 ? '' : `  (${qty})`}`,
              desc: itemDef(id).desc || '',
            };
          }),
        buys = [],
        copy = clone(cp);
      for (let memberId of copy.party) {
        if (who && memberId !== who) continue;
        let member = ensureGear(copy.members[memberId]);
        member.pack.forEach(
          (entry, idx) =>
            (def.buys || []).includes(itemDef(entry.id).kind) &&
            buys.push({
              ...itemBrief(entry.id, !!entry.unid),
              who: memberId,
              where: 'pack',
              idx,
              n: 1,
              price: Math.max(1, Math.floor((itemDef(entry.id).price || 1) / 2)),
            }),
        );
        for (let [id, qty] of Object.entries(member.items || {}))
          qty > 0 &&
            (def.buys || []).includes(itemDef(id).kind) &&
            buys.push({
              ...itemBrief(id),
              who: memberId,
              where: 'stack',
              n: qty,
              price: Math.max(1, Math.floor((itemDef(id).price || 1) / 2)),
              label: `${itemDef(id).name}${qty > 1 ? ` \xD7${qty}` : ''}`,
            });
      }
      return {
        id: merchant,
        name: def.name || merchant,
        npc: def.who || '',
        markup: def.markup || 1,
        buys_kinds: def.buys || [],
        stock: forSale,
        buys,
        gold: cp.gold,
        who: who || '',
      };
    },
    shop_buy: ({ cp, merchant, item, n = 1, who }) => {
      cp = clone(cp);
      let def = reglasComerciantes[merchant] || {},
        cost = Math.ceil((itemDef(item).price || 1) * (def.markup || 1)) * n;
      if (cp.gold < cost) return { cp, ok: !1, reason: 'No ten\xE9is oro suficiente.' };
      cp.gold -= cost;
      let stock = cp.merchants[merchant].stock;
      stock[item] > 0 && (stock[item] -= n);
      let buyer = who || cp.party[0];
      return (
        giveItem(cp.members[buyer], item, n),
        {
          cp,
          ok: !0,
          who: buyer,
          text: `Comprado: ${itemDef(item).name}${n > 1 ? ` \xD7${n}` : ''} por ${cost} po.`,
        }
      );
    },
    shop_sell: ({ cp, merchant, who, item, n = 1 }) => {
      cp = clone(cp);
      let member = ensureGear(cp.members[who]),
        itemId = item;
      if (typeof item == 'object') {
        let entry = member.pack.splice(item.idx, 1)[0];
        if (!entry) return { cp, ok: !1, reason: 'No lo lleva.' };
        ((itemId = entry.id), (n = 1));
      } else {
        if (!(member.items[item] >= n)) return { cp, ok: !1, reason: 'No lo lleva.' };
        ((member.items[item] -= n), member.items[item] || delete member.items[item]);
      }
      let price = Math.max(1, Math.floor((itemDef(itemId).price || 1) / 2)) * n;
      cp.gold += price;
      let stock = cp.merchants[merchant].stock;
      return (
        stock[itemId] < 0 || (stock[itemId] = (stock[itemId] || 0) + n),
        {
          cp,
          ok: !0,
          price,
          gold: cp.gold,
          text: `Vendido: ${itemDef(itemId).name}${n > 1 ? ` \xD7${n}` : ''} por ${price} po.`,
        }
      );
    },
    check: ({ cp, who = 'best', skill, ability, dc = 10 }) => {
      let candidates = who === 'best' ? cp.party : [who],
        best = null;
      for (let id of candidates) {
        let summary = sheetSummary(cp.members[id], cp.party_level),
          mod = skill
            ? (summary.skills.find((entry) => entry.id === skill)?.mod ?? 0)
            : summary.abilities[ability || 'str'].mod;
        (!best || mod > best.mod) && (best = { who: id, mod });
      }
      let d20 = randomDie(20),
        total = d20 + best.mod;
      return {
        who: best.who,
        label: skill ? SKILL_NAMES[skill] : ability,
        d20: [d20],
        mod: best.mod,
        total,
        dc,
        success: total >= dc || d20 === 20,
        crit: d20 === 20,
        text: '',
      };
    },
  };
}
const DATA_TABLES = {
  species: reglasEspecies,
  classes: reglasClases,
  backgrounds: reglasTrasfondos,
  feats: reglasDotes,
  spells: reglasConjuros,
  weapons: reglasArmas,
  armor: reglasArmaduras,
  items: reglasObjetos,
  merchants: reglasComerciantes,
  party: reglasCompaneros,
  names: reglasNombres,
  features: reglasRasgos,
};
const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const SKILLS = [
  'acrobatics',
  'animal_handling',
  'arcana',
  'athletics',
  'deception',
  'history',
  'insight',
  'intimidation',
  'investigation',
  'medicine',
  'nature',
  'perception',
  'performance',
  'persuasion',
  'religion',
  'sleight_of_hand',
  'stealth',
  'survival',
];
const SKILL_ABILITY = {
  acrobatics: 'dex',
  animal_handling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  survival: 'wis',
};
const SKILL_NAMES = {
  acrobatics: 'Acrobacias',
  animal_handling: 'Trato con animales',
  arcana: 'Arcanos',
  athletics: 'Atletismo',
  deception: 'Enga\xF1o',
  history: 'Historia',
  insight: 'Perspicacia',
  intimidation: 'Intimidaci\xF3n',
  investigation: 'Investigaci\xF3n',
  medicine: 'Medicina',
  nature: 'Naturaleza',
  perception: 'Percepci\xF3n',
  performance: 'Interpretaci\xF3n',
  persuasion: 'Persuasi\xF3n',
  religion: 'Religi\xF3n',
  sleight_of_hand: 'Juego de manos',
  stealth: 'Sigilo',
  survival: 'Supervivencia',
};
const DAMAGE_TYPES = {
  bludgeoning: 'contundente',
  piercing: 'perforante',
  slashing: 'cortante',
  fire: 'fuego',
  cold: 'fr\xEDo',
  lightning: 'rayo',
  thunder: 'trueno',
  radiant: 'radiante',
  necrotic: 'necr\xF3tico',
  force: 'fuerza',
  poison: 'veneno',
  acid: '\xE1cido',
  psychic: 'ps\xEDquico',
};
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const CLASS_BACKGROUND = {
  barbarian: 'soldier',
  bard: 'minstrel',
  cleric: 'acolyte',
  druid: 'warden',
  fighter: 'soldier',
  monk: 'acolyte',
  paladin: 'noble',
  ranger: 'warden',
  rogue: 'criminal',
  sorcerer: 'sage',
  warlock: 'criminal',
  wizard: 'sage',
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const abilityMod = (score) => Math.floor((Number(score) - 10) / 2);
const byLevel = (table, level, fallback = 0) => {
  if (!table) return fallback;
  let value = fallback;
  for (let lvl = 1; lvl <= level; lvl++) table[String(lvl)] != null && (value = table[String(lvl)]);
  return value;
};
const profBonus = (level) => 2 + Math.floor((Math.max(1, level) - 1) / 4);
let rngState = 7;
const randomDie = (sides) => (
  (rngState = (rngState * 1103515245 + 12345) & 2147483647),
  1 + (rngState % sides)
);
const rollFormula = (formula) => {
  let match = /^(\d*)d(\d+)([+-]\d+)?$/.exec(String(formula).replace(/\s/g, ''));
  if (!match) return Number(formula) || 0;
  let total = 0;
  for (let i = 0; i < Number(match[1] || 1); i++) total += randomDie(Number(match[2]));
  return total + Number(match[3] || 0);
};
const AMMO_FOR = {
  longbow: 'arrows',
  shortbow: 'arrows',
  light_crossbow: 'bolts',
  heavy_crossbow: 'bolts',
  sling: 'bullets',
};
const AMMO_NAMES = {
  arrows: 'Flechas',
  bolts: 'Virotes',
  bullets: 'Balas',
  javelin: 'Jabalinas',
  dagger: 'Dagas',
  handaxe: 'Hachas de mano',
};
const STACKABLE_KINDS = new Set([
  'potion',
  'scroll',
  'wand',
  'ammo',
  'gear',
  'tool',
  'treasure',
  'key',
  'quest',
]);
const equipSlot = (id) => {
  let def = itemDef(id);
  return def.kind === 'weapon'
    ? 'weapon'
    : def.kind === 'armor'
      ? 'armor'
      : def.kind === 'shield' || String(id).startsWith('shield')
        ? 'shield'
        : ['cloak', 'amulet', 'boots', 'gloves', 'ring'].includes(def.slot)
          ? def.slot
          : '';
};
const isStackable = (id) => !equipSlot(id) && STACKABLE_KINDS.has(itemDef(id).kind || 'gear');

export { createSimulator };
