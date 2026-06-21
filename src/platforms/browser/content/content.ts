import { extractContext } from "@common/context";
import type { Context } from "@common/types";
import { flip, inline, offset, shift } from "@floating-ui/dom";
import { Icon, Popover } from "@views/components";
import { Search } from "lucide";
import contentStyles from "./content.css?inline";

let selectedWord = "";
let currentContext: Context | undefined;

const iframe = document.createElement("iframe");
iframe.src = chrome.runtime.getURL("platforms/browser/content/frame.html");
iframe.className = "onedict-frame";
iframe.loading = "lazy";

const floating = new Popover({
  icon: new Icon({ iconNode: Search }).element,
  placement: "right-start",
  middleware: [inline(), offset(8), shift({ padding: 8 }), flip()],
});

const container = document.createElement("div");
const shadow = container.attachShadow({ mode: "open" });
const styleElement = document.createElement("style");
styleElement.textContent = contentStyles;
shadow.append(styleElement, floating.button, floating.popover);

document.documentElement.append(container);

floating.button.className = "onedict-floating-btn";
floating.button.title = "Search in One dictionary";

floating.popover.className = "onedict-popover";
floating.popover.append(iframe);
floating.popover.addEventListener("toggle", () => {
  if (floating.popover.matches(":popover-open")) {
    iframe.contentWindow?.postMessage(
      {
        action: "lookup",
        data: {
          word: selectedWord,
          context: currentContext,
        },
      },
      "*",
    );
  }
});

const handleMouseUp = (event: MouseEvent) => {
  if (event.composedPath().includes(container)) return;

  const sel = window.getSelection();
  if (!sel?.rangeCount) return;

  const word = sel.toString().trim();
  if (!word || word.length > 100) return;

  const range = sel.getRangeAt(0);
  const context = extractContext(range, document.documentElement.lang);
  if (!context) return;

  selectedWord = word;
  currentContext = context;
  floating.show(range);
};

document.addEventListener("mouseup", handleMouseUp);
