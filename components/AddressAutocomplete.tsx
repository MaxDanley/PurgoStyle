"use client";

import { useState, useEffect, useRef } from "react";

interface AddressSuggestion {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    country?: string;
    unit?: string;
    apartment?: string;
    building?: string;
    level?: string;
    floor?: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }) => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

// US State name to abbreviation mapping
const US_STATE_ABBREVIATIONS: { [key: string]: string } = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  'district of columbia': 'DC',
  'washington dc': 'DC',
};

export default function AddressAutocomplete({
  value,
  onChange,
  onInputChange,
  placeholder = "Start typing your address...",
  className = "",
  required = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced search function
  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Use Nominatim API (OpenStreetMap) - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=us`,
        {
          headers: {
            "User-Agent": "SummerSteeze/1.0", // Required by Nominatim
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error("Error fetching address suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    if (onInputChange) {
      onInputChange(newValue);
    }

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the search
    debounceTimerRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const getStateAbbreviation = (stateName: string): string => {
    if (!stateName) return "";
    
    // If already a 2-letter abbreviation, return it uppercase
    if (stateName.length === 2) {
      return stateName.toUpperCase();
    }
    
    // Look up full state name
    const stateLower = stateName.toLowerCase().trim();
    return US_STATE_ABBREVIATIONS[stateLower] || stateName.substring(0, 2).toUpperCase();
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;
    
    // Build street address (house number + road only)
    const streetParts = [];
    if (addr.house_number) streetParts.push(addr.house_number);
    if (addr.road) streetParts.push(addr.road);
    const street = streetParts.join(" ") || "";

    // Get apartment/unit number from various possible fields
    const apartment = addr.unit || addr.apartment || addr.building || 
                      (addr.level ? `Level ${addr.level}` : undefined) ||
                      (addr.floor ? `Floor ${addr.floor}` : undefined) || 
                      undefined;

    // Get city (can be city, town, or village)
    const city = addr.city || addr.town || addr.village || "";

    // Get state and convert to proper abbreviation
    const stateName = addr.state || "";
    const state = getStateAbbreviation(stateName);

    // Get zip code
    const zipCode = addr.postcode || "";

    // Get country - normalize to US for United States addresses
    // Nominatim API may return "United States", "united states", "US", etc.
    let country = addr.country || "US";
    if (country && typeof country === 'string') {
      const countryLower = country.toLowerCase();
      if (countryLower === 'united states' || countryLower === 'us' || countryLower === 'usa' || countryLower === 'united states of america') {
        country = "US";
      }
    }

    // Update the form
    onChange({
      street,
      apartment,
      city,
      state,
      zipCode,
      country,
    });

    // Update the input value to show only the street address (not full address)
    setSearchQuery(street);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          required={required}
          className="input-field pr-10"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">
                {suggestion.display_name}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

