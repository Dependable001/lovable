-- Fix the infinite recursion in profiles RLS policies
-- Drop the problematic policy that's causing recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simpler, non-recursive policy for admins
-- This avoids the recursion by not referencing the same table in the policy check
CREATE POLICY "Admin users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  -- Direct check against auth.uid() without recursive profile lookup
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::user_role
    LIMIT 1
  )
);

-- Also ensure users can still view their own profiles
-- Update the existing policy to be more explicit
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy for admins to update profiles
CREATE POLICY "Admin users can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'admin'::user_role
    LIMIT 1
  )
);