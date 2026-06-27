import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const idempotencyKey = req.headers.get("Idempotency-Key");

    // Idempotency check
    if (idempotencyKey) {
      const cached = await redis.get<string>(`idempotent:${idempotencyKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return NextResponse.json(parsed.body, { status: parsed.status });
      }
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        product: { select: { name: true, sku: true, price: true } },
        warehouse: { select: { name: true, location: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // 410 if expired or not PENDING
    if (reservation.status !== "PENDING" || reservation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This reservation has expired or is no longer pending" },
        { status: 410 }
      );
    }

    // Confirm: set status, decrement reservedUnits (stock permanently decremented)
    const updated = await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reservedUnits: { decrement: reservation.quantity },
          totalUnits: { decrement: reservation.quantity },
        },
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: {
          product: { select: { name: true, sku: true, price: true } },
          warehouse: { select: { name: true, location: true } },
        },
      });
    });

    const responseBody = {
      id: updated.id,
      productId: updated.productId,
      warehouseId: updated.warehouseId,
      quantity: updated.quantity,
      status: updated.status,
      expiresAt: updated.expiresAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      product: {
        name: updated.product.name,
        sku: updated.product.sku,
        price: updated.product.price.toString(),
      },
      warehouse: {
        name: updated.warehouse.name,
        location: updated.warehouse.location,
      },
    };

    if (idempotencyKey) {
      await redis.set(
        `idempotent:${idempotencyKey}`,
        JSON.stringify({ body: responseBody, status: 200 }),
        { ex: 86400 }
      );
    }

    return NextResponse.json(responseBody);
  } catch (err) {
    console.error("[POST /api/reservations/:id/confirm]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
