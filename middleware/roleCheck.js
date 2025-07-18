import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler.js";

const roleCheck = (roles) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new AppError("No token provided", 401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Token decoded:", decoded);

      if (!roles.includes(decoded.role)) {
        throw new AppError("Not authorized", 403);
      }

      req.user = {
        id: decoded.id,
        role: decoded.role,
        vendorId: decoded.vendorId
      };

      console.log("Role Check Middleware: req.user:", req.user);
      next();
    } catch (error) {
      next(new AppError(error.message, 401));
    }
  };
};

export default roleCheck;
