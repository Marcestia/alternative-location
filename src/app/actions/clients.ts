"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma";
import {
  validateClientForm,
  type ClientFormState,
  type ClientFormValues,
} from "@/lib/clientForm";

async function requireClientAdmin() {
  const store = await cookies();
  const token = store.get("al_admin")?.value;
  if (!token || token !== (process.env.ADMIN_TOKEN ?? "change-me")) {
    redirect("/login");
  }
}

function clientData(values: ClientFormValues) {
  return {
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    address: values.address || null,
    notes: values.notes || null,
  };
}

function saveError(error: unknown, values: ClientFormValues): ClientFormState {
  const missing =
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025";
  if (!missing) console.error("Unable to save client", error);
  return {
    status: "error",
    values,
    message: missing
      ? "Ce client n’existe plus. Revenez à la liste des clients."
      : "L’enregistrement a échoué. Vos modifications sont conservées dans le formulaire ; réessayez.",
  };
}

export async function addClient(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireClientAdmin();
  const { values, fieldErrors } = validateClientForm(formData);
  if (Object.keys(fieldErrors).length) {
    return {
      status: "error",
      message: "Vérifiez les champs indiqués.",
      values,
      fieldErrors,
    };
  }

  let client;
  try {
    client = await prisma.client.create({
      data: clientData(values),
      select: { id: true },
    });
  } catch (error) {
    return saveError(error, values);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/clients/${encodeURIComponent(client.id)}?created=1`);
}

export async function updateClient(
  _previousState: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireClientAdmin();
  const { values, fieldErrors } = validateClientForm(formData);
  const id = formData.get("id");
  if (typeof id !== "string" || !id.trim()) {
    return {
      status: "error",
      values,
      message: "Client introuvable. Revenez à la liste des clients.",
    };
  }
  if (Object.keys(fieldErrors).length) {
    return {
      status: "error",
      message: "Vérifiez les champs indiqués.",
      values,
      fieldErrors,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const previous = await tx.client.findUniqueOrThrow({
        where: { id: id.trim() },
        select: { name: true, email: true, phone: true },
      });
      await tx.client.update({
        where: { id: id.trim() },
        data: clientData(values),
      });

      // Linked requests also supply recipients and contact details for future quotes.
      const contactChanges: {
        name?: string;
        email?: string;
        phone?: string | null;
      } = {};
      if (previous.name !== values.name) contactChanges.name = values.name;
      if ((previous.email ?? "") !== values.email)
        contactChanges.email = values.email;
      if ((previous.phone ?? "") !== values.phone)
        contactChanges.phone = values.phone || null;
      if (Object.keys(contactChanges).length) {
        await tx.contactRequest.updateMany({
          where: { clientId: id.trim() },
          data: contactChanges,
        });
      }
    });
  } catch (error) {
    return saveError(error, values);
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/devis/[token]", "page");
  revalidatePath("/devis/accept/[token]", "page");
  return {
    status: "success",
    message: "La fiche client a été mise à jour.",
    values,
  };
}

export async function deleteClient(formData: FormData) {
  await requireClientAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/clients");
  }

  const [reservations, invoices] = await Promise.all([
    prisma.reservation.count({ where: { clientId: id } }),
    prisma.invoice.count({ where: { clientId: id } }),
  ]);

  if (reservations > 0 || invoices > 0) {
    redirect("/admin/clients?blocked=1");
  }

  await prisma.client.delete({ where: { id } });
  redirect("/admin/clients");
}
