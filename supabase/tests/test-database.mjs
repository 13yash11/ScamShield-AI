// Executes the real migration on PostgreSQL (PGlite), with a minimal mock of
// Supabase's auth schema. No cloud account, secrets, or database is contacted.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
let checks = 0;
const check = (value) => { assert.ok(value); checks += 1; };
const count = async (table) => Number((await db.query(`select count(*) as count from public.${table}`)).rows[0].count);
const denied = async (sql, params = []) => {
  await assert.rejects(() => db.query(sql, params), (error) => ['42501', '23505', '23514'].includes(error.code));
  checks += 1;
};

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text not null, raw_user_meta_data jsonb not null default '{}');
    create table auth.sessions(id uuid primary key, user_id uuid not null references auth.users(id), not_after timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth to authenticated;
  `);
  const existingUser = '00000000-0000-4000-8000-000000000009';
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3)', [existingUser, 'registered-before-migration@example.com', { full_name: 'Existing Registration', phone_number: '+919876543210' }]);
  const migrationDir = new URL('../migrations/', import.meta.url);
  for (const file of (await readdir(migrationDir)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrationDir), 'utf8'));
  }
  const existingProfile = (await db.query('select full_name,phone_number from public.profiles where id=$1', [existingUser])).rows[0];
  check(existingProfile.full_name === 'Existing Registration' && existingProfile.phone_number === '+919876543210');
  check((await db.query('select user_id from public.user_settings where user_id=$1', [existingUser])).rows.length === 1);
  check((await db.query("select prosecdef from pg_proc where oid='public.session_is_active()'::regprocedure")).rows[0].prosecdef === false);
  await db.query('delete from auth.users where id=$1', [existingUser]);
  const owner = '00000000-0000-4000-8000-000000000001';
  const other = '00000000-0000-4000-8000-000000000002';
  const session = '00000000-0000-4000-8000-000000000003';
  const otherSession = '00000000-0000-4000-8000-000000000004';
  const scan = '00000000-0000-4000-8000-000000000005';
  const otherScan = '00000000-0000-4000-8000-000000000006';
  const claim = async (id = owner, sid = session) => {
    await db.exec('reset role; set role authenticated;');
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, session_id: sid, role: 'authenticated', user_metadata: { role: 'admin' } })]);
  };
  await db.query('insert into auth.users(id,email,raw_user_meta_data) values ($1,$2,$3),($4,$5,$6)', [owner, 'owner@example.com', { full_name: 'Owner', phone_number: '+919876543210', role: 'admin' }, other, 'other@example.com', { full_name: 'Other', phone_number: '+919123456789' }]);
  await db.query('insert into auth.sessions(id,user_id) values ($1,$2),($3,$4)', [session, owner, otherSession, other]);
  check(await count('profiles') === 2);
  check(await count('user_settings') === 2);
  await claim();
  check(await count('profiles') === 1);
  check((await db.query('select role from public.profiles')).rows[0].role === 'user');
  await denied("update public.profiles set role='admin' where id=$1", [owner]);
  await denied('update public.user_settings set user_id=$1 where user_id=$2', [other, owner]);
  const insertScan = `insert into public.scan_history(id,user_id,scan_type,content_reference,risk_score,risk_level,detection_method,summary,explanation,limitations) values ($1,$2,'text','redacted',5,'LOW','RULE_BASED','Test assessment','Test explanation','Heuristic only')`;
  await db.query(insertScan, [scan, owner]);
  await denied(insertScan, [otherScan, other]);
  await denied('select public.admin_metrics()');
  await claim(other, otherSession);
  check(await count('scan_history') === 0);
  await db.query(insertScan, [otherScan, other]);
  check((await db.query('delete from public.scan_history where id=$1 returning id', [scan])).rows.length === 0);
  await denied("insert into public.scam_reports(user_id,scan_id,scan_type,description) values ($1,$2,'text','Please review this scan')", [other, scan]);
  await claim();
  check(await count('scan_history') === 1);
  await db.query("insert into public.scam_reports(user_id,scan_id,scan_type,description) values ($1,$2,'text','Please review this scan')", [owner, scan]);
  check((await db.query("update public.scam_reports set status='CONFIRMED_SCAM' returning id")).rows.length === 0);
  await db.exec('reset role');
  await db.query("update public.profiles set role='admin' where id=$1", [owner]);
  await claim();
  check(await count('profiles') === 2);
  const metrics = (await db.query('select public.admin_metrics() as metrics')).rows[0].metrics;
  check(metrics.totalScans === 2 && metrics.activeUsers === 2 && metrics.reportedScamsCount === 1);
  check((await db.query("update public.scam_reports set status='CONFIRMED_SCAM' returning id")).rows.length === 1);
  check((await db.query('delete from public.scan_history where id=$1 returning id', [otherScan])).rows.length === 0);
  await db.exec('reset role');
  await db.query('update public.profiles set phone_verified_at=now() where id=$1', [other]);
  await denied('insert into auth.users(id,email,raw_user_meta_data) values (gen_random_uuid(),$1,$2)', ['collision@example.com', { full_name: 'Collision', phone_number: '+919123456789' }]);
  await db.query('update public.profiles set phone_number=$1 where id=$2', ['+919234567890', other]);
  check((await db.query('select phone_verified_at from public.profiles where id=$1', [other])).rows[0].phone_verified_at === null);
  await db.query('delete from auth.sessions where id=$1', [session]);
  await claim();
  check((await db.query('select public.session_is_active() as active')).rows[0].active === false);
  check(await count('profiles') === 0);
  check(await count('scan_history') === 0);
  await db.exec('reset role; set role anon;');
  await denied('select * from public.scan_history');
  console.log(`Migration executed successfully; ${checks} database authorization checks passed.`);
} finally {
  await db.close();
}
