import express from "express";
import {
  placeOrder,
  placeOrderRazorpay,
  allOrders,
  userOrders,
  getGuestOrder,
  updateStatus,
  verifyRazorpay,
  getTracking,
  trackOrder,
} from "../controllers/orderController.js";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const orderRouter = express.Router();

// Public routes (no authentication required)
orderRouter.post("/place", placeOrder); // Guest orders
orderRouter.post("/razorpay", placeOrderRazorpay); // Guest orders with Razorpay
orderRouter.post("/guest-orders", getGuestOrder); // Find guest orders by email/phone
orderRouter.post("/verifyRazorpay", verifyRazorpay); // Verify Razorpay payment

// Public order tracking by orderId or email
orderRouter.get("/track", trackOrder);

// User routes (requires authentication)
orderRouter.post("/userorders", authUser, userOrders);

// Admin routes
orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);
orderRouter.get("/tracking/:orderId", getTracking); // Public tracking

export default orderRouter;
