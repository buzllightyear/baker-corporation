import React from 'react';
import { useGame } from '../state/store';
import { useLang, T, pick } from '../i18n/lang';
import type { TutorialStep } from '../../content/types';
function done(step: TutorialStep, s: NonNullable<ReturnType<typeof useGame.getState>['state']>, activity: ReturnType<typeof useGame.getState>['activity']): boolean {
  const w = step.when;
  if (w.kind === 'start') return false;
  if (w.kind === 'moved') return s.pos.holmes === w.placeId || s.log.some((l) => l.verb === 'move' && l.target === w.placeId);
  if (w.kind === 'card') return s.cards.some((c) => c.id === w.cardId);
  if (w.kind === 'theory') return activity.some((a) => a.verb === 'submit_theory' && a.ok) || s.log.some((l) => l.verb === 'submit_theory');
  if (w.kind === 'accused') return s.accusations.length > 0;
  return false;
}
export function TutorialChips() {
  const ep = useGame((s) => s.episode)!; const st = useGame((s) => s.state)!; const activity = useGame((s) => s.activity); const lang = useLang((s) => s.lang);
  const key = `baker.tut.${ep.id}`;
  const [dismissed, setDismissed] = React.useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; } });
  const [copied, setCopied] = React.useState(false);
  if (!ep.tutorial || st.verdict) return null;
  // the step to show = first step whose own trigger is satisfied (or start) and that hasn't been dismissed; a later satisfied trigger supersedes earlier ones
  const reached = ep.tutorial.filter((t) => t.when.kind === 'start' || done(t, st, activity));
  const step = [...reached].reverse().find((t) => !dismissed.includes(t.id)) ?? null;
  if (!step) return null;
  const dismiss = () => { const next = [...dismissed, step.id]; setDismissed(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch {} };
  const copy = async () => { if (!step.chip) return; try { await navigator.clipboard.writeText(pick(step.chip, lang)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
  return (
    <div className="tut">
      <div className="label">Tutorial · {ep.tutorial.indexOf(step) + 1}/{ep.tutorial.length}</div>
      <p className="say">{pick(step.say, lang)}</p>
      {step.chip && <div className="chipline"><span className="label">{T.sayToWatson[lang]}</span><button onClick={copy} title="copy">{copied ? T.copied[lang] : pick(step.chip, lang)}</button></div>}
      <div className="row" style={{ marginTop: 6 }}><button onClick={dismiss}>✕</button></div>
    </div>
  );
}
