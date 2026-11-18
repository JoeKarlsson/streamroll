import { siteDescription } from "@/lib/metadata";

// WebApplication structured data, rendered on the home page only.
export function WebAppJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "StreamRoll",
          url: "https://streamroll.joekarlsson.com",
          description: siteDescription,
          applicationCategory: "UtilityApplication",
          operatingSystem: "Web",
          author: { "@type": "Person", name: "Joe Karlsson", url: "https://joekarlsson.com" },
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      }}
    />
  );
}
