import { prisma } from "@/lib/prisma";
import { resetNonStockData, saveCompanySettings } from "@/app/actions/settings";
import {
  addSpotlight,
  deleteSpotlight,
  updateCategory,
  updateSpotlight,
} from "@/app/actions/stock";
import AdminImageInput from "@/components/AdminImageInput";
import Script from "next/script";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const [settings, categories, spotlights] = await Promise.all([
    prisma.companySetting.findUnique({ where: { id: "company" } }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.spotlight.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 5,
    }),
  ]);
  const ribUrl = process.env.R2_PUBLIC_BASE_URL
    ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/documents/IBAN.pdf`
    : "";

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Parametres</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Informations legales, regles de facturation et site.
        </p>
      </header>

      {resolvedParams?.saved === "1" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Parametres enregistres.
        </div>
      )}
      {resolvedParams?.saved === "0" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Le nom de l'entreprise est obligatoire.
        </div>
      )}
      {resolvedParams?.reset === "1" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Donnees non-stock supprimees.
        </div>
      )}

      <form
        action={saveCompanySettings}
        className="rounded-3xl border border-black/5 bg-white/80 p-6 shadow-[0_15px_30px_rgba(22,18,14,0.08)]"
      >
        <h2 className="text-xl font-semibold">Parametres facturation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="businessName"
            placeholder="Nom de l'entreprise"
            defaultValue={settings?.businessName || "Alternative Location"}
            required
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="legalForm"
            placeholder="Forme juridique (ex: EI, SASU, SARL)"
            defaultValue={settings?.legalForm || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="capital"
            placeholder="Capital social (optionnel)"
            defaultValue={settings?.capital || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="siren"
            placeholder="SIREN"
            defaultValue={settings?.siren || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="siret"
            placeholder="SIRET"
            defaultValue={settings?.siret || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="nafCode"
            placeholder="Code NAF"
            defaultValue={settings?.nafCode || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="vatNumber"
            placeholder="Numero de TVA (si applicable)"
            defaultValue={settings?.vatNumber || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="address"
            placeholder="Adresse"
            defaultValue={settings?.address || ""}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              name="postalCode"
              placeholder="Code postal"
              defaultValue={settings?.postalCode || ""}
            />
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              name="city"
              placeholder="Ville"
              defaultValue={settings?.city || ""}
            />
          </div>
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="phone"
            placeholder="Telephone"
            defaultValue={settings?.phone || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="email"
            placeholder="Email"
            defaultValue={settings?.email || ""}
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <input
              type="checkbox"
              name="vatApplicable"
              defaultChecked={settings?.vatApplicable || false}
            />
            TVA applicable
          </label>
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="vatRate"
            placeholder="Taux de TVA (%)"
            defaultValue={settings ? (settings.vatRateBps / 100).toFixed(2) : ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="paymentTerms"
            placeholder="Conditions de paiement"
            defaultValue={settings?.paymentTerms || "Paiement a reception"}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="latePaymentPenalty"
            placeholder="Penalites de retard (ex: 3x taux legal)"
            defaultValue={settings?.latePaymentPenalty || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="recoveryFee"
            placeholder="Indemnite forfaitaire (EUR)"
            defaultValue={settings ? (settings.recoveryFeeCents / 100).toFixed(2) : "40.00"}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="bankIban"
            placeholder="IBAN (optionnel)"
            defaultValue={settings?.bankIban || ""}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            name="bankBic"
            placeholder="BIC (optionnel)"
            defaultValue={settings?.bankBic || ""}
          />
        </div>
        {ribUrl && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4 text-sm text-[color:var(--muted)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Lien RIB / IBAN (PDF)
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className="w-full flex-1 rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs"
                value={ribUrl}
                readOnly
              />
              <button
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                type="button"
                data-copy={ribUrl}
              >
                Copier le lien
              </button>
            </div>
          </div>
        )}

        <button
          className="mt-6 rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
          type="submit"
        >
          Enregistrer
        </button>
      </form>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Export base de donnees</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Telechargez un export JSON complet pour sauvegarde ou migration.
        </p>
        <a
          className="mt-4 inline-flex rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)]"
          href="/admin/parametres/export"
        >
          Telecharger l'export
        </a>
      </div>

      <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-6">
        <h2 className="text-xl font-semibold text-rose-900">Reinitialiser les donnees</h2>
        <p className="mt-2 text-sm text-rose-900/80">
          Supprime clients, demandes, devis, reservations, factures, avis et spotlights.
          Le stock est conserve.
        </p>
        <form action={resetNonStockData} className="mt-4">
          <button
            className="rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(225,29,72,0.25)]"
            type="submit"
            data-action="reset-non-stock"
          >
            Supprimer les donnees de test
          </button>
        </form>
      </div>

      <Script id="copy-rib-link" strategy="afterInteractive">
        {`
          document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('[data-copy]')) return;
            const value = target.getAttribute('data-copy');
            if (!value) return;
            navigator.clipboard?.writeText(value);
            target.textContent = 'Copie';
            setTimeout(() => {
              target.textContent = 'Copier le lien';
            }, 1200);
          });
          document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('[data-action=\"reset-non-stock\"]')) return;
            if (!confirm('Supprimer tous les clients, demandes, devis, reservations, factures, avis et spotlights ?')) {
              event.preventDefault();
            }
          });
        `}
      </Script>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Parametres site</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Categories du catalogue et rubrique du moment.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Categories</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Nom, description et bandeau de chaque categorie.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {categories.map((category) => (
                <form
                  key={category.id}
                  action={updateCategory}
                  className="rounded-2xl border border-black/5 bg-white p-4"
                >
                  <input type="hidden" name="id" value={category.id} />
                  <div className="grid gap-3">
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="name"
                      defaultValue={category.name}
                      required
                    />
                    <textarea
                      className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="description"
                      placeholder="Phrase de presentation"
                      defaultValue={category.description ?? ""}
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="heroTitle"
                      placeholder="Titre du bandeau (optionnel)"
                      defaultValue={category.heroTitle ?? ""}
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="heroImageUrl"
                      placeholder="Image bandeau (ex: /vitrine/vaisselle-hero.jpg)"
                      defaultValue={category.heroImageUrl ?? ""}
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="sortOrder"
                      type="number"
                      defaultValue={category.sortOrder}
                    />
                    <button
                      className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                      type="submit"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Rubrique du moment</h3>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Jusqu'a 5 mises en avant visibles sur la page d'accueil.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {spotlights.map((spotlight) => (
                <form
                  key={spotlight.id}
                  action={updateSpotlight}
                  className="rounded-2xl border border-black/5 bg-white p-4"
                >
                  <input type="hidden" name="id" value={spotlight.id} />
                  <div className="grid gap-3">
                    <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={spotlight.active}
                      />
                      Actif
                    </label>
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="title"
                      placeholder="Titre"
                      defaultValue={spotlight.title}
                      required
                    />
                    <textarea
                      className="min-h-[100px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="description"
                      placeholder="Description"
                      defaultValue={spotlight.description ?? ""}
                    />
                    <AdminImageInput
                      name="imageData"
                      label="Image (auto-redimensionnee)"
                      initialUrl={spotlight.imageUrl ?? undefined}
                    />
                    <input type="hidden" name="imageUrl" value={spotlight.imageUrl ?? ""} />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="sortOrder"
                      type="number"
                      defaultValue={spotlight.sortOrder}
                    />
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                    type="submit"
                  >
                    Enregistrer
                  </button>
                  <button
                    className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700"
                    type="submit"
                    formAction={deleteSpotlight}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </form>
          ))}
            </div>
            {spotlights.length < 5 && (
              <form action={addSpotlight} className="mt-6 grid gap-3 md:max-w-2xl">
                <h4 className="text-sm font-semibold">Ajouter une mise en avant</h4>
                <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                  <input type="checkbox" name="active" defaultChecked />
                  Actif
                </label>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  name="title"
                  placeholder="Titre"
                  required
                />
                <textarea
                  className="min-h-[100px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  name="description"
                  placeholder="Description"
                />
                <AdminImageInput
                  name="imageData"
                  label="Image (auto-redimensionnee)"
                />
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  name="sortOrder"
                  type="number"
                  defaultValue="0"
                />
                <button
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                  type="submit"
                >
                  Ajouter
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
