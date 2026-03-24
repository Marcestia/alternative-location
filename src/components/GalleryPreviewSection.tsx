import { getGalleryPreviewUrl, type GalleryMediaView } from "@/lib/gallery";

type GalleryPreviewSectionProps = {
  items: GalleryMediaView[];
};

export default function GalleryPreviewSection({
  items,
}: GalleryPreviewSectionProps) {
  if (items.length === 0) return null;

  const previewItems = items.filter((item) => getGalleryPreviewUrl(item)).slice(0, 4);
  if (previewItems.length === 0) return null;

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:mt-12 lg:px-12">
      <div className="overflow-hidden rounded-[34px] border border-black/5 bg-white/90 p-5 shadow-[0_30px_60px_rgba(30,25,20,0.12)] sm:rounded-[40px] sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
              Galerie
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              Un apercu tres visuel de nos ambiances
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Une page dediee pour feuilleter les photos de presentation, voir
              les mises en scene et se projeter plus facilement.
            </p>
          </div>
          <a
            href="/galerie"
            className="inline-flex rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
          >
            Ouvrir la galerie
          </a>
        </div>

        <a
          href="/galerie"
          className="mt-6 grid auto-rows-[180px] gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_0.85fr_0.85fr] xl:auto-rows-[220px]"
        >
          {previewItems.map((item, index) => {
            const previewUrl = getGalleryPreviewUrl(item);
            if (!previewUrl) return null;

            const large = index === 0;
            const tileClass = large
              ? "md:row-span-2"
              : index === 3
                ? "md:col-span-2 xl:col-span-1"
                : "";

            return (
              <article
                key={item.id}
                className={`group overflow-hidden rounded-[28px] border border-black/5 bg-[color:var(--surface)] ${tileClass}`}
              >
                <div className={`relative ${large ? "aspect-[4/5] xl:h-full" : "aspect-[4/3]"}`}>
                  <img
                    src={previewUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-base font-semibold leading-tight sm:text-lg">
                      {item.title}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </a>
      </div>
    </section>
  );
}
