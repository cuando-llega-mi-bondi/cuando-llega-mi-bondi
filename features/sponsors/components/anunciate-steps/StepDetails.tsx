"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { AdCreativeCardEditable } from "../AdCreativeCardEditable";
import { cn } from "@shared/utils";

const TITLE_MAX = 80;
const TAGLINE_MAX = 140;

export function StepDetails({
  heading,
  title,
  setTitle,
  tagline,
  setTagline,
  composedHref,
  suggestedTitle,
  suggestedTagline,
  onNext,
}: {
  heading: string;
  title: string;
  setTitle: (value: string) => void;
  tagline: string;
  setTagline: (value: string) => void;
  composedHref: string;
  suggestedTitle: string | null;
  suggestedTagline: string | null;
  onNext: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Autocompleta una sola vez con lo que trae el link (para ayudar, no para
  // imponer): si el usuario borra el sugerido, no se vuelve a rellenar solo.
  const didAutofill = useRef(false);
  const [autofilledTitle, setAutofilledTitle] = useState<string | null>(null);
  const [autofilledTagline, setAutofilledTagline] = useState<string | null>(null);
  useEffect(() => {
    if (didAutofill.current) return;
    if (!suggestedTitle && !suggestedTagline) return;
    didAutofill.current = true;
    // Sincroniza estado local con un dato externo asincrónico (el og-meta del
    // link) que recién llega después del mount — no es derivable en el render.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (suggestedTitle && !title.trim()) {
      const value = suggestedTitle.slice(0, TITLE_MAX);
      setAutofilledTitle(value);
      setTitle(value);
    }
    if (suggestedTagline && !tagline.trim()) {
      const value = suggestedTagline.slice(0, TAGLINE_MAX);
      setAutofilledTagline(value);
      setTagline(value);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo dispara con el primer dato que llegue, no en cada cambio de title/tagline
  }, [suggestedTitle, suggestedTagline]);

  const isSuggested =
    (autofilledTitle !== null && title === autofilledTitle) ||
    (autofilledTagline !== null && tagline === autofilledTagline);

  return (
    <section className="space-y-5">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display text-[19px] font-semibold text-foreground outline-none"
      >
        {heading}
      </h2>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono text-[10px] tracking-[1.4px] text-muted-foreground">
            ASÍ SE VE EN CONSULTAR
          </p>
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                (document.activeElement as HTMLElement | null)?.blur();
              } else {
                titleInputRef.current?.focus();
              }
            }}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
              isEditing
                ? "bg-amarillo text-background hover:opacity-90"
                : "bg-secondary/15 text-secondary hover:bg-secondary/25",
            )}
          >
            {isEditing ? (
              <>
                <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                Listo
              </>
            ) : (
              <>
                <Pencil className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                Editar
              </>
            )}
          </button>
        </div>
        <AdCreativeCardEditable
          title={title}
          setTitle={setTitle}
          tagline={tagline}
          setTagline={setTagline}
          href={composedHref}
          titleMaxLength={TITLE_MAX}
          taglineMaxLength={TAGLINE_MAX}
          titleInputRef={titleInputRef}
          onEditingChange={setIsEditing}
        />
        {isSuggested ? (
          <p className="text-[11px] text-muted-foreground">
            Título y texto sugeridos desde tu link — editalos directo ahí arriba.
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!title.trim()}
        className="btn-pill btn-primary inline-flex w-full min-h-12 items-center justify-center px-4 text-[15px] font-bold"
      >
        Continuar
      </button>
    </section>
  );
}
