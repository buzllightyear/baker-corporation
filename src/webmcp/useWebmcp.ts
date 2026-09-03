import React from 'react';
import { useGame } from '../state/store';
import { Registry } from './registry';
import { watsonTools } from './tools';
import { currentLang } from '../i18n/lang';
export function useWebmcpRoot() {
  const ref = React.useRef<Registry | null>(null);
  const episodeId = useGame((s) => s.episode?.id ?? null);
  const setToolCount = useGame((s) => s.setToolCount); const log = useGame((s) => s.log);
  React.useEffect(() => {
    if (!ref.current) ref.current = new Registry(setToolCount, (m) => log({ actor: 'sys', verb: 'webmcp', ok: true, detail: m }));
    if (!episodeId) { void ref.current.apply('none', []); return; }
    const deps = { getState: () => useGame.getState().state!, getEpisode: () => useGame.getState().episode!, dispatch: (c: Parameters<ReturnType<typeof useGame.getState>['dispatch']>[1]) => useGame.getState().dispatch('watson', c), setBusy: (s: string | null) => useGame.getState().setWatsonBusy(s), lang: () => currentLang(), onRead: () => useGame.getState().markWatsonRead() };
    const tools = watsonTools(deps);
    // Test bridge (opt-in, ?bridge=1): exposes the SAME tool objects to page JS so a browser-automation playtester can act as Watson
    // through evaluate(). Nothing extra is exposed — the truth still never leaves the kernel.
    if (typeof location !== 'undefined' && /[?&]bridge=1/.test(location.search)) {
      (window as unknown as { __baker?: unknown }).__baker = { tools: Object.fromEntries(tools.map((t) => [t.name, t])), call: (name: string, args: unknown) => tools.find((t) => t.name === name)?.execute(args ?? {}) };
      log({ actor: 'sys', verb: 'bridge', ok: true, detail: 'window.__baker test bridge enabled' });
    }
    void ref.current.apply(`play:${episodeId}`, tools);
  }, [episodeId, setToolCount, log]);
  return { available: ref.current?.available() ?? typeof (document as unknown as { modelContext?: { registerTool?: unknown } }).modelContext?.registerTool === 'function' };
}
export function useWebmcpStatus() { const count = useGame((s) => s.toolCount); const available = typeof (document as unknown as { modelContext?: { registerTool?: unknown } }).modelContext?.registerTool === 'function'; return { available, count }; }
