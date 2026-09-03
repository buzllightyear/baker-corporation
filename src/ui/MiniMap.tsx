import { useGame } from '../state/store';
import { whoIsHere } from '../kernel/kernel';
import { routeTo } from '../kernel/path';
import { useLang, T, pick } from '../i18n/lang';
import { useToast } from './useToast';
import { useGuard } from './useGuard';
export function MiniMap() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGuard(); const busy = useGame((s) => s.watsonBusy);
  const lang = useLang((s) => s.lang); const [toast, show] = useToast();
  const here = ep.places.find((p) => p.id === st.pos.holmes)!;
  const visited = new Set(st.cards.filter((c) => c.kind === 'place').map((c) => c.placeId));
  return (
    <div className="minimap">
      <div className="mm-title">{T.map[lang]}</div>
      <div className="mm-grid">
        {ep.places.map((p) => { const people = whoIsHere(ep, st, p.id); const cls = ['room', p.id === here.id ? 'here' : '', here.adjacent.includes(p.id) ? 'adjacent' : '', visited.has(p.id) || p.id === ep.startPlaceId ? 'visited' : ''].join(' ');
          return <button key={p.id} className={cls} aria-label={pick(p.name, lang)} onClick={() => { if (p.id === here.id) return; const path = routeTo(ep, here.id, p.id); if (!path) { show('No route.'); return; } for (const step of path) { const r = dispatch({ kind: 'move', placeId: step }); if (!r.ok) { show(r.message); return; } } }}>
            <span className="name">{pick(p.name, lang)}</span>
            <span className="tokens">{st.pos.holmes === p.id && <span className="tok holmes">●</span>}{st.pos.watson === p.id && <span className="tok watson">▲</span>}{people.map((x) => <span key={x.id} className="tok">{x.portrait}</span>)}</span>
          </button>; })}
      </div>
      <div className="watson-status">▲ {busy ? `${T.watson[lang]}: ${busy}` : T.watsonIdle[lang]}</div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
