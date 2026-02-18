import { Button } from "@lib/components";
import { createElement, Search } from "lucide";

export interface LookupIconProps {
  id?: string;
  size?: number;
  title?: string;
}

export function LookupIcon(props: LookupIconProps = {}): HTMLButtonElement {
  const { id = "ankilex-lookup-icon", size = 16, title = "Search" } = props;
  const icon = createElement(Search, { width: size, height: size });

  const button = Button({
    size: "icon-sm",
    variant: "ghost",
    title,
    icon,
  });

  button.id = id;
  button.type = "button";
  button.setAttribute("aria-label", title);
  button.classList.add("ankilex-lookup-icon");

  return button;
}
