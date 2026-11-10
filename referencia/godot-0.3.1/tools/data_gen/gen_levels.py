#!/usr/bin/env python3
"""Genera los niveles explorables (data/levels/*.json) a partir de primitivas: caminos,
edificios, ríos, bosques, objetos y grupos de enemigos.
Uso: python3 tools/data_gen/gen_levels.py  (desde la raíz del proyecto)"""
import json, math, os, random, sys
sys.path.insert(0, os.path.dirname(__file__))
from hexlib import *

# Tamaño en planta de cada modelo (como "fit" en model_library.gd)
FIT = {"house_a": 2.6, "house_b": 2.6, "house_c": 2.6, "house_d": 2.6, "house_blue": 2.6, "house_green": 2.6,
       "tavern": 3.2, "church": 3.4, "blacksmith": 2.8, "well": 1.3, "market": 2.6, "windmill": 3.0, "watermill": 3.0,
       "mine": 3.0, "lumbermill": 3.0, "tower": 2.2, "grain": 2.4, "ruin": 2.6, "stage": 2.4, "bridge": 3.0, "tent": 1.6}


class Level:
    def __init__(self, lid, w, h, fill=","):
        self.id = lid
        self.g = Grid(w, h, fill)
        self.props, self.objects, self.groups, self.triggers, self.exits, self.lights = [], [], [], [], [], []
        self.decor, self.animals, self.paint = [], [], []
        self.spawns = {}
        self.meta = {}
        self.floor = ","
        self.reserved = set()   # casillas que no se pueden tapar con decoración
        self.occupied = set()   # casillas con objetos, personajes o enemigos (ni siquiera atrezo a mano)

    # ---------------------------------------------------------------- terreno
    def road(self, pts, ch=":", width=1):
        cells = thick(polyline(pts), width)
        for c in cells:
            if self.g.get(c) in "wB":
                continue
            self.g.set(c, ch)
        self.reserved |= set(cells)
        return cells

    def river(self, pts, width=2, ch="w", bank="~"):
        core = thick(polyline(pts), width)
        for c in core:
            self.g.set(c, ch)
        for c in thick(core, 2):
            if self.g.get(c) == ",":
                self.g.set(c, bank if random.random() < 0.35 else ",")
        return core

    def scatter(self, ch, area, density, rng, avoid=""):
        for c in area:
            if c in self.reserved or not self.g.inb(c):
                continue
            if self.g.get(c) in ",." and rng.random() < density and self.g.get(c) not in avoid:
                self.g.set(c, ch)

    def border_forest(self, rng, depth=2, density=0.55, skip=()):
        for y in range(self.g.h):
            for x in range(self.g.w):
                c = (x, y)
                d = min(x, y, self.g.w - 1 - x, self.g.h - 1 - y)
                if d < depth and c not in self.reserved and c not in skip and self.g.get(c) == "," and rng.random() < density * (1.0 - d / depth * 0.5):
                    self.g.set(c, "T")

    # ---------------------------------------------------------------- edificios y objetos
    def building(self, key, c, radius, rot=0, oid=None, door_action=None, smoke=False, **extra):
        foot = disc(c, radius)
        self.g.paint(foot, "B")
        scale = (2 * radius + 1) * 0.92 / FIT[key]
        self.props.append({"key": key, "cell": list(c), "rot": rot, "scale": round(scale, 3), "foot": radius})
        if smoke:
            self.props[-1]["smoke"] = True
        door = self.front_cell(c, radius, rot)
        self.reserved.add(door)
        if self.g.get(door) in "TbrcB":
            self.g.set(door, ".")
        if oid:
            o = {"id": oid, "type": "door", "cell": list(door), "target": list(c), "foot": radius}
            if door_action:
                o["npc"] = door_action
            o.update(extra)
            self.objects.append(o)
        return door

    def front_cell(self, c, radius, rot):
        cx, cz = center(c)
        a = math.radians(rot)
        p = (cx + math.sin(a) * (radius + 0.95), cz + math.cos(a) * (radius + 0.95))
        return self.cell_at(p)

    def cell_at(self, p):
        best, bd = None, 99
        y0 = int(p[1] / ROW_H)
        for y in range(y0 - 2, y0 + 3):
            for x in range(int(p[0]) - 2, int(p[0]) + 3):
                cc = center((x, y))
                d = (cc[0] - p[0]) ** 2 + (cc[1] - p[1]) ** 2
                if d < bd:
                    best, bd = (x, y), d
        return best

    def prop(self, key, c, rot=0, scale=1.0, block=None, offset=None):
        e = {"key": key, "cell": list(c), "rot": rot, "scale": scale}
        if offset:
            e["offset"] = offset
        self.props.append(e)
        if block:
            self.g.set(c, block)

    def obj(self, **kw):
        kw["cell"] = list(kw["cell"])
        if kw.get("block", True) and kw["type"] in ("chest", "sign", "campfire", "board", "stairs", "statue_door"):
            self.g.set(tuple(kw["cell"]), "O" if kw["type"] in ("sign", "board") else "o")
        kw.pop("block", None)
        self.objects.append(kw)
        self.reserved.add(tuple(kw["cell"]))
        self.occupied.add(tuple(kw["cell"]))

    def npc(self, **kw):
        kw["type"] = "npc"
        kw["cell"] = list(kw["cell"])
        self.objects.append(kw)
        self.reserved.add(tuple(kw["cell"]))
        self.occupied.add(tuple(kw["cell"]))
        for n in neighbors(tuple(kw["cell"])):
            self.reserved.add(n)

    def group(self, gid, enemies, **kw):
        g = {"id": gid, "enemies": [{"id": e[0], "cell": list(e[1]), "face": e[2] if len(e) > 2 else 180} for e in enemies]}
        g.update(kw)
        self.groups.append(g)
        for e in enemies:
            self.reserved.add(tuple(e[1]))
            self.occupied.add(tuple(e[1]))
            if self.g.get(tuple(e[1])) not in ",.:=~b":
                self.g.set(tuple(e[1]), self.floor)

    # ---------------------------------------------------------------- ambientación
    def free(self, c, allow=","):
        return self.g.inb(c) and self.g.get(c) in allow and c not in self.occupied and c not in self.spawn_cells()

    def spawn_cells(self):
        out = set()
        for v in self.spawns.values():
            out.add(tuple(v))
            out |= set(neighbors(tuple(v)))
        return out

    def dress(self, key, c, rot=0, block=True, scale=1.0, allow=",", offset=None):
        """Atrezo en una casilla libre; si bloquea, la casilla pasa a ser un obstáculo bajo."""
        if not self.free(c, allow):
            return False
        if block:
            self.prop(key, c, rot=rot, scale=scale, block="o", offset=offset)
        else:
            e = {"key": key, "cell": list(c), "rot": rot, "scale": scale}
            if offset:
                e["offset"] = offset
            self.decor.append(e)
        return True

    def animal(self, kind, c, rot=None, wander=1.0, allow=","):
        if not self.free(c, allow):
            return False
        e = {"kind": kind, "cell": list(c), "wander": wander}
        if rot is not None:
            e["rot"] = rot
        self.animals.append(e)
        self.reserved.add(c)
        self.occupied.add(c)
        return True

    def field(self, cells, crops, rng, per_cell=2, ground="dirt", aligned=False):
        """Huerta o sembrado: tierra pintada y plantas en lote (no bloquean el paso)."""
        done = []
        for c in cells:
            if not self.g.inb(c) or self.g.get(c) not in ",Tb" or c in self.reserved:
                continue
            self.g.set(c, ",")
            done.append(list(c))
            for i in range(per_cell):
                if aligned:
                    self.decor.append({"key": rng.choice(crops), "cell": list(c), "rot": 0, "scale": 1.15})
                    continue
                off = [round(rng.uniform(-0.3, 0.3), 2), round(rng.uniform(-0.3, 0.3), 2)]
                self.decor.append({"key": rng.choice(crops), "cell": list(c), "rot": rng.randint(0, 359),
                                   "scale": round(rng.uniform(0.85, 1.15), 2), "offset": off})
        self.paint.append({"cells": done, "ground": ground})
        self.reserved |= set(tuple(c) for c in done)

    def light(self, c, color, energy=1.2, rng=4.0, h=1.2):
        self.lights.append({"cell": list(c), "color": color, "energy": energy, "range": rng, "height": h})

    def save(self, path):
        d = {"id": self.id}
        d.update(self.meta)
        d.update({"width": self.g.w, "height": self.g.h, "rows": self.g.strings(), "spawns": self.spawns,
                  "exits": self.exits, "props": self.props, "objects": self.objects, "groups": self.groups,
                  "triggers": self.triggers, "lights": self.lights, "decor": self.decor, "animals": self.animals,
                  "paint": self.paint})
        lines = ["{"]
        keys = list(d.keys())
        for i, k in enumerate(keys):
            sep = "," if i < len(keys) - 1 else ""
            if k in ("rows", "props", "objects", "groups", "triggers", "exits", "lights", "decor", "animals", "paint"):
                lines.append('  "%s": [' % k)
                for j, it in enumerate(d[k]):
                    lines.append("    " + json.dumps(it, ensure_ascii=False) + ("," if j < len(d[k]) - 1 else ""))
                lines.append("  ]" + sep)
            else:
                lines.append("  %s: %s%s" % (json.dumps(k), json.dumps(d[k], ensure_ascii=False), sep))
        lines.append("}")
        open(path, "w").write("\n".join(lines) + "\n")
        print("nivel", self.id, self.g.w, "x", self.g.h, "-", len(self.objects), "objetos,", len(self.groups), "grupos")


# ======================================================================= MERROWICK
def merrowick():
    rng = random.Random(7)
    random.seed(7)
    L = Level("merrowick", 46, 34)
    L.meta = {"name": "Merrowick", "place": "Aldea de pastores y canteros, en las Marcas de Vharen", "ambient": "dusk",
              "music": "aldea_tarde", "music_combat": "combate", "music_flags": {"e1_done": "aldea"},
              "ground": {".": "paved"}, "fence": "q_fence"}
    L.spawns = {"arrival": [2, 17], "east": [43, 12], "default": [20, 18], "tumulo": [21, 19]}
    # Arroyo de norte a sur por el este, con puente en el camino del bosque
    L.river([(33, -1), (34, 6), (32, 12), (33, 18), (35, 25), (34, 34)], width=1)
    # Caminos
    L.road([(0, 17), (10, 17), (16, 16)])                     # camino de Valdrecht (oeste)
    L.road([(16, 16), (28, 16)], ch=":")                       # cruza la plaza
    L.road([(28, 16), (32, 15), (37, 13), (45, 12)])            # hacia el puente y el bosque
    L.road([(20, 16), (19, 11)])                                # a la posada
    L.road([(24, 16), (28, 11)])                                # al templo
    L.road([(18, 17), (15, 21)])                                # a la herrería
    L.road([(24, 17), (26, 21)])                                # al puesto de la herbolaria
    L.road([(10, 17), (8, 9)])                                  # al molino
    L.road([(26, 16), (31, 21)])                                # a la casa de la alcaldesa
    # Puente: losas sobre el agua
    for c in polyline([(32, 15), (37, 13)]):
        for d in disc(c, 0):
            if L.g.get(d) in "w~":
                L.g.set(d, "=")
    L.props.append({"key": "footbridge", "cell": [32, 15], "rot": 90, "length": 2.9, "width": 1.15})
    # Plaza con el toro de granito
    for c in disc((22, 16), 3):
        if L.g.get(c) in ",":
            L.g.set(c, ".")
    L.g.paint([(22, 15), (23, 15), (22, 16), (22, 17), (23, 17)], "S")
    L.g.paint([(23, 16)], "S")
    L.reserved |= set(disc((22, 16), 4))
    # Edificios
    L.building("tavern", (19, 8), 2, rot=0, oid="inn", smoke=True, door_action="corwin", name="Posada del Toro Dormido",
               closed="La puerta está atrancada. Dentro se oyen voces asustadas.")
    L.building("church", (29, 7), 2, rot=0, oid="temple", door_action="aldis", name="Templo de Solenne",
               closed="Las puertas del templo están cerradas. Alguien reza al otro lado.")
    L.building("blacksmith", (13, 22), 1, rot=135, oid="smithy", smoke=True, door_action="dagna", name="Herrería",
               closed="La fragua está apagada y la herrera no está.")
    L.building("house_b", (32, 22), 2, rot=-90, oid="mayor", smoke=True, door_action="maren", name="Casa de la alcaldesa",
               closed="Nadie abre. Las contraventanas están cerradas a cal y canto.")
    L.building("windmill", (6, 7), 2, rot=150, name="Molino")
    L.building("watermill", (37, 27), 2, rot=-30, name="Molino de agua")
    L.building("mine", (41, 4), 2, rot=200, name="La cantera")
    L.building("house_a", (11, 11), 1, rot=60, smoke=True)
    L.building("house_c", (6, 23), 1, rot=30, smoke=True)
    L.building("house_d", (24, 4), 1, rot=0)
    L.building("house_blue", (14, 4), 1, rot=-20, smoke=True)
    L.building("house_green", (39, 19), 1, rot=-120)
    L.building("grain", (3, 13), 1, rot=90)
    L.building("market", (27, 23), 1, rot=180, name="Puesto de hierbas")
    L.building("well", (17, 13), 0, rot=0)
    # Cerca de los pastos del sur
    pen = polyline([(8, 27), (20, 27), (21, 32)]) + polyline([(8, 27), (7, 32)])
    for c in pen:
        if L.g.get(c) == ",":
            L.g.set(c, "f")
    L.g.set((14, 27), ",")   # portillo
    L.g.set((15, 27), ",")
    # Decoración
    for c, k in [((22, 11), "crate"), ((16, 10), "barrel"), ((23, 10), "barrel"), ((12, 19), "lumber"), ((16, 23), "weaponrack"),
                 ((17, 22), "stones"), ((26, 26), "crate"), ((29, 24), "barrel"), ((38, 8), "stones"), ((43, 6), "stones"),
                 ((9, 9), "sack"), ((36, 29), "crate_long"), ((5, 12), "pallet"), ((40, 23), "wheelbarrow")]:
        L.prop(k, c, rot=rng.randint(0, 359), block="o")
    L.prop("target", (36, 10), rot=-90, block="o")
    L.prop("flag", (30, 11), rot=0, block="o")
    L.prop("tent", (39, 15), rot=-100, scale=1.0, block="O")
    # ---- Vida de aldea: sembrados, huerto, ganado y atrezo
    L.dress("q_dummy", (6, 20), rot=20)                                   # espantapájaros
    L.field([(x, y) for y in range(19, 22) for x in range(2, 10)], ["wheat_patch"], rng, per_cell=1, aligned=True)
    L.field([(x, y) for y in (13, 14) for x in range(11, 15)], ["cabbage", "carrots", "cabbage", "pumpkin"], rng, per_cell=2)
    for c in [(11, 29), (13, 30), (15, 29), (17, 30), (12, 31), (16, 31), (14, 28)]:
        L.animal("sheep", c, wander=0)
    L.animal("cow", (18, 29), wander=1.2)
    L.animal("cow", (10, 30), wander=1.0)
    L.dress("q_bucket", (19, 28), block=False)
    L.animal("pig", (8, 25), wander=0)
    L.animal("pig", (9, 26), wander=0)
    L.animal("horse", (23, 9), rot=90, wander=0)
    L.animal("dog", (14, 18), wander=2.0)
    L.dress("wagon", (40, 17), rot=80)
    L.animal("donkey", (41, 18), wander=0.6)
    L.dress("q_anvil", (14, 21), rot=45)
    L.dress("q_whetstone", (11, 21), rot=10)
    L.dress("q_farmcrate_apple", (28, 21), rot=10)
    L.dress("q_barrel_apples", (29, 21))
    L.dress("q_farmcrate_carrot", (25, 22), rot=-20)
    L.dress("q_stall_cart", (16, 14), rot=200)
    L.dress("q_bench", (16, 12), rot=0)
    L.dress("q_barrel_holder", (16, 9), rot=90)
    L.dress("q_dummy", (35, 9), rot=-90)
    L.dress("q_pickaxe", (39, 6), rot=30, block=False)
    L.dress("q_crate_metal", (38, 7), rot=15)
    for c in [(27, 10), (31, 10)]:
        if L.dress("q_candles", c):
            L.light(c, "#ffc070", 0.8, 2.5, 0.9)
    for c in [(13, 15), (25, 18), (30, 13), (8, 16), (4, 18)]:
        if L.dress("lantern", c):
            L.light(c, "#ffb060", 1.0, 3.5, 0.9)
    # Bosque alrededor y árboles sueltos
    L.border_forest(rng, depth=3, density=0.6)
    L.scatter("T", [(x, y) for y in range(0, 34) for x in range(36, 46)], 0.18, rng)
    L.scatter("T", [(x, y) for y in range(0, 6) for x in range(0, 46)], 0.12, rng)
    L.scatter("b", [(x, y) for y in range(0, 34) for x in range(0, 46)], 0.03, rng)
    L.scatter("r", [(x, y) for y in range(0, 10) for x in range(36, 46)], 0.06, rng)
    for c in [(0, 16), (0, 17), (0, 18), (45, 11), (45, 12), (45, 13)]:
        L.g.set(c, ":")
    # Luces
    for c in [(19, 11), (29, 10), (15, 21), (32, 20)]:
        L.light(c, "#ffa04a", 1.3, 4.5, 1.3)
    L.light((22, 16), "#ff3a20", 0.0, 3.5, 1.4)   # resplandor del toro (lo enciende el juego)

    L.spawns = {"arrival": [2, 17], "east": [43, 12], "default": [20, 18], "tumulo": [21, 19]}
    L.exits = [
        {"id": "west", "cells": [[0, 16], [0, 17], [0, 18]], "label": "Camino de Valdrecht",
         "blocked": "No es momento de volver a Valdrecht: lo que pasa aquí te concierne. La Marca te lo recuerda."},
        {"id": "east", "cells": [[45, 11], [45, 12], [45, 13]], "label": "Hacia el bosque de Elderhal", "to": "travel",
         "requires": "e1_done", "blocked": "Primero, los trasgos que están entrando en el pueblo."},
    ]
    # ---- Objetos
    L.obj(id="sign_west", type="sign", cell=(3, 15), name="Indicador", text=[
        "«MERROWICK». Debajo, alguien ha tallado a navaja un toro pequeño y una fecha que ya no se lee."])
    L.obj(id="board", type="board", cell=(21, 12), name="Tablón de la posada", requires="e1_done", text=[
        "«Se busca quien espante a los lobos de los pastos. Preguntad por la vieja Sedge.»",
        "«Se ha perdido una cabra con cencerro. Responde a «Tormenta». No muerde. Casi nunca.»",
        "«Por orden de la alcaldesa: nadie se acerque al toro del prado hasta nuevo aviso.»"])
    L.obj(id="chest_mill", type="chest", cell=(9, 6), name="Arcón del molinero",
          lock={"dc": 13}, loot=[["gold", 14], ["potion_healing", 1], ["rope", 1], ["bolts", 1]])
    L.obj(id="cache_mill", type="cache", cell=(3, 6), name="Hueco bajo una piedra", hidden={"dc": 13},
          loot=[["gold", 9], ["scroll_cure_wounds", 1], ["coin_durn", 2]],
          found_text="Bajo una losa suelta detrás del molino hay un hueco con un paquete envuelto en hule.")
    L.obj(id="chest_yard", type="chest", cell=(35, 22), name="Baúl en el cobertizo",
          loot=[["gold", 6], ["torch", 2], ["rations", 2]])
    L.obj(id="tumulo", type="stairs", cell=(22, 18), name="Escalera bajo el toro", requires="camp_done", to="level:tumulo:entry",
          block=False, text=["La piedra del pedestal se ha desplazado. Debajo, unos peldaños gastados bajan a la oscuridad."],
          hidden_until="camp_done")
    L.obj(id="bull", type="inspect", cell=(22, 16), name="El toro de granito", block=False, text=[
        "El toro de los Durn mira a las colinas, como hace mil años. Una grieta le cruza el lomo y de ella mana algo oscuro y espeso que huele a hierro.",
        "Cuando te acercas, la Marca de tu piel se calienta."])
    # ---- Personajes (aparecen tras el asalto)
    L.npc(id="dagna", cell=(15, 20), face=-45, name="Dagna Emberforge", title="Herrera", requires="e1_done", shop="smith",
          visual={"model": "barbarian", "species": "dwarf", "class": "fighter", "skin": "#c9946c", "hair": "#9a4a24", "cloth": "#5b4332"},
          pronoun="f", greet=["«Si es de acero, lo arreglo. Si es de trasgo, lo fundo. ¿Qué te hace falta?»"],
          talk=["«Esos trasgos llevaban hojas buenas, de las que no se forjan en una cueva. Alguien les está vendiendo armas.»"])
    L.npc(id="ysolde", cell=(27, 21), face=0, name="Ysolde", title="Herbolaria", requires="e1_done", shop="herbalist",
          visual={"model": "mage", "species": "human", "class": "druid", "skin": "#e8c3a0", "hair": "#c9b48a", "cloth": "#4f6b3a"},
          pronoun="f", greet=["«Raíz de sangre para las heridas, cardo para el veneno. Y paciencia, que no se vende.»"],
          talk=["«El bosque está raro desde que se agrietó el toro. Los lobos bajan a los pastos y los pájaros no cantan.»"])
    L.npc(id="tobin", cell=(38, 15), face=-60, name="Tobin Hilltopple", title="Buhonero", requires="e1_done", shop="peddler",
          visual={"model": "rogue_hooded", "species": "halfling", "class": "rogue", "skin": "#d9a882", "hair": "#6b4a2b", "cloth": "#7a5a2a"},
          pronoun="m", greet=["«¡Género de todas las Marcas! Cuerdas, pergaminos, cosas raras… Todo honrado. Casi todo.»"],
          talk=["«Yo de vosotros, al bosque iría de día y mirando dónde piso. Los Zarpas Grises ponen cepos.»"])
    L.npc(id="corwin", cell=(19, 12), face=0, name="Corwin", title="Posadero", requires="e1_done", inn=True,
          visual={"model": "barbarian", "species": "human", "class": "fighter", "skin": "#e0b090", "hair": "#4a3020", "cloth": "#7a3b2e"},
          pronoun="m", greet=["«Cama, cena y chimenea, dos piezas de oro por cabeza. Esta noche invita la casa: nos habéis salvado el pellejo.»"],
          talk=["«Los trasgos bajaron por el camino del este, el del bosque de Elderhal. Allí tienen su campamento los Zarpas Grises.»"])
    L.npc(id="aldis", cell=(29, 11), face=0, name="Hermana Aldis", title="Sacerdotisa de Solenne", requires="e1_done", temple=True,
          visual={"model": "mage", "species": "human", "class": "cleric", "skin": "#f0d0b0", "hair": "#d8d8d0", "cloth": "#d8c890"},
          pronoun="f", greet=["«Que el alba te encuentre en pie. ¿Vienes por heridas del cuerpo o del alma?»"],
          talk=["«Los Durn tallaron siete toros. Mi abuela decía que, mientras miren a las colinas, lo que duerme debajo no despierta.»"])
    L.npc(id="maren", cell=(30, 19), face=90, name="Maren Ashford", title="Alcaldesa de Merrowick", requires="e1_done",
          visual={"model": "rogue", "species": "human", "class": "bard", "skin": "#d8b090", "hair": "#2e2a28", "cloth": "#5a3f6b"},
          pronoun="f", greet=["«Merrowick os debe una. Y me temo que voy a pediros otra.»"],
          talk=["«Los trasgos vinieron del bosque de Elderhal. Si su campamento sigue allí, volverán. Acabad con él y la aldea os lo pagará: cincuenta piezas de oro.»"],
          journal="El campamento de los Zarpas Grises está en el bosque de Elderhal, al este. La alcaldesa pagará 50 po si acabamos con él.",
          sets="quest_camp")
    # ---- El asalto del prólogo (combate 1)
    L.group("e1", [("goblin_minion", (28, 13), 220), ("goblin_minion", (29, 16), 270), ("goblin_minion", (27, 19), 300),
                   ("goblin_warrior", (28, 15), 270), ("goblin_warrior", (29, 18), 270),
                   ("goblin_archer", (31, 17), 270)],
            name="El toro que sangra", sight=9, ambush=True, flag="e1_done", level_after=2,
            tips=["Toca una casilla azul para moverte. Si te equivocas, pulsa Deshacer antes de actuar.",
                  "Toca un enemigo para ver tu probabilidad de impactar y el daño esperado. Vuelve a tocarlo para atacar.",
                  "Los pícaros hacen daño extra (ataque furtivo) si un aliado está junto a su objetivo."],
            loot=[["gold", 11], ["goblin_charm", 2], ["potion_healing", 1]],
            after=["El último trasgo cae junto al abrevadero. En el silencio que sigue, todos oís lo mismo: un latido lento y grave que viene de debajo del toro.",
                   "Las puertas de Merrowick se abren poco a poco. La gente sale a mirar, a dar las gracias, a preguntar."],
            journal="Unos trasgos de los Zarpas Grises han asaltado Merrowick. El toro de granito del prado se ha agrietado y sangra. La alcaldesa quiere hablar con nosotros.")
    L.triggers = [
        {"id": "arrive", "cells": [[2, 16], [2, 17], [2, 18]], "once": True, "on_load": True, "spawn": "arrival",
         "text": ["Merrowick, al caer la tarde. Humo de chimeneas, olor a lana mojada y, al fondo, el toro de piedra del prado.",
                  "Algo va mal: los perros ladran hacia el este y no hay nadie en la calle."],
         "hint": "Toca el suelo para moverte. Arrastra para mover la cámara; pellizca para acercarla."},
    ]
    return L


# ======================================================================= ELDERHAL
def elderhal():
    rng = random.Random(21)
    random.seed(21)
    L = Level("elderhal", 50, 36)
    L.meta = {"name": "Bosque de Elderhal", "place": "Pinar viejo al este de Merrowick", "ambient": "forest",
              "music": "bosque", "music_combat": "combate", "ground": {".": "path"}}
    L.spawns = {"entry": [2, 30], "default": [4, 29]}
    # Senda desde el suroeste hasta el campamento del noreste
    path = L.road([(0, 30), (8, 28), (14, 24), (20, 22), (27, 21), (31, 17), (35, 13), (40, 9), (44, 7)], ch=".")
    L.road([(20, 22), (24, 26), (33, 28), (39, 28)], ch=".")      # ramal al santuario
    L.road([(14, 24), (12, 18), (15, 14)], ch=".")                 # ramal al estanque
    # Estanque con juncos
    for c in disc((16, 11), 2) + disc((18, 12), 1):
        L.g.set(c, "w")
    for c in ring((16, 11), 3) + ring((18, 12), 2):
        if L.g.get(c) == ",":
            L.g.set(c, "~" if rng.random() < 0.5 else ",")
    L.reserved |= set(disc((16, 11), 5))
    # Claro del campamento trasgo, con empalizada
    camp = (43, 6)
    for c in disc(camp, 5):
        if L.g.get(c) in ",T":
            L.g.set(c, ".")
    for c in ring(camp, 6):
        if L.g.inb(c) and rng.random() < 0.8 and c not in path:
            L.g.set(c, "f")
    L.reserved |= set(disc(camp, 6))
    L.prop("tent", (40, 4), rot=150, block="O")
    L.prop("tent", (46, 3), rot=200, block="O")
    L.prop("tent", (46, 9), rot=250, block="O")
    L.prop("stumps", (39, 8), rot=30, block="o")
    L.prop("crate_open", (44, 3), rot=10, block="o")
    L.prop("barrel", (41, 3), rot=0, block="o")
    L.prop("weaponrack", (47, 6), rot=-90, block="o")
    L.prop("flag", (44, 9), rot=0, block="o")
    L.obj(id="camp_fire", type="campfire", cell=(43, 6), name="Hoguera de los trasgos", block=True, requires="camp_done")
    L.dress("q_cage", (45, 8), rot=20, allow=",.")
    L.dress("q_barrel", (47, 4), allow=",.")
    L.dress("q_crate", (42, 3), rot=25, allow=",.")
    L.dress("q_banner2", (40, 7), rot=-60, allow=",.")
    L.dress("q_chain", (46, 6), block=False, allow=",.")
    for off in ([-0.55, 0.0], [0.5, 0.25], [0.0, -0.55]):
        L.decor.append({"key": "lumber", "cell": [43, 6], "rot": int(math.degrees(math.atan2(off[0], off[1]))) + 90, "scale": 0.55, "offset": off})
    for c, k in [((44, 8), "skull"), ((41, 6), "bones"), ((45, 4), "bones"), ((42, 9), "ribcage")]:
        L.dress(k, c, block=False, allow=",.", offset=[0.2, -0.1])
    L.animal("deer", (29, 24), wander=1.5)
    L.animal("deer", (32, 23), wander=1.5)
    L.light((43, 6), "#ff8a3a", 1.6, 6.0, 0.8)
    # Santuario de Solenne arrasado
    L.prop("ruin", (42, 28), rot=200, scale=1.2, block="B")
    for c in disc((42, 28), 1):
        L.g.set(c, "B")
    L.prop("shrine", (39, 30), rot=20, block="o")
    L.prop("rubble", (44, 31), rot=50, block="o")
    L.prop("rubble", (38, 26), rot=150, block="o")
    # Bosque denso
    for y in range(36):
        for x in range(50):
            c = (x, y)
            if c in L.reserved or L.g.get(c) != ",":
                continue
            d = min(x, y, 49 - x, 35 - y)
            p = 0.62 if d < 3 else 0.22
            if rng.random() < p:
                L.g.set(c, "T")
            elif rng.random() < 0.05:
                L.g.set(c, "b")
            elif rng.random() < 0.02:
                L.g.set(c, "r")
    # Despejar alrededor de la senda
    for c in thick(path, 2):
        if L.g.get(c) == "T" and rng.random() < 0.7:
            L.g.set(c, ",")
    for c in [(0, 29), (0, 30), (0, 31)]:
        L.g.set(c, ".")
    L.spawns = {"entry": [2, 30], "default": [4, 29]}
    L.exits = [{"id": "back", "cells": [[0, 29], [0, 30], [0, 31]], "label": "Volver al camino", "to": "travel"}]
    # Claro para acampar
    for c in disc((7, 25), 2):
        if L.g.get(c) in "Tbr":
            L.g.set(c, ",")
    L.obj(id="camp_rest", type="campfire", cell=(7, 25), name="Claro tranquilo", block=True)
    # Objetos
    L.obj(id="pilgrim", type="loot", cell=(29, 23), name="Restos de un peregrino", block=False,
          loot=[["gold", 6], ["scroll_cure_wounds", 1], ["holy_symbol", 1]])
    L.obj(id="stash", type="cache", cell=(9, 9), name="Hueco en un tronco", hidden={"dc": 14},
          loot=[["gold", 25], ["potion_healing", 1], ["bolts", 1], ["gloves_thievery", 1]],
          found_text="Un tronco hueco con la corteza marcada a navaja: dentro hay un hatillo bien atado. Alguien guarda aquí su contrabando.")
    L.obj(id="shrine_box", type="chest", cell=(40, 30), name="Cepillo de las ofrendas", lock={"dc": 12},
          loot=[["gold", 12], ["scroll_bless", 1], ["potion_healing", 1]])
    L.obj(id="shrine_rubble", type="cache", cell=(45, 29), name="Entre los escombros", hidden={"dc": 15},
          loot=[["periapt_wound_closure", 1], ["gem_quartz", 1]],
          found_text="Bajo una viga caída brilla algo: un colgante que los saqueadores no vieron.")
    L.obj(id="shrine_text", type="inspect", cell=(39, 29), name="Santuario de Solenne", block=False, text=[
        "Un santuario de piedra blanca, quemado y saqueado. Alguien ha pintado con barro una zarpa sobre el disco del alba.",
        "Entre las cenizas hay huellas pequeñas, de trasgo, y otras más grandes que no sabéis reconocer."])
    L.obj(id="boss_chest", type="chest", cell=(45, 5), name="Arcón del cabecilla", lock={"dc": 15, "key": "key_cache"},
          loot=[["gold", 30], ["durn_tablet", 1], ["shortbow_p1", 1], ["gem_garnet", 1], ["scroll_web", 1]])
    # Trampas en la senda del campamento
    L.obj(id="snare", type="trap", cell=(33, 15), name="Cepo", hidden={"dc": 12}, dc_disarm=12, damage="2d4", dtype="piercing",
          save={"ab": "dex", "dc": 12}, block=False, desc="Un cepo de dientes de hierro, tapado con agujas de pino.")
    L.obj(id="pit", type="trap", cell=(37, 11), name="Foso con estacas", hidden={"dc": 13}, dc_disarm=13, damage="2d6", dtype="piercing",
          save={"ab": "dex", "dc": 13}, block=False, desc="Un foso cubierto con ramas. En el fondo, estacas afiladas.")
    L.obj(id="tripwire", type="trap", cell=(39, 10), name="Cuerda con latas", hidden={"dc": 12}, dc_disarm=10, damage="0",
          alarm="camp", block=False, desc="Una cuerda tensa a la altura del tobillo, atada a un manojo de latas.")
    for c in [(33, 15), (37, 11), (39, 10)]:
        L.g.set(c, ".")
    # Enemigos
    L.group("wolves", [("wolf", (19, 8), 200), ("wolf", (21, 10), 220), ("wolf", (13, 8), 160)],
            name="Lobos del estanque", sight=7, loot=[], flag="wolves_done",
            journal="Unos lobos rondaban el estanque de Elderhal. Ya no rondarán más.")
    L.group("sentries", [("goblin_minion", (31, 19), 230), ("goblin_archer", (33, 18), 230)],
            name="Centinelas trasgos", sight=8, link=["camp"] if False else [])
    L.group("camp", [("goblin_boss", (44, 6), 220), ("goblin_warrior", (41, 7), 230), ("goblin_warrior", (42, 9), 250),
                     ("goblin_archer", (46, 7), 230), ("goblin_archer", (40, 5), 200)],
            name="El campamento de los Zarpas Grises", sight=7, flag="camp_done", level_after=3,
            loot=[["gold", 14], ["potion_healing", 1]],
            after=["El cabecilla de los Zarpas Grises cae de rodillas. Antes de que se le apague la mirada, sonríe con todos los dientes:",
                   "«Llegáis tarde. El que duerme bajo el toro ya nos ha llamado… y nos ha prometido la piedra.»",
                   "Lleva colgada del cuello una llave oxidada."],
            journal="Hemos acabado con el campamento de los Zarpas Grises. El cabecilla habló de «el que duerme bajo el toro». La alcaldesa Maren nos debe 50 po.")
    L.triggers = [
        {"id": "enter", "cells": [], "once": True, "on_load": True, "spawn": "entry",
         "text": ["El pinar de Elderhal huele a resina y a humo. Hay demasiado silencio para ser de día."],
         "hint": "Los trasgos ponen trampas: la Percepción pasiva del grupo puede descubrirlas al pasar cerca, y el botón Buscar revisa los alrededores con más calma. Con Sigilo os movéis despacio, pero podéis acercaros sin que os vean y pillarlos por sorpresa."},
    ]
    return L


# ======================================================================= TÚMULO
def tumulo():
    L = Level("tumulo", 25, 21, fill="#")
    L.floor = "="
    L.meta = {"name": "Túmulo de Durn-Kahl", "place": "Bajo el toro de Merrowick", "ambient": "crypt", "music": "tumulo",
              "music_combat": "tumulo", "wall_height": 0.85}
    L.spawns = {"entry": [12, 18], "default": [12, 18]}
    hall = ["#####################",
            "#=====#=======#=====#",
            "#=====#===P===#=====#",
            "#=P=========g=====P=#",
            "#=====x===========x=#",
            "#==g====P=====P=====#",
            "#===================#",
            "#==g====P=====P=====#",
            "#=====x===========x=#",
            "#=P=========g=====P=#",
            "#=====#=======#=====#",
            "#=====#===P===#=====#",
            "####=====#=#=====####"]
    for y, row in enumerate(hall):
        for x, ch in enumerate(row):
            L.g.set((x + 2, y), ch)
    # Antesala ancha con la escalera al fondo
    for y in range(13, 20):
        for x in range(6, 19):
            L.g.set((x, y), "=")
    for c in [(8, 15), (16, 15), (8, 18), (16, 18)]:
        L.g.set(c, "P")
    for c in [(10, 17), (14, 14)]:
        L.g.set(c, "x")
    for c in polyline([(12, 19), (12, 20)]):
        L.g.set(c, "=")
    # Atrezo de la cripta
    for c in [(11, 2), (13, 2), (3, 9), (21, 3)]:
        if L.dress("q_candles", c, block=False, allow="="):
            L.light(c, "#ffb050", 0.9, 3.0, 0.9)
    for c, k in [((5, 3), "q_coins"), ((4, 4), "q_vase_rubble"), ((20, 9), "q_vase"), ((19, 8), "q_chain"),
                 ((7, 6), "skull"), ((17, 6), "bones"), ((9, 16), "q_vase_rubble"), ((15, 17), "ribcage"),
                 ((13, 9), "q_coins2"), ((3, 11), "q_vase_s")]:
        L.dress(k, c, block=False, allow="=", offset=[0.15, 0.1])
    L.spawns = {"entry": [12, 18], "default": [12, 18]}
    L.obj(id="up", type="stairs", cell=(12, 20), name="Escalera al prado", to="level:merrowick:tumulo", block=False,
          text=["La escalera sube hacia la luz gris del prado de Merrowick."])
    L.obj(id="seal_door", type="inspect", cell=(12, 1), name="La puerta del sello", block=False, text=[
        "Una puerta de granito sin tirador ni bisagras. En el centro, tres huecos con forma de cuerno y, alrededor, runas durn que palpitan con una luz rojiza.",
        "La Marca de tu piel late al mismo ritmo. Detrás de esa puerta está el primer sello.",
        "[color=#bfb3a0](Lo que hay más allá llegará en la fase 3.)[/color]"], requires="tumulo_hall_done")
    L.obj(id="sarcophagus", type="chest", cell=(4, 3), name="Sarcófago de un guardián", lock={"dc": 14},
          loot=[["gold", 38], ["coin_durn", 5], ["shield_p1", 1], ["potion_greater_healing", 1]])
    L.group("guardians", [("wight", (12, 4), 180), ("skeleton", (10, 5), 180), ("skeleton", (14, 5), 180),
                          ("skeleton_archer", (19, 3), 210), ("zombie", (12, 2), 180)],
            name="Los guardianes de Durn-Kahl", sight=7, flag="tumulo_hall_done",
            loot=[["gold", 20]],
            story_after=["Cuando el último guardián se deshace en polvo, el túmulo queda en silencio. Solo se oye vuestra respiración… y, muy por debajo, ese latido lento que ya conocéis.",
                         "Al fondo de la sala, la puerta del sello brilla con una luz rojiza. Tres huecos con forma de cuerno esperan algo que todavía no tenéis.",
                         "Aquí termina, por ahora, la fase 2 de Marca de Granito. Podéis seguir explorando Merrowick y el bosque, comerciar y descansar: la partida queda guardada para cuando llegue el final del capítulo."],
            story_title="Continuará")
    L.triggers = [
        {"id": "enter", "cells": [], "once": True, "on_load": True, "spawn": "entry",
         "text": ["Los peldaños bajan más de lo que parece posible. Huele a piedra mojada y a algo dulzón, viejo.",
                  "Al fondo, en una sala de columnas, algo se mueve entre los sarcófagos."]},
    ]
    return L


if __name__ == "__main__":
    os.makedirs("data/levels", exist_ok=True)
    merrowick().save("data/levels/merrowick.json")
    elderhal().save("data/levels/elderhal.json")
    tumulo().save("data/levels/tumulo.json")
