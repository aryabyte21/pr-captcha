const encoder = new TextEncoder();

export function base64UrlEncode(
  value: ArrayBuffer | Uint8Array | string,
): string {
  const bytes =
    typeof value === "string"
      ? encoder.encode(value)
      : value instanceof Uint8Array
        ? value
        : new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

export function base64UrlDecode(value: string): Uint8Array {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64UrlEncode(digest);
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(value),
  );
  return base64UrlEncode(signature);
}

export async function signPayload(
  payload: unknown,
  secret: string | null | undefined,
): Promise<string> {
  if (!configuredSecret(secret)) {
    throw new Error("Signing secret is not configured");
  }
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${await hmac(secret, body)}`;
}

export async function verifyPayload<T>(
  token: string,
  secret: string | null | undefined,
  validate?: (payload: unknown) => payload is T,
): Promise<T | null> {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [body, signature] = parts;
  if (!body || !signature || !configuredSecret(secret)) {
    return null;
  }
  const expected = await hmac(secret, body);
  if (!constantTimeEqual(signature, expected)) {
    return null;
  }
  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(body)));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const exp = (payload as { exp?: unknown }).exp;
  if (exp !== undefined && typeof exp !== "number") {
    return null;
  }
  if (exp !== undefined && exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (validate && !validate(payload)) {
    return null;
  }
  return payload as T;
}

export async function verifyGitHubWebhook(
  body: string,
  signatureHeader: string | null,
  secret: string | null | undefined,
): Promise<boolean> {
  if (!signatureHeader?.startsWith("sha256=") || !configuredSecret(secret)) {
    return false;
  }
  const expected = `sha256=${await githubWebhookHmac(secret, body)}`;
  return constantTimeEqual(signatureHeader, expected);
}

async function githubWebhookHmac(
  secret: string,
  body: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function configuredSecret(secret: string | null | undefined): secret is string {
  return typeof secret === "string" && secret.trim().length > 0;
}
