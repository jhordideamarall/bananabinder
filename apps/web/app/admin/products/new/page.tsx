import ProductForm from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-black text-gray-900">Add New Product</h2>
        <p className="text-gray-500 font-medium">Buat produk binder baru untuk katalog tokomu.</p>
      </div>
      
      <ProductForm />
    </div>
  );
}
