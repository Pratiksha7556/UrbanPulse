import React, { useEffect, useState } from 'react';
import { Gauge, Zap, Timer, AlertCircle, TrendingUp, Droplet } from 'lucide-react';
import { DrivingStats } from '../types';
import { getDrivingBehaviorStats } from '../services/drivingService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DrivingInsightsCard: React.FC = () => {
  const [stats, setStats] = useState<DrivingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await getDrivingBehaviorStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-pink-200 h-full flex items-center justify-center animate-pulse overflow-hidden">
        <div className="text-slate-500 flex flex-col items-center">
            <Gauge className="w-8 h-8 mb-2" />
            Analyzing Telemetry...
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const scoreColor = stats.dailyScore > 80 ? '#22c55e' : stats.dailyScore > 50 ? '#eab308' : '#ef4444';
  
  // Data for Gauge
  const gaugeData = [
    { name: 'Score', value: stats.dailyScore },
    { name: 'Remaining', value: 100 - stats.dailyScore }
  ];

  return (
    <div className="bg-white p-6 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Gauge className="w-5 h-5 mr-2 text-pink-500" />
            Driving Behavior
        </h3>
        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 border border-slate-200">Today</span>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-4 flex-1 min-h-0">
          {/* Score Gauge */}
          <div className="relative w-28 h-28 flex-shrink-0">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={50}
                        startAngle={180}
                        endAngle={0}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                    >
                        <Cell key="cell-0" fill={scoreColor} />
                        <Cell key="cell-1" fill="#f1f5f9" />
                    </Pie>
                </PieChart>
             </ResponsiveContainer>
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center mt-2">
                 <div className="text-2xl font-bold text-slate-800">{stats.dailyScore}</div>
                 <div className="text-[8px] text-slate-500">Eco Score</div>
             </div>
          </div>

          {/* Feedback Section */}
          <div className="flex-1 overflow-y-auto max-h-full custom-scrollbar pr-1">
             <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                 <p className="text-xs font-medium text-slate-700 flex items-start">
                     <AlertCircle className="w-3 h-3 mr-2 text-pink-500 mt-0.5 flex-shrink-0" />
                     {stats.feedback}
                 </p>
             </div>
             <div className="text-[10px] text-slate-500 flex items-center">
                 <TrendingUp className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                 {stats.improvementTip}
             </div>
          </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 mt-auto flex-shrink-0">
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
              <div className="flex justify-center mb-1"><Timer className="w-3 h-3 text-orange-500" /></div>
              <div className="text-sm font-bold text-slate-800">{stats.idlingTimeMinutes}m</div>
              <div className="text-[9px] text-slate-400 uppercase">Idling</div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
              <div className="flex justify-center mb-1"><Zap className="w-3 h-3 text-yellow-500" /></div>
              <div className="text-sm font-bold text-slate-800">{stats.events.rapidAcceleration}</div>
              <div className="text-[9px] text-slate-400 uppercase">Rap. Accel</div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-center">
              <div className="flex justify-center mb-1"><Droplet className="w-3 h-3 text-red-500" /></div>
              <div className="text-sm font-bold text-slate-800">{stats.fuelWastedMl}ml</div>
              <div className="text-[9px] text-slate-400 uppercase">Wasted</div>
          </div>
      </div>

    </div>
  );
};

export default DrivingInsightsCard;