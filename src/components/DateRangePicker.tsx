"use client";

import { useMemo, useState } from "react";

type DateRangePickerProps = {
  startName: string;
  endName: string;
};

const monthNames = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const toIso = (date: Date | null) =>
  date ? date.toISOString().slice(0, 10) : "";

const toLabel = (date: Date | null) => {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date: Date, value: number) =>
  new Date(date.getFullYear(), date.getMonth() + value, 1);
const maxMonth = (a: Date, b: Date) => (isBefore(a, b) ? b : a);

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isBefore = (a: Date, b: Date) => a.getTime() < b.getTime();
const isAfter = (a: Date, b: Date) => a.getTime() > b.getTime();
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export default function DateRangePicker({
  startName,
  endName,
}: DateRangePickerProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const currentMonth = useMemo(() => startOfMonth(today), [today]);
  const [open, setOpen] = useState(false);
  const [activeField, setActiveField] = useState<"start" | "end">("start");
  const [monthCursor, setMonthCursor] = useState(currentMonth);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfMonth(monthCursor);
    const firstWeekday = (start.getDay() + 6) % 7;
    const grid: Array<Date | null> = [];

    for (let i = 0; i < firstWeekday; i += 1) grid.push(null);

    const lastDay = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + 1,
      0
    ).getDate();

    for (let day = 1; day <= lastDay; day += 1) {
      grid.push(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day));
    }

    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [monthCursor]);

  const onPickDate = (date: Date) => {
    if (isBefore(date, today)) return;

    if (activeField === "start") {
      setStartDate(date);
      setHoveredDate(null);

      if (endDate && isBefore(endDate, date)) {
        setEndDate(date);
      } else {
        setEndDate(null);
      }

      setActiveField("end");
      return;
    }

    setHoveredDate(null);

    if (startDate && isAfter(startDate, date)) {
      setEndDate(startDate);
      setStartDate(date);
    } else {
      setEndDate(date);
    }

    setOpen(false);
  };

  const inRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const inPreviewRange = (date: Date) => {
    if (activeField !== "end" || !startDate || !hoveredDate) return false;

    const rangeStart = isBefore(hoveredDate, startDate) ? hoveredDate : startDate;
    const rangeEnd = isAfter(hoveredDate, startDate) ? hoveredDate : startDate;

    return date >= rangeStart && date <= rangeEnd;
  };

  return (
    <div className="relative">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-[color:var(--muted)]">
            Date de debut
          </label>
          <button
            type="button"
              onClick={() => {
                setActiveField("start");
                setHoveredDate(null);
                setMonthCursor((prev) => maxMonth(prev, currentMonth));
                setOpen(true);
              }}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-left text-sm"
          >
            {toLabel(startDate) || "Selectionner une date"}
          </button>
        </div>
        <div className="grid gap-2">
          <label className="text-xs font-semibold text-[color:var(--muted)]">
            Date de fin
          </label>
          <button
            type="button"
              onClick={() => {
                setActiveField("end");
                setHoveredDate(null);
                setMonthCursor((prev) => maxMonth(prev, currentMonth));
                setOpen(true);
              }}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-left text-sm"
          >
            {toLabel(endDate) || "Selectionner une date"}
          </button>
        </div>
      </div>

      <input type="hidden" name={startName} value={toIso(startDate)} required />
      <input type="hidden" name={endName} value={toIso(endDate)} required />

      {open && (
        <div className="absolute z-20 mt-3 w-full max-w-md rounded-3xl border border-black/10 bg-white p-4 shadow-[0_18px_40px_rgba(22,18,14,0.12)]">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]"
              onClick={() =>
                setMonthCursor((prev) =>
                  maxMonth(addMonths(prev, -1), currentMonth)
                )
              }
            >
              {"<"}
            </button>
            <div className="text-sm font-semibold">
              {monthNames[monthCursor.getMonth()]} {monthCursor.getFullYear()}
            </div>
            <button
              type="button"
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]"
              onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
            >
              {">"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-[color:var(--muted)]">
            {weekDays.map((day) => (
              <div key={day} className="text-center font-semibold">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-2 text-sm">
            {days.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;

              const isDisabled = isBefore(date, today);
              const isSelectedStart = startDate && sameDay(startDate, date);
              const isSelectedEnd = endDate && sameDay(endDate, date);
              const isPreview = inPreviewRange(date);
              const isConfirmedRange = inRange(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => onPickDate(date)}
                  onMouseEnter={() => {
                    if (!isDisabled) setHoveredDate(date);
                  }}
                  onMouseLeave={() => setHoveredDate(null)}
                  disabled={isDisabled}
                  className={`h-10 rounded-xl border border-transparent text-center transition ${
                    isDisabled
                      ? "cursor-not-allowed text-black/25"
                      : isSelectedStart || isSelectedEnd
                      ? "bg-[color:var(--accent)] text-white"
                      : isPreview
                      ? "bg-[color:var(--accent)]/18 text-[color:var(--ink)]"
                      : isConfirmedRange
                      ? "bg-[color:var(--surface)]"
                      : "hover:bg-[color:var(--surface)]"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setHoveredDate(null);
                setOpen(false);
              }}
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
