-- Create daily_summary table
CREATE TABLE public.daily_summary (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  total_reps INTEGER NOT NULL DEFAULT 0,
  capped_reps INTEGER NOT NULL DEFAULT 0,
  is_complete BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, log_date)
);

-- Enable RLS
ALTER TABLE public.daily_summary ENABLE ROW LEVEL SECURITY;

-- Users can view their own summaries
CREATE POLICY "Users can view their own daily summaries"
ON public.daily_summary FOR SELECT
USING (auth.uid() = user_id);

-- Users can view summaries of their group members
CREATE POLICY "Users can view group members daily summaries"
ON public.daily_summary FOR SELECT
USING (
  user_id IN (
    SELECT gm.user_id FROM public.group_memberships gm
    WHERE gm.group_id IN (
      SELECT group_id FROM public.group_memberships WHERE user_id = auth.uid()
    )
  )
);

-- Function to recalculate daily summary
CREATE OR REPLACE FUNCTION public.recalculate_daily_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
  target_date DATE;
  reps_total INTEGER;
BEGIN
  -- Determine which user/date to recalculate
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
    target_date := OLD.log_date;
  ELSE
    target_user_id := NEW.user_id;
    target_date := NEW.log_date;
  END IF;

  -- Calculate total reps for that user on that date
  SELECT COALESCE(SUM(reps), 0) INTO reps_total
  FROM public.activity_logs
  WHERE user_id = target_user_id AND log_date = target_date;

  -- Upsert the daily summary
  IF reps_total > 0 THEN
    INSERT INTO public.daily_summary (user_id, log_date, total_reps, capped_reps, is_complete)
    VALUES (
      target_user_id,
      target_date,
      reps_total,
      LEAST(reps_total, 100),
      reps_total >= 100
    )
    ON CONFLICT (user_id, log_date)
    DO UPDATE SET
      total_reps = reps_total,
      capped_reps = LEAST(reps_total, 100),
      is_complete = reps_total >= 100;
  ELSE
    -- Remove the summary if no reps
    DELETE FROM public.daily_summary
    WHERE user_id = target_user_id AND log_date = target_date;
  END IF;

  RETURN NULL;
END;
$$;

-- Trigger on activity_logs
CREATE TRIGGER trigger_recalculate_daily_summary
AFTER INSERT OR UPDATE OR DELETE ON public.activity_logs
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_daily_summary();

-- Allow group members to view each other's profiles
CREATE POLICY "Users can view group members profiles"
ON public.profiles FOR SELECT
USING (
  id IN (
    SELECT gm.user_id FROM public.group_memberships gm
    WHERE gm.group_id IN (
      SELECT group_id FROM public.group_memberships WHERE user_id = auth.uid()
    )
  )
);

-- Index for faster queries
CREATE INDEX idx_daily_summary_user_date ON public.daily_summary(user_id, log_date DESC);