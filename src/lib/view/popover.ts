import {
  autoUpdate,
  computePosition,
  type Middleware,
  type Placement,
  type ReferenceElement,
} from "@floating-ui/dom";

export function PopoverView({
  icon,
  placement,
  middleware,
}: {
  icon: SVGElement;
  placement: Placement;
  middleware?: Middleware[];
}) {
  const button = document.createElement("button");
  button.type = "button";
  button.append(icon);
  button.style.position = "absolute";
  button.style.display = "none";
  button.style.zIndex = "2147483647";

  const popover = document.createElement("div");
  popover.style.position = "absolute";
  popover.popover = "auto";
  popover.style.zIndex = "2147483647";

  button.popoverTargetElement = popover;
  button.popoverTargetAction = "toggle";

  button.addEventListener("click", () => {
    button.style.display = "none";
  });

  let reference: ReferenceElement | null = null;
  let cleanup: (() => void) | null = null;

  function updateButtonPosition() {
    if (!reference) return;

    computePosition(reference, button, {
      placement,
      middleware,
      strategy: "absolute",
    }).then(({ x, y }) => {
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
    });
  }

  function updatePopoverPosition() {
    if (!reference) return;

    computePosition(reference, popover, {
      placement,
      middleware,
      strategy: "absolute",
    }).then(({ x, y }) => {
      popover.style.left = `${x}px`;
      popover.style.top = `${y}px`;
    });
  }

  function startAutoUpdate() {
    if (!reference) return;

    cleanup?.();
    cleanup = autoUpdate(reference, popover, updatePopoverPosition);
  }

  function stopAutoUpdate() {
    cleanup?.();
    cleanup = null;
  }

  function show(newReference: ReferenceElement) {
    reference = newReference;
    updateButtonPosition();
    button.style.display = "";
  }

  function hide() {
    button.style.display = "none";
  }

  function handleOutsideClick(e: MouseEvent) {
    const path = e.composedPath();
    if (path.includes(button) || path.includes(popover)) return;
    hide();
  }
  document.addEventListener("mousedown", handleOutsideClick);

  popover.addEventListener("beforetoggle", () => {
    updatePopoverPosition();
    startAutoUpdate();
  });

  popover.addEventListener("toggle", () => {
    if (!popover.matches(":popover-open")) {
      stopAutoUpdate();
    }
  });

  function destroy() {
    stopAutoUpdate();
    document.removeEventListener("mousedown", handleOutsideClick);
    button.remove();
    popover.remove();
  }

  return {
    button,
    popover,
    show,
    hide,
    destroy,
  };
}
