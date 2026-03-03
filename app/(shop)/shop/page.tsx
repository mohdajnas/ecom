"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { cn, formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import Link from "next/link";
import { Search, Filter, ShoppingCart, Star, Heart, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSearchParams, useRouter } from "next/navigation";

export default function ShopPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const searchParams = useSearchParams();
    const router = useRouter();
    const addItem = useCartStore(state => state.addItem);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "All";

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Products
                const productQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
                const productSnap = await getDocs(productQuery);
                const allProducts = productSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setProducts(allProducts);

                // Fetch Categories
                const categorySnap = await getDocs(collection(db, "categories"));
                const allCats = categorySnap.docs.map(doc => doc.data().name);
                setCategories(["All", ...allCats]);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load products");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = products;

        if (q) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(q.toLowerCase()) ||
                p.description.toLowerCase().includes(q.toLowerCase())
            );
        }

        if (category !== "All") {
            filtered = filtered.filter(p => p.category === category);
        }

        setFilteredProducts(filtered);
        setSearchQuery(q);
    }, [products, q, category]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery) params.set("q", searchQuery);
        else params.delete("q");
        router.push(`/shop?${params.toString()}`);
    };

    const handleCategoryChange = (cat: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (cat === "All") params.delete("category");
        else params.set("category", cat);
        router.push(`/shop?${params.toString()}`);
    };

    const toggleWishlist = (product: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
            toast.success("Removed from wishlist");
        } else {
            addToWishlist(product);
            toast.success("Added to wishlist");
        }
    };

    if (loading) return <div className="p-20 text-center text-xl font-medium">Discovering the best products...</div>;

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <h1 className="text-4xl font-bold tracking-tight">Browse Products</h1>
                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                    <form onSubmit={handleSearch} className="relative flex-grow md:w-80">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border-2 rounded-2xl outline-none focus:ring-2 focus:ring-primary bg-muted/20"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(""); router.push("/shop"); }}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </form>

                    <div className="flex gap-2 bg-muted/30 p-1.5 rounded-2xl border">
                        {categories.slice(0, 5).map(cat => (
                            <button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={cn(
                                    "px-4 py-1.5 rounded-xl text-sm font-bold transition-all",
                                    (category === cat)
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105"
                                        : "hover:bg-muted text-muted-foreground"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-foreground">No matches found</h3>
                        <p className="mt-2">Try adjusting your search or category filters</p>
                        <button
                            onClick={() => { router.push("/shop"); setSearchQuery(""); }}
                            className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl"
                        >
                            Clear All Filters
                        </button>
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                        <div key={product.id} className="group relative flex flex-col space-y-4 rounded-3xl border p-4 hover:shadow-2xl transition-all duration-300 bg-card">
                            <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
                                <Link href={`/products/${product.id}`} className="block h-full w-full">
                                    {product.imageUrls?.[0] ? (
                                        <img src={product.imageUrls[0]} alt={product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/50">
                                            <Package className="h-12 w-12" />
                                        </div>
                                    )}
                                </Link>
                                <button
                                    onClick={(e) => toggleWishlist(product, e)}
                                    className="absolute top-3 right-3 p-2.5 rounded-full bg-background/80 backdrop-blur-md shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                                >
                                    <Heart
                                        className={`h-5 w-5 transition-colors ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`}
                                    />
                                </button>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{product.category}</span>
                                    <div className="flex items-center gap-1 text-sm font-medium">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /> {product.rating || 4.5}
                                    </div>
                                </div>
                                <Link href={`/products/${product.id}`} className="block group-hover:text-primary transition-colors">
                                    <h3 className="text-lg font-bold">{product.name}</h3>
                                </Link>
                                <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-2xl font-black">{formatPrice(product.price)}</span>
                                    <button
                                        onClick={() => {
                                            addItem(product);
                                            toast.success("Added to cart");
                                        }}
                                        className="p-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

const Package = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
);
