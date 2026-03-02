"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, updateDoc, doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { formatPrice, formatDate } from "@/lib/utils";
import {
    LogOut, Package, User as UserIcon, Calendar, CreditCard,
    MapPin, Heart, Edit2, Save, X, Plus, Trash2, CheckCircle2, Camera, Loader2,
    Crop as CropIcon, Check
} from "lucide-react";
import Cropper from "react-easy-crop";
import { getCroppedImgBase64 } from "@/lib/utils/cropImage";
import { toast } from "react-hot-toast";
import { UserProfile, Address } from "@/types";

export default function ProfilePage() {
    const { user, setUser, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses" | "wishlist">("profile");

    // Edit states
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

    // Cropping states
    const [showCropper, setShowCropper] = useState(false);
    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        } else if (user) {
            setEditName(user.name || "");
            setEditPhone(user.phoneNumber || "");
            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        try {
            const q = query(
                collection(db, "orders"),
                where("userId", "==", user?.uid),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            const updateData = {
                name: editName,
                phoneNumber: editPhone,
                email: user.email,
                role: user.role || 'USER',
                isActive: true, // Default to true if creating
                photoURL: user.photoURL || null,
                updatedAt: new Date()
            };

            await setDoc(userRef, updateData, { merge: true });

            setUser({ ...user, name: editName, phoneNumber: editPhone });
            setIsEditingProfile(false);
            toast.success("Profile updated!");
        } catch (error: any) {
            toast.error("Update failed: " + error.message);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error("Please upload an image file");
            return;
        }

        // Show cropper first
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            setImageToCrop(reader.result as string);
            setShowCropper(true);
        };
    };

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const confirmCropAndUpload = async () => {
        const currentUser = auth.currentUser;
        if (!imageToCrop || !croppedAreaPixels || !currentUser) {
            toast.error("Process aborted: Missing required data.");
            return;
        }

        const tid = toast.loading("Processing photo...");
        try {
            setIsUploadingPhoto(true);
            setShowCropper(false);

            // Step 1: Crop to Base64 (Bypasses Storage)
            toast.loading("Optimizing for profile...", { id: tid });
            const base64Photo = await Promise.race([
                getCroppedImgBase64(imageToCrop, croppedAreaPixels),
                new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Processing timed out")), 20000))
            ]);

            if (!base64Photo) throw new Error("Image optimization failed");

            // Step 2: Save metadata to Firestore
            toast.loading("Saving to your profile...", { id: tid });
            const userRef = doc(db, "users", currentUser.uid);
            await setDoc(userRef, {
                photoURL: base64Photo,
                updatedAt: new Date()
            }, { merge: true });

            // Step 3: Update Global State
            const updatedData = user ? { ...user, photoURL: base64Photo } : {
                uid: currentUser.uid,
                email: currentUser.email || "",
                name: currentUser.displayName || "User",
                photoURL: base64Photo,
                role: 'USER',
                isActive: true,
                createdAt: new Date()
            } as any;

            setUser(updatedData);
            toast.success("Profile photo updated!", { id: tid });
            setImageToCrop(null);
        } catch (error: any) {
            console.error("BASE64-FAIL:", error);
            toast.error("Failed: " + (error.message || "Unknown error"), { id: tid });
        } finally {
            setIsUploadingPhoto(false);
            setShowCropper(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        toast.success("Logged out");
        router.push("/");
    };

    if (authLoading || loading) return <div className="p-20 text-center">Loading Profile...</div>;

    const tabs = [
        { id: "profile", label: "Profile", icon: UserIcon },
        { id: "orders", label: "Orders", icon: Package },
        { id: "addresses", label: "Addresses", icon: MapPin },
        { id: "wishlist", label: "Wishlist", icon: Heart },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Cropping Modal */}
            {showCropper && imageToCrop && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
                    <div className="relative w-full max-w-xl aspect-square bg-card rounded-3xl overflow-hidden shadow-2xl">
                        <Cropper
                            image={imageToCrop}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                            cropShape="round"
                            showGrid={false}
                        />
                    </div>

                    <div className="w-full max-w-xl py-8 px-4 space-y-8">
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-white uppercase tracking-widest text-center block">Zoom Level</label>
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    setShowCropper(false);
                                    setImageToCrop(null);
                                }}
                                className="flex-1 px-6 py-4 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <X className="h-5 w-5" /> Cancel
                            </button>
                            <button
                                onClick={confirmCropAndUpload}
                                className="flex-[2] px-6 py-4 rounded-2xl bg-primary text-white font-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20"
                            >
                                <Check className="h-5 w-5" /> Apply & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 border rounded-3xl bg-muted/20">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <div className="h-24 w-24 rounded-full overflow-hidden bg-primary/10 border-4 border-white shadow-xl flex items-center justify-center text-primary transition-all group-hover:brightness-90">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <UserIcon className="h-10 w-10" />
                            )}
                            {isUploadingPhoto && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-full text-center p-2">
                                    <Loader2 className="h-8 w-8 text-white animate-spin mb-1" />
                                    <button
                                        onClick={() => setIsUploadingPhoto(false)}
                                        className="text-[8px] text-white/70 hover:text-white underline uppercase tracking-tighter"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all">
                            <Camera className="h-4 w-4" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                disabled={isUploadingPhoto}
                            />
                        </label>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">{user?.name}</h1>
                        <p className="text-muted-foreground">{user?.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                            {user?.role}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-3 border border-destructive text-destructive rounded-xl font-bold hover:bg-destructive hover:text-white transition-all"
                >
                    <LogOut className="h-5 w-5" /> Logout
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === tab.id
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                                : "hover:bg-muted"
                                }`}
                        >
                            <tab.icon className="h-5 w-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 min-h-[400px]">
                    {activeTab === "profile" && (
                        <div className="border rounded-3xl p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Account Information</h2>
                                {!isEditingProfile ? (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="flex items-center gap-2 text-primary font-bold bg-primary/10 px-4 py-2 rounded-xl"
                                    >
                                        <Edit2 className="h-4 w-4" /> Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditingProfile(false)}
                                            className="flex items-center gap-2 text-destructive font-bold bg-destructive/10 px-4 py-2 rounded-xl"
                                        >
                                            <X className="h-4 w-4" /> Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="flex items-center gap-2 text-white font-bold bg-green-600 px-4 py-2 rounded-xl"
                                        >
                                            <Save className="h-4 w-4" /> Save
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                                    {isEditingProfile ? (
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border bg-muted/50 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    ) : (
                                        <p className="text-lg font-medium">{user?.name}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                                    <p className="text-lg font-medium opacity-60">{user?.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                                    {isEditingProfile ? (
                                        <input
                                            value={editPhone}
                                            onChange={(e) => setEditPhone(e.target.value)}
                                            placeholder="+91 XXXXX XXXXX"
                                            className="w-full px-4 py-3 rounded-xl border bg-muted/50 focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    ) : (
                                        <p className="text-lg font-medium">{user?.phoneNumber || "Not provided"}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Member Since</label>
                                    <p className="text-lg font-medium">{formatDate(user?.createdAt)}</p>
                                </div>
                            </div>

                            <div className="pt-8 border-t">
                                <h3 className="text-xl font-bold mb-4">Saved Payment Methods</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user?.savedCards?.map((card) => (
                                        <div key={card.id} className="p-4 border rounded-2xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <CreditCard className="h-6 w-6 text-primary" />
                                                <div>
                                                    <p className="font-bold">{card.brand} •••• {card.last4}</p>
                                                    <p className="text-xs text-muted-foreground">Expires {card.expiryMonth}/{card.expiryYear}</p>
                                                </div>
                                            </div>
                                            <button className="text-destructive p-2 hover:bg-destructive/10 rounded-lg">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button className="border-2 border-dashed rounded-2xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:bg-muted transition-colors">
                                        <Plus className="h-4 w-4" /> Add New Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "orders" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-bold">Order History</h2>
                            {orders.length === 0 ? (
                                <div className="p-12 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                                    You haven&apos;t placed any orders yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((order) => (
                                        <div key={order.id} className="p-6 border rounded-2xl space-y-4 hover:border-primary transition-colors bg-card shadow-sm">
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Order ID</span>
                                                        <span className="text-sm font-mono">{order.id}</span>
                                                    </div>
                                                    <div className="flex flex-col border-l pl-4">
                                                        <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Date</span>
                                                        <span className="text-sm">{formatDate(order.createdAt)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="px-4 py-1 bg-green-100 text-green-700 text-xs font-black rounded-full uppercase tracking-tighter">
                                                        {order.status}
                                                    </span>
                                                    <span className="text-2xl font-black">{formatPrice(order.totalAmount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "addresses" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">Shipping Addresses</h2>
                                <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20">
                                    <Plus className="h-4 w-4" /> Add Address
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {user?.addresses?.length ? user.addresses.map((addr) => (
                                    <div key={addr.id} className={`p-6 border rounded-3xl relative transition-all ${addr.isDefault ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-black text-lg uppercase tracking-tight">{addr.label}</h3>
                                                {addr.isDefault && <span className="text-[10px] font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase">Default</span>}
                                            </div>
                                            <div className="flex gap-1">
                                                <button className="p-2 hover:bg-muted rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                                <button className="p-2 hover:bg-destructive/10 text-destructive rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-muted-foreground">
                                            <p>{addr.street}</p>
                                            <p>{addr.city}, {addr.state} - {addr.zipCode}</p>
                                        </div>
                                        {!addr.isDefault && (
                                            <button className="mt-4 text-xs font-bold text-primary hover:underline">Set as Default</button>
                                        )}
                                    </div>
                                )) : (
                                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                                        No addresses saved yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "wishlist" && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-2xl font-bold">Your Wishlist</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Sample wishlist item structure */}
                                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-3xl text-muted-foreground">
                                    Your wishlist is currently empty.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
