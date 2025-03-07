import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: String, default: "set-age" },
  phone: { type: String, default: "set-phone" },
  degree: { type: String, default: "set-degree" },
  branch: { type: String, default: "set-branch" },
  college: { type: String, default: "set-college" },
  otp: { type: String },
  otpExpiration: { type: Date },
  verified: { type: Boolean, default: false },
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
