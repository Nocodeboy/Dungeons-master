// assets.js
// Reconstruido de publicado/juego.js (módulo __esm «Qo»). Nombres locales aún minificados.

import {
  LoadingManager,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

function dataUriToBuffer(o) {
  let e = o.slice(o.indexOf(',') + 1);
  if (Uint8Array.fromBase64) return Uint8Array.fromBase64(e).buffer;
  let t = atob(e),
    a = new Uint8Array(t.length);
  for (let n = 0; n < t.length; n++) a[n] = t.charCodeAt(n);
  return a.buffer;
}
function setAnisotropy(o) {
  anisotropy = o;
}
function loadGLTF(o) {
  return (gltfCache.has(o) || gltfCache.set(o, gltfLoader.loadAsync(o)), gltfCache.get(o));
}
function loadProp(o) {
  return loadModel(`props/${o}`);
}
async function loadModel(o) {
  let t = (await loadGLTF(`assets/${o}.json`)).scene.clone(!0);
  return (
    t.traverse((a) => {
      a.isMesh && ((a.castShadow = !0), (a.receiveShadow = !0));
    }),
    t
  );
}
function loadTexture(o, e) {
  if (!textureCache.has(o)) {
    let t = textureLoader.load(o);
    ((t.wrapS = t.wrapT = RepeatWrapping),
      (t.colorSpace = e ? SRGBColorSpace : NoColorSpace),
      (t.anisotropy = anisotropy),
      textureCache.set(o, t));
  }
  return textureCache.get(o);
}
function pbrMaterial(
  o,
  {
    repeat: e = [1, 1],
    tint: t = 16777215,
    normalScale: a = 1,
    roughness: n = 1,
    ao: s = !0,
    rotation: i = 0,
  } = {},
) {
  let r = (c, d) => {
      let u = loadTexture(`assets/tex/${o}_${c}.webp`, d).clone();
      return (u.repeat.set(e[0], e[1]), (u.rotation = i), u.center.set(0.5, 0.5), (u.needsUpdate = !0), u);
    },
    l = new MeshStandardMaterial({
      map: r('diff', !0),
      normalMap: r('nor', !1),
      roughnessMap: r('rough', !1),
      roughness: n,
      color: t,
      metalness: 0,
    });
  return (l.normalScale.set(a, a), s && ((l.aoMap = r('ao', !1)), (l.aoMapIntensity = 0.9)), l);
}
const loadingManager = new LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager).setMeshoptDecoder(MeshoptDecoder);
gltfLoader.register((o) => {
  let e = o.loadBuffer.bind(o);
  return (
    (o.loadBuffer = (t) => {
      let a = o.json.buffers[t];
      return a.uri && a.uri.startsWith('data:') ? Promise.resolve(dataUriToBuffer(a.uri)) : e(t);
    }),
    (o.textureLoader = new TextureLoader(o.options.manager)),
    o.textureLoader.setCrossOrigin(o.options.crossOrigin),
    { name: 'mdg_recursos_embebidos' }
  );
});
const textureLoader = new TextureLoader(loadingManager);
const gltfCache = new Map();
const textureCache = new Map();
let anisotropy = 4;

export { loadGLTF, loadProp, loadingManager, pbrMaterial, setAnisotropy };
