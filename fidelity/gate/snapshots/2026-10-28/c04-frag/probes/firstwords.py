"""firstwords.py <dir> <name>...: page count and first two words of every page, vellora vs chrome."""
import subprocess, sys, os
d = sys.argv[1]
for name in sys.argv[2:]:
    for kind in ("vellora", "chrome"):
        f = os.path.join(d, f"{name}.{kind}.pdf")
        n = int([l for l in subprocess.run(["pdfinfo", f], capture_output=True, text=True).stdout.splitlines() if l.startswith("Pages:")][0].split()[1])
        firsts = []
        for p in range(1, n + 1):
            t = subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), f, "-"], capture_output=True, text=True).stdout.split()
            firsts.append(" ".join(t[:2]) or "-")
        print(f"{name:32} {kind:8} {n} | " + " | ".join(firsts))
