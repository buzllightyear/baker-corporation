# 07 — The synthesis gap: design (2026-09-04)

Sources: `07a-synthesis-scaffolds.md` (15 games), `07b-synthesis-help.md`, plus `05-stuck-synthesis.md` (search-stage signals). Trigger: a player in Ep1 was told the notebook covers everything provable and still could not name anyone.

## Diagnosis (our build)

The human has **no synthesis object**. Watson's `cross_check` (statement conflicts) and `timeline` (claimed vs recorded spans, gaps) return to Watson only; nothing is stored, nothing is drawn. The notebook is a flat card list. The hearing panel shows only the grade of claims Watson chose to make. So at the exact moment the player needs to *combine*, the page offers reading and chat. Every reference game externalises synthesis as an object with typed slots that shows the **shape** of the answer, never the binding.

## Principles (from the research)

1. **Re-index, don't reveal** — recaps and timelines built only from facts the player holds, re-ordered, with gaps left as gaps (Ace Attorney Revisualization, Danganronpa Closing Argument).
2. **Point at a doubt, not an answer** — name *which statement* to distrust, never what contradicts it (Consult, Mood Matrix, Perceive).
3. **Distance without location** — "one hinge wrong", never which (Golden Idol's "two or fewer").
4. **Diff owned vs used** — "these cards appear in no theory you have tested" is computable and not an answer (Roottrees).
5. **Elimination is the player's method** — a grid with empty cells; the community solves Obra Dinn's last names by "who could NOT" (Cluedo/logic-grid).
6. **Two readings plus the one check that separates them** — Watson may argue both sides, never pick (Disco/Pentiment).
7. **Debrief after commitment** — "what you missed" only after the second accusation.

## Build (ordered by value ÷ cost)

| # | What | Reveals | Withholds | Cost |
|---|---|---|---|---|
| 1 | **Analyses become notebook artifacts.** `cross_check` writes a *conflict card* per contradiction ("Sato: bridge 22:00–alarm (statement) vs cargo bay 3 22:38–23:05 (door log)"); `timeline` writes a *timeline card* per person with spans and gaps. Both are facts the player already holds, re-indexed. | shape of contradictions | who is lying (both spans are shown; the page never says which is false) | S |
| 2 | **Suspect grid** (Crew dossier tab): rows = people; columns = time windows of the night (22:00 · 22:30 · 22:40 · 23:05 · 23:10); cells = where each person *claims* vs where a *record* puts them; conflict cells glow. Empty cells stay empty. Built from card `asserts` only. | alibi shape, gaps | truth | M |
| 3 | **"Untested" marker**: cards not cited in any hearing get a dim dot; a one-line counter "N cards untested" in the notebook header. | what you have not used | what they prove | S |
| 4 | **Watson's Consult** (voice rule 9 widened): once `status` is nothing_left_to_fetch, if the investigator says they do not see it, Watson (a) runs `timeline` for all and `cross_check` for each person, (b) names **one** statement he distrusts (which, not why), (c) offers two competing readings and the single check that separates them. He may run an elimination pass only on suspects the investigator names, must leave at least two standing, and states the constraint, never the survivor. | a doubt, a fork | the culprit | S |
| 5 | **Combine two cards** (AAI Logic port, human-facing): drag two cards → if they are a proving set the page says what they establish (a proposition, exactly as a hearing would); otherwise an in-character "nothing follows" line. Costs ship time like a hearing. | one proposition per correct pair | the chain | M |
| 6 | **Debrief** after the second accusation: the chain of propositions with the cards that proved each, and what the player never tested. | everything | — (case is over) | S |

Items 1–4 first. 5 and 6 after a playtest of 1–4.

## Playing the current build when stuck

Ask Watson, in order: (1) "모든 사람의 시간표를 재구성해줘" (`timeline`, 10 min) — gaps are the shape; (2) "사람마다 대조해줘" (`cross_check` × 5, 20 min each) — every statement/record conflict, for everyone, not just one; (3) "네가 못 믿는 진술 하나만 짚어줘" — Consult; (4) "두 가지 읽기를 주고, 둘을 가르는 확인 하나를 말해줘"; then a hearing on the reading you prefer. The accusation needs three parts; the decisive item is the one card whose description ties a person to the sealed place during the gap.
