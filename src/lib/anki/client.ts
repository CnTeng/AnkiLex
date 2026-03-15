import { type AnkiConnectResponse, DEFAULT_ANKI_URL } from "@lib/model";
import { settings } from "../settings";

export async function apiRequest<T>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`AnkiConnect request failed: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data as T;
}

export async function invoke<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
  const currentSettings = await settings.get();
  const url = currentSettings.ankiConnectUrl || DEFAULT_ANKI_URL;

  try {
    const { result, error } = await apiRequest<AnkiConnectResponse<T>>(url, {
      action,
      version: 6,
      params,
    });

    if (error) {
      throw new Error(error);
    }

    return result;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("Failed to fetch")) {
      throw new Error(
        "Could not connect to Anki. Please check if Anki is running and AnkiConnect is installed.",
      );
    }
    throw error;
  }
}
