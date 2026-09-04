# Synthesis Stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the human investigator a synthesis object — so a player who holds every load-bearing card can *combine* instead of guess — without the page ever revealing the truth.

**Architecture:** Watson's analyses (`cross_check`, `timeline`) stop being Watson-only return values and become notebook artifacts stored in `RunState` (conflict cards, timeline cards). A suspect grid in the Crew dossier renders claimed-vs-recorded spans from card `asserts`. The notebook marks cards never cited in a hearing. Watson's voice gains a consult rule. Everything is computed from cards the player already holds; `lie` / `truth` / `provedBy` are never read by any of it.

**Tech Stack:** TypeScript kernel (`src/kernel`), zustand store, React UI, vitest. No new dependencies.

**Spec:** `docs/research/07-synthesis-design.md` (design), `07a-synthesis-scaffolds.md`, `07b-synthesis-help.md` (research), `05-stuck-synthesis.md` (search-stage signals, already shipped).

## Global Constraints

- The page holds the truth: no code in this plan may read `Statement.lie`, `Episode.truth`, `Proposition.provedBy` or `refutedBy` (except `theory.ts`, unchanged).
- Korean UI shows Korean only; every new string goes through `src/i18n/ui.ts` with `en`/`ko`.
- Analyses still cost ship time as today (`timeline` 10, `cross_check` 20).
- Cards are immutable values; state updates return new objects.
- Tests: vitest, add per task; run `npx vitest run` before each commit.

---

### Task 1: Conflict and timeline cards

**Files:**
- Modify: `src/kernel/model.ts` (CardKind gains `'conflict' | 'timeline'`)
- Modify: `src/kernel/analysis.ts` (`runCrossCheck`, `runTimeline` add cards)
- Modify: `src/kernel/redact.ts` (`cardFromConflict`, `cardFromTimeline`)
- Modify: `src/ui/NotebookPanel.tsx` (glyphs `⚡` conflict, `⌛` timeline)
- Test: `tests/analysis-cards.test.ts`

**Interfaces:**
- Produces: `cardFromConflict(c: Conflict, ep, by, at): Card` with `id = conflict:<personId>:<a>:<b>`, `kind: 'conflict'`, `personId`, title `"<person> — <aTitle> vs <bTitle>"`, body = the two spans in clock labels + `why`. `cardFromTimeline(personId, spans, gaps, ep, by, at): Card` with `id = timeline:<personId>`, `kind: 'timeline'`, body = ordered spans and gaps (clock labels). Re-running replaces the timeline card (same id → `addCard` upgrade path).

- [ ] Write failing tests: after `cross_check` on a person with a conflicting statement and record on the notebook, `state.cards` contains a `conflict` card naming both sources and never the word "lie"; after `timeline`, one `timeline` card per person requested, replaced on re-run.
- [ ] Extend `CardKind`; add the two constructors in `redact.ts` (they read only cards already on the notebook).
- [ ] In `runCrossCheck` / `runTimeline`, `addCard` for each conflict / person before returning; keep the tool result payload unchanged.
- [ ] Notebook glyphs + `T.conflictCard` / `T.timelineCard` labels.
- [ ] Run tests; commit `feat(kernel): cross_check and timeline leave conflict/timeline cards on the notebook`.

### Task 2: Suspect grid

**Files:**
- Create: `src/kernel/grid.ts` (`suspectGrid(ep, s): Grid`)
- Create: `src/ui/SuspectGrid.tsx`
- Modify: `src/ui/Dossier.tsx` (tab: People / Grid)
- Modify: `src/ui/skin-gold.css`
- Test: `tests/grid.test.ts`

**Interfaces:**
- Produces: `Grid = { columns: Minute[]; rows: { personId: string; cells: { claimed: string[]; recorded: string[]; conflict: boolean }[] }[] }`. Columns = every distinct `from`/`to` boundary among card `asserts` on the notebook (sorted, negative minutes included). A cell's `claimed` = placeIds asserted by statement cards for that person covering that window; `recorded` = placeIds asserted by evidence/record cards; `conflict` = claimed and recorded both non-empty and disjoint. Empty cells stay empty.

- [ ] Write failing test with `MINI_CASE`: after holding `s_ada_night` (claims engine 0–120) and `e_log` (records engine 0–55) plus `s_bo_night` (records ada in galley 60–120), the ada row has a conflict cell in the 60–120 window and none in 0–55.
- [ ] Implement `suspectGrid` reading only `card.asserts`.
- [ ] `SuspectGrid.tsx`: rows with portrait thumbnails, columns with clock labels, cells show claimed (serif) over recorded (mono), conflict cells with a gold glow; empty cells dashed.
- [ ] Dossier tab switch; `T.grid`, `T.claimed`, `T.recorded`.
- [ ] Screenshot check in the bridge after Watson's `timeline` + one `cross_check`; commit `feat(ui): suspect grid — claimed vs recorded, conflicts glow, gaps stay empty`.

### Task 3: Untested marker

**Files:**
- Modify: `src/state/store.ts` (`citedIds` derived from `lastHearing` history → keep a `hearings: HearingRecord[]` array instead of only `lastHearing`)
- Modify: `src/ui/NotebookPanel.tsx` (dim dot on untested cards; header counter)
- Test: `tests/untested.test.ts`

- [ ] Failing test: after a hearing citing `e_print`, `untestedCards(state, hearings)` excludes `e_print` and includes every other evidence/statement/record card.
- [ ] Store: `hearings` accumulates `{ at, claims: { claim, evidence_ids }[], verdicts }`; `lastHearing` stays for the audio/tense bindings.
- [ ] Notebook: `.card.untested::before` dim dot; header `T.untested.replace('{n}', …)`; place/conflict/timeline cards never count.
- [ ] Commit `feat(notebook): untested marker — cards cited in no hearing`.

### Task 4: Watson consult

**Files:**
- Modify: `src/webmcp/voice.ts` (rule 9 widened, rule 10 elimination)
- Modify: `src/webmcp/tools.ts` (`get_case` description mentions conflict/timeline cards and `untested`)
- Test: `tests/voice.test.ts` (string contains the rule keywords)

- [ ] Rule 9 becomes: when `status` is `nothing_left_to_fetch` and the investigator says they do not see it (or after a rejected accusation), run `timeline` for everyone and `cross_check` for each person, then name ONE statement you distrust (which, not why), then offer two competing readings and the single check that separates them. Never pick.
- [ ] Rule 10: an elimination pass only over suspects the investigator names; leave at least two standing; state the constraint (the conflicting spans), never the survivor.
- [ ] `get_case` returns `untested: string[]` (card ids) so Watson can point at unused cards.
- [ ] Commit `feat(voice): consult — one doubt, two readings, one separating check`.

### Later (after a playtest of 1–4)

- Task 5 — Combine two cards (`combine` dispatch, human-facing; reveals one proposition per exact proving pair; in-character "nothing follows" otherwise; costs like a hearing).
- Task 6 — Debrief after the second accusation (chain of propositions with the cards that proved each; what was never tested).

## Self-review

- Spec coverage: design §Build items 1–4 → Tasks 1–4; 5–6 deferred as stated.
- No task reads truth fields; Task 2's conflict is set-disjointness of claimed vs recorded, not a lie flag.
- Type names: `Card.kind` union extended in Task 1 is what Task 3's "never count" list and Task 2's grid read.
