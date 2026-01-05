import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import "./globals.css";

// Sans-serif: Primary UI font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Serif: Editorial/luxury headings
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

// Monospace: Code and data
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Lighthouse Crew Network",
  description: "The infrastructure layer for yacht and villa crew recruitment globally",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${cormorantGaramond.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
