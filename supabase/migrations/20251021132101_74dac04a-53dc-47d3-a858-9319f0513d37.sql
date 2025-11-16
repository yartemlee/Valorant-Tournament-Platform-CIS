-- Create public RPC for listing teams without auth dependency
CREATE OR REPLACE FUNCTION public.list_teams_public(
  search text DEFAULT NULL,
  status text DEFAULT 'all'
)
RETURNS TABLE (
  id uuid,
  name text,
  tag text,
  logo_url text,
  is_recruiting boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.id, 
    t.name, 
    t.tag, 
    t.logo_url, 
    t.is_recruiting, 
    t.created_at
  FROM teams t
  WHERE
    (search IS NULL OR search = '' OR t.name ILIKE '%' || search || '%' OR t.tag ILIKE '%' || search || '%')
    AND (
      status = 'all'
      OR (status = 'recruiting' AND t.is_recruiting = true)
      OR (status = 'closed' AND t.is_recruiting = false)
    )
  ORDER BY t.created_at DESC;
$$;