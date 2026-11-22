import { deleteClient } from "@/app/actions/clients";
import ClientForm from "@/components/ClientForm";
import AnalyticsPeriodFilter from "@/components/AnalyticsPeriodFilter";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  buildOrders,
  clientStatistics,
  euro,
  shortDate,
} from "@/lib/analytics";
import { loadAnalyticsSnapshot } from "@/lib/analytics-data";
import { readAnalyticsPeriod } from "@/lib/analytics-period";

export const dynamic = "force-dynamic";
export const revalidate = 0;
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    saved?: string;
    blocked?: string;
    q?: string;
    sort?: string;
    page?: string;
    period?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const { period, error } = readAnalyticsPeriod(params);
  const [clients, snapshot] = await Promise.all([
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    }),
    loadAnalyticsSnapshot(),
  ]);
  const orders = buildOrders(snapshot);
  const q = typeof params?.q === "string" ? params.q.slice(0, 200).trim() : "";
  const sort = [
    "total",
    "orders",
    "average",
    "last",
    "name",
    "recent",
  ].includes(params?.sort ?? "")
    ? params!.sort!
    : "total";
  const entries = clients
    .filter((c) =>
      normalize(`${c.name} ${c.email ?? ""} ${c.phone ?? ""}`).includes(
        normalize(q),
      ),
    )
    .map((client) => ({
      client,
      stats: clientStatistics(client.id, orders, snapshot.invoices, period),
    }));
  entries.sort((a, b) => {
    if (sort === "name")
      return a.client.name.localeCompare(b.client.name, "fr");
    if (sort === "recent") return +b.client.createdAt - +a.client.createdAt;
    const difference =
      sort === "orders"
        ? b.stats.orderCount - a.stats.orderCount
        : sort === "average"
          ? (b.stats.averageCents ?? -Infinity) -
            (a.stats.averageCents ?? -Infinity)
          : sort === "last"
            ? +(b.stats.lastOrderAt ?? 0) - +(a.stats.lastOrderAt ?? 0)
            : b.stats.totalCents - a.stats.totalCents;
    return difference || a.client.name.localeCompare(b.client.name, "fr");
  });
  const summary = entries.reduce(
    (s, entry) => ({
      count: s.count + entry.stats.orderCount,
      total: s.total + entry.stats.totalCents,
      priced: s.priced + entry.stats.pricedCount,
      collected: s.collected + entry.stats.collectedCents,
      estimated: s.estimated + entry.stats.estimatedCount,
      unpriced: s.unpriced + entry.stats.unpricedCount,
    }),
    { count: 0, total: 0, priced: 0, collected: 0, estimated: 0, unpriced: 0 },
  );
  const pageCount = Math.max(1, Math.ceil(entries.length / 25));
  const parsedPage = Number(params?.page ?? 1);
  const page = Number.isSafeInteger(parsedPage)
    ? Math.max(1, Math.min(pageCount, parsedPage))
    : 1;
  const visible = entries.slice((page - 1) * 25, page * 25);
  const pageUrl = (number: number) => {
    const query = new URLSearchParams({
      period: period.preset,
      from: period.from,
      to: period.to,
      q,
      sort,
      page: String(number),
    });
    return `/admin/clients?${query}`;
  };
  const cards = [
    { label: "Clients sélectionnés", value: String(entries.length) },
    { label: "Commandes", value: String(summary.count) },
    {
      label: "Montant commandé",
      value: euro(
        summary.count > 0 && summary.priced === 0 ? null : summary.total,
      ),
    },
    {
      label: "Panier moyen",
      value: euro(summary.priced ? summary.total / summary.priced : null),
    },
    { label: "Encaissé", value: euro(summary.collected) },
  ];
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Clients & commandes</h1>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Repérez vos clients réguliers et suivez leurs commandes et
              encaissements.
            </p>
          </div>
          <Link
            className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold"
            href="/admin/indicateurs"
          >
            Mes indicateurs <span className="link-decoration" aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>
      <AnalyticsPeriodFilter period={period} preserve={{ q, sort }} />
      {error && (
        <p
          role="alert"
          className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-black/5 bg-white/80 p-5"
          >
            <p className="text-xs text-[color:var(--muted)]">{card.label}</p>
            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[color:var(--muted)]">
        Indicateurs sur les {entries.length} client(s) correspondant aux
        filtres, sur l’ensemble des pages. Commandes confirmées, en cours ou
        terminées, avec les anciens devis acceptés sans réservation associée.{" "}
        {summary.estimated > 0 && `${summary.estimated} montant(s) estimé(s). `}
        {summary.unpriced > 0 &&
          `${summary.unpriced} commande(s) sans prix, exclue(s) du panier moyen.`}
      </p>
      <details
        className="rounded-3xl border border-black/5 bg-white/80 p-6"
        open={params?.saved === "0"}
      >
        <summary className="cursor-pointer text-lg font-semibold">
          + Ajouter un client
        </summary>
        <ClientForm />
      </details>
      {params?.saved === "1" && (
        <p
          role="status"
          className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          Client ajouté.
        </p>
      )}
      <div className="rounded-3xl border border-black/5 bg-white/80 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Suivi par client</h2>
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="period" value={period.preset} />
            <input type="hidden" name="from" value={period.from} />
            <input type="hidden" name="to" value={period.to} />
            <label className="text-xs font-semibold">
              Rechercher
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Nom, email ou téléphone"
                maxLength={200}
                className="mt-1 block rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold">
              Trier par
              <select
                name="sort"
                defaultValue={sort}
                className="mt-1 block rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
              >
                <option value="total">Montant commandé</option>
                <option value="orders">Nombre de commandes</option>
                <option value="average">Panier moyen</option>
                <option value="last">Dernière commande</option>
                <option value="name">Nom</option>
                <option value="recent">Création récente</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full border border-black/15 px-4 py-2 text-sm font-semibold"
            >
              Filtrer
            </button>
          </form>
        </div>
        {params?.blocked === "1" && (
          <p
            role="alert"
            className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"
          >
            Impossible de supprimer un client avec des réservations ou factures.
          </p>
        )}
        {entries.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-black/10 p-6 text-sm text-[color:var(--muted)]">
            Aucun client ne correspond à cette recherche.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs text-[color:var(--muted)]">
                  <th className="py-3 pr-4">Client</th>
                  <th className="px-3 py-3 text-right">Commandes</th>
                  <th className="px-3 py-3 text-right">Montant commandé</th>
                  <th className="px-3 py-3 text-right">Panier moyen</th>
                  <th className="px-3 py-3 text-right">Encaissé</th>
                  <th className="px-3 py-3">Dernière commande</th>
                  <th className="py-3 pl-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ client, stats }) => (
                  <tr key={client.id} className="border-b border-black/5">
                    <td className="min-w-48 py-4 pr-4">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="font-semibold hover:underline"
                      >
                        {client.name}
                      </Link>
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {client.email || "Email non renseigné"}
                        {client.phone ? ` · ${client.phone}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-right font-semibold">
                      {stats.orderCount}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right font-semibold">
                      {euro(
                        stats.orderCount > 0 && stats.pricedCount === 0
                          ? null
                          : stats.totalCents,
                      )}
                      {stats.estimatedCount > 0 && (
                        <span className="block text-xs font-normal text-[color:var(--muted)]">
                          {stats.estimatedCount} estimé(s)
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      {euro(stats.averageCents)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-right">
                      {euro(stats.collectedCents)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4">
                      {shortDate(stats.lastOrderAt)}
                    </td>
                    <td className="py-4 pl-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="whitespace-nowrap rounded-full border border-black/10 px-3 py-2 text-xs font-semibold"
                        >
                          Voir / modifier
                        </Link>
                        <form action={deleteClient}>
                          <input type="hidden" name="id" value={client.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-black/10 px-3 py-2 text-xs text-[color:var(--muted)]"
                          >
                            Supprimer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pageCount > 1 && (
          <nav
            aria-label="Pagination des clients"
            className="mt-5 flex items-center justify-between gap-4 text-sm"
          >
            {page > 1 ? (
              <Link
                href={pageUrl(page - 1)}
                className="rounded-full border border-black/10 px-4 py-2"
              >
                <span className="link-decoration" aria-hidden="true">←</span> Précédents
              </Link>
            ) : (
              <span />
            )}
            <span>
              Page {page} / {pageCount} · {entries.length} clients
            </span>
            {page < pageCount ? (
              <Link
                href={pageUrl(page + 1)}
                className="rounded-full border border-black/10 px-4 py-2"
              >
                Suivants <span className="link-decoration" aria-hidden="true">→</span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
