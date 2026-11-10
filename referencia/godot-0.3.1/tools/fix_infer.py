import re, subprocess, sys
for it in range(30):
    out = subprocess.run(["timeout","90","godot","--headless","--path",".","-s","tools/check_scripts.gd"],capture_output=True,text=True)
    txt = out.stdout + out.stderr
    errs = re.findall(r'Parse Error: (.*?)\n\s+at: GDScript::reload \((res://[^:]+):(\d+)\)', txt)
    fixable = [(m,f,int(l)) for m,f,l in errs if ('Cannot infer the type' in m or 'inferred from a Variant' in m)]
    other = [(m,f,int(l)) for m,f,l in errs if not ('Cannot infer the type' in m or 'inferred from a Variant' in m)]
    if other:
        for o in other: print("OTRO:", o)
    if not fixable:
        print("sin errores de inferencia; otros:", len(other))
        break
    by_file = {}
    for m,f,l in fixable:
        by_file.setdefault(f.replace("res://",""),set()).add(l)
    for f,lines in by_file.items():
        src = open(f).read().split("\n")
        for l in lines:
            s = src[l-1]
            if ":=" in s:
                src[l-1] = s.replace(":=", "=", 1)
            else:
                print("no se pudo arreglar", f, l, s)
        open(f,"w").write("\n".join(src))
    print("iteración", it, "arregladas", len(fixable))
