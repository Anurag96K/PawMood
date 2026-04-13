-- Fix SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  display_name,
  avatar_url,
  bio
FROM public.profiles;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;

-- Create policy to allow chat participants to view profiles via the underlying table
-- This is needed because SECURITY INVOKER views check RLS on the underlying table
-- We need a limited policy that allows chat participants to see the row but RLS on columns isn't supported
-- Solution: Create a separate policy for chat participants that allows SELECT
CREATE POLICY "Chat participants can view profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp1
    INNER JOIN public.chat_participants cp2 ON cp1.chat_room_id = cp2.chat_room_id
    WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = profiles.user_id
  )
);