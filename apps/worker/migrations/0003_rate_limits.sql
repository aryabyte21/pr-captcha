create table if not exists rate_limits (
  bucket_key text primary key,
  window_start text not null,
  count integer not null,
  expires_at text not null
);

create index if not exists rate_limits_expires_idx on rate_limits(expires_at);
