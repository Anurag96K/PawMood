-- 1. Fix profile visibility for chat participants
-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policy allowing users to view their own profile OR profiles of chat participants
CREATE POLICY "Users can view profiles of self or chat participants"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.chat_participants cp1
    INNER JOIN public.chat_participants cp2 ON cp1.chat_room_id = cp2.chat_room_id
    WHERE cp1.user_id = auth.uid()
    AND cp2.user_id = profiles.user_id
  )
);

-- 2. Make user-uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'user-uploads';

-- 3. Fix user_roles table - add admin authorization function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'role' = 'admin'
  );
$$;

-- 4. Add admin-only write policies for user_roles
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (is_admin());

-- 5. Auto-assign 'free' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'free') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-assigning role
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();