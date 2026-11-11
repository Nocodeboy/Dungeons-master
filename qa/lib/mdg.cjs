// Ayudantes de QA para Marca de Granito (Node + Playwright).
// Funcionan contra cualquier copia del juego que respete los ganchos de qa/GANCHOS.md:
// la versión publicada (publicado/) y la reconstrucción (web/dist/).
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ARGS_GL = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'];
const PILOTO = fs.readFileSync(path.join(__dirname, 'piloto.js'), 'utf8');
// Ajustes que hacen la partida automatizable: texto instantáneo, narrador sin IA, sin consejos.
const AJUSTES_QA = { textSpeed: 100, narratorAI: false, tips: false, music: 0, sfx: 0, ambience: 0, confirmEndTurn: false };

function argumentos(argv = process.argv.slice(2)) {
  const o = { _: [] };
  for (const a of argv) {
    const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
    if (m) o[m[1]] = m[2] ?? true; else o._.push(a);
  }
  return o;
}

function urlJuego(base, params = {}) {
  const u = new URL(base.endsWith('/') || base.endsWith('.html') ? base : base + '/');
  if (!u.pathname.endsWith('.html')) u.pathname += 'index.html';
  for (const [k, v] of Object.entries(params)) {
    if (v === false || v == null) continue;
    u.searchParams.set(k, v === true ? '' : String(v));
  }
  // URLSearchParams escribe «depurar=»; el juego solo mira has(), así que da igual.
  return u.toString();
}

const espera = (ms) => new Promise((r) => setTimeout(r, ms));

class Sesion {
  constructor({ base, salida, nombre = 'prueba', ancho = 1280, alto = 720, ajustes = {}, conTips = false } = {}) {
    this.base = base;
    this.salida = salida;
    this.nombre = nombre;
    this.ancho = ancho;
    this.alto = alto;
    this.ajustes = { ...AJUSTES_QA, ...(conTips ? { tips: true } : {}), ...ajustes };
    this.consola = [];
    this.etapas = [];
    this.nCaptura = 0;
    this.t0 = Date.now();
    fs.mkdirSync(salida, { recursive: true });
    for (const f of fs.readdirSync(salida)) if (/^\d+_.*\.png$|^informe\.json$/.test(f)) fs.rmSync(path.join(salida, f));
  }

  async abrir() {
    this.navegador = await chromium.launch({ args: ARGS_GL });
    this.contexto = await this.navegador.newContext({ viewport: { width: this.ancho, height: this.alto } });
    const ajustes = this.ajustes;
    await this.contexto.addInitScript((a) => {
      try {
        if (!sessionStorage.getItem('qa.iniciado')) {
          localStorage.setItem('mdg.settings', JSON.stringify(a));
          sessionStorage.setItem('qa.iniciado', '1');
        }
      } catch {}
    }, ajustes);
    await this.contexto.addInitScript({ content: PILOTO });
    this.pagina = await this.contexto.newPage();
    this.pagina.on('console', (m) => {
      const t = m.text();
      if (/GL Driver Message|KHR_parallel_shader_compile|GPU stall/.test(t)) return;
      // Errores, avisos y los «info» que delatan algo raro (operaciones simuladas, bajada de calidad).
      if (m.type() === 'error' || m.type() === 'warning' || /simulador|calidad \d|\[exploración\] tiempos/.test(t)) this.consola.push({ t: Date.now() - this.t0, tipo: m.type(), msg: t.slice(0, 400) });
    });
    this.pagina.on('pageerror', (e) => this.consola.push({ t: Date.now() - this.t0, tipo: 'pageerror', msg: String(e.message).slice(0, 400) }));
    return this;
  }

  log(...a) {
    const s = `[${((Date.now() - this.t0) / 1000).toFixed(1).padStart(6)} s] ${a.join(' ')}`;
    console.log(s);
  }

  async ir(params) {
    const url = urlJuego(this.base, params);
    this.log('abrir', url);
    await this.pagina.goto(url);
    await this.esperar(() => window.__mdg && window.__mdg.ready, null, { timeout: 180000, desc: 'arranque (__mdg.ready)' });
    await this.calma({ timeout: 120000 });
  }

  async esperar(fn, arg = null, { timeout = 60000, desc = 'condición', intervalo = 250 } = {}) {
    try {
      return await this.pagina.waitForFunction(fn, arg, { timeout, polling: intervalo });
    } catch (e) {
      const st = await this.estado().catch(() => ({}));
      const err = new Error(`Tiempo agotado esperando ${desc} (${timeout} ms). Escena=${st.escena} nivel=${st.nivel} capas=${(st.capas || []).join(',')} dialogo=${st.dialogo?.quien || '-'}`);
      err.estado = st;
      throw err;
    }
  }

  // Espera a que no haya transición de escena ni pantalla de carga.
  async calma({ timeout = 60000 } = {}) {
    await this.esperar(() => {
      const g = window.__mdg;
      const c = document.getElementById('carga');
      const cargando = c && !c.hidden && !c.classList.contains('fuera') && getComputedStyle(c).display !== 'none' && getComputedStyle(c).opacity !== '0';
      return g && g.ready && !g.scenes.busy && !cargando;
    }, null, { timeout, desc: 'fin de la carga' });
  }

  // Espera a que la exploración esté libre: sin combate, sin diálogo, sin pantallas, sin «busy».
  async libre({ timeout = 120000, desc = 'exploración libre' } = {}) {
    await this.esperar(() => {
      const g = window.__mdg;
      if (!g || g.scenes.busy || g.scenes.name !== 'explore') return false;
      const ex = g.scenes.current?.explore;
      if (!ex || ex.inBattle || ex.isBusy() || !ex.entered) return false;
      if (g.ui.layers.stack.length) return false;
      if (g.ui.dialogOpen?.()) return false;
      if (g.story?.active || g.story?._inFlow) return false;
      return true;
    }, null, { timeout, desc });
    await espera(400);
    // Puede haberse abierto algo justo después (narración diferida): segunda comprobación.
    await this.esperar(() => {
      const g = window.__mdg;
      const ex = g.scenes.current?.explore;
      return g.scenes.name === 'explore' && ex && !ex.inBattle && !ex.isBusy() && !g.ui.layers.stack.length && !g.ui.dialogOpen?.() && !g.story?.active;
    }, null, { timeout, desc });
  }

  async politica(p) {
    await this.pagina.evaluate((p) => {
      const q = window.__qa;
      q.politica = { ...q.politica, ...p, dialogos: { ...(q.politica.dialogos || {}), ...(p.dialogos || {}) } };
    }, p);
  }

  async estado() {
    return await this.pagina.evaluate(() => {
      const g = window.__mdg;
      const q = window.__qa || {};
      if (!g) return { escena: null };
      const cp = g.store?.cp;
      const ex = g.scenes.current?.explore;
      const dlg = document.querySelector('section.mg-dlg');
      const dlgVisible = dlg && !dlg.hidden && !dlg.classList.contains('fuera');
      const inv = {};
      let resumen = [];
      try { const r = cp && g.rules('party_summary', { cp }); resumen = Array.isArray(r) ? r : r?.party || r?.members || []; } catch {}
      const miembros = (cp?.party || []).map((id) => {
        const m = cp.members?.[id] || {};
        const s = cp.state?.[id] || {};
        const rs = resumen.find?.((x) => x.id === id) || {};
        for (const [k, n] of Object.entries(m.items || {})) inv[k] = (inv[k] || 0) + Number(n || 0);
        for (const p of m.pack || []) if (p?.id) inv[p.id] = (inv[p.id] || 0) + 1;
        return { id, nombre: m.name, clase: m.class, pv: rs.hp ?? s.hp ?? null, pvMax: rs.max_hp ?? s.max_hp ?? m.max_hp ?? null, muerto: !!(rs.dead ?? s.dead) };
      });
      let misiones = [];
      try { misiones = g.story.quests().map((x) => ({ id: x.id, nombre: x.name, estado: x.state, pasos: x.steps.filter((s) => s.done).map((s) => s.id) })); } catch {}
      return {
        escena: g.scenes.name,
        nivel: ex?.levelId || cp?.location?.level || null,
        celda: ex?.lead?.()?.cell || cp?.location?.cell || null,
        enCombate: !!ex?.inBattle,
        nivelGrupo: cp?.party_level ?? null,
        dia: cp?.day ?? null,
        hora: cp?.hour ?? null,
        oro: cp?.gold ?? null,
        grupo: miembros,
        inventario: inv,
        misiones,
        banderas: cp ? Object.keys(cp.flags || {}).filter((k) => cp.flags[k]).sort() : [],
        diario: (cp?.journal || []).length,
        capas: g.ui.layers.stack.map((s) => s.name),
        dialogo: dlgVisible ? { quien: dlg.querySelector('.mg-dlg-name')?.textContent || '', id: q.dlgId || null } : null,
        errores: [...(g.errors || [])],
        erroresQA: (q.errores || []).slice(-20),
        derrotas: q.derrotas || 0,
        combates: q.combates || [],
        calidad: g.quality?.level,
      };
    });
  }

  async captura(nombre) {
    this.nCaptura++;
    const f = path.join(this.salida, `${String(this.nCaptura).padStart(2, '0')}_${nombre}.png`);
    await this.pagina.screenshot({ path: f });
    return f;
  }

  // Registra una etapa: captura + estado observable.
  async etapa(nombre, extra = {}) {
    const archivo = await this.captura(nombre).catch((e) => `(sin captura: ${e.message})`);
    const st = await this.estado().catch((e) => ({ error: e.message }));
    const e = { etapa: nombre, ok: extra.ok ?? true, t: +((Date.now() - this.t0) / 1000).toFixed(1), captura: path.basename(String(archivo)), ...extra, estado: st };
    this.etapas.push(e);
    this.log(`ETAPA ${nombre}: escena=${st.escena} nivel=${st.nivel} grupoN=${st.nivelGrupo} oro=${st.oro} PV=${(st.grupo || []).map((m) => `${m.id}:${m.pv}/${m.pvMax}`).join(' ')}`);
    // Informe parcial tras cada etapa: si el proceso se corta, no se pierde lo recorrido.
    await this.informe({ parcial: true, ...(this.extraInforme?.() || {}) }).catch(() => null);
    return e;
  }

  // Prepara al piloto para detenerse cuando aparezca algo; devuelve una función que espera,
  // hace la etapa (captura + estado) y reanuda. Si no aparece a tiempo, reanuda igualmente.
  async capturarAl(cond, nombre, { timeout = 60000, demora = 400 } = {}) {
    await this.pagina.evaluate((c) => { window.__qa.parado = false; window.__qa.pararEn = c; }, cond);
    return async () => {
      let ok = true;
      try {
        await this.esperar(() => window.__qa.parado, null, { timeout, desc: `parada del piloto (${nombre})` });
        await espera(demora);
        await this.etapa(nombre);
      } catch (e) {
        ok = false;
        this.log(`(sin captura ${nombre}: ${e.message.slice(0, 120)})`);
      } finally {
        await this.pagina.evaluate(() => { window.__qa.pararEn = null; window.__qa.parado = false; window.__qa.activo = true; });
      }
      return ok;
    };
  }

  async informe(extra = {}) {
    const q = await this.pagina.evaluate(() => ({
      eventos: (window.__qa?.eventos || []).slice(-600),
      cuenta: window.__qa?.cuenta,
      dialogos: window.__qa?.dialogos || [],
      combates: window.__qa?.combates || [],
      errores: window.__qa?.errores || [],
      derrotas: window.__qa?.derrotas || 0,
    })).catch(() => ({}));
    const inf = {
      base: this.base,
      nombre: this.nombre,
      fecha: new Date().toISOString(),
      duracion_s: +((Date.now() - this.t0) / 1000).toFixed(1),
      ...extra,
      etapas: this.etapas,
      consola: this.consola,
      piloto: q,
    };
    const f = path.join(this.salida, 'informe.json');
    fs.writeFileSync(f, JSON.stringify(inf, null, 1));
    return f;
  }

  async cerrar() {
    await this.navegador?.close().catch(() => null);
  }

  // ───────── exploración ─────────

  // Mueve al grupo a una casilla (o la libre más cercana) y espera a que llegue.
  async mover(celda, { timeout = 90000, tolerancia = 1 } = {}) {
    const r = await this.pagina.evaluate(async ([c]) => {
      const ex = window.__mdg.scenes.current.explore;
      let dest = c;
      if (!ex.xmap.walkable(c) || ex.blocked().has(c.join(','))) dest = ex.xmap.freeNear(c, 1, ex.blocked(), { maxR: 4 })[0] || c;
      const ok = await window.__mdg.explore.moveParty(dest);
      return { ok, dest, cell: ex.lead()?.cell };
    }, [celda]);
    if (!r.ok) {
      // moveParty devuelve false si se cancela (combate, trampa, diálogo): no es un error en sí.
      await espera(300);
    }
    return r;
  }

  // Camina hacia una casilla en tramos, dejando que el juego dispare disparadores/combates.
  async caminar(celda, { timeout = 180000 } = {}) {
    const t0 = Date.now();
    for (let i = 0; i < 12 && Date.now() - t0 < timeout; i++) {
      await this.libre({ timeout: timeout - (Date.now() - t0), desc: `exploración libre (caminar a ${celda})` });
      const st = await this.pagina.evaluate(() => window.__mdg.scenes.current.explore.lead()?.cell);
      if (st && Math.abs(st[0] - celda[0]) + Math.abs(st[1] - celda[1]) <= 1) return true;
      await this.mover(celda);
    }
    return false;
  }

  // Posición en pantalla de un PNJ, objeto, miembro o enemigo.
  async enPantalla(tipo, id) {
    return await this.pagina.evaluate(([tipo, id]) => {
      const g = window.__mdg;
      const ex = g.scenes.current.explore;
      let pos = null;
      if (tipo === 'npc') { const n = ex.npcs.get(id); if (n) { pos = n.actor.root.position.clone(); pos.y += (n.actor.height || 1.7) * 0.5; } }
      else if (tipo === 'object') {
        const o = ex.objects.get(id);
        if (o) { const a = ex.anchorOf(id); pos = a ? a.getWorldPosition(a.position.clone()) : ex.world.cellToWorld(o.cell, ex.v.clone()); pos.y += o.type === 'sign' || o.type === 'board' ? 1 : 0.4; }
      } else if (tipo === 'enemy') { const e = ex.enemy(id); if (e?.actor) { pos = e.actor.root.position.clone(); pos.y += 0.8; } }
      if (!pos) return null;
      pos.project(g.stage.camera);
      const x = (pos.x * 0.5 + 0.5) * innerWidth, y = (-pos.y * 0.5 + 0.5) * innerHeight;
      const dentro = pos.z < 1 && x > 4 && y > 4 && x < innerWidth - 4 && y < innerHeight - 4;
      const el = dentro ? document.elementFromPoint(x, y) : null;
      const pick = dentro ? ex.pick(x, y) : null;
      return { x, y, dentro, lienzo: el === g.stage.renderer.domElement, pick: pick ? { kind: pick.kind, id: pick.id } : null };
    }, [tipo, id]);
  }

  // Interactúa con un PNJ u objeto como lo haría el jugador: clic sobre él en el lienzo.
  // Si no está a la vista o algo lo tapa, acerca al grupo y vuelve a intentarlo;
  // como último recurso usa ex.onTap con las coordenadas proyectadas (mismo camino de código).
  async tocar(tipo, id, { celda = null } = {}) {
    await this.libre({ desc: `exploración libre (antes de tocar ${id})` });
    for (let intento = 0; intento < 3; intento++) {
      const p = await this.enPantalla(tipo, id);
      if (!p) throw new Error(`No existe ${tipo} «${id}» en el nivel`);
      const acierta = p.dentro && p.pick && p.pick.id === id;
      if (acierta && p.lienzo) {
        await this.pagina.mouse.click(p.x, p.y);
        return 'clic';
      }
      if (acierta && intento === 2) {
        await this.pagina.evaluate(([x, y]) => window.__mdg.scenes.current.explore.onTap(x, y), [p.x, p.y]);
        return 'onTap';
      }
      // Acercarse.
      const destino = celda || (await this.pagina.evaluate(([tipo, id]) => {
        const ex = window.__mdg.scenes.current.explore;
        return tipo === 'npc' ? ex.npcs.get(id)?.cell : tipo === 'object' ? ex.objects.get(id)?.cell : ex.enemy(id)?.cell;
      }, [tipo, id]));
      if (destino) await this.mover(destino);
      await espera(500);
      await this.libre({ desc: `exploración libre (acercarse a ${id})` });
    }
    // Último recurso: proyectar y llamar a onTap aunque pick no coincida.
    const p = await this.enPantalla(tipo, id);
    await this.pagina.evaluate(([x, y]) => window.__mdg.scenes.current.explore.onTap(x, y), [p.x, p.y]);
    return 'onTap-forzado';
  }

  async hablar(npc, opts) { return this.tocar('npc', npc, opts); }
  async usar(obj, opts) { return this.tocar('object', obj, opts); }

  // Espera a que empiece un combate (el nº n0+1 registrado por el piloto; n0 = nº de combates
  // antes de provocarlo, por defecto el actual) y a que termine (battle:end o pantalla de derrota).
  async combate({ timeout = 900000, empezar = 60000, n0 = null } = {}) {
    if (n0 == null) n0 = await this.pagina.evaluate(() => (window.__qa.combates || []).length);
    try {
      await this.esperar((n0) => (window.__qa.combates || []).length > n0, n0, { timeout: empezar, desc: 'inicio de combate' });
    } catch { return null; }
    const t0 = Date.now();
    await this.esperar((n0) => {
      const c = (window.__qa.combates || [])[n0];
      return !!(c && c.fin) || !!document.querySelector('.mg-layer[data-capa="derrota"]');
    }, n0, { timeout, desc: 'fin de combate', intervalo: 1000 });
    const c = await this.pagina.evaluate((n0) => (window.__qa.combates || [])[n0], n0);
    this.log(`combate ${c?.grupo}: ${c?.ganado ? 'GANADO' : c?.huido ? 'huida' : 'perdido/sin fin'} en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    return c;
  }

  async bandera(nombre) {
    return await this.pagina.evaluate((n) => window.__mdg.store.cp?.flags?.[n], nombre);
  }

  async esperarBandera(nombre, { timeout = 120000 } = {}) {
    await this.esperar((n) => !!window.__mdg.store.cp?.flags?.[n], nombre, { timeout, desc: `bandera ${nombre}` });
  }
}

module.exports = { Sesion, urlJuego, argumentos, espera, AJUSTES_QA };
