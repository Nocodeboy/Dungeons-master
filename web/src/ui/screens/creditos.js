// ui/screens/creditos.js
// Pantalla «creditos»: créditos y licencias. scenes/ending.js reutiliza CREDITS_HTML.
// La registra ui/index.js (SCREENS) y se abre con ui.open('creditos').
// Reconstruido de publicado/juego.js (módulo __esm «Dv»).

import { elem } from '../dom.js';
import { screenFrame } from '../modal.js';

/** Opciones de la capa (tamaño, modal, clases) que ui.open pasa a ScreenStack.open. */
function opcionesCreditos() {
  return { width: '46rem', height: '44rem' };
}
/**
 * Construye la pantalla en `screen.el` (`params` son los de ui.open).
 * Devuelve los ganchos de la capa (onKey, onEscape, dispose…), si los hay.
 */
function pantallaCreditos(screen) {
  let frame = screenFrame(screen, { title: 'Cr\xE9ditos', ic: 'scroll_quill' });
  frame.body.classList.add('mg-fill');
  let box = elem('div.mg-credits.mg-scroll', { style: 'overflow-y:auto;min-height:0', html: CREDITS_HTML });
  frame.body.append(box);
}
const CREDITS_HTML = `
  <h3>Marca de Granito</h3>
  <p>Un juego de rol t\xE1ctico por turnos inspirado en los cl\xE1sicos de rol de los a\xF1os noventa.<br>Dise\xF1o, c\xF3digo y textos: Germ\xE1n (@nocodeboy) con Claude.</p>
  <p><small>Compatible con la quinta edici\xF3n (5E compatible).</small></p>
  <h3>Reglas</h3>
  <p>Las reglas proceden del SRD 5.2.1, adaptadas y traducidas al espa\xF1ol, con un n\xFAcleo propio en C++ compilado a WebAssembly.</p>
  <p><small><i>This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.</i></small></p>
  <h3>Modelos 3D</h3>
  <p><b>Quaternius</b> (quaternius.com): personajes, monstruos, animales, naturaleza, atrezo fant\xE1stico y aldea medieval. Licencia CC0.</p>
  <p><b>KayKit</b> por Kay Lousberg (kaylousberg.com): personajes, esqueletos, mazmorras y hex\xE1gonos medievales. Licencia CC0.</p>
  <p><b>Poly Haven</b> (polyhaven.com): muebles, atrezo y texturas. Licencia CC0.</p>
  <h3>Iconos</h3>
  <p><b>game-icons.net</b>, por Lorc, Delapouite, Skoll, Sbed, Zeromancer, Felbrigg, Guard13007, Darkzaitzev y Lucas. Licencia CC BY 3.0 (creativecommons.org/licenses/by/3.0). Recoloreados para el juego.</p>
  <h3>M\xFAsica</h3>
  <p><b>RandomMind</b> (opengameart.org/users/randommind). Licencia CC0.</p>
  <h3>Efectos de sonido</h3>
  <p><b>Kenney</b> (kenney.nl): RPG Audio, Impact Sounds, Interface Sounds y UI Audio. Licencia CC0.</p>
  <h3>Tipograf\xEDas</h3>
  <p><b>Cinzel</b>, por Natanael Gama \xB7 <b>Alegreya</b> y <b>Alegreya SC</b>, por Juan Pablo del Peral (Huerta Tipogr\xE1fica). SIL Open Font License 1.1.</p>
  <h3>Motor</h3>
  <p><b>three.js</b> (threejs.org), licencia MIT. Pergaminos, texturas de la interfaz y efectos, generados por c\xF3digo para este juego.</p>`;

export { CREDITS_HTML, pantallaCreditos as default, opcionesCreditos as options };
