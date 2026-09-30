-- Admin view hardening.
-- Admins may only flip `handled` on leads; submitted content is immutable.
revoke update on public.academy_interest from authenticated;
grant update (handled) on public.academy_interest to authenticated;

-- Who handled a lead, and when (set by trigger, not by the client).
alter table public.academy_interest
  add column handled_at timestamptz,
  add column handled_by uuid references auth.users (id) on delete set null;

create or replace function public.stamp_lead_handled() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.handled is distinct from old.handled then
    new.handled_at := case when new.handled then now() end;
    new.handled_by := case when new.handled then (select auth.uid()) end;
  end if;
  return new;
end $$;
create trigger academy_interest_handled before update on public.academy_interest
  for each row execute function public.stamp_lead_handled();

create index academy_interest_created_idx on public.academy_interest (created_at desc);
create index contributions_created_idx on public.contributions (created_at desc);
