"""Rebuild the public offline asset list after changing the static site."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1] / "docs"
paths = sorted(
    p for p in root.rglob("*") if p.is_file()
    and p.suffix in {".js", ".mjs", ".html", ".woff2", ".css", ".svg", ".webp", ".png", ".ico", ".webmanifest"}
    and p.name not in {"offline-assets.js", "sw.js"}
)
digest = hashlib.sha256((root / "sw.js").read_bytes())
files = []
for path in paths:
    name = path.relative_to(root).as_posix()
    files.append(name)
    digest.update(name.encode() + b"\x00" + hashlib.sha256(path.read_bytes()).digest())
data = {"version": digest.hexdigest()[:20], "files": files}
(root / "offline-assets.js").write_text("self.OFFLINE = " + json.dumps(data, indent=2) + ";\n")
