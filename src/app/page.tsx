import Script from "next/script";
import SpotlightCarousel from "@/components/SpotlightCarousel";
import DateRangePicker from "@/components/DateRangePicker";
import ReviewsSection from "@/components/ReviewsSection";
import ContactSubmitButton from "@/components/ContactSubmitButton";
import { createContactRequest } from "@/app/actions/contact";
import { submitReviewPublic } from "@/app/actions/reviews";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const steps = [
  {
    title: "Choisir",
    text: "Parcourez notre catalogue et repérez les articles adaptés à votre événement.",
  },
  {
    title: "Demander",
    text: "Envoyez votre demande avec les dates, le lieu et les quantités souhaitées via le formulaire de contact.",
  },
  {
    title: "Valider",
    text: "Le devis signé et l’acompte de 30 % sous 7 jours confirment la réservation.",
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

  const [spotlights, categories, reviews] = await Promise.all([
    prisma.spotlight.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
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
  ]);

  const categoryImages: Record<string, string> = {
    vaisselle: "/vitrine/vaisselle.jpg",
    decoration: "/vitrine/mobilier.jpg",
    mobilier: "/vitrine/mobilier.jpg",
    meuble: "/vitrine/mobilier.jpg",
    electro: "/vitrine/electromenager.jpg",
    electromenager: "/vitrine/electromenager.jpg",
    ambiance: "/vitrine/ambiance.jpg",
  };

  const normalizedCategories = categories.map((category) => ({
    ...category,
    slug: slugify(category.name),
  }));

  const decorCategories = normalizedCategories.filter((category) =>
    /decor|mobilier|meuble/i.test(category.slug)
  );
  const otherCategories = normalizedCategories.filter(
    (category) => !/decor|mobilier|meuble/i.test(category.slug)
  );

  const decorInsertIndex = decorCategories.length
    ? Math.min(
        ...decorCategories.map((category) =>
          normalizedCategories.findIndex((entry) => entry.id === category.id)
        )
      )
    : -1;

  const decorDescription =
    decorCategories.find((category) => category.description)?.description ||
    "Tables, chaises, housses, centres de table et ambiances.";
  const decorHero =
    decorCategories.find((category) => category.heroImageUrl)?.heroImageUrl ||
    categoryImages.decoration;

  const displayCategories = decorCategories.length
    ? [
        ...otherCategories.slice(0, decorInsertIndex),
        {
          id: "decor-mobilier",
          name: "Décoration & mobilier",
          description: decorDescription,
          heroImageUrl: decorHero,
          slug: "decoration-mobilier",
        },
        ...otherCategories.slice(decorInsertIndex),
      ]
    : otherCategories;

  const whatsappNumber = siteConfig.whatsapp.replace(/\D/g, "");

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
                href="#contact"
              >
                Contact
              </a>
            </nav>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-medium text-[color:var(--muted)] md:hidden">
            <a
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-center transition active:scale-[0.98]"
              href="#univers"
            >
              Univers
            </a>
            <a
              className="rounded-full border border-black/10 bg-white px-3 py-2 text-center transition active:scale-[0.98]"
              href="/catalogue"
            >
              Catalogue
            </a>
            <a
              className="rounded-full bg-[color:var(--ink)] px-3 py-2 text-center text-white transition active:scale-[0.98]"
              href="#contact"
            >
              Contact
            </a>
          </div>
        </div>
      </header>

      <main className="pb-14 pt-4 sm:pt-6 lg:pt-0">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:max-w-none lg:px-0">
          <div className="lg:hidden">
            <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-white/88 px-5 py-6 shadow-[0_28px_60px_rgba(30,25,20,0.12)]">
              <div className="pointer-events-none absolute -right-12 -top-10 h-28 w-28 rounded-full bg-[color:var(--accent-2)]/25 blur-3xl" />
              <div className="pointer-events-none absolute -left-10 bottom-8 h-36 w-36 rounded-full bg-[color:var(--accent)]/18 blur-3xl" />
              <div className="relative space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface)] px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[color:var(--accent)]">
                  Location événementielle
                </div>
                <h1 className="max-w-[12ch] text-4xl font-semibold leading-[0.95] sm:max-w-none sm:text-5xl">
                  Une scénographie complète pour vos événements.
                </h1>
                <p className="max-w-xl text-sm text-[color:var(--muted)] sm:text-base">
                  {siteConfig.description}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)]"
                    href="/catalogue"
                  >
                    Consulter le catalogue
                  </a>
                  <a
                    className="rounded-full border border-[color:var(--ink)]/20 bg-white/80 px-6 py-3 text-center text-sm font-semibold text-[color:var(--ink)]"
                    href="#contact"
                  >
                    Nous contacter
                  </a>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/90 shadow-[0_20px_50px_rgba(30,25,20,0.12)]">
                  <div className="h-[320px] p-3 sm:h-[380px]">
                    {spotlights.length > 0 ? (
                      <SpotlightCarousel items={spotlights} />
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-[24px] bg-[color:var(--surface-2)] p-4 text-center text-xs text-[color:var(--muted)]">
                        Ajoutez une rubrique "Du moment" depuis l'admin.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[26px] bg-[color:var(--surface-2)] p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
                      Nos atouts
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                      <li>Devis clair et rapide</li>
                      <li>Retrait ou livraison</li>
                      <li>Caution et paiements gérés hors ligne</li>
                    </ul>
                  </div>
                  <div className="rounded-[26px] bg-white/88 p-5">
                    <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--muted)]">
                      Comment ça marche
                    </p>
                    <ol className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                      <li>1. Parcourez le catalogue</li>
                      <li>2. Contactez-nous avec vos dates</li>
                      <li>3. Devis signe + acompte 30% sous 7 jours</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative h-[100svh] w-full overflow-hidden rounded-b-[40px]">
              <img
                src="/vitrine/hero.jpg"
                alt="Alternative Location"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/65 to-white/25" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,111,63,0.18),transparent_45%)]" />
              <div className="relative z-10 flex h-full items-end px-12 pb-16">
                <div className="max-w-3xl space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--accent)] shadow-[0_12px_30px_rgba(30,25,20,0.08)]">
                    Location evenementielle
                  </div>
                  <h1 className="text-5xl font-semibold leading-tight">
                    Une scénographie complète pour vos événements
                  </h1>
                  <p className="max-w-2xl text-lg text-[color:var(--muted)]">
                    {siteConfig.description}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      className="rounded-full bg-[color:var(--accent)] px-8 py-4 text-center text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)] transition hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_24px_40px_rgba(216,111,63,0.25)]"
                      href="/catalogue"
                    >
                      Voir le catalogue
                    </a>
                    <a
                      className="rounded-full border border-[color:var(--ink)]/20 bg-white/80 px-8 py-4 text-center text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:scale-[1.02] hover:border-[color:var(--ink)]/40"
                      href="#contact"
                    >
                      Parler du projet
                    </a>
                  </div>
                </div>
              </div>
              <div className="absolute right-10 top-1/2 w-[620px] -translate-y-1/2 xl:w-[720px]">
                <div className="h-[520px] overflow-hidden xl:h-[620px]">
                  {spotlights.length > 0 ? (
                    <SpotlightCarousel items={spotlights} />
                  ) : (
                    <div className="rounded-2xl bg-[color:var(--surface-2)] p-4 text-xs text-[color:var(--muted)]">
                      Ajoutez une rubrique "Du moment" depuis l'admin.
                    </div>
                  )}
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
                  Choisissez une famille puis accedez directement a la bonne
                  section du catalogue.
                </p>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {displayCategories.map((category) => {
                  const categorySlug = category.slug ?? slugify(category.name);

                  return (
                    <a
                      key={category.id}
                      href={`/catalogue#cat-${categorySlug}`}
                      className="group flex min-h-[220px] flex-col items-center rounded-[28px] border border-[#f1e4da] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,242,235,0.92))] px-5 py-6 text-center shadow-[0_20px_40px_rgba(30,25,20,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[color:var(--accent-2)]/30 hover:shadow-[0_28px_50px_rgba(30,25,20,0.1)]"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ead9cb] bg-white/92 shadow-[0_12px_24px_rgba(30,25,20,0.06)] transition duration-300 group-hover:scale-105">
                        <UniverseIcon slug={categorySlug} />
                      </div>
                      <p className="mt-5 text-xl font-semibold leading-tight text-[color:var(--ink)]">
                        {category.name}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                        {category.description || "Decouvrez la selection disponible."}
                      </p>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

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
                  Décrivez votre besoin.
                </p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  La réservation est confirmée apres validation du devis et
                  versement d'un acompte de 30% sous 7 jours.
                </p>

                {sentStatus === "1" && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Merci. Votre demande à bien ete envoyée. Nous revenons vers
                    vous rapidement.
                  </div>
                )}
                {sentStatus === "0" && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Merci de remplir le nom, l'email, les dates et le message.
                  </div>
                )}
                {sentStatus === "2" && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Merci de valider le captcha avant d'envoyer.
                  </div>
                )}

                <form action={createContactRequest} className="mt-6 grid gap-4 text-sm">
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="name"
                      placeholder="Nom et prenom"
                      required
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="email"
                      type="email"
                      placeholder="Email"
                      required
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="phone"
                      placeholder="Telephone"
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="eventType"
                      placeholder="Type d'evenement"
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="eventLocation"
                      placeholder="Lieu de l'evenement"
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="guestCount"
                      type="number"
                      min="1"
                      placeholder="Nombre d'invites"
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="budget"
                      placeholder="Budget estime (EUR)"
                    />
                    <DateRangePicker startName="startDate" endName="endDate" />
                  </div>

                  <textarea
                    className="min-h-[140px] rounded-2xl border border-black/10 bg-white px-4 py-3"
                    name="message"
                    placeholder="Expliquez votre demande, les quantites et le style souhaite."
                    required
                  />

                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                    <div className="flex items-center justify-start">
                      <div
                        className="cf-turnstile"
                        data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      />
                    </div>
                  )}

                  <ContactSubmitButton />
                </form>

                {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                  <Script
                    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                    strategy="afterInteractive"
                  />
                )}

                <div className="mt-6 space-y-3 text-sm text-[color:var(--muted)]">
                  <p>
                    <strong className="text-[color:var(--ink)]">Telephone</strong>{" "}
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

              <div className="h-full space-y-5 rounded-[28px] border border-black/5 bg-[color:var(--surface-2)] p-5 sm:rounded-[32px] sm:space-y-6 sm:p-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Comment ca marche
                  </p>
                  <ol className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--muted)]">
                    {steps.map((step, index) => (
                      <li key={step.title}>
                        {index + 1}. {step.title}: {step.text}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="h-px w-full bg-black/15" />

                <div>
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

                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                    Services
                  </p>
                  <p className="mt-2 text-sm font-medium">
                    Retrait sur place ou livraison possible à partir de 1 EUR / km,
                    voir avec Alternative location.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/80 p-4 text-sm text-[color:var(--muted)]">
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
                    <span>Voir l'adresse sur Google Maps</span>
                  </a>
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
                Alternative Location accompagne mariages, anniversaires, fetes
                de famille et evenements professionnels a Galgon (33133) et dans
                un rayon de 150 km.
              </p>
              <p>
                Nous proposons la location de vaisselle, decoration, mobilier,
                ambiance et sonorisation avec un service simple et fiable.
              </p>
              <p>
                Retrait sur place a Galgon ou livraison possible a partir de 1
                EUR / km selon disponibilites.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
