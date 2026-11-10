// Verificación de extremo a extremo con Playwright (Chromium + SwiftShader).
// Recorre una partida nueva: menú -> creador -> prólogo -> llegada a Merrowick -> primer combate,
// guarda capturas y falla si hay errores de consola o excepciones.
//
//   node tools/verificar.cjs <url_base> <carpeta_capturas> [--hasta merrowick|combate|turno|victoria]
//   (victoria: añade ?autocombate&autonivel y espera a ganar el combate e1)
//
// <url_base> es la carpeta servida que contiene index.html (p. ej. http://localhost:8741/web/dist/).
// Se usa ?depurar (expone window.__mdg y window.__combate) y ?calidad=baja (menos carga en CPU).
// Math.random va con semilla para que las capturas de dos versiones sean comparables.
// Es CommonJS porque `playwright` está instalado de forma global (NODE_PATH).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [, , base, carpeta, ...resto] = process.argv;
if (!base || !carpeta) {
  console.error('Uso: node tools/verificar.cjs <url_base> <carpeta_capturas> [--hasta merrowick|combate|turno|victoria]');
  process.exit(2);
}
const hasta = resto.includes('--hasta') ? resto[resto.indexOf('--hasta') + 1] : 'combate';
fs.mkdirSync(carpeta, { recursive: true });

// Ruido del controlador gráfico de SwiftShader, no del juego.
const RUIDO = [/GPU stall due to ReadPixels/, /GL Driver Message/, /WebGL-.*Performance/];

(async () => {
  const navegador = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const pagina = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
  pagina.setDefaultTimeout(120000);
  const errores = [];
  const avisos = [];
  const hitos = [];
  const t0 = Date.now();
  const hito = (n, extra = {}) => { const h = { hito: n, s: +((Date.now() - t0) / 1000).toFixed(1), ...extra }; hitos.push(h); console.log(JSON.stringify(h)); };
  pagina.on('console', (m) => {
    const txt = m.text();
    if (RUIDO.some((r) => r.test(txt))) return;
    if (m.type() === 'error') errores.push(txt.slice(0, 500));
    else if (m.type() === 'warning') avisos.push(txt.slice(0, 300));
  });
  pagina.on('pageerror', (e) => errores.push('[excepción] ' + (e.stack || e.message).slice(0, 800)));
  pagina.on('requestfailed', (r) => errores.push('[petición fallida] ' + r.url() + ' ' + (r.failure()?.errorText || '')));
  pagina.on('response', (r) => { if (r.status() >= 400) errores.push(`[HTTP ${r.status()}] ${r.url()}`); });

  await pagina.addInitScript(() => {
    // mulberry32 con semilla fija
    let a = 20261107;
    Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  });

  const captura = async (nombre) => { await pagina.screenshot({ path: path.join(carpeta, nombre + '.png') }); };
  const espera = (ms) => pagina.waitForTimeout(ms);
  const clic = (sel) => pagina.evaluate((s) => {
    const el = [...document.querySelectorAll(s)].find((e) => e.getBoundingClientRect().width > 0);
    if (!el) return false;
    el.click();
    return true;
  }, sel);
  // Pulsa la primera opción de diálogo o el botón de continuar del relato, si hay alguno visible.
  const avanzarTexto = () => pagina.evaluate(() => {
    const vis = (e) => e.getBoundingClientRect().width > 0;
    const el = [...document.querySelectorAll('#ui .mg-dlg-opt')].find(vis)
      || [...document.querySelectorAll('#ui .mg-relato-foot button.mg-btn--primary')].find(vis);
    if (!el) return false;
    el.click();
    return true;
  });
  const estado = () => pagina.evaluate(() => ({
    escena: window.__mdg?.scenes?.name ?? null,
    ocupada: !!window.__mdg?.scenes?.busy,
    combate: !!window.__combate,
  }));
  const terminar = async (ok, motivo) => {
    const resumen = { ok: ok && errores.length === 0, motivo, hitos, errores, avisos: avisos.slice(0, 30), segundos: (Date.now() - t0) / 1000 };
    fs.writeFileSync(path.join(carpeta, 'resumen.json'), JSON.stringify(resumen, null, 1));
    console.log(JSON.stringify({ ok: resumen.ok, motivo, errores: errores.length, avisos: avisos.length }));
    if (errores.length) console.log(errores.slice(0, 10).join('\n'));
    await navegador.close();
    process.exit(resumen.ok ? 0 : 1);
  };

  try {
    // En modo victoria la IA lleva también al héroe (autocombate) y se salta la subida de nivel.
    const extra = hasta === 'victoria' ? '&autocombate&autonivel' : '';
    await pagina.goto(base.replace(/\/?$/, '/') + 'index.html?depurar&calidad=baja' + extra);
    await pagina.waitForSelector('[data-k=nueva]', { state: 'visible', timeout: 180000 });
    await espera(2500);
    hito('menú');
    await captura('01-menu');

    await clic('[data-k=nueva]');
    await pagina.waitForSelector('.mg-cr-step', { state: 'visible', timeout: 180000 });
    await espera(3000);
    hito('creador');
    await captura('02-creador');
    for (let i = 0; i < 12; i++) {
      const listo = await pagina.evaluate(() => !!document.querySelector('[data-k=nombre]'));
      if (listo) break;
      await clic('.mg-cr button.mg-btn--primary, button.mg-btn--primary');
      await espera(1500);
    }
    const heroe = await pagina.evaluate(() => document.querySelector('[data-k=nombre]')?.value);
    hito('creador: último paso', { heroe });
    await captura('03-creador-nombre');

    await clic('button.mg-btn--primary.mg-btn--lg');
    await pagina.waitForSelector('.mg-relato-text', { state: 'visible', timeout: 120000 });
    await espera(2500);
    hito('prólogo');
    await captura('04-prologo');

    let e;
    for (let i = 0; i < 60; i++) {
      e = await estado();
      if (e.escena === 'explore' && !e.ocupada) break;
      await avanzarTexto();
      await espera(2500);
    }
    if (e.escena !== 'explore') return terminar(false, 'no se llega a la exploración: ' + JSON.stringify(e));
    await espera(4000);
    hito('Merrowick', e);
    await captura('05-merrowick');
    if (hasta === 'merrowick') return terminar(true, 'hasta Merrowick');

    // Cerrar la narración y caminar hacia el este (donde aguardan los trasgos del encuentro e1).
    for (let i = 0; i < 10 && (await avanzarTexto()); i++) await espera(2000);
    const destinos = [[20, 15], [22, 15], [24, 15], [22, 16]];
    let k = 0;
    for (let i = 0; i < 40; i++) {
      e = await estado();
      if (e.combate) break;
      if (!(await avanzarTexto()) && i % 4 === 0 && k < destinos.length) {
        const d = destinos[k++];
        await pagina.evaluate((c) => window.__mdg.scenes.current?.explore?.moveTo(c), d);
        hito('caminar', { destino: d });
      }
      await espera(2500);
    }
    if (!e.combate) return terminar(false, 'no empieza el combate e1');
    await espera(8000);
    for (let i = 0; i < 5 && (await avanzarTexto()); i++) await espera(1500);
    const combate = await pagina.evaluate(() => {
      const c = window.__combate;
      return { unidades: c?.units ? (c.units.size ?? c.units.length ?? Object.keys(c.units).length) : null, hud: !!document.querySelector('.mdg-combate') };
    });
    hito('combate e1', combate);
    await captura('06-combate');
    if (hasta === 'combate') return terminar(true, 'hasta el primer combate');

    if (hasta === 'victoria') {
      // La IA juega el combate; se espera a la bandera e1_done y a volver a explorar.
      let fin = null;
      for (let i = 0; i < 240; i++) {
        fin = await pagina.evaluate(() => ({
          e1: !!window.__mdg?.store?.cp?.flags?.e1_done,
          escena: window.__mdg?.scenes?.name,
          ronda: document.querySelector('.mdg-combate')?.textContent?.match(/Ronda\s*(\d+)/)?.[1] ?? null,
        }));
        if (fin.e1) break;
        if (i % 12 === 0) hito('combate en curso', fin);
        await avanzarTexto();
        await espera(5000);
      }
      if (!fin?.e1) return terminar(false, 'el combate e1 no termina en victoria: ' + JSON.stringify(fin));
      hito('victoria en e1', fin);
      for (let i = 0; i < 20 && (await avanzarTexto()); i++) await espera(2000);
      await espera(6000);
      await captura('07-tras-e1');
      return terminar(true, 'combate e1 ganado');
    }
    // Opcional: dejar pasar unos turnos para ver que el combate avanza sin errores.
    await espera(30000);
    await captura('07-combate-tras-espera');
    hito('combate tras 30 s');
    return terminar(true, 'combate en marcha');
  } catch (err) {
    errores.push('[verificador] ' + (err.stack || err.message).slice(0, 800));
    try { await captura('99-fallo'); } catch {}
    return terminar(false, 'excepción del verificador');
  }
})();
