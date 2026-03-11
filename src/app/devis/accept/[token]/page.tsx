import { prisma } from "@/lib/prisma";
import { QuoteStatus } from "@/generated/prisma";
import QuoteSignatureForm from "@/components/QuoteSignatureForm";
import ConditionsContent from "@/components/ConditionsContent";
import { CG_VERSION } from "@/lib/conditions";

export default async function AcceptQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = searchParams ? await searchParams : undefined;
  const token = resolvedParams.token;

  const quote = await prisma.quote.findUnique({
    where: { token },
    include: { client: true },
  });

  if (!quote) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Lien invalide</h1>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Ce lien n'existe pas ou a expiré.
        </p>
      </div>
    );
  }

  if (quote.status === QuoteStatus.ACCEPTED) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Merci !</h1>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Votre devis est déjà confirmé.
        </p>
      </div>
    );
  }

  if (quote.status === QuoteStatus.REJECTED) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Devis refusé</h1>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Ce devis a été refusé.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Confirmation
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Valider votre devis</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Bonjour {quote.client.name}, merci de confirmer votre devis.
        </p>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          En signant, vous vous engagez à verser l&apos;acompte de 30% sous 7 jours.
        </p>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Période : {quote.startDate.toLocaleDateString("fr-FR")} → {quote.endDate.toLocaleDateString("fr-FR")}
        </p>
        <div className="mt-4 rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4 text-sm text-[color:var(--muted)]">
          <p className="font-semibold text-[color:var(--ink)]">
            Documents
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
            {quote.pdfUrl && (
              <a
                className="rounded-full border border-black/10 px-3 py-1"
                href={`/api/pdfs?key=${encodeURIComponent(quote.pdfUrl)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir le devis (PDF)
              </a>
            )}
            <a
              className="rounded-full border border-black/10 px-3 py-1"
              href="/conditions"
              target="_blank"
              rel="noreferrer"
              >
              Lire les conditions générales
            </a>
          </div>
          <p className="mt-3 text-xs">
            La signature vaut acceptation du devis et des conditions générales.
          </p>
        </div>
        <div className="mt-4 rounded-2xl border border-black/5 bg-white/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-semibold text-[color:var(--ink)]">
              Conditions générales
            </p>
            <span className="text-xs text-[color:var(--muted)]">
              Version : {CG_VERSION}
            </span>
          </div>
          <div className="mt-3 max-h-[320px] overflow-y-auto rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4">
            <ConditionsContent className="space-y-4" />
          </div>
        </div>
        {resolvedSearch?.error === "1" && (
          <p className="mt-4 text-xs text-rose-600">
            Merci d'ajouter votre signature et d'accepter les conditions.
          </p>
        )}
        <QuoteSignatureForm token={quote.token} />
      </div>
    </div>
  );
}
