import { redis } from "./redis";

const LOCK_TTL_MS = 5000; // 5 seconds max lock hold time

export async function acquireLock(key: string): Promise<string | null> {
  const lockValue = `${Date.now()}-${Math.random()}`;
  // SET NX PX: only set if key does not exist, with TTL in ms
  const result = await redis.set(key, lockValue, {
    nx: true,
    px: LOCK_TTL_MS,
  });
  return result === "OK" ? lockValue : null;
}

export async function releaseLock(key: string, lockValue: string): Promise<void> {
  // Only release if we still own the lock (compare-and-delete)
  const current = await redis.get(key);
  if (current === lockValue) {
    await redis.del(key);
  }
}

export function stockLockKey(productId: string, warehouseId: string): string {
  return `lock:stock:${productId}:${warehouseId}`;
}
