
import React, { useEffect, useState } from 'react';
import { TrendingUp, AlertTriangle, Clock, Activity, MapPin, ArrowRight } from 'lucide-react';
import { PollutionPrediction, ZoneData } from '../types';
import { predictFutureHotspots, predictLocalHotspot } from '../services/predictionService';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

interface PollutionForecastProps {
  zones: ZoneData[];
  currentLocation?: { lat: number; lng: number };
}

const PollutionForecast: React.FC<PollutionForecastProps> = ({ zones, currentLocation }) => {
  const [predictions, setPredictions] = useState<PollutionPrediction[]>([]);
  const [localPrediction, setLocalPrediction] = useState<PollutionPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      
      // Use real zones from props to feed the prediction model
      // The service will extrapolate based on the real current AQI
      const data = await predictFutureHotspots(zones);
      setPredictions(data);

      // Fetch local prediction if location is available
      if (currentLocation) {
          const local = await predictLocalHotspot(currentLocation.lat, currentLocation.lng);
          setLocalPrediction(local);
      }

      setLoading(false);
    };
    
    if (zones.length > 0) {
        fetchPredictions();
    } else {
        setLoading(false); // No zones yet, stop loading
    }
  }, [zones, currentLocation]);

  if (loading) {
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-pink-200 dark:border-slate-700 h-full flex flex-col justify-center items-center text-slate-400">
            <Activity className="w-8 h-8 mb-2 animate-spin text-pink-500" />
            <span className="text-xs">Running predictive models (CNN/Regression)...</span>
        </div>
    );
  }

  const renderPredictionCard = (pred: PollutionPrediction, isLocal: boolean = false) => (
    <div key={pred.id} className={`${
        isLocal ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800' : 'bg-white dark:bg-slate-800 border-pink-100 dark:border-slate-700'
    } rounded-lg p-4 border relative overflow-hidden mb-3 shadow-sm`}>
        {/* Severity Indicator Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
            pred.severity === 'critical' ? 'bg-red-600' : 'bg-orange-500'
        }`}></div>
        
        <div className="flex justify-between items-start mb-2 pl-2">
            <div>
                <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                    {isLocal && <MapPin className="w-3 h-3 mr-1 text-pink-500" />}
                    {pred.zoneName}
                    {isLocal && <span className="ml-2 text-[10px] bg-pink-500 text-white px-1.5 rounded">YOU</span>}
                </h4>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    Hotspot expected: {pred.peakTime}
                </div>
            </div>
            <div className="text-right">
                <div className={`text-xl font-bold ${
                        pred.severity === 'critical' ? 'text-red-600' : 'text-orange-500'
                }`}>
                    {pred.predictedPeakAqi}
                </div>
                <div className="text-[10px] text-slate-400 uppercase">Future AQI</div>
            </div>
        </div>

        {/* Narrative Insight Display (New Feature) */}
        {pred.insightText && (
            <div className="pl-2 mb-3 mt-1">
                <p className="text-xs text-slate-600 dark:text-slate-300 italic border-l-2 border-pink-300 dark:border-pink-700 pl-2 py-1 leading-relaxed">
                    "{pred.insightText}"
                </p>
            </div>
        )}

        {/* Mini Trend Chart */}
        <div className="h-16 w-full mb-2 pl-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pred.trendData}>
                    <defs>
                        <linearGradient id={`grad-${pred.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isLocal ? "#ec4899" : "#f97316"} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={isLocal ? "#ec4899" : "#f97316"} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', fontSize: '10px' }}
                        itemStyle={{ color: '#1e293b' }}
                        cursor={false}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="aqi" 
                        stroke={isLocal ? "#ec4899" : "#f97316"}
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill={`url(#grad-${pred.id})`} 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>

        <div className="pl-2 flex items-start text-xs text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-700/50 p-2 rounded">
            <AlertTriangle className={`w-3 h-3 mr-2 mt-0.5 flex-shrink-0 ${
                pred.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
            }`} />
            {pred.recommendation}
        </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-pink-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-pink-500" />
            Future Hotspot Prediction
        </h3>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
            Model: CNN-REG-V2
        </span>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
        {localPrediction && (
            <div className="animate-in fade-in slide-in-from-left duration-500">
                <div className="text-xs font-bold text-pink-600 dark:text-pink-400 mb-2 uppercase tracking-wide">Based on Current Location</div>
                {renderPredictionCard(localPrediction, true)}
            </div>
        )}
        
        {predictions.length > 0 && (
             <div>
                <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">City-Wide Alerts</div>
                {predictions.map(pred => renderPredictionCard(pred))}
             </div>
        )}

        {!localPrediction && predictions.length === 0 && (
             <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                 <div className="text-green-500 text-xl mb-2">✓</div>
                 <span>No critical hotspots predicted for next 12h.</span>
             </div>
        )}
      </div>
    </div>
  );
};

export default PollutionForecast;
