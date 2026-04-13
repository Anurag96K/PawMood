-- Add admin flag to profiles (default false for security)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create app_config table for global dynamic settings
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(user_id)
);

-- Create subscription_plans table for dynamic pricing control
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_display TEXT NOT NULL, -- e.g. "$9.99"
  period TEXT CHECK (period IN ('monthly', 'yearly', 'lifetime')),
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  gateway_id TEXT, -- ID from Stripe/Apple/Google
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- ADMIN POLICIES

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- App Config Policies
CREATE POLICY "Admins can view all config" 
ON public.app_config FOR SELECT 
USING ( public.is_admin() );

CREATE POLICY "Admins can update config" 
ON public.app_config FOR UPDATE 
USING ( public.is_admin() );

CREATE POLICY "Admins can insert config" 
ON public.app_config FOR INSERT 
WITH CHECK ( public.is_admin() );

-- Subscription Plans Policies
-- Public can VIEW active plans (for the paywall)
CREATE POLICY "Public can view active plans" 
ON public.subscription_plans FOR SELECT 
USING ( true );

-- Admins can manage plans
CREATE POLICY "Admins can insert plans" 
ON public.subscription_plans FOR INSERT 
WITH CHECK ( public.is_admin() );

CREATE POLICY "Admins can update plans" 
ON public.subscription_plans FOR UPDATE 
USING ( public.is_admin() );

CREATE POLICY "Admins can delete plans" 
ON public.subscription_plans FOR DELETE 
USING ( public.is_admin() );

-- Update Profiles Policy (Admins can view user stats)
-- Note: 'Users can view their own profile' already exists. We add:
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING ( public.is_admin() );

-- Seed initial Maintenance Mode config
INSERT INTO public.app_config (key, value, description)
VALUES 
  ('maintenance_mode', '{"enabled": false, "message": "System Upgrade in Progress"}', 'Global maintenance switch')
ON CONFLICT (key) DO NOTHING;
