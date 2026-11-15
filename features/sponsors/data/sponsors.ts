export interface Sponsor {
  name: string;
  logo: string;
  href: string;
  tagline?: string;
  cta: string;
  /** El logo trae texto claro y necesita una placa oscura sobre superficies claras */
  logoOnDark?: boolean;
}

export const SPONSORS: Sponsor[] = [
  {
    name: "Nexovet",
    logo: "/sponsors/nexovet.png",
    href: "https://nexovet.aeterna.red/",
    tagline: "Veterinaria en Mar del Plata",
    cta: "Conocer",
    logoOnDark: true,
  },
];

export const FEATURED_SPONSOR = SPONSORS[0];
