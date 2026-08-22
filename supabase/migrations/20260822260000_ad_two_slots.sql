-- Two independent auctions on /consultar. Each purchase is tied to one slot.

INSERT INTO public.ad_slot (id, amount_ars)
VALUES ('consultar-2', 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ad_purchases
  ADD COLUMN IF NOT EXISTS slot_id text REFERENCES public.ad_slot (id);

UPDATE public.ad_purchases
SET slot_id = 'consultar'
WHERE slot_id IS NULL;

ALTER TABLE public.ad_purchases
  ALTER COLUMN slot_id SET DEFAULT 'consultar';

ALTER TABLE public.ad_purchases
  ALTER COLUMN slot_id SET NOT NULL;
