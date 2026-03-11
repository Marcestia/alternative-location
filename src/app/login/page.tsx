import { adminLogin } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  return (
    <div className="min-h-screen bg-[color:var(--background)] px-6 py-16">
      <div className="mx-auto w-full max-w-sm rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_20px_40px_rgba(30,25,20,0.12)]">
        {resolvedParams?.error === "1" && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            Identifiants incorrects.
          </div>
        )}
        <form action={adminLogin} className="grid gap-4">
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            placeholder="Mot de passe"
            name="pass"
            type="password"
            required
          />
          <button
            className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
