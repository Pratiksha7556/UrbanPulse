
import React, { useEffect, useState } from 'react';
import { Activity, Calendar, BarChart2, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getPersonalExposureStats } from '../services/exposureService';
import { ExposureStats } from '../types';

interface ExposureScoreCardProps {
    currentLocation?: { lat: number; lng: number };
}

const ExposureScoreCard: React.FC<ExposureScoreCardProps> = ({ currentLocation }) => {
  const [stats, setStats] = useState<ExposureStats | null>(null);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Pass the real location to the service
      const data = await getPersonalExposureStats(timeRange, currentLocation);
      setStats(data);
      setLoading(false);
    };
    fetchData();
  }, [timeRange, currentLocation]);

  if (loading) {
    return (
        <div className="bg-white p-6 rounded-xl border border-pink-200 h-64 flex items-center justify-center animate-pulse">
            <div className="text-slate-500">Calculating Personal Exposure...</div>
        </div>
    );
  }

  if (!stats) return null;

  // Determine display score based on range
  const currentScore = timeRange === 'daily' ? stats.daily.score : 
                       timeRange === 'weekly' ? stats.weeklyAverage : stats.monthlyAverage;

  const getScoreColor = (s: number) => {
      if (s > 80) return 'text-green-600';
      if (s > 50) return 'text-yellow-600';
      return 'text-red-600';
  };

  const getScoreLabel = (s: number) => {
      if (s > 80) return 'Excellent';
      if (s > 50) return 'Moderate';
      return 'High Exposure';
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-pink-200 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-pink-500" />
            Personal Exposure Score
        </h3>
        <div className="flex bg-pink-50 rounded-lg p-1 text-xs border border-pink-100 flex-shrink-0">
            {(['daily', 'weekly', 'monthly'] as const).map(range => (
                <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded capitalize transition-colors ${
                        timeRange === range ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {range === 'daily' ? 'Today' : range.replace('ly', '')}
                </button>
            ))}
        </div>
      </div>

      <div className="flex items-start mb-6">
          <div className="mr-6 flex-shrink-0">
              <div className={`text-4xl font-bold ${getScoreColor(currentScore)}`}>
                  {Math.round(currentScore)}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">{getScoreLabel(currentScore)} Health Score</div>
          </div>
          <div className="flex-1 pb-1 border-l border-slate-100 pl-4 mt-1">
             <div className="text-xs text-slate-500 flex items-start leading-tight">
                <Info className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0 text-pink-400" />
                <span>{stats.insight}</span>
             </div>
          </div>
      </div>

      <div className="flex-1 min-h-[100px] w-full bg-slate-50 rounded-lg p-2 border border-slate-100">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.trend}>
                <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    itemStyle={{ color: '#1e293b' }}
                    labelStyle={{ display: 'none' }}
                    formatter={(value: number) => [`${Math.round(value)}`, 'Health Score']}
                />
                <Area 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ec4899" 
                    strokeWidth={2}
                    fill="url(#colorScore)" 
                />
            </AreaChart>
        </ResponsiveContainer>
        <div className="text-center text-[10px] text-slate-400 mt-1">
            Real-time trend based on OpenAQ sensors near you
        </div>
      </div>
    </div>
  );
};

export default ExposureScoreCard;
