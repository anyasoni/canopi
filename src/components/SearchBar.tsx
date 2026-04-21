"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 200;

type SearchBarProps = {
  onDebouncedQueryChange: (query: string) => void;
  debounceMs?: number;
};

export const SearchBar = ({
  onDebouncedQueryChange,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: SearchBarProps) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => {
      onDebouncedQueryChange(value);
    }, debounceMs);
    return () => window.clearTimeout(id);
  }, [value, debounceMs, onDebouncedQueryChange]);

  const handleClear = () => {
    setValue("");
    onDebouncedQueryChange("");
  };

  return (
    <div className="search-bar">
      <Search className="search-bar__icon" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search products..."
        autoComplete="off"
        className="search-bar__input"
        aria-label="Search products"
      />
      {value.length > 0 ? (
        <button
          type="button"
          onClick={handleClear}
          className="search-bar__clear"
          aria-label="Clear search"
        >
          <X className="search-bar__clear-icon" aria-hidden />
        </button>
      ) : null}
    </div>
  );
};
