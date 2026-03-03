"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/useCartStore";
import { useWishlistStore } from "@/lib/store/useWishlistStore";
import {
    ShoppingCart, Heart, Star, ChevronLeft, ShieldCheck,
    Truck, RotateCcw, Minus, Plus, Package
} from "lucide-react";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    const addItem = useCartStore(state => state.addItem);
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) return;
            try {
                const docSnap = await getDoc(doc(db, "products", id as string));
                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
                } else {
                    toast.error("Product not found");
                    router.push("/shop");
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                toast.error("Failed to load product details");
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, router]);

    const handleAddToCart = () => {
        if (!product) return;
        addItem(product, quantity);
        toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
    };

    const toggleWishlist = () => {
        if (!product) return;
        if (isInWishlist(product.id)) {
            removeFromWishlist(product.id);
            toast.success("Removed from wishlist");
        } else {
            addToWishlist(product);
            toast.success("Added to wishlist");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    if (!product) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumbs / Back button */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <div className="p-2 rounded-full group-hover:bg-primary/10 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </div>
                <span className="font-medium">Back to Shop</span>
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                {/* Product Images */}
                <div className="space-y-6">
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-muted shadow-xl border">
                        {product.imageUrls?.[selectedImage] ? (
                            <img
                                src={product.imageUrls[selectedImage]}
                                alt={product.name}
                                className="h-full w-full object-cover transition-transform hover:scale-105 duration-700"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                <Package className="h-32 w-32" />
                            </div>
                        )}

                        {/* Wishlist button on image */}
                        <button
                            onClick={toggleWishlist}
                            className="absolute top-6 right-6 p-4 rounded-full bg-white/80 backdrop-blur-md shadow-lg transition-transform hover:scale-110 active:scale-90 z-10"
                        >
                            <Heart
                                className={`h-6 w-6 transition-colors ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-600'}`}
                            />
                        </button>

                        {/* Discount badge */}
                        {product.discount > 0 && (
                            <div className="absolute top-6 left-6 px-4 py-2 bg-red-500 text-white font-black rounded-xl shadow-lg uppercase tracking-tight text-sm">
                                {product.discount}% OFF
                            </div>
                        )}
                    </div>

                    {/* Thumbnail strips */}
                    {product.imageUrls && product.imageUrls.length > 1 && (
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {product.imageUrls.map((url, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImage(index)}
                                    className={`relative h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === index ? "border-primary ring-2 ring-primary/20 scale-95" : "border-transparent opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    <img src={url} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Product Info */}
                <div className="flex flex-col space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-widest">
                                {product.categoryId || 'General'}
                            </span>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400/10 text-yellow-600 rounded-full text-xs font-bold">
                                <Star className="h-3.5 w-3.5 fill-yellow-400" />
                                <span>{product.rating || 4.8} (120+ reviews)</span>
                            </div>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">{product.name}</h1>

                        <div className="flex items-end gap-4">
                            <span className="text-4xl font-black text-primary">{formatPrice(product.price)}</span>
                            {product.discount > 0 && (
                                <span className="text-xl text-muted-foreground line-through font-medium">
                                    {formatPrice(product.price * (1 + product.discount / 100))}
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                        {product.description || "Experience premium quality and exceptional design with our latest offering. This product is crafted to provide durability and performance that exceeds expectations."}
                    </p>

                    <div className="space-y-6">
                        {/* Quantity Selector */}
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Quantity</label>
                            <div className="flex items-center gap-6 w-fit bg-muted/50 p-2 rounded-2xl border">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-muted-foreground hover:text-primary active:scale-90"
                                >
                                    <Minus className="h-5 w-5" />
                                </button>
                                <span className="text-xl font-black w-8 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                                    className="p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all text-muted-foreground hover:text-primary active:scale-90"
                                >
                                    <Plus className="h-5 w-5" />
                                </button>
                            </div>
                            <p className={`text-xs font-bold ${product.stock && product.stock < 10 ? 'text-red-500' : 'text-green-600'}`}>
                                {product.stock ? `${product.stock} items remaining` : 'In Stock'}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={handleAddToCart}
                                className="flex-[2] py-5 bg-primary text-primary-foreground rounded-[1.5rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                <ShoppingCart className="h-6 w-6" /> Add to Cart
                            </button>
                            <button
                                onClick={toggleWishlist}
                                className="flex-1 py-5 border-2 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 hover:bg-muted transition-all active:scale-[0.98]"
                            >
                                <Heart className={`h-6 w-6 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} /> Wishlist
                            </button>
                        </div>
                    </div>

                    {/* Trust badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                <Truck className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tighter">Fast Delivery</span>
                                <span className="text-xs text-muted-foreground">Within 2-3 days</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tighter">Secure Payment</span>
                                <span className="text-xs text-muted-foreground">SSL Encrypted</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                                <RotateCcw className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black uppercase tracking-tighter">Free Returns</span>
                                <span className="text-xs text-muted-foreground">30-day window</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
