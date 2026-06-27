import { prisma } from "./prisma";

/**
 * Release all PENDING reservations past their expiresAt.
 * Called lazily on GET /api/products and by the cron job.
 */
export async function releaseExpiredReservations(): Promise<number> {
  const now = new Date();

  // Fetch expired PENDING reservations
  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
    select: { id: true, productId: true, warehouseId: true, quantity: true },
  });

  if (expired.length === 0) return 0;

  // Update each in a transaction: mark RELEASED + decrement reservedUnits
  await prisma.$transaction(
    expired.map((r) =>
      prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId: r.productId,
            warehouseId: r.warehouseId,
          },
        },
        data: { reservedUnits: { decrement: r.quantity } },
      })
    )
  );

  await prisma.reservation.updateMany({
    where: { id: { in: expired.map((r) => r.id) } },
    data: { status: "RELEASED" },
  });

  return expired.length;
}
