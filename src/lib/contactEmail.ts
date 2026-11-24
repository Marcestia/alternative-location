import { sendMail } from "@/lib/mailer";

export async function sendContactAcknowledgement(request: {
  id: string;
  email: string;
  name: string;
  clientId: string | null;
}) {
  return sendMail({
    to: request.email,
    kind: "ACKNOWLEDGEMENT",
    entityId: request.id,
    clientId: request.clientId,
    dedupeKey: `acknowledgement:${request.id}`,
    subject: "Demande reçue - Alternative Location",
    text: `Bonjour ${request.name},\n\nMerci pour votre demande. Nous l'avons bien reçue et revenons vers vous rapidement pour préciser les détails.\n\nÀ bientôt,\nAlternative Location`,
  });
}
