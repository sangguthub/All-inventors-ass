"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReserveModal } from "./ReserveModal";
import type { ProductWithStock } from "@/types";

interface ProductCardProps {
  product: ProductWithStock;
}

export function ProductCard({ product }: ProductCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const totalAvailable = product.stocks.reduce(
    (sum, s) => sum + s.availableUnits,
    0
  );

  const priceNum = parseFloat(product.price);

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{product.name}</CardTitle>
            <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded shrink-0">
              {product.sku}
            </span>
          </div>
          {product.description && (
            <p className="text-sm text-muted-foreground">{product.description}</p>
          )}
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          <p className="text-2xl font-bold">
            ₹{priceNum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Stock by Warehouse
            </p>
            {product.stocks.map((s) => (
              <div
                key={s.warehouseId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">{s.warehouseName}</span>
                <Badge
                  variant={
                    s.availableUnits === 0
                      ? "destructive"
                      : s.availableUnits <= 3
                      ? "secondary"
                      : "default"
                  }
                >
                  {s.availableUnits} available
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={totalAvailable === 0}
            onClick={() => setModalOpen(true)}
          >
            {totalAvailable === 0 ? "Out of Stock" : "Reserve"}
          </Button>
        </CardFooter>
      </Card>

      <ReserveModal
        product={product}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
