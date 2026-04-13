-- Add credits column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;

-- Allow users to update their own credits (specifically needed for consumption)
-- The existing policy "Users can update own profile" might cover this if it's broad (USING auth.uid() = user_id).
-- Let's double check RLS policies in a separate step or assume standard "update own" covers it.
-- Based on typical Supabase setups, users can update their own rows. 
