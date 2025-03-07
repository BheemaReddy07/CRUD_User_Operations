import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: String },
  phone: { type: String },
  degree: { type: String },
  branch: { type: String },
  college: { type: String },
  otp: { type: String },
  otpExpiration: { type: Date },
  verified: { type: Boolean, default: false },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
