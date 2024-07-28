import { Binary } from "mongodb";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { required: true, type: String },
  email: { required: true, type: String },
  email_verified_at: { type: Date },
  password: { required: true, type: String },
  webAuthnCredentials: [{
    id: String,
    publicKey: Buffer,
    counter: Number,
    deviceType: String,
    backedUp: Boolean,
    transports: [String]
  }],
  profile_image: { type: String },
  created_at: { type: Date },
  updated_at: { type: Date },
});

userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", { virtuals: true });

export const userModel = mongoose.model("User", userSchema);
