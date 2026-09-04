import React from 'react';
import { useGame } from '../state/store';
import { scene } from '../kernel/kernel';
import { useLang, T, pick } from '../i18n/lang';
import { roomArt, PORTRAIT } from '../../content/art';
import type { Hotspot } from '../../content/art';
import type { Card } from '../kernel/model';
import { useToast } from './useToast';
import { useGuard } from './useGuard';
import { goalTargets } from './tutorial';
import { StageArt3D } from './StageArt3D';
import { hasWebGL } from './webgl';
import { loadDepth, hotspotOffset, flatSampler, PARALLAX_STRENGTH, type DepthSampler } from './depth';
const depthUrl = (image: string) => image.replace(/\.jpg$/, '.depth.png');
import { EvidenceCloseup } from './EvidenceCloseup';
import { DialogueView } from './DialogueView';
import { WatsonTicker } from './WatsonTicker';
import './stage-fx.css';
import { playSfx } from '../audio/sfx';
const EXIT_POS: Record<'left' | 'right' | 'ahead' | 'back', React.CSSProperties> = {
  left: { left: 12, top: '50%', transform: 'translateY(-50%)' }, right: { right: 12, top: '50%', transform: 'translateY(-50%)' },
  ahead: { left: '50%', top: '34%', transform: 'translateX(-50%)' }, back: { left: '50%', bottom: 14, transform: 'translateX(-50%)' },
};
const ARROW = { left: '◀', right: '▶', ahead: '▲', back: '▼' } as const;
const TOPICS_SHOWN = 4;        // the rest fold behind a "+N more" chip — episode 1 gives every witness 13
const ZOOM = 2.2;              // close-up magnification
const ZOOM_EDGE = 1.7;         // gentler when the prop sits near the frame edge, so it stays in view
const zoomFor = (h: { x: number; y: number }) => (h.x < 15 || h.x > 85 || h.y < 12 || h.y > 88 ? ZOOM_EDGE : ZOOM);
const ZOOM_MS = 450;
const ROOM_FX_MS = 500;        // crossfade between rooms
const WATSON_EYE_MS = 2000;    // how long a hotspot stays lit after Watson's tool call named it
function useImage(src: string | null): 'loading' | 'ok' | 'missing' {
  const [st, setSt] = React.useState<'loading' | 'ok' | 'missing'>(src ? 'loading' : 'missing');
  React.useEffect(() => { if (!src) { setSt('missing'); return; } let live = true; setSt('loading'); const im = new Image(); im.onload = () => live && setSt('ok'); im.onerror = () => live && setSt('missing'); im.src = src; return () => { live = false; }; }, [src]);
  return st;
}
interface Closeup { evidenceId: string; cardId: string; name: string; body: string; at: Hotspot }
export function SceneStage() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGuard();
  const lang = useLang((s) => s.lang); const [toast, show] = useToast();
  const [person, setPerson] = React.useState<string | null>(null);
  const [closeup, setCloseup] = React.useState<Closeup | null>(null);
  const [dialogue, setDialogue] = React.useState<{ personId: string; topicLabel: string; text: string } | null>(null);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [par, setPar] = React.useState({ x: 0, y: 0 });
  const [glFailed, setGlFailed] = React.useState(false);
  const gl = React.useMemo(() => hasWebGL(), []) && !glFailed;
  const stageRef = React.useRef<HTMLDivElement>(null);
  const [dep, setDep] = React.useState<DepthSampler>(flatSampler);
  const sc = scene(ep, st, st.pos.holmes);
  const art = roomArt(ep.id, st.pos.holmes);
  const reads = useGame((s) => s.watsonReads); const goal = goalTargets(ep, st, reads);
  const img = useImage(art?.image ?? null);

  // — room transition: hold the picture we are leaving for one crossfade —
  const [leaving, setLeaving] = React.useState<string | null>(null);
  const wasAt = React.useRef(st.pos.holmes);
  React.useEffect(() => {
    if (wasAt.current === st.pos.holmes) return;
    const old = roomArt(ep.id, wasAt.current)?.image ?? null;
    wasAt.current = st.pos.holmes;
    setLeaving(old);
    const t = setTimeout(() => setLeaving(null), ROOM_FX_MS);
    return () => clearTimeout(t);
  }, [st.pos.holmes, ep.id]);
  React.useEffect(() => { setPerson(null); setCloseup(null); setDialogue(null); setExpanded({}); }, [st.pos.holmes]);
  const artImage = art?.image ?? null;
  React.useEffect(() => {
    if (!gl || !artImage) { setDep(flatSampler()); return; }
    let live = true;
    loadDepth(depthUrl(artImage)).then((d) => { if (live) setDep(d); });
    return () => { live = false; };
  }, [gl, artImage]);
  const hotStyle = (x: number, y: number): React.CSSProperties => {
    const box = stageRef.current;
    const off = gl && dep.ok && box && !closeup ? hotspotOffset(dep, x / 100, y / 100, par, PARALLAX_STRENGTH, box.clientWidth, box.clientHeight) : { dx: 0, dy: 0 };
    return { left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) translate(${off.dx}px, ${off.dy}px)`, transition: 'transform 120ms linear' };
  };

  // — the zoom transition has to outlive the close-up itself, so the way back out is just as slow —
  const [zooming, setZooming] = React.useState(false);
  React.useEffect(() => {
    if (closeup) { setZooming(true); return; }
    const t = setTimeout(() => setZooming(false), ZOOM_MS + 20);
    return () => clearTimeout(t);
  }, [closeup]);

  // — Watson's last tool call points at someone or something in this room: light it for two seconds —
  const ticker = useGame((s) => s.ticker);
  const lastTick = ticker.length ? ticker[ticker.length - 1] : null;
  const [eye, setEye] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!lastTick?.targetId) return;
    setEye(lastTick.targetId);
    const t = setTimeout(() => setEye(null), WATSON_EYE_MS);
    return () => clearTimeout(t);
  }, [lastTick?.id, lastTick?.targetId]);

  const sel = sc.people.find((p) => p.id === person) ?? null;
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => { if (closeup) return; const r = e.currentTarget.getBoundingClientRect(); setPar({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 }); };
  const exits = sc.place.adjacent.map((id) => ({ id, name: pick(ep.places.find((p) => p.id === id)!.name, lang), dir: art?.exits?.[id] ?? 'back' as const }));
  const peoplePos = (i: number, n: number) => ({ x: n === 1 ? 50 : 25 + (50 * i) / Math.max(1, n - 1), y: 58 });

  const artStyle: React.CSSProperties | undefined = img === 'ok' && art
    ? closeup
      ? { backgroundImage: `url(${art.image})`, transformOrigin: `${closeup.at.x}% ${closeup.at.y}%`, transform: `scale(${zoomFor(closeup.at)})`, transition: `transform ${ZOOM_MS}ms ease` }
      : { backgroundImage: `url(${art.image})`, transform: `scale(1.06) translate(${-par.x * 14}px, ${-par.y * 10}px)`, ...(zooming ? { transition: `transform ${ZOOM_MS}ms ease` } : null) }
    : undefined;

  // topics fold: authored order, first four visible, and the tutorial's goal topic is never behind the fold
  const topicSplit = (p: NonNullable<typeof sel>) => {
    const all = p.topics;
    if (all.length <= TOPICS_SHOWN) return { head: all, rest: [] as typeof all };
    let head = all.slice(0, TOPICS_SHOWN);
    if (goal.person === p.id && goal.topic && !head.some((t) => t.id === goal.topic)) {
      const g = all.find((t) => t.id === goal.topic);
      if (g) head = [...all.slice(0, TOPICS_SHOWN - 1), g];
    }
    return { head, rest: all.filter((t) => !head.some((h) => h.id === t.id)) };
  };

  return (
    <div ref={stageRef} className={'stage' + (img === 'ok' ? ' has-art' : '') + (leaving !== null ? ' fx-transition' : '') + (closeup ? ' closeup-on' : '')} onMouseMove={onMove} onMouseLeave={() => setPar({ x: 0, y: 0 })}>
      {leaving && <div className="stage-art fx-out" style={{ backgroundImage: `url(${leaving})` }} />}
      {img === 'ok' && art && gl
        ? <StageArt3D key={st.pos.holmes} image={art.image} depth={depthUrl(art.image)} parallax={par} zoom={closeup ? { x: closeup.at.x / 100, y: closeup.at.y / 100, scale: zoomFor(closeup.at) } : null} onFailure={() => setGlFailed(true)} />
        : <div key={st.pos.holmes} className={'stage-art' + (leaving !== null ? ' fx-in' : '')} style={artStyle} />}
      {img !== 'ok' && <div className="stage-placeholder"><div className="ph-name">{pick(sc.place.name, lang)}</div><div className="ph-desc">{pick(sc.place.description, lang)}</div></div>}
      <div className="stage-caption"><b>{pick(sc.place.name, lang)}</b> {img === 'ok' && <span>{pick(sc.place.description, lang)}</span>}</div>
      {sc.evidence.map((e) => { const h = art?.evidence?.[e.id] ?? { x: 50, y: 80 }; return (
        <button key={e.id} className={'hot evidence' + (goal.evidence === e.id ? ' goal' : '') + (eye === e.id ? ' watson-eye' : '')} style={hotStyle(h.x, h.y)} aria-label={pick(e.name, lang)} title={pick(e.name, lang)}
          onMouseEnter={() => playSfx('hover')}
          onClick={() => { const r = dispatch({ kind: 'examine', evidenceId: e.id }); if (!r.ok) { show(r.message); return; } playSfx('examine'); const card = (r.result as { card: Card }).card;
            setPerson(null); setDialogue(null); setCloseup({ evidenceId: e.id, cardId: card.id, name: pick(e.name, lang), body: pick(card.body, lang), at: h }); }}>
          <span className="ring" /><span className="lbl">{pick(e.name, lang)}</span>
        </button>); })}
      {sc.people.map((p, i) => { const h = art?.people?.[p.id] ?? peoplePos(i, sc.people.length); const src = PORTRAIT[p.id]; return (
        <button key={p.id} className={'hot person' + (person === p.id ? ' on' : '') + (goal.person === p.id ? ' goal' : '') + (eye === p.id ? ' watson-eye' : '')} style={hotStyle(h.x, h.y)} aria-label={pick(p.name, lang)} onMouseEnter={() => playSfx('hover')} onClick={() => { playSfx('chip'); setCloseup(null); setDialogue(null); setPerson(person === p.id ? null : p.id); }}>
          <span className="face">{src ? <img src={src} alt="" onError={(ev) => { (ev.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}<span className="emoji">{p.portrait}</span></span>
          <span className="lbl">{pick(p.name, lang)}<small>{pick(p.role, lang)}</small></span>
        </button>); })}
      {exits.map((x) => <button key={x.id} className={'exit ' + x.dir + (goal.nextRoom === x.id ? ' goal' : '')} style={EXIT_POS[x.dir]} aria-label={x.name} onMouseEnter={() => playSfx('hover')} onClick={() => { const r = dispatch({ kind: 'move', placeId: x.id }); if (!r.ok) show(r.message); }}><span className="arrow">{ARROW[x.dir]}</span><span className="lbl">{x.name}</span></button>)}
      {sel && !closeup && (() => { const { head, rest } = topicSplit(sel); const open = !!expanded[sel.id]; const chips = open ? [...head, ...rest] : head; return (
        <div className="talk-rail">
          <div className="who">{sel.portrait} {pick(sel.name, lang)} · <span>{T.topics[lang]}</span></div>
          <div className="chips">
            {chips.map((t) => <button key={t.id} className={'chip topic' + (goal.topic === t.id && goal.person === sel.id ? ' goal' : '')} onClick={() => { playSfx('chip'); const r = dispatch({ kind: 'talk', personId: sel.id, topicId: t.id }); if (!r.ok) { show(r.message); return; } const card = (r.result as { card: Card }).card; setDialogue({ personId: sel.id, topicLabel: pick(t.label, lang), text: pick(card.body, lang) }); }}>{pick(t.label, lang)}</button>)}
            {rest.length > 0 && <button className="chip more" onClick={() => setExpanded((s) => ({ ...s, [sel.id]: !open }))}>{open ? T.fewerTopics[lang] : T.moreTopics[lang].replace('{n}', String(rest.length))}</button>}
          </div>
        </div>
      ); })()}
      {dialogue && sel && <DialogueView person={{ id: sel.id, name: sel.name, role: sel.role, portrait: sel.portrait }} topicLabel={dialogue.topicLabel} text={dialogue.text} onClose={() => setDialogue(null)} />}
      {closeup && <EvidenceCloseup name={closeup.name} body={closeup.body} cardId={closeup.cardId}
        onPin={(note) => { const r = dispatch({ kind: 'pin', cardId: closeup.cardId, note }); if (!r.ok) show(r.message); }}
        onBack={() => setCloseup(null)} />}
      <WatsonTicker />
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
