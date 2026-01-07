"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Linkedin, Facebook } from "lucide-react";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  languages?: string;
  email?: string;
  image: string;
  linkedin?: string;
  facebook?: string;
}

export function TeamMemberCard({ member }: { member: TeamMember }) {
  const [showEmail, setShowEmail] = useState(false);

  const hasSocials = member.email || member.linkedin || member.facebook;

  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Image
          src={member.image}
          alt={member.name}
          fill
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/70 via-navy-900/20 to-transparent" />

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          <h3 className="text-lg font-semibold text-white">{member.name}</h3>
          <p className="text-sm text-gold-300">{member.role}</p>
        </div>

        {/* Bio overlay */}
        <div className="absolute inset-0 z-10 hidden items-end bg-navy-900/80 px-4 pb-16 pt-6 text-white opacity-0 transition-all duration-300 sm:flex sm:translate-y-2 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-gray-100">{member.bio}</p>
            {member.languages && (
              <p className="text-xs text-gold-200">
                <span className="font-semibold text-gold-100">Languages:</span>{" "}
                {member.languages}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="space-y-3 sm:hidden">
          <p className="text-sm text-gray-600">{member.bio}</p>
          {member.languages && (
            <p className="text-xs text-gray-500">
              <span className="font-medium">Languages:</span> {member.languages}
            </p>
          )}
        </div>

        {/* Social Icons */}
        {hasSocials && (
          <div className="mt-4 flex items-center gap-2">
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-navy-600 transition-colors hover:bg-navy-200"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            )}
            {member.facebook && (
              <a
                href={member.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-navy-600 transition-colors hover:bg-navy-200"
                title="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {member.email && (
              <>
                {showEmail ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="ml-1 text-sm text-gold-600 hover:text-gold-700"
                  >
                    {member.email}
                  </a>
                ) : (
                  <button
                    onClick={() => setShowEmail(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-100 text-gold-600 transition-colors hover:bg-gold-200"
                    title="Show email"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
