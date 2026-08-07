"use client";

import { useEffect, useMemo, useState } from "react";
import { WebsiteCard } from "@/components/WebsiteCard";
import { SearchBar } from "@/components/SearchBar";
import { Website } from "@/types";

interface WebsiteGridProps {
  websites?: Website[];
  showPrice?: boolean;
  emptyMessage?: string;
  /** If true, fetch public websites from API (and merge with props as fallback) */
  fetchFromApi?: boolean;
  forSaleOnly?: boolean;
}

export function WebsiteGrid({
  websites: initial = [],
  showPrice = false,
  emptyMessage = "No websites found.",
  fetchFromApi = false,
  forSaleOnly = false,
}: WebsiteGridProps) {
  const [query, setQuery] = useState("");
  const [websites, setWebsites] = useState<Website[]>(initial);
  const [loading, setLoading] = useState(fetchFromApi);

  useEffect(() => {
    if (!fetchFromApi) {
      setWebsites(initial);
      return;
    }

    const params = new URLSearchParams({ public: "1" });
    if (forSaleOnly) params.set("forSale", "1");

    const fromLocal = () => {
      try {
        const raw = localStorage.getItem("devhub_websites");
        if (raw) {
          let list = JSON.parse(raw) as Website[];
          if (forSaleOnly) list = list.filter((w) => w.isForSale);
          return list;
        }
      } catch {}
      return null;
    };

    fetch(`/api/websites?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setWebsites(data);
        } else {
          const local = fromLocal();
          if (local && local.length > 0) setWebsites(local);
          else if (initial.length > 0) setWebsites(initial);
          else setWebsites([]);
        }
      })
      .catch(() => {
        const local = fromLocal();
        if (local && local.length > 0) setWebsites(local);
        else if (initial.length > 0) setWebsites(initial);
      })
      .finally(() => setLoading(false));
  }, [fetchFromApi, forSaleOnly, initial]);

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

  if (loading) {
    return (
      <p className="text-center text-muted py-16">Loading websites...</p>
    );
  }

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
