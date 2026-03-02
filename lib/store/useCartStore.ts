import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product } from '@/types';

interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addItem: (product, quantity = 1) => {
                const items = get().items;
                const existingItem = items.find((item) => item.productId === product.id);
                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            item.productId === product.id
                                ? { ...item, quantity: item.quantity + quantity }
                                : item
                        ),
                    });
                } else {
                    set({ items: [...items, { productId: product.id, quantity, product }] });
                }
            },
            removeItem: (productId) => {
                set({ items: get().items.filter((item) => item.productId !== productId) });
            },
            updateQuantity: (productId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(productId);
                    return;
                }
                set({
                    items: get().items.map((item) =>
                        item.productId === productId ? { ...item, quantity } : item
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
            getTotalPrice: () =>
                get().items.reduce(
                    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
                    0
                ),
        }),
        {
            name: 'cart-storage',
        }
    )
);
