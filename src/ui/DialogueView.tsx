import React from 'react';
import type { Text } from '../../content/types';
import { useLang, T, pick } from '../i18n/lang';
import { PORTRAIT } from '../../content/art';
import './stage-fx.css';

/**
 * PLACEHOLDER — Stream A owns the real DialogueView. This file exists only so the interaction
 * stream compiles against the agreed signature; the merge takes Stream A's version verbatim.
 * Contract: props { person: { id, name: Text, role: Text, portrait: string }, topicLabel, text, onClose }
 * plus the exported `useTypewriter` hook.
 */
export interface DialoguePerson { id: string; name: Text; role: Text; portrait: string }
export interface DialogueViewProps { person: DialoguePerson; topicLabel: string; text: string; onClose: () => void }

/** Reveals `text` one character at a time; returns the full string once done (and immediately under reduced motion). */
export function useTypewriter(text: string, msPerChar = 18): string {
  const instant = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [n, setN] = React.useState(instant ? text.length : 0);
  React.useEffect(() => {
    if (instant) { setN(text.length); return; }
    setN(0);
    const id = setInterval(() => setN((k) => { if (k >= text.length) { clearInterval(id); return k; } return k + 1; }), msPerChar);
    return () => clearInterval(id);
  }, [text, msPerChar, instant]);
  return text.slice(0, n);
}

export function DialogueView({ person, topicLabel, text, onClose }: DialogueViewProps) {
  const lang = useLang((s) => s.lang);
  React.useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onClose]);
  const src = PORTRAIT[person.id];
  return (
    <div className="dialogue" role="dialog" aria-label={pick(person.name, lang)}>
      <div className="dlg-face">{src ? <img src={src} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : null}<span className="emoji">{person.portrait}</span></div>
      <div className="dlg-body">
        <div className="dlg-who"><b>{pick(person.name, lang)}</b> <small>{pick(person.role, lang)}</small> · <span className="dlg-topic">{topicLabel}</span></div>
        <div className="dlg-text">{text}</div>
      </div>
      <button className="dlg-close" onClick={onClose}>{T.back[lang]}</button>
    </div>
  );
}
