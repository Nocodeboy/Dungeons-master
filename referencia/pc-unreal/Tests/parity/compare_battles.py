#!/usr/bin/env python3
"""Compara combates volcados por battle_dump.gd (Godot) y mdg_battle_dump (C++).
Para cada combate dice si es idéntico y, si no, dónde se separan por primera vez
(línea del registro, evento y estado final).
Uso: python3 compare_battles.py godot.json cpp.json [--all]"""
import json
import sys


def norm(v):
    """Enteros y reales iguales cuentan como iguales (JSON de Godot escribe 2.0)."""
    if isinstance(v, bool):
        return v
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, list):
        return [norm(x) for x in v]
    if isinstance(v, dict):
        return {k: norm(x) for k, x in v.items()}
    return v


def first_diff(a, b):
    n = min(len(a), len(b))
    for i in range(n):
        if norm(a[i]) != norm(b[i]):
            return i
    if len(a) != len(b):
        return n
    return -1


def dict_diff(a, b):
    out = []
    for k in sorted(set(a) | set(b)):
        if norm(a.get(k)) != norm(b.get(k)):
            out.append((k, a.get(k), b.get(k)))
    return out


def main():
    g = json.load(open(sys.argv[1], encoding="utf-8"))["battles"]
    c = json.load(open(sys.argv[2], encoding="utf-8"))["battles"]
    show_all = "--all" in sys.argv
    cm = {x["key"]: x for x in c}
    same = 0
    bad = []
    for gb in g:
        cb = cm.get(gb["key"])
        if cb is None:
            bad.append((gb["key"], "falta en C++", None))
            continue
        li = first_diff(gb["log"], cb["log"])
        ei = first_diff(gb["events"], cb["events"])
        fd = [] if len(gb["final"]) != len(cb["final"]) else [
            (x["id"], dict_diff(x, y)) for x, y in zip(gb["final"], cb["final"]) if dict_diff(x, y)]
        pi = first_diff(gb.get("probes", []), cb.get("probes", []))
        top = dict_diff({k: gb[k] for k in ("winner", "over", "round", "guard")},
                        {k: cb[k] for k in ("winner", "over", "round", "guard")})
        if li < 0 and ei < 0 and pi < 0 and not fd and not top:
            same += 1
            continue
        bad.append((gb["key"], (li, ei, fd, top, pi), (gb, cb)))
    print("combates: %d · idénticos: %d · distintos: %d" % (len(g), same, len(bad)))
    for key, info, pair in bad[: (len(bad) if show_all else 6)]:
        print("\n=== %s" % key)
        if pair is None:
            print("   " + info)
            continue
        li, ei, fd, top, pi = info
        gb, cb = pair
        if top:
            print("   resumen:", top)
        if li >= 0:
            print("   registro, línea %d:" % li)
            for j in range(max(0, li - 3), li):
                print("      = %s" % gb["log"][j])
            print("      godot: %s" % (gb["log"][li] if li < len(gb["log"]) else "<fin>"))
            print("      c++  : %s" % (cb["log"][li] if li < len(cb["log"]) else "<fin>"))
        if ei >= 0:
            print("   eventos, nº %d:" % ei)
            for j in range(max(0, ei - 2), ei):
                print("      = %s" % json.dumps(gb["events"][j], ensure_ascii=False)[:200])
            print("      godot: %s" % (json.dumps(gb["events"][ei], ensure_ascii=False)[:300] if ei < len(gb["events"]) else "<fin>"))
            print("      c++  : %s" % (json.dumps(cb["events"][ei], ensure_ascii=False)[:300] if ei < len(cb["events"]) else "<fin>"))
        if pi >= 0:
            gp = gb["probes"][pi] if pi < len(gb["probes"]) else {}
            cp = cb["probes"][pi] if pi < len(cb["probes"]) else {}
            print("   consulta de interfaz nº %d (%s):" % (pi, gp.get("who", cp.get("who"))))
            for k, a, b2 in dict_diff(gp, cp)[:5]:
                print("      %s\n         godot: %s\n         c++  : %s" % (
                    k, json.dumps(a, ensure_ascii=False)[:400], json.dumps(b2, ensure_ascii=False)[:400]))
        for cid, d in fd[:4]:
            print("   final %s: %s" % (cid, json.dumps(d, ensure_ascii=False)[:300]))
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())
