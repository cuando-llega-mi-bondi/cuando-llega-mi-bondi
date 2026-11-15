export type AuthorPlatform = "github" | "linkedin" | "portfolio" | "x" | "instagram";

export interface Author {
  name: string;
  initials: string;
  role: string;
  avatar?: string;
  links: { platform: AuthorPlatform; label: string; href: string }[];
}

// Una sola fuente para la landing y "Acerca de": antes cada una tenía su copia y se desfasaban
export const AUTHORS: Author[] = [
  {
    name: "Nicolás Jiménez",
    initials: "NJ",
    role: "Fullstack Engineer · Multimedia Designer",
    avatar: "/authors/nicolas-jimenez.png",
    links: [
      { platform: "github", label: "GitHub", href: "https://github.com/dotfn" },
      { platform: "linkedin", label: "LinkedIn", href: "https://linkedin.com/in/dotfn" },
      { platform: "portfolio", label: "Portfolio", href: "https://dotfn.dev" },
      { platform: "x", label: "X", href: "https://twitter.com/dotfn_" },
      { platform: "instagram", label: "Instagram", href: "https://instagram.com/dotfndev" },
    ],
  },
  {
    name: "Matias Celiz Ramos",
    initials: "MC",
    role: "AI Engineer · Técnico en Informática",
    avatar: "/authors/matias-celiz.png",
    links: [
      { platform: "github", label: "GitHub", href: "https://github.com/Celiz" },
      { platform: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/celizm/" },
      { platform: "portfolio", label: "Portfolio", href: "https://celizin.dev" },
      { platform: "x", label: "X", href: "https://twitter.com/celizin" },
      { platform: "instagram", label: "Instagram", href: "https://instagram.com/celizin_" },
    ],
  },
];
