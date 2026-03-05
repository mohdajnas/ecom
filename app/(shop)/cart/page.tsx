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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <h1 className="text-2xl font-black tracking-tight">Shopping Cart</h1>
                <div className="space-y-3">
                    {items.map((item) => (
                        <div key={item.productId} className="flex items-center gap-4 p-3 border rounded-2xl bg-card hover:shadow-sm transition-shadow">
                            <div className="h-20 w-20 bg-muted rounded-xl flex-shrink-0 relative overflow-hidden border">
                                {item.product?.imageUrls?.[0] ? (
                                    <img src={item.product.imageUrls[0]} alt={item.product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <ShoppingBag className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold truncate text-sm sm:text-base">{item.product?.name || "Product Name"}</h3>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{item.product?.categoryId || "Category"}</p>
                                <div className="mt-1 text-base font-black text-primary">{formatPrice(item.product?.price || 0)}</div>
                            </div>
                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all"
                                >
                                    <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                    className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <button
                                onClick={() => removeItem(item.productId)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="p-6 border-2 border-muted/50 rounded-3xl space-y-5 sticky top-24 bg-card shadow-sm">
                    <h2 className="text-lg font-black tracking-tight">Order Summary</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold text-foreground">{formatPrice(getTotalPrice())}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span className="font-medium">Shipping</span>
                            {getTotalPrice() >= 999 ? (
                                <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Free</span>
                            ) : (
                                <span className="font-bold text-foreground">{formatPrice(79)}</span>
                            )}
                        </div>
                        {getTotalPrice() < 999 && (
                            <div className="p-2 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[9px] font-bold text-primary leading-tight text-center">
                                    Add {formatPrice(999 - getTotalPrice())} more for <span className="underline italic">FREE DELIVERY</span>
                                </p>
                            </div>
                        )}
                        <div className="border-t border-dashed pt-3 flex justify-between text-lg font-black">
                            <span>Total</span>
                            <span className="text-primary">{formatPrice(getTotalPrice() + (getTotalPrice() >= 999 ? 0 : 79))}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-black transition-all hover:opacity-90 active:scale-95"
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
