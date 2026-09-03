# Devpost — The Baker Corporation (paste-ready)

**Tagline:** The agent writes the story. The website puts it on trial.

**Live:** https://baker-corporation.vercel.app · **Repo:** https://github.com/buzllightyear/baker-corporation · **Video:** VIDEO_URL

## About

The Baker Corporation is a detective game where the agent you already use plays Watson — and cannot cheat. Open the page inside ChatGPT: Watson gets ten WebMCP tools to walk the ship, question the crew, examine evidence, search the logs, rebuild timelines and submit theories. Not one of those tools can return the truth. The page holds it, in a pure kernel, and grades every claim Watson makes — proven, unsupported, contradicted — without ever saying who did it.

You are the investigator. You click; Watson calls tools; both of you write to one notebook, on one clock (Watson's errands cost the same ship-minutes as your steps, so delegation is a strategy, not a shortcut). When you are ready, you press Accuse — who, how, decisive evidence, two tries. Watson has no tool for that. The button exists only on the page.

Three layers: the **facts** are authored and deterministic; the **path** is emergent (same start, different story every run, because a living world meets free choices); the **words** are generated — Watson narrates, voices the crew from the cards it was handed, and writes the closing summation that the page then puts on trial.

## How it uses WebMCP

- One kernel function serves the human's click and the agent's tool call; the registry simply never registers `accuse`.
- Every tool response is redacted by construction — statements carry no truth flag, evidence carries no "decisive" flag, propositions' proof sets never leave the kernel.
- `submit_theory` is a deterministic judge: claims are normalised to authored propositions and checked against the notebook — no LLM in the loop.
- `cross_check` returns only mechanical time/place collisions between cards already found; interpretation (motive, temperature, psychology) is left to the agent, and can be wrong — which is what the hearing is for.
- Text is language-projected at the tool boundary (English/Korean); the kernel only ever sees ids.

## What makes the human–agent experience

- Clicking is the whole game; chat is only for what a click cannot say — "go hear everything the cook has to say", "cross-check the engineer", "what did I miss?".
- Watson is a body on the map, not a voice in a box: you watch it walk, and the cards it finds carry its mark.
- The hearing turns the agent's biggest weakness (confident invention) into the game's best scene: the page stamps each claim, and the player decides whether to trust the theory.
- Two episodes, one ship: **Titan, I Perceive** (tutorial, 10 minutes) and **The Sensor in the Night** (full case, 7.5 ship-hours).

## Judges' two-minute test

1. Open the live URL inside ChatGPT. Start Episode 0.
2. Paste the first "Say to Watson" chip. Watson calls `get_case` and briefs you.
3. Click the medbay, click the doctor, pick "the safe". A card appears on the notebook.
4. Paste "Watson, search the door logs for the medbay." — a record card lands, found by ▲.
5. Paste "Watson, submit your theory: Lind took the ampoules." — watch the page grade it.
6. Press Accuse. Watch what Watson cannot do.

## Built with

TypeScript · React 19 · Vite 8 · zustand · vitest · WebMCP (`navigator.modelContext.registerTool`) · Vercel. No server, no API keys, no model in the judging loop.
