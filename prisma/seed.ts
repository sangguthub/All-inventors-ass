import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Upsert warehouses
  const mumbai = await prisma.warehouse.upsert({
    where: { id: "warehouse-mumbai" },
    update: {},
    create: {
      id: "warehouse-mumbai",
      name: "Mumbai Central",
      location: "Mumbai, Maharashtra",
    },
  });

  const delhi = await prisma.warehouse.upsert({
    where: { id: "warehouse-delhi" },
    update: {},
    create: {
      id: "warehouse-delhi",
      name: "Delhi North",
      location: "Delhi, NCR",
    },
  });

  // Upsert products
  const headphones = await prisma.product.upsert({
    where: { sku: "WH-001" },
    update: {},
    create: {
      id: "product-headphones",
      name: "Wireless Headphones",
      sku: "WH-001",
      description: "Premium noise-cancelling wireless headphones with 30h battery life.",
      price: 2999.99,
    },
  });

  const keyboard = await prisma.product.upsert({
    where: { sku: "MK-002" },
    update: {},
    create: {
      id: "product-keyboard",
      name: "Mechanical Keyboard",
      sku: "MK-002",
      description: "Tenkeyless mechanical keyboard with Cherry MX Blue switches.",
      price: 4499.99,
    },
  });

  const hub = await prisma.product.upsert({
    where: { sku: "UC-003" },
    update: {},
    create: {
      id: "product-hub",
      name: "USB-C Hub",
      sku: "UC-003",
      description: "7-in-1 USB-C hub with 4K HDMI, 100W PD, and SD card reader.",
      price: 1299.99,
    },
  });

  // Create stock records: 10 units each, 0 reserved
  const stockCombinations = [
    { productId: headphones.id, warehouseId: mumbai.id },
    { productId: headphones.id, warehouseId: delhi.id },
    { productId: keyboard.id, warehouseId: mumbai.id },
    { productId: keyboard.id, warehouseId: delhi.id },
    { productId: hub.id, warehouseId: mumbai.id },
    { productId: hub.id, warehouseId: delhi.id },
  ];

  for (const combo of stockCombinations) {
    await prisma.stock.upsert({
      where: {
        productId_warehouseId: {
          productId: combo.productId,
          warehouseId: combo.warehouseId,
        },
      },
      update: {},
      create: {
        ...combo,
        totalUnits: 10,
        reservedUnits: 0,
      },
    });
  }

  console.log("Seed complete: 3 products, 2 warehouses, 6 stock records.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
