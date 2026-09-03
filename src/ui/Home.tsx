import { listEpisodes, useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
export function Home() {
  const lang = useLang((s) => s.lang); const { set } = useLang(); const start = useGame((s) => s.startEpisode); const running = useGame((s) => s.state);
  const eps = listEpisodes();
  return (
    <div className="center">
      <div className="row" style={{ justifyContent: 'flex-end' }}><button onClick={() => set(lang === 'en' ? 'ko' : 'en')}>{lang === 'en' ? '한국어' : 'English'}</button></div>
      <h1>The Baker Corporation</h1>
      <p className="thesis">{lang === 'en' ? 'The agent writes the story. The website puts it on trial.' : '에이전트는 이야기를 쓰고, 웹사이트는 그 이야기를 재판한다.'}</p>
      <p>{lang === 'en' ? 'You are the investigator. Watson — a Baker Corporation service unit — is the agent you already use. Open this page inside ChatGPT: Watson gets ten tools, and none of them can reach the truth. The page holds it.' : '당신은 조사관입니다. 왓슨은 베이커 사가 만든 로봇이고, 당신이 이미 쓰는 에이전트가 그 몸에 들어갑니다. 이 페이지를 ChatGPT 안에서 열면 왓슨은 도구 열 개를 받지만, 어느 도구도 진실에 닿지 못합니다. 진실은 페이지가 쥡니다.'}</p>
      {running && <button className="epcard" onClick={() => { location.hash = '#/play'; }}><span className="k">{lang === 'en' ? 'Continue' : '이어하기'}</span><span className="t">{pick(useGame.getState().episode!.title, lang)}</span></button>}
      {eps.map((e, i) => (
        <button key={e.id} className="epcard" onClick={() => { start(e.id); location.hash = '#/play'; }}>
          <span className="k">{T.episode[lang]} {i} · {e.places.length} rooms · {e.people.length} people · {Math.floor(e.budgetMinutes / 60)}h</span>
          <span className="t">{pick(e.title, lang)}</span>
          <span>{pick(e.brief, lang)}</span>
          <span className="k">{T.play[lang]} →</span>
        </button>
      ))}
    </div>
  );
}
