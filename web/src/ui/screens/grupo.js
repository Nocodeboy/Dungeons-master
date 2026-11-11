// ui/screens/grupo.js
// Reconstruido de publicado/juego.js (módulo __esm «qT»). Nombres locales aún minificados.

import { iconHtml, escapeHtml, elem, makeButton, faceBadge, signed } from '../dom.js';
import { screenFrame, makeTabs } from '../modal.js';
import { setTip } from '../tooltip.js';
import {
  ABILITY_NAMES,
  ABILITY_ABBR,
  ABILITY_HINTS,
  conditionName,
  SPELL_ROLES,
  CLASS_ICONS,
} from '../labels.js';

function opcionesGrupo() {
  return { width: '80rem', height: '50rem' };
}
function pantallaGrupo(screen, params, ui, game) {
  let rules = ui.R,
    currentCp = () => game.store.cp,
    frame = screenFrame(screen, { title: 'Fichas del grupo', ic: 'person' });
  if ((frame.body.classList.add('mg-fill'), !currentCp())) {
    frame.body.innerHTML = `<div class="mg-vacio">${iconHtml('person')}No hay ninguna partida en curso.</div>`;
    return;
  }
  let party = rules.partySummary(),
    selected = party.some((member) => member.id === params.who) ? params.who : party[0]?.id,
    companions = (() => {
      try {
        return game.story?.companions?.() || [];
      } catch {
        return [];
      }
    })(),
    tabs = makeTabs(
      party.map((member) => ({
        id: member.id,
        html: `<span class="mg-memtab">${faceBadge(ui.portrait(member.id), { id: member.id, name: member.name, ic: CLASS_ICONS[member.class] || 'person' }).outerHTML}<span>${escapeHtml(member.short_name || String(member.name).split(' ')[0])}</span></span>`,
      })),
      selected,
      (id) => {
        ((selected = id), render());
      },
    );
  ((frame.tabs.hidden = !1),
    frame.tabs.append(tabs),
    (frame.foot.hidden = !1),
    frame.foot.append(
      makeButton('Inventario', {
        icon: 'backpack',
        onclick: () => ui.open('inventario', { who: selected }),
        key: 'I',
      }),
    ));
  let sheet = elem('div.mg-sheet.mg-scroll', { style: 'overflow-y:auto' });
  frame.body.append(sheet);
  function render() {
    let member = party.find((row) => row.id === selected);
    if (((sheet.innerHTML = ''), !member)) return;
    let mainCol = elem('div.mg-col'),
      head = elem('div.mg-sheet-head');
    head.append(
      faceBadge(ui.portrait(member.id), {
        id: member.id,
        name: member.name,
        ic: CLASS_ICONS[member.class] || 'person',
        cls: 'mg-sheet-face',
      }),
    );
    let subLine = [
      member.species_name,
      `${member.class_name || ''}${member.subclass_name ? ` (${member.subclass_name})` : ''}`,
      `nivel ${member.level}`,
    ]
      .filter(Boolean)
      .join(' \xB7 ');
    (head.append(
      elem(
        'div',
        elem('div.mg-sheet-name', member.name),
        elem('div.mg-sheet-sub', subLine),
        member.background_name ? elem('div.mg-sheet-sub', member.background_name) : null,
        member.title ? elem('div.mg-sheet-title', member.title) : null,
      ),
    ),
      mainCol.append(head));
    let companion = companions.find((entry) => entry.id === member.id),
      approval = companion?.approval ?? (member.id !== 'hero' ? game.story?.approval?.(member.id) : null);
    if (approval != null && member.id !== 'hero') {
      let score = Math.max(-100, Math.min(100, Number(approval) || 0)),
        meter = elem('div.mg-col', { style: 'gap:.25rem' });
      (meter.append(
        elem(
          'div.mg-row-flex',
          { style: 'justify-content:space-between' },
          elem('span.mg-label', 'Opini\xF3n del grupo'),
          elem('span.mg-num.mg-small', `${score > 0 ? '+' : ''}${score}`),
        ),
      ),
        meter.append(
          elem('div.mg-approval', {
            html: `<i style="left:${(score + 100) / 2}%"></i>`,
            role: 'meter',
            'aria-valuemin': '-100',
            'aria-valuemax': '100',
            'aria-valuenow': String(score),
            'aria-label': 'Aprobaci\xF3n',
          }),
        ),
        meter.append(elem('div.mg-mood', companion?.mood || moodText(score))),
        mainCol.append(meter));
    }
    let stats = elem('div.mg-stats'),
      addStat = (value, label, tip) => {
        let stat = elem('span.mg-stat', elem('b.mg-num', String(value)), elem('span', label));
        (setTip(stat, tip), stats.append(stat));
      };
    (addStat(member.ac, 'CA', {
      title: 'Clase de Armadura',
      body: (member.ac_parts || []).join(' \xB7 ') || 'Lo dif\xEDcil que es acertarte.',
    }),
      addStat(`${member.hp}/${member.max_hp}`, 'PG', {
        title: 'Puntos de golpe',
        body: member.temp_hp ? `M\xE1s ${member.temp_hp} temporales.` : 'Si llegan a 0, caes inconsciente.',
      }),
      addStat(
        member.speed_text || `${String((member.speed || 30) * 0.3).replace('.', ',')} m`,
        'Velocidad',
        'Lo que avanzas en un turno.',
      ),
      addStat(
        signed(member.initiative || 0),
        'Iniciativa',
        'Se suma a la tirada de iniciativa al empezar un combate.',
      ),
      mainCol.append(stats));
    let abilities = elem('div.mg-abs');
    for (let [key, ability] of Object.entries(member.abilities || {})) {
      let box = elem(
        `span.mg-ab${ability.save_prof ? '.prim' : ''}`,
        elem('span.mg-ab-n', ABILITY_ABBR[key] || ability.short || key.toUpperCase()),
        elem('span.mg-ab-v.mg-num', String(ability.score)),
        elem('span.mg-ab-m', signed(ability.mod)),
        elem(`span.mg-ab-s${ability.save_prof ? '.prof' : ''}`, `Salv. ${signed(ability.save)}`),
      );
      (setTip(box, {
        title: ABILITY_NAMES[key] || ability.name || key,
        body: ABILITY_HINTS[key] || '',
        foot: ability.save_prof ? 'Competente en sus salvaciones.' : '',
      }),
        abilities.append(box));
    }
    mainCol.append(abilities);
    let passive = member.passive || {};
    (mainCol.append(
      elem(
        'dl.mg-kv',
        elem('dt', 'Bonificador de competencia'),
        elem('dd', signed(member.prof || 2)),
        elem('dt', 'Percepci\xF3n pasiva'),
        elem('dd', String(passive.perception ?? '\u2014')),
        elem('dt', 'Investigaci\xF3n pasiva'),
        elem('dd', String(passive.investigation ?? '\u2014')),
        elem('dt', 'Perspicacia pasiva'),
        elem('dd', String(passive.insight ?? '\u2014')),
        member.darkvision ? elem('dt', 'Visi\xF3n en la oscuridad') : null,
        member.darkvision ? elem('dd', member.darkvision_text || `${member.darkvision} pies`) : null,
        elem('dt', 'Dados de golpe'),
        elem(
          'dd',
          `${member.hit_dice?.cur ?? '\u2014'} / ${member.hit_dice?.max ?? '\u2014'} (d${String(member.hit_dice?.die ?? '?').replace(/^d/, '')})`,
        ),
      ),
    ),
      (member.conditions || []).length &&
        mainCol.append(elem('p.mg-magia', (member.conditions || []).map(conditionName).join(' \xB7 '))));
    let skillsCol = elem('div.mg-col');
    skillsCol.append(elem('h3.mg-sec', 'Habilidades'));
    let skillList = elem('div.mg-skill-list');
    for (let skill of member.skills || []) {
      let row = elem(
        `div.mg-skill${skill.expert ? '.expert' : skill.prof ? '.prof' : ''}${skill.adv ? '.adv' : ''}`,
        elem('i'),
        elem('span', skill.name),
        elem('small', skill.ability_short || ''),
        elem('b.mg-num', signed(skill.mod)),
      );
      (setTip(row, {
        title: skill.name,
        sub: skill.ability_short,
        body: skill.expert
          ? 'Pericia: duplica el bonificador por competencia.'
          : skill.prof
            ? 'Competente.'
            : 'Sin competencia.',
      }),
        skillList.append(row));
    }
    if ((skillsCol.append(skillList), (member.attacks || []).length)) {
      skillsCol.append(elem('h3.mg-sec', 'Ataques'));
      let attackList = elem('div.mg-inv-atk');
      for (let attack of member.attacks) {
        let row = elem(
          'div',
          elem('b', attack.name),
          elem('span', `${attack.to_hit_text ?? signed(attack.to_hit)} \xB7 ${attack.damage}`),
        );
        (setTip(row, {
          title: attack.name,
          body:
            [
              attack.range ? `Alcance: ${attack.range}` : '',
              attack.mastery ? `Maestr\xEDa: ${attack.mastery}` : '',
              attack.ammo != null ? `Munici\xF3n: ${attack.ammo}` : '',
            ].filter(Boolean).join(`
`) || 'Ataque con arma.',
        }),
          attackList.append(row));
      }
      skillsCol.append(attackList);
    }
    ((member.languages || []).length || (member.tools || []).length) &&
      skillsCol.append(
        elem('h3.mg-sec', 'Idiomas y herramientas'),
        elem('p.mg-p.mg-small', [...(member.languages || []), ...(member.tools || [])].join(', ')),
      );
    let magicCol = elem('div.mg-col.c3'),
      spells = member.spells;
    if (spells) {
      (magicCol.append(elem('h3.mg-sec', 'Conjuros')),
        magicCol.append(
          elem(
            'p.mg-small.mg-dim',
            { style: 'margin:0' },
            `${spells.ability_name || ''} \xB7 CD ${spells.dc} \xB7 ataque ${signed(spells.attack)}`,
          ),
        ));
      for (let slot of spells.slots || []) {
        let row = elem('div.mg-slots-row', elem('span.mg-small', `Nivel ${slot.level}:`));
        for (let pip = 0; pip < slot.max; pip++)
          row.append(
            elem(`span.mg-pip${pip >= slot.cur ? '.gastado' : ''}`, {
              title: pip < slot.cur ? 'Disponible' : 'Gastado',
            }),
          );
        magicCol.append(row);
      }
      let spellChips = (list) => {
        let chips = elem('div.mg-cr-chips');
        for (let spell of list || []) {
          let chip = elem('span.mg-chip', {
            html: `${iconHtml(spell.icon || 'magic')}${escapeHtml(spell.name)}`,
          });
          (setTip(chip, {
            title: spell.name,
            sub: `${spell.level ? `Nivel ${spell.level}` : 'Truco'}${spell.school_name ? ` \xB7 ${spell.school_name}` : ''}`,
            body: spell.desc || '',
            tags: (spell.tags || []).map((tag) => SPELL_ROLES[tag]).filter(Boolean),
          }),
            chips.append(chip));
        }
        return chips;
      };
      (spells.cantrips?.length &&
        magicCol.append(elem('div.mg-label', 'Trucos'), spellChips(spells.cantrips)),
        spells.prepared?.length &&
          magicCol.append(elem('div.mg-label', 'Preparados'), spellChips(spells.prepared)));
    }
    let features = [
      ...(member.features || []),
      ...(member.traits || []).filter((trait) => typeof trait == 'object'),
      ...(member.feats || []),
    ];
    if (features.length) {
      magicCol.append(elem('h3.mg-sec', 'Rasgos y dotes'));
      let featureList = elem('div'),
        seen = new Set();
      for (let feature of features) {
        if (seen.has(feature.id)) continue;
        seen.add(feature.id);
        let resource = member.resources?.[feature.id],
          uses =
            feature.uses != null && feature.max != null
              ? `${feature.uses}/${feature.max}`
              : resource
                ? `${resource.cur}/${resource.max}`
                : '';
        featureList.append(
          elem(
            'div.mg-feature',
            elem('b', feature.name),
            uses ? elem('em', uses) : null,
            feature.desc ? elem('span', feature.desc) : null,
          ),
        );
      }
      magicCol.append(featureList);
    }
    sheet.append(mainCol, skillsCol, magicCol);
  }
  return (
    render(),
    {
      onKey(ev) {
        if (ev.key.toLowerCase() === 'p' && !ev.target.closest?.('input,textarea'))
          return (screen.close(null), !0);
        if ((ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') && !ev.target.closest?.('.mg-tabs')) {
          let ids = party.map((member) => member.id),
            index = ids.indexOf(selected);
          return (
            (selected = ids[(index + (ev.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]),
            tabs.set(selected),
            render(),
            !0
          );
        }
        return !1;
      },
    }
  );
}
const moodText = (score) =>
  score >= 60
    ? 'Os aprecia de verdad.'
    : score >= 25
      ? 'Est\xE1 a gusto en el grupo.'
      : score > -25
        ? 'Os observa sin decidirse.'
        : score > -50
          ? 'Empieza a dudar de vosotros.'
          : 'Est\xE1 a punto de marcharse.';

export { pantallaGrupo as default, opcionesGrupo as options };
