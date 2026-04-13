-- Fix infinite recursion in profiles RLS policy
-- The "Chat participants can view profiles" policy causes recursion because it joins chat_participants

-- Drop the problematic policy
DROP POLICY IF EXISTS "Chat participants can view profiles" ON public.profiles;

-- Create a simpler policy that doesn't cause recursion
-- Users can view profiles of users they share a chat room with
-- We use a subquery with explicit table references to avoid recursion
CREATE POLICY "Chat participants can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR
  user_id IN (
    SELECT DISTINCT cp2.user_id
    FROM public.chat_participants cp1
    INNER JOIN public.chat_participants cp2 ON cp1.chat_room_id = cp2.chat_room_id
    WHERE cp1.user_id = auth.uid()
  )
);