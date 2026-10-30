import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "../../hooks/useDebounce";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  initialValue?: string;
  delay?: number;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  onSearch,
  initialValue = "",
  delay = 300,
  className = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const debouncedValue = useDebounce(value, delay);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setValue("");
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="w-4 h-4 text-[#77716e] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-white border border-[#eadbd2] focus:outline-none focus:ring-2 focus:ring-[#f47b5b]/30 focus:border-[#f47b5b] text-[#252525] placeholder-[#77716e]/70 transition-all"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77716e] hover:text-[#252525] p-0.5 rounded-full hover:bg-[#fff0e8] transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
