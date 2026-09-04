import { useWebmcpStatus } from '../webmcp/useWebmcp';
import { useLang, T } from '../i18n/lang';
export function NoAgentBanner() {
  const { available, failed } = useWebmcpStatus(); const lang = useLang((s) => s.lang);
  if (failed) return <div className="banner warn"><span className="mono k">TOOL FAULT</span> {T.toolsFailed[lang]} <button onClick={() => location.reload()}>{T.reload[lang]}</button></div>;
  if (available) return null;
  return <div className="banner"><span className="mono k">NO UNIT LINK</span> {T.noAgent[lang]}</div>;
}
