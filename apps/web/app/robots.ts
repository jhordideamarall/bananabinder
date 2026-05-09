import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://bananasbindery.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/profile/", "/checkout/success"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
