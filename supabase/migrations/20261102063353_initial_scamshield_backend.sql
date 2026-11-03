-- Run once in the Supabase SQL Editor, or apply with the Supabase CLI.
begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  email text not null check (char_length(email) <= 254),
  phone_number text check (phone_number is null or phone_number ~ '^\+91[6-9][0-9]{9}$'),
  phone_verified_at timestamptz,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_unique on public.profiles (lower(email));
create unique index profiles_verified_phone_unique on public.profiles (phone_number) where phone_verified_at is not null;

create table public.scan_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scan_type text not null check (scan_type in ('text', 'screenshot', 'url')),
  content_reference text not null check (char_length(content_reference) <= 8000),
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null check (risk_level in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  -- No calibrated probability is available. NULL means confidence is not estimated.
  confidence real check (confidence is null or confidence between 0 and 1),
  detection_method text not null check (char_length(detection_method) <= 200),
  summary text not null check (char_length(summary) <= 1000),
  explanation text not null check (char_length(explanation) <= 5000),
  warning_signs jsonb not null default '[]'::jsonb check (jsonb_typeof(warning_signs) = 'array'),
  suspicious_phrases jsonb not null default '[]'::jsonb check (jsonb_typeof(suspicious_phrases) = 'array'),
  recommendations jsonb not null default '[]'::jsonb check (jsonb_typeof(recommendations) = 'array'),
  limitations text not null check (char_length(limitations) <= 3000),
  ai_used boolean not null default false,
  fallback_reason text,
  created_at timestamptz not null default now(),
  check (risk_level = case when risk_score >= 85 then 'CRITICAL' when risk_score >= 60 then 'HIGH' when risk_score >= 30 then 'MEDIUM' else 'LOW' end)
);
create index scan_history_user_created_idx on public.scan_history(user_id, created_at desc, id desc);
create index scan_history_risk_idx on public.scan_history(risk_level);

create table public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  scan_id uuid references public.scan_history(id) on delete set null,
  scan_type text not null check (scan_type in ('text', 'screenshot', 'url')),
  description text not null check (char_length(description) between 10 and 2000),
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW', 'CONFIRMED_SCAM', 'BENIGN')),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);
create index scam_reports_user_idx on public.scam_reports(user_id);
create index scam_reports_scan_idx on public.scam_reports(scan_id);
create index scam_reports_status_created_idx on public.scam_reports(status, created_at desc);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  notification_preferences jsonb not null default '{"security_notices":true}'::jsonb
    check (jsonb_typeof(notification_preferences) = 'object'),
  privacy_preferences jsonb not null default '{"save_history":true,"store_content":false,"use_ai":true}'::jsonb
    check (jsonb_typeof(privacy_preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- auth.sessions is authoritative for revocation; signature-only JWT validation
-- otherwise continues to allow a logged-out token until its expiry time.
create function private.session_is_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.sessions s
    where s.id::text = (select auth.jwt()->>'session_id')
      and s.user_id = (select auth.uid())
      and (s.not_after is null or s.not_after > now())
  );
$$;
revoke all on function private.session_is_active() from public, anon;
grant execute on function private.session_is_active() to authenticated;

-- Expose only an invoker wrapper; privileged auth-table access stays private.
create function public.session_is_active() returns boolean
language sql stable security invoker set search_path = '' as $$
  select private.session_is_active();
$$;
revoke all on function public.session_is_active() from public, anon;
grant execute on function public.session_is_active() to authenticated;

-- SECURITY DEFINER avoids recursive RLS when looking up the caller's role.
-- Only a trusted SQL administrator can change profiles.role.
create function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.session_is_active() and exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.touch_updated_at() from public;
create trigger settings_updated before update on public.user_settings
for each row execute function private.touch_updated_at();

-- Unverified contact numbers are not unique (anyone can type someone else's
-- number). A number with verified ownership cannot be newly claimed by another
-- profile. The application never sets phone_verified_at or enables phone login.
create function private.guard_profile_phone() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.phone_number is distinct from old.phone_number then
    new.phone_verified_at = null;
  end if;
  if new.phone_number is not null and exists (
    select 1 from public.profiles p where p.phone_number = new.phone_number
      and p.phone_verified_at is not null and p.id <> new.id
  ) then
    raise exception 'Phone number is already verified on another account' using errcode = '23505';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function private.guard_profile_phone() from public;
create trigger profile_phone_guard before insert or update on public.profiles
for each row execute function private.guard_profile_phone();

create function private.sync_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  profile_name text;
  profile_phone text;
begin
  profile_name = left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'User'), 100);
  if char_length(profile_name) < 2 then profile_name = 'User'; end if;
  profile_phone = nullif(new.raw_user_meta_data->>'phone_number', '');
  insert into public.profiles(id, full_name, email, phone_number)
  values (new.id, profile_name, new.email, profile_phone)
  on conflict (id) do update set
    full_name = excluded.full_name, email = excluded.email,
    phone_number = excluded.phone_number;
  insert into public.user_settings(user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function private.sync_auth_user() from public;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.sync_auth_user();
create trigger on_auth_user_updated after update of email, raw_user_meta_data on auth.users
for each row execute function private.sync_auth_user();

-- Backfill any existing email accounts when installing into a used project.
insert into public.profiles(id, full_name, email, phone_number)
select id,
  case when char_length(trim(coalesce(raw_user_meta_data->>'full_name', ''))) >= 2
    then left(trim(raw_user_meta_data->>'full_name'), 100) else 'User' end,
  email,
  case when raw_user_meta_data->>'phone_number' ~ '^\+91[6-9][0-9]{9}$'
    then raw_user_meta_data->>'phone_number' else null end
from auth.users where email is not null on conflict do nothing;
insert into public.user_settings(user_id) select id from public.profiles on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.scan_history enable row level security;
alter table public.scam_reports enable row level security;
alter table public.user_settings enable row level security;

-- Remove Supabase's broad default privileges, especially profile role changes.
revoke all on public.profiles, public.scan_history, public.scam_reports, public.user_settings from anon, authenticated;
grant select on public.profiles to authenticated;
grant select, insert, delete on public.scan_history to authenticated;
grant select, insert on public.scam_reports to authenticated;
grant update (status, notes) on public.scam_reports to authenticated;
grant select on public.user_settings to authenticated;
grant update (notification_preferences, privacy_preferences) on public.user_settings to authenticated;

create policy profiles_read on public.profiles for select to authenticated
using ((select public.session_is_active()) and (id = (select auth.uid()) or (select private.is_admin())));

create policy scans_read on public.scan_history for select to authenticated
using ((select public.session_is_active()) and (user_id = (select auth.uid()) or (select private.is_admin())));
create policy scans_insert on public.scan_history for insert to authenticated
with check ((select public.session_is_active()) and user_id = (select auth.uid()));
create policy scans_delete on public.scan_history for delete to authenticated
using ((select public.session_is_active()) and user_id = (select auth.uid()));

create policy reports_read on public.scam_reports for select to authenticated
using ((select public.session_is_active()) and (user_id = (select auth.uid()) or (select private.is_admin())));
create policy reports_insert on public.scam_reports for insert to authenticated
with check (
  (select public.session_is_active()) and user_id = (select auth.uid())
  and status = 'PENDING_REVIEW' and notes is null
  and exists (select 1 from public.scan_history s where s.id = scan_id and s.user_id = (select auth.uid()))
);
create policy reports_admin_update on public.scam_reports for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy settings_read on public.user_settings for select to authenticated
using ((select public.session_is_active()) and user_id = (select auth.uid()));
create policy settings_update on public.user_settings for update to authenticated
using ((select public.session_is_active()) and user_id = (select auth.uid()))
with check ((select public.session_is_active()) and user_id = (select auth.uid()));

create function public.admin_metrics() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
begin
  if not private.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'totalScans', (select count(*) from public.scan_history),
    'flaggedThreats', (select count(*) from public.scan_history where risk_level in ('HIGH','CRITICAL')),
    'activeUsers', (select count(*) from public.profiles),
    'reportedScamsCount', (select count(*) from public.scam_reports where status = 'PENDING_REVIEW')
  );
end;
$$;
revoke all on function public.admin_metrics() from public, anon;
grant execute on function public.admin_metrics() to authenticated;

-- Some Supabase projects include this internal DDL event-trigger helper with
-- broad default EXECUTE grants. It does not need a callable public API.
do $$
begin
  if exists (
    select 1 from pg_proc p
    where p.oid = to_regprocedure('public.rls_auto_enable()')
      and p.prorettype = 'pg_catalog.event_trigger'::regtype
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

commit;
