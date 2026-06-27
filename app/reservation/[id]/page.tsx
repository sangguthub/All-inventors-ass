"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReservationResponse } from "@/types";

type UIState = "loading" | "loaded" | "error";

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "default",
  CONFIRMED: "secondary",
  RELEASED: "destructive",
};

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<ReservationResponse | null>(null);
  const [uiState, setUiState] = useState<UIState>("loading");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"confirm" | "release" | null>(null);

  const loadReservation = useCallback(async () => {
    try {
      // We fetch the reservation by calling a simple GET using the cron pattern.
      // Since we don't have a GET /api/reservations/:id, we reconstruct from the
      // confirm endpoint — instead, we call the products list. Actually, let's
      // fetch by id via a dedicated path. We'll hit /api/reservations/:id (GET).
      const res = await fetch(`/api/reservations/${id}`);
      if (!res.ok) {
        const data = await res.json();
        setFetchError(data.error ?? "Failed to load reservation.");
        setUiState("error");
        return;
      }
      const data: ReservationResponse = await res.json();
      setReservation(data);
      setUiState("loaded");
    } catch {
      setFetchError("Network error. Please refresh.");
      setUiState("error");
    }
  }, [id]);

  useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  async function handleAction(action: "confirm" | "release") {
    if (!reservation) return;
    setActionError(null);
    setActionLoading(action);

    try {
      const res = await fetch(`/api/reservations/${id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.status === 410) {
        setActionError("This reservation has expired.");
        setReservation((prev) => prev ? { ...prev, status: "RELEASED" } : prev);
        return;
      }

      if (!res.ok) {
        setActionError(data.error ?? "Something went wrong.");
        return;
      }

      setReservation(data);
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  if (uiState === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading reservation…</p>
      </main>
    );
  }

  if (uiState === "error" || !reservation) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-red-600 font-medium">{fetchError ?? "Reservation not found."}</p>
          <Link href="/" className="text-sm text-muted-foreground underline">
            Back to products
          </Link>
        </div>
      </main>
    );
  }

  const isPending = reservation.status === "PENDING";
  const isExpired =
    isPending && new Date(reservation.expiresAt) < new Date();
  const isFinal = reservation.status !== "PENDING" || isExpired;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-10">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline mb-6 inline-block"
        >
          &larr; Back to products
        </Link>

        <Card>
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle>{reservation.product.name}</CardTitle>
              <Badge variant={STATUS_BADGE[reservation.status] ?? "outline"}>
                {isExpired ? "EXPIRED" : reservation.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              SKU: {reservation.product.sku}
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Warehouse</p>
                <p className="font-medium">{reservation.warehouse.name}</p>
                <p className="text-xs text-muted-foreground">
                  {reservation.warehouse.location}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity</p>
                <p className="font-medium">{reservation.quantity} unit(s)</p>
              </div>
              <div>
                <p className="text-muted-foreground">Price per unit</p>
                <p className="font-medium">
                  ₹
                  {parseFloat(reservation.product.price).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium">
                  ₹
                  {(
                    parseFloat(reservation.product.price) * reservation.quantity
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {isPending && !isExpired && (
              <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-amber-800 font-medium">
                  Reservation expires in
                </span>
                <CountdownTimer expiresAt={reservation.expiresAt} />
              </div>
            )}

            {(isExpired || reservation.status === "RELEASED") && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700 font-medium">
                  This reservation has expired. The stock has been released.
                </p>
              </div>
            )}

            {reservation.status === "CONFIRMED" && (
              <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-sm text-green-700 font-medium">
                  Purchase confirmed! Your order has been placed.
                </p>
              </div>
            )}

            {actionError && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {actionError}
              </div>
            )}

            {!isFinal && (
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  onClick={() => handleAction("confirm")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "confirm" ? "Confirming…" : "Confirm Purchase"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAction("release")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "release" ? "Cancelling…" : "Cancel"}
                </Button>
              </div>
            )}

            {isFinal && (
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Back to Products
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Reservation ID: {reservation.id}
        </p>
      </div>
    </main>
  );
}
