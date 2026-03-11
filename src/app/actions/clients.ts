"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function addClient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!name) {
    redirect("/admin/clients?saved=0");
  }

  await prisma.client.create({
    data: {
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
    },
  });

  redirect("/admin/clients?saved=1");
}

export async function deleteClient(formData: FormData) {
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
