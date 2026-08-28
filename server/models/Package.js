const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  weight: {
    type: Number,
    required: [true, "Weight is required"],
    min: [0.01, "Weight must be greater than 0"],
  },
  height: {
    type: Number,
    required: [true, "Height is required"],
    min: [0.01, "Height must be greater than 0"],
  },
  width: {
    type: Number,
    required: [true, "Width is required"],
    min: [0.01, "Width must be greater than 0"],
  },
  length: {
    type: Number,
    required: [true, "Length is required"],
    min: [0.01, "Length must be greater than 0"],
  },
  packageType: {
    type: String,
    enum: ["document", "parcel", "fragile", "electronics", "other"],
    required: [true, "Package type is required"],
  },
  fragile: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("PackageDetail", packageSchema, "package_details");
