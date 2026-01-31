/// <reference types="zotero-types" />

// Global Zotero object is available in the bootstrap scope
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Zotero: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Components: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Services: any;

// @ts-expect-error
import popupStyles from "@/app/popup/popup.scss?inline";

// Minimal interface for the Zotero MainWindow to avoid complex type issues for now
interface ZoteroWindow extends Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Zotero: any;
  document: Document;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const globalThis: any;

class AnkiLexZotero {
  private _windows: Set<Window> = new Set();
  private _notifierID: number | null = null;
  // @ts-expect-error
  private _id = "ankilex-zotero";
  private _strings: Record<string, string> = {
    "ankilex.menu.settings": "AnkiLex Settings",
    "ankilex.menu.lookup": "Look up in AnkiLex",
  };

  constructor() {
    this.log("Initializing AnkiLexZotero");
  }

  public install() {
    this.log("Installed");
  }

  public async startup(
    // @ts-expect-error
    { id, version, rootURI }: { id: string; version: string; rootURI: string },
  ) {
    this.log("Starting up...");

    // Process existing windows
    // @ts-expect-error
    const windows = Zotero.getMainWindowIterator();
    while (windows.hasMore()) {
      this.addToWindow(windows.getNext());
    }

    // Listen for new windows
    // @ts-expect-error
    this._notifierID = Zotero.Events.on("window-opened", (event: { window: Window }) => {
      this.addToWindow(event.window);
    });

    this.log("Startup complete");
  }

  public shutdown() {
    this.log("Shutting down...");

    if (this._notifierID) {
      // Zotero 7 API style removal might be different, but for now assuming event removal
      // Actually Zotero.Events.on returns an ID or remover in newer versions,
      // but if it's the older observer style we'd need Services.wm.
      // In Zotero 7+ standard way is usually just handling the windows we tracked.
      // But let's try to remove the listener if possible or just ignore if global.
      // If `on` returned a remover function, call it.
      // If we can't remove, we just ensure our window cleanup handles everything.
    }

    // Remove from all tracked windows
    const windows = Array.from(this._windows);
    for (const win of windows) {
      this.removeFromWindow(win);
    }
    this._windows.clear();

    this.log("Shutdown complete");
  }

  public uninstall() {
    this.log("Uninstalled");
  }

  private addToWindow(window: Window) {
    if (this._windows.has(window)) return;
    this._windows.add(window);

    // Wait for window to load if it hasn't
    if (window.document.readyState === "complete") {
      this.injectUI(window);
    } else {
      window.addEventListener(
        "load",
        () => {
          this.injectUI(window);
        },
        { once: true },
      );
    }
  }

  private removeFromWindow(window: Window) {
    if (!this._windows.has(window)) return;
    this._windows.delete(window);

    const doc = window.document;

    // Remove Tools Menu item
    const menuitem = doc.getElementById("menu_ankilex_settings");
    if (menuitem) menuitem.remove();

    // Remove PDF Context Menu item
    // We need to look for where we added it.
    // If we added it to the popup, remove it.
    doc.querySelectorAll(".ankilex-context-item").forEach((el) => el.remove());
  }

  private injectUI(window: Window) {
    const doc = window.document;

    // 1. Add Tools Menu Item
    const toolsMenu = doc.getElementById("menu_ToolsPopup");
    if (toolsMenu) {
      // @ts-expect-error
      const menuitem = doc.createXULElement
        ? doc.createXULElement("menuitem")
        : doc.createElement("menuitem");
      menuitem.id = "menu_ankilex_settings";
      menuitem.setAttribute("label", this._strings["ankilex.menu.settings"]);
      menuitem.addEventListener("command", () => {
        this.openSettings(window);
      });
      toolsMenu.appendChild(menuitem);
    }

    // 2. Add Context Menu Item to PDF Reader (or Main Window as fallback)
    // Zotero 7 Reader
    // We need to find the reader element.
    // In Zotero 7, the reader is often in a tab.
    // However, the context menu is usually shared or specific to the view.

    // Try to find the generic content area context menu (often used for PDF reader in Zotero 7)
    // ID is usually 'contentAreaContextMenu' or 'zotero-itemmenu' for the library view.
    // For PDF reader in Zotero 7, it's often an HTML-based reader (PDF.js based).
    // Injection might be tricky without waiting for the reader to load.

    // Let's hook into the global Zotero Reader events if possible, or just add to the known menu
    // "zotero-itemmenu" is for the library list.
    const itemMenu = doc.getElementById("zotero-itemmenu");
    if (itemMenu) {
      // @ts-expect-error
      const itemMenuItem = doc.createXULElement
        ? doc.createXULElement("menuitem")
        : doc.createElement("menuitem");
      itemMenuItem.setAttribute("label", this._strings["ankilex.menu.lookup"]);
      itemMenuItem.className = "ankilex-context-item";
      itemMenuItem.addEventListener("command", () => {
        // Handle lookup for selected item in library
        const items = (Zotero.getActiveZoteroPane() as any).getSelectedItems();
        this.log(`Selected ${items.length} items for lookup`);
      });
      itemMenu.appendChild(itemMenuItem);
    }

    // For PDF Reader Context Menu (Zotero 7)
    // We can try to listen to the 'popupshowing' event on the document to dynamically inject
    // into whatever context menu just popped up, checking if it's the PDF reader one.
    doc.addEventListener("popupshowing", (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      // In Zotero 7, we look for the popup specific to the reader
      // Often identifiable by id or class.
      // For now, let's try to add to any 'contentAreaContextMenu' if we are in a tab that is a reader.

      if (target.id === "contentAreaContextMenu") {
        // Check if we already added it
        if (target.querySelector(".ankilex-pdf-lookup")) return;

        // @ts-expect-error
        const menuItem = doc.createXULElement
          ? doc.createXULElement("menuitem")
          : doc.createElement("menuitem");
        menuItem.setAttribute("label", this._strings["ankilex.menu.lookup"]);
        menuItem.className = "ankilex-context-item ankilex-pdf-lookup";
        menuItem.addEventListener("command", () => {
          this.handleSelectionLookup(window);
        });
        target.appendChild(menuItem);
      }
    });
  }

  private handleSelectionLookup(window: Window) {
    // Get selected text from the focused element or the window selection
    const selection = window.getSelection();
    const text = selection ? selection.toString() : "";

    if (text) {
      this.log(`Looking up: ${text}`);
      this.lookupText(window, text);
    } else {
      this.log("No text selected");
    }
  }

  private lookupText(window: Window, text: string) {
    const doc = window.document;

    // Create or find a container for our popup
    let container = doc.getElementById("ankilex-popup-container");
    if (!container) {
      container = doc.createElement("div");
      container.id = "ankilex-popup-container";
      // Basic positioning for the container - could be improved to be near selection
      container.style.position = "fixed";
      container.style.top = "50px";
      container.style.right = "50px";
      container.style.zIndex = "9999";
      container.style.backgroundColor = "white";
      container.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
      container.style.padding = "10px";
      container.style.borderRadius = "5px";
      container.style.maxWidth = "400px";
      container.style.maxHeight = "600px";
      container.style.overflow = "auto";

      // Add close button
      const closeBtn = doc.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.style.float = "right";
      closeBtn.onclick = () => {
        container?.remove();
      };
      container.appendChild(closeBtn);

      // Inject Styles
      const styleEl = doc.createElement("style");
      styleEl.textContent = popupStyles;
      container.appendChild(styleEl);

      // Content Area
      const contentArea = doc.createElement("div");
      contentArea.id = "ankilex-content";
      container.appendChild(contentArea);

      doc.documentElement.appendChild(container);
    }

    const content = container.querySelector("#ankilex-content");
    if (content) {
      content.textContent = `Looking up: ${text} ... (Implementation pending)`;
      // Here we will eventually mount the Vue app or render the lookup result
    }
  }

  private openSettings(_window: Window) {
    // Open settings dialog
    // window.openDialog("chrome://ankilex/content/settings.xul", "ankilex-settings", "chrome,centerscreen");
    this.log("Settings clicked");
  }

  private log(msg: string) {
    Zotero.debug(`[AnkiLex] ${msg}`);
  }
}

// Instantiate
const plugin = new AnkiLexZotero();

// Export for Zotero's bootstrap loader (via Vite IIFE return)
export function install() {
  plugin.install();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function startup(data: any) {
  plugin.startup(data);
}

export function shutdown() {
  plugin.shutdown();
}

export function uninstall() {
  plugin.uninstall();
}
