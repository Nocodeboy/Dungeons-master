#!/usr/bin/env node
// Genera las capturas de referencia comprimidas (WebP) a partir de la salida de flujo/humo.
// Uso: node qa/referencia.cjs [--origen=qa/salida/flujo] [--destino=qa/referencia] [--ancho=1280] [--calidad=72] [--max=5]
// Elige las capturas cuyo nombre aparece en SELECCION (en ese orden) y las guarda como
// NN_nombre.webp. Comprueba que el total no pase de --max MB.
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('/opt/npm-tools/node_modules/sharp');
const { argumentos } = require('./lib/mdg.cjs');

const A = argumentos();
// Por defecto: todas las carpetas qa/salida/flujo* (en orden: la partida y sus reanudaciones) y luego humo.
const SALIDA = path.join(__dirname, 'salida');
const ORIGENES = A.origen ? A.origen.split(',') : [
  ...(fs.existsSync(SALIDA) ? fs.readdirSync(SALIDA).filter((d) => /^flujo/.test(d)).sort() : []).map((d) => path.join(SALIDA, d)),
  path.join(SALIDA, 'humo'),
];
const DESTINO = path.resolve(A.destino || path.join(__dirname, 'referencia'));
const ANCHO = Number(A.ancho || 1280);
const CALIDAD = Number(A.calidad || 72);
const MAX_MB = Number(A.max || 5);

// Nombres de etapa (sin el prefijo numérico) que interesan como referencia visual.
const SELECCION = [
  'menu', 'creador_especie', 'creador_clase', 'creador_aspecto', 'creador_final', 'prologo_relato', 'prologo_dialogo',
  'merrowick_llegada', 'combate_e1', 'e1_ganado', 'dialogo_maren', 'dialogo_aldis', 'tienda',
  'posada_interior', 'dialogo_pip', 'tablon_mercenarios', 'descanso_posada', 'guardar',
  'viaje_merrowick_elderhal', 'elderhal_llegada', 'combate_santuario', 'santuario_ganado', 'combate_centinelas', 'dialogo_jefe', 'elderhal_hecho',
  'merrowick_escalera', 'kesh_llegada', 'dialogo_odvar', 'runa_3', 'combate_aranas', 'aranas_ganado', 'kesh_hecho',
  'nivel3', 'tumulo_entrada', 'losas', 'combate_vorhan', 'vorhan_ganado', 'dialogo_sello',
  'epilogo_1', 'epilogo_4', 'epilogo_8', 'creditos',
];

async function principal() {
  const disponibles = new Map();
  for (const o of ORIGENES) {
    if (!fs.existsSync(o)) continue;
    for (const f of fs.readdirSync(o).sort()) {
      const m = /^\d+_(.+)\.png$/.exec(f);
      if (m && !disponibles.has(m[1])) disponibles.set(m[1], path.join(o, f));
    }
  }
  fs.mkdirSync(DESTINO, { recursive: true });
  for (const f of fs.readdirSync(DESTINO)) if (/\.webp$/.test(f)) fs.rmSync(path.join(DESTINO, f));
  let total = 0, n = 0;
  const faltan = [];
  for (const nombre of SELECCION) {
    const src = disponibles.get(nombre);
    if (!src) { faltan.push(nombre); continue; }
    n++;
    const dst = path.join(DESTINO, `${String(n).padStart(2, '0')}_${nombre}.webp`);
    await sharp(src).resize({ width: ANCHO }).webp({ quality: CALIDAD, effort: 5 }).toFile(dst);
    total += fs.statSync(dst).size;
  }
  console.log(`${n} capturas, ${(total / 1048576).toFixed(2)} MB en ${DESTINO}`);
  if (faltan.length) console.log('No encontradas (etapas no alcanzadas o con otro nombre): ' + faltan.join(', '));
  if (total > MAX_MB * 1048576) { console.error(`Pasa de ${MAX_MB} MB: baja --calidad o --ancho`); process.exit(1); }
}

principal().catch((e) => { console.error(e); process.exit(1); });
