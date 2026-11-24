"use client";

import { useActionState, useState } from "react";
import {
  resendEmail,
  saveEmailSettings,
  sendRequestAcknowledgement,
  verifyEmailConfiguration,
} from "@/app/actions/emails";
import type { EmailActionState } from "@/lib/email-utils";

const idle: EmailActionState = { status: "idle" };
const inputClass =
  "w-full rounded-2xl border border-black/15 bg-white px-4 py-3 text-base";
const buttonClass =
  "min-h-11 rounded-full bg-[color:var(--ink)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50";

function Feedback({ state }: { state: EmailActionState }) {
  return state.message ? (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={`rounded-xl p-3 text-sm ${state.status === "error" ? "bg-amber-50 text-amber-900" : "bg-emerald-50 text-emerald-900"}`}
    >
      {state.message}
    </p>
  ) : null;
}

export function EmailSettingsForm({
  senderEmail,
  bccEmail,
}: {
  senderEmail: string;
  bccEmail: string | null;
}) {
  const [sender, setSender] = useState(senderEmail);
  const [bcc, setBcc] = useState(bccEmail || "");
  const [state, action, pending] = useActionState(saveEmailSettings, idle);
  const [verification, verify, verifying] = useActionState(
    verifyEmailConfiguration,
    idle,
  );
  return (
    <div className="space-y-4">
      <form
        action={action}
        data-managed-submit="true"
        className="grid gap-4 sm:grid-cols-2"
      >
        <label className="grid gap-2 text-sm font-semibold">
          Adresse d’envoi OVH
          <input
            className={inputClass}
            type="email"
            name="senderEmail"
            value={sender}
            onChange={(e) => setSender(e.target.value)}
            required
            maxLength={254}
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Copie cachée à la gérante
          <input
            className={inputClass}
            type="email"
            name="bccEmail"
            value={bcc}
            onChange={(e) => setBcc(e.target.value)}
            maxLength={254}
            placeholder="Facultatif"
          />
        </label>
        <p className="text-xs leading-6 text-[color:var(--muted)] sm:col-span-2">
          La copie est invisible pour le client et inclut les pièces jointes.
          Videz son adresse pour désactiver les copies. Le mot de passe de la
          messagerie reste configuré sur Vercel.
        </p>
        <div className="sm:col-span-2">
          <Feedback state={state} />
        </div>
        <button className={buttonClass} type="submit" disabled={pending}>
          {pending ? "Enregistrement…" : "Enregistrer les paramètres"}
        </button>
      </form>
      <form action={verify} data-managed-submit="true" className="space-y-3">
        <button
          className="min-h-11 rounded-full border border-black/15 px-5 py-3 text-sm font-semibold disabled:opacity-50"
          type="submit"
          disabled={verifying || pending}
        >
          {verifying
            ? "Vérification…"
            : "Vérifier la connexion sans envoyer de mail"}
        </button>
        <Feedback state={verification} />
      </form>
    </div>
  );
}

export function ResendEmailForm({
  id,
  to,
  confirmRequired,
  busy,
}: {
  id: string;
  to: string;
  confirmRequired: boolean;
  busy: boolean;
}) {
  const [recipient, setRecipient] = useState(to);
  const [confirmed, setConfirmed] = useState(false);
  const [state, action, pending] = useActionState(resendEmail, idle);
  return (
    <form action={action} data-managed-submit="true" className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <label className="grid gap-2 text-sm font-semibold">
        Envoyer au client
        <input
          type="email"
          name="to"
          className={inputClass}
          required
          maxLength={254}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </label>
      {confirmRequired && (
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            name="confirmResend"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
          />
          Je confirme le renvoi. Ce message a peut-être déjà été reçu par le
          client.
        </label>
      )}
      <Feedback state={state} />
      <button
        className={buttonClass}
        type="submit"
        disabled={pending || busy || (confirmRequired && !confirmed)}
      >
        {pending
          ? "Envoi en cours…"
          : busy
            ? "Un envoi est déjà en cours"
            : confirmRequired
              ? "Renvoyer au client"
              : "Envoyer / réessayer"}
      </button>
      <p className="text-xs leading-6 text-[color:var(--muted)]">
        Le message et ses pièces jointes sont conservés. L’expéditeur et la
        copie cachée utilisent les paramètres actuels.
      </p>
    </form>
  );
}

export function RequestAcknowledgementButton({
  requestId,
}: {
  requestId: string;
}) {
  const [state, action, pending] = useActionState(
    sendRequestAcknowledgement,
    idle,
  );
  return (
    <form action={action} data-managed-submit="true" className="mt-3 space-y-2">
      <input type="hidden" name="requestId" value={requestId} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded-full border border-black/15 px-4 py-2 text-xs font-semibold disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer / renvoyer l’accusé de réception"}
      </button>
      <Feedback state={state} />
    </form>
  );
}
