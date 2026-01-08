"use client";

import { AppShell } from "@/components/layout/AppShell";

export function MainLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
