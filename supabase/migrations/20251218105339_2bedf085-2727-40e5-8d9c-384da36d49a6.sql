-- Allow group admins to view activity logs of their group members
CREATE POLICY "Admins can view group members activity logs"
ON public.activity_logs FOR SELECT
USING (
  user_id IN (
    SELECT gm.user_id 
    FROM public.group_memberships gm
    INNER JOIN public.groups g ON g.id = gm.group_id
    WHERE g.admin_id = auth.uid()
  )
);