-- Paid native ad slot on /consultar (Lugarcito-style: higher bid replaces the live listing).

CREATE TABLE public.ad_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  href text NOT NULL,
  tagline text,
  amount_ars integer NOT NULL CHECK (amount_ars > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  went_live boolean NOT NULL DEFAULT false,
  accepted_terms_at timestamptz,
  mercadopago_preference_id text,
  mercadopago_payment_id text,
  payer_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ad_slot (
  id text PRIMARY KEY,
  purchase_id uuid REFERENCES public.ad_purchases (id),
  title text,
  href text,
  tagline text,
  amount_ars integer NOT NULL DEFAULT 0 CHECK (amount_ars >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.ad_slot (id, amount_ars)
VALUES ('consultar', 0), ('consultar-2', 0)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.ad_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_slot ENABLE ROW LEVEL SECURITY;

CREATE POLICY ad_slot_public_read
  ON public.ad_slot
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE ALL ON TABLE public.ad_purchases FROM anon, authenticated;
GRANT SELECT ON TABLE public.ad_slot TO anon, authenticated;
