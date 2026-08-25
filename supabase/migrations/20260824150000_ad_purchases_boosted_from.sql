-- "Boostear" un aviso ya aprobado: en vez de competir con una fila propia,
-- el pago se suma al total del aviso elegido. boosted_from_id apunta siempre
-- a la raíz (nunca a otro boost), así sumar no requiere recorrer cadenas.
-- El monto de cada fila sigue siendo el aporte real de ESE pago (lo que
-- MercadoPago cobró) — el total acumulado se calcula sumando en la app, no
-- se guarda.

ALTER TABLE public.ad_purchases
  ADD COLUMN boosted_from_id uuid REFERENCES public.ad_purchases(id),
  ADD CONSTRAINT ad_purchases_boosted_from_not_self
    CHECK (boosted_from_id IS NULL OR boosted_from_id <> id);

CREATE INDEX IF NOT EXISTS ad_purchases_boosted_from_idx
  ON public.ad_purchases (boosted_from_id)
  WHERE status = 'approved';

-- Restated con la columna nueva: el GRANT por columna en este estilo de
-- migración reemplaza la lista, no la extiende fila a fila.
GRANT SELECT (id, title, href, tagline, amount_ars, status, created_at, boosted_from_id)
  ON TABLE public.ad_purchases TO anon, authenticated;
