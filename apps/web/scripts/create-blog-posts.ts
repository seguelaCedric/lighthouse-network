/**
 * Script to create 18 blog post drafts for content generation
 * Focus: New York/US market (yacht crew and household staff)
 */

const blogPosts = [
  // HIRING GUIDES (6)
  {
    title: "Complete Guide to Hiring a Private Chef in New York",
    slug: "hiring-private-chef-new-york-guide",
    excerpt: "Everything you need to know about hiring a personal chef in New York, from finding candidates to negotiating salaries and contracts.",
    content: "[Content to be generated]",
    content_type: "hiring_guide",
    target_audience: "employer" as const,
    target_position: "Chef",
    target_location: "New York",
    primary_keyword: "hire private chef New York",
    status: "draft" as const,
  },
  {
    title: "How to Hire a Nanny in New York: A Parent's Complete Guide",
    slug: "hire-nanny-new-york-parents-guide",
    excerpt: "Complete guide for New York parents hiring a nanny, covering legal requirements, cultural fit, salary expectations, and interview tips.",
    content: "[Content to be generated]",
    content_type: "hiring_guide",
    target_audience: "employer" as const,
    target_position: "Nanny",
    target_location: "New York",
    primary_keyword: "hire nanny New York",
    status: "draft" as const,
  },
  {
    title: "Hiring a Personal Assistant in New York: Executive Guide",
    slug: "hiring-personal-assistant-new-york-executives",
    excerpt: "Expert advice for executives hiring a personal assistant in New York, including what to look for, salary ranges, and interview questions.",
    content: "[Content to be generated]",
    content_type: "hiring_guide",
    target_audience: "employer" as const,
    target_position: "Personal Assistant",
    target_location: "New York",
    primary_keyword: "hire personal assistant New York",
    status: "draft" as const,
  },
  {
    title: "Finding a Butler for Your Estate: Complete US Hiring Guide",
    slug: "hiring-butler-estate-us-guide",
    excerpt: "Comprehensive guide to hiring a professional butler for your US estate, covering traditional skills, modern expectations, and salary benchmarks.",
    content: "[Content to be generated]",
    content_type: "hiring_guide",
    target_audience: "employer" as const,
    target_position: "Butler",
    target_location: "United States",
    primary_keyword: "hire butler United States",
    status: "draft" as const,
  },
  {
    title: "How to Hire a Housekeeper in Manhattan: What to Expect",
    slug: "hire-housekeeper-manhattan-expectations",
    excerpt: "Manhattan-specific guide to hiring a housekeeper, including cost of living adjustments, availability, and typical service standards.",
    content: "[Content to be generated]",
    content_type: "hiring_guide",
    target_audience: "employer" as const,
    target_position: "Housekeeper",
    target_location: "Manhattan",
    primary_keyword: "hire housekeeper Manhattan",
    status: "draft" as const,
  },
  {
    title: "Yacht Crew Recruitment in Miami and Fort Lauderdale",
    slug: "yacht-crew-recruitment-miami-fort-lauderdale",
    excerpt: "Complete recruitment guide for yacht owners and captains hiring crew in South Florida's yachting capital.",
    content: "[Content to be generated]",
    content_type: "hiring_guide",
    target_audience: "employer" as const,
    target_position: "Yacht Crew",
    target_location: "Miami",
    primary_keyword: "yacht crew recruitment Miami",
    status: "draft" as const,
  },

  // SALARY GUIDES (4)
  {
    title: "Private Chef Salaries in New York: 2026 Compensation Guide",
    slug: "private-chef-salaries-new-york-2026",
    excerpt: "Detailed salary analysis for private chefs in New York, covering entry to executive level compensation, benefits, and negotiation strategies.",
    content: "[Content to be generated]",
    content_type: "salary_guide",
    target_audience: "both" as const,
    target_position: "Chef",
    target_location: "New York",
    primary_keyword: "private chef salary New York",
    status: "draft" as const,
  },
  {
    title: "Nanny Salaries in New York: What to Pay Your Childcare Professional",
    slug: "nanny-salaries-new-york-childcare-compensation",
    excerpt: "Comprehensive guide to nanny salaries in New York, including live-in vs. live-out rates, benefits packages, and market trends.",
    content: "[Content to be generated]",
    content_type: "salary_guide",
    target_audience: "both" as const,
    target_position: "Nanny",
    target_location: "New York",
    primary_keyword: "nanny salary New York",
    status: "draft" as const,
  },
  {
    title: "Personal Assistant Salaries in US Major Cities: Complete Guide",
    slug: "personal-assistant-salaries-us-cities-guide",
    excerpt: "Market analysis of personal assistant salaries across major US cities, with breakdown by experience level and role complexity.",
    content: "[Content to be generated]",
    content_type: "salary_guide",
    target_audience: "both" as const,
    target_position: "Personal Assistant",
    target_location: "United States",
    primary_keyword: "personal assistant salary United States",
    status: "draft" as const,
  },
  {
    title: "Butler and Estate Manager Salaries: US Market Report 2026",
    slug: "butler-estate-manager-salaries-us-2026",
    excerpt: "Comprehensive salary analysis for butlers and estate managers in the US, covering regional variations and compensation by property size.",
    content: "[Content to be generated]",
    content_type: "salary_guide",
    target_audience: "both" as const,
    target_position: "Butler",
    target_location: "United States",
    primary_keyword: "butler salary United States",
    status: "draft" as const,
  },

  // POSITION OVERVIEWS (5)
  {
    title: "What Does a Private Chef Do? Job Description & Career Path",
    slug: "private-chef-job-description-career-path",
    excerpt: "Complete overview of the private chef profession, from daily responsibilities to career progression opportunities and required skills.",
    content: "[Content to be generated]",
    content_type: "position_overview",
    target_audience: "candidate" as const,
    target_position: "Chef",
    target_location: null,
    primary_keyword: "private chef job description",
    status: "draft" as const,
  },
  {
    title: "Personal Assistant Career Guide: Roles, Skills, and Expectations",
    slug: "personal-assistant-career-guide-skills-expectations",
    excerpt: "Everything candidates need to know about building a career as a personal assistant, from entry-level to executive PA roles.",
    content: "[Content to be generated]",
    content_type: "position_overview",
    target_audience: "candidate" as const,
    target_position: "Personal Assistant",
    target_location: null,
    primary_keyword: "personal assistant career",
    status: "draft" as const,
  },
  {
    title: "Becoming a Professional Nanny: Job Requirements and Career Growth",
    slug: "becoming-professional-nanny-requirements-career",
    excerpt: "Guide for aspiring nannies covering certifications, experience requirements, career progression, and professional development.",
    content: "[Content to be generated]",
    content_type: "position_overview",
    target_audience: "candidate" as const,
    target_position: "Nanny",
    target_location: null,
    primary_keyword: "professional nanny requirements",
    status: "draft" as const,
  },
  {
    title: "Estate Manager Jobs: Complete Career Guide",
    slug: "estate-manager-jobs-career-guide",
    excerpt: "Comprehensive career guide for estate managers, covering the transition from butler, required skills, and advancement opportunities.",
    content: "[Content to be generated]",
    content_type: "position_overview",
    target_audience: "candidate" as const,
    target_position: "Estate Manager",
    target_location: null,
    primary_keyword: "estate manager career",
    status: "draft" as const,
  },
  {
    title: "Yacht Stewardess Career: Everything You Need to Know",
    slug: "yacht-stewardess-career-guide",
    excerpt: "Complete guide to yacht stewardess careers, from entry requirements and certifications to lifestyle considerations and salary expectations.",
    content: "[Content to be generated]",
    content_type: "position_overview",
    target_audience: "candidate" as const,
    target_position: "Stewardess",
    target_location: null,
    primary_keyword: "yacht stewardess career",
    status: "draft" as const,
  },

  // INTERVIEW QUESTIONS (3)
  {
    title: "Top 25 Interview Questions for Hiring a Private Chef",
    slug: "interview-questions-hiring-private-chef",
    excerpt: "Essential interview questions for evaluating private chef candidates, with guidance on what to look for in responses.",
    content: "[Content to be generated]",
    content_type: "interview_questions",
    target_audience: "employer" as const,
    target_position: "Chef",
    target_location: null,
    primary_keyword: "private chef interview questions",
    status: "draft" as const,
  },
  {
    title: "Nanny Interview Questions: The Complete Guide for Parents",
    slug: "nanny-interview-questions-complete-guide-parents",
    excerpt: "Comprehensive list of nanny interview questions covering childcare philosophy, experience, emergency handling, and cultural fit.",
    content: "[Content to be generated]",
    content_type: "interview_questions",
    target_audience: "employer" as const,
    target_position: "Nanny",
    target_location: null,
    primary_keyword: "nanny interview questions",
    status: "draft" as const,
  },
  {
    title: "Personal Assistant Interview Questions for Executives",
    slug: "personal-assistant-interview-questions-executives",
    excerpt: "Critical interview questions for executives hiring a personal assistant, focusing on discretion, organization, and problem-solving.",
    content: "[Content to be generated]",
    content_type: "interview_questions",
    target_audience: "employer" as const,
    target_position: "Personal Assistant",
    target_location: null,
    primary_keyword: "personal assistant interview questions",
    status: "draft" as const,
  },
];

async function createBlogPosts() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004';

  console.log(`Creating ${blogPosts.length} blog post drafts...`);

  for (const [index, post] of blogPosts.entries()) {
    try {
      // Remove null values to avoid validation errors
      const cleanPost = Object.fromEntries(
        Object.entries(post).filter(([_, v]) => v !== null)
      );

      const response = await fetch(`${baseUrl}/api/blog-posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanPost),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Failed to create post ${index + 1}: ${post.title}`);
        console.error(`Error: ${error}`);
        continue;
      }

      const created = await response.json();
      console.log(`✓ Created (${index + 1}/${blogPosts.length}): ${post.title} [ID: ${created.id}]`);
    } catch (error) {
      console.error(`Error creating post ${index + 1}: ${post.title}`, error);
    }
  }

  console.log('\nAll blog posts created successfully!');
  console.log('Next steps:');
  console.log('1. Visit http://localhost:3004/dashboard/seo-pages/blog');
  console.log('2. Select first 5 posts');
  console.log('3. Use bulk generate feature');
}

createBlogPosts().catch(console.error);
