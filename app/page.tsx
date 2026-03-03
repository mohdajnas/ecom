"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Package, Star, Smartphone, Laptop, Watch, Shirt, Home as HomeIcon, Footprints, Headphones, Camera, MoreHorizontal } from "lucide-react";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/types";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Start with hardcoded defaults to ensure something always shows
        const defaultCats = ["Electronics", "Fashion", "Home", "Beauty"];

        // 2. Fetch Categories from Firestore
        const categorySnap = await getDocs(collection(db, "categories"));
        let firestoreCats = categorySnap.docs
          .map(doc => doc.data().name)
          .filter((name): name is string => typeof name === "string" && name.length > 0);

        // 3. Fetch Products (to extract categories if needed)
        const q = query(
          collection(db, "products"),
          orderBy("createdAt", "desc"),
          limit(4)
        );
        const snap = await getDocs(q);
        const fetchedProducts = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(fetchedProducts);

        // 4. Determine final category list
        let finalCats = firestoreCats;
        if (finalCats.length === 0) {
          const productCats = Array.from(new Set(fetchedProducts.map(p => (p as any).category).filter((c): c is string => typeof c === "string" && c.length > 0)));
          finalCats = productCats.length > 0 ? productCats : defaultCats;
        }

        setCategories(finalCats);
      } catch (error) {
        console.error("Error fetching home data:", error);
        setCategories(["Electronics", "Fashion", "Home", "Beauty"]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getCategoryIcon = (name: string) => {
    if (!name) return MoreHorizontal;
    const n = name.toLowerCase();
    if (n.includes("phone") || n.includes("mobile")) return Smartphone;
    if (n.includes("laptop") || n.includes("computer") || n.includes("electronics")) return Laptop;
    if (n.includes("watch") || n.includes("accessory")) return Watch;
    if (n.includes("clothing") || n.includes("shirt") || n.includes("fashion") || n.includes("apparel")) return Shirt;
    if (n.includes("home") || n.includes("furniture") || n.includes("decor")) return HomeIcon;
    if (n.includes("shoe") || n.includes("foot") || n.includes("sneaker")) return Footprints;
    if (n.includes("audio") || n.includes("head") || n.includes("speaker") || n.includes("music")) return Headphones;
    if (n.includes("camera") || n.includes("photo") || n.includes("video")) return Camera;
    if (n.includes("beauty") || n.includes("care") || n.includes("cosmetic")) return Star;
    return MoreHorizontal;
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-primary px-8 py-16 text-primary-foreground shadow-2xl shadow-primary/20">
        <div className="relative z-10 max-w-2xl space-y-6 animate-in fade-in slide-in-from-left-8 duration-700">
          <h1 className="text-5xl font-black tracking-tight lg:text-7xl leading-[0.9]">
            Shop the <span className="text-accent underline decoration-8 underline-offset-8">Future</span> of Style.
          </h1>
          <p className="text-lg opacity-90 max-w-lg leading-relaxed">
            Discover a curated collection of premium products designed for modern living.
            Join Thousands of satisfied customers at <span className="font-bold">yabuku.in</span>.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/shop"
              className="group flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-lg font-black text-primary transition-all hover:scale-105 hover:shadow-xl active:scale-95"
            >
              Start Shopping <ShoppingBag className="h-6 w-6 transition-transform group-hover:rotate-12" />
            </Link>
            <Link
              href="/categories"
              className="flex items-center gap-2 rounded-2xl border-2 border-white/20 bg-white/5 px-10 py-5 text-lg font-bold backdrop-blur-md transition-all hover:bg-white/10"
            >
              Browse Categories
            </Link>
          </div>
        </div>

        {/* Abstract background elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[120px] animate-pulse" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-[80px]" />
      </section>

      {/* Shop by Category Section */}
      <section id="categories" className="scroll-mt-24 space-y-10">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <span className="text-primary font-black uppercase tracking-[0.2em] text-xs">Browse our Collections</span>
            <h2 className="text-4xl font-black tracking-tight">Shop by Category</h2>
          </div>
          <Link href="/shop" className="group flex items-center gap-2 text-primary font-bold hover:underline underline-offset-4">
            See all <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-muted/50 border-2 border-transparent animate-pulse">
                <div className="h-16 w-16 rounded-2xl bg-muted" />
                <div className="mt-4 h-4 w-20 bg-muted rounded" />
              </div>
            ))
          ) : categories.length > 0 ? (
            categories.slice(0, 6).map((cat, i) => {
              const Icon = getCategoryIcon(cat);
              const colors = [
                "bg-orange-50 text-orange-600 hover:border-orange-200",
                "bg-blue-50 text-blue-600 hover:border-blue-200",
                "bg-pink-50 text-pink-600 hover:border-pink-200",
                "bg-purple-50 text-purple-600 hover:border-purple-200",
                "bg-green-50 text-green-600 hover:border-green-200",
                "bg-yellow-50 text-yellow-600 hover:border-yellow-200"
              ];
              const colorClass = colors[i % colors.length];

              return (
                <Link
                  key={i}
                  href={`/shop?category=${encodeURIComponent(cat)}`}
                  className={`group flex flex-col items-center justify-center p-8 rounded-[2.5rem] border-2 border-transparent transition-all duration-300 hover:bg-white hover:shadow-2xl hover:-translate-y-2 ${colorClass}`}
                >
                  <div className="p-5 rounded-2xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-10 w-10" />
                  </div>
                  <span className="mt-4 font-black text-center text-foreground group-hover:text-primary transition-colors">{cat}</span>
                </Link>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center border-2 border-dashed rounded-[2.5rem] text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">No categories found in the database.</p>
              <p className="text-sm">Categories will appear here once added in the admin panel.</p>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="space-y-10">
        <div className="flex items-end justify-between px-2">
          <div className="space-y-2">
            <span className="text-primary font-black uppercase tracking-[0.2em] text-xs">New Arrivals</span>
            <h2 className="text-4xl font-black tracking-tight">Featured Products</h2>
          </div>
          <Link href="/shop" className="group flex items-center gap-2 text-primary font-bold text-lg hover:underline underline-offset-8">
            View everything <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="aspect-square bg-muted rounded-3xl" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))
          ) : products.length > 0 ? (
            products.map((product) => (
              <Link
                href={`/products/${product.id}`}
                key={product.id}
                className="group flex flex-col space-y-4"
              >
                <div className="aspect-square bg-muted rounded-[2rem] overflow-hidden relative shadow-sm transition-all group-hover:shadow-2xl group-hover:-translate-y-2">
                  {product.imageUrls?.[0] ? (
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                      <Package className="h-16 w-16" />
                    </div>
                  )}
                  {product.discount > 0 && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white font-black rounded-lg text-xs">
                      -{product.discount}%
                    </div>
                  )}
                </div>
                <div className="px-2 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    <span>{(product as any).category || "General"}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>4.8</span>
                    </div>
                  </div>
                  <h3 className="font-black text-xl leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                  <p className="font-black text-2xl text-primary mt-2">{formatPrice(product.price)}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-4 border-dashed rounded-[3rem] text-muted-foreground">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold">New stock arriving soon!</h3>
              <p className="mt-2">We&apos;re currently updating our catalog.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter / CTA */}
      <section className="bg-muted/30 rounded-[3rem] p-8 text-center space-y-8 border-2 border-muted/50">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-4xl font-black tracking-tight">Never miss a drop.</h2>
          <p className="text-lg text-muted-foreground">Subscribe to our newsletter and get ₹200 off your first order at yabuku.in.</p>
        </div>
        <div className="max-w-md mx-auto flex gap-3">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-6 py-4 rounded-2xl border-2 border-muted bg-background outline-none focus:ring-2 focus:ring-primary transition-all"
          />
          <button className="px-8 py-4 bg-primary text-white font-black rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-primary/10">
            Join
          </button>
        </div>
      </section>
    </div>
  );
}
