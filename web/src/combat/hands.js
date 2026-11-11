// combat/hands.js — Puntos de anclaje de una figura en el mundo: pies, pecho, cabeza y mano derecha.
// La mano se busca por el nombre del hueso (varias convenciones de rig) y se cachea en `actor._hand`; si no
// hay hueso, se estima delante del pecho. Lo usa combat/controller.js para colocar efectos y proyectiles.

import { Vector3 } from 'three';

/** Posición en el mundo de la mano derecha (hueso o estimación delante del pecho). */
function handWorld(actor, out = new Vector3()) {
  let root = actor.root || actor;
  if (actor._hand === void 0) {
    let hand = null;
    (root.traverse((node) => {
      !hand && HAND_BONE_RE.test(node.name) && (hand = node);
    }),
      (actor._hand = hand));
  }
  if (actor._hand) return actor._hand.getWorldPosition(out);
  chestWorld(actor, out);
  let yaw = root.rotation.y;
  return out.add(new Vector3(Math.sin(yaw) * 0.35, 0.1, Math.cos(yaw) * 0.35));
}
/** Posición de los pies (la raíz de la figura). */
function feetWorld(actor, out = new Vector3()) {
  return (actor.root || actor).getWorldPosition(out);
}
/** Posición de la cabeza (método propio de la figura o 1,6 m por la escala). */
function headWorld(actor, out = new Vector3()) {
  return actor.headWorld
    ? actor.headWorld(out)
    : actor.ch?.headWorld
      ? actor.ch.headWorld(out)
      : (feetWorld(actor, out), (out.y += 1.6 * (actor.scale ?? 1)), out);
}
/** Posición del pecho (método propio o 0,35 m bajo la cabeza). */
function chestWorld(actor, out = new Vector3()) {
  return actor.chest ? actor.chest(out) : (headWorld(actor, out), (out.y -= 0.35 * (actor.scale ?? 1)), out);
}
/** Objeto de anclajes {root, feet, chest, head, hand} para los efectos (vfx). */
function anchorsOf(actor) {
  return { root: actor.root || actor, feet: () => feetWorld(actor), chest: () => chestWorld(actor), head: () => headWorld(actor), hand: () => handWorld(actor) };
}
/** Nombres de hueso de la mano derecha en los rigs usados. */
const HAND_BONE_RE = /^(hand[._]?r|handslot[._]?r|right_?hand|mixamorig:?righthand|wrist[._]?r|r_hand|hand_right)$/i;

export { anchorsOf, handWorld };
