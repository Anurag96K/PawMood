-- Add plan_interval and status columns to user_roles table
-- This allows distinguishing between monthly and yearly subscriptions

ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS plan_interval text CHECK (plan_interval IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('active', 'cancelled', 'expired'));

-- Comment on columns
COMMENT ON COLUMN public.user_roles.plan_interval IS 'The billing interval for the subscription: monthly or yearly';
COMMENT ON COLUMN public.user_roles.status IS 'The current status of the subscription: active, cancelled, or expired';
