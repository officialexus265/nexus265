"use client";

import { useMemo, useState } from "react";
import { WebsiteCard } from "@/components/WebsiteCard";
import { SearchBar } from "@/components/SearchBar";
import { Website } from "@/types";

interface WebsiteGridProps {
  websites: Website[];
  showPrice?: boolean;
  emptyMessage?: string;
}

export function WebsiteGrid({
  websites,
  showPrice = false,
  emptyMessage = "No websites found.",
}: WebsiteGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return websites;
    return websites.filter((site) => {
      const haystack = [
        site.title,
        site.description,
        site.longDescription || "",
        ...(site.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [websites, query]);

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, description or tag..."
        />
        {query && (
          <p className="text-sm text-muted">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted py-16">{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.map((site, i) => (
            <WebsiteCard key={site.id} site={site} index={i} showPrice={showPrice} />
          ))}
        </div>
      )}
    </div>
  );
}
