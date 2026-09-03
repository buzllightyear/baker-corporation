import React from 'react';
import type { Episode, IntroCard } from '../../content/types';
import { useLang, T, pick } from '../i18n/lang';
import { listEpisodes } from '../state/store';
import { Portrait } from './DialogueView';
import './narrative.css';

/** One flag per episode, so the cold open plays once and the Case file button can replay it. */
export const introKey = (episodeId: string) => `baker.intro.${episodeId}`;
export function introSeen(episodeId: string): boolean {
  try { return localStorage.getItem(introKey(episodeId)) !== null; } catch { return false; }
}
export function markIntroSeen(episodeId: string): void {
  try { localStorage.setItem(introKey(episodeId), '1'); } catch { /* private mode */ }
}

/** Backdrop for the title card. Falls back to the first intro card's picture, then to nothing. */
const TITLE_ART: Record<string, string> = { ep0: '/art/rooms/corridor_a.jpg', ep1: '/art/rooms/cargo3.jpg' };

function episodeNumber(episodeId: string): number {
  const i = listEpisodes().findIndex((e) => e.id === episodeId);
  if (i >= 0) return i;
  const m = /(\d+)/.exec(episodeId);
  return m ? Number(m[1]) : 0;
}

const CREW_PHOTO = '/art/ui/crew-photo.jpg';

function CrewManifest({ episode }: { episode: Episode }) {
  const lang = useLang((s) => s.lang);
  const [noPhoto, setNoPhoto] = React.useState(false);
  return (
    <div className="nv-crew">
      {!noPhoto && <img className="nv-crew-photo" src={CREW_PHOTO} alt="" onError={() => setNoPhoto(true)} />}
      <h3 className="nv-crew-head">{T.crewManifest[lang]}</h3>
      <ul className="nv-crew-list">
        {episode.people.map((p) => (
          <li key={p.id} className="nv-crew-row">
            <Portrait id={p.id} emoji={p.portrait} size="sm" />
            <div className="nv-crew-text">
              <div className="nv-crew-name">{pick(p.name, lang)}<small>{pick(p.role, lang)}</small></div>
              {p.blurb && <div className="nv-crew-blurb">{pick(p.blurb, lang)}</div>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Intro({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const lang = useLang((s) => s.lang);
  const cards: IntroCard[] = episode.intro?.cards ?? [];
  const last = cards.length;                 // index 0 is the title card, 1..cards.length are the cold-open cards
  const [i, setI] = React.useState(0);

  const finish = React.useCallback(() => { markIntroSeen(episode.id); onClose(); }, [episode.id, onClose]);
  const next = React.useCallback(() => setI((k) => (k >= last ? k : k + 1)), [last]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); setI((k) => (k >= last ? k : k + 1)); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [finish, last]);

  const card = i === 0 ? null : cards[i - 1];
  const bg = i === 0 ? (TITLE_ART[episode.id] ?? cards[0]?.image) : card?.image;
  const onLast = i >= last;

  return (
    <div className="nv-intro" role="dialog" aria-modal="true" aria-label={pick(episode.title, lang)}>
      {bg && <div className="nv-intro-art" style={{ backgroundImage: `url(${bg})` }} />}
      <div className="nv-intro-scrim" />
      <div className="nv-intro-inner">
        {i === 0 ? (
          <div className="nv-title-card">
            <div className="nv-kicker">{`${T.episode[lang]} ${episodeNumber(episode.id)}`}</div>
            <h1 className="nv-title">{pick(episode.title, lang)}</h1>
            <div className="nv-series">{pick(episode.series, lang)}</div>
          </div>
        ) : (
          <div className="nv-card">
            <div className="nv-kicker">{`${T.briefing[lang]} · ${i} / ${last}`}</div>
            <h2 className="nv-card-title">{pick(card!.title, lang)}</h2>
            <p className="nv-card-body">{pick(card!.body, lang)}</p>
            {card!.showCrew && <CrewManifest episode={episode} />}
          </div>
        )}
        <div className="nv-intro-actions">
          <button className="nv-skip" onClick={finish}>{T.skip[lang]}</button>
          <div className="nv-dots">{Array.from({ length: last + 1 }, (_, k) => <span key={k} className={'nv-dot' + (k === i ? ' on' : '')} />)}</div>
          {onLast
            ? <button className="nv-next primary" onClick={finish}>{T.startCase[lang]}</button>
            : <button className="nv-next" onClick={next}>{T.next[lang]} →</button>}
        </div>
      </div>
    </div>
  );
}
