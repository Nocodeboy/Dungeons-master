// combat/hands.js
// Reconstruido de publicado/juego.js (módulo __esm «e3»). Nombres locales aún minificados.

import { Vector3 } from 'three';

function Um(o, e = new Vector3()) {
  let t = o.root || o;
  if (o._hand === void 0) {
    let n = null;
    (t.traverse((s) => {
      !n && dH.test(s.name) && (n = s);
    }),
      (o._hand = n));
  }
  if (o._hand) return o._hand.getWorldPosition(e);
  ZS(o, e);
  let a = t.rotation.y;
  return e.add(new Vector3(Math.sin(a) * 0.35, 0.1, Math.cos(a) * 0.35));
}
function KS(o, e = new Vector3()) {
  return (o.root || o).getWorldPosition(e);
}
function JS(o, e = new Vector3()) {
  return o.headWorld
    ? o.headWorld(e)
    : o.ch?.headWorld
      ? o.ch.headWorld(e)
      : (KS(o, e), (e.y += 1.6 * (o.scale ?? 1)), e);
}
function ZS(o, e = new Vector3()) {
  return o.chest ? o.chest(e) : (JS(o, e), (e.y -= 0.35 * (o.scale ?? 1)), e);
}
function QS(o) {
  return { root: o.root || o, feet: () => KS(o), chest: () => ZS(o), head: () => JS(o), hand: () => Um(o) };
}
const dH = /^(hand[._]?r|handslot[._]?r|right_?hand|mixamorig:?righthand|wrist[._]?r|r_hand|hand_right)$/i;

export { QS, Um };
