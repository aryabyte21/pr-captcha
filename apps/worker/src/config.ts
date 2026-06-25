import { parse } from "yaml";
import type { CiCaptchaConfig, WebhookPullRequest } from "./types";

const gateModes = new Set<CiCaptchaConfig["mode"]>([
  "native_fork",
  "universal",
  "required_check",
  "hybrid",
  "off",
]);

const trustedAssociations = new Set(["OWNER", "MEMBER", "COLLABORATOR"]);

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
    all_pull_requests: true,
    first_time_contributors: true,
    outside_contributors: true,
    fork_prs: true,
    bots: true,
  },
  skip: {
    authors: [],
    labels: ["trusted-contributor", "no-captcha"],
  },
  checks: {
    create_required_check: true,
    name: "pr-captcha/human",
  },
  comment: {
    enabled: true,
    tone: "direct",
  },
  universal_gate: {
    rerun_after_verification: true,
  },
};

export type ConfigDiagnostic = {
  level: "info" | "warning" | "error";
  code: string;
  message: string;
};

export type RepoConfigInspection = {
  config: CiCaptchaConfig;
  source: "default" | "repository";
  valid: boolean;
  diagnostics: ConfigDiagnostic[];
};

export function parseRepoConfig(raw: string | null): CiCaptchaConfig {
  return inspectRepoConfig(raw).config;
}

export function inspectRepoConfig(raw: string | null): RepoConfigInspection {
  if (!raw) {
    const config = cloneConfig(defaultConfig);
    return {
      config,
      source: "default",
      valid: true,
      diagnostics: [
        {
          level: "warning",
          code: "config_missing",
          message:
            ".github/pr-captcha.yml was not found. Default hybrid policy is active.",
        },
      ],
    };
  }
  const parsed = parseConfigYaml(raw);
  if (!parsed) {
    return {
      config: cloneConfig(defaultConfig),
      source: "repository",
      valid: false,
      diagnostics: [
        {
          level: "error",
          code: "config_invalid",
          message:
            ".github/pr-captcha.yml is not valid YAML. Default hybrid policy is active until it is fixed.",
        },
      ],
    };
  }
  const config = normalizeRepoConfig(parsed);
  return {
    config,
    source: "repository",
    valid: true,
    diagnostics: configDiagnostics(parsed, config),
  };
}

function normalizeRepoConfig(parsed: ConfigInput): CiCaptchaConfig {
  const captcha = nestedRecord(parsed.captcha);
  const requireConfig = nestedRecord(parsed.require);
  const applyTo = nestedRecord(parsed.apply_to);
  const skip = nestedRecord(parsed.skip);
  const checks = nestedRecord(parsed.checks);
  const comment = nestedRecord(parsed.comment);
  const universalGate = nestedRecord(parsed.universal_gate);
  const requireBooleans = mergeBooleans(defaultConfig.require, requireConfig);
  const checkBooleans = mergeBooleans(
    { create_required_check: defaultConfig.checks.create_required_check },
    checks,
  );
  const commentBooleans = mergeBooleans(
    { enabled: defaultConfig.comment.enabled },
    comment,
  );
  const mode = gateMode(parsed.mode) ?? defaultConfig.mode;
  const checkName = typeof checks?.name === "string" ? checks.name.trim() : "";
  const createRequiredCheck =
    mode === "required_check" ? true : checkBooleans.create_required_check;
  const commentEnabled =
    shouldForceCommentSurface(mode, createRequiredCheck) ||
    commentBooleans.enabled;
  return {
    ...defaultConfig,
    mode,
    captcha: {
      ...defaultConfig.captcha,
      provider:
        captcha?.provider === "cloudflare_turnstile"
          ? captcha.provider
          : defaultConfig.captcha.provider,
    },
    require: {
      ...requireBooleans,
      github_login: true,
      new_sha_requires_new_captcha: true,
    },
    apply_to: mergeBooleans(defaultConfig.apply_to, applyTo),
    skip: {
      authors: [...(stringList(skip?.authors) ?? defaultConfig.skip.authors)],
      labels: [...(stringList(skip?.labels) ?? defaultConfig.skip.labels)],
    },
    checks: {
      create_required_check: createRequiredCheck,
      name: checkName || defaultConfig.checks.name,
    },
    comment: {
      enabled: commentEnabled,
      tone:
        comment?.tone === "direct" ? comment.tone : defaultConfig.comment.tone,
    },
    universal_gate: mergeBooleans(defaultConfig.universal_gate, universalGate),
  };
}

function configDiagnostics(
  parsed: ConfigInput,
  config: CiCaptchaConfig,
): ConfigDiagnostic[] {
  const diagnostics: ConfigDiagnostic[] = [];
  const requireConfig = nestedRecord(parsed.require);
  const enabledTargets = Object.values(config.apply_to).filter(Boolean).length;
  if (config.mode === "off") {
    diagnostics.push({
      level: "warning",
      code: "mode_off",
      message: "mode is off. pr-captcha will not gate pull requests.",
    });
  }
  if (enabledTargets === 0 && config.mode !== "off") {
    diagnostics.push({
      level: "warning",
      code: "no_pr_targets",
      message:
        "No pull request targets are enabled under apply_to. No pull requests will be gated.",
    });
  }
  if (requireConfig?.github_login === false) {
    diagnostics.push({
      level: "info",
      code: "github_login_enforced",
      message:
        "require.github_login is always enforced even when configured false.",
    });
  }
  if (requireConfig?.new_sha_requires_new_captcha === false) {
    diagnostics.push({
      level: "info",
      code: "sha_binding_enforced",
      message:
        "require.new_sha_requires_new_captcha is always enforced even when configured false.",
    });
  }
  if (!config.require.solver_must_be_pr_author) {
    diagnostics.push({
      level: "warning",
      code: "maintainer_solver_policy",
      message:
        "require.solver_must_be_pr_author is false. Non-author solves require repository write, maintain, or admin permission.",
    });
  }
  if (!config.checks.create_required_check && !config.comment.enabled) {
    diagnostics.push({
      level: "warning",
      code: "no_pr_surface",
      message:
        "Checks and comments are disabled. Only the universal Action can surface the gate.",
    });
  }
  if (diagnostics.length === 0) {
    diagnostics.push({
      level: "info",
      code: "config_ready",
      message: ".github/pr-captcha.yml parsed successfully.",
    });
  }
  return diagnostics;
}

function shouldForceCommentSurface(
  mode: CiCaptchaConfig["mode"],
  createRequiredCheck: boolean,
): boolean {
  return !createRequiredCheck && (mode === "native_fork" || mode === "hybrid");
}

type ConfigInput = Record<string, unknown>;

function parseConfigYaml(raw: string): ConfigInput | null {
  try {
    const parsed = parse(raw) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function gateMode(value: unknown): CiCaptchaConfig["mode"] | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  return gateModes.has(normalized as CiCaptchaConfig["mode"])
    ? (normalized as CiCaptchaConfig["mode"])
    : null;
}

function cloneConfig(config: CiCaptchaConfig): CiCaptchaConfig {
  return {
    mode: config.mode,
    captcha: { ...config.captcha },
    require: { ...config.require },
    apply_to: { ...config.apply_to },
    skip: {
      authors: [...config.skip.authors],
      labels: [...config.skip.labels],
    },
    checks: { ...config.checks },
    comment: { ...config.comment },
    universal_gate: { ...config.universal_gate },
  };
}

function mergeBooleans<T extends Record<string, boolean>>(
  defaults: T,
  input: unknown,
): T {
  const next = { ...defaults };
  if (!isRecord(input)) {
    return next;
  }
  for (const key of Object.keys(defaults) as Array<keyof T>) {
    if (typeof input[String(key)] === "boolean") {
      next[key] = input[String(key)] as T[keyof T];
    }
  }
  return next;
}

function stringList(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

function nestedRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function shouldGatePullRequest(
  pr: WebhookPullRequest,
  config: CiCaptchaConfig,
): { gate: boolean; reasons: string[] } {
  if (config.mode === "off" || pr.draft) {
    return { gate: false, reasons: [] };
  }
  const author = normalizeComparableName(pr.user.login);
  const skipAuthors = new Set(config.skip.authors.map(normalizeComparableName));
  if (skipAuthors.has(author)) {
    return { gate: false, reasons: [] };
  }
  const labels = new Set(
    pr.labels.map((label) => normalizeComparableName(label.name)),
  );
  if (
    config.skip.labels.some((label) =>
      labels.has(normalizeComparableName(label)),
    )
  ) {
    return { gate: false, reasons: [] };
  }

  const fork = pr.head.repo?.full_name !== pr.base.repo.full_name;
  const association = pr.author_association.toUpperCase();
  const firstTime = ["FIRST_TIMER", "FIRST_TIME_CONTRIBUTOR"].includes(
    association,
  );
  const outside = !trustedAssociations.has(association);
  const bot = pr.user.type === "Bot";
  const reasons: string[] = [];

  if (config.mode === "native_fork" && !fork) {
    return { gate: false, reasons: [] };
  }
  if (config.apply_to.all_pull_requests) {
    reasons.push("all pull requests");
  }
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
  return { gate: reasons.length > 0, reasons };
}

function normalizeComparableName(value: string): string {
  return value.trim().toLowerCase();
}
