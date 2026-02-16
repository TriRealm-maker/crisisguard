import axios from 'axios';

export interface NearbyPlace {
  id: string;
  title: string;
  type: 'hospital' | 'police' | 'fire' | 'pharmacy' | 'shelter' | 'other';
  lat: number;
  lng: number;
  address: string;
  phoneNumber?: string;
  operatingHours?: string;
  distance?: number;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getNearbyPlaces = async (lat: number, lng: number, radius: number = 10000): Promise<NearbyPlace[]> => {
  try {
    const overpassQuery = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lng});
        node["amenity"="clinic"](around:${radius},${lat},${lng});
        node["amenity"="doctors"](around:${radius},${lat},${lng});
        node["amenity"="police"](around:${radius},${lat},${lng});
        node["amenity"="fire_station"](around:${radius},${lat},${lng});
        node["shop"="pharmacy"](around:${radius},${lat},${lng});
        node["emergency"="shelter"](around:${radius},${lat},${lng});
        way["amenity"="hospital"](around:${radius},${lat},${lng});
        way["amenity"="police"](around:${radius},${lat},${lng});
        way["amenity"="fire_station"](around:${radius},${lat},${lng});
      );
      out center;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(overpassQuery)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const places: NearbyPlace[] = [];
    const elements = response.data.elements;

    for (const element of elements) {
      const placeLat = element.lat || element.center?.lat;
      const placeLng = element.lng || element.center?.lng;

      if (!placeLat || !placeLng) continue;

      const tags = element.tags || {};
      const amenity = tags.amenity || tags.shop || tags.emergency || 'other';

      let type: NearbyPlace['type'] = 'other';
      if (['hospital', 'clinic', 'doctors'].includes(amenity)) type = 'hospital';
      else if (amenity === 'police') type = 'police';
      else if (amenity === 'fire_station') type = 'fire';
      else if (amenity === 'pharmacy') type = 'pharmacy';
      else if (amenity === 'shelter') type = 'shelter';

      const name = tags.name || tags.operator || `${type.charAt(0).toUpperCase() + type.slice(1)}`;

      places.push({
        id: `place-${element.id}`,
        title: name,
        type,
        lat: placeLat,
        lng: placeLng,
        address: tags['addr:street'] ? 
          `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : 
          tags.city || tags.state || 'Address not available',
        phoneNumber: tags.phone || tags['contact:phone'],
        operatingHours: tags.opening_hours || '24/7',
        distance: calculateDistance(lat, lng, placeLat, placeLng),
      });
    }

    return places
      .filter(p => p.distance !== undefined && p.distance < 50) // Within 50km
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, 20);
  } catch (error) {
    console.error('Overpass API error:', error);
    return [];
  }
};
