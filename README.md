# ZoftStore - Full-Stack E-commerce Web Application

A production-ready e-commerce platform built with **Next.js (App Router)**, **TypeScript**, **TailwindCSS**, and **Firebase**.

## ✨ Features

- **Authentication**: Firebase Auth with Role-Based Access Control (RBAC).
- **Secure Payments**: Razorpay integration via Firebase Cloud Functions for secure order creation and signature verification.
- **Admin Dashboard**: Manage products, inventory, and categories.
- **Super Admin Panel**: Manage Razorpay keys and view platform-wide analytics.
- **Shopping Flow**: Product browsing, advanced cart management, and seamless checkout.
- **Premium Design**: Modern, responsive UI with sleek animations and a mobile-first approach.
- **Scalable Architecture**: Clean folder structure with modular components and shared state management using Zustand.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Zustand, Lucide React, Framer Motion.
- **Backend (Serverless)**: Firebase Authentication, Firestore, Cloud Functions, Storage.
- **Payment Gateway**: Razorpay.

## 🛠️ Setup Instructions

### 1. Firebase Setup
- Create a new project on [Firebase Console](https://console.firebase.google.com/).
- Enable **Authentication** (Email/Password).
- Create a **Firestore Database** in production mode.
- Create a **Firebase Storage** bucket.
- Upgrade to the **Blaze (Pay-as-you-go) plan** (required for Cloud Functions).

### 2. Environment Variables
Create a `.env.local` file in the root directory and add your Firebase and Razorpay credentials (see `.env.example`):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Deploy Cloud Functions
- Install Firebase CLI: `npm install -g firebase-tools`
- Login: `firebase login`
- Initialize functions: `firebase init functions` (choose TypeScript)
- Copy the provided code from `functions/src` to your local functions directory.
- Deploy: `firebase deploy --only functions`

### 4. Configure Razorpay Keys
- Login to the **Super Admin** account (first user created in Firebase with role 'SUPER_ADMIN' set manually in Firestore).
- Navigate to `/super-admin`.
- Enter your **Razorpay Key ID** and **Key Secret**. This is stored securely in Firestore and used by Cloud Functions.

### 5. Install & Run
```bash
npm install
npm run dev
```

## 🔐 Security Rules
Deploy the following rules to your [Firebase Console](https://console.firebase.google.com/):
- **Firestore**: Use `firestore.rules`.
- **Storage**: Use standard production rules for image uploads.

## 📦 Database Schema (Firestore)
- `users/{uid}`: User profiles & roles.
- `products/{productId}`: Product catalog.
- `orders/{orderId}`: Verified transaction records.
- `config/razorpay`: Encrypted payment configuration.

---
Built with ❤️ by Antigravity (Advanced Agentic Coding)
