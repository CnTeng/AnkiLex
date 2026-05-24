import { tv } from "tailwind-variants";

const selectStyles = tv({
  base: "border-input bg-background text-foreground focus-visible:border-ring focus-visible:ring-ring min-h-11 w-full rounded-2xl border px-4 py-2.5 text-sm shadow-none transition-[border-color,box-shadow] outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-55",
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
