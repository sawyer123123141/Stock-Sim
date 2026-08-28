create schema if not exists private;

create table if not exists private.game_state (
  id text primary key,
  runtime jsonb not null,
  portfolio jsonb not null,
  next_trade_id integer not null check (next_trade_id > 0),
  updated_at timestamptz not null default now()
);

alter table private.game_state enable row level security;

revoke all on schema private from anon, authenticated;
revoke all on table private.game_state from anon, authenticated;
