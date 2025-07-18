import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import razorpay from "razorpay";
import mongoose from "mongoose";

// global variables
const currency = "inr";
const deliveryCharge = 10;

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Placing orders using COD Method (supports both guest and user orders)
const placeOrder = async (req, res) => {
  try {
    const { userId, guestInfo, items, amount, address } = req.body;

    // Validate required fields
    if (!items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message: "Items, amount, and address are required",
      });
    }

    // For guest orders, guestInfo is required
    if (!userId && !guestInfo) {
      return res.status(400).json({
        success: false,
        message: "Guest information is required for guest orders",
      });
    }

    // For guest orders, validate guestInfo
    if (!userId && guestInfo) {
      if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and phone are required for guest orders",
        });
      }
    }

    const orderData = {
      userId: userId || null,
      guestInfo: guestInfo || null,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Clear cart only for logged-in users
    if (userId) {
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
    }

    res.json({ 
      success: true, 
      message: "Order Placed Successfully",
      orderId: newOrder._id 
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Placing orders using Razorpay Method (supports both guest and user orders)
const placeOrderRazorpay = async (req, res) => {
  try {
    const { userId, guestInfo, items, amount, address } = req.body;

    // Validate required fields
    if (!items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message: "Items, amount, and address are required",
      });
    }

    // For guest orders, guestInfo is required
    if (!userId && !guestInfo) {
      return res.status(400).json({
        success: false,
        message: "Guest information is required for guest orders",
      });
    }

    // For guest orders, validate guestInfo
    if (!userId && guestInfo) {
      if (!guestInfo.name || !guestInfo.email || !guestInfo.phone) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and phone are required for guest orders",
        });
      }
    }

    const orderData = {
      userId: userId || null,
      guestInfo: guestInfo || null,
      items,
      address,
      amount,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const options = {
      amount: amount * 100,
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString(),
    };

    await razorpayInstance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error);
        return res.json({ success: false, message: error });
      }
      res.json({ success: true, order });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { userId, razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    if (orderInfo.status === "paid") {
      await orderModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
      
      // Clear cart only for logged-in users
      if (userId) {
        await userModel.findByIdAndUpdate(userId, { cartData: {} });
      }
      
      res.json({ success: true, message: "Payment Successful" });
    } else {
      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// All Orders data for Admin Panel
const allOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({}).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get orders for logged-in users
const userOrders = async (req, res) => {
  try {
    const { id } = req.user;
    console.log("User ID from token:", id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to fetch orders.",
      });
    }

    const orders = await orderModel.find({ userId: id }).sort({ date: -1 });

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found for this user.",
        orders: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching orders.",
    });
  }
};

// Get guest order by email and phone
const getGuestOrder = async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email and phone are required to find guest orders",
      });
    }

    const orders = await orderModel.find({
      orderType: 'guest',
      'guestInfo.email': email,
      'guestInfo.phone': phone
    }).sort({ date: -1 });

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No orders found for this guest.",
        orders: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Guest orders retrieved successfully.",
      orders,
    });
  } catch (error) {
    console.error("Error fetching guest orders:", error.message);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching orders.",
    });
  }
};

// update order status from Admin Panel
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    // Validate the status
    const validStatuses = [
      "order placed",
      "processing",
      "shipped",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    // Update the order
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        status,
        "tracking.status": status,
        $push: {
          "tracking.updates": {
            status,
            timestamp: new Date(),
            comment: `Order status updated to ${status}`,
          },
        },
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Status Updated",
      order: updatedOrder,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update tracking information
const updateTracking = async (req, res) => {
  try {
    console.log("=== UpdateTracking controller ===");
    console.log("User from request:", req.user);
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    const { orderId } = req.params;
    const { status, comment, estimatedDelivery } = req.body;

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Add new tracking update
    const trackingUpdate = {
      status,
      comment,
      timestamp: new Date(),
    };

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        $set: {
          "tracking.status": status,
          "tracking.estimatedDelivery": estimatedDelivery
            ? new Date(estimatedDelivery)
            : undefined,
          status: status.toLowerCase(),
        },
        $push: {
          "tracking.updates": trackingUpdate,
        },
      },
      { new: true }
    );

    console.log("Order updated successfully:", updatedOrder);

    res.json({
      success: true,
      message: "Tracking updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("UpdateTracking error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update tracking information",
    });
  }
};

// Get order tracking information
const getTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      tracking: order.tracking,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accept or reject order by vendor
const updateVendorAcceptance = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const vendorId = req.user.vendorId;

    // Validate the status
    const validStatuses = ["accepted", "rejected", "shipped"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'accepted', 'rejected', or 'shipped'",
      });
    }

    // Validate status transition
    if (status === "shipped") {
      // Check if order was previously accepted
      const isAccepted = order.status === "accepted";
      if (!isAccepted) {
        return res.status(400).json({
          success: false,
          message: "Order must be accepted before it can be shipped",
        });
      }
    }

    // Find the order
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if this vendor has items in the order
    const hasItems = order.items.some(
      (item) => item.vendor.toString() === vendorId
    );
    if (!hasItems) {
      return res.status(403).json({
        success: false,
        message: "You don't have any items in this order",
      });
    }

    // Update or add vendor acceptance status
    const acceptanceIndex = order.vendorAcceptance.findIndex(
      (va) => va.vendorId.toString() === vendorId
    );

    if (acceptanceIndex >= 0) {
      order.vendorAcceptance[acceptanceIndex].status = status;
      order.vendorAcceptance[acceptanceIndex].timestamp = new Date();
    } else {
      order.vendorAcceptance.push({
        vendorId,
        status,
        timestamp: new Date(),
      });
    }

    // Update main order status to match vendor acceptance
    order.status = status;

    // Update tracking status and add update
    order.tracking.status = status;
    order.tracking.updates.push({
      status: `Order ${status} by vendor`,
      timestamp: new Date(),
      comment: `Vendor has ${status} the order`,
    });

    await order.save();

    res.json({
      success: true,
      message: `Order successfully ${status}`,
      order,
    });
  } catch (error) {
    console.error("Error updating vendor acceptance:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update vendor acceptance",
    });
  }
};

// Public order tracking by orderId or email
const trackOrder = async (req, res) => {
  try {
    const { orderId, email } = req.query;
    let order = null;
    if (orderId) {
      order = await orderModel.findById(orderId);
    } else if (email) {
      order = await orderModel.findOne({ 'address.email': email });
    }
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export {
  placeOrder,
  placeOrderRazorpay,
  verifyRazorpay,
  allOrders,
  userOrders,
  getGuestOrder,
  updateStatus,
  updateTracking,
  getTracking,
  updateVendorAcceptance,
  trackOrder,
};
