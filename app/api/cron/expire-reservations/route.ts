import { NextRequest, NextResponse } from "next/server";
import { releaseExpiredReservations } from "@/lib/expiry";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const released = await releaseExpiredReservations();
    return NextResponse.json({ released, ok: true });
  } catch (err) {
    console.error("[CRON expire-reservations]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
