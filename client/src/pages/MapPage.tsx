import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { Coordinates, NearbyPlace } from '../types';
import { PhoneIcon, MapPinIcon, XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Props {
  coords: Coordinates | null;
}

const MapUpdater = ({ coords }: { coords: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 13);
  }, [coords, map]);
  return null;
};

export const MapPage = ({ coords }: Props) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (coords) {
      setLoading(true);
      api.places.getNearby(coords.lat, coords.lng)
        .then((data) => setPlaces(data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [coords]);

  const flyToPlace = (place: NearbyPlace) => {
    if (mapRef.current && place.lat && place.lng) {
      mapRef.current.flyTo([place.lat, place.lng], 16);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      case 'police': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'fire': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300';
      case 'pharmacy': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300';
      case 'shelter': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  if (!coords) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
        <p className="text-slate-500">Acquiring location...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-140px)] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />
        <Marker position={[coords.lat, coords.lng]}>
          <Popup>
            <div className="font-bold text-center p-1">You are here</div>
          </Popup>
        </Marker>
        {places.map((place) => (
          place.lat && place.lng ? (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
            >
              <Popup>
                <div className="min-w-[180px] p-1">
                  <h3 className="font-bold text-slate-900">{place.title}</h3>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${getBadgeStyle(place.type)}`}>
                    {place.type}
                  </span>
                  <p className="text-sm text-slate-600 mt-1">{place.address}</p>
                  {place.phoneNumber && (
                    <a href={`tel:${place.phoneNumber}`} className="text-blue-600 text-sm flex items-center mt-1">
                      <PhoneIcon className="h-4 w-4 mr-1" /> {place.phoneNumber}
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ) : null
        ))}
        <MapUpdater coords={coords} />
      </MapContainer>

      <div className={`absolute top-4 left-4 bottom-4 w-80 z-[400] flex flex-col transition-transform duration-300 ${
        showPanel ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Emergency Services</h2>
            <button onClick={() => setShowPanel(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="animate-pulse flex space-x-3">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : places.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <MapPinIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p>No services found nearby</p>
              </div>
            ) : (
              places.map((place) => (
                <div
                  key={place.id}
                  onClick={() => flyToPlace(place)}
                  className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 cursor-pointer transition-all"
                >
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm">{place.title}</h3>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getBadgeStyle(place.type)}`}>
                      {place.type}
                    </span>
                    {place.distance && (
                      <span className="text-xs text-slate-500">{place.distance.toFixed(1)} km</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {!showPanel && (
        <button
          onClick={() => setShowPanel(true)}
          className="absolute bottom-4 left-4 z-[400] bg-white dark:bg-slate-800 px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 border border-slate-200 dark:border-slate-700"
        >
          <Bars3Icon className="h-5 w-5" />
          <span className="font-medium">Services ({places.length})</span>
        </button>
      )}
    </div>
  );
};
