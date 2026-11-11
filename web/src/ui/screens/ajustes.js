// ui/screens/ajustes.js
// Reconstruido de publicado/juego.js (módulo __esm «YT»). Nombres locales aún minificados.

import { elem, makeButton } from '../dom.js';
import { screenFrame, Mf } from '../modal.js';

function opcionesAjustes() {
  return { width: '58rem', height: '46rem' };
}
function pantallaAjustes(o, e, t, a) {
  let n = a.store,
    s = () => n.settings,
    i = screenFrame(o, { title: 'Ajustes', ic: 'settings' });
  i.body.classList.add('mg-fill');
  let r = elem('div.mg-settings.mg-scroll', { style: 'overflow-y:auto;min-height:0' }),
    l = elem('div.mg-settings-cols');
  (r.append(l), i.body.append(r));
  let c = (E) => {
      (n.saveSettings(E),
        ('music' in E || 'sfx' in E || 'ambience' in E) &&
          a.audio?.setVolumes?.({ music: s().music, sfx: s().sfx, ambience: s().ambience }));
    },
    d = (E) => {
      let S = elem('section.mg-set-group');
      return (S.append(elem('h3.mg-sec', E)), l.append(S), S);
    },
    u = (E, S, z, D, M) => {
      let R = `aj-${Math.random().toString(36).slice(2, 7)}`,
        A = elem(`div.mg-set${M ? '.ancho' : ''}`),
        P = elem('label', { for: R }, S);
      return ((z.id ||= R), A.append(P, z), D && A.append(elem('p.mg-help', D)), E.append(A), A);
    },
    h = (E, { min: S = 0, max: z = 1, step: D = 0.05, fmt: M = (R) => `${Math.round(R * 100)} %` } = {}) => {
      let R = elem('span.mg-row-flex', { style: 'flex-wrap:nowrap' }),
        A = elem('span.mg-set-val', M(s()[E])),
        P = elem('input.mg-range', {
          type: 'range',
          min: S,
          max: z,
          step: D,
          value: s()[E] ?? 0,
          'aria-label': E,
        }),
        I = () => P.style.setProperty('--p', `${((P.value - S) / (z - S)) * 100}%`);
      return (
        I(),
        P.addEventListener('input', () => {
          (I(), (A.textContent = M(Number(P.value))), c({ [E]: Number(P.value) }));
        }),
        R.append(P, A),
        (R.id = ''),
        (P.id = `aj-${E}`),
        R
      );
    },
    p = (E, S = !1) => {
      let z = () => (s()[E] == null ? S : !!s()[E]),
        D = elem('button.mg-switch', { role: 'switch', 'aria-checked': String(z()) });
      return (
        D.addEventListener('click', () => {
          let M = !z();
          (D.setAttribute('aria-checked', String(M)), c({ [E]: M }));
        }),
        D
      );
    },
    m = d('Sonido');
  (u(m, 'M\xFAsica', h('music')).querySelector('label').setAttribute('for', 'aj-music'),
    u(m, 'Efectos', h('sfx')).querySelector('label').setAttribute('for', 'aj-sfx'),
    u(m, 'Ambiente', h('ambience')).querySelector('label').setAttribute('for', 'aj-ambience'));
  let v = d('Texto e interfaz');
  (u(
    v,
    'Velocidad del texto',
    Mf(
      [
        [0.5, 'Lenta'],
        [1, 'Normal'],
        [2, 'R\xE1pida'],
        [99, 'Al instante'],
      ],
      s().textSpeed ?? 1,
      (E) => c({ textSpeed: E }),
      { label: 'Velocidad del texto' },
    ),
    'Lo r\xE1pido que se escriben los di\xE1logos. Un clic siempre los completa.',
    !0,
  ),
    u(
      v,
      'Tama\xF1o de la interfaz',
      Mf(
        [
          [1, 'Normal'],
          [1.15, 'Grande'],
          [1.3, 'Muy grande'],
        ],
        s().uiScale ?? 1,
        (E) => c({ uiScale: E }),
        { label: 'Tama\xF1o de la interfaz' },
      ),
      null,
      !0,
    ),
    u(
      v,
      'Menos animaciones',
      p('reduceMotion'),
      'Quita los movimientos de la interfaz (los dados caen al momento).',
    ));
  let x = u(v, 'Consejos', p('tips', !0), 'Pistas en los primeros combates y al descubrir cosas nuevas.');
  typeof a.story?.tips?.reset == 'function' &&
    x.append(
      elem(
        'div',
        { style: 'grid-column:1/-1;padding-top:.3rem' },
        makeButton('Volver a ver los consejos', {
          icon: 'undo',
          size: 'sm',
          variant: 'ghost',
          onclick: () => {
            (a.story.tips.reset(), t.toast('Los consejos volver\xE1n a salir desde el principio.', 'info'));
          },
        }),
      ),
    );
  let g = d('Partida');
  (u(
    g,
    'Compa\xF1eros autom\xE1ticos',
    p('autoCompanions'),
    'En combate, tus compa\xF1eros juegan solos con su propia cabeza. T\xFA llevas a tu h\xE9roe.',
  ),
    u(
      g,
      'Confirmar fin de turno',
      p('confirmEndTurn'),
      'Pregunta antes de acabar el turno si a\xFAn te queda algo por hacer.',
    ),
    u(
      g,
      'Narrador con IA',
      p('narratorAI'),
      'Si est\xE1 disponible, un narrador describe con m\xE1s detalle algunos momentos. Si no, se usa el texto escrito.',
    ));
  let y = d('Gr\xE1ficos'),
    w = s().quality || 'auto';
  u(
    y,
    'Calidad',
    Mf(
      [
        ['auto', 'Autom\xE1tica'],
        ['baja', 'Baja'],
        ['media', 'Media'],
        ['alta', 'Alta'],
      ],
      w,
      (E) => {
        (c({ quality: E }), (k.hidden = E === w));
      },
      { label: 'Calidad gr\xE1fica' },
    ),
    'Baja: sin sombras ni resplandor, para m\xF3viles o ahorrar bater\xEDa. Alta: sombras finas y oclusi\xF3n ambiental, para gr\xE1ficas dedicadas. Autom\xE1tica decide seg\xFAn tu equipo y baja sola si va lenta.',
    !0,
  );
  let k = elem(
    'div.mg-row-flex',
    { style: 'padding:.4rem 0' },
    elem('span.mg-aviso.mg-small', 'La calidad nueva se aplica al recargar.'),
    makeButton('Recargar ahora', {
      size: 'sm',
      icon: 'redo',
      onclick: async () => {
        (n.cp &&
          !(await t.confirm(
            'Lo que no hayas guardado se perder\xE1. Antes de recargar se hace un guardado r\xE1pido.',
            { titulo: '\xBFRecargar?', si: 'Guardar y recargar' },
          ))) ||
          (n.cp && (await n.save('rapida')), location.reload());
      },
    }),
  );
  ((k.hidden = !0),
    y.append(k),
    u(
      y,
      'Efecto maqueta',
      p('tiltShift', !0),
      'Desenfoca un poco lo alto y lo bajo de la imagen, como si miraras una maqueta en miniatura. Ap\xE1galo si prefieres verlo todo n\xEDtido.',
    ),
    u(
      y,
      'Velocidad de la c\xE1mara',
      h('cameraSpeed', {
        min: 0.5,
        max: 2,
        step: 0.1,
        fmt: (E) => `\xD7${String(Math.round(E * 10) / 10).replace('.', ',')}`,
      }),
    ),
    y.lastChild.querySelector('label').setAttribute('for', 'aj-cameraSpeed'));
  let T = ['baja', 'media', 'alta'][a.quality?.level ?? 1];
  (y.append(
    elem(
      'p.mg-help',
      { style: 'padding-top:.4rem' },
      `Ahora mismo: calidad ${T}${a.quality?.gpu ? ` \xB7 ${a.quality.gpu}` : ''}.`,
    ),
  ),
    (i.foot.hidden = !1),
    i.foot.append(
      makeButton('Valores de serie', {
        icon: 'undo',
        variant: 'ghost',
        onclick: async () => {
          (await t.confirm('Todos los ajustes volver\xE1n a sus valores de serie.', {
            titulo: '\xBFRestablecer?',
            si: 'Restablecer',
          })) &&
            (c({
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
            o.close(null),
            t.open('ajustes'));
        },
      }),
      elem('span.mg-grow'),
      makeButton('Hecho', { icon: 'check', variant: 'primary', onclick: () => o.close(null) }),
    ));
}

export { pantallaAjustes as default, opcionesAjustes as options };
