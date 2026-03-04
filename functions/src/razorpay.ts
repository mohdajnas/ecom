import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Razorpay from "razorpay";
import * as crypto from "crypto";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// Helper to get Razorpay instance
const getRazorpayInstance = async () => {
    const configDoc = await db.collection("config").doc("razorpay").get();
    const config = configDoc.data();

    if (!config || !config.keyId || !config.keySecret) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Razorpay keys not configured"
        );
    }

    return new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
    });
};

export const createRazorpayOrder = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
            amount: Math.round(amount * 100), // amount in smallest currency unit
            currency,
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        return order;
    } catch (error: any) {
        console.error("Razorpay Order Creation Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});

export const verifyRazorpayPayment = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }

    const {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        items,
        totalAmount,
        address,
        isGstInvoice,
        gstDetails,
    } = data;

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
        const sanitizedItems = items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            productName: item.product?.name || "Product",
            price: Number(item.product?.price) || 0,
        }));

        // Save order to Firestore
        const orderData: any = {
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
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "Payment verification crashed unexpectedly");
    }
});
