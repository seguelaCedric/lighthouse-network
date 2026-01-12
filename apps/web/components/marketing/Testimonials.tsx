"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
  rating?: number;
  image?: string;
}

interface TestimonialsProps {
  title?: string;
  subtitle?: string;
  testimonials: Testimonial[];
  variant?: "light" | "dark";
  pattern?: "none" | "diamond";
  showStats?: boolean;
  stats?: Array<{ value: string; label: string }>;
  className?: string;
}

export function Testimonials({
  title = "What Our Clients Say",
  subtitle,
  testimonials,
  variant = "light",
  pattern = "none",
  showStats = false,
  stats,
  className,
}: TestimonialsProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "relative py-20 sm:py-28 overflow-hidden",
        isDark ? "bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" : "bg-gray-50",
        className
      )}
    >
      {/* Pattern Backgrounds - z-0 to stay behind content */}
      {pattern === "diamond" && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Warm champagne/gold glow from top */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_50%_at_50%_0%,rgba(195,165,120,0.12),transparent_70%)]" aria-hidden="true" />

          {/* Secondary glow from bottom corners */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_0%_100%,rgba(195,165,120,0.06),transparent_50%)]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(195,165,120,0.06),transparent_50%)]" aria-hidden="true" />

          {/* Geometric diamond pattern - layered for depth */}
          <div className="absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Primary diamond pattern */}
                <pattern id="testimonial-diamond-primary" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  {/* Outer diamond */}
                  <path
                    d="M40 4L76 40L40 76L4 40Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.12)"
                    strokeWidth="0.75"
                  />
                  {/* Inner diamond */}
                  <path
                    d="M40 16L64 40L40 64L16 40Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.08)"
                    strokeWidth="0.5"
                  />
                  {/* Center accent dot */}
                  <circle cx="40" cy="40" r="1.5" fill="rgba(195, 165, 120, 0.15)" />
                  {/* Corner accent dots */}
                  <circle cx="40" cy="4" r="1" fill="rgba(195, 165, 120, 0.1)" />
                  <circle cx="76" cy="40" r="1" fill="rgba(195, 165, 120, 0.1)" />
                  <circle cx="40" cy="76" r="1" fill="rgba(195, 165, 120, 0.1)" />
                  <circle cx="4" cy="40" r="1" fill="rgba(195, 165, 120, 0.1)" />
                </pattern>
                {/* Secondary offset pattern for depth */}
                <pattern id="testimonial-diamond-secondary" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path
                    d="M40 20L60 40L40 60L20 40Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.05)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#testimonial-diamond-primary)" />
              <rect width="100%" height="100%" fill="url(#testimonial-diamond-secondary)" />
            </svg>
          </div>

          {/* Refined vignette with softer edges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(10,20,35,0.35)_100%)]" aria-hidden="true" />
        </div>
      )}

      {/* Background decorative elements for dark variant */}
      {isDark && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold-500 rounded-full filter blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-400 rounded-full filter blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500 rounded-full filter blur-[100px] opacity-20" />
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        {/* Stats Section */}
        {showStats && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="mb-16 text-center">
          <h2
            className={cn(
              "font-serif text-3xl font-semibold sm:text-4xl mb-4",
              isDark ? "text-white" : "text-navy-900"
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={cn(
                "mx-auto max-w-2xl",
                isDark ? "text-gray-300" : "text-gray-600"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={cn(
                "rounded-2xl p-6 transition-all duration-300",
                isDark
                  ? "border border-white/10 bg-navy-800/95 backdrop-blur-sm hover:border-gold-500/30 hover:shadow-[0_8px_30px_-6px_rgba(195,165,120,0.25)]"
                  : "border border-gray-200 bg-white hover:shadow-lg"
              )}
            >

              {/* Rating Stars */}
              {testimonial.rating && (
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < testimonial.rating!
                          ? "fill-gold-400 text-gold-400"
                          : isDark ? "fill-gray-600 text-gray-600" : "fill-gray-200 text-gray-200"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Quote */}
              <blockquote
                className={cn(
                  "mb-6 text-base leading-relaxed",
                  isDark ? "text-gray-300" : "text-gray-700"
                )}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                {testimonial.image ? (
                  <img
                    src={testimonial.image}
                    alt={testimonial.author}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                      isDark
                        ? "bg-gold-500/20 text-gold-400"
                        : "bg-gold-100 text-gold-700"
                    )}
                  >
                    {testimonial.author
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                )}
                <div>
                  <div
                    className={cn(
                      "font-medium",
                      isDark ? "text-white" : "text-navy-900"
                    )}
                  >
                    {testimonial.author}
                  </div>
                  <div
                    className={cn(
                      "text-sm",
                      isDark ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    {testimonial.role}
                    {testimonial.company && `, ${testimonial.company}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
