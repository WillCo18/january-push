-- Fix 1: Add upper bound validation for reps in activity_logs
-- Using a trigger instead of CHECK constraint for better flexibility

-- Create validation trigger function
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

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_activity_log_reps_trigger ON public.activity_logs;
CREATE TRIGGER validate_activity_log_reps_trigger
BEFORE INSERT OR UPDATE ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.validate_activity_log_reps();

-- Fix 2: Create server-side unique invite code generation with collision handling
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
    
    -- Check if code already exists
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

-- Set default for invite_code column to use the new function
ALTER TABLE public.groups 
ALTER COLUMN invite_code SET DEFAULT public.generate_unique_invite_code();

-- Fix 3: Add rate limiting for group creation (max 3 groups per hour per user)
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