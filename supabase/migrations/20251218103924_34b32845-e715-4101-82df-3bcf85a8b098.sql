-- Allow authenticated users to look up groups by invite code (for joining)
CREATE POLICY "Authenticated users can lookup groups by invite code"
ON public.groups FOR SELECT
TO authenticated
USING (true);