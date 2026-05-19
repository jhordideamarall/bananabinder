ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

UPDATE public.store_settings
   SET contact_phone = COALESCE(contact_phone, '089519541180'),
       contact_email = COALESCE(contact_email, 'banastuff@gmail.com')
 WHERE store_name = 'Bananasbindery';
