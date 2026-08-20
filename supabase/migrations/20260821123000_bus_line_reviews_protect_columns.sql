-- El RLS actual (reviews_update_own) solo valida QUIÉN puede tocar una fila
-- (auth.uid() = user_id), no QUÉ columnas cambia: nada impedía que alguien
-- pegándole directo a la REST API mandara un `created_at` falso, se
-- "mudara" de user_id, o cambiara linea_codigo en un UPDATE. Este trigger
-- fija esas columnas server-side, sin importar qué mande el cliente.
--
-- Excepción: `service_role` (usado por app/api/account/delete para
-- anonimizar reseñas al borrar una cuenta) necesita poder tocar user_id y
-- display_name libremente — los triggers corren para todos los roles, RLS
-- no los filtra, así que la excepción va acá adentro.

CREATE OR REPLACE FUNCTION public.bus_line_reviews_protect_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.updated_at := now();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.id := OLD.id;
    NEW.user_id := OLD.user_id;
    NEW.linea_codigo := OLD.linea_codigo;
    NEW.created_at := OLD.created_at;
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bus_line_reviews_protect_columns ON public.bus_line_reviews;

CREATE TRIGGER bus_line_reviews_protect_columns
  BEFORE INSERT OR UPDATE ON public.bus_line_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.bus_line_reviews_protect_columns();
