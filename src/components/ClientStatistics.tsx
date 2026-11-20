import Link from "next/link";
import {
  buildOrders,
  clientStatistics,
  euro,
  ORDER_STATUSES,
  shortDate,
  STATUS_LABELS,
  inPeriod,
  type AnalyticsPeriod,
  type AnalyticsSnapshot,
} from "@/lib/analytics";
import AnalyticsPeriodFilter from "@/components/AnalyticsPeriodFilter";

export default function ClientStatistics({
  snapshot,
  clientId,
  period,
  error,
}: {
  snapshot: AnalyticsSnapshot;
  clientId: string;
  period: AnalyticsPeriod;
  error?: string;
}) {
  const orders = buildOrders(snapshot),
    stats = clientStatistics(clientId, orders, snapshot.invoices, period);
  const recent = orders
    .filter(
      (o) =>
        o.clientId === clientId &&
        ORDER_STATUSES.includes(o.status) &&
        inPeriod(o.orderedAt, period),
    )
    .sort((a, b) => +b.orderedAt - +a.orderedAt)
    .slice(0, 8);
  const cards = [
    { label: "Commandes", value: String(stats.orderCount) },
    {
      label: "Montant commandé",
      value: euro(
        stats.orderCount > 0 && stats.pricedCount === 0
          ? null
          : stats.totalCents,
      ),
    },
    { label: "Panier moyen", value: euro(stats.averageCents) },
    { label: "Encaissé", value: euro(stats.collectedCents) },
  ];
  return (
    <div className="space-y-5 rounded-3xl border border-black/5 bg-white/80 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Suivi des commandes</h2>
          <p className="mt-1 text-sm text-[color:var(--muted)]">
            Dernière commande sur la période : {shortDate(stats.lastOrderAt)}
          </p>
        </div>
        <Link
          href={`/admin/indicateurs?clientId=${encodeURIComponent(clientId)}`}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold"
        >
          Créer un indicateur pour ce client ↗
        </Link>
      </div>
      <AnalyticsPeriodFilter period={period} />
      {error && (
        <p role="alert" className="text-sm text-amber-900">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-black/5 bg-[color:var(--surface)] p-5"
          >
            <p className="text-xs text-[color:var(--muted)]">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[color:var(--muted)]">
        Panier moyen calculé sur {stats.pricedCount} commande(s) chiffrée(s).{" "}
        {stats.estimatedCount > 0 &&
          `${stats.estimatedCount} montant(s) estimé(s). `}
        {stats.unpricedCount > 0 &&
          `${stats.unpricedCount} commande(s) sans montant renseigné : total partiel. `}
        {stats.estimatedPaymentDates > 0 &&
          `${stats.estimatedPaymentDates} encaissement(s) sans date de paiement : date d’émission utilisée.`}
      </p>
      {recent.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/10 p-5 text-sm text-[color:var(--muted)]">
          Aucune commande confirmée sur cette période.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs text-[color:var(--muted)]">
                <th className="py-3 pr-4">Commande</th>
                <th className="px-3 py-3">Commandée le</th>
                <th className="px-3 py-3">Événement</th>
                <th className="px-3 py-3">Statut</th>
                <th className="py-3 pl-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((order) => (
                <tr key={order.id} className="border-b border-black/5">
                  <td className="py-3 pr-4 font-semibold">
                    {order.reference}
                    {order.origin === "quote" && (
                      <span className="mt-1 block text-xs font-normal text-[color:var(--muted)]">
                        Devis accepté sans réservation associée
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {shortDate(order.orderedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {shortDate(order.eventDate)}
                  </td>
                  <td className="px-3 py-3">{STATUS_LABELS[order.status]}</td>
                  <td className="whitespace-nowrap py-3 pl-3 text-right font-semibold">
                    {euro(order.amountCents)}
                    {order.estimated && (
                      <span className="block text-xs font-normal text-[color:var(--muted)]">
                        Estimé
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <details className="rounded-2xl border border-black/5 p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Comment sont calculés ces chiffres ?
        </summary>
        <div className="mt-3 space-y-2 text-xs leading-6 text-[color:var(--muted)]">
          <p>
            Une réservation confirmée, en cours ou terminée compte pour une
            commande. Un devis accepté sans réservation associée reste inclus
            dans l’historique. Les liens des factures et les périodes identiques
            sans ambiguïté permettent d’éviter les doublons.
          </p>
          <p>
            Le montant provient des factures non annulées associées. À défaut,
            le dernier devis accepté ou les articles de la réservation donnent
            une estimation. Les commandes sans montant ne sont pas utilisées
            dans le panier moyen.
          </p>
          <p>
            Les encaissements comprennent les acomptes enregistrés et les soldes
            des factures marquées payées. Un acompte n’est pas compté une
            seconde fois lors du paiement du solde. Les factures annulées sont
            exclues.
          </p>
          <p>
            La date de commande est la date de signature du devis quand elle
            existe, sinon sa date de création ou celle de la réservation.
          </p>
          <p>
            Un devis accepté confirme commercialement une réservation encore en
            attente. Une réservation annulée reste exclue. Les listes de devis,
            factures et réservations ci-dessous affichent l’historique complet,
            toutes périodes confondues.
          </p>
        </div>
      </details>
    </div>
  );
}
