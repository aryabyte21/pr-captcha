create table if not exists gates (
  id text primary key,
  installation_id text not null,
  owner text not null,
  repo text not null,
  pr_number integer not null,
  head_sha text not null,
  pr_author text not null,
  status text not null,
  gate_url text not null,
  gate_token_hash text not null,
  check_run_id integer,
  comment_id integer,
  last_error text,
  created_at text not null,
  updated_at text not null,
  expires_at text not null,
  unique(owner, repo, pr_number, head_sha)
);

create index if not exists gates_identity_idx on gates(owner, repo, pr_number, head_sha);

create table if not exists verifications (
  id text primary key,
  gate_id text not null,
  installation_id text not null,
  owner text not null,
  repo text not null,
  pr_number integer not null,
  head_sha text not null,
  pr_author text not null,
  solver_login text not null,
  captcha_provider text not null,
  captcha_passed_at text not null,
  expires_at text not null,
  unique(owner, repo, pr_number, head_sha),
  foreign key(gate_id) references gates(id)
);

create index if not exists verifications_identity_idx on verifications(owner, repo, pr_number, head_sha);
