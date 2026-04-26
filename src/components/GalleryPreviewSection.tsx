import { getGalleryPreviewUrl, type GalleryMediaView } from "@/lib/gallery";

type GalleryPreviewSectionProps = {
  items: GalleryMediaView[];
};

export default function GalleryPreviewSection({
  items,
}: GalleryPreviewSectionProps) {
  const previewItems = items
    .filter((item) => getGalleryPreviewUrl(item))
    .slice(0, 5);

  if (previewItems.length === 0) return null;

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:mt-12 lg:px-12">
      <div className="overflow-hidden rounded-[34px] border border-black/5 bg-white/92 shadow-[0_30px_70px_rgba(30,25,20,0.1)]">
        <div className="border-b border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,242,235,0.94))] px-5 py-6 sm:px-7 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
                Galerie
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
                Quelques photos pour voir l&apos;ambiance
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Un aperçu simple des mises en scène avant d&apos;ouvrir la galerie complète.
              </p>
            </div>
            <a
              href="/galerie"
              className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 sm:w-auto"
            >
              Ouvrir la galerie
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 bg-[linear-gradient(180deg,rgba(244,238,231,0.82),rgba(255,255,255,0.96))] p-3 sm:grid-cols-3 sm:p-4 lg:grid-cols-5 lg:gap-4 lg:p-5">
          {previewItems.map((item, index) => {
            const previewUrl = getGalleryPreviewUrl(item);
            if (!previewUrl) return null;

            return (
              <a
                key={item.id}
                href="/galerie"
                className={`group relative overflow-hidden rounded-[22px] border border-white/70 bg-[color:var(--surface)] shadow-[0_18px_35px_rgba(30,25,20,0.08)] ${
                  index === 0 ? "col-span-2 sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <img
                  src={previewUrl}
                  alt={item.title}
                  className="h-full min-h-[180px] w-full object-cover transition duration-500 group-hover:scale-[1.04] sm:min-h-[220px] lg:min-h-[240px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/32 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
