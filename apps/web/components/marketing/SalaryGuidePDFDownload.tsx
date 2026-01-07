"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SalaryGuidePDFDownload() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/salary-guide/pdf");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get PDF");
      }

      // Open the PDF URL in a new tab
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No PDF URL returned");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF");
      console.error("Error downloading PDF:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        onClick={handleDownload}
        variant="secondary"
        size="lg"
        className="min-w-[200px] border-white/20 text-white hover:bg-white/10"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </>
        )}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

