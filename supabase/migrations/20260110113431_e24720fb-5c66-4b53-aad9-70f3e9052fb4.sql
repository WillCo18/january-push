-- Drop the overly permissive policy that allows ANY authenticated user to see ALL groups
DROP POLICY IF EXISTS "Authenticated users can lookup groups by invite code" ON public.groups;

-- Create a secure RPC function for invite code lookup
-- This function validates the invite code format and only returns the specific group
CREATE OR REPLACE FUNCTION public.lookup_group_by_invite(p_invite_code TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate input - invite codes are 8 characters
  IF p_invite_code IS NULL OR LENGTH(TRIM(p_invite_code)) != 8 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT g.id, g.name
  FROM groups g
  WHERE g.invite_code = UPPER(TRIM(p_invite_code));
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.lookup_group_by_invite(TEXT) TO authenticated;