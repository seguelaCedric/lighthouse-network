"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Loader2,
  Edit,
  Eye,
  X,
  Sparkles,
  Send,
} from "lucide-react";
import Link from "next/link";

interface ScheduledPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  scheduled_generate_at: string | null;
  scheduled_publish_at: string | null;
  target_position: string | null;
  target_location: string | null;
}

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledPosts();
  }, []);

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/blog-posts?limit=1000");
      const data = await response.json();
      const allPosts = data.posts || [];
      
      // Filter for posts with scheduled times
      const scheduled = allPosts.filter(
        (post: ScheduledPost) => post.scheduled_generate_at || post.scheduled_publish_at
      );
      
      // Sort by earliest scheduled time
      scheduled.sort((a: ScheduledPost, b: ScheduledPost) => {
        const aTime = a.scheduled_generate_at || a.scheduled_publish_at || "";
        const bTime = b.scheduled_generate_at || b.scheduled_publish_at || "";
        return aTime.localeCompare(bTime);
      });
      
      setPosts(scheduled);
    } catch (error) {
      console.error("Failed to fetch scheduled posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearSchedule = async (postId: string, type: "generate" | "publish") => {
    try {
      const response = await fetch(`/api/blog-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [`scheduled_${type}_at`]: null,
        }),
      });

      if (response.ok) {
        fetchScheduledPosts();
      }
    } catch (error) {
      console.error("Failed to clear schedule:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-gold-600" />
          <p className="mt-4 text-gray-600">Loading scheduled posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-serif font-semibold text-navy-800">Scheduled Posts</h1>
            <p className="mt-1 text-gray-600">Manage scheduled generation and publishing</p>
          </div>
        </div>

        {/* Scheduled Posts */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {posts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Calendar className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-navy-900">No scheduled posts</h3>
              <p className="mt-2 text-gray-600">Posts with scheduled generation or publishing will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <div key={post.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-navy-900">{post.title}</h3>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                          {post.status}
                        </span>
                      </div>
                      {(post.target_position || post.target_location) && (
                        <p className="mt-1 text-sm text-gray-600">
                          {[post.target_position, post.target_location].filter(Boolean).join(" • ")}
                        </p>
                      )}
                      <div className="mt-3 space-y-2">
                        {post.scheduled_generate_at && (
                          <div className="flex items-center gap-2 text-sm">
                            <Sparkles className="h-4 w-4 text-gold-600" />
                            <span className="text-gray-600">Generate:</span>
                            <time dateTime={post.scheduled_generate_at} className="font-medium text-navy-900">
                              {new Date(post.scheduled_generate_at).toLocaleString()}
                            </time>
                            <button
                              onClick={() => clearSchedule(post.id, "generate")}
                              className="ml-2 text-error-600 hover:text-error-700"
                              title="Clear schedule"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {post.scheduled_publish_at && (
                          <div className="flex items-center gap-2 text-sm">
                            <Send className="h-4 w-4 text-gold-600" />
                            <span className="text-gray-600">Publish:</span>
                            <time dateTime={post.scheduled_publish_at} className="font-medium text-navy-900">
                              {new Date(post.scheduled_publish_at).toLocaleString()}
                            </time>
                            <button
                              onClick={() => clearSchedule(post.id, "publish")}
                              className="ml-2 text-error-600 hover:text-error-700"
                              title="Clear schedule"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/seo-pages/blog/${post.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
