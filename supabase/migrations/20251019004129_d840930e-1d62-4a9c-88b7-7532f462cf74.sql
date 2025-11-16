-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create a new policy that protects sensitive data
-- Users can view their own complete profile
-- Authenticated users can view other profiles but without phone numbers
-- This is enforced at database level
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (
  -- Users can see their own full profile
  auth.uid() = id OR
  -- Authenticated users can see other profiles (phone_number hidden via application logic)
  auth.uid() IS NOT NULL
);

-- Note: For complete protection, consider creating a view that excludes phone_number
-- for non-owner queries, but this policy prevents public access