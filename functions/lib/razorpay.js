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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRazorpayPayment = exports.createRazorpayOrder = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const razorpay_1 = __importDefault(require("razorpay"));
const crypto = __importStar(require("crypto"));
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();
// Helper to get Razorpay instance
const getRazorpayInstance = async () => {
    const configDoc = await db.collection("config").doc("razorpay").get();
    const config = configDoc.data();
    if (!config || !config.keyId || !config.keySecret) {
        throw new functions.https.HttpsError("failed-precondition", "Razorpay keys not configured");
    }
    return new razorpay_1.default({
        key_id: config.keyId,
        key_secret: config.keySecret,
    });
};
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }
    const amount = Number(data.amount);
    if (!amount || amount <= 0) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid amount provided");
    }
    const currency = data.currency || "INR";
    try {
        const razorpay = await getRazorpayInstance();
        const options = {
            amount: Math.round(amount * 100),
            currency,
            receipt: `receipt_${Date.now()}`,
        };
        const order = await razorpay.orders.create(options);
        return order;
    }
    catch (error) {
        console.error("Razorpay Order Creation Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, items, totalAmount, address, isGstInvoice, gstDetails, } = data;
    try {
        const configDoc = await db.collection("config").doc("razorpay").get();
        const config = configDoc.data();
        if (!config || !config.keySecret) {
            throw new functions.https.HttpsError("failed-precondition", "Razorpay secret not found");
        }
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", config.keySecret)
            .update(body)
            .digest("hex");
        const isSignatureValid = expectedSignature === razorpaySignature;
        if (!isSignatureValid) {
            throw new functions.https.HttpsError("invalid-argument", "Payment verification failed");
        }
        // Sanitize items for storage
        const sanitizedItems = items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            productName: item.product?.name || "Product",
            price: Number(item.product?.price) || 0,
        }));
        // Save order to Firestore
        const orderData = {
            userId: context.auth.uid,
            items: sanitizedItems,
            address,
            isGstInvoice: isGstInvoice || false,
            totalAmount: Number(totalAmount) || 0,
            status: "PAID",
            razorpayOrderId,
            razorpayPaymentId,
            paymentMethod: "ONLINE",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (isGstInvoice && gstDetails) {
            orderData.gstDetails = gstDetails;
        }
        const orderRef = await db.collection("orders").add(orderData);
        // Update stock for each product
        const batch = db.batch();
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item.productId && typeof item.productId === "string") {
                    const productRef = db.collection("products").doc(item.productId);
                    const quantity = Number(item.quantity) || 1;
                    batch.update(productRef, {
                        stock: admin.firestore.FieldValue.increment(-quantity),
                    });
                }
            }
        }
        // Clear cart
        const cartRef = db.collection("carts").doc(context.auth.uid);
        batch.delete(cartRef);
        await batch.commit();
        return { success: true, orderId: orderRef.id };
    }
    catch (error) {
        console.error("Payment Verification Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Payment verification crashed unexpectedly");
    }
});
//# sourceMappingURL=razorpay.js.map