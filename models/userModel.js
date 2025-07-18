import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
    },
    vendorId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor"
    },
  },
  { minimize: false }
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
