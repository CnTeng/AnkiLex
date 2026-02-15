import { cn } from "tailwind-variants";

interface InputProps {
  doc?: Document;
  id?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
}

const INPUT_CLASS = cn(
  "border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-all focus:border-transparent focus:ring-2 focus:outline-none",
) as string;

export function Input({
  doc = document,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
}: InputProps): HTMLInputElement {
  const input = doc.createElement("input");
  input.type = type;
  input.className = INPUT_CLASS;

  if (id) input.id = id;
  if (placeholder) input.placeholder = placeholder;
  if (value) input.value = value;

  if (onChange) {
    const handler = onChange;
    input.addEventListener("input", (e) => handler((e.target as HTMLInputElement).value));
  }

  return input;
}
