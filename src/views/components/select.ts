import { tv } from "tailwind-variants";

const selectStyles = tv({
  base: "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[border-color,box-shadow] outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
});

type SelectOptions = {
  doc?: Document;
  id?: string;
  className?: string;
};

export function createSelect({ doc = document, id, className }: SelectOptions = {}) {
  const select = doc.createElement("select");
  if (id) select.id = id;
  select.className = selectStyles({ className });
  return select;
}
