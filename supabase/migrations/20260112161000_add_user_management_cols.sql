-- Add management columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free'; 

-- Update policies to allow admins to update these specific columns?
-- The previous 'Admins can view all profiles' policy covers SELECT.
-- We need UPDATE policy for admins to Change these flags.

CREATE POLICY "Admins can update user status" 
ON public.profiles FOR UPDATE
USING ( public.is_admin() );
