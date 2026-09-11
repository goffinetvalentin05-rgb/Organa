BEGIN;

DROP POLICY IF EXISTS feature_announcements_seen_update_own
  ON public.feature_announcements_seen;

CREATE POLICY feature_announcements_seen_update_own
  ON public.feature_announcements_seen
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
