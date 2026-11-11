// Piloto automático de QA para Marca de Granito.
// Se inyecta en la página (Playwright addInitScript) ANTES de que cargue juego.js.
// No toca el juego: solo lee window.__mdg (requiere ?depurar) y pulsa botones del DOM.
//
// Qué hace, cada 120 ms, mientras window.__qa.activo sea true:
//   - pantalla «relato» (prólogo): pulsa el botón principal (Continuar);
//   - cuadro de diálogo (.mg-dlg): elige una opción según window.__qa.politica;
//   - pantalla «botin»: «Cogerlo todo»;
//   - pantalla «nivel» (subida de nivel): avanza los pasos y pulsa «Seguir»;
//   - pantalla «derrota»: cuenta la derrota y, si politica.reintentar, cambia la
//     semilla de combate y pulsa «Cargar la última partida»;
//   - pantallas en politica.cerrar (p. ej. «tienda», «descanso»): las cierra.
// Además registra los eventos del bus, las conversaciones y los errores.
(() => {
  const QA = (window.__qa = window.__qa || {});
  QA.version = 1;
  QA.activo = QA.activo ?? true;
  QA.eventos = [];          // últimos eventos del bus (anillo)
  QA.cuenta = {};           // nº de eventos por nombre
  QA.dialogos = [];         // conversaciones: {id, quien, texto, opciones, elegida}
  QA.errores = [];          // errores de página y console.error
  QA.derrotas = 0;
  QA.combates = [];         // {grupo, inicio, fin, ganado, huido}
  QA.capas = [];            // pantallas abiertas (historial)
  QA.politica = QA.politica || {
    dialogos: {},           // id de diálogo -> [regex de opciones preferidas, en orden]
    general: [],            // regex preferidas en cualquier diálogo
    evitar: [],             // regex que el modo «explorar» no elige nunca
    explorar: true,         // sin regla: primera opción aún no elegida en esta conversación
    reintentar: true,       // en derrota: cargar el autoguardado con otra semilla
    descanso: 'largo',      // en la pantalla «descanso»: 'largo' | 'cerrar' («Seguir» se pulsa siempre)
    cerrar: ['tienda', 'inventario', 'grupo', 'diario', 'ayuda', 'ajustes', 'creditos', 'cargar', 'guardar', 'viaje', 'pausa'],
    semillas: [7, 11, 23, 42, 97, 131, 257, 409, 613, 997],
    turboCombate: 12,       // velocidad de las esperas/animaciones de combate (?turbo pone 5); null = no tocar
  };
  const RUIDO = new Set(['step', 'ui:click', 'ui:hover', 'footstep', 'portrait']);
  const MAXEV = 3000;
  let ultimo = 0;
  let semillaI = 0;

  const ahora = () => Math.round(performance.now());
  const corta = (s, n = 160) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, n);
  function resumen(d) {
    if (d == null || typeof d !== 'object') return d;
    const o = {};
    for (const [k, v] of Object.entries(d)) {
      if (k === 'cp' || k === 'state' || k === 'at') continue;
      if (v == null || ['string', 'number', 'boolean'].includes(typeof v)) o[k] = typeof v === 'string' ? corta(v, 120) : v;
      else if (Array.isArray(v) && v.length < 12 && v.every((x) => typeof x !== 'object')) o[k] = v;
      else if (k === 'object' && v && typeof v === 'object') o[k] = v.id || v.group || '?';
    }
    return o;
  }

  addEventListener('error', (e) => QA.errores.push({ t: ahora(), tipo: 'error', msg: corta(e.message, 300) }));
  addEventListener('unhandledrejection', (e) => QA.errores.push({ t: ahora(), tipo: 'promesa', msg: corta(e.reason?.message || e.reason, 300) }));

  function enganchar() {
    const g = window.__mdg;
    if (!g || !g.bus || QA._enganchado) return;
    QA._enganchado = true;
    g.bus.on('*', ({ name, data }) => {
      QA.cuenta[name] = (QA.cuenta[name] || 0) + 1;
      if (RUIDO.has(name)) return;
      QA.eventos.push({ t: ahora(), n: name, d: resumen(data) });
      if (QA.eventos.length > MAXEV) QA.eventos.splice(0, QA.eventos.length - MAXEV);
    });
    g.bus.on('dialog:open', ({ id }) => { QA.dlgId = id; QA.elegidas = new Set(); });
    g.bus.on('dialog:close', () => { QA.dlgId = null; });
    g.bus.on('battle:start', (d) => QA.combates.push({ grupo: d?.group, grupos: d?.groups, nivel: d?.level, inicio: ahora(), semilla: g.params?.get?.('semilla') || null }));
    g.bus.on('battle:end', (d) => {
      const c = QA.combates[QA.combates.length - 1];
      if (c && !c.fin) Object.assign(c, { fin: ahora(), ganado: !!d?.won, huido: !!d?.fled, rondas: d?.rounds ?? null });
    });
    g.bus.on('ui:open', ({ name }) => QA.capas.push({ t: ahora(), abre: name }));
  }

  // Ojo: offsetParent es null en elementos position:fixed, así que se mira el tamaño y el estilo.
  const visible = (el) => {
    if (!el || el.hidden || el.classList.contains('fuera')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  const capa = (n) => document.querySelector(`.mg-layer[data-capa="${n}"]:not(.cierra)`);
  const textoBoton = (b) => corta(b.innerText, 120);
  const clic = (b) => { ultimo = ahora(); b.click(); };

  function elegir(ops, id, quien) {
    const pol = QA.politica;
    const usables = ops.filter((o) => !o.off);
    if (!usables.length) return null;
    const reglas = [...(pol.dialogos?.[id] || []), ...(pol.dialogos?.['*'] || []), ...(pol.general || [])];
    for (const r of reglas) {
      const re = new RegExp(r, 'i');
      const o = usables.find((o) => (re.test(o.t) || re.test(o.completo)) && !QA.elegidas.has(o.t));
      if (o) return { o, por: 'regla ' + r };
    }
    if (usables.length === 1) return { o: usables[0], por: 'única' };
    if (pol.explorar !== false) {
      const ev = (pol.evitar || []).map((r) => new RegExp(r, 'i'));
      const o = usables.find((o) => !QA.elegidas.has(o.t) && !ev.some((re) => re.test(o.t) || re.test(o.completo)));
      if (o) return { o, por: 'explorar' };
    }
    return { o: usables[usables.length - 1], por: 'última' };
  }

  function dialogo() {
    const dlg = document.querySelector('section.mg-dlg');
    if (!visible(dlg)) return false;
    if (dlg.querySelector('.mg-dlg-line.escribiendo')) return true;
    const botones = [...dlg.querySelectorAll('button.mg-dlg-opt')];
    if (!botones.length) return true;
    // Texto de la opción sin la etiqueta «[Persuasión CD 13]», «[40 po]»…, que va delante en .mg-dlg-tag.
    const ops = botones.map((b, i) => {
      const tEl = b.querySelector('.mg-dlg-t');
      const etiqueta = corta(tEl?.querySelector('.mg-dlg-tag')?.innerText || '', 80);
      const completo = corta(tEl?.innerText || b.innerText, 220);
      const t = etiqueta && completo.startsWith(etiqueta) ? completo.slice(etiqueta.length).trim() : completo;
      return { i, b, t, etiqueta, completo, off: b.disabled };
    });
    const quien = corta(dlg.querySelector('.mg-dlg-name')?.textContent, 60);
    const id = QA.dlgId || (quien ? 'elegir:' + quien : 'narracion');
    QA.elegidas ??= new Set();
    const r = elegir(ops, id, quien);
    if (!r) return true;
    const lineas = dlg.querySelectorAll('.mg-dlg-line.actual');
    QA.dialogos.push({
      t: ahora(), id, quien,
      texto: corta(lineas[lineas.length - 1]?.innerText, 240),
      opciones: ops.map((o) => (o.off ? '(x) ' : '') + o.completo),
      elegida: r.o.completo, por: r.por,
    });
    if (QA.dialogos.length > 1500) QA.dialogos.splice(0, 300);
    QA.elegidas.add(r.o.t);
    clic(r.o.b);
    return true;
  }

  function relato() {
    const c = capa('relato');
    if (!c) return false;
    const b = c.querySelector('.mg-relato-foot-r .mg-btn--primary') || c.querySelector('button.mg-btn--primary');
    if (b && !b.disabled) clic(b);
    return true;
  }

  function botin() {
    const c = capa('botin');
    if (!c) return false;
    const b = [...c.querySelectorAll('button')].find((b) => /Cogerlo todo/i.test(b.innerText) && !b.disabled)
      || [...c.querySelectorAll('button')].find((b) => /Dejarlo|Cerrar/i.test(b.innerText));
    if (b) clic(b);
    return true;
  }

  function nivel() {
    const c = capa('nivel');
    if (!c) return false;
    const seguir = [...c.querySelectorAll('button')].find((b) => /^Seguir$/i.test(textoBoton(b)) && !b.disabled);
    if (seguir) { clic(seguir); return true; }
    const nav = c.querySelector('.mg-cr-nav');
    if (!nav) return true;
    const prim = nav.querySelector('.mg-btn--primary');
    if (prim && !prim.disabled) { clic(prim); return true; }
    // Falta algo en algún paso: ir al primer paso marcado y elegir lo primero que haya libre.
    const falta = c.querySelector('.mg-cr-step.falta:not([aria-current])');
    if (falta) { clic(falta); return true; }
    const libre = c.querySelector('.mg-cr-body .mg-card[aria-pressed="false"]:not(:disabled), .mg-cr-body .mg-chip[aria-pressed="false"]:not(:disabled)');
    if (libre) clic(libre);
    return true;
  }

  function derrota() {
    const c = capa('derrota');
    if (!c) return false;
    if (c.dataset.qa) return true;
    c.dataset.qa = '1';
    QA.derrotas++;
    QA.eventos.push({ t: ahora(), n: 'qa:derrota', d: { n: QA.derrotas } });
    const pol = QA.politica;
    if (!pol.reintentar || QA.derrotas > (pol.maxDerrotas ?? 8)) return true;
    const s = pol.semillas?.[semillaI++ % (pol.semillas.length || 1)];
    if (s != null) window.__mdg?.params?.set?.('semilla', String(s + QA.derrotas * 1000));
    setTimeout(() => {
      const b = [...c.querySelectorAll('button')].find((b) => /Cargar la última/i.test(b.innerText));
      if (b && !b.disabled) clic(b);
    }, 600);
    return true;
  }

  function descanso() {
    const c = capa('descanso');
    if (!c) return false;
    const bs = [...c.querySelectorAll('button')];
    const seguir = bs.find((b) => /^Seguir$/i.test(textoBoton(b)) && !b.disabled);
    if (seguir) { clic(seguir); return true; }
    if (QA.politica.descanso === 'largo') {
      const largo = c.querySelector('button.mg-rest-card.largo:not(:disabled)');
      if (largo) { clic(largo); return true; }
    }
    const top = window.__mdg?.ui?.layers?.top;
    if (top?.name === 'descanso' && ahora() - ultimo > 1500) { top.close(null); ultimo = ahora(); }
    return true;
  }

  function cerrar() {
    for (const n of QA.politica.cerrar || []) {
      const c = capa(n);
      if (!c) continue;
      const top = window.__mdg?.ui?.layers?.top;
      if (top && top.name === n) { top.close(null); ultimo = ahora(); return true; }
    }
    return false;
  }

  function confirmar() {
    const c = capa('confirmar');
    if (!c || !QA.politica.confirmar) return false;
    const re = new RegExp(QA.politica.confirmar, 'i');
    const b = [...c.querySelectorAll('button')].find((b) => re.test(b.innerText));
    if (b) clic(b);
    return true;
  }

  function aviso() {
    const c = capa('aviso');
    if (!c) return false;
    const b = c.querySelector('button.mg-btn--primary');
    if (b) {
      QA.eventos.push({ t: ahora(), n: 'qa:aviso', d: { texto: corta(c.innerText, 200) } });
      clic(b);
    }
    return true;
  }

  // QA.pararEn = {capa: 'relato'} | {dialogo: 'regex sobre id o quien habla'}:
  // el piloto se detiene (activo = false, parado = true) en cuanto aparece, para hacer una captura.
  function parar() {
    const p = QA.pararEn;
    if (!p) return false;
    let si = false;
    if (p.capa) si = !!capa(p.capa);
    if (!si && p.dialogo) {
      const dlg = document.querySelector('section.mg-dlg');
      if (visible(dlg) && dlg.querySelector('button.mg-dlg-opt') && !dlg.querySelector('.mg-dlg-line.escribiendo')) {
        const quien = dlg.querySelector('.mg-dlg-name')?.textContent || '';
        si = new RegExp(p.dialogo, 'i').test(`${QA.dlgId || ''}|${quien}`);
      }
    }
    if (si) { QA.activo = false; QA.parado = true; QA.pararEn = null; }
    return si;
  }

  // Acelera el combate en curso con los ganchos del propio juego (solo tiempos, no reglas).
  function acelerar() {
    const c = window.__combate?.ctl;
    const t = QA.politica.turboCombate;
    if (!c || c.disposed || !t) return;
    if (c.turbo !== t) c.turbo = t;
    if (!c.fast && typeof c.setFast === 'function') c.setFast(true);
  }

  function paso() {
    try {
      enganchar();
      acelerar();
      if (!QA.activo) return;
      if (parar()) return;
      if (ahora() - ultimo < (QA.pausa ?? 180)) return;
      derrota() || relato() || nivel() || botin() || aviso() || confirmar() || descanso() || dialogo() || cerrar();
    } catch (e) {
      QA.errores.push({ t: ahora(), tipo: 'piloto', msg: corta(e.message, 300) });
    }
  }
  setInterval(paso, 120);
})();
