import {
  getGalleryPreviewUrl,
  getGalleryLabel,
  type GalleryMediaView,
} from "@/lib/gallery";

type GalleryPreviewSectionProps = {
  items: GalleryMediaView[];
};

function GalleryCard({
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
      className={`group relative overflow-hidden rounded-[24px] border border-black/5 bg-[color:var(--surface)] shadow-[0_18px_40px_rgba(30,25,20,0.12)] ${className ?? ""}`}
    >
      <img
        src={previewUrl}
        alt={item.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/12 to-transparent transition duration-300 group-hover:from-black/72" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
        <p className="text-[10px] uppercase tracking-[0.32em] text-white/75">
          {getGalleryLabel(item)}
        </p>
        <p className="mt-2 text-lg font-semibold leading-tight sm:text-xl">
          {item.title}
        </p>
      </div>
    </a>
  );
}

export default function GalleryPreviewSection({
  items,
}: GalleryPreviewSectionProps) {
  if (items.length === 0) return null;

  const previewItems = items
    .filter((item) => getGalleryPreviewUrl(item))
    .slice(0, 3);

  if (previewItems.length === 0) return null;

  const featuredItem = previewItems[0];
  const secondaryItems = previewItems.slice(1);

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:px-6 lg:mt-12 lg:px-12">
      <div className="overflow-hidden rounded-[34px] border border-black/5 bg-white/92 shadow-[0_30px_70px_rgba(30,25,20,0.1)]">
        <div className="lg:hidden">
          <div className="border-b border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,242,235,0.94))] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
              Galerie
            </p>
            <h2 className="mt-3 max-w-[11ch] text-4xl font-semibold leading-[0.95] sm:max-w-none sm:text-5xl">
              Un aperçu des ambiances
            </h2>
            <p className="mt-3 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Quelques mises en scène, compositions de table et inspirations pour
              découvrir l&apos;univers avant d&apos;entrer dans le catalogue.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
              {[...new Set(previewItems.map((item) => getGalleryLabel(item)))].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-black/8 bg-white/80 px-3 py-1.5"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4 bg-[linear-gradient(180deg,rgba(244,238,231,0.82),rgba(255,255,255,0.96))] p-4 sm:p-5">
            <GalleryCard item={featuredItem} className="h-[390px] sm:h-[480px]" />
            {secondaryItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {secondaryItems.map((item) => (
                  <GalleryCard key={item.id} item={item} className="h-[240px] sm:h-[280px]" />
                ))}
              </div>
            ) : null}
            <a
              href="/galerie"
              className="inline-flex w-full items-center justify-center rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
            >
              Voir la galerie
            </a>
          </div>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[0.78fr_1.22fr]">
          <div className="flex flex-col justify-between border-r border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,242,235,0.94))] p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
                Galerie
              </p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight xl:text-5xl">
                Un aperçu des ambiances
              </h2>
              <p className="mt-4 text-base leading-8 text-[color:var(--muted)]">
                Quelques mises en scène, compositions de table et inspirations
                pour découvrir l&apos;univers avant d&apos;entrer dans le catalogue.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href="/galerie"
                className="inline-flex w-fit items-center rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(30,25,20,0.18)]"
              >
                Voir la galerie
              </a>
              <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                {[...new Set(previewItems.map((item) => getGalleryLabel(item)))].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-black/8 bg-white/80 px-3 py-1.5"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 bg-[linear-gradient(180deg,rgba(244,238,231,0.82),rgba(255,255,255,0.96))] p-5 lg:grid-cols-[1.15fr_0.85fr]">
            <GalleryCard item={featuredItem} className="min-h-[460px]" />
            {secondaryItems.length > 0 ? (
              <div className="grid gap-4">
                {secondaryItems.map((item) => (
                  <GalleryCard key={item.id} item={item} className="min-h-[220px]" />
                ))}
              </div>
            ) : (
              <a
                href="/galerie"
                className="flex min-h-[220px] items-end rounded-[24px] border border-dashed border-black/10 bg-white/75 p-5 text-sm text-[color:var(--muted)] transition hover:border-black/20 hover:bg-white"
              >
                Ouvrir la galerie complète pour voir toutes les ambiances.
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
