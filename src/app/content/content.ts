import { flip, inline, offset, shift } from "@floating-ui/dom";
import { api } from "@lib/api";
import { Icon } from "@lib/components";
import { boldWordInSentence, extractSentence } from "@lib/sentence";
import { PopoverView } from "@lib/view";
import { Search } from "lucide";

import contentStyles from "./content.css?inline";

let selectedWord = "";
let currentContext = "";

const floating = PopoverView({
  icon: Icon({ iconNode: Search }),
  placement: "right-start",
  middleware: [inline(), offset(8), shift({ padding: 8 }), flip()],
});

const container = document.createElement("div");
const shadow = container.attachShadow({ mode: "open" });
const styleElement = document.createElement("style");
styleElement.textContent = contentStyles;
shadow.append(styleElement, floating.button, floating.popover);

document.documentElement.append(container);

floating.button.className = "anki-lex-floating-btn";
floating.button.title = `Search in Anki Lex`;

floating.popover.className = "anki-lex-popover";

const iframe = document.createElement("iframe");
iframe.src = chrome.runtime.getURL("app/content/frame.html");
iframe.className = "anki-lex-frame";
iframe.loading = "lazy";

floating.popover.append(iframe);

function performLookup(word: string, context: string): void {
  api.dictionary
    .lookup(word)
    .then((result) => {
      iframe?.contentWindow?.postMessage({ action: "update", data: { result, context } }, "*");
    })
    .catch((err) => console.error("Lookup failed", err));
}

floating.button.onclick = () => {
  performLookup(selectedWord, currentContext);
};

const handleMouseUp = () => {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return;

  const word = sel.toString().trim();
  if (!word || word.length > 100) return;

  const range = sel.getRangeAt(0);
  const sentence = extractSentence(range, word);
  if (!sentence) return;

  selectedWord = word;
  currentContext = boldWordInSentence(sentence, word);
  floating.show(range);
};

document.addEventListener("mouseup", handleMouseUp);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "show-lookup") {
    selectedWord = message.data.word;
    currentContext = message.data.context || "";
    performLookup(selectedWord, currentContext);
  }
  sendResponse({ success: true });
  return true;
});
