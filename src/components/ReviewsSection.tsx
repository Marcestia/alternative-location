"use client";

import { useMemo, useState } from "react";
import AdminImageInput from "@/components/AdminImageInput";

type ReviewImage = {
  id: string;
  url: string;
};

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string | null;
  verifiedPurchase?: boolean;
  images: ReviewImage[];
};

type ReviewsSectionProps = {
  reviews: Review[];
  reviewStatus?: string;
  onSubmit: (formData: FormData) => void;
};

export default function ReviewsSection({
  reviews,
  reviewStatus,
  onSubmit,
}: ReviewsSectionProps) {
  const [open, setOpen] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [email, setEmail] = useState("");
  const [checkState, setCheckState] = useState<
    "idle" | "checking" | "eligible" | "ineligible"
  >("idle");

  const stats = useMemo(() => {
    if (reviews.length === 0) return { count: 0, average: 0 };
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return { count: reviews.length, average: total / reviews.length };
  }, [reviews]);

  const checkEligibility = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setCheckState("ineligible");
      return;
    }

    setCheckState("checking");

    try {
      const response = await fetch(
        `/api/reviews/eligibility?email=${encodeURIComponent(cleanEmail)}`,
        { method: "GET" }
      );
      const data = (await response.json()) as { ok?: boolean };
      setCheckState(data.ok ? "eligible" : "ineligible");
    } catch {
      setCheckState("ineligible");
    }
  };

  const preventEnterSubmit = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter") return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.tagName === "TEXTAREA") return;
    event.preventDefault();
  };

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-12">
      <div className="relative overflow-hidden rounded-[34px] border border-black/5 bg-white/90 p-5 shadow-[0_30px_60px_rgba(30,25,20,0.12)] sm:rounded-[40px] sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[color:var(--accent-2)]/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-[color:var(--accent)]/15 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
                Avis
              </p>
              <h2 className="text-2xl font-semibold sm:text-3xl md:text-4xl">
                Ils nous ont fait confiance.
              </h2>
            </div>
            <button
              className="w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)] sm:w-auto sm:px-5 sm:py-2 sm:text-xs"
              onClick={() => setOpen((value) => !value)}
              type="button"
            >
              Laisser un avis
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[color:var(--muted)]">
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
              {stats.average > 0 ? stats.average.toFixed(1) : "0"}/5
            </span>
            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
              {stats.count} avis
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-[color:var(--muted)]">
            Avis certifies: publication reservee aux clients avec facture payee.
          </p>

          {reviewStatus === "1" && (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Merci. Votre avis a bien ete envoye.
            </div>
          )}
          {reviewStatus === "0" && (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Merci d'indiquer votre nom, une note et un message.
            </div>
          )}

          {reviews.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-black/10 bg-white/80 p-6 text-sm text-[color:var(--muted)]">
              Aucun avis pour le moment.
            </div>
          ) : (
            <>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowReviews((value) => !value)}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                >
                  {showReviews ? "Masquer les avis" : "Lire les avis clients"}
                </button>
              </div>

              {showReviews && (
                <div className="mt-6">
                  <div className="flex gap-4 overflow-x-auto pb-4 pr-4 snap-x snap-mandatory">
                    {reviews.map((review) => (
                      <article
                        key={review.id}
                        className="min-w-[84vw] max-w-[84vw] snap-start rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-[0_24px_40px_rgba(30,25,20,0.08)] sm:min-w-[320px] sm:max-w-[320px] sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{review.name}</p>
                            {review.verifiedPurchase && (
                              <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                                Avis certifie
                              </span>
                            )}
                          </div>
                          <span className="shrink-0 rounded-full bg-[color:var(--surface-2)] px-2 py-1 text-xs font-semibold text-[color:var(--accent)]">
                            {review.rating}/5
                          </span>
                        </div>
                        {review.text && (
                          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                            {review.text}
                          </p>
                        )}
                        {review.images.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            {review.images.slice(0, 3).map((image) => (
                              <img
                                key={image.id}
                                src={image.url}
                                alt={review.name}
                                className="h-20 w-full rounded-2xl object-cover"
                              />
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {open && (
            <div className="mt-8 rounded-[28px] border border-black/5 bg-white/80 p-5 shadow-[0_24px_40px_rgba(30,25,20,0.08)] sm:p-6">
              <h3 className="text-xl font-semibold">Laisser un avis</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Avis reserve aux clients avec facture payee. Entrez votre email
                de commande pour activer le formulaire.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setCheckState("idle");
                  }}
                  placeholder="Email de commande"
                  required
                />
                <button
                  type="button"
                  onClick={checkEligibility}
                  className="rounded-full border border-black/10 px-4 py-3 text-xs font-semibold text-[color:var(--muted)] sm:py-2"
                >
                  {checkState === "checking" ? "Verification..." : "Verifier mon acces"}
                </button>
              </div>

              {checkState === "eligible" && (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
                  Acces confirme. Vous pouvez publier un avis certifie.
                </div>
              )}
              {checkState === "ineligible" && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                  Aucun paiement valide trouve pour cet email.
                </div>
              )}
              {reviewStatus === "not-eligible" && (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
                  Avis non autorise: email non lie a une facture payee.
                </div>
              )}

              <form
                action={onSubmit}
                className="mt-4 grid gap-4 text-sm"
                onKeyDown={preventEnterSubmit}
              >
                <fieldset
                  className={`grid gap-4 ${
                    checkState === "eligible"
                      ? "opacity-100"
                      : "pointer-events-none opacity-45"
                  }`}
                  disabled={checkState !== "eligible"}
                >
                  <input type="hidden" name="email" value={email.trim().toLowerCase()} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="name"
                      placeholder="Nom et prenom"
                      required
                    />
                    <input
                      className="rounded-2xl border border-black/10 bg-white px-4 py-3"
                      name="rating"
                      type="number"
                      min="1"
                      max="5"
                      defaultValue="5"
                      placeholder="Note sur 5"
                      required
                    />
                  </div>
                  <textarea
                    className="min-h-[120px] rounded-2xl border border-black/10 bg-white px-4 py-3"
                    name="text"
                    placeholder="Votre avis"
                    required
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <AdminImageInput label="Photo 1 (optionnel)" name="imageData" />
                    <AdminImageInput label="Photo 2 (optionnel)" name="imageData" />
                    <AdminImageInput label="Photo 3 (optionnel)" name="imageData" />
                  </div>
                  <button
                    className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)]"
                    type="submit"
                  >
                    Envoyer l'avis certifie
                  </button>
                </fieldset>
              </form>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
