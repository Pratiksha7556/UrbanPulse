
import React from 'react';
import { Siren, AlertTriangle, TrendingDown, TrendingUp, Radio } from 'lucide-react';
import { Anomaly } from '../types';

interface Props {
    alerts?: Anomaly[];
}

const SmartCityAlerts: React.FC<Props> = ({ alerts = [] }) => {
    
    // Fallback loading state if undefined is passed (during init)
    if (!alerts) {
        return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-pink-200 dark:border-slate-700 h-full flex items-center justify-center overflow-hidden">
                <div className="text-slate-500 text-xs flex items-center animate-pulse">
                    <Radio className="w-4 h-4 mr-2 text-pink-500" /> Monitoring City Sensors...
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-pink-50 to-white dark:from-slate-800 dark:to-slate-900 p-5 rounded-xl border border-pink-100 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow h-full flex flex-col overflow-hidden relative">
            {/* Background Pulse Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/50 dark:bg-pink-900/20 rounded-full blur-3xl -z-0 pointer-events-none"></div>

            <div className="flex justify-between items-center mb-3 relative z-10">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center">
                    <Siren className="w-4 h-4 mr-2 text-pink-500 animate-pulse" />
                    Smart City Alerts
                </h3>
                <span className="text-[10px] text-pink-700 dark:text-pink-300 bg-pink-100 dark:bg-pink-900/30 px-2 py-0.5 rounded border border-pink-200 dark:border-pink-800">
                    Live Feed
                </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1 relative z-10">
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="text-green-500 text-xl mb-2">✓</div>
                        <span className="text-xs">No active anomalies detected.</span>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded-lg border transition-all ${
                            alert.severity === 'high' 
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 hover:bg-red-100/50 dark:hover:bg-red-900/30' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700'
                        }`}>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-xs font-bold ${
                                    alert.severity === 'high' ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'
                                }`}>
                                    {alert.title}
                                </h4>
                                {alert.severity === 'high' && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 ml-2" />}
                                {alert.severity === 'medium' && <TrendingUp className="w-3 h-3 text-orange-500 flex-shrink-0 ml-2" />}
                                {alert.severity === 'low' && <TrendingDown className="w-3 h-3 text-green-500 flex-shrink-0 ml-2" />}
                            </div>
                            
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                                {alert.description}
                            </p>
                            
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-2">
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                                    Impact: {alert.metric}
                                </span>
                                <span className="text-[9px] text-slate-500 dark:text-slate-400">
                                    {alert.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SmartCityAlerts;
