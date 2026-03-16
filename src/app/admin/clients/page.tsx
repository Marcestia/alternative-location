import { addClient, deleteClient } from "@/app/actions/clients";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; blocked?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Clients</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Fiches clients, historique et contacts.
        </p>
      </header>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Ajouter un client</h2>
        {resolvedParams?.saved === "1" && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
            Client ajouté.
          </div>
        )}
        {resolvedParams?.saved === "0" && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Merci de renseigner un nom.
          </div>
        )}
        <form action={addClient} className="mt-4 grid gap-3">
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            placeholder="Nom et prénom"
            name="name"
            required
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            placeholder="Email"
            name="email"
            type="email"
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            placeholder="Téléphone"
            name="phone"
          />
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            placeholder="Adresse"
            name="address"
          />
          <button
            className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Enregistrer
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Liste des clients</h2>
        {resolvedParams?.blocked === "1" && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Impossible de supprimer un client avec des réservations ou factures.
          </div>
        )}
        {clients.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucun client enregistré.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {clients.map((client) => (
              <div
                key={client.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{client.name}</p>
                  <p className="text-xs text-[color:var(--muted)]">
                    {client.email || "Email non renseigné"}
                    {client.phone ? ` • ${client.phone}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                    href={`/admin/clients/${client.id}`}
                  >
                    Voir fiche
                  </a>
                  <form action={deleteClient}>
                    <input type="hidden" name="id" value={client.id} />
                    <button
                      className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                      type="submit"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
