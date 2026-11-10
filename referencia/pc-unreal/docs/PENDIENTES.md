# Pendientes y sustitutos provisionales

Lista viva: cada vez que se use un sustituto provisional o quede algo a medias, se apunta aquí.

| Qué | Dónde | Sustituto actual | Qué hace falta |
|---|---|---|---|
| Port de `campaign.gd` (estado entre combates, descansos, botín, experiencia) | `Source/MarcaDeGranitoPC/Rules/` | `BattleSetup::build` sin campaña: cada combate empieza con el grupo descansado | Hace falta para encadenar combates (después de la rebanada vertical) |
| `Items::describe()` (textos de objetos para la interfaz) | `Rules/MdgItems.cpp` | — | Cuando se haga el inventario |
