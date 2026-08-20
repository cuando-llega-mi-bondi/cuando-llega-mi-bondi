-- Reseñas de líneas: 1 reseña por usuario logueado por línea (editable), lectura pública.
-- display_name se guarda en la fila (evita sumar una tabla `profiles` para v1).

CREATE TABLE IF NOT EXISTS public.bus_line_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linea_codigo text NOT NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, linea_codigo)
);

CREATE INDEX IF NOT EXISTS bus_line_reviews_linea_idx
  ON public.bus_line_reviews (linea_codigo, created_at DESC);

ALTER TABLE public.bus_line_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_select_public" ON public.bus_line_reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON public.bus_line_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own" ON public.bus_line_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_delete_own" ON public.bus_line_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
