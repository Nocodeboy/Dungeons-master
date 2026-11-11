// ui/screens/ayuda.js
// Reconstruido de publicado/juego.js (módulo __esm «wM»). Nombres locales aún minificados.

import { elem } from '../dom.js';
import { screenFrame } from '../modal.js';

function opcionesAyuda() {
  return { width: '60rem', height: '44rem' };
}
function pantallaAyuda(screen) {
  let frame = screenFrame(screen, { title: 'C\xF3mo se juega', ic: 'open_book' });
  frame.body.classList.add('mg-fill');
  let keyHtml = (key) => `<span class="mg-key">${key}</span>`;
  frame.body.append(
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
          <dt>${keyHtml('I')}</dt><dd>Inventario</dd><dt>${keyHtml('P')}</dt><dd>Fichas del grupo</dd>
          <dt>${keyHtml('J')}</dt><dd>Diario de misiones</dd><dt>${keyHtml('M')}</dt><dd>Mapa de viaje</dd>
          <dt>${keyHtml('W')} ${keyHtml('A')} ${keyHtml('S')} ${keyHtml('D')} \xB7 ${keyHtml('Q')} ${keyHtml('E')}</dt><dd>Mover y girar la c\xE1mara</dd>
          <dt>${keyHtml('C')} ${keyHtml('B')} ${keyHtml('R')}</dt><dd>Sigilo, buscar y descansar</dd><dt>${keyHtml('X')} \xB7 ${keyHtml('G')}</dt><dd>Correr \xB7 todo el grupo</dd>
          <dt>${keyHtml('Esc')}</dt><dd>Pausa o cerrar la ventana abierta</dd><dt>${keyHtml('F5')}</dt><dd>Guardado r\xE1pido</dd>
          <dt>${keyHtml('1')}\u2026${keyHtml('9')}</dt><dd>Elegir respuesta en los di\xE1logos</dd><dt>${keyHtml('Espacio')}</dt><dd>Completar el texto del di\xE1logo</dd>
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
