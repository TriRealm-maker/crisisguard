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

interface CacheEntry {
  data: NearbyPlace[];
  timestamp: number;
}

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

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

const getCacheKey = (lat: number, lng: number): string => {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
};

const getFromCache = (lat: number, lng: number): NearbyPlace[] | null => {
  const key = getCacheKey(lat, lng);
  const entry = cache.get(key);
  
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    console.log('Returning cached results for', key);
    return entry.data;
  }
  
  cache.delete(key);
  return null;
};

const saveToCache = (lat: number, lng: number, data: NearbyPlace[]): void => {
  const key = getCacheKey(lat, lng);
  cache.set(key, { data, timestamp: Date.now() });
};

const fetchFromOverpass = async (lat: number, lng: number, radius: number = 5000): Promise<NearbyPlace[]> => {
  const overpassQuery = `
    [out:json][timeout:20];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="police"](around:${radius},${lat},${lng});
      node["amenity"="fire_station"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  let lastError: Error | null = null;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      console.log(`Trying Overpass mirror: ${mirror}`);
      
      const response = await axios.post(
        mirror,
        `data=${encodeURIComponent(overpassQuery)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000,
        }
      );

      console.log(`Success from ${mirror}`);
      
      const places: NearbyPlace[] = [];
      const elements = response.data.elements || [];

      for (const element of elements) {
        const placeLat = element.lat || element.center?.lat;
        const placeLng = element.lng || element.center?.lng;

        if (!placeLat || !placeLng) continue;

        const tags = element.tags || {};
        const amenity = tags.amenity || 'other';

        let type: NearbyPlace['type'] = 'other';
        if (amenity === 'hospital') type = 'hospital';
        else if (amenity === 'police') type = 'police';
        else if (amenity === 'fire_station') type = 'fire';

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
        .filter(p => p.distance !== undefined && p.distance < 50)
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20);

    } catch (error) {
      lastError = error as Error;
      
      if (axios.isAxiosError(error)) {
        console.log(`Mirror ${mirror} failed:`, error.code, error.message);
        
        if (error.response) {
          console.log(`Status: ${error.response.status}`);
        }
        
        if (error.response?.status === 429 || error.code === 'ECONNABORTED' || error.response?.status === 504) {
          console.log(`Moving to next mirror...`);
          continue;
        }
      }
      
      console.log(`Non-retryable error from ${mirror}, trying next...`);
      continue;
    }
  }

  console.error('All Overpass mirrors failed:', lastError?.message);
  throw new Error('OVERPASS_ALL_MIRRORS_FAILED');
};

export const getNearbyPlaces = async (lat: number, lng: number): Promise<NearbyPlace[]> => {
  const cached = getFromCache(lat, lng);
  if (cached) {
    return cached;
  }

  const places = await fetchFromOverpass(lat, lng);
  
  if (places.length > 0) {
    saveToCache(lat, lng, places);
  }
  
  return places;
};
