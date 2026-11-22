import GalleryPreviewSection from "@/components/GalleryPreviewSection";
import ContactRequestForm from "@/components/ContactRequestForm";
import { CATEGORY_GROUP_META, CATEGORY_GROUP_ORDER } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import { jsonLd, localBusinessSchema, publicPageMetadata } from "@/lib/seo";
import { sampleGalleryItems } from "@/lib/gallery";
import Link from "next/link";
import MomentOffersCarousel from "@/components/MomentOffersCarousel";
import EventPlayground from "@/components/EventPlayground";
import UniverseExplorer from "@/components/UniverseExplorer";

export const metadata = publicPageMetadata({
  title:
    "Location événementielle à Galgon, près de Libourne | Alternative Location",
  description:
    "Vaisselle, décoration, mobilier et sonorisation pour mariages et fêtes en Gironde. Découvrez le catalogue Alternative Location, avec retrait à Galgon.",
  path: "/",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    title: "Retrait sur place",
    text: "Nous convenons ensemble du créneau de retrait à Galgon. Le solde et la caution sont demandés avant la remise du matériel.",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ sent?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const sentStatus = resolvedParams?.sent;

  const [settings, categories, galleryMedia] = await Promise.all([
    prisma.companySetting.findUnique({
      where: { id: "company" },
      select: { catalogRequestEnabled: true },
    }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.galleryMedia.findMany({
      where: { active: true },
      include: { section: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
  ]);

  const displayCategories = CATEGORY_GROUP_ORDER.filter((group) =>
    categories.some((category) => category.group === group),
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
    <div className="home-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            ...localBusinessSchema,
          }),
        }}
      />
      <main>
        <EventPlayground />
        <div
          className="party-marquee"
          aria-label="Vaisselle, décoration, mobilier et sonorisation"
        >
          <div className="party-marquee-track" aria-hidden="true">
            {[0, 1, 2, 3].map((copy) => (
              <span key={copy}>
                LES GENS. LES TABLES. LES FÊTES. <span className="mobile-decoration" aria-hidden="true">✳</span> VAISSELLE /
                DÉCORATION / MOBILIER / SON <span className="mobile-decoration" aria-hidden="true">✳</span>{" "}
              </span>
            ))}
          </div>
        </div>
        <UniverseExplorer categories={displayCategories} />

        <MomentOffersCarousel />
        <GalleryPreviewSection items={displayGalleryMedia} />

        <section
          className="home-process"
          aria-labelledby="process-title"
          data-scroll-section
        >
          <div className="site-container process-layout">
            <div className="process-intro" data-reveal>
              <p className="micro-label">04 / DE L’IDÉE AU JOUR J</p>
              <h2 id="process-title">
                C’est
                <br />
                parti<span className="mobile-decoration" aria-hidden="true">↗</span>
              </h2>
              <p>
                Quatre étapes.
                <br />
                Et vous pouvez penser à la fête.
              </p>
            </div>
            <div className="process-accordion" data-stagger>
              {steps.map((step, index) => (
                <details
                  key={step.title}
                  open={index === 0}
                  data-reveal
                  data-animated-details
                >
                  <summary>
                    <span className="process-number">0{index + 1}</span>
                    <h3>{step.title}</h3>
                    <span className="process-plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <div className="process-answer">
                    <p>{step.text}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          id="contact"
          className="site-container home-contact"
          aria-labelledby="contact-title"
          data-scroll-section
        >
          <div className="contact-intro" data-reveal>
            <p className="micro-label">05 / À VOUS DE JOUER</p>
            <h2 id="contact-title">
              Et
              <br />
              maintenant<span className="contact-question">?</span>
            </h2>
            <p>
              Un mariage, un anniversaire, une fête de famille ou un événement
              professionnel ? Racontez-nous vos idées, nous préparons votre
              devis personnalisé.
            </p>
            <div className="contact-direct">
              <a href={`tel:${siteConfig.phone.replace(/\s+/g, "")}`}>
                {siteConfig.phone} <span aria-hidden="true" className="link-decoration">↗</span>
              </a>
              <a href={`mailto:${siteConfig.email}`}>
                {siteConfig.email} <span aria-hidden="true" className="link-decoration">↗</span>
              </a>
              <p>{siteConfig.address}</p>
            </div>
            <div className="contact-socials">
              <a
                href="https://www.facebook.com/p/Alternative-location-100063656164530/"
                target="_blank"
                rel="noreferrer"
              >
                Facebook <span className="link-decoration" aria-hidden="true">↗</span>
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp <span className="link-decoration" aria-hidden="true">↗</span>
              </a>
              <a
                href="https://www.google.com/maps/search/?api=1&query=14+impasse+Moustron,+33133+Galgon,+France"
                target="_blank"
                rel="noreferrer"
              >
                Nous trouver <span className="link-decoration" aria-hidden="true">↗</span>
              </a>
            </div>
            <details className="contact-detail" data-animated-details>
              <summary>
                Nos horaires <span aria-hidden="true">+</span>
              </summary>
              <div className="opening-hours">
                {[
                  ["Lundi", "09:00 – 18:30"],
                  ["Mardi", "09:00 – 18:30"],
                  ["Mercredi", "09:00 – 18:30"],
                  ["Jeudi", "09:00 – 18:30"],
                  ["Vendredi", "09:00 – 18:00"],
                  ["Samedi", "Fermé"],
                  ["Dimanche", "Fermé"],
                ].map(([day, hours]) => (
                  <p key={day}>
                    <span>{day}</span>
                    <span>{hours}</span>
                  </p>
                ))}
              </div>
            </details>
            <details className="contact-detail" data-animated-details>
              <summary>
                Retrait, paiement & retour <span aria-hidden="true">+</span>
              </summary>
              <div>
                <p>
                  Retrait et retour du matériel sur place à Galgon, sur
                  rendez-vous.
                </p>
                <p>Paiement possible par virement, chèque ou espèces.</p>
                <p>
                  Le solde et la caution sont demandés avant la remise du
                  matériel. Au retour, le matériel est contrôlé avant
                  restitution de la caution.
                </p>
              </div>
            </details>
          </div>
          <div className="contact-form-panel" data-reveal>
            <span className="contact-form-tag">
              VOTRE ÉVÉNEMENT COMMENCE ICI
            </span>
            <h3>On prépare quoi ?</h3>
            <p>Vos envies, vos dates, vos quantités. On s’occupe du devis.</p>
            <ContactRequestForm
              sentStatus={sentStatus}
              catalogRequestEnabled={settings?.catalogRequestEnabled ?? false}
            />
            <p className="contact-form-note">
              La réservation est confirmée après validation du devis et
              versement d’un acompte de 30 % sous 7 jours.{" "}
              <Link href="/conditions">
                Consulter les conditions de location <span className="link-decoration" aria-hidden="true">↗</span>
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
