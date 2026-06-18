import { describe, expect, it } from "vitest";
import { signPayload, verifyGitHubWebhook, verifyPayload } from "./crypto";

describe("signed payloads", () => {
  it("refuses to sign payloads without a configured secret", async () => {
    await expect(signPayload({ ok: true }, "")).rejects.toThrow(
      "Signing secret is not configured",
    );
  });

  it("does not verify signed payloads without a configured secret", async () => {
    const token = await signPayload({ ok: true }, "secret");

    await expect(verifyPayload(token, "")).resolves.toBeNull();
  });

  it("rejects tokens with extra signature segments", async () => {
    const token = await signPayload({ ok: true }, "secret");

    await expect(verifyPayload(`${token}.extra`, "secret")).resolves.toBeNull();
  });

  it("rejects non-object payloads", async () => {
    const token = await signPayload("hello", "secret");

    await expect(verifyPayload(token, "secret")).resolves.toBeNull();
  });

  it("rejects non-numeric expiry values", async () => {
    const token = await signPayload({ exp: "tomorrow" }, "secret");

    await expect(verifyPayload(token, "secret")).resolves.toBeNull();
  });

  it("applies structural validators after signature checks", async () => {
    const token = await signPayload(
      {
        login: 123,
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      "secret",
    );

    await expect(
      verifyPayload<{ login: string; exp: number }>(
        token,
        "secret",
        (value): value is { login: string; exp: number } =>
          isRecord(value) &&
          typeof value.login === "string" &&
          typeof value.exp === "number",
      ),
    ).resolves.toBeNull();
  });
});

describe("GitHub webhook signatures", () => {
  it("does not verify signatures without a configured secret", async () => {
    const body = "{}";
    const signature = await githubSignature(body, "undefined");

    await expect(verifyGitHubWebhook(body, signature, undefined)).resolves.toBe(
      false,
    );
  });
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function githubSignature(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hex = [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256=${hex}`;
}
