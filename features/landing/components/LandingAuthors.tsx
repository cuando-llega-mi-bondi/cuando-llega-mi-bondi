import { AUTHORS } from "@features/authors/data/authors";
import { AuthorProfile } from "@features/authors/components/AuthorProfile";
import { LandingSection } from "./LandingSection";

export function LandingAuthors() {
  return (
    <LandingSection title="Hecho por" highlight="marplatenses.">
      {/* Sin tarjetas: la foto y el nombre alcanzan para separar a cada persona */}
      <ul role="list" className="grid gap-12 md:grid-cols-2 md:gap-10">
        {AUTHORS.map((author) => (
          <li key={author.name}>
            <AuthorProfile author={author} />
          </li>
        ))}
      </ul>
    </LandingSection>
  );
}
