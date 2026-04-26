import { getGalleryPreviewUrl, type GalleryMediaView } from "@/lib/gallery";

type GalleryPreviewSectionProps = {
  items: GalleryMediaView[];
};

function PreviewTile({
  item,
  className,
}: {
  item: GalleryMediaView;
  className?: string;
}) {
  const previewUrl = getGalleryPreviewUrl(item);
  if (!previewUrl) return null;

  return (
    <a
      href="/galerie"
      className={`group relative overflow-hidden rounded-[24px] border border-white/70 bg-[color:var(--surface)] shadow-[0_18px_35px_rgba(30,25,20,0.08)] ${className ?? ""}`}
    >
      <img
        src={previewUrl}
        alt={item.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
    </a>
  );
}

export default function GalleryPreviewSection({
  items,
}: GalleryPreviewSectionProps) {
  const previewItems = items
    .filter((item) => getGalleryPreviewUrl(item))
    .slice(0, 5);

  if (previewItems.length === 0) return null;

  const first = previewItems[0];
  const rest = previewItems.slice(1);

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:mt-12 lg:px-12">
      <div className="overflow-hidden rounded-[34px] border border-black/5 bg-white/92 p-5 shadow-[0_30px_70px_rgba(30,25,20,0.1)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 border-b border-black/5 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
              Galerie
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Quelques images de nos mises en scène
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Un aperçu direct, simplement pour voir le rendu des tables, de la décoration et des ambiances avant d&apos;ouvrir la galerie complète.
            </p>
          </div>
          <a
            href="/galerie"
            className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 sm:w-auto"
          >
            Voir la galerie
          </a>
        </div>

        {previewItems.length === 1 ? (
          <div className="mt-5">
            <PreviewTile item={first} className="block h-[340px] sm:h-[420px]" />
          </div>
        ) : previewItems.length === 2 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {previewItems.map((item) => (
              <PreviewTile
                key={item.id}
                item={item}
                className="block h-[260px] sm:h-[320px]"
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
            <PreviewTile item={first} className="block h-[320px] sm:h-[420px] lg:h-full" />

            <div
              className={`grid gap-3 ${
                rest.length === 1
                  ? "grid-cols-1"
                  : rest.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2"
              }`}
            >
              {rest.map((item, index) => (
                <PreviewTile
                  key={item.id}
                  item={item}
                  className={`block h-[154px] sm:h-[200px] ${
                    rest.length === 3 && index === 0 ? "col-span-2" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
