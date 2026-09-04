import { useGame } from '../state/store';
import { useLang, T } from '../i18n/lang';
import { fetchStatus } from '../kernel/leads';
/** The four stages of a case, as in the approved UI mockups: Investigation → Hypothesis → Deduction → Result.
 *  Derived from state, never stored: a hearing moves to Hypothesis, coverage moves to Deduction, a verdict is the Result. */
export function stageIndex(hasHearing: boolean, ready: boolean, verdict: string | null): number {
  if (verdict) return 3;
  if (ready) return 2;
  if (hasHearing) return 1;
  return 0;
}
export function StageStrip() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const hearing = useGame((s) => s.lastHearing); const lang = useLang((s) => s.lang);
  const idx = stageIndex(!!hearing || st.log.some((l) => l.verb === 'submit_theory'), fetchStatus(ep, st) === 'nothing_left_to_fetch', st.verdict);
  const labels = [T.stageInvestigation, T.stageHypothesis, T.stageDeduction, T.stageResult];
  return (
    <div className="stage-strip" aria-label={T.stageStrip[lang]}>
      {labels.map((l, i) => <span key={i} className={i === idx ? 'on' : i < idx ? 'done' : ''}>{l[lang]}</span>)}
    </div>
  );
}
