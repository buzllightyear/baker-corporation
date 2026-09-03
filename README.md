# The Baker Corporation

*The agent writes the story. The website puts it on trial.*

**Live:** https://baker-corporation.vercel.app · Code: AGPL-3.0 (`LICENSE`) · Content (`content/`): CC BY-NC-ND 4.0 (`content/LICENSE-CONTENT.md`)

A detective game built on [WebMCP](https://github.com/webmachinelearning/webmcp). You are the investigator. **Watson** — a service unit built by The Baker Corporation — is the agent you already use (ChatGPT's built-in browser today). Open the page inside ChatGPT and Watson gets ten tools. None of them can reach the truth. The page holds it, and grades every theory Watson submits.

## What it looks like

First-person painted rooms (image-model concept art, one per compartment) with clickable people, evidence and hatches; a depth-map parallax in three.js when WebGL is available; a Baker Corp "issued equipment" terminal chrome; a cold-open briefing with the crew manifest; a crew dossier; a preliminary-hearing panel that grades Watson's theory on screen; and a Watson ticker so the agent's actions are visible on the deck plan. Procedural audio (Web Audio, no files) is in progress.

## How to play (2 minutes)

1. Open https://baker-corporation.vercel.app inside ChatGPT (it reads the page and gets the tools).
2. Start **Episode 0 — "Titan, I Perceive"**. It is the guided tutorial: four rooms, three people, one theft. A briefing (title card, incident, crew manifest, your posting) plays first.
3. Click rooms to move, people to hear their topics, evidence to examine. Everything you find lands on the shared notebook.
4. When the page shows *"Say to Watson"*, copy the sentence into the chat. Watson walks the same ship, on the same clock, and writes to the same notebook.
5. Ask Watson for a **preliminary hearing** (`submit_theory`): the page stamps each claim *proven / unsupported / contradicted* without revealing who did it.
6. Press **Accuse** — who, how, decisive evidence. Two tries. Only you have that button; Watson has no tool for it.

Walking is free; conversations, examinations and Watson's records searches cost ship time, which is part of your score. There is no deadline in this build.

## What the agent can and cannot do

| Watson can | There is no tool for it |
|---|---|
| walk, talk, ask free questions, examine, pin notes — the same verbs you click | **accuse** — the accusation is a page button, investigator only |
| rebuild timelines, cross-check one person's cards for mechanical time/place collisions | see whether a statement is a lie — cards never carry that flag |
| search ship logs and messages without moving (30 minutes of ship time) | read the truth, the culprit, or which evidence is decisive |
| submit a theory and get it graded claim by claim | make the page accept a fact it did not return |

Three layers keep this honest:

- **Facts** are deterministic and authored — every statement, its truth value, every proof set. They live in the page kernel and never change during play.
- **The path** is emergent, not generated: a fixed world meets free choices, and the clock (Watson's moves cost the same minutes as yours) makes "ask Watson to do everything" a real trade-off.
- **The words** are generated: Watson narrates scenes, voices the crew from the cards it was handed, and writes the closing summation — and the page judges the summation sentence by sentence.

## Why WebMCP

An LLM detective that "knows" the answer cannot run a fair game; an LLM detective that gets facts through tools it cannot see behind can. WebMCP puts the tools **on the page**: the same kernel function serves your click and Watson's call, the registry simply never registers `accuse`, and a theory is graded by code, not by another model. Watson's hallucinations are not a bug to patch — they are what the hearing catches.

## Tools (10)

`get_case` · `move` · `talk` · `ask` · `examine` · `pin` · `timeline` · `cross_check` · `search_records` · `submit_theory`

Every response carries the ship clock and minutes left before docking. Text arrives in the language the player chose; the kernel only ever sees card ids.

## Authoring rules (enforced by `validateCase`)

1. One truth. 2. Three or more liars, each for a different reason — a contradiction is not guilt. 3. Decisive evidence only reads after the right statement is on the notebook. 4. Something depends on the clock. 5. At least one load-bearing fact is buried in the records only Watson can search. 6. The loudest liar is not the culprit. 7. Seeing everything takes 1.6× the budget.

## Episodes

- **Episode 0 — Titan, I Perceive** (타이탄에서 오셨군요): tutorial; a theft aboard the *Marlow*.
- **Episode 1 — The Sensor in the Night** (밤의 센서): a death in cargo bay 3, and a sensor that logged nothing for twenty-five minutes.

Same company, same Watson, another world next season.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest, jsdom
npm run build    # tsc + vite
```

No server. Runs are saved in the browser. Recap links carry your path and your numbers, never the truth.
