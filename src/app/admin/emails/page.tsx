import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { getEmailSettings } from "@/lib/mailer";
import { emailKinds, emailStatus } from "@/lib/email-utils";
import { EmailSettingsForm } from "@/components/EmailForms";
import type { Prisma } from "@/generated/prisma";

export const dynamic = "force-dynamic";
const date = (value: Date | null) =>
  value
    ? new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Europe/Paris",
      }).format(value)
    : "—";

export default async function EmailsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    page?: string;
    client?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params?.q || "").slice(0, 200).trim();
  const status = ["SENT", "FAILED", "SENDING", "PENDING"].includes(
    params?.status || "",
  )
    ? params!.status!
    : "";
  const clientId =
    params?.client && params.client.length <= 128 ? params.client : "";
  const requestedPage = Math.max(
    1,
    Math.min(100000, Number.parseInt(params?.page || "1", 10) || 1),
  );
  const where: Prisma.EmailMessageWhereInput = {
    ...(status ? { status } : {}),
    ...(clientId ? { clientId } : {}),
    ...(q
      ? {
          OR: [
            { to: { contains: q, mode: "insensitive" } },
            { subject: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [settings, total, counts] = await Promise.all([
    getEmailSettings(),
    prisma.emailMessage.count({ where }),
    prisma.emailMessage.groupBy({ by: ["status"], _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 25));
  const page = Math.min(pages, requestedPage);
  const messages = await prisma.emailMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 25,
    skip: (page - 1) * 25,
    select: {
      id: true,
      kind: true,
      to: true,
      subject: true,
      status: true,
      attempts: true,
      error: true,
      bccError: true,
      sentAt: true,
      lastAttemptAt: true,
      createdAt: true,
    },
  });
  const count = (key: string) =>
    counts.find((entry) => entry.status === key)?._count || 0;
  const pageUrl = (next: number) => {
    const search = new URLSearchParams({ page: String(next) });
    if (q) search.set("q", q);
    if (status) search.set("status", status);
    if (clientId) search.set("client", clientId);
    return `/admin/emails?${search}`;
  };
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">
          Messagerie
        </p>
        <h1 className="mt-2 text-3xl font-semibold">E-mails</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
          Vérifiez les envois aux clients, consultez les erreurs et relancez un
          message manuellement. « Accepté par le serveur » confirme la prise en
          charge par la messagerie, sans garantir l’arrivée dans la boîte de
          réception du client.
        </p>
      </header>
      <section
        className="grid gap-3 sm:grid-cols-3"
        aria-label="Suivi des envois"
      >
        {[
          ["Acceptés par le serveur", count("SENT")],
          ["En échec", count("FAILED")],
          ["En cours / à vérifier", count("SENDING") + count("PENDING")],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-black/10 bg-white p-5"
          >
            <p className="text-sm text-[color:var(--muted)]">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
          </div>
        ))}
      </section>
      <details
        className="rounded-2xl border border-black/10 bg-white p-5"
        open={!settings.bccEmail}
      >
        <summary className="cursor-pointer font-semibold">
          Paramètres d’envoi et copie cachée
        </summary>
        <p className="my-4 text-sm leading-6 text-[color:var(--muted)]">
          Expéditeur : {settings.senderEmail || "non configuré"}. Copie cachée :{" "}
          {settings.bccEmail || "désactivée"}.
        </p>
        <EmailSettingsForm
          senderEmail={settings.senderEmail}
          bccEmail={settings.bccEmail || null}
        />
      </details>
      <section className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
        <form
          method="get"
          className="mb-5 grid gap-3 sm:flex sm:flex-wrap sm:items-end"
        >
          {clientId && <input type="hidden" name="client" value={clientId} />}
          <label className="grid min-w-0 flex-1 gap-2 text-sm font-semibold">
            Rechercher
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Destinataire ou objet"
              className="min-h-11 w-full rounded-xl border border-black/15 px-3 py-2 text-base"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Statut
            <select
              name="status"
              defaultValue={status}
              className="min-h-11 rounded-xl border border-black/15 px-3 py-2 text-base"
            >
              <option value="">Tous</option>
              <option value="FAILED">Échec</option>
              <option value="SENT">Accepté par le serveur</option>
              <option value="SENDING">En cours / à vérifier</option>
              <option value="PENDING">En attente</option>
            </select>
          </label>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-[color:var(--ink)] px-5 py-2 text-sm font-semibold text-white"
          >
            Filtrer
          </button>
          <Link href="/admin/emails" className="py-3 text-sm underline">
            Tout afficher
          </Link>
        </form>
        <p className="mb-4 text-xs leading-6 text-[color:var(--muted)]">
          Le suivi commence avec cette mise à jour. Pour un ancien mail sans
          historique, utilisez les boutons d’envoi des demandes, devis, factures
          ou réservations.
        </p>
        {messages.length ? (
          <div className="divide-y divide-black/10">
            {messages.map((message) => (
              <article
                key={message.id}
                className="flex flex-wrap items-start justify-between gap-4 py-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[color:var(--muted)]">
                    {emailKinds[message.kind] || message.kind} ·{" "}
                    {date(message.createdAt)}
                  </p>
                  <h2 className="mt-1 text-base font-semibold">
                    {message.subject}
                  </h2>
                  <p className="mt-1 break-all text-sm">{message.to}</p>
                  <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {emailStatus(message.status, message.lastAttemptAt)} ·{" "}
                    {message.attempts} tentative(s)
                    {message.sentAt
                      ? ` · Dernier envoi accepté : ${date(message.sentAt)}`
                      : ""}
                  </p>
                  {message.error && (
                    <p className="mt-2 text-sm text-amber-900">
                      {message.error}
                    </p>
                  )}
                  {message.bccError && (
                    <p className="mt-2 text-sm text-amber-900">
                      {message.bccError}
                    </p>
                  )}
                </div>
                <Link
                  href={`/admin/emails/${message.id}`}
                  className="min-h-11 rounded-full border border-black/15 px-4 py-3 text-sm font-semibold"
                >
                  Voir et renvoyer
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-[color:var(--surface)] p-5 text-sm leading-7">
            Aucun message ne correspond à cette recherche.{" "}
            <Link href="/admin/demandes" className="underline">
              Ouvrir les demandes
            </Link>
          </p>
        )}
        <nav
          aria-label="Pagination des e-mails"
          className="mt-5 flex items-center justify-between gap-3 text-sm"
        >
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} className="py-3 underline">
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span>
            {total} message(s) · Page {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={pageUrl(page + 1)} className="py-3 underline">
              Suivant
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </section>
    </div>
  );
}
