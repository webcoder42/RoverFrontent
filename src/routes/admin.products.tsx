import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Package, PlusCircle, Search, Image as ImageIcon, UploadCloud } from "lucide-react";
import { PageTransition } from "@/components/common/PageTransition";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProducts,
});

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrls: string[];
  stock: number;
  createdAt: string;
}

const categoryOptions = [
  "Electronics & Mobiles",
  "Fashion & Apparel",
  "Home & Kitchen",
  "Beauty & Personal Care",
  "Grocery & Essentials",
  "Sports & Fitness",
  "Books & Stationery",
  "Toys & Baby Products",
];

function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: categoryOptions[0],
    imageUrls: [] as string[],
    stock: "1",
    stockStatus: "in-stock" as "in-stock" | "out-of-stock",
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const res = await fetch("/api/admin/products", { headers });
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    setUploadingImage(true);
    setMessage("Uploading images...");

    try {
      const uploadedUrls: string[] = [];

      if (cloudName && uploadPreset) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (!res.ok || !data.secure_url) {
            throw new Error(data.error?.message || "Image upload failed");
          }

          uploadedUrls.push(data.secure_url);
        }
      } else {
        for (const file of files) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read image file"));
            reader.readAsDataURL(file);
          });
          uploadedUrls.push(dataUrl);
        }
      }

      setForm((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, ...uploadedUrls] }));
      setMessage(`${uploadedUrls.length} image(s) ready.`);
    } catch (error: any) {
      setMessage(error.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const resolvedStock = form.stockStatus === "in-stock" ? Math.max(1, Number(form.stock || 1)) : 0;
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", String(Number(form.price)));
      formData.append("category", form.category);
      formData.append("stock", String(resolvedStock));

      form.imageUrls.forEach((url, index) => {
        if (url.startsWith("data:image/")) {
          const base64 = url.split(",")[1];
          const mimeMatch = url.match(/^data:(.*?);base64,/);
          const mimeType = mimeMatch?.[1] || "image/jpeg";
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
          }
          const file = new File([bytes], `image-${index + 1}.${mimeType.split("/")[1] || "jpg"}`, { type: mimeType });
          formData.append("images", file);
        }
      });

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to save product");

      setMessage("Product saved successfully.");
      setForm({
        name: "",
        description: "",
        price: "",
        category: categoryOptions[0],
        imageUrls: [],
        stock: "1",
        stockStatus: "in-stock",
      });
      fetchProducts();
    } catch (error: any) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = products.filter((p) =>
    `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground">Add a simple product with photo URL, price, category, and stock.</p>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-56 rounded-xl border border-border/60 bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Add Product</h2>
          </div>

          <div className="space-y-3">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Product name"
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description"
              rows={3}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Price"
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="rounded-xl border border-dashed border-border/60 bg-background p-3">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <UploadCloud className="h-4 w-4" />
                <span>{uploadingImage ? "Uploading..." : "Upload multiple images"}</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
              </label>
            </div>

            <div className="rounded-xl border border-border/60 bg-background p-3 text-sm text-muted-foreground">
              {form.imageUrls.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.imageUrls.map((url, index) => (
                    <img key={`${url}-${index}`} src={url} alt={`Preview ${index + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              ) : (
                <span>No images selected yet.</span>
              )}
            </div>

            <select
              value={form.stockStatus}
              onChange={(e) => setForm({ ...form, stockStatus: e.target.value as "in-stock" | "out-of-stock" })}
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            >
              <option value="in-stock">In Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>

            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              placeholder="Stock quantity"
              className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-70"
          >
            {submitting ? "Saving..." : "Save Product"}
          </button>
        </form>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Saved Products</h2>
              <p className="text-sm text-muted-foreground">Stored in the database for testing.</p>
            </div>
            <div className="rounded-full bg-muted p-2">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">Loading products...</div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">No products yet.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((product) => (
                <div key={product._id} className="rounded-xl border border-border/60 bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.category}</div>
                    </div>
                    <div className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      ${Number(product.price).toFixed(2)}
                    </div>
                  </div>
                  {product.imageUrls?.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {product.imageUrls.slice(0, 4).map((url, index) => (
                        <img key={`${product._id}-${index}`} src={url} alt={`${product.name} ${index + 1}`} className="h-24 w-full rounded-lg object-cover" />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 flex h-28 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40 text-muted-foreground">
                      <ImageIcon className="mr-2 h-4 w-4" />
                      No image
                    </div>
                  )}
                  <div className="mt-2 text-sm text-muted-foreground">
                    {product.description || "No description provided."}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5" />
                    {product.imageUrls?.length ? `${product.imageUrls.length} image(s)` : "No image URL"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {product.stock > 0 ? `In stock · Qty ${product.stock}` : "Out of stock"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
