import { describe, it, expect, beforeEach } from 'vitest';
import { Registry } from '../src/webmcp/registry';
import type { ToolDef } from '../src/webmcp/registry';

type Deferred = { resolve: () => void; reject: (e: Error) => void };
function fakeMC() {
  const calls: { name: string; schema: unknown; signal: AbortSignal }[] = [];
  const pending: Deferred[] = [];
  let behavior: (name: string, schema: unknown) => 'ok' | 'defer' | Error = () => 'ok';
  const mc = {
    registerTool: (t: any, o: { signal: AbortSignal }) => {
      calls.push({ name: t.name, schema: t.inputSchema, signal: o.signal });
      const b = behavior(t.name, t.inputSchema);
      if (b === 'ok') return Promise.resolve();
      if (b === 'defer') return new Promise<void>((resolve, reject) => pending.push({ resolve, reject }));
      return Promise.reject(b);
    },
  };
  (document as any).modelContext = mc;
  return { calls, pending, setBehavior: (b: typeof behavior) => { behavior = b; } };
}
const tool = (name: string): ToolDef => ({ name, description: 'd', inputSchema: { type: 'object' }, execute: async () => ({}) });
const err = (name: string) => Object.assign(new Error(name), { name });

describe('Registry.apply', () => {
  let counts: number[]; let logs: string[]; let reg: Registry;
  beforeEach(() => { counts = []; logs = []; reg = new Registry((n) => counts.push(n), (m) => logs.push(m)); });

  it('commits key/count only when every tool registered; partial failure rolls back to 0 and allows retry', async () => {
    const f = fakeMC();
    f.setBehavior((name) => (name === 'b' ? err('InvalidStateError') : 'ok'));
    await reg.apply('edit', [tool('a'), tool('b'), tool('c')]);
    expect(counts.at(-1)).toBe(0); expect(f.calls[0].signal.aborted).toBe(true);
    expect(logs.some((m) => /rolled back/.test(m))).toBe(true);
    f.setBehavior(() => 'ok');
    await reg.apply('edit', [tool('a'), tool('b'), tool('c')]);
    expect(counts.at(-1)).toBe(3);
  });
  it('retries with a string schema only on TypeError', async () => {
    const f = fakeMC();
    f.setBehavior((_n, schema) => (typeof schema === 'string' ? 'ok' : err('TypeError')));
    await reg.apply('edit', [tool('a')]);
    expect(counts.at(-1)).toBe(1); expect(typeof f.calls[1].schema).toBe('string');
    const g = fakeMC(); const reg2 = new Registry((n) => counts.push(n), (m) => logs.push(m));
    g.setBehavior(() => err('NotAllowedError'));
    await reg2.apply('edit', [tool('a')]);
    expect(counts.at(-1)).toBe(0); expect(g.calls).toHaveLength(1);
  });
  it('force re-applies the same key after a rollback (fixed-fallback recovery path)', async () => {
    let failOnce = true;
    const registered: { name: string; signal: AbortSignal }[] = [];
    (document as any).modelContext = {
      registerTool: async (t: any, o: { signal: AbortSignal }) => {
        if (failOnce && t.name === 'b') { failOnce = false; const e = new Error('duplicate'); e.name = 'InvalidStateError'; throw e; }
        registered.push({ name: t.name, signal: o.signal });
      },
    };
    const c2: number[] = [];
    const r = new Registry((n) => c2.push(n));
    const tools = [tool('a'), tool('b')];
    await r.apply('fixed', tools);
    expect(c2.at(-1)).toBe(0);
    await r.apply('fixed', tools, { force: true });
    expect(c2.at(-1)).toBe(2);
    expect(registered.filter((x) => !x.signal.aborted).map((x) => x.name)).toEqual(['a', 'b']);
    await r.apply('fixed', tools);                        // committed key, no force → no-op
    expect(registered.filter((x) => !x.signal.aborted)).toHaveLength(2);
  });
  it('a late-failing older generation never overwrites a newer committed set', async () => {
    const f = fakeMC();
    f.setBehavior((name) => (name === 'slow' ? 'defer' : 'ok'));
    const p1 = reg.apply('edit', [tool('slow')]);
    f.setBehavior(() => 'ok');
    await reg.apply('present', [tool('p1'), tool('p2')]);
    expect(counts.at(-1)).toBe(2);
    f.pending[0].reject(err('AbortError'));
    await p1;
    expect(counts.at(-1)).toBe(2);
    await reg.apply('present', [tool('p1'), tool('p2')]);
    expect(f.calls.filter((c) => c.name === 'p1')).toHaveLength(1);
  });
});
