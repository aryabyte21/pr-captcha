create table if not exists webhook_deliveries (
  id text primary key,
  event text not null,
  status text not null,
  created_at text not null,
  updated_at text not null
);

create index if not exists webhook_deliveries_status_idx on webhook_deliveries(status, updated_at);
