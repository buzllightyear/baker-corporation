import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { recapOf } from '../kernel/recap';
import { encodeRecap } from '../share/recap';
export function VerdictView() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const lang = useLang((s) => s.lang);
  if (!st.verdict) return null;
  const goRecap = () => { const r = recapOf(ep, st); location.hash = `#/recap/${encodeRecap({ episodeId: ep.id, timeLeft: r.timeLeft, watsonCalls: r.watsonCalls, accusations: r.accusations, verdict: r.verdict, visited: r.visited, unvisited: r.unvisited, order: r.order })}`; };
  return (
    <div className="dialog-bg">
      <div className="dialog verdict">
        <h2>{st.verdict === 'solved' ? T.solved[lang] : T.failed[lang]}</h2>
        {st.verdict === 'solved' && (<><div className="reveal">{pick(ep.truth.reveal, lang)}</div><div>{pick(ep.truth.motive, lang)}</div><div className="hook">{pick(ep.truth.hook, lang)}</div></>)}
        <div className="row"><button onClick={goRecap}>{T.recap[lang]} →</button></div>
      </div>
    </div>
  );
}
