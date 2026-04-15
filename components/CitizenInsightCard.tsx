import React, { useEffect, useState } from 'react';
import { Heart, Lightbulb, MapPin } from 'lucide-react';
import { AwarenessTip } from '../types';
import { getPersonalExposureStats, generateAwarenessTip } from '../services/exposureService';

interface CitizenInsightCardProps {
    currentLocation?: { lat: number; lng: number };
}

const CitizenInsightCard: React.FC<CitizenInsightCardProps> = ({ currentLocation }) => {
  const [tip, setTip] = useState<AwarenessTip | null>(null);

  useEffect(() => {
    const fetchTip = async () => {
        // Fetch stats first to generate personalized tip from real data
        const stats = await getPersonalExposureStats('daily', currentLocation);
        const generatedTip = generateAwarenessTip(stats);
        setTip(generatedTip);
    };
    fetchTip();
  }, [currentLocation]);

  if (!tip) return null;

  const getIcon = () => {
      switch(tip.category) {
          case 'health': return <Heart className="w-6 h-6 text-red-500" />;
          case 'action': return <MapPin className="w-6 h-6 text-blue-500" />;
          default: return <Lightbulb className="w-6 h-6 text-yellow-500" />;
      }
  };

  const getBgColor = () => {
      switch(tip.category) {
          case 'health': return 'bg-gradient-to-br from-red-50 to-white';
          default: return 'bg-gradient-to-br from-yellow-50 to-white';
      }
  };

  return (
    <div className={`p-6 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between ${getBgColor()}`}>
        <div>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                    <div className="bg-white p-2.5 rounded-full shadow-sm border border-slate-100">
                        {getIcon()}
                    </div>
                    <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {tip.basedOn === 'exposure' ? 'Based on your history' : 'Daily Insight'}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{tip.title}</h3>
                    </div>
                </div>
            </div>
            
            <p className="text-sm text-slate-600 leading-6">
                "{tip.message}"
            </p>
        </div>

        <div className="mt-4 pt-4 border-t border-pink-100 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">Source: GeoSense Knowledge Graph</span>
            <button className="text-xs text-pink-600 hover:text-pink-700 font-medium">
                Learn More
            </button>
        </div>
    </div>
  );
};

export default CitizenInsightCard;