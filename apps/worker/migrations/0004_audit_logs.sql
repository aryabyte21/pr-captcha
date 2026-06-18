create table if not exists audit_logs (
  id text primary key,
  occurred_at text not null,
  event text not null,
  owner text,
  repo text,
  pr_number integer,
  head_sha text,
  gate_id text,
  installation_id text,
  actor_login text,
  details_json text not null
);

create index if not exists audit_logs_repo_pr_idx on audit_logs(owner, repo, pr_number, occurred_at);
create index if not exists audit_logs_gate_idx on audit_logs(gate_id, occurred_at);
create index if not exists audit_logs_event_idx on audit_logs(event, occurred_at);
