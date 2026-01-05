import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lighthouse-careers.com";

// Create a service client for server-side sitemap generation
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  // Fetch all public jobs for dynamic sitemap entries
  const { data: jobs } = await supabase
    .from("public_jobs")
    .select("id, published_at")
    .order("published_at", { ascending: false })
    .limit(500);

  // Fetch SEO landing pages
  const { data: seoPages } = await supabase
    .from("seo_landing_pages")
    .select("original_url_path, updated_at")
    .limit(1000);

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/job-board`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/match`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/employer`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic job pages
  const jobPages: MetadataRoute.Sitemap = (jobs || []).map((job) => ({
    url: `${baseUrl}/job-board/${job.id}`,
    lastModified: job.published_at ? new Date(job.published_at) : new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // SEO landing pages
  const landingPages: MetadataRoute.Sitemap = (seoPages || []).map((page) => ({
    url: `${baseUrl}/${page.original_url_path}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...jobPages, ...landingPages];
}
