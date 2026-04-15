
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wind, Activity, Zap, ShieldAlert, ArrowRight, Fuel, Speaker } from 'lucide-react';
import PollutionForecast from './PollutionForecast';
import ExposureScoreCard from './ExposureScoreCard';
import SmartCityAlerts from './SmartCityAlerts';
import TrafficForecastCard from './TrafficForecastCard';
import IncidentImpactAnalysis from './IncidentImpactAnalysis';
import { Incident, ZoneData, Anomaly, WeeklyStat } from '../types';

interface DashboardProps {
    currentLocation?: { lat: number; lng: number };
    incidents: Incident[];
    zones: ZoneData[];
    weeklyStats: WeeklyStat[];
    alerts?: Anomaly[];
    currentTrafficSpeed?: number;
    onNavigate: (view: string) => void;
}

// Reusable Glass Card Component
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-glass rounded-3xl p-6 transition-all hover:shadow-xl ${className}`}>
    {children}
  </div>
);

const KPI = ({ icon, label, value, sub, color }: any) => (
  <GlassCard className="flex flex-col justify-between h-full group">
    <div className="flex justify-between items-start mb-2">
      <div className={`p-3 rounded-2xl ${color} bg-opacity-10 text-opacity-100`}>
        {React.cloneElement(icon, { className: `w-6 h-6 ${color.replace('bg-', 'text-')}` })}
      </div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
    <div>
      <div className="text-3xl font-black text-slate-800 dark:text-white mb-1 group-hover:scale-105 transition-transform origin-left">{value}</div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{sub}</div>
    </div>
  </GlassCard>
);

const Dashboard: React.FC<DashboardProps> = ({ 
    currentLocation, incidents, zones, weeklyStats, alerts = [], currentTrafficSpeed = 45, onNavigate 
}) => {
    
    const avgAqi = useMemo(() => {
        if (!zones.length) return 0;
        return Math.round(zones.reduce((acc, z) => acc + z.aqi, 0) / zones.length);
    }, [zones]);

    return (
    <div className="space-y-6 h-full overflow-y-auto custom-scrollbar p-1 pb-20">
      
      {/* Modern Hero Banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-urban-blue mix-blend-multiply z-0"></div>
        <img 
            src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=2070&auto=format&fit=crop" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 z-[-1]" 
            alt="City"
        />
        
        <div className="relative z-10 text-white">
            <div className="flex items-center space-x-3 mb-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-80">System Online</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">UrbanPulse <span className="font-light">Overview</span></h1>
            <p className="text-slate-200 mb-8 max-w-lg text-lg leading-relaxed">
                Real-time analysis of {zones.length} sensors and {incidents.length} traffic nodes. 
                Environmental conditions are currently <span className="font-bold text-green-400">stable</span>.
            </p>
            <button 
                onClick={() => onNavigate('map')} 
                className="bg-urban-green hover:bg-green-500 text-white px-8 py-3.5 rounded-full font-bold shadow-glow hover:shadow-lg transition-all flex items-center group"
            >
                Launch Live Map <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
        </div>
      </div>

      {/* KPI Grid - 5 Columns for full metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPI 
            icon={<Wind />} 
            label="Air Quality" 
            value={avgAqi > 0 ? avgAqi : '--'} 
            sub="Avg PM2.5 Level" 
            color="bg-red-500" 
          />
          <KPI 
            icon={<Activity />} 
            label="Traffic Flow" 
            value={`${currentTrafficSpeed} km/h`} 
            sub="Live Speed Index" 
            color="bg-urban-blue" 
          />
          <KPI 
            icon={<ShieldAlert />} 
            label="Incidents" 
            value={incidents.length} 
            sub="Active Hazards" 
            color="bg-orange-500" 
          />
          <KPI 
            icon={<Fuel />} 
            label="Fuel Waste" 
            value="12%" 
            sub="Due to Idling" 
            color="bg-purple-500" 
          />
          <KPI 
            icon={<Speaker />} 
            label="Noise Level" 
            value="68 dB" 
            sub="Moderate Zone" 
            color="bg-pink-500" 
          />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Section */}
        <GlassCard className="lg:col-span-2 h-[450px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Weekly Environmental Trend</h3>
                    <p className="text-sm text-slate-500">Correlation between Traffic Volume and AQI</p>
                </div>
                <select className="bg-slate-100 dark:bg-slate-700 border-none text-sm rounded-lg px-3 py-2 font-medium">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                </select>
            </div>
            <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyStats}>
                        <defs>
                            <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1db954" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#1db954" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="aqi" stroke="#1db954" strokeWidth={4} fill="url(#colorAqi)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
        
        {/* Alerts Feed */}
        <div className="h-[450px]">
            <SmartCityAlerts alerts={alerts} />
        </div>
      </div>

      {/* Widget Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <div className="h-[380px]"><ExposureScoreCard currentLocation={currentLocation} /></div>
         <div className="h-[380px]"><TrafficForecastCard currentSpeed={currentTrafficSpeed} /></div>
         <div className="h-[380px]"><PollutionForecast zones={zones} currentLocation={currentLocation} /></div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
          <GlassCard>
              <IncidentImpactAnalysis incidents={incidents} />
          </GlassCard>
      </div>

    </div>
  );
};

export default Dashboard;
