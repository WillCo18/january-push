DROP POLICY IF EXISTS "Users can view group members profiles" ON public.profiles;

CREATE POLICY "Users can view group members profiles"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR id IN (
    SELECT gm.user_id FROM public.group_memberships gm
    WHERE gm.group_id IN (
      SELECT group_id FROM public.group_memberships WHERE user_id = auth.uid()
    )
  )
);