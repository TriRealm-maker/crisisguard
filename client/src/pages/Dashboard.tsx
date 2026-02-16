import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Coordinates, WeatherData } from '../types';
import { CloudIcon, BoltIcon, ExclamationTriangleIcon, MapPinIcon, HeartIcon } from '@heroicons/react/24/solid';

interface Props {
  coords: Coordinates | null;
}

export const Dashboard = ({ coords }: Props) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coords) {
      setLoading(true);
      api.weather.get(coords.lat, coords.lng)
        .then((res) => {
          setData(res);
        })
        .catch(() => {
          console.error('Failed to fetch weather data');
        })
        .finally(() => setLoading(false));
    }
  }, [coords]);

  if (!coords) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <MapPinIcon className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
        <p>Waiting for location access...</p>
        <p className="text-sm mt-2">Please enable location services to see weather data</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm space-y-4 border border-slate-200 dark:border-slate-700">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
          <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getAQIColor = (aqi: string) => {
    if (aqi.includes('Good')) return 'text-green-400';
    if (aqi.includes('Fair')) return 'text-yellow-400';
    if (aqi.includes('Moderate')) return 'text-orange-400';
    if (aqi.includes('Poor')) return 'text-red-400';
    return 'text-purple-400';
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl shadow-xl p-6 text-white relative overflow-hidden border border-slate-700 dark:border-slate-800">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-red-400 mb-1">
            <MapPinIcon className="h-5 w-5" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Current Location</h2>
          </div>
          <h1 className="text-3xl font-extrabold mb-6">{data?.locationName || 'Detecting...'}</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-center space-x-3 mb-2">
                <CloudIcon className="h-6 w-6 text-blue-300" />
                <span className="text-slate-200 font-medium">Weather</span>
              </div>
              <div className="text-2xl font-bold">{data?.temperature}</div>
              <div className="text-sm text-slate-300 capitalize">{data?.condition}</div>
              <div className="text-xs text-slate-400 mt-1">Wind: {data?.windSpeed}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-center space-x-3 mb-2">
                <ExclamationTriangleIcon className={`h-6 w-6 ${getAQIColor(data?.aqi || '')}`} />
                <span className="text-slate-200 font-medium">Air Quality</span>
              </div>
              <div className="text-2xl font-bold">{data?.aqi || '--'}</div>
              <div className="text-sm text-slate-300">AQI Index</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
              <div className="flex items-center space-x-3 mb-2">
                <BoltIcon className="h-6 w-6 text-purple-300" />
                <span className="text-slate-200 font-medium">Humidity</span>
              </div>
              <div className="text-2xl font-bold">{data?.humidity}</div>
              <div className="text-sm text-slate-300">Relative Humidity</div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-600 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/map" className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <MapPinIcon className="h-8 w-8 mx-auto text-blue-600 dark:text-blue-400 mb-2" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Find Hospital</span>
          </a>
          <a href="/map?type=police" className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <MapPinIcon className="h-8 w-8 mx-auto text-green-600 dark:text-green-400 mb-2" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">Police Station</span>
          </a>
          <a href="/prediction" className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-center hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
            <ExclamationTriangleIcon className="h-8 w-8 mx-auto text-orange-600 dark:text-orange-400 mb-2" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Check Risks</span>
          </a>
          <a href="/medical" className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
            <HeartIcon className="h-8 w-8 mx-auto text-red-600 dark:text-red-400 mb-2" />
            <span className="text-sm font-medium text-red-800 dark:text-red-200">Medical ID</span>
          </a>
        </div>
      </div>
    </div>
  );
};
