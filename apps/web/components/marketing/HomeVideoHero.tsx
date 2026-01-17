"use client";

import { useRef, useEffect } from "react";

interface HomeVideoHeroProps {
  posterUrl: string;
  videoUrl: string;
}

export function HomeVideoHero({ posterUrl, videoUrl }: HomeVideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure video plays on mount (some browsers block autoplay)
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Autoplay was prevented, video will show poster instead
      });
    }
  }, []);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        poster={posterUrl}
        aria-hidden="true"
      >
        <source src={videoUrl} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/50 via-navy-900/30 to-navy-900/70" />
    </div>
  );
}
