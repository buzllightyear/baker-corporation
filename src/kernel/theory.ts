import type { Episode, Proposition } from '../../content/types';
import type { Cmd, KernelResult, RunState } from './model';
import { tokenize } from './matching';
import { proofEligible } from './kernel';
export function matchProposition(ep: Episode, claim: string): Proposition | null {
  const direct = ep.propositions.find((p) => p.id === claim.trim()); if (direct) return direct;
  const words = new Set(tokenize(claim)); let best: Proposition | null = null, bestScore = 1;
  for (const p of ep.propositions) { const score = tokenize(p.text.en).filter((w) => words.has(w)).length; if (score > bestScore) { best = p; bestScore = score; } }
  return best;
}
export function runTheory(ep: Episode, s: RunState, cmd: Extract<Cmd, { kind: 'submit_theory' }>): KernelResult {
  const onBoard = new Set(s.cards.filter((c) => proofEligible(s, c.id)).map((c) => c.id));
  const verdicts = cmd.claims.map(({ claim, evidence_ids }) => {
    const p = matchProposition(ep, claim);
    if (!p) return { claim, propositionId: null, status: 'unmatched' as const, note: 'No proposition in this case matches that claim. Rephrase closer to what the cards say, or cite a proposition id.' };
    const cited = evidence_ids.filter((id) => onBoard.has(id));
    if (p.refutedBy.some((id) => cited.includes(id))) return { claim, propositionId: p.id, status: 'contradicted' as const };
    // `missing` names only cards ALREADY on the notebook that were not cited ("you hold it, cite it"). Cards not yet
    // found are reported as a count — naming them would turn the hearing into an oracle for the next answer card.
    let missing: string[] | undefined; let stillToFind = 0;
    for (const set of p.provedBy) { const miss = set.filter((id) => !cited.includes(id)); if (miss.length === 0) return { claim, propositionId: p.id, status: 'proven' as const }; if (!missing || miss.length < missing.length) { missing = miss.filter((id) => onBoard.has(id)); stillToFind = miss.length - missing.length; } }
    return { claim, propositionId: p.id, status: 'unsupported' as const, missing: missing ?? [], stillToFind };
  });
  return { ok: true, state: s, result: { verdicts, note: 'This grades the logic of the theory, never the truth. Proven claims can still point at the wrong person.' } };
}
