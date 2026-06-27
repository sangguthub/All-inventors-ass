"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductWithStock } from "@/types";

const reserveSchema = z.object({
  warehouseId: z.string().min(1, "Select a warehouse"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

interface ReserveModalProps {
  product: ProductWithStock;
  open: boolean;
  onClose: () => void;
}

export function ReserveModal({ product, open, onClose }: ReserveModalProps) {
  const router = useRouter();
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableForWarehouse =
    product.stocks.find((s) => s.warehouseId === warehouseId)?.availableUnits ?? 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = reserveSchema.safeParse({ warehouseId, quantity });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Validation error");
      return;
    }

    if (quantity > availableForWarehouse) {
      setError(`Only ${availableForWarehouse} unit(s) available in this warehouse.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          warehouseId,
          quantity,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        setError(data.error ?? "Not enough stock available.");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      onClose();
      router.push(`/reservation/${data.id}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve — {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="warehouse">Warehouse</Label>
            <Select
              value={warehouseId}
              onValueChange={(v: string | null) => {
                setWarehouseId(v ?? "");
                setError(null);
              }}
            >
              <SelectTrigger id="warehouse">
                <SelectValue placeholder="Select a warehouse" />
              </SelectTrigger>
              <SelectContent>
                {product.stocks.map((s) => (
                  <SelectItem
                    key={s.warehouseId}
                    value={s.warehouseId}
                    disabled={s.availableUnits === 0}
                  >
                    {s.warehouseName}{" "}
                    <span className="text-muted-foreground ml-1">
                      ({s.availableUnits} available)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={warehouseId ? availableForWarehouse : 999}
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value));
                setError(null);
              }}
            />
            {warehouseId && (
              <p className="text-xs text-muted-foreground">
                Max {availableForWarehouse} unit(s) available
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !warehouseId}>
              {loading ? "Reserving…" : "Reserve"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
