"""Convert reference/data3.py into data/game-data.json.

Usage: python3 scripts/convert-data.py
All fields are copied as is; tuples become arrays and tag sets become sorted arrays,
so the JSON can be converted back without losses. The only changes are FX_OVERRIDES: cards that
data3.py simplifies get the fx the app needs to play them by the text.
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

# Short ship names for the table and the log, and their dative for «Залп по „Мести“» (the PDF calls the ships so).
NICKS = {"Ж": ("Жемчужина", "Жемчужине"), "М": ("Месть", "Мести"), "И": ("Индевор", "Индевору"), "Г": ("Голландец", "Голландцу")}

# Rule numbers of version 0.3 that data3.py keeps in code (sim.py Cfg and the rules text).
RULES = {
    "hand": 5,
    "maxRounds": 30,
    "maxFires": 3,
    "sellGain": 1,
    "regroupCost": 1,
    "jointBonus": 1,
    "firstGameSecondStart": 3,
    "paidChargeMax": 3,
    # Ship abilities and Legends (board texts, sim.py Cfg).
    "jackHull": 2,
    "plansMax": 2,
    "treasuryCost": 2,
    "treasuryPlays": 1,
    "swordCost": 1,
    "heartCrewLoss": 1,
    "surfaceBonus": 1,
    "soulsGain": 1,
    # Sea cards (card texts).
    "seaStorm": 1,
    "seaClear": 1,
    "seaWave": 1,
    "seaMoon": 1,
    "seaFleet": 1,
    "seaReefs": 1,
    "seaCaravan": 2,
    "seaThunder": 2,
    "seaTortuga": 2,
    "seaMermaidsMin": 3,
    "seaMermaids": 1,
    "seaRum": 1,
    "seaWetDivisor": 2,
}


# Cards that data3.py simplifies for sim.py; the app plays them exactly by the text (docs/TZ.md,
# "Где sim.py упрощает"). Keys: (deck, card name); values replace or add fx keys. Ops in "plan" are added
# to the card's ops when it is played from a Plan.
FX_OVERRIDES = {
    # Look at 3 top cards: one to the hand, one to a Plan, one to the discard (RULES.md 18.5).
    ("Ж", "Компас Джека"): {"ops": [["compass", 3]]},
    # Look at 3 top sea cards and put them back in any order, then draw 2 (RULES.md 16.3).
    ("Ж", "Тиа Дальма"): {"ops": [["sea_look", 3], ["draw", 2]]},
    # «План: и ещё 1 Корпус» (RULES.md 18.9).
    ("Ж", "Латаем паруса"): {"plan": {"ops": [["repair_track", "hull", 1]]}},
    # A free Regroup if the player wants it (RULES.md 18.16, Q46).
    ("И", "Строй линии"): {"ops": [["regroup_free"], ["no_diag_turn"]]},
    # «Если это был абордаж, нападавший корабль теряет 1 Команду» (RULES.md 18.14).
    ("И", "Морская пехота"): {"boarding": ["crew", 1]},
    # «„Голландец" восстанавливает 2 Команды» — the named ship, not the one that plays the card (Q43).
    ("Г", "Сто лет службы"): {"ops": [["dmg", "any", "crew", 2], ["repair_named", "crew", 2]]},
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


def override(deck, c):
    fx = FX_OVERRIDES.get((deck, c["name"]))
    if fx:
        c["fx"] = {**c["fx"], **fx}
    return c


def ship(s):
    out = {k: plain(v) for k, v in s.items() if k != "abilities"}
    out["abilities"] = [{"name": n, "text": t} for n, t in s["abilities"]]
    out["nick"], out["nickDative"] = NICKS[s["code"]]
    out.update(VOLLEY_DEFAULTS)
    return out


def main():
    d = load_source()
    data = {
        "version": "0.3",
        "econ": dict(d.ECON),
        "rules": dict(RULES),
        "ships": [ship(s) for s in d.SHIPS],
        "decks": {code: [override(code, card(c, n)) for c, n in cards] for code, cards in d.DECKS.items()},
        "legends": {code: card(c) for code, c in d.LEGENDS.items()},
        "sea": [dict(name=n, when=w, big=b, text=t, flavor=f, key=k) for n, w, b, t, f, k in d.SEA],
    }
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    total = sum(c["copies"] for cards in data["decks"].values() for c in cards) + len(data["legends"]) + len(data["sea"])
    print(f"Wrote {OUT.relative_to(ROOT)}: {total} cards")


if __name__ == "__main__":
    main()
