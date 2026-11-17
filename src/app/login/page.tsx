import { adminLogin } from "@/app/actions/auth";

import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  return (
    <main className="login-page">
      <div className="login-panel">
        <Link href="/" className="login-brand">
          alternative.
        </Link>
        <h1>Bienvenue dans votre espace.</h1>
        <p>
          Retrouvez vos demandes, vos réservations et toute la gestion de votre
          activité.
        </p>
        {resolvedParams?.error === "1" && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
            Identifiants incorrects.
          </div>
        )}
        <form action={adminLogin} className="grid gap-4">
          <input
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
            placeholder="Mot de passe"
            aria-label="Mot de passe"
            autoComplete="current-password"
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
        <Link href="/" className="login-back">
          ← Retour au site
        </Link>
      </div>
    </main>
  );
}
