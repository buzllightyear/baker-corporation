import React from 'react';
import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { Tag, serialOf } from './chrome/Frame';
const LABEL = { proven: { en: 'proven', ko: '입증됨' }, unsupported: { en: 'unsupported', ko: '근거 부족' }, contradicted: { en: 'contradicted', ko: '모순' }, unmatched: { en: 'unmatched', ko: '판정 불가' } } as const;
const STAMP = { proven: 'ok', unsupported: 'warn', contradicted: 'bad', unmatched: 'mute' } as const;
export function HearingPanel() {
  const ep = useGame((s) => s.episode)!; const h = useGame((s) => s.lastHearing); const lang = useLang((s) => s.lang);
  const [open, setOpen] = React.useState(true);
  React.useEffect(() => { setOpen(true); }, [h?.at, h?.verdicts.length]);
  if (!h) return null;
  const name = (id: string) => { const ev = ep.evidence.find((e) => e.id === id); if (ev) return pick(ev.name, lang); const st = ep.statements.find((x) => x.id === id); if (st) { const p = ep.people.find((x) => x.id === st.personId)!; const t = ep.topics.find((x) => x.id === st.topicId)!; return `${pick(p.name, lang)} — ${pick(t.label, lang)}`; } const r = ep.records.find((x) => x.id === id); return r ? pick(r.title, lang) : id; };
  const claimText = (v: { claim: string; propositionId: string | null }) => { const p = v.propositionId ? ep.propositions.find((x) => x.id === v.propositionId) : null; return p ? pick(p.text, lang) : v.claim; };
  const n = { proven: 0, unsupported: 0, contradicted: 0, unmatched: 0 }; h.verdicts.forEach((v) => { n[v.status]++; });
  return (
    <div className={'hearing frame' + (open ? ' open' : '')}>
      <Tag serial={serialOf(ep.id + ':hearing:' + h.at, 'HRG')} />
      <button className="hearing-head" onClick={() => setOpen(!open)}>
        <span className="k">{T.hearing[lang]} · {ep.clockLabel(h.at)}</span>
        <span className="sum"><b className="proven">{n.proven}</b> / <b className="unsupported">{n.unsupported}</b> / <b className="contradicted">{n.contradicted}</b></span>
        <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="hearing-body">
          {h.verdicts.map((v, i) => (
            <div key={i} className={'verdict ' + v.status}>
              <span className={'st stamp ' + STAMP[v.status]}>{LABEL[v.status][lang]}</span>
              <span className="cl">{claimText(v)}</span>
              {((v.missing && v.missing.length > 0) || (v.stillToFind ?? 0) > 0) && <span className="miss">{T.missing[lang]}: {[...(v.missing ?? []).map(name), ...((v.stillToFind ?? 0) > 0 ? [T.stillToFind[lang].replace('{n}', String(v.stillToFind))] : [])].join(', ')}</span>}
            </div>
          ))}
          <div className="note">{T.hearingNote[lang]}</div>
        </div>
      )}
    </div>
  );
}
