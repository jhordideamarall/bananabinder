-- Fix handle_new_user trigger to also save phone from auth.users
-- Previously phone was not saved, causing login phone-check to fail

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, avatar_url, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.email,
        NEW.phone,
        NEW.raw_user_meta_data->>'avatar_url',
        CASE
            WHEN NEW.raw_app_meta_data->>'role' IN ('admin', 'owner', 'staff')
            THEN (NEW.raw_app_meta_data->>'role')::user_role
            ELSE 'customer'::user_role
        END
    );
    INSERT INTO public.carts (user_id) VALUES (NEW.id);
    INSERT INTO public.loyalty (user_id) VALUES (NEW.id);
    INSERT INTO public.notification_settings (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
