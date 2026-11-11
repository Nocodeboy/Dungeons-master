// actors/preview.js
// Reconstruido de publicado/juego.js (módulo __esm «wT»). Nombres locales aún minificados.

import {
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  TorusGeometry,
} from 'three';
import { heroLook } from './look.js';
import { buildHumanoid } from './humanoid.js';
import { allTexturesReady } from './materials.js';

function createHeroPreview({ lights: o = !0, pedestal: e = !0 } = {}) {
  let t = new Group();
  t.name = 'vista_heroe';
  let a = new Group();
  if ((t.add(a), e)) {
    let d = new MeshStandardMaterial({ color: 4077104, roughness: 0.95 }),
      u = new Mesh(new CylinderGeometry(0.62, 0.7, 0.16, 48), d);
    ((u.position.y = -0.08), (u.receiveShadow = !0), t.add(u));
    let h = new Mesh(
      new TorusGeometry(0.62, 0.02, 6, 64),
      new MeshStandardMaterial({ color: 14398054, metalness: 0.8, roughness: 0.35 }),
    );
    ((h.rotation.x = Math.PI / 2), (h.position.y = 0), t.add(h));
  }
  if (o) {
    t.add(new HemisphereLight(14736596, 4207658, 1));
    let d = new DirectionalLight(16769732, 2.4);
    (d.position.set(1.5, 3, 2.5),
      (d.castShadow = !0),
      d.shadow.mapSize.set(1024, 1024),
      Object.assign(d.shadow.camera, { left: -1.5, right: 1.5, top: 2.5, bottom: -0.5, near: 0.5, far: 8 }),
      (d.shadow.bias = -5e-4),
      t.add(d));
    let u = new DirectionalLight(10139903, 1.6);
    (u.position.set(-2, 2, -2.5), t.add(u));
  }
  let n = null,
    s = '',
    i = 0,
    r = null,
    l = 0;
  return {
    group: t,
    get character() {
      return n;
    },
    async set(d, u = {}) {
      let h = heroLook(d || {}, u),
        p = JSON.stringify(h);
      if (p === s && n) return n;
      s = p;
      let m = ++l;
      r = buildHumanoid(h);
      let _ = await r;
      return (
        await allTexturesReady(),
        m !== l
          ? (_.dispose(), n)
          : (n && n.dispose(), (n = _), (n.userData.sheet = d), a.add(n.root), n.play('idle', 0), n)
      );
    },
    drag(d) {
      ((a.rotation.y += d * 0.012), (i = d * 0.6));
    },
    play(d) {
      n && (n.isLoop(d) ? n.play(d) : n.playOnce(d));
    },
    update(d) {
      if ((n && n.update(d), Math.abs(i) > 0.01)) ((a.rotation.y += i * d), (i *= Math.max(0, 1 - d * 3)));
      else {
        let h = MathUtils.degToRad(-12) - a.rotation.y;
        ((h = Math.atan2(Math.sin(h), Math.cos(h))), (a.rotation.y += h * Math.min(1, d * 0.8)));
      }
    },
    frame(d, u = 'cuerpo') {
      let h = n ? n.height : 1.8,
        p = Math.max(0.6, h / 1.8);
      u === 'retrato'
        ? (d.position.set(0, h * 0.92, 1.25 * p + 0.4), d.lookAt(0, h * 0.86, 0))
        : (d.position.set(0, h * 0.62 + 0.2, 4 * p + 0.6), d.lookAt(0, h * 0.48, 0));
    },
    dispose() {
      (l++,
        n && n.dispose(),
        (n = null),
        t.removeFromParent(),
        t.traverse((d) => {
          d.isMesh && (d.geometry.dispose(), d.material.dispose?.());
        }));
    },
  };
}

export { createHeroPreview };
