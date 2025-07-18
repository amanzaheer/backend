import express from "express";
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  getAProductBySlug,
  updateProduct,
  getCategories,
  getBestsellers,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";

const productRouter = express.Router();

// Public routes
productRouter.get("/list", listProducts);
productRouter.get("/categories", getCategories);
productRouter.get("/bestsellers", getBestsellers);
productRouter.get("/:slug", getAProductBySlug);
productRouter.post("/single", singleProduct);

// Admin only routes
productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct
);

productRouter.post("/remove", adminAuth, removeProduct);

productRouter.put(
  "/update/:productId",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateProduct
);

export default productRouter;
