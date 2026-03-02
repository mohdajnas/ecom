import Link from "next/link";
import { ArrowRight, ShoppingBag, Zap, ShieldCheck, Truck } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-primary px-8 py-20 text-primary-foreground">
        <div className="relative z-10 max-w-2xl space-y-8">
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-7xl">
            Elevate Your <span className="text-accent underline">Style</span> with yabuku.in.
          </h1>
          <p className="text-xl opacity-90">
            Discover a curated collection of premium products designed for modern living.
            Quality meets aesthetics in every detail.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-full bg-background px-8 py-4 text-lg font-bold text-foreground transition-transform hover:scale-105"
            >
              Shop Now <ShoppingBag className="h-5 w-5" />
            </Link>
            <Link
              href="/categories"
              className="flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-8 py-4 text-lg font-bold backdrop-blur-sm transition-colors hover:bg-background/20"
            >
              Browse Categories
            </Link>
          </div>
        </div>

        {/* Abstract background elements */}
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent/20 blur-2xl" />
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Zap, title: "Fast Delivery", desc: "Get your orders delivered in 2-3 business days across India." },
          { icon: ShieldCheck, title: "Secure Payments", desc: "Fully encrypted transactions via Razorpay and Cloud Functions." },
          { icon: Truck, title: "Free Shipping", desc: "Free shipping on all orders above ₹999. No hidden costs." }
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center text-center p-6 border rounded-2xl hover:shadow-lg transition-shadow">
            <div className="p-3 bg-primary/10 rounded-full mb-4">
              <feature.icon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Featured Products Placeholder */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Featured Products</h2>
          <Link href="/shop" className="group flex items-center gap-1 text-primary font-medium">
            View all <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((id) => (
            <div key={id} className="group flex flex-col space-y-3">
              <div className="aspect-square bg-muted rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Product Image</div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Product Name {id}</h3>
                <p className="text-muted-foreground">Category Name</p>
                <p className="font-bold text-xl mt-1">₹1,299</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
