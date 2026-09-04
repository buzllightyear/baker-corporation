import { leads, coverage, fetchStatus } from '../kernel/leads';
import type { Episode, Text } from '../../content/types';
import type { Cmd, KernelResult, RunState } from '../kernel/model';
import type { ToolDef } from './registry';
import { parseArgs, toolResult } from './normalize';
import { WATSON_VOICE } from './voice';
import { scene } from '../kernel/kernel';
import { routeTo } from '../kernel/path';
import { T } from '../i18n/ui';
export interface Deps {
  getState: () => RunState; getEpisode: () => Episode; dispatch: (cmd: Cmd) => KernelResult; setBusy: (s: string | null) => void; lang: () => 'en' | 'ko'; onRead?: () => void;
  /** Watson's visible presence: one short line per tool call, shown on the stage ticker and used to pulse the hotspot he is looking at. Optional — tools work without it. */
  pushTicker?: (t: { text: string; placeId?: string; targetId?: string }) => void;
}
const isText = (v: unknown): v is Text => !!v && typeof v === 'object' && !Array.isArray(v) && 'en' in (v as object) && 'ko' in (v as object) && typeof (v as Text).en === 'string';
/** Walks a tool response and replaces every {en,ko} with the current language's string — cards never leak as language objects. */
export function project(v: unknown, lang: 'en' | 'ko'): unknown {
  if (isText(v)) return v[lang];
  if (Array.isArray(v)) return v.map((x) => project(x, lang));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, project(x, lang)]));
  return v;
}
function run<T>(deps: Deps, raw: unknown, busy: string, toCmd: (a: T) => Cmd, tick?: (a: T) => void): Promise<unknown> {
  let args: T;
  try { args = parseArgs<T>(raw); } catch { return Promise.resolve(toolResult({ ok: false, code: 'INVALID_ARGS', message: 'arguments must be a JSON object' })); }
  deps.setBusy(busy);
  tick?.(args);
  const r = deps.dispatch(toCmd(args));
  const ep = deps.getEpisode(); const s = deps.getState();
  const clock = { clock: ep.clockLabel(s.clock), minutesElapsed: s.clock };
  if (!r.ok) return Promise.resolve(toolResult({ ok: false, code: r.code, message: r.message, ...clock }));
  return Promise.resolve(toolResult({ ok: true, ...(project(r.result, deps.lang()) as Record<string, unknown>), ...clock }));
}
const S = (props: Record<string, unknown>, required: string[]) => ({ type: 'object', properties: props, required, additionalProperties: false });
export function watsonTools(deps: Deps): ToolDef[] {
  const ro = { readOnlyHint: true };
  // — Watson's ticker voice. Every line is one call, in the investigator's current language.
  const L = () => deps.lang();
  const nm = (t: Text | undefined, fallback: string) => (t ? t[L()] : fallback);
  const personName = (id: string) => nm(deps.getEpisode().people.find((p) => p.id === id)?.name, id);
  const topicName = (id: string) => nm(deps.getEpisode().topics.find((t) => t.id === id)?.label, id);
  const evidenceName = (id: string) => nm(deps.getEpisode().evidence.find((e) => e.id === id)?.name, id);
  const placeName = (id: string) => nm(deps.getEpisode().places.find((p) => p.id === id)?.name, id);
  const who = () => `\u25b2 ${T.watson[L()].toUpperCase()}`;
  const tick = (text: string, at: { placeId?: string; targetId?: string } = {}) => deps.pushTicker?.({ text, ...at });
  const act = (verb: string, detail?: string, at: { placeId?: string; targetId?: string } = {}) => tick(`${who()} \u00b7 ${verb}${detail ? ` ${detail}` : ''}`, at);
  return [
    { name: 'get_case', description: 'Read-only. Call this FIRST every turn. Returns the case brief, the ship clock and minutes elapsed (there is no deadline and no penalty; the time taken is simply shown on the recap), where the investigator and you (Watson) are, everything on the shared notebook (cards with who found them and when), pinned notes, accusations left, `leads` (per person: topics unheard, whether cross-checked, where they are now; per room: unvisited, items unexamined, topics unheard — counts only, so you can answer "where should I look?" with a place), `coverage` (how many provable propositions the notebook already covers) and `status` (`more_to_fetch` | `nothing_left_to_fetch`), the scene where you stand (people present with their topics, evidence in reach), the map, the list of people and methods, and your standing orders (voice). Nothing here reveals the truth; the page holds it.', inputSchema: S({}, []), annotations: ro,
      execute: async () => { const ep = deps.getEpisode(), s = deps.getState(), lang = deps.lang(); deps.onRead?.();
        act(T.wtReading[lang], undefined, { placeId: s.pos.watson });
        return toolResult(project({ ok: true, episode: { id: ep.id, title: ep.title, series: ep.series, brief: ep.brief }, clock: ep.clockLabel(s.clock), minutesElapsed: s.clock, verdict: s.verdict,
          positions: s.pos, accusationsLeft: s.accusationsLeft, watsonCalls: s.watsonCalls, cards: s.cards, pins: s.pins, here: scene(ep, s, s.pos.watson),
          leads: leads(ep, s), coverage: coverage(ep, s), status: fetchStatus(ep, s),
          map: ep.places.map((p) => ({ id: p.id, name: p.name, adjacent: p.adjacent })), people: ep.people.map((p) => ({ id: p.id, name: p.name, role: p.role })), methods: ep.methods, voice: WATSON_VOICE }, lang) as Record<string, unknown>); } },
    { name: 'move', description: 'Walk to any room (free — walking costs no ship time; a distant room is reached through the connecting corridors automatically). Returns the scene there: people present and their topics, evidence in reach, plus the route taken.', inputSchema: S({ place_id: { type: 'string' } }, ['place_id']),
      execute: async (raw) => {
        let args: { place_id: string }; try { args = parseArgs<{ place_id: string }>(raw); } catch { return toolResult({ ok: false, code: 'INVALID_ARGS', message: 'arguments must be a JSON object' }); }
        const ep = deps.getEpisode(); const from = deps.getState().pos.watson; const path = routeTo(ep, from, args.place_id);
        if (!path) return toolResult({ ok: false, code: 'UNKNOWN_ID', message: `No route from ${from} to ${args.place_id}. Rooms: ${ep.places.map((p) => p.id).join(', ')}.` });
        if (path.length === 0) return toolResult({ ok: true, ...(project(scene(ep, deps.getState(), from), deps.lang()) as Record<string, unknown>), route: [], note: 'Already there.' });
        deps.setBusy('moving');
        tick(`${who()} \u2192 ${path.map(placeName).join(' \u2192 ')}`, { placeId: args.place_id });
        let last: KernelResult | null = null;
        for (const step of path) { last = deps.dispatch({ kind: 'move', placeId: step }); if (!last.ok) break; }
        const s = deps.getState(); const clock = { clock: ep.clockLabel(s.clock), minutesElapsed: s.clock };
        if (!last || !last.ok) return toolResult({ ok: false, code: last ? last.code : 'INVALID_ARGS', message: last ? last.message : 'no move', ...clock });
        return toolResult({ ok: true, ...(project(last.result, deps.lang()) as Record<string, unknown>), route: path, ...clock });
      } },
    { name: 'talk', description: 'Ask a person in your room about one of their listed topics (5 min). Returns their statement as a notebook card. Relay it in their voice; the card is all they said.', inputSchema: S({ person_id: { type: 'string' }, topic_id: { type: 'string' } }, ['person_id', 'topic_id']),
      execute: (raw) => run<{ person_id: string; topic_id: string }>(deps, raw, 'talking', (a) => ({ kind: 'talk', personId: a.person_id, topicId: a.topic_id }),
        (a) => act(T.wtAsking[L()], `${personName(a.person_id)}: ${topicName(a.topic_id)}`, { targetId: a.person_id, placeId: deps.getState().pos.watson })) },
    { name: 'ask', description: 'Ask a person in your room a free question (5 min). Write the question in ENGLISH keywords even if the investigator spoke another language. The page finds what that person is able to say about it; if it returns unknown, they have nothing on that — say so in character, never invent.', inputSchema: S({ person_id: { type: 'string' }, question: { type: 'string', minLength: 2, maxLength: 200 } }, ['person_id', 'question']),
      execute: (raw) => run<{ person_id: string; question: string }>(deps, raw, 'asking', (a) => ({ kind: 'ask', personId: a.person_id, question: a.question }),
        (a) => act(T.wtAsking[L()], `${personName(a.person_id)}: \u201c${a.question}\u201d`, { targetId: a.person_id, placeId: deps.getState().pos.watson })) },
    { name: 'examine', description: 'Examine a piece of evidence in your room (5 min). Some evidence reveals more once a related statement is on the notebook — re-examining is allowed.', inputSchema: S({ evidence_id: { type: 'string' } }, ['evidence_id']),
      execute: (raw) => run<{ evidence_id: string }>(deps, raw, 'examining', (a) => ({ kind: 'examine', evidenceId: a.evidence_id }),
        (a) => act(T.wtExamining[L()], evidenceName(a.evidence_id), { targetId: a.evidence_id, placeId: deps.getState().pos.watson })) },
    { name: 'pin', description: 'Attach a short note to a notebook card (free). Use it to mark what you find odd — the investigator reads these on the page.', inputSchema: S({ card_id: { type: 'string' }, note: { type: 'string', maxLength: 200 } }, ['card_id', 'note']),
      execute: (raw) => run<{ card_id: string; note: string }>(deps, raw, 'pinning', (a) => ({ kind: 'pin', cardId: a.card_id, note: a.note }),
        () => act(T.wtPinning[L()])) },
    { name: 'timeline', description: 'Watson only (10 min). Rebuilds where each person was, from the cards on the notebook, and lists the gaps nobody has covered yet. Cards not on the notebook do not exist to this tool. Omit person_id for everyone.', inputSchema: S({ person_id: { type: 'string' } }, []),
      execute: (raw) => run<{ person_id?: string }>(deps, raw, 'rebuilding timeline', (a) => ({ kind: 'timeline', personId: a.person_id }),
        (a) => act(T.wtTimeline[L()], a.person_id ? personName(a.person_id) : undefined, { targetId: a.person_id })) },
    { name: 'cross_check', description: 'Watson only (20 min). Compares every card about one person and returns MECHANICAL time/place collisions only — two cards that cannot both be true. It never says which is false, and a collision is not guilt. Motive, temperature, psychology are yours to reason about, and you may be wrong.', inputSchema: S({ person_id: { type: 'string' } }, ['person_id']),
      execute: (raw) => run<{ person_id: string }>(deps, raw, 'cross-checking', (a) => ({ kind: 'cross_check', personId: a.person_id }),
        (a) => act(T.wtCrossChecking[L()], personName(a.person_id), { targetId: a.person_id })) },
    { name: 'search_records', description: 'Watson only (30 min — expensive). Searches ship logs and personal messages by ENGLISH keywords without moving. Hits become notebook cards.', inputSchema: S({ query: { type: 'string', minLength: 2, maxLength: 120 } }, ['query']),
      execute: (raw) => run<{ query: string }>(deps, raw, 'searching records', (a) => ({ kind: 'search_records', query: a.query }),
        (a) => act(T.wtSearching[L()], `\u201c${a.query}\u201d`)) },
    { name: 'submit_theory', description: 'Watson only (free). The preliminary hearing. Submit your theory as claims, each with the notebook card ids that support it. The page grades each claim: proven / unsupported (with what is missing) / contradicted / unmatched. It never reveals the truth — a fully proven theory can still accuse the wrong person. Use it before the investigator accuses; the accusation itself is theirs, on the page.', inputSchema: S({ claims: { type: 'array', minItems: 1, maxItems: 8, items: S({ claim: { type: 'string', maxLength: 200 }, evidence_ids: { type: 'array', items: { type: 'string' }, maxItems: 10 } }, ['claim', 'evidence_ids']) } }, ['claims']),
      execute: (raw) => run<{ claims: { claim: string; evidence_ids: string[] }[] }>(deps, raw, 'preparing the hearing', (a) => ({ kind: 'submit_theory', claims: a.claims }),
        () => act(T.wtHearing[L()])) },
  ];
}
