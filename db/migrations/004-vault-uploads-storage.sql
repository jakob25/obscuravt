-- Public upload bucket for memes and fan art (run on staging Supabase)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault-uploads',
  'vault-uploads',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read (API uploads use service role)
DROP POLICY IF EXISTS "vault_uploads_public_read" ON storage.objects;
CREATE POLICY "vault_uploads_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'vault-uploads');