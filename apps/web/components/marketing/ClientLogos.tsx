"use client";

import { cn } from "@/lib/utils";

interface ClientLogosProps {
  title?: string;
  variant?: "light" | "dark";
  className?: string;
}

// Placeholder company names - replace with actual client logos when available
const clients = [
  { name: "Fraser Yachts", initials: "FY" },
  { name: "Burgess", initials: "B" },
  { name: "Camper & Nicholsons", initials: "C&N" },
  { name: "Hill Robinson", initials: "HR" },
  { name: "Y.CO", initials: "Y.CO" },
  { name: "Northrop & Johnson", initials: "N&J" },
];

export function ClientLogos({
  title = "Trusted by Leading Yacht Owners & Management Companies",
  variant = "light",
  className,
}: ClientLogosProps) {
  const isDark = variant === "dark";

  return (
    <div className={cn("py-8", className)}>
      <p
        className={cn(
          "mb-6 text-center text-sm font-medium uppercase tracking-wider",
          isDark ? "text-gray-400" : "text-gray-500"
        )}
      >
        {title}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
        {clients.map((client) => (
          <div
            key={client.name}
            className={cn(
              "flex h-10 items-center justify-center rounded px-4 text-sm font-semibold transition-all duration-300",
              isDark
                ? "text-gray-500 hover:text-gray-300"
                : "text-gray-400 hover:text-gray-600",
              "grayscale hover:grayscale-0"
            )}
            title={client.name}
          >
            {/* Replace with actual logos: <Image src={`/images/clients/${client.slug}.svg`} ... /> */}
            <span className="font-serif text-lg tracking-wide">{client.initials}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
