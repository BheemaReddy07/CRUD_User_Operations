import nodemailer from "nodemailer";
import validator from "validator";
import userModel from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (name, email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_SENDER_MAIL_NEW,
      pass: "uftj uitu tnuk nevi",
    },
  });
  const mailOptions = {
    from: process.env.MAIL_SENDER_MAIL_NEW,
    to: email,
    subject: "your otp code",
    text: `Hi ${
      name ? name : ""
    }!! Greetings from Prescripto, here is your OTP code: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending email:", error.message);
    throw new Error("Error sending OTP email");
  }
};

const requestOTPtoRegister = async (req, res) => {
  try {
    const { name, email, password, repassword } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: false, message: "all fields required" });
    }
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter valid email" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "enter strong password" });
    }
    if (password !== repassword) {
      return res.json({
        success: false,
        message: "password doesnot match with repassword",
      });
    }
    const user = await userModel.findOne({ email });
    if (user && user.verified) {
      return res.json({ success: false, message: "User already exists" });
    }

    const otp = generateOTP();
    console.log(otp);
    const otpExpiration = Date.now() + 3 * 60 * 1000;

    if (user && !user.verified) {
      user.otp = otp;
      user.otpExpiration = otpExpiration;
      await user.save();
    } else {
      const userData = new userModel({
        name,
        email,
        password,
        otp,
        otpExpiration,
        verified: false,
      });
      await userData.save();
    }

    await sendOTPEmail(name, email, otp);
    res.json({ success: true, message: "otp sent successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyOTPandRegister = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "No user found" });
    }
    if (user.otp != otp || Date.now() > user.otpExpiration) {
      return res.json({ success: false, message: "Invalid or Expired otp" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otp: null,
      otpExpiration: null,
      verified: true,
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token, message: "regestered successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


const loginUser = async (req,res) =>{
    try {
        const {email,password} = req.body
        const user = await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:"No user found"})
        }

        const isMatch =  await bcrypt.compare(password,user.password)

        if(isMatch){
            const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
            res.json({success:true,message:"Login successfull",token})
        }
        else{
            return res.json({success:false,message:"incorrect password"})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const requestForgotPasswordOtp = async (req, res) => {
  try {
    const {name,email} = req.body
    const user = await userModel.findOne({email})
    if(!user){
        return res.json({success:false,message:"No user found"})
    }
    const otp = generateOTP();
    console.log(otp)
    user.otp = otp;
    user.otpExpiration = Date.now()+3*60*1000;

    await user.save();

    await sendOTPEmail(name,email,otp);

    res.json({success:true,message:"otp send for RESET password"})

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const resetPassword = async (req,res) =>{
    try {
        const {email,password,repassword,otp} = req.body
        const user  = await userModel.findOne({email})
        if(!user){
            return res.json({success:false,message:"no user found"})
        }
        if(user.otp!==otp || Date.now()>user.otpExpiration){
            return res.json({success:false,message:"Invalid or Expired otp"})
        }
        if(password!==repassword){
            return res.json({success:false,message:"password not matching with repassword"})
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        user.otp =null;
        user.password=hashedPassword;
        user.otp = null;
        await user.save()

        res.json({success:true,message:"password reset successfull"})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { requestOTPtoRegister, verifyOTPandRegister,loginUser,requestForgotPasswordOtp ,resetPassword};
