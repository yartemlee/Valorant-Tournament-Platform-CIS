-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create RLS policies for team logos bucket
CREATE POLICY "Team logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-logos');

CREATE POLICY "Team owners can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Team owners can update logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'team-logos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Team owners can delete logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'team-logos'
  AND auth.uid() IS NOT NULL
);