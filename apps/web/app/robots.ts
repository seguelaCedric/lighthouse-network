import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/admin/",
          "/agency/",
          "/_next/",
          "/private/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/job-board", "/job-board/", "/match", "/employer"],
        disallow: ["/api/", "/auth/", "/dashboard/", "/admin/", "/agency/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/job-board", "/job-board/", "/match", "/employer"],
        disallow: ["/api/", "/auth/", "/dashboard/", "/admin/", "/agency/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/job-board", "/job-board/", "/match", "/employer"],
        disallow: ["/api/", "/auth/", "/dashboard/", "/admin/", "/agency/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/auth/", "/dashboard/", "/admin/", "/agency/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
