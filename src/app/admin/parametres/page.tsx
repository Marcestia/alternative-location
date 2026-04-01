import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { saveCompanySettings } from "@/app/actions/settings";
import {
  addGalleryMedia,
  addGallerySection,
  deleteGalleryMedia,
  deleteGallerySection,
  updateGalleryMedia,
  updateGallerySection,
} from "@/app/actions/gallery";
import {
  addCategory,
  addSpotlight,
  deleteCategory,
  deleteSpotlight,
  updateCategory,
  updateSpotlight,
} from "@/app/actions/stock";
import AdminImageInput from "@/components/AdminImageInput";
import Script from "next/script";
import { CATEGORY_GROUP_META, CATEGORY_GROUP_ORDER } from "@/lib/catalog";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchParams = {
  saved?: string;
  gallery?: string;
  gallerySection?: string;
  category?: string;
};

const categoryGroupOptions = CATEGORY_GROUP_ORDER.map((group) => ({
  value: group,
  label: CATEGORY_GROUP_META[group].label,
}));

function Notice({ tone, children }: { tone: "success" | "warning"; children: ReactNode }) {
  const styles =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-amber-200 bg-amber-50 text-amber-800";

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-black/5 bg-white/85 p-6 shadow-[0_15px_30px_rgba(22,18,14,0.08)]"
    >
      <div className="border-b border-black/5 pb-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-[color:var(--muted)]">{description}</p>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const [settings, categories, spotlights, galleryMedia, gallerySections] = await Promise.all([
    prisma.companySetting.findUnique({ where: { id: "company" } }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.spotlight.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.galleryMedia.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.gallerySection.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const ribUrl = process.env.R2_PUBLIC_BASE_URL
    ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/documents/IBAN.pdf`
    : "";
  const groupedCategories = CATEGORY_GROUP_ORDER.map((group) => ({
    group,
    label: CATEGORY_GROUP_META[group].label,
    items: categories.filter((category) => category.group === group),
  })).filter((group) => group.items.length > 0);

  const notices = [
    resolvedParams?.saved === "1"
      ? { tone: "success" as const, text: "Parametres enregistres." }
      : null,
    resolvedParams?.saved === "0"
      ? { tone: "warning" as const, text: "Le nom de l'entreprise est obligatoire." }
      : null,
    resolvedParams?.category === "1"
      ? { tone: "success" as const, text: "Categorie enregistree." }
      : null,
    resolvedParams?.category === "deleted"
      ? { tone: "success" as const, text: "Categorie supprimee." }
      : null,
    resolvedParams?.category === "0"
      ? {
          tone: "warning" as const,
          text: "Verifiez le nom de la categorie avant d'enregistrer.",
        }
      : null,
    resolvedParams?.gallery === "1"
      ? { tone: "success" as const, text: "Element galerie enregistre." }
      : null,
    resolvedParams?.gallery === "deleted"
      ? { tone: "success" as const, text: "Element galerie supprime." }
      : null,
    resolvedParams?.gallery === "missing"
      ? {
          tone: "warning" as const,
          text: "Ajoutez une image ou une video avant d'enregistrer cet element.",
        }
      : null,
    resolvedParams?.gallery === "0"
      ? {
          tone: "warning" as const,
          text: "Verifiez les informations de la galerie avant d'enregistrer.",
        }
      : null,
    resolvedParams?.gallerySection === "1"
      ? { tone: "success" as const, text: "Section galerie enregistree." }
      : null,
    resolvedParams?.gallerySection === "deleted"
      ? { tone: "success" as const, text: "Section galerie supprimee." }
      : null,
    resolvedParams?.gallerySection === "0"
      ? {
          tone: "warning" as const,
          text: "Verifiez le nom de la section avant d'enregistrer.",
        }
      : null,
  ].filter(Boolean) as Array<{ tone: "success" | "warning"; text: string }>;

  const navItems = [
    { href: "#entreprise", label: "Entreprise", meta: "coordonnees" },
    { href: "#catalogue", label: "Catalogue", meta: `${categories.length} categories` },
    { href: "#accueil", label: "Accueil", meta: `${spotlights.length} mises en avant` },
    {
      href: "#galerie",
      label: "Galerie",
      meta: `${gallerySections.length} sections / ${galleryMedia.length} medias`,
    },
    { href: "#export", label: "Export", meta: "sauvegarde" },
  ];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/85 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Espace entreprise</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Parametres</h1>
            <p className="mt-2 max-w-2xl text-sm text-[color:var(--muted)]">
              Informations de reference pour l'entreprise, le catalogue, la page
              d'accueil et la galerie.
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-[color:var(--surface)]/80 px-4 py-3 text-sm text-[color:var(--muted)]">
            <p className="font-medium text-[color:var(--ink)]">Lecture simple</p>
            <p className="mt-1">1 bloc = 1 sujet. Modifiez, enregistrez, puis passez au suivant.</p>
          </div>
        </div>
      </header>

      <nav className="rounded-3xl border border-black/5 bg-white/80 p-3 shadow-[0_15px_30px_rgba(22,18,14,0.06)]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-black/5 bg-[color:var(--surface)]/80 px-4 py-3 transition hover:-translate-y-0.5 hover:border-black/10 hover:bg-white"
            >
              <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {item.meta}
              </div>
            </a>
          ))}
        </div>
      </nav>

      {notices.length ? (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Notice key={`${notice.tone}-${notice.text}`} tone={notice.tone}>
              {notice.text}
            </Notice>
          ))}
        </div>
      ) : null}

      <SectionShell
        id="entreprise"
        eyebrow="Entreprise"
        title="Identite et facturation"
        description="Coordonnees, mentions legales, TVA et regles de paiement."
      >
      <form
        action={saveCompanySettings}
        className="space-y-6"
      >
        <div>
          <h3 className="text-xl font-semibold">Parametres facturation</h3>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Informations legales et bancaires utilisees dans les devis, factures et emails.
          </p>
        </div>
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
      </SectionShell>

      <SectionShell
        id="export"
        eyebrow="Sauvegarde"
        title="Export base de donnees"
        description="Telechargez un export JSON complet pour sauvegarde ou migration."
      >
        <a
          className="inline-flex rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)]"
          href="/admin/parametres/export"
        >
          Telecharger l'export
        </a>
      </SectionShell>

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
        `}
      </Script>

      <SectionShell
        id="catalogue"
        eyebrow="Catalogue"
        title="Categories"
        description="Creez, modifiez ou supprimez les categories du catalogue. Vous pouvez aussi definir une image de bandeau pour chaque section."
      >
          <div className="rounded-2xl border border-black/5 bg-[color:var(--surface)]/50 p-5">
            <div className="mt-4 space-y-6">
              {groupedCategories.map((group) => (
                <div key={group.group} className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--accent-2)]">
                      Famille
                    </p>
                    <h4 className="mt-2 text-lg font-semibold">{group.label}</h4>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {group.items.map((category) => (
                      <form
                        key={category.id}
                        action={updateCategory}
                        className="rounded-2xl border border-black/5 bg-white p-4"
                      >
                        <input type="hidden" name="id" value={category.id} />
                        <div className="grid gap-3">
                          <select
                            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                            name="group"
                            defaultValue={category.group}
                          >
                            {categoryGroupOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
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
                          <AdminImageInput
                            name="heroImageData"
                            label="Image de bandeau"
                            initialUrl={category.heroImageUrl ?? undefined}
                          />
                          <input type="hidden" name="heroImageUrl" value={category.heroImageUrl ?? ""} />
                          <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                            <input type="checkbox" name="clearHeroImage" />
                            Retirer l'image actuelle
                          </label>
                          <input
                            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                            name="sortOrder"
                            type="number"
                            defaultValue={category.sortOrder}
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
                              formAction={deleteCategory}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </form>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <form action={addCategory} className="mt-6 grid gap-3 rounded-2xl border border-dashed border-black/10 bg-white p-5 md:max-w-2xl">
              <h4 className="text-sm font-semibold">Ajouter une categorie</h4>
              <select
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="group"
                defaultValue="MATERIEL_SERVICE"
              >
                {categoryGroupOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="name"
                placeholder="Nom de la categorie"
                required
              />
              <textarea
                className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="description"
                placeholder="Phrase de presentation"
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="heroTitle"
                placeholder="Titre du bandeau (optionnel)"
              />
              <AdminImageInput name="heroImageData" label="Image de bandeau" />
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
          </div>
      </SectionShell>

      <SectionShell
        id="accueil"
        eyebrow="Page d'accueil"
        title="Rubrique du moment"
        description="Mises en avant visibles sur la page d'accueil, sans limite fixe."
      >
          <div className="rounded-2xl border border-black/5 bg-[color:var(--surface)]/50 p-5">
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
            <form action={addSpotlight} className="mt-6 grid gap-3 rounded-2xl border border-dashed border-black/10 bg-white p-5 md:max-w-2xl">
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
          </div>
      </SectionShell>

      <SectionShell
        id="galerie"
        eyebrow="Galerie"
        title="Sections et medias"
        description="Creez des sections, ajoutez vos photos ou videos, puis retirez les blocs ou medias que vous ne voulez plus afficher."
      >
          <div className="rounded-2xl border border-black/5 bg-[color:var(--surface)]/50 p-5">

            <div className="mt-6">
              <h4 className="text-sm font-semibold">Sections galerie</h4>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {gallerySections.map((section) => (
                  <form
                    key={section.id}
                    action={updateGallerySection}
                    encType="multipart/form-data"
                    className="rounded-2xl border border-black/5 bg-white p-4"
                  >
                    <input type="hidden" name="id" value={section.id} />
                    <input type="hidden" name="coverImageUrl" value={section.coverImageUrl ?? ""} />
                    <div className="grid gap-3">
                      <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                        <input type="checkbox" name="active" defaultChecked={section.active} />
                        Actif
                      </label>
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        name="name"
                        defaultValue={section.name}
                        placeholder="Nom de la section"
                        required
                      />
                      <textarea
                        className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        name="description"
                        placeholder="Description courte"
                        defaultValue={section.description ?? ""}
                      />
                      <AdminImageInput
                        name="coverImageData"
                        label="Image de couverture"
                        initialUrl={section.coverImageUrl ?? undefined}
                      />
                      <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                        <input type="checkbox" name="clearCoverImage" />
                        Retirer l'image actuelle
                      </label>
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        name="sortOrder"
                        type="number"
                        defaultValue={section.sortOrder}
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
                          formAction={deleteGallerySection}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </form>
                ))}
              </div>

              <form
                action={addGallerySection}
                encType="multipart/form-data"
                className="mt-6 grid gap-3 rounded-2xl border border-dashed border-black/10 bg-white p-5 md:max-w-2xl"
              >
                <h5 className="text-sm font-semibold">Ajouter une section</h5>
                <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                  <input type="checkbox" name="active" defaultChecked />
                  Actif
                </label>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  name="name"
                  placeholder="Nom de la section"
                  required
                />
                <textarea
                  className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  name="description"
                  placeholder="Description courte"
                />
                <AdminImageInput
                  name="coverImageData"
                  label="Image de couverture"
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
                  Ajouter la section
                </button>
              </form>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {galleryMedia.map((media) => (
                <form
                  key={media.id}
                  action={updateGalleryMedia}
                  encType="multipart/form-data"
                  className="rounded-2xl border border-black/5 bg-white p-4"
                >
                  <input type="hidden" name="id" value={media.id} />
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                        <input
                          type="checkbox"
                          name="active"
                          defaultChecked={media.active}
                        />
                        Actif
                      </label>
                      <select
                        name="type"
                        defaultValue={media.type}
                        className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
                      >
                        <option value="IMAGE">Photo</option>
                        <option value="VIDEO">Video</option>
                      </select>
                      <select
                        name="sectionId"
                        defaultValue={media.sectionId ?? ""}
                        className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
                      >
                        <option value="">Sans section</option>
                        {gallerySections.map((section) => (
                          <option key={section.id} value={section.id}>
                            {section.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="title"
                      placeholder="Titre"
                      defaultValue={media.title}
                      required
                    />
                    <textarea
                      className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="subtitle"
                      placeholder="Sous-titre"
                      defaultValue={media.subtitle ?? ""}
                    />

                    {media.type === "IMAGE" ? (
                      <div className="overflow-hidden rounded-2xl border border-black/5 bg-[color:var(--surface)]">
                        <img
                          src={media.mediaUrl}
                          alt={media.title}
                          className="h-48 w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-black/5 bg-[color:var(--surface)] p-3">
                        {media.posterUrl ? (
                          <img
                            src={media.posterUrl}
                            alt={media.title}
                            className="h-44 w-full rounded-xl object-cover"
                          />
                        ) : (
                          <video
                            src={media.mediaUrl}
                            className="h-44 w-full rounded-xl object-cover"
                            muted
                            playsInline
                            controls
                          />
                        )}
                      </div>
                    )}

                    <AdminImageInput
                      name="imageData"
                      label="Photo (pour un element Photo)"
                      initialUrl={media.type === "IMAGE" ? media.mediaUrl : undefined}
                    />
                    <input type="hidden" name="mediaUrl" value={media.mediaUrl} />

                    <div className="grid gap-2 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                        Video
                      </p>
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        name="videoUrl"
                        placeholder="URL video existante (optionnel)"
                        defaultValue={media.type === "VIDEO" ? media.mediaUrl : ""}
                      />
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--ink)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                        name="videoFile"
                        type="file"
                        accept="video/*"
                      />
                      <AdminImageInput
                        name="posterData"
                        label="Poster video (optionnel)"
                        initialUrl={media.posterUrl ?? undefined}
                      />
                    </div>

                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="sortOrder"
                      type="number"
                      defaultValue={media.sortOrder}
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
                        formAction={deleteGalleryMedia}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </form>
              ))}
            </div>

            <form
              action={addGalleryMedia}
              encType="multipart/form-data"
              className="mt-6 grid gap-3 rounded-2xl border border-dashed border-black/10 bg-white p-5 md:max-w-3xl"
            >
              <h4 className="text-sm font-semibold">Ajouter un element galerie</h4>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
                  <input type="checkbox" name="active" defaultChecked />
                  Actif
                </label>
                <select
                  name="type"
                  defaultValue="IMAGE"
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
                >
                  <option value="IMAGE">Photo</option>
                  <option value="VIDEO">Video</option>
                </select>
                <select
                  name="sectionId"
                  defaultValue=""
                  className="rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
                >
                  <option value="">Sans section</option>
                  {gallerySections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="title"
                placeholder="Titre"
                required
              />
              <textarea
                className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="subtitle"
                placeholder="Sous-titre"
              />
              <AdminImageInput
                name="imageData"
                label="Photo (pour un element Photo)"
              />
              <div className="grid gap-2 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Video
                </p>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  name="videoUrl"
                  placeholder="URL video existante (optionnel)"
                />
                <input
                  className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--ink)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
                  name="videoFile"
                  type="file"
                  accept="video/*"
                />
                <AdminImageInput
                  name="posterData"
                  label="Poster video (optionnel)"
                />
              </div>
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
          </div>
      </SectionShell>
    </section>
  );
}
