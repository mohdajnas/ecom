"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { formatPrice, cn } from "@/lib/utils";
import {
    CheckCircle2, MapPin, Receipt, CreditCard, ChevronRight,
    Truck, ShieldCheck, Ticket, User, Phone, Home, Building2, Package, ArrowLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase/config";
import Link from "next/link";

// Types
type CheckoutStep = 1 | 2 | 3;

export default function CheckoutPage() {
    const { user } = useAuthStore();
    const { items, getTotalPrice, clearCart } = useCartStore();
    const router = useRouter();

    const [step, setStep] = useState<CheckoutStep>(1);
    const [loading, setLoading] = useState(false);

    // Form States
    const [address, setAddress] = useState({
        fullName: user?.name || "",
        phone: "",
        street: "",
        city: "",
        state: "",
        pincode: "",
        landmark: ""
    });

    const [coupon, setCoupon] = useState("");
    const [isGstInvoice, setIsGstInvoice] = useState(false);
    const [gstDetails, setGstDetails] = useState({
        businessName: "",
        gstin: ""
    });
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "ONLINE">("ONLINE");

    useEffect(() => {
        if (!user && !loading) {
            router.push("/login?redirect=/checkout");
        }
        if (items.length === 0 && !loading) {
            router.push("/cart");
        }
    }, [user, items, router, loading]);

    const total = getTotalPrice();
    const gstRate = 0.18; // Default 18% GST (already inclusive)
    const subtotal = total / (1 + gstRate);
    const gstAmount = total - subtotal;

    const handleNext = () => {
        if (step === 1) {
            if (!address.fullName || !address.phone || !address.street || !address.pincode || !address.city) {
                toast.error("Please fill all required address fields");
                return;
            }
            if (address.phone.length < 10) {
                toast.error("Please enter a valid phone number");
                return;
            }
        }
        setStep((s) => (s + 1) as CheckoutStep);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (step === 1) {
            router.push("/cart");
            return;
        }
        setStep((s) => (s - 1) as CheckoutStep);
        window.scrollTo(0, 0);
    };

    const handlePlaceOrder = async () => {
        setLoading(true);
        try {
            if (paymentMethod === "COD") {
                toast.success("Placing order with Cash on Delivery...");
                // Assuming your backend has a 'placeOrder' function
                const placeOrderFn = httpsCallable(functions, "placeOrder");
                const { data: result }: any = await placeOrderFn({
                    items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                    address,
                    isGstInvoice,
                    gstDetails,
                    paymentMethod: "COD",
                    totalAmount: total
                });
                if (result.success) {
                    toast.success("Order placed successfully (COD)!");
                    clearCart();
                    router.push("/profile");
                }
            } else {
                // Online Payment (Razorpay)
                const createOrder = httpsCallable(functions, "createRazorpayOrder");
                const { data: order }: any = await createOrder({ amount: total });

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: order.amount,
                    currency: order.currency,
                    name: "yabuku.in",
                    description: "Payment for Order",
                    order_id: order.id,
                    handler: async function (response: any) {
                        try {
                            const verifyPayment = httpsCallable(functions, "verifyRazorpayPayment");
                            const { data: result }: any = await verifyPayment({
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                                address,
                                isGstInvoice,
                                gstDetails,
                                totalAmount: total
                            });

                            if (result.success) {
                                toast.success("Order placed successfully!");
                                clearCart();
                                router.push("/profile");
                            }
                        } catch (err: any) {
                            toast.error("Verification failed: " + err.message);
                        }
                    },
                    prefill: {
                        name: address.fullName,
                        email: user?.email,
                        contact: address.phone
                    },
                    theme: { color: "#254035" } // Brand brown
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
            }
        } catch (error: any) {
            toast.error("Order failed: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user || items.length === 0) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Package className="h-12 w-12 text-muted-foreground animate-pulse" />
            <p className="text-xl font-bold">Resuming your session...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">

            <div className="flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
                </button>
                <h1 className="text-xl font-black uppercase tracking-widest text-primary/40">Secure Checkout</h1>
                <div className="w-10"></div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 1, label: "Address", icon: MapPin },
                    { id: 2, label: "Summary", icon: Receipt },
                    { id: 3, label: "Payment", icon: CreditCard }
                ].map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                        <div className={cn(
                            "flex items-center justify-center h-10 w-10 rounded-xl font-black transition-all duration-300 text-sm",
                            step === s.id ? "bg-primary text-white scale-105 shadow-lg shadow-primary/20" :
                                step > s.id ? "bg-green-500 text-white" : "bg-muted text-muted-foreground border"
                        )}>
                            {step > s.id ? <CheckCircle2 className="h-5 w-5" /> : s.id}
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <span className={cn(
                                "font-black text-xs tracking-tight leading-none",
                                step === s.id ? "text-foreground" : "text-muted-foreground"
                            )}>{s.label}</span>
                        </div>
                        {s.id < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-1" />}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {step === 1 && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black tracking-tight">Delivery Address</h1>
                                <p className="text-muted-foreground text-sm">Where should we send your order?</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-2xl bg-card/50 shadow-sm">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 text-primary" /> Full Name
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none transition-all font-bold text-sm"
                                        value={address.fullName}
                                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                                        placeholder="Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-primary" /> Phone
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none transition-all font-bold text-sm"
                                        value={address.phone}
                                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                        placeholder="10-digit number"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Home className="h-3.5 w-3.5 text-primary" /> Street Address
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none transition-all font-bold text-sm"
                                        value={address.street}
                                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                        placeholder="Address"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">City</label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none transition-all font-bold text-sm"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5 text-primary" /> Pincode
                                    </label>
                                    <input
                                        className="w-full px-4 py-3 rounded-xl border bg-background focus:border-primary outline-none transition-all font-bold text-sm"
                                        value={address.pincode}
                                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                        placeholder="Pincode"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleNext}
                                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-black text-lg shadow-lg shadow-primary/20 transition-all hover:opacity-95 active:scale-95"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black tracking-tight">Order Review</h1>
                                <p className="text-muted-foreground text-sm">Verify your items and apply any discounts.</p>
                            </div>

                            {/* Coupon Section */}
                            <div className="p-6 border-2 border-dashed border-primary/20 rounded-2xl bg-stone-50 flex flex-col md:flex-row gap-4 items-center">
                                <div className="p-3 bg-white rounded-xl shadow-sm border">
                                    <Ticket className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <h3 className="text-base font-black">Applied Coupon</h3>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Save extra</p>
                                </div>
                                <div className="flex w-full md:w-auto gap-2">
                                    <input
                                        className="flex-grow md:w-48 px-4 py-2.5 rounded-xl border bg-white outline-none focus:border-primary font-bold text-sm"
                                        placeholder="Code"
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                    />
                                    <button className="px-6 py-2.5 bg-primary text-white rounded-xl font-black text-xs hover:opacity-90 active:scale-95 transition-all">Apply</button>
                                </div>
                            </div>

                            {/* GST Toggle */}
                            <div className="space-y-4">
                                <label className={cn(
                                    "flex items-center gap-4 p-5 border rounded-2xl cursor-pointer transition-all",
                                    isGstInvoice ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/30"
                                )}>
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 rounded-md text-primary border-muted-foreground/30"
                                            checked={isGstInvoice}
                                            onChange={(e) => setIsGstInvoice(e.target.checked)}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="font-black text-sm">Use GST Invoice</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Business tax benefits</p>
                                    </div>
                                </label>

                                {isGstInvoice && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 border bg-white rounded-2xl animate-in zoom-in-95 duration-500 shadow-sm">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">Business Name</label>
                                            <input
                                                className="w-full px-4 py-2.5 rounded-lg border bg-background outline-none font-bold text-sm"
                                                placeholder="Company Name"
                                                value={gstDetails.businessName}
                                                onChange={(e) => setGstDetails({ ...gstDetails, businessName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 block">GSTIN</label>
                                            <input
                                                className="w-full px-4 py-2.5 rounded-lg border bg-background outline-none font-bold text-sm"
                                                placeholder="22AAAAA00..."
                                                value={gstDetails.gstin}
                                                onChange={(e) => setGstDetails({ ...gstDetails, gstin: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={handleBack} className="py-3.5 border rounded-xl font-black text-muted-foreground hover:bg-muted/30 text-sm">Back</button>
                                <button onClick={handleNext} className="py-3.5 bg-primary text-primary-foreground rounded-xl font-black shadow-lg shadow-primary/20 text-sm">Continue</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-black tracking-tight">Payment</h1>
                                <p className="text-muted-foreground text-sm">Choose your preferred method.</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { id: "ONLINE", title: "Online Payment", desc: "Razorpay / Cards / UPI", icon: CreditCard, color: "text-blue-600" },
                                    { id: "COD", title: "Cash on Delivery", desc: "Pay at your doorstep", icon: Truck, color: "text-primary" }
                                ].map((meth) => (
                                    <label key={meth.id} className={cn(
                                        "flex items-center gap-4 p-6 border rounded-2xl cursor-pointer transition-all relative overflow-hidden",
                                        paymentMethod === meth.id ? "border-primary bg-primary/5 ring-2 ring-primary/10" : "bg-card hover:bg-muted/10"
                                    )}>
                                        <div className="relative z-10">
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                paymentMethod === meth.id ? "border-primary bg-primary" : "border-muted-foreground/20"
                                            )}>
                                                {paymentMethod === meth.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white shadow-sm border relative z-10">
                                            <meth.icon className={cn("h-6 w-6", meth.color)} />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-lg font-black">{meth.title}</p>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{meth.desc}</p>
                                        </div>
                                        <meth.icon className="absolute -right-4 -bottom-4 h-24 w-24 opacity-5 text-foreground pointer-events-none" />
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <button onClick={handleBack} className="py-3.5 border rounded-xl font-black text-muted-foreground hover:bg-muted/30 text-sm">Back</button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="py-3.5 bg-primary text-primary-foreground rounded-xl font-black shadow-xl shadow-primary/30 transition-all disabled:opacity-50 text-base"
                                >
                                    {loading ? "..." : paymentMethod === "COD" ? "Place Order" : `Pay ${formatPrice(total)}`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Right Side Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        {/* Final Price Split */}
                        <div className="p-6 border rounded-2xl bg-card space-y-6 shadow-sm relative overflow-hidden">
                            <h2 className="text-xl font-black tracking-tight">Order Summary</h2>
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span className="font-bold uppercase tracking-widest">Subtotal (Net)</span>
                                    <span className="font-black text-foreground">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span className="font-bold uppercase tracking-widest">GST (18%)</span>
                                    <span className="font-black text-foreground">{formatPrice(gstAmount)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span className="font-bold uppercase tracking-widest">Delivery</span>
                                    <span className="text-green-600 font-black text-[10px]">FREE</span>
                                </div>
                                <div className="border-t border-dashed pt-4 flex justify-between text-2xl font-black">
                                    <span>Total</span>
                                    <span className="text-primary">{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-xl">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                <span className="text-[9px] font-black uppercase tracking-widest">256-bit SSL Secure</span>
                            </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="p-5 border rounded-2xl bg-muted/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Items ({items.length})</h3>
                            </div>
                            <div className="space-y-3 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-white shadow-sm overflow-hidden flex-shrink-0 border">
                                            {item.product?.imageUrls?.[0] ? (
                                                <img src={item.product.imageUrls[0]} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-5 w-5 m-2.5 opacity-10" />
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-xs font-black truncate">{item.product?.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold flex justify-between">
                                                <span>Qty: {item.quantity}</span>
                                                <span>{formatPrice(item.product?.price || 0)}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <script src="https://checkout.razorpay.com/v1/checkout.js" async />
        </div>
    );
}
