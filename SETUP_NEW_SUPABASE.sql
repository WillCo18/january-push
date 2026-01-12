-- ============================================
-- COMPLETE DATABASE SETUP FOR NEW SUPABASE PROJECT
-- Run this entire script in your Supabase SQL Editor
-- ============================================

-- Step 1: Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view any profile"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 2: Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (
  id IN (SELECT group_id FROM public.group_memberships WHERE user_id = auth.uid())
  OR admin_id = auth.uid()
);

CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their groups"
ON public.groups FOR UPDATE
USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete their groups"
ON public.groups FOR DELETE
USING (auth.uid() = admin_id);

CREATE POLICY "Users can view memberships in their groups"
ON public.group_memberships FOR SELECT
USING (
  user_id = auth.uid()
  OR group_id IN (SELECT id FROM public.groups WHERE admin_id = auth.uid())
);

CREATE POLICY "Users can join groups"
ON public.group_memberships FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON public.group_memberships FOR DELETE
USING (auth.uid() = user_id);

-- Step 3: Invite code generation function
CREATE OR REPLACE FUNCTION public.generate_unique_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  new_code TEXT;
  attempts INTEGER := 0;
BEGIN
  LOOP
    new_code := '';
    FOR i IN 1..8 LOOP
      new_code := new_code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    IF NOT EXISTS (SELECT 1 FROM public.groups WHERE invite_code = new_code) THEN
      RETURN new_code;
    END IF;

    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique invite code after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.groups
ALTER COLUMN invite_code SET DEFAULT public.generate_unique_invite_code();

-- Step 4: Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  exercise_id UUID,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reps INTEGER NOT NULL CHECK (reps > 0),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
ON public.activity_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity logs"
ON public.activity_logs FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity logs"
ON public.activity_logs FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, log_date);

-- Step 5: Reps validation trigger
CREATE OR REPLACE FUNCTION public.validate_activity_log_reps()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reps <= 0 THEN
    RAISE EXCEPTION 'Reps must be greater than 0';
  END IF;

  IF NEW.reps > 1000 THEN
    RAISE EXCEPTION 'Reps cannot exceed 1000 per entry';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_activity_log_reps_trigger ON public.activity_logs;
CREATE TRIGGER validate_activity_log_reps_trigger
BEFORE INSERT OR UPDATE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_activity_log_reps();

-- Step 6: Rate limiting for group creation
CREATE OR REPLACE FUNCTION public.check_group_creation_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM public.groups
  WHERE admin_id = NEW.admin_id
  AND created_at > NOW() - INTERVAL '1 hour';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit: Cannot create more than 3 groups per hour';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_group_rate_limit ON public.groups;
CREATE TRIGGER check_group_rate_limit
BEFORE INSERT ON public.groups
FOR EACH ROW EXECUTE FUNCTION public.check_group_creation_rate();

-- Step 7: Daily summaries table
CREATE TABLE public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_reps INTEGER NOT NULL DEFAULT 0,
  total_entries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, summary_date)
);

ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily summaries"
ON public.daily_summaries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Group members can view each other's daily summaries"
ON public.daily_summaries FOR SELECT
USING (
  user_id IN (
    SELECT gm.user_id
    FROM public.group_memberships gm
    WHERE gm.group_id IN (
      SELECT group_id FROM public.group_memberships WHERE user_id = auth.uid()
    )
  )
);

-- Step 8: Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 9: Auto-update daily summaries
CREATE OR REPLACE FUNCTION public.recalculate_daily_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_user_id UUID;
  affected_date DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_user_id := OLD.user_id;
    affected_date := OLD.log_date;
  ELSE
    affected_user_id := NEW.user_id;
    affected_date := NEW.log_date;
  END IF;

  INSERT INTO public.daily_summaries (user_id, summary_date, total_reps, total_entries)
  SELECT
    affected_user_id,
    affected_date,
    COALESCE(SUM(reps), 0),
    COUNT(*)
  FROM public.activity_logs
  WHERE user_id = affected_user_id AND log_date = affected_date
  ON CONFLICT (user_id, summary_date)
  DO UPDATE SET
    total_reps = EXCLUDED.total_reps,
    total_entries = EXCLUDED.total_entries,
    updated_at = NOW();

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS update_daily_summary_on_activity ON public.activity_logs;
CREATE TRIGGER update_daily_summary_on_activity
AFTER INSERT OR UPDATE OR DELETE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.recalculate_daily_summary();

-- Step 10: App settings table
CREATE TABLE public.app_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app settings"
ON public.app_settings
FOR SELECT
USING (true);

INSERT INTO public.app_settings (key, value)
VALUES ('challenge_start_date', '2026-01-01');

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next steps:
-- 1. Copy your Project URL and anon key from Settings > API
-- 2. Update your .env file with these credentials
-- 3. Deploy to Vercel
-- ============================================
