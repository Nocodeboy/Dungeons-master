// actors/roster.js
// Reconstruido de publicado/juego.js (módulo __esm «Qf»).
//
// Grupo inicial en el formato antiguo de personaje (modelos KayKit Ranger/Peasant con pelo, tinte,
// recoloreado y armas enganchadas a huesos): datos de presentación de Brenna, Pip, Ilyra y Odvar
// (papel, PG, CA, color, posición en la posada y objetos). Lo usan combat/units.js,
// explore/actors.js y ui/portraits.js como respaldo y para datos de ficha.

import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
} from 'three';

/** Bastón con pomo y gema azul (arma de Odvar en la definición antigua). */
function makeStaffProp() {
  let group = new Group(),
    woodMat = new MeshStandardMaterial({ color: 5978914, roughness: 0.8 }),
    shaft = new Mesh(new CylinderGeometry(0.018, 0.022, 1.55, 8), woodMat);
  ((shaft.position.y = 0.35), group.add(shaft));
  let knob = new Mesh(new SphereGeometry(0.04, 10, 8), woodMat);
  ((knob.position.y = 1.12), group.add(knob));
  let gem = new Mesh(
    new OctahedronGeometry(0.035),
    new MeshStandardMaterial({ color: 10475775, emissive: 3837904, emissiveIntensity: 2.2, roughness: 0.2 }),
  );
  return (
    (gem.position.y = 1.18),
    group.add(gem),
    group.traverse((obj) => {
      obj.isMesh && (obj.castShadow = !0);
    }),
    group
  );
}
/** Compañeros en el formato antiguo de makeCharacter (con sus datos de ficha). */
const LEGACY_PARTY = [
  {
    id: 'brenna',
    name: 'Brenna Halvard',
    role: 'Guerrera \xB7 Campeona',
    hp: [7, 12],
    ac: 19,
    color: '#c8a45a',
    outfit: 'Female_Ranger',
    hideParts: ['Hood'],
    hair: ['Hair_Buns'],
    hairColor: 4858900,
    skin: 16770774,
    recolor: { from: 0.33, width: 0.16, shift: 0.27, sat: 0.35, val: 0.9 },
    pos: [2.7, 1.8],
    lookAt: 'maren',
    anim: 'Sword_Idle',
    attach: [
      { prop: 'antique_estoc', bone: 'hand_r', scale: 0.62, pos: [0, 0.07, 0.03], rot: [0, 0, -90] },
      { prop: 'kite_shield', bone: 'lowerarm_l', scale: 0.48, pos: [0.08, 0.12, -0.02], rot: [0, 90, 90] },
    ],
    items: ['Espada larga', 'Escudo', '4 jabalinas', 'Cota de malla', 'Poci\xF3n de curaci\xF3n'],
  },
  {
    id: 'pip',
    name: 'Pip Tallowmere',
    role: 'P\xEDcaro \xB7 Ladr\xF3n',
    hp: [10, 10],
    ac: 14,
    color: '#8fb07a',
    outfit: 'Male_Ranger',
    variant: 'T_Ranger_3_BaseColor',
    skin: 16769736,
    scale: 0.8,
    pos: [3.55, 1.35],
    lookAt: 'maren',
    anim: 'Idle_Loop',
    items: [
      'Espada corta',
      '2 dagas',
      'Ballesta ligera (20 virotes)',
      'Armadura de cuero',
      'Herramientas de ladr\xF3n',
    ],
  },
  {
    id: 'ilyra',
    name: 'Ilyra Sorendel',
    role: 'Cl\xE9riga \xB7 Dominio de la Vida',
    hp: [10, 10],
    ac: 18,
    color: '#e8d9a8',
    outfit: 'Female_Peasant',
    hair: ['Hair_Long'],
    hairColor: 14731408,
    skin: 16773350,
    recolor: { from: 0.08, width: 0.1, shift: 0, sat: 0.4, val: 1.35 },
    pos: [3.4, 2.5],
    lookAt: 'maren',
    anim: 'Idle_Torch_Loop',
    attach: [
      {
        prop: 'wooden_lantern_01',
        bone: 'hand_l',
        scale: 0.7,
        pos: [0, 0.1, 0],
        rot: [180, 0, 0],
        light: !0,
      },
    ],
    items: [
      'Espada larga',
      'Escudo con el sol del Alba',
      'Cota de malla',
      'S\xEDmbolo sagrado',
      'Poci\xF3n de curaci\xF3n',
    ],
  },
  {
    id: 'odvar',
    name: 'Maese Odvar',
    role: 'Mago \xB7 Evocador',
    hp: [5, 8],
    ac: 11,
    color: '#8fb3d9',
    outfit: 'Male_Peasant',
    variant: 'T_Peasant_2_BaseColor',
    hair: ['Hair_Beard', 'Hair_Buzzed'],
    hairColor: 12103844,
    skin: 15780008,
    scale: 0.84,
    recolor: { from: 0.12, width: 0.14, shift: 0.48, sat: 1.4, val: 1 },
    pos: [2.25, 2.75],
    lookAt: 'maren',
    anim: 'Idle_Loop',
    attach: [{ make: makeStaffProp, bone: 'hand_r', scale: 1, pos: [0, 0.06, 0.02], rot: [0, 0, -90] }],
    items: ['Bast\xF3n', 'Daga', 'Libro de conjuros', 'Saquito de componentes', 'Poci\xF3n de curaci\xF3n'],
  },
];

export { LEGACY_PARTY };
