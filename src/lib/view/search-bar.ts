import { Icon } from "@lib/components";
import { Search, Settings } from "lucide";
import { cn } from "tailwind-variants";

export interface SearchBarProps {
  doc?: Document;
  placeholder?: string;
  onSearch?: (word: string) => Promise<void>;
  onSettingsClick?: () => void;
}

export function SearchBar({ doc = document, ...props }: SearchBarProps = {}): {
  container: HTMLDivElement;
  input: HTMLInputElement;
} {
  const { placeholder = "Search ..." } = props;

  const container = doc.createElement("div");
  container.className = cn(
    "border-border bg-background relative z-10 flex h-12 items-center border-b px-3",
  ) as string;

  const grid = doc.createElement("div");
  grid.className = cn(
    "border-border bg-muted focus-within:border-ring focus-within:ring-ring/20 grid w-full grid-cols-[32px_1fr_32px] items-center rounded-full border shadow-sm transition-all focus-within:ring-2",
  ) as string;

  const searchIconWrapper = doc.createElement("span");
  searchIconWrapper.className = cn(
    "text-muted-foreground flex items-center justify-center",
  ) as string;
  const searchIcon = Icon({
    doc,
    iconNode: Search,
    customAttrs: { width: 16, height: 16 },
  });
  searchIconWrapper.append(searchIcon);

  const input = doc.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.className = cn(
    "text-foreground placeholder:text-muted-foreground w-full border-none bg-transparent px-2 py-1.5 text-sm outline-none",
  ) as string;

  let isSearching = false;
  input.addEventListener("keydown", async (e) => {
    if (isSearching) return;
    if (e.key === "Enter" && props.onSearch) {
      const input = e.currentTarget as HTMLInputElement;
      const word = input.value.trim();
      if (!word) return;
      isSearching = true;
      await props.onSearch(word);
      isSearching = false;
    }
  });

  const settingsButton = doc.createElement("button");
  settingsButton.title = "Settings";
  settingsButton.className = cn(
    "text-muted-foreground hover:bg-muted hover:text-foreground flex h-7 w-7 items-center justify-center rounded-full transition-colors",
  ) as string;
  const settingsIcon = Icon({
    doc,
    iconNode: Settings,
    customAttrs: { width: 16, height: 16 },
  });
  settingsButton.append(settingsIcon);
  if (props.onSettingsClick) settingsButton.addEventListener("click", props.onSettingsClick);

  grid.append(searchIconWrapper, input, settingsButton);
  container.append(grid);

  input.focus();

  return { container, input };
}
