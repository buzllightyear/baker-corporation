// src/kernel/validate.ts
import type { Episode } from '../../content/types';
import { COST } from './clock';
export function validateCase(ep: Episode): { ok: boolean; problems: string[] } {
  const P: string[] = [];
  const ids = new Set<string>([...ep.places, ...ep.people, ...ep.statements, ...ep.evidence, ...ep.records, ...ep.topics, ...ep.methods, ...ep.propositions].map((x) => x.id));
  const need = (id: string, where: string) => { if (!ids.has(id)) P.push(`REF ${where}: ${id} does not exist`); };
  ep.places.forEach((pl) => pl.adjacent.forEach((a) => need(a, `place ${pl.id}.adjacent`)));
  ep.presence.forEach((p) => { need(p.personId, 'presence'); need(p.placeId, 'presence'); });
  ep.statements.forEach((s) => { need(s.personId, s.id); need(s.topicId, s.id); (s.refutedBy ?? []).forEach((r) => need(r, `${s.id}.refutedBy`)); });
  ep.evidence.forEach((e) => { need(e.placeId, e.id); if (e.requiresCard) need(e.requiresCard, `${e.id}.requiresCard`); });
  ep.propositions.forEach((p) => { p.provedBy.flat().forEach((id) => need(id, `${p.id}.provedBy`)); p.refutedBy.forEach((id) => need(id, `${p.id}.refutedBy`)); });
  need(ep.truth.culpritId, 'truth'); need(ep.truth.methodId, 'truth'); need(ep.truth.decisiveEvidenceId, 'truth'); need(ep.startPlaceId, 'start'); need(ep.watsonStartPlaceId, 'watsonStart');
  // R1 one truth: exactly one person/method/evidence — structurally guaranteed; check that no proposition names another person as culprit with a non-empty provedBy
  const culpritProps = ep.propositions.filter((p) => /took|killed|culprit|did it|murder/i.test(p.text.en) && p.provedBy.length > 0);
  if (culpritProps.length > 1) P.push(`R1 more than one provable culprit-proposition: ${culpritProps.map((p) => p.id).join(', ')}`);
  // R2 liars ≥3 with distinct reasons → approximated: ≥3 distinct people with a lie:true statement
  const liars = new Set(ep.statements.filter((s) => s.lie).map((s) => s.personId));
  if (liars.size < 3) P.push(`R2 only ${liars.size} liar(s); need ≥3`);
  if (!liars.has(ep.truth.culpritId)) P.push('R2 the culprit never lies');
  // R3 decisive evidence must be gated by a statement card
  const dec = ep.evidence.find((e) => e.id === ep.truth.decisiveEvidenceId);
  if (dec && !dec.requiresCard) P.push(`R3 decisive evidence ${dec.id} has no requiresCard gate`);
  // R4 clock dependence
  const timed = ep.statements.some((s) => s.availableFrom !== undefined || s.availableTo !== undefined) || ep.evidence.some((e) => e.availableFrom !== undefined || e.availableTo !== undefined) || ep.presence.some((p) => p.from > 0 || p.to < ep.budgetMinutes);
  if (!timed) P.push('R4 nothing depends on the clock');
  // R5 a record is load-bearing
  const recordIds = new Set(ep.records.map((r) => r.id));
  const recordUsed = ep.propositions.some((p) => p.provedBy.some((set) => set.some((id) => recordIds.has(id))) || p.refutedBy.some((id) => recordIds.has(id)));
  if (!recordUsed) P.push('R5 no record participates in any proposition');
  // R6 loudest liar ≠ culprit
  const lieCount = new Map<string, number>(); ep.statements.forEach((s) => { if (s.lie) lieCount.set(s.personId, (lieCount.get(s.personId) ?? 0) + 1); });
  const loudest = [...lieCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (loudest && loudest[0] === ep.truth.culpritId) P.push(`R6 loudest liar ${loudest[0]} is the culprit`);
  // R7 exhaustive time ≥ 1.6 × budget
  const exhaustive = ep.statements.length * COST.talk + ep.evidence.length * COST.examine + ep.places.length * COST.move * 2 + ep.people.length * COST.cross_check + COST.search_records * 3;
  if (exhaustive < ep.budgetMinutes * 1.6) P.push(`R7 exhaustive ${exhaustive} min < 1.6 × budget ${ep.budgetMinutes}`);
  return { ok: P.length === 0, problems: P };
}
