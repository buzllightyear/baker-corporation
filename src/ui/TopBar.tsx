import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { useWebmcpStatus } from '../webmcp/useWebmcp';
import { guide, tutorialDone } from './tutorial';
export function TopBar({ onAccuse, onCaseFile, onCrew }: { onAccuse: () => void; onCaseFile?: () => void; onCrew?: () => void }) {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!;
  const { lang, set } = useLang(); const { available, count } = useWebmcpStatus();
  const reads = useGame((s) => s.watsonReads); const g = ep.tutorial && !tutorialDone() ? guide(ep, st, reads) : null; const accuseLocked = !!g && !g.complete && g.goal?.kind !== 'accused';
  const nbOpen = useGame((s) => s.notebookOpen); const toggleNb = useGame((s) => s.toggleNotebook); const nCards = st.cards.filter((c) => c.kind !== 'place').length;
  const used = st.clock;
  return (
    <>
      <header className="topbar">
        <div className="title">{pick(ep.series, lang)}<small>{pick(ep.title, lang)}</small></div>
        <div className="clock" title={T.clock[lang]}>{ep.clockLabel(st.clock)} · {T.elapsed[lang]} {Math.floor(used / 60)}h {String(used % 60).padStart(2, '0')}m</div>
        <div className="badge" title={T.accusationsLeft[lang]}>{st.accusationsLeft} {T.accusationsLeft[lang]}</div>
        <div className={'badge' + (available && count > 0 ? ' on' : '')} title="WebMCP">● {count} {T.siteTools[lang]}</div>
        <div className="spacer" />
        {onCaseFile && <button onClick={onCaseFile} aria-label="case file">{T.caseFile[lang]}</button>}
        {onCrew && <button onClick={onCrew} aria-label="crew">{T.crew[lang]}</button>}
        <button className={'nb-toggle' + (nbOpen ? ' on' : '')} onClick={toggleNb} aria-label="notebook">{nbOpen ? '▸' : '◂'} {T.notebook[lang]} · {nCards}</button>
        <button onClick={() => set(lang === 'en' ? 'ko' : 'en')} aria-label="language">{lang === 'en' ? '한국어' : 'English'}</button>
        <button className="accuse" onClick={onAccuse} disabled={st.verdict !== null || accuseLocked} title={accuseLocked ? T.tutAccuse[lang] : undefined}>{T.accuse[lang]}</button>
      </header>
    </>
  );
}
