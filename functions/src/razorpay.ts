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

    const amount = data.amount;
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

        // Save order to Firestore
        const orderData = {
            userId: context.auth.uid,
            items,
            totalAmount,
            status: "PAID",
            razorpayOrderId,
            razorpayPaymentId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const orderRef = await db.collection("orders").add(orderData);

        // Update stock for each product
        const batch = db.batch();
        if (Array.isArray(items)) {
            for (const item of items) {
                const productRef = db.collection("products").doc(item.productId);
                batch.update(productRef, {
                    stock: admin.firestore.FieldValue.increment(-item.quantity),
                });
            }
        }

        // Clear cart
        const cartRef = db.collection("carts").doc(context.auth.uid);
        batch.delete(cartRef);

        await batch.commit();

        return { success: true, orderId: orderRef.id };
    } catch (error: any) {
        console.error("Payment Verification Error:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
