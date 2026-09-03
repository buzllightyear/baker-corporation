import type { Episode, Evidence, Record_, Statement, Place } from '../../content/types';
import type { Actor, Card } from './model';
const person = (ep: Episode, id: string) => ep.people.find((p) => p.id === id)!;
const topic = (ep: Episode, id: string) => ep.topics.find((t) => t.id === id)!;
export function cardFromStatement(st: Statement, ep: Episode, by: Actor, at: number): Card {
  const p = person(ep, st.personId), t = topic(ep, st.topicId);
  return { id: st.id, kind: 'statement', title: { en: `${p.name.en} — ${t.label.en}`, ko: `${p.name.ko} — ${t.label.ko}` }, body: st.text, foundBy: by, foundAt: at, personId: st.personId, topicId: st.topicId, asserts: st.asserts };
}
export function cardFromEvidence(ev: Evidence, ep: Episode, by: Actor, at: number, unlocked: boolean): Card {
  const body = unlocked && ev.fullDescription ? ev.fullDescription : ev.description;
  return { id: ev.id, kind: 'evidence', title: ev.name, body, foundBy: by, foundAt: at, placeId: ev.placeId, asserts: unlocked ? ev.asserts : undefined };
}
export function cardFromRecord(r: Record_, by: Actor, at: number): Card { return { id: r.id, kind: 'record', title: r.title, body: r.body, foundBy: by, foundAt: at, asserts: r.asserts }; }
export function cardFromPlace(pl: Place, by: Actor, at: number): Card { return { id: `place:${pl.id}`, kind: 'place', title: pl.name, body: pl.description, foundBy: by, foundAt: at, placeId: pl.id }; }
