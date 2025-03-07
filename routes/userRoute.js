import express from 'express'
import { loginUser, requestForgotPasswordOtp, requestOTPtoRegister, resetPassword, verifyOTPandRegister } from '../controllers/userController.js';


const userRouter = express();


userRouter.post("/request-otp",requestOTPtoRegister)
userRouter.post("/verify-register",verifyOTPandRegister)
userRouter.post("/login",loginUser)
userRouter.post("/forgot-otp",requestForgotPasswordOtp)
userRouter.post("/reset",resetPassword)

export default userRouter