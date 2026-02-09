import { api } from "@lib/api";
import type { DictionaryEntry } from "@lib/model";

function detectLocale(): string | undefined {
  return document.documentElement.lang?.split("-")[0] || navigator.language?.split("-")[0];
}

function boldSelectedWordInSentence(sentence: string, selectedText: string): string {
  const index = sentence.indexOf(selectedText);
  if (index === -1) return sentence;

  return `${sentence.slice(0, index)}**${selectedText}**${sentence.slice(index + selectedText.length)}`;
}

class AnkiLexContent {
  private popup: HTMLIFrameElement | null = null;
  private popupVisible = false;
  private lookupIcon: HTMLDivElement | null = null;
  private selectedWord = "";
  private currentContext = "";

  constructor() {
    this.init();

    // Persistent message listener for iframe communications
    window.addEventListener("message", (event) => {
      if (event.data.action === "hide") {
        this.hidePopup();
      } else if (event.data.action === "add-to-anki") {
        this.handleAddToAnki(event.data.defIndex, event.data.context);
      }
    });
  }

  private init() {
    console.log("AnkiLex Content script initializing");

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Listen for text selection
    document.addEventListener("mouseup", (e) => this.onMouseUp(e));
    document.addEventListener("mousedown", (e) => this.onMouseDown(e));

    // Listen for clicks outside
    document.addEventListener("mousedown", (e) => {
      const target = e.target;
      // Ensure target is a valid Node before checking contains
      if (!target || !(target instanceof Node)) return;

      if (this.popupVisible && this.popup && !this.popup.contains(target)) {
        this.hidePopup();
      }
      if (this.lookupIcon && !this.lookupIcon.contains(target)) {
        this.hideIcon();
      }
    });
  }

  private onMouseDown(e: MouseEvent) {
    // If we click inside the popup or icon, don't do anything special here
    if (this.popup?.contains(e.target as Node)) return;
    if (this.lookupIcon?.contains(e.target as Node)) return;
  }

  private async onMouseUp(_: MouseEvent) {
    setTimeout(async () => {
      const sel = window.getSelection();
      if (!sel?.rangeCount) return;

      const word = sel.toString().trim();
      if (!word || word.length > 100) return;

      const range = sel.getRangeAt(0);
      const sentence = this.extractSentenceFromSelection(range, word);
      if (!sentence) return;

      this.selectedWord = word;
      this.currentContext = boldSelectedWordInSentence(sentence, word);

      api.settings.get().then((settings) => {
        if (!settings?.autoLookup) return;
      });

      const { right, bottom } = range.getBoundingClientRect();
      this.showIcon(right + window.scrollX, bottom + window.scrollY);
    }, 10);
  }

  private extractSentenceFromSelection(range: Range, word: string): string | null {
    const el =
      (range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as Element)) ?? null;
    const block = el?.closest("p, div, li, blockquote");
    if (!block) return null;

    const text = block.textContent ?? "";
    const seg = new Intl.Segmenter(detectLocale(), { granularity: "sentence" });
    return (
      [...seg.segment(text)].map((s) => s.segment).find((s) => s.includes(word)) || text
    ).trim();
  }

  private showIcon(x: number, y: number) {
    if (!this.lookupIcon) {
      this.createIcon();
    }
    if (!this.lookupIcon) return;

    this.lookupIcon.style.left = `${x + 5}px`;
    this.lookupIcon.style.top = `${y + 5}px`;
    this.lookupIcon.style.display = "flex";
    this.lookupIcon.classList.add("visible");
  }

  private hideIcon() {
    if (this.lookupIcon) {
      this.lookupIcon.classList.remove("visible");
      setTimeout(() => {
        if (!this.lookupIcon?.classList.contains("visible")) {
          this.lookupIcon!.style.display = "none";
        }
      }, 200);
    }
  }

  private createIcon() {
    this.lookupIcon = document.createElement("div");
    this.lookupIcon.id = "ankilex-lookup-icon";

    // AnkiLex Logo (Minimal version)
    this.lookupIcon.innerHTML = `<span class="icon search"></span>`;

    // Inject styles for the icon
    const style = document.createElement("style");
    style.textContent = `
      #ankilex-lookup-icon {
        position: absolute;
        width: 28px;
        height: 28px;
        background: #3584e4;
        color: white;
        border-radius: 8px;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 2147483646;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        transition: transform 0.2s, opacity 0.2s;
        opacity: 0;
        transform: scale(0.8);
      }
      #ankilex-lookup-icon.visible {
        opacity: 1;
        transform: scale(1);
      }
      #ankilex-lookup-icon:hover {
        background: #1b66c9;
        transform: scale(1.1);
      }
      #ankilex-lookup-icon .icon {
        width: 16px;
        height: 16px;
        display: inline-block;
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        background-color: currentColor;
      }
      #ankilex-lookup-icon .icon.search {
        mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3E%3C/svg%3E");
      }
    `;
    document.head.appendChild(style);

    this.lookupIcon.onmousedown = (e) => {
      e.stopPropagation();
      // Don't prevent default here, or we might block click?
      // Actually usually safe to stop prop on mousedown to hide from parent.
    };

    this.lookupIcon.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.showPopup(this.selectedWord, this.currentContext, e.clientX, e.clientY);
      this.hideIcon();
    };

    document.body.appendChild(this.lookupIcon);
  }

  private async showPopup(word: string, context: string, x?: number, y?: number) {
    if (!this.popup) {
      this.createPopup();
    }

    if (!this.popup) return;

    // Reset visibility before calculating position to ensure measurements work if needed,
    // though for fixed positioning it's less critical, but good for display: block.
    this.popup.style.display = "block";
    this.popup.style.visibility = "hidden"; // Keep hidden while positioning

    if (x !== undefined && y !== undefined) {
      const popupWidth = 400;
      const popupHeight = 300;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Initial position (offset from cursor)
      let left = x + 10;
      let top = y + 10;

      // Adjust horizontal position if it overflows right edge
      if (left + popupWidth > viewportWidth) {
        // Try placing to the left of the cursor
        left = x - popupWidth - 10;
      }
      // If still off-screen (e.g. very narrow window), pin to right edge
      if (left < 0) left = 10; // Pin to left edge with padding
      if (left + popupWidth > viewportWidth) left = viewportWidth - popupWidth - 10;

      // Adjust vertical position if it overflows bottom edge
      if (top + popupHeight > viewportHeight) {
        // Try placing above the cursor
        top = y - popupHeight - 10;
      }
      // If placing above overflows top edge
      if (top < 0) {
        // If there's more space below than above, place below, otherwise pin to top
        if (y < viewportHeight / 2) {
          top = y + 10;
          // If still overflowing bottom, max-height might be needed (handled by CSS/Scss if we add it)
        } else {
          top = 10; // Pin to top edge
        }
      }

      this.popup.style.left = `${left + window.scrollX}px`;
      this.popup.style.top = `${top + window.scrollY}px`;
      this.popup.style.transform = "none"; // Reset any center transform
    } else {
      // Default position (center)
      this.popup.style.left = `${window.scrollX + window.innerWidth / 2}px`;
      this.popup.style.top = `${window.scrollY + window.innerHeight / 2}px`;
      this.popup.style.transform = "translate(-50%, -50%)";
    }

    this.popup.style.visibility = "visible";
    this.popupVisible = true;

    try {
      const response = await api.dictionary.lookup(word);
      if (response) {
        this.updatePopupContent(context, response);
      }
    } catch (error) {
      console.error("Lookup failed", error);
    }
  }

  private hidePopup() {
    if (this.popup) {
      this.popup.style.display = "none";
      this.popupVisible = false;
    }
  }

  private createPopup() {
    this.popup = document.createElement("iframe");
    this.popup.id = "ankilex-popup";
    this.popup.src = chrome.runtime.getURL("src/app/content/frame.html");
    this.popup.style.position = "absolute";
    this.popup.style.zIndex = "2147483647";
    this.popup.style.width = "400px";
    this.popup.style.height = "600px"; // Increased height to accommodate editor and results
    this.popup.style.display = "none";
    this.popup.style.border = "none";
    this.popup.style.borderRadius = "12px";
    this.popup.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";

    document.body.appendChild(this.popup);

    // Stop propagation of mousedown from the iframe container itself
    // Note: events inside the iframe document are separate, but events on the iframe element bubble in parent
    this.popup.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
  }

  private handleMessage(
    message: { action: string; data: any },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) {
    if (message.action === "show-lookup") {
      const word = message.data.word;
      this.showPopup(word, message.data.context || "");
    }
    sendResponse({ success: true });
  }

  private currentResult: DictionaryEntry | null = null;

  private updatePopupContent(context: string, result: DictionaryEntry) {
    this.currentResult = result;
    if (!this.popup) return;

    // Send data to iframe
    this.popup.contentWindow?.postMessage(
      {
        action: "update",
        data: {
          result: result,
          context: context,
        },
      },
      "*",
    );
  }

  private async handleAddToAnki(defIndex: number, contextNote?: string) {
    // Ignore index as we only have one result now
    const result = this.currentResult;
    if (!result) return;

    try {
      await api.anki.createNoteFromResult({
        result,
        defIndex,
        context: contextNote,
      });

      // Success feedback to iframe
      this.popup?.contentWindow?.postMessage({ action: "anki-added", defIndex }, "*");
    } catch (error: unknown) {
      console.error("AnkiLex: Failed to add to Anki", error);
      // Error feedback to iframe
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.popup?.contentWindow?.postMessage(
        {
          action: "anki-error",
          defIndex,
          error: errorMessage,
        },
        "*",
      );
    }
  }
}

// Instantiate content script logic
new AnkiLexContent();
