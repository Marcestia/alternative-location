"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type EventDatePickerProps = {
  name: string;
  label: string;
};

const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, value: number) =>
  new Date(date.getFullYear(), date.getMonth() + value, 1);

const sameDay = (a: Date | null, b: Date) =>
  !!a &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toIso = (date: Date | null) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function EventDatePicker({
  name,
  label,
}: EventDatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);
  const currentMonth = useMemo(() => startOfMonth(today), [today]);
  const [open, setOpen] = useState(false);
  const [monthCursor, setMonthCursor] = useState(currentMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const days = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const firstWeekday = (start.getDay() + 6) % 7;
    const grid: Array<Date | null> = [];

    for (let i = 0; i < firstWeekday; i += 1) {
      grid.push(null);
    }

    const lastDay = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + 1,
      0
    ).getDate();

    for (let day = 1; day <= lastDay; day += 1) {
      grid.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
    }

    while (grid.length % 7 !== 0) {
      grid.push(null);
    }

    return grid;
  }, [monthCursor]);

  const canGoBack = monthCursor.getTime() > currentMonth.getTime();

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-[color:var(--ink)]">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group flex w-full items-center justify-between rounded-[26px] border border-black/10 bg-white px-4 py-4 text-left shadow-[0_14px_40px_rgba(25,20,16,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_18px_44px_rgba(25,20,16,0.08)]"
      >
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--accent-2)]/80">
            Date
          </p>
          <p className="mt-1 text-base font-medium text-[color:var(--ink)]">
            {selectedDate
              ? longDateFormatter.format(selectedDate)
              : "Choisir le jour de la fête"}
          </p>
          <p className="mt-1 text-xs text-[color:var(--muted)]">
            Sélectionnez la date de votre événement.
          </p>
        </div>
        <span className="ml-4 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--surface)] text-[color:var(--accent)] transition group-hover:bg-[color:var(--accent)] group-hover:text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
            <path
              d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <input type="hidden" name={name} value={toIso(selectedDate)} required />

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-3 rounded-[30px] border border-black/10 bg-white/98 p-4 shadow-[0_28px_60px_rgba(18,14,10,0.14)] backdrop-blur sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (canGoBack) {
                  setMonthCursor((value) => addMonths(value, -1));
                }
              }}
              disabled={!canGoBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-[color:var(--muted)] transition hover:border-black/20 hover:bg-[color:var(--surface)] disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Mois précédent"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M15 6 9 12l6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="text-center">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--accent-2)]/70">
                Calendrier
              </p>
              <p className="mt-1 text-lg font-semibold capitalize text-[color:var(--ink)]">
                {monthFormatter.format(monthCursor)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMonthCursor((value) => addMonths(value, 1))}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 text-[color:var(--muted)] transition hover:border-black/20 hover:bg-[color:var(--surface)]"
              aria-label="Mois suivant"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="m9 6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="h-11" />;
              }

              const isPast = date.getTime() < today.getTime();
              const isToday = sameDay(today, date);
              const isSelected = sameDay(selectedDate, date);

              return (
                <button
                  key={toIso(date)}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    setSelectedDate(date);
                    setOpen(false);
                  }}
                  className={`h-11 rounded-2xl text-sm font-medium transition duration-200 ${
                    isPast
                      ? "cursor-not-allowed text-black/20"
                      : isSelected
                      ? "bg-[color:var(--accent)] text-white shadow-[0_12px_24px_rgba(201,123,78,0.28)]"
                      : isToday
                      ? "border border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10 text-[color:var(--ink)] hover:bg-[color:var(--accent)]/16"
                      : "text-[color:var(--ink)] hover:bg-[color:var(--surface)]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
            <span>Les dates passées ne sont pas disponibles.</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-black/10 px-4 py-2 font-semibold text-[color:var(--ink)] transition hover:border-black/20 hover:bg-[color:var(--surface)]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
