import type { Episode, TutorialStep, TutorialTrigger } from '../../content/types';
import type { Cmd, RunState } from '../kernel/model';
import { whoIsHere } from '../kernel/kernel';
import { routeTo } from '../kernel/path';
import { T, pick } from '../i18n/lang';
import type { Lang } from '../i18n/lang';
export const TUT_DONE_KEY = 'baker.tut.done';
export function tutorialDone(): boolean { try { return localStorage.getItem(TUT_DONE_KEY) === '1'; } catch { return false; } }
export function markTutorialDone(): void { try { localStorage.setItem(TUT_DONE_KEY, '1'); } catch {} }
export function satisfied(w: TutorialTrigger, s: RunState, watsonReads: number): boolean {
  if (w.kind === 'start') return true;
  if (w.kind === 'watson_read') return watsonReads > 0;
  if (w.kind === 'moved') return s.pos.holmes === w.placeId || s.log.some((l) => l.verb === 'move' && l.target === w.placeId);
  if (w.kind === 'card') return s.cards.some((c) => c.id === w.cardId);
  if (w.kind === 'theory') return s.log.some((l) => l.verb === 'submit_theory');
  if (w.kind === 'accused') return s.accusations.length > 0;
  return false;
}
export interface Guide { shown: TutorialStep; index: number; total: number; goal: TutorialTrigger | null; complete: boolean }
/** Linear: the shown step is the last one whose trigger holds (in order); the goal is the next step's trigger. */
export function guide(ep: Episode, s: RunState, watsonReads: number): Guide | null {
  const steps = ep.tutorial; if (!steps || steps.length === 0) return null;
  let k = 0; while (k + 1 < steps.length && satisfied(steps[k + 1].when, s, watsonReads)) k++;
  const goal = k + 1 < steps.length ? steps[k + 1].when : null;
  return { shown: steps[k], index: k, total: steps.length, goal, complete: goal === null };
}
/** Is this human action allowed while the tutorial's current goal is `goal`? */
export function allowed(ep: Episode, s: RunState, goal: TutorialTrigger | null, cmd: Cmd): boolean {
  if (!goal) return true;
  if (cmd.kind === 'pin' || cmd.kind === 'move') return true;   // walking is always free, even in the tutorial
  if (goal.kind === 'card') {
    const st = ep.statements.find((x) => x.id === goal.cardId);
    if (st) { const where = ep.presence.find((p) => p.personId === st.personId && s.clock >= p.from && s.clock < p.to)?.placeId; if (cmd.kind === 'talk') return cmd.personId === st.personId && cmd.topicId === st.topicId; return false; void where; }
    const ev = ep.evidence.find((x) => x.id === goal.cardId);
    if (ev) { if (cmd.kind === 'examine') return cmd.evidenceId === ev.id; return false; }
    return false;   // a record: Watson's job
  }
  if (goal.kind === 'accused') return cmd.kind === 'accuse';
  return false;   // watson_read, theory: Watson's turn
}
export function hint(ep: Episode, s: RunState, goal: TutorialTrigger | null, lang: Lang): string {
  if (!goal) return '';
  const room = (id: string) => pick(ep.places.find((p) => p.id === id)!.name, lang);
  if (goal.kind === 'moved') return `${T.tutGo[lang]} ${room(goal.placeId)}`;
  if (goal.kind === 'card') {
    const st = ep.statements.find((x) => x.id === goal.cardId);
    if (st) { const p = ep.people.find((x) => x.id === st.personId)!; const t = ep.topics.find((x) => x.id === st.topicId)!; const where = whoIsHere(ep, s, s.pos.holmes).some((x) => x.id === p.id) ? '' : ` (${room(ep.presence.find((q) => q.personId === p.id && s.clock >= q.from && s.clock < q.to)?.placeId ?? s.pos.holmes)})`; return `${T.tutTalk[lang]} ${pick(p.name, lang)} · ${pick(t.label, lang)}${where}`; }
    const ev = ep.evidence.find((x) => x.id === goal.cardId);
    if (ev) return `${T.tutExamine[lang]} ${pick(ev.name, lang)} (${room(ev.placeId)})`;
    return T.tutWatson[lang];
  }
  if (goal.kind === 'accused') return T.tutAccuse[lang];
  return T.tutWatson[lang];
}

/** What the screen should point at for the current tutorial goal: a room on the deck plan, the next exit to take, a person, a topic, an evidence marker. */
export function goalTargets(ep: Episode, s: RunState, watsonReads: number): { room?: string; nextRoom?: string; person?: string; topic?: string; evidence?: string } {
  if (!ep.tutorial || tutorialDone()) return {};
  const g = guide(ep, s, watsonReads); if (!g || g.complete || !g.goal) return {};
  const goal = g.goal; let room: string | undefined; const out: { room?: string; nextRoom?: string; person?: string; topic?: string; evidence?: string } = {};
  if (goal.kind === 'moved') room = goal.placeId;
  else if (goal.kind === 'card') {
    const st = ep.statements.find((x) => x.id === goal.cardId);
    if (st) { room = ep.presence.find((p) => p.personId === st.personId && s.clock >= p.from && s.clock < p.to)?.placeId; out.person = st.personId; out.topic = st.topicId; }
    const ev = ep.evidence.find((x) => x.id === goal.cardId); if (ev) { room = ev.placeId; out.evidence = ev.id; }
  }
  if (room && room !== s.pos.holmes) { out.room = room; const r = routeTo(ep, s.pos.holmes, room); if (r && r.length) out.nextRoom = r[0]; }
  return out;
}
