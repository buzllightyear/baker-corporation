# Research 5a — Deduction confirmation: signalling "you have enough" without giving the answer

Source: research subagent, 2026-09-04 KST. Problem: playtester collected every needed clue and never accused; nothing said "the case is closable". Owner rejects a hint ladder that reads as handing out the answer.

## Frame

Three families, and the split is the finding:

- **Fact-locking** (Obra Dinn, Golden Idol, Roottrees, Chants, Shadows of Doubt): answers are discrete facts, confirmed in *batches* so confirmation rewards reasoning rather than probing. Wrong is silent or cheap; right is loud.
- **Judgement** (Her Story, Paradise Killer, Pentiment, Sherlock C&P): no correctness feedback. Readiness is *diegetic* (a chat opens, a deadline lands, a trial is offered); the cost of wrong is narrative.
- **Structure** (Lorelei, Painscreek): no hints, no readiness signal; unstuck = non-linearity and clue redundancy, done = player confidence plus a grade afterwards.

Our failure is a *readiness* failure, not a hint failure. Every game that solves it signals "closable" without saying what the closure is.

## Per game

### Return of the Obra Dinn (Lucas Pope)
- **Readiness**: (a) crew portraits stay *blurred* until every memory bearing on that person is seen — a sharp face means "nothing more to show you" ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1552463657); wording critique at [intermittentmechanism](https://intermittentmechanism.blog/2020/09/25/return-of-the-obra-dinn-commentary-and-critique/)). (b) Fates lock in **threes**: three correct (name + fate + culprit) and the ledger stamps them ([rule-of-three feature](https://filmstories.co.uk/features/exploring-return-of-the-obra-dinns-rule-of-three/)).
- **Why three**: Pope's June 2015 devlog ([dukope.com/devlogs/obra-dinn](https://dukope.com/devlogs/obra-dinn/) — 403 here, paraphrased via search excerpt) weighs end-of-game count (no loop), per-fate feedback ("trivial to try all the combinations and skip the game"), or batches. Three is the smallest batch at which guess-and-check across ~60 crew stops being a strategy. Sets of two were tried and survive for the last six fates ([TCRF](https://tcrf.net/Return_of_the_Obra_Dinn)).
- **Wrong**: no penalty, no message — silence is the feedback. Residual brute force once two of a triple are known ([intermittentmechanism, confirmation](https://intermittentmechanism.blog/2024/05/21/confirmation-in-the-return-of-obra-dinn/)).
- **Unstuck**: only the blur. Fully diegetic.
- **Borrow**: a per-suspect "the scene has no more for you here" state, and confirmation that fires only on a *bundle* of facts.

### The Case of / The Rise of the Golden Idol (Color Gray)
- **Readiness**: fill-in-the-blank sentences; Solve is live once every blank is filled. Feedback is coarse: "two or fewer slots are incorrect" vs "there are incorrectly filled slots" ([Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2874703304)).
- **Why**: Klavins, [Game Developer](https://www.gamedeveloper.com/design/case-of-the-golden-idol): "With a limited input system, an option to brute force solutions appears. This meant we could not validate each phrase slot, but evaluating the whole puzzle as wrong or right frustrated the players." The near-miss tier "served the same purpose of rewarding the player for being close." Authoring used a "thought path" of inferences a player *must* make, checked in playtests ([Game Developer, testing](https://www.gamedeveloper.com/business/-the-case-of-the-golden-idol-i-used-frequent-testing-to-improve-its-mystery-solving)).
- **Wrong**: unlimited free retries.
- **Unstuck**: hints gated behind identifying several figures first, then a menu of four vaguely-titled topics giving a way to *think* ([Shacknews](https://www.shacknews.com/article/135265/case-of-the-golden-idol-on-camera-interview); [RPGFan](https://www.rpgfan.com/review/the-case-of-the-golden-idol/)). Rise adds three levels: leading question → guidance → direct ([RPGFan Rise](https://www.rpgfan.com/review/the-rise-of-the-golden-idol/)). Non-diegetic, deliberately discouraged.
- **Borrow**: "close" as a signal tier ("one thing in your theory is off"); hints earned by progress and phrased as questions.

### The Roottrees Are Dead (Johnston, Ward)
- **Readiness**: profiles lock in threes with a "Well Done." interrupt; confirmation frequency *drops* as you progress, teaching the loop early and trusting you late ([Adventure Game Hotspot](https://adventuregamehotspot.com/review/3671/the-roottrees-are-dead); [spectrecollie](https://spectrecollie.com/2026/08/08/the-roottrees-are-dead-or-5-easy-pieces/)). Endgame openly says some names must be eliminated — the game admits when reasoning is exhausted.
- **Wrong**: silent, free; final envelope has an explicit "I'm Ready" commit ([Steam](https://steamcommunity.com/app/2754380/discussions/0/599642431046066826/)).
- **Unstuck**: the hint "checks what evidence you've unearthed and which profiles you haven't yet locked in" and points "from subtle nudges to outright answers if you're persistent" — often at evidence already held. No penalty.
- **Borrow**: a hint engine that *diffs collected evidence against unlocked conclusions* and points at what you already have.

### Her Story (Sam Barlow)
- **Readiness**: no validation ever. After enough key clips, a "Chit Chat" window opens and SB asks whether you think you understand; Y ends, N lets you keep searching and be asked again ([AppUnwrapper](https://www.appunwrapper.com/2015/06/24/her-story-walkthrough-guide/); [Wikipedia](https://en.wikipedia.org/wiki/Her_Story_(video_game))). Trigger is coverage; decision is the player's.
- **Wrong**: no concept of wrong; Barlow refuses to canonise ([GameSpot](https://www.gamespot.com/articles/a-decade-later-her-story-is-still-a-mystery-and-one-interpretation-makes-sam-barlow-uncomfortable/1100-6532656/)).
- **Unstuck**: the search UI (5-result cap forces new keywords). Fully diegetic.
- **Borrow**: the exact fix — a diegetic prompt on coverage asking "do you think you understand?", never "you're done".

### Paradise Killer (Kaizen Game Works)
- **Readiness**: trial starts whenever you like; Judge warns it goes badly if unprepared. "We're not asking you to jump through a hoop… we're asking you to feel confident enough that you've got enough evidence" ([MCV](https://mcvuk.com/business-news/we-never-wanted-to-force-our-beliefs-and-our-stories-on-you-make-your-own-one-up-theres-so-much-more-power-in-the-imagination-behind-the-development-of-paradise-killer/); [Game Developer](https://www.gamedeveloper.com/design/inside-the-fantastic-murder-mystery-design-of-i-paradise-killer-i-)).
- **Wrong**: no feedback; unevidenced accusations fail to convict and the game never labels an ending bad. Cost is narrative, irreversible.
- **Unstuck**: redundant evidence; the Starlight computer lists open leads per suspect — a *coverage* view, not a truth view. Diegetic.
- **Borrow**: an open-leads-per-suspect list whose empty state is the readiness cue.

### Shadows of Doubt (ColePowered)
- **Readiness**: an "incrimination system" so the game and player both "track your investigation… not leave you wondering how well you're doing" ([devblog 10](https://colepowered.com/shadows-of-doubt-devblog-10-gameplay-loop/)); string board ([devblog 4](https://colepowered.com/shadows-of-doubt-devblog-4-case-folders-cork-boards/)).
- **Wrong**: resolution form; only the killer's name is required; wrong costs 100 credits, right pays 1,000 plus bonuses for optional fields; unlimited resubmits ([fandom](https://shadows-of-doubt.fandom.com/wiki/Resolution_Form)). Brute force deterred by cost, not blocked.
- **Unstuck**: procedural redundancy only. Diegetic.
- **Borrow**: one required field, optional fields that raise the *score* — partial theories are submittable.

### Chants of Sennaar (Rundisc)
- **Readiness**: notebook validates per double-page, not per glyph ([Steam](https://steamcommunity.com/app/1931770/discussions/0/4143942360095589829/)). Moya credits "the Obra Dinn-inspired validation system" and the rule that "every word… must be seen at least twice in two different situations" ([Game Developer](https://www.gamedeveloper.com/design/immersing-players-in-the-culture-of-a-people-with-language-puzzler-chants-of-sennaar)).
- **Wrong**: silent, free. **Unstuck**: playtest fixes *added occurrences* of the clue, never a hint. Diegetic.
- **Borrow**: redundancy as the unstuck mechanism — every load-bearing fact in two places.

### Lorelei and the Laser Eyes (Simogo)
- **Readiness**: none; locks open or don't. **Wrong**: free retry (a few puzzles require commitment). **Unstuck**: "players will never get hit with a puzzle gridlock thanks to non-linear progression" ([Game Rant](https://gamerant.com/lorelei-laser-eyes-puzzle-story-difficulty/)); "it's interesting if players need to understand the puzzles, even if they are looking at guides" ([Screen Rant](https://screenrant.com/lorelei-laser-eyes-interview-challenge-puzzle-simon-flesser/)). Diegetic documents.
- **Borrow**: an accusation a guide can't paste — the player states the *reasoning*, not the name.

### The Painscreek Killings (EQ Studios)
- **Readiness**: none by design ("abandon any quest markers, game hints… resembles real life"); leave town and submit any time. **Wrong**: wrong culprit or weapon yields "Case Unsolved"; grade and % completion shown after ([devlog 3](http://eqstudios.blogspot.com/2017/12/making-of-painscreek-killings-3.html); [postmortem](https://www.gamedeveloper.com/business/postmortem-the-painscreek-killings)). **Unstuck**: "multiple but subtle hints for every main puzzle, a breadcrumb system." Diegetic journal.
- **Borrow**: a post-accusation grade showing found vs missed — feedback after commitment.

### Pentiment (Obsidian, Josh Sawyer)
- **Readiness**: a *deadline*; after a few in-game days the Archdeacon demands a name ([Game Developer](https://www.gamedeveloper.com/design/making-pentiment-s-most-macabre-murder-mysteries)). Alibis were cut: "all it does is exclude… we're trying to rule people in, not rule them out."
- **Wrong**: "there cannot be a right answer" ([Shacknews](https://www.shacknews.com/article/146276/pentiment-josh-sawyer-no-correct-answer)); cost is watching the consequence. **Unstuck**: the clock resolves indecision.
- **Borrow**: a soft clock ("the Corporation wants a name by end of shift") converts "I could keep looking" into a decision.

### Sherlock Holmes: Crimes & Punishments (Frogwares)
- **Readiness**: deduction board; enough linked clue-pairs light a conclusion node with a choice of interpretations. "The truth of the conclusion is not guaranteed this time" ([Frogwares devblog](https://frogwares-studio.tumblr.com/post/45102739150/sherlock-holmes-crimes-punishments)).
- **Wrong**: nothing at commit; *after* the moral choice you may hold a key to reveal green/red, see other players' verdict percentages, and replay ([Steam](https://steamcommunity.com/app/241260/discussions/0/615085406661738967/)). Wrong theories usually come from incomplete clue collection ([HG101](https://www.hardcoregaming101.net/sherlock-holmes-crimes-punishments/)).
- **Unstuck**: the board shows unlinked nodes. Diegetic.
- **Borrow**: a conclusion node that only *appears* when its inputs are linked — appearance is the readiness signal — plus optional post-verdict reveal.

## What to build (ranked by fit to page-holds-truth + Watson tool calls)

1. **Watson's "do you think you understand?"** (Her Story): page tracks coverage of load-bearing facts; when all are in the notebook Watson asks, in character, whether to make the accusation. Never says "correct".
2. **Open leads per suspect** (Paradise Killer / Roottrees): a diegetic list that empties as evidence lands; empty = closable.
3. **Bundle confirmation** (Obra Dinn / Roottrees / Chants): if the accusation has sub-facts (who, how, why), confirm the bundle, never a slot.
4. **"Close", not "wrong"** (Golden Idol): one coarse pre-verdict tier — "one part of your theory contradicts the scene."
5. **Soft deadline** (Pentiment): a shift clock Watson mentions once coverage is complete.
6. **Evidence-diff hints** (Roottrees), gated by progress and phrased as questions (Golden Idol).
7. **Post-verdict reveal + grade** (Sherlock / Painscreek): a "what you missed" ledger after commitment.
