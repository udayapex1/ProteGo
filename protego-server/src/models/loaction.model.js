import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  battery: {
    type: Number,
    min: 0,
    max: 100,
    required: true,
  },
  network: {
    type: String,
    enum: ["online", "offline"],
    required: true,
  },
  isSOS: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800, // 7 days TTL
  },
});

locationSchema.index({ location: "2dsphere" });
locationSchema.index({ userId: 1, createdAt: -1 });

const Location = mongoose.model("Location", locationSchema);

export default Location;
