import React from 'react';
import { useGame } from '../state/store';
import { scene } from '../kernel/kernel';
import { useLang, T, pick } from '../i18n/lang';
import { useToast } from './useToast';
export function ScenePanel() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGame((s) => s.dispatch);
  const lang = useLang((s) => s.lang); const [toast, show] = useToast();
  const [person, setPerson] = React.useState<string | null>(null);
  const sc = scene(ep, st, st.pos.holmes);
  React.useEffect(() => { if (person && !sc.people.some((p) => p.id === person)) setPerson(null); }, [sc.people, person]);
  const sel = sc.people.find((p) => p.id === person) ?? null;
  return (
    <section className="scene">
      <h2>{T.scene[lang]} — {pick(sc.place.name, lang)}</h2>
      <p className="desc">{pick(sc.place.description, lang)}</p>
      <h2>{T.people[lang]}</h2>
      <div className="list">
        {sc.people.length === 0 && <span className="empty">—</span>}
        {sc.people.map((p) => <button key={p.id} className={'chip person' + (person === p.id ? ' on' : '')} onClick={() => setPerson(person === p.id ? null : p.id)}>{p.portrait} {pick(p.name, lang)} · {pick(p.role, lang)}</button>)}
      </div>
      {sel && (
        <>
          <h2>{T.topics[lang]}</h2>
          <div className="list">
            {sel.topics.map((t) => <button key={t.id} className="chip topic" onClick={() => { const r = dispatch('holmes', { kind: 'talk', personId: sel.id, topicId: t.id }); if (!r.ok) show(r.message); }}>{pick(t.label, lang)}</button>)}
          </div>
        </>
      )}
      <h2>{T.evidence[lang]}</h2>
      <div className="list">
        {sc.evidence.length === 0 && <span className="empty">—</span>}
        {sc.evidence.map((e) => <button key={e.id} className="chip evidence" onClick={() => { const r = dispatch('holmes', { kind: 'examine', evidenceId: e.id }); if (!r.ok) show(r.message); }}>{pick(e.name, lang)}</button>)}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </section>
  );
}
