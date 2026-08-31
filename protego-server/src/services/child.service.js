import userRepository from '../repositories/user.repository.js';
import locationRepository from '../repositories/location.repository.js';
import geofenceRepository from '../repositories/geofence.repository.js';

const childService = {
  getDashboard: async (parentId) => {
    const parent = await userRepository.findById(parentId);
    if (!parent) throw new Error('Parent account not found');
    if (parent.role !== 'parent') throw new Error('Only parent accounts can access the child dashboard');
    if (!parent.pairedWith) throw new Error('No child account is paired');

    const child = await userRepository.findById(parent.pairedWith);
    if (!child || child.role !== 'child') throw new Error('Paired child account not found');

    const childId = child._id;
    const [latestLocation, locationHistory, sosLogs, geofences] = await Promise.all([
      locationRepository.getLatest(childId),
      locationRepository.getHistory(childId, 168),
      locationRepository.getSOSLocations(childId),
      geofenceRepository.findByChildId(childId),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      child: {
        id: child._id,
        name: child.name,
        email: child.email,
        role: child.role,
        pairedWith: child.pairedWith,
        isTwoFactorEnabled: child.isTwoFactorEnabled,
        createdAt: child.createdAt,
      },
      pairing: {
        parentId: parent._id,
        childId: child._id,
        isPaired: parent.pairedWith?.toString() === child._id.toString(),
      },
      latestLocation,
      locationHistory,
      sosLogs,
      geofences,
      summary: {
        historyHours: 168,
        locationCount: locationHistory.length,
        sosCount: sosLogs.length,
        activeGeofenceCount: geofences.length,
      },
    };
  },
};

export default childService;
