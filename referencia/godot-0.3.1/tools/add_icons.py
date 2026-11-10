#!/usr/bin/env python3
"""Copia iconos de game-icons.net (CC BY 3.0) a assets/icons con el nombre del juego.
Uso: python3 tools/add_icons.py nombre=autor/archivo ..."""
import sys, os, re, shutil
SRC = "/home/claude/tools/dl/icons_x/icons/ffffff/transparent/1x1"
tpl = open("assets/icons/potion.svg.import").read()
tpl = re.sub(r'uid="[^"]*"\n', "", tpl)
for arg in sys.argv[1:]:
    name, path = arg.split("=")
    dst = "assets/icons/%s.svg" % name
    shutil.copy(os.path.join(SRC, path + ".svg"), dst)
    imp = tpl.replace("potion.svg-457e60aa8d0d89d0172a8c85ad63e1e4", name + ".svg-" + format(abs(hash(name)) % (16**32), "032x"))
    imp = imp.replace("res://assets/icons/potion.svg", "res://assets/icons/%s.svg" % name)
    open(dst + ".import", "w").write(imp)
    print("ok", name)
