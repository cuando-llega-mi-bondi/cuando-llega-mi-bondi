-- Al eliminar una cuenta, sus reseñas quedan (le sirven a la comunidad) pero
-- se desvinculan y anonimizan — ya no son editables por nadie. El anonimizado
-- de display_name lo hace la API de borrado de cuenta (con service role,
-- necesita bypassear RLS); este ON DELETE SET NULL es la red de seguridad
-- por si una cuenta se borra por otra vía (ej. dashboard de Supabase).

ALTER TABLE public.bus_line_reviews ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.bus_line_reviews
  DROP CONSTRAINT IF EXISTS bus_line_reviews_user_id_fkey;

ALTER TABLE public.bus_line_reviews
  ADD CONSTRAINT bus_line_reviews_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
