create table if not exists public.game_results (
  tournament_id text not null,
  match_id text not null,
  player1_score integer,
  player2_score integer,
  updated_at timestamptz not null default now(),
  primary key (tournament_id, match_id),
  constraint game_results_player1_score_check check (player1_score between 0 and 7),
  constraint game_results_player2_score_check check (player2_score between 0 and 7)
);

alter table public.game_results enable row level security;

drop policy if exists "Public game results are readable" on public.game_results;
create policy "Public game results are readable"
  on public.game_results
  for select
  to anon
  using (true);

drop policy if exists "Public game results can be inserted" on public.game_results;
create policy "Public game results can be inserted"
  on public.game_results
  for insert
  to anon
  with check (true);

drop policy if exists "Public game results can be updated" on public.game_results;
create policy "Public game results can be updated"
  on public.game_results
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Public game results can be deleted" on public.game_results;
create policy "Public game results can be deleted"
  on public.game_results
  for delete
  to anon
  using (true);

grant select, insert, update, delete on public.game_results to anon;

create or replace function public.set_game_results_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_game_results_updated_at on public.game_results;

create trigger set_game_results_updated_at
  before update on public.game_results
  for each row
  execute function public.set_game_results_updated_at();
