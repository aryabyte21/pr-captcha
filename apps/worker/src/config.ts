import { parse } from "yaml";
import type { CiCaptchaConfig, WebhookPullRequest } from "./types";

export const defaultConfig: CiCaptchaConfig = {
  mode: "hybrid",
  captcha: {
    provider: "cloudflare_turnstile",
  },
  require: {
    github_login: true,
    solver_must_be_pr_author: true,
    new_sha_requires_new_captcha: true,
  },
  apply_to: {
    first_time_contributors: true,
    outside_contributors: true,
    fork_prs: true,
    bots: true,
  },
  skip: {
    authors: ["dependabot[bot]", "renovate[bot]"],
    labels: ["trusted-contributor", "no-captcha"],
  },
  checks: {
    create_required_check: true,
    name: "ci-captcha/human",
  },
  comment: {
    enabled: true,
    tone: "direct",
  },
  universal_gate: {
    rerun_after_verification: true,
  },
};

export function parseRepoConfig(raw: string | null): CiCaptchaConfig {
  if (!raw) {
    return defaultConfig;
  }
  const parsed = parse(raw) as Partial<CiCaptchaConfig> | null;
  if (!parsed) {
    return defaultConfig;
  }
  return {
    ...defaultConfig,
    ...parsed,
    captcha: {
      ...defaultConfig.captcha,
      ...parsed.captcha,
    },
    require: {
      ...defaultConfig.require,
      ...parsed.require,
    },
    apply_to: {
      ...defaultConfig.apply_to,
      ...parsed.apply_to,
    },
    skip: {
      authors: parsed.skip?.authors ?? defaultConfig.skip.authors,
      labels: parsed.skip?.labels ?? defaultConfig.skip.labels,
    },
    checks: {
      ...defaultConfig.checks,
      ...parsed.checks,
    },
    comment: {
      ...defaultConfig.comment,
      ...parsed.comment,
    },
    universal_gate: {
      ...defaultConfig.universal_gate,
      ...parsed.universal_gate,
    },
  };
}

export function shouldGatePullRequest(
  pr: WebhookPullRequest,
  config: CiCaptchaConfig,
): { gate: boolean; reasons: string[] } {
  if (config.mode === "off" || pr.draft) {
    return { gate: false, reasons: [] };
  }
  const labels = new Set(pr.labels.map((label) => label.name));
  if (config.skip.authors.includes(pr.user.login)) {
    return { gate: false, reasons: [] };
  }
  if (config.skip.labels.some((label) => labels.has(label))) {
    return { gate: false, reasons: [] };
  }

  const fork = pr.head.repo?.full_name !== pr.base.repo.full_name;
  const firstTime = ["FIRST_TIMER", "FIRST_TIME_CONTRIBUTOR"].includes(
    pr.author_association,
  );
  const outside = ["NONE", "FIRST_TIMER", "FIRST_TIME_CONTRIBUTOR"].includes(
    pr.author_association,
  );
  const bot = pr.user.type === "Bot";
  const reasons: string[] = [];

  if (config.apply_to.fork_prs && fork) {
    reasons.push("fork pull request");
  }
  if (config.apply_to.first_time_contributors && firstTime) {
    reasons.push("first-time contributor");
  }
  if (config.apply_to.outside_contributors && outside) {
    reasons.push("outside contributor");
  }
  if (config.apply_to.bots && bot) {
    reasons.push("bot account");
  }
  if (config.mode === "native_fork" && !fork) {
    return { gate: false, reasons: [] };
  }
  return { gate: reasons.length > 0, reasons };
}
