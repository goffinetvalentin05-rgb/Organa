-- Restreint le bucket privé "expenses" aux justificatifs (PDF + images).
DO $$
BEGIN
  UPDATE storage.buckets
  SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/gif'
    ]
  WHERE id = 'expenses';

  RAISE NOTICE '✓ Bucket expenses : MIME justificatifs + 10 Mo';
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE '⚠ Impossible de modifier storage.buckets (privilèges). Vérifier manuellement.';
END $$;
