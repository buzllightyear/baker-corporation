import { useWebmcpStatus } from '../webmcp/useWebmcp';
import { useLang, T } from '../i18n/lang';
export function NoAgentBanner() {
  const { available } = useWebmcpStatus(); const lang = useLang((s) => s.lang);
  if (available) return null;
  return <div className="banner">{T.noAgent[lang]}</div>;
}
