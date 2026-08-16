-- Phone OTP is no longer part of customer login or checkout.
-- Challenges are short-lived authentication artifacts and are safe to remove.
DROP TABLE IF EXISTS public.phone_otp_challenges;
