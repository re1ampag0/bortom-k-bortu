# -*- coding: utf-8 -*-
"""Симулятор партий «Бортом к борту» для проверки баланса.

Боты играют по правилам версии 0.3 с простыми жадными решениями. Это не замена живым тестам:
боты не блефуют, не договариваются и не планируют на несколько ходов вперёд. Зато симуляция
быстро показывает перекосы: кто чаще выигрывает, сколько длится партия, хватает ли Пороха.
"""
import copy
import random
import statistics
import sys
from collections import Counter, defaultdict

import data3 as D

TRACKS = ("hull", "sails", "guns", "crew")
MINV = dict(hull=0, sails=0, guns=0, crew=1)
TRACK_W = dict(hull=1.0, guns=1.3, crew=0.9, sails=0.5)
SETUP_OPS = {"draw", "draw_to_plan", "to_plan", "powder", "mark", "team_volley_bonus", "no_react_team",
             "no_diag_turn", "ally_extra_plays", "extra_plays", "kill_reaction", "steal_random", "rob",
             "parley", "lose_crew", "pass", "ally_draw", "dice", "discard_enemy_each", "soul"}


class Cfg:
    def __init__(self, **kw):
        self.income = D.ECON["income"]
        self.first_income = D.ECON["first_income"]
        self.cap = D.ECON["cap"]
        self.hand = 5
        self.sea = True
        self.legends = True
        self.max_rounds = 30
        self.hull_mod = {}      # {"Ж": +1, ...}
        self.company_first = False
        self.first_random = False
        self.second_bonus = D.ECON["second_start"]  # Порох второй команде перед началом игры
        self.first_no_volley = False  # в первый ход первой команды Залпов нет
        self.off = set()            # отключённые особенности для экспериментов
        self.jack_hull = 2
        self.kazna = "buyplay"      # «Индевор» покупает лишний розыгрыш за 2 Пороха (или "sell2")
        self.kraken_souls = None
        self.legend_cost = {}       # {"М": 3}
        self.legend_thr = 4
        self.start_souls = None
        self.__dict__.update(kw)


class Ship:
    def __init__(self, spec, team, cfg):
        self.spec = spec
        self.code = spec["code"]
        self.team = team
        self.mx = {k: spec[k] for k in TRACKS}
        self.mx["hull"] += cfg.hull_mod.get(self.code, 0)
        self.v = dict(self.mx)
        self.fires = 0
        self.souls = 0
        self.sub = False
        self.surf = False
        self.alive = True
        self.pos = None
        self.legend = None
        self.deck, self.hand, self.disc, self.plans = [], [], [], []
        self.plays_left = 0
        self.react_used = 0
        self.volleyed = False
        self.parley = False        # не может давать Залпы в свой следующий ход
        self.no_repair = False     # Блокада
        self.voodoo = False
        self.no_react = False
        self.sold = False
        self.captain_react = 0
        self.captain_play = 0

    def __repr__(self):
        return self.code

    def draw(self, n, rng):
        for _ in range(n):
            if not self.deck:
                if not self.disc:
                    return
                self.deck, self.disc = self.disc, []
                rng.shuffle(self.deck)
            self.hand.append(self.deck.pop())

    def missing(self, track=None):
        if track:
            return self.mx[track] - self.v[track]
        return sum(self.mx[t] - self.v[t] for t in TRACKS)


class Team:
    def __init__(self, side):
        self.side = side
        self.ships = []
        self.powder = 0
        self.opp = None
        self.turns = 0

    def alive(self):
        return [s for s in self.ships if s.alive]

    def captains(self):
        al = self.alive()
        return [s for s in self.ships if not s.alive] if al else []

    def players(self):
        return self.alive() + self.captains()


def owner_ship(game, card):
    return game.by_code[card["deck"]]


class Game:
    def __init__(self, cfg, rng):
        self.cfg = cfg
        self.rng = rng
        self.pir = Team("ПИРАТЫ")
        self.com = Team("КОМПАНИЯ")
        self.pir.opp, self.com.opp = self.com, self.pir
        self.by_code = {}
        cards = D.expanded_cards()
        legends = {c["deck"]: c for c in D.legend_cards()}
        for spec in D.SHIPS:
            team = self.pir if spec["side"] == "ПИРАТЫ" else self.com
            s = Ship(spec, team, cfg)
            team.ships.append(s)
            self.by_code[s.code] = s
            s.deck = [c for c in cards if c["deck"] == s.code]
            rng.shuffle(s.deck)
            s.draw(cfg.hand, rng)
            if cfg.legends:
                s.legend = dict(legends[s.code])
                if s.code in cfg.legend_cost:
                    s.legend["cost"] = cfg.legend_cost[s.code]
            if s.code == "Г":
                s.souls = cfg.start_souls if cfg.start_souls is not None else spec.get("start_souls", 0)
        for team in (self.pir, self.com):
            order = [0, 1]
            rng.shuffle(order)
            for s, p in zip(team.ships, order):
                s.pos = p
        self.sea_deck = D.sea_cards() if cfg.sea else []
        rng.shuffle(self.sea_deck)
        self.sea_key = None
        self.round = 0
        self.winner = None
        self.tv = {}
        self.st = defaultdict(float)

    # ------------------------------------------------------------------ helpers
    def stat(self, team, key, n=1):
        self.st[f"{team.side}:{key}"] += n

    def abil(self, ship):
        return ship.alive

    def pay(self, team, n, what):
        team.powder -= n
        assert team.powder >= 0, (what, team.powder)
        self.stat(team, f"spent_{what}", n)

    def discard(self, card):
        owner_ship(self, card).disc.append(card)

    def opposite(self, ship):
        for e in ship.team.opp.alive():
            if e.pos == ship.pos:
                return e
        return None

    def targetable(self, e):
        return e.alive and not e.sub

    def swap(self, team, reason=""):
        if self.sea_key == "calm" and reason != "sword":
            return False
        al = team.alive()
        if len(al) == 2:
            al[0].pos, al[1].pos = al[1].pos, al[0].pos
        elif len(al) == 1:
            al[0].pos = 1 - al[0].pos
        else:
            return False
        if self.sea_key == "reefs":
            for s in list(al):
                self.damage(s, "hull", 1)
        return True

    def check_over(self):
        if not self.pir.alive() and not self.com.alive():
            self.winner = "НИЧЬЯ"
        elif not self.pir.alive():
            self.winner = "КОМПАНИЯ"
        elif not self.com.alive():
            self.winner = "ПИРАТЫ"
        return self.winner is not None

    # ------------------------------------------------------------------ урон
    def damage(self, tgt, track, n, src=None):
        if n <= 0 or not tgt.alive:
            return 0
        if track == "crew" and self.sea_key == "moon":
            n -= 1
            if n <= 0:
                return 0
        take = min(n, tgt.v[track] - MINV[track])
        tgt.v[track] -= take
        over = n - take
        if over and track != "hull":
            tgt.v["hull"] -= over
        if track == "crew" and src is not None and src.code == "Г" and src.alive and "souls" not in self.cfg.off:
            src.souls = min(5, src.souls + 1)
            self.stat(src.team, "souls")
        self.tv.setdefault("damaged", set()).add(tgt)
        self.stat(tgt.team.opp, "dmg_dealt", n)
        self.stat(tgt.team.opp, "src:" + getattr(self, "ctx", "other"), n)
        if tgt.v["hull"] <= 0:
            self.sink(tgt)
        return n

    def sink(self, s):
        if s.code == "Ж" and s.legend is not None and s.alive and "jack" not in self.cfg.off \
                and s.team.powder >= s.legend["cost"]:
            self.pay(s.team, s.legend["cost"], "reactions")
            s.legend = None
            s.v["hull"] = self.cfg.jack_hull
            self.swap(s.team, "jack")
            self.stat(s.team, "legend_used")
            self.stat(s.team, "jack_escape")
            return
        s.alive = False
        s.legend = None
        s.fires = 0
        s.sub = False
        for p in s.plans:
            s.hand.append(p)
        s.plans = []
        self.stat(s.team, "sunk")
        if s.code == "И":
            d = self.by_code["Г"]
            if d.alive:
                d.v["guns"] = d.mx["guns"]
                d.v["crew"] = d.mx["crew"]
        self.check_over()

    # ------------------------------------------------------------------ море
    def reveal_sea(self):
        if not self.cfg.sea:
            return
        if not self.sea_deck:
            self.sea_deck = D.sea_cards()
            self.rng.shuffle(self.sea_deck)
        card = self.sea_deck.pop()
        self.sea_key = card["key"]
        k = self.sea_key
        allships = self.pir.alive() + self.com.alive()
        if k == "mermaids":
            for s in allships:
                if s.v["crew"] >= 3:
                    self.damage(s, "crew", 1)
        elif k == "rum":
            for s in allships:
                s.v["crew"] = min(s.mx["crew"], s.v["crew"] + 1)
        elif k == "caravan":
            for t in (self.pir, self.com):
                self.add_powder(t, 2)
        elif k == "wet":
            for t in (self.pir, self.com):
                lost = t.powder // 2
                t.powder -= lost
                self.stat(t, "wasted", lost)
        elif k == "thunder":
            if allships:
                m = max(s.v["sails"] for s in allships)
                for s in allships:
                    if s.v["sails"] == m and m > 0:
                        self.damage(s, "sails", 2)
        elif k == "current":
            for t in (self.pir, self.com):
                self.swap(t, "current")
        elif k == "tortuga":
            for t in (self.pir, self.com):
                n = min(2, max(0, t.powder - 2))
                pl = t.players()
                for i in range(n):
                    self.pay(t, 1, "cards")
                    pl[i % len(pl)].draw(1, self.rng)

    def add_powder(self, team, n):
        room = self.cfg.cap - team.powder
        got = min(room, n)
        team.powder += got
        self.stat(team, "income", got)
        if n > got:
            self.stat(team, "wasted", n - got)

    # ------------------------------------------------------------------ ход
    def play(self):
        cf = self.cfg.company_first
        if self.cfg.first_random:
            cf = self.rng.random() < 0.5
        first, second = (self.com, self.pir) if cf else (self.pir, self.com)
        self.first_team = first
        second.powder += self.cfg.second_bonus
        while self.round < self.cfg.max_rounds:
            self.round += 1
            self.reveal_sea()
            if self.check_over():
                break
            for t in (first, second):
                self.turn(t, first_turn=(self.round == 1 and t is first))
                if self.check_over():
                    break
            if self.winner:
                break
        if not self.winner:
            self.winner = "НИЧЬЯ"
        return self.winner

    def turn(self, team, first_turn=False):
        enemy = team.opp
        team.turns += 1
        self.tv = dict(first_target=None, first_shooter=None, joint_used=False, team_bonus=0,
                       no_diag=False, storm_all=0, marks=defaultdict(int), damaged=set(),
                       no_react_team=False, sword_used=False, heart_used=False, regroup_used=False)
        for s in enemy.ships:
            s.react_used = 0
            s.captain_react = 0
            s.no_react = False
        # 1. Трюм
        self.add_powder(team, self.cfg.first_income if first_turn else self.cfg.income)
        for s in team.alive():
            if s.fires:
                self.ctx = "fire"
                self.damage(s, "hull", s.fires)
                self.ctx = "other"
                if self.winner:
                    return
        for s in team.alive():
            if s.sub:
                s.sub = False
                s.surf = True
            if self.sea_key == "wave":
                self.damage(s, "sails", 1)
        if self.sea_key == "maelstrom":
            self.swap(team, "maelstrom")
        if self.winner:
            return
        # 2. Добор
        for s in team.players():
            target = self.cfg.hand - len(s.plans)
            if len(s.hand) < target:
                s.draw(target - len(s.hand), self.rng)
        # подготовка
        for s in team.alive():
            s.plays_left = s.v["crew"] + (1 if self.sea_key == "fleet" else 0)
            s.volleyed = False
            s.sold = False
        for c in team.captains():
            c.captain_play = 1
            c.sold = False
        powder_start = team.powder
        self.no_volley = first_turn and self.cfg.first_no_volley
        AI(self, team).run()
        # конец хода
        for s in team.alive():
            s.voodoo = False
            s.parley = False
            s.no_repair = False
            s.surf = False
        if team.powder >= 3:
            self.stat(team, "turns_powder_left3")
        if team.powder == 0:
            self.stat(team, "turns_powder_zero")
        self.stat(team, "turns")

    # ------------------------------------------------------------------ Залп
    def volley(self, att, tgt, charge=None, from_plan=False, free=False, extra=0, no_react=False,
               paid_x=0):
        team, enemy = att.team, att.team.opp
        if not free:
            self.pay(team, 1, "volley")
        fx = {}
        if charge is not None:
            self.pay(team, charge["cost"], "cards")
            if paid_x:
                self.pay(team, paid_x, "cards")
            fx = dict(charge["fx"])
            if from_plan and "plan" in fx:
                fx.update(fx["plan"])
            self.discard(charge)
            self.stat(team, "play:" + charge["name"])
            self.stat(team, f"tier{charge['cost']}")
            self.stat(team, "cards_played")
        att.volleyed = True
        self.stat(team, "volleys")
        if fx.get("both"):
            for e in list(enemy.alive()):
                if not self.targetable(e):
                    continue
                ev = dict(kind="volley", att=att, tgt=e, dmg=att.v["guns"], track="hull", fx={},
                          charge=None, diag=False, cancelled=False, no_react=False)
                self.react(enemy, ev)
                self.resolve_volley(ev)
            return
        track = fx.get("track", "hull")
        no_diag = fx.get("no_diag") or self.tv["no_diag"] or self.sea_key == "maelstrom"
        diag = att.pos != tgt.pos and not no_diag
        dmg = att.v["guns"] + fx.get("dmg", 0) + paid_x + extra + self.tv["team_bonus"]
        if diag:
            dmg -= 1
        if att.pos == tgt.pos and self.sea_key == "clear":
            dmg += 1
        if self.sea_key == "storm":
            dmg -= 1
        dmg += self.tv["marks"][tgt]
        if fx.get("if_fire") and tgt.fires:
            dmg += fx["if_fire"]
        if fx.get("if_damaged") and tgt in self.tv["damaged"]:
            dmg += fx["if_damaged"]
        nr = no_react or fx.get("no_react") or self.tv["no_react_team"] or tgt.no_react
        if att.surf:
            dmg += 1
            nr = True
            att.surf = False
        jt = self.tv
        if jt["first_target"] is None:
            jt["first_target"], jt["first_shooter"] = tgt, att
        elif jt["first_target"] is tgt and att is not jt["first_shooter"] and not jt["joint_used"]:
            dmg += 1
            jt["joint_used"] = True
        dmg -= self.tv["storm_all"]
        ev = dict(kind="volley", att=att, tgt=tgt, dmg=dmg, track=track, fx=fx, charge=charge,
                  diag=diag, cancelled=False, no_react=nr, base=dmg - fx.get("dmg", 0) - paid_x
                  - (fx.get("if_fire", 0) if tgt.fires else 0))
        if not nr:
            self.react(enemy, ev)
        self.resolve_volley(ev)

    def resolve_volley(self, ev):
        self.ctx = "volley:" + ev["att"].code
        if ev["cancelled"]:
            self.stat(ev["att"].team, "volleys_cancelled")
            return
        att, tgt = ev["att"], ev["tgt"]
        dmg = max(0, ev["dmg"])
        if tgt.alive:
            self.damage(tgt, ev["track"], dmg, src=att)
            if ev["fx"].get("fire") and tgt.alive and not ev.get("charge_cancelled"):
                tgt.fires = min(3, tgt.fires + ev["fx"]["fire"])
        if not ev.get("no_react") and att.alive and not self.winner:
            self.ctx = "counter"
            self.react_after(att.team.opp, ev)
        self.ctx = "other"

    # ------------------------------------------------------------------ Реакции
    def reaction_sources(self, team, ev):
        """(держатель, карта, из Плана, от имени какого корабля, тип лимита)"""
        out = []
        if self.tv.get("no_react_team_def") is team:
            return out
        for s in team.ships:
            if s.alive:
                if s.sub or s.no_react:
                    continue
                if s.react_used < s.v["sails"]:
                    for c in s.hand:
                        if c["type"] == "РЕАКЦИЯ":
                            out.append((s, c, False, s, "sails"))
                for c in s.plans:
                    if c["type"] == "РЕАКЦИЯ":
                        out.append((s, c, True, s, "plan"))
            else:
                ally = [a for a in team.alive() if not a.sub and not a.no_react]
                if ally and s.captain_react < 1:
                    for c in s.hand:
                        if c["type"] == "РЕАКЦИЯ":
                            out.append((s, c, False, ally[0], "captain"))
        return out

    def lethal(self, ev):
        tgt = ev["tgt"]
        if ev["track"] == "hull":
            return ev["dmg"] >= tgt.v["hull"]
        over = ev["dmg"] - (tgt.v[ev["track"]] - MINV[ev["track"]])
        return over >= tgt.v["hull"]

    def react_value(self, card, plan, as_ship, ev, phase):
        fx = card["fx"]
        r = fx["r"]
        att, tgt = ev["att"], ev["tgt"]
        kind = ev["kind"]
        dmg = max(0, ev.get("dmg", 0))
        lethal_bonus = 4 if kind == "volley" and self.lethal(ev) else 0
        if phase == "before":
            if kind == "volley":
                if r == "reduce" and fx.get("self_only") and tgt is as_ship:
                    cut = min(fx["n"], dmg)
                    saved = lethal_bonus if (ev["dmg"] - cut < tgt.v["hull"] or ev["track"] != "hull") else 0
                    return cut + saved
                if r == "reduce_all":
                    return min(fx["n"], dmg) + 0.7 + (lethal_bonus if dmg - fx["n"] < tgt.v["hull"] else 0)
                if r == "cancel":
                    if fx.get("self_only") and tgt is not as_ship:
                        return 0
                    if fx.get("vs") and att.code != fx["vs"]:
                        return 0
                    if fx.get("diag_only") and not (plan and fx.get("plan_any")) and not ev["diag"]:
                        return 0
                    return dmg + (1.5 if ev["fx"].get("fire") else 0) + lethal_bonus
                if r == "redirect" and tgt is not as_ship and as_ship.alive and ev["track"] == "hull":
                    nd = max(0, dmg - 1)
                    if nd >= as_ship.v["hull"]:
                        return 0
                    v = 1 + (dmg / max(1, tgt.v["hull"]) - nd / max(1, as_ship.v["hull"])) * 5
                    return v + lethal_bonus
                if r == "swap" and not ev["diag"] and len(tgt.team.alive()) == 2 \
                        and self.sea_key != "calm" and not ev["fx"].get("no_diag"):
                    return 1 + (lethal_bonus if dmg - 1 < tgt.v["hull"] else 0)
                if r == "cancel_charge" and ev.get("charge") is not None:
                    fxc = ev["fx"]
                    v = fxc.get("dmg", 0) + (1.5 if fxc.get("fire") else 0) + (0.7 if fxc.get("track") else 0)
                    return v
                if r == "cancel_crew" and ev["track"] == "crew":
                    return dmg
            elif kind == "card":
                if r == "cancel" and fx.get("cards") and tgt is as_ship and att.code == fx.get("vs"):
                    return ev.get("value", 2) + 1
                if r == "cancel_crew" and fx.get("cards") and ev.get("crew", 0) and tgt is as_ship:
                    return ev["crew"]
                if r == "steal":
                    return 1.6
        else:  # after
            if kind != "volley" or not att.alive:
                return 0
            if r == "reduce" and fx.get("counter"):
                return 0
            if r == "counter":
                if fx.get("self_only") and tgt is not as_ship:
                    return 0
                tr, n = fx["counter"]
                n = as_ship.v["guns"] if n == "guns" else n
                v = n * TRACK_W[tr]
                if fx.get("counter2"):
                    v += fx["counter2"][1] * TRACK_W[fx["counter2"][0]]
                if fx.get("fire"):
                    v += 1.5
                if tr == "hull" and n >= att.v["hull"]:
                    v += 5
                return v
        return 0

    def apply_reaction(self, holder, card, plan, as_ship, ev, phase):
        fx = card["fx"]
        r = fx["r"]
        team = holder.team
        self.pay(team, card["cost"], "reactions")
        self.stat(team, "reactions")
        self.stat(team, "play:" + card["name"])
        if plan:
            holder.plans.remove(card)
        else:
            holder.hand.remove(card)
        self.discard(card)
        if phase == "before":
            if r == "reduce":
                ev["dmg"] -= fx["n"]
                if fx.get("counter") and ev["att"].alive:
                    self.damage(ev["att"], fx["counter"][0], fx["counter"][1], src=as_ship)
            elif r == "reduce_all":
                self.tv["storm_all"] += fx["n"]
                ev["dmg"] -= fx["n"]
                ev["storm_seen"] = self.tv["storm_all"]
            elif r == "cancel":
                ev["cancelled"] = True
            elif r == "redirect":
                ev["tgt"] = as_ship
                ev["dmg"] -= fx["n"]
            elif r == "swap":
                self.swap(as_ship.team, "react")
                if ev["att"].pos != ev["tgt"].pos and not ev["fx"].get("no_diag"):
                    ev["dmg"] -= 1
                    ev["diag"] = True
            elif r == "cancel_charge":
                ev["dmg"] = ev.get("base", ev["dmg"])
                ev["track"] = "hull"
                ev["charge_cancelled"] = True
            elif r == "cancel_crew":
                if ev["kind"] == "volley":
                    ev["cancelled"] = True
                else:
                    ev["cancel_crew"] = True
            elif r == "steal":
                holder.draw(1, self.rng)
        else:
            att = ev["att"]
            tr, n = fx["counter"]
            n = as_ship.v["guns"] if n == "guns" else n
            self.damage(att, tr, n, src=as_ship)
            if fx.get("counter2") and att.alive:
                self.damage(att, fx["counter2"][0], fx["counter2"][1], src=as_ship)
            if fx.get("fire") and att.alive:
                att.fires = min(3, att.fires + fx["fire"])

    def use_limit(self, holder, lim):
        if lim == "sails":
            holder.react_used += 1
        elif lim == "captain":
            holder.captain_react += 1

    def react(self, team, ev, phase="before"):
        for _ in range(4):
            if ev.get("cancelled") or self.winner:
                return
            best = None
            for holder, card, plan, as_ship, lim in self.reaction_sources(team, ev):
                if team.powder < card["cost"]:
                    continue
                val = self.react_value(card, plan, as_ship, ev, phase)
                thr = 0.9 + 1.1 * card["cost"]
                if team.powder - card["cost"] < 1 and card["cost"]:
                    thr += 0.3
                score = val - thr
                if score > 0 and (best is None or score > best[0]):
                    best = (score, holder, card, plan, as_ship, lim)
            if best is None:
                return
            _, holder, card, plan, as_ship, lim = best
            self.use_limit(holder, lim)
            self.apply_reaction(holder, card, plan, as_ship, ev, phase)

    def react_after(self, team, ev):
        self.react(team, ev, phase="after")


# ====================================================================== ИИ
class AI:
    def __init__(self, g, team):
        self.g = g
        self.team = team
        self.enemy = team.opp
        self.rng = g.rng

    # ---------- оценки
    def pv(self):
        p = self.team.powder
        return 0.75 if p >= 6 else (1.0 if p >= 3 else 1.25)

    def pending_volleys(self):
        return sum(1 for s in self.team.alive() if not s.volleyed and s.v["guns"] > 0 and not s.sub
                   and not s.parley)

    def react_reserve(self):
        for s in self.team.players():
            for c in s.hand + s.plans:
                if c["type"] == "РЕАКЦИЯ" and c["cost"]:
                    return 1
        return 0

    def reserve(self):
        return self.pending_volleys() + self.react_reserve()

    def dmg_value(self, tgt, track, n, src=None):
        if n <= 0 or not tgt.alive:
            return 0
        if track == "crew" and self.g.sea_key == "moon":
            n -= 1
        if track == "hull":
            hull = tgt.v["hull"]
            v = min(n, hull) * (1 + 3.0 / (hull + 1))
            if n >= hull:
                v += 6
            return v
        room = tgt.v[track] - MINV[track]
        take = min(n, room)
        over = n - take
        w = TRACK_W[track]
        if track == "crew" and src is not None and src.code == "Г":
            w += 0.6
        v = take * w + over * (1 + 3.0 / (tgt.v["hull"] + 1))
        if over >= tgt.v["hull"]:
            v += 6
        return v

    def enemies(self):
        return [e for e in self.enemy.alive() if not e.sub]

    def ally_of(self, s):
        for a in self.team.alive():
            if a is not s:
                return a
        return None

    # ---------- оценка карт Приказ/Ремонт
    def op_target(self, s, scope, track, n):
        es = self.enemies()
        if scope == "opposite":
            es = [e for e in es if e.pos == s.pos]
        if not es:
            return None, 0
        best = max(es, key=lambda e: self.dmg_value(e, track, n, s))
        return best, self.dmg_value(best, track, n, s)

    def card_score(self, s, card, phase):
        """Ценность розыгрыша Приказа/Ремонта сейчас (без вычета стоимости)."""
        g = self.g
        fx = card["fx"]
        ops = fx.get("ops", [])
        if card["type"] == "РЕМОНТ" and s.no_repair:
            return -9, None
        if card.get("soul") and s.souls < card["soul"]:
            return -9, None
        if phase == "setup" and not all(o[0] in SETUP_OPS for o in ops):
            return -9, None
        total = 0.0
        tgt = None
        ally = self.ally_of(s)
        for op in ops:
            k = op[0]
            if k == "draw":
                total += op[1] * (1.0 if len(s.hand) < 7 else 0.4)
            elif k in ("draw_to_plan", "ally_draw"):
                total += op[1] * 0.9
            elif k == "to_plan":
                total += 0.2
            elif k == "powder":
                total += min(op[1], g.cfg.cap - self.team.powder) * 0.9
            elif k == "rob":
                total += min(op[1], self.enemy.powder) * 1.8
            elif k == "parley":
                es = self.enemies()
                total += max((e.v["guns"] for e in es), default=0) * 0.9
            elif k == "steal_random":
                total += 1.8 if any(p.hand for p in self.enemy.players()) else 0
            elif k == "kill_reaction":
                total += 1.3
            elif k == "team_volley_bonus":
                total += self.pending_volleys() * op[1]
            elif k == "no_react_team":
                total += 0.8 * self.pending_volleys() + (0.5 if phase == "setup" else 0)
            elif k == "no_diag_turn":
                total += 0.4 * self.pending_volleys()
            elif k == "mark":
                total += op[2] * self.pending_volleys() * 0.9
            elif k == "extra_plays":
                total += min(op[1], max(0, len(s.hand) - 2)) * 0.7
            elif k == "ally_extra_plays":
                total += min(op[1], len(ally.hand) - 1) * 0.7 if ally else 0
            elif k == "lose_crew":
                total -= 0.9 if s.v["crew"] > 1 else 1.5
            elif k == "pass":
                total += 0.2
            elif k == "dice":
                total += 0.7
            elif k == "discard_enemy_each":
                total += sum(0.9 for p in self.enemy.players() if p.hand)
            elif k == "soul":
                total += min(op[1], 5 - s.souls) * 0.9
            elif k == "repair_self":
                total += self.repair_value(s, op[1])
            elif k == "repair_track":
                total += min(op[2], s.missing(op[1])) * TRACK_W[op[1]] * 1.1
            elif k == "repair_track_any":
                cands = [s] + ([ally] if ally else [])
                total += max(min(op[2], x.missing(op[1])) * TRACK_W[op[1]] * 1.1 for x in cands)
            elif k == "repair_ally":
                total += self.repair_value(ally, op[1]) if ally else 0
            elif k == "repair_crew_both":
                total += min(1, s.missing("crew")) + (min(1, ally.missing("crew")) if ally else 0)
            elif k == "souls_repair":
                k2 = min(s.souls, (s.missing() + 1) // 2)
                total += k2 * 2 - k2 * 0.9
            elif k == "dmg":
                scope, track, n = op[1], op[2], op[3]
                if scope == "all":
                    total += sum(self.dmg_value(e, track, n, s) for e in self.enemies())
                elif scope == "same":
                    if tgt is not None:
                        total += self.dmg_value(tgt, track, n, s)
                else:
                    t, v = self.op_target(s, scope, track, n)
                    if t is None:
                        return -9, None
                    tgt, total = t, total + v
            elif k == "fire":
                es = [e for e in self.enemies() if e.fires < 3]
                if not es:
                    return -9, None
                t = max(es, key=lambda e: e.v["hull"])
                tgt = t
                total += min(op[2], 3 - t.fires) * 1.5
            elif k == "voodoo":
                es = self.enemies()
                if not es:
                    return -9, None
                tgt = max(es, key=lambda e: e.v["crew"])
                total += 2.0
            elif k == "no_react":
                total += 0.6
            elif k == "no_repair":
                es = self.enemies()
                if not es:
                    return -9, None
                tgt = max(es, key=lambda e: e.missing())
                total += 0.6 + 0.2 * min(4, tgt.missing())
            elif k == "extra_volley_free":
                es = self.enemies()
                if not es or s.v["guns"] == 0 or s.sub:
                    return -9, None
                bonus = op[1] if len(op) > 1 else 0
                total += max(self.dmg_value(e, "hull", s.v["guns"] + bonus - (1 if e.pos != s.pos else 0), s)
                             for e in es) + 1.0
            elif k == "bottle":
                es = [e for e in self.enemies() if e.v["hull"] <= op[1]]
                if not es or "bottle" in g.cfg.off:
                    return -9, None
                tgt = es[0]
                total += 12
        return total, tgt

    def repair_value(self, s, n):
        if s is None:
            return 0
        v = 0
        left = n
        for tr in ("guns", "hull", "crew", "sails"):
            k = min(left, s.missing(tr))
            v += k * TRACK_W[tr] * 1.1
            left -= k
        return v

    # ---------- исполнение Приказа/Ремонта
    def play_card(self, s, card, from_plan=False, as_captain=None, legend=False):
        g = self.g
        team = self.team
        fx = card["fx"]
        g.pay(team, card["cost"], "cards")
        if card.get("soul"):
            s.souls -= (g.cfg.kraken_souls if (legend and g.cfg.kraken_souls) else card["soul"])
        g.stat(team, f"tier{card['cost']}")
        g.stat(team, "cards_played")
        g.stat(team, "play:" + card["name"])
        holder = as_captain or s
        if legend:
            s.legend = None
            g.stat(team, "legend_used")
            g.stat(team, "legend:" + card["name"])
        elif from_plan:
            holder.plans.remove(card)
        else:
            holder.hand.remove(card)
        if not legend:
            g.discard(card)
        # вуду: урон за каждую карту
        if s.voodoo:
            g.damage(s, "crew", 1)
            if not s.alive:
                return
        # реакции на карту (Банка с землёй, Зомби-офицеры, Морская пехота, Ловкость рук)
        tgt = None
        ally = self.ally_of(s)
        ev = None
        harmful = any(op[0] in ("dmg", "fire", "voodoo", "no_repair", "bottle") for op in fx.get("ops", []))
        _, pre_t = self.card_score(s, card, "main")
        if harmful and pre_t is not None:
            crew = sum(op[3] for op in fx["ops"] if op[0] == "dmg" and op[2] == "crew")
            ev = dict(kind="card", att=s, tgt=pre_t, crew=crew, value=4, cancelled=False)
            g.react(self.enemy, ev)
            if ev.get("cancelled"):
                g.stat(team, "cards_cancelled")
                return
        elif harmful and pre_t is None:
            es = self.enemies()
            if es:
                crew = sum(op[3] for op in fx["ops"] if op[0] == "dmg" and op[2] == "crew")
                ev = dict(kind="card", att=s, tgt=es[0], crew=crew, value=3, cancelled=False)
                g.react(self.enemy, ev)
        g.ctx = "card:" + card["name"]
        for op in fx.get("ops", []):
            k = op[0]
            if g.winner:
                return
            if k == "draw":
                s_draw = as_captain or s
                s_draw.draw(op[1], self.rng)
            elif k == "draw_to_plan":
                (as_captain or s).draw(op[1], self.rng)
            elif k == "to_plan":
                pass
            elif k == "powder":
                g.add_powder(team, op[1])
            elif k == "rob":
                n = min(op[1], self.enemy.powder)
                self.enemy.powder -= n
                g.add_powder(team, n)
            elif k == "parley":
                es = self.enemies()
                if es:
                    max(es, key=lambda e: e.v["guns"]).parley = True
            elif k == "steal_random":
                pl = [p for p in self.enemy.players() if p.hand]
                if pl:
                    p = self.rng.choice(pl)
                    c = self.rng.choice(p.hand)
                    p.hand.remove(c)
                    (as_captain or s).hand.append(c)
            elif k == "kill_reaction":
                pl = [p for p in self.enemy.players() if any(c["type"] == "РЕАКЦИЯ" for c in p.hand)]
                if pl:
                    p = pl[0]
                    c = max((c for c in p.hand if c["type"] == "РЕАКЦИЯ"), key=lambda c: c["v"])
                    p.hand.remove(c)
                    g.discard(c)
                else:
                    (as_captain or s).draw(1, self.rng)
            elif k == "team_volley_bonus":
                g.tv["team_bonus"] += op[1]
            elif k == "no_react_team":
                g.tv["no_react_team_def"] = self.enemy
                g.tv["no_react_team"] = True
            elif k == "no_diag_turn":
                g.tv["no_diag"] = True
            elif k == "mark":
                es = self.enemies()
                if es:
                    t = min(es, key=lambda e: e.v["hull"])
                    g.tv["marks"][t] += op[2]
            elif k == "extra_plays":
                s.plays_left += op[1]
            elif k == "ally_extra_plays":
                if ally:
                    ally.plays_left += op[1]
            elif k == "lose_crew":
                g.damage(s, "crew", op[1])
            elif k == "dice":
                pl = [p for p in self.enemy.players() if p.hand]
                me = as_captain or s
                if pl and me.hand:
                    p = self.rng.choice(pl)
                    a = max(me.hand, key=lambda c: c["cost"])
                    b = self.rng.choice(p.hand)
                    me.hand.remove(a)
                    p.hand.remove(b)
                    if a["cost"] > b["cost"]:
                        me.hand += [a, b]
                    elif a["cost"] < b["cost"]:
                        p.hand += [a, b]
                    else:
                        g.discard(a)
                        g.discard(b)
            elif k == "discard_enemy_each":
                for p in self.enemy.players():
                    if p.hand:
                        c = min(p.hand, key=lambda c: c["v"])
                        p.hand.remove(c)
                        g.discard(c)
            elif k == "soul":
                s.souls = min(5, s.souls + op[1])
            elif k == "repair_self":
                self.do_repair(s, op[1])
            elif k == "repair_track":
                s.v[op[1]] = min(s.mx[op[1]], s.v[op[1]] + op[2])
            elif k == "repair_track_any":
                cands = [s] + ([ally] if ally else [])
                x = max(cands, key=lambda x: x.missing(op[1]))
                x.v[op[1]] = min(x.mx[op[1]], x.v[op[1]] + op[2])
            elif k == "repair_ally":
                if ally:
                    self.do_repair(ally, op[1])
            elif k == "repair_crew_both":
                for x in [s] + ([ally] if ally else []):
                    x.v["crew"] = min(x.mx["crew"], x.v["crew"] + 1)
            elif k == "souls_repair":
                n = min(s.souls, (s.missing() + 1) // 2)
                s.souls -= n
                self.do_repair(s, 2 * n)
            elif k == "dmg":
                scope, track, n = op[1], op[2], op[3]
                if ev is not None and ev.get("cancel_crew") and track == "crew":
                    continue
                if scope == "all":
                    for e in list(self.enemies()):
                        g.damage(e, track, n, src=s)
                elif scope == "same":
                    if tgt is not None and tgt.alive:
                        g.damage(tgt, track, n, src=s)
                else:
                    t, _ = self.op_target(s, scope, track, n)
                    if t is not None:
                        tgt = t
                        g.damage(t, track, n, src=s)
            elif k == "fire":
                es = [e for e in self.enemies() if e.fires < 3]
                if es:
                    t = max(es, key=lambda e: e.v["hull"])
                    t.fires = min(3, t.fires + op[2])
            elif k == "voodoo":
                es = self.enemies()
                if es:
                    max(es, key=lambda e: e.v["crew"]).voodoo = True
            elif k == "no_react":
                if tgt is not None:
                    tgt.no_react = True
            elif k == "no_repair":
                es = self.enemies()
                if es:
                    max(es, key=lambda e: e.missing()).no_repair = True
            elif k == "extra_volley_free":
                bonus = op[1] if len(op) > 1 else 0
                es = self.enemies()
                if es and s.alive and s.v["guns"] > 0:
                    t, ch, pl, px = self.choose_volley(s, allow_charge=False, extra=bonus)
                    if t is not None:
                        g.volley(s, t, free=True, extra=bonus, no_react=bonus > 0)
            elif k == "bottle":
                es = [e for e in self.enemies() if e.v["hull"] <= op[1]]
                if es:
                    t = min(es, key=lambda e: e.v["hull"])
                    g.damage(t, "hull", t.v["hull"], src=s)

    def _unused(self):
        pass

    def do_repair(self, s, n):
        for tr in ("guns", "hull", "crew", "sails"):
            k = min(n, s.missing(tr))
            s.v[tr] += k
            n -= k

    # ---------- Залп
    def charge_options(self, s):
        opts = [(None, False, None)]
        for c in s.hand:
            if c["type"] == "ЗАРЯД":
                opts.append((c, False, s))
        for c in s.plans:
            if c["type"] == "ЗАРЯД":
                opts.append((c, True, s))
        for cap in self.team.captains():
            if cap.captain_play > 0:
                for c in cap.hand:
                    if c["type"] == "ЗАРЯД":
                        opts.append((c, False, cap))
        return opts

    def choose_volley(self, s, allow_charge=True, extra=0):
        g = self.g
        es = self.enemies()
        if g.sea_key == "fog":
            es = [e for e in es if e.pos == s.pos]
        if not es:
            return None, None, False, 0
        best = (-99, None, None, False, 0)
        res = self.react_reserve()
        free_powder = self.team.powder - 1 - max(0, self.pending_volleys() - 1) - res
        opts = self.charge_options(s) if allow_charge else [(None, False, None)]
        for card, plan, holder in opts:
            fx = dict(card["fx"]) if card else {}
            if card and plan and "plan" in fx:
                fx.update(fx["plan"])
            cost = card["cost"] if card else 0
            if card and cost > free_powder:
                continue
            if card and holder is s and s.plays_left <= 0 and not plan:
                continue
            paid_x = 0
            if fx.get("paid"):
                paid_x = max(0, min(3, free_powder - cost))
            if fx.get("both"):
                v = sum(self.dmg_value(e, "hull", s.v["guns"], s) for e in self.enemies())
                v -= cost * self.pv() + 0.8
                if v > best[0]:
                    best = (v, self.enemies()[0], card, plan, 0)
                continue
            for e in es:
                track = fx.get("track", "hull")
                no_diag = fx.get("no_diag") or g.tv["no_diag"] or g.sea_key == "maelstrom"
                d = s.v["guns"] + fx.get("dmg", 0) + paid_x + extra + g.tv["team_bonus"] + g.tv["marks"][e]
                if e.pos != s.pos and not no_diag:
                    d -= 1
                if e.pos == s.pos and g.sea_key == "clear":
                    d += 1
                if g.sea_key == "storm":
                    d -= 1
                if fx.get("if_fire") and e.fires:
                    d += fx["if_fire"]
                if fx.get("if_damaged") and e in g.tv["damaged"]:
                    d += fx["if_damaged"]
                if s.surf:
                    d += 1
                jt = g.tv
                if jt["first_target"] is e and jt["first_shooter"] is not s and not jt["joint_used"]:
                    d += 1
                d -= g.tv["storm_all"]
                v = self.dmg_value(e, track, d, s)
                if fx.get("fire") and e.fires < 3:
                    v += 1.5
                if fx.get("no_react"):
                    v += 0.6
                if card:
                    v -= (cost + paid_x) * self.pv() + (0.5 if not plan else 0.9)
                # пусть второй корабль добивает ту же цель
                if jt["first_target"] is None and len(self.team.alive()) == 2:
                    v += 0.3 * (1.0 / (e.v["hull"] + 1)) * 10
                if v > best[0]:
                    best = (v, e, card, plan, paid_x)
        _, e, card, plan, px = best
        return e, card, plan, px

    def do_volley(self, s, extra=0, free=False):
        g = self.g
        if getattr(g, "no_volley", False):
            return
        if s.v["guns"] <= 0 or s.sub or s.parley or not s.alive:
            return
        if not free and self.team.powder < 1:
            self.sell_one(force=True)
            if self.team.powder < 1:
                g.stat(self.team, "volley_skipped_no_powder")
                return
        t, card, plan, px = self.choose_volley(s, extra=extra)
        if t is None:
            return
        holder = None
        if card is not None:
            for h in [s] + self.team.captains():
                if card in h.hand or card in h.plans:
                    holder = h
                    break
            if plan:
                holder.plans.remove(card)
            else:
                holder.hand.remove(card)
            if holder is s:
                s.plays_left -= 0 if plan else 1
            else:
                holder.captain_play -= 1
        g.volley(s, t, charge=card, from_plan=plan, free=free, extra=extra, paid_x=px)

    # ---------- прочее
    def sell_one(self, force=False, player=None):
        g = self.g
        for p in ([player] if player else self.team.players()):
            if p.sold or not p.hand:
                continue
            gain = 2 if (p.code == "И" and p.alive and g.cfg.kazna == "sell2") else 1
            room = g.cfg.cap - self.team.powder
            if room <= 0:
                continue
            c = min(p.hand, key=lambda c: self.keep_value(p, c))
            kv = self.keep_value(p, c)
            limit = 2.2 if gain == 2 else 1.1
            if force or (kv < limit and self.team.powder < 4):
                p.hand.remove(c)
                g.discard(c)
                p.sold = True
                g.add_powder(self.team, gain)
                g.stat(self.team, "sold")
                if force:
                    return True
        return False

    def keep_value(self, p, c):
        ship = p if p.alive else (self.team.alive()[0] if self.team.alive() else p)
        if c["type"] == "РЕАКЦИЯ":
            return 0.6 if ship.v["sails"] == 0 and p.alive else c["v"] * 0.8
        if c["type"] == "ЗАРЯД":
            n = sum(1 for x in p.hand if x["type"] == "ЗАРЯД")
            return c["v"] * (0.9 if n <= 2 else 0.5)
        if c["cost"] > self.team.powder + 2:
            return 0.8
        return c["v"] * 0.8

    def regroup(self):
        g = self.g
        al = self.team.alive()
        if len(al) != 2 or g.sea_key == "calm" or g.tv["regroup_used"] or any(s.no_repair for s in al):
            return
        if g.sea_key == "reefs":
            return
        free = (self.g.by_code["Ж"].alive and self.team.side == "ПИРАТЫ" and "free_regroup" not in g.cfg.off) \
            or g.sea_key == "wind"
        if not free and self.team.powder < 1 + self.react_reserve():
            return

        def danger():
            tot = 0
            for s in al:
                worst = max((e.v["guns"] - (1 if e.pos != s.pos else 0) for e in self.enemy.alive()), default=0)
                tot += worst / max(1, s.v["hull"])
            return tot
        d0 = danger()
        al[0].pos, al[1].pos = al[1].pos, al[0].pos
        d1 = danger()
        al[0].pos, al[1].pos = al[1].pos, al[0].pos
        if d1 < d0 - 0.12:
            if not free:
                g.pay(self.team, 1, "abilities")
            g.swap(self.team, "regroup")
            g.tv["regroup_used"] = True
            g.stat(self.team, "regroups")

    def sword(self):
        """Меч Тритона «Мести»: поставить слабого врага напротив «Мести»."""
        g = self.g
        m = g.by_code["М"]
        if self.team.side != "ПИРАТЫ" or not m.alive or g.tv["sword_used"] or m.v["guns"] == 0 \
                or "sword" in g.cfg.off:
            return
        es = self.enemies()
        if not es or self.team.powder < 2 + self.react_reserve():
            return
        weakest = min(es, key=lambda e: e.v["hull"])
        kill_soon = weakest.v["hull"] <= m.v["guns"] + 1
        if weakest.pos != m.pos and kill_soon and g.sea_key not in ("maelstrom",) and not g.tv["no_diag"]:
            g.pay(self.team, 1, "abilities")
            g.swap(self.enemy, "sword")
            g.tv["sword_used"] = True
            g.stat(self.team, "sword")

    def souls(self):
        d = self.g.by_code["Г"]
        if self.team.side != "КОМПАНИЯ" or not d.alive:
            return
        keep = 3 if (d.legend is not None and d.v["hull"] > 4) else 0
        while d.souls > keep and (d.missing("hull") >= 1 or d.missing("crew") >= 1):
            d.souls -= 1
            if d.v["crew"] == 1 or (d.missing("crew") and d.missing("hull") <= 1):
                d.v["crew"] += 1
            else:
                d.v["hull"] += 1
            self.g.stat(self.team, "souls_spent")

    def extinguish(self):
        for s in self.team.alive():
            while s.fires and len(s.hand) > 2:
                c = min(s.hand, key=lambda c: self.keep_value(s, c))
                if self.keep_value(s, c) > 2.5:
                    break
                s.hand.remove(c)
                self.g.discard(c)
                s.fires -= 1
                self.g.stat(self.team, "fires_out")

    def legends(self):
        g = self.g
        if not g.cfg.legends:
            return
        for s in self.team.alive():
            L = s.legend
            if L is None or L["type"] != "ПРИКАЗ" or s.plays_left <= 0:
                continue
            need = g.cfg.kraken_souls if (L.get("soul") and g.cfg.kraken_souls) else L.get("soul", 0)
            if need and s.souls < need:
                continue
            if self.team.powder < L["cost"]:
                continue
            sc, _ = self.card_score(s, L, "main")
            if sc - L["cost"] * self.pv() - L.get("soul", 0) * 0.5 >= g.cfg.legend_thr:
                s.plays_left -= 1
                self.play_card(s, L, legend=True)

    def play_phase(self, phase):
        g = self.g
        for _ in range(12):
            if g.winner:
                return
            best = None
            res = self.reserve() if phase == "setup" else self.react_reserve() + self.pending_volleys()
            for s in self.team.alive():
                if s.plays_left <= 0:
                    continue
                for c in list(s.hand) + list(s.plans):
                    if c["type"] not in ("ПРИКАЗ", "РЕМОНТ"):
                        continue
                    if self.team.powder - c["cost"] < res and c["cost"] > 0:
                        if self.team.powder >= c["cost"]:
                            g.stat(self.team, "held_back_for_reserve")
                        else:
                            g.stat(self.team, "cant_afford")
                        continue
                    sc, _ = self.card_score(s, c, phase)
                    net = sc - c["cost"] * self.pv() - c.get("soul", 0) * 0.9
                    if net >= 0.6 and (best is None or net > best[0]):
                        best = (net, s, c, c in s.plans, None)
            for cap in self.team.captains():
                if cap.captain_play <= 0:
                    continue
                al = self.team.alive()
                if not al:
                    continue
                for c in cap.hand:
                    if c["type"] not in ("ПРИКАЗ", "РЕМОНТ"):
                        continue
                    if self.team.powder - c["cost"] < res and c["cost"] > 0:
                        continue
                    sc, _ = self.card_score(al[0], c, phase)
                    net = sc - c["cost"] * self.pv()
                    if net >= 0.6 and (best is None or net > best[0]):
                        best = (net, al[0], c, False, cap)
            if best is None:
                # Казна (вариант): «Индевор» докупает розыгрыш за 2 Пороха
                i = g.by_code["И"]
                if g.cfg.kazna == "buyplay" and self.team.side == "КОМПАНИЯ" and i.alive and i.plays_left <= 0 \
                        and not g.tv.get("kazna_used") and self.team.powder >= 2 + res:
                    cands = [c for c in i.hand if c["type"] in ("ПРИКАЗ", "РЕМОНТ")
                             and self.team.powder - 2 - c["cost"] >= res]
                    sc = [self.card_score(i, c, phase)[0] - c["cost"] * self.pv() for c in cands]
                    if sc and max(sc) >= 1.6:
                        g.pay(self.team, 2, "abilities")
                        g.tv["kazna_used"] = True
                        i.plays_left += 1
                        g.stat(self.team, "kazna")
                        continue
                return
            _, s, c, plan, cap = best
            if cap is not None:
                cap.captain_play -= 1
                self.play_card(s, c, as_captain=cap)
            else:
                s.plays_left -= 1
                self.play_card(s, c, from_plan=plan)

    def make_plans(self):
        p = self.g.by_code["Ж"]
        if self.team.side != "ПИРАТЫ" or not p.alive or "plans" in self.g.cfg.off:
            return
        while len(p.plans) < 2 and p.hand:
            def pv(c):
                fx = c["fx"]
                if c["type"] == "РЕАКЦИЯ":
                    return 3 + (2 if fx.get("plan_any") else 0) + c["v"]
                if "plan" in fx:
                    return 2 + c["v"]
                return -1
            c = max(p.hand, key=pv)
            if pv(c) < 0:
                break
            p.hand.remove(c)
            p.plans.append(c)

    def maybe_dive(self, s):
        if s.code != "Г" or s.sub or not s.alive or "dive" in self.g.cfg.off:
            return False
        ally = self.ally_of(s)
        if ally is None:
            return False
        threat = sum(e.v["guns"] for e in self.enemy.alive()) + 2
        if s.v["hull"] <= 4 or (s.v["hull"] <= 6 and threat >= s.v["hull"]):
            if s.v["hull"] < ally.v["hull"]:
                s.sub = True
                s.fires = 0
                s.volleyed = True
                self.g.stat(self.team, "dives")
                return True
        return False

    def heart(self):
        g = self.g
        i, d = g.by_code["И"], g.by_code["Г"]
        if self.team.side != "КОМПАНИЯ" or not (i.alive and d.alive) or d.sub or g.tv["heart_used"] \
                or "heart" in g.cfg.off:
            return
        if d.v["guns"] == 0 or (d.v["crew"] <= 1 and d.souls == 0):
            return
        if self.team.powder < 1 + self.react_reserve():
            return
        g.tv["heart_used"] = True
        g.stat(self.team, "heart")
        self.do_volley(d)
        g.damage(d, "crew", 1)

    # ---------- ход целиком
    def run(self):
        g = self.g
        self.souls()
        self.extinguish()
        if g.winner:
            return
        self.regroup()
        self.legends()
        self.play_phase("setup")
        self.sword()
        ships = sorted(self.team.alive(), key=lambda s: -s.v["guns"])
        for s in ships:
            if g.winner:
                return
            if not s.alive:
                continue
            if self.maybe_dive(s):
                continue
            self.do_volley(s)
        if not g.winner:
            self.heart()
        if not g.winner:
            self.legends()
            self.play_phase("main")
        if not g.winner:
            self.sell_one()
            self.make_plans()


# ====================================================================== прогон
def run(n=2000, seed=1, **kw):
    cfg = Cfg(**kw)
    rng = random.Random(seed)
    wins = Counter()
    rounds = []
    agg = defaultdict(float)
    for _ in range(n):
        g = Game(cfg, rng)
        w = g.play()
        wins[w] += 1
        rounds.append(g.round)
        for k, v in g.st.items():
            agg[k] += v
    res = dict(n=n, wins=wins, rounds=rounds, agg=agg)
    return res


def report(res, label=""):
    n = res["n"]
    w = res["wins"]
    r = res["rounds"]
    a = res["agg"]
    pw = w["ПИРАТЫ"] / n * 100
    cw = w["КОМПАНИЯ"] / n * 100
    print(f"== {label}: Пираты {pw:.1f}%  Компания {cw:.1f}%  ничьи {w['НИЧЬЯ'] / n * 100:.1f}%  "
          f"раундов: сред {statistics.mean(r):.1f}, медиана {statistics.median(r)}, "
          f"10–90%: {sorted(r)[n // 10]}–{sorted(r)[n * 9 // 10]}")
    for side in ("ПИРАТЫ", "КОМПАНИЯ"):
        t = a[f"{side}:turns"]
        def per(k):
            return a[f"{side}:{k}"] / t
        print(f"   {side:9s} за ход: доход {per('income'):.2f}, на Залпы {per('spent_volley'):.2f}, "
              f"на карты {per('spent_cards'):.2f}, на Реакции {per('spent_reactions'):.2f}, "
              f"на особенности {per('spent_abilities'):.2f}, сгорело {per('wasted'):.2f} | "
              f"конец хода с 0 Пороха {per('turns_powder_zero') * 100:.0f}%, с 3+ {per('turns_powder_left3') * 100:.0f}% | "
              f"карт {per('cards_played'):.2f} (за 0: {per('tier0'):.2f}, 1: {per('tier1'):.2f}, "
              f"2: {per('tier2'):.2f}, 3: {per('tier3'):.2f}), продано {per('sold'):.2f}, "
              f"не хватило Пороха {per('cant_afford'):.2f}, отложено ради резерва {per('held_back_for_reserve'):.2f}, "
              f"Залп пропущен {per('volley_skipped_no_powder'):.2f}, Реакций {per('reactions'):.2f}, "
              f"Легенд за игру {a[f'{side}:legend_used'] / n:.2f}")


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    report(run(n), "v0.3 база")
