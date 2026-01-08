import { createClient } from '@/lib/supabase/server';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicHeader } from '@/components/pricing/PublicHeader';
import { PublicFooter } from '@/components/pricing/PublicFooter';
import { ArrowRight, Calendar, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | Lighthouse Careers',
  description: 'Expert insights on hiring yacht crew and private household staff',
};

export const revalidate = 3600; // Revalidate every hour

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Blog posts fetch error:', error);
    return notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-semibold text-navy-900 sm:text-5xl">
            Blog
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Expert insights on hiring yacht crew and private household staff
          </p>
        </div>

        {!posts || posts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600">No blog posts available yet.</p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gold-300 hover:shadow-lg"
              >
                <Link href={`/blog/${post.slug}`}>
                  <h2 className="mb-3 font-serif text-xl font-semibold text-navy-900 group-hover:text-gold-600 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mb-4 text-gray-600 line-clamp-3">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {post.published_at && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <time dateTime={post.published_at}>
                          {new Date(post.published_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </time>
                      </div>
                    )}
                    {post.target_audience && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        <span className="capitalize">{post.target_audience}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Read article
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}

