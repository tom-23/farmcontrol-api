import mongoose from "mongoose";

const printerSchema = new mongoose.Schema({
  friendlyName: { required: true, type: String },
  online: { required: true, type: Boolean },
  status: { 
    type: { required: true, type: String },
    percent: { required: false, type: Number },
   },
  remoteAddress: { required: true, type: String },
  hostId: { required: true, type: String },
  connectedAt: { required: true, type: Date },
  loadedFillament: { required: true, type: Object }
});

printerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

printerSchema.set("toJSON", { virtuals: true });

export const printerModel = mongoose.model("Printer", printerSchema);
