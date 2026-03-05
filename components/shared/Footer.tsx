"use client";

import Link from "next/link";
import {
    Store,
    Facebook,
    Twitter,
    Instagram,
    Youtube,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    ShieldCheck,
    Truck,
    RotateCcw,
    Headphones
} from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = {
    shop: [
        { label: "New Arrivals", href: "/new-arrivals" },
        { label: "Best Sellers", href: "/best-sellers" },
        { label: "Categories", href: "/categories" },
        { label: "Offers", href: "/offers" },
    ],
    support: [
        { label: "Contact Us", href: "/contact" },
        { label: "Shipping Policy", href: "/shipping" },
        { label: "Returns & Refunds", href: "/returns" },
        { label: "FAQ", href: "/faq" },
    ],
    company: [
        { label: "About Us", href: "/about" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Store Locator", href: "/stores" },
    ],
};

const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Youtube, href: "https://youtube.com", label: "Youtube" },
];

const features = [
    { icon: Truck, title: "Free Shipping", desc: "On orders over ₹999" },
    { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
    { icon: ShieldCheck, title: "Secure Payment", desc: "100% secure payment" },
    { icon: Headphones, title: "24/7 Support", desc: "Dedicated support team" },
];

export const Footer = () => {
    return (
        <footer className="w-full bg-background border-t">
            <div className="container mx-auto px-4 pt-4 pb-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
                    {/* Brand & Newsletter */}
                    <div className="lg:col-span-2 space-y-4">
                        <Link href="/" className="flex items-center">
                            <img src="/logo.png" alt="yabuku.in" className="h-10 w-auto object-contain" />
                        </Link>
                        <p className="text-muted-foreground max-w-sm leading-relaxed">
                            Experience the best in premium e-commerce. Quality products curated for your modern lifestyle.
                        </p>

                        <div className="pt-2">
                            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider">Stay Updated</h4>
                            <form className="flex gap-2 max-w-sm" onSubmit={(e) => e.preventDefault()}>
                                <div className="relative flex-1">
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="w-full h-11 px-4 rounded-xl border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="h-11 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-all flex items-center justify-center group"
                                >
                                    Join
                                    <ArrowRight className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                            <p className="mt-3 text-[10px] text-muted-foreground/60">
                                By subscribing, you agree to our Terms & Privacy Policy.
                            </p>
                        </div>

                        <div className="flex gap-4 pt-2">
                            {socialLinks.map((social, index) => (
                                <motion.a
                                    key={index}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    whileHover={{ y: -3 }}
                                    className="p-2.5 rounded-full border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-colors text-muted-foreground hover:text-primary"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-5 w-5" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Shop</h4>
                        <ul className="space-y-2">
                            {footerLinks.shop.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Support</h4>
                        <ul className="space-y-2">
                            {footerLinks.support.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold mb-3 text-sm uppercase tracking-wider">Contact Us</h4>
                        <ul className="space-y-1.5">
                            <li className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-sm text-muted-foreground">
                                    123 Commerce St, Digital Avenue, Tech City, 560001
                                </span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-5 w-5 text-primary shrink-0" />
                                <a href="tel:+1234567890" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    +91 (123) 456-7890
                                </a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-primary shrink-0" />
                                <a href="mailto:hello@yabuku.in" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                                    hello@yabuku.in
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-4 pt-2 border-t border-muted/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-6">
                        <p className="text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} <span className="font-semibold text-foreground">yabuku.in</span>. All rights reserved.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
                    </div>
                </div>
            </div>
        </footer>
    );
};
