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
        <div className="max-w-6xl mx-auto py-12 px-4 space-y-12">

            <div className="flex items-center justify-between">
                <button
                    onClick={handleBack}
                    className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold"
                >
                    <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Back
                </button>
                <h1 className="text-2xl font-black uppercase tracking-widest text-primary/40">Secure Checkout</h1>
                <div className="w-10"></div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-4 sm:gap-12 overflow-x-auto pb-4 scrollbar-hide">
                {[
                    { id: 1, label: "Address", icon: MapPin },
                    { id: 2, label: "Summary", icon: Receipt },
                    { id: 3, label: "Payment", icon: CreditCard }
                ].map((s) => (
                    <div key={s.id} className="flex items-center gap-4">
                        <div className={cn(
                            "flex items-center justify-center h-12 w-12 rounded-[1.2rem] font-black transition-all duration-300",
                            step === s.id ? "bg-primary text-white scale-110 shadow-xl shadow-primary/20" :
                                step > s.id ? "bg-green-500 text-white" : "bg-muted text-muted-foreground border-2"
                        )}>
                            {step > s.id ? <CheckCircle2 className="h-6 w-6" /> : s.id}
                        </div>
                        <div className="hidden sm:flex flex-col">
                            <span className={cn(
                                "font-black text-sm tracking-tight leading-none",
                                step === s.id ? "text-foreground" : "text-muted-foreground"
                            )}>{s.label}</span>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/50 tracking-widest mt-1">
                                Step {s.id}
                            </span>
                        </div>
                        {s.id < 3 && <ChevronRight className="h-5 w-5 text-muted-foreground/30 ml-2" />}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {step === 1 && (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black tracking-tight">Delivery Address</h1>
                                <p className="text-muted-foreground text-lg">Where should we send your order?</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 border-2 border-muted/50 rounded-[3rem] bg-card/50 shadow-sm">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" /> Full Name
                                    </label>
                                    <input
                                        className="w-full px-6 py-4 rounded-2xl border-2 bg-background focus:border-primary outline-none transition-all font-bold"
                                        value={address.fullName}
                                        onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                                        placeholder="Recipient's Name"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-primary" /> Mobile Number
                                    </label>
                                    <input
                                        className="w-full px-6 py-4 rounded-2xl border-2 bg-background focus:border-primary outline-none transition-all font-bold"
                                        value={address.phone}
                                        onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                        placeholder="10-digit number"
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Home className="h-4 w-4 text-primary" /> Street Address
                                    </label>
                                    <textarea
                                        className="w-full px-6 py-4 rounded-2xl border-2 bg-background focus:border-primary outline-none transition-all font-bold"
                                        value={address.street}
                                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                        placeholder="House No, Street, Locality"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">City / Town</label>
                                    <input
                                        className="w-full px-6 py-4 rounded-2xl border-2 bg-background focus:border-primary outline-none transition-all font-bold"
                                        value={address.city}
                                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                        placeholder="Town/City"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-primary" /> Pincode
                                    </label>
                                    <input
                                        className="w-full px-6 py-4 rounded-2xl border-2 bg-background focus:border-primary outline-none transition-all font-bold"
                                        value={address.pincode}
                                        onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                        placeholder="6-digit ZIP code"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleNext}
                                className="w-full bg-primary text-primary-foreground py-6 rounded-[2rem] font-black text-xl shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all"
                            >
                                Continue to Summary
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black tracking-tight">Order Review</h1>
                                <p className="text-muted-foreground text-lg">Verify your items and apply any discounts.</p>
                            </div>

                            {/* Coupon Section */}
                            <div className="p-10 border-2 border-dashed border-primary/30 rounded-[3rem] bg-stone-50 flex flex-col md:flex-row gap-6 items-center">
                                <div className="p-5 bg-white rounded-3xl shadow-sm border">
                                    <Ticket className="h-8 w-8 text-primary" />
                                </div>
                                <div className="flex-grow text-center md:text-left">
                                    <h3 className="text-xl font-black">Applied Coupon</h3>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Save extra on this order</p>
                                </div>
                                <div className="flex w-full md:w-auto gap-3">
                                    <input
                                        className="flex-grow md:w-56 px-6 py-4 rounded-2xl border-2 bg-white outline-none focus:border-primary font-bold shadow-sm"
                                        placeholder="Enter Code"
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                    />
                                    <button className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all">Apply</button>
                                </div>
                            </div>

                            {/* GST Toggle */}
                            <div className="space-y-6">
                                <label className={cn(
                                    "flex items-center gap-4 p-8 border-2 rounded-[2.5rem] cursor-pointer transition-all",
                                    isGstInvoice ? "border-primary bg-primary/5 shadow-inner" : "bg-card hover:bg-muted/30"
                                )}>
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            className="h-7 w-7 rounded-xl text-primary border-2 border-muted-foreground/30 focus:ring-offset-0 focus:ring-primary"
                                            checked={isGstInvoice}
                                            onChange={(e) => setIsGstInvoice(e.target.checked)}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <p className="text-lg font-black leading-none">Use GST Invoice</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-2">Claim tax benefits for your business</p>
                                    </div>
                                </label>

                                {isGstInvoice && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-10 border-2 bg-white rounded-[3rem] animate-in zoom-in-95 duration-500 shadow-xl border-primary/10">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Company Name</label>
                                            <input
                                                className="w-full px-5 py-4 rounded-xl border-2 bg-background outline-none focus:border-primary font-bold"
                                                placeholder="Business Pvt Ltd"
                                                value={gstDetails.businessName}
                                                onChange={(e) => setGstDetails({ ...gstDetails, businessName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">GSTIN Number</label>
                                            <input
                                                className="w-full px-5 py-4 rounded-xl border-2 bg-background outline-none focus:border-primary font-bold"
                                                placeholder="22AAAAA0000A1Z5"
                                                value={gstDetails.gstin}
                                                onChange={(e) => setGstDetails({ ...gstDetails, gstin: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <button onClick={handleBack} className="py-6 border-2 border-muted-foreground/20 rounded-[2rem] font-black text-lg text-muted-foreground hover:bg-muted/30 transition-all active:scale-95">Back</button>
                                <button onClick={handleNext} className="py-6 bg-primary text-primary-foreground rounded-[2rem] font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95">Continue to Payment</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h1 className="text-4xl font-black tracking-tight">Secure Payment</h1>
                                <p className="text-muted-foreground text-lg">Choose your preferred payment method.</p>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { id: "ONLINE", title: "Online Payment", desc: "Razorpay (Cards, UPI, Netbanking)", icon: CreditCard, color: "text-blue-600" },
                                    { id: "COD", title: "Cash on Delivery", desc: "Pay when you receive the package", icon: Truck, color: "text-primary" }
                                ].map((meth) => (
                                    <label key={meth.id} className={cn(
                                        "flex items-center gap-6 p-10 border-2 rounded-[3.5rem] cursor-pointer transition-all relative overflow-hidden",
                                        paymentMethod === meth.id ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "bg-card hover:bg-muted/10"
                                    )}>
                                        <div className="relative z-10">
                                            <div className={cn(
                                                "h-8 w-8 rounded-full border-4 flex items-center justify-center transition-all",
                                                paymentMethod === meth.id ? "border-primary bg-primary" : "border-muted-foreground/20"
                                            )}>
                                                {paymentMethod === meth.id && <div className="h-2 w-2 rounded-full bg-white shadow-sm" />}
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-3xl bg-white shadow-md border group-hover:scale-110 transition-transform relative z-10">
                                            <meth.icon className={cn("h-10 w-10", meth.color)} />
                                        </div>
                                        <div className="relative z-10">
                                            <p className="text-2xl font-black">{meth.title}</p>
                                            <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mt-2">{meth.desc}</p>
                                        </div>
                                        <meth.icon className="absolute -right-8 -bottom-8 h-48 w-48 opacity-5 text-foreground pointer-events-none" />
                                    </label>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-10">
                                <button onClick={handleBack} className="py-6 border-2 rounded-[2rem] font-black text-lg text-muted-foreground hover:bg-muted/30">Back</button>
                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className="py-6 bg-primary text-primary-foreground rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? "Processing..." : paymentMethod === "COD" ? "Place Order (COD)" : `Pay ${formatPrice(total)} Now`}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Right Side Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-8">
                        {/* Final Price Split */}
                        <div className="p-10 border-2 border-muted/50 rounded-[3.5rem] bg-card space-y-8 shadow-sm relative overflow-hidden">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                Order Summary
                            </h2>
                            <div className="space-y-5">
                                <div className="flex justify-between text-muted-foreground">
                                    <span className="font-bold uppercase text-[10px] tracking-widest pt-1">Subtotal (Net)</span>
                                    <span className="text-lg font-black text-foreground">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span className="font-bold uppercase text-[10px] tracking-widest pt-1">GST (18%)</span>
                                    <span className="text-lg font-black text-foreground">{formatPrice(gstAmount)}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span className="font-bold uppercase text-[10px] tracking-widest pt-1">Delivery</span>
                                    <span className="text-green-600 font-black uppercase text-xs tracking-widest">Free</span>
                                </div>
                                <div className="border-t-4 border-dashed pt-6 flex justify-between text-3xl font-black">
                                    <span>Total</span>
                                    <span className="text-primary">{formatPrice(total)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-tight">Secured by 256-bit SSL Encryption</span>
                            </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="p-8 border-2 border-muted/50 rounded-[3rem] bg-muted/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-black uppercase tracking-widest text-xs text-muted-foreground">Bag Contents</h3>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-md font-black text-[10px]">{items.length} Items</span>
                            </div>
                            <div className="space-y-4 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                                {items.map((item) => (
                                    <div key={item.productId} className="flex gap-4 group">
                                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm overflow-hidden flex-shrink-0 border transition-transform group-hover:scale-105">
                                            {item.product?.imageUrls?.[0] ? (
                                                <img src={item.product.imageUrls[0]} className="h-full w-full object-cover" />
                                            ) : (
                                                <Package className="h-6 w-6 m-4 opacity-20" />
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-black line-clamp-1">{item.product?.name}</p>
                                            <p className="text-xs text-muted-foreground font-bold mt-1">
                                                Qty: {item.quantity} × <span className="text-foreground">{formatPrice(item.product?.price || 0)}</span>
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
