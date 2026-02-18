import { createElement, Search, Settings } from "lucide";
import { cx } from "tailwind-variants";

export interface SearchBarProps {
  placeholder?: string;
  onSearch?: (word: string) => Promise<void>;
  onSettingsClick?: () => void;
}

let isSearching = false;

export function SearchBar(props: SearchBarProps = {}): {
  container: HTMLDivElement;
  input: HTMLInputElement;
} {
  const { placeholder = "Search ..." } = props;

  const container = document.createElement("div");
  container.className =
    cx(
      "relative z-10 flex h-12 items-center border-b border-gray-100 bg-white px-3 dark:border-gray-700 dark:bg-gray-900",
    ) ?? "";

  const grid = document.createElement("div");
  grid.className =
    cx(
      "grid w-full grid-cols-[32px_1fr_32px] items-center rounded-full border border-gray-200 bg-gray-50 shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:focus-within:ring-blue-900",
    ) ?? "";

  const searchIconWrapper = document.createElement("span");
  searchIconWrapper.className = "flex items-center justify-center text-gray-400 dark:text-gray-500";
  const searchIcon = createElement(Search, { width: 16, height: 16 });
  searchIconWrapper.appendChild(searchIcon);

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.className =
    cx(
      "w-full border-none bg-transparent px-2 py-1.5 text-sm text-gray-700 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500",
    ) ?? "";

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

  const settingsButton = document.createElement("button");
  settingsButton.title = "Settings";
  settingsButton.className =
    cx(
      "flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300",
    ) ?? "";
  const settingsIcon = createElement(Settings, { width: 16, height: 16 });
  settingsButton.appendChild(settingsIcon);
  if (props.onSettingsClick) settingsButton.addEventListener("click", props.onSettingsClick);

  grid.append(searchIconWrapper, input, settingsButton);
  container.appendChild(grid);

  input.focus();

  return { container, input };
}
