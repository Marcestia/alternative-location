import { getGalleryPreviewUrl, type GalleryMediaView } from "@/lib/gallery";

export default function GalleryPreviewSection({
  items,
}: {
  items: GalleryMediaView[];
}) {
  const previewItems = items
    .filter((item) => getGalleryPreviewUrl(item))
    .slice(0, 5);
  if (!previewItems.length) return null;

  return (
    <section
      id="inspirations"
      className="site-container home-gallery"
      aria-labelledby="gallery-title"
      data-scroll-section
    >
      <div className="editorial-heading" data-reveal>
        <p className="micro-label">03 / LES PREUVES EN IMAGES</p>
        <h2 id="gallery-title">
          Ça donne
          <br />
          <span className="outline-type">ça.</span>
          <span className="gallery-heading-arrow" aria-hidden="true">
            ↘
          </span>
        </h2>
        <div>
          <p>
            Des tables dressées. Des lumières allumées.
            <br />
            Et de quoi imaginer la vôtre.
          </p>
          <a href="/galerie" className="text-link">
            OUVRIR LA GALERIE <span aria-hidden="true" className="link-decoration">↗</span>
          </a>
        </div>
      </div>
      <div
        className="gallery-wall"
        data-count={previewItems.length}
        data-stagger
      >
        {previewItems.map((item, index) => (
          <figure
            key={item.id}
            data-reveal="photo"
            data-hover-card
            className={`gallery-wall-item gallery-wall-item-${index + 1}`}
          >
            <a href="/galerie" className="gallery-preview-tile">
              <div className="gallery-wall-photo">
                <img
                  src={getGalleryPreviewUrl(item)!}
                  alt={item.title}
                  loading="lazy"
                  data-parallax={index % 2 ? "-0.035" : "0.035"}
                />
              </div>
              <span className="gallery-tile-arrow link-decoration" aria-hidden="true">
                ↗
              </span>
            </a>
            <figcaption>
              <span>FIG. 0{index + 1}</span>
              <span>{item.title}</span>
              {item.type === "VIDEO" ? <span>VIDÉO ↗</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
      <a href="/galerie" className="gallery-all-link" data-reveal>
        <span>ON VOUS MONTRE LA SUITE ?</span>
        <span aria-hidden="true" className="link-decoration">↗</span>
      </a>
    </section>
  );
}
