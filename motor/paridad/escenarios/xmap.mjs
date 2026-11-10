// Escenarios del mapa de exploración (xmap_*): se cargan los mapas de los niveles y mapas al azar
// y se hacen consultas de casilla, transitabilidad, rutas, visión, alcance y huecos libres con
// argumentos variados (también incoherentes) elegidos con un generador con semilla.
import { generador } from './jugador.mjs';

const TERRENOS = '....,,::==~bxf#HTPSrcgwoO ?';

function mapaAzar(rnd, w, h, densidad) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let s = '';
    for (let x = 0; x < w; x++) s += rnd() < densidad ? TERRENOS[rnd.int(TERRENOS.length)] : '.';
    rows.push(s);
  }
  return rows;
}

function casilla(rnd, w, h, margen = 2) {
  return [rnd.int(w + 2 * margen) - margen, rnd.int(h + 2 * margen) - margen];
}

function consultas(call, rnd, w, h, n) {
  const c = () => casilla(rnd, w, h);
  const lista = (k) => Array.from({ length: k }, c);
  for (let i = 0; i < n; i++) {
    const que = rnd.int(9);
    if (que === 0) call('xmap_cell', { cell: c() });
    else if (que === 1) call('xmap_walkable', { cells: lista(1 + rnd.int(8)) });
    else if (que === 2 || que === 3) {
      const pet = { from: c(), to: c() };
      if (rnd() < 0.3) pet.blocked = lista(rnd.int(10));
      if (rnd() < 0.3) pet.adjacent = rnd() < 0.7;
      if (rnd() < 0.3) pet.max = rnd.int(14) - 1;
      call('xmap_path', pet);
    } else if (que === 4 || que === 5) {
      const pet = { from: c(), to: c() };
      if (rnd() < 0.3) pet.blockers = lista(rnd.int(6));
      call('xmap_los', pet);
    } else if (que === 6 || que === 7) {
      const pet = { from: c() };
      if (rnd() < 0.8) pet.max = rnd.int(9) - 1;
      if (rnd() < 0.3) pet.blocked = lista(rnd.int(8));
      call('xmap_reach', pet);
    } else {
      const pet = { near: c() };
      if (rnd() < 0.8) pet.n = rnd.int(12) - 1;
      if (rnd() < 0.3) pet.blocked = lista(rnd.int(8));
      if (rnd() < 0.3) pet.max = rnd.int(6);
      call('xmap_free', pet);
    }
  }
}

export const escenarios = {
  sin_mapa(call) {
    for (const op of ['xmap_cell', 'xmap_walkable', 'xmap_path', 'xmap_los', 'xmap_reach', 'xmap_free', 'xmap_nada']) call(op, {});
    call('xmap_load', {});
    call('xmap_cell', { cell: [0, 0] });
    call('xmap_load', { rows: [] });
    call('xmap_load', { rows: 'abc' });
    call('xmap_load', { rows: [1, 2, null] });
    call('xmap_load', { rows: ['..', 7, '...#'] });
    call('xmap_cell', { cell: [1, 1] });
    call('xmap_cell', { cell: [3, 2] });
    call('xmap_cell', { cell: '1,1' });
    call('xmap_cell', { cell: [1] });
    call('xmap_cell', { cell: [1.7, 0.2] });
    call('xmap_walkable', { cells: [[0, 0], 'x', [1], null, [2, 2]] });
    call('xmap_path', { from: [0, 0], to: [0, 0] });
    call('xmap_path', { from: [0, 0], to: [1, 0] });
    call('xmap_reach', { from: [0, 0], max: 'x' });
    call('xmap_free', { near: [0, 0], n: 'x' });
    call('xmap_otra', { rows: ['...'] });
  },

  niveles(call) {
    const rnd = generador(77);
    const niveles = call('data', { name: 'levels' });
    for (const [id, lv] of Object.entries(niveles)) {
      const r = call('xmap_load', { rows: lv.rows });
      consultas(call, rnd, r.w, r.h, id === 'tumulo' ? 300 : 400);
    }
  },

  azar(call) {
    const rnd = generador(4242);
    for (let k = 0; k < 30; k++) {
      const w = 3 + rnd.int(22), h = 3 + rnd.int(18);
      const rows = mapaAzar(rnd, w, h, 0.1 + rnd() * 0.5);
      if (rnd() < 0.2) rows[rnd.int(h)] = rows[0].slice(0, rnd.int(w));
      const r = call('xmap_load', { rows });
      consultas(call, rnd, r.w, r.h, 60);
    }
  },
};
