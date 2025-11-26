-- Add missing profile fields for user settings

-- Add country field (2-letter ISO code)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Add phone number field (full international format with country code)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add status field (user's custom status message)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT;

-- Add privacy settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_statistics BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_country BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN DEFAULT TRUE;

-- Add notification preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_notifications BOOLEAN DEFAULT FALSE;

-- Add medal counts (if not already added by previous migration)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals_gold INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals_silver INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medals_bronze INTEGER DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_country ON public.profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
