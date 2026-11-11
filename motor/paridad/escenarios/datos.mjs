// Escenarios de datos y fichas: data, loc, monster_info, item_info, random_name y peticiones
// mal formadas. El dominio de estas operaciones es finito, así que se recorre entero.

const TABLAS = ['world', 'names', 'armor', 'backgrounds', 'classes', 'feats', 'features', 'items', 'merchants',
  'monsters', 'party', 'species', 'spells', 'weapons', 'encounters', 'levels'];

export const escenarios = {
  tablas(call) {
    for (const name of TABLAS) call('data', { name });
    for (const name of ['', 'lang', 'slot_tables', 'World', 7, 2.5, null, true, [1], { a: 1 }]) call('data', { name });
    call('data', {});
  },

  textos(call) {
    call('loc');
    call('loc', { keys: [] });
    call('loc', { keys: 'x' });
    call('loc', { keys: {} });
    call('loc', { keys: ['log.recharge', 'x', 2.5, null, true, { a: 1 }, [1], 'size.large', 'size.large', 'dmg.fire'] });
    const todo = call('loc');
    call('loc', { keys: Object.keys(todo) });
  },

  monstruos(call) {
    const mons = call('data', { name: 'monsters' });
    for (const id of Object.keys(mons)) call('monster_info', { id });
    for (const id of ['', 'dragon', 3, null]) call('monster_info', { id });
    call('monster_info', {});
  },

  objetos(call) {
    const ids = [
      ...Object.keys(call('data', { name: 'items' })),
      ...Object.keys(call('data', { name: 'weapons' })),
      ...Object.keys(call('data', { name: 'armor' })),
    ];
    for (const id of ids) {
      call('item_info', { id });
      call('item_info', { id, unid: true });
    }
    for (const id of ['', 'nada', 5]) call('item_info', { id });
    call('item_info', { id: 'ring_protection', unid: 1 });
    call('item_info', { id: 'ring_protection', unid: 'si' });
  },

  nombres(call) {
    const especies = Object.keys(call('data', { name: 'species' }));
    for (const species of [...especies, 'zz', '']) {
      for (const pronoun of ['m', 'f', 'n', 'q']) {
        for (const seed of [0, 1, 7, 12345, 3.9]) call('random_name', { species, pronoun, seed });
      }
    }
    // Sin semilla: generador global del módulo (azar fijado por el arnés)
    for (let i = 0; i < 12; i++) call('random_name', { species: especies[i % especies.length], pronoun: i % 2 ? 'f' : 'm' });
    call('random_name', { seed: -3 });
    call('random_name', { seed: '3' });
    call('random_name', {});
  },

  peticiones_raras(call, crudo) {
    for (const t of ['', 'xx', '[]', '1', '"op"', '{}', '{"op":""}', '{"op":"zzz"}', '{"op":"cp_zzz"}',
      '{"op":"xmap_zzz"}', '{"op":"inv_zzz"}', '[{"op":"data"}]', ' {"op":"data","name":"world"} ']) {
      crudo(t);
    }
    // Sin combate: cualquier operación de combate
    for (const op of ['state', 'options', 'threats', 'move', 'undo_move', 'attack_plan', 'attack', 'offhand',
      'spell_begin', 'spell_preview', 'cast', 'simple_targets', 'simple', 'feature', 'ai_turn', 'end_turn']) {
      call(op, {});
    }
  },
};

// Un «op» que no es cadena hace saltar una excepción C++ fuera del puente (en el publicado llega a
// JS como WebAssembly.Exception). Cada caso va en su propio módulo, porque después el módulo puede
// quedar en mal estado.
for (const [nombre, texto] of [['op_numero', '{"op":1}'], ['op_null', '{"op":null}'], ['op_objeto', '{"op":{}}']]) {
  escenarios[`excepcion_${nombre}`] = (call, crudo) => {
    crudo(texto);
  };
}
