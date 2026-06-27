import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/expiry";
import type { ProductWithStock } from "@/types";

export async function GET() {
  try {
    // Lazy cleanup: expire stale reservations before computing availability
    await releaseExpiredReservations();

    const products = await prisma.product.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        stocks: {
          include: { warehouse: true },
        },
      },
    });

    const result: ProductWithStock[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      description: p.description,
      price: p.price.toString(),
      createdAt: p.createdAt.toISOString(),
      stocks: p.stocks.map((s) => ({
        warehouseId: s.warehouseId,
        warehouseName: s.warehouse.name,
        totalUnits: s.totalUnits,
        reservedUnits: s.reservedUnits,
        availableUnits: s.totalUnits - s.reservedUnits,
      })),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
