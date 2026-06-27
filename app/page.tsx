import { ProductCard } from "@/components/ProductCard";
import type { ProductWithStock } from "@/types";

async function getProducts(): Promise<ProductWithStock[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const res = await fetch(`${baseUrl}/api/products`, {
    cache: "no-store",
  });

  if (!res.ok) return [];
  return res.json();
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Allo Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Browse products and reserve stock for 10 minutes while you checkout.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="flex items-center justify-center h-48 rounded-lg border border-dashed text-muted-foreground">
            No products found. Run the seed script to populate the database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
