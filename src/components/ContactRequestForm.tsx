"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { createContactRequest } from "@/app/actions/contact";
import ContactSubmitButton from "@/components/ContactSubmitButton";
import EventDatePicker from "@/components/EventDatePicker";
import {
  CONTACT_REQUEST_DRAFT_STORAGE_KEY,
  CONTACT_REQUEST_SELECTION_STORAGE_KEY,
  normalizeContactRequestDraft,
  parseRequestedSelection,
  stringifyRequestedSelection,
  type ContactRequestDraft,
  type RequestedSelectionItem,
} from "@/lib/requestSelection";

const emptyDraft: ContactRequestDraft = {
  name: "",
  email: "",
  phone: "",
  address: "",
  eventType: "",
  eventLocation: "",
  guestCount: "",
  budget: "",
  eventDate: "",
  message: "",
};

type ContactRequestFormProps = {
  sentStatus?: string;
  catalogRequestEnabled: boolean;
};

export default function ContactRequestForm({
  sentStatus,
  catalogRequestEnabled,
}: ContactRequestFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<ContactRequestDraft>(emptyDraft);
  const [selectedItemsJson, setSelectedItemsJson] = useState("[]");
  const [selectionError, setSelectionError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sentStatus === "1") {
      window.sessionStorage.removeItem(CONTACT_REQUEST_DRAFT_STORAGE_KEY);
      window.sessionStorage.removeItem(CONTACT_REQUEST_SELECTION_STORAGE_KEY);
      setDraft(emptyDraft);
      setSelectedItemsJson("[]");
      return;
    }

    let savedDraft = null;
    let savedSelection: RequestedSelectionItem[] = [];

    try {
      savedDraft = normalizeContactRequestDraft(
        JSON.parse(
          window.sessionStorage.getItem(CONTACT_REQUEST_DRAFT_STORAGE_KEY) || "null"
        )
      );
    } catch {
      window.sessionStorage.removeItem(CONTACT_REQUEST_DRAFT_STORAGE_KEY);
    }

    try {
      savedSelection = parseRequestedSelection(
        window.sessionStorage.getItem(CONTACT_REQUEST_SELECTION_STORAGE_KEY)
      );
    } catch {
      window.sessionStorage.removeItem(CONTACT_REQUEST_SELECTION_STORAGE_KEY);
    }

    if (savedDraft) {
      setDraft(savedDraft);
    }
    if (savedSelection.length > 0) {
      setSelectedItemsJson(stringifyRequestedSelection(savedSelection));
    }
  }, [sentStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      CONTACT_REQUEST_DRAFT_STORAGE_KEY,
      JSON.stringify(draft)
    );
  }, [draft]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const normalizedSelection = parseRequestedSelection(selectedItemsJson);
    if (normalizedSelection.length > 0) {
      window.sessionStorage.setItem(
        CONTACT_REQUEST_SELECTION_STORAGE_KEY,
        stringifyRequestedSelection(normalizedSelection)
      );
    } else {
      window.sessionStorage.removeItem(CONTACT_REQUEST_SELECTION_STORAGE_KEY);
    }
  }, [selectedItemsJson]);

  const selectedItems = useMemo(
    () => parseRequestedSelection(selectedItemsJson),
    [selectedItemsJson]
  );
  const selectedItemCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );

  const updateDraft = (key: keyof ContactRequestDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const openCatalogueSelection = () => {
    if (!draft.eventDate) {
      setSelectionError("Choisissez d'abord le jour de la fete pour verifier les disponibilites.");
      return;
    }

    setSelectionError("");
    router.push(
      `/catalogue?request=1&eventDate=${encodeURIComponent(draft.eventDate)}`
    );
  };

  return (
    <>
      {sentStatus === "1" ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Merci. Votre demande a bien ete envoyee. Nous revenons vers vous rapidement.
        </div>
      ) : null}
      {sentStatus === "0" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Merci de remplir le nom, l&apos;email, le jour de la fete et le message.
        </div>
      ) : null}
      {sentStatus === "2" ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Merci de valider le captcha avant d&apos;envoyer.
        </div>
      ) : null}

      <form action={createContactRequest} className="mt-6 grid gap-4 text-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="name"
            placeholder="Nom et prenom"
            value={draft.name}
            onChange={(event) => updateDraft("name", event.target.value)}
            required
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="email"
            type="email"
            placeholder="Email"
            value={draft.email}
            onChange={(event) => updateDraft("email", event.target.value)}
            required
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="phone"
            placeholder="Telephone"
            value={draft.phone}
            onChange={(event) => updateDraft("phone", event.target.value)}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="address"
            placeholder="Adresse postale"
            value={draft.address}
            onChange={(event) => updateDraft("address", event.target.value)}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="eventType"
            placeholder="Type d'evenement"
            value={draft.eventType}
            onChange={(event) => updateDraft("eventType", event.target.value)}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="eventLocation"
            placeholder="Lieu de l'evenement"
            value={draft.eventLocation}
            onChange={(event) => updateDraft("eventLocation", event.target.value)}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="guestCount"
            type="number"
            min="1"
            placeholder="Nombre d'invites"
            value={draft.guestCount}
            onChange={(event) => updateDraft("guestCount", event.target.value)}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3"
            name="budget"
            placeholder="Budget estime (EUR)"
            value={draft.budget}
            onChange={(event) => updateDraft("budget", event.target.value)}
          />
          <div className="md:col-span-2">
            <EventDatePicker
              name="eventDate"
              label="Jour de la fete"
              defaultValue={draft.eventDate}
              onChange={(value) => updateDraft("eventDate", value)}
            />
          </div>
        </div>

        {catalogRequestEnabled ? (
          <div className="rounded-2xl border border-black/8 bg-[color:var(--surface)]/70 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Catalogue
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--ink)]">
                  Selectionnez vos articles avant d&apos;envoyer votre demande.
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  Votre panier sera automatiquement repris dans l&apos;admin pour pre-remplir le devis.
                </p>
              </div>
              <button
                type="button"
                onClick={openCatalogueSelection}
                className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold text-white"
              >
                {selectedItems.length > 0 ? "Modifier mes articles" : "Reserver mes articles"}
              </button>
            </div>

            {selectionError ? (
              <p className="mt-3 text-xs font-semibold text-amber-700">{selectionError}</p>
            ) : null}

            {selectedItems.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/90 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--ink)]">
                    {selectedItemCount} article(s) selectionne(s)
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedItemsJson("[]")}
                    className="rounded-full border border-black/10 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--muted)]"
                  >
                    Vider la selection
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedItems.slice(0, 4).map((item) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between gap-3 text-sm text-[color:var(--muted)]"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="shrink-0 font-semibold text-[color:var(--ink)]">x{item.quantity}</span>
                    </div>
                  ))}
                  {selectedItems.length > 4 ? (
                    <p className="text-xs text-[color:var(--muted)]">
                      + {selectedItems.length - 4} autre(s) article(s)
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <textarea
          className="min-h-[140px] rounded-2xl border border-black/10 bg-white px-4 py-3"
          name="message"
          placeholder="Expliquez votre demande, les quantites et le style souhaite."
          value={draft.message}
          onChange={(event) => updateDraft("message", event.target.value)}
          required
        />

        <input type="hidden" name="selectedItems" value={selectedItemsJson} />

        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
          <div className="flex items-center justify-start">
            <div
              className="cf-turnstile"
              data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            />
          </div>
        ) : null}

        <ContactSubmitButton />
      </form>

      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
        />
      ) : null}
    </>
  );
}
