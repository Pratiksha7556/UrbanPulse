
import React from 'react';
import { Download, FileText, Share2, TrendingUp, TrendingDown, Leaf } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { WeeklyStat, ZoneData } from '../types';

interface ReportsViewProps {
  weeklyStats: WeeklyStat[];
  zones: ZoneData[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ weeklyStats, zones }) => {
  
  // Calculate summary stats
  const avgWeeklyAqi = Math.round(weeklyStats.reduce((a, b) => a + b.aqi, 0) / (weeklyStats.length || 1));
  const peakAqi = Math.max(...weeklyStats.map(s => s.aqi), 0);
  const criticalZones = zones.filter(z => z.aqi > 150).length;

  return (
    <div className="space-y-6 h-full overflow-y-auto custom-scrollbar p-1 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Comprehensive environmental impact assessment</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </button>
          <button className="flex items-center px-4 py-2 bg-urban-blue hover:bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-glass">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl text-red-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">This Week Peak</span>
          </div>
          <div className="text-4xl font-black text-slate-800 dark:text-white mb-1">{peakAqi}</div>
          <div className="text-sm text-slate-500">Highest AQI Recorded</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-glass">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl text-urban-green">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Avg Quality</span>
          </div>
          <div className="text-4xl font-black text-slate-800 dark:text-white mb-1">{avgWeeklyAqi}</div>
          <div className="text-sm text-slate-500">Weekly Average AQI</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-glass">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-urban-blue">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase">Hotspots</span>
          </div>
          <div className="text-4xl font-black text-slate-800 dark:text-white mb-1">{criticalZones}</div>
          <div className="text-sm text-slate-500">Critical Zones Active</div>
        </div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correlation Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-glass">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Pollution vs. Traffic Correlation</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyStats}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077cc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0077cc" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAqi2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1db954" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1db954" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="traffic" name="Traffic Density" stroke="#0077cc" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" />
                <Area type="monotone" dataKey="aqi" name="Air Quality (AQI)" stroke="#1db954" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Analysis */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-glass">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Environmental Impact by Source</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="traffic" name="Fuel Waste" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="aqi" name="CO2 Emissions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
