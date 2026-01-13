"use client";

import { FileText } from "lucide-react";

interface RequirementsTextStepProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
  error?: string;
}

const EXAMPLE_PROMPTS = [
  "Chief Stewardess for 60m MY, Mediterranean season",
  "Butler for private estate in London, live-in",
  "Captain with 3000GT, available immediately",
  "Nanny for UHNW family, French speaking, travel required",
];

export function RequirementsTextStep({
  value,
  onChange,
  onContinue,
  error,
}: RequirementsTextStepProps) {
  const handleExampleClick = (example: string) => {
    onChange(example);
  };

  const canContinue = value.trim().length >= 10;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-navy-900 mb-2">
          Tell us about your requirements
        </h2>
        <p className="text-gray-600">
          Describe the role or paste your job specification
        </p>
      </div>

      {/* Main Textarea */}
      <div>
        <div className="relative">
          <FileText className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Describe the role you need to fill...

e.g., Chief Stewardess for a 60m motor yacht, Mediterranean season, experience with large guest parties, cocktail service expertise, available within 1 month"
            rows={8}
            className={`w-full rounded-xl border pl-12 pr-4 py-4 text-gray-900 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none text-base placeholder:text-gray-400 ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                : "border-gray-200 focus:border-gold-500 focus:ring-gold-500/20"
            }`}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Include role, location, timeline, skills, or any specific requirements
        </p>
      </div>

      {/* Example Prompts */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">
          Or try an example:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((example) => (
            <button
              key={example}
              onClick={() => handleExampleClick(example)}
              className="rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gold-300 hover:bg-gold-50 hover:text-gold-700 transition-all shadow-sm"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        disabled={!canContinue}
        className="w-full py-3 px-6 rounded-lg gradient-gold text-white font-medium shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue
      </button>

      {!canContinue && value.length > 0 && (
        <p className="text-center text-sm text-gray-500">
          Please provide a bit more detail (at least 10 characters)
        </p>
      )}
    </div>
  );
}
