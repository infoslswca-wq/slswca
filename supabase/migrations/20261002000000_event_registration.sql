-- Events + registration.
-- All capacity / payment logic lives here so web and mobile behave identically
-- and races (two people taking the last spot) are impossible.

alter table public.events
  add column tag text,
  add column ends_at timestamptz,
  add column registration_opens_at timestamptz,
  add column registration_closes_at timestamptz,
  add column waiver_version text not null default '2026-10';

alter table public.event_registrations
  add column emergency_contact_name text check (char_length(emergency_contact_name) <= 120),
  add column emergency_contact_phone text check (char_length(emergency_contact_phone) <= 24),
  add column waiver_version text,
  add column adult_or_guardian_consent boolean not null default false,
  add column updated_at timestamptz not null default now();
create trigger registrations_touch before update on public.event_registrations
  for each row execute function public.touch_updated_at();
create index registrations_event_idx on public.event_registrations (event_id, status);

-- Unpaid "pending" registrations hold a spot for this long.
create or replace function public.registration_hold() returns interval
language sql immutable as $$ select interval '30 minutes' $$;

-- Spots taken = confirmed + recent pending.
create or replace function public.event_spots_taken(p_event uuid) returns int
language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.event_registrations r
  where r.event_id = p_event
    and (r.status = 'confirmed'
         or (r.status = 'pending' and r.created_at > now() - public.registration_hold()));
$$;

-- Public, cheap availability for event pages (no personal data).
create or replace function public.event_availability(p_slug text)
returns table (capacity int, taken int)
language sql stable security definer set search_path = '' as $$
  select e.capacity, public.event_spots_taken(e.id) from public.events e
  where e.slug = p_slug and e.status = 'published';
$$;
grant execute on function public.event_availability(text) to anon, authenticated;

/**
 * Register a user. Called by the server with the service role after it has
 * authenticated the user. Returns the registration and, for paid events, the
 * pending payment it created (the server then signs a PayHere checkout).
 * Errors are raised with stable codes in the message: REG_<CODE>.
 */
create or replace function public.register_for_event(
  p_user uuid,
  p_slug text,
  p_category text,
  p_club uuid,
  p_emergency_name text,
  p_emergency_phone text,
  p_adult_or_guardian boolean,
  p_order_id text
) returns table (registration_id uuid, status public.registration_status, ticket_code text, payment_id uuid, amount numeric)
language plpgsql security definer set search_path = '' as $$
declare
  ev public.events;
  existing public.event_registrations;
  has_existing boolean;
  pay_id uuid;
  reg public.event_registrations;
begin
  -- Lock the event row: serialises concurrent registrations for this event.
  select * into ev from public.events where slug = p_slug for update;
  if not found or ev.status <> 'published' then raise exception 'REG_NOT_FOUND'; end if;
  if ev.registration_opens_at is not null and now() < ev.registration_opens_at then raise exception 'REG_NOT_OPEN'; end if;
  if ev.registration_closes_at is not null and now() > ev.registration_closes_at then raise exception 'REG_CLOSED'; end if;
  if ev.starts_at is not null and now() > ev.starts_at then raise exception 'REG_CLOSED'; end if;
  if cardinality(ev.categories) > 0 and (p_category is null or not (p_category = any (ev.categories))) then
    raise exception 'REG_BAD_CATEGORY';
  end if;
  if not p_adult_or_guardian then raise exception 'REG_CONSENT_REQUIRED'; end if;

  select * into existing from public.event_registrations where event_id = ev.id and user_id = p_user;
  has_existing := found; -- capture now: later statements overwrite FOUND
  if has_existing and (existing.status = 'confirmed'
                or (existing.status = 'pending' and existing.created_at > now() - public.registration_hold())) then
    raise exception 'REG_ALREADY_REGISTERED';
  end if;

  if ev.capacity is not null and public.event_spots_taken(ev.id) >= ev.capacity then
    raise exception 'REG_FULL';
  end if;

  if ev.fee_lkr > 0 then
    if p_order_id is null then raise exception 'REG_ORDER_REQUIRED'; end if;
    insert into public.payments (order_id, purpose, user_id, amount)
    values (p_order_id, 'registration', p_user, ev.fee_lkr)
    returning id into pay_id;
  end if;

  if has_existing then
    -- Re-registering after a cancelled/expired attempt: reuse the row (unique per event+user).
    update public.event_registrations r set
      category = p_category, club_id = p_club,
      emergency_contact_name = p_emergency_name, emergency_contact_phone = p_emergency_phone,
      adult_or_guardian_consent = p_adult_or_guardian,
      waiver_accepted_at = now(), waiver_version = ev.waiver_version,
      status = case when pay_id is null then 'confirmed'::public.registration_status else 'pending' end,
      payment_id = pay_id, created_at = now()
    where r.id = existing.id
    returning * into reg;
  else
    insert into public.event_registrations
      (event_id, user_id, category, club_id, emergency_contact_name, emergency_contact_phone,
       adult_or_guardian_consent, waiver_accepted_at, waiver_version, status, payment_id)
    values
      (ev.id, p_user, p_category, p_club, p_emergency_name, p_emergency_phone,
       p_adult_or_guardian, now(), ev.waiver_version,
       case when pay_id is null then 'confirmed'::public.registration_status else 'pending' end, pay_id)
    returning * into reg;
  end if;

  return query select reg.id, reg.status, reg.ticket_code, pay_id, ev.fee_lkr;
end $$;
revoke execute on function public.register_for_event(uuid, text, text, uuid, text, text, boolean, text) from public, anon, authenticated;
grant execute on function public.register_for_event(uuid, text, text, uuid, text, text, boolean, text) to service_role;

-- Payment outcome drives the registration (PayHere notify → payments.status).
create or replace function public.sync_registration_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.purpose = 'registration' and new.status is distinct from old.status then
    update public.event_registrations set status =
      case when new.status = 'success' then 'confirmed'::public.registration_status
           when new.status in ('failed', 'cancelled', 'chargedback') then 'cancelled'
           else status end
    where payment_id = new.id;
  end if;
  return new;
end $$;
create trigger payments_sync_registration after update of status on public.payments
  for each row execute function public.sync_registration_payment();

-- Members may cancel their own registration (frees the spot); nothing else.
create or replace function public.cancel_my_registration(p_ticket text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  update public.event_registrations r set status = 'cancelled'
  from public.events e
  where r.ticket_code = p_ticket and r.user_id = (select auth.uid()) and r.event_id = e.id
    and r.status <> 'cancelled' and (e.starts_at is null or e.starts_at > now());
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke execute on function public.cancel_my_registration(text) from public, anon;
grant execute on function public.cancel_my_registration(text) to authenticated;

-- Members can see which event a registration belongs to even after it's unpublished.
create policy events_registered_read on public.events for select to authenticated
  using (exists (select 1 from public.event_registrations r where r.event_id = events.id and r.user_id = (select auth.uid())));
