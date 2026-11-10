#!/usr/bin/env python3
"""Genera data/items.json (objetos del SRD 5.2.1 y propios) y añade precios a armas y armaduras.
Uso: python3 tools/data_gen/gen_items.py  (desde la raíz del proyecto)"""
import json, collections

W = json.load(open("data/weapons.json"), object_pairs_hook=collections.OrderedDict)
A = json.load(open("data/armor.json"), object_pairs_hook=collections.OrderedDict)

# Precios del SRD 5.2.1 en piezas de oro
WEAPON_COST = {"club": 0.1, "dagger": 2, "greatclub": 0.2, "handaxe": 5, "javelin": 0.5, "light_hammer": 2, "mace": 5,
    "quarterstaff": 0.2, "sickle": 1, "spear": 1, "dart": 0.05, "light_crossbow": 25, "shortbow": 25, "sling": 0.1,
    "battleaxe": 10, "flail": 10, "glaive": 20, "greataxe": 30, "greatsword": 50, "halberd": 20, "longsword": 15,
    "maul": 10, "morningstar": 15, "rapier": 25, "scimitar": 25, "shortsword": 10, "warhammer": 15, "war_pick": 5,
    "hand_crossbow": 75, "heavy_crossbow": 50, "longbow": 50}
WEAPON_WEIGHT = {"club": 2, "dagger": 1, "greatclub": 10, "handaxe": 2, "javelin": 2, "light_hammer": 2, "mace": 4,
    "quarterstaff": 4, "sickle": 2, "spear": 3, "dart": 0.25, "light_crossbow": 5, "shortbow": 2, "sling": 0,
    "battleaxe": 4, "flail": 2, "glaive": 6, "greataxe": 7, "greatsword": 6, "halberd": 6, "longsword": 3,
    "maul": 10, "morningstar": 4, "rapier": 2, "scimitar": 3, "shortsword": 2, "warhammer": 5, "war_pick": 5,
    "hand_crossbow": 3, "heavy_crossbow": 18, "longbow": 2}
ARMOR_COST = {"padded": 5, "leather": 10, "studded_leather": 45, "hide": 10, "chain_shirt": 50, "scale_mail": 50,
    "breastplate": 400, "half_plate": 750, "ring_mail": 30, "chain_mail": 75, "splint": 200, "plate": 1500}
ARMOR_WEIGHT = {"padded": 8, "leather": 10, "studded_leather": 13, "hide": 12, "chain_shirt": 20, "scale_mail": 45,
    "breastplate": 20, "half_plate": 40, "ring_mail": 40, "chain_mail": 55, "splint": 60, "plate": 65}
for k, v in W.items():
    if k.startswith("_") or k == "unarmed":
        continue
    v["cost"] = WEAPON_COST[k]
    v["weight"] = WEAPON_WEIGHT[k]
for k, v in A.items():
    if k.startswith("_"):
        continue
    v["cost"] = ARMOR_COST[k]
    v["weight"] = ARMOR_WEIGHT[k]

def dump_compact(d, path):
    lines = ["{"]
    keys = list(d.keys())
    for i, k in enumerate(keys):
        sep = "," if i < len(keys) - 1 else ""
        lines.append("  %s: %s%s" % (json.dumps(k, ensure_ascii=False), json.dumps(d[k], ensure_ascii=False), sep))
    lines.append("}")
    open(path, "w").write("\n".join(lines) + "\n")

dump_compact(W, "data/weapons.json")
dump_compact(A, "data/armor.json")

I = collections.OrderedDict()
I["_fuente"] = ("Objetos. Los objetos mágicos, pociones, pergaminos y equipo proceden del SRD 5.2.1 (CC-BY-4.0); "
    "tesoros, llaves y objetos de historia son propios. Las armas y armaduras normales se leen de weapons.json y armor.json. "
    "kind: gear | tool | potion | scroll | wand | ammo | shield | wondrous | treasure | key. value en po.")

def add(id_, **kw):
    I[id_] = kw

# ---------------------------------------------------------------- escudos
add("shield", name="Escudo", kind="shield", slot="shield", value=10, weight=6, desc="+2 a la CA mientras lo empuñas.", icon="shield")
add("shield_p1", name="Escudo +1", kind="shield", slot="shield", bonus=1, rarity="uncommon", value=400, weight=6,
    desc="Escudo mágico: +3 a la CA (2 del escudo y 1 de su magia).", icon="shield", unid_name="Escudo de factura extraña")

# ---------------------------------------------------------------- armas y armaduras mágicas
MAGIC_WEAPONS = ["dagger", "shortsword", "longsword", "rapier", "scimitar", "mace", "warhammer", "battleaxe", "greataxe",
    "greatsword", "quarterstaff", "spear", "handaxe", "shortbow", "longbow", "light_crossbow", "javelin", "sickle", "flail"]
for w in MAGIC_WEAPONS:
    base = W[w]
    add(w + "_p1", name=base["name"] + " +1", kind="weapon", base=w, bonus=1, rarity="uncommon", value=400 + WEAPON_COST[w],
        weight=WEAPON_WEIGHT[w], desc="Arma mágica: +1 a las tiradas de ataque y de daño.",
        unid_name=base["name"] + " de buena factura")
for a in ["leather", "studded_leather", "chain_shirt", "chain_mail", "breastplate"]:
    base = A[a]
    add(a + "_p1", name=base["name"] + " +1", kind="armor", base=a, bonus=1, rarity="rare", value=4000 + ARMOR_COST[a],
        weight=ARMOR_WEIGHT[a], desc="Armadura mágica: +1 a la CA.", unid_name=base["name"] + " de buena factura")

# ---------------------------------------------------------------- objetos maravillosos
def wondrous(id_, name, slot, rarity, desc, mods, attune=True, unid=None, value=None, icon="magic"):
    add(id_, name=name, kind="wondrous", slot=slot, rarity=rarity, attune=attune, mods=mods, desc=desc,
        value=value if value is not None else {"common": 100, "uncommon": 400, "rare": 4000}[rarity], weight=1,
        unid_name=unid or "Objeto mágico desconocido", icon=icon)

wondrous("cloak_protection", "Capa de protección", "cloak", "uncommon", "+1 a la CA y a todas las tiradas de salvación.",
    {"ac": 1, "saves": 1}, unid="Capa forrada de seda gris", icon="cloak")
wondrous("cloak_elvenkind", "Capa élfica", "cloak", "uncommon",
    "Con la capucha puesta tienes ventaja en las pruebas de Sigilo y los demás tienen desventaja en las de Percepción para verte.",
    {"adv": ["stealth"]}, unid="Capa que cambia de color con la luz", icon="cloak")
wondrous("ring_protection", "Anillo de protección", "ring", "rare", "+1 a la CA y a todas las tiradas de salvación.",
    {"ac": 1, "saves": 1}, unid="Anillo de plata sin adornos", icon="ring")
wondrous("boots_elvenkind", "Botas élficas", "boots", "uncommon", "Tus pasos no hacen ruido: ventaja en las pruebas de Sigilo.",
    {"adv": ["stealth"]}, attune=False, unid="Botas de cuero blando", icon="boots")
wondrous("boots_striding", "Botas de zancadas y saltos", "boots", "uncommon",
    "Tu velocidad es al menos de 30 pies y no la reducen el peso ni la armadura.", {"speed_min": 30, "ignore_armor_speed": True},
    unid="Botas con espuelas de bronce", icon="boots")
wondrous("gauntlets_ogre_power", "Guanteletes de fuerza de ogro", "gloves", "uncommon",
    "Tu Fuerza pasa a ser 19 (si no era ya mayor).", {"set": {"str": 19}}, unid="Guanteletes pesados de hierro negro", icon="gauntlets")
wondrous("gloves_thievery", "Guantes de ladrón", "gloves", "uncommon",
    "Invisibles mientras los llevas: +5 a las pruebas de Juego de manos y para forzar cerraduras y desactivar trampas.",
    {"skill": {"sleight_of_hand": 5}, "tools": 5}, attune=False, unid="Guantes finos casi transparentes", icon="gauntlets")
wondrous("bracers_defense", "Brazales de defensa", "gloves", "rare",
    "+2 a la CA si no llevas armadura ni escudo.", {"ac_unarmored": 2}, unid="Brazales de cuero repujado", icon="gauntlets")
wondrous("stone_good_luck", "Piedra de la suerte", "amulet", "uncommon",
    "Una ágata pulida en un colgante: +1 a las pruebas de característica y a las tiradas de salvación.",
    {"checks": 1, "saves": 1}, unid="Colgante con una ágata pulida", icon="amulet")
wondrous("periapt_wound_closure", "Periapto de cierre de heridas", "amulet", "uncommon",
    "Te estabilizas solo si caes a 0 PG, y los dados de golpe que gastas para curarte curan el doble.",
    {"wound_closure": True}, unid="Colgante con una piedra roja", icon="amulet")
wondrous("brooch_shielding", "Broche de escudo", "amulet", "uncommon",
    "Resistencia al daño de fuerza e inmunidad a Proyectil mágico.", {"resist": ["force"], "immune_spell": ["magic_missile"]},
    unid="Broche de plata con forma de escudo", icon="amulet")
wondrous("amulet_health", "Amuleto de salud", "amulet", "rare", "Tu Constitución pasa a ser 19 (si no era ya mayor).",
    {"set": {"con": 19}}, unid="Amuleto de ámbar", icon="amulet")
wondrous("pearl_power", "Perla de poder", "amulet", "uncommon",
    "Una vez al día, fuera de combate, recuperas un espacio de conjuro gastado de nivel 3 o menor.",
    {"pearl": True}, unid="Perla blanca del tamaño de una uva", icon="amulet")

# ---------------------------------------------------------------- varitas
add("wand_magic_missiles", name="Varita de proyectiles mágicos", kind="wand", rarity="uncommon", value=400, weight=1,
    spell="magic_missile", charges=7, recharge="1d6+1", any_user=True,
    desc="7 cargas. Lanza Proyectil mágico gastando 1 carga por nivel de conjuro (hasta 3). Recupera 1d6+1 cargas cada amanecer.", icon="wand")
add("wand_web", name="Varita de telaraña", kind="wand", rarity="uncommon", value=400, weight=1, spell="web", charges=7,
    recharge="1d6+1", dc=13, needs_caster=True,
    desc="Solo para lanzadores de conjuros. 7 cargas. Lanza Telaraña (CD 13) gastando 1 carga. Recupera 1d6+1 cargas cada amanecer.", icon="wand")

# ---------------------------------------------------------------- pociones
add("potion_healing", name="Poción de curación", kind="potion", rarity="common", value=50, weight=0.5,
    use={"heal": "2d4+2"}, desc="Recuperas 2d4 + 2 puntos de golpe. Beberla o dársela a un aliado adyacente es una acción adicional.", icon="potion")
add("potion_greater_healing", name="Poción de curación mayor", kind="potion", rarity="uncommon", value=150, weight=0.5,
    use={"heal": "4d4+4"}, desc="Recuperas 4d4 + 4 puntos de golpe. Acción adicional.", icon="potion")
add("potion_giant_strength", name="Poción de fuerza de gigante de las colinas", kind="potion", rarity="uncommon", value=200,
    weight=0.5, use={"set": {"str": 21}, "battle_only": True},
    desc="Tu Fuerza pasa a ser 21 durante una hora (el resto del combate).", icon="potion")
add("antitoxin", name="Antitoxina", kind="potion", rarity="common", value=50, weight=0,
    use={"effect": "antitoxin", "battle_only": True}, desc="Ventaja en las salvaciones contra veneno durante una hora (el resto del combate).", icon="potion")

# ---------------------------------------------------------------- pergaminos (SRD: CD 13, ataque +5 para niveles 0-2)
SCROLLS = [("cure_wounds", "Curar heridas", 1), ("healing_word", "Palabra de curación", 1), ("bless", "Bendición", 1),
    ("magic_missile", "Proyectil mágico", 1), ("burning_hands", "Manos ardientes", 1), ("sleep", "Dormir", 1),
    ("shield_of_faith", "Escudo de fe", 1), ("entangle", "Enmarañar", 1), ("guiding_bolt", "Saeta guía", 1),
    ("web", "Telaraña", 2), ("scorching_ray", "Rayo abrasador", 2), ("lesser_restoration", "Restablecimiento menor", 2)]
for sid, nm, lvl in SCROLLS:
    add("scroll_" + sid, name="Pergamino: " + nm, kind="scroll", spell=sid, level=lvl, dc=13, atk=5,
        rarity="common" if lvl == 1 else "uncommon", value=60 if lvl == 1 else 120, weight=0,
        desc="Si el conjuro está en la lista de tu clase, puedes lanzarlo desde el pergamino (CD 13, ataque +5). Se consume.", icon="scroll")

# ---------------------------------------------------------------- munición
add("arrows", name="Flechas (20)", kind="ammo", ammo="arrows", count=20, value=1, weight=1, desc="Munición para arcos.", icon="ranged")
add("bolts", name="Virotes (20)", kind="ammo", ammo="bolts", count=20, value=1, weight=1.5, desc="Munición para ballestas.", icon="ranged")
add("bullets", name="Balas de honda (20)", kind="ammo", ammo="bullets", count=20, value=1, weight=1.5, desc="Munición para hondas.", icon="ranged")
add("javelins", name="Jabalinas (4)", kind="ammo", ammo="javelin", count=4, value=2, weight=8, desc="Para quien ya lleva jabalinas.", icon="thrown")
add("handaxes", name="Hachas arrojadizas (2)", kind="ammo", ammo="handaxe", count=2, value=10, weight=4, desc="Para quien ya lleva hachas de mano.", icon="thrown")
add("darts", name="Dardos (10)", kind="ammo", ammo="dart", count=10, value=1, weight=2.5, desc="Para quien ya lleva dardos.", icon="thrown")
add("daggers", name="Dagas arrojadizas (2)", kind="ammo", ammo="dagger", count=2, value=4, weight=2, desc="Para quien ya lleva dagas.", icon="thrown")

# ---------------------------------------------------------------- equipo y herramientas
add("thieves_tools", name="Herramientas de ladrón", kind="tool", value=25, weight=1, desc="Ganzúas y limas para abrir cerraduras y desactivar trampas.", icon="lockpick")
add("healers_kit", name="Útiles de sanador", kind="tool", value=5, weight=3, desc="Vendas y ungüentos: estabilizas a un aliado sin tirada.", icon="heal")
add("herbalism_kit", name="Útiles de herborista", kind="tool", value=5, weight=3, desc="Para identificar plantas y preparar remedios.", icon="nature")
add("crowbar", name="Palanca", kind="gear", value=2, weight=5, desc="Ventaja en las pruebas de Fuerza para forzar puertas y cofres.", icon="crowbar")
add("rope", name="Cuerda de cáñamo (15 m)", kind="gear", value=1, weight=5, desc="Para trepar, atar o bajar a un pozo.", icon="rope")
add("torch", name="Antorcha", kind="gear", value=0.01, weight=1, desc="Luz brillante en 6 m durante una hora.", icon="torch")
add("rations", name="Raciones (1 día)", kind="gear", value=0.5, weight=2, desc="Comida seca para un día de camino.", icon="rations")
add("holy_symbol", name="Símbolo sagrado", kind="gear", value=5, weight=1, desc="Foco para los conjuros de clérigos y paladines.", icon="ankh")
add("prayer_book", name="Libro de oraciones", kind="gear", value=25, weight=5, desc="Oraciones y ritos de la Orden del Alba.", icon="book")
add("history_book", name="Libro de historia", kind="gear", value=25, weight=5, desc="Crónicas de los reinos de Eredhal, con notas al margen.", icon="book")
add("lute", name="Laúd", kind="tool", value=35, weight=2, desc="Instrumento musical; también sirve de foco bárdico.", icon="lute")
add("manacles", name="Grilletes", kind="gear", value=2, weight=6, desc="Para sujetar a un prisionero de tamaño Pequeño o Mediano.", icon="chain")
add("signet_ring", name="Anillo de sello", kind="gear", value=5, weight=0, desc="Lleva el emblema de tu familia.", icon="ring")
add("spellbook", name="Libro de conjuros", kind="gear", value=50, weight=3, desc="Contiene los conjuros que has aprendido.", icon="book")

# ---------------------------------------------------------------- tesoros
add("coin_durn", name="Moneda durn", kind="treasure", value=5, weight=0, desc="Moneda de cobre verde con un toro grabado. Los coleccionistas de Valdrecht pagan bien por ellas.", icon="coin")
add("gem_agate", name="Ágata musgosa", kind="treasure", value=10, weight=0, desc="Piedra preciosa de poco valor.", icon="gem")
add("gem_quartz", name="Cuarzo rosa", kind="treasure", value=25, weight=0, desc="Un cristal claro de color rosado.", icon="gem")
add("gem_garnet", name="Granate", kind="treasure", value=100, weight=0, desc="Piedra preciosa de un rojo profundo.", icon="gem")
add("silver_ewer", name="Jarra de plata", kind="treasure", value=25, weight=2, desc="Jarra labrada, algo abollada.", icon="cup")
add("goblin_charm", name="Amuleto de los Zarpas Grises", kind="treasure", value=1, weight=0, desc="Un colmillo de lobo con una piedrecita pintada. Los trasgos los llevan como talismán.", icon="fang")
add("wolf_pelt", name="Piel de lobo", kind="treasure", value=2, weight=5, desc="La herrera o el buhonero te darán algo por ella.", icon="paw")

# ---------------------------------------------------------------- llaves y objetos de historia
add("key_mill", name="Llave del molino", kind="key", value=0, weight=0, desc="Una llave de hierro con una rueda grabada.", icon="key")
add("key_cache", name="Llave oxidada", kind="key", value=0, weight=0, desc="La llevaba el cabecilla trasgo colgada del cuello.", icon="key")
add("durn_tablet", name="Tablilla durn", kind="key", value=0, weight=1, desc="Una tablilla de piedra con runas que nadie en Merrowick sabe leer. Maese Odvar daría un ojo por verla.", icon="book")

out = json.dumps(I, ensure_ascii=False)
dump_compact(I, "data/items.json")
print(len(I) - 1, "objetos")
