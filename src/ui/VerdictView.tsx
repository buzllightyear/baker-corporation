import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { recapOf } from '../kernel/recap';
import { encodeRecap } from '../share/recap';
import { Tag, serialOf } from './chrome/Frame';
import { Logo } from './chrome/Logo';
export function VerdictView() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const lang = useLang((s) => s.lang);
  if (!st.verdict) return null;
  const solved = st.verdict === 'solved';
  const goRecap = () => { const r = recapOf(ep, st); location.hash = `#/recap/${encodeRecap({ episodeId: ep.id, timeUsed: r.timeUsed, watsonCalls: r.watsonCalls, accusations: r.accusations, verdict: r.verdict, visited: r.visited, unvisited: r.unvisited, order: r.order })}`; };
  return (
    <div className="dialog-bg">
      <div className={'dialog frame ' + (solved ? 'verdict-solved' : 'verdict-failed')}>
        {!solved && <div className="hazard-strip thin" aria-hidden="true" />}
        <Tag serial={serialOf(ep.id + ':verdict:' + st.verdict, 'VRD')} />
        <div className="dialog-body verdict-body">
          <h2><Logo /> {solved ? T.solved[lang] : T.failed[lang]}</h2>
          {solved ? (
            <>
              <div className="reveal">{pick(ep.truth.reveal, lang)}</div>
              <div className="motive">{pick(ep.truth.motive, lang)}</div>
              <div className="hook">{pick(ep.truth.hook, lang)}</div>
            </>
          ) : (
            <div className="verdict-seal"><span className="stamp sealed">Sealed</span></div>
          )}
          <div className="row"><button onClick={goRecap}>{T.recap[lang]} →</button></div>
        </div>
      </div>
    </div>
  );
}
