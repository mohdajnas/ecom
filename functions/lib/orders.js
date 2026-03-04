"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeOrder = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.placeOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }
    const { items, address, isGstInvoice, gstDetails, paymentMethod, totalAmount, } = data;
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Cart is empty");
    }
    if (!address || !address.fullName || !address.phone) {
        throw new functions.https.HttpsError("invalid-argument", "Delivery address is incomplete");
    }
    try {
        // Sanitize items for storage
        const sanitizedItems = items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            productName: item.product?.name || "Product",
            price: Number(item.product?.price) || 0,
        }));
        // Calculate a safe total if needed, or trust the client for now (should ideally verify)
        // Save order to Firestore
        const orderData = {
            userId: context.auth.uid,
            items: sanitizedItems,
            address,
            isGstInvoice: isGstInvoice || false,
            paymentMethod: paymentMethod || "COD",
            totalAmount: Number(totalAmount) || 0,
            status: paymentMethod === "COD" ? "PENDING" : "PAID",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (isGstInvoice && gstDetails) {
            orderData.gstDetails = gstDetails;
        }
        const orderRef = await db.collection("orders").add(orderData);
        // Update stock for each product
        const batch = db.batch();
        for (const item of items) {
            if (item.productId && typeof item.productId === "string") {
                const productRef = db.collection("products").doc(item.productId);
                const quantity = Number(item.quantity) || 1;
                batch.update(productRef, {
                    stock: admin.firestore.FieldValue.increment(-quantity),
                });
            }
        }
        // Clear cart for this user in Firestore if it exists
        const cartRef = db.collection("carts").doc(context.auth.uid);
        batch.delete(cartRef);
        await batch.commit();
        return { success: true, orderId: orderRef.id };
    }
    catch (error) {
        console.error("Place Order Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "An unexpected error occurred while placing the order");
    }
});
//# sourceMappingURL=orders.js.map