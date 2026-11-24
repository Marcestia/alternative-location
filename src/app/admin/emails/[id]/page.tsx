import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { getEmailSettings } from "@/lib/mailer";
import {
  emailKinds,
  emailStatus,
  EMAIL_LEASE_MS,
  type StoredAttachment,
} from "@/lib/email-utils";
import { ResendEmailForm } from "@/components/EmailForms";

export const dynamic = "force-dynamic";
const date = (value: Date | null) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Europe/Paris",
      }).format(value)
    : "—";

export default async function EmailDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ sent?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!id || id.length > 128) notFound();
  const [message, settings, search] = await Promise.all([
    prisma.emailMessage.findUnique({ where: { id } }),
    getEmailSettings(),
    searchParams,
  ]);
  if (!message) notFound();
  const client = message.clientId
    ? await prisma.client.findUnique({
        where: { id: message.clientId },
        select: { id: true, email: true, name: true },
      })
    : null;
  const attachments = Array.isArray(message.attachments)
    ? (message.attachments as StoredAttachment[])
    : [];
  const stale =
    message.status === "SENDING" &&
    !!message.lastAttemptAt &&
    Date.now() - message.lastAttemptAt.getTime() > EMAIL_LEASE_MS;
  return (
    <div className="space-y-6">
      <Link
        href="/admin/emails"
        className="inline-flex min-h-11 items-center text-sm underline"
      >
        Retour aux e-mails
      </Link>
      <header>
        <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">
          {emailKinds[message.kind] || message.kind}
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          {message.subject}
        </h1>
        <p className="mt-3 text-sm">
          {emailStatus(message.status, message.lastAttemptAt)} ·{" "}
          {message.attempts} tentative(s)
        </p>
      </header>
      {search?.sent === "1" && message.status === "SENT" && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          Le serveur a accepté l’envoi au client. Une éventuelle réception en
          spam ou un rejet ultérieur ne peuvent pas être détectés ici.
        </p>
      )}
      {message.error && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          {message.error}
        </p>
      )}
      {message.bccError && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          {message.bccError}
        </p>
      )}
      {stale && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Cet envoi ne s’est pas terminé normalement. Le client a peut-être reçu
          le mail. Vérifiez les copies reçues avant de le renvoyer.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Envoi manuel</h2>
          {client && (
            <p className="text-sm">
              Client :{" "}
              <Link className="underline" href={`/admin/clients/${client.id}`}>
                {client.name}
              </Link>
            </p>
          )}
          <p className="text-sm leading-7 text-[color:var(--muted)]">
            Dernier destinataire : {message.to}
            <br />
            Dernière tentative : {date(message.lastAttemptAt)}
            <br />
            Dernier envoi accepté : {date(message.sentAt)}
            <br />
            Copie cachée du dernier envoi : {message.bcc || "aucune"}
            <br />
            Copie cachée du prochain envoi : {settings.bccEmail || "désactivée"}
          </p>
          {client?.email && client.email !== message.to && (
            <p className="rounded-xl bg-[color:var(--surface)] p-3 text-sm">
              L’adresse actuelle de la fiche client est proposée ci-dessous.
              Vérifiez-la avant de renvoyer.
            </p>
          )}
          <ResendEmailForm
            key={message.sentAt?.toISOString() || message.id}
            id={message.id}
            to={client?.email || message.to}
            confirmRequired={message.status === "SENT" || stale}
            busy={message.status === "SENDING" && !stale}
          />
          <p className="text-xs leading-6 text-[color:var(--muted)]">
            Si la connexion OVH échoue, corrigez les{" "}
            <Link href="/admin/emails" className="underline">
              paramètres de messagerie
            </Link>{" "}
            avant de réessayer. Les liens d’un ancien message peuvent expirer ;
            pour actualiser un document, utilisez son bouton d’envoi dans les
            demandes, factures ou réservations.
          </p>
        </section>
        <section className="min-w-0 space-y-4 rounded-2xl border border-black/10 bg-white p-5">
          <h2 className="text-xl font-semibold">Contenu conservé</h2>
          <p className="text-sm">
            {attachments.length} pièce(s) jointe(s)
            {attachments.length > 0
              ? ` : ${attachments.map((file) => file.filename).join(", ")}`
              : ""}
          </p>
          <pre className="max-h-[650px] overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-[color:var(--surface)] p-4 font-sans text-sm leading-7">
            {message.text}
          </pre>
        </section>
      </div>
    </div>
  );
}
