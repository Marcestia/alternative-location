"use client";

import { useFormStatus } from "react-dom";

export default function ContactSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="w-full rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.25)] transition disabled:cursor-wait disabled:opacity-80 sm:w-auto"
      type="submit"
      disabled={pending}
    >
      {pending ? "Envoi en cours..." : "Envoyer la demande"}
    </button>
  );
}
