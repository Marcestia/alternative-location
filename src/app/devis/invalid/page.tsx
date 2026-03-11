export default function InvalidPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Lien invalide</h1>
      <p className="mt-4 text-sm text-[color:var(--muted)]">
        Ce lien n'existe pas ou a expiré.
      </p>
    </div>
  );
}
