// actors/animals.js
// Reconstruido de publicado/juego.js (módulo __esm «bv»).
//
// Animales (assets/animals/*.json): carga y clona el modelo, lo tiñe y escala a su altura, crea
// por código los clips de andar y comer de los de granja que no los traen y devuelve un Character.
// wander da un comportamiento de pasto (reposo, comer, paseos cortos y huida). Lo usan index.js
// (makeAnimal, makeMonster para lobos y caballos), portraits.js y la exploración (wander).

import {
  AnimationClip,
  AnimationMixer,
  Box3,
  Group,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { loadGLTF } from '../assets.js';
import { Character } from './character.js';
import { QUADRUPED_CLIPS, FARM_ANIMAL_CLIPS } from './anims.js';
import { seededRandom } from './appearance.js';
import { addRimLight } from './materials.js';

/** Especie de ANIMAL_DEFS para un id (también acepta los alias en inglés de ANIMAL_ALIASES); null si no hay. */
function resolveAnimalKind(kind) {
  return ANIMAL_DEFS[kind] ? kind : ANIMAL_ALIASES[kind] || null;
}
/** Añade a los clips de un animal de granja «Walk» (patas en diagonal) y «Eating» (cuello abajo) hechos por código. */
function addFarmClips(model, clips) {
  let bones = {};
  model.traverse((obj) => {
    obj.isBone && (bones[obj.name.replace(/_\d+$/, '')] = obj);
  });
  let out = new Map(clips),
    rotated = (bone, axis, angle) =>
      bone.quaternion.clone().multiply(new Quaternion().setFromAxisAngle(axis, angle)),
    xAxis = new Vector3(1, 0, 0),
    track = (bone, fn, dur, steps = 16) => {
      let times = [],
        values = [];
      for (let k = 0; k <= steps; k++) {
        let t = (k / steps) * dur;
        (times.push(t), values.push(...fn(t / dur).toArray()));
      }
      return new QuaternionKeyframeTrack(`${bone.name}.quaternion`, times, values);
    },
    gaitPhases = [
      ['FrontUpLeg_L', 0],
      ['BackUpLeg_R', 0],
      ['FrontUpLeg_R', 0.5],
      ['BackUpLeg_L', 0.5],
    ];
  if (bones.FrontUpLeg_L) {
    let walkTracks = [];
    for (let [name, phase] of gaitPhases) {
      let upper = bones[name];
      upper &&
        walkTracks.push(
          track(upper, (f) => rotated(upper, xAxis, Math.sin((f + phase) * Math.PI * 2) * 0.45), 0.9),
        );
      let lower = bones[name.replace('Up', 'Low')];
      lower &&
        walkTracks.push(
          track(
            lower,
            (f) => rotated(lower, xAxis, Math.max(0, Math.sin((f + phase + 0.25) * Math.PI * 2)) * -0.5),
            0.9,
          ),
        );
    }
    (bones.Head &&
      walkTracks.push(
        track(bones.Head, (f) => rotated(bones.Head, xAxis, Math.sin(f * Math.PI * 4) * 0.06), 0.9),
      ),
      out.set('Walk', new AnimationClip('Walk', 0.9, walkTracks)));
    let eatTracks = [],
      eatDur = 3;
    (bones.Neck &&
      eatTracks.push(
        track(
          bones.Neck,
          (f) =>
            rotated(
              bones.Neck,
              xAxis,
              (0.8 - Math.abs(Math.sin(f * Math.PI)) * 0.1) * Math.min(1, Math.sin(f * Math.PI) * 4),
            ),
          eatDur,
          24,
        ),
      ),
      bones.Head &&
        eatTracks.push(
          track(
            bones.Head,
            (f) =>
              rotated(
                bones.Head,
                xAxis,
                Math.sin(f * Math.PI * 10) * 0.08 + 0.2 * Math.min(1, Math.sin(f * Math.PI) * 4),
              ),
            eatDur,
            24,
          ),
        ),
      eatTracks.length && out.set('Eating', new AnimationClip('Eating', eatDur, eatTracks)));
  }
  return out;
}
/** Crea un animal animado de la especie `kind`; `index` varía tamaño y tono, `tint` cambia colores por material. */
async function buildAnimal(kind, { index = 0, tint = null } = {}) {
  let id = resolveAnimalKind(kind);
  if (!id) throw new Error(`animal desconocido: ${kind}`);
  let def = ANIMAL_DEFS[id],
    gltf = await loadGLTF(`assets/animals/${def.file}.json`),
    model = clone(gltf.scene),
    rand = seededRandom(index * 31 + id.length),
    tints = { ...(def.tint || {}), ...(tint || {}) },
    shade = 0.9 + rand() * 0.2;
  if (
    (model.traverse((obj) => {
      if (!obj.isMesh) return;
      ((obj.castShadow = !0),
        (obj.receiveShadow = !0),
        (obj.frustumCulled = !1),
        (obj.material = obj.material.clone()));
      let color = tints[obj.material.name];
      (color && obj.material.color.set(color),
        /Eye/.test(obj.material.name) || obj.material.color.multiplyScalar(shade),
        (obj.material.roughness = 0.85),
        (obj.material.metalness = 0),
        addRimLight(obj.material));
    }),
    !boundsCache.has(id))
  ) {
    let box = new Box3().setFromObject(gltf.scene, !0);
    boundsCache.set(id, box);
  }
  let box = boundsCache.get(id),
    scale = (def.height / Math.max(0.01, box.max.y - box.min.y)) * (0.95 + rand() * 0.1),
    holder = new Group();
  (holder.add(model), model.scale.multiplyScalar(scale), (model.position.y = -box.min.y * scale));
  let root = new Group();
  ((root.name = `animal_${id}`),
    root.add(holder),
    root.updateMatrixWorld(!0),
    model.traverse((obj) => {
      obj.isSkinnedMesh &&
        (obj.skeleton.update(),
        obj.computeBoundingSphere(),
        (obj.boundingSphere.radius *= 1.8),
        (obj.frustumCulled = !0));
    }));
  let mixer = new AnimationMixer(model),
    clips = new Map(gltf.animations.map((clip) => [clip.name, clip]));
  def.farm && !def.bird && (clips = addFarmClips(model, clips));
  let anims = def.farm
      ? {
          ...FARM_ANIMAL_CLIPS,
          ...(def.bird
            ? {
                walk: ['Walk'],
                eat: ['Yes', 'Idle'],
                attack_melee: ['Bite_Front'],
                hit: ['HitRecieve'],
                die: ['Death'],
                cheer: ['Dance'],
              }
            : {}),
        }
      : QUADRUPED_CLIPS,
    head = model.getObjectByName('Head') || model.getObjectByName('Head_1') || null,
    character = new Character({
      id,
      kind: 'animal',
      root,
      model: holder,
      mixer,
      clips,
      anims,
      head,
      height: def.height,
      radius: def.height * 0.45,
      gait: { walk: def.height * 0.9, run: def.height * 3.6, sprint: def.height * 3.6 },
    });
  return (
    (character.speed = def.height > 1.2 ? 1.1 : 0.7),
    (character.userData.kind = id),
    character.play('idle', 0),
    character.current && (character.current.time = rand() * character.current.getClip().duration),
    character
  );
}
/**
 * Comportamiento de pasto para un animal en `home`: alterna reposo, comer y paseos dentro de `radius`.
 * Devuelve {update(dt), flee(desde)}; flee lo hace correr 6 m en dirección contraria.
 */
function wander(animal, home, { radius = 1.2, seed = 1, speed } = {}) {
  let rand = seededRandom(seed),
    state = { mode: 'idle', t: 1 + rand() * 4, home: home.clone(), radius },
    idles = ['idle', 'eat', 'idle_alt', 'eat'];
  return (
    animal.root.position.copy(home),
    (animal.root.rotation.y = rand() * Math.PI * 2),
    animal.play(idles[Math.floor(rand() * idles.length)]),
    {
      update(dt) {
        if (((state.t -= dt), state.mode === 'walk')) {
          (!animal.path.length || state.t <= 0) &&
            ((animal.path = []),
            (state.mode = 'idle'),
            (state.t = 3 + rand() * 6),
            animal.play(idles[Math.floor(rand() * idles.length)], 0.4));
          return;
        }
        if (!(state.t > 0))
          if (state.radius > 0.1 && rand() < 0.5) {
            let ang = rand() * Math.PI * 2,
              dist = 0.3 + rand() * state.radius;
            ((state.mode = 'walk'),
              (state.t = 9),
              (animal.speed = speed ?? animal.speed),
              animal.walkTo(
                [state.home.clone().add(new Vector3(Math.cos(ang) * dist, 0, Math.sin(ang) * dist))],
                null,
                {
                  anim: 'walk',
                },
              ));
          } else ((state.t = 3 + rand() * 6), animal.play(idles[Math.floor(rand() * idles.length)], 0.4));
      },
      flee(from) {
        let away = animal.root.position.clone().sub(from);
        ((away.y = 0), away.lengthSq() < 1e-4 && away.set(1, 0, 0));
        let target = animal.root.position.clone().addScaledVector(away.normalize(), 6);
        (state.home.copy(target), (state.radius = 0.8), (state.mode = 'walk'), (state.t = 10));
        let baseSpeed = animal.speed;
        ((animal.speed = baseSpeed * 2.5),
          animal.walkTo(
            [target],
            () => {
              animal.speed = baseSpeed;
            },
            { anim: 'run' },
          ));
      },
    }
  );
}
/** Especies de animal: archivo del modelo, altura (m) y si es de granja o ave. */
const ANIMAL_DEFS = {
  oveja: { file: 'oveja', height: 0.85, farm: !0 },
  cerdo: { file: 'cerdo', height: 0.62, farm: !0 },
  gallina: { file: 'gallina', height: 0.38, farm: !0, bird: !0 },
  vaca: { file: 'vaca', height: 1.45 },
  toro: { file: 'toro', height: 1.55 },
  caballo: { file: 'caballo', height: 1.7 },
  burro: { file: 'burro', height: 1.25 },
  perro: { file: 'perro', height: 0.55 },
  ciervo: { file: 'ciervo', height: 1.35 },
  alce: { file: 'alce', height: 2.15 },
  lobo: { file: 'lobo', height: 0.9 },
  mastin: { file: 'mastin', height: 0.85 },
};
/** Ids en inglés (de reglas o niveles) → especie. */
const ANIMAL_ALIASES = {
  sheep: 'oveja',
  pig: 'cerdo',
  chicken: 'gallina',
  hen: 'gallina',
  cow: 'vaca',
  bull: 'toro',
  horse: 'caballo',
  riding_horse: 'caballo',
  donkey: 'burro',
  dog: 'perro',
  deer: 'ciervo',
  elk: 'alce',
  stag: 'alce',
  wolf: 'lobo',
  mastiff: 'mastin',
};
const ANIMAL_KINDS = [
  'oveja',
  'cerdo',
  'gallina',
  'vaca',
  'toro',
  'caballo',
  'burro',
  'perro',
  'ciervo',
  'alce',
  'lobo',
  'mastin',
];
const boundsCache = new Map();

export { ANIMAL_DEFS, ANIMAL_KINDS, buildAnimal, resolveAnimalKind, wander };
