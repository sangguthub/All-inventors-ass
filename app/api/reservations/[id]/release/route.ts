import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (reservation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only PENDING reservations can be released" },
        { status: 409 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: { reservedUnits: { decrement: reservation.quantity } },
      });

      return tx.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
        include: {
          product: { select: { name: true, sku: true, price: true } },
          warehouse: { select: { name: true, location: true } },
        },
      });
    });

    return NextResponse.json({
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
    });
  } catch (err) {
    console.error("[POST /api/reservations/:id/release]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
