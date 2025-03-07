import express from 'express'
import { requestOTPtoRegister } from '../controllers/userController.js';


const userRouter = express();


userRouter.post("/request-otp",requestOTPtoRegister)


export default userRouter