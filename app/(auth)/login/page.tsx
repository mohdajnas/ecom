"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { toast } from "react-hot-toast";
import { Store } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("Welcome back!");
            router.push("/");
        } catch (error: any) {
            toast.error(error.message || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <div className="w-full max-w-md space-y-8 rounded-3xl border p-8 shadow-sm">
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center">
                        <img src="/logo.png" alt="yabuku.in" className="h-10 w-auto object-contain" />
                    </Link>
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">Login</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Enter your credentials to access your account
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <input
                                type="email"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-bold text-primary hover:underline">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
