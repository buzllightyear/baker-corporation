import React from 'react';
import { useGame } from '../state/store';
import { scene } from '../kernel/kernel';
import { useLang, T, pick } from '../i18n/lang';
import { roomArt, PORTRAIT } from '../../content/art';
import { useToast } from './useToast';
import { useGuard } from './useGuard';
import { goalTargets } from './tutorial';
const EXIT_POS: Record<'left' | 'right' | 'ahead' | 'back', React.CSSProperties> = {
  left: { left: 12, top: '50%', transform: 'translateY(-50%)' }, right: { right: 12, top: '50%', transform: 'translateY(-50%)' },
  ahead: { left: '50%', top: '34%', transform: 'translateX(-50%)' }, back: { left: '50%', bottom: 14, transform: 'translateX(-50%)' },
};
const ARROW = { left: '◀', right: '▶', ahead: '▲', back: '▼' } as const;
function useImage(src: string | null): 'loading' | 'ok' | 'missing' {
  const [st, setSt] = React.useState<'loading' | 'ok' | 'missing'>(src ? 'loading' : 'missing');
  React.useEffect(() => { if (!src) { setSt('missing'); return; } let live = true; setSt('loading'); const im = new Image(); im.onload = () => live && setSt('ok'); im.onerror = () => live && setSt('missing'); im.src = src; return () => { live = false; }; }, [src]);
  return st;
}
export function SceneStage() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGuard();
  const lang = useLang((s) => s.lang); const [toast, show] = useToast();
  const [person, setPerson] = React.useState<string | null>(null);
  const [look, setLook] = React.useState<{ title: string; body: string } | null>(null);
  const [par, setPar] = React.useState({ x: 0, y: 0 });
  const sc = scene(ep, st, st.pos.holmes);
  const art = roomArt(ep.id, st.pos.holmes);
  const reads = useGame((s) => s.watsonReads); const goal = goalTargets(ep, st, reads);
  const img = useImage(art?.image ?? null);
  React.useEffect(() => { setPerson(null); setLook(null); }, [st.pos.holmes]);
  const sel = sc.people.find((p) => p.id === person) ?? null;
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => { const r = e.currentTarget.getBoundingClientRect(); setPar({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }); };
  const exits = sc.place.adjacent.map((id) => ({ id, name: pick(ep.places.find((p) => p.id === id)!.name, lang), dir: art?.exits?.[id] ?? 'back' as const }));
  const peoplePos = (i: number, n: number) => ({ x: n === 1 ? 50 : 25 + (50 * i) / Math.max(1, n - 1), y: 58 });
  return (
    <div className={'stage' + (img === 'ok' ? ' has-art' : '')} onMouseMove={onMove} onMouseLeave={() => setPar({ x: 0, y: 0 })}>
      <div className="stage-art" style={img === 'ok' && art ? { backgroundImage: `url(${art.image})`, transform: `scale(1.06) translate(${-par.x * 14}px, ${-par.y * 10}px)` } : undefined} />
      {img !== 'ok' && <div className="stage-placeholder"><div className="ph-name">{pick(sc.place.name, lang)}</div><div className="ph-desc">{pick(sc.place.description, lang)}</div></div>}
      <div className="stage-caption"><b>{pick(sc.place.name, lang)}</b> {img === 'ok' && <span>{pick(sc.place.description, lang)}</span>}</div>
      {sc.evidence.map((e) => { const h = art?.evidence?.[e.id] ?? { x: 50, y: 80 }; return (
        <button key={e.id} className={'hot evidence' + (goal.evidence === e.id ? ' goal' : '')} style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-label={pick(e.name, lang)} title={pick(e.name, lang)}
          onClick={() => { const r = dispatch({ kind: 'examine', evidenceId: e.id }); if (!r.ok) { show(r.message); return; } const card = (r.result as { card: { title: { en: string; ko: string }; body: { en: string; ko: string } } }).card; setLook({ title: pick(card.title, lang), body: pick(card.body, lang) }); }}>
          <span className="ring" /><span className="lbl">{pick(e.name, lang)}</span>
        </button>); })}
      {sc.people.map((p, i) => { const h = art?.people?.[p.id] ?? peoplePos(i, sc.people.length); const src = PORTRAIT[p.id]; return (
        <button key={p.id} className={'hot person' + (person === p.id ? ' on' : '') + (goal.person === p.id ? ' goal' : '')} style={{ left: `${h.x}%`, top: `${h.y}%` }} aria-label={pick(p.name, lang)} onClick={() => { setLook(null); setPerson(person === p.id ? null : p.id); }}>
          <span className="face">{src ? <img src={src} alt="" onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}<span className="emoji">{p.portrait}</span></span>
          <span className="lbl">{pick(p.name, lang)}<small>{pick(p.role, lang)}</small></span>
        </button>); })}
      {exits.map((x) => <button key={x.id} className={'exit ' + x.dir + (goal.nextRoom === x.id ? ' goal' : '')} style={EXIT_POS[x.dir]} aria-label={x.name} onClick={() => { const r = dispatch({ kind: 'move', placeId: x.id }); if (!r.ok) show(r.message); }}><span className="arrow">{ARROW[x.dir]}</span><span className="lbl">{x.name}</span></button>)}
      {sel && (
        <div className="talk-rail">
          <div className="who">{sel.portrait} {pick(sel.name, lang)} · <span>{T.topics[lang]}</span></div>
          <div className="chips">{sel.topics.map((t) => <button key={t.id} className={'chip topic' + (goal.topic === t.id && goal.person === sel.id ? ' goal' : '')} onClick={() => { const r = dispatch({ kind: 'talk', personId: sel.id, topicId: t.id }); if (!r.ok) { show(r.message); return; } const card = (r.result as { card: { body: { en: string; ko: string } } }).card; setLook({ title: pick(sel.name, lang), body: pick(card.body, lang) }); }}>{pick(t.label, lang)}</button>)}</div>
        </div>
      )}
      {look && <div className="look" onClick={() => setLook(null)}><div className="t">{look.title}</div><div className="b">{look.body}</div></div>}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
