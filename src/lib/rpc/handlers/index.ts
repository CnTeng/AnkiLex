import "./anki";
import "./dictionary";
import "./settings";

import { ankiHandlers } from "./anki";
import { dictionaryHandlers } from "./dictionary";
import { settingsHandlers } from "./settings";

const rpcHandlers = {
  anki: ankiHandlers,
  dictionary: dictionaryHandlers,
  settings: settingsHandlers,
};

export type RPCHandlers = typeof rpcHandlers;

export function getHandler(domain: string, method: string) {
  const domainHandlers = rpcHandlers[domain as keyof typeof rpcHandlers] as
    | Record<string, unknown>
    | undefined;
  const handler = domainHandlers?.[method];

  if (typeof handler === "function") return handler;
  return null;
}
