import { getGalleryPreviewUrl, getGalleryLabel, type GalleryMediaView } from "@/lib/gallery";

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
      <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white/92 shadow-[0_30px_70px_rgba(30,25,20,0.10)]">
        <div className="grid gap-0 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="flex flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
                Galerie
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
                Un avant-gout des ambiances
              </h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Une selection visuelle plus libre, plus editoriale, pour montrer
                le rendu avant meme d&apos;entrer dans le catalogue.
              </p>
            </div>
            <div className="mt-8">
              <a
                href="/galerie"
                className="inline-flex rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Ouvrir la galerie
              </a>
            </div>
          </div>

          <a
            href="/galerie"
            className="grid gap-3 bg-[linear-gradient(180deg,rgba(244,238,231,0.8),rgba(255,255,255,0.92))] p-4 sm:grid-cols-2 sm:p-5"
          >
            {previewItems.map((item, index) => {
              const previewUrl = getGalleryPreviewUrl(item);
              if (!previewUrl) return null;

              return (
                <article
                  key={item.id}
                  className={`group relative overflow-hidden rounded-[18px] bg-[color:var(--surface)] shadow-[0_16px_35px_rgba(30,25,20,0.10)] ${
                    index === 0 ? "sm:row-span-2" : ""
                  }`}
                >
                  <img
                    src={previewUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-100 md:opacity-80 md:group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/75">
                      {getGalleryLabel(item)}
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-tight">
                      {item.title}
                    </p>
                  </div>
                </article>
              );
            })}
          </a>
        </div>
      </div>
    </section>
  );
}
