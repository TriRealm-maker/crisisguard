import { useEffect, useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { Coordinates, NearbyPlace } from '../types';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  Bars3Icon,
  MapPinIcon,
  PhoneIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';

interface Props {
  coords: Coordinates | null;
}

type ErrorType = 'timeout' | 'no_results' | 'offline' | 'location' | null;

const MapUpdater = ({ coords }: { coords: Coordinates }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo([coords.lat, coords.lng], 13);
  }, [coords, map]);
  return null;
};

const createUserMarker = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} class="absolute w-8 h-8 bg-primary/30 rounded-full" />
        <div class="w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-slate-800 shadow-lg" />
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createServiceMarker = (type: string) => {
  const colors: Record<string, string> = {
    hospital: '#22C55E',
    police: '#6366F1',
    fire: '#EF4444',
    pharmacy: '#A855F7',
    shelter: '#F59E0B',
    other: '#6B7280',
  };
  const color = colors[type] || colors.other;
  
  return L.divIcon({
    className: 'custom-service-marker',
    html: `
      <div class="relative flex items-center justify-center" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="${color}"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
};

type FilterType = 'all' | 'hospital' | 'police' | 'fire';

const filters: { type: FilterType; label: string }[] = [
  { type: 'all', label: 'map.all' },
  { type: 'hospital', label: 'map.hospitals' },
  { type: 'police', label: 'map.police' },
  { type: 'fire', label: 'map.fire' },
];

interface ErrorStateProps {
  errorType: ErrorType;
  onRetry: () => void;
}

const ErrorState = ({ errorType, onRetry }: ErrorStateProps) => {
  const getMessage = () => {
    switch (errorType) {
      case 'timeout':
        return {
          icon: ExclamationTriangleIcon,
          title: 'Emergency services temporarily unavailable',
          message: 'Overpass servers busy. Try again in a moment.',
          tip: 'In an emergency, call 112 directly',
        };
      case 'no_results':
        return {
          icon: MapPinIcon,
          title: 'No services found within 5km',
          message: 'Try expanding the search radius.',
          tip: 'In an emergency, call 112 directly',
        };
      case 'offline':
        return {
          icon: WifiIcon,
          title: 'No internet connection',
          message: 'Check your network and retry.',
          tip: 'In an emergency, call 112 directly',
        };
      case 'location':
        return {
          icon: MapPinIcon,
          title: 'Location unavailable',
          message: 'Enable location access to find nearby services.',
          tip: 'In an emergency, call 112 directly',
        };
      default:
        return {
          icon: ExclamationTriangleIcon,
          title: 'Failed to load nearby services',
          message: 'An unexpected error occurred.',
          tip: 'In an emergency, call 112 directly',
        };
    }
  };

  const { icon: Icon, title, message, tip } = getMessage();

  return (
    <div className="text-center py-6 px-2">
      <Icon className="h-12 w-12 mx-auto mb-3 text-warning" />
      <p className="text-text-primary-light dark:text-text-primary-dark font-semibold text-sm mb-1">
        {title}
      </p>
      <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mb-3">
        {message}
      </p>
      <p className="text-danger text-xs font-medium mb-4">
        {tip}
      </p>
      <button
        onClick={onRetry}
        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <ArrowPathIcon className="w-4 h-4 mr-2" />
        Retry
      </button>
    </div>
  );
};

export const MapPage = ({ coords }: Props) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorType, setErrorType] = useState<ErrorType>(null);
  const [showPanel, setShowPanel] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<L.Map | null>(null);
  const hasRetried = useRef(false);

  const isDark = theme === 'dark';
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  const fetchPlaces = () => {
    if (!coords) return;
    
    setLoading(true);
    setErrorType(null);
    
    api.places.getNearby(coords.lat, coords.lng)
      .then((data) => {
        if (data.length === 0 && !hasRetried.current) {
          hasRetried.current = true;
          setTimeout(() => fetchPlaces(), 2000);
          return;
        }
        setPlaces(data);
        setErrorType(null);
      })
      .catch((err: Error) => {
        console.error('Failed to fetch places:', err);
        
        if (err.message === 'OVERPASS_ALL_MIRRORS_FAILED') {
          setErrorType('timeout');
        } else if (err.message.includes('Failed to fetch') || err.message.includes('Network')) {
          setErrorType('offline');
        } else {
          setErrorType('timeout');
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    hasRetried.current = false;
    fetchPlaces();
  }, [coords]);

  const filteredPlaces = useMemo(() => {
    let result = places;
    if (activeFilter !== 'all') {
      result = result.filter(p => p.type === activeFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(query));
    }
    return result;
  }, [places, activeFilter, searchQuery]);

  const flyToPlace = (place: NearbyPlace) => {
    if (mapRef.current && place.lat && place.lng) {
      mapRef.current.flyTo([place.lat, place.lng], 16, { duration: 1 });
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'hospital': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'police': return 'bg-primary/10 text-primary dark:text-primary-light border-primary/20';
      case 'fire': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'pharmacy': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'shelter': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  if (!coords) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark">
        <p className="text-text-secondary-light dark:text-text-secondary-dark">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] rounded-2xl overflow-hidden border border-border-light dark:border-border-dark">
      <MapContainer
        center={[coords.lat, coords.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer url={tileUrl} attribution='&copy; CartoDB' />
        <Marker position={[coords.lat, coords.lng]} icon={createUserMarker()}>
          <Popup>
            <div className="font-semibold text-center p-1">You are here</div>
          </Popup>
        </Marker>
        {filteredPlaces.map((place) => (
          place.lat && place.lng ? (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={createServiceMarker(place.type)}
            >
              <Popup>
                <div className="min-w-[180px] p-1">
                  <h3 className="font-bold text-slate-900">{place.title}</h3>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium border ${getBadgeStyle(place.type)}`}>
                    {place.type}
                  </span>
                  <p className="text-sm text-slate-600 mt-1">{place.address}</p>
                  {place.phoneNumber && (
                    <a href={`tel:${place.phoneNumber}`} className="text-primary text-sm flex items-center mt-1">
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

      <AnimatePresence mode="wait">
        {showPanel && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="absolute top-4 left-4 bottom-4 w-80 z-[400] flex flex-col"
          >
            <div className="flex-1 glass rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border-light dark:border-border-dark">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark">
                    {t('map.title')}
                  </h2>
                  <button 
                    onClick={() => setShowPanel(false)} 
                    className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary-light dark:text-text-secondary-dark" />
                  <input
                    type="text"
                    placeholder={t('map.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="p-3 border-b border-border-light dark:border-border-dark">
                <div className="flex gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.type}
                      onClick={() => setActiveFilter(filter.type)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                        activeFilter === filter.type
                          ? 'bg-primary text-white'
                          : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-secondary-light dark:text-text-secondary-dark hover:border-primary/50'
                      )}
                    >
                      {t(filter.label)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex space-x-3 p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark"
                      >
                        <div className="h-10 w-10 bg-border-light dark:bg-border-dark rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-border-light dark:bg-border-dark rounded w-3/4 animate-pulse" />
                          <div className="h-3 bg-border-light dark:bg-border-dark rounded w-1/2 animate-pulse" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : errorType ? (
                  <ErrorState errorType={errorType} onRetry={fetchPlaces} />
                ) : filteredPlaces.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPinIcon className="h-10 w-10 mx-auto mb-2 text-text-secondary-light dark:text-text-secondary-dark opacity-30" />
                    <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">No services found within 5km. Try expanding the search radius.</p>
                  </div>
                ) : (
                  filteredPlaces.map((place, index) => (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => flyToPlace(place)}
                      className="p-3 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark hover:border-primary/30 cursor-pointer transition-all hover:shadow-md"
                    >
                      <h3 className="font-semibold text-sm text-text-primary-light dark:text-text-primary-dark mb-1">
                        {place.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${getBadgeStyle(place.type)}`}>
                          {place.type}
                        </span>
                        {place.distance !== undefined && (
                          <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                            {place.distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showPanel && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setShowPanel(true)}
          className="absolute bottom-4 left-4 z-[400] glass px-4 py-3 rounded-full flex items-center space-x-2 shadow-lg"
        >
          <Bars3Icon className="h-5 w-5" />
          <span className="font-medium text-sm">{t('map.title')} ({filteredPlaces.length})</span>
        </motion.button>
      )}

      <div className="absolute bottom-4 right-4 z-[400] glass px-3 py-2 rounded-xl text-xs">
        <div className="font-medium mb-2 text-text-secondary-light dark:text-text-secondary-dark">{t('map.legend')}</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">You</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Police</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-danger rounded-full" />
            <span className="text-text-secondary-light dark:text-text-secondary-dark">Fire</span>
          </div>
        </div>
      </div>
    </div>
  );
};
