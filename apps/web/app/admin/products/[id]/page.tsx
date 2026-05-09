import { db } from "@/lib/db";
import { getAdminProductDetail } from "@bananasbindery/db";
import ProductForm from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getAdminProductDetail(db, params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900">Edit Product</h2>
        <p className="text-gray-500 font-medium">Update informasi dan varian untuk {product.name}.</p>
      </div>
      
      <ProductForm initialData={product} isEdit />
    </div>
  );
}
