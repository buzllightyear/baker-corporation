import React from 'react';
import { getEpisode } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { decodeRecap } from '../share/recap';
export function RecapView({ code }: { code: string }) {
  const lang = useLang((s) => s.lang); const [copied, setCopied] = React.useState(false);
  const r = decodeRecap(code); const ep = r ? getEpisode(r.episodeId) : undefined;
  if (!r || !ep) { location.hash = '#/'; return null; }
  const title = (id: string) => { const c = id.startsWith('place:') ? ep.places.find((p) => p.id === id.slice(6))?.name : ep.statements.find((s) => s.id === id) ? { en: id, ko: id } : ep.evidence.find((e) => e.id === id)?.name ?? ep.records.find((x) => x.id === id)?.title; return c ? pick(c, lang) : id; };
  const copy = async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div className="center">
      <h1>{T.recap[lang]} · {pick(ep.title, lang)}</h1>
      <div>{r.verdict === 'solved' ? T.solved[lang] : r.verdict === 'failed' ? T.failed[lang] : '—'}</div>
      <div className="nums">
        <div><b>{Math.floor(r.timeLeft / 60)}h {String(r.timeLeft % 60).padStart(2, '0')}m</b><span>{T.timeLeft[lang]}</span></div>
        <div><b>{r.watsonCalls}</b><span>{T.watsonCalls[lang]}</span></div>
        <div><b>{r.accusations}</b><span>{T.accusations[lang]}</span></div>
      </div>
      <div className="map">
        {ep.places.map((p) => <div key={p.id} className={'room' + (r.visited.includes(p.id) ? ' visited' : '')}><span className="name">{pick(p.name, lang)}</span>{!r.visited.includes(p.id) && <span className="empty">{T.unvisited[lang]}</span>}</div>)}
      </div>
      <div className="order">
        {r.order.map((o, i) => <div key={i}><span className={'by ' + o.by}>{o.by === 'holmes' ? '●' : '▲'}</span> {ep.clockLabel(o.at)} {title(o.cardId)}</div>)}
      </div>
      <div className="row"><button onClick={copy}>{copied ? T.copied[lang] : T.share[lang]}</button> <button onClick={() => { location.hash = '#/'; }}>← Home</button></div>
    </div>
  );
}
