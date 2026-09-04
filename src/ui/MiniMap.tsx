import React from 'react';
import { useGame } from '../state/store';
import { whoIsHere } from '../kernel/kernel';
import { leads, fetchStatus } from '../kernel/leads';
import { PORTRAIT } from '../../content/art';
import { routeTo } from '../kernel/path';
import { useLang, T, pick } from '../i18n/lang';
import { useToast } from './useToast';
import { useGuard } from './useGuard';
import { goalTargets } from './tutorial';
import './stage-fx.css';
const WALK_MS = 600;
const BUSY: Record<string, { en: string; ko: string }> = { moving: { en: 'moving', ko: '이동 중' }, talking: { en: 'talking', ko: '대화 중' }, asking: { en: 'asking', ko: '질문 중' }, examining: { en: 'examining', ko: '조사 중' }, pinning: { en: 'pinning', ko: '메모 중' }, 'rebuilding timeline': { en: 'rebuilding timeline', ko: '시간표 재구성 중' }, 'preparing the hearing': { en: 'preparing the hearing', ko: '예비 심리 준비 중' }, 'searching records': { en: 'searching records', ko: '기록 검색 중' } };
export function MiniMap() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGuard(); const busy = useGame((s) => s.watsonBusy);
  const lang = useLang((s) => s.lang); const [toast, show] = useToast();
  const here = ep.places.find((p) => p.id === st.pos.holmes)!;
  const reads = useGame((s) => s.watsonReads); const goal = goalTargets(ep, st, reads);
  const visited = new Set(st.cards.filter((c) => c.kind === 'place').map((c) => c.placeId));
  const L = leads(ep, st);
  const done = fetchStatus(ep, st) === 'nothing_left_to_fetch';
  const roomLead = (id: string) => { const r = L.rooms.find((x) => x.placeId === id); return !!r && (r.unvisited || r.unexamined > 0 || r.unheard > 0); };
  // Watson walked: ping the room he arrived in and slide his token into it, so his moves are visible even when nobody is reading the log.
  const watsonAt = st.pos.watson;
  const [walking, setWalking] = React.useState(false);
  const wasAt = React.useRef(watsonAt);
  React.useEffect(() => {
    if (wasAt.current === watsonAt) return;
    wasAt.current = watsonAt; setWalking(true);
    const t = setTimeout(() => setWalking(false), WALK_MS);
    return () => clearTimeout(t);
  }, [watsonAt]);
  return (
    <div className="minimap">
      <div className="mm-title">{T.map[lang]}</div>
      <div className="mm-grid">
        {ep.places.map((p) => { const people = whoIsHere(ep, st, p.id); const cls = ['room', p.id === here.id ? 'here' : '', here.adjacent.includes(p.id) ? 'adjacent' : '', visited.has(p.id) || p.id === ep.startPlaceId ? 'visited' : '', goal.room === p.id ? 'goal' : '', walking && p.id === watsonAt ? 'watson-dest' : '', roomLead(p.id) ? 'lead' : ''].join(' ');
          return <button key={p.id} className={cls} aria-label={pick(p.name, lang)} onClick={() => { if (p.id === here.id) return; const path = routeTo(ep, here.id, p.id); if (!path) { show('No route.'); return; } for (const step of path) { const r = dispatch({ kind: 'move', placeId: step }); if (!r.ok) { show(r.message); return; } } }}>
            <span className="name">{pick(p.name, lang)}</span>{roomLead(p.id) && <span className="lead-dot" title={T.moreHere[lang]} aria-label={T.moreHere[lang]}>◦</span>}
            <span className="tokens">{st.pos.holmes === p.id && <span className="tok holmes" title="Holmes" aria-label="Holmes"><i /></span>}{st.pos.watson === p.id && <span className={'tok watson' + (walking ? ' walking' : '')} title="Watson" aria-label="Watson"><img src={PORTRAIT.watson} alt="" /></span>}{people.map((x) => <span key={x.id} className="tok crew" title={pick(x.name, lang)}>{PORTRAIT[x.id] ? <img src={PORTRAIT[x.id]} alt="" /> : <b>{pick(x.name, lang).slice(0, 1)}</b>}</span>)}</span>
          </button>; })}
      </div>
      <div className={'watson-status' + (done ? ' done' : '')}>▲ {busy ? `${T.watson[lang]}: ${BUSY[busy]?.[lang] ?? busy}` : done ? `${T.watson[lang]}: ${T.nothingLeftShort[lang]}` : T.watsonIdle[lang]}</div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
