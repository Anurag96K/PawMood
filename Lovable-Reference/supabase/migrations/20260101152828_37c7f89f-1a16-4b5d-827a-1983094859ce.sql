-- Fix infinite recursion in chat_participants SELECT policy by using a SECURITY DEFINER helper

-- 1) Helper: checks whether a given user is a participant in a chat room.
-- Runs without RLS to avoid self-referential policy recursion.
CREATE OR REPLACE FUNCTION public.is_chat_member(_chat_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.chat_participants
    WHERE chat_room_id = _chat_room_id
      AND user_id = _user_id
  );
$$;

-- 2) Replace the recursive policy
DROP POLICY IF EXISTS "Users can view participants in their chats" ON public.chat_participants;

CREATE POLICY "Users can view participants in their chats"
ON public.chat_participants
FOR SELECT
USING (public.is_chat_member(chat_room_id, auth.uid()));
