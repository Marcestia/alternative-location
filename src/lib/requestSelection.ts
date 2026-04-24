export type RequestedSelectionItem = {
  itemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  imageUrl: string | null;
};

export type ContactRequestDraft = {
  name: string;
  email: string;
  phone: string;
  address: string;
  eventType: string;
  eventLocation: string;
  guestCount: string;
  budget: string;
  eventDate: string;
  message: string;
};

export const CONTACT_REQUEST_DRAFT_STORAGE_KEY = "al_contact_request_draft";
export const CONTACT_REQUEST_SELECTION_STORAGE_KEY = "al_contact_request_items";

const toSafeString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toSafeQuantity = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

const toSafeCents = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed));
};

export function normalizeRequestedSelection(
  raw: unknown
): RequestedSelectionItem[] {
  if (!Array.isArray(raw)) return [];

  const byItemId = new Map<string, RequestedSelectionItem>();

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;

    const itemId = toSafeString((entry as { itemId?: unknown }).itemId);
    const name = toSafeString((entry as { name?: unknown }).name);
    const quantity = toSafeQuantity((entry as { quantity?: unknown }).quantity);
    const unitPriceCents = toSafeCents(
      (entry as { unitPriceCents?: unknown }).unitPriceCents
    );
    const imageUrl = toSafeString((entry as { imageUrl?: unknown }).imageUrl) || null;

    if (!itemId || !name || quantity <= 0) continue;

    const existing = byItemId.get(itemId);
    if (existing) {
      existing.quantity += quantity;
      if (!existing.imageUrl && imageUrl) existing.imageUrl = imageUrl;
      if (existing.unitPriceCents <= 0 && unitPriceCents > 0) {
        existing.unitPriceCents = unitPriceCents;
      }
      continue;
    }

    byItemId.set(itemId, {
      itemId,
      name,
      quantity,
      unitPriceCents,
      imageUrl,
    });
  }

  return Array.from(byItemId.values());
}

export function parseRequestedSelection(
  value: string | null | undefined
): RequestedSelectionItem[] {
  if (!value) return [];

  try {
    return normalizeRequestedSelection(JSON.parse(value));
  } catch {
    return [];
  }
}

export function stringifyRequestedSelection(items: RequestedSelectionItem[]) {
  return JSON.stringify(normalizeRequestedSelection(items));
}

export function normalizeContactRequestDraft(
  raw: unknown
): ContactRequestDraft | null {
  if (!raw || typeof raw !== "object") return null;

  return {
    name: toSafeString((raw as { name?: unknown }).name),
    email: toSafeString((raw as { email?: unknown }).email),
    phone: toSafeString((raw as { phone?: unknown }).phone),
    address: toSafeString((raw as { address?: unknown }).address),
    eventType: toSafeString((raw as { eventType?: unknown }).eventType),
    eventLocation: toSafeString((raw as { eventLocation?: unknown }).eventLocation),
    guestCount: toSafeString((raw as { guestCount?: unknown }).guestCount),
    budget: toSafeString((raw as { budget?: unknown }).budget),
    eventDate: toSafeString((raw as { eventDate?: unknown }).eventDate),
    message: toSafeString((raw as { message?: unknown }).message),
  };
}
