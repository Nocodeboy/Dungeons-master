#!/usr/bin/env node
// Prueba de humo (< 2 min): menú → creador → prólogo → Merrowick → primer combate (e1).
// Uso: node qa/humo.cjs [--base=http://localhost:8751/] [--salida=qa/salida/humo] [--semilla=42] [--entero]
//   --entero  espera también al final del combate (puede pasar de 2 min).
// Sale con código 0 si llega al combate sin errores de página; 1 en caso contrario.
'use strict';
const path = require('path');
const { Sesion, argumentos, espera } = require('./lib/mdg.cjs');

const A = argumentos();
const BASE = A.base || process.env.MDG_BASE || 'http://localhost:8751/';
const SALIDA = path.resolve(A.salida || path.join(__dirname, 'salida', 'humo'));
const LIMITE_MS = Number(A.limite || 150000);

async function principal() {
  const s = new Sesion({ base: BASE, salida: SALIDA, nombre: 'humo' });
  const fallos = [];
  const reloj = setTimeout(() => { console.error('HUMO: límite de tiempo superado'); s.informe({ resultado: 'tiempo' }).finally(() => process.exit(1)); }, LIMITE_MS);
  try {
    await s.abrir();
    await s.ir({ depurar: true, turbo: 4, calidad: 'baja', escala: 0.5, autocombate: true, autonivel: true, semilla: A.semilla || 42, 'captura-nitida': true });
    await s.esperar(() => document.querySelector('.mg-menu-btn[data-k="nueva"]'), null, { desc: 'menú principal' });
    await s.etapa('menu');

    await s.pagina.click('.mg-menu-btn[data-k="nueva"]');
    await s.esperar(() => window.__mdg.scenes.name === 'creator' && document.querySelector('.mg-cr-nav button'), null, { desc: 'creador' });
    await s.calma();
    await s.etapa('creador');
    await crearHeroe(s, { nombre: 'Aren Prueba', rapido: true });

    await s.esperar(() => window.__mdg.scenes.name === 'explore' && window.__mdg.scenes.current?.explore?.entered, null, { timeout: 120000, desc: 'llegada a Merrowick' });
    await s.calma();
    await espera(800);
    const obs = await observar(s);
    await s.etapa('merrowick', { observaciones: obs });
    console.log('observaciones:', JSON.stringify(obs));

    // El encuentro e1 salta al acercarse al toro.
    await s.libre({ timeout: 60000 });
    const n0 = await s.pagina.evaluate(() => (window.__qa.combates || []).length);
    await s.mover([21, 18]);
    const inicio = await s.esperar(() => window.__mdg.scenes.current?.explore?.inBattle, null, { timeout: 60000, desc: 'inicio del combate e1' }).then(() => true, () => false);
    if (!inicio) fallos.push('No empieza el combate e1 al acercarse al toro');
    await espera(1500);
    await s.etapa('combate_e1', { ok: inicio });
    if (A.entero && inicio) {
      const c = await s.combate({ timeout: 900000, empezar: 60000, n0 });
      await s.etapa('combate_e1_fin', { ok: !!c?.ganado, combate: c });
    }
    const st = await s.estado();
    const errs = s.consola.filter((c) => c.tipo === 'pageerror').concat(st.errores.map((m) => ({ msg: m })));
    if (errs.length) fallos.push(`${errs.length} errores de página: ${errs.slice(0, 3).map((e) => e.msg).join(' | ')}`);
    const f = await s.informe({ resultado: fallos.length ? 'fallo' : 'ok', fallos });
    console.log(fallos.length ? `HUMO: FALLO\n - ${fallos.join('\n - ')}` : 'HUMO: OK', '\ninforme:', f);
    clearTimeout(reloj);
    await s.cerrar();
    process.exit(fallos.length ? 1 : 0);
  } catch (e) {
    console.error('HUMO: ERROR', e.message);
    await s.etapa('error', { ok: false, error: e.message }).catch(() => null);
    await s.informe({ resultado: 'error', error: e.message }).catch(() => null);
    clearTimeout(reloj);
    await s.cerrar();
    process.exit(1);
  }
}

// Observaciones baratas para comparar publicado/ y la reconstrucción (no hacen fallar la prueba).
async function observar(s) {
  return await s.pagina.evaluate(() => {
    const g = window.__mdg;
    const tip = document.getElementById('mg-tip');
    const candidatas = ['reactions', 'set_manual', 'react', 'retreat_info', 'retreat', 'zone', 'knock'];
    const ops = candidatas.filter((op) => { try { return !/op desconocida/.test(String(g.rules(op, {})?.error || '')); } catch { return false; } });
    const pantallas = ['inventario', 'tienda', 'descanso', 'grupo', 'diario', 'guardar', 'cargar', 'ajustes', 'nivel', 'botin', 'viaje', 'pausa', 'creador', 'creditos', 'ayuda', 'relato', 'derrota', 'saber', 'tutorial', 'mercenarios'].filter((n) => g.ui.has?.(n));
    const ex = g.scenes.current?.explore;
    const e1 = ex?.groups?.get?.('e1');
    return {
      escenas: [...g.scenes.registry.keys()],
      pantallas,
      opsNuevasNucleo: ops,
      tooltipPointerEvents: tip ? getComputedStyle(tip).pointerEvents : null,
      e1: e1 ? e1.enemies.map((x) => x.monster) : null,
      niveles: ['merrowick', 'posada', 'elderhal', 'kesh', 'tumulo'],
    };
  });
}

// Recorre el creador con las opciones por defecto (humano, guerrero, soldado) y un nombre fijo.
// rapido: salta directamente al último paso (la hoja por defecto ya está completa).
async function crearHeroe(s, { nombre, rapido = false, capturas = false } = {}) {
  const p = s.pagina;
  if (rapido) {
    await p.click('.mg-cr-step:last-child');
    await s.esperar(() => /Nombre/i.test(document.querySelector('.mg-cr-step[aria-current]')?.innerText || ''), null, { desc: 'paso Nombre del creador' });
  }
  for (let i = 0; i < 15; i++) {
    const paso = await p.evaluate(() => document.querySelector('.mg-cr-step[aria-current]')?.innerText || '');
    if (/Nombre/i.test(paso)) {
      const input = await p.$('.mg-cr-body input[type="text"]');
      if (input) { await input.fill(nombre); await input.press('Enter'); await espera(200); }
    }
    const boton = await p.$('.mg-cr-nav .mg-btn--primary');
    const texto = (await boton.innerText()).trim();
    if (/Comenzar/i.test(texto)) {
      await s.etapa('creador_final');
      await boton.click();
      return;
    }
    const capt = capturas === true || (Array.isArray(capturas) && capturas.some((c) => paso.includes(c)));
    if (capt) await s.etapa('creador_' + paso.replace(/[\d\s]+/g, ' ').trim().toLowerCase().replace(/\s+/g, '_'));
    await boton.click();
    await espera(250);
  }
  throw new Error('El creador no llega al último paso');
}

module.exports = { crearHeroe, observar };
if (require.main === module) principal();
