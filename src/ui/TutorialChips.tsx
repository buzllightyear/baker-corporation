import React from 'react';
import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { guide, markTutorialDone, tutorialDone } from './tutorial';
export function TutorialChips() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const reads = useGame((s) => s.watsonReads); const lang = useLang((s) => s.lang); const nbOpen = useGame((s) => s.notebookOpen);
  const [copied, setCopied] = React.useState(false);
  const g = ep.tutorial ? guide(ep, st, reads) : null;
  React.useEffect(() => { if (g?.complete && st.verdict) markTutorialDone(); }, [g?.complete, st.verdict]);
  if (!g || tutorialDone() && g.complete) return null;
  if (st.verdict) return null;
  const step = g.shown;
  const copy = async () => { if (!step.chip) return; try { await navigator.clipboard.writeText(pick(step.chip, lang)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div className="tut" style={nbOpen ? undefined : { right: 14 }}>
      <div className="label">Tutorial · {g.index + 1}/{g.total}</div>
      <p className="say">{pick(step.say, lang)}</p>
      {step.chip && <div className="chipline"><span className="label">{T.sayToWatson[lang]}</span><button onClick={copy} title="copy">{copied ? T.copied[lang] : pick(step.chip, lang)}</button></div>}
    </div>
  );
}
