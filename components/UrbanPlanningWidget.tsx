import React, { useEffect, useState } from 'react';
import { ZoneData, PlanningSuggestion } from '../types';
import { generateUrbanInterventions } from '../services/planningService';
import { Briefcase, TrafficCone, Sprout, Megaphone, CheckCircle, BarChart } from 'lucide-react';

interface Props {
  zones: ZoneData[];
}

const UrbanPlanningWidget: React.FC<Props> = ({ zones }) => {
  const [suggestions, setSuggestions] = useState<PlanningSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = () => {
        setLoading(true);
        // Simulate async ML processing
        setTimeout(() => {
            const results = generateUrbanInterventions(zones);
            setSuggestions(results);
            setLoading(false);
        }, 800);
    };
    fetchSuggestions();
  }, [zones]);

  const getIcon = (type: PlanningSuggestion['type']) => {
      switch(type) {
          case 'traffic_regulation': return <TrafficCone className="w-5 h-5 text-orange-500" />;
          case 'green_infrastructure': return <Sprout className="w-5 h-5 text-green-500" />;
          case 'policy': return <Megaphone className="w-5 h-5 text-blue-500" />;
          default: return <Briefcase className="w-5 h-5 text-slate-400" />;
      }
  };

  if (loading) {
      return (
          <div className="bg-white p-6 rounded-xl border border-pink-200 h-full flex items-center justify-center">
              <div className="flex flex-col items-center text-slate-500 text-sm">
                  <BarChart className="w-6 h-6 mb-2 animate-pulse text-pink-400" />
                  Processing Urban Patterns (K-Means)...
              </div>
          </div>
      );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-pink-500" />
            Urban Planning AI
        </h3>
        <span className="text-[10px] bg-pink-50 text-pink-600 px-2 py-1 rounded border border-pink-200">
            For City Planners
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
          {suggestions.length === 0 ? (
              <div className="text-slate-400 text-sm text-center mt-10">No critical interventions required at this time.</div>
          ) : (
              suggestions.map(sugg => (
                  <div key={sugg.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 hover:border-pink-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                              <div className="p-2 bg-white rounded-lg mr-3 border border-slate-200 shadow-sm">
                                  {getIcon(sugg.type)}
                              </div>
                              <div>
                                  <h4 className="font-bold text-sm text-slate-800">{sugg.title}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                          sugg.impact === 'high' ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                                      }`}>
                                          {sugg.impact.toUpperCase()} IMPACT
                                      </span>
                                      <span className="text-[10px] text-slate-500 flex items-center">
                                          <CheckCircle className="w-3 h-3 mr-1" /> {sugg.confidence}% Confidence
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed pl-12">
                          {sugg.description}
                      </p>
                  </div>
              ))
          )}
      </div>
    </div>
  );
};

export default UrbanPlanningWidget;