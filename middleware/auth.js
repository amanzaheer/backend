import jwt from "jsonwebtoken";

const authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check if the Authorization header exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not Authorized. Please login again.",
      });
    }

    // Extract the token from the Authorization header
    const token = authHeader.split(" ")[1];

    // Verify the token
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user information to the request object
    req.user = {
      id: tokenDecode.id,
      role: tokenDecode.role,
      vendorId: tokenDecode.vendorId, // Ensure vendorId is part of the token payload
    };
    console.log("DATAA", tokenDecode);

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }
};

export default authUser;
