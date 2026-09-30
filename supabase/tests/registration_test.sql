\set ON_ERROR_STOP on
create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as
  $$ begin if not ok then raise exception 'ASSERT FAILED: %', msg; end if; end $$;
-- expect a REG_<code> error from a statement
create function pg_temp.expect_err(stmt text, code text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'ASSERT FAILED: expected %', code;
exception when others then
  if sqlerrm not like code || '%' then raise exception 'ASSERT FAILED: expected %, got %', code, sqlerrm; end if;
end $$;

insert into auth.users (id, email) select ('00000000-0000-0000-0000-0000000001' || lpad(i::text, 2, '0'))::uuid, 'u' || i || '@x.lk' from generate_series(1, 5) i;
insert into public.events (slug, kind, status, title, fee_lkr, capacity, categories, starts_at) values
  ('free-ws', 'workshop', 'published', 'Free workshop', 0, 2, '{}', now() + interval '7 days'),
  ('paid-boc', 'competition', 'published', 'Battle 2026', 1500, 10, '{Open,Women,U18}', now() + interval '14 days'),
  ('draft-ev', 'workshop', 'draft', 'Draft', 0, null, '{}', now() + interval '7 days'),
  ('past-ev', 'workshop', 'published', 'Past', 0, null, '{}', now() - interval '1 day'),
  ('later', 'workshop', 'published', 'Opens later', 0, null, '{}', now() + interval '30 days');
update public.events set registration_opens_at = now() + interval '1 day' where slug = 'later';

-- free event: confirmed immediately with a ticket
select pg_temp.assert(
  (select status = 'confirmed' and ticket_code is not null and payment_id is null
   from public.register_for_event('00000000-0000-0000-0000-000000000101', 'free-ws', null, null, 'Mum', '+94771234567', true, null)),
  'free registration confirmed');

-- duplicate blocked
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000101','free-ws',null,null,null,null,true,null)$$, 'REG_ALREADY_REGISTERED');
-- capacity 2: second ok, third full
select * from public.register_for_event('00000000-0000-0000-0000-000000000102', 'free-ws', null, null, null, null, true, null);
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000103','free-ws',null,null,null,null,true,null)$$, 'REG_FULL');
select pg_temp.assert((select taken = 2 and capacity = 2 from public.event_availability('free-ws')), 'availability reports full');

-- guards
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000103','draft-ev',null,null,null,null,true,null)$$, 'REG_NOT_FOUND');
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000103','past-ev',null,null,null,null,true,null)$$, 'REG_CLOSED');
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000103','later',null,null,null,null,true,null)$$, 'REG_NOT_OPEN');
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000103','paid-boc','Masters',null,null,null,true,'O-1')$$, 'REG_BAD_CATEGORY');
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000103','paid-boc','Open',null,null,null,false,'O-1')$$, 'REG_CONSENT_REQUIRED');
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000103','paid-boc','Open',null,null,null,true,null)$$, 'REG_ORDER_REQUIRED');

-- paid event: pending + payment; PayHere success confirms it
select pg_temp.assert(
  (select status = 'pending' and payment_id is not null and amount = 1500
   from public.register_for_event('00000000-0000-0000-0000-000000000103', 'paid-boc', 'Open', null, null, null, true, 'O-PAID-1')),
  'paid registration pending with payment');
update public.payments set status = 'success' where order_id = 'O-PAID-1';
select pg_temp.assert((select r.status = 'confirmed' from public.event_registrations r join public.payments p on p.id = r.payment_id where p.order_id = 'O-PAID-1'), 'payment success confirms registration');

-- failed payment cancels; user can then re-register (row reused)
select * from public.register_for_event('00000000-0000-0000-0000-000000000104', 'paid-boc', 'Women', null, null, null, true, 'O-PAID-2');
update public.payments set status = 'failed' where order_id = 'O-PAID-2';
select pg_temp.assert((select r.status = 'cancelled' from public.event_registrations r join public.payments p on p.id = r.payment_id where p.order_id = 'O-PAID-2'), 'failed payment cancels');
select pg_temp.assert((select status = 'pending' from public.register_for_event('00000000-0000-0000-0000-000000000104', 'paid-boc', 'Women', null, null, null, true, 'O-PAID-3')), 're-register after failure');
select pg_temp.assert((select count(*) = 1 from public.event_registrations r join public.events e on e.id = r.event_id where e.slug = 'paid-boc' and r.user_id = '00000000-0000-0000-0000-000000000104'), 'one row per user per event');

-- stale pending (unpaid > 30 min) releases the spot
update public.event_registrations set created_at = now() - interval '31 minutes'
  where payment_id = (select id from public.payments where order_id = 'O-PAID-3');
select pg_temp.assert((select taken = 1 from public.event_availability('paid-boc')), 'stale pending not counted');

-- clients can't call the service-only function; members cancel only their own
select ticket_code as t101 from public.event_registrations where user_id = '00000000-0000-0000-0000-000000000101' \gset
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000105';
select pg_temp.expect_err($$select * from public.register_for_event('00000000-0000-0000-0000-000000000105','free-ws',null,null,null,null,true,null)$$, 'permission denied');
select pg_temp.assert(not public.cancel_my_registration(:'t101'), 'cannot cancel someone else''s ticket');
set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000101';
select pg_temp.assert((select count(*) = 1 from public.events where slug = 'free-ws'), 'registrant sees event');
select pg_temp.assert(public.cancel_my_registration(:'t101'), 'can cancel own ticket');
select pg_temp.assert(not public.cancel_my_registration(:'t101'), 'second cancel is a no-op');
reset role;
select pg_temp.assert((select taken = 1 from public.event_availability('free-ws')), 'cancel frees the spot');
\echo 'registration tests passed'
