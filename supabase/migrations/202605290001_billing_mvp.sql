-- Composure billing/auth foundation.
-- Safe to run more than once in a Supabase SQL editor or through migrations.

create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'trialing',
  solves_used int not null default 0,
  daily_solves_used int not null default 0,
  daily_reset_at timestamptz not null default now(),
  paystack_customer_code text,
  paystack_subscription_code text,
  paystack_plan_code text,
  paystack_reference text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  plan_changed_at timestamptz not null default now(),
  active_device_id text,
  active_device_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions
  add column if not exists plan text not null default 'free',
  add column if not exists status text not null default 'trialing',
  add column if not exists solves_used int not null default 0,
  add column if not exists daily_solves_used int not null default 0,
  add column if not exists daily_reset_at timestamptz not null default now(),
  add column if not exists paystack_customer_code text,
  add column if not exists paystack_subscription_code text,
  add column if not exists paystack_plan_code text,
  add column if not exists paystack_reference text,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists trial_end timestamptz,
  add column if not exists plan_changed_at timestamptz not null default now(),
  add column if not exists active_device_id text,
  add column if not exists active_device_updated_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.subscriptions
   set plan = 'free',
       updated_at = now()
 where plan = 'starter';

alter table public.subscriptions
  drop constraint if exists subscriptions_plan_check;

alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan = any (array['free'::text, 'pro'::text, 'premium'::text]));

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status = any (array['trialing'::text, 'active'::text, 'canceled'::text, 'past_due'::text]));

create unique index if not exists subscriptions_user_id_key
  on public.subscriptions (user_id);

create unique index if not exists subscriptions_paystack_customer_code_key
  on public.subscriptions (paystack_customer_code)
  where paystack_customer_code is not null;

create unique index if not exists subscriptions_paystack_subscription_code_key
  on public.subscriptions (paystack_subscription_code)
  where paystack_subscription_code is not null;

create unique index if not exists subscriptions_paystack_reference_key
  on public.subscriptions (paystack_reference)
  where paystack_reference is not null;

create index if not exists subscriptions_user_status_idx
  on public.subscriptions (user_id, status);

create index if not exists subscriptions_period_end_idx
  on public.subscriptions (current_period_end);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can view own subscription" on public.subscriptions;
drop policy if exists "Users can read own subscription" on public.subscriptions;
drop policy if exists "Insert own subscription" on public.subscriptions;
drop policy if exists "No direct inserts" on public.subscriptions;
drop policy if exists "No direct updates" on public.subscriptions;
drop policy if exists "No direct deletes" on public.subscriptions;

create policy "Users can read own subscription"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create policy "No direct inserts"
  on public.subscriptions
  for insert
  with check (false);

create policy "No direct updates"
  on public.subscriptions
  for update
  using (false);

create policy "No direct deletes"
  on public.subscriptions
  for delete
  using (false);

create or replace function public.create_subscription_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'trialing')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace function public.ensure_subscription_row()
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions;
begin
  if auth.uid() is null then
    return null;
  end if;

  select *
    into sub
    from public.subscriptions
   where user_id = auth.uid();

  if sub is null then
    insert into public.subscriptions (user_id, plan, status)
    values (auth.uid(), 'free', 'trialing')
    returning * into sub;
  end if;

  return sub;
end;
$$;

create or replace function public.activate_free_plan()
returns public.subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  sub public.subscriptions;
begin
  if auth.uid() is null then
    return null;
  end if;

  select *
    into sub
    from public.subscriptions
   where user_id = auth.uid();

  if sub is not null and sub.plan in ('pro', 'premium') and sub.status = 'active' then
    raise exception 'Free plan cannot be activated while a paid plan is active';
  end if;

  insert into public.subscriptions (
    user_id,
    plan,
    status,
    paystack_customer_code,
    paystack_subscription_code,
    paystack_plan_code,
    paystack_reference,
    current_period_end,
    cancel_at_period_end,
    trial_end,
    plan_changed_at,
    updated_at
  )
  values (
    auth.uid(),
    'free',
    'trialing',
    null,
    null,
    null,
    null,
    null,
    false,
    null,
    now(),
    now()
  )
  on conflict (user_id) do update
  set plan = 'free',
      status = 'trialing',
      paystack_customer_code = null,
      paystack_subscription_code = null,
      paystack_plan_code = null,
      paystack_reference = null,
      current_period_end = null,
      cancel_at_period_end = false,
      trial_end = null,
      plan_changed_at = now(),
      updated_at = now()
  returning * into sub;

  return sub;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists create_subscription_for_new_user on auth.users;

create trigger create_subscription_for_new_user
  after insert on auth.users
  for each row
  execute function public.create_subscription_for_new_user();

create or replace function public.can_user_solve(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  sub record;
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    return false;
  end if;

  select *
    into sub
    from public.subscriptions
   where user_id = p_user_id;

  if sub is null then
    return false;
  end if;

  if sub.status not in ('trialing', 'active') then
    return false;
  end if;

  if sub.daily_reset_at < now() - interval '1 day' then
    update public.subscriptions
       set daily_solves_used = 0,
           daily_reset_at = now(),
           updated_at = now()
     where user_id = p_user_id;

    sub.daily_solves_used := 0;
  end if;

  return case sub.plan
    when 'free' then sub.daily_solves_used < 5
    when 'pro' then true
    when 'premium' then true
    else false
  end;
end;
$$;

create or replace function public.increment_solves()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.can_user_solve(auth.uid()) then
    raise exception 'Solve limit reached or subscription inactive';
  end if;

  update public.subscriptions
     set solves_used = solves_used + 1,
         daily_solves_used = daily_solves_used + 1,
         updated_at = now()
   where user_id = auth.uid();

  if not found then
    raise exception 'No subscription row found for user';
  end if;
end;
$$;

create or replace function public.reset_daily_usage()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.subscriptions
     set daily_solves_used = 0,
         daily_reset_at = now(),
         updated_at = now()
   where daily_reset_at < now() - interval '1 day';
end;
$$;

create or replace function public.claim_active_device(p_user_id uuid, p_device_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() is distinct from p_user_id then
    return false;
  end if;

  update public.subscriptions
     set active_device_id = p_device_id,
         active_device_updated_at = now(),
         updated_at = now()
   where user_id = p_user_id
     and status in ('trialing', 'active');

  return found;
end;
$$;

create or replace function public.is_active_device(p_user_id uuid, p_device_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select active_device_id = p_device_id
        from public.subscriptions
       where user_id = p_user_id
         and status in ('trialing', 'active')
    ),
    false
  );
$$;

revoke execute on function public.create_subscription_for_new_user() from public;
revoke execute on function public.ensure_subscription_row() from public;
revoke execute on function public.activate_free_plan() from public;
revoke execute on function public.can_user_solve(uuid) from public;
revoke execute on function public.increment_solves() from public;
revoke execute on function public.reset_daily_usage() from public;
revoke execute on function public.claim_active_device(uuid, text) from public;
revoke execute on function public.is_active_device(uuid, text) from public;

grant execute on function public.ensure_subscription_row() to authenticated;
grant execute on function public.activate_free_plan() to authenticated;
grant execute on function public.can_user_solve(uuid) to authenticated;
grant execute on function public.increment_solves() to authenticated;
grant execute on function public.claim_active_device(uuid, text) to authenticated;
grant execute on function public.is_active_device(uuid, text) to authenticated;
grant execute on function public.reset_daily_usage() to service_role;

do $$
begin
  alter publication supabase_realtime add table public.subscriptions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;
