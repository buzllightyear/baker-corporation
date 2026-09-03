import React from 'react';
import { useGame } from '../state/store';
import { useWebmcpRoot } from '../webmcp/useWebmcp';
import { TopBar } from './TopBar';
import { MiniMap } from './MiniMap';
import { SceneStage } from './SceneStage';
import { NotebookPanel } from './NotebookPanel';
import { NoAgentBanner } from './NoAgentBanner';
import { AccuseDialog } from './AccuseDialog';
import { VerdictView } from './VerdictView';
import { RecapView } from './RecapView';
import { TutorialChips } from './TutorialChips';
import { HearingPanel } from './HearingPanel';
import { Home } from './Home';
import { Intro, introSeen } from './Intro';
import { Dossier } from './Dossier';
function useHash() { const [h, setH] = React.useState(location.hash); React.useEffect(() => { const f = () => setH(location.hash); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f); }, []); return h; }
export function App() {
  useWebmcpRoot();
  const hash = useHash(); const state = useGame((s) => s.state); const hydrate = useGame((s) => s.hydrate);
  React.useEffect(() => { hydrate(); }, [hydrate]);
  const [accuseOpen, setAccuseOpen] = React.useState(false); const nbOpen = useGame((s) => s.notebookOpen);
  const episode = useGame((s) => s.episode); const epId = episode?.id ?? null;
  const [introOpen, setIntroOpen] = React.useState(false); const [crewOpen, setCrewOpen] = React.useState(false);
  React.useEffect(() => { if (epId && !introSeen(epId)) setIntroOpen(true); }, [epId]);
  if (hash.startsWith('#/recap/')) return <div className="center-wrap"><RecapView code={hash.slice(8)} /></div>;
  if (hash.startsWith('#/play') && state) {
    return (
      <>
        <TopBar onAccuse={() => setAccuseOpen(true)} onCaseFile={() => setIntroOpen(true)} onCrew={() => setCrewOpen((v) => !v)} />
        <NoAgentBanner />
        <main className={'play' + (nbOpen ? '' : ' nb-closed')}><div className="stage-col"><SceneStage /><MiniMap /><HearingPanel /></div>{nbOpen && <NotebookPanel />}</main>
        <TutorialChips />
        <AccuseDialog open={accuseOpen} onClose={() => setAccuseOpen(false)} />
        <VerdictView />
        {crewOpen && <Dossier onClose={() => setCrewOpen(false)} />}
        {introOpen && episode && <Intro episode={episode} onClose={() => setIntroOpen(false)} />}
      </>
    );
  }
  return <div className="center-wrap"><Home /></div>;
}
