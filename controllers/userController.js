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
      pass: process.env.MAIL_SENDER_EMAIL_NEW_PASSWORD1,
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
      return res.status(400).json({ success: false, message: "all fields required" });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Enter valid email" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "enter strong password" });
    }
    if (password !== repassword) {
      return res.status(400).json({
        success: false,
        message: "password doesnot match with repassword",
      });
    }
    const user = await userModel.findOne({ email });
    if (user && user.verified) {
      return res.status(409).json({ success: false, message: "User already exists" });
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
    res.status(200).json({ success: true, message: "otp sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOTPandRegister = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found" });
    }
    if (user.otp != otp || Date.now() > user.otpExpiration) {
      return res.status(401).json({ success: false, message: "Invalid or Expired otp" });
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
    res.status(201).json({ success: true, token, message: "regestered successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.status(200).json({ success: true, message: "Login successfull", token });
    } else {
      return res.status(401).json({ success: false, message: "incorrect password" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const requestForgotPasswordOtp = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "No user found" });
    }
    const otp = generateOTP();
    console.log(otp);
    user.otp = otp;
    user.otpExpiration = Date.now() + 3 * 60 * 1000;

    await user.save();

    await sendOTPEmail(name, email, otp);

    res.status(200).json({ success: true, message: "otp send for RESET password" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password, repassword, otp } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "no user found" });
    }
    if (user.otp !== otp || Date.now() > user.otpExpiration) {
      return res.status(401).json({ success: false, message: "Invalid or Expired otp" });
    }
    if (password !== repassword) {
      return res.status(401).json({
        success: false,
        message: "password not matching with repassword",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.otp = null;
    user.password = hashedPassword;
    user.otp = null;
    await user.save();

    res.status(200).json({ success: true, message: "password reset successfull" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const cleanUpExpiredUser = async () => {
  try {
    const now = Date.now();
    const expiredUsers = await userModel.deleteMany({
      verified: false,
      otpExpiration: { $lt: now },
    });
    console.log(`Deleted ${expiredUsers.deletedCount} expired users.`);
  } catch (error) {
    console.error("Error cleaning up expired users:", error.message);
  }
};

const time = 5 * 60 * 1000;
setInterval(cleanUpExpiredUser, time);

const getAllUsers = async (req, res) => {
  try {
    const users = await userModel
      .find({ verified: true })
      .select(["-password", "-verified", "-otp", "-otpExpiration"]);
    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateUserDetails = async (req, res) => {
  try {
    const { userId, name, age, phone, degree, branch, college } = req.body;
  
    const user = await userModel.findById(userId)
    if(!user){
        return res.json({success:false,message:"User Not found"})
    }
    const updatedData = {};
    if (name) updatedData.name = name;
    if (age) updatedData.age = age;
    if (phone) updatedData.phone = phone;
    if (degree) updatedData.degree = degree;
    if (branch) updatedData.branch = branch;
    if (college) updatedData.college = college;

    await userModel.findByIdAndUpdate(userId, updatedData, { new: true });

    res.json({ success: true, message: "details updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};



const getProfileDetails = async (req,res) =>{
    try {
        const {userId} = req.body
        const user = await userModel.findById(userId).select(["-password", "-verified", "-otp", "-otpExpiration"])
        if(!user){
            return res.status(400).json({success:false,message:"No user Found"})
        }
        res.status(200).json({success:true,user,message:"userData fetched successfully"})
    } catch (error) {
        console.log(error);
    res.status(500).json({ success: false, message: error.message });
    }
}





const deleteUser = async (req,res) =>{
    try {
        const {userId} = req.body

        const deletedUser = await userModel.findByIdAndDelete(userId)
        if(!deletedUser){
            return res.status(400).json({success:false,message:"No user Found"})
        }
        res.json({success:true,message:"user deleted successfully"})
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
export {
  requestOTPtoRegister,
  verifyOTPandRegister,
  loginUser,
  requestForgotPasswordOtp,
  resetPassword,
  getAllUsers,
  updateUserDetails,
  getProfileDetails,
  deleteUser
};
