import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { loadAnalyticsSnapshot } from "@/lib/analytics-data";
import { STATUS_LABELS } from "@/lib/analytics";
import {
  AGGREGATION_LABELS,
  GROUP_LABELS,
  INDICATOR_SOURCES,
  PERIOD_LABELS,
  defaultIndicator,
  parseIndicatorDefinition,
  type IndicatorDefinition,
} from "@/lib/indicator-config";
import { calculateIndicator } from "@/lib/indicator-engine";
import { deleteIndicator } from "@/app/actions/indicators";
import IndicatorBuilder from "@/components/IndicatorBuilder";
import IndicatorResult from "@/components/IndicatorResult";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function IndicatorsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    edit?: string;
    clientId?: string;
    saved?: string;
    deleted?: string;
  }>;
}) {
  await requireAdmin();
  const params = searchParams ? await searchParams : undefined;
  const [snapshot, saved] = await Promise.all([
    loadAnalyticsSnapshot(undefined, true),
    prisma.savedIndicator.findMany({
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    }),
  ]);
  const editing = params?.edit
    ? saved.find((indicator) => indicator.id === params.edit)
    : undefined;
  if (params?.edit && !editing) notFound();
  let initialDefinition = defaultIndicator(
    "orders",
    snapshot.clients.some((c) => c.id === params?.clientId)
      ? params!.clientId
      : "",
  );
  let invalid = false;
  if (editing) {
    try {
      initialDefinition = parseIndicatorDefinition(editing.definition);
    } catch {
      invalid = true;
    }
  }
  const clients = [...snapshot.clients].sort((a, b) =>
    a.name.localeCompare(b.name, "fr"),
  );
  const categories = [
    ...new Set([
      ...snapshot.items.map((i) => i.category?.name ?? "Sans catégorie"),
      ...snapshot.reservations.flatMap((r) =>
        r.items.map((line) => line.item.category?.name ?? "Sans catégorie"),
      ),
    ]),
  ].sort((a, b) => a.localeCompare(b, "fr"));
  const eventTypes = [
    ...new Set([
      ...snapshot.requests.map((r) => r.eventType?.trim() || "Non renseigné"),
      ...snapshot.quotes.map(
        (q) => q.contactRequest?.eventType?.trim() || "Non renseigné",
      ),
    ]),
  ].sort((a, b) => a.localeCompare(b, "fr"));
  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Pilotage
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Vos indicateurs</h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          Commandes, factures, encaissements, devis, demandes, clients ou
          articles : composez vos propres mesures et retrouvez-les ici,
          recalculées depuis la base à chaque consultation.
        </p>
        <Link
          href="/admin/clients"
          className="mt-4 inline-block text-sm font-semibold underline underline-offset-4"
        >
          Voir le suivi des clients <span className="link-decoration" aria-hidden="true">↗</span>
        </Link>
      </header>
      {params?.saved === "1" && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          Indicateur enregistré et partagé avec votre équipe.
        </p>
      )}
      {params?.deleted === "1" && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          Indicateur supprimé.
        </p>
      )}
      {invalid && (
        <p
          role="alert"
          className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900"
        >
          Cet indicateur doit être reconfiguré. Choisissez de nouveaux réglages
          puis enregistrez.
        </p>
      )}
      <IndicatorBuilder
        key={editing ? editing.id : `new:${initialDefinition.clientId}`}
        id={editing?.id}
        initialName={editing?.name}
        initialDefinition={initialDefinition}
        clients={clients}
        categories={categories}
        eventTypes={eventTypes}
      />
      <div>
        <h2 className="text-xl font-semibold">
          Indicateurs enregistrés{" "}
          <span className="text-[color:var(--muted)]">({saved.length})</span>
        </h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Les réglages sont conservés dans la base. Les chiffres évoluent avec
          vos commandes et règlements.
        </p>
      </div>
      {saved.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/15 bg-white/60 p-8">
          <h3 className="font-semibold">Votre premier indicateur</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Essayez « Commandes → Moyenne → Montant de la commande », puis
            regroupez par client. Ou choisissez « Encaissements → Somme » pour
            suivre les acomptes et soldes reçus.
          </p>
        </div>
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-2">
          {saved.map((indicator) => {
            let definition: IndicatorDefinition | null = null;
            try {
              definition = parseIndicatorDefinition(indicator.definition);
            } catch {
              /* Retain the card so the admin can repair or delete it. */
            }
            return (
              <article
                key={indicator.id}
                className="space-y-4 rounded-3xl border border-black/5 bg-white/80 p-6"
              >
                <div>
                  <h3 className="text-lg font-semibold">{indicator.name}</h3>
                  {definition && (
                    <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {INDICATOR_SOURCES[definition.source].label} ·{" "}
                      {AGGREGATION_LABELS[definition.aggregation]} ·{" "}
                      {PERIOD_LABELS[definition.period.preset]}
                      {definition.clientId &&
                        ` · ${snapshot.clients.find((c) => c.id === definition!.clientId)?.name ?? "Client supprimé"}`}
                      {definition.period.preset === "custom" &&
                        ` (${definition.period.from || "sans date de début"} → ${definition.period.to || "sans date de fin"})`}
                    </p>
                  )}
                </div>
                {definition ? (
                  <IndicatorResult
                    result={calculateIndicator(snapshot, definition)}
                    groupBy={definition.groupBy}
                  />
                ) : (
                  <p className="text-sm text-amber-900">
                    Configuration invalide. Modifiez cet indicateur pour le
                    réparer.
                  </p>
                )}
                {definition && (
                  <details className="rounded-2xl bg-[color:var(--surface)] p-3 text-xs">
                    <summary className="cursor-pointer font-semibold">
                      Réglages utilisés
                    </summary>
                    <div className="mt-2 space-y-1 leading-6">
                      <p>
                        Champ :{" "}
                        {
                          INDICATOR_SOURCES[definition.source].fields[
                            definition.field
                          ].label
                        }
                      </p>
                      <p>
                        Date :{" "}
                        {
                          INDICATOR_SOURCES[definition.source].dates[
                            definition.dateField
                          ]
                        }
                      </p>
                      <p>
                        Statuts :{" "}
                        {definition.statuses.length
                          ? definition.statuses
                              .map((status) => STATUS_LABELS[status] ?? status)
                              .join(", ")
                          : "Tous"}
                      </p>
                      <p>{GROUP_LABELS[definition.groupBy]}</p>
                      {definition.category && (
                        <p>Catégorie : {definition.category}</p>
                      )}
                      {definition.eventType && (
                        <p>Événement : {definition.eventType}</p>
                      )}
                      {definition.minimum !== null && (
                        <p>
                          Minimum : {definition.minimum}
                          {INDICATOR_SOURCES[definition.source].fields[
                            definition.field
                          ].unit === "money"
                            ? " €"
                            : ""}
                        </p>
                      )}
                      {definition.maximum !== null && (
                        <p>
                          Maximum : {definition.maximum}
                          {INDICATOR_SOURCES[definition.source].fields[
                            definition.field
                          ].unit === "money"
                            ? " €"
                            : ""}
                        </p>
                      )}
                    </div>
                  </details>
                )}
                <div className="flex flex-wrap gap-3 border-t border-black/5 pt-4">
                  <Link
                    href={`/admin/indicateurs?edit=${encodeURIComponent(indicator.id)}`}
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold"
                  >
                    Modifier
                  </Link>
                  <form action={deleteIndicator}>
                    <input type="hidden" name="id" value={indicator.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-black/10 px-4 py-2 text-sm text-[color:var(--muted)]"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <details className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <summary className="cursor-pointer text-sm font-semibold">
          Comprendre les données disponibles
        </summary>
        <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--muted)]">
          <p>
            « Nombre » compte les enregistrements retenus. « Clients distincts »
            compte chaque client une seule fois. Somme, moyenne, minimum et
            maximum utilisent les valeurs renseignées du champ sélectionné ; une
            moyenne sans valeur affiche un tiret.
          </p>
          <p>
            Les périodes suivent le calendrier de Paris. Le filtre de date
            correspond à la date choisie : création, signature, événement,
            émission ou encaissement. Les dates personnalisées incluent toute la
            journée de début et de fin.
          </p>
          <p>
            Les acomptes et soldes sont séparés pour éviter de compter deux fois
            un acompte déjà reçu. Pour les anciens règlements sans date
            enregistrée, la date d’émission sert de référence et le résultat le
            signale.
          </p>
          <p>
            Les commandes rapprochent réservations, devis acceptés et factures.
            Les montants sans facture associée sont des estimations. Les
            factures brouillons associées peuvent déjà donner le montant d’une
            commande ; les encaissements sont suivis séparément. Les lignes
            d’articles portent sur les réservations ; les anciens devis sans
            réservation ne fournissent pas de lignes de location.
          </p>
        </div>
      </details>
    </section>
  );
}
