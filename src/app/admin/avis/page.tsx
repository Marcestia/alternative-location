import {
  addReview,
  deleteReview,
  updateReview,
} from "@/app/actions/reviews";
import AdminImageInput from "@/components/AdminImageInput";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const reviews = await prisma.review.findMany({
    include: { images: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Avis clients</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Avis affiches sur la page d&apos;accueil (nom, note, texte et photos).
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Ajouter un avis</h2>
          {resolvedParams?.saved === "1" && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              Avis ajoute.
            </div>
          )}
          {resolvedParams?.saved === "0" && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Merci de renseigner un nom.
            </div>
          )}
          <form action={addReview} className="mt-4 grid gap-4">
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Nom et prenom"
              name="name"
              required
            />
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Email (optionnel)"
              name="email"
              type="email"
            />
            <textarea
              className="min-h-[110px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              name="text"
              placeholder="Texte de l'avis"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                placeholder="Note (1-5)"
                name="rating"
                type="number"
                min="1"
                max="5"
                defaultValue="5"
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                placeholder="Ordre d'affichage"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminImageInput label="Photo 1" name="imageData" />
              <AdminImageInput label="Photo 2" name="imageData" />
              <AdminImageInput label="Photo 3" name="imageData" />
            </div>
            <button
              className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Enregistrer
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-black/5 bg-[color:var(--surface-2)] p-6">
          <h2 className="text-xl font-semibold">Conseil</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            3 a 6 avis suffisent pour une page d&apos;accueil claire et rassurante.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              "Varier les types d'evenements",
              "Mettre une note coherente (4-5)",
              "Ajouter 1 photo si possible",
            ].map((tip) => (
              <li key={tip} className="rounded-2xl bg-white/80 px-4 py-3">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Avis enregistres</h2>
        {reviews.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucun avis pour le moment.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <details
                key={review.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{review.name}</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      Note: {review.rating}/5
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {review.verifiedPurchase
                        ? "Certifie (client paye)"
                        : "Non certifie"}
                    </p>
                    {review.email && (
                      <p className="text-xs text-[color:var(--muted)]">
                        Email: {review.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={deleteReview}>
                      <input type="hidden" name="id" value={review.id} />
                      <button
                        className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                        type="submit"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </summary>
                <div className="mt-4 grid gap-4">
                  <form action={updateReview} className="grid gap-3">
                    <input type="hidden" name="id" value={review.id} />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      placeholder="Nom et prenom"
                      name="name"
                      defaultValue={review.name}
                      required
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      placeholder="Email (optionnel)"
                      name="email"
                      type="email"
                      defaultValue={review.email ?? ""}
                    />
                    <textarea
                      className="min-h-[110px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                      name="text"
                      placeholder="Texte de l'avis"
                      defaultValue={review.text ?? ""}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        placeholder="Note (1-5)"
                        name="rating"
                        type="number"
                        min="1"
                        max="5"
                        defaultValue={review.rating}
                      />
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        placeholder="Ordre d'affichage"
                        name="sortOrder"
                        type="number"
                        min="0"
                        defaultValue={review.sortOrder}
                      />
                    </div>
                    {review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {review.images.map((image) => (
                          <img
                            key={image.id}
                            src={image.url}
                            alt={review.name}
                            className="h-16 w-16 rounded-2xl border border-black/10 object-cover"
                          />
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <AdminImageInput label="Ajouter photo 1" name="imageData" />
                      <AdminImageInput label="Ajouter photo 2" name="imageData" />
                      <AdminImageInput label="Ajouter photo 3" name="imageData" />
                    </div>
                    <button
                      className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
                      type="submit"
                    >
                      Enregistrer les modifications
                    </button>
                  </form>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
