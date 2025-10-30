const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppointmentSchema = new Schema(
  {
    property: { type: Schema.Types.ObjectId, ref: "Property", required: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    preferredDate: { type: Date, required: true },
    message: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
