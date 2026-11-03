-- Remove app-owned account contact fields; email authentication is unchanged.
-- The initial migration is already applied and remains immutable history.
begin;

drop trigger profile_phone_guard on public.profiles;
drop function private.guard_profile_phone();
drop index public.profiles_verified_phone_unique;
alter table public.profiles
  drop column phone_number,
  drop column phone_verified_at;

-- Keep profile timestamps working after removing the old contact guard.
create trigger profiles_updated before update on public.profiles
for each row execute function private.touch_updated_at();

create or replace function private.sync_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  profile_name text;
begin
  profile_name = left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'User'), 100);
  if char_length(profile_name) < 2 then profile_name = 'User'; end if;
  insert into public.profiles(id, full_name, email)
  values (new.id, profile_name, new.email)
  on conflict (id) do update set
    full_name = excluded.full_name, email = excluded.email;
  insert into public.user_settings(user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
revoke all on function private.sync_auth_user() from public, anon, authenticated;

-- Remove only the app's obsolete metadata. Preserve users and other metadata.
update auth.users
set raw_user_meta_data = raw_user_meta_data - 'phone_number' - 'phone_verified_at'
where raw_user_meta_data ?| array['phone_number', 'phone_verified_at'];

notify pgrst, 'reload schema';
commit;
