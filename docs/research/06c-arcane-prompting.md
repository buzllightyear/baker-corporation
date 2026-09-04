# Research 6c — Prompting an Arcane / Fortiche "painted 3D" look from text-only image models

Source: research subagent, 2026-09-04 KST. Scope: how practitioners (2024–2026) get the Fortiche look from Midjourney, SD/Flux/Krea LoRAs and OpenAI gpt-image via text; what fails; character consistency without LoRA; whether our Codex CLI pipeline can take reference images. Limitation: reddit.com blocks this crawler, so r/StableDiffusion and r/midjourney threads could not be read directly — vocabulary below is taken from LoRA model cards (which distil the same community), prompt-guide sites, OpenAI's cookbook and Midjourney write-ups.

## 0. First finding: our pipeline CAN take reference images

- **Codex CLI's built-in `image_gen` tool (gpt-image-2 since 2026-04-21) accepts images already in the conversation.** Attach with `codex -i anchor.png "…"` / `--image a.png,b.png`; the bundled `$imagegen` skill says reference images "provide style, composition, or mood guidance" in generate mode and full edit mode exists (inpaint, replace, variants), with images "loaded into conversation context before processing" ([openai/codex imagegen SKILL.md](https://github.com/openai/codex/blob/main/codex-rs/skills/src/assets/samples/imagegen/SKILL.md), [Daniel Vaughan, Codex image gen](https://codex.danielvaughan.com/2026/04/27/codex-cli-image-generation-gpt-image-2-visual-development-workflows/)). The skill's CLI fallback (`scripts/image_gen.py generate|edit|generate-batch`) needs `OPENAI_API_KEY`.
- **Images API `/images/edits`** takes up to 16 input images (`file_id` or base64 `image_url`) for gpt-image-1.5 with `input_fidelity: high`; gpt-image-2 "processes every image input at high fidelity automatically" and the parameter is omitted ([OpenAI image guide](https://developers.openai.com/api/docs/guides/image-generation), [edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit)). **No `seed` parameter exists** for any gpt-image model; OpenAI's own docs admit the model "may occasionally struggle to maintain visual consistency for recurring characters".
- Wrapper [`codex-imagegen-cli`](https://github.com/jdmnk/codex-imagegen-cli) reuses `~/.codex/auth.json` (no API key) and exposes `--image` (content) + `--style-image` (style), up to 5 inputs.
- **Implication:** generate one canon face + one full-body anchor per character, then run every later image as an *edit* with the anchor attached. Text-only consistency (section 4) is the fallback, not the plan.

## 1. Descriptor phrases that move output toward the look (ranked)

Ranking = how often the phrase recurs across LoRA cards, Arcane-prompt guides and the OpenAI cookbook, weighted by whether guides call it "signature". Model notes: MJ = Midjourney, SD = SD1.5/SDXL/Illustrious LoRAs, FX = Flux/Krea LoRAs, GI = gpt-image (prose prompts; "follows texture instructions more literally than any diffusion model" per [arcaneportraits](https://arcaneportraits.com/learn/arcane-style-portrait-prompts)).

1. **"stylized 3D character with hand-painted textures"** — the core sentence every guide converges on; the show's actual pipeline (hand-painted Photoshop textures projected on simplified 3D geometry, light painted into the texture — [yelzkizi breakdown](https://yelzkizi.org/what-3d-program-did-arcane-use/)). All models.
2. **"visible brushstrokes on skin and fabric, oil-sketch shading"** — "brushstrokes that stay visible at close range". GI/MJ strong; SD needs a painterly LoRA (e.g. `ED_Painterly`, "influences the texture of the canvas, background, and how brush strokes are visible" — [Civitai Textured Painterly](https://civitai.com/models/2570886/textured-painterly-style)).
3. **"hard rim light in a contrasting colour to the key (teal against amber)"** — named "the signature element". All models.
4. **"sharp graphic facial planes, sculpted cheekbones, jaw carved by light into flat shapes"** — separates Fortiche from smooth CG. GI/MJ.
5. **"graphic high-contrast shadows, two-tone light/shadow split, no soft gradients"**. All.
6. **"muted desaturated base with saturated accent colours"** + palette words: undercity "industrial teal, violet, sickly neon green"; upper city "warm gold, brass, cream". Flux Arcane LoRA card uses "cold color palette, muted colors" ([Muapi flux-arcane-intro-style](https://huggingface.co/Muapi/flux-arcane-intro-style/blob/main/README.md)).
7. **"impasto brushwork on hair, hair painted as chunky ribbons/clumps, not strands"** (from pipeline breakdowns — "visible impasto brushwork… rim-lit edges around hair and metal").
8. **"no ink outlines; edges defined by value and colour change"** — Fortiche "relies on hand-painted texture detail rather than traditional outlines".
9. **"stylized realism, not cartoon exaggeration"** — used verbatim in the [Wade Pixels Arcane guide](https://wadepixels.com/arcanestyle.html); protects from chibi/anime.
10. **"rich painterly gradients instead of flat colours"** (same guide) — stops cel-shading.
11. **"canvas grain / paper texture visible in the flats"**. GI/MJ; SD via painterly LoRA.
12. **"strong silhouette, angular design"**.
13. **"cinematic volumetric lighting, layered atmospheric depth"** — MJ/GI; in SD tends toward realism, use with a LoRA.
14. **"matte-painting background, painted environment with loose brushwork, less detail than the character"**.
15. **"hand-painted 2D textures over 3D forms, concept-art finish"** — the "concept art-like quality" framing from the pipeline articles.
16. **"gouache / oil on textured board"** medium anchors — the OpenAI cookbook's own illustrated examples work by naming a medium ("hand-painted watercolor look, soft outlines, warm earthy colors") plus tactile material detail ([gpt-image-1.5 prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-1.5-prompting_guide)).
17. **"industrial brass, pipes, riveted metal"** — set-dressing tags from the Krea2 LoRA card ([Civitai](https://civitai.com/models/2815410/arcane-style)); optional.
18. **"crisp edges where forms overlap; texture inside, clean silhouette outside"** — reconciles painterly with legible.
19. LoRA-only triggers, meaningless on gpt-image: `arcane style` ([nitrosocke](https://huggingface.co/nitrosocke/Arcane-Diffusion)), `Arcan3l0l` (SD1.5, w 0.75–1 — [Civitai](https://civitai.com/models/83746/arcane-style-lora)), `ArcaneFGTNR` (Flux), `arcanekreastyle` (Krea 2).
20. Midjourney-only: `--sref` codes (e.g. 1727197665 "Arcane Etchings" is *etching*, not the show — [Midlibrary](https://midlibrary.io/styles/bc7406)); `--sw 65–175` balance; `--no photorealism, smooth skin` when it drifts ([Midlibrary sref deep dive](https://midlibrary.io/midguide/deep-dive-into-midjourney-sref-codes)).

## 2. Phrases to exclude (they pull toward photoreal or anime)

- **Naming the show.** "arcane style" alone fails three ways on hosted models: reads as "magical/mystical", trips IP filters, and fan-art dilution "pushes results toward anime" ([arcaneportraits](https://arcaneportraits.com/learn/arcane-style-portrait-prompts)). gpt-image-2 rejects "in the style of [named creator]" more readily than the same visual description ([tech-insider](https://tech-insider.org/how-to-use-gpt-image-2-chatgpt-2026/)). Describe ingredients; never write "Arcane", "Fortiche", "League of Legends".
- **"stylized" on its own** — "drifts toward anime because anime dominates stylized training data".
- Photoreal pullers: "photorealistic", "8K", "ultra-detailed", "octane render", "unreal engine", "hyperrealistic skin pores", "DSLR", "bokeh", "smooth shading", "soft focus", "subsurface scattering". (The Flux LoRA card's "detailed, 8k" is a LoRA-era habit; on gpt-image it raises realism.)
- Anime pullers: "anime", "manga", "cel-shaded", "big sparkling eyes", "1girl", "masterpiece, best quality" booru tags, "lineart", "clean outlines".
- Mush pullers: "dreamy", "ethereal", "soft painterly blur", "abstract expressionist".
- SD negative prompt that guides agree on: `photorealistic, smooth shading, soft focus, anime, lineart, blurry, muddy colors`. gpt-image has no negative field — state the positive ("edges crisp, shadows graphic") and end with a one-line "Avoid: …" (the fal.ai guide finds "preserve X" beats avoid-lists — [fal.ai gpt-image-2 guide](https://fal.ai/learn/tools/prompting-gpt-image-2)).

## 3. Faces: stylised but clean

- Lead with structure, then texture: "sharp graphic facial planes, sculpted cheekbones, defined jaw, bold contour separation; strong directional key light carving the planes" — light defines the planes, brushwork only fills them.
- Fix eye/feature scale explicitly: "eyes slightly larger than real but with hard-edged lids and a single specular dot; small painted nose; lips as two value shapes". This stops both anime eye inflation and oil-portrait smearing.
- Put the brush texture *elsewhere*: "brushstrokes visible on hair, clothing and background; face rendered cleanly with tight edges". Texture on the face is where "smudged" comes from.
- Keep anchor faces boring: neutral lighting, front view, no motion blur or half-hidden faces ([gpt-image2ai consistency guide](https://gpt-image2ai.art/blog/gpt-image2-ai-art-character-consistency-prompt-guide/)).
- If it still mushes: drop "oil painting" for "painted texture over clean 3D forms" and add "crisp silhouette, no blur".

## 4. Character consistency with text (and what to do when references are available)

- **Character bible block** — a fixed ~40-word sentence per character, pasted verbatim, same word order every time: name-less serial tag (e.g. `[CHAR-03]`), age bracket, face geometry (eye line, nose bridge, jaw length), hair shape + colour hex, skin tone, 2–3 signature garments with colours, one prop, one asymmetry (scar, earring). Save as a reusable snippet ([SSW rule](https://www.ssw.com.au/rules/consistent-ai-generated-characters), [nanoprompts character handbook](https://nanoprompts.org/gpt-image-2/prompt-handbook/character)).
- **Fixed order**: scene → subject (the bible block) → key details → use case → constraints, with line breaks between labelled segments (OpenAI cookbook; fal.ai). Style block last so it doesn't "bleed" into identity.
- **One variable per image** — change expression OR outfit OR scene OR camera; "changing makeup, wardrobe, and location in one prompt is how consistency usually fails" ([gptimage2.hk playbook](https://gptimage2.hk/en/blog/gpt-image2-character-consistency-guide/)).
- **Preserve / change / exclude** lines each time: "Keep the same face, same hooded coat, same proportions, same palette" — never assume carry-over.
- **Seeds**: none on gpt-image; do not build repeatability on undocumented controls. Midjourney has `--seed` plus `--oref <url> --ow 100–150` and `--sref` for style ([Flowith V7 guide](https://flowith.io/blog/midjourney-v7-consistent-characters-masterclass/)); `--cref` is V6-only.
- **With references (our real path)**: assign each image a job — "Image 1: preserve face, hairline, hair texture only. Image 2: proportions, outfit silhouette, palette. Image 3: brushwork and colour mood only" — to stop style references overwriting identity. Regenerate rather than edit when identity drifts.
- Colour list: give 5 hexes (key light, rim, skin, garment A, garment B) in the bible; models honour hex better than adjectives.

## 5. Design sheets and UI mockups on-style

- **Sheet**: "character turnaround, front / three-quarter / side / back, full body, neutral grey studio light, identical face geometry, seams, colours and accessories in every view, equal gutters, **no text labels**" — labels drift; add in post ([nanoprompts](https://nanoprompts.org/gpt-image-2/prompt-handbook/character)). One purpose per sheet (turnaround, 3×3 expressions, outfit variants, callouts).
- **UI mockup**: specify it as a *painted key-visual of a screen*, not a screenshot: "flat 2D interface mock, painted panel textures, brass-and-glass frames, hand-lettered labels as EXACT TEXT 'CASE FILE', two-tone teal/amber palette, same brushwork as the character art, no photographic gloss". State intended use ("UI screen") — the cookbook says use case sets the model's mode. Keep text minimal and quoted/ALL CAPS.

## 6. Pitfalls

- **Text**: gpt-image-2 claims >99% text accuracy but only when text is quoted/ALL CAPS, typography specified, "no extra words, no duplicate text"; spell hard words letter by letter (cookbook, fal.ai). Diffusion LoRAs: assume garbage text, mask it later.
- **Style drift across a batch**: each call is stateless; drift compounds when the block is paraphrased. Freeze the block as a file, diff prompts, and "re-specify critical details if they start to drift" (cookbook). `n` variants of one prompt drift less than re-typed prompts.
- **Photoreal default**: gpt-image-2 "defaults toward photorealistic output" (fal.ai); the "ArtStation/8K" reflex worsens it. Medium anchor must be first in the style block.
- **Style consuming identity**: heavy painterly words erase faces; keep identity block above style block and texture off the face.
- **Cost/size**: image turns burn Codex limits 3–5× faster than text; stay at 1536×1024.
- **Filters**: even descriptive prompts get refused if a real brand/person sneaks in; strip names.

## Style block draft (EN, ~150 words) — paste last, verbatim

STYLE (fixed): Stylized 3D character art finished with hand-painted textures, like oil and gouache brushed over clean sculpted forms. Visible brushstrokes on hair, clothing and background; hair painted as chunky rim-lit clumps. Faces clean and readable: sharp graphic facial planes, sculpted cheekbones, defined jaw, tight edges, eyes slightly enlarged with hard lids and one specular dot. No ink outlines; edges come from value and colour change. Lighting is two-tone: one warm amber key, one hard cool teal rim in a clashing colour, graphic high-contrast shadows, no soft gradients. Palette muted and desaturated with a few saturated accents (teal, amber, violet). Background a loose matte painting with less detail than the figure; faint canvas grain in the flats. Stylized realism, not cartoon exaggeration; concept-art finish. Avoid: photorealism, smooth CG shading, soft focus, anime, cel-shading, lineart, blur, extra text.
