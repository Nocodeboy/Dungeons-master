// story/conditions.js — Condiciones de la historia: expresiones como «a & !b | c>=2 | class:wizard».
// Gramática: or («|») de and («&») de unarios («!», paréntesis) y átomos «[ns:]nombre[op valor]» con
// op en >=, <=, !=, =, >, <. Sin espacio de nombres, el átomo es una bandera (o true/false, stealth, alone,
// gold, mercs, level, day, party); con él, consulta el contexto (party:, class:, item:, quest:, seen:…).
// Los árboles se cachean por texto. Lo usa story/runner.js (StoryRunner.test y las etiquetas de opciones).

/** Analiza el texto de una condición y devuelve su árbol ({t: 'or'|'and'|'not'|'atom'|'true', …}); cacheado. */
function parseCondition(src) {
  if (src == null || src === '') return { t: 'true' };
  if (typeof src != 'string') throw new Error(`condici\xF3n no es texto: ${JSON.stringify(src)}`);
  if (parseCache.has(src)) return parseCache.get(src);
  let tokens = [],
    tokenRe = /\s*(\(|\)|&|\||!(?!=)|[A-Za-z_][\w]*(?::[\w.]+)?(?:(?:>=|<=|!=|=|>|<)[\w.+-]+)?)/y,
    pos = 0;
  for (; pos < src.length;) {
    if (/\s/.test(src[pos])) {
      pos++;
      continue;
    }
    tokenRe.lastIndex = pos;
    let match = tokenRe.exec(src);
    if (!match) throw new Error(`no entiendo \xAB${src.slice(pos)}\xBB en \xAB${src}\xBB`);
    (tokens.push(match[1]), (pos = tokenRe.lastIndex));
  }
  let index = 0,
    peek = () => tokens[index],
    next = () => tokens[index++];
  function parseOr() {
    let node = parseAnd();
    for (; peek() === '|';) (next(), (node = { t: 'or', a: node, b: parseAnd() }));
    return node;
  }
  function parseAnd() {
    let node = parseUnary();
    for (; peek() === '&';) (next(), (node = { t: 'and', a: node, b: parseUnary() }));
    return node;
  }
  function parseUnary() {
    if (peek() === '!') return (next(), { t: 'not', a: parseUnary() });
    if (peek() === '(') {
      next();
      let inner = parseOr();
      if (next() !== ')') throw new Error(`falta \xAB)\xBB en \xAB${src}\xBB`);
      return inner;
    }
    let token = next();
    if (!token || '()&|!'.includes(token)) throw new Error(`esperaba una condici\xF3n en \xAB${src}\xBB`);
    return parseAtom(token);
  }
  let tree = parseOr();
  if (index < tokens.length) throw new Error(`sobra \xAB${tokens.slice(index).join(' ')}\xBB en \xAB${src}\xBB`);
  return (parseCache.set(src, tree), tree);
}
/** Átomo «[ns:]nombre[op valor]» → {t: 'atom', ns, name, op, value}. */
function parseAtom(text) {
  let op = null,
    value = null,
    lhs = text;
  for (let candidate of COMPARE_OPS) {
    let at = text.indexOf(candidate);
    if (at > 0) {
      let head = text.slice(0, at);
      if (COMPARE_OPS.some((other) => head.includes(other))) continue;
      ((op = candidate), (lhs = head), (value = text.slice(at + candidate.length)));
      break;
    }
  }
  let colon = lhs.indexOf(':'),
    ns = colon > 0 ? lhs.slice(0, colon) : null,
    name = colon > 0 ? lhs.slice(colon + 1) : lhs;
  return { t: 'atom', ns, name, op, value };
}
/** Lista de los átomos de una condición (para etiquetar opciones de diálogo con sus requisitos). */
function conditionAtoms(src) {
  let atoms = [],
    collect = (node) => {
      node && (node.t === 'atom' ? atoms.push(node) : (collect(node.a), collect(node.b)));
    };
  return (collect(parseCondition(src)), atoms);
}
/** Compara un valor con el de la condición: «=»/«!=» como texto (con true/false), el resto como número. */
function compareValue(actual, op, expected) {
  if (op === '=') return String(actual) === String(expected) || (expected === 'true' && actual === !0) || (expected === 'false' && !actual);
  if (op === '!=') return !compareValue(actual, '=', expected);
  let left = Number(actual ?? 0),
    right = Number(expected);
  return op === '>=' ? left >= right : op === '<=' ? left <= right : op === '>' ? left > right : op === '<' ? left < right : !1;
}
/**
 * Evalúa una condición (texto o árbol) contra el contexto de la historia (StoryRunner: flag, hero, gold…).
 * Una condición vacía es cierta.
 */
function evalCondition(cond, ctx) {
  if (cond == null || cond === '') return !0;
  let tree = typeof cond == 'string' ? parseCondition(cond) : cond;
  return evalNode(tree, ctx);
}
/** Evalúa un nodo del árbol. */
function evalNode(node, ctx) {
  switch (node.t) {
    case 'true':
      return !0;
    case 'not':
      return !evalNode(node.a, ctx);
    case 'and':
      return evalNode(node.a, ctx) && evalNode(node.b, ctx);
    case 'or':
      return evalNode(node.a, ctx) || evalNode(node.b, ctx);
    case 'atom':
      return evalAtom(node, ctx);
  }
  return !1;
}
/** Evalúa un átomo contra el contexto; los espacios de nombres desconocidos son falsos. */
function evalAtom({ ns, name, op, value }, ctx) {
  let test = (v) => (op ? compareValue(v, op, value) : v != null && v !== !1 && v !== 0 && v !== '');
  if (!ns)
    return name === 'true'
      ? !0
      : name === 'false'
        ? !1
        : name === 'stealth'
          ? test(!!(ctx.ctx?.stealth || ctx.stealthNow?.()))
          : name === 'alone'
            ? ctx.partySize() <= 1
            : op && name === 'gold'
              ? compareValue(ctx.gold(), op, value === 'precio' ? (ctx.hirePrice?.() ?? 0) : value)
              : name === 'mercs'
                ? test(ctx.mercs?.().length ?? 0)
                : op && name === 'level'
                  ? compareValue(ctx.level(), op, value)
                  : op && name === 'day'
                    ? compareValue(ctx.day(), op, value)
                    : op && name === 'party'
                      ? compareValue(ctx.partySize(), op, value)
                      : test(ctx.flag(name));
  let hero = () => ctx.hero() || {};
  switch (ns) {
    case 'party':
      return test(ctx.inParty(name));
    case 'species':
      return test(hero().species === name);
    case 'lineage':
      return test(hero().lineage === name || hero().ancestry === name);
    case 'class':
      return test(hero().class === name);
    case 'subclass':
      return test(hero().subclass === name);
    case 'bg':
      return test(hero().background === name);
    case 'pronoun':
      return test((hero().pronoun || 'm') === name);
    case 'item':
    case 'has':
      return op ? compareValue(ctx.itemCount(name), op, value) : ctx.itemCount(name) > 0;
    case 'approval':
      return op ? compareValue(ctx.approval(name), op, value) : ctx.approval(name) > 0;
    case 'seen':
      return op ? compareValue(ctx.seen(name), op, value) : ctx.seen(name) > 0;
    case 'tried':
      return op ? compareValue(ctx.tried(name), op, value) : !!ctx.tried(name);
    case 'quest':
      return op ? compareValue(ctx.quest(name), op, value) : ctx.quest(name) !== 'none';
    case 'ctx':
      return test(ctx.ctx?.[name]);
    case 'in':
      return ctx.levelId() === name;
    case 'var':
      return test(ctx.vars?.[name]);
    case 'dead':
      return test(ctx.isDead?.(name));
    case 'visited':
    case 'met':
    case 'fought':
    case 'killed':
      return test(ctx.knows?.(ns, name));
    default:
      return !1;
  }
}
/** Operadores de comparación, de más largo a más corto (para partir «a>=2» antes que «a>2»). */
const COMPARE_OPS = ['>=', '<=', '!=', '=', '>', '<'];
const parseCache = new Map();

export { conditionAtoms, evalCondition };
