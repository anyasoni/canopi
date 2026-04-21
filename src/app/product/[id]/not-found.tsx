import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Product not found</h1>
      <p className="text-gray-600">
        Sorry we couldn&apos;t find this product. Browse available products from the home page.
      </p>
      <Link href="/" className="font-medium text-emerald-700 hover:underline">
        ← Back to products
      </Link>
    </main>
  );
}
