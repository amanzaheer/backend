import express from 'express';
import { loginUser,registerUser,adminLogin,profile,updateProfile,getAllProfile,deleteUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
const userRouter = express.Router();

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)
userRouter.post('/admin',adminLogin)


userRouter.get("/profile", protect, profile);
userRouter.put("/profile", protect, updateProfile);
userRouter.get("/profiles", protect, getAllProfile);
userRouter.delete("/:id", protect, deleteUserProfile);

export default userRouter;