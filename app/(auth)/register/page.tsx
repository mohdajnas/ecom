"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { toast } from "react-hot-toast";
import { Store } from "lucide-react";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in Firestore
            await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                role: "USER",
                isActive: true,
                createdAt: serverTimestamp(),
            });

            toast.success("Account created successfully!");
            router.push("/");
        } catch (error: any) {
            toast.error(error.message || "Failed to register");
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
                    <h2 className="mt-6 text-3xl font-bold tracking-tight">Create Account</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Join yabuku.in and start shopping today
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleRegister}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
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
                        <div>
                            <label className="text-sm font-medium">Confirm Password</label>
                            <input
                                type="password"
                                required
                                className="mt-1 block w-full rounded-xl border bg-muted/50 px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </form>

                <div className="text-center text-sm">
                    <p className="text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-bold text-primary hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
