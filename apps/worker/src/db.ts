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
  expiresAt: string;
};

export function isoNow(): string {
  return new Date().toISOString();
}

export function isoInDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
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
        created_at,
        updated_at,
        expires_at
      ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(owner, repo, pr_number, head_sha) do update set
        installation_id = excluded.installation_id,
        pr_author = excluded.pr_author,
        status = excluded.status,
        gate_url = excluded.gate_url,
        gate_token_hash = excluded.gate_token_hash,
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

export async function setGateError(
  db: D1Database,
  id: string,
  error: string,
): Promise<void> {
  await db
    .prepare("update gates set last_error = ?, updated_at = ? where id = ?")
    .bind(error, isoNow(), id)
    .run();
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
