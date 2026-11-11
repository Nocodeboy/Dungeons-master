// Combates completos IA contra IA (ai_turn + end_turn) con semilla: init, state, options y el
// registro entero de eventos. Comprueban el núcleo de combate, la IA y el serializador de estado.

function batalla(call, init, { maxTurnos = 400, cadaEstado = 4, opciones = true } = {}) {
  const r = call('init', init);
  if (!r.state) return;
  for (let t = 0; t < maxTurnos; t++) {
    const st = t % cadaEstado === 0 ? call('state') : null;
    if (st && st.over) break;
    if (opciones && t % 3 === 0) call('options');
    call('ai_turn');
    const fin = call('end_turn');
    if (fin.events?.some((e) => e.t === 'end')) {
      call('state');
      break;
    }
  }
  call('state');
}

export const escenarios = {};
for (const enc of ['e1_prado', 'e2_pinar', 'e3_tumulo']) {
  for (const seed of [1, 2, 3, 4]) {
    escenarios[`${enc}_s${seed}`] = (call) => batalla(call, { encounter: enc, seed });
  }
  for (const level of [2, 3]) {
    escenarios[`${enc}_n${level}`] = (call) => batalla(call, { encounter: enc, seed: 10 + level, level });
  }
}
// Sin semilla (azar del módulo, fijado por el arnés) y con grupos distintos
escenarios.sin_semilla = (call) => batalla(call, { encounter: 'e1_prado' });
escenarios.grupo_dos = (call) => batalla(call, { encounter: 'e2_pinar', seed: 5, party: ['pip', 'odvar'] });
escenarios.grupo_ids_raros = (call) => batalla(call, { encounter: 'e1_prado', seed: 6, party: ['ilyra', 'nadie', 'brenna'] });
escenarios.encuentro_inexistente = (call) => {
  call('init', { encounter: 'zz' });
  call('state');
  call('init', { encounter: 'e3_tumulo', seed: 9, level: 0 });
  call('init', { seed: 'x' });
};
