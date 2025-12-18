-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reps INTEGER NOT NULL CHECK (reps > 0),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own logs
CREATE POLICY "Users can update their own activity logs"
ON public.activity_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own logs
CREATE POLICY "Users can delete their own activity logs"
ON public.activity_logs FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries by user and date
CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, log_date);