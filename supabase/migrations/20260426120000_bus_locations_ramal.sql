-- Live location share: branch (ramal) to filter map markers vs legacy line-only rows.
-- Legacy rows: ramal IS NULL (still shown when viewing a ramal, see app filter: same line + (ramal matches OR ramal is null))
-- RLS: unchanged; ensure policies allow write on new column (typically column inherits same policies as the row)

ALTER TABLE public.bus_locations
  ADD COLUMN IF NOT EXISTS ramal text;

COMMENT ON COLUMN public.bus_locations.ramal IS 'Ramal key from MGP (e.g. 41) or "principal" for manual routes; null = old shares before ramal was added.';

CREATE INDEX IF NOT EXISTS bus_locations_linea_ramal_updated
  ON public.bus_locations (linea, ramal, updated_at DESC);
