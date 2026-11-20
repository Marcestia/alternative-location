"use client";

import { useActionState } from "react";
import Link from "next/link";
import { addClient, updateClient } from "@/app/actions/clients";
import {
  CLIENT_FIELD_LIMITS,
  type ClientFormState,
  type ClientFormValues,
} from "@/lib/clientForm";

type EditableClient = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

const initialState: ClientFormState = { status: "idle" };
const fields = [
  {
    name: "name",
    label: "Nom et prénom",
    type: "text",
    autoComplete: "name",
    required: true,
  },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Téléphone", type: "tel", autoComplete: "tel" },
  {
    name: "address",
    label: "Adresse",
    type: "text",
    autoComplete: "street-address",
  },
] as const;

export default function ClientForm({ client }: { client?: EditableClient }) {
  const [state, action, pending] = useActionState(
    client ? updateClient : addClient,
    initialState,
  );
  const values: ClientFormValues = state.values ?? {
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    address: client?.address ?? "",
    notes: client?.notes ?? "",
  };

  return (
    <form action={action} className="mt-5 space-y-5" aria-busy={pending}>
      {client && <input type="hidden" name="id" value={client.id} />}
      {state.message && (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`rounded-2xl border px-4 py-3 text-sm ${state.status === "error" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}
        >
          {state.message}
        </div>
      )}
      <fieldset
        disabled={pending}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        <legend className="sr-only">Coordonnées et notes du client</legend>
        {fields.map((field) => {
          const error = state.fieldErrors?.[field.name];
          return (
            <div
              key={field.name}
              className={field.name === "address" ? "sm:col-span-2" : ""}
            >
              <label
                htmlFor={`client-${field.name}`}
                className="mb-2 block text-sm font-semibold"
              >
                {field.label}
                {field.name === "name" ? " *" : ""}
              </label>
              <input
                id={`client-${field.name}`}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required={field.name === "name"}
                maxLength={CLIENT_FIELD_LIMITS[field.name]}
                defaultValue={values[field.name]}
                aria-invalid={Boolean(error)}
                aria-describedby={
                  error ? `client-${field.name}-error` : undefined
                }
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-60"
              />
              {error && (
                <p
                  id={`client-${field.name}-error`}
                  className="mt-1 text-sm text-amber-900"
                >
                  {error}
                </p>
              )}
            </div>
          );
        })}
        <div className="sm:col-span-2">
          <label
            htmlFor="client-notes"
            className="mb-2 block text-sm font-semibold"
          >
            Notes internes
          </label>
          <textarea
            id="client-notes"
            name="notes"
            rows={4}
            maxLength={CLIENT_FIELD_LIMITS.notes}
            defaultValue={values.notes}
            aria-invalid={Boolean(state.fieldErrors?.notes)}
            aria-describedby={
              state.fieldErrors?.notes
                ? "client-notes-help client-notes-error"
                : "client-notes-help"
            }
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--ring)] disabled:opacity-60"
          />
          <p
            id="client-notes-help"
            className="mt-1 text-xs text-[color:var(--muted)]"
          >
            Réservées à votre équipe. Seul le nom est obligatoire.
          </p>
          {state.fieldErrors?.notes && (
            <p id="client-notes-error" className="mt-1 text-sm text-amber-900">
              {state.fieldErrors.notes}
            </p>
          )}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? "Enregistrement…"
            : client
              ? "Enregistrer les modifications"
              : "Créer le client"}
        </button>
        {client && (
          <Link
            href="/admin/clients"
            className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold"
          >
            Retour à la liste
          </Link>
        )}
      </div>
    </form>
  );
}
