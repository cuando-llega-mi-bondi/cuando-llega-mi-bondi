-- La UI ya valida largo/charset, pero cualquiera con la anon key y un JWT
-- valido puede pegarle directo a la REST API salteando el frontend. RLS
-- controla QUIEN puede escribir una fila; estos CHECK controlan QUE puede
-- contener, asi que el limite real tiene que vivir aca.
--
-- Charset: lista negra, no blanca -- se permiten emojis y cualquier simbolo,
-- solo se bloquean caracteres de control (C0/C1) y los que se usan para
-- spoofear texto (marcas LRM/RLM, overrides/isolates bidi, BOM). Los
-- caracteres invisibles se arman con chr(<codepoint>) en vez de escribirlos
-- a mano en el archivo, para que no haya ambiguedad de que caracter es cada
-- uno. U+200D (ZWJ, 8205) queda afuera de la lista a proposito: es lo que
-- arma los emojis compuestos (familias, profesiones, etc.) -- bloquearlo
-- los romperia.

ALTER TABLE public.bus_line_reviews
  ADD CONSTRAINT bus_line_reviews_comment_length
    CHECK (comment IS NULL OR char_length(comment) <= 500),
  ADD CONSTRAINT bus_line_reviews_comment_charset
    CHECK (
      comment IS NULL
      OR comment !~ (
        '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F' ||
        chr(8203) || chr(8206) || chr(8207) ||
        chr(8234) || '-' || chr(8238) ||
        chr(8294) || '-' || chr(8297) ||
        chr(65279) || ']'
      )
    ),
  ADD CONSTRAINT bus_line_reviews_display_name_length
    CHECK (char_length(trim(display_name)) BETWEEN 1 AND 40),
  ADD CONSTRAINT bus_line_reviews_display_name_charset
    CHECK (
      display_name !~ (
        '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F' ||
        chr(8203) || chr(8206) || chr(8207) ||
        chr(8234) || '-' || chr(8238) ||
        chr(8294) || '-' || chr(8297) ||
        chr(65279) || ']'
      )
    );
