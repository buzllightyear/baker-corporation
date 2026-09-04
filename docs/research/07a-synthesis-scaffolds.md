# Research 7a — Synthesis scaffolds: turning a full notebook into a conclusion

Source: research subagent, 2026-09-04 KST. Problem: the playtester holds every load-bearing card, the page has told them the notebook covers everything provable, and they still cannot see who did it. This is a **combination** gap, not a search or readiness gap. `05a` covers "have I got enough / am I right" (confirmation, readiness); this doc covers the step in between — what the player *manipulates* to get from clues to a claim, and how that manipulation stays short of an answer key.

## The pattern

Every acclaimed deduction game externalises the synthesis step as an **object with slots**. Three families:

- **Pairwise combination** (AAI Logic, Thought Route, present-evidence, Danganronpa): the atom is *fact × fact → new fact* or *evidence × statement → contradiction*. The scaffold restricts the search space to pairs, so the player reasons about *which two* rather than about everything.
- **Sentence templates** (Golden Idol, Tangle Tower, Roottrees, Chants): the game supplies the grammar of the conclusion and a finite word pool; the player supplies the binding. The template itself is the teaching device — it tells you *what kind of thing* the answer is.
- **Free graphs** (Sherlock C&P, Shadows of Doubt, Outer Wilds, Paradise Killer, Disco): nodes and strings; the game validates little or nothing, and the structure exists so the player can *see* the gap, not so the game can grade it.

The anti-answer-key trick is shared: feedback is **coarse, batched, or absent**; the scaffold reveals *shape* (how many things, of what type, connected how) and never *binding*. Distinct fail text per wrong choice (Dual Destinies) turns rejection into teaching without naming the answer.

## Per game

### Ace Attorney Investigations — "Logic" (Capcom)
- **Shape**: facts are collected like evidence; in Logic mode the player picks two and "snaps" them together to form a new fact or trigger an event ([SuperJump](https://www.superjumpmagazine.com/hands-on-preview-ace-attorney-investigations-is-more-essential-than-i-remembered/), [Capcom](https://www.ace-attorney.com/investigations1-2/en-us/structure/)). Once per episode Edgeworth converts several past statements into logic pieces all at once and must chain them to a decisive conclusion ([fandom](https://aceattorney.fandom.com/wiki/Logic)).
- **Feedback / brute force**: a wrong pairing costs a slice of the truth gauge (series convention; game over on empty). With 4–6 facts live at a time the pair space is ~10–15, so the penalty, not the combinatorics, is the deterrent.
- **Stuck help**: the pool is *only* facts that combine; if a fact is in the pool, it has a partner. Being told "these six are the relevant six" is most of the synthesis.
- **Borrow**: Watson could hold a "logic pool" tool — `combine(fact_a, fact_b)` returns a derived proposition only if the page's truth model licenses it, and the player, not Watson, picks the pair.

### Dual Destinies — "Thought Route" / Revisualization (Capcom)
- **Shape**: at the end-of-case crisis the player walks a branching path of the case's major facts, choosing at each fork which fact or piece of evidence advances the reasoning ([fandom](https://aceattorney.fandom.com/wiki/Revisualization)). Scenario director Yamazaki added it as a second solving avenue beyond presenting evidence ([Capcom localization blog](https://news.capcomusa.com/lets/browse/phoenix-wright-ace-attorney-dual-destinies-localization-the-trials-and-tribulations-of-the-gameplay-mechanics-team)).
- **Feedback**: Yamazaki forbade reusing dialogue for wrong choices — "a different fail message for each option". Wrong answers explain *why that reading fails* rather than say "no".
- **Stuck help**: it lays the facts out as a route, so the player's job is ordering, not recall.
- **Borrow**: bespoke rejection lines per wrong accusation part, written by the page from its truth model, are cheaper than a hint ladder and spoil less.

### Phoenix Wright — present evidence against a statement (Shu Takumi)
- **Shape**: testimony is a list of statements; the player presses or presents one item of evidence against one statement. Takumi's design origin was an Edogawa Ranpo story where a crime "unravels due to the criminal's contradictory testimony" ([Wikipedia](https://en.wikipedia.org/wiki/Phoenix_Wright), [NintendoLife](https://www.nintendolife.com/news/2014/06/creator_shu_takumi_testifies_on_ace_attorney_writing_process)).
- **Feedback / brute force**: penalty per wrong present; brute force costs statements × evidence tries. After failures the Consult option names the *statement* to attack, never the evidence (see `05b`).
- **Stuck help**: the unit is a *statement*, so synthesis becomes "which line is false" — a one-dimensional scan a stuck player can actually run.
- **Borrow**: expose the crew's testimony as addressable statements Watson can list; let the player `contradict(statement, card)`.

### The Case of the Golden Idol (Color Gray)
- **Shape**: a scroll with blanks and a bag of names/verbs/nouns. Early demo: build full sentences from generic phrases — too rigid. Shipped: "here is a bunch of phrases, where do you think they fit?" The scroll "is not completely blank — it offers a lot of grammatical and semantic context" ([Game Developer](https://www.gamedeveloper.com/design/case-of-the-golden-idol)).
- **Feedback / brute force**: three tiers per sub-section — too many errors / two or fewer wrong / correct. Binary feedback frustrated testers ("no idea which of their deductions were correct"); per-slot feedback would let players "optimize the fun out of a game". Split into sub-sections (name the people, narrative scroll, who-did-it) so partial credit is localised without being per-slot ([GameFAQs](https://gamefaqs.gamespot.com/pc/327944-the-case-of-the-golden-idol/faqs/79560/introduction)).
- **Stuck help**: a "thought path" scheme — which key opens which door → whose room → who. Testing rule: "if a player understands the main mystery immediately and then is stuck for thirty minutes on some technicality, that's bad" ([testing article](https://www.gamedeveloper.com/business/-the-case-of-the-golden-idol-i-used-frequent-testing-to-improve-its-mystery-solving)).
- **Borrow**: give the accusation a *sentence* with typed slots (who / how / with which card), and a page-side "N of the slots contradict the scene" check.

### Return of the Obra Dinn (Lucas Pope)
- **Shape**: the book — crew manifest, sketch, per-death page with name / fate / killer dropdowns. Pope moved the puzzle from "how they died" to "who they are" because "the real fun part would be figuring out who they are" ([Game Developer](https://www.gamedeveloper.com/design/for-lucas-pope-i-return-of-the-obra-dinn-i-was-a-bunch-of-appealing-design-problems)).
- **Feedback / brute force**: fates lock in threes; "it would take as much or more time to guess through 60 names than to pay attention" ([intermittentmechanism](https://intermittentmechanism.blog/2024/05/21/confirmation-in-the-return-of-obra-dinn/)). Detail in `05a`.
- **Stuck help — the ladder**: identifications are tiered. Easy: someone says the name, a role is visible in action (topmen in rigging). Medium: uniform / rank clustering ("crew of the same rank tend to stand together"), the group sketch, accents, hammock numbers. Hard: elimination once neighbours are fixed. A stuck player always has a rung: *fix the easy ones, and the hard ones become elimination*.
- **Borrow**: order the crew by "how many independent clues pin this person"; let Watson answer "who is easiest to place next?" with a rung, not a name.

### The Roottrees Are Dead (Johnston, Ward)
- **Shape**: a family-tree corkboard; each person = name + occupation + photo picked from lists; photos only appear once found ([AGH](https://adventuregamehotspot.com/review/3671/the-roottrees-are-dead)).
- **Feedback / brute force**: confirmed in threes; "Well Done" shows which items locked, and anything not locked at that moment is therefore wrong — a *diff* against the answer at batch granularity ([spectrecollie](https://spectrecollie.com/2026/08/08/the-roottrees-are-dead-or-5-easy-pieces/), [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/TheRoottreesAreDead)).
- **Stuck help**: the rubber duck gives two escalating clues about *what to search next* before telling; hints are contextual to board state ("you have enough to fill this part in") ([Steam thread](https://steamcommunity.com/app/2754380/discussions/0/734749878368903592/), [Robin Ward](https://carpdiem.online/@eviltrout/113046882568701834)). Hints re-point at evidence already held ("led me back to a search I'd done dozens of times").
- **Borrow**: hint = pointer to a card the player already owns, computed from the diff between board and truth; never a new fact.

### Sherlock Holmes: Crimes & Punishments (Frogwares)
- **Shape**: clue nodes link pairwise into deduction nodes; most nodes carry a binary interpretation; a conclusion node lights when its inputs connect. Several conclusions are reachable, only one true ([Gamecritics](https://gamecritics.com/jay-pullman/sherlock-holmes-crimes-punishments-review/)).
- **Feedback / brute force**: none on truth — only on coherence; you can "finish the whole game and never get a right answer" ([HG101](https://www.hardcoregaming101.net/sherlock-holmes-crimes-punishments/)). After accusing you may check whether every clue was found.
- **Stuck help**: the board *shows* which conclusion still lacks an input; the binary toggles enumerate the interpretive choice the player must make.
- **Borrow**: a board Watson can *read* ("two of your nodes point at Hale, one at Voss, and the Voss node has an unset toggle") without evaluating truth.

### Tangle Tower / Detective Grimoire (SFB Games)
- **Shape**: four-blank sentences — noun, connector, noun, connector — from ~8-option pools ([bp-reviews](https://bp-reviews.blogspot.com/2019/12/tangle-tower.html)).
- **Feedback / brute force**: retry freely; the game hints "which parts of the statement you already got right"; no fail state ([indiehellzone](https://indiehellzone.com/2024/10/02/tangle-tower/)). Brute-forceable by design — casual target.
- **Stuck help**: the connector words *are* the reasoning ("...which means...", "...because..."); filling nouns around them is guided synthesis.
- **Borrow**: connector vocabulary in the accusation UI so the player states a *relation*, not a name.

### Danganronpa — class trial (Spike Chunsoft, Kodaka)
- **Shape**: Nonstop Debate: statements scroll; weak points are highlighted; the player fires a Truth Bullet (evidence) at the one it contradicts, sometimes agrees with instead ([fandom](https://danganronpa.fandom.com/wiki/Class_Trials)). Framed as "High Speed Reasoning Action" to lower the entry barrier of reasoning games ([NamuWiki](https://en.namu.wiki/w/%EB%8B%A8%EA%B0%84%EB%A1%A0%ED%8C%8C%20%EC%8B%9C%EB%A6%AC%EC%A6%88)).
- **Feedback / brute force**: influence gauge drains on wrong shot; loaded bullets are pre-filtered to a handful; the closing-argument comic is a fill-in-the-panels ordering puzzle.
- **Stuck help**: the trial is a *scripted synthesis* — the game walks the chain one contradiction at a time; the player only supplies each link.
- **Borrow**: a "hearing" mode where Watson reads statements aloud and the player interrupts with a card — the sequencing is the scaffold.

### Shadows of Doubt (ColePowered)
- **Shape**: corkboard, pinned evidence windows, strings; incrimination "flows" along strings, coloured white→red by strength and widened by reliability, animated for direction ([devblog 4](https://colepowered.com/shadows-of-doubt-devblog-4-case-folders-cork-boards/)).
- **Feedback**: none on the board; validation only at hand-in. Brute force is bounded by the city, not the UI.
- **Stuck help**: the strings make *chains* visible — a suspect with no string to the scene is the gap.
- **Borrow**: strength/reliability on edges, so "this link is a rumour" reads differently from "this link is a fingerprint".

### Outer Wilds — rumor mode (Mobius Digital)
- **Shape**: entry cards; rumour facts vs explore facts; lines between cards from rumour sources; a "more to explore here" marker on cards with undiscovered facts; four colour-coded "curiosity webs" ([NH ship-log guide](https://nh.outerwildsmods.com/guides/ship-log/), [Beachum interview](https://medium.com/@cordialkobold/interview-with-alex-beachum-creative-director-of-outer-wilds-a01bb9631e20)).
- **Feedback**: nothing is graded; the graph only records. Curiosity, not correctness.
- **Stuck help**: the graph shows *edges without a destination* — the classic "I have everything but can't connect it" is reframed as "this card still has a dangling line".
- **Borrow**: for the synthesis gap, render the notebook as a fact graph where propositions still unproven show as dangling edges (page-computed, names no truth).

### Paradise Killer (Kaizen Game Works)
- **Shape**: casefiles holding evidence; interrogation = pick casefile → pick evidence → ask. Trial: accuse anyone you can support. "FACT AND TRUTH ARE NOT THE SAME"; "we always lay the facts out for the player and it is up to them to interpret them" ([Game Developer](https://www.gamedeveloper.com/design/inside-the-fantastic-murder-mystery-design-of-i-paradise-killer-i-)).
- **Feedback**: none before trial; the trial adjudicates on *support*, not truth.
- **Stuck help**: casefiles partition evidence by *sub-crime*, so synthesis is local ("solve the break-in, then the poisoning") before global.
- **Borrow**: partition the notebook into sub-questions the page knows are separable.

### Disco Elysium — Thought Cabinet (ZA/UM)
- **Shape**: thoughts arrive face-down; internalising takes in-world time; limited slots; effects revealed after ([devblog](https://discoelysium.com/devblog/2019/09/30/introducing-the-thought-cabinet)). It is a character system, not a deduction engine.
- **Relevance**: a *theory* can be a held object with a cost and a delayed payoff. "Hale is the killer" as an internalisable thought that later yields a conversation option is a synthesis scaffold in disguise.
- **Borrow**: let the player *hold* a working theory Watson then tests in later dialogue, instead of only accusing.

### Lorelei and the Laser Eyes (Simogo)
- **Shape**: no deduction UI; an in-game notes screen; ciphers "distributed throughout the game" for big puzzles, clues "close at hand" for small ones ([ScreenRant](https://screenrant.com/lorelei-laser-eyes-interview-challenge-puzzle-simon-flesser/)).
- **Anti-answer-key**: randomised codes so "players need to understand the puzzles, even if they are looking at guides".
- **Borrow**: randomise incidental bindings so a leaked answer key does not transfer; the *method* must be reproduced.

### Chants of Sennaar (Rundisc)
- **Shape**: journal double-pages of pictures; drag glyphs onto them; a page validates only when *all* its glyph–image pairs are right (Obra Dinn-inspired) ([Game Developer](https://www.gamedeveloper.com/design/immersing-players-in-the-culture-of-a-people-with-language-puzzler-chants-of-sennaar), [Wikipedia](https://en.wikipedia.org/wiki/Chants_of_Sennaar)).
- **Feedback / brute force**: page-level batch, silent otherwise; the picture set tells you *how many* meanings exist and their categories — shape without binding.
- **Borrow**: the accusation form as a "page" with typed pictures (a person, a method, a card) that validates as a set.

## What to borrow for Baker (page holds truth; Watson can operate tools)

1. **Typed sentence, not a name field**: accusation = who / how / because-card, with connector words (Golden Idol + Tangle Tower). The template teaches what a complete theory is.
2. **Pair tool**: `combine(card_a, card_b)` returns a derived proposition iff the page's truth model licenses it; the player chooses pairs, Watson executes (AAI Logic). Wrong pairs cost a small "Watson's patience" gauge, not a hint.
3. **Dangling-edge notebook**: render propositions as a graph; unproven claims show as open lines; no truth values (Outer Wilds + Sherlock C&P).
4. **Per-part fail lines, batch-only verdict**: keep `05`'s coarse "N of three contradict"; write distinct in-character rejections per wrong part (Dual Destinies) instead of listing which part.
5. **Easy-rung query**: Watson answers "who can I place next?" with the person most over-determined by held cards, Obra Dinn-style — a rung, never a name.
6. **Sub-casefiles**: split the notebook into page-known separable questions (Paradise Killer) so synthesis is local first.
7. **Held theory**: let the player pin a working theory that Watson tests in subsequent testimony (Disco), so combining has a place to live before the accusation.
