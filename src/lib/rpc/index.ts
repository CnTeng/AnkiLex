import type { AllHandlers } from "./handlers";

type HandlerDomain = keyof AllHandlers;

let _handlers: AllHandlers | null = null;

export const rpc = new Proxy({} as AllHandlers, {
  get: (_, domain: string) =>
    new Proxy(
      {},
      {
        get: (_, method: string) => (data: unknown) => {
          const domainHandlers = _handlers?.[domain as HandlerDomain];
          const handler = (domainHandlers as Record<string, unknown> | undefined)?.[method];

          if (typeof handler === "function") {
            return handler(data);
          }

          return chrome.runtime.sendMessage({ domain, method, data }).then((res) => {
            if (res?.error) throw new Error(res.error);
            return res;
          });
        },
      },
    ),
});

export function listenRPC(handlers: AllHandlers) {
  _handlers = handlers;

  chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
    if (!msg || typeof msg !== "object") return;

    const { domain, method, data } = msg as Record<string, unknown>;

    if (typeof domain !== "string" || !(domain in handlers)) return;
    const domainHandlers = handlers[domain as HandlerDomain];

    if (!domainHandlers || typeof method !== "string" || !(method in domainHandlers)) return;
    const handler = (domainHandlers as Record<string, unknown>)[method];

    if (typeof handler !== "function") return;

    Promise.resolve(handler(data))
      .then(sendResponse)
      .catch((e: Error) => {
        console.error(`[RPC Error] ${domain}.${method}:`, e);
        sendResponse({ error: e.message });
      });

    return true;
  });
}
