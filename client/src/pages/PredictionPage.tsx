import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../services/api';
import { Coordinates } from '../types';
import { Card, RiskBadge, Button } from '../components/ui';
import { cn } from '../lib/utils';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  CalendarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface Props {
  coords: Coordinates | null;
}

interface ParsedPrediction {
  riskLevel?: 'low' | 'medium' | 'high';
  location?: string;
  date?: string;
  threats?: { icon: string; name: string; description: string }[];
  recommendations?: string[];
}

export const PredictionPage = ({ coords }: Props) => {
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = () => {
    if (!coords) return;
    setLoading(true);
    setError(null);
    api.prediction.get(coords.lat, coords.lng)
      .then((data) => {
        setPrediction(data.prediction || '');
      })
      .catch((err) => {
        setError('Failed to generate prediction');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (coords) fetchPrediction();
  }, [coords]);

  const parsedPrediction = useMemo((): ParsedPrediction => {
    const result: ParsedPrediction = {};
    
    const riskMatch = prediction.match(/risk[:\s]+(low|medium|high)/i);
    if (riskMatch) {
      result.riskLevel = riskMatch[1].toLowerCase() as 'low' | 'medium' | 'high';
    }

    const threats: ParsedPrediction['threats'] = [];
    const threatPatterns = [
      { pattern: /landslide|land slide/i, icon: '🏔️', name: 'Landslide' },
      { pattern: /flood/i, icon: '🌊', name: 'Flood' },
      { pattern: /heatwave|heat wave|extreme heat/i, icon: '🔥', name: 'Heatwave' },
      { pattern: /earthquake|tremor/i, icon: '🌍', name: 'Earthquake' },
      { pattern: /storm|cyclone/i, icon: '🌀', name: 'Storm' },
      { pattern: /drought/i, icon: '🏜️', name: 'Drought' },
    ];
    
    threatPatterns.forEach(({ pattern, icon, name }) => {
      if (pattern.test(prediction)) {
        const descMatch = prediction.match(new RegExp(`[^.]*${name}[^.]*\\.?`, 'i'));
        threats.push({
          icon,
          name,
          description: descMatch ? descMatch[0].trim() : `Potential ${name} risk in the area.`,
        });
      }
    });
    if (threats.length > 0) result.threats = threats.slice(0, 3);

    if (prediction.includes('recommend') || prediction.includes('should') || prediction.includes('prepare')) {
      const recSection = prediction.split(/recommendations?|prepare|suggestions?:?/i)[1];
      if (recSection) {
        result.recommendations = recSection
          .split(/\n+/)
          .filter(line => line.trim().match(/^[\d\-\*]|^[a-z]/))
          .slice(0, 5)
          .map(line => line.replace(/^[\d\-\*\.]\s*/, '').trim());
      }
    }

    return result;
  }, [prediction]);

  if (!coords) {
    return (
      <Card className="p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-text-secondary-light dark:text-text-secondary-dark mb-2" />
        <p className="text-text-secondary-light dark:text-text-secondary-dark">{t('common.loading')}</p>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto pb-24 md:pb-6"
    >
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-white dark:from-surface-dark dark:to-surface-dark p-6 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <SparklesIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
                  {t('prediction.title')}
                </h2>
                <div className="flex items-center space-x-4 mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  <span className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1" />
                    {t('prediction.location')}
                  </span>
                  <span className="flex items-center">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchPrediction}
              disabled={loading}
              className="p-2"
            >
              <ArrowPathIcon className={cn('h-5 w-5', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 mx-auto mb-4"
                  >
                    <SparklesIcon className="w-12 h-12 text-primary" />
                  </motion.div>
                  <p className="text-text-secondary-light dark:text-text-secondary-dark">
                    {t('prediction.analyzing')}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="h-4 bg-border-light dark:bg-border-dark rounded animate-pulse"
                    style={{ width: `${100 - i * 15}%` }}
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-danger mb-2" />
              <p className="text-danger mb-4">{error}</p>
              <Button onClick={fetchPrediction}>{t('common.retry')}</Button>
            </div>
          ) : (
            <div className="space-y-6">
              {parsedPrediction.riskLevel && (
                <div className="flex items-center justify-center">
                  <RiskBadge level={parsedPrediction.riskLevel} />
                </div>
              )}

              {parsedPrediction.threats && parsedPrediction.threats.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-3">
                    {t('prediction.threats')}
                  </h3>
                  <div className="grid gap-3">
                    {parsedPrediction.threats.map((threat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start space-x-3 p-3 bg-surface-light dark:bg-surface-dark rounded-xl border-l-4 border-danger"
                      >
                        <span className="text-2xl">{threat.icon}</span>
                        <div>
                          <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                            {threat.name}
                          </h4>
                          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                            {threat.description}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {parsedPrediction.recommendations && parsedPrediction.recommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark mb-3">
                    {t('prediction.recommendations')}
                  </h3>
                  <div className="space-y-2">
                    {parsedPrediction.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="flex items-start space-x-3 p-3 bg-success/5 dark:bg-success/10 rounded-xl"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                          {rec}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {prediction && !parsedPrediction.riskLevel && !parsedPrediction.threats && (
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {prediction}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-warning/10 dark:bg-warning/5 p-4 border-t border-warning/20">
          <p className="text-xs text-warning text-center italic font-medium">
            {t('prediction.disclaimer')}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};
