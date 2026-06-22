import Geofence from "../models/geofence.model.js";
const geofenceRepository = {

  create: async (data) => {
    const geofence = new Geofence(data);
    return await geofence.save();
  },

  // CRITICAL: If you use this frequently, consider adding this index to your model:
  // geofenceSchema.index({ parentId: 1, isActive: 1 });
  findByParentId: async (parentId) => {
    return await Geofence.find({ parentId, isActive: true }).lean();
  },

  // Optimized for your background tracking sync endpoints
  findByChildId: async (childId) => {
    return await Geofence.find({ childId, isActive: true })
      .select('name center radius') // Drop unnecessary tokens to shrink packet weight
      .lean();
  },

  findById: async (id) => {
    return await Geofence.findById(id).lean();
  },

  deactivate: async (id, parentId) => {
    return await Geofence.findOneAndUpdate(
      { _id: id, parentId }, // Security Guard: Ensures only the creator can alter state
      { isActive: false },
      { returnDocument: 'after' }
    );
  },
  update: async (id, parentId, data) => {
  return await Geofence.findOneAndUpdate(
    { _id: id, parentId },
    { 
      name: data.name,
      center: { type: 'Point', coordinates: [data.longitude, data.latitude] },
      radius: data.radius,
    },
    { new: true }
  );
},

};

export default geofenceRepository;
