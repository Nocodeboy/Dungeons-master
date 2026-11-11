// scenes/menu.js — Escena «menu»: menú principal (continuar, nueva partida, cargar, ajustes, ayuda,
// créditos) sobre un fondo 3D: el toro de granito en su pedestal con la grieta que brilla, cielo nocturno
// (o del alba), pinos, rocas, hierba y luciérnagas. El fondo (buildBackdrop) lo reutiliza scenes/ending.js.
// La registra main.js.
// Reconstruido de publicado/juego.js (módulo __esm «Iv»).

import {
  AdditiveBlending,
  BackSide,
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  FogExp2,
  Group,
  HemisphereLight,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { loadGLTF, pbrMaterial } from '../assets.js';
import { iconHtml, escapeHtml, elem, Yl, Kl } from '../ui/dom.js';

/** Geometría de la grieta luminosa del pedestal (tiras con una rama), siempre igual (semilla fija). */
function crackGeometry() {
  let seed = 7,
    rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647,
    verts = [],
    addStrip = (pts, w0, w1) => {
      for (let k = 0; k < pts.length - 1; k++) {
        let [x0, y0] = pts[k],
          [x1, y1] = pts[k + 1],
          wa = w0 + (w1 - w0) * (k / (pts.length - 1)),
          wb = w0 + (w1 - w0) * ((k + 1) / (pts.length - 1));
        verts.push(
          x0 - wa,
          y0,
          0,
          x0 + wa,
          y0,
          0,
          x1 + wb,
          y1,
          0,
          x0 - wa,
          y0,
          0,
          x1 + wb,
          y1,
          0,
          x1 - wb,
          y1,
          0,
        );
      }
    },
    main = [],
    x = 0;
  for (let k = 0; k <= 9; k++) (main.push([x, (k / 9) * 0.88]), (x += (rand() - 0.5) * 0.09));
  addStrip(main, 0.022, 0.006);
  let [bx, by] = main[4];
  addStrip(
    [
      [bx, by],
      [bx + 0.07, by + 0.1],
      [bx + 0.1, by + 0.2],
      [bx + 0.16, by + 0.26],
    ],
    0.012,
    0.003,
  );
  let geo = new BufferGeometry();
  return (
    geo.setAttribute('position', new Float32BufferAttribute(verts, 3)),
    geo.computeVertexNormals(),
    geo
  );
}
/**
 * Fondo 3D del menú y del final. Devuelve {scene, sun, statue, update(dt, camera), dispose}; `update`
 * mueve las luciérnagas, hace parpadear las luces y gira la cámara despacio.
 */
async function buildBackdrop(game, { dawn = !1 } = {}) {
  let low = game.quality?.low,
    scene = new Scene(),
    bg = new Color(dawn ? 3813448 : 856608);
  ((scene.background = bg), (scene.fog = new FogExp2(dawn ? 4864586 : 1054246, dawn ? 0.03 : 0.045)));
  let disposables = [],
    track = (obj) => (disposables.push(obj), obj),
    skyMat = track(
      new ShaderMaterial({
        side: BackSide,
        depthWrite: !1,
        fog: !1,
        uniforms: {
          uTop: { value: new Color(dawn ? 2898534 : 461332) },
          uMid: { value: new Color(dawn ? 14256730 : 1712696) },
          uLow: { value: new Color(dawn ? 16763018 : 3811888) },
          uMoon: { value: new Vector3(-0.45, 0.42, -0.78).normalize() },
          uDawn: { value: dawn ? 1 : 0 },
        },
        vertexShader:
          'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader: `uniform vec3 uTop, uMid, uLow, uMoon; uniform float uDawn; varying vec3 vD;
        float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
        void main(){
          float y = vD.y;
          vec3 c = mix(uLow, uMid, smoothstep(-0.05, 0.18, y));
          c = mix(c, uTop, smoothstep(0.15, 0.7, y));
          float m = max(dot(vD, uMoon), 0.0);
          c += vec3(0.9, 0.92, 1.0) * smoothstep(0.9975, 0.9985, m) * (1.0 - uDawn);
          c += vec3(0.35, 0.4, 0.55) * pow(m, 60.0) * 0.6 * (1.0 - uDawn);
          vec3 q = floor(vD * 420.0);
          float st = step(0.9975, hash(q)) * smoothstep(0.1, 0.5, y) * (1.0 - uDawn);
          c += vec3(st) * 0.8;
          gl_FragColor = vec4(c, 1.0);
        }`,
      }),
    );
  scene.add(new Mesh(track(new SphereGeometry(180, 32, 16)), skyMat));
  let hemi = new HemisphereLight(dawn ? 16767152 : 5925530, dawn ? 4861984 : 1709072, dawn ? 1.2 : 0.75);
  scene.add(hemi);
  let sun = new DirectionalLight(dawn ? 16763024 : 10466536, dawn ? 2.6 : 1.5);
  (sun.position.set(-14, 16, -18),
    (sun.castShadow = !low),
    sun.shadow.mapSize.set(1024, 1024),
    (sun.shadow.camera.left = sun.shadow.camera.bottom = -12),
    (sun.shadow.camera.right = sun.shadow.camera.top = 12),
    (sun.shadow.bias = -5e-4),
    scene.add(sun));
  let crackLight = new PointLight(16722452, dawn ? 1.5 : 6, 6, 2);
  (crackLight.position.set(0.3, 1.4, 1.6), scene.add(crackLight));
  let torch = new PointLight(16752720, dawn ? 0 : 14, 16, 2);
  (torch.position.set(6, 2.2, 3.5), scene.add(torch));
  let groundGeo = track(new PlaneGeometry(90, 90, 60, 60));
  groundGeo.rotateX(-Math.PI / 2);
  let posAttr = groundGeo.attributes.position;
  for (let k = 0; k < posAttr.count; k++) {
    let x = posAttr.getX(k),
      z = posAttr.getZ(k);
    posAttr.setY(
      k,
      Math.sin(x * 0.12) * 0.35 + Math.cos(z * 0.09) * 0.45 - Math.max(0, Math.hypot(x, z) - 6) * 0.05,
    );
  }
  groundGeo.computeVertexNormals();
  let groundMat = pbrMaterial('leafy_grass', { repeat: [22, 22], tint: dawn ? 10133616 : 6978138 }),
    ground = new Mesh(groundGeo, groundMat);
  ((ground.receiveShadow = !0), scene.add(ground));
  let statue = new Group(),
    pedestal = new Mesh(
      track(new BoxGeometry(3.6, 0.9, 1.9)),
      pbrMaterial('stacked_stone_wall', { repeat: [2.2, 0.6], tint: 12103840 }),
    );
  ((pedestal.position.y = 0.45), (pedestal.castShadow = pedestal.receiveShadow = !0), statue.add(pedestal));
  let base = new Mesh(
    track(new BoxGeometry(4.2, 0.22, 2.5)),
    pbrMaterial('monastery_stone_floor', { repeat: [1.6, 1] }),
  );
  ((base.position.y = 0.11), (base.receiveShadow = !0), statue.add(base));
  try {
    let gltf = await loadGLTF('assets/nature/Bull.json'),
      bull = clone(gltf.scene),
      rock = pbrMaterial('rock_ground', { ao: !1 }),
      stoneMat = track(new MeshStandardMaterial({ color: 11051668, roughness: 0.92, map: rock.map }));
    ((stoneMat.onBeforeCompile = (shader) => {
      ((shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          `#include <common>
varying vec3 vTp; varying vec3 vTn;`,
        )
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
vTp = (modelMatrix * vec4(transformed, 1.0)).xyz; vTn = normalize(mat3(modelMatrix) * objectNormal);`,
        )),
        (shader.fragmentShader = shader.fragmentShader
          .replace(
            '#include <common>',
            `#include <common>
varying vec3 vTp; varying vec3 vTn;`,
          )
          .replace(
            '#include <map_fragment>',
            `vec3 bw = pow(abs(normalize(vTn)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
         vec3 tx = texture2D(map, vTp.zy * 0.6).rgb * bw.x + texture2D(map, vTp.xz * 0.6).rgb * bw.y + texture2D(map, vTp.xy * 0.6).rgb * bw.z;
         diffuseColor.rgb *= tx * 1.7;`,
          )));
    }),
      (stoneMat.customProgramCacheKey = () => 'piedra-triplanar-menu'),
      bull.traverse((obj) => {
        obj.isMesh &&
          ((obj.material = stoneMat),
          (obj.castShadow = !0),
          (obj.receiveShadow = !0),
          (obj.frustumCulled = !1));
      }),
      (bull.rotation.y = Math.PI / 2),
      statue.add(bull),
      statue.updateMatrixWorld(!0));
    let box = new Box3().setFromObject(bull, !0),
      size = box.getSize(new Vector3());
    (bull.scale.multiplyScalar(3 / Math.max(size.x, size.z)),
      statue.updateMatrixWorld(!0),
      (box = new Box3().setFromObject(bull, !0)),
      (bull.position.y += 0.9 - box.min.y),
      (bull.position.x -= (box.min.x + box.max.x) / 2),
      (bull.position.z -= (box.min.z + box.max.z) / 2));
  } catch (err) {
    console.warn('[men\xFA] toro', err);
  }
  let crackMat = track(
      new MeshStandardMaterial({
        color: 2753283,
        emissive: 16722448,
        emissiveIntensity: dawn ? 0.6 : 2.2,
        roughness: 0.2,
      }),
    ),
    crack = new Mesh(track(crackGeometry()), crackMat);
  (crack.position.set(0.3, 0.05, 0.957), statue.add(crack));
  let pool = new Mesh(
    track(new CircleGeometry(0.42, 24)),
    track(
      new MeshStandardMaterial({
        color: 1835780,
        emissive: 3801092,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.2,
      }),
    ),
  );
  ((pool.rotation.x = -Math.PI / 2),
    pool.scale.set(1.3, 0.75, 1),
    pool.position.set(0.35, 0.235, 1.05),
    statue.add(pool),
    scene.add(statue));
  let rand = (() => {
    let seed = 7;
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  })();
  /**
   * Esparce instancias de un modelo de assets/nature en un anillo alrededor del toro (radio y escala
   * aleatorios, sin tapar el frente).
   */
  async function scatter(name, count, rMin, rMax, sMin, sMax, tint) {
    try {
      let gltf = await loadGLTF(`assets/nature/${name}.json`);
      gltf.scene.updateMatrixWorld(!0);
      let base = new Matrix4(),
        m = new Matrix4(),
        q = new Quaternion(),
        mats = [];
      for (let i = 0; i < count; i++) {
        let angle = rand() * Math.PI * 2,
          r = rMin + rand() * (rMax - rMin),
          x = Math.cos(angle) * r,
          z = Math.sin(angle) * r;
        if (z > 4 && Math.abs(x) < 9) continue;
        let s = sMin + rand() * (sMax - sMin);
        (q.setFromAxisAngle(new Vector3(0, 1, 0), rand() * Math.PI * 2),
          mats.push(
            base
              .clone()
              .compose(
                new Vector3(
                  x,
                  Math.sin(x * 0.12) * 0.35 +
                    Math.cos(z * 0.09) * 0.45 -
                    Math.max(0, Math.hypot(x, z) - 6) * 0.05 -
                    0.05,
                  z,
                ),
                q,
                new Vector3(s, s, s),
              ),
          ));
      }
      gltf.scene.traverse((obj) => {
        if (!obj.isMesh) return;
        let mat = obj.material;
        tint && ((mat = mat.clone()), mat.color.multiply(new Color(tint)), disposables.push(mat));
        let mesh = new InstancedMesh(obj.geometry, mat, mats.length);
        (mats.forEach((mt, j) => mesh.setMatrixAt(j, m.multiplyMatrices(mt, obj.matrixWorld))),
          (mesh.castShadow = !low),
          (mesh.receiveShadow = !0),
          scene.add(mesh));
      });
    } catch (err) {
      console.warn('[men\xFA]', name, err);
    }
  }
  await Promise.all([
    scatter('Pine_1', low ? 18 : 34, 9, 30, 0.9, 1.6, dawn ? 9083514 : 5925466),
    scatter('Pine_3', low ? 10 : 20, 11, 34, 0.9, 1.5, dawn ? 9083514 : 5925466),
    scatter('Rock_Medium_1', 10, 4, 14, 0.6, 1.3),
    scatter('Rock_Medium_3', 8, 5, 16, 0.5, 1.1),
    low ? null : scatter('Grass_Wispy_Tall', 140, 2.6, 14, 0.8, 1.4, 10133632),
  ]);
  let nMotes = low ? 50 : 130,
    motePos = new Float32Array(nMotes * 3),
    phase = new Float32Array(nMotes);
  for (let k = 0; k < nMotes; k++) {
    let angle = rand() * Math.PI * 2,
      r = 2.5 + rand() * 12;
    ((motePos[k * 3] = Math.cos(angle) * r),
      (motePos[k * 3 + 1] = 0.3 + rand() * 2.4),
      (motePos[k * 3 + 2] = Math.sin(angle) * r),
      (phase[k] = rand() * 100));
  }
  let moteGeo = track(new BufferGeometry());
  moteGeo.setAttribute('position', new BufferAttribute(motePos, 3));
  let motes = new Points(
    moteGeo,
    track(
      new PointsMaterial({
        color: dawn ? 16771264 : 14221194,
        size: 0.09,
        transparent: !0,
        opacity: 0.85,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
    ),
  );
  scene.add(motes);
  let moteBase = motePos.slice(),
    time = 0,
    shift = dawn ? 0 : 1;
  return {
    scene,
    sun,
    statue,
    update(dt, camera) {
      time += dt;
      for (let k = 0; k < nMotes; k++)
        ((motePos[k * 3] = moteBase[k * 3] + Math.sin(time * 0.4 + phase[k]) * 0.6),
          (motePos[k * 3 + 1] = moteBase[k * 3 + 1] + Math.sin(time * 0.7 + phase[k] * 2) * 0.35),
          (motePos[k * 3 + 2] = moteBase[k * 3 + 2] + Math.cos(time * 0.35 + phase[k]) * 0.6));
      if (
        ((moteGeo.attributes.position.needsUpdate = !0),
        (motes.material.opacity = 0.6 + Math.sin(time * 3) * 0.25),
        (crackLight.intensity = (dawn ? 1.2 : 5.5) + Math.sin(time * 2.2) * 1.2 + Math.sin(time * 9.1) * 0.4),
        (crackMat.emissiveIntensity = (dawn ? 0.5 : 2) + Math.sin(time * 2.2) * 0.5),
        (torch.intensity = dawn ? 0 : 13 + Math.sin(time * 13) * 1.2 + Math.sin(time * 7.7) * 1.4),
        camera)
      ) {
        let portrait = innerHeight > innerWidth * 1.1,
          yaw = -0.45 + Math.sin(time * 0.045) * 0.4,
          dist = portrait ? 15 : 11.5;
        (camera.position.set(Math.sin(yaw) * dist, 2.9 + Math.sin(time * 0.08) * 0.25, Math.cos(yaw) * dist),
          camera.lookAt(0, 1.5, 0));
        let vw = innerWidth,
          vh = innerHeight;
        shift &&
          camera.setViewOffset(
            vw,
            vh,
            portrait ? 0 : -vw * 0.2 * shift,
            portrait ? vh * 0.16 * shift : 0,
            vw,
            vh,
          );
      }
    },
    dispose() {
      for (let obj of disposables) obj.dispose?.();
      scene.clear();
    },
  };
}
/** Crea la escena del menú principal (exportada como `create`). Al entrar descarta la campaña activa. */
async function crearEscenaMenu(game) {
  let ui = game.ui;
  (await ui.ready, ui.loading('Encendiendo las antorchas'));
  let stage = game.stage,
    camera = stage.camera,
    controls = stage.controls,
    saved = {
      enabled: controls.enabled,
      min: controls.minDistance,
      max: controls.maxDistance,
      minP: controls.minPolarAngle,
      maxP: controls.maxPolarAngle,
      damping: controls.enableDamping,
      target: controls.target.clone(),
    };
  (Object.assign(controls, {
    enabled: !1,
    enableDamping: !1,
    minDistance: 0.1,
    maxDistance: 200,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
  }),
    controls.target.set(0, 1.5, 0));
  let backdrop = await buildBackdrop(game);
  ((game.store.cp = null), ui.hud.hide());
  let root = elem('div.mg-menu');
  ((root.innerHTML = `
    <div class="mg-menu-col">
      <div class="mg-menu-title">
        <span class="mg-menu-pre">Marca de</span>
        <h1>Granito</h1>
        <span class="mg-menu-cap">Cap\xEDtulo I \xB7 <em>El toro que sangra</em></span>
      </div>
      <nav class="mg-menu-nav" aria-label="Men\xFA principal"></nav>
    </div>
    <footer class="mg-menu-foot"><span>${escapeHtml(VERSION_LABEL)} \xB7 Compatible con la quinta edici\xF3n (SRD 5.2.1)</span></footer>`),
    ui.root.append(root));
  let nav = root.querySelector('.mg-menu-nav'),
    saves = await game.store.list().catch(() => []),
    last = saves[0],
    addButton = (label, icon, onclick, { primary, sub, key } = {}) => {
      let btn = elem(`button.mg-menu-btn${primary ? '.primary' : ''}`, { onclick });
      return (
        (btn.innerHTML = `${iconHtml(icon)}<span class="t"><b>${escapeHtml(label)}</b>${sub ? `<small>${sub}</small>` : ''}</span>`),
        key && (btn.dataset.k = key),
        nav.append(btn),
        btn
      );
    },
    unlockAudio = () => game.audio?.unlock?.();
  (root.addEventListener('pointerdown', unlockAudio, { once: !0 }),
    addEventListener('keydown', unlockAudio, { once: !0 }));
  /** Carga una ranura guardada y reanuda la partida. */
  async function loadSlot(slot) {
    ui.loading('Abriendo la partida');
    let cp = await game.store.load(slot);
    if (!cp) {
      (ui.loading(null), ui.toast('No se ha podido cargar esa partida.', 'mal'));
      return;
    }
    let res = ui.R.call('cp_load', { cp });
    (res?.cp && !res.error && game.store.set(res.cp), ui.resume());
  }
  if (last) {
    let meta = last.meta || {};
    addButton('Continuar', 'play', () => loadSlot(last.slot), {
      primary: !0,
      key: 'continuar',
      sub: `${escapeHtml(meta.hero || 'Sin nombre')} \xB7 nivel ${escapeHtml(meta.level || 1)} \xB7 ${escapeHtml(meta.place || '')}${meta.savedAt ? ` \xB7 ${escapeHtml(Kl(meta.savedAt))}` : ''}`,
    });
  }
  return (
    addButton(
      'Nueva partida',
      'quill',
      async () => {
        (saves.length &&
          !(await ui.confirm(
            'Empezar\xE1s con un h\xE9roe nuevo. Tus partidas guardadas se conservan; el guardado autom\xE1tico se sustituir\xE1 por el de la nueva partida.',
            { titulo: 'Nueva partida', si: 'Crear un h\xE9roe', no: 'Cancelar' },
          ))) ||
          game.go('creator');
      },
      { primary: !last, key: 'nueva', sub: last ? '' : 'Crea a tu h\xE9roe y parte hacia Merrowick' },
    ),
    (addButton(
      'Cargar partida',
      'load',
      async () => {
        (await ui.open('cargar'))?.slot && ui.resume();
      },
      {
        key: 'cargar',
        sub: saves.length
          ? `${saves.length} ${saves.length === 1 ? 'partida guardada' : 'partidas guardadas'}`
          : 'No hay partidas guardadas',
      },
    ).disabled = !saves.length),
    addButton('Ajustes', 'settings', () => ui.open('ajustes'), { key: 'ajustes' }),
    addButton('C\xF3mo se juega', 'open_book', () => ui.open('ayuda'), { key: 'ayuda' }),
    addButton('Cr\xE9ditos', 'scroll_quill', () => ui.open('creditos'), { key: 'creditos' }),
    last?.meta?.playtime &&
      nav
        .querySelector('[data-k="continuar"] small')
        .insertAdjacentHTML('beforeend', ` \xB7 ${escapeHtml(Yl(last.meta.playtime))}`),
    requestAnimationFrame(() => nav.querySelector('button:not(:disabled)')?.focus({ preventScroll: !0 })),
    nav.addEventListener('keydown', (ev) => {
      if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
      let btns = [...nav.querySelectorAll('button:not(:disabled)')],
        idx = btns.indexOf(document.activeElement);
      (btns[(idx + (ev.key === 'ArrowDown' ? 1 : btns.length - 1) + btns.length) % btns.length]?.focus(),
        ev.preventDefault());
    }),
    game.audio?.music?.('menu', { fade: 2 }),
    ui.loading(null),
    {
      three: backdrop.scene,
      sun: backdrop.sun,
      update(dt) {
        backdrop.update(dt, camera);
      },
      dispose() {
        ((root.style.transition = 'opacity .35s'),
          (root.style.opacity = '0'),
          (root.style.pointerEvents = 'none'),
          setTimeout(() => root.remove(), 400),
          backdrop.dispose(),
          camera.clearViewOffset(),
          Object.assign(controls, {
            enabled: saved.enabled,
            minDistance: saved.min,
            maxDistance: saved.max,
            minPolarAngle: saved.minP,
            maxPolarAngle: saved.maxP,
            enableDamping: saved.damping,
          }),
          controls.target.copy(saved.target));
      },
    }
  );
}
/** Texto de versión del pie del menú. */
const VERSION_LABEL = 'Cap\xEDtulo I \xB7 versi\xF3n web 0.9';

export { buildBackdrop, crearEscenaMenu as create };
