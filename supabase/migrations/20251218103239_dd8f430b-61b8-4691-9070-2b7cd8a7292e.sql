-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_memberships table (one group per user)
CREATE TABLE public.group_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_memberships ENABLE ROW LEVEL SECURITY;

-- Groups policies
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

-- Group memberships policies
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

-- Function to generate random invite code
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$;