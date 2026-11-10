// Renombrado de enlaces de nivel superior por empalme de texto sobre posiciones exactas del AST.
// Conserva el formato original y respeta los ámbitos (solo toca identificadores que resuelven
// al enlace del programa). Trata las propiedades abreviadas ({x} -> {x: nuevo}).
import { recorrer, esPosicionPropiedad } from './ast.mjs';

// Todos los nombres de identificador en posición de enlace/referencia (para evitar capturas).
export function nombresEnUso(ast) {
  const s = new Set();
  recorrer(ast.program, (n, padre, clave) => {
    if (n.type === 'Identifier' && !esPosicionPropiedad(padre, clave)) s.add(n.name);
  });
  return s;
}

// Asegura nombres nuevos únicos y que no capturen nada: si el nombre ya existe, añade sufijo.
export function deconflictar(propuestas, enUso) {
  // No se liberan los nombres viejos: pueden seguir existiendo como locales en otros ámbitos.
  const usados = new Set(enUso);
  const final = new Map();
  for (const [viejo, nuevo] of propuestas) {
    let n = nuevo, k = 2;
    while (usados.has(n) || n === 'arguments' || n === 'eval') n = `${nuevo}_${k++}`;
    usados.add(n);
    final.set(viejo, n);
  }
  return final;
}

// Aplica el renombrado. `enlaces` es el resultado de enlacesDelPrograma; `mapa` es Map(viejo->nuevo).
export function aplicarRenombrado(codigo, ast, enlaces, mapa) {
  // Localizar propiedades abreviadas cuyo valor es un identificador renombrado.
  const abreviadas = new Map(); // nodo identificador -> clave original
  recorrer(ast.program, (n) => {
    if ((n.type === 'ObjectProperty') && n.shorthand) {
      const v = n.value.type === 'AssignmentPattern' ? n.value.left : n.value;
      if (v.type === 'Identifier') abreviadas.set(v, n.key.name);
    }
  });
  const cambios = [];
  for (const [viejo, nuevo] of mapa) {
    const e = enlaces.get(viejo);
    if (!e) throw new Error('Enlace inexistente: ' + viejo);
    for (const nodo of e.nodos) {
      const clave = abreviadas.get(nodo);
      cambios.push([nodo.start, nodo.end, clave !== undefined ? `${clave}: ${nuevo}` : nuevo]);
    }
  }
  cambios.sort((a, b) => a[0] - b[0]);
  // Quitar duplicados (mismo nodo recogido por dos vías).
  const unicos = [];
  for (const c of cambios) {
    const u = unicos[unicos.length - 1];
    if (u && u[0] === c[0]) { if (u[1] !== c[1] || u[2] !== c[2]) throw new Error('Cambios solapados en ' + c[0]); continue; }
    if (u && c[0] < u[1]) throw new Error('Cambios solapados en ' + c[0]);
    unicos.push(c);
  }
  const trozos = [];
  let pos = 0;
  for (const [a, b, txt] of unicos) { trozos.push(codigo.slice(pos, a), txt); pos = b; }
  trozos.push(codigo.slice(pos));
  return trozos.join('');
}
