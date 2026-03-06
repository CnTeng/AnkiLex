export interface ViewSwitchInstance<T extends string> {
  element: HTMLDivElement;
  setState: (state: T, content?: HTMLElement) => void;
  getState: () => T;
}

export function ViewSwitch<T extends string>({
  doc = document,
  className,
  states,
  initial,
}: {
  doc?: Document;
  className?: string;
  states: Map<T, HTMLElement>;
  initial: T;
}): ViewSwitchInstance<T> {
  const container = doc.createElement("div");
  if (className) container.className = className;

  let current = initial;
  states.forEach((node) => {
    node.hidden = true;
    container.append(node);
  });

  const node = states.get(current);
  if (node) node.hidden = false;

  function setState(next: T, content?: HTMLElement) {
    const prev = states.get(current);
    if (prev) prev.hidden = true;

    if (content) {
      const existing = states.get(next);
      if (existing) existing.remove();
      states.set(next, content);
      container.append(content);
    }

    const nextNode = states.get(next);
    if (nextNode) nextNode.hidden = false;

    current = next;
  }

  return {
    element: container,
    setState,
    getState: () => current,
  };
}
