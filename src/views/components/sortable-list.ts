import { GripVertical } from "lucide";
import { cn } from "tailwind-variants";
import { createButton } from "./button";
import { Icon } from "./icon";

const BEFORE_DROP_CLASSES = [
  "before:absolute",
  "before:inset-x-2",
  "before:top-0",
  "before:h-0.5",
  "before:rounded-full",
  "before:bg-[var(--info)]",
  "before:content-['']",
];

const AFTER_DROP_CLASSES = [
  "after:absolute",
  "after:inset-x-2",
  "after:bottom-0",
  "after:h-0.5",
  "after:rounded-full",
  "after:bg-[var(--info)]",
  "after:content-['']",
];

type SortableListOptions<T> = {
  doc?: Document;
  className?: string;
  items: T[];
  getItemId: (item: T) => string;
  onReorder: (itemId: string, targetIndex: number) => void;
  renderItem: (item: T, options: { dragHandle: HTMLButtonElement }) => HTMLElement;
};

export class SortableList<T> {
  readonly element: HTMLDivElement;

  private readonly doc: Document;
  private readonly className?: string;
  private readonly items: T[];
  private readonly getItemId: (item: T) => string;
  private readonly onReorder: (itemId: string, targetIndex: number) => void;
  private readonly renderItemContent: SortableListOptions<T>["renderItem"];
  private draggingItemId: string | null = null;
  private currentDropMarker: HTMLElement | null = null;

  constructor({
    doc = document,
    className,
    items,
    getItemId,
    onReorder,
    renderItem,
  }: SortableListOptions<T>) {
    this.doc = doc;
    this.className = className;
    this.items = items;
    this.getItemId = getItemId;
    this.onReorder = onReorder;
    this.renderItemContent = renderItem;

    this.element = this.doc.createElement("div");
    this.render();
  }

  private render() {
    this.element.className = cn(this.className ?? "space-y-2") as string;
    this.element.replaceChildren(...this.items.map((item) => this.createItem(item)));
  }

  private createItem(item: T) {
    const itemId = this.getItemId(item);
    const row = this.doc.createElement("div");
    row.dataset.itemId = itemId;
    row.dataset.dragging = "false";
    row.className = cn(
      "relative rounded-lg transition-[transform,box-shadow,opacity] data-[dragging=true]:scale-[0.99] data-[dragging=true]:opacity-60",
    ) as string;

    const dragHandle = createButton({
      doc: this.doc,
      title: "Drag to reorder",
      variant: "ghost",
      size: "iconSm",
      className:
        "text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none",
    });
    dragHandle.draggable = true;
    dragHandle.setAttribute("aria-label", "Drag to reorder");
    dragHandle.append(
      new Icon({
        doc: this.doc,
        iconNode: GripVertical,
        customAttrs: { width: 16, height: 16 },
      }).element,
    );

    dragHandle.addEventListener("dragstart", (event) => {
      this.draggingItemId = itemId;
      row.dataset.dragging = "true";
      event.dataTransfer?.setData("text/plain", itemId);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    });

    dragHandle.addEventListener("dragend", () => {
      this.draggingItemId = null;
      row.dataset.dragging = "false";
      this.clearDropMarker();
      this.clearDraggingState();
    });

    row.addEventListener("dragover", (event) => {
      if (!this.draggingItemId || this.draggingItemId === itemId) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      this.setDropMarker(row, this.getPlacement(row, event.clientY));
    });

    row.addEventListener("dragleave", (event) => {
      if (!row.contains(event.relatedTarget as Node | null)) this.clearDropMarker();
    });

    row.addEventListener("drop", (event) => {
      if (!this.draggingItemId || this.draggingItemId === itemId) return;
      event.preventDefault();
      const placement = this.getPlacement(row, event.clientY);
      const rowIndex = this.items.findIndex((entry) => this.getItemId(entry) === itemId);
      const targetIndex = rowIndex + (placement === "after" ? 1 : 0);
      this.clearDropMarker();
      this.clearDraggingState();
      this.onReorder(this.draggingItemId, targetIndex);
    });

    row.append(
      this.renderItemContent(item, {
        dragHandle,
      }),
    );

    return row;
  }

  private getPlacement(row: HTMLElement, clientY: number) {
    const { top, height } = row.getBoundingClientRect();
    return clientY < top + height / 2 ? "before" : "after";
  }

  private setDropMarker(row: HTMLElement, placement: "before" | "after") {
    this.clearDropMarker();
    this.currentDropMarker = row;
    row.dataset.drop = placement;
    row.classList.add(...(placement === "before" ? BEFORE_DROP_CLASSES : AFTER_DROP_CLASSES));
  }

  private clearDropMarker() {
    if (!this.currentDropMarker) return;
    this.currentDropMarker.classList.remove(...BEFORE_DROP_CLASSES, ...AFTER_DROP_CLASSES);
    delete this.currentDropMarker.dataset.drop;
    this.currentDropMarker = null;
  }

  private clearDraggingState() {
    this.element.querySelectorAll<HTMLElement>("[data-dragging='true']").forEach((element) => {
      element.dataset.dragging = "false";
    });
  }
}
