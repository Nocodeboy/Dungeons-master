// Entrada del bundle de referencia de three.js (solo para alinear con publicado/juego.js).
// Los módulos que en el publicado van envueltos en __esm se cargan con import() dinámico;
// los addons de posprocesado y OrbitControls, que en el publicado van sin envolver, se
// importan de forma estática. Se exponen todos sus exports para que no se elimine nada.
import * as OrbitControls from 'three/addons/controls/OrbitControls.js';
import * as CopyShader from 'three/addons/shaders/CopyShader.js';
import * as Pass from 'three/addons/postprocessing/Pass.js';
import * as ShaderPass from 'three/addons/postprocessing/ShaderPass.js';
import * as MaskPass from 'three/addons/postprocessing/MaskPass.js';
import * as EffectComposer from 'three/addons/postprocessing/EffectComposer.js';
import * as RenderPass from 'three/addons/postprocessing/RenderPass.js';
import * as LuminosityHighPassShader from 'three/addons/shaders/LuminosityHighPassShader.js';
import * as UnrealBloomPass from 'three/addons/postprocessing/UnrealBloomPass.js';
import * as GTAOShader from 'three/addons/shaders/GTAOShader.js';
import * as SimplexNoise from 'three/addons/math/SimplexNoise.js';
import * as PoissonDenoiseShader from 'three/addons/shaders/PoissonDenoiseShader.js';
import * as GTAOPass from 'three/addons/postprocessing/GTAOPass.js';
import * as OutputShader from 'three/addons/shaders/OutputShader.js';
import * as OutputPass from 'three/addons/postprocessing/OutputPass.js';
globalThis.__ref = [OrbitControls, CopyShader, Pass, ShaderPass, MaskPass, EffectComposer, RenderPass,
  LuminosityHighPassShader, UnrealBloomPass, GTAOShader, SimplexNoise, PoissonDenoiseShader, GTAOPass,
  OutputShader, OutputPass];
globalThis.__dyn = [
  () => import('three'),
  () => import('three/addons/utils/BufferGeometryUtils.js'),
  () => import('three/addons/utils/SkeletonUtils.js'),
  () => import('three/addons/loaders/GLTFLoader.js'),
  () => import('three/addons/libs/meshopt_decoder.module.js'),
];
