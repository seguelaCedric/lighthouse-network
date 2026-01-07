"use client";

import { useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmergencyLineCard() {
  const [isRevealed, setIsRevealed] = useState(false);
  const phoneNumber = "+33 6 52 92 83 60";
  const phoneHref = "tel:+33652928360";

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 transition-colors group-hover:bg-red-200">
        <Clock className="h-7 w-7 text-red-600" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-navy-900">
        Emergency Line
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        For crew emergencies only
      </p>

      {!isRevealed ? (
        <button
          onClick={() => setIsRevealed(true)}
          className="w-full text-sm text-gray-600 underline hover:text-gray-800"
        >
          Click to reveal number
        </button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> This line is for crew emergencies only. 
                Applications and general inquiries will not be answered. Please use 
                email or the contact form for all other matters.
              </p>
            </div>
          </div>
          <a
            href={phoneHref}
            className="block rounded-lg border border-red-300 bg-red-50 p-3 text-center font-medium text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
          >
            {phoneNumber}
          </a>
        </div>
      )}
    </div>
  );
}

