import { CONTACT_EMAIL, KOFI_URL, LINKEDIN_URL, paidOffers } from "@/lib/client-work";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://deliberateensemble.works/#sean-david-ramsingh",
      name: "Sean David Ramsingh",
      url: "https://deliberateensemble.works",
      jobTitle: "Web developer and AI systems builder",
      email: CONTACT_EMAIL,
      sameAs: [
        LINKEDIN_URL,
        "https://github.com/vortsghost2025",
        KOFI_URL,
        "https://www.youtube.com/@seandavidramsingh-s9z",
        "https://www.tiktok.com/@we4free",
        "https://osf.io/n3tya",
        "https://medium.com/@ai_28876",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://deliberateensemble.works/#hire",
      name: "Sean David Ramsingh — websites and automation",
      url: "https://deliberateensemble.works/hire",
      image: "https://deliberateensemble.works/sigularity2.jpg",
      description:
        "Custom builds and small-business websites, Postiz social scheduler setup, and n8n or Docker setup. Monthly care plans are available.",
      email: CONTACT_EMAIL,
      provider: { "@id": "https://deliberateensemble.works/#sean-david-ramsingh" },
      areaServed: "Worldwide",
      sameAs: [KOFI_URL, LINKEDIN_URL],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Freelance services",
        itemListElement: paidOffers.map((offer) => ({
          "@type": "Offer",
          name: offer.title,
          url: offer.href,
          price: offer.priceAmount,
          priceCurrency: "USD",
          description: `${offer.summary} Starting ${offer.price}.`,
        })),
      },
    },
  ],
};

export function SiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
