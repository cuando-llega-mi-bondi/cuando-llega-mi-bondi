ALTER TABLE public.ad_purchases
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
