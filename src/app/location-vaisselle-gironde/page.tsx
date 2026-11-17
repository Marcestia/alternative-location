import Image from "next/image";
import Link from "next/link";
import tableImage from "../../../public/vitrine/hero.jpg";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site";
import {
  absoluteUrl,
  jsonLd,
  localBusinessSchema,
  publicPageMetadata,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const path = "/location-vaisselle-gironde";
const title = "Location vaisselle Gironde (33) | Alternative Location";
const description =
  "Louez vaisselle, assiettes, verres et couverts pour votre mariage ou anniversaire en Gironde. Formules et tarifs en ligne. Retrait uniquement à Galgon.";

export const metadata = publicPageMetadata({ title, description, path });

const questions = [
  {
    title: "Où retirer et rapporter la vaisselle ?",
    answer: `Le retrait et le retour s’effectuent exclusivement au ${siteConfig.address}, aux horaires convenus lors de la réservation. La location est prévue du vendredi au lundi selon nos conditions générales. L’entreprise est fermée le dimanche ; tout autre arrangement nécessite un accord préalable.`,
  },
  {
    title: "Proposez-vous la livraison en Gironde ?",
    answer:
      "Non, le matériel est à retirer et à rapporter à Galgon. Vous pouvez le louer pour votre réception ailleurs en Gironde en organisant vous-même son transport. Pensez à prévoir la place nécessaire dans votre véhicule pour les cartons et les casiers.",
  },
  {
    title: "Comment connaître le prix de ma location ?",
    answer:
      "Les prix des articles et des formules figurent dans le catalogue. Le total dépend de votre sélection et des quantités. Indiquez la date de votre événement, le nombre de convives et les références souhaitées dans votre demande : nous vérifions les disponibilités avant d’établir le devis.",
  },
  {
    title: "Faut-il laver la vaisselle avant de la rendre ?",
    answer:
      "La vaisselle doit être rendue rincée, sans déchets alimentaires, dans son emballage d’origine. Les verres doivent être vides, rangés dans leurs cartons ou casiers, têtes en haut. Les modalités complètes de restitution sont précisées dans les conditions générales de location.",
  },
  {
    title: "Comment confirmer la réservation ?",
    answer:
      "Après vérification des disponibilités, nous vous adressons un devis à signer. Un acompte de 30 % est nécessaire pour confirmer la réservation et doit être versé sous 7 jours après signature. Le solde et la caution sont exigibles lors de la remise du matériel.",
  },
];

export default async function TablewareGirondePage() {
  const items = await prisma.item.findMany({
    where: {
      active: true,
      category: { name: { in: ["Formules couvert", "Matériel de table"] } },
    },
    select: { id: true, name: true, description: true, rentalPriceCents: true },
    orderBy: [{ rentalPriceCents: "asc" }, { name: "asc" }],
  });
  const formulas = items.filter((item) => /^formule\b/i.test(item.name));
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      localBusinessSchema,
      {
        "@type": "Service",
        "@id": absoluteUrl(`${path}#service`),
        name: "Location de vaisselle en Gironde",
        serviceType: "Location de vaisselle, verres et couverts",
        description,
        url: absoluteUrl(path),
        provider: { "@id": localBusinessSchema["@id"] },
        areaServed: { "@type": "AdministrativeArea", name: "Gironde" },
      },
      {
        "@type": "WebPage",
        "@id": absoluteUrl(`${path}#page`),
        url: absoluteUrl(path),
        name: title,
        description,
        inLanguage: "fr-FR",
        about: { "@id": absoluteUrl(`${path}#service`) },
        breadcrumb: { "@id": absoluteUrl(`${path}#fil-ariane`) },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absoluteUrl(`${path}#fil-ariane`),
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: absoluteUrl(),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Location de vaisselle en Gironde",
            item: absoluteUrl(path),
          },
        ],
      },
    ],
  };

  return (
    <main className="rental-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
      />
      <div className="site-container">
        <nav className="rental-breadcrumb" aria-label="Fil d’Ariane">
          <Link href="/">Accueil</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Vaisselle en Gironde</span>
        </nav>
        <section
          className="rental-hero"
          aria-labelledby="rental-title"
          data-scroll-section
        >
          <div data-reveal>
            <p className="micro-label">LES BELLES TABLES COMMENCENT ICI · 33</p>
            <h1 id="rental-title">
              Location de vaisselle <span>en Gironde.</span>
            </h1>
            <p className="rental-lead">
              Un mariage, un anniversaire, une grande tablée ? Assiettes,
              verres, couverts et formules de vaisselle : composez votre
              réception avec Alternative Location, à Galgon, près de Libourne.
            </p>
            <p className="rental-pickup">
              Retrait et retour uniquement à Galgon, sur créneau convenu.
            </p>
            <div className="rental-actions">
              <Link
                href="/catalogue#cat-materiel-de-table"
                className="button button-primary"
                data-magnetic
              >
                Voir la vaisselle et les tarifs{" "}
                <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/#contact" className="text-link">
                Demander un devis <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
          <figure className="rental-photo" data-reveal>
            <Image
              src={tableImage}
              alt="Table de réception avec assiettes, verres et couverts d’Alternative Location"
              priority
              sizes="(max-width: 800px) 100vw, 48vw"
            />
            <figcaption>Les grandes tablées. Les petits détails.</figcaption>
          </figure>
        </section>

        <section
          className="rental-section rental-essentials"
          aria-labelledby="essentials-title"
          data-scroll-section
        >
          <div className="rental-section-heading" data-reveal>
            <p className="micro-label">À CHAQUE REPAS, SA TABLE</p>
            <h2 id="essentials-title">
              Assiettes, verres, couverts.
              <br />
              <span>Tout se compose.</span>
            </h2>
            <p>
              Choisissez une formule ou les pièces à l’unité. Le catalogue
              présente les modèles et les tarifs ; nous confirmons les
              disponibilités pour la date de votre événement.
            </p>
          </div>
          <div className="rental-use-grid" data-stagger>
            <article data-reveal>
              <span className="micro-label">01 / LES ASSIETTES</span>
              <h3>De l’entrée au dessert</h3>
              <p>
                Assiettes plates, petites assiettes et assiettes creuses :
                adaptez votre sélection au menu, au buffet et aux différents
                services. Retrouvez aussi les saladiers, carafes et accessoires
                de table dans le catalogue.
              </p>
            </article>
            <article data-reveal>
              <span className="micro-label">02 / LES VERRES</span>
              <h3>Pour porter un toast</h3>
              <p>
                Verres à eau, à vin, flûtes et verres à cocktail : prévoyez les
                contenants selon les boissons servies, du vin d’honneur au
                repas. Comparez les modèles pour garder une table harmonieuse.
              </p>
            </article>
            <article data-reveal>
              <span className="micro-label">03 / LES COUVERTS</span>
              <h3>Le bon détail</h3>
              <p>
                Fourchettes, couteaux et accessoires complètent votre table.
                Pensez aux changements de couverts entre les plats et aux pièces
                de service pour les plats à partager.
              </p>
            </article>
          </div>
        </section>

        {formulas.length > 0 && (
          <section
            className="rental-section"
            aria-labelledby="formula-title"
            data-scroll-section
          >
            <div className="rental-section-heading" data-reveal>
              <p className="micro-label">LES FORMULES VAISSELLE</p>
              <h2 id="formula-title">
                Une table qui vous ressemble.
                <br />
                <span>Un tarif clair.</span>
              </h2>
              <p>
                Voici les formules actuellement au catalogue. Les tarifs
                ci-dessous sont ceux d’une formule ; précisez le nombre de
                convives pour établir votre devis.
              </p>
            </div>
            <div className="rental-formulas" data-stagger>
              {formulas.map((formula) => (
                <article
                  key={formula.id}
                  className="rental-formula"
                  data-reveal
                >
                  <h3>{formula.name}</h3>
                  <p className="rental-price">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    }).format(formula.rentalPriceCents / 100)}
                    <span> / formule</span>
                  </p>
                  {formula.description && (
                    <p className="rental-composition">{formula.description}</p>
                  )}
                  <Link
                    href="/catalogue#cat-materiel-de-table"
                    className="text-link"
                  >
                    Voir au catalogue <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <section
          className="rental-section rental-local"
          aria-labelledby="local-title"
          data-scroll-section
        >
          <div data-reveal>
            <p className="micro-label">GALGON · LIBOURNAIS · GIRONDE</p>
            <h2 id="local-title">
              Votre fête en Gironde.
              <br />
              <span>Votre retrait à Galgon.</span>
            </h2>
            <p>
              Vous préparez un événement à Libourne, Fronsac,
              Saint-Denis-de-Pile, Coutras ou Saint-Émilion ? Notre point de
              retrait est à Galgon. Les organisateurs de réceptions à
              Saint-André-de-Cubzac, Bordeaux ou ailleurs en Gironde peuvent
              également louer leur vaisselle ici, en prévoyant le trajet de
              retrait et de retour.
            </p>
            <p>
              Pour un mariage, partez du nombre d’invités, du menu et des temps
              forts : cocktail, dîner, dessert. Pour un anniversaire ou une fête
              de famille, une formule ou une sélection à l’unité permet
              d’adapter la table à votre repas. Vous pouvez compléter votre
              sélection avec le linge de table, la décoration et le mobilier du
              catalogue.
            </p>
            <Link href="/catalogue" className="text-link">
              Découvrir tout le matériel <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <aside className="rental-address" data-reveal>
            <span className="rental-location-mark" aria-hidden="true">
              ↗
            </span>
            <p className="micro-label">LE POINT DE RENDEZ-VOUS</p>
            <h3>
              On se retrouve
              <br />à Galgon.
            </h3>
            <address>{siteConfig.address}</address>
            <p>
              Retrait et retour sur place uniquement.
              <br />
              Horaires convenus à la réservation.
            </p>
            <a
              className="text-link"
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            >
              {siteConfig.phone} <span aria-hidden="true">↗</span>
            </a>
          </aside>
        </section>

        <section
          className="rental-section rental-faq"
          aria-labelledby="faq-title"
          data-scroll-section
        >
          <div className="rental-section-heading" data-reveal>
            <p className="micro-label">AVANT DE PASSER À TABLE</p>
            <h2 id="faq-title">
              Les questions <span>pratiques.</span>
            </h2>
          </div>
          <div className="rental-questions">
            {questions.map((question) => (
              <details key={question.title} data-animated-details data-reveal>
                <summary>
                  {question.title}
                  <span aria-hidden="true">+</span>
                </summary>
                <div>
                  <p>{question.answer}</p>
                </div>
              </details>
            ))}
          </div>
          <Link href="/conditions" className="text-link">
            Lire les conditions de location <span aria-hidden="true">↗</span>
          </Link>
        </section>

        <section
          className="rental-final"
          aria-labelledby="rental-quote-title"
          data-reveal
        >
          <div>
            <p className="micro-label">UNE DATE. DES INVITÉS. UNE ENVIE.</p>
            <h2 id="rental-quote-title">On prépare votre table ?</h2>
            <p>
              Envoyez-nous la date, le nombre de convives et les articles
              souhaités. Nous revenons vers vous avec les disponibilités et un
              devis personnalisé.
            </p>
          </div>
          <Link
            href="/#contact"
            className="button button-primary"
            data-magnetic
          >
            Demander mon devis <span aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </main>
  );
}
