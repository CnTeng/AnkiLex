import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
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
  private currentResult: DictionaryEntry | null = null;
  private cleanupPosition: (() => void) | null = null;

  private lookupIcon: HTMLDivElement | null = null;
  private selectedWord = "";
  private currentContext = "";

  constructor() {
    this.init();

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

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    document.addEventListener("mouseup", (e) => this.onMouseUp(e));
    document.addEventListener("mousedown", (e) => this.onMouseDown(e));

    document.addEventListener("mousedown", (e) => {
      const target = e.target;
      if (!target || !(target instanceof Node)) return;

      if (this.popupVisible && this.popup && !this.popup.contains(target)) {
        this.hidePopup();
      }
      if (this.lookupIcon && !this.lookupIcon.contains(target)) {
        this.hideIcon();
      }
    });
  }

  private async showPopup(word: string, context: string, x?: number, y?: number) {
    if (!this.popup) {
      this.createPopup();
    }

    if (!this.popup) return;

    this.popup.style.display = "block";
    this.popup.style.visibility = "visible";

    if (this.cleanupPosition) {
      this.cleanupPosition();
      this.cleanupPosition = null;
    }

    if (x !== undefined && y !== undefined) {
      const virtualElement = {
        getBoundingClientRect() {
          return {
            width: 0,
            height: 0,
            x: x,
            y: y,
            top: y,
            left: x,
            right: x,
            bottom: y,
          };
        },
      };

      this.cleanupPosition = autoUpdate(virtualElement, this.popup, () => {
        if (!this.popup) return;

        computePosition(virtualElement, this.popup!, {
          placement: "bottom-start",
          strategy: "absolute",
          middleware: [
            offset(10), // Space between cursor and popup
            flip(), // Flip to top if bottom overflows
            shift({ padding: 10 }), // Shift to keep in view
          ],
        }).then(({ x, y }) => {
          Object.assign(this.popup!.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        });
      });

      this.popup.style.transform = "none";
    } else {
      this.popup.style.left = "50%";
      this.popup.style.top = "50%";
      this.popup.style.transform = "translate(-50%, -50%)";
    }
    this.popupVisible = true;

    try {
      const response = await api.dictionary.lookup(word);
      if (response) {
        this.updateContent(context, response);
      }
    } catch (error: any) {
      console.error("Lookup failed", error);
    }
  }

  private hidePopup() {
    if (this.popup) {
      this.popup.style.display = "none";
      this.popupVisible = false;
      if (this.cleanupPosition) {
        this.cleanupPosition();
        this.cleanupPosition = null;
      }
    }
  }

  private createPopup() {
    this.popup = document.createElement("iframe");
    this.popup.id = "ankilex-popup";
    this.popup.src = chrome.runtime.getURL("src/app/content/frame.html");
    this.popup.style.position = "absolute";
    this.popup.style.zIndex = "2147483647";
    this.popup.style.width = "400px";
    this.popup.style.height = "600px";
    this.popup.style.display = "none";
    this.popup.style.border = "none";
    this.popup.style.borderRadius = "12px";
    this.popup.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";

    document.body.appendChild(this.popup);

    this.popup.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });
  }

  private updateContent(context: string, result: DictionaryEntry) {
    this.currentResult = result;
    if (!this.popup) return;

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
    const result = this.currentResult;
    if (!result) return;

    try {
      await api.anki.createNoteFromResult({
        result,
        defIndex,
        context: contextNote,
      });

      this.popup?.contentWindow?.postMessage({ action: "anki-added", defIndex }, "*");
    } catch (error: unknown) {
      console.error("AnkiLex: Failed to add to Anki", error);
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

  private onMouseDown(e: MouseEvent) {
    if (this.popupVisible && this.popup && this.popup.contains(e.target as Node)) return;
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

    this.lookupIcon.innerHTML = `<span class="icon search"></span>`;

    this.lookupIcon.onmousedown = (e) => {
      e.stopPropagation();
    };

    this.lookupIcon.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.showPopup(this.selectedWord, this.currentContext, e.clientX, e.clientY);
      this.hideIcon();
    };

    document.body.appendChild(this.lookupIcon);
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
}

// Instantiate content script logic
new AnkiLexContent();
