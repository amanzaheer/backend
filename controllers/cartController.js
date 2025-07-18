import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";

// Add products to user cart
const addToCart = async (req, res) => {
  try {
    console.log("Add to Cart Request:", req.body);
    const { itemId } = req.body;
    const actualUserId = req.user.id; // Get userId from auth middleware

    const userData = await userModel.findById(actualUserId);
    if (!userData) {
      console.error("User not found:", actualUserId);
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};
    cartData[itemId] = (cartData[itemId] || 0) + 1;

    await userModel.findByIdAndUpdate(
      actualUserId,
      { cartData },
      { new: true }
    );
    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.json({ success: false, message: error.message });
  }
};

// Update user cart
const updateCart = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    const actualUserId = req.user.id; // Get userId from auth middleware, just like addToCart

    const userData = await userModel.findById(actualUserId);
    if (!userData) {
      console.error("User not found:", actualUserId);
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};

    if (cartData.hasOwnProperty(itemId)) {
      cartData[itemId] = quantity;
      await userModel.findByIdAndUpdate(
        actualUserId,
        { cartData },
        { new: true }
      );
      res.json({ success: true, message: "Cart Updated" });
    } else {
      return res.json({
        success: false,
        message: "Item not found in cart",
      });
    }
  } catch (error) {
    console.error("Error updating cart:", error);
    res.json({ success: false, message: error.message });
  }
};

// Get user cart data
const getUserCart = async (req, res) => {
  try {
    console.log("Get User Cart Request");
    const actualUserId = req.user.id; // Get userId from auth middleware

    const userData = await userModel.findById(actualUserId);
    if (!userData) {
      console.error("User not found:", actualUserId);
      return res.json({ success: false, message: "User not found" });
    }

    let cartData = userData.cartData || {};

    res.json({ success: true, cartData });
  } catch (error) {
    console.error("Error getting user cart:", error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart };
