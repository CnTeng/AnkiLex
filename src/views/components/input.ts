import { tv } from "tailwind-variants";

const inputStyles = tv({
  base: "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring block min-h-11 w-full rounded-2xl border px-4 py-2.5 text-sm shadow-none transition-[border-color,box-shadow] outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-55",
});

type InputOptions = {
  doc?: Document;
  id?: string;
  type?: string;
  placeholder?: string;
  className?: string;
};

export function createInput({
  doc = document,
  id,
  type = "text",
  placeholder,
  className,
}: InputOptions = {}) {
  const input = doc.createElement("input");
  input.type = type;
  if (id) input.id = id;
  if (placeholder) input.placeholder = placeholder;
  input.className = inputStyles({ className });
  return input;
}
