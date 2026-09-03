import React from 'react';
import { getEpisode } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { decodeRecap } from '../share/recap';
import { Tag, serialOf } from './chrome/Frame';
import { Logo } from './chrome/Logo';
export function RecapView({ code }: { code: string }) {
  const lang = useLang((s) => s.lang); const [copied, setCopied] = React.useState(false);
  const r = decodeRecap(code); const ep = r ? getEpisode(r.episodeId) : undefined;
  if (!r || !ep) { location.hash = '#/'; return null; }
  const title = (id: string) => { if (id.startsWith('place:')) { const n = ep.places.find((p) => p.id === id.slice(6))?.name; return n ? pick(n, lang) : id; } const st = ep.statements.find((s) => s.id === id); if (st) { const p = ep.people.find((x) => x.id === st.personId)!; const t = ep.topics.find((x) => x.id === st.topicId)!; return `${pick(p.name, lang)} — ${pick(t.label, lang)}`; } const c = ep.evidence.find((e) => e.id === id)?.name ?? ep.records.find((x) => x.id === id)?.title; return c ? pick(c, lang) : id; };
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  const stamp = r.verdict === 'solved' ? 'amber' : r.verdict === 'failed' ? 'bad' : 'mute';
  return (
    <div className="center">
      <div className="case-head"><Logo /><h1>{T.recap[lang]} · {pick(ep.title, lang)}</h1></div>
      <div className="frame recap-panel">
        <Tag serial={serialOf(ep.id + ':recap:' + code.slice(0, 12), 'CSF')} />
        <div className="pad">
          <div><span className={'stamp ' + stamp}>{r.verdict === 'solved' ? T.solved[lang] : r.verdict === 'failed' ? T.failed[lang] : '—'}</span></div>
          <div className="nums">
            <div><b>{Math.floor(r.timeUsed / 60)}h {String(r.timeUsed % 60).padStart(2, '0')}m</b><span>{T.timeUsed[lang]}</span></div>
            <div><b>{r.watsonCalls}</b><span>{T.watsonCalls[lang]}</span></div>
            <div><b>{r.accusations}</b><span>{T.accusations[lang]}</span></div>
          </div>
          <div className="card-sec">{T.map[lang]}</div>
          <div className="map">
            {ep.places.map((p) => <div key={p.id} className={'room' + (r.visited.includes(p.id) ? ' visited' : '')}><span className="name">{pick(p.name, lang)}</span>{!r.visited.includes(p.id) && <span className="empty">{T.unvisited[lang]}</span>}</div>)}
          </div>
          <div className="card-sec">{T.notebook[lang]}</div>
          <div className="order">
            {r.order.map((o, i) => <div key={i}><span className={'by ' + o.by}>{o.by === 'holmes' ? '●' : '▲'}</span> {ep.clockLabel(o.at)} {title(o.cardId)}</div>)}
          </div>
        </div>
      </div>
      <div className="row"><button onClick={copy}>{copied ? T.copied[lang] : T.share[lang]}</button> <button onClick={() => { location.hash = '#/'; }}>← Home</button></div>
    </div>
  );
}
