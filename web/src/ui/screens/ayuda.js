// ui/screens/ayuda.js
// Reconstruido de publicado/juego.js (módulo __esm «wM»). Nombres locales aún minificados.

import { elem } from '../dom.js';
import { screenFrame } from '../modal.js';

function opcionesAyuda() {
  return { width: '60rem', height: '44rem' };
}
function pantallaAyuda(o) {
  let e = screenFrame(o, { title: 'C\xF3mo se juega', ic: 'open_book' });
  e.body.classList.add('mg-fill');
  let t = (a) => `<span class="mg-key">${a}</span>`;
  e.body.append(
    elem('div.mg-scroll', {
      style: 'overflow-y:auto;min-height:0',
      html: `<div class="mg-help-grid">
        <section><h3 class="mg-sec">Explorar</h3><dl>
          <dt>Clic en el suelo</dt><dd>El grupo va hasta all\xED, en formaci\xF3n detr\xE1s del l\xEDder.</dd>
          <dt>Clic en algo</dt><dd>Hablar, abrir, coger o mirar: va quien mejor sepa hacerlo.</dd>
          <dt>Bot\xF3n derecho / dos dedos</dt><dd>Girar la c\xE1mara. Rueda o pellizco: acercar y alejar.</dd>
          <dt>Retratos</dt><dd>Clic: seleccionar. Doble clic o mantener: ver la ficha.</dd>
        </dl></section>
        <section><h3 class="mg-sec">Atajos de teclado</h3><dl>
          <dt>${t('I')}</dt><dd>Inventario</dd><dt>${t('P')}</dt><dd>Fichas del grupo</dd>
          <dt>${t('J')}</dt><dd>Diario de misiones</dd><dt>${t('M')}</dt><dd>Mapa de viaje</dd>
          <dt>${t('W')} ${t('A')} ${t('S')} ${t('D')} \xB7 ${t('Q')} ${t('E')}</dt><dd>Mover y girar la c\xE1mara</dd>
          <dt>${t('C')} ${t('B')} ${t('R')}</dt><dd>Sigilo, buscar y descansar</dd><dt>${t('X')} \xB7 ${t('G')}</dt><dd>Correr \xB7 todo el grupo</dd>
          <dt>${t('Esc')}</dt><dd>Pausa o cerrar la ventana abierta</dd><dt>${t('F5')}</dt><dd>Guardado r\xE1pido</dd>
          <dt>${t('1')}\u2026${t('9')}</dt><dd>Elegir respuesta en los di\xE1logos</dd><dt>${t('Espacio')}</dt><dd>Completar el texto del di\xE1logo</dd>
        </dl></section>
        <section><h3 class="mg-sec">Descubrir y decidir</h3>
          <p class="mg-p">La Percepci\xF3n pasiva del grupo revela trampas y escondites al pasar cerca; \xABBuscar\xBB tira Investigaci\xF3n. En sigilo pod\xE9is sorprender al enemigo\u2026 o evitar el combate.</p>
          <p class="mg-p">Las respuestas con una etiqueta como <span style="color:var(--agua)">[Persuasi\xF3n CD 13]</span> dependen de una tirada: el dado se ve en el di\xE1logo. Las de <span style="color:var(--bien)">[Enano]</span> o <span style="color:var(--bien)">[Cl\xE9rigo]</span> solo aparecen si encajan con tu h\xE9roe.</p>
        </section>
        <section><h3 class="mg-sec">Descansar y mejorar</h3>
          <p class="mg-p">Descanso corto (una hora): gasta dados de golpe para curarte; hay dos entre descansos largos. Descanso largo: en la posada o en un campamento seguro, lo recupera todo.</p>
          <p class="mg-p">Los objetos m\xE1gicos llegan sin identificar; un descanso corto basta. Pasa el rat\xF3n (o mant\xE9n el dedo) sobre cualquier objeto, conjuro o rasgo para ver qu\xE9 hace.</p>
        </section>
      </div>`,
    }),
  );
}

export { pantallaAyuda as default, opcionesAyuda as options };
