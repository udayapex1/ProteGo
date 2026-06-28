// utils/polyline.ts

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface RouteData {
  coordinates: Coordinate[];
  startPin: Coordinate | null;
  endPin: Coordinate | null;
  bounds: {
    southWest: Coordinate;
    northEast: Coordinate;
  } | null;
}

/**
 * Decodes an encoded polyline string into coordinates, pin locations, and bounding boxes.
 * @param encoded The encoded polyline string.
 * @param precision The precision factor (5 for Google, 6 for Mapbox/OSRM). Defaults to 5.
 */
export function processRoutePolyline(encoded: string, precision: 5 | 6 = 5): RouteData {
  const points: Coordinate[] = [];
  const factor = precision === 6 ? 1e6 : 1e5;
  let index = 0,
    lat = 0,
    lng = 0;

  // Track bounds to easily center/zoom the map view later
  let minLat = Infinity,
    maxLat = -Infinity;
  let minLng = Infinity,
    maxLng = -Infinity;

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;

    // Decode Latitude
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    // Decode Longitude
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    const currentLat = lat / factor;
    const currentLng = lng / factor;

    points.push({ latitude: currentLat, longitude: currentLng });

    // Update bounding box values
    if (currentLat < minLat) minLat = currentLat;
    if (currentLat > maxLat) maxLat = currentLat; // was: maxLat = maxLat (bug — never updated)
    if (currentLng < minLng) minLng = currentLng;
    if (currentLng > maxLng) maxLng = currentLng;
  }

  const hasPoints = points.length > 0;

  return {
    coordinates: points,
    // Isolate pins specifically for map markers
    startPin: hasPoints ? points[0] : null,
    endPin: hasPoints ? points[points.length - 1] : null,
    bounds: hasPoints
      ? {
          southWest: { latitude: minLat, longitude: minLng },
          northEast: { latitude: maxLat, longitude: maxLng },
        }
      : null,
  };
}