"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { parseFilterParams, serializeFilterParams, type UrlFilters } from "@/lib/filters";
import { CompetitionGrid } from "./CompetitionGrid";

/**
 * Reads the filters from the URL and writes changes back to it, so a filtered
 * view can be shared as a link. The URL is the single source of truth.
 *
 * Must be rendered inside <Suspense> (see app/page.tsx): useSearchParams on a
 * statically rendered page is only known in the browser.
 */
export function CompetitionGridWithUrl({ today }: { today: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const filters = useMemo(() => parseFilterParams(searchParams), [searchParams]);

  const setFilters = useCallback(
    (update: (prev: UrlFilters) => UrlFilters) => {
      // Start from the URL as it is right now (not the last render), so two
      // quick changes in a row can't overwrite each other.
      const prev = parseFilterParams(new URLSearchParams(window.location.search));
      const qs = serializeFilterParams(update(prev));
      // replaceState (not router.push/replace): no new history entry per click,
      // no scroll, and no server round trip. Next.js still updates
      // useSearchParams when it is called.
      window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname]
  );

  return <CompetitionGrid today={today} filters={filters} onFiltersChange={setFilters} />;
}
