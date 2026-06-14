import type { Env } from "./env";

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

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: form,
    },
  );
  const payload = (await response.json()) as { success?: boolean };
  return payload.success === true;
}
