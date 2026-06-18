import type { GateRecord, VerificationRecord } from "./types";

export type GateInput = {
  id: string;
  installationId: string;
  owner: string;
  repo: string;
  prNumber: number;
  headSha: string;
  prAuthor: string;
  status: GateRecord["status"];
  gateUrl: string;
  gateTokenHash: string;
  gateNonceHash: string | null;
  expiresAt: string;
};

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  resetAt: string;
};

export type AuditLogInput = {
  event: string;
  owner?: string | undefined;
  repo?: string | undefined;
  prNumber?: number | undefined;
  headSha?: string | undefined;
  gateId?: string | undefined;
  installationId?: string | undefined;
  actorLogin?: string | undefined;
  details?: Record<string, unknown> | undefined;
};

export type AuditLogRecord = {
  id: string;
  occurred_at: string;
  event: string;
  owner: string | null;
  repo: string | null;
  pr_number: number | null;
  head_sha: string | null;
  gate_id: string | null;
  installation_id: string | null;
  actor_login: string | null;
  details_json: string;
};

export type AuditLogQuery = {
  limit: number;
  owner?: string | undefined;
  repo?: string | undefined;
  prNumber?: number | undefined;
  gateId?: string | undefined;
  event?: string | undefined;
};

export type CleanupResult = {
  rateLimits: number;
  webhookDeliveries: number;
  verifications: number;
  gates: number;
};

export function isoNow(): string {
  return new Date().toISOString();
}

export function isoInDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function claimWebhookDelivery(
  db: D1Database,
  id: string,
  event: string,
): Promise<boolean> {
  const now = isoNow();
  const staleProcessingCutoff = new Date(
    Date.now() - 10 * 60 * 1000,
  ).toISOString();
  const result = await db
    .prepare(
      `insert or ignore into webhook_deliveries (
        id,
        event,
        status,
        created_at,
        updated_at
      ) values (?, ?, 'processing', ?, ?)`,
    )
    .bind(id, event, now, now)
    .run();
  if ((result.meta.changes ?? 0) > 0) {
    return true;
  }
  const reclaimed = await db
    .prepare(
      `update webhook_deliveries
      set event = ?, status = 'processing', updated_at = ?
      where id = ? and status = 'processing' and updated_at <= ?`,
    )
    .bind(event, now, id, staleProcessingCutoff)
    .run();
  return (reclaimed.meta.changes ?? 0) > 0;
}

export async function completeWebhookDelivery(
  db: D1Database,
  id: string,
): Promise<void> {
  await db
    .prepare(
      "update webhook_deliveries set status = 'completed', updated_at = ? where id = ?",
    )
    .bind(isoNow(), id)
    .run();
}

export async function releaseWebhookDelivery(
  db: D1Database,
  id: string,
): Promise<void> {
  await db
    .prepare("delete from webhook_deliveries where id = ?")
    .bind(id)
    .run();
}

export async function hitRateLimit(
  db: D1Database,
  input: {
    key: string;
    limit: number;
    windowSeconds: number;
  },
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = input.windowSeconds * 1000;
  const windowStartMs = Math.floor(now / windowMs) * windowMs;
  const windowStart = new Date(windowStartMs).toISOString();
  const expiresAt = new Date(windowStartMs + windowMs).toISOString();
  await db
    .prepare("delete from rate_limits where expires_at <= ?")
    .bind(new Date(now).toISOString())
    .run();
  await db
    .prepare(
      `insert into rate_limits (
        bucket_key,
        window_start,
        count,
        expires_at
      ) values (?, ?, 1, ?)
      on conflict(bucket_key) do update set
        window_start = excluded.window_start,
        count = case
          when rate_limits.window_start = excluded.window_start then rate_limits.count + 1
          else 1
        end,
        expires_at = excluded.expires_at`,
    )
    .bind(input.key, windowStart, expiresAt)
    .run();
  const row = await db
    .prepare("select count, expires_at from rate_limits where bucket_key = ?")
    .bind(input.key)
    .first<{ count: number; expires_at: string }>();
  const count = row?.count ?? input.limit + 1;
  return {
    limited: count > input.limit,
    remaining: Math.max(input.limit - count, 0),
    resetAt: row?.expires_at ?? expiresAt,
  };
}

export async function createAuditLog(
  db: D1Database,
  input: AuditLogInput,
): Promise<void> {
  await db
    .prepare(
      `insert into audit_logs (
        id,
        occurred_at,
        event,
        owner,
        repo,
        pr_number,
        head_sha,
        gate_id,
        installation_id,
        actor_login,
        details_json
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      crypto.randomUUID(),
      isoNow(),
      input.event,
      input.owner ?? null,
      input.repo ?? null,
      input.prNumber ?? null,
      input.headSha ?? null,
      input.gateId ?? null,
      input.installationId ?? null,
      input.actorLogin ?? null,
      JSON.stringify(input.details ?? {}),
    )
    .run();
}

export async function listAuditLogs(
  db: D1Database,
  input: AuditLogQuery,
): Promise<AuditLogRecord[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (input.owner) {
    clauses.push("owner = ?");
    values.push(input.owner);
  }
  if (input.repo) {
    clauses.push("repo = ?");
    values.push(input.repo);
  }
  if (input.prNumber !== undefined) {
    clauses.push("pr_number = ?");
    values.push(input.prNumber);
  }
  if (input.gateId) {
    clauses.push("gate_id = ?");
    values.push(input.gateId);
  }
  if (input.event) {
    clauses.push("event = ?");
    values.push(input.event);
  }
  values.push(input.limit);
  const where = clauses.length ? ` where ${clauses.join(" and ")}` : "";
  const rows = await db
    .prepare(
      `select
        id,
        occurred_at,
        event,
        owner,
        repo,
        pr_number,
        head_sha,
        gate_id,
        installation_id,
        actor_login,
        details_json
      from audit_logs${where}
      order by occurred_at desc
      limit ?`,
    )
    .bind(...values)
    .all<AuditLogRecord>();
  return rows.results ?? [];
}

export async function cleanupExpiredRows(
  db: D1Database,
): Promise<CleanupResult> {
  const now = isoNow();
  const webhookCutoff = isoInDays(-7);
  const rateLimits = await db
    .prepare("delete from rate_limits where expires_at <= ?")
    .bind(now)
    .run();
  const webhookDeliveries = await db
    .prepare("delete from webhook_deliveries where updated_at <= ?")
    .bind(webhookCutoff)
    .run();
  const verifications = await db
    .prepare("delete from verifications where expires_at <= ?")
    .bind(now)
    .run();
  const gates = await db
    .prepare("delete from gates where expires_at <= ?")
    .bind(now)
    .run();
  return {
    rateLimits: rateLimits.meta.changes ?? 0,
    webhookDeliveries: webhookDeliveries.meta.changes ?? 0,
    verifications: verifications.meta.changes ?? 0,
    gates: gates.meta.changes ?? 0,
  };
}

export async function getGateByIdentity(
  db: D1Database,
  owner: string,
  repo: string,
  prNumber: number,
  headSha: string,
): Promise<GateRecord | null> {
  return db
    .prepare(
      "select * from gates where owner = ? and repo = ? and pr_number = ? and head_sha = ?",
    )
    .bind(owner, repo, prNumber, headSha)
    .first<GateRecord>();
}

export async function getGateById(
  db: D1Database,
  id: string,
): Promise<GateRecord | null> {
  return db
    .prepare("select * from gates where id = ?")
    .bind(id)
    .first<GateRecord>();
}

export async function upsertGate(
  db: D1Database,
  input: GateInput,
): Promise<GateRecord> {
  const now = isoNow();
  await db
    .prepare(
      `insert into gates (
        id,
        installation_id,
        owner,
        repo,
        pr_number,
        head_sha,
        pr_author,
        status,
        gate_url,
        gate_token_hash,
        gate_nonce_hash,
        created_at,
        updated_at,
        expires_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(owner, repo, pr_number, head_sha) do update set
        installation_id = excluded.installation_id,
        pr_author = excluded.pr_author,
        status = excluded.status,
        gate_url = excluded.gate_url,
        gate_token_hash = excluded.gate_token_hash,
        gate_nonce_hash = excluded.gate_nonce_hash,
        updated_at = excluded.updated_at,
        expires_at = excluded.expires_at`,
    )
    .bind(
      input.id,
      input.installationId,
      input.owner,
      input.repo,
      input.prNumber,
      input.headSha,
      input.prAuthor,
      input.status,
      input.gateUrl,
      input.gateTokenHash,
      input.gateNonceHash,
      now,
      now,
      input.expiresAt,
    )
    .run();

  const gate = await getGateByIdentity(
    db,
    input.owner,
    input.repo,
    input.prNumber,
    input.headSha,
  );
  if (!gate) {
    throw new Error("Gate upsert failed");
  }
  return gate;
}

export async function consumeGateNonce(
  db: D1Database,
  id: string,
  nonceHash: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      "update gates set gate_nonce_hash = null, updated_at = ? where id = ? and gate_nonce_hash = ?",
    )
    .bind(isoNow(), id, nonceHash)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

export async function setGateCheckRunId(
  db: D1Database,
  id: string,
  checkRunId: number,
): Promise<void> {
  await db
    .prepare("update gates set check_run_id = ?, updated_at = ? where id = ?")
    .bind(checkRunId, isoNow(), id)
    .run();
}

export async function setGateCommentId(
  db: D1Database,
  id: string,
  commentId: number,
): Promise<void> {
  await db
    .prepare("update gates set comment_id = ?, updated_at = ? where id = ?")
    .bind(commentId, isoNow(), id)
    .run();
}

export async function markGateVerified(
  db: D1Database,
  id: string,
): Promise<void> {
  await db
    .prepare(
      "update gates set status = 'verified', updated_at = ? where id = ?",
    )
    .bind(isoNow(), id)
    .run();
}

export async function markGateSkipped(
  db: D1Database,
  id: string,
): Promise<void> {
  await db
    .prepare(
      "update gates set status = 'skipped', gate_nonce_hash = null, last_error = null, updated_at = ? where id = ?",
    )
    .bind(isoNow(), id)
    .run();
}

export async function setGateError(
  db: D1Database,
  id: string,
  error: string | null,
): Promise<void> {
  await db
    .prepare("update gates set last_error = ?, updated_at = ? where id = ?")
    .bind(error, isoNow(), id)
    .run();
}

export async function clearGateError(
  db: D1Database,
  id: string,
): Promise<void> {
  await setGateError(db, id, null);
}

export async function getVerification(
  db: D1Database,
  owner: string,
  repo: string,
  prNumber: number,
  headSha: string,
): Promise<VerificationRecord | null> {
  return db
    .prepare(
      "select * from verifications where owner = ? and repo = ? and pr_number = ? and head_sha = ?",
    )
    .bind(owner, repo, prNumber, headSha)
    .first<VerificationRecord>();
}

export async function createVerification(
  db: D1Database,
  input: {
    gate: GateRecord;
    solverLogin: string;
    captchaProvider: string;
  },
): Promise<VerificationRecord> {
  const id = crypto.randomUUID();
  const now = isoNow();
  await db
    .prepare(
      `insert or ignore into verifications (
        id,
        gate_id,
        installation_id,
        owner,
        repo,
        pr_number,
        head_sha,
        pr_author,
        solver_login,
        captcha_provider,
        captcha_passed_at,
        expires_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.gate.id,
      input.gate.installation_id,
      input.gate.owner,
      input.gate.repo,
      input.gate.pr_number,
      input.gate.head_sha,
      input.gate.pr_author,
      input.solverLogin,
      input.captchaProvider,
      now,
      input.gate.expires_at,
    )
    .run();

  const verification = await getVerification(
    db,
    input.gate.owner,
    input.gate.repo,
    input.gate.pr_number,
    input.gate.head_sha,
  );
  if (!verification) {
    throw new Error("Verification insert failed");
  }
  return verification;
}
