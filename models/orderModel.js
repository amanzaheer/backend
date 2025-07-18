import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  // Guest order support - userId can be null for guest orders
  userId: { 
    type: String, 
    required: false, // Allow null for guest orders
    default: null 
  },
  
  // Guest information for non-logged in users
  guestInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
  },
  
  items: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      image: { type: Array },
      slug: { type: String },
    },
  ],
  
  amount: { type: Number, required: true },
  address: { type: Object, required: true },
  status: { type: String, required: true, default: "Order Placed" },
  paymentMethod: { type: String, required: true },
  payment: { type: Boolean, required: true, default: false },
  date: { type: Number, required: true },
  
  tracking: {
    status: { type: String, default: "Processing" },
    updates: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        comment: String,
      },
    ],
    estimatedDelivery: Date,
  },
  
  // Order type to distinguish between guest and user orders
  orderType: {
    type: String,
    enum: ['guest', 'user'],
    required: true,
    default: 'guest'
  }
});

orderSchema.pre("save", function (next) {
  // Set order type based on userId presence
  if (this.userId) {
    this.orderType = 'user';
  } else {
    this.orderType = 'guest';
  }
  next();
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);
export default orderModel;
