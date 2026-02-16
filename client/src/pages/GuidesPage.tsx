import { useState } from 'react';
import { api } from '../services/api';
import { DisasterType } from '../types';
import { BookOpenIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const disasterTypes: { type: DisasterType; label: string; icon: string }[] = [
  { type: 'earthquake', label: 'Earthquake', icon: '🌍' },
  { type: 'flood', label: 'Flood', icon: '🌊' },
  { type: 'fire', label: 'Fire', icon: '🔥' },
  { type: 'hurricane', label: 'Hurricane', icon: '🌀' },
  { type: 'tornado', label: 'Tornado', icon: '🌪️' },
  { type: 'tsunami', label: 'Tsunami', icon: '🌊' },
];

export const GuidesPage = () => {
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterType>('earthquake');
  const [guide, setGuide] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchGuide = () => {
    setLoading(true);
    api.prediction.getGuide(selectedDisaster)
      .then((data) => setGuide(data.guide || ''))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6 flex items-center">
        <BookOpenIcon className="h-8 w-8 text-red-500 mr-2" />
        Disaster Emergency Guides
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {disasterTypes.map((disaster) => (
          <button
            key={disaster.type}
            onClick={() => { setSelectedDisaster(disaster.type); setGuide(''); }}
            className={`p-4 rounded-xl text-left transition-all ${
              selectedDisaster === disaster.type
                ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-300'
            }`}
          >
            <span className="text-2xl mb-1 block">{disaster.icon}</span>
            <span className="font-medium text-slate-800 dark:text-white">{disaster.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-850 p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">
            {disasterTypes.find(d => d.type === selectedDisaster)?.label} Guide
          </h3>
          <button
            onClick={fetchGuide}
            disabled={loading}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div className="h-20 bg-slate-100 dark:bg-slate-700 rounded"></div>
            </div>
          ) : guide ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                {guide}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">Select a disaster type to view the guide</p>
              <button
                onClick={fetchGuide}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Load Guide
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
