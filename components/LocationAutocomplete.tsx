import { useState, useRef } from 'react';
import { Input } from './ui/input';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Event Location',
}: {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (place: { place_name: string; center: [number, number] }) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<
    Array<{ place_name: string; center: [number, number]; id: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (query: string) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
      );
      const data = await res.json();
      setSuggestions(
        (data.features || []) as Array<{ place_name: string; center: [number, number]; id: string }>
      );
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setShowDropdown(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (place: { place_name: string; center: [number, number] }) => {
    onChange(place.place_name);
    if (onSelect) onSelect(place);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => value && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 overflow-auto bg-white border rounded shadow max-h-48">
          {suggestions.map(s => (
            <li
              key={s.id}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100"
              onMouseDown={() => handleSelect(s)}
            >
              {s.place_name}
            </li>
          ))}
        </ul>
      )}
      {loading && <div className="absolute text-xs text-gray-400 right-2 top-3">Loading...</div>}
    </div>
  );
}
