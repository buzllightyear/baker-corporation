import type { Episode, Evidence } from '../../content/types';
import type { Actor, Card, Cmd, ErrorCode, KernelResult, RunState } from './model';
import { advance, isClosed } from './clock';
import { cardFromEvidence, cardFromPlace, cardFromStatement } from './redact';
import { runAsk, runSearchRecords } from './matching';
import { runCrossCheck, runTimeline } from './analysis';
import { runTheory } from './theory';
import { runAccuse } from './accuse';

const fail = (code: ErrorCode, message: string): KernelResult => ({ ok: false, code, message });
const within = (from: number | undefined, to: number | undefined, clock: number) => (from === undefined || clock >= from) && (to === undefined || clock < to);
export function whoIsHere(ep: Episode, s: RunState, placeId: string) {
  return ep.presence.filter((p) => p.placeId === placeId && s.clock >= p.from && s.clock < p.to).map((p) => ep.people.find((x) => x.id === p.personId)!);
}
export function whatIsHere(ep: Episode, s: RunState, placeId: string): Evidence[] { return ep.evidence.filter((e) => e.placeId === placeId && within(e.availableFrom, e.availableTo, s.clock)); }
export function addCard(s: RunState, card: Card): RunState {
  const i = s.cards.findIndex((c) => c.id === card.id);
  if (i < 0) return { ...s, cards: [...s.cards, card] };
  const prev = s.cards[i];
  const next = { ...prev, body: card.body, asserts: card.asserts ?? prev.asserts };   // 업그레이드는 본문만, 발견자·시각은 최초 유지
  return { ...s, cards: s.cards.map((c, j) => (j === i ? next : c)) };
}
const hasCard = (s: RunState, id: string) => s.cards.some((c) => c.id === id);
export function scene(ep: Episode, s: RunState, placeId: string) {
  const pl = ep.places.find((p) => p.id === placeId)!;
  return { place: { id: pl.id, name: pl.name, description: pl.description, adjacent: pl.adjacent },
    people: whoIsHere(ep, s, placeId).map((p) => ({ id: p.id, name: p.name, role: p.role, portrait: p.portrait, topics: ep.topics.filter((t) => ep.statements.some((st) => st.personId === p.id && st.topicId === t.id)).map((t) => ({ id: t.id, label: t.label })) })),
    evidence: whatIsHere(ep, s, placeId).map((e) => ({ id: e.id, name: e.name })) };
}
function logged(s: RunState, actor: Actor, verb: Cmd['kind'], target: string): RunState {
  const log = [...s.log, { actor, verb: verb as any, at: s.clock, target }];
  return actor === 'watson' && verb !== 'accuse' ? { ...s, log, watsonCalls: s.watsonCalls + 1 } : { ...s, log };
}
export function invoke(ep: Episode, s0: RunState, actor: Actor, cmd: Cmd): KernelResult {
  if (cmd.kind === 'accuse') return actor === 'holmes' ? runAccuse(ep, s0, cmd) : fail('HOLMES_ONLY', 'Only the investigator can accuse.');
  if (s0.verdict) return fail('CASE_CLOSED', 'The case is over.');
  if (isClosed(ep, s0) || s0.closed) return fail('CASE_CLOSED', 'Docking. Investigation is closed; only an accusation remains.');
  const watsonOnly: Cmd['kind'][] = ['timeline', 'cross_check', 'search_records', 'submit_theory'];
  if (actor === 'holmes' && watsonOnly.includes(cmd.kind)) return fail('WATSON_ONLY', `${cmd.kind} is Watson's.`);
  const target = 'placeId' in cmd ? cmd.placeId : 'personId' in cmd ? cmd.personId : 'evidenceId' in cmd ? cmd.evidenceId : 'cardId' in cmd ? cmd.cardId : undefined;
  let s = logged(s0, actor, cmd.kind, target ?? cmd.kind);
  switch (cmd.kind) {
    case 'move': {
      const here = ep.places.find((p) => p.id === s.pos[actor])!; const to = ep.places.find((p) => p.id === cmd.placeId);
      if (!to) return fail('UNKNOWN_ID', `No place ${cmd.placeId}.`);
      if (!here.adjacent.includes(to.id)) return fail('NOT_ADJACENT', `${here.id} does not connect to ${to.id}. Adjacent: ${here.adjacent.join(', ')}.`);
      s = advance({ ...s, pos: { ...s.pos, [actor]: to.id } }, 'move');
      s = addCard(s, cardFromPlace(to, actor, s.clock));
      return { ok: true, state: s, result: scene(ep, s, to.id) };
    }
    case 'examine': {
      const ev = ep.evidence.find((e) => e.id === cmd.evidenceId); if (!ev) return fail('UNKNOWN_ID', `No evidence ${cmd.evidenceId}.`);
      if (ev.placeId !== s.pos[actor]) return fail('NOT_HERE', `${ev.id} is in ${ev.placeId}; ${actor} is in ${s.pos[actor]}.`);
      if (!within(ev.availableFrom, ev.availableTo, s.clock)) return fail('NOT_NOW', `${ev.id} is not there right now.`);
      s = advance(s, 'examine');
      const card = cardFromEvidence(ev, ep, actor, s.clock, !ev.requiresCard || hasCard(s, ev.requiresCard));
      s = addCard(s, card);
      return { ok: true, state: s, result: { card: s.cards.find((c) => c.id === card.id) } };
    }
    case 'talk': {
      const st = ep.statements.find((x) => x.personId === cmd.personId && x.topicId === cmd.topicId);
      if (!ep.people.some((p) => p.id === cmd.personId) || !st) return fail('UNKNOWN_ID', `No statement for ${cmd.personId}/${cmd.topicId}.`);
      if (!whoIsHere(ep, s, s.pos[actor]).some((p) => p.id === cmd.personId)) return fail('NOT_HERE', `${cmd.personId} is not in ${s.pos[actor]} right now.`);
      if (!within(st.availableFrom, st.availableTo, s.clock)) return fail('NOT_NOW', `${cmd.personId} has nothing to say about that yet.`);
      s = advance(s, 'talk');
      s = addCard(s, cardFromStatement(st, ep, actor, s.clock));
      return { ok: true, state: s, result: { card: s.cards.find((c) => c.id === st.id) } };
    }
    case 'pin': {
      if (!hasCard(s, cmd.cardId)) return fail('UNKNOWN_ID', `No card ${cmd.cardId} on the board.`);
      s = { ...s, pins: [...s.pins, { cardId: cmd.cardId, note: cmd.note, at: s.clock }] };
      return { ok: true, state: s, result: { pins: s.pins.length } };
    }
    case 'ask': return runAsk(ep, s, actor, cmd);
    case 'search_records': return runSearchRecords(ep, s, actor, cmd);
    case 'timeline': return runTimeline(ep, s, cmd);
    case 'cross_check': return runCrossCheck(ep, s, cmd);
    case 'submit_theory': return runTheory(ep, s, cmd);
  }
}
