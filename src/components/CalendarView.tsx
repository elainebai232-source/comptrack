"use client";

import { useMemo, useState } from "react";
import { competitions } from "@/lib/competitions";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  isSameDay,
  MONTH_NAMES,
  parseDate,
  WEEKDAY_LABELS,
} from "@/lib/date";
import type { Competition } from "@/lib/types";
import { FieldBadge } from "./FieldBadge";

export function CalendarView() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const byDate = useMemo(() => {
    const map = new Map<string, Competition[]>();
    for (const c of competitions) {
      const key = c.deadline;
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return map;
  }, []);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(today);
  };

  const deadlinesThisMonth = competitions.filter((c) => {
    const d = parseDate(c.deadline);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const selectedCompetitions = selectedDay
    ? competitions.filter((c) => isSameDay(parseDate(c.deadline), selectedDay))
    : [];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="rounded-xl border border-border-subtle bg-surface-raised p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text">
            {MONTH_NAMES[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goToday}
              className="rounded-lg px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              Today
            </button>
            <button
              type="button"
              onClick={prevMonth}
              aria-label="Previous month"
              className="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="rounded-lg border border-border p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Chevron dir="right" />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="py-2 text-center text-xs font-medium uppercase tracking-wider text-text-muted"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const date = new Date(year, month, day);
            const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const dayCompetitions = byDate.get(key) ?? [];
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay && isSameDay(date, selectedDay);

            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDay(date)}
                className={`relative flex aspect-square flex-col items-center justify-start rounded-lg p-1 text-sm transition-all ${
                  isSelected
                    ? "bg-accent ring-2 ring-accent-hover text-white"
                    : isToday
                      ? "bg-surface-hover ring-1 ring-accent/50 text-text"
                      : dayCompetitions.length > 0
                        ? "bg-surface-hover/60 text-text hover:bg-surface-hover"
                        : "text-text-muted hover:bg-surface-hover hover:text-text"
                }`}
              >
                <span className={`mt-1 font-medium ${isSelected ? "text-white" : ""}`}>
                  {day}
                </span>
                {dayCompetitions.length > 0 && (
                  <div className="mt-auto flex w-full flex-wrap justify-center gap-0.5 pb-1">
                    {dayCompetitions.slice(0, 3).map((c) => (
                      <span
                        key={c.id}
                        className={`h-1.5 w-1.5 rounded-full ${
                          isSelected ? "bg-white/80" : dotColor(c.field)
                        }`}
                        title={c.name}
                      />
                    ))}
                    {dayCompetitions.length > 3 && (
                      <span
                        className={`text-[10px] leading-none ${isSelected ? "text-white/80" : "text-text-muted"}`}
                      >
                        +{dayCompetitions.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="flex flex-col gap-4">
        <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
          <h3 className="mb-3 text-sm font-semibold text-text">
            {selectedDay
              ? selectedDay.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : "Select a day"}
          </h3>
          {selectedCompetitions.length === 0 ? (
            <p className="text-sm text-text-muted">
              {selectedDay ? "No deadlines on this day." : "Click a day to see deadlines."}
            </p>
          ) : (
            <ul className="space-y-3">
              {selectedCompetitions.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border-subtle bg-surface p-3"
                >
                  <p className="text-sm font-medium text-text">{c.name}</p>
                  <div className="mt-1.5">
                    <FieldBadge field={c.field} />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">{c.prize}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface-raised p-4">
          <h3 className="mb-3 text-sm font-semibold text-text">
            This month ({deadlinesThisMonth.length})
          </h3>
          {deadlinesThisMonth.length === 0 ? (
            <p className="text-sm text-text-muted">No deadlines this month.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {[...deadlinesThisMonth]
                .sort((a, b) => a.deadline.localeCompare(b.deadline))
                .map((c) => (
                  <li key={c.id} className="text-sm">
                    <span className="text-text-muted">
                      {parseDate(c.deadline).getDate()}{" "}
                      {MONTH_NAMES[month].slice(0, 3)}
                    </span>
                    <span className="mx-1.5 text-border">·</span>
                    <span className="text-text">{c.name}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}

function dotColor(field: Competition["field"]): string {
  const map: Record<Competition["field"], string> = {
    Quant: "bg-indigo-400",
    ML: "bg-emerald-400",
    Math: "bg-amber-400",
    Finance: "bg-sky-400",
    CS: "bg-rose-400",
  };
  return map[field];
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d={
          dir === "left"
            ? "M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z"
            : "M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z"
        }
        clipRule="evenodd"
      />
    </svg>
  );
}
