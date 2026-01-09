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

// Declare google types for the new Places API
declare global {
  interface Window {
    google: typeof google;
    initGooglePlaces?: () => void;
  }
}

let googleMapsPromise: Promise<void> | null = null;
let googleMapsError: string | null = null;

function loadGoogleMaps(): Promise<void> {
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places) {
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
      resolve();
    };

    const script = document.createElement("script");
    // Use loading=async for better performance as Google recommends
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=initGooglePlaces`;
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
  const [suggestions, setSuggestions] = React.useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = React.useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = React.useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = React.useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Sync input value with prop
  React.useEffect(() => {
    setInputValue(value?.displayName || "");
  }, [value?.displayName]);

  // Initialize Google Places
  React.useEffect(() => {
    let mounted = true;

    async function init() {
      // If we already know Google Maps failed, use fallback immediately
      if (googleMapsError) {
        setUseFallback(true);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      try {
        await loadGoogleMaps();

        if (!mounted) return;

        // Create services
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();

        // Create a dummy div for PlacesService (required but not displayed)
        const dummyDiv = document.createElement("div");
        placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);

        // Create session token for billing optimization
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

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
  }, []);

  // Close suggestions when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions when input changes
  const fetchSuggestions = React.useCallback((input: string) => {
    if (!autocompleteServiceRef.current || !input.trim()) {
      setSuggestions([]);
      return;
    }

    autocompleteServiceRef.current.getPlacePredictions(
      {
        input,
        types: ["(cities)"],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
          setHighlightedIndex(0);
        } else {
          setSuggestions([]);
        }
      }
    );
  }, []);

  // Debounce input changes
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    if (useFallback) {
      // In fallback mode, create a basic LocationData from the text
      if (newValue) {
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
            countryCode: "",
          });
        }
      }
      return;
    }

    // Debounce API calls
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectPlace = (prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "geometry", "name"],
        sessionToken: sessionTokenRef.current || undefined,
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          const locationData = parseAddressComponents(place);
          if (locationData) {
            setInputValue(locationData.displayName);
            onChange(locationData);
          }
        }
        // Create new session token after selection (billing optimization)
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      }
    );

    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
          handleSelectPlace(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange(null);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      if (!useFallback && inputValue && (!value || inputValue !== value.displayName)) {
        setInputValue(value?.displayName || "");
      }
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div ref={containerRef} className="relative">
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
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={useFallback ? "City, State, Country" : placeholder}
        disabled={disabled || (!isInitialized && isLoading)}
        autoComplete="off"
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

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelectPlace(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm",
                index === highlightedIndex ? "bg-gray-100" : "hover:bg-gray-50"
              )}
            >
              <div className="font-medium">{suggestion.structured_formatting.main_text}</div>
              <div className="text-gray-500 text-xs">
                {suggestion.structured_formatting.secondary_text}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
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
