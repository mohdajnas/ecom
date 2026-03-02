"use client";

import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowLeft, Store } from "lucide-react";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function WishlistPage() {
    const { items, removeFromWishlist } = useWishlistStore();
    const { addItem } = useCartStore();

    const handleMoveToCart = (product: any) => {
        addItem(product);
        removeFromWishlist(product.id);
        toast.success("Added to cart and removed from wishlist");
    };

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="p-6 rounded-full bg-muted/50">
                    <Heart className="h-16 w-16 text-muted-foreground/30" strokeWidth={1} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Your wishlist is empty</h2>
                    <p className="text-muted-foreground">Looks like you haven't added anything to your wishlist yet.</p>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all hover:scale-105"
                >
                    <Store className="h-5 w-5" />
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-extrabold tracking-tight">My Wishlist</h1>
                    <p className="text-muted-foreground">
                        {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
                    </p>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-bold text-primary hover:underline group"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Continue Shopping
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {items.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="group relative flex flex-col bg-card rounded-3xl border overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                        >
                            {/* Product Image */}
                            <div className="relative aspect-square overflow-hidden bg-muted">
                                {product.imageUrls?.[0] ? (
                                    <img
                                        src={product.imageUrls[0]}
                                        alt={product.name}
                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Store className="h-12 w-12 text-muted-foreground/20" />
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        removeFromWishlist(product.id);
                                        toast.success("Removed from wishlist");
                                    }}
                                    className="absolute top-4 right-4 p-2.5 rounded-full bg-background/80 backdrop-blur-md text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-lg"
                                    aria-label="Remove from wishlist"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Product Info */}
                            <div className="p-6 flex flex-col flex-grow">
                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <span className="font-black text-xl text-primary">
                                            ₹{product.price.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="mt-auto pt-4 flex gap-3">
                                    <button
                                        onClick={() => handleMoveToCart(product)}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all active:scale-95 shadow-sm"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        Add to Cart
                                    </button>
                                    <Link
                                        href={`/products/${product.id}`}
                                        className="px-6 flex items-center justify-center py-3 rounded-2xl border bg-muted/30 font-bold text-sm hover:bg-muted transition-all"
                                    >
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
