const mongoose = require("mongoose");
const { Schema } = mongoose;

const PropertySchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    areaSqFt: { type: Number, default: 500 },
    images: [{ type: String }],
    owner: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    ownerUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    available: { type: Boolean, default: true },
    listedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Property", PropertySchema);
