/** Paid offers and client sites. Ko-fi is the checkout path. */

export const CONTACT_EMAIL = "deliberateensemble@gmail.com";
export const LINKEDIN_URL = "https://www.linkedin.com/in/sean-david-ramsingh-2143a63ab/";
export const KOFI_URL = "https://ko-fi.com/meshcast";

export const LANDING_GIG_URL = "https://ko-fi.com/c/c417e6ebad";

export interface PaidOffer {
  id: string;
  title: string;
  price: string;
  priceAmount: string;
  summary: string;
  href: string;
}

export const paidOffers: PaidOffer[] = [
  {
    id: "postiz",
    title: "Postiz social scheduler setup",
    price: "from $75",
    priceAmount: "75",
    summary: "I set up Postiz so you can plan and publish social posts from one place.",
    href: "https://ko-fi.com/c/7655256fbf",
  },
  {
    id: "landing",
    title: "Landing page",
    price: "from $50",
    priceAmount: "50",
    summary: "A clear page for your business. A small site is about $120.",
    href: LANDING_GIG_URL,
  },
  {
    id: "automation",
    title: "n8n or Docker setup",
    price: "from $60",
    priceAmount: "60",
    summary: "I install n8n automations or a Docker setup on a machine you control.",
    href: "https://ko-fi.com/c/71a430d067",
  },
];

export interface ClientProject {
  title: string;
  url: string;
  summary: string;
  gigUrl: string;
}

/** Live sites. Each "get one like this" link uses the landing-page commission. */
export const clientProjects: ClientProject[] = [
  {
    title: "Tropical Paradise",
    url: "https://tropical-paradise-mtl.vercel.app/",
    summary: "Demo restaurant site. Bilingual English and French, one-tap ordering, and real photos.",
    gigUrl: LANDING_GIG_URL,
  },
  {
    title: "Snug Winter Picks",
    url: "https://snugwinterpicks.com",
    summary: "A seasonal picks site for costumes, candy, and decor, with current Amazon prices.",
    gigUrl: LANDING_GIG_URL,
  },
  {
    title: "Fire Stick Masters",
    url: "https://firestickmasters.com",
    summary: "A comparison site for Amazon Fire TV Stick models, specs, and current deals.",
    gigUrl: LANDING_GIG_URL,
  },
  {
    title: "Home & Kitchen Essentials",
    url: "https://homekitchenessentials.shop",
    summary: "A shortlist of kitchen and home tools, with fit notes and current Amazon prices.",
    gigUrl: LANDING_GIG_URL,
  },
];
