import React, { useEffect, useState } from 'react';
import { Clock, CloudRain, Car, Wind, ArrowRight, BrainCircuit } from 'lucide-react';
import { EnvironmentalConditions, TravelRecommendation, RouteOption } from '../types';
import { getSmartTravelRecommendation } from '../services/recommendationService';

interface Props {
    selectedRoute?: RouteOption | null;
}

const SmartTravelRecommendations: React.FC<Props> = ({ selectedRoute }) => {
  const [loading, setLoading] = useState(true);
  const [conditions, setConditions] = useState<EnvironmentalConditions>({
    aqi: 165,
    trafficCongestionIndex: 78,
    weatherSeverity: 2
  });
  const [recommendation, setRecommendation] = useState<TravelRecommendation | null>(null);

  // Simulate Live Data fetching and Model Prediction
  useEffect(() => {
    const runPrediction = () => {
      setLoading(true);
      // Simulate slight data fluctuation
      const currentConditions: EnvironmentalConditions = {
        aqi: 140 + Math.floor(Math.random() * 60),
        trafficCongestionIndex: 60 + Math.floor(Math.random() * 40),
        weatherSeverity: Math.floor(Math.random() * 3)
      };
      
      setConditions(currentConditions);
      
      // Simulate processing time
      setTimeout(() => {
        const result = getSmartTravelRecommendation(currentConditions, selectedRoute || undefined);
        setRecommendation(result);
        setLoading(false);
      }, 1000);
    };

    runPrediction();
  }, [selectedRoute]); // Re-run when route changes

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-pink-200 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
        <div className="h-20 bg-slate-200 rounded mb-4"></div>
        <div className="flex gap-2">
            <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            <div className="h-8 flex-1 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  return (
    <div className="bg-gradient-to-br from-white to-pink-50 p-6 rounded-xl border border-pink-200 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <BrainCircuit className="w-32 h-32 text-pink-600" />
      </div>

      <div className="relative z-10">
        <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4">
          <BrainCircuit className="w-5 h-5 mr-2 text-pink-600" />
          Smart Travel Recommendations
          <span className="ml-auto text-xs font-normal text-slate-500 px-2 py-1 bg-white rounded border border-slate-200">
            Model: KNN-v2.1
          </span>
        </h3>

        {/* Current Conditions Bar */}
        <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-white p-2 rounded text-center border border-pink-100">
                <div className="flex justify-center mb-1"><Wind className="w-4 h-4 text-red-500" /></div>
                <div className="text-xs text-slate-500">AQI</div>
                <div className="font-bold text-slate-800">{conditions.aqi}</div>
            </div>
            <div className="bg-white p-2 rounded text-center border border-pink-100">
                <div className="flex justify-center mb-1"><Car className="w-4 h-4 text-orange-500" /></div>
                <div className="text-xs text-slate-500">Traffic</div>
                <div className="font-bold text-slate-800">{conditions.trafficCongestionIndex}%</div>
            </div>
            <div className="bg-white p-2 rounded text-center border border-pink-100">
                <div className="flex justify-center mb-1"><CloudRain className="w-4 h-4 text-blue-500" /></div>
                <div className="text-xs text-slate-500">Weather</div>
                <div className="font-bold text-slate-800">{conditions.weatherSeverity}/10</div>
            </div>
        </div>

        {/* Main Recommendation */}
        <div className={`p-4 rounded-lg border mb-4 ${
            recommendation.shouldTravelNow 
            ? 'bg-green-50 border-green-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
            <div className="flex items-start">
                <Clock className={`w-6 h-6 mr-3 mt-1 ${
                    recommendation.shouldTravelNow ? 'text-green-600' : 'text-amber-600'
                }`} />
                <div>
                    <h4 className={`font-bold text-lg ${
                        recommendation.shouldTravelNow ? 'text-green-700' : 'text-amber-700'
                    }`}>
                        {recommendation.shouldTravelNow ? "Good time to leave" : `Delay travel by ${recommendation.suggestedDelayMinutes} min`}
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">{recommendation.reasoning}</p>
                </div>
            </div>
        </div>

        {/* Prediction Insight */}
        {!recommendation.shouldTravelNow && (
            <div className="flex items-center text-xs text-slate-600 bg-white p-3 rounded border border-slate-100">
                <ArrowRight className="w-4 h-4 mr-2 text-pink-500" />
                <span>{recommendation.predictedImprovement}</span>
            </div>
        )}

        {selectedRoute && (
            <div className="mt-3 text-xs text-slate-400 text-center italic">
                * Tailored for {selectedRoute.name}
            </div>
        )}

      </div>
    </div>
  );
};

export default SmartTravelRecommendations;