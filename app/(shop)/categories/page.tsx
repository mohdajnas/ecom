"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import { Package, ArrowRight, Smartphone, Laptop, Watch, Shirt, Home as HomeIcon, Footprints, Headphones, Camera, Star, MoreHorizontal } from "lucide-react";

const getCategoryIcon = (name: string) => {
    if (!name) return MoreHorizontal;
    const n = name.toLowerCase();
    if (n.includes("phone") || n.includes("mobile")) return Smartphone;
    if (n.includes("laptop") || n.includes("computer") || n.includes("electronics")) return Laptop;
    if (n.includes("watch") || n.includes("accessory")) return Watch;
    if (n.includes("clothing") || n.includes("shirt") || n.includes("fashion") || n.includes("apparel")) return Shirt;
    if (n.includes("home") || n.includes("furniture") || n.includes("decor")) return HomeIcon;
    if (n.includes("shoe") || n.includes("foot") || n.includes("sneaker")) return Footprints;
    if (n.includes("audio") || n.includes("head") || n.includes("speaker") || n.includes("music")) return Headphones;
    if (n.includes("camera") || n.includes("photo") || n.includes("video")) return Camera;
    if (n.includes("beauty") || n.includes("care") || n.includes("cosmetic")) return Star;
    return MoreHorizontal;
};

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Categories from Firestore
                const snap = await getDocs(collection(db, "categories"));
                let firestoreCats = snap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));

                // 2. Fetch All Products
                const productSnap = await getDocs(query(collection(db, "products"), orderBy("createdAt", "desc")));
                const allProducts = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(allProducts);

                let finalCats = firestoreCats;

                if (finalCats.length === 0) {
                    // Extract from products
                    const uniqueProductCats = Array.from(new Set(allProducts.map(p => (p as any).category).filter(Boolean)));

                    if (uniqueProductCats.length > 0) {
                        finalCats = (uniqueProductCats as string[]).map((cat, index) => ({ id: `p-${index}`, name: cat }));
                    } else {
                        // Hardcoded defaults
                        finalCats = [
                            { id: "d1", name: "Electronics" },
                            { id: "d2", name: "Fashion" },
                            { id: "d3", name: "Home" },
                            { id: "d4", name: "Beauty" }
                        ];
                    }
                }

                setCategories(finalCats);
            } catch (error) {
                console.error(error);
                // Last resort defaults
                setCategories([
                    { id: "d1", name: "Electronics" },
                    { id: "d2", name: "Fashion" },
                    { id: "d3", name: "Home" },
                    { id: "d4", name: "Beauty" }
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-20 text-center text-xl font-medium">Loading collection...</div>;

    return (
        <div className="space-y-20 animate-in fade-in duration-700">
            {/* Categories Section */}
            <div className="space-y-12">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black tracking-tight">Shop by Category</h1>
                    <p className="text-muted-foreground text-lg">Explore our curated collections across various categories.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.length > 0 ? (
                        categories.map((cat, i) => {
                            const Icon = getCategoryIcon(cat.name);
                            const colors = [
                                "bg-orange-50 text-orange-600 border-orange-100",
                                "bg-blue-50 text-blue-600 border-blue-100",
                                "bg-pink-50 text-pink-600 border-pink-100",
                                "bg-purple-50 text-purple-600 border-purple-100",
                                "bg-green-50 text-green-600 border-green-100",
                                "bg-yellow-50 text-yellow-600 border-yellow-100"
                            ];
                            const colorClass = colors[i % colors.length];

                            return (
                                <Link
                                    href={`/shop?category=${encodeURIComponent(cat.name)}`}
                                    key={cat.id}
                                    className={`group p-8 rounded-[2.5rem] border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${colorClass} bg-white`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="p-4 rounded-2xl bg-white shadow-sm transition-transform group-hover:scale-110">
                                            <Icon className="h-8 w-8" />
                                        </div>
                                        <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2" />
                                    </div>
                                    <div className="mt-8">
                                        <h3 className="text-xl font-black text-foreground">{cat.name}</h3>
                                        <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-widest">Collection</p>
                                    </div>
                                </Link>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] text-muted-foreground">
                            <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <h3 className="text-xl font-bold">Collections arriving soon!</h3>
                        </div>
                    )}
                </div>
            </div>

            {/* All Products Section */}
            <div className="space-y-12">
                <div className="flex items-end justify-between px-2">
                    <div className="space-y-2">
                        <span className="text-primary font-black uppercase tracking-[0.2em] text-xs">Our Catalog</span>
                        <h2 className="text-4xl font-black tracking-tight">All Products</h2>
                    </div>
                    <Link href="/shop" className="group flex items-center gap-2 text-primary font-bold text-lg hover:underline underline-offset-8">
                        View everything <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.length > 0 ? (
                        products.map((product) => (
                            <Link
                                href={`/products/${product.id}`}
                                key={product.id}
                                className="group flex flex-col space-y-4"
                            >
                                <div className="aspect-square bg-muted rounded-[2rem] overflow-hidden relative shadow-sm transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
                                    {product.imageUrls?.[0] ? (
                                        <img
                                            src={product.imageUrls[0]}
                                            alt={product.name}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                                            <Package className="h-16 w-16" />
                                        </div>
                                    )}
                                    {product.discount > 0 && (
                                        <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white font-black rounded-lg text-xs">
                                            -{product.discount}%
                                        </div>
                                    )}
                                </div>
                                <div className="px-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                        <span>{product.category || "General"}</span>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            <span>4.8</span>
                                        </div>
                                    </div>
                                    <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                                    <p className="font-black text-2xl text-primary mt-2">₹{product.price.toLocaleString("en-IN")}</p>
                                </div>
                            </Link>
                        )
                        )) : (
                        <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] text-muted-foreground">
                            <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <h3 className="text-xl font-bold">New stock arriving soon!</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
