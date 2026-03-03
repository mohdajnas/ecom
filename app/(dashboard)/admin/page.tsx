"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "react-hot-toast";
import { Plus, Package, ListOrdered, Trash2, Edit, LayoutDashboard, Image as ImageIcon, Upload, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { compressImageToBase64 } from "@/lib/utils/cropImage";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [categories, setCategories] = useState<string[]>(["Electronics", "Fashion", "Home", "Beauty"]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: "",
        price: 0,
        category: "Electronics",
        stock: 10,
        description: ""
    });

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN"))) {
            router.push("/");
        } else if (user) {
            fetchProducts();
            fetchCategories();
        }
    }, [user, authLoading, router]);

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, "categories"));
            const snap = await getDocs(q);
            const cats = snap.docs.map(doc => doc.data().name);
            if (cats.length > 0) {
                setCategories(cats);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchProducts = async () => {
        try {
            const q = query(collection(db, "products"));
            const snap = await getDocs(q);
            setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            toast.error("Failed to fetch products");
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrls: string[] = [];

            if (imageFile) {
                toast.loading("Processing image...", { id: "upload" });
                const base64ImageUrl = await compressImageToBase64(imageFile, 800, 800, 0.7);
                imageUrls.push(base64ImageUrl);
                toast.dismiss("upload");
            }

            await addDoc(collection(db, "products"), {
                ...newProduct,
                price: Number(newProduct.price),
                stock: Number(newProduct.stock),
                createdAt: serverTimestamp(),
                imageUrls,
                rating: 0
            });
            toast.success("Product added!");
            setIsAdding(false);
            setImageFile(null);
            setImagePreview(null);
            setNewProduct({
                name: "",
                price: 0,
                category: "Electronics",
                stock: 10,
                description: ""
            });
            fetchProducts();
        } catch (error) {
            toast.error("Failed to add product");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);
        try {
            let imageUrls = editingProduct.imageUrls || [];

            if (imageFile) {
                toast.loading("Processing image...", { id: "upload" });
                const base64ImageUrl = await compressImageToBase64(imageFile, 800, 800, 0.7);
                imageUrls = [base64ImageUrl];
                toast.dismiss("upload");
            }

            const productRef = doc(db, "products", editingProduct.id);
            await updateDoc(productRef, {
                name: editingProduct.name,
                price: Number(editingProduct.price),
                stock: Number(editingProduct.stock),
                description: editingProduct.description,
                category: editingProduct.category,
                imageUrls,
                updatedAt: serverTimestamp()
            });
            toast.success("Product updated!");
            setEditingProduct(null);
            setImageFile(null);
            setImagePreview(null);
            fetchProducts();
        } catch (error) {
            toast.error("Failed to update product");
        } finally {
            setUploading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const deleteProduct = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
            toast.success("Product deleted");
            fetchProducts();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    if (authLoading || loading) return <div className="p-20 text-center">Loading...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Admin Panel</h1>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="bg-primary text-primary-foreground flex items-center gap-2 px-6 py-3 rounded-xl font-bold hover:opacity-90"
                >
                    <Plus className="h-5 w-5" /> Add Product
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <div className="p-4 border rounded-2xl bg-muted/30">
                        <h3 className="font-bold flex items-center gap-2 mb-4"><Package className="h-4 w-4" /> Management</h3>
                        <nav className="space-y-2">
                            <button className="w-full text-left px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Products</button>
                            <button className="w-full text-left px-4 py-2 hover:bg-muted rounded-lg font-medium">Orders</button>
                            <button className="w-full text-left px-4 py-2 hover:bg-muted rounded-lg font-medium">Categories</button>
                        </nav>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    {isAdding ? (
                        <div className="p-8 border rounded-3xl bg-card shadow-sm space-y-6 animate-in fade-in zoom-in duration-200">
                            <h2 className="text-xl font-bold">New Product</h2>
                            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Product Name</label>
                                    <input
                                        required
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={newProduct.name}
                                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Price (INR)</label>
                                    <input
                                        type="number"
                                        required
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={newProduct.price}
                                        onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={newProduct.stock}
                                        onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={newProduct.category}
                                        onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Product Description</label>
                                    <textarea
                                        rows={4}
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={newProduct.description}
                                        onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Product Image</label>
                                    <div className="mt-2 flex items-center gap-6">
                                        <div className="relative h-32 w-32 rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="cursor-pointer bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors">
                                                <Upload className="h-4 w-4" />
                                                Choose Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            </label>
                                            <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Max 5MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold disabled:opacity-50"
                                    >
                                        {uploading ? "Adding..." : "Save Product"}
                                    </button>
                                    <button type="button" onClick={() => { setIsAdding(false); setImagePreview(null); setImageFile(null); }} className="border px-8 py-3 rounded-xl font-bold">Cancel</button>
                                </div>
                            </form>
                        </div>
                    ) : editingProduct ? (
                        <div className="p-8 border rounded-3xl bg-card shadow-sm space-y-6 animate-in fade-in zoom-in duration-200">
                            <h2 className="text-xl font-bold">Edit Product: {editingProduct.name}</h2>
                            <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Product Name</label>
                                    <input
                                        required
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={editingProduct.name}
                                        onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Price (INR)</label>
                                    <input
                                        type="number"
                                        required
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={editingProduct.price}
                                        onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Stock</label>
                                    <input
                                        type="number"
                                        required
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={editingProduct.stock}
                                        onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={editingProduct.category}
                                        onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Product Description</label>
                                    <textarea
                                        rows={4}
                                        className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                        value={editingProduct.description}
                                        onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium">Product Image</label>
                                    <div className="mt-2 flex items-center gap-6">
                                        <div className="relative h-32 w-32 rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden">
                                            {imagePreview || editingProduct.imageUrls?.[0] ? (
                                                <img src={imagePreview || editingProduct.imageUrls[0]} alt="Preview" className="h-full w-full object-cover" />
                                            ) : (
                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="cursor-pointer bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors">
                                                <Upload className="h-4 w-4" />
                                                Change Image
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                            </label>
                                            <p className="text-xs text-muted-foreground">JPG, PNG or WEBP. Max 5MB</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={uploading}
                                        className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold disabled:opacity-50"
                                    >
                                        {uploading ? "Updating..." : "Update Product"}
                                    </button>
                                    <button type="button" onClick={() => { setEditingProduct(null); setImagePreview(null); setImageFile(null); }} className="border px-8 py-3 rounded-xl font-bold">Cancel</button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="border rounded-3xl overflow-hidden overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="p-4 font-bold">Product</th>
                                        <th className="p-4 font-bold">Category</th>
                                        <th className="p-4 font-bold">Price</th>
                                        <th className="p-4 font-bold">Stock</th>
                                        <th className="p-4 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {products.map((p) => (
                                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-4 font-medium">{p.name}</td>
                                            <td className="p-4 text-muted-foreground">{p.category}</td>
                                            <td className="p-4 font-bold">{formatPrice(p.price)}</td>
                                            <td className="p-4">
                                                <span className={p.stock < 5 ? "text-destructive font-bold" : ""}>{p.stock}</span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => { setEditingProduct(p); setIsAdding(false); }} className="p-2 hover:bg-muted rounded-lg"><Edit className="h-4 w-4" /></button>
                                                <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
