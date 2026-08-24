import Location from "../models/location.model.js";
import redisClient from "../config/redis.js";
const locationRepository = {
  save: async (data) => {
    const location = new Location(data);
    const saved = await location.save();

    // Redis caching — 5 min TTL
    try {
      await redisClient.setEx(
        `location:${data.userId}`,
        300,
        JSON.stringify({
          latitude: data.location.coordinates[1],
          longitude: data.location.coordinates[0],
          battery: data.battery,
          network: data.network,
          isSOS: data.isSOS,
          timestamp: data.createdAt,
        })
      );
    } catch (err) {
      console.warn("⚠️ Failed to set location in Redis cache:", err.message);
    }

    return saved;
  },

  saveBatch: async (locations) => {
    return await Location.insertMany(locations);
  },

  getLatest: async (userId) => {
    try {
      const cached = await redisClient.get(`location:${userId}`);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      console.warn("⚠️ Failed to read location from Redis cache:", err.message);
    }

    const latest = await Location.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (latest) {
      try {
        await redisClient.setEx(
          `location:${userId}`,
          300,
          JSON.stringify({
            latitude: latest.location.coordinates[1],
            longitude: latest.location.coordinates[0],
            battery: latest.battery,
            network: latest.network,
            isSOS: latest.isSOS,
            timestamp: latest.createdAt,
          })
        );
      } catch (err) {
        console.warn("⚠️ Failed to update location Redis cache:", err.message);
      }
    }
    return latest;
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
