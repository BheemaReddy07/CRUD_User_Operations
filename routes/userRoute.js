import express from 'express'
import { deleteUser, getAllUsers, getProfileDetails, loginUser, requestForgotPasswordOtp, requestOTPtoRegister, resetPassword, updateUserDetails, verifyOTPandRegister } from '../controllers/userController.js';
import authUser from '../middleware/authUser.js';


const userRouter = express();


userRouter.post("/request-otp",requestOTPtoRegister)
userRouter.post("/verify-register",verifyOTPandRegister)
userRouter.post("/login",loginUser)
userRouter.post("/forgot-otp",requestForgotPasswordOtp)
userRouter.post("/reset",resetPassword)



userRouter.get("/get-all-users",getAllUsers)
userRouter.get("/profile",authUser,getProfileDetails)


userRouter.put("/update-details",authUser,updateUserDetails)


userRouter.delete("/delete",authUser,deleteUser)



export default userRouter