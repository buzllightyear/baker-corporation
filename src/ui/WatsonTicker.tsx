import React from 'react';
import { useGame } from '../state/store';
import './stage-fx.css';

const LIFE_MS = 6000;
const SHOW = 3;

/** Watson's interjections over the stage: one live line, the couple before it faint, all gone six seconds after the last call. */
export function WatsonTicker() {
  const ticker = useGame((s) => s.ticker);
  const [dead, setDead] = React.useState(false);
  const last = ticker.length ? ticker[ticker.length - 1] : null;
  React.useEffect(() => {
    if (!last) return;
    setDead(false);
    const t = setTimeout(() => setDead(true), LIFE_MS);
    return () => clearTimeout(t);
  }, [last?.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!last || dead) return null;
  const lines = ticker.slice(-SHOW);
  return (
    <div className="watson-ticker mono" aria-live="polite">
      {lines.map((l, i) => (
        <div key={l.id} className={'wt-line' + (i === lines.length - 1 ? ' now' : '')}>
          {l.text}{i === lines.length - 1 && <span className="wt-caret">_</span>}
        </div>
      ))}
    </div>
  );
}
