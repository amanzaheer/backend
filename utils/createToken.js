import jwt from "jsonwebtoken";

const createToken = (id, role, vendorId) => {
  return jwt.sign(
    { id, role, vendorId },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

export default createToken; 