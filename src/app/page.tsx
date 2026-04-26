import GalleryPreviewSection from "@/components/GalleryPreviewSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactRequestForm from "@/components/ContactRequestForm";
import { submitReviewPublic } from "@/app/actions/reviews";
import { CATEGORY_GROUP_META, CATEGORY_GROUP_ORDER } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { sampleGalleryItems } from "@/lib/gallery";
import heroImage from "./hero.png";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const steps = [
  {
    title: "Vous remplissez le formulaire",
    text: "Vous nous indiquez vos dates, le lieu, le type d'événement et les articles souhaités. Plus votre demande est précise, plus le devis est rapide à préparer.",
  },
  {
    title: "Nous préparons votre devis",
    text: "Nous vérifions les disponibilités et nous vous envoyons un devis personnalisé, accompagné des conditions générales.",
  },
  {
    title: "Vous validez la réservation",
    text: "Vous signez le devis en ligne. La réservation est ensuite confirmée, avec un acompte de 30 % à régler sous 7 jours.",
  },
  {
    title: "Retrait ou livraison",
    text: "Nous organisons le retrait sur place ou la livraison selon votre besoin. Le solde et la caution sont demandés avant la remise du matériel.",
  },
];

function UniverseIcon({ slug }: { slug: string }) {
  const iconClass = "h-11 w-11 text-[color:var(--accent-2)]/90";
  const normalizedSlug = slug.toLowerCase();

  if (/decor|mobilier/.test(normalizedSlug)) {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={iconClass} aria-hidden="true">
        <path
          d="M20 31c3-9 8-14 12-14s9 5 12 14"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M24 24c3 3 4 6 4 9a4 4 0 1 1-8 0c0-3 1-6 4-9ZM40 24c3 3 4 6 4 9a4 4 0 1 1-8 0c0-3 1-6 4-9ZM32 18c4 4 6 8 6 12a6 6 0 1 1-12 0c0-4 2-8 6-12Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M32 37v12M25 49h14"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M16 28c-3 2-5 5-5 9 0 7 9 12 21 12s21-5 21-12c0-4-2-7-5-9"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (/vaisselle/.test(normalizedSlug)) {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={iconClass} aria-hidden="true">
        <path
          d="M20 13v18c0 4 3 7 7 7v13M15 13v10c0 4 3 7 7 7s7-3 7-7V13"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M43 13c4 0 6 5 6 10v28M43 13c-4 0-6 5-6 10 0 6 3 10 6 10"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (/electro/.test(normalizedSlug)) {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={iconClass} aria-hidden="true">
        <rect x="18" y="12" width="28" height="40" rx="8" stroke="currentColor" strokeWidth="1.9" />
        <path
          d="M24 18h16M28 12v6M36 12v6"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M24 32h16M24 38h10"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          d="M34 23l-5 8h4l-3 9 7-10h-4l4-7Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (/materiel-service/.test(normalizedSlug)) {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={iconClass} aria-hidden="true">
        <path
          d="M18 23h28a6 6 0 0 1 6 6v13a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V29a6 6 0 0 1 6-6Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
        <path
          d="M24 18h16M20 32h24M24 46v4M40 46v4"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (/ambi|sono/.test(normalizedSlug)) {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={iconClass} aria-hidden="true">
        <rect x="19" y="12" width="26" height="40" rx="8" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="32" cy="24" r="4.5" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="32" cy="39" r="8" stroke="currentColor" strokeWidth="1.9" />
        <path
          d="M49 25c2 1 4 4 4 7s-2 6-4 7M15 25c-2 1-4 4-4 7s2 6 4 7"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (/even/.test(normalizedSlug)) {
    return (
      <svg viewBox="0 0 64 64" fill="none" className={iconClass} aria-hidden="true">
        <path
          d="M17 19h30a4 4 0 0 1 4 4v19a4 4 0 0 1-4 4H17a4 4 0 0 1-4-4V23a4 4 0 0 1 4-4Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 27h13M21 33h9M40 29a5 5 0 1 0 0 .1ZM44 36l4 4"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64" fill="none" className={iconClass} aria-hidden="true">
      <path
        d="M18 44V28a14 14 0 0 1 28 0v16M15 44h34M24 44v6M40 44v6M24 28h16"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UniverseCard({
  category,
  className = "",
}: {
  category: {
    id: string;
    name: string;
    description: string;
    slug?: string;
  };
  className?: string;
}) {
  const categorySlug = category.slug ?? slugify(category.name);

  return (
    <a
      href={`/catalogue#group-${categorySlug}`}
      className={`group flex min-h-[220px] flex-col items-center rounded-[28px] border border-[#f1e4da] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,242,235,0.92))] px-5 py-6 text-center shadow-[0_20px_40px_rgba(30,25,20,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[color:var(--accent-2)]/30 hover:shadow-[0_28px_50px_rgba(30,25,20,0.1)] ${className}`}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ead9cb] bg-white/92 shadow-[0_12px_24px_rgba(30,25,20,0.06)] transition duration-300 group-hover:scale-105">
        <UniverseIcon slug={categorySlug} />
      </div>
      <p className="mt-5 text-xl font-semibold leading-tight text-[color:var(--ink)]">
        {category.name}
      </p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
        {category.description || "Découvrez la sélection disponible."}
      </p>
    </a>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string; review?: string }>;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: siteConfig.name,
    alternateName: siteConfig.alternateName,
    url: siteUrl,
    telephone: siteConfig.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: "14 impasse Moustron",
      addressLocality: siteConfig.city,
      postalCode: siteConfig.postalCode,
      addressCountry: "FR",
    },
    areaServed: [
      {
        "@type": "Place",
        name: "Galgon (33133)",
      },
      {
        "@type": "Place",
        name: "Rayon de 100 km autour de Galgon",
      },
    ],
    description:
      "Location de vaisselle, décoration, mobilier et sonorisation pour tous vos événements festifs.",
    priceRange: "EUR",
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Location de vaisselle",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Location de décoration et mobilier",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Location de sonorisation et ambiance",
        },
      },
    ],
  };

  const resolvedParams = searchParams ? await searchParams : undefined;
  const sentStatus = resolvedParams?.sent;
  const reviewStatus = resolvedParams?.review;

  const [settings, categories, reviews, galleryMedia] = await Promise.all([
    prisma.companySetting.findUnique({
      where: { id: "company" },
      select: { catalogRequestEnabled: true },
    }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.review.findMany({
      where: { status: { not: "REJECTED" } },
      include: { images: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
    prisma.galleryMedia.findMany({
      where: { active: true },
      include: { section: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
  ]);

  const displayCategories = CATEGORY_GROUP_ORDER.filter((group) =>
    categories.some((category) => category.group === group)
  ).map((group) => ({
    id: group,
    name: CATEGORY_GROUP_META[group].label,
    description: CATEGORY_GROUP_META[group].description,
    slug: CATEGORY_GROUP_META[group].slug,
  }));

  const whatsappNumber = siteConfig.whatsapp.replace(/\D/g, "");
  const displayGalleryMedia =
    galleryMedia.length > 0
      ? galleryMedia.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          type: item.type,
          mediaUrl: item.mediaUrl,
          posterUrl: item.posterUrl,
          sortOrder: item.sortOrder,
          sectionId: item.sectionId,
          sectionName: item.section?.name ?? null,
        }))
      : sampleGalleryItems;

  return (
    <div className="min-h-screen text-[15px] text-[color:var(--ink)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessSchema),
        }}
      />

      <header className="px-4 pt-4 sm:px-6 sm:pt-6 lg:absolute lg:left-0 lg:right-0 lg:top-0 lg:z-20 lg:pt-0">
        <div className="mx-auto w-full max-w-6xl rounded-[28px] border border-white/70 bg-white/88 px-4 py-4 shadow-[0_20px_60px_rgba(36,26,18,0.08)] backdrop-blur sm:px-6 lg:mx-0 lg:max-w-none lg:rounded-b-[28px] lg:rounded-t-none lg:border-x-0 lg:border-t-0 lg:bg-white/72 lg:px-12 lg:py-6">
          <div className="flex items-center justify-between gap-4">
            <a className="min-w-0 flex items-center gap-3" href="/">
              <img
                src="/logo.png"
                alt="Alternative Location"
                className="h-12 w-auto sm:h-14"
              />
              <div className="min-w-0 leading-tight">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  {siteConfig.location}
                </p>
                <p className="truncate text-base font-semibold sm:text-lg">
                  {siteConfig.name}
                </p>
              </div>
            </a>

            <nav className="hidden items-center gap-3 text-sm font-medium text-[color:var(--muted)] md:flex">
              <a
                className="rounded-full border border-black/10 bg-white/70 px-4 py-2 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:text-[color:var(--ink)] hover:shadow-[0_10px_24px_rgba(30,25,20,0.08)]"
                href="#univers"
              >
                Univers
              </a>
              <a
                className="rounded-full border border-black/10 bg-white/70 px-4 py-2 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:text-[color:var(--ink)] hover:shadow-[0_10px_24px_rgba(30,25,20,0.08)]"
                href="/catalogue"
              >
                Catalogue
              </a>
              <a
                className="rounded-full border border-black/10 bg-white/70 px-4 py-2 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:text-[color:var(--ink)] hover:shadow-[0_10px_24px_rgba(30,25,20,0.08)]"
                href="/galerie"
              >
                Galerie
              </a>
              <a
                className="rounded-full border border-black/10 bg-white/70 px-4 py-2 transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white hover:text-[color:var(--ink)] hover:shadow-[0_10px_24px_rgba(30,25,20,0.08)]"
                href="#contact"
              >
                Contact
              </a>
            </nav>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-sm font-medium text-[color:var(--muted)] md:hidden">
            <div className="col-span-4 -mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
              <a
                className="min-w-fit snap-start rounded-full border border-black/10 bg-white px-4 py-2 text-center transition active:scale-[0.98]"
                href="#univers"
              >
                Univers
              </a>
              <a
                className="min-w-fit snap-start rounded-full border border-black/10 bg-white px-4 py-2 text-center transition active:scale-[0.98]"
                href="/catalogue"
              >
                Catalogue
              </a>
              <a
                className="min-w-fit snap-start rounded-full border border-black/10 bg-white px-4 py-2 text-center transition active:scale-[0.98]"
                href="/galerie"
              >
                Galerie
              </a>
              <a
                className="min-w-fit snap-start rounded-full bg-[color:var(--ink)] px-4 py-2 text-center text-white transition active:scale-[0.98]"
                href="#contact"
              >
                Contact
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="pb-14 pt-4 sm:pt-6 lg:pt-0">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:max-w-none lg:px-0">
          <div className="lg:hidden">
            <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/88 shadow-[0_28px_60px_rgba(30,25,20,0.12)]">
              <img
                src={heroImage.src}
                alt="Alternative Location"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(250,245,240,0.06),rgba(248,241,234,0.26)_30%,rgba(244,236,228,0.88)_74%,rgba(244,236,228,0.98)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,125,106,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(216,111,63,0.18),transparent_42%)]" />
              <div className="relative flex min-h-[74svh] flex-col justify-end px-4 py-4 sm:px-5 sm:py-5">
                <div className="rounded-[28px] border border-white/80 bg-white/68 p-5 shadow-[0_24px_48px_rgba(30,25,20,0.12)] backdrop-blur-lg sm:p-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/88 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[color:var(--accent)] shadow-[0_10px_22px_rgba(30,25,20,0.05)]">
                    Location événementielle
                  </div>

                  <div className="mt-5 space-y-5">
                    <div className="space-y-3">
                      <h1 className="max-w-[10ch] text-[3rem] font-semibold leading-[0.9] sm:max-w-[11ch] sm:text-[3.8rem]">
                        Tout pour sublimer vos événements.
                      </h1>
                      <p className="max-w-[30rem] text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                        {siteConfig.description}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <a
                        className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.22)] transition active:scale-[0.99]"
                        href="/catalogue"
                      >
                        Consulter le catalogue
                      </a>
                      <a
                        className="rounded-full border border-[color:var(--ink)]/10 bg-white/90 px-6 py-3 text-center text-sm font-semibold text-[color:var(--ink)] shadow-[0_12px_24px_rgba(30,25,20,0.05)] backdrop-blur transition active:scale-[0.99]"
                        href="#contact"
                      >
                        Nous contacter
                      </a>
                    </div>
                    <div className="rounded-2xl border border-white/75 bg-white/72 px-4 py-3 text-sm leading-6 text-[color:var(--muted)] shadow-[0_10px_22px_rgba(30,25,20,0.05)]">
                      À Galgon et alentours. Retrait sur place ou livraison selon vos besoins.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative h-[100svh] w-full overflow-hidden rounded-b-[40px]">
              <img
                src={heroImage.src}
                alt="Alternative Location"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,245,240,0.96)_0%,rgba(250,245,240,0.72)_42%,rgba(250,245,240,0.08)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,111,63,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(46,125,106,0.14),transparent_35%)]" />
              <div className="relative z-10 flex h-full items-center px-12 pt-20 xl:px-16">
                <div className="max-w-[720px] rounded-[36px] border border-white/75 bg-white/58 p-10 shadow-[0_28px_70px_rgba(30,25,20,0.14)] backdrop-blur-md xl:p-12">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/75 bg-white/82 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--accent)] shadow-[0_12px_30px_rgba(30,25,20,0.06)]">
                    Location événementielle
                  </div>
                  <h1 className="mt-6 text-7xl font-semibold leading-[0.96] xl:text-[5.6rem]">
                    Tout pour sublimer vos événements.
                  </h1>
                  <p className="mt-5 max-w-3xl text-xl leading-8 text-[color:var(--muted)]">
                    {siteConfig.description}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <a
                      className="rounded-full bg-[color:var(--accent)] px-8 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)] transition hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_24px_40px_rgba(216,111,63,0.25)]"
                      href="/catalogue"
                    >
                      Voir le catalogue
                    </a>
                    <a
                      className="rounded-full border border-[color:var(--ink)]/15 bg-white/88 px-8 py-4 text-center text-sm font-semibold text-[color:var(--ink)] shadow-[0_14px_28px_rgba(30,25,20,0.06)] transition hover:-translate-y-0.5 hover:scale-[1.02] hover:border-[color:var(--ink)]/30"
                      href="#contact"
                    >
                      Parler du projet
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="univers"
          className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:mt-12 lg:px-12"
        >
          <div className="relative overflow-hidden rounded-[34px] border border-black/5 bg-white/90 p-5 shadow-[0_30px_60px_rgba(30,25,20,0.12)] sm:rounded-[40px] sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(209,186,164,0.18),_transparent_68%)]" />
            <div className="relative">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
                  Univers
                </p>
                <h2 className="mt-3 text-2xl font-semibold sm:text-3xl md:text-4xl">
                  Tout pour votre événement
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)] sm:text-base">
                  Choisissez une famille puis accédez directement à la bonne
                  section du catalogue.
                </p>
              </div>
              <div className="mt-8 md:hidden">
                <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
                  {displayCategories.map((category) => (
                    <UniverseCard
                      key={category.id}
                      category={category}
                      className="min-w-[82vw] snap-start"
                    />
                  ))}
                </div>
              </div>
              <div className="mt-8 hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {displayCategories.map((category) => (
                  <UniverseCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <GalleryPreviewSection items={displayGalleryMedia} />

        <section
          id="contact"
          className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:mt-12 lg:px-12"
        >
          <div className="rounded-[34px] border border-black/5 bg-white/90 p-5 shadow-[0_30px_60px_rgba(30,25,20,0.12)] sm:rounded-[40px] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
              <div className="h-full rounded-[28px] border border-black/5 bg-white/80 p-5 sm:rounded-[32px] sm:p-8">
                <h2 className="text-2xl font-semibold sm:text-3xl">
                  Nous contacter
                </h2>
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Décrivez votre besoin, vos dates et les articles souhaités.
                </p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  La réservation est confirmée après validation du devis et
                  versement d&apos;un acompte de 30 % sous 7 jours.
                </p>

                <ContactRequestForm
                  sentStatus={sentStatus}
                  catalogRequestEnabled={settings?.catalogRequestEnabled ?? false}
                />

                <div className="mt-6 space-y-3 text-sm text-[color:var(--muted)]">
                  <p>
                    <strong className="text-[color:var(--ink)]">Téléphone</strong>{" "}
                    :{" "}
                    <a
                      href={`tel:${siteConfig.phone.replace(/\s+/g, "")}`}
                      className="underline-offset-4 transition hover:text-[color:var(--ink)] hover:underline"
                    >
                      {siteConfig.phone}
                    </a>
                  </p>
                  <p>
                    <strong className="text-[color:var(--ink)]">Email</strong> :{" "}
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="underline-offset-4 transition hover:text-[color:var(--ink)] hover:underline"
                    >
                      {siteConfig.email}
                    </a>
                  </p>
                  <p>
                    <strong className="text-[color:var(--ink)]">Adresse</strong>{" "}
                    : {siteConfig.address}
                  </p>
                </div>
              </div>

              <div className="h-full rounded-[28px] border border-black/5 bg-[color:var(--surface-2)] p-5 sm:rounded-[32px] sm:p-8">
                <div className="grid gap-4 sm:gap-5">
                  <div className="rounded-[24px] bg-white/72 p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Comment ça se passe ?
                  </p>
                  <ol className="mt-4 grid gap-3">
                    {steps.map((step, index) => (
                      <li
                        key={step.title}
                        className="rounded-[20px] border border-black/6 bg-white/80 p-4 text-sm leading-6 text-[color:var(--muted)]"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
                          Étape {index + 1}
                        </p>
                        <p className="mt-2 font-semibold text-[color:var(--ink)]">
                          {step.title}
                        </p>
                        <p className="mt-2">{step.text}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="rounded-[24px] bg-white/72 p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Horaires
                  </p>
                  <div className="mt-2 space-y-2 text-sm text-[color:var(--muted)]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Lundi</span>
                      <span>09:00 - 18:30</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Mardi</span>
                      <span>09:00 - 18:30</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Mercredi</span>
                      <span>09:00 - 18:30</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Jeudi</span>
                      <span>09:00 - 18:30</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Vendredi</span>
                      <span>09:00 - 18:00</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Samedi</span>
                      <span>Ferme</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Dimanche</span>
                      <span>Ferme</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white/72 p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Services
                  </p>
                  <div className="mt-2 space-y-2 text-sm font-medium">
                    <p>
                      Retrait sur place ou livraison possible à partir de 1 EUR / km,
                      selon la distance.
                    </p>
                    <p>Paiement possible par virement, chèque ou espèces.</p>
                    <p>
                      Le matériel est restitué après l&apos;événement, puis contrôlé
                      avant restitution de la caution.
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] bg-white/80 p-4 text-sm text-[color:var(--muted)] sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <a
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white sm:justify-start"
                      href="https://www.facebook.com/p/Alternative-location-100063656164530/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1877F2] text-sm font-bold text-white">
                        f
                      </span>
                      <span>Facebook</span>
                    </a>
                    <a
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white sm:justify-start"
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-[11px] font-bold text-white">
                        WA
                      </span>
                      <span>WhatsApp</span>
                    </a>
                  </div>
                  <a
                    className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[color:var(--accent)] underline-offset-4 transition hover:underline"
                    href="https://www.google.com/maps/search/?api=1&query=14+impasse+Moustron,+33133+Galgon,+France"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--surface)] text-[11px] font-bold text-[color:var(--accent)]">
                      M
                    </span>
                    <span>Voir l&apos;adresse sur Google Maps</span>
                  </a>
                </div>
              </div>
              </div>
            </div>
          </div>
        </section>

        <ReviewsSection
          reviews={reviews}
          reviewStatus={reviewStatus}
          onSubmit={submitReviewPublic}
        />

        <section className="sr-only">
          <div className="rounded-[32px] border border-black/5 bg-white/80 p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Location événementielle à Galgon
            </p>
            <h2 className="mt-3 text-3xl font-semibold">
              Tout pour vos événements : vaisselle, décoration, mobilier et sonorisation.
            </h2>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--muted)]">
              <p>
                Alternative Location accompagne mariages, anniversaires, fêtes
                de famille et événements professionnels à Galgon (33133) et dans
                un rayon de 150 km.
              </p>
              <p>
                Nous proposons la location de vaisselle, décoration, mobilier,
                ambiance et sonorisation avec un service simple et fiable.
              </p>
              <p>
                Retrait sur place à Galgon ou livraison possible à partir de 1
                EUR / km selon disponibilités.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


