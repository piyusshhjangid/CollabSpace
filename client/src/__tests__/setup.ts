const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
};

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    value: createStorageMock(),
    writable: true,
  });
}

if (!globalThis.sessionStorage) {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: createStorageMock(),
    writable: true,
  });
}

if (!globalThis.window) {
  Object.defineProperty(globalThis, "window", {
    value: globalThis,
    writable: true,
  });
}

if (!globalThis.dispatchEvent) {
  globalThis.dispatchEvent = () => true;
}

if (!globalThis.CustomEvent) {
  class MockCustomEvent extends Event {
    detail: unknown;
    constructor(type: string, params?: { detail?: unknown }) {
      super(type);
      this.detail = params?.detail;
    }
  }
  Object.defineProperty(globalThis, "CustomEvent", {
    value: MockCustomEvent,
    writable: true,
  });
}
