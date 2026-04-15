import React from 'react';
import { Leaf, Trees, Wind } from 'lucide-react';

const CarbonSavingsCard: React.FC = () => {
  // Mock aggregated data
  const stats = {
    totalKm: 1250,
    savedCo2Kg: 42.5,
    treesEquivalent: 2,
    publicTransportTrips: 15
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col relative overflow-hidden">
      {/* Decorative background leaf */}
      <Leaf className="absolute -right-6 -top-6 w-32 h-32 text-emerald-500/10 rotate-12" />

      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Leaf className="w-5 h-5 mr-2 text-emerald-500" />
            Your Eco Impact
        </h3>
        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
            Top 10%
        </span>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
              <Wind className="w-8 h-8 text-slate-400 mb-2" />
              <div className="text-2xl font-bold text-slate-800">{stats.savedCo2Kg}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider text-center">kg CO₂ Saved</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center items-center">
              <Trees className="w-8 h-8 text-emerald-500 mb-2" />
              <div className="text-2xl font-bold text-slate-800">{stats.treesEquivalent}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider text-center">Trees Planted</div>
          </div>
      </div>

      <div className="mt-4 text-xs text-slate-500 text-center relative z-10">
          Using public transport {stats.publicTransportTrips} times this month reduced your footprint by 15%.
      </div>
    </div>
  );
};

export default CarbonSavingsCard;