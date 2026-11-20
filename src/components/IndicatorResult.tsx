import { STATUS_LABELS } from "@/lib/analytics";
import {
  indicatorValue,
  type IndicatorResult as Result,
} from "@/lib/indicator-engine";

export default function IndicatorResult({
  result,
  groupBy = "none",
}: {
  result: Result;
  groupBy?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-4xl font-semibold tracking-tight">
        {indicatorValue(result.value, result.unit)}
      </p>
      <p className="text-xs text-[color:var(--muted)]">
        {result.recordCount} enregistrement(s) retenu(s) ·{" "}
        {result.measuredCount} valeur(s) renseignée(s)
      </p>
      {(result.estimatedCount > 0 || result.estimatedDateCount > 0) && (
        <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {result.estimatedCount > 0 &&
            `${result.estimatedCount} montant(s) estimé(s) d’après le devis ou les articles. `}
          {result.estimatedDateCount > 0 &&
            `${result.estimatedDateCount} paiement(s) sans date de règlement : date d’émission utilisée.`}
        </p>
      )}
      {result.groups.length > 0 && (
        <div
          className="max-h-80 overflow-auto rounded-2xl border border-black/10"
          tabIndex={0}
          aria-label="Détail de l’indicateur par groupe"
        >
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-[color:var(--surface)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Groupe</th>
                <th className="px-4 py-3 text-right font-semibold">Résultat</th>
                <th className="px-4 py-3 text-right font-semibold">Lignes</th>
              </tr>
            </thead>
            <tbody>
              {result.groups.map((group) => (
                <tr key={group.key} className="border-t border-black/5">
                  <td className="px-4 py-3">
                    {groupBy === "status"
                      ? (STATUS_LABELS[group.label] ?? group.label)
                      : group.label}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                    {indicatorValue(group.value, result.unit)}
                  </td>
                  <td className="px-4 py-3 text-right text-[color:var(--muted)]">
                    {group.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[color:var(--muted)]">
        Calculé le{" "}
        {new Date(result.calculatedAt).toLocaleString("fr-FR", {
          timeZone: "Europe/Paris",
        })}
        .
      </p>
    </div>
  );
}
