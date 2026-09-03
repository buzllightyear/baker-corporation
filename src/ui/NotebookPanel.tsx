import React from 'react';
import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { Tag, serialOf } from './chrome/Frame';
const ICON: Record<string, string> = { statement: '💬', evidence: '🔍', record: '📄', place: '📍' };
export function NotebookPanel() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGame((s) => s.dispatch);
  const lang = useLang((s) => s.lang);
  const [note, setNote] = React.useState<Record<string, string>>({});
  const cards = [...st.cards].reverse().filter((c) => c.kind !== 'place');
  return (
    <section className="notebook frame">
      <Tag serial={serialOf(ep.id + ':notebook', 'LDG')} />
      <h2>{T.notebook[lang]}<span className="n">{String(cards.length).padStart(2, '0')} ENT</span></h2>
      <div className="nb-scroll">
        <div className="cards">
          {cards.length === 0 && <div className="empty">—</div>}
          {cards.map((c) => {
            const pins = st.pins.filter((p) => p.cardId === c.id);
            return (
              <div key={c.id} className="card">
                <div className="meta"><span>{ICON[c.kind]}</span><span className={'by ' + c.foundBy}>{c.foundBy === 'holmes' ? T.holmes[lang] : T.watson[lang]}</span><span>{ep.clockLabel(c.foundAt)}</span><span className="mono cid">{c.id}</span></div>
                <div className="t">{pick(c.title, lang)}</div>
                <div className="b">{pick(c.body, lang)}</div>
                {pins.length > 0 && <div className="pins">{pins.map((p, i) => <div key={i}>📌 {p.note}</div>)}</div>}
                <form onSubmit={(e) => { e.preventDefault(); const n = (note[c.id] ?? '').trim(); if (!n) return; dispatch('holmes', { kind: 'pin', cardId: c.id, note: n }); setNote({ ...note, [c.id]: '' }); }}>
                  <input value={note[c.id] ?? ''} onChange={(e) => setNote({ ...note, [c.id]: e.target.value })} placeholder="📌" aria-label={`note ${c.id}`} />
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
