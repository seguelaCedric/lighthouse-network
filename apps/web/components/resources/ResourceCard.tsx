import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Resource,
  calculateReadingTime,
  getContentTypeLabel,
  getContentTypeIcon,
  getContentTypeBadgeStyle,
} from "@/lib/resources/resource-helpers";

interface ResourceCardProps {
  resource: Resource;
  variant?: "default" | "featured";
}

export function ResourceCard({ resource, variant = "default" }: ResourceCardProps) {
  const Icon = getContentTypeIcon(resource.content_type);
  const contentTypeLabel = getContentTypeLabel(resource.content_type);
  const badgeStyle = getContentTypeBadgeStyle(resource.content_type);
  const readingTime = calculateReadingTime(resource.content_length);

  if (variant === "featured") {
    return (
      <Link href={`/blog/${resource.slug}`} className="group block">
        <article className="relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-navy-50 to-white p-8 transition-all hover:border-gold-300 hover:shadow-xl">
          <div className="absolute right-4 top-4 rounded-full bg-gold-500/10 p-3">
            <Icon className="h-6 w-6 text-gold-600" />
          </div>

          <div className="mb-4 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                badgeStyle
              )}
            >
              {contentTypeLabel}
            </span>
          </div>

          <h3 className="mb-3 pr-12 font-serif text-xl font-semibold text-navy-900 transition-colors group-hover:text-gold-600">
            {resource.title}
          </h3>

          {resource.excerpt && (
            <p className="mb-4 line-clamp-2 text-gray-600">{resource.excerpt}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {resource.published_at && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <time dateTime={resource.published_at}>
                  {new Date(resource.published_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
            )}
            <span>{readingTime}</span>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-gold-600 opacity-0 transition-opacity group-hover:opacity-100">
            Read more
            <ArrowRight className="h-4 w-4" />
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${resource.slug}`} className="group block">
      <article className="h-full rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-gold-300 hover:shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-lg bg-gray-100 p-2">
            <Icon className="h-4 w-4 text-gray-600" />
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              badgeStyle
            )}
          >
            {contentTypeLabel}
          </span>
        </div>

        <h3 className="mb-2 font-serif text-lg font-semibold text-navy-900 transition-colors group-hover:text-gold-600">
          {resource.title}
        </h3>

        {resource.excerpt && (
          <p className="mb-4 line-clamp-2 text-sm text-gray-600">
            {resource.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            {resource.published_at && (
              <time dateTime={resource.published_at}>
                {new Date(resource.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            )}
            <span>{readingTime}</span>
          </div>

          <div className="flex items-center gap-1 font-medium text-gold-600 opacity-0 transition-opacity group-hover:opacity-100">
            Read
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </article>
    </Link>
  );
}
