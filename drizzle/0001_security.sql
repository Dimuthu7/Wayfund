-- Wayfund security model: a restricted application role, helper functions,
-- row-level security policies and the member_balances view.
--
-- The app connects with one privileged connection string (Neon owner or the VPS
-- Postgres user). Every user request runs inside withUser() (lib/db/index.ts), which does
--   select set_config('app.user_id', <uuid>, true);  set local role wayfund_app;
-- so the policies below apply. wayfund_app has no BYPASSRLS and cannot read emails,
-- OAuth tokens or sessions.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'wayfund_app') THEN
    CREATE ROLE wayfund_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;
--> statement-breakpoint
GRANT wayfund_app TO CURRENT_USER;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS app;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public, app TO wayfund_app;
--> statement-breakpoint

-- ------------------------------------------------------------ helper functions

CREATE OR REPLACE FUNCTION app.current_user_id() RETURNS uuid
  LANGUAGE sql STABLE PARALLEL SAFE
  AS $$ SELECT nullif(current_setting('app.user_id', true), '')::uuid $$;
--> statement-breakpoint

-- SECURITY DEFINER so policies on trip_members can call it without recursing into themselves.
CREATE OR REPLACE FUNCTION app.is_trip_member(p_trip_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = pg_catalog, public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.trip_members m
      WHERE m.trip_id = p_trip_id
        AND m.user_id = app.current_user_id()
        AND m.left_at IS NULL
    )
  $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_trip_admin(p_trip_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = pg_catalog, public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.trip_members m
      WHERE m.trip_id = p_trip_id
        AND m.user_id = app.current_user_id()
        AND m.left_at IS NULL
        AND m.role IN ('owner', 'co_admin')
    )
  $$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION app.is_trip_owner(p_trip_id uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = pg_catalog, public
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.trips t
      WHERE t.id = p_trip_id AND t.owner_id = app.current_user_id()
    )
  $$;
--> statement-breakpoint

REVOKE ALL ON FUNCTION app.is_trip_member(uuid), app.is_trip_admin(uuid), app.is_trip_owner(uuid) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app.current_user_id(), app.is_trip_member(uuid), app.is_trip_admin(uuid), app.is_trip_owner(uuid) TO wayfund_app;
--> statement-breakpoint

-- --------------------------------------------------------------------- grants

-- Users: wayfund_app may read public profile columns only (never email), and update nothing.
-- Profile changes go through the server's privileged connection, scoped to the session user.
GRANT SELECT (id, display_name, username, avatar_url, country, default_currency, time_zone, plan)
  ON users TO wayfund_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON
  friendships, trips, trip_members, invites, vehicles, budget_items, expenses, expense_shares,
  payments, reminders, notification_prefs, push_subscriptions
  TO wayfund_app;
--> statement-breakpoint
GRANT SELECT, INSERT ON expense_history TO wayfund_app;
--> statement-breakpoint
GRANT SELECT, UPDATE, DELETE ON notifications TO wayfund_app;
--> statement-breakpoint

-- ------------------------------------------------------------ row-level security

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY friendships_select ON friendships FOR SELECT TO wayfund_app
  USING (user_id = app.current_user_id() OR friend_id = app.current_user_id());
--> statement-breakpoint
-- People can only send pending requests. Accepting through a personal invite link is
-- validated by the server (token check) and written with the privileged connection.
CREATE POLICY friendships_insert ON friendships FOR INSERT TO wayfund_app
  WITH CHECK (user_id = app.current_user_id() AND status = 'pending');
--> statement-breakpoint
-- Only the recipient can answer a pending request (the sender can't accept their own).
CREATE POLICY friendships_update ON friendships FOR UPDATE TO wayfund_app
  USING (friend_id = app.current_user_id() AND status = 'pending')
  WITH CHECK (friend_id = app.current_user_id());
--> statement-breakpoint
CREATE POLICY friendships_delete ON friendships FOR DELETE TO wayfund_app
  USING (user_id = app.current_user_id() OR friend_id = app.current_user_id());
--> statement-breakpoint

ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY trips_select ON trips FOR SELECT TO wayfund_app
  USING (app.is_trip_member(id) OR owner_id = app.current_user_id());
--> statement-breakpoint
CREATE POLICY trips_insert ON trips FOR INSERT TO wayfund_app
  WITH CHECK (owner_id = app.current_user_id());
--> statement-breakpoint
CREATE POLICY trips_update ON trips FOR UPDATE TO wayfund_app
  USING (app.is_trip_admin(id)) WITH CHECK (app.is_trip_admin(id));
--> statement-breakpoint
CREATE POLICY trips_delete ON trips FOR DELETE TO wayfund_app
  USING (owner_id = app.current_user_id());
--> statement-breakpoint

ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY trip_members_select ON trip_members FOR SELECT TO wayfund_app
  USING (app.is_trip_member(trip_id) OR user_id = app.current_user_id());
--> statement-breakpoint
-- Admins add members. The trip owner adds their own owner row when creating the trip.
-- Joining by invite link is validated by the server and inserted with the privileged connection.
CREATE POLICY trip_members_insert ON trip_members FOR INSERT TO wayfund_app
  WITH CHECK (
    app.is_trip_admin(trip_id)
    OR (user_id = app.current_user_id() AND role = 'owner' AND app.is_trip_owner(trip_id))
  );
--> statement-breakpoint
-- Admins manage members; a member may update only their own row (to leave) and stays a member.
CREATE POLICY trip_members_update ON trip_members FOR UPDATE TO wayfund_app
  USING (app.is_trip_admin(trip_id) OR user_id = app.current_user_id())
  WITH CHECK (app.is_trip_admin(trip_id) OR (user_id = app.current_user_id() AND role = 'member'));
--> statement-breakpoint
CREATE POLICY trip_members_delete ON trip_members FOR DELETE TO wayfund_app
  USING (app.is_trip_admin(trip_id));
--> statement-breakpoint

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY invites_owner ON invites FOR ALL TO wayfund_app
  USING (
    (kind = 'friend' AND user_id = app.current_user_id())
    OR (trip_id IS NOT NULL AND app.is_trip_admin(trip_id))
  )
  WITH CHECK (
    created_by = app.current_user_id()
    AND (
      (kind = 'friend' AND user_id = app.current_user_id())
      OR (trip_id IS NOT NULL AND app.is_trip_admin(trip_id))
    )
  );
--> statement-breakpoint

-- Trip data: any active member may read and write. Role rules (who may edit or delete what)
-- are enforced again in server actions.
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY budget_items_member ON budget_items FOR ALL TO wayfund_app
  USING (app.is_trip_member(trip_id)) WITH CHECK (app.is_trip_member(trip_id));
--> statement-breakpoint

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY expenses_member ON expenses FOR ALL TO wayfund_app
  USING (app.is_trip_member(trip_id))
  WITH CHECK (app.is_trip_member(trip_id));
--> statement-breakpoint

ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY expense_shares_member ON expense_shares FOR ALL TO wayfund_app
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND app.is_trip_member(e.trip_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND app.is_trip_member(e.trip_id)));
--> statement-breakpoint

-- History is append-only for the app role (no UPDATE or DELETE grant).
ALTER TABLE expense_history ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY expense_history_select ON expense_history FOR SELECT TO wayfund_app
  USING (EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND app.is_trip_member(e.trip_id)));
--> statement-breakpoint
CREATE POLICY expense_history_insert ON expense_history FOR INSERT TO wayfund_app
  WITH CHECK (
    actor_id = app.current_user_id()
    AND EXISTS (SELECT 1 FROM expenses e WHERE e.id = expense_id AND app.is_trip_member(e.trip_id))
  );
--> statement-breakpoint

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY payments_member ON payments FOR ALL TO wayfund_app
  USING (app.is_trip_member(trip_id)) WITH CHECK (app.is_trip_member(trip_id));
--> statement-breakpoint

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY reminders_member ON reminders FOR ALL TO wayfund_app
  USING (app.is_trip_member(trip_id)) WITH CHECK (app.is_trip_member(trip_id));
--> statement-breakpoint

-- Personal data: only the owner.
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY vehicles_owner ON vehicles FOR ALL TO wayfund_app
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
--> statement-breakpoint

ALTER TABLE notification_prefs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY notification_prefs_owner ON notification_prefs FOR ALL TO wayfund_app
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
--> statement-breakpoint

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY push_subscriptions_owner ON push_subscriptions FOR ALL TO wayfund_app
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
--> statement-breakpoint

-- Notifications are created by the server's fan-out (privileged), read and dismissed by the user.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY notifications_owner ON notifications FOR ALL TO wayfund_app
  USING (user_id = app.current_user_id()) WITH CHECK (user_id = app.current_user_id());
--> statement-breakpoint

-- ------------------------------------------------------------------- balances

-- Balance per member in the trip's base currency: positive means the group owes them.
-- security_invoker makes the view respect the caller's row-level security.
CREATE VIEW member_balances WITH (security_invoker = true) AS
SELECT
  m.trip_id,
  m.id AS member_id,
  (
    coalesce(paid.total, 0) - coalesce(owed.total, 0)
    + coalesce(sent.total, 0) - coalesce(received.total, 0)
  )::bigint AS balance_minor
FROM trip_members m
LEFT JOIN LATERAL (
  SELECT sum(e.base_amount_minor) AS total
  FROM expenses e
  WHERE e.payer_member_id = m.id AND e.deleted_at IS NULL
) paid ON true
LEFT JOIN LATERAL (
  SELECT sum(s.share_minor) AS total
  FROM expense_shares s
  JOIN expenses e ON e.id = s.expense_id
  WHERE s.member_id = m.id AND e.deleted_at IS NULL
) owed ON true
LEFT JOIN LATERAL (
  SELECT sum(p.amount_minor) AS total
  FROM payments p
  WHERE p.from_member_id = m.id AND p.status = 'confirmed'
) sent ON true
LEFT JOIN LATERAL (
  SELECT sum(p.amount_minor) AS total
  FROM payments p
  WHERE p.to_member_id = m.id AND p.status = 'confirmed'
) received ON true;
--> statement-breakpoint
GRANT SELECT ON member_balances TO wayfund_app;
