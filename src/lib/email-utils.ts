export type EmailActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};
export const emailKinds: Record<string, string> = {
  ACKNOWLEDGEMENT: "Accusé de réception",
  REQUEST_REFUSAL: "Réponse à une demande",
  QUOTE: "Devis",
  INVOICE: "Facture",
  RESERVATION_CONFIRMATION: "Confirmation de réservation",
  OTHER: "Autre message",
};
export const EMAIL_LEASE_MS = 10 * 60 * 1000;
export const EMAIL_COOLDOWN_MS = 30 * 1000;

export function validEmail(value: string) {
  return (
    value.length <= 254 && /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(value)
  );
}

export function emailErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === "EAUTH")
    return "Connexion refusée par OVH. Vérifiez l’adresse d’envoi et le mot de passe SMTP configuré sur Vercel.";
  if (code === "ETIMEDOUT" || code === "ECONNECTION" || code === "ESOCKET")
    return "Le serveur de messagerie ne répond pas. Réessayez après avoir vérifié la connexion. Un délai dépassé peut laisser l’envoi incertain.";
  if (code === "EENVELOPE")
    return "Le serveur a refusé le destinataire. Vérifiez son adresse e-mail.";
  if (code === "MAIL_CONFIG")
    return "Configuration SMTP incomplète. Vérifiez les paramètres de messagerie sur Vercel.";
  if (code === "MAIL_BUSY")
    return "Un envoi est déjà en cours, ou vient de se terminer. Attendez quelques instants avant de réessayer.";
  if (code === "MAIL_RECIPIENT")
    return "L’adresse e-mail du destinataire est invalide.";
  return "L’envoi n’a pas pu être confirmé. Consultez les paramètres puis réessayez. En cas de doute, vérifiez les copies reçues avant de renvoyer.";
}

export function emailStatus(status: string, lastAttemptAt: Date | null) {
  if (
    status === "SENDING" &&
    lastAttemptAt &&
    Date.now() - lastAttemptAt.getTime() > EMAIL_LEASE_MS
  )
    return "À vérifier";
  return (
    (
      {
        SENT: "Accepté par le serveur",
        FAILED: "Échec",
        SENDING: "Envoi en cours",
        PENDING: "En attente",
      } as Record<string, string>
    )[status] ?? status
  );
}

export type StoredAttachment = {
  filename: string;
  contentBase64: string;
  contentType?: string;
};
export function decodeAttachments(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((entry: StoredAttachment) => {
    if (
      !entry ||
      typeof entry.filename !== "string" ||
      typeof entry.contentBase64 !== "string"
    )
      throw new Error("Invalid stored attachment");
    return {
      filename: entry.filename,
      content: Buffer.from(entry.contentBase64, "base64"),
      contentType: entry.contentType,
    };
  });
}
