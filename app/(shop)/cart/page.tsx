"use client";

import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, CreditCard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config"; // Need to export functions from config

// Mock functions export in lib/firebase/config.ts if not yet added
// import { getFunctions } from "firebase/functions";
// const functions = getFunctions(app);

export default function CartPage() {
    const { user } = useAuthStore();
    const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();
    const router = useRouter();

    const handleCheckout = () => {
        if (!user) {
            toast.error("Please login to checkout");
            router.push("/login");
            return;
        }

        if (items.length === 0) return;
        router.push("/checkout");
    };

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <div className="p-6 bg-muted rounded-full">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Your cart is empty</h2>
                    <p className="text-muted-foreground mt-2">Looks like you haven&apos;t added anything to your cart yet.</p>
                </div>
                <Link
                    href="/shop"
                    className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
                <h1 className="text-3xl font-bold">Shopping Cart</h1>
                <div className="space-y-4">
                    {items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4 p-4 border rounded-2xl">
                            <div className="h-24 w-24 bg-muted rounded-xl flex-shrink-0 relative overflow-hidden">
                                {item.product?.imageUrls?.[0] ? (
                                    <img src={item.product.imageUrls[0]} alt={item.product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <ShoppingBag className="h-8 w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                                )}
                            </div>
                            <div className="flex-grow">
                                <h3 className="font-bold">{item.product?.name || "Product Name"}</h3>
                                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">{item.product?.categoryId || "Category"}</p>
                                <div className="mt-2 text-lg font-bold text-primary">{formatPrice(item.product?.price || 0)}</div>
                            </div>
                            <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-xl border">
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                    className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => removeItem(item.productId)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="p-8 border-2 border-muted/50 rounded-[2.5rem] space-y-6 sticky top-24 bg-card shadow-sm">
                    <h2 className="text-2xl font-black tracking-tight">Summary</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between text-muted-foreground">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold text-foreground">{formatPrice(getTotalPrice())}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span className="font-medium">Shipping</span>
                            <span className="text-green-600 font-bold uppercase text-xs tracking-widest">Free</span>
                        </div>
                        <div className="border-t border-dashed pt-4 flex justify-between text-xl font-black">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(getTotalPrice())}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
