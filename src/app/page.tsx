import { Suspense } from "react";
import { CompetitionGrid } from "@/components/CompetitionGrid";
import { CompetitionGridWithUrl } from "@/components/CompetitionGridWithUrl";
import { todayInNewYork } from "@/lib/derived";

// Re-render at most once an hour so "today" (and therefore each card's
// effective status) stays current without making every request dynamic.
export const revalidate = 3600;

export default function HomePage() {
  // Computed once on the server and passed down, so the server HTML and the
  // client render use the same date (no hydration mismatch near midnight).
  const today = todayInNewYork();

  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Find your next competition
        </h1>
        <p className="mt-2 max-w-xl text-text-muted">
          Browse quant, ML, math, and more — filter by field, save favorites, and
          never miss a deadline.
        </p>
      </header>
      {/* useSearchParams needs a Suspense boundary so the page can stay static.
          The fallback (in the pre-rendered HTML) is the default, unfiltered view. */}
      <Suspense fallback={<CompetitionGrid today={today} />}>
        <CompetitionGridWithUrl today={today} />
      </Suspense>
    </div>
  );
}
