"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { UserProfile } from "@/types";

export const useAuth = () => {
    const { setUser, setLoading } = useAuthStore();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
                    if (userDoc.exists()) {
                        setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
                    } else {
                        // User exists in Auth but not Firestore yet 
                        // Provide a fallback so the UI stays "logged in"
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email || "",
                            name: firebaseUser.displayName || "User",
                            role: "USER",
                            isActive: true,
                            createdAt: new Date()
                        } as UserProfile);
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setLoading]);
};
