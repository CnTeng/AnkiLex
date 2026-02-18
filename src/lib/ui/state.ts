export type ViewState = "empty" | "loading" | "error" | "content";

export interface StateViewOptions {
  empty: HTMLElement;
  loading: HTMLElement;
  error: HTMLElement;
  content: HTMLElement;
  initialState?: ViewState;
}

export interface StateViewInstance {
  element: HTMLDivElement;
  setState: (state: ViewState, message?: string) => void;
  getState: () => ViewState;
}

export function StateView(options: StateViewOptions): StateViewInstance {
  const { empty, loading, error, content, initialState = "empty" } = options;

  let current: ViewState = initialState;

  const container = document.createElement("div");
  container.className = "flex flex-1 flex-col min-h-0 overflow-hidden";

  const states = new Map<ViewState, HTMLElement>([
    ["empty", empty],
    ["loading", loading],
    ["error", error],
    ["content", content],
  ]);

  for (const node of states.values()) {
    node.classList.add("hidden");
    container.appendChild(node);
  }

  states.get(initialState)?.classList.remove("hidden");

  function setState(next: ViewState, message?: string) {
    if (current === next) return;

    states.get(current)?.classList.add("hidden");

    states.get(next)?.classList.remove("hidden");

    if (next === "error" && message) {
      const p = states.get("error")?.querySelector("p");
      if (p) p.textContent = message;
    }

    current = next;
  }

  function getState() {
    return current;
  }

  return {
    element: container,
    setState,
    getState,
  };
}

export function createEmpty(): HTMLDivElement {
  const el = document.createElement("div");
  el.className =
    "flex flex-1 flex-col items-center justify-center p-10 text-center text-gray-400 dark:text-gray-500";

  el.innerHTML = `
    <div class="mb-3 text-3xl opacity-40">📘</div>
    <p class="text-sm">Enter a word to start searching</p>
  `;

  return el;
}

export function createLoading(): HTMLDivElement {
  const el = document.createElement("div");
  el.className =
    "flex flex-1 flex-col items-center justify-center p-10 text-gray-500 dark:text-gray-400";

  el.innerHTML = `
    <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-blue-900"></div>
    <p class="mt-4 text-sm">Looking up...</p>
  `;

  return el;
}

export function createError(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "flex flex-1 flex-col items-center justify-center p-10 text-center";

  el.innerHTML = `
    <div class="mb-3 text-3xl text-red-400">⚠️</div>
    <p class="text-sm text-red-500"></p>
  `;

  return el;
}
