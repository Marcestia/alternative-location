"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { loadAnalyticsSnapshot } from "@/lib/analytics-data";
import { parseIndicatorDefinition } from "@/lib/indicator-config";
import { calculateIndicator } from "@/lib/indicator-engine";
import type { IndicatorActionState } from "@/lib/indicator-state";

export async function runIndicator(
  _previousState: IndicatorActionState,
  formData: FormData,
): Promise<IndicatorActionState> {
  await requireAdmin();
  const raw = formData.get("definition");
  const intent = formData.get("intent");
  if (
    typeof raw !== "string" ||
    raw.length > 10000 ||
    !["preview", "save"].includes(String(intent))
  )
    return {
      status: "error",
      message: "Configuration invalide. Vérifiez les champs.",
    };
  let definition;
  try {
    definition = parseIndicatorDefinition(JSON.parse(raw));
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Configuration invalide.",
    };
  }
  const name = String(formData.get("name") ?? "").trim();
  const id = String(formData.get("id") ?? "").trim();
  if (id.length > 128)
    return { status: "error", message: "Indicateur introuvable." };
  if (intent === "save" && (!name || name.length > 80))
    return {
      status: "error",
      message: "Donnez un nom de 1 à 80 caractères à cet indicateur.",
    };
  let result;
  let savedId = id || undefined;
  try {
    const snapshot = await loadAnalyticsSnapshot(
      undefined,
      definition.source === "items",
    );
    if (
      definition.clientId &&
      !snapshot.clients.some((c) => c.id === definition.clientId)
    )
      return {
        status: "error",
        message: "Ce client n’existe plus. Choisissez un autre client.",
      };
    result = calculateIndicator(snapshot, definition);
    if (intent === "save") {
      if (id) {
        await prisma.savedIndicator.update({
          where: { id },
          data: { name, definition: { ...definition } },
        });
      } else {
        savedId = (
          await prisma.savedIndicator.create({
            data: { name, definition: { ...definition } },
            select: { id: true },
          })
        ).id;
      }
    }
  } catch (error) {
    console.error(
      "Indicator calculation or save failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return {
      status: "error",
      message:
        "Le calcul ou l’enregistrement a échoué. Vos réglages sont conservés ; réessayez.",
    };
  }
  if (intent === "save") {
    revalidatePath("/admin/indicateurs");
    redirect(`/admin/indicateurs?edit=${encodeURIComponent(savedId!)}&saved=1`);
  }
  return {
    status: "success",
    message: "Indicateur calculé avec les données actuelles.",
    result,
    signature: raw,
  };
}

export async function deleteIndicator(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id");
  if (typeof id !== "string" || !id || id.length > 128)
    redirect("/admin/indicateurs");
  await prisma.savedIndicator.deleteMany({ where: { id } });
  revalidatePath("/admin/indicateurs");
  redirect("/admin/indicateurs?deleted=1");
}
