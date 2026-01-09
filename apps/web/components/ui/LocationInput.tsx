"use client";

import * as React from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocationData {
  displayName: string; // "Fort Lauderdale, FL, USA" - for display and backwards compatibility
  city: string; // "Fort Lauderdale"
  state?: string; // "FL" or "Florida"
  country: string; // "United States"
  countryCode: string; // "US"
  latitude?: number;
  longitude?: number;
}

interface LocationInputProps {
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Declare google types
declare global {
  interface Window {
    google: typeof google;
    initGooglePlaces?: () => void;
  }
}

let googleMapsPromise: Promise<void> | null = null;
let googleMapsLoaded = false;
let googleMapsError: string | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
      googleMapsLoaded = true;
      resolve();
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      googleMapsError = "Google Maps API key not configured";
      reject(new Error(googleMapsError));
      return;
    }

    // Create callback
    window.initGooglePlaces = () => {
      googleMapsLoaded = true;
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      googleMapsError = "Failed to load Google Maps";
      reject(new Error(googleMapsError));
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function parseAddressComponents(
  place: google.maps.places.PlaceResult
): LocationData | null {
  if (!place.address_components) return null;

  const components: Record<string, { long_name: string; short_name: string }> = {};

  for (const component of place.address_components) {
    for (const type of component.types) {
      components[type] = {
        long_name: component.long_name,
        short_name: component.short_name,
      };
    }
  }

  // Get city - try locality first, then sublocality, then administrative_area_level_2
  const city =
    components["locality"]?.long_name ||
    components["sublocality"]?.long_name ||
    components["administrative_area_level_2"]?.long_name ||
    components["administrative_area_level_1"]?.long_name ||
    "";

  const state =
    components["administrative_area_level_1"]?.short_name ||
    components["administrative_area_level_1"]?.long_name ||
    "";

  const country = components["country"]?.long_name || "";
  const countryCode = components["country"]?.short_name || "";

  if (!city || !country) return null;

  // Build display name: "City, State, Country" or "City, Country"
  const displayParts = [city];
  if (state && state !== city) displayParts.push(state);
  displayParts.push(country);
  const displayName = displayParts.join(", ");

  return {
    displayName,
    city,
    state: state || undefined,
    country,
    countryCode,
    latitude: place.geometry?.location?.lat(),
    longitude: place.geometry?.location?.lng(),
  };
}

export function LocationInput({
  value,
  onChange,
  placeholder = "Search city...",
  className,
  disabled,
}: LocationInputProps) {
  const [inputValue, setInputValue] = React.useState(value?.displayName || "");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [useFallback, setUseFallback] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null);

  // Sync input value with prop
  React.useEffect(() => {
    setInputValue(value?.displayName || "");
  }, [value?.displayName]);

  // Initialize Google Places Autocomplete
  React.useEffect(() => {
    let mounted = true;

    async function init() {
      if (!inputRef.current || autocompleteRef.current) return;

      // If we already know Google Maps failed, use fallback immediately
      if (googleMapsError) {
        setUseFallback(true);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        await loadGoogleMaps();

        if (!mounted || !inputRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["(cities)"], // Only return cities
            fields: ["address_components", "geometry", "name"],
          }
        );

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const locationData = parseAddressComponents(place);

          if (locationData) {
            setInputValue(locationData.displayName);
            onChange(locationData);
          }
        });

        autocompleteRef.current = autocomplete;
        setIsInitialized(true);
      } catch (err) {
        if (mounted) {
          console.warn("Google Places not available, using fallback:", err);
          setUseFallback(true);
          setIsInitialized(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [onChange]);

  const handleClear = () => {
    setInputValue("");
    onChange(null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // In fallback mode, create a basic LocationData from the text
    if (useFallback && newValue) {
      // Try to parse "City, Country" or "City, State, Country" format
      const parts = newValue.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        const city = parts[0];
        const country = parts[parts.length - 1];
        const state = parts.length >= 3 ? parts[1] : undefined;

        onChange({
          displayName: newValue,
          city,
          state,
          country,
          countryCode: "", // Can't determine without API
        });
      }
    }
  };

  const handleBlur = () => {
    // If not using fallback and user typed something but didn't select from autocomplete,
    // revert to the last valid value
    if (!useFallback && inputValue && (!value || inputValue !== value.displayName)) {
      setInputValue(value?.displayName || "");
    }
  };

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <MapPin className="size-4" />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={useFallback ? "City, State, Country" : placeholder}
        disabled={disabled || (!isInitialized && isLoading)}
        className={cn(
          "block w-full rounded-md border border-gray-300 py-2 pl-10 pr-8 text-sm",
          "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
          "disabled:bg-gray-100 disabled:text-gray-500",
          className
        )}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Helper to convert a plain string location to LocationData
 * Used for backwards compatibility with existing data
 */
export function parseLocationString(location: string): LocationData | null {
  if (!location) return null;

  const parts = location.split(",").map((p) => p.trim());
  if (parts.length === 0) return null;

  const city = parts[0];
  const country = parts[parts.length - 1] || "";
  const state = parts.length >= 3 ? parts[1] : undefined;

  return {
    displayName: location,
    city,
    state,
    country,
    countryCode: "",
  };
}
