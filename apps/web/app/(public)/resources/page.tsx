import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PublicHeader } from "@/components/pricing/PublicHeader";
import { PublicFooter } from "@/components/pricing/PublicFooter";
import { SalaryGuideHero } from "@/components/resources/FeaturedResources";
import { CategorySection } from "@/components/resources/CategorySection";
import {
  Resource,
  filterByIndustry,
  filterByContentTypes,
  HIRING_CONTENT_TYPES,
  CAREER_CONTENT_TYPES,
  INTERVIEW_CONTENT_TYPES,
  SKILLS_CONTENT_TYPES,
  INSIGHTS_CONTENT_TYPES,
} from "@/lib/resources/resource-helpers";

export const metadata: Metadata = {
  title: "Resources & Guides | Yacht Crew & Private Staff | Lighthouse Careers",
  description:
    "Expert resources for hiring yacht crew and private household staff. Salary guides, hiring tips, interview questions, and career advice.",
  keywords: [
    "yacht crew hiring guide",
    "private staff salary",
    "hiring yacht crew",
    "yacht crew career",
    "household staff resources",
    "butler hiring guide",
    "captain salary guide",
  ],
};

export const revalidate = 3600; // Revalidate every hour

async function getResources() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      content_type,
      target_audience,
      target_position,
      published_at,
      view_count,
      content
    `
    )
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("Resources fetch error:", error);
    return [];
  }

  // Map to include content_length
  return (posts || []).map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content_type: post.content_type,
    target_audience: post.target_audience,
    target_position: post.target_position,
    published_at: post.published_at,
    view_count: post.view_count,
    content_length: post.content?.length || 0,
  })) as Resource[];
}

export default async function ResourcesPage() {
  const allResources = await getResources();

  // Filter resources by industry
  const yachtResources = filterByIndustry(allResources, "yacht");
  const householdResources = filterByIndustry(allResources, "household");

  // Get general/insights content (case studies, market insights)
  const insightsResources = filterByContentTypes(
    allResources,
    INSIGHTS_CONTENT_TYPES
  );

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="text-center">
              <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
                Resources & Guides
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
                Expert insights for the yacht and private service industry.
                Salary data, hiring guides, career advice, and industry trends.
              </p>
            </div>

            {/* Salary Guide Hero */}
            <SalaryGuideHero />
          </div>
        </section>

        {/* Yacht Crew Resources Section */}
        {yachtResources.length > 0 && (
          <CategorySection
            title="Yacht Crew Resources"
            subtitle="Hiring guides, career advice, and industry insights for yacht professionals"
            tabs={[
              {
                id: "hiring",
                label: "Hiring Guides",
                contentTypes: HIRING_CONTENT_TYPES,
              },
              {
                id: "career",
                label: "Career Guides",
                contentTypes: CAREER_CONTENT_TYPES,
              },
              {
                id: "interview",
                label: "Interview Tips",
                contentTypes: INTERVIEW_CONTENT_TYPES,
              },
              {
                id: "skills",
                label: "Skills & Certs",
                contentTypes: SKILLS_CONTENT_TYPES,
              },
            ]}
            resources={yachtResources}
            viewAllHref="/blog?industry=yacht"
            backgroundClass="bg-white"
          />
        )}

        {/* Private Staff Resources Section */}
        {householdResources.length > 0 && (
          <CategorySection
            title="Private Staff Resources"
            subtitle="Expert guidance for hiring and careers in private household and estate service"
            tabs={[
              {
                id: "hiring",
                label: "Hiring Guides",
                contentTypes: HIRING_CONTENT_TYPES,
              },
              {
                id: "career",
                label: "Career Guides",
                contentTypes: CAREER_CONTENT_TYPES,
              },
              {
                id: "interview",
                label: "Interview Tips",
                contentTypes: INTERVIEW_CONTENT_TYPES,
              },
            ]}
            resources={householdResources}
            viewAllHref="/blog?industry=household"
            backgroundClass="bg-gray-50"
          />
        )}

        {/* Industry Insights Section */}
        {insightsResources.length > 0 && (
          <CategorySection
            title="Industry Insights"
            subtitle="Case studies, market trends, and location-specific information"
            tabs={[
              {
                id: "case-studies",
                label: "Case Studies",
                contentTypes: ["case_study"],
              },
              {
                id: "insights",
                label: "Market Insights",
                contentTypes: ["location_insights", "faq_expansion"],
              },
            ]}
            resources={insightsResources}
            viewAllHref="/blog"
            backgroundClass="bg-white"
          />
        )}

        {/* Empty State */}
        {allResources.length === 0 && (
          <section className="py-20">
            <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
              <p className="text-lg text-gray-600">
                No resources available yet. Check back soon for expert guides and
                insights.
              </p>
            </div>
          </section>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
