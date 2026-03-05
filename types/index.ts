export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'USER';

export interface UserProfile {
    uid: string;
    name: string;
    email: string;
    phoneNumber?: string;
    photoURL?: string;
    role: UserRole;
    isActive: boolean;
    createdAt: any;
    addresses?: Address[];
    savedCards?: SavedCard[];
}

export interface Address {
    id: string;
    label: string;
    buildingName?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
}

export interface SavedCard {
    id: string;
    last4: string;
    brand: string;
    expiryMonth: string;
    expiryYear: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    discount: number;
    stock: number;
    categoryId: string;
    imageUrls: string[];
    rating: number;
    createdAt: any;
}

export interface Category {
    id: string;
    name: string;
}

export interface CartItem {
    productId: string;
    quantity: number;
    product?: Product;
}

export interface Order {
    id: string;
    userId: string;
    items: CartItem[];
    totalAmount: number;
    status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    razorpayOrderId: string;
    razorpayPaymentId?: string;
    createdAt: any;
}

export interface Wishlist {
    uid: string;
    productIds: string[];
}
