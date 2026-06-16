import Location from '../models/location.model.js';
const locationRepository = {
  save: async (data) => {
    const location = new Location(data);
    return await location.save();
  },

  saveBatch: async (locations) => {
    return await Location.insertMany(locations);
  },

  getLatest: async (userId) => {
    return await Location.findOne({ userId }).sort({ createdAt: -1 }).lean(); // Bypasses Mongoose heavy hydration for a 5x faster read
  },

  // Limits query parameters cleanly to your maximum 7-day capability limit
  getHistory: async (userId, hours = 24) => {
    const cappedHours = Math.min(hours, 168); // Hard cap at 168 hours (7 days)
    const since = new Date(Date.now() - cappedHours * 60 * 60 * 1000);

    return await Location.find({
      userId,
      createdAt: { $gte: since },
    })
      .select("location battery network isSOS createdAt") // Projection: Excludes __v and saves bandwidth
      .sort({ createdAt: 1 }) // Chronological order for map path drawing
      .lean();
  },

  getSOSLocations: async (userId) => {
    return await Location.find({ userId, isSOS: true })
      .select("location battery createdAt")
      .sort({ createdAt: -1 })
      .lean();
  },
};

export default locationRepository;
