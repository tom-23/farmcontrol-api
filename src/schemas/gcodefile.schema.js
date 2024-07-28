import mongoose from "mongoose";
const { Schema } = mongoose;

const gcodeFileSchema = new mongoose.Schema({
  name: { required: true, type: String },
  gcodeFileName: { required: true, type: String },
  size: { type: Number, required: false },
  lines: { type: Number, required: false },
  fillament: { type: Schema.Types.ObjectId, ref: 'Fillament', required: true },
  image: { type: Buffer, required: false },
  printTimeMins: { type: Number, required: false },
  created_at: { type: Date },
  updated_at: { type: Date },
});

gcodeFileSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

gcodeFileSchema.set("toJSON", { virtuals: true });

export const gcodeFileModel = mongoose.model("GCodeFile", gcodeFileSchema);
