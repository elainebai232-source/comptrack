import { CalendarView } from "@/components/CalendarView";

export default function CalendarPage() {
  return (
    <div>
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
          Deadline calendar
        </h1>
        <p className="mt-2 max-w-xl text-text-muted">
          See competition deadlines on a monthly view. Dots mark days with
          upcoming deadlines — click a day for details.
        </p>
      </header>
      <CalendarView />
    </div>
  );
}
