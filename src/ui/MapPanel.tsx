import { useGame } from '../state/store';
import { whoIsHere } from '../kernel/kernel';
import { useLang, T, pick } from '../i18n/lang';
import { useToast } from './useToast';
export function MapPanel() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGame((s) => s.dispatch); const busy = useGame((s) => s.watsonBusy);
  const lang = useLang((s) => s.lang); const [toast, show] = useToast();
  const here = ep.places.find((p) => p.id === st.pos.holmes)!;
  const visited = new Set(st.cards.filter((c) => c.kind === 'place').map((c) => c.placeId));
  return (
    <section className="map-panel">
      <h2>{T.map[lang]}</h2>
      <div className="map">
        {ep.places.map((p) => {
          const people = whoIsHere(ep, st, p.id);
          const cls = ['room', p.id === here.id ? 'here' : '', here.adjacent.includes(p.id) ? 'adjacent' : '', visited.has(p.id) || p.id === ep.startPlaceId ? 'visited' : ''].join(' ');
          return (
            <button key={p.id} className={cls} aria-label={pick(p.name, lang)} onClick={() => { if (p.id === here.id) return; const r = dispatch('holmes', { kind: 'move', placeId: p.id }); if (!r.ok) show(r.message); }}>
              <span className="name">{pick(p.name, lang)}</span>
              <span className="tokens">
                {st.pos.holmes === p.id && <span className="tok holmes" title={T.holmes[lang]}>●</span>}
                {st.pos.watson === p.id && <span className="tok watson" title={T.watson[lang]}>▲</span>}
                {people.map((x) => <span key={x.id} className="tok" title={pick(x.name, lang)}>{x.portrait}</span>)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="watson-status">▲ {busy ? `${T.watson[lang]}: ${busy}` : T.watsonIdle[lang]}</div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
