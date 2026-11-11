// Paso 5: parte el código del juego en los módulos originales de web/src/.
//
// Entrada: tools/salida/03-juego-con-imports.js (bundle sin three, con imports reales de three).
// Salida:  web/src/**/*.js (+ los .json y .css del paso 4) y tools/salida/05-informe.json.
//
// Cómo funciona (ver web/MAPA.md):
//  - Cada módulo envuelto en __esm es un fichero: sus funciones elevadas, sus variables elevadas y
//    el cuerpo de su init. Las llamadas init_x() del principio del cierre son sus imports, en orden.
//  - Las asignaciones del cierre a sus variables elevadas vuelven a ser declaraciones const/let.
//  - Imports y exports salen de las referencias entre declaraciones de nivel superior (ámbitos de
//    babel). Si el módulo tenía espacio de nombres (__export), sus exports son exactamente esos.
//  - Promise.resolve().then(() => (init_x(), ns_x)) vuelve a ser import('./x.js'); los __glob
//    vuelven a ser import() con plantilla.
//  - Se aplican los renombres evidentes: nombres exportados de los espacios de nombres y la tabla
//    de tools/renombres-juego.mjs.
//
// Uso: node tools/05-partir-modulos.mjs [--forzar]   (sobrescribe web/src/ entero)
import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import { leer, analizar, recorrer } from './lib/ast.mjs';
import { enlacesDelPrograma } from './lib/ambitos.mjs';
import { segmentar, describir } from './lib/modulos.mjs';
import { nombresEnUso, deconflictar } from './lib/renombrar.mjs';
import { extraerDatos } from './04-extraer-datos.mjs';
import { MODULOS, COLA } from './nombres-modulos.mjs';
import { RENOMBRES } from './renombres-juego.mjs';

const RAIZ = new URL('..', import.meta.url).pathname;
const S = RAIZ + 'tools/salida/';
const SRC = RAIZ + 'src/';
const forzar = process.argv.includes('--forzar');
if (fs.existsSync(SRC + 'main.js') && !forzar) {
  console.error('web/src/main.js ya existe. Este paso regenera web/src/ entero: usa --forzar si es lo que quieres.');
  process.exit(1);
}

const cod = leer(S + '03-juego-con-imports.js');
const ast = analizar(cod);
const { imports: importsNpm, modulos: envueltos, cola } = segmentar(ast);
const avisos = [];
const fallo = (m) => { throw new Error(m); };

// ---------------------------------------------------------------- módulos
const mods = []; // {id, ruta, tipo, envuelto, sentencias, cuerpo, info}
const porInit = new Map();
const initsSet = new Set(envueltos.map((m) => m.init));
for (const m of envueltos) {
  const conf = MODULOS[m.init] ?? fallo('Módulo sin nombre en nombres-modulos.mjs: ' + m.init);
  const c = typeof conf === 'string' ? { ruta: conf, tipo: 'js' } : conf;
  const mod = { id: m.init, ruta: c.ruta || null, tipo: c.tipo || 'js', conf: c, envuelto: true, sentencias: m.sentencias, cuerpo: m.cuerpo || [], m };
  mod.info = describir(m, initsSet);
  if (mod.info.resto.length) fallo(`Sentencias inesperadas fuera del cierre en ${m.init}`);
  mods.push(mod);
  porInit.set(m.init, mod);
}
const esLlamadaInit = (s) => s.type === 'ExpressionStatement' && s.expression.type === 'CallExpression' && s.expression.arguments.length === 0 && s.expression.callee.type === 'Identifier' && initsSet.has(s.expression.callee.name);
const declaraNombre = (s, n) => (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') ? s.id?.name === n : s.type === 'VariableDeclaration' && s.declarations.some((d) => d.id.name === n);
const inicios = COLA.map(([, marca], k) => {
  if (k === 0) return 0;
  let i = cola.findIndex((s) => declaraNombre(s, marca));
  if (i < 0) fallo('No encuentro la marca de la cola: ' + marca);
  while (i > 0 && esLlamadaInit(cola[i - 1])) i--;
  return i;
});
const colaMods = [];
COLA.forEach(([ruta], k) => {
  const sentencias = cola.slice(inicios[k], k + 1 < COLA.length ? inicios[k + 1] : cola.length);
  const deps = sentencias.filter(esLlamadaInit).map((s) => s.expression.callee.name);
  const mod = { id: ruta, ruta, tipo: 'js', envuelto: false, sentencias, cuerpo: [], info: { ns: null, exportsNs: [], deps, vars: [] } };
  mods.push(mod);
  colaMods.push(mod);
});

// Rangos de sentencias -> módulo (búsqueda binaria).
const rangos = [];
for (const mod of mods) for (const s of mod.sentencias) rangos.push([s.start, s.end, mod]);
rangos.sort((a, b) => a[0] - b[0]);
function moduloDe(pos) {
  let lo = 0, hi = rangos.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const [a, b, m] = rangos[mid];
    if (pos < a) hi = mid - 1; else if (pos >= b) lo = mid + 1; else return m;
  }
  return null; // ayudantes de esbuild o imports de three
}

// Código que se conserva de cada módulo: funciones, cuerpo del cierre (sin init) o sentencias de la cola.
for (const mod of mods) {
  mod.conservado = [];
  if (mod.tipo !== 'js') continue;
  if (mod.envuelto) {
    for (const s of mod.sentencias) if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') mod.conservado.push(s);
    for (const s of mod.cuerpo) if (!esLlamadaInit(s)) mod.conservado.push(s);
  } else {
    for (const s of mod.sentencias) if (!esLlamadaInit(s)) mod.conservado.push(s);
  }
}
const dentroDe = (lista, pos) => lista.some((n) => pos >= n.start && pos < n.end);

// ---------------------------------------------------------------- enlaces y patrones especiales
const { enlaces } = enlacesDelPrograma(ast);
const declarante = new Map(); // nombre -> módulo | 'npm' | 'ayudante'
const npm = new Map(); // nombre local -> {fuente, importado}
for (const d of importsNpm) for (const sp of d.specifiers) npm.set(sp.local.name, { fuente: d.source.value, importado: sp.imported?.name ?? 'default' });
for (const [nombre, e] of enlaces) {
  if (npm.has(nombre)) { declarante.set(nombre, 'npm'); continue; }
  const m = moduloDe(e.binding.identifier.start);
  declarante.set(nombre, m || 'ayudante');
}
const nsDe = new Map(); // nombre del espacio de nombres -> módulo
for (const mod of mods) if (mod.info.ns) nsDe.set(mod.info.ns, mod);
const globDe = new Map(); // variable del glob -> módulo glob
for (const mod of mods) if (mod.tipo === 'glob') for (const v of mod.info.vars) globDe.set(v, mod);

const consumidos = []; // rangos sustituidos por completo (sus identificadores no cuentan)
const ediciones = []; // {start, end, texto | fn(modActual)}
const usaNs = new Map(); // mod -> Set(ns)
const esPromiseResolveThen = (n) => n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && n.callee.property.name === 'then'
  && n.callee.object.type === 'CallExpression' && n.callee.object.callee.type === 'MemberExpression'
  && n.callee.object.callee.object.name === 'Promise' && n.callee.object.callee.property.name === 'resolve';
const relativa = (desde, hasta) => {
  let r = path.relative(path.dirname(desde.ruta), hasta.ruta);
  if (!r.startsWith('.')) r = './' + r;
  return r;
};
for (const mod of mods) {
  if (mod.tipo !== 'js') continue;
  for (const raiz of mod.conservado) {
    recorrer(raiz, (n) => {
      if (esPromiseResolveThen(n)) {
        const f = n.arguments[0];
        const b = f?.body;
        if (b?.type === 'SequenceExpression' && b.expressions.length === 2 && b.expressions[0].type === 'CallExpression' && b.expressions[1].type === 'Identifier') {
          const init = b.expressions[0].callee.name, ns = b.expressions[1].name;
          const destino = porInit.get(init) ?? fallo('import() a init desconocido ' + init);
          if (destino.info.ns !== ns) fallo(`import() de ${init} con espacio de nombres ${ns} != ${destino.info.ns}`);
          consumidos.push(n);
          ediciones.push({ start: n.start, end: n.end, fn: (actual) => `import(${JSON.stringify(relativa(actual, destino))})` });
          return false;
        }
        if (b?.type === 'CallExpression') fallo('import() de JSON fuera de un glob en ' + mod.ruta);
      }
      if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && globDe.has(n.callee.name)) {
        const g = globDe.get(n.callee.name);
        const tpl = n.arguments[0];
        if (tpl?.type !== 'TemplateLiteral') fallo('Glob llamado sin plantilla en ' + mod.ruta);
        const [preO, sufO] = g.conf.original.split('${}');
        const [preN, sufN] = g.conf.patron.split('${}');
        let txt = cod.slice(tpl.start, tpl.end);
        if (!txt.startsWith('`' + preO) || !txt.endsWith(sufO + '`')) fallo('Plantilla de glob inesperada: ' + txt);
        txt = '`' + preN + txt.slice(1 + preO.length, txt.length - 1 - sufO.length) + sufN + '`';
        consumidos.push(n.callee);
        ediciones.push({ start: n.callee.start, end: n.callee.end, texto: 'import' });
        ediciones.push({ start: tpl.start, end: tpl.end, texto: txt, sinRenombres: true });
        return false;
      }
      return true;
    });
  }
}

// ---------------------------------------------------------------- renombres
const propuestas = new Map();
const pascal = (s) => s.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
const base = (mod) => pascal(path.basename(mod.ruta, '.js'));
const valido = (s) => /^[A-Za-z_$][\w$]*$/.test(s);
// a) exports de los espacios de nombres (primero los declarados en el propio módulo)
for (const pasada of [0, 1]) {
  for (const mod of mods) {
    for (const { export: exp, local } of mod.info.exportsNs) {
      const propio = declarante.get(local) === mod;
      if ((pasada === 0) !== propio || propuestas.has(local)) continue;
      let nuevo = null;
      if (exp === 'default') nuevo = mod.ruta.startsWith('ui/screens/') ? `pantalla${base(mod)}` : `${base(mod)}Default`;
      else if (exp === 'options') nuevo = `opciones${base(mod)}`;
      else if (exp === 'create') nuevo = mod.ruta.startsWith('scenes/') ? `crearEscena${base(mod)}` : `create${base(mod)}`;
      else if (valido(exp)) nuevo = exp;
      if (nuevo && nuevo !== local) propuestas.set(local, nuevo);
    }
  }
}
// b) variables de los módulos de datos: nombre según el fichero (reglas/especies.json -> reglasEspecies)
const camel = (s) => s.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
for (const mod of mods) {
  if (mod.tipo !== 'json' && mod.tipo !== 'css') continue;
  const v = mod.info.vars[0];
  if (!v || mod.m.tipo === 'json') continue; // los __commonJS (niveles) se cargan con import()
  const partes = mod.ruta.replace(/\.(json|css)$/, '').split('/');
  const nuevo = mod.tipo === 'css' ? camel(partes.at(-1)) + 'Css' : camel(partes.slice(-2).join('-'));
  propuestas.set(v, nuevo);
}
// c) tabla manual
for (const [viejo, nuevo] of Object.entries(RENOMBRES)) {
  if (!enlaces.has(viejo)) { avisos.push('Renombre manual de un enlace inexistente: ' + viejo); continue; }
  propuestas.set(viejo, nuevo);
}
const renombres = deconflictar([...propuestas], nombresEnUso(ast));
const nombre = (viejo) => renombres.get(viejo) ?? viejo;
for (const [v, n] of renombres) if (n !== propuestas.get(v)) avisos.push(`Renombre con sufijo por conflicto: ${v} -> ${n}`);

// Ediciones de renombrado (con propiedades abreviadas).
const abreviadas = new Map();
recorrer(ast.program, (n) => {
  if (n.type === 'ObjectProperty' && n.shorthand) {
    const v = n.value.type === 'AssignmentPattern' ? n.value.left : n.value;
    if (v.type === 'Identifier') abreviadas.set(v, n.key.name);
  }
});
for (const [viejo, nuevo] of renombres) {
  for (const nodo of enlaces.get(viejo).nodos) {
    const clave = abreviadas.get(nodo);
    ediciones.push({ start: nodo.start, end: nodo.end, texto: clave !== undefined ? `${clave}: ${nuevo}` : nuevo, renombre: true });
  }
}
ediciones.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));

function texto(desde, hasta, actual) {
  const trozos = [];
  let pos = desde;
  for (const e of ediciones) {
    if (e.end <= desde || e.start >= hasta) continue;
    if (e.start < pos) continue; // dentro de una edición ya aplicada
    trozos.push(cod.slice(pos, e.start), e.fn ? e.fn(actual) : e.texto);
    pos = e.end;
  }
  trozos.push(cod.slice(pos, hasta));
  return trozos.join('');
}

// ---------------------------------------------------------------- referencias entre módulos
const usos = new Map(mods.map((m) => [m, new Set()]));
const usadoFuera = new Map(mods.map((m) => [m, new Set()]));
for (const [nom, e] of enlaces) {
  const decl = declarante.get(nom);
  for (const n of e.nodos) {
    const m = moduloDe(n.start);
    if (!m || m.tipo !== 'js') continue;
    if (!dentroDe(m.conservado, n.start) || dentroDe(consumidos, n.start)) continue;
    if (decl === 'ayudante') fallo(`${m.ruta} usa el ayudante de esbuild ${nom}`);
    if (initsSet.has(nom)) fallo(`${m.ruta} usa la función init ${nom} fuera de un import()`);
    if (nsDe.has(nom)) {
      if (!usaNs.has(m)) usaNs.set(m, new Set());
      usaNs.get(m).add(nom);
      continue;
    }
    if (decl === m) continue;
    if (decl !== 'npm' && e.binding.constantViolations.some((v) => moduloDe(v.node.start) === m && dentroDe(m.conservado, v.node.start))) {
      fallo(`${m.ruta} asigna ${nom}, que es de ${decl.ruta}`);
    }
    usos.get(m).add(nom);
    if (decl !== 'npm') usadoFuera.get(decl).add(nom);
  }
}

// Exports: con espacio de nombres, exactamente sus entradas; sin él, lo que se usa fuera.
function nombreExportado(mod, local) {
  if (mod.tipo === 'json' || mod.tipo === 'css') return 'default';
  if (mod.info.ns) {
    const e = mod.info.exportsNs.find((x) => x.local === local);
    if (!e) return null;
    return e.export === 'default' || !valido(e.export) ? e.export : nombre(local) === e.export ? e.export : e.export;
  }
  return nombre(local);
}
for (const [mod, set] of usadoFuera) {
  if (!mod.info.ns) continue;
  for (const l of set) if (!mod.info.exportsNs.some((x) => x.local === l)) fallo(`${l} de ${mod.ruta} se usa fuera pero no está en su espacio de nombres`);
}

// ---------------------------------------------------------------- generación
const especificador = (exp, local) => (exp === local ? local : `${exp} as ${local}`);
function generarImports(mod) {
  const lineas = [];
  const pend = new Set(usos.get(mod));
  // npm (three y addons)
  const porFuente = new Map();
  for (const n of [...pend].filter((n) => declarante.get(n) === 'npm').sort()) {
    const { fuente, importado } = npm.get(n);
    if (!porFuente.has(fuente)) porFuente.set(fuente, []);
    porFuente.get(fuente).push(especificador(importado, n));
    pend.delete(n);
  }
  // Mismo orden en que el publicado inicializaba three y sus addons.
  const ORDEN_NPM = ['three', 'three/addons/utils/BufferGeometryUtils.js', 'three/addons/utils/SkeletonUtils.js',
    'three/addons/loaders/GLTFLoader.js', 'three/addons/libs/meshopt_decoder.module.js', 'three/addons/controls/OrbitControls.js',
    'three/addons/postprocessing/EffectComposer.js', 'three/addons/postprocessing/ShaderPass.js', 'three/addons/postprocessing/RenderPass.js',
    'three/addons/postprocessing/UnrealBloomPass.js', 'three/addons/postprocessing/GTAOPass.js', 'three/addons/postprocessing/OutputPass.js'];
  const rango = (f) => (ORDEN_NPM.includes(f) ? ORDEN_NPM.indexOf(f) : 99);
  const fuentes = [...porFuente.keys()].sort((a, b) => rango(a) - rango(b) || a.localeCompare(b));
  for (const f of fuentes) lineas.push(`import { ${porFuente.get(f).join(', ')} } from '${f}';`);
  // Orden de los demás: módulos de la cola (sin envolver) y luego las dependencias init en orden.
  const orden = [];
  if (!mod.envuelto) for (const c of colaMods) if (c !== mod && [...pend].some((n) => declarante.get(n) === c)) orden.push(c);
  for (const i of mod.info.deps) { const d = porInit.get(i); if (d.tipo !== 'glob' && !orden.includes(d)) orden.push(d); }
  const nsUsados = usaNs.get(mod) || new Set();
  for (const dep of orden) {
    const specs = [];
    let porDefecto = null;
    for (const n of [...pend]) {
      const decl = declarante.get(n);
      let exp = null;
      if (decl === dep) exp = nombreExportado(dep, n);
      else if (dep.info.ns) { const e = dep.info.exportsNs.find((x) => x.local === n); if (e) exp = e.export; }
      if (exp == null) continue;
      pend.delete(n);
      if (exp === 'default') porDefecto = nombre(n); else specs.push(especificador(exp, nombre(n)));
    }
    const rel = relativa(mod, dep);
    const partes = [porDefecto, specs.length ? `{ ${specs.join(', ')} }` : null].filter(Boolean);
    lineas.push(partes.length ? `import ${partes.join(', ')} from '${rel}';` : `import '${rel}';`);
    if (dep.info.ns && nsUsados.has(dep.info.ns)) { lineas.push(`import * as ${nombre(dep.info.ns)} from '${rel}';`); nsUsados.delete(dep.info.ns); }
  }
  // Lo que quede: directamente del módulo que lo declara.
  const resto = new Map();
  for (const n of pend) {
    const decl = declarante.get(n);
    if (!resto.has(decl)) resto.set(decl, []);
    resto.get(decl).push(n);
  }
  for (const [decl, ns] of resto) {
    if (mod.envuelto) avisos.push(`${mod.ruta} importa de ${decl.ruta} sin llamada init: ${ns.join(', ')}`);
    const specs = ns.map((n) => especificador(nombreExportado(decl, n) ?? fallo(`${n} no exportado por ${decl.ruta}`), nombre(n)));
    lineas.push(`import { ${specs.join(', ')} } from '${relativa(mod, decl)}';`);
  }
  for (const ns of nsUsados) lineas.push(`import * as ${nombre(ns)} from '${relativa(mod, nsDe.get(ns))}';`);
  return lineas;
}

function generarExports(mod) {
  if (mod.info.ns) {
    const propios = [];
    const reexp = new Map();
    for (const { export: exp, local } of mod.info.exportsNs) {
      const decl = declarante.get(local);
      if (decl === mod) propios.push(especificador(nombre(local), exp));
      else {
        if (!reexp.has(decl)) reexp.set(decl, []);
        const expDecl = nombreExportado(decl, local) ?? fallo(`Reexport de ${local} que ${decl.ruta} no exporta`);
        reexp.get(decl).push(especificador(expDecl, exp));
        usadoFuera.get(decl).add(local);
      }
    }
    const l = [];
    for (const [decl, specs] of reexp) l.push(`export { ${specs.join(', ')} } from '${relativa(mod, decl)}';`);
    if (propios.length) l.push(`export { ${propios.join(', ')} };`);
    return l;
  }
  const s = [...usadoFuera.get(mod)].map(nombre).sort();
  return s.length ? [`export { ${s.join(', ')} };`] : [];
}

const necesitaParentesis = (t) => /^\s*(\{|function\b|class\b|let\s*\[|async\s+function\b)/.test(t);
function convertirCierre(mod) {
  const lineas = [];
  const elevadas = new Set(mod.info.vars);
  const declaradas = new Set();
  const constante = (n) => enlaces.get(n).binding.constantViolations.length === 1;
  for (const s of mod.cuerpo) {
    if (esLlamadaInit(s)) continue;
    if (s.type === 'ExpressionStatement') {
      const exprs = s.expression.type === 'SequenceExpression' ? s.expression.expressions : [s.expression];
      for (const e of exprs) {
        if (e.type === 'AssignmentExpression' && e.operator === '=' && e.left.type === 'Identifier' && elevadas.has(e.left.name) && !declaradas.has(e.left.name)) {
          declaradas.add(e.left.name);
          lineas.push({ decl: e.left.name, txt: `${constante(e.left.name) ? 'const' : 'let'} ${nombre(e.left.name)} = ${texto(e.right.start, e.right.end, mod)};` });
        } else {
          const t = texto(e.start, e.end, mod);
          lineas.push({ txt: (necesitaParentesis(t) ? `(${t})` : t) + ';' });
        }
      }
    } else lineas.push({ txt: texto(s.start, s.end, mod) });
  }
  const sinDeclarar = [...elevadas].filter((n) => !declaradas.has(n));
  return { lineas: lineas.map((l) => l.txt), sinDeclarar };
}

const datos = new Map(extraerDatos(cod, ast).map((d) => [d.init, d]));
const ficheros = new Map(); // ruta -> contenido
const informe = [];
for (const mod of mods) {
  if (mod.tipo === 'glob') continue;
  if (mod.tipo === 'json' || mod.tipo === 'css') {
    ficheros.set(mod.ruta, datos.get(mod.id).contenido);
    informe.push({ ruta: mod.ruta, init: mod.id, tipo: mod.tipo, bytes: datos.get(mod.id).contenido.length });
    continue;
  }
  const origen = mod.envuelto ? `módulo __esm «${mod.id}»` : 'parte sin envolver del final del bundle';
  const partes = [`// ${mod.ruta}\n// Reconstruido de publicado/juego.js (${origen}). Nombres locales aún minificados.\n`];
  const imps = generarImports(mod);
  if (imps.length) partes.push(imps.join('\n') + '\n');
  if (mod.envuelto) {
    for (const s of mod.sentencias) if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') partes.push(texto(s.start, s.end, mod));
    const { lineas, sinDeclarar } = convertirCierre(mod);
    if (sinDeclarar.length) partes.push(`let ${sinDeclarar.map(nombre).join(', ')};`);
    partes.push(...lineas);
  } else {
    for (const s of mod.conservado) partes.push(texto(s.start, s.end, mod));
  }
  const exps = generarExports(mod);
  if (exps.length) partes.push('\n' + exps.join('\n'));
  ficheros.set(mod.ruta, partes.join('\n') + '\n');
  informe.push({ ruta: mod.ruta, init: mod.envuelto ? mod.id : null, tipo: 'js', envuelto: mod.envuelto, deps: mod.info.deps.map((i) => porInit.get(i)).filter((d) => d.tipo !== 'glob').map((d) => d.ruta), exports: exps.join(' ').match(/\b(?:as\s+)?([\w$]+)(?=\s*[,}])/g)?.length ?? 0 });
}
// Los exports pueden haberse ampliado al generar reexportaciones: segunda pasada para los que no tienen ns.
for (const mod of mods) {
  if (mod.tipo !== 'js' || mod.info.ns) continue;
  const c = ficheros.get(mod.ruta);
  const exps = generarExports(mod);
  const sinExport = c.replace(/\n\nexport \{[^}]*\};\n$/, '\n');
  ficheros.set(mod.ruta, sinExport + (exps.length ? '\n' + exps.join('\n') + '\n' : ''));
}

// ---------------------------------------------------------------- escribir
fs.rmSync(SRC, { recursive: true, force: true });
let formateados = 0;
for (const [ruta, contenido] of ficheros) {
  const destino = SRC + ruta;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  let salida = contenido;
  if (ruta.endsWith('.js')) {
    try {
      analizar(contenido);
      salida = await prettier.format(contenido, { parser: 'babel', printWidth: 110, singleQuote: true });
      formateados++;
    } catch (e) {
      avisos.push(`No se pudo formatear ${ruta}: ${e.message.split('\n')[0]}`);
    }
  }
  fs.writeFileSync(destino, salida);
}
fs.writeFileSync(S + '05-informe.json', JSON.stringify({ informe, renombres: Object.fromEntries(renombres), avisos }, null, 1));
console.log(`módulos: ${ficheros.size} ficheros (${formateados} JS formateados); renombres: ${renombres.size}; avisos: ${avisos.length}`);
for (const a of avisos.slice(0, 40)) console.log('  aviso:', a);
