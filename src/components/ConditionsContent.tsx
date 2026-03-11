import { CONDITIONS_SECTIONS } from "@/lib/conditions";

type ConditionsContentProps = {
  className?: string;
};

export default function ConditionsContent({ className }: ConditionsContentProps) {
  return (
    <div className={className}>
      {CONDITIONS_SECTIONS.map((section) => (
        <section key={section.title} className="space-y-2">
          <h2 className="text-base font-semibold text-[color:var(--ink)]">
            {section.title}
          </h2>
          {section.intro && (
            <p className="text-sm text-[color:var(--muted)]">
              {section.intro}
            </p>
          )}
          <ul className="space-y-1 text-sm text-[color:var(--muted)]">
            {section.bullets.map((bullet, index) => (
              <li key={`${section.title}-${index}`}>{bullet}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
