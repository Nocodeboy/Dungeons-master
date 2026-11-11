#!/usr/bin/env node
// Partida automática de punta a punta del capítulo I de Marca de Granito.
//
// Uso:
//   node qa/flujo.cjs [--base=http://localhost:8751/] [--salida=qa/salida/flujo]
//                     [--desde=ETAPA] [--hasta=ETAPA] [--semilla=42] [--tiradas=exito|real]
//                     [--limite=MINUTOS]
//
// Etapas, en orden: inicio, e1, vecinos, posada, elderhal, vuelta, kesh, tumulo, sello, creditos.
// Cada etapa termina con una captura, un registro de estado en el informe y un punto de control
// (salida/puntos/<etapa>.json) con la partida guardada: «--desde=X» arranca cargando el punto de
// control de la etapa anterior a X, así que una partida larga se puede retomar por trozos.
//
// La misma orden vale contra la versión publicada y contra la reconstrucción:
//   node qa/flujo.cjs --base=http://localhost:8751/            (publicado/)
//   node qa/flujo.cjs --base=http://localhost:8752/            (web/dist/)
// Ejecutar bajo «flock /tmp/mdg-pesado.lock» (tarda bastante con SwiftShader).
'use strict';
const fs = require('fs');
const path = require('path');
const { Sesion, argumentos, espera } = require('./lib/mdg.cjs');
const { crearHeroe } = require('./humo.cjs');

const A = argumentos();
const BASE = A.base || process.env.MDG_BASE || 'http://localhost:8751/';
const SALIDA = path.resolve(A.salida || path.join(__dirname, 'salida', 'flujo'));
const PUNTOS = path.join(SALIDA, 'puntos');
const LIMITE_MIN = Number(A.limite || 240);
const TIRADAS = A.tiradas || 'exito';
const PARAMS = { depurar: true, turbo: 4, calidad: 'baja', escala: 0.5, autocombate: true, autonivel: true, semilla: A.semilla || 42, 'captura-nitida': true };

// Opciones de diálogo que el modo «explorar» del piloto no elige nunca por su cuenta.
const EVITAR = ['^Comerciar', '^Pasar la noche', '^Curar', '^Identificar', 'Devolver(d)? la vida', '^Despedir', 'espere', 'Esp[ée]r[ae]nos', 'Esperadnos',
  'No es asunto', '^¡?Atac', '¡A por', '^Basta de', 'Romper', 'Os pagaré', 'Enséñame', 'Quiero ver lo que', 'A ver ese género', 'No necesitamos',
  'Es peligroso', 'Retroceder', '^Todavía no', 'Dejar descansar', 'Cien piezas', 'Que la pague', 'Mientes', 'Contratar'];

// Política de diálogo por id de diálogo: expresiones regulares en orden de preferencia.
const DIALOGOS = {
  prologue: ['^Es la Marca', '^Bajemos'],
  maren: ['^Contad conmigo', '^Bajaremos a ver', '^Adiós'],
  sedge: ['^A ayudar', '^Me ocuparé', '^Gracias, Sedge', '^Adiós, Sedge'],
  aldis: ['santuario del bosque', '^Encontramos a Ilyra', '^Adiós'],
  ysolde: ['^Adiós'], dagna: ['^Adiós'], tobin: ['^Adiós'],
  pip: ['^¿Retenido por quién', '^Hablaré con Holt', '^Bienvenido al grupo', '^Vámonos, Pip', '^Estoy en ello', '^Nada\\. Sigamos'],
  holt: ['^Brenna, ¿te encargas', '^Adiós'],
  corwin: ['^Pasar la noche', '^Adiós'],
  board: ['^Leer los avisos', '^Dejar el tablón'],
  bull: [],
  wolves: ['^Gritarles', '^¡A las armas!'],
  shrine_goblins: ['^¡Atacad!', '^¡A por ellos!'],
  ilyra: ['^Ya pasó', '^Vamos a por los Zarpas', '^Bienvenida, Ilyra', '^Ven con nosotros', '^Nada'],
  chief: ['^Venimos a acabar', '^Lo que os llevasteis', '^¿Qué buscabais en el río', '^Nada más\\. Marchaos', '^¡A las armas!'],
  odvar: ['^Buscamos un cuerno', '^¿Podéis traducirme', 'Mostrar la Marca', '^Significa que me duele', '^En Merrowick hay un toro', '^¿Venís con nosotros', '^Bienvenido, Maese', '^Nos vamos, Maese', '^Adiós, Maese', '^Nada, Maese'],
  rune_1: ['hasta la ola', '^Dejarla como está'],
  rune_2: ['hasta el monte', '^Dejarla como está'],
  rune_3: ['hasta los cuernos', '^Dejarla como está'],
  kesh_statue: ['^Dejarlo'],
  horn_socket: ['^Encajar el cuerno', '^Dejarlo'],
  seal_1: ['^Encajar el cuerno', '^Pisar la losa del toro', '^Dejarla'],
  seal_2: ['^Encajar el cuerno', '^Pisar la losa del río', '^Dejarla'],
  seal_3: ['^Encajar el cuerno', '^Pisar la losa de la piedra', '^Dejarla'],
  tumulo_inscription: ['^Odvar, leedla', '^Leer la inscripción', '^Dejarla'],
  crypt_gate: ['^Dejar descansar'],
  vorhan: ['^A cerrarlo', 'Recitar el verso', '^Que así sea, guardián', '^¡A las armas!', '^Que así sea'],
  seal: ['^Verter tu sangre', '^Hacerlo'],
};

const ORDEN = ['inicio', 'e1', 'vecinos', 'posada', 'elderhal', 'vuelta', 'kesh', 'tumulo', 'sello', 'creditos'];

// ───────────────────────── utilidades de la partida ─────────────────────────

async function cumple(s, cond) {
  return await s.pagina.evaluate((c) => !!window.__mdg.story.test(c, {}), cond);
}

async function derrotas(s) {
  return await s.pagina.evaluate(() => window.__qa.derrotas || 0);
}

// Tras una derrota el piloto pulsa «Cargar la última partida»: esperar a volver a explorar.
async function esperarRecarga(s) {
  await s.esperar(() => !document.querySelector('.mg-layer[data-capa="derrota"]'), null, { timeout: 60000, desc: 'cierre de la pantalla de derrota' });
  await s.esperar(() => window.__mdg.scenes.name === 'explore' && window.__mdg.scenes.current?.explore?.entered && !window.__mdg.scenes.busy, null, { timeout: 120000, desc: 'recarga tras derrota' });
  await s.libre();
}

// Ejecuta objetivos idempotentes: cada uno tiene «hecho» (condición de historia) y «hacer».
// Si hay una derrota, se recarga el autoguardado y se vuelve a empezar la lista.
async function objetivos(s, lista, { intentos = 5 } = {}) {
  for (let intento = 1; intento <= intentos; intento++) {
    let reinicio = false;
    for (const o of lista) {
      if (o.hecho && await cumple(s, o.hecho)) continue;
      s.log(`objetivo: ${o.nombre}${intento > 1 ? ` (intento ${intento})` : ''}`);
      const d0 = await derrotas(s);
      try {
        await o.hacer(s);
      } catch (e) {
        if (await derrotas(s) > d0) { reinicio = true; break; }
        if (o.opcional) { s.log(`objetivo opcional «${o.nombre}» falló: ${e.message.slice(0, 160)}`); s.avisos.push(`${o.nombre}: ${e.message.slice(0, 200)}`); continue; }
        throw e;
      }
      if (await derrotas(s) > d0) { reinicio = true; break; }
      if (o.hecho && !(await cumple(s, o.hecho))) {
        if (o.opcional) { s.log(`objetivo opcional «${o.nombre}» sin cumplir (${o.hecho})`); s.avisos.push(`${o.nombre}: no se cumple ${o.hecho}`); continue; }
        throw new Error(`El objetivo «${o.nombre}» no deja cumplida la condición «${o.hecho}»`);
      }
    }
    if (!reinicio) return;
    s.log('derrota: se recarga el autoguardado y se repiten los objetivos de la etapa');
    await esperarRecarga(s);
  }
  throw new Error(`Demasiadas derrotas (${intentos})`);
}

// Lanza algo que provoca un combate y espera a que acabe, con captura a mitad.
async function combatir(s, nombre, disparar, { capturar = true } = {}) {
  const n0 = await s.pagina.evaluate(() => (window.__qa.combates || []).length);
  await disparar();
  try {
    await s.esperar((n0) => (window.__qa.combates || []).length > n0, n0, { timeout: 90000, desc: `inicio del combate ${nombre}` });
  } catch (e) {
    throw new Error(`No empieza el combate ${nombre}`);
  }
  if (capturar) { await espera(5000); await s.etapa(`combate_${nombre}`); }
  const c = await s.combate({ empezar: 60000, timeout: 900000, n0 });
  if (c?.ganado) {
    await s.libre({ timeout: 180000, desc: `exploración tras el combate ${nombre}` });
    await s.etapa(`${nombre}_ganado`, { combate: c });
  }
  return c;
}

// Habla con un PNJ u objeto, opcionalmente capturando la primera pantalla de la conversación.
async function conversar(s, tipo, id, { captura = null, dialogo = null } = {}) {
  const fin = captura ? await s.capturarAl({ dialogo: dialogo || id }, captura, { timeout: 45000 }) : null;
  await s.tocar(tipo, id);
  if (fin) await fin();
  await s.libre({ timeout: 180000, desc: `fin de la conversación con ${id}` });
}

// Usa una salida del nivel que lleva al mapa de viaje y elige destino.
async function viajar(s, salida, destino) {
  await s.libre();
  const desde = await s.pagina.evaluate(() => window.__mdg.scenes.current.explore.levelId);
  await s.pagina.evaluate(([id]) => {
    const ex = window.__mdg.scenes.current.explore;
    const sal = ex.level.exits.find((e) => e.id === id);
    if (!sal) throw new Error('No existe la salida ' + id);
    ex.goExit(sal, sal.cells[1] || sal.cells[0]);
  }, [salida]);
  await s.esperar(() => window.__mdg.scenes.name === 'travel' && !window.__mdg.scenes.busy, null, { timeout: 120000, desc: 'mapa de viaje' });
  await espera(1200);
  await s.pagina.click(`.mg-travel .pin[data-id="${destino}"]`);
  await espera(500);
  await s.etapa(`viaje_${desde}_${destino}`);
  const viajar = s.pagina.locator('.mg-map-info button', { hasText: 'Viajar' });
  await viajar.click();
  await s.esperar((d) => window.__mdg.scenes.name === 'explore' && window.__mdg.scenes.current?.explore?.levelId === d && window.__mdg.scenes.current.explore.entered && !window.__mdg.scenes.busy, destino, { timeout: 180000, desc: `llegada a ${destino}` });
  await s.calma();
  await s.libre({ timeout: 180000 });
}

// Usa una casilla de salida del nivel que lleva directamente a otro nivel (p. ej. la puerta de la posada).
async function salir(s, salida, nivel) {
  await s.libre();
  await s.pagina.evaluate(([id]) => {
    const ex = window.__mdg.scenes.current.explore;
    const sal = ex.level.exits.find((e) => e.id === id);
    if (!sal) throw new Error('No existe la salida ' + id);
    ex.goExit(sal, sal.cells[0]);
  }, [salida]);
  await s.esperar((n) => window.__mdg.scenes.name === 'explore' && window.__mdg.scenes.current?.explore?.levelId === n && window.__mdg.scenes.current.explore.entered && !window.__mdg.scenes.busy, nivel, { timeout: 180000, desc: `vuelta a ${nivel}` });
  await s.calma();
  await s.libre({ timeout: 180000 });
}

// Cruza una puerta o escalera que cambia de nivel.
async function cruzar(s, objeto, nivel) {
  await s.usar(objeto);
  await s.esperar((n) => window.__mdg.scenes.name === 'explore' && window.__mdg.scenes.current?.explore?.levelId === n && window.__mdg.scenes.current.explore.entered && !window.__mdg.scenes.busy, nivel, { timeout: 180000, desc: `entrada en ${nivel}` });
  await s.calma();
  await s.libre({ timeout: 180000 });
}

// Guarda un punto de control con la partida actual.
async function punto(s, nombre) {
  const p = await s.pagina.evaluate(() => {
    const st = window.__mdg.store;
    st.cp.location = st.cp.location || {};
    window.__mdg.scenes.current?.explore?.saveCell?.();
    return { meta: st.meta('auto'), data: JSON.stringify(st.cp) };
  });
  fs.mkdirSync(PUNTOS, { recursive: true });
  fs.writeFileSync(path.join(PUNTOS, `${nombre}.json`), JSON.stringify(p));
}

// ───────────────────────── etapas ─────────────────────────

const ETAPAS = {
  async inicio(s) {
    await s.esperar(() => document.querySelector('.mg-menu-btn[data-k="nueva"]'), null, { desc: 'menú principal' });
    await s.etapa('menu');
    await s.pagina.click('.mg-menu-btn[data-k="nueva"]');
    await s.esperar(() => window.__mdg.scenes.name === 'creator' && document.querySelector('.mg-cr-nav button'), null, { desc: 'creador' });
    await s.calma();
    const finRelato = await s.capturarAl({ capa: 'relato' }, 'prologo_relato', { timeout: 120000 });
    await crearHeroe(s, { nombre: 'Aren Prueba', capturas: ['Especie', 'Clase', 'Aspecto'] });
    await finRelato();
    const finDlg = await s.capturarAl({ dialogo: '^prologue' }, 'prologo_dialogo', { timeout: 60000 });
    await finDlg();
    await s.esperar(() => window.__mdg.scenes.name === 'explore' && window.__mdg.scenes.current?.explore?.entered, null, { timeout: 180000, desc: 'llegada a Merrowick' });
    await s.calma();
    await s.libre();
    await s.etapa('merrowick_llegada');
  },

  async e1(s) {
    await objetivos(s, [
      { nombre: 'combate e1 (asalto al prado)', hecho: 'e1_done', hacer: async (s) => {
        await s.libre();
        await combatir(s, 'e1', () => s.mover([21, 18]));
      } },
    ]);
    const st = await s.estado();
    if (st.nivelGrupo !== 2) s.avisos.push(`Tras e1 el grupo es de nivel ${st.nivelGrupo} (se esperaba 2)`);
  },

  async vecinos(s) {
    await objetivos(s, [
      { nombre: 'hablar con la alcaldesa Maren', hecho: 'quest_camp', hacer: (s) => conversar(s, 'npc', 'maren', { captura: 'dialogo_maren' }) },
      { nombre: 'hablar con la vieja Sedge', hecho: 'sedge_quest', opcional: true, hacer: (s) => conversar(s, 'npc', 'sedge') },
      { nombre: 'hablar con la hermana Aldis (templo)', hecho: 'aldwen_rumor', opcional: true, hacer: (s) => conversar(s, 'npc', 'aldis', { captura: 'dialogo_aldis' }) },
      { nombre: 'comprar en la herboristería de Ysolde', hecho: 'qa_compra', opcional: true, hacer: comprar },
    ]);
  },

  async posada(s) {
    await objetivos(s, [
      { nombre: 'entrar en la posada', hecho: null, hacer: async (s) => {
        if ((await s.estado()).nivel !== 'posada') await cruzar(s, 'inn', 'posada');
        await s.etapa('posada_interior');
      } },
      { nombre: 'conocer a Pip', hecho: 'pip_met', opcional: true, hacer: (s) => conversar(s, 'npc', 'pip', { captura: 'dialogo_pip' }) },
      { nombre: 'tratar con Holt Varga', hecho: 'pip_debt', opcional: true, hacer: (s) => conversar(s, 'npc', 'holt') },
      { nombre: 'reclutar a Pip', hecho: 'party:pip', opcional: true, hacer: (s) => conversar(s, 'npc', 'pip') },
      { nombre: 'leer el tablón de mercenarios', hecho: 'seen:board.mercs', opcional: true, hacer: (s) => conversar(s, 'object', 'board', { captura: 'tablon_mercenarios', dialogo: 'board' }) },
      { nombre: 'descansar en la posada (Corwin)', hecho: 'inn_first_night', opcional: true, hacer: async (s) => {
        await s.politica({ cerrar: ['inventario', 'grupo', 'diario', 'ayuda', 'ajustes', 'creditos', 'cargar', 'guardar', 'viaje', 'pausa'] });
        const fin = await s.capturarAl({ capa: 'descanso' }, 'descanso_posada', { timeout: 60000 });
        await s.tocar('npc', 'corwin');
        await fin();
        await s.libre({ timeout: 180000 });
      } },
      { nombre: 'guardar en la ranura 1', hecho: 'qa_guardado', hacer: guardar },
      { nombre: 'salir de la posada', hecho: null, hacer: (s) => salir(s, 'door', 'merrowick') },
    ]);
  },

  async elderhal(s) {
    await objetivos(s, [
      { nombre: 'viajar al bosque de Elderhal', hecho: null, hacer: async (s) => {
        if ((await s.estado()).nivel !== 'elderhal') await viajar(s, 'east', 'elderhal');
        await s.etapa('elderhal_llegada');
      } },
      { nombre: 'santuario: saqueadores trasgos', hecho: 'shrine_goblins_dead', hacer: (s) => combatir(s, 'santuario', async () => { await s.mover([30, 28]); await s.mover([36, 28]); }) },
      { nombre: 'Ilyra se une', hecho: 'ilyra_met', opcional: true, hacer: (s) => conversar(s, 'npc', 'ilyra', { captura: 'dialogo_ilyra' }) },
      { nombre: 'centinelas del camino', hecho: 'sentries_dead', opcional: true, hacer: (s) => combatir(s, 'centinelas', async () => { await s.mover([30, 21]); await s.mover([32, 17]); }) },
      { nombre: 'campamento de los Zarpas Grises', hecho: 'camp_done', hacer: async (s) => {
        for (let i = 0; i < 3 && !(await cumple(s, 'camp_done')); i++) {
          await s.libre();
          const fin = i === 0 ? await s.capturarAl({ dialogo: '^chief' }, 'dialogo_jefe', { timeout: 120000 }) : null;
          await s.mover([36, 12]);
          await s.mover([39, 9]);
          if (fin) await fin();
          await s.libre({ timeout: 900000, desc: 'fin del encuentro con el campamento' });
        }
      } },
    ]);
    await s.etapa('elderhal_hecho');
  },

  async vuelta(s) {
    await objetivos(s, [
      { nombre: 'volver a Merrowick', hecho: null, hacer: async (s) => { if ((await s.estado()).nivel !== 'merrowick') await viajar(s, 'back', 'merrowick'); } },
      { nombre: 'cobrar de Maren', hecho: 'camp_paid', opcional: true, hacer: (s) => conversar(s, 'npc', 'maren') },
    ]);
    await s.etapa('merrowick_escalera');
  },

  async kesh(s) {
    await objetivos(s, [
      { nombre: 'viajar al vado de Kesh', hecho: null, hacer: async (s) => {
        if ((await s.estado()).nivel !== 'kesh') await viajar(s, 'east', 'kesh');
        await s.etapa('kesh_llegada');
      } },
      { nombre: 'conocer a Maese Odvar', hecho: 'odvar_met', opcional: true, hacer: (s) => conversar(s, 'npc', 'odvar', { captura: 'dialogo_odvar' }) },
      { nombre: 'piedra rúnica 1 (ola)', hecho: 'runes_solved | kesh_r1=agua', hacer: (s) => conversar(s, 'object', 'rune_1') },
      { nombre: 'piedra rúnica 2 (monte)', hecho: 'runes_solved | kesh_r2=monte', hacer: (s) => conversar(s, 'object', 'rune_2') },
      { nombre: 'piedra rúnica 3 (cuernos)', hecho: 'runes_solved', hacer: (s) => conversar(s, 'object', 'rune_3', { captura: 'runa_3', dialogo: 'rune_3' }) },
      { nombre: 'el cuerno de piedra', hecho: 'seal_key', hacer: (s) => s.usar('kesh_chest').then(() => s.libre()) },
      { nombre: 'Odvar se une', hecho: 'party:odvar', opcional: true, hacer: (s) => conversar(s, 'npc', 'odvar') },
      { nombre: 'nido de arañas gigantes', hecho: 'spiders_dead', opcional: true, hacer: (s) => combatir(s, 'aranas', async () => { await s.mover([28, 18]); await s.mover([32, 21]); }) },
    ]);
    await s.etapa('kesh_hecho');
  },

  async tumulo(s) {
    await objetivos(s, [
      { nombre: 'volver a Merrowick (y nivel 3)', hecho: null, hacer: async (s) => {
        if (!['merrowick', 'tumulo'].includes((await s.estado()).nivel)) await viajar(s, 'west', 'merrowick');
        await s.esperar(() => (window.__mdg.store.cp.party_level || 1) >= 3, null, { timeout: 120000, desc: 'subida a nivel 3' }).catch(() => s.avisos.push('No llega la subida a nivel 3 al salir de Kesh'));
        await s.libre();
        await s.etapa('nivel3');
      } },
      { nombre: 'bajar al túmulo', hecho: 'tumulo_entered', hacer: async (s) => {
        await s.politica({ general: ['^Bajar$'] });
        await cruzar(s, 'tumulo', 'tumulo');
        await s.etapa('tumulo_entrada');
      } },
      { nombre: 'pasillo (trampas) hasta la sala de las losas', hecho: null, hacer: async (s) => { await s.mover([15, 26]); await s.mover([14, 21]); await s.mover([14, 19]); await s.libre(); } },
      { nombre: 'encajar el cuerno', hecho: 'horn_placed', hacer: (s) => conversar(s, 'object', 'horn_socket') },
      { nombre: 'losa del río', hecho: 'seals_solved | seals_step>=1', hacer: (s) => conversar(s, 'object', 'seal_2') },
      { nombre: 'losa de la piedra', hecho: 'seals_solved | seals_step>=2', hacer: (s) => conversar(s, 'object', 'seal_3') },
      { nombre: 'losa del toro', hecho: 'seals_solved', hacer: (s) => conversar(s, 'object', 'seal_1', { captura: 'losas', dialogo: 'seal_1' }) },
      { nombre: 'Vorhan y los guardianes', hecho: 'vorhan_dead', hacer: (s) => combatir(s, 'vorhan', async () => { await s.mover([15, 10]); await s.mover([15, 8]); }) },
    ]);
  },

  async sello(s) {
    const fin = await s.capturarAl({ dialogo: '^seal$|^seal\\|' }, 'dialogo_sello', { timeout: 120000 });
    await s.usar('seal');
    await fin();
    await s.esperar(() => window.__mdg.scenes.name === 'ending' && !window.__mdg.scenes.busy, null, { timeout: 300000, desc: 'escena del epílogo' });
    await s.calma();
  },

  async creditos(s) {
    await s.pagina.evaluate(() => { window.__qa.activo = false; });
    let laminas = 0;
    for (let i = 0; i < 20; i++) {
      await s.esperar(() => document.querySelector('.mg-ending .pie button'), null, { timeout: 60000, desc: 'lámina del epílogo' });
      await espera(600);
      const txt = await s.pagina.evaluate(() => document.querySelector('.mg-ending .pie button').innerText.trim());
      laminas++;
      await s.etapa(`epilogo_${laminas}`);
      await s.pagina.click('.mg-ending .pie button');
      if (/Créditos/i.test(txt)) break;
      await espera(400);
    }
    await s.esperar(() => document.querySelector('.mg-roll-credits'), null, { timeout: 60000, desc: 'créditos' });
    await espera(3000);
    await s.etapa('creditos', { laminas });
  },
};

async function comprar(s) {
  await s.politica({ dialogos: { ysolde: ['^Enséñame tus hierbas'] }, cerrar: ['inventario', 'grupo', 'diario', 'ayuda', 'ajustes', 'creditos', 'cargar', 'guardar', 'viaje', 'pausa'] });
  try {
    await s.tocar('npc', 'ysolde');
    await s.esperar(() => document.querySelector('.mg-layer[data-capa="tienda"] .mg-shop-row'), null, { timeout: 90000, desc: 'tienda de Ysolde' });
    await espera(600);
    const antes = await s.estado();
    const filas = s.pagina.locator('.mg-layer[data-capa="tienda"] [data-pane="comprar"] button.mg-shop-row:not(.caro)');
    if (await filas.count() === 0) throw new Error('No hay nada asequible en la tienda');
    await filas.last().click();
    await espera(400);
    await s.etapa('tienda');
    // Ojo: en la tienda hay una pestaña oculta «Comprar» (vista móvil); el botón bueno es el principal del detalle.
    await s.pagina.locator('.mg-layer[data-capa="tienda"] [data-pane="detalle"] button.mg-btn--primary', { hasText: /Comprar/ }).first().click();
    await espera(800);
    const despues = await s.estado();
    s.log(`compra: oro ${antes.oro} → ${despues.oro}`);
    if (!(despues.oro < antes.oro)) throw new Error(`La compra no descuenta oro (${antes.oro} → ${despues.oro})`);
    await s.pagina.evaluate(() => { window.__mdg.store.setFlag('qa_compra', true); window.__mdg.ui.layers.top?.close(null); });
  } finally {
    await s.politica({ dialogos: { ysolde: ['^Adiós'] }, cerrar: ['tienda', 'inventario', 'grupo', 'diario', 'ayuda', 'ajustes', 'creditos', 'cargar', 'guardar', 'viaje', 'pausa'] });
  }
  await s.libre();
}

async function guardar(s) {
  await s.politica({ cerrar: [] });
  try {
    await s.libre();
    await s.pagina.keyboard.press('Escape');
    await s.esperar(() => document.querySelector('.mg-layer[data-capa="pausa"]'), null, { timeout: 20000, desc: 'menú de pausa' });
    await s.pagina.locator('.mg-layer[data-capa="pausa"] button', { hasText: /Guardar/ }).first().click();
    await s.esperar(() => document.querySelector('.mg-layer[data-capa="guardar"] .mg-save-acts button'), null, { timeout: 20000, desc: 'pantalla de guardar' });
    await espera(500);
    // La lista de guardar empieza por la ranura «Rápido»; se usa explícitamente la «Ranura 1».
    const fila = s.pagina.locator('.mg-layer[data-capa="guardar"] .mg-save', { has: s.pagina.locator('.mg-save-n', { hasText: 'Ranura 1' }) });
    await fila.locator('.mg-save-acts button', { hasText: /Guardar|Sobrescribir/ }).first().click();
    await espera(800);
    await s.pagina.evaluate(() => document.querySelector('.mg-layer[data-capa="confirmar"] .mg-btn--primary')?.click());
    await espera(1200);
    await s.etapa('guardar');
    const guardadas = await s.pagina.evaluate(() => Object.keys(localStorage).filter((k) => /^mdg\.partida\./.test(k)));
    s.log('ranuras en localStorage: ' + guardadas.join(', '));
    if (!guardadas.includes('mdg.partida.1')) throw new Error('No aparece la partida guardada en la ranura 1 (mdg.partida.1)');
    await s.pagina.evaluate(() => { window.__mdg.store.setFlag('qa_guardado', true); for (const l of [...window.__mdg.ui.layers.stack].reverse()) l.close(null); });
  } finally {
    await s.politica({ cerrar: ['tienda', 'inventario', 'grupo', 'diario', 'ayuda', 'ajustes', 'creditos', 'cargar', 'guardar', 'viaje', 'pausa'] });
  }
  await s.libre();
}

// ───────────────────────── principal ─────────────────────────

async function principal() {
  const desde = A.desde || 'inicio';
  const hasta = A.hasta || 'creditos';
  const i0 = ORDEN.indexOf(desde), i1 = ORDEN.indexOf(hasta);
  if (i0 < 0 || i1 < 0) throw new Error(`Etapa desconocida; etapas: ${ORDEN.join(', ')}`);
  let partida = null;
  if (i0 > 0) {
    const f = path.join(PUNTOS, `${ORDEN[i0 - 1]}.json`);
    if (!fs.existsSync(f)) throw new Error(`Falta el punto de control ${f}: ejecuta antes hasta «${ORDEN[i0 - 1]}»`);
    partida = fs.readFileSync(f, 'utf8');
  }
  const s = new Sesion({ base: BASE, salida: SALIDA, nombre: 'flujo' });
  s.avisos = [];
  const resultado = { desde, hasta, etapas: {}, ultima: null };
  s.extraInforme = () => ({ resultado, avisos: s.avisos, params: PARAMS, tiradas: TIRADAS });
  const reloj = setTimeout(async () => {
    console.error(`FLUJO: límite de ${LIMITE_MIN} min superado`);
    await s.etapa('limite', { ok: false }).catch(() => null);
    await s.informe({ resultado: { ...resultado, error: 'límite de tiempo' }, avisos: s.avisos }).catch(() => null);
    process.exit(2);
  }, LIMITE_MIN * 60000);
  let codigo = 0;
  try {
    await s.abrir();
    if (partida) await s.contexto.addInitScript((p) => { try { if (!sessionStorage.getItem('qa.partida')) { localStorage.setItem('mdg.partida.auto', p); sessionStorage.setItem('qa.partida', '1'); } } catch {} }, partida);
    await s.ir(PARAMS);
    await s.politica({ dialogos: DIALOGOS, evitar: EVITAR });
    if (TIRADAS === 'exito') await s.pagina.evaluate(() => { window.__mdg.story.debug.rollMode = 'success'; });
    if (partida) {
      await s.pagina.click('.mg-menu-btn[data-k="continuar"]');
      await s.esperar(() => window.__mdg.scenes.name === 'explore' && window.__mdg.scenes.current?.explore?.entered && !window.__mdg.scenes.busy, null, { timeout: 180000, desc: 'carga del punto de control' });
      await s.libre();
      await s.etapa(`reanudar_${desde}`);
    }
    for (let i = i0; i <= i1; i++) {
      const nombre = ORDEN[i];
      const t = Date.now();
      s.log(`══════ ETAPA ${nombre} ══════`);
      try {
        await ETAPAS[nombre](s);
        resultado.etapas[nombre] = { ok: true, s: Math.round((Date.now() - t) / 1000) };
        resultado.ultima = nombre;
        if (nombre !== 'creditos' && nombre !== 'sello') await punto(s, nombre);
      } catch (e) {
        resultado.etapas[nombre] = { ok: false, s: Math.round((Date.now() - t) / 1000), error: e.message };
        s.log(`ETAPA ${nombre} FALLA: ${e.message}`);
        await s.etapa(`fallo_${nombre}`, { ok: false, error: e.message }).catch(() => null);
        codigo = 1;
        break;
      }
    }
  } catch (e) {
    resultado.error = e.message;
    s.log('ERROR: ' + e.message);
    await s.etapa('error', { ok: false, error: e.message }).catch(() => null);
    codigo = 1;
  }
  const f = await s.informe({ resultado, avisos: s.avisos, params: PARAMS, tiradas: TIRADAS });
  clearTimeout(reloj);
  console.log(`FLUJO: ${codigo ? 'INCOMPLETO' : 'COMPLETO'} · última etapa superada: ${resultado.ultima || '-'} · informe: ${f}`);
  if (s.avisos.length) console.log('Avisos:\n - ' + s.avisos.join('\n - '));
  await s.cerrar();
  process.exit(codigo);
}

if (require.main === module) principal().catch((e) => { console.error(e); process.exit(1); });
