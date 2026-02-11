import { CommandBar, Editor } from "tiny-markdown-editor";

let tinyMDE: Editor | null = null;

/**
 * Initialize the EasyMDE editor in a compact mode
 */
export function initEditor(
  textarea: HTMLTextAreaElement,
  placeholder: string = "Context / Note...",
): Editor | null {
  if (!textarea) return null;

  // Create a container for the toolbar if it doesn't exist
  let toolbarContainer = textarea.parentElement?.querySelector(".tinymde-toolbar") as HTMLElement;
  if (!toolbarContainer) {
    toolbarContainer = document.createElement("div");
    toolbarContainer.className = "tinymde-toolbar";

    textarea.parentElement?.insertBefore(toolbarContainer, textarea);
  }

  tinyMDE = new Editor({
    textarea: textarea,
    placeholder: placeholder,
  });

  new CommandBar({
    element: toolbarContainer,
    editor: tinyMDE,
    commands: [
      "bold",
      "italic",
      "strikethrough",
      "|",
      "ul",
      "ol",
      "|",
      "blockquote",
      "code",
      "|",
      "insertLink",
    ],
  });

  return tinyMDE;
}

/**
 * Update the editor content safely
 */
export function setEditorContent(content: string) {
  if (tinyMDE) {
    tinyMDE.setContent(content);
  }
}

/**
 * Get current editor content
 */
export function getEditorContent(fallbackTextarea?: HTMLTextAreaElement): string {
  if (tinyMDE) {
    return tinyMDE.getContent();
  }
  return fallbackTextarea ? fallbackTextarea.value : "";
}
