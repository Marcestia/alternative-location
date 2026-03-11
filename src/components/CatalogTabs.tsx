"use client";

type Category = {
  label: string;
  targetId: string;
};

export default function CatalogTabs({ categories }: { categories: Category[] }) {
  const onClick = (targetId: string) => {
    const el = document.getElementById(targetId) as HTMLDetailsElement | null;
    if (el) {
      el.open = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => (
        <button
          key={category.targetId}
          type="button"
          onClick={() => onClick(category.targetId)}
          className="rounded-3xl border border-black/5 bg-white/70 px-5 py-6 text-center text-sm font-semibold transition hover:-translate-y-0.5"
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
