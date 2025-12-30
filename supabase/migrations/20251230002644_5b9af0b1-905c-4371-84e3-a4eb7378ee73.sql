-- Break RLS recursion between groups <-> group_memberships by using SECURITY DEFINER helpers

CREATE OR REPLACE FUNCTION public.current_user_group_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(gm.group_id), '{}'::uuid[])
  FROM public.group_memberships gm
  WHERE gm.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_group_member_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT gm2.user_id), '{}'::uuid[])
  FROM public.group_memberships gm
  JOIN public.group_memberships gm2
    ON gm2.group_id = gm.group_id
  WHERE gm.user_id = auth.uid();
$$;

-- groups: avoid querying group_memberships inside policy
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of"
ON public.groups
FOR SELECT
USING (
  admin_id = auth.uid()
  OR id = ANY(public.current_user_group_ids())
);

-- group_memberships: avoid querying groups that then queries group_memberships
DROP POLICY IF EXISTS "Users can view memberships in their groups" ON public.group_memberships;
CREATE POLICY "Users can view memberships in their groups"
ON public.group_memberships
FOR SELECT
USING (
  user_id = auth.uid()
  OR group_id = ANY(public.current_user_group_ids())
  OR group_id IN (SELECT id FROM public.groups WHERE admin_id = auth.uid())
);

-- profiles: avoid RLS recursion by using security definer member list
DROP POLICY IF EXISTS "Users can view group members profiles" ON public.profiles;
CREATE POLICY "Users can view group members profiles"
ON public.profiles
FOR SELECT
USING (
  id = auth.uid()
  OR id = ANY(public.current_group_member_ids())
);

-- daily_summary: align group visibility with helper (optional but prevents indirect recursion paths)
DROP POLICY IF EXISTS "Users can view group members daily summaries" ON public.daily_summary;
CREATE POLICY "Users can view group members daily summaries"
ON public.daily_summary
FOR SELECT
USING (
  user_id = auth.uid()
  OR user_id = ANY(public.current_group_member_ids())
);