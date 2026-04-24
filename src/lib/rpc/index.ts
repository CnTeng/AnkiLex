import { getHandler, type RPCHandlers } from "./handlers";

let mode: "local" | "remote" = "remote";

export const rpc = new Proxy({} as RPCHandlers, {
  get: (_, domain: string) =>
    new Proxy(
      {},
      {
        get: (_, method: string) => async (data?: unknown) => {
          const handler = getHandler(domain, method);

          if (mode === "local" && typeof handler === "function") {
            return handler(data);
          }

          const res = await chrome.runtime.sendMessage({ type: "rpc", domain, method, data });
          if (res?.error) throw new Error(res.error);
          return res;
        },
      },
    ),
});

export function initRPC(nextMode: "local" | "remote") {
  mode = nextMode;
  if (mode !== "remote") return;

  chrome.runtime.onMessage.addListener((msg: unknown, _sender, sendResponse) => {
    if (!msg || typeof msg !== "object") return;

    const { type, domain, method, data } = msg as Record<string, unknown>;
    if (type !== "rpc" || typeof domain !== "string" || typeof method !== "string") return;

    const handler = getHandler(domain, method);
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
