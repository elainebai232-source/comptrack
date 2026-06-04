import { CompetitionGrid } from "@/components/CompetitionGrid";

export default function HomePage() {
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
      <CompetitionGrid />
    </div>
  );
}
