alter table gates add column gate_nonce_hash text;

create index if not exists gates_nonce_idx on gates(gate_nonce_hash);
create index if not exists gates_expires_idx on gates(expires_at);
create index if not exists verifications_expires_idx on verifications(expires_at);
