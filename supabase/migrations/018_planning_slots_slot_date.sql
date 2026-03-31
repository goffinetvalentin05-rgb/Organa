-- Date propre à chaque créneau (préparation veille, rangement lendemain, etc.)

ALTER TABLE public.planning_slots ADD COLUMN IF NOT EXISTS slot_date DATE;

UPDATE public.planning_slots ps
SET slot_date = p.date
FROM public.plannings p
WHERE p.id = ps.planning_id AND ps.slot_date IS NULL;

ALTER TABLE public.planning_slots ALTER COLUMN slot_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_planning_slots_slot_date ON public.planning_slots(slot_date);

SELECT 'Migration 018_planning_slots_slot_date terminée' AS status;
