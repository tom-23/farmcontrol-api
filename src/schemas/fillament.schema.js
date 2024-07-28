import mongoose from "mongoose";

const fillamentSchema = new mongoose.Schema({
  name: { required: true, type: String },
  barcode: { required: false, type: String },
  url: { required: false, type: String },
  image: { required: false, type: Buffer },
  color: { required: true, type: String },
  brand: { required: true, type: String },
  type: { required: true, type: String },
  price: { required: true, type: Number },
  diameter: { required: true, type: Number },
  created_at: { required: true, type: Date },
  updated_at: { required: true, type: Date },
});

fillamentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

fillamentSchema.set("toJSON", { virtuals: true });

export const fillamentModel = mongoose.model("Fillament", fillamentSchema);
