export interface Sponsor {
  name: string;
  logo: string;
  href: string;
  tagline?: string;
  cta: string;
}

export const SPONSORS: Sponsor[] = [
  {
    name: "Nexovet",
    logo: "/sponsors/nexovet.png",
    href: "https://nexovet.aeterna.red/",
    tagline: "Veterinaria en Mar del Plata",
    cta: "Conocer",
  },
];

export const FEATURED_SPONSOR = SPONSORS[0];
