-- Run via scripts/test-db.sh. Any failed assertion raises and aborts.
\set ON_ERROR_STOP on
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@x.lk', '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@x.lk',   '{"full_name":"Bob"}'),
  ('00000000-0000-0000-0000-00000000000c', 'cat@x.lk',   '{}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a';
insert into public.events (slug, kind, status, title) values ('pub', 'workshop', 'published', 'Pub'), ('draft', 'workshop', 'draft', 'Draft');
insert into public.payments (order_id, purpose, user_id, amount) values
  ('o-bob', 'contribution', '00000000-0000-0000-0000-00000000000b', 1000),
  ('o-cat', 'contribution', '00000000-0000-0000-0000-00000000000c', 2500);
insert into public.academy_interest (name, email, pathway) values ('Kasun', 'k@x.lk', 'Coaching');

create function pg_temp.assert(ok boolean, msg text) returns void language plpgsql as
  $$ begin if not ok then raise exception 'ASSERT FAILED: %', msg; end if; end $$;

-- trigger created profiles
select pg_temp.assert((select count(*) from public.profiles) = 3, 'profiles auto-created');

-- ---------- anon
set role anon;
select pg_temp.assert((select count(*) from public.clubs) = 11, 'anon reads clubs (seed)');
select pg_temp.assert((select count(*) from public.events) = 1, 'anon sees only published events');
select pg_temp.assert((select count(*) from public.payments) = 0, 'anon sees no payments');
select pg_temp.assert((select count(*) from public.profiles) = 0, 'anon sees no profiles');
do $$ begin
  begin insert into public.academy_interest (name, email, pathway) values ('Spam', 's@x', 'Coaching');
    raise exception 'ASSERT FAILED: anon inserted academy_interest';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.academy_interest;
    raise exception 'ASSERT FAILED: anon read academy_interest';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ---------- bob (member)
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select pg_temp.assert((select count(*) from public.payments) = 1, 'bob sees only own payment');
select pg_temp.assert((select order_id from public.payments) = 'o-bob', 'bob payment is his');
select pg_temp.assert((select count(*) from public.profiles) = 1, 'bob sees only own profile');
select pg_temp.assert((select count(*) from public.events) = 1, 'member sees no drafts');
select pg_temp.assert((select count(*) from public.academy_interest) = 0, 'member cannot read leads');
update public.profiles set full_name = 'Bobby' where id = '00000000-0000-0000-0000-00000000000b';
update public.profiles set full_name = 'Hacked' where id = '00000000-0000-0000-0000-00000000000c';
do $$ begin
  begin update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000b';
    raise exception 'ASSERT FAILED: bob escalated role';
  exception when insufficient_privilege then null; end;
  begin insert into public.payments (order_id, purpose, amount) values ('x', 'contribution', 1);
    raise exception 'ASSERT FAILED: bob inserted payment';
  exception when insufficient_privilege then null; end;
  begin update public.payments set status = 'success';
    raise exception 'ASSERT FAILED: bob marked payment success';
  exception when insufficient_privilege then null; end;
  begin insert into public.events (slug, kind, title) values ('evil', 'workshop', 'x');
    raise exception 'ASSERT FAILED: member created event';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select pg_temp.assert((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'Bobby', 'bob updated own name');
select pg_temp.assert((select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c') is null, 'bob could not edit cat');
select pg_temp.assert((select role from public.profiles where id = '00000000-0000-0000-0000-00000000000b') = 'member', 'bob still member');

-- ---------- admin
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select pg_temp.assert((select count(*) from public.events) = 2, 'admin sees drafts');
select pg_temp.assert((select count(*) from public.payments) = 2, 'admin sees all payments');
select pg_temp.assert((select count(*) from public.academy_interest) = 1, 'admin reads leads');
insert into public.events (slug, kind, title) values ('admin-made', 'competition', 'OK');
reset role;

\echo 'RLS tests passed'
