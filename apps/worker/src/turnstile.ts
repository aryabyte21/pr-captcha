import type { Env } from "./env";
import { fetchWithTimeout } from "./http";

const turnstileTimeoutMs = 5000;

export async function verifyTurnstile(
  env: Env,
  token: string,
  remoteIp: string | null,
): Promise<boolean> {
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }
  form.set("idempotency_key", crypto.randomUUID());

  try {
    const response = await fetchWithTimeout(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: form,
      },
      turnstileTimeoutMs,
    );
    if (!response.ok) {
      return false;
    }
    const payload = await response.json();
    return isTurnstileResult(payload) && payload.success === true;
  } catch {
    return false;
  }
}

function isTurnstileResult(value: unknown): value is { success: boolean } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as { success?: unknown }).success === "boolean"
  );
}
