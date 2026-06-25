export type GateMode =
  | "native_fork"
  | "universal"
  | "required_check"
  | "hybrid"
  | "off";

export interface CiCaptchaConfig {
  mode: GateMode;
  captcha: {
    provider: "cloudflare_turnstile";
  };
  require: {
    github_login: boolean;
    solver_must_be_pr_author: boolean;
    new_sha_requires_new_captcha: boolean;
  };
  apply_to: {
    all_pull_requests: boolean;
    first_time_contributors: boolean;
    outside_contributors: boolean;
    fork_prs: boolean;
    bots: boolean;
  };
  skip: {
    authors: string[];
    labels: string[];
  };
  checks: {
    create_required_check: boolean;
    name: string;
  };
  comment: {
    enabled: boolean;
    tone: "direct";
  };
  universal_gate: {
    rerun_after_verification: boolean;
  };
}

export interface PullRequestWebhook {
  action: string;
  installation: {
    id: number;
  };
  repository: {
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
    default_branch: string;
  };
  pull_request: WebhookPullRequest;
}

export interface WebhookPullRequest {
  number: number;
  draft: boolean;
  html_url: string;
  author_association: string;
  user: {
    login: string;
    type: string;
  };
  head: {
    sha: string;
    ref: string;
    repo: null | {
      full_name: string;
      fork: boolean;
      owner: {
        login: string;
      };
    };
  };
  base: {
    ref: string;
    repo: {
      full_name: string;
      owner: {
        login: string;
      };
    };
  };
  labels: Array<{
    name: string;
  }>;
}

export interface GateRecord {
  id: string;
  installation_id: string;
  owner: string;
  repo: string;
  pr_number: number;
  head_sha: string;
  pr_author: string;
  status: "pending" | "verified" | "skipped";
  gate_url: string;
  gate_token_hash: string;
  gate_nonce_hash: string | null;
  check_run_id: number | null;
  comment_id: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface VerificationRecord {
  id: string;
  gate_id: string;
  installation_id: string;
  owner: string;
  repo: string;
  pr_number: number;
  head_sha: string;
  pr_author: string;
  solver_login: string;
  captcha_provider: string;
  captcha_passed_at: string;
  expires_at: string;
}

export interface GateTokenPayload {
  gate_id: string;
  owner: string;
  repo: string;
  pr_number: number;
  head_sha: string;
  nonce: string;
  exp: number;
}
