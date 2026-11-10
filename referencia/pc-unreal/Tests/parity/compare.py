#!/usr/bin/env python3
"""Compara el volcado de Godot con el del núcleo en C++ (mismo formato).
Uso: python3 compare.py godot.json cpp.json [max_diferencias]"""
import json
import sys


def diff(a, b, path, out, limit):
    if len(out) >= limit:
        return
    if isinstance(a, bool) or isinstance(b, bool):
        if a != b:
            out.append((path, a, b))
        return
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        if abs(a - b) > 1e-6:
            out.append((path, a, b))
        return
    if type(a) != type(b):
        out.append((path, a, b))
        return
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a:
                out.append((path + "/" + k, "<falta>", b[k]))
            elif k not in b:
                out.append((path + "/" + k, a[k], "<falta>"))
            else:
                diff(a[k], b[k], path + "/" + k, out, limit)
        return
    if isinstance(a, list):
        if len(a) != len(b):
            out.append((path + " (longitud)", a, b))
            return
        for i, (x, y) in enumerate(zip(a, b)):
            diff(x, y, "%s[%d]" % (path, i), out, limit)
        return
    if a != b:
        out.append((path, a, b))


def main():
    g = json.load(open(sys.argv[1], encoding="utf-8"))
    c = json.load(open(sys.argv[2], encoding="utf-8"))
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 40
    out = []
    diff(g, c, "", out, limit)
    total = 0
    for sec in ("party", "monsters", "synthetic", "maps"):
        total += len(g.get(sec, {}))
    print("casos: %d personajes/monstruos/mapas, %d nombres" % (total, len(g.get("names", []))))
    if not out:
        print("IGUALES")
        return 0
    for p, a, b in out:
        sa = json.dumps(a, ensure_ascii=False)[:160]
        sb = json.dumps(b, ensure_ascii=False)[:160]
        print("%s\n   godot: %s\n   c++  : %s" % (p, sa, sb))
    print("\n%d diferencias (máx. %d)" % (len(out), limit))
    return 1


if __name__ == "__main__":
    sys.exit(main())
