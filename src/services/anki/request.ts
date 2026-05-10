export type AnkiRequest = <T>(action: string, params?: unknown) => Promise<T>;

type AnkiConnectRequest = {
  action: string;
  version: 6;
  params?: unknown;
};

type AnkiConnectResponse<T> = { result: T; error: null } | { result: null; error: string };

export function createAnkiRequest(baseUrl: string): AnkiRequest {
  return (action, params) => invokeAnkiConnect(baseUrl, createAnkiConnectRequest(action, params));
}

function createAnkiConnectRequest(action: string, params?: unknown): AnkiConnectRequest {
  return {
    action,
    version: 6,
    ...(params === undefined ? {} : { params }),
  };
}

async function invokeAnkiConnect<T>(baseUrl: string, body: AnkiConnectRequest): Promise<T> {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => {
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
