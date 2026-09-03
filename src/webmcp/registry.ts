import type { ExecuteOptions } from './normalize';
export interface ToolDef { name: string; description: string; inputSchema: Record<string, unknown>; annotations?: { readOnlyHint?: boolean }; execute: (raw: unknown, options?: ExecuteOptions) => Promise<unknown>; }
type MC = { registerTool: (t: unknown, o?: { signal: AbortSignal }) => Promise<void> | void };
function mc(): MC | null {
  const m = (document as unknown as { modelContext?: Partial<MC> }).modelContext;
  return m && typeof m.registerTool === 'function' ? (m as MC) : null;
}

export class Registry {
  private ac: AbortController | null = null;
  private key = '';          // commit된 key만 저장 — 실패한 apply는 commit하지 않는다
  private generation = 0;    // latest-wins
  constructor(private onCount: (n: number) => void, private onLog?: (msg: string) => void) {}
  available(): boolean { return mc() !== null; }
  async apply(key: string, tools: ToolDef[], opts: { force?: boolean } = {}): Promise<void> {
    if (key === this.key && !opts.force) return;
    const gen = ++this.generation;
    const m = mc();
    if (!m) { this.key = key; this.onCount(0); return; }
    this.ac?.abort();
    const ac = new AbortController();
    this.ac = ac;
    let n = 0;
    for (const t of tools) {
      if (gen !== this.generation) { ac.abort(); return; }
      const def = { name: t.name, description: t.description, inputSchema: t.inputSchema, annotations: t.annotations, execute: t.execute };
      try { await m.registerTool(def, { signal: ac.signal }); n++; continue; }
      catch (e) {
        const err = e as Error;
        if (err?.name !== 'TypeError') { this.rollback(gen, ac, `${t.name}: registerTool ${err?.name}: ${err?.message} (no retry)`); return; }
        try { await m.registerTool({ ...def, inputSchema: JSON.stringify(t.inputSchema) }, { signal: ac.signal }); n++; this.onLog?.(`${t.name}: registered with string schema (legacy)`); }
        catch (e2) { this.rollback(gen, ac, `${t.name}: registerTool failed after string-schema retry: ${(e2 as Error).message}`); return; }
      }
    }
    if (gen !== this.generation) { ac.abort(); return; }
    this.key = key;
    this.onCount(n);
    this.onLog?.(`tools for ${key}: ${n}`);
  }
  private rollback(gen: number, ac: AbortController, why: string): void {
    ac.abort();
    if (gen !== this.generation || ac !== this.ac) return;
    this.key = '';
    this.onCount(0);
    this.onLog?.(`${why} — tool set rolled back to 0; use "Retry site tools" or change mode to re-register`);
  }
}
