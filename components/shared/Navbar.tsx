"use client";

import Link from "next/link";
import { ShoppingCart, Heart, User, Search, Store } from "lucide-react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import { cn } from "@/lib/utils";

export const Navbar = () => {
    const { user } = useAuthStore();
    const { getTotalItems } = useCartStore();
    const { items: wishlistItems } = useWishlistStore();

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center space-x-2">
                        <Store className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold tracking-tighter">yabuku.in</span>
                    </Link>
                </div>

                <div className="hidden md:flex flex-1 items-center justify-center px-8">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="search"
                            placeholder="Search products..."
                            className="w-full rounded-full border bg-muted pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/wishlist" className="p-2 hover:bg-muted rounded-full relative">
                        <Heart className="h-5 w-5" />
                        {wishlistItems.length > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {wishlistItems.length}
                            </span>
                        )}
                    </Link>
                    <Link href="/cart" className="p-2 hover:bg-muted rounded-full relative">
                        <ShoppingCart className="h-5 w-5" />
                        {getTotalItems() > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                                {getTotalItems()}
                            </span>
                        )}
                    </Link>
                    <Link href={user ? "/profile" : "/login"} className="p-2 hover:bg-muted rounded-full overflow-hidden">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                            <User className="h-5 w-5" />
                        )}
                    </Link>

                    {user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
                        <Link
                            href="/admin"
                            className="hidden lg:block text-sm font-medium bg-secondary px-3 py-1.5 rounded-md hover:bg-secondary/80"
                        >
                            Dashboard
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};
