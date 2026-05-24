export type AnkiConnectEnv = {
  baseUrl: string;
  fetch: typeof fetch;
};

type AnkiConnectRequest = {
  action: string;
  version: 6;
  params?: unknown;
};

type AnkiConnectResponse<T> = { result: T; error: null } | { result: null; error: string };

export function request(action: string, params?: unknown): AnkiConnectRequest {
  return {
    action,
    version: 6,
    ...(params === undefined ? {} : { params }),
  };
}

export async function invoke<T>(env: AnkiConnectEnv, body: AnkiConnectRequest): Promise<T> {
  const response = await env
    .fetch(env.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    .catch(() => {
      throw new Error(
        "Could not connect to Anki. Please check if Anki is running and AnkiConnect is installed.",
      );
    });

  if (!response.ok) {
    throw new Error(`AnkiConnect request failed: ${response.statusText}`);
  }

  const data = (await response.json()) as unknown as AnkiConnectResponse<T>;
  if (data.error !== null) throw new Error(data.error);
  return data.result;
}
