import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { useWebmcpStatus } from '../webmcp/useWebmcp';
export function TopBar({ onAccuse }: { onAccuse: () => void }) {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!;
  const { lang, set } = useLang(); const { available, count } = useWebmcpStatus();
  const left = Math.max(0, ep.budgetMinutes - st.clock);
  const closed = st.clock >= ep.budgetMinutes;
  return (
    <>
      <header className="topbar">
        <div className="title">{pick(ep.series, lang)}<small>{pick(ep.title, lang)}</small></div>
        <div className="clock" title={T.clock[lang]}>{ep.clockLabel(st.clock)} · {T.docking[lang]} {Math.floor(left / 60)}h {String(left % 60).padStart(2, '0')}m</div>
        <div className="badge" title={T.accusationsLeft[lang]}>{st.accusationsLeft} {T.accusationsLeft[lang]}</div>
        <div className={'badge' + (available && count > 0 ? ' on' : '')} title="WebMCP">● {count} {T.siteTools[lang]}</div>
        <div className="spacer" />
        <button onClick={() => set(lang === 'en' ? 'ko' : 'en')} aria-label="language">{lang === 'en' ? '한국어' : 'English'}</button>
        <button className="accuse" onClick={onAccuse} disabled={st.verdict !== null}>{T.accuse[lang]}</button>
      </header>
      {closed && st.verdict === null && <div className="banner closed">{T.closedBanner[lang]}</div>}
    </>
  );
}
