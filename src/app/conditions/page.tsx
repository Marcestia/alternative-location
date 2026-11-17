import ConditionsContent from "@/components/ConditionsContent";
import { CG_VERSION } from "@/lib/conditions";

export default function ConditionsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="rounded-xl border border-black/5 bg-white p-6 sm:p-10">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Conditions generales
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Conditions de location</h1>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          Les presentes conditions generales de location (ci-apres les
          &quot;CG&quot;) s&apos;appliquent a toute location d&apos;articles de
          vaisselle, decoration et petit mobilier proposee par Alternative
          Location (ci-apres le &quot;Loueur&quot;). Le client est designe
          ci-apres le &quot;Locataire&quot;.
        </p>
        <p className="mt-3 text-xs text-[color:var(--muted)]">
          Version : {CG_VERSION}
        </p>

        <div className="mt-8 space-y-6">
          <ConditionsContent className="space-y-6" />
        </div>
      </div>
    </main>
  );
}
