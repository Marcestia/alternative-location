"use client";

import { acceptQuoteByToken } from "@/app/actions/quotes";
import { useState } from "react";

type QuoteSignatureFormProps = {
  token: string;
};

export default function QuoteSignatureForm({ token }: QuoteSignatureFormProps) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form action={acceptQuoteByToken} className="mt-6 space-y-4" onSubmit={() => setSubmitting(true)}>
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="text-sm font-semibold">Nom et prénom</label>
        <input
          className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
          name="signatureName"
          placeholder="Votre nom"
          required
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
        <input type="checkbox" name="acceptTerms" required />
        J&apos;accepte le devis et les conditions générales (acompte de 30% sous 7 jours).
      </label>

      <button
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
        type="submit"
        disabled={submitting}
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-white/30" />
        )}
        {submitting ? "Envoi en cours..." : "Je confirme mon devis"}
      </button>
    </form>
  );
}
