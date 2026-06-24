// Free routing via OpenRouteService — no billing/card required.
// Get a free key at: https://openrouteservice.org/dev/#/signup
// Free tier: 2,000 requests/day, 40 requests/minute.

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjY0NDVjNzA5Mzg2ZDQ1OGJhNTRkMjUyMjQ2YTJjNzZjIiwiaCI6Im11cm11cjY0In0='; // pull from env/config, not hardcoded

interface RouteResult {
    coordinates: { latitude: number; longitude: number }[];
    distanceText: string;
    durationText: string;
}

// Mirrors the old Google-based signature so ParentHomeScreen.tsx needs no changes.
export async function getWalkingOrDrivingRoute(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    mode: 'driving' | 'walking' = 'driving'
): Promise<RouteResult | null> {
    try {
        // ORS profile names differ from Google's mode names
        const profile = mode === 'walking' ? 'foot-walking' : 'driving-car';

        const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: ORS_API_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                coordinates: [
                    [origin.longitude, origin.latitude],
                    [destination.longitude, destination.latitude],
                ],
            }),
        });

        const data = await res.json();

        if (!res.ok || !data.features?.length) {
            console.log('OpenRouteService error:', data.error?.message ?? data);
            return null;
        }

        const feature = data.features[0];
        const summary = feature.properties.summary; // { distance: meters, duration: seconds }

        // GeoJSON coordinates are [lng, lat] — convert to react-native-maps' {latitude, longitude}
        const coordinates = feature.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
        );

        const distanceKm = summary.distance / 1000;
        const distanceText =
            distanceKm < 1 ? `${Math.round(summary.distance)} m` : `${distanceKm.toFixed(1)} km`;

        const durationMin = summary.duration / 60;
        const durationText = durationMin < 1 ? '<1 min' : `${Math.round(durationMin)} min`;

        return { coordinates, distanceText, durationText };
    } catch (error) {
        console.log('Failed to fetch OpenRouteService directions:', error);
        return null;
    }
}