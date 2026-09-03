// Node 22+'s built-in globalThis.localStorage (Web Storage API, on by default
// in this Node build) shadows jsdom's window.localStorage with a
// non-functional stub (no getItem/setItem/clear). Tests here rely on a real
// Storage, so install a minimal in-memory polyfill before any test runs.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.has(key) ? this.store.get(key)! : null; }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true, writable: true });
