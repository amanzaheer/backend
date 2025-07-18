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

// Middleware
app.use(cors({
  origin: ['https://amana-organic-ecomerce-store.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to databases with error handling
const initializeApp = async () => {
  try {
    await connectDB();
    console.log("Database connected successfully");
    
    // Only connect to Cloudinary if environment variables are set
    if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY) {
      await connectCloudinary();
      console.log("Cloudinary connected successfully");
    } else {
      console.log("Cloudinary not configured - skipping");
    }
  } catch (error) {
    console.error("Failed to connect to databases:", error);
    // Don't exit the process, let the app continue
  }
};

// Initialize connections
initializeApp();

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
  res.send("Amana Organics API - Natural Products Store");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => console.log("Amana Organics Server started on PORT : " + port));
}

// For Vercel deployment
export default app;
