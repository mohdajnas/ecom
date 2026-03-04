import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

export const placeOrder = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in");
    }

    const {
        items,
        address,
        isGstInvoice,
        gstDetails,
        paymentMethod,
        totalAmount,
    } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Cart is empty");
    }

    if (!address || !address.fullName || !address.phone) {
        throw new functions.https.HttpsError("invalid-argument", "Delivery address is incomplete");
    }

    try {
        // Sanitize items for storage
        const sanitizedItems = items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 1,
            productName: item.product?.name || "Product",
            price: Number(item.product?.price) || 0,
        }));

        // Calculate a safe total if needed, or trust the client for now (should ideally verify)

        // Save order to Firestore
        const orderData: any = {
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
    } catch (error: any) {
        console.error("Place Order Error:", error);
        throw new functions.https.HttpsError("internal", error.message || "An unexpected error occurred while placing the order");
    }
});
