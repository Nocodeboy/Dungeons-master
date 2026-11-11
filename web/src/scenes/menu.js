// scenes/menu.js
// Reconstruido de publicado/juego.js (módulo __esm «Iv»). Nombres locales aún minificados.

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

function hD() {
  let o = 7,
    e = () => (o = (o * 16807) % 2147483647) / 2147483647,
    t = [],
    a = (c, d, u) => {
      for (let h = 0; h < c.length - 1; h++) {
        let [p, m] = c[h],
          [_, b] = c[h + 1],
          f = d + (u - d) * (h / (c.length - 1)),
          v = d + (u - d) * ((h + 1) / (c.length - 1));
        t.push(p - f, m, 0, p + f, m, 0, _ + v, b, 0, p - f, m, 0, _ + v, b, 0, _ - v, b, 0);
      }
    },
    n = [],
    s = 0;
  for (let c = 0; c <= 9; c++) (n.push([s, (c / 9) * 0.88]), (s += (e() - 0.5) * 0.09));
  a(n, 0.022, 0.006);
  let [i, r] = n[4];
  a(
    [
      [i, r],
      [i + 0.07, r + 0.1],
      [i + 0.1, r + 0.2],
      [i + 0.16, r + 0.26],
    ],
    0.012,
    0.003,
  );
  let l = new BufferGeometry();
  return (l.setAttribute('position', new Float32BufferAttribute(t, 3)), l.computeVertexNormals(), l);
}
async function buildBackdrop(o, { dawn: e = !1 } = {}) {
  let t = o.quality?.low,
    a = new Scene(),
    n = new Color(e ? 3813448 : 856608);
  ((a.background = n), (a.fog = new FogExp2(e ? 4864586 : 1054246, e ? 0.03 : 0.045)));
  let s = [],
    i = (P) => (s.push(P), P),
    r = i(
      new ShaderMaterial({
        side: BackSide,
        depthWrite: !1,
        fog: !1,
        uniforms: {
          uTop: { value: new Color(e ? 2898534 : 461332) },
          uMid: { value: new Color(e ? 14256730 : 1712696) },
          uLow: { value: new Color(e ? 16763018 : 3811888) },
          uMoon: { value: new Vector3(-0.45, 0.42, -0.78).normalize() },
          uDawn: { value: e ? 1 : 0 },
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
  a.add(new Mesh(i(new SphereGeometry(180, 32, 16)), r));
  let l = new HemisphereLight(e ? 16767152 : 5925530, e ? 4861984 : 1709072, e ? 1.2 : 0.75);
  a.add(l);
  let c = new DirectionalLight(e ? 16763024 : 10466536, e ? 2.6 : 1.5);
  (c.position.set(-14, 16, -18),
    (c.castShadow = !t),
    c.shadow.mapSize.set(1024, 1024),
    (c.shadow.camera.left = c.shadow.camera.bottom = -12),
    (c.shadow.camera.right = c.shadow.camera.top = 12),
    (c.shadow.bias = -5e-4),
    a.add(c));
  let d = new PointLight(16722452, e ? 1.5 : 6, 6, 2);
  (d.position.set(0.3, 1.4, 1.6), a.add(d));
  let u = new PointLight(16752720, e ? 0 : 14, 16, 2);
  (u.position.set(6, 2.2, 3.5), a.add(u));
  let h = i(new PlaneGeometry(90, 90, 60, 60));
  h.rotateX(-Math.PI / 2);
  let p = h.attributes.position;
  for (let P = 0; P < p.count; P++) {
    let I = p.getX(P),
      U = p.getZ(P);
    p.setY(
      P,
      Math.sin(I * 0.12) * 0.35 + Math.cos(U * 0.09) * 0.45 - Math.max(0, Math.hypot(I, U) - 6) * 0.05,
    );
  }
  h.computeVertexNormals();
  let m = pbrMaterial('leafy_grass', { repeat: [22, 22], tint: e ? 10133616 : 6978138 }),
    _ = new Mesh(h, m);
  ((_.receiveShadow = !0), a.add(_));
  let b = new Group(),
    f = new Mesh(
      i(new BoxGeometry(3.6, 0.9, 1.9)),
      pbrMaterial('stacked_stone_wall', { repeat: [2.2, 0.6], tint: 12103840 }),
    );
  ((f.position.y = 0.45), (f.castShadow = f.receiveShadow = !0), b.add(f));
  let v = new Mesh(
    i(new BoxGeometry(4.2, 0.22, 2.5)),
    pbrMaterial('monastery_stone_floor', { repeat: [1.6, 1] }),
  );
  ((v.position.y = 0.11), (v.receiveShadow = !0), b.add(v));
  try {
    let P = await loadGLTF('assets/nature/Bull.json'),
      I = clone(P.scene),
      U = pbrMaterial('rock_ground', { ao: !1 }),
      j = i(new MeshStandardMaterial({ color: 11051668, roughness: 0.92, map: U.map }));
    ((j.onBeforeCompile = (Z) => {
      ((Z.vertexShader = Z.vertexShader
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
        (Z.fragmentShader = Z.fragmentShader
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
      (j.customProgramCacheKey = () => 'piedra-triplanar-menu'),
      I.traverse((Z) => {
        Z.isMesh && ((Z.material = j), (Z.castShadow = !0), (Z.receiveShadow = !0), (Z.frustumCulled = !1));
      }),
      (I.rotation.y = Math.PI / 2),
      b.add(I),
      b.updateMatrixWorld(!0));
    let X = new Box3().setFromObject(I, !0),
      J = X.getSize(new Vector3());
    (I.scale.multiplyScalar(3 / Math.max(J.x, J.z)),
      b.updateMatrixWorld(!0),
      (X = new Box3().setFromObject(I, !0)),
      (I.position.y += 0.9 - X.min.y),
      (I.position.x -= (X.min.x + X.max.x) / 2),
      (I.position.z -= (X.min.z + X.max.z) / 2));
  } catch (P) {
    console.warn('[men\xFA] toro', P);
  }
  let x = i(
      new MeshStandardMaterial({
        color: 2753283,
        emissive: 16722448,
        emissiveIntensity: e ? 0.6 : 2.2,
        roughness: 0.2,
      }),
    ),
    g = new Mesh(i(hD()), x);
  (g.position.set(0.3, 0.05, 0.957), b.add(g));
  let y = new Mesh(
    i(new CircleGeometry(0.42, 24)),
    i(
      new MeshStandardMaterial({
        color: 1835780,
        emissive: 3801092,
        emissiveIntensity: 0.4,
        roughness: 0.1,
        metalness: 0.2,
      }),
    ),
  );
  ((y.rotation.x = -Math.PI / 2),
    y.scale.set(1.3, 0.75, 1),
    y.position.set(0.35, 0.235, 1.05),
    b.add(y),
    a.add(b));
  let w = (() => {
    let P = 7;
    return () => (P = (P * 16807) % 2147483647) / 2147483647;
  })();
  async function k(P, I, U, j, X, J, Z) {
    try {
      let K = await loadGLTF(`assets/nature/${P}.json`);
      K.scene.updateMatrixWorld(!0);
      let ve = new Matrix4(),
        ge = new Matrix4(),
        ue = new Quaternion(),
        Q = [];
      for (let oe = 0; oe < I; oe++) {
        let ie = w() * Math.PI * 2,
          we = U + w() * (j - U),
          ce = Math.cos(ie) * we,
          ke = Math.sin(ie) * we;
        if (ke > 4 && Math.abs(ce) < 9) continue;
        let Qe = X + w() * (J - X);
        (ue.setFromAxisAngle(new Vector3(0, 1, 0), w() * Math.PI * 2),
          Q.push(
            ve
              .clone()
              .compose(
                new Vector3(
                  ce,
                  Math.sin(ce * 0.12) * 0.35 +
                    Math.cos(ke * 0.09) * 0.45 -
                    Math.max(0, Math.hypot(ce, ke) - 6) * 0.05 -
                    0.05,
                  ke,
                ),
                ue,
                new Vector3(Qe, Qe, Qe),
              ),
          ));
      }
      K.scene.traverse((oe) => {
        if (!oe.isMesh) return;
        let ie = oe.material;
        Z && ((ie = ie.clone()), ie.color.multiply(new Color(Z)), s.push(ie));
        let we = new InstancedMesh(oe.geometry, ie, Q.length);
        (Q.forEach((ce, ke) => we.setMatrixAt(ke, ge.multiplyMatrices(ce, oe.matrixWorld))),
          (we.castShadow = !t),
          (we.receiveShadow = !0),
          a.add(we));
      });
    } catch (K) {
      console.warn('[men\xFA]', P, K);
    }
  }
  await Promise.all([
    k('Pine_1', t ? 18 : 34, 9, 30, 0.9, 1.6, e ? 9083514 : 5925466),
    k('Pine_3', t ? 10 : 20, 11, 34, 0.9, 1.5, e ? 9083514 : 5925466),
    k('Rock_Medium_1', 10, 4, 14, 0.6, 1.3),
    k('Rock_Medium_3', 8, 5, 16, 0.5, 1.1),
    t ? null : k('Grass_Wispy_Tall', 140, 2.6, 14, 0.8, 1.4, 10133632),
  ]);
  let T = t ? 50 : 130,
    E = new Float32Array(T * 3),
    S = new Float32Array(T);
  for (let P = 0; P < T; P++) {
    let I = w() * Math.PI * 2,
      U = 2.5 + w() * 12;
    ((E[P * 3] = Math.cos(I) * U),
      (E[P * 3 + 1] = 0.3 + w() * 2.4),
      (E[P * 3 + 2] = Math.sin(I) * U),
      (S[P] = w() * 100));
  }
  let z = i(new BufferGeometry());
  z.setAttribute('position', new BufferAttribute(E, 3));
  let D = new Points(
    z,
    i(
      new PointsMaterial({
        color: e ? 16771264 : 14221194,
        size: 0.09,
        transparent: !0,
        opacity: 0.85,
        blending: AdditiveBlending,
        depthWrite: !1,
      }),
    ),
  );
  a.add(D);
  let M = E.slice(),
    R = 0,
    A = e ? 0 : 1;
  return {
    scene: a,
    sun: c,
    statue: b,
    update(P, I) {
      R += P;
      for (let U = 0; U < T; U++)
        ((E[U * 3] = M[U * 3] + Math.sin(R * 0.4 + S[U]) * 0.6),
          (E[U * 3 + 1] = M[U * 3 + 1] + Math.sin(R * 0.7 + S[U] * 2) * 0.35),
          (E[U * 3 + 2] = M[U * 3 + 2] + Math.cos(R * 0.35 + S[U]) * 0.6));
      if (
        ((z.attributes.position.needsUpdate = !0),
        (D.material.opacity = 0.6 + Math.sin(R * 3) * 0.25),
        (d.intensity = (e ? 1.2 : 5.5) + Math.sin(R * 2.2) * 1.2 + Math.sin(R * 9.1) * 0.4),
        (x.emissiveIntensity = (e ? 0.5 : 2) + Math.sin(R * 2.2) * 0.5),
        (u.intensity = e ? 0 : 13 + Math.sin(R * 13) * 1.2 + Math.sin(R * 7.7) * 1.4),
        I)
      ) {
        let U = innerHeight > innerWidth * 1.1,
          j = -0.45 + Math.sin(R * 0.045) * 0.4,
          X = U ? 15 : 11.5;
        (I.position.set(Math.sin(j) * X, 2.9 + Math.sin(R * 0.08) * 0.25, Math.cos(j) * X),
          I.lookAt(0, 1.5, 0));
        let J = innerWidth,
          Z = innerHeight;
        A && I.setViewOffset(J, Z, U ? 0 : -J * 0.2 * A, U ? Z * 0.16 * A : 0, J, Z);
      }
    },
    dispose() {
      for (let P of s) P.dispose?.();
      a.clear();
    },
  };
}
async function crearEscenaMenu(o) {
  let e = o.ui;
  (await e.ready, e.loading('Encendiendo las antorchas'));
  let t = o.stage,
    a = t.camera,
    n = t.controls,
    s = {
      enabled: n.enabled,
      min: n.minDistance,
      max: n.maxDistance,
      minP: n.minPolarAngle,
      maxP: n.maxPolarAngle,
      damping: n.enableDamping,
      target: n.target.clone(),
    };
  (Object.assign(n, {
    enabled: !1,
    enableDamping: !1,
    minDistance: 0.1,
    maxDistance: 200,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI,
  }),
    n.target.set(0, 1.5, 0));
  let i = await buildBackdrop(o);
  ((o.store.cp = null), e.hud.hide());
  let r = elem('div.mg-menu');
  ((r.innerHTML = `
    <div class="mg-menu-col">
      <div class="mg-menu-title">
        <span class="mg-menu-pre">Marca de</span>
        <h1>Granito</h1>
        <span class="mg-menu-cap">Cap\xEDtulo I \xB7 <em>El toro que sangra</em></span>
      </div>
      <nav class="mg-menu-nav" aria-label="Men\xFA principal"></nav>
    </div>
    <footer class="mg-menu-foot"><span>${escapeHtml(uD)} \xB7 Compatible con la quinta edici\xF3n (SRD 5.2.1)</span></footer>`),
    e.root.append(r));
  let l = r.querySelector('.mg-menu-nav'),
    c = await o.store.list().catch(() => []),
    d = c[0],
    u = (m, _, b, { primary: f, sub: v, key: x } = {}) => {
      let g = elem(`button.mg-menu-btn${f ? '.primary' : ''}`, { onclick: b });
      return (
        (g.innerHTML = `${iconHtml(_)}<span class="t"><b>${escapeHtml(m)}</b>${v ? `<small>${v}</small>` : ''}</span>`),
        x && (g.dataset.k = x),
        l.append(g),
        g
      );
    },
    h = () => o.audio?.unlock?.();
  (r.addEventListener('pointerdown', h, { once: !0 }), addEventListener('keydown', h, { once: !0 }));
  async function p(m) {
    e.loading('Abriendo la partida');
    let _ = await o.store.load(m);
    if (!_) {
      (e.loading(null), e.toast('No se ha podido cargar esa partida.', 'mal'));
      return;
    }
    let b = e.R.call('cp_load', { cp: _ });
    (b?.cp && !b.error && o.store.set(b.cp), e.resume());
  }
  if (d) {
    let m = d.meta || {};
    u('Continuar', 'play', () => p(d.slot), {
      primary: !0,
      key: 'continuar',
      sub: `${escapeHtml(m.hero || 'Sin nombre')} \xB7 nivel ${escapeHtml(m.level || 1)} \xB7 ${escapeHtml(m.place || '')}${m.savedAt ? ` \xB7 ${escapeHtml(Kl(m.savedAt))}` : ''}`,
    });
  }
  return (
    u(
      'Nueva partida',
      'quill',
      async () => {
        (c.length &&
          !(await e.confirm(
            'Empezar\xE1s con un h\xE9roe nuevo. Tus partidas guardadas se conservan; el guardado autom\xE1tico se sustituir\xE1 por el de la nueva partida.',
            { titulo: 'Nueva partida', si: 'Crear un h\xE9roe', no: 'Cancelar' },
          ))) ||
          o.go('creator');
      },
      { primary: !d, key: 'nueva', sub: d ? '' : 'Crea a tu h\xE9roe y parte hacia Merrowick' },
    ),
    (u(
      'Cargar partida',
      'load',
      async () => {
        (await e.open('cargar'))?.slot && e.resume();
      },
      {
        key: 'cargar',
        sub: c.length
          ? `${c.length} ${c.length === 1 ? 'partida guardada' : 'partidas guardadas'}`
          : 'No hay partidas guardadas',
      },
    ).disabled = !c.length),
    u('Ajustes', 'settings', () => e.open('ajustes'), { key: 'ajustes' }),
    u('C\xF3mo se juega', 'open_book', () => e.open('ayuda'), { key: 'ayuda' }),
    u('Cr\xE9ditos', 'scroll_quill', () => e.open('creditos'), { key: 'creditos' }),
    d?.meta?.playtime &&
      l
        .querySelector('[data-k="continuar"] small')
        .insertAdjacentHTML('beforeend', ` \xB7 ${escapeHtml(Yl(d.meta.playtime))}`),
    requestAnimationFrame(() => l.querySelector('button:not(:disabled)')?.focus({ preventScroll: !0 })),
    l.addEventListener('keydown', (m) => {
      if (m.key !== 'ArrowDown' && m.key !== 'ArrowUp') return;
      let _ = [...l.querySelectorAll('button:not(:disabled)')],
        b = _.indexOf(document.activeElement);
      (_[(b + (m.key === 'ArrowDown' ? 1 : _.length - 1) + _.length) % _.length]?.focus(),
        m.preventDefault());
    }),
    o.audio?.music?.('menu', { fade: 2 }),
    e.loading(null),
    {
      three: i.scene,
      sun: i.sun,
      update(m) {
        i.update(m, a);
      },
      dispose() {
        ((r.style.transition = 'opacity .35s'),
          (r.style.opacity = '0'),
          (r.style.pointerEvents = 'none'),
          setTimeout(() => r.remove(), 400),
          i.dispose(),
          a.clearViewOffset(),
          Object.assign(n, {
            enabled: s.enabled,
            minDistance: s.min,
            maxDistance: s.max,
            minPolarAngle: s.minP,
            maxPolarAngle: s.maxP,
            enableDamping: s.damping,
          }),
          n.target.copy(s.target));
      },
    }
  );
}
const uD = 'Cap\xEDtulo I \xB7 versi\xF3n web 0.9';

export { buildBackdrop, crearEscenaMenu as create };
