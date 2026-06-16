import mongoose from 'mongoose';

const geofenceSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    // Single index removed here because it's handled by the compound index below
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  center: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude] -> Note: Longitude first for GeoJSON!
      required: true
    }
  },
  radius: {
    type: Number, // Radius value representation in meters
    required: true,
    min: 30,      // Lowered to 30m for precise Indian urban building boundaries
    max: 10000    // 10km max ceiling
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// CRITICAL COMPOUND INDEX: Optimized for the child device fetching its tracking boundaries
geofenceSchema.index({ childId: 1, isActive: 1 });
geofenceSchema.index({ parentId: 1, isActive: 1 });

const Geofence = mongoose.model('Geofence', geofenceSchema);

export default Geofence;