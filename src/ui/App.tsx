import React from 'react';
import { useGame } from '../state/store';
import { useWebmcpRoot } from '../webmcp/useWebmcp';
import { TopBar } from './TopBar';
import { MapPanel } from './MapPanel';
import { ScenePanel } from './ScenePanel';
import { NotebookPanel } from './NotebookPanel';
import { NoAgentBanner } from './NoAgentBanner';
import { AccuseDialog } from './AccuseDialog';
import { VerdictView } from './VerdictView';
import { RecapView } from './RecapView';
import { TutorialChips } from './TutorialChips';
import { Home } from './Home';
function useHash() { const [h, setH] = React.useState(location.hash); React.useEffect(() => { const f = () => setH(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []); return h; }
export function App() {
  useWebmcpRoot();
  const hash = useHash(); const state = useGame((s) => s.state); const hydrate = useGame((s) => s.hydrate);
  React.useEffect(() => { hydrate(); }, [hydrate]);
  const [accuseOpen, setAccuseOpen] = React.useState(false);
  if (hash.startsWith('#/recap/')) return <RecapView code={hash.slice(8)} />;
  if (hash.startsWith('#/play') && state) {
    return (
      <>
        <TopBar onAccuse={() => setAccuseOpen(true)} />
        <NoAgentBanner />
        <main className="cols"><MapPanel /><ScenePanel /><NotebookPanel /></main>
        <TutorialChips />
        <AccuseDialog open={accuseOpen} onClose={() => setAccuseOpen(false)} />
        <VerdictView />
      </>
    );
  }
  return <Home />;
}
