"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import Link from "next/link";
import { Search, Filter, ShoppingCart, Star, Heart } from "lucide-react";
import { toast } from "react-hot-toast";

export default function ShopPage() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const addItem = useCartStore(state => state.addItem);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
                const snap = await getDocs(q);
                setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

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
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-grow md:w-64">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <input
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <button className="flex items-center gap-2 border px-4 py-2 rounded-xl hover:bg-muted">
                        <Filter className="h-4 w-4" /> Filter
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.length === 0 ? (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                        No products found. Stay tuned for new arrivals!
                    </div>
                ) : (
                    products.map((product) => (
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
