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
  className?: string;
}

export function Testimonials({
  title = "What Our Clients Say",
  subtitle,
  testimonials,
  variant = "light",
  className,
}: TestimonialsProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "py-20 sm:py-28",
        isDark ? "bg-navy-900" : "bg-gray-50",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <h2
            className={cn(
              "font-serif text-3xl font-semibold sm:text-4xl",
              isDark ? "text-white" : "text-navy-900"
            )}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={cn(
                "mx-auto mt-4 max-w-2xl",
                isDark ? "text-gray-400" : "text-gray-600"
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

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
                          : "fill-gray-200 text-gray-200"
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
