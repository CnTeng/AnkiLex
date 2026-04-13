import { Icon, Select } from "@lib/ui/components";
import { Search, Settings } from "lucide";
import { cn } from "tailwind-variants";

interface LanguageOption {
  code: string;
  name: string;
}

export function SearchBar({
  doc = document,
  onSearch,
}: {
  doc?: Document;
  onSearch?: (word: string, language?: string) => Promise<void>;
} = {}): {
  container: HTMLDivElement;
  input: HTMLInputElement;
  setLanguages: (languages: LanguageOption[]) => void;
} {
  const container = doc.createElement("div");
  container.className = cn(
    "border-border bg-background relative z-10 flex h-12 items-center border-b px-3",
  ) as string;

  const grid = doc.createElement("div");
  grid.className = cn(
    "border-border bg-muted focus-within:border-ring focus-within:ring-ring/20 grid w-full grid-cols-[32px_1fr_auto_32px] items-center rounded-full border shadow-sm transition-all focus-within:ring-2",
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
  input.placeholder = "Search ...";
  input.autocomplete = "off";
  input.className = cn(
    "text-foreground placeholder:text-muted-foreground w-full border-none bg-transparent px-2 py-1.5 text-sm outline-none",
  ) as string;

  const langSelect = Select({
    doc,
    variant: "ghost",
    wrapperClassName: "w-auto",
    className: "text-muted-foreground min-w-24",
    chevronClassName: "right-2",
    title: "Language",
    options: [{ value: "", label: "Auto" }],
    value: "",
  });

  function setLanguages(languages: LanguageOption[]) {
    langSelect.setOptions([
      { value: "", label: "Auto" },
      ...languages.map((language) => ({ value: language.code, label: language.name })),
    ]);
  }

  let isSearching = false;

  function getSelectedLanguage(): string | undefined {
    return langSelect.select.value || undefined;
  }

  input.addEventListener("keydown", (e) => {
    if (isSearching) return;
    if (e.key === "Enter" && onSearch) {
      const input = e.currentTarget as HTMLInputElement;
      const word = input.value.trim();
      if (!word) return;
      isSearching = true;
      void onSearch(word, getSelectedLanguage()).finally(() => {
        isSearching = false;
      });
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
  settingsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());

  grid.append(searchIconWrapper, input, langSelect, settingsButton);
  container.append(grid);

  input.focus();

  return { container, input, setLanguages };
}
