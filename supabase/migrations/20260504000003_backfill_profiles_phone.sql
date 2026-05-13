-- Backfill profiles.phone dari auth.users untuk user lama yang phone-nya NULL
-- auth.users menyimpan phone dalam format E.164 (+62xxx)
UPDATE public.profiles p
SET phone = u.phone
FROM auth.users u
WHERE p.id = u.id
  AND u.phone IS NOT NULL
  AND u.phone != ''
  AND p.phone IS NULL;
