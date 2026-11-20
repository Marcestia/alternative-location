"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { runIndicator } from "@/app/actions/indicators";
import {
  AGGREGATION_LABELS,
  GROUP_LABELS,
  INDICATOR_SOURCES,
  PERIOD_LABELS,
  defaultIndicator,
  type IndicatorAggregation,
  type IndicatorDefinition,
  type IndicatorGroup,
  type IndicatorSource,
} from "@/lib/indicator-config";
import { STATUS_LABELS, type AnalyticsPeriod } from "@/lib/analytics";
import type { IndicatorActionState } from "@/lib/indicator-state";
import IndicatorResult from "@/components/IndicatorResult";

const control =
  "mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--ring)]";
export default function IndicatorBuilder({
  initialDefinition,
  initialName = "",
  id = "",
  clients,
  categories,
  eventTypes,
}: {
  initialDefinition: IndicatorDefinition;
  initialName?: string;
  id?: string;
  clients: { id: string; name: string }[];
  categories: string[];
  eventTypes: string[];
}) {
  const [definition, setDefinition] = useState(initialDefinition);
  const [name, setName] = useState(initialName);
  const [state, action, pending] = useActionState(runIndicator, {
    status: "idle",
  } as IndicatorActionState);
  const config = INDICATOR_SOURCES[definition.source];
  const patch = (change: Partial<IndicatorDefinition>) =>
    setDefinition((value) => ({ ...value, ...change }));
  const signature = JSON.stringify(definition);
  const stale = state.result && state.signature !== signature;
  return (
    <div className="rounded-3xl border border-black/5 bg-white/80 p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {id ? "Modifier l’indicateur" : "Créer un indicateur"}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Choisissez les données et le calcul, puis prévisualisez ou
            enregistrez pour votre équipe.
          </p>
        </div>
        {id && (
          <Link
            href="/admin/indicateurs"
            className="rounded-full border border-black/10 px-4 py-2 text-sm"
          >
            Nouvel indicateur
          </Link>
        )}
      </div>
      <form
        action={action}
        data-managed-submit="true"
        className="mt-6 space-y-5"
        aria-busy={pending}
      >
        <input type="hidden" name="definition" value={signature} />
        <input type="hidden" name="id" value={id} />
        <fieldset
          disabled={pending}
          className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          <legend className="sr-only">Configuration de l’indicateur</legend>
          <label className="block text-sm font-semibold md:col-span-2 xl:col-span-3">
            Nom de l’indicateur
            <input
              className={control}
              name="name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex. Panier moyen des commandes cette année"
            />
            <span className="mt-1 block text-xs font-normal text-[color:var(--muted)]">
              Le nom est nécessaire pour enregistrer.
            </span>
          </label>
          <label className="block text-sm font-semibold">
            Données
            <select
              className={control}
              value={definition.source}
              onChange={(event) =>
                setDefinition(
                  defaultIndicator(
                    event.target.value as IndicatorSource,
                    definition.clientId,
                  ),
                )
              }
            >
              {Object.entries(INDICATOR_SOURCES).map(([value, source]) => (
                <option key={value} value={value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Calcul
            <select
              className={control}
              value={definition.aggregation}
              onChange={(event) =>
                patch({
                  aggregation: event.target.value as IndicatorAggregation,
                })
              }
            >
              {Object.entries(AGGREGATION_LABELS)
                .filter(
                  ([value]) => config.clients || value !== "uniqueClients",
                )
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Champ à mesurer ou filtrer
            <select
              className={control}
              value={definition.field}
              onChange={(event) =>
                patch({
                  field: event.target.value,
                  minimum: null,
                  maximum: null,
                })
              }
            >
              {Object.entries(config.fields).map(([value, field]) => (
                <option key={value} value={value}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Période
            <select
              className={control}
              value={definition.period.preset}
              onChange={(event) =>
                patch({
                  period: {
                    ...definition.period,
                    preset: event.target.value as AnalyticsPeriod["preset"],
                  },
                })
              }
            >
              {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Date utilisée
            <select
              className={control}
              value={definition.dateField}
              onChange={(event) => patch({ dateField: event.target.value })}
            >
              {Object.entries(config.dates).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Regrouper
            <select
              className={control}
              value={definition.groupBy}
              onChange={(event) =>
                patch({ groupBy: event.target.value as IndicatorGroup })
              }
            >
              {config.groups.map((value) => (
                <option key={value} value={value}>
                  {GROUP_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          {definition.period.preset === "custom" && (
            <>
              <label className="block text-sm font-semibold">
                Du
                <input
                  type="date"
                  className={control}
                  value={definition.period.from}
                  onChange={(event) =>
                    patch({
                      period: {
                        ...definition.period,
                        from: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <label className="block text-sm font-semibold">
                Au
                <input
                  type="date"
                  className={control}
                  value={definition.period.to}
                  onChange={(event) =>
                    patch({
                      period: { ...definition.period, to: event.target.value },
                    })
                  }
                />
              </label>
            </>
          )}
          {config.clients && (
            <label className="block text-sm font-semibold">
              Client
              <select
                className={control}
                value={definition.clientId}
                onChange={(event) => patch({ clientId: event.target.value })}
              >
                <option value="">Tous les clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {["items", "rentalLines"].includes(definition.source) && (
            <label className="block text-sm font-semibold">
              Catégorie
              <select
                className={control}
                value={definition.category}
                onChange={(event) => patch({ category: event.target.value })}
              >
                <option value="">Toutes les catégories</option>
                {categories.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          )}
          {["orders", "quotes", "requests"].includes(definition.source) && (
            <label className="block text-sm font-semibold">
              Type d’événement
              <select
                className={control}
                value={definition.eventType}
                onChange={(event) => patch({ eventType: event.target.value })}
              >
                <option value="">Tous les événements</option>
                {eventTypes.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm font-semibold">
            Valeur minimum
            {config.fields[definition.field].unit === "money" ? " (€)" : ""}
            <input
              type="number"
              step="any"
              className={control}
              value={definition.minimum ?? ""}
              onChange={(event) =>
                patch({
                  minimum:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
              placeholder="Sans minimum"
            />
          </label>
          <label className="block text-sm font-semibold">
            Valeur maximum
            {config.fields[definition.field].unit === "money" ? " (€)" : ""}
            <input
              type="number"
              step="any"
              className={control}
              value={definition.maximum ?? ""}
              onChange={(event) =>
                patch({
                  maximum:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                })
              }
              placeholder="Sans maximum"
            />
          </label>
          {config.statuses.length > 0 && (
            <fieldset className="min-w-0 rounded-2xl bg-[color:var(--surface)] p-4 md:col-span-2 xl:col-span-3">
              <legend className="px-1 text-sm font-semibold">
                Statuts retenus
              </legend>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {config.statuses.map((status) => (
                  <label
                    key={status}
                    className="inline-flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={definition.statuses.includes(status)}
                      onChange={(event) =>
                        patch({
                          statuses: event.target.checked
                            ? [...definition.statuses, status]
                            : definition.statuses.filter(
                                (value) => value !== status,
                              ),
                        })
                      }
                    />
                    {STATUS_LABELS[status] ?? status}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-[color:var(--muted)]">
                Sans case cochée : tous les statuts sont inclus.
              </p>
            </fieldset>
          )}
        </fieldset>
        {definition.source === "clients" && (
          <p className="rounded-2xl bg-[color:var(--surface)] p-4 text-xs text-[color:var(--muted)]">
            Les montants de la source Clients portent sur leur historique
            complet. La période filtre la création des fiches. Pour analyser les
            commandes d’une période, choisissez la source Commandes.
          </p>
        )}
        {definition.source === "invoices" && (
          <p className="text-xs text-[color:var(--muted)]">
            Pour suivre les entrées d’argent selon leur date de réception,
            choisissez la source Encaissements. Par défaut, seules les factures
            envoyées et payées sont retenues.
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            name="intent"
            value="preview"
            disabled={pending}
            className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold disabled:opacity-60"
          >
            {pending ? "Traitement en cours…" : "Calculer"}
          </button>
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={pending}
            className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {id ? "Enregistrer les modifications" : "Enregistrer l’indicateur"}
          </button>
        </div>
        {state.message && (
          <p
            role={state.status === "error" ? "alert" : "status"}
            className={`rounded-2xl border px-4 py-3 text-sm ${state.status === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
          >
            {state.message}
          </p>
        )}
      </form>
      {state.result && (
        <div className="mt-6 rounded-2xl bg-[color:var(--surface)] p-5">
          {stale ? (
            <p role="status" className="text-sm text-[color:var(--muted)]">
              Réglages modifiés : cliquez sur Calculer pour actualiser le
              résultat.
            </p>
          ) : (
            <IndicatorResult
              result={state.result}
              groupBy={definition.groupBy}
            />
          )}
        </div>
      )}
    </div>
  );
}
