"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function JoinRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Build query string from all search params
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    const queryString = params.toString();
    router.replace(`/auth/register${queryString ? `?${queryString}` : ""}`);
  }, [router, searchParams]);

  return null;
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinRedirect />
    </Suspense>
  );
}
