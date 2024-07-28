import mongoose from "mongoose";
const { Schema } = mongoose;

const printJobSchema = new mongoose.Schema({
  status: { 
    type: { required: true, type: String },
    printer: { type: Schema.Types.ObjectId, ref: 'Printer', required: false },
   },
  created_at: { required: true, type: Date },
  updated_at: { required: true, type: Date },
  started_at: { required: true, type: Date },
  gcode_file: { type: Schema.Types.ObjectId, ref: 'GCodeFile', required: false }
});

printJobSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

printJobSchema.set("toJSON", { virtuals: true });

export const printJobModel = mongoose.model("PrintJob", printJobSchema);
