// Node ≥22 ships a global `localStorage` stub without Storage methods that shadows jsdom's — install an in-memory one for every test.
import { beforeEach, vi } from 'vitest';
function memStorage(): Storage {
  let m = new Map<string, string>();
  return { get length() { return m.size; }, clear: () => { m = new Map(); }, getItem: (k) => (m.has(k) ? m.get(k)! : null), key: (i) => [...m.keys()][i] ?? null, removeItem: (k) => { m.delete(k); }, setItem: (k, v) => { m.set(k, String(v)); } };
}
beforeEach(() => { vi.stubGlobal('localStorage', memStorage()); });
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(() => cleanup());
