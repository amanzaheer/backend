import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { AppError } from "./errorHandler.js";


export const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract the token
      token = req.headers.authorization.split(' ')[1];
      console.log(token)

      // Decode the token and find the user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return next(new AppError("User no longer exists", 401));
      }

      next();
    } catch (error) {
      return next(new AppError("Not Authorized", 401));
    }
  } else {
    // If no token was found
    return next(new AppError("No Token Attached to the Header", 401));
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("User not found", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("You Don't Have Permission", 403));
    }
    next();
  };
};