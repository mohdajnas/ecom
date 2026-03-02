"use client";

import { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    useAuth();
    return (
        <>
            {children}
            <Toaster position="bottom-right" />
        </>
    );
};
