import { PERIOD_LABELS } from "@/lib/indicator-config";
import type { AnalyticsPeriod } from "@/lib/analytics";

export default function AnalyticsPeriodFilter({
  period,
  preserve = {},
}: {
  period: AnalyticsPeriod;
  preserve?: Record<string, string>;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-2xl bg-[color:var(--surface)] p-4"
    >
      {Object.entries(preserve).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <label className="text-xs font-semibold">
        Période
        <select
          name="period"
          defaultValue={period.preset}
          className="mt-1 block rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        >
          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold">
        Du
        <input
          name="from"
          type="date"
          defaultValue={period.from}
          className="mt-1 block rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        />
      </label>
      <label className="text-xs font-semibold">
        Au
        <input
          name="to"
          type="date"
          defaultValue={period.to}
          className="mt-1 block rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        className="rounded-full bg-[color:var(--ink)] px-5 py-2 text-sm font-semibold text-white"
      >
        Appliquer
      </button>
      <p className="basis-full text-xs text-[color:var(--muted)]">
        Les dates Du / Au sont utilisées avec « Dates personnalisées ». Les
        commandes sont filtrées par date de commande, les encaissements par date
        de réception.
      </p>
    </form>
  );
}
