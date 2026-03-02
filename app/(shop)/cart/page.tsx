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

    const handleCheckout = async () => {
        if (!user) {
            toast.error("Please login to checkout");
            router.push("/login");
            return;
        }

        if (items.length === 0) return;

        try {
            const createOrder = httpsCallable(functions, "createRazorpayOrder");
            const verifyPayment = httpsCallable(functions, "verifyRazorpayPayment");

            const amount = getTotalPrice();

            // Step 1: Create Razorpay Order
            const { data: order }: any = await createOrder({ amount });

            // Step 2: Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "ZoftStore",
                description: "Payment for your order",
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // Step 3: Verify Payment
                        const verifyData = {
                            razorpayOrderId: response.razorpay_order_id,
                            razorpayPaymentId: response.razorpay_payment_id,
                            razorpaySignature: response.razorpay_signature,
                            items: items.map(item => ({
                                productId: item.productId,
                                quantity: item.quantity,
                            })),
                            totalAmount: amount,
                        };

                        const { data: result }: any = await verifyPayment(verifyData);

                        if (result.success) {
                            toast.success("Payment successful! Order placed.");
                            clearCart();
                            router.push("/orders/" + result.orderId);
                        }
                    } catch (error: any) {
                        toast.error("Payment verification failed: " + error.message);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                },
                theme: {
                    color: "#3b82f6",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast.error("Checkout failed: " + error.message);
        }
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
                            <div className="h-24 w-24 bg-muted rounded-xl flex-shrink-0" />
                            <div className="flex-grow">
                                <h3 className="font-bold">{item.product?.name || "Product Name"}</h3>
                                <p className="text-sm text-muted-foreground">{item.product?.categoryId || "Category"}</p>
                                <div className="mt-2 text-lg font-bold">{formatPrice(item.product?.price || 0)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                    className="p-1 border rounded-lg hover:bg-muted"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                <button
                                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                    className="p-1 border rounded-lg hover:bg-muted"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={() => removeItem(item.productId)}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="p-6 border rounded-3xl space-y-6 sticky top-24">
                    <h2 className="text-xl font-bold">Order Summary</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{formatPrice(getTotalPrice())}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Shipping</span>
                            <span className="text-green-600 font-medium">Free</span>
                        </div>
                        <div className="border-t pt-4 flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>{formatPrice(getTotalPrice())}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity"
                    >
                        <CreditCard className="h-5 w-5" /> Checkout with Razorpay
                    </button>

                    <script src="https://checkout.razorpay.com/v1/checkout.js" async />
                </div>
            </div>
        </div>
    );
}
