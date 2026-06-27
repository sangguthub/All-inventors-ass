import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { acquireLock, releaseLock, stockLockKey } from "@/lib/lock";

const RESERVATION_TTL_MINUTES = 10;

const bodySchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get("Idempotency-Key");

    // --- Idempotency check ---
    if (idempotencyKey) {
      const cached = await redis.get<string>(`idempotent:${idempotencyKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        return NextResponse.json(parsed.body, { status: parsed.status });
      }
    }

    // --- Validate body ---
    const raw = await req.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, warehouseId, quantity } = parsed.data;
    const lockKey = stockLockKey(productId, warehouseId);

    // --- Acquire distributed lock (retry once after 50ms) ---
    let lockValue = await acquireLock(lockKey);
    if (!lockValue) {
      await new Promise((r) => setTimeout(r, 50));
      lockValue = await acquireLock(lockKey);
    }
    if (!lockValue) {
      const body = { error: "Not enough stock available" };
      return NextResponse.json(body, { status: 409 });
    }

    try {
      // --- Transactional check + reserve ---
      const result = await prisma.$transaction(async (tx) => {
        // Re-read stock inside the transaction with a row-level lock
        const stocks = await tx.$queryRaw<
          { id: string; totalUnits: number; reservedUnits: number }[]
        >`
          SELECT id, "totalUnits", "reservedUnits"
          FROM "Stock"
          WHERE "productId" = ${productId}
            AND "warehouseId" = ${warehouseId}
          FOR UPDATE
        `;

        const stock = stocks[0];
        if (!stock) {
          throw new Error("STOCK_NOT_FOUND");
        }

        const available = stock.totalUnits - stock.reservedUnits;
        if (available < quantity) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        // Increment reservedUnits
        await tx.stock.update({
          where: {
            productId_warehouseId: { productId, warehouseId },
          },
          data: { reservedUnits: { increment: quantity } },
        });

        // Create reservation record
        const expiresAt = new Date(
          Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000
        );

        const reservation = await tx.reservation.create({
          data: {
            productId,
            warehouseId,
            quantity,
            status: "PENDING",
            expiresAt,
            idempotencyKey: idempotencyKey ?? undefined,
          },
          include: {
            product: { select: { name: true, sku: true, price: true } },
            warehouse: { select: { name: true, location: true } },
          },
        });

        return reservation;
      });

      const responseBody = {
        id: result.id,
        productId: result.productId,
        warehouseId: result.warehouseId,
        quantity: result.quantity,
        status: result.status,
        expiresAt: result.expiresAt.toISOString(),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
        product: {
          name: result.product.name,
          sku: result.product.sku,
          price: result.product.price.toString(),
        },
        warehouse: {
          name: result.warehouse.name,
          location: result.warehouse.location,
        },
      };

      // Cache idempotent response for 24h
      if (idempotencyKey) {
        await redis.set(
          `idempotent:${idempotencyKey}`,
          JSON.stringify({ body: responseBody, status: 201 }),
          { ex: 86400 }
        );
      }

      return NextResponse.json(responseBody, { status: 201 });
    } catch (txErr: unknown) {
      const msg = txErr instanceof Error ? txErr.message : "";

      if (msg === "INSUFFICIENT_STOCK" || msg === "STOCK_NOT_FOUND") {
        return NextResponse.json(
          { error: "Not enough stock available" },
          { status: 409 }
        );
      }
      throw txErr;
    } finally {
      await releaseLock(lockKey, lockValue);
    }
  } catch (err) {
    console.error("[POST /api/reservations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
