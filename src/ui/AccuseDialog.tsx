import React from 'react';
import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { Tag, serialOf } from './chrome/Frame';
import { Logo } from './chrome/Logo';
export function AccuseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const dispatch = useGame((s) => s.dispatch);
  const lang = useLang((s) => s.lang);
  const [who, setWho] = React.useState(''); const [how, setHow] = React.useState(''); const [ev, setEv] = React.useState('');
  const [wrong, setWrong] = React.useState<string[] | null>(null);
  if (!open) return null;
  const evidenceOnBoard = st.cards.filter((c) => c.kind === 'evidence');
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); if (!who || !how || !ev) return;
    const r = dispatch('holmes', { kind: 'accuse', who, how, evidence: ev });
    if (!r.ok) { setWrong([r.message]); return; }
    const res = (r.result as { result: { who: boolean; how: boolean; evidence: boolean }; verdict: string | null }).result;
    const bad = [!res.who && T.who[lang], !res.how && T.how[lang], !res.evidence && T.decisive[lang]].filter(Boolean) as string[];
    if (bad.length === 0 || r.state.verdict) { onClose(); return; }
    setWrong(bad);
  };
  return (
    <div className="dialog-bg" onClick={onClose}>
      <form className="dialog frame dialog-accuse" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="hazard-strip" aria-hidden="true" />
        <Tag serial={serialOf(ep.id + ':accuse', 'ACC')} />
        <div className="dialog-body">
          <h2><Logo /> {T.accuse[lang]}<span className="cnt">{st.accusationsLeft} {T.accusationsLeft[lang]}</span></h2>
          <label>{T.who[lang]}<select aria-label={T.who[lang]} value={who} onChange={(e) => setWho(e.target.value)}><option value="">—</option>{ep.people.map((p) => <option key={p.id} value={p.id}>{pick(p.name, lang)} · {pick(p.role, lang)}</option>)}</select></label>
          <label>{T.how[lang]}<select aria-label={T.how[lang]} value={how} onChange={(e) => setHow(e.target.value)}><option value="">—</option>{ep.methods.map((m) => <option key={m.id} value={m.id}>{pick(m.label, lang)}</option>)}</select></label>
          <label>{T.decisive[lang]}<select aria-label={T.decisive[lang]} value={ev} onChange={(e) => setEv(e.target.value)}><option value="">—</option>{evidenceOnBoard.map((c) => <option key={c.id} value={c.id}>{pick(c.title, lang)}</option>)}</select></label>
          {wrong && <div className="wrong">{T.wrongSlots[lang]} {wrong.join(', ')}</div>}
          <div className="row"><button type="button" onClick={onClose}>{T.cancel[lang]}</button><button type="submit" className="accuse" disabled={!who || !how || !ev}>{T.submit[lang]}</button></div>
        </div>
      </form>
    </div>
  );
}
