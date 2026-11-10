// Resolución de ámbitos con @babel/traverse: qué identificadores apuntan a enlaces de nivel superior.
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;

// Devuelve { enlaces: Map(nombre -> {nodos:Set<Identifier>, tipo}), nodoAEnlace: Map(Identifier -> nombre) }
// con todos los identificadores (declaración, referencias y asignaciones) que resuelven a un
// enlace del ámbito del programa.
export function enlacesDelPrograma(ast) {
  let progScope = null;
  traverse(ast, {
    Program(p) { progScope = p.scope; p.stop(); },
  });
  const enlaces = new Map();
  const nodoAEnlace = new Map();
  for (const [nombre, b] of Object.entries(progScope.bindings)) {
    const nodos = new Set();
    nodos.add(b.identifier);
    for (const r of b.referencePaths) nodos.add(r.node);
    for (const v of b.constantViolations) {
      // Asignaciones: recoger los identificadores del lado izquierdo que son este enlace.
      const ids = v.getBindingIdentifiers ? v.getBindingIdentifiers(true) : {};
      for (const lista of Object.values(ids)) {
        for (const id of [].concat(lista)) if (id && id.name === nombre) nodos.add(id);
      }
      if (v.node.type === 'UpdateExpression' && v.node.argument.type === 'Identifier') nodos.add(v.node.argument);
      if (v.node.type === 'AssignmentExpression' && v.node.left.type === 'Identifier' && v.node.left.name === nombre) nodos.add(v.node.left);
    }
    enlaces.set(nombre, { nodos, tipo: b.kind, binding: b });
    for (const n of nodos) nodoAEnlace.set(n, nombre);
  }
  return { enlaces, nodoAEnlace, progScope };
}

export { traverse };
