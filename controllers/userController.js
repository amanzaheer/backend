import express from "express";
import expressAsyncHandler from "express-async-handler";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const router = express.Router();

const createToken = (id, role, vendorId) => {
  return jwt.sign({ id, role, vendorId }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });
};

export const loginUser = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user
  const user = await userModel.findOne({ email }).populate('vendorId');
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid credentials" });
  }

  // Create token with vendorId
  const token = createToken(user._id, user.role, user.vendorId?._id || user.vendorId);

  // Respond with user data and token
  res.status(200).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      vendorId: user.vendorId?._id || user.vendorId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

// @desc User Register
// @route POST /api/auth/register
// @access Public

export const registerUser = expressAsyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const exists = await userModel.findOne({ email });
  if (exists) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }

  // Validate email format & strong password
  if (!validator.isEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter a valid email" });
  }
  if (password.length < 8) {
    return res
      .status(400)
      .json({ success: false, message: "Please enter a strong password" });
  }

  // Hash user password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const newUser = new userModel({
    name,
    email,
    password: hashedPassword,
    role: role || "user", // Default to "user" if no role is provided
  });

  const user = await newUser.save();

  const token = createToken(user._id);

  // Respond with user data and token
  res.status(201).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, // Include role
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export const adminLogin = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Static admin credentials (as backup/alternative to environment variables)
  const staticAdminEmail = "admin@amanaorganics.com";
  const staticAdminPassword = "admin123456";

  // Check against environment variables first, then static credentials
  const isValidEmail = email === process.env.ADMIN_EMAIL || email === staticAdminEmail;
  const isValidPassword = password === process.env.ADMIN_PASSWORD || password === staticAdminPassword;

  // Validate credentials
  if (isValidEmail && isValidPassword) {
    // Generate JWT token
    const token = jwt.sign(
      { email, role: "admin" }, // Include role in the token payload
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expiration (adjust as needed)
    );

    // Respond with admin details and token
    res.status(200).json({
      success: true,
      token,
      user: {
        email,
        role: "admin", // Set role explicitly
        name: "Admin User", // Replace with actual admin name if available
      },
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// @desc Get a User Profile
// @router /api/user/profile
// @access Private

export const profile = expressAsyncHandler(async (req, res) => {
  const { _id } = req.body;

  // First, find if user exists
  const user = await userModel.findById(_id);

  // Check if user exists and password is correct
  if (user) {
    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      token: user.Token,
    });
  } else {
    res.status(401); // Unauthorized status code
    throw new Error("User Not Found!");
  }
});

// @desc Update User Profile
// @router /api/user/profile
// @access Private

// export const updateProfile = expressAsyncHandler(async (req, res) => {
//   const { _id } = req.user;

//   // First, find if user exists
//   const user = await userModel.findById(_id);

//   // Check if user exists and password is correct
//   if (user) {
//     user.name = req.body.name || user.name;
//     user.email = req.body.email || user.email;
//     if (req.body.password) {
//       user.password = req.body.password;
//     }
//     user.address = req.body.address || user.address;
//     user.phone = req.body.phone || user.phone;
//     const updateUser = await user.save();

//     return res.json({
//       _id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       phone: user.phone,
//       isActive: user.isActive,
//       address: user.address,
//     });
//   } else {
//     res.status(401); // Unauthorized status code
//     throw new Error("User Not Found!");
//   }
// });

export const updateProfile = expressAsyncHandler(async (req, res) => {
  const { _id, name, email, address, phone, role } = req.body;

  // Validate request data
  if (!_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required to update the user.",
    });
  }

  // Fetch the user by ID
  const user = await userModel.findById(_id);

  // Check if the user exists
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  // Allow updating only from 'user' to 'vendor'
  if (role && user.role !== "user" && role === "vendor") {
    return res.status(400).json({
      success: false,
      message: "Role can only be updated from 'user' to 'vendor'.",
    });
  }

  // Update user details
  user.name = name || user.name;
  user.email = email || user.email;
  user.address = address || user.address;
  user.phone = phone || user.phone;

  // Update role if specified
  if (role === "vendor" && user.role === "user") {
    user.role = "vendor";
  }

  // Save the updated user
  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: "User updated successfully.",
    user: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      address: updatedUser.address,
      phone: updatedUser.phone,
    },
  });
});

// @desc get all User Profiles
// @router /api/user
// @access Private

export const getAllProfile = expressAsyncHandler(async (req, res) => {
  const users = await userModel.find({}, "-password"); // Exclude passwords from results

  if (users) {
    res.status(200).json(users);
  } else {
    res.status(404);
    throw new Error("No users found!");
  }
});

// @desc Delete User Profiles
// @router /api/user/:id
// @access Private

export const deleteUserProfile = expressAsyncHandler(async (req, res) => {
  try {
    const user = await userModel.findByIdAndDelete(req.params.id); // Use req.params.id
    if (!user) {
      throw new AppError("User Not Found!");
    }
    res.json({ message: "User Removed" });
  } catch (error) {
    throw new AppError("User Not Found!");
  }
});

export default router;
