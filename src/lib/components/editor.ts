import { cn, tv, type VariantProps } from "tailwind-variants";
import { CommandBar, Editor as TinyMdeEditor } from "tiny-markdown-editor";

const textareaVariants = tv({
  base: `min-h-[100px] w-full resize-none rounded-md border border-(--border-color) bg-(--view-bg) p-2 text-sm text-(--text-main) shadow-sm transition-colors placeholder:text-(--text-secondary) focus-visible:ring-2 focus-visible:outline-none`,
  variants: {
    variant: {
      default: "",
      error: "border-red-500 focus-visible:ring-red-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface EditorProps extends VariantProps<typeof textareaVariants> {
  id?: string;
  placeholder?: string;
  initialValue?: string;
  className?: string;
  onChange?: (content: string) => void;
}

export interface EditorInstance {
  element: HTMLDivElement;
  setContent: (content: string) => void;
  getContent: () => string;
}

export const Editor = (props: EditorProps): EditorInstance => {
  const { id, placeholder, initialValue, className, variant, onChange } = props;

  const container = document.createElement("div");
  container.className =
    cn(
      "tinymde-editor flex shrink-0 flex-col gap-2 border-t border-(--border-color) bg-(--view-bg) px-4 py-2",
    ) ?? "";

  const toolbar = document.createElement("div");
  container.appendChild(toolbar);

  const textarea = document.createElement("textarea");

  if (id) textarea.id = id;
  if (placeholder) textarea.placeholder = placeholder;
  if (initialValue) textarea.value = initialValue;

  textarea.className = cn(textareaVariants({ variant }), className) ?? "";

  container.appendChild(textarea);

  const editor = new TinyMdeEditor({
    textarea,
  });

  new CommandBar({
    element: toolbar,
    editor,
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

  if (onChange) {
    editor.addEventListener("change", () => {
      onChange(editor.getContent());
    });
  }

  return {
    element: container,
    setContent: (content: string) => editor.setContent(content),
    getContent: () => editor.getContent(),
  };
};
