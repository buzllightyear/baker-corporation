import type { Episode } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';
export function runAccuse(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'accuse' }>): KernelResult {
  if (s.verdict === 'solved') return { ok: false, code: 'CASE_CLOSED', message: 'The case is over.' };
  if (s.accusationsLeft <= 0) return { ok: false, code: 'NO_ACCUSATIONS_LEFT', message: 'No accusations left.' };
  const okIds = ep.people.some((p) => p.id === cmd.who) && ep.methods.some((m) => m.id === cmd.how) && ep.evidence.some((e) => e.id === cmd.evidence);
  if (!okIds) return { ok: false, code: 'INVALID_ARGS', message: 'who must be a person id, how a method id, evidence an evidence id.' };
  const result = { who: cmd.who === ep.truth.culpritId, how: cmd.how === ep.truth.methodId, evidence: cmd.evidence === ep.truth.decisiveEvidenceId };
  const solved = result.who && result.how && result.evidence;
  const left = s.accusationsLeft - 1;
  const state: RunState = { ...s, accusationsLeft: left, accusations: [...s.accusations, { ...cmd, at: s.clock, result }], verdict: solved ? 'solved' : left === 0 ? 'failed' : null,
    log: [...s.log, { actor: 'holmes', verb: 'accuse', at: s.clock, target: cmd.who }] };
  // The failed branch says only HOW MANY parts contradict the scene, never which (Golden Idol's coarse tier):
  // with two tries a per-slot verdict is a brute-force oracle. Per-slot truth stays in state for the recap.
  const mismatches = [result.who, result.how, result.evidence].filter((x) => !x).length;
  return { ok: true, state, result: solved ? { verdict: 'solved', reveal: ep.truth.reveal, motive: ep.truth.motive, hook: ep.truth.hook } : { verdict: state.verdict, mismatches, accusationsLeft: left } };
}
