"""Convert reference/data3.py into data/game-data.json.

Usage: python3 scripts/convert-data.py
All fields are copied as is; tuples become arrays and tag sets become sorted arrays,
so the JSON can be converted back without losses.
"""
import importlib.util
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "reference" / "data3.py"
OUT = ROOT / "data" / "game-data.json"

# Volley parameters as in version 0.3 (see docs/TZ.md, "Данные").
VOLLEY_DEFAULTS = {
    "volleyCost": 1,
    "diagDamage": {"offset": -1},
    "defaultTrack": "hull",
    "volleysPerTurn": 1,
    "volleyModes": [],
}


def load_source():
    spec = importlib.util.spec_from_file_location("data3", SRC)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def plain(value):
    if isinstance(value, dict):
        return {k: plain(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [plain(v) for v in value]
    if isinstance(value, set):
        return sorted(plain(v) for v in value)
    return value


def card(c, copies=None):
    out = {k: plain(c[k]) for k in ("name", "type", "cost", "soul", "big", "text", "flavor", "v", "fx", "legend", "tags")}
    if copies is not None:
        out["copies"] = copies
    return out


def ship(s):
    out = {k: plain(v) for k, v in s.items() if k != "abilities"}
    out["abilities"] = [{"name": n, "text": t} for n, t in s["abilities"]]
    out.update(VOLLEY_DEFAULTS)
    return out


def main():
    d = load_source()
    data = {
        "version": "0.3",
        "econ": dict(d.ECON),
        "ships": [ship(s) for s in d.SHIPS],
        "decks": {code: [card(c, n) for c, n in cards] for code, cards in d.DECKS.items()},
        "legends": {code: card(c) for code, c in d.LEGENDS.items()},
        "sea": [dict(name=n, when=w, big=b, text=t, flavor=f, key=k) for n, w, b, t, f, k in d.SEA],
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(c["copies"] for cards in data["decks"].values() for c in cards) + len(data["legends"]) + len(data["sea"])
    print(f"Wrote {OUT.relative_to(ROOT)}: {total} cards")


if __name__ == "__main__":
    main()
