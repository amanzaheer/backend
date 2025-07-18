import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => {
            console.log("DB Connected");
        });

        mongoose.connection.on('error', (err) => {
            console.error("MongoDB connection error:", err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log("MongoDB disconnected");
        });

        await mongoose.connect(`${process.env.MONGODB_URI}/e-commerce`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
};

export default connectDB;