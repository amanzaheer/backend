import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// App Config
const app = express();
const port = process.env.PORT || 4000;

// Connect to databases
connectDB();
connectCloudinary();

// Middleware
app.use(cors({
  origin: ['https://amana-organic-ecomerce-store.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
  res.send("Amana Organics API - Natural Products Store");
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log("Amana Organics Server started on PORT : " + port));
}

// For Vercel deployment
export default app;
