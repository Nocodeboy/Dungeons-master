// assets.js — Carga de modelos glTF y texturas.
// Los modelos son glTF en JSON con los binarios embebidos en URIs «data:» (la CSP del artefacto bloquea
// fetch de data:/blob:), así que una extensión del cargador («mdg_recursos_embebidos») decodifica esos
// búferes a mano. Usa meshopt y cachea modelos y texturas por URL.
// Lo usan stage.js (anisotropía), main.js (loadingManager), actors/, world/ y scenes/menu.js.

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

/** Decodifica una URI «data:…;base64,» a ArrayBuffer. */
function dataUriToBuffer(uri) {
  let base64 = uri.slice(uri.indexOf(',') + 1);
  if (Uint8Array.fromBase64) return Uint8Array.fromBase64(base64).buffer;
  let binary = atob(base64),
    bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
/** Anisotropía de las texturas que se carguen a partir de ahora (la fija stage.js según la GPU). */
function setAnisotropy(value) {
  anisotropy = value;
}
/** Promesa del glTF de `url` (cacheada: se comparte entre llamadas). */
function loadGLTF(url) {
  return (gltfCache.has(url) || gltfCache.set(url, gltfLoader.loadAsync(url)), gltfCache.get(url));
}
/** Copia de la escena del objeto de decorado `assets/props/<name>.json`. */
function loadProp(name) {
  return loadModel(`props/${name}`);
}
/** Copia de la escena de `assets/<name>.json` con sombras activadas en sus mallas. */
async function loadModel(name) {
  let scene = (await loadGLTF(`assets/${name}.json`)).scene.clone(!0);
  return (
    scene.traverse((obj) => {
      obj.isMesh && ((obj.castShadow = !0), (obj.receiveShadow = !0));
    }),
    scene
  );
}
/** Textura repetible cacheada por URL (`srgb` para mapas de color). */
function loadTexture(url, srgb) {
  if (!textureCache.has(url)) {
    let texture = textureLoader.load(url);
    ((texture.wrapS = texture.wrapT = RepeatWrapping),
      (texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace),
      (texture.anisotropy = anisotropy),
      textureCache.set(url, texture));
  }
  return textureCache.get(url);
}
/**
 * Material PBR con las texturas `assets/tex/<name>_{diff,nor,rough,ao}.webp`.
 * @param {string} name prefijo de las texturas
 * @param {object} [opts] repeat, tint, normalScale, roughness, ao (mapa de oclusión), rotation
 */
function pbrMaterial(
  name,
  {
    repeat = [1, 1],
    tint = 16777215,
    normalScale = 1,
    roughness = 1,
    ao = !0,
    rotation = 0,
  } = {},
) {
  let mapTexture = (kind, srgb) => {
      let texture = loadTexture(`assets/tex/${name}_${kind}.webp`, srgb).clone();
      return (texture.repeat.set(repeat[0], repeat[1]), (texture.rotation = rotation), texture.center.set(0.5, 0.5), (texture.needsUpdate = !0), texture);
    },
    material = new MeshStandardMaterial({
      map: mapTexture('diff', !0),
      normalMap: mapTexture('nor', !1),
      roughnessMap: mapTexture('rough', !1),
      roughness,
      color: tint,
      metalness: 0,
    });
  return (material.normalScale.set(normalScale, normalScale), ao && ((material.aoMap = mapTexture('ao', !1)), (material.aoMapIntensity = 0.9)), material);
}
/** Gestor de carga común (main.js lo usa para la barra de la pantalla de carga). */
const loadingManager = new LoadingManager();
const gltfLoader = new GLTFLoader(loadingManager).setMeshoptDecoder(MeshoptDecoder);
// Extensión que resuelve los búferes «data:» sin fetch.
gltfLoader.register((parser) => {
  let originalLoadBuffer = parser.loadBuffer.bind(parser);
  return (
    (parser.loadBuffer = (index) => {
      let buffer = parser.json.buffers[index];
      return buffer.uri && buffer.uri.startsWith('data:') ? Promise.resolve(dataUriToBuffer(buffer.uri)) : originalLoadBuffer(index);
    }),
    (parser.textureLoader = new TextureLoader(parser.options.manager)),
    parser.textureLoader.setCrossOrigin(parser.options.crossOrigin),
    { name: 'mdg_recursos_embebidos' }
  );
});
const textureLoader = new TextureLoader(loadingManager);
const gltfCache = new Map();
const textureCache = new Map();
let anisotropy = 4;

export { loadGLTF, loadProp, loadingManager, pbrMaterial, setAnisotropy };
