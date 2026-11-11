// actors/preview.js
// Reconstruido de publicado/juego.js (módulo __esm «wT»).
//
// Vista previa del héroe para incrustar en otra escena: grupo con peana y luces opcionales, figura
// giratoria que vuelve sola a su ángulo y encuadre de cuerpo entero o de retrato. Se exporta por
// index.js (createHeroPreview) para la interfaz.

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

/**
 * Crea la vista previa. Devuelve {group, character, set(hoja, opts), drag(dx), play(anim),
 * update(dt), frame(camera, 'cuerpo' | 'retrato'), dispose()}; `set` reconstruye la figura solo si
 * cambia su look y descarta las construcciones que lleguen tarde.
 */
function createHeroPreview({ lights = !0, pedestal = !0 } = {}) {
  let group = new Group();
  group.name = 'vista_heroe';
  let turntable = new Group();
  if ((group.add(turntable), pedestal)) {
    let stoneMat = new MeshStandardMaterial({ color: 4077104, roughness: 0.95 }),
      plinth = new Mesh(new CylinderGeometry(0.62, 0.7, 0.16, 48), stoneMat);
    ((plinth.position.y = -0.08), (plinth.receiveShadow = !0), group.add(plinth));
    let ring = new Mesh(
      new TorusGeometry(0.62, 0.02, 6, 64),
      new MeshStandardMaterial({ color: 14398054, metalness: 0.8, roughness: 0.35 }),
    );
    ((ring.rotation.x = Math.PI / 2), (ring.position.y = 0), group.add(ring));
  }
  if (lights) {
    group.add(new HemisphereLight(14736596, 4207658, 1));
    let key = new DirectionalLight(16769732, 2.4);
    (key.position.set(1.5, 3, 2.5),
      (key.castShadow = !0),
      key.shadow.mapSize.set(1024, 1024),
      Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2.5, bottom: -0.5, near: 0.5, far: 8 }),
      (key.shadow.bias = -5e-4),
      group.add(key));
    let rim = new DirectionalLight(10139903, 1.6);
    (rim.position.set(-2, 2, -2.5), group.add(rim));
  }
  let hero = null,
    lookKey = '',
    spin = 0,
    pending = null,
    token = 0;
  return {
    group,
    get character() {
      return hero;
    },
    async set(sheet, opts = {}) {
      let look = heroLook(sheet || {}, opts),
        key = JSON.stringify(look);
      if (key === lookKey && hero) return hero;
      lookKey = key;
      let myToken = ++token;
      pending = buildHumanoid(look);
      let built = await pending;
      return (
        await allTexturesReady(),
        myToken !== token
          ? (built.dispose(), hero)
          : (hero && hero.dispose(),
            (hero = built),
            (hero.userData.sheet = sheet),
            turntable.add(hero.root),
            hero.play('idle', 0),
            hero)
      );
    },
    drag(dx) {
      ((turntable.rotation.y += dx * 0.012), (spin = dx * 0.6));
    },
    play(name) {
      hero && (hero.isLoop(name) ? hero.play(name) : hero.playOnce(name));
    },
    update(dt) {
      if ((hero && hero.update(dt), Math.abs(spin) > 0.01))
        ((turntable.rotation.y += spin * dt), (spin *= Math.max(0, 1 - dt * 3)));
      else {
        let delta = MathUtils.degToRad(-12) - turntable.rotation.y;
        ((delta = Math.atan2(Math.sin(delta), Math.cos(delta))),
          (turntable.rotation.y += delta * Math.min(1, dt * 0.8)));
      }
    },
    frame(camera, mode = 'cuerpo') {
      let height = hero ? hero.height : 1.8,
        k = Math.max(0.6, height / 1.8);
      mode === 'retrato'
        ? (camera.position.set(0, height * 0.92, 1.25 * k + 0.4), camera.lookAt(0, height * 0.86, 0))
        : (camera.position.set(0, height * 0.62 + 0.2, 4 * k + 0.6), camera.lookAt(0, height * 0.48, 0));
    },
    dispose() {
      (token++,
        hero && hero.dispose(),
        (hero = null),
        group.removeFromParent(),
        group.traverse((obj) => {
          obj.isMesh && (obj.geometry.dispose(), obj.material.dispose?.());
        }));
    },
  };
}

export { createHeroPreview };
