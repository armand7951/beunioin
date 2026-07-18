import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260719090000_member_auth.sql",
  "utf8",
);

test("member profiles are created from verified auth identities", () => {
  assert.match(migration, /create table public\.profiles/i);
  assert.match(migration, /references auth\.users/i);
  assert.match(migration, /create trigger on_auth_user_created/i);
  assert.match(
    readFileSync(
      "supabase/migrations/20260719094500_harden_profile_trigger.sql",
      "utf8",
    ),
    /revoke all on function public\.handle_new_user\(\)\s*from public, anon, authenticated/i,
  );
});

test("admin authorization is isolated from editable profiles", () => {
  assert.match(migration, /create schema if not exists private/i);
  assert.match(migration, /create table private\.admin_users/i);
  assert.doesNotMatch(migration, /public\.profiles[\s\S]{0,250}\brole\b/i);
});

test("members can only read their own registration records", () => {
  assert.match(migration, /add column user_id uuid/i);
  assert.match(migration, /auth\.uid\(\)\)\s*=\s*user_id/i);
});

test("registration RPC links a server-verified member id", () => {
  assert.match(migration, /p_user_id uuid default null/i);
  assert.match(migration, /user_id[\s\S]*p_user_id/i);
});

test("admin PII functions remain service-only", () => {
  assert.match(migration, /list_event_registrations_for_admin/i);
  assert.match(
    migration,
    /grant execute on function public\.list_event_registrations_for_admin\(uuid\) to service_role/i,
  );
  assert.match(
    migration,
    /revoke all on function public\.list_event_registrations_for_admin\(uuid\)\s*from public, anon, authenticated/i,
  );
});
