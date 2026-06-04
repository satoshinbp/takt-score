// Node 25 ships an experimental WebStorage that exposes a non-functional
// `localStorage`/`sessionStorage` global when `--localstorage-file` is missing,
// which shadows happy-dom's implementations. Replace them with a working
// in-memory polyfill for tests.

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const install = (target: object) => {
  Object.defineProperty(target, "localStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
  Object.defineProperty(target, "sessionStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
};

install(globalThis);
if (typeof window !== "undefined") install(window);
