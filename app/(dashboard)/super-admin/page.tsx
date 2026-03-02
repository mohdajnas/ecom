"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { toast } from "react-hot-toast";
import { Settings, Users, CreditCard, BarChart3, ShieldAlert } from "lucide-react";

export default function SuperAdminDashboard() {
    const { user, loading: authLoading } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [razorpayConfig, setRazorpayConfig] = useState({ keyId: "", keySecret: "" });
    const [stats, setStats] = useState({ totalUsers: 0, totalRevenue: 0, totalOrders: 0 });

    useEffect(() => {
        if (!authLoading && (!user || user.role !== "SUPER_ADMIN")) {
            router.push("/");
        } else if (user?.role === "SUPER_ADMIN") {
            fetchData();
        }
    }, [user, authLoading, router]);

    const fetchData = async () => {
        try {
            // Get Razorpay Config
            const configDoc = await getDoc(doc(db, "config", "razorpay"));
            if (configDoc.exists()) {
                setRazorpayConfig(configDoc.data() as any);
            }

            // Get Stats
            const usersSnap = await getDocs(collection(db, "users"));
            const ordersSnap = await getDocs(collection(db, "orders"));

            let revenue = 0;
            ordersSnap.forEach(doc => {
                revenue += doc.data().totalAmount || 0;
            });

            setStats({
                totalUsers: usersSnap.size,
                totalOrders: ordersSnap.size,
                totalRevenue: revenue
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await setDoc(doc(db, "config", "razorpay"), razorpayConfig);
            toast.success("Razorpay config updated!");
        } catch (error) {
            toast.error("Failed to update config");
        }
    };

    if (authLoading || loading) return <div className="p-20 text-center">Loading Dashboard...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Super Admin Panel</h1>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-bold">
                    <ShieldAlert className="h-4 w-4" /> System Access
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: BarChart3, color: "bg-blue-50 text-blue-600" },
                    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-purple-50 text-purple-600" },
                    { label: "Total Orders", value: stats.totalOrders, icon: CreditCard, color: "bg-green-50 text-green-600" }
                ].map((item, i) => (
                    <div key={i} className="p-6 border rounded-3xl space-y-2">
                        <div className={item.color + " p-3 w-fit rounded-2xl mb-2"}>
                            <item.icon className="h-6 w-6" />
                        </div>
                        <p className="text-muted-foreground font-medium">{item.label}</p>
                        <p className="text-3xl font-bold">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <div className="p-8 border rounded-3xl space-y-6">
                    <div className="flex items-center gap-2">
                        <Settings className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold">Razorpay Integration</h2>
                    </div>
                    <form onSubmit={saveConfig} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Razorpay Key ID</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                value={razorpayConfig.keyId}
                                onChange={(e) => setRazorpayConfig({ ...razorpayConfig, keyId: e.target.value })}
                                placeholder="rzp_live_..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Razorpay Secret Key</label>
                            <input
                                type="password"
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                value={razorpayConfig.keySecret}
                                onChange={(e) => setRazorpayConfig({ ...razorpayConfig, keySecret: e.target.value })}
                                placeholder="••••••••••••"
                            />
                        </div>
                        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90">
                            Save Configuration
                        </button>
                    </form>
                </div>

                <div className="p-8 border rounded-3xl space-y-6">
                    <div className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold">Admin Management</h2>
                    </div>
                    <p className="text-muted-foreground">Manage administrative accounts and permissions.</p>
                    <button
                        onClick={() => toast("Feature coming soon: User Search & Role Assignment")}
                        className="w-full border-2 border-dashed rounded-2xl p-8 text-muted-foreground hover:bg-muted transition-colors"
                    >
                        Click to manage users and roles
                    </button>
                </div>
            </div>
        </div>
    );
}
