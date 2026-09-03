# 05 — Stuck without spoilers: synthesis (2026-09-04)

Sources: `05a-deduction-confirmation.md` (11 deduction games), `05b-hint-systems.md` (16 hint systems), `05c-companion-nudging.md` (companions + LLM detective games). Trigger: a playtester held every load-bearing card in Ep1, talked to Watson for an hour, and never accused — nothing said "you have enough". A four-step hint ladder was drafted and rejected as "feels like handing over the answer".

## The reframe

The gap is a **readiness** signal, not a hint. Acclaimed games separate four channels and ship the first three freely:

| channel | says | withholds | canon examples |
|---|---|---|---|
| **where** | a place / thread still open | any fact | Outer Wilds "more to explore here", Paradise Killer open leads, Hitman intel |
| **which** | the statement / card that matters | why, with what | Ace Attorney Consult (after failures, on request), Golden Idol |
| **attempt feedback** | how close a *committed* theory is, coarse | which slot | Obra Dinn confirm-in-threes, Golden Idol "two or fewer wrong" |
| **what** | the deduction | — | only priced or on repeated explicit request (Layton coins, UHS); never pushed (Fi/Navi backlash) |

Readiness comes from the **world and the page**, not from the companion's opinion: Her Story's "do you think you understand?" fires on *coverage*; Pentiment's deadline forces the name; Roottrees' profiles lock in threes and confirmation frequency *drops* as you progress; Sherlock C&P's conclusion node appears only when its inputs are linked.

Companion rules (Doyle → Disco → Elizabeth): the default speech act is the question; competing readings are allowed, being checkably wrong is a feature; never restate an opened clue; never volunteer unasked except one structural line — *"I have nothing left to fetch; the rest is yours."*

## What Baker gets wrong today

1. **Per-slot rejection on accusation.** `AccuseDialog` lists which of who/how/evidence was wrong. With two tries that is a brute-force oracle and the single most spoiling thing in the build. Every reference game refuses this.
2. **No coverage signal.** The page knows which cards are load-bearing and never says the ship has nothing more to give.
3. **No "where".** The map does not mark rooms with untouched leads; the crew list does not show open threads per person.
4. **Watson's voice has no readiness line and no "where should I look" rule.**

## Build order (least spoiling first, all page-computed, none reveal truth)

1. **Coarse accusation feedback** — replace the per-slot list with "N of three parts contradict the scene" (Golden Idol tier). Keep the two tries.
2. **Open leads** — per person: topics unheard, statements whose refutation is already in the notebook but not cross-checked; per room: evidence unexamined. Shown in the Crew dossier and as an Outer Wilds marker on the minimap. Names counts only. Also returned by `get_case` as `leads`.
3. **Coverage → Watson's structural line** — when every proposition has at least one proving set in the notebook (or the ship has no unheard topic / unexamined evidence left), `get_case.status = 'nothing_left_to_fetch'`; Watson says, in character, that the rest is the investigator's. The ticker shows the same line once. Never "correct", never who.
4. **Voice rules** — Watson answers "where should I look?" with a place from `leads`; after a rejected accusation and only if asked, names *which* statement he distrusts (Consult), never why; never restates opened cards; when idle, offers to think aloud rather than doing it.
5. Later: soft diegetic deadline once coverage completes (Pentiment), post-verdict "what you missed" ledger (Painscreek), assist level per chapter with a no-assist badge (Hitman / MI2 SE), hearing bundles (confirm in threes) if per-claim hearings prove too oracle-like.
