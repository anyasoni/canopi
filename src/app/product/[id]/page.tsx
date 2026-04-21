import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductContext } from "@/lib/data";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

const ProductPage = async ({ params }: ProductPageProps) => {
  const { id } = await params;
  const context = getProductContext(id);

  if (!context) {
    notFound();
  }

  const { product, company } = context;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Back to products
      </Link>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
        <p className="text-gray-600">
          {product.brand} · {product.category}
          {company ? ` · ${company.name}` : null}
        </p>
        <p className="text-sm text-gray-500">
          Product detail layout and report loading ship in later tickets. Data for this URL is valid.
        </p>
      </header>
    </main>
  );
};

export default ProductPage;
