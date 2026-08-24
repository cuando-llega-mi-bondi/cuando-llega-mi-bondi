-- El aviso deja de comprarse por casillero: hay un solo ranking por monto y
-- los dos pagos aprobados más altos son los que se publican en Consultar.
--
-- public.ad_slot y ad_purchases.slot_id quedan sin uso a partir de acá. No se
-- borran en esta migración: el código viejo todavía los escribe hasta que se
-- deploye el ranking, y romperlos antes tira el checkout. Se limpian después.

-- Lectura pública del ranking. RLS deja ver solo lo aprobado y el GRANT por
-- columna deja afuera payer_email y los ids de MercadoPago.
CREATE POLICY ad_purchases_public_read_approved
  ON public.ad_purchases
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

GRANT SELECT (id, title, href, tagline, amount_ars, status, created_at)
  ON TABLE public.ad_purchases TO anon, authenticated;

-- El orden del ranking: monto desc y, a igual monto, gana el que pagó primero.
CREATE INDEX IF NOT EXISTS ad_purchases_board_idx
  ON public.ad_purchases (amount_ars DESC, created_at ASC)
  WHERE status = 'approved';
