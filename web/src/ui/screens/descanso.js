// ui/screens/descanso.js
// Pantalla «descanso»: elegir descanso corto (gastar dados de golpe) o largo y enseñar el resultado.
// La registra ui/index.js (SCREENS) y se abre con ui.open('descanso').
// Reconstruido de publicado/juego.js (módulo __esm «FT»).

import { iconHtml, escapeHtml, richText, elem, makeButton, faceBadge, plural } from '../dom.js';
import { screenFrame } from '../modal.js';
import { makeDie, rollDie } from '../dice.js';
import { CLASS_ICONS } from '../labels.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesDescanso() {
  return { width: '46rem', auto: !0, full: !0 };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaDescanso(screen, params, ui, game) {
  let rules = ui.R,
    currentCp = () => game.store.cp,
    kind = params.kind === 'corto' || params.kind === 'largo' ? params.kind : 'elegir',
    where = params.where || '',
    frame = screenFrame(screen, { title: 'Descanso', ic: 'campfire' });
  if (((frame.foot.hidden = !1), !currentCp())) {
    frame.body.innerHTML = `<div class="mg-vacio">${iconHtml('campfire')}No hay ninguna partida en curso.</div>`;
    return;
  }
  let outcome = null,
    finish = async (kind, report) => {
      ((outcome = { k: kind, report }), game.store.save('auto').catch(() => null));
    },
    leave = () => {
      if (!outcome) return screen.close(null);
      (screen.close({ kind: outcome.k }),
        game.bus?.emit(
          outcome.k === 'corto' ? 'rest:short' : 'rest:long',
          outcome.k === 'corto' ? { report: outcome.report, where } : { where },
        ));
    };
  function showChoice() {
    ((frame.title.textContent = 'Descanso'),
      (frame.sub.textContent = where ? REST_PLACES[where] || where : ''),
      (frame.body.innerHTML = ''),
      (frame.foot.innerHTML = ''));
    let shortLeft = params.shortLeft ?? currentCp().short_rests_left ?? 2,
      canShort = shortLeft > 0 && params.allowShort !== !1,
      canLong = params.allowLong !== !1,
      choice = elem('div.mg-rest-choice'),
      shortCard = elem('button.mg-rest-card.corto', { disabled: !canShort }),
      shortNote =
        shortLeft <= 0
          ? 'Ya no pod\xE9is hacer m\xE1s hasta un descanso largo'
          : canShort
            ? `Quedan ${plural(shortLeft, 'descanso corto', 'descansos cortos')} hasta el siguiente largo`
            : `Ahora no: ${params.reason || 'no es un buen sitio'}`;
    ((shortCard.innerHTML = `${iconHtml('campfire')}<b>Descanso corto</b><p>Una hora para vendar heridas y recobrar el aliento. Cada uno puede gastar sus dados de golpe para curarse; algunos rasgos se recuperan.</p><small>${escapeHtml(shortNote)}</small>`),
      shortCard.addEventListener('click', shortRest));
    let longCard = elem('button.mg-rest-card.largo', { disabled: !canLong }),
      longNote = canLong
        ? params.paid
          ? 'Ya est\xE1 pagado'
          : where === 'posada'
            ? 'La posadera os espera'
            : 'Pasa la noche: amanece un nuevo d\xEDa'
        : `Ahora no: ${params.reason || 'solo en la posada o junto a una hoguera segura'}`;
    ((longCard.innerHTML = `${iconHtml('night')}<b>Descanso largo</b><p>Una noche entera ${escapeHtml(REST_PLACES[where] || 'a resguardo')}. Recuper\xE1is todos los puntos de golpe, los espacios de conjuro, los rasgos y los dados de golpe.</p><small>${escapeHtml(longNote)}</small>`),
      longCard.addEventListener('click', longRest),
      choice.append(shortCard, longCard),
      frame.body.append(choice),
      frame.foot.append(makeButton('Seguir sin descansar', { onclick: () => screen.close(null) })),
      (canShort ? shortCard : canLong ? longCard : frame.foot.querySelector('button'))?.focus());
  }
  function shortRest() {
    ((kind = 'corto'),
      (frame.title.textContent = 'Descanso corto'),
      (frame.sub.textContent = 'Una hora'),
      (frame.body.innerHTML = ''),
      (frame.foot.innerHTML = ''));
    let party = rules.partySummary();
    rules._lastParty = party;
    let spend = {},
      rows = elem('div.mg-rest-rows');
    frame.body.append(
      elem(
        'p.mg-p.mg-dim',
        { style: 'margin-bottom:.6rem' },
        'Elige cu\xE1ntos dados de golpe gasta cada uno. Cada dado cura lo que saque m\xE1s la Constituci\xF3n.',
      ),
      rows,
    );
    for (let member of party) {
      if (member.dead) continue;
      let hd = member.hit_dice || { cur: 0, max: 0, die: 8 },
        hitDice = { ...hd, die: Number(String(hd.die ?? 8).replace(/^d/i, '')) || 8 },
        missing = (member.max_hp || 0) - (member.hp || 0),
        perDie = Math.max(1, Math.floor(hitDice.die / 2) + 1 + (member.abilities?.con?.mod || 0));
      spend[member.id] = Math.min(hitDice.cur, Math.ceil(Math.max(0, missing) / perDie));
      let row = elem('div.mg-rest-row', { 'data-id': member.id }),
        hpFrac = Math.max(0, member.hp) / Math.max(1, member.max_hp);
      (row.append(
        faceBadge(ui.portrait(member.id), {
          id: member.id,
          name: member.name,
          ic: CLASS_ICONS[member.class] || 'person',
        }),
      ),
        row.append(
          elem(
            'div.who',
            elem('b', String(member.name).split(' ')[0]),
            elem(
              'span',
              `d${hitDice.die} \xB7 Constituci\xF3n ${member.abilities?.con?.mod >= 0 ? '+' : '\u2212'}${Math.abs(member.abilities?.con?.mod || 0)}`,
            ),
          ),
        ));
      let hpBar = elem('div.mg-hp', {
        html: `<span class="mg-hp-fill" style="width:${hpFrac * 100}%"></span><span class="mg-hp-txt">${escapeHtml(member.hp)} / ${escapeHtml(member.max_hp)}</span>`,
      });
      row.append(hpBar);
      let hdBox = elem('div.mg-hd'),
        count = elem('span.n'),
        refresh = () => {
          ((count.innerHTML = `${spend[member.id]} de ${hitDice.cur}<small>dados de golpe</small>`),
            (minus.disabled = spend[member.id] <= 0),
            (plus.disabled = spend[member.id] >= hitDice.cur));
        },
        minus = makeButton('\u2212', { size: 'sm', onclick: () => ((spend[member.id] -= 1), refresh()) }),
        plus = makeButton('+', { size: 'sm', onclick: () => ((spend[member.id] += 1), refresh()) });
      (minus.setAttribute('aria-label', `Un dado menos para ${member.name}`),
        plus.setAttribute('aria-label', `Un dado m\xE1s para ${member.name}`),
        hdBox.append(minus, count, plus),
        refresh(),
        row.append(hdBox, elem('div.mg-rest-dice')),
        rows.append(row));
    }
    let restButton = makeButton('Descansar una hora', { icon: 'hourglass', variant: 'primary' });
    restButton.addEventListener('click', async () => {
      ((restButton.disabled = !0), (backButton.disabled = !0));
      for (let button of rows.querySelectorAll('button')) button.disabled = !0;
      let res = rules.shortRest(spend);
      if (!res || res.error || res.ok === !1) {
        (ui.toast(res?.reason || res?.error || 'No se ha podido descansar.', 'mal'),
          (restButton.disabled = backButton.disabled = !1));
        return;
      }
      outcome = { k: 'corto', report: res.report };
      for (let [id, entry] of Object.entries(res.report || {})) {
        if (id.startsWith('_')) continue;
        let row = rows.querySelector(`[data-id="${CSS.escape(id)}"]`);
        if (!row) continue;
        let diceBox = row.querySelector('.mg-rest-dice'),
          member = (rules._lastParty || []).find((row) => row.id === id),
          sides = Number(String(entry.die || member?.hit_dice?.die || 8).replace(/^d/i, '')) || 8,
          rolls = entry.rolls || Array.from({ length: entry.dice || 0 }, () => ''),
          dice = rolls.map(() => makeDie(sides, '', { size: 'sm' }));
        (diceBox.append(...dice),
          await Promise.all(
            dice.map((die, index) =>
              rollDie(die, rolls[index] === '' ? '' : rolls[index], { ms: 450 + index * 90 }),
            ),
          ),
          entry.healed
            ? diceBox.append(elem('span.mg-rest-res', `+${entry.healed} PG`))
            : entry.dice || diceBox.append(elem('span.mg-dim.mg-small', 'No gasta dados.')));
      }
      let party = rules.partySummary();
      for (let member of party) {
        let row = rows.querySelector(`[data-id="${CSS.escape(member.id)}"]`);
        row &&
          ((row.querySelector('.mg-hp-fill').style.width =
            `${(Math.max(0, member.hp) / Math.max(1, member.max_hp)) * 100}%`),
          (row.querySelector('.mg-hp-txt').textContent = `${member.hp} / ${member.max_hp}`));
      }
      let identified = res.identified || res.report?._identified || [];
      (identified.length &&
        ui.toast(`Identific\xE1is: ${identified.map((item) => item.name || item).join(', ')}.`, 'botin'),
        res.text && ui.hud?.visible && ui.hud.log(res.text, 'bien'),
        await finish('corto', res.report),
        (frame.foot.innerHTML = ''));
      let okButton = makeButton('Seguir', { icon: 'check', variant: 'primary', onclick: leave });
      (frame.foot.append(okButton), okButton.focus());
    });
    let backButton = makeButton(params.kind === 'corto' ? 'Cancelar' : 'Atr\xE1s', {
      onclick: () => (params.kind === 'corto' ? screen.close(null) : showChoice()),
    });
    (frame.foot.append(backButton, restButton), restButton.focus());
  }
  async function longRest() {
    ((kind = 'largo'),
      (frame.title.textContent = 'Descanso largo'),
      (frame.sub.textContent = where ? REST_PLACES[where] || where : ''),
      (frame.body.innerHTML = ''),
      (frame.foot.innerHTML = ''));
    let res = rules.longRest();
    if (!res || res.error || res.ok === !1)
      return (ui.toast(res?.reason || res?.error || 'No se ha podido descansar.', 'mal'), showChoice());
    let box = elem('div.mg-col', { style: 'justify-items:center;text-align:center;padding:1rem 0' }),
      text = params.text ? richText(params.text) : 'La noche pasa sin sobresaltos.';
    ((box.innerHTML = `${iconHtml('sunrise', 'mg-big')}<p class="mg-p" style="font-size:1.15rem;max-width:30rem">${text} Al amanecer del d\xEDa ${escapeHtml(currentCp().day || '')}, el grupo se levanta descansado: puntos de golpe, espacios de conjuro y rasgos, recuperados.</p>`),
      (box.querySelector('.mg-big').style.cssText =
        'width:4.5rem;height:4.5rem;color:var(--oro);filter:drop-shadow(0 0 14px rgba(242,207,122,.5))'),
      res.text && box.append(elem('p.mg-dim', res.text)),
      frame.body.append(box),
      await finish('largo'));
    let okButton = makeButton('Seguir', { icon: 'check', variant: 'primary', onclick: leave });
    (frame.foot.append(okButton), okButton.focus());
  }
  return (kind === 'corto' ? shortRest() : kind === 'largo' ? longRest() : showChoice(), { onEscape: leave });
}
const REST_PLACES = { posada: 'en la posada', campamento: 'junto a la hoguera', templo: 'en el templo' };

export { pantallaDescanso as default, opcionesDescanso as options };
