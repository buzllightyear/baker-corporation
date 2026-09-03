import React from 'react';
import { useLang, T } from '../i18n/lang';
import './stage-fx.css';

export interface EvidenceCloseupProps {
  /** Evidence name in the current language — the panel heading and the subject of the "ask Watson" line. */
  name: string;
  /** The notebook card body the kernel just returned (already language-projected). */
  body: string;
  /** Card id to attach a pin to. Omit to hide the pin control. */
  cardId?: string;
  onPin: (note: string) => void;
  onBack: () => void;
}

async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/** The Room-style close-up: the stage art has zoomed into the hotspot, this panel carries what was found and what to do with it. */
export function EvidenceCloseup({ name, body, cardId, onPin, onBack }: EvidenceCloseupProps) {
  const lang = useLang((s) => s.lang);
  const [pinning, setPinning] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [flash, setFlash] = React.useState<string | null>(null);
  React.useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === 'Escape') onBack(); }; addEventListener('keydown', f); return () => removeEventListener('keydown', f); }, [onBack]);
  const askLine = T.askWatsonLook[lang].replace('{name}', name);
  const say = (m: string) => { setFlash(m); setTimeout(() => setFlash(null), 1400); };
  return (
    <div className="closeup" role="dialog" aria-label={name}>
      <div className="cu-name">{name}</div>
      <div className="cu-body">{body}</div>
      {pinning && cardId && (
        <form className="cu-pin" onSubmit={(e) => { e.preventDefault(); const n = note.trim(); if (!n) return; onPin(n); setNote(''); setPinning(false); say(T.pinned[lang]); }}>
          <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder={T.pinPlaceholder[lang]} aria-label={T.pinNote[lang]} maxLength={200} />
          <button type="submit">{T.save[lang]}</button>
        </form>
      )}
      <div className="cu-acts">
        {cardId && <button onClick={() => setPinning((v) => !v)}>{T.pinNote[lang]}</button>}
        <button onClick={() => { void copy(askLine).then((ok) => say(ok ? T.copied[lang] : askLine)); }}>{T.askWatson[lang]}</button>
        <button className="cu-back" onClick={onBack}>{T.back[lang]}</button>
      </div>
      {flash && <div className="cu-flash">{flash}</div>}
    </div>
  );
}
