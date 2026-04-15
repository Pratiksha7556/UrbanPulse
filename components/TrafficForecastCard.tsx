
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrafficForecast, predictTraffic } from '../services/trafficPredictionService';
import { Car, Clock, TrendingUp } from 'lucide-react';

interface Props {
    currentSpeed?: number;
}

const TrafficForecastCard: React.FC<Props> = ({ currentSpeed = 45 }) => {
  const [forecasts, setForecasts] = useState<TrafficForecast[]>([]);
  
  useEffect(() => {
    // Generate forecast based on current real speed
    const currentHour = new Date().getHours();
    
    // Get base predictions
    const predictions = predictTraffic(currentHour);

    // ANCHOR TO REALITY: Override the first hour prediction with live data
    if (predictions.length > 0) {
        // Calculate congestion from speed (Assumes 60km/h is free flow)
        // Speed 60 -> 0% congestion, Speed 0 -> 100% congestion
        const currentCongestion = Math.max(0, Math.min(100, (60 - currentSpeed) * (100/60)));
        
        predictions[0].congestionLevel = Math.round(currentCongestion);
        
        let label: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';
        if (currentCongestion > 75) label = 'Severe';
        else if (currentCongestion > 50) label = 'High';
        else if (currentCongestion > 25) label = 'Moderate';
        
        predictions[0].label = label;
    }

    setForecasts(predictions);
  }, [currentSpeed]);

  const getBarColor = (level: number) => {
    if (level > 75) return '#ef4444'; // red
    if (level > 50) return '#f97316'; // orange
    if (level > 25) return '#eab308'; // yellow
    return '#22c55e'; // green
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Car className="w-5 h-5 mr-2 text-pink-500" />
            Traffic Forecast
        </h3>
        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> ML Predicted
        </span>
      </div>

      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={forecasts}>
            <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
            />
            <Tooltip 
                cursor={{ fill: '#f1f5f9' }}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: '#1e293b' }}
                formatter={(value: number) => [`${value}% Congestion`, 'Forecast']}
            />
            <Bar dataKey="congestionLevel" radius={[4, 4, 0, 0]}>
              {forecasts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.congestionLevel)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
         <div className="flex items-center text-slate-500">
            <Clock className="w-3 h-3 mr-2" /> Next 6 Hours
         </div>
         <div className="font-bold text-slate-700">
            {forecasts[0]?.label} Intensity Expected
         </div>
      </div>
    </div>
  );
};

export default TrafficForecastCard;
