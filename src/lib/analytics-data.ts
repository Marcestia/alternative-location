import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { AnalyticsSnapshot } from "@/lib/analytics";

export const loadAnalyticsSnapshot = cache(
  async (
    clientId?: string,
    includeCatalog = false,
  ): Promise<AnalyticsSnapshot> => {
    const where = clientId ? { clientId } : {};
    const [clients, reservations, quotes, invoices, requests, items] =
      await prisma.$transaction(
        [
          prisma.client.findMany({
            where: clientId ? { id: clientId } : {},
            select: { id: true, name: true, createdAt: true },
          }),
          prisma.reservation.findMany({
            where,
            select: {
              id: true,
              clientId: true,
              code: true,
              status: true,
              startDate: true,
              endDate: true,
              eventDate: true,
              createdAt: true,
              items: {
                select: {
                  id: true,
                  quantity: true,
                  unitPriceCents: true,
                  item: {
                    select: {
                      id: true,
                      name: true,
                      category: { select: { name: true } },
                    },
                  },
                },
              },
            },
          }),
          prisma.quote.findMany({
            where,
            select: {
              id: true,
              clientId: true,
              quoteNumber: true,
              status: true,
              startDate: true,
              endDate: true,
              eventDate: true,
              createdAt: true,
              signedAt: true,
              totalAmountCents: true,
              depositAmountCents: true,
              contactRequest: { select: { eventType: true } },
            },
          }),
          prisma.invoice.findMany({
            where,
            select: {
              id: true,
              clientId: true,
              number: true,
              status: true,
              quoteId: true,
              reservationId: true,
              totalAmountCents: true,
              advanceAmountCents: true,
              advanceReceivedAt: true,
              issueDate: true,
              paidAt: true,
              serviceDate: true,
              createdAt: true,
            },
          }),
          prisma.contactRequest.findMany({
            where,
            select: {
              id: true,
              clientId: true,
              status: true,
              createdAt: true,
              eventDate: true,
              eventType: true,
              guestCount: true,
              budgetCents: true,
            },
          }),
          prisma.item.findMany({
            where: includeCatalog ? {} : { id: { in: [] } },
            select: {
              id: true,
              name: true,
              active: true,
              totalQty: true,
              damageQty: true,
              rentalPriceCents: true,
              depositPriceCents: true,
              createdAt: true,
              category: { select: { name: true } },
            },
          }),
        ],
        { isolationLevel: "RepeatableRead" },
      );
    return { clients, reservations, quotes, invoices, requests, items };
  },
);
