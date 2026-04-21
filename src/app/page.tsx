import Link from "next/link";
import { getAllProducts } from "@/lib/data";

export default function HomePage() {
  const products = getAllProducts();

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Canopi
        </h1>
        <p className="text-base text-gray-600">
          {products.length} products found.
        </p>
      </header>
      <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {products.map((p) => (
          <li key={p.id}>
            <Link
              href={`/product/${p.id}`}
              className="flex flex-col gap-0.5 px-4 py-3 text-foreground hover:bg-gray-50"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-sm text-gray-600">
                {p.brand} · {p.category} · Risk {p.riskScore}/10
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
