import React from 'react';
import { Train, Bus, Car, Leaf } from 'lucide-react';

interface Props {
  distanceKm: number;
}

const PublicTransportComparison: React.FC<Props> = ({ distanceKm }) => {
  // Average CO2 emissions per passenger km (approximate global averages)
  const CAR_CO2_PER_KM = 0.192; // kg
  const BUS_CO2_PER_KM = 0.089; // kg
  const METRO_CO2_PER_KM = 0.028; // kg

  const carEmission = distanceKm * CAR_CO2_PER_KM;
  const busEmission = distanceKm * BUS_CO2_PER_KM;
  const metroEmission = distanceKm * METRO_CO2_PER_KM;

  const savingPct = Math.round(((carEmission - metroEmission) / carEmission) * 100);

  return (
    <div className="bg-white/50 p-4 rounded-xl border border-pink-200 mt-4 animate-in fade-in slide-in-from-bottom duration-500">
      <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
        <Leaf className="w-4 h-4 mr-2 text-green-500" />
        Public Transport Integration
      </h3>
      
      <div className="space-y-4">
        {/* Car */}
        <div>
           <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span className="flex items-center"><Car className="w-3 h-3 mr-1" /> Private Car (Current)</span>
              <span>{carEmission.toFixed(2)} kg CO₂</span>
           </div>
           <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-red-400 h-2 rounded-full" style={{ width: '100%' }}></div>
           </div>
        </div>

        {/* Bus */}
        <div>
           <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span className="flex items-center"><Bus className="w-3 h-3 mr-1" /> City Bus</span>
              <span>{busEmission.toFixed(2)} kg CO₂</span>
           </div>
           <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-orange-400 h-2 rounded-full" style={{ width: `${(busEmission/carEmission)*100}%` }}></div>
           </div>
        </div>

        {/* Metro */}
        <div>
           <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span className="flex items-center"><Train className="w-3 h-3 mr-1" /> Metro Rail</span>
              <span>{metroEmission.toFixed(2)} kg CO₂</span>
           </div>
           <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(metroEmission/carEmission)*100}%` }}></div>
           </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 flex items-start">
         <Train className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
         <span>
            <strong>Sustainable Choice:</strong> Taking the Metro for this route reduces your carbon footprint by <strong>{savingPct}%</strong> compared to driving.
         </span>
      </div>
    </div>
  );
};

export default PublicTransportComparison;