import React from 'react';
import type { Episode, Place } from '../../content/types';
import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import { Portrait } from './DialogueView';
import './narrative.css';

/** Where the manifest last puts this person: the room they are in now, else the most recent
 *  room they left. Same rule as the kernel's `whoIsHere`, read straight off `ep.presence`. */
export function lastSeenPlace(ep: Episode, clock: number, personId: string): Place | null {
  const here = ep.presence.find((p) => p.personId === personId && clock >= p.from && clock < p.to);
  const past = ep.presence.filter((p) => p.personId === personId && p.to <= clock).sort((a, b) => b.to - a.to)[0];
  const placeId = here?.placeId ?? past?.placeId;
  return placeId ? ep.places.find((p) => p.id === placeId) ?? null : null;
}

export function Dossier({ onClose }: { onClose: () => void }) {
  const ep = useGame((s) => s.episode);
  const st = useGame((s) => s.state);
  const lang = useLang((s) => s.lang);
  const [open, setOpen] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!ep || !st) return null;

  return (
    <aside className="nv-dossier" role="dialog" aria-modal="false" aria-label={T.crew[lang]}>
      <header className="nv-dossier-head">
        <h2>{T.crew[lang]}</h2>
        <button onClick={onClose} aria-label={T.close[lang]}>✕</button>
      </header>
      <ul className="nv-dossier-list">
        {ep.people.map((p) => {
          const place = lastSeenPlace(ep, st.clock, p.id);
          const said = st.cards.filter((c) => c.kind === 'statement' && c.personId === p.id);
          const isOpen = open === p.id;
          return (
            <li key={p.id} className={'nv-dossier-row' + (isOpen ? ' on' : '')}>
              <button className="nv-dossier-person" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : p.id)}>
                <Portrait id={p.id} emoji={p.portrait} size="sm" />
                <div className="nv-dossier-text">
                  <div className="nv-crew-name">{pick(p.name, lang)}<small>{pick(p.role, lang)}</small></div>
                  {p.blurb && <div className="nv-crew-blurb">{pick(p.blurb, lang)}</div>}
                  <div className="nv-dossier-meta">
                    <span>{`${T.lastSeen[lang]}: ${place ? pick(place.name, lang) : T.notLogged[lang]}`}</span>
                    <span>{`${said.length} ${T.statementsOn[lang]}`}</span>
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="nv-dossier-cards">
                  {said.length === 0 && <p className="nv-dim">{T.noStatements[lang]}</p>}
                  {said.map((c) => (
                    <article key={c.id} className="nv-dossier-card">
                      <h4>{pick(c.title, lang)}</h4>
                      <p>{pick(c.body, lang)}</p>
                    </article>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
