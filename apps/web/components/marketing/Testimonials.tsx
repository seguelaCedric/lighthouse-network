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
      {/* Pattern Backgrounds */}
      {pattern === "diamond" && (
        <>
          {/* Warm champagne/gold glow from top */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_40%_at_50%_0%,rgba(195,165,120,0.08),transparent_60%)]" aria-hidden="true" />

          {/* Geometric diamond pattern */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="testimonial-diamond-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path
                    d="M30 0L60 30L30 60L0 30Z"
                    fill="none"
                    stroke="rgba(195, 165, 120, 0.06)"
                    strokeWidth="0.5"
                  />
                  <circle cx="30" cy="30" r="1" fill="rgba(195, 165, 120, 0.08)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#testimonial-diamond-pattern)" />
            </svg>
          </div>

          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,20,35,0.4)_100%)]" aria-hidden="true" />
        </>
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
                "rounded-2xl p-6 transition-shadow hover:shadow-lg",
                isDark
                  ? "border border-white/10 bg-white/5"
                  : "border border-gray-200 bg-white"
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
