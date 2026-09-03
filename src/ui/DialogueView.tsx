import React from 'react';
import type { Text } from '../../content/types';
import { useLang, pick } from '../i18n/lang';
import './narrative.css';

/** Anything with an id, a bilingual name/role and an emoji: both `Person` and the trimmed
 *  person object that `scene()` returns satisfy this, so a caller can pass either. */
export interface Speaker { id: string; name: Text; role: Text; portrait: string }

const prefersReducedMotion = (): boolean => {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/** Reveals `text` one character at a time (~18ms/char). `complete()` jumps to the end. */
export function useTypewriter(text: string, msPerChar = 18) {
  const instant = prefersReducedMotion();
  const [n, setN] = React.useState(() => (instant ? text.length : 0));
  React.useEffect(() => { setN(instant ? text.length : 0); }, [text, instant]);
  React.useEffect(() => {
    if (n >= text.length) return;
    const id = setTimeout(() => setN((k) => Math.min(text.length, k + 1)), msPerChar);
    return () => clearTimeout(id);
  }, [n, text, msPerChar]);
  const complete = React.useCallback(() => setN(text.length), [text.length]);
  return { shown: text.slice(0, n), done: n >= text.length, complete };
}

/** Portrait with an emoji underneath: the picture hides itself if the file is missing. */
export function Portrait({ id, emoji, size }: { id: string; emoji: string; size?: 'sm' | 'lg' }) {
  const [broken, setBroken] = React.useState(false);
  return (
    <span className={'nv-portrait' + (size === 'lg' ? ' lg' : '') + (size === 'sm' ? ' sm' : '')} aria-hidden="true">
      {!broken && <img src={`/art/portraits/${id}.jpg`} alt="" onError={() => setBroken(true)} />}
      <span className="nv-portrait-emoji">{emoji}</span>
    </span>
  );
}

export interface DialogueViewProps {
  person: Speaker;
  /** Already-localised topic label, e.g. pick(topic.label, lang). Optional. */
  topicLabel?: string;
  /** Already-localised line, e.g. pick(card.body, lang). */
  text: string;
  onClose: () => void;
}

/** Purely presentational. The caller owns the card/kernel call; this only renders the result. */
export function DialogueView({ person, topicLabel, text, onClose }: DialogueViewProps) {
  const lang = useLang((s) => s.lang);
  const { shown, done, complete } = useTypewriter(text);
  return (
    <div
      className="nv-dialogue"
      role="dialog"
      aria-label={pick(person.name, lang)}
      onClick={() => (done ? onClose() : complete())}
      role="button"
      tabIndex={0}
      aria-label={pick(person.name, lang)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); done ? onClose() : complete(); } }}
    >
      <Portrait id={person.id} emoji={person.portrait} size="lg" />
      <div className="nv-dialogue-body">
        <div className="nv-dialogue-who">
          <b>{pick(person.name, lang)}</b>
          <small>{pick(person.role, lang)}</small>
          {topicLabel && <span className="nv-dialogue-topic">{topicLabel}</span>}
        </div>
        <p className="nv-dialogue-line">{shown}<span className={'nv-caret' + (done ? ' off' : '')}>▍</span></p>
        <div className={'nv-dialogue-next' + (done ? '' : ' dim')}>▶</div>
      </div>
    </div>
  );
}
