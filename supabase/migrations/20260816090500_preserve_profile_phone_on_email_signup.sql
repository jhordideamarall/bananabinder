-- Persist signup contact metadata in the database trigger so the customer
-- phone is saved atomically with the new Auth user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE
      WHEN NEW.raw_app_meta_data->>'role' IN ('admin', 'owner', 'staff')
      THEN (NEW.raw_app_meta_data->>'role')::public.user_role
      ELSE 'customer'::public.user_role
    END
  );

  INSERT INTO public.carts (user_id) VALUES (NEW.id);
  INSERT INTO public.loyalty (user_id) VALUES (NEW.id);
  INSERT INTO public.notification_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;
