// ui/screens/ajustes.js
// Reconstruido de publicado/juego.js (módulo __esm «YT»). Nombres locales aún minificados.

import { elem, makeButton } from '../dom.js';
import { screenFrame, makeSegmented } from '../modal.js';

function opcionesAjustes() {
  return { width: '58rem', height: '46rem' };
}
function pantallaAjustes(screen, params, ui, game) {
  let store = game.store,
    current = () => store.settings,
    frame = screenFrame(screen, { title: 'Ajustes', ic: 'settings' });
  frame.body.classList.add('mg-fill');
  let scroller = elem('div.mg-settings.mg-scroll', { style: 'overflow-y:auto;min-height:0' }),
    columns = elem('div.mg-settings-cols');
  (scroller.append(columns), frame.body.append(scroller));
  let save = (patch) => {
      (store.saveSettings(patch),
        ('music' in patch || 'sfx' in patch || 'ambience' in patch) &&
          game.audio?.setVolumes?.({
            music: current().music,
            sfx: current().sfx,
            ambience: current().ambience,
          }));
    },
    group = (title) => {
      let section = elem('section.mg-set-group');
      return (section.append(elem('h3.mg-sec', title)), columns.append(section), section);
    },
    field = (section, label, control, help, wide) => {
      let id = `aj-${Math.random().toString(36).slice(2, 7)}`,
        row = elem(`div.mg-set${wide ? '.ancho' : ''}`),
        labelEl = elem('label', { for: id }, label);
      return (
        (control.id ||= id),
        row.append(labelEl, control),
        help && row.append(elem('p.mg-help', help)),
        section.append(row),
        row
      );
    },
    slider = (key, { min = 0, max = 1, step = 0.05, fmt = (v) => `${Math.round(v * 100)} %` } = {}) => {
      let wrap = elem('span.mg-row-flex', { style: 'flex-wrap:nowrap' }),
        valueEl = elem('span.mg-set-val', fmt(current()[key])),
        input = elem('input.mg-range', {
          type: 'range',
          min,
          max,
          step,
          value: current()[key] ?? 0,
          'aria-label': key,
        }),
        paint = () => input.style.setProperty('--p', `${((input.value - min) / (max - min)) * 100}%`);
      return (
        paint(),
        input.addEventListener('input', () => {
          (paint(), (valueEl.textContent = fmt(Number(input.value))), save({ [key]: Number(input.value) }));
        }),
        wrap.append(input, valueEl),
        (wrap.id = ''),
        (input.id = `aj-${key}`),
        wrap
      );
    },
    toggle = (key, fallback = !1) => {
      let isOn = () => (current()[key] == null ? fallback : !!current()[key]),
        button = elem('button.mg-switch', { role: 'switch', 'aria-checked': String(isOn()) });
      return (
        button.addEventListener('click', () => {
          let on = !isOn();
          (button.setAttribute('aria-checked', String(on)), save({ [key]: on }));
        }),
        button
      );
    },
    soundGroup = group('Sonido');
  (field(soundGroup, 'M\xFAsica', slider('music')).querySelector('label').setAttribute('for', 'aj-music'),
    field(soundGroup, 'Efectos', slider('sfx')).querySelector('label').setAttribute('for', 'aj-sfx'),
    field(soundGroup, 'Ambiente', slider('ambience'))
      .querySelector('label')
      .setAttribute('for', 'aj-ambience'));
  let textGroup = group('Texto e interfaz');
  (field(
    textGroup,
    'Velocidad del texto',
    makeSegmented(
      [
        [0.5, 'Lenta'],
        [1, 'Normal'],
        [2, 'R\xE1pida'],
        [99, 'Al instante'],
      ],
      current().textSpeed ?? 1,
      (value) => save({ textSpeed: value }),
      { label: 'Velocidad del texto' },
    ),
    'Lo r\xE1pido que se escriben los di\xE1logos. Un clic siempre los completa.',
    !0,
  ),
    field(
      textGroup,
      'Tama\xF1o de la interfaz',
      makeSegmented(
        [
          [1, 'Normal'],
          [1.15, 'Grande'],
          [1.3, 'Muy grande'],
        ],
        current().uiScale ?? 1,
        (value) => save({ uiScale: value }),
        { label: 'Tama\xF1o de la interfaz' },
      ),
      null,
      !0,
    ),
    field(
      textGroup,
      'Menos animaciones',
      toggle('reduceMotion'),
      'Quita los movimientos de la interfaz (los dados caen al momento).',
    ));
  let tipsRow = field(
    textGroup,
    'Consejos',
    toggle('tips', !0),
    'Pistas en los primeros combates y al descubrir cosas nuevas.',
  );
  typeof game.story?.tips?.reset == 'function' &&
    tipsRow.append(
      elem(
        'div',
        { style: 'grid-column:1/-1;padding-top:.3rem' },
        makeButton('Volver a ver los consejos', {
          icon: 'undo',
          size: 'sm',
          variant: 'ghost',
          onclick: () => {
            (game.story.tips.reset(),
              ui.toast('Los consejos volver\xE1n a salir desde el principio.', 'info'));
          },
        }),
      ),
    );
  let gameGroup = group('Partida');
  (field(
    gameGroup,
    'Compa\xF1eros autom\xE1ticos',
    toggle('autoCompanions'),
    'En combate, tus compa\xF1eros juegan solos con su propia cabeza. T\xFA llevas a tu h\xE9roe.',
  ),
    field(
      gameGroup,
      'Confirmar fin de turno',
      toggle('confirmEndTurn'),
      'Pregunta antes de acabar el turno si a\xFAn te queda algo por hacer.',
    ),
    field(
      gameGroup,
      'Narrador con IA',
      toggle('narratorAI'),
      'Si est\xE1 disponible, un narrador describe con m\xE1s detalle algunos momentos. Si no, se usa el texto escrito.',
    ));
  let graphicsGroup = group('Gr\xE1ficos'),
    quality = current().quality || 'auto';
  field(
    graphicsGroup,
    'Calidad',
    makeSegmented(
      [
        ['auto', 'Autom\xE1tica'],
        ['baja', 'Baja'],
        ['media', 'Media'],
        ['alta', 'Alta'],
      ],
      quality,
      (value) => {
        (save({ quality: value }), (reloadRow.hidden = value === quality));
      },
      { label: 'Calidad gr\xE1fica' },
    ),
    'Baja: sin sombras ni resplandor, para m\xF3viles o ahorrar bater\xEDa. Alta: sombras finas y oclusi\xF3n ambiental, para gr\xE1ficas dedicadas. Autom\xE1tica decide seg\xFAn tu equipo y baja sola si va lenta.',
    !0,
  );
  let reloadRow = elem(
    'div.mg-row-flex',
    { style: 'padding:.4rem 0' },
    elem('span.mg-aviso.mg-small', 'La calidad nueva se aplica al recargar.'),
    makeButton('Recargar ahora', {
      size: 'sm',
      icon: 'redo',
      onclick: async () => {
        (store.cp &&
          !(await ui.confirm(
            'Lo que no hayas guardado se perder\xE1. Antes de recargar se hace un guardado r\xE1pido.',
            { titulo: '\xBFRecargar?', si: 'Guardar y recargar' },
          ))) ||
          (store.cp && (await store.save('rapida')), location.reload());
      },
    }),
  );
  ((reloadRow.hidden = !0),
    graphicsGroup.append(reloadRow),
    field(
      graphicsGroup,
      'Efecto maqueta',
      toggle('tiltShift', !0),
      'Desenfoca un poco lo alto y lo bajo de la imagen, como si miraras una maqueta en miniatura. Ap\xE1galo si prefieres verlo todo n\xEDtido.',
    ),
    field(
      graphicsGroup,
      'Velocidad de la c\xE1mara',
      slider('cameraSpeed', {
        min: 0.5,
        max: 2,
        step: 0.1,
        fmt: (v) => `\xD7${String(Math.round(v * 10) / 10).replace('.', ',')}`,
      }),
    ),
    graphicsGroup.lastChild.querySelector('label').setAttribute('for', 'aj-cameraSpeed'));
  let qualityName = ['baja', 'media', 'alta'][game.quality?.level ?? 1];
  (graphicsGroup.append(
    elem(
      'p.mg-help',
      { style: 'padding-top:.4rem' },
      `Ahora mismo: calidad ${qualityName}${game.quality?.gpu ? ` \xB7 ${game.quality.gpu}` : ''}.`,
    ),
  ),
    (frame.foot.hidden = !1),
    frame.foot.append(
      makeButton('Valores de serie', {
        icon: 'undo',
        variant: 'ghost',
        onclick: async () => {
          (await ui.confirm('Todos los ajustes volver\xE1n a sus valores de serie.', {
            titulo: '\xBFRestablecer?',
            si: 'Restablecer',
          })) &&
            (save({
              music: 0.7,
              sfx: 0.8,
              ambience: 0.6,
              textSpeed: 1,
              uiScale: 1,
              reduceMotion: !1,
              narratorAI: !0,
              autoCompanions: !0,
              confirmEndTurn: !0,
              tips: !0,
              cameraSpeed: 1,
              tiltShift: !0,
            }),
            screen.close(null),
            ui.open('ajustes'));
        },
      }),
      elem('span.mg-grow'),
      makeButton('Hecho', { icon: 'check', variant: 'primary', onclick: () => screen.close(null) }),
    ));
}

export { pantallaAjustes as default, opcionesAjustes as options };
