import { ReservationStatus } from "@prisma/client";

export type { ReservationStatus };

export interface ProductWithStock {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  price: string;
  createdAt: string;
  stocks: {
    warehouseId: string;
    warehouseName: string;
    totalUnits: number;
    reservedUnits: number;
    availableUnits: number;
  }[];
}

export interface WarehouseResponse {
  id: string;
  name: string;
  location: string;
}

export interface ReservationResponse {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  product: {
    name: string;
    sku: string;
    price: string;
  };
  warehouse: {
    name: string;
    location: string;
  };
}

export interface ApiError {
  error: string;
  code?: string;
}
