"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { collection, query, getDocs, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "react-hot-toast";
import { Plus, Package, ListOrdered, Trash2, Edit, LayoutDashboard, Image as ImageIcon, Upload, X } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import { compressImageToBase64 } from "@/lib/utils/cropImage";

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const [newProduct, setNewProduct] = useState({
        name: "",
        price: 0,
        category: "",
        stock: 10,
        description: ""
    });

    const [activeTab, setActiveTab] = useState<"products" | "orders" | "categories">("products");
    const [orders, setOrders] = useState<any[]>([]);
    const [newCategoryName, setNewCategoryName] = useState("");

    useEffect(() => {
        if (!authLoading && (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN"))) {
            router.push("/");
        } else if (user) {
            fetchProducts();
            fetchCategories();
            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        try {
            const q = query(collection(db, "orders"));
            const snap = await getDocs(q);
            setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, "categories"));
            const snap = await getDocs(q);
            const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setCategories(cats);
            if (cats.length > 0 && !newProduct.category) {
                setNewProduct(prev => ({ ...prev, category: cats[0].name }));
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        try {
            await addDoc(collection(db, "categories"), {
                name: newCategoryName.trim(),
                createdAt: serverTimestamp()
            });
            setNewCategoryName("");
            toast.success("Category added!");
            fetchCategories();
        } catch (error) {
            toast.error("Failed to add category");
        }
    };

    const deleteCategory = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await deleteDoc(doc(db, "categories", id));
            toast.success("Category deleted");
            fetchCategories();
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, { status: newStatus });
            toast.success("Status updated");
            fetchOrders();
        } catch (error) {
            toast.error("Update failed");
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
                category: categories[0]?.name || "Electronics",
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

    const renderProducts = () => (
        <>
            {isAdding ? (
                <div className="p-6 border rounded-2xl bg-card space-y-6 animate-in fade-in zoom-in duration-200">
                    <h2 className="text-xl font-bold">New Product</h2>
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Product Name</label>
                            <input
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={newProduct.name}
                                onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Price (INR)</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={newProduct.price}
                                onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Stock</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={newProduct.stock}
                                onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <select
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={newProduct.category}
                                onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                            >
                                {categories.map((cat: any) => (
                                    <option key={cat.id || cat} value={cat.name || cat}>{cat.name || cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Product Description</label>
                            <textarea
                                rows={3}
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={newProduct.description}
                                onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Product Image</label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="relative h-24 w-24 rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="cursor-pointer bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors text-xs">
                                        <Upload className="h-4 w-4" />
                                        Choose Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                    <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP. Max 5MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={uploading}
                                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 text-sm"
                            >
                                {uploading ? "Adding..." : "Save Product"}
                            </button>
                            <button type="button" onClick={() => { setIsAdding(false); setImagePreview(null); setImageFile(null); }} className="border px-6 py-2.5 rounded-xl font-bold text-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : editingProduct ? (
                <div className="p-6 border rounded-2xl bg-card space-y-6 animate-in fade-in zoom-in duration-200">
                    <h2 className="text-xl font-bold">Edit Product: {editingProduct.name}</h2>
                    <form onSubmit={handleUpdateProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Product Name</label>
                            <input
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={editingProduct.name}
                                onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Price (INR)</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={editingProduct.price}
                                onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Stock</label>
                            <input
                                type="number"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={editingProduct.stock}
                                onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <select
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={editingProduct.category}
                                onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                            >
                                {categories.map((cat: any) => (
                                    <option key={cat.id || cat} value={cat.name || cat}>{cat.name || cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Product Description</label>
                            <textarea
                                rows={3}
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-2 outline-none focus:ring-2 focus:ring-primary text-sm"
                                value={editingProduct.description}
                                onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="text-sm font-medium">Product Image</label>
                            <div className="mt-2 flex items-center gap-4">
                                <div className="relative h-24 w-24 rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden">
                                    {imagePreview || editingProduct.imageUrls?.[0] ? (
                                        <img src={imagePreview || editingProduct.imageUrls[0]} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="cursor-pointer bg-primary/10 text-primary px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary/20 transition-colors text-xs">
                                        <Upload className="h-4 w-4" />
                                        Change Image
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                    <p className="text-[10px] text-muted-foreground">JPG, PNG or WEBP. Max 5MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={uploading}
                                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold disabled:opacity-50 text-sm"
                            >
                                {uploading ? "Updating..." : "Update Product"}
                            </button>
                            <button type="button" onClick={() => { setEditingProduct(null); setImagePreview(null); setImageFile(null); }} className="border px-6 py-2.5 rounded-xl font-bold text-sm">Cancel</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="border rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-muted">
                            <tr>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest">Product</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest">Category</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest">Price</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-center">Stock</th>
                                <th className="p-4 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y bg-card">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4 font-bold text-sm">{p.name}</td>
                                    <td className="p-4 text-xs font-medium text-muted-foreground">{p.category}</td>
                                    <td className="p-4 text-sm font-black">{formatPrice(p.price)}</td>
                                    <td className="p-4 text-center">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black",
                                            p.stock < 5 ? "bg-destructive/10 text-destructive" : "bg-green-100 text-green-700"
                                        )}>{p.stock}</span>
                                    </td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button onClick={() => { setEditingProduct(p); setIsAdding(false); }} className="p-2 hover:bg-muted rounded-lg transition-colors"><Edit className="h-4 w-4" /></button>
                                        <button onClick={() => deleteProduct(p.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );

    const renderOrders = () => (
        <div className="border rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-left">
                <thead className="bg-muted">
                    <tr>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest">Order ID</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest">Customer</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest">Amount</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest">Status</th>
                        <th className="p-4 font-bold text-xs uppercase tracking-widest text-right">Method</th>
                    </tr>
                </thead>
                <tbody className="divide-y bg-card">
                    {orders.sort((a, b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).map((o) => (
                        <tr key={o.id} className="hover:bg-muted/30 transition-colors text-sm">
                            <td className="p-4 font-mono text-[10px] font-bold">{o.id}</td>
                            <td className="p-4">
                                <div className="font-bold">{o.address?.fullName || "Guest"}</div>
                                <div className="text-[10px] text-muted-foreground">{o.address?.city}</div>
                            </td>
                            <td className="p-4 font-black">{formatPrice(o.totalAmount)}</td>
                            <td className="p-4">
                                <select
                                    className={cn(
                                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg outline-none",
                                        o.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                            o.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                                    )}
                                    value={o.status || "PENDING"}
                                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="PAID">Paid</option>
                                    <option value="SHIPPED">Shipped</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </td>
                            <td className="p-4 text-right font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{o.paymentMethod}</td>
                        </tr>
                    ))}
                    {orders.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-12 text-center text-muted-foreground font-medium italic">No orders found yet.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderCategories = () => (
        <div className="space-y-6">
            <div className="p-6 border rounded-2xl bg-card shadow-sm">
                <h3 className="text-sm font-bold mb-4 uppercase tracking-widest">Create New Category</h3>
                <form onSubmit={handleAddCategory} className="flex gap-3">
                    <input
                        className="flex-grow px-4 py-2 rounded-xl border bg-muted/50 outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                        placeholder="e.g. Footwear"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold text-sm">Add</button>
                </form>
            </div>

            <div className="border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-muted">
                        <tr>
                            <th className="p-4 font-bold text-xs uppercase tracking-widest">Category Name</th>
                            <th className="p-4 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y bg-card">
                        {categories.map((cat: any) => (
                            <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4 font-bold text-sm">{cat.name}</td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => deleteCategory(cat.id)}
                                        className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <LayoutDashboard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Admin Console</h1>
                        <p className="text-muted-foreground text-xs font-medium uppercase tracking-widest mt-1">Store Management System</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === "products" && !isAdding && !editingProduct && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-primary text-primary-foreground flex items-center gap-2 px-6 py-2.5 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
                        >
                            <Plus className="h-4 w-4" /> Add Product
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <aside className="lg:col-span-1 space-y-4">
                    <div className="p-6 border rounded-3xl bg-card shadow-sm space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 opacity-50">Navigation</p>
                        {[
                            { id: "products", label: "Inventory", icon: Package },
                            { id: "orders", label: "Orders", icon: ListOrdered },
                            { id: "categories", label: "Catalog", icon: Edit }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as any); setIsAdding(false); setEditingProduct(null); }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm",
                                    activeTab === tab.id ?
                                        "bg-primary text-primary-foreground shadow-md shadow-primary/20" :
                                        "text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="lg:col-span-4 min-h-[600px]">
                    {activeTab === "products" && renderProducts()}
                    {activeTab === "orders" && renderOrders()}
                    {activeTab === "categories" && renderCategories()}
                </main>
            </div>
        </div>
    );
}
