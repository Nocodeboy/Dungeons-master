#!/usr/bin/env python3
"""Copia al proyecto los modelos de los packs CC0 de Quaternius (OpenGameArt) que usa el juego.

- Solo los modelos de la lista; las texturas se reducen (móvil) y se comparten en <destino>/tex/.
- Los mapas de normales se quitan de la vegetación (no se notan y cuestan memoria).

Uso: python3 tools/import_assets.py /ruta/a/los/packs/descomprimidos
"""
import json
import os
import shutil
import sys

from PIL import Image

SRC = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/tools/dl/quat"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

PACKS = {
    "qnature": {
        "gltf": "x_stylized_nature_megakitstandard/glTF",
        "tex": "x_stylized_nature_megakitstandard/Textures",
        "drop_normals": True,
        "models": [
            "Grass_Common_Short", "Grass_Common_Tall", "Grass_Wispy_Short", "Grass_Wispy_Tall",
            "Flower_3_Group", "Flower_4_Group", "Flower_3_Single", "Flower_4_Single",
            "Clover_1", "Clover_2", "Fern_1", "Plant_1", "Plant_7", "Plant_7_Big",
            "Bush_Common", "Bush_Common_Flowers", "Mushroom_Common", "Mushroom_Laetiporus",
            "Pebble_Round_1", "Pebble_Round_2", "Pebble_Round_3", "Pebble_Round_4", "Pebble_Round_5",
            "Pebble_Square_1", "Pebble_Square_2", "Pebble_Square_3", "Pebble_Square_4",
            "RockPath_Round_Small_1", "RockPath_Round_Small_2", "RockPath_Round_Small_3",
            "RockPath_Square_Small_1", "RockPath_Square_Small_2", "RockPath_Square_Small_3",
            "Rock_Medium_1", "Rock_Medium_2", "Rock_Medium_3",
            "Pine_1", "Pine_2", "Pine_3", "Pine_4", "Pine_5",
            "CommonTree_1", "CommonTree_2", "CommonTree_3", "CommonTree_4", "CommonTree_5",
            "DeadTree_1", "DeadTree_2", "DeadTree_3", "TwistedTree_1",
        ],
        "sizes": {"default": 512, "Grass.png": 64, "Flowers.png": 256, "Leaves.png": 512},
    },
    "qprops": {
        "gltf": "x_fantasy_props_megakitstandard/Exports/glTF",
        "tex": "x_fantasy_props_megakitstandard/Textures",
        "drop_normals": False,
        "models": [
            "Anvil", "Anvil_Log", "Bag", "Banner_1", "Banner_2", "Barrel", "Barrel_Apples", "Barrel_Holder",
            "Bench", "Bucket_Wooden_1", "Cage_Small", "CandleStick_Stand", "CandleStick_Triple", "Cauldron",
            "Chain_Coil", "Chest_Wood", "Coin_Pile", "Coin_Pile_2", "Crate_Wooden", "Crate_Metal", "Dummy",
            "FarmCrate_Apple", "FarmCrate_Carrot", "FarmCrate_Empty", "Lantern_Wall", "Pot_1_Lid", "Rope_3",
            "Shield_Wooden", "Stall_Cart_Empty", "Stall_Empty", "Stool", "Table_Large", "Torch_Metal",
            "Vase_2", "Vase_4", "Vase_Rubble_Medium", "WeaponStand", "Whetstone", "Workbench",
            "Pickaxe_Bronze", "Axe_Bronze", "Sword_Bronze", "Chair_1", "Mug", "Bookcase_2", "BookStand",
        ],
        "sizes": {"default": 512, "BaseColor": 1024, "T_Page_Noise.png": 256},
    },
    "qvillage": {
        "gltf": "x_medieval_village_megakitstandard/glTF",
        "tex": "x_medieval_village_megakitstandard/Textures",
        "drop_normals": False,
        "models": [
            "Prop_Wagon", "Prop_WoodenFence_Single", "Prop_WoodenFence_Extension1", "Prop_WoodenFence_Extension2",
            "Prop_Vine1", "Prop_Vine2", "Prop_Vine4", "Prop_Vine5", "Prop_Support", "Prop_Crate",
            "Prop_ExteriorBorder_Straight1", "Prop_ExteriorBorder_Corner", "Prop_MetalFence_Simple",
        ],
        "sizes": {"default": 512, "BaseColor": 1024},
    },
}


def tex_size(pack: dict, name: str) -> int:
    sz = pack["sizes"]
    if name in sz:
        return sz[name]
    for k, v in sz.items():
        if k != "default" and k in name:
            return v
    return sz["default"]


def main() -> None:
    for dest, pack in PACKS.items():
        out = os.path.join(ROOT, "assets", "models", dest)
        tex_out = os.path.join(out, "tex")
        os.makedirs(tex_out, exist_ok=True)
        used = set()
        for m in pack["models"]:
            src = os.path.join(SRC, pack["gltf"], m + ".gltf")
            d = json.load(open(src))
            # Quitar normales si se pide (los índices de imagen se conservan; se vacía la referencia)
            if pack["drop_normals"]:
                for mat in d.get("materials", []):
                    mat.pop("normalTexture", None)
            # Texturas que quedan en uso
            live = set()
            for mat in d.get("materials", []):
                for key in ("normalTexture",):
                    if key in mat:
                        live.add(d["textures"][mat[key]["index"]]["source"])
                pbr = mat.get("pbrMetallicRoughness", {})
                for key in ("baseColorTexture", "metallicRoughnessTexture"):
                    if key in pbr:
                        live.add(d["textures"][pbr[key]["index"]]["source"])
            for i, img in enumerate(d.get("images", [])):
                uri = img["uri"]
                img["uri"] = "tex/" + uri
                if i in live:
                    used.add(uri)
            for b in d.get("buffers", []):
                shutil.copy(os.path.join(SRC, pack["gltf"], b["uri"]), os.path.join(out, b["uri"]))
            json.dump(d, open(os.path.join(out, m + ".gltf"), "w"))
        # Las imágenes que ya no usa nadie no hace falta copiarlas, pero el glTF las nombra:
        # se copian todas las citadas (las normales quitadas se dejan en 4x4 para no pesar).
        cited = set()
        for m in pack["models"]:
            for img in json.load(open(os.path.join(out, m + ".gltf"))).get("images", []):
                cited.add(img["uri"][4:])
        for name in sorted(cited):
            src = os.path.join(SRC, pack["tex"], name)
            if not os.path.exists(src):
                src = os.path.join(SRC, pack["gltf"], name)
            dst = os.path.join(tex_out, name)
            im = Image.open(src)
            s = tex_size(pack, name) if name in used else 4
            if max(im.size) > s:
                im = im.resize((s, s) if im.size[0] == im.size[1] else
                               (s, max(1, int(im.size[1] * s / im.size[0]))), Image.LANCZOS)
            im.save(dst, optimize=True)
        print(dest, len(pack["models"]), "modelos,", len(cited), "texturas")


if __name__ == "__main__":
    main()
