-- Autoriser les créneaux qui passent après minuit (ex. 23:00 → 01:00).
-- On refuse uniquement les horaires identiques (durée nulle).

ALTER TABLE public.planning_slots
  DROP CONSTRAINT IF EXISTS valid_time_range;

ALTER TABLE public.planning_slots
  ADD CONSTRAINT valid_time_range CHECK (end_time <> start_time);
